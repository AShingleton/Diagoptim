/**
 * GET /api/jobs/[id]/status?type=document|report
 *
 * Returns the current status of a job for frontend polling.
 * When COMPLETED, also returns the result data or download URL.
 */
import { NextRequest, NextResponse } from "next/server";
import { getJobStatus } from "@/lib/jobs/processor";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const type =
      (request.nextUrl.searchParams.get("type") as
        | "document"
        | "report"
        | null) ?? "document";

    if (type !== "document" && type !== "report") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'document' or 'report'" },
        { status: 400 },
      );
    }

    const job = await getJobStatus(id, type);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: job });
  } catch (error) {
    console.error("[GET /api/jobs/[id]/status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
