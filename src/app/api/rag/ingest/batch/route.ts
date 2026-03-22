/**
 * POST /api/rag/ingest/batch — Ingest multiple documents
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestText } from "@/lib/rag/ingestion";
import { z } from "zod";

const batchSchema = z.object({
  knowledgeBaseId: z.string().min(1),
  documents: z.array(
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  ).min(1).max(50),
  language: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { knowledgeBaseId, documents, language } = parsed.data;

    // Verify KB access
    const kb = await prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, OR: [{ ownerId: userId }, { isPublic: true }] },
    });
    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
    }

    const results = [];
    for (const doc of documents) {
      const result = await ingestText(doc.content, {
        knowledgeBaseId,
        title: doc.title,
        category: doc.category,
        subcategory: doc.subcategory,
        tags: doc.tags,
        language,
      });
      results.push(result);
    }

    const succeeded = results.filter((r) => r.status === "READY").length;
    const failed = results.filter((r) => r.status === "ERROR").length;

    return NextResponse.json({
      data: { total: results.length, succeeded, failed, results },
    }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rag/ingest/batch]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
