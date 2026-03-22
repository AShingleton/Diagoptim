/**
 * GET /api/cron/process-jobs
 *
 * Called every minute by Vercel Cron.
 * Picks up pending DocumentJob/ReportJob entries and processes them.
 *
 * Secured by CRON_SECRET in the Authorization header.
 * Processes up to 3 jobs per execution to stay within Vercel timeouts.
 */
import { NextResponse } from "next/server";
import { processNextJobs } from "@/lib/jobs/processor";

export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processNextJobs(3);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
