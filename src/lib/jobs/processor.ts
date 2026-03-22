/**
 * SIMPLIFIED JOB PROCESSOR
 *
 * Replaces BullMQ/Redis with a Supabase-backed job queue.
 *
 * How it works:
 * 1. A job is created in DocumentJob/ReportJob with status=PENDING
 * 2. A Vercel cron (every minute) calls /api/cron/process-jobs
 * 3. The cron picks up PENDING jobs, sets them to PROCESSING, and runs them
 * 4. On success → COMPLETED + result stored
 * 5. On failure → increment attempts, FAILED if max reached, else back to PENDING
 *
 * For urgent cases (user is waiting):
 * - Small documents (< 500KB) are processed immediately (synchronous)
 * - Large documents go through the cron
 *
 * @module jobs/processor
 */

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

/**
 * Process the next batch of pending jobs.
 * Called by the cron endpoint every minute.
 */
export async function processNextJobs(
  limit: number = 3,
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  // --- Process document jobs ---
  const documentJobs = await prisma.documentJob.findMany({
    where: { status: "PENDING" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
    include: { document: true },
  });

  for (const job of documentJobs) {
    result.processed++;
    try {
      await prisma.documentJob.update({
        where: { id: job.id },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      const jobResult = await processDocumentJob(job.documentId, job.type);

      await prisma.documentJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          result: jobResult as unknown as Record<string, string>,
          completedAt: new Date(),
        },
      });

      result.succeeded++;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      const newAttempts = job.attempts + 1;

      await prisma.documentJob.update({
        where: { id: job.id },
        data: {
          attempts: newAttempts,
          error: message,
          status: newAttempts >= job.maxAttempts ? "FAILED" : "PENDING",
        },
      });

      result.failed++;
      result.errors.push(`DocumentJob ${job.id}: ${message}`);
    }
  }

  // --- Process report jobs ---
  const remainingSlots = Math.max(0, limit - documentJobs.length);
  if (remainingSlots > 0) {
    const reportJobs = await prisma.reportJob.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: remainingSlots,
      include: { diagnostic: true },
    });

    for (const job of reportJobs) {
      result.processed++;
      try {
        await prisma.reportJob.update({
          where: { id: job.id },
          data: { status: "PROCESSING" },
        });

        const resultUrl = await processReportJob(
          job.diagnosticId,
          job.format,
        );

        await prisma.reportJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            resultUrl,
            completedAt: new Date(),
          },
        });

        result.succeeded++;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        const newAttempts = job.attempts + 1;

        await prisma.reportJob.update({
          where: { id: job.id },
          data: {
            attempts: newAttempts,
            error: message,
            status: newAttempts >= job.maxAttempts ? "FAILED" : "PENDING",
          },
        });

        result.failed++;
        result.errors.push(`ReportJob ${job.id}: ${message}`);
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Job creators
// ---------------------------------------------------------------------------

/**
 * Create a document analysis job.
 * If the document is small (< 500KB), process it immediately.
 */
export async function createDocumentJob(
  documentId: string,
  priority: number = 0,
) {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
  });

  const job = await prisma.documentJob.create({
    data: {
      documentId,
      type: "DOCUMENT_ANALYSIS",
      priority,
      status: "PENDING",
    },
  });

  // Small files (< 500KB): process immediately
  if (document.size < 500 * 1024) {
    try {
      await prisma.documentJob.update({
        where: { id: job.id },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      const result = await processDocumentJob(documentId, "DOCUMENT_ANALYSIS");

      await prisma.documentJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          result: result as unknown as Record<string, string>,
          completedAt: new Date(),
        },
      });

      return { ...job, status: "COMPLETED" as const, result };
    } catch {
      await prisma.documentJob.update({
        where: { id: job.id },
        data: { status: "PENDING", attempts: 1 },
      });
    }
  }

  return job;
}

/**
 * Create a report generation job.
 */
export async function createReportJob(
  diagnosticId: string,
  format: string = "pdf",
) {
  return prisma.reportJob.create({
    data: {
      diagnosticId,
      format,
      status: "PENDING",
    },
  });
}

// ---------------------------------------------------------------------------
// Job status
// ---------------------------------------------------------------------------

/**
 * Get job status by id and type (for frontend polling).
 */
export async function getJobStatus(
  jobId: string,
  type: "document" | "report",
) {
  if (type === "document") {
    const job = await prisma.documentJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        result: true,
        error: true,
        attempts: true,
        createdAt: true,
        completedAt: true,
      },
    });
    return job;
  }

  const job = await prisma.reportJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      resultUrl: true,
      error: true,
      attempts: true,
      createdAt: true,
      completedAt: true,
    },
  });
  return job;
}

// ---------------------------------------------------------------------------
// Processing logic (placeholders — wire to real analysis/generation later)
// ---------------------------------------------------------------------------

async function processDocumentJob(
  documentId: string,
  _type: string,
): Promise<{ documentId: string; status: string }> {
  const document = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    include: { company: true },
  });

  // TODO: Wire to actual document analysis pipeline
  // 1. Download from Supabase Storage
  // 2. Parse PDF/image (pdf-parse, tesseract.js)
  // 3. Extract structured data with AI
  // 4. Store extracted data on the document record

  await prisma.document.update({
    where: { id: documentId },
    data: {
      extractedData: {
        status: "analyzed",
        analyzedAt: new Date().toISOString(),
        documentType: document.type,
      },
    },
  });

  return { documentId, status: "analyzed" };
}

async function processReportJob(
  diagnosticId: string,
  _format: string,
): Promise<string> {
  // TODO: Wire to actual report generation pipeline
  // 1. Fetch diagnostic with all relations
  // 2. Generate PDF/DOCX with puppeteer/docx
  // 3. Upload to Supabase Storage
  // 4. Return the download URL

  const _diagnostic = await prisma.diagnostic.findUniqueOrThrow({
    where: { id: diagnosticId },
    include: {
      company: true,
      insights: true,
      roadmap: { include: { actions: true } },
    },
  });

  // Placeholder URL — replace with actual Supabase Storage URL
  return `/api/reports/${diagnosticId}/download/pdf`;
}
