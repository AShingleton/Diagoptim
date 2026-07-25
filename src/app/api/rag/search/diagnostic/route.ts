/**
 * POST /api/rag/search/diagnostic — Contextual search for the diagnostic engine
 */
import { type NextRequest, NextResponse } from "next/server";
import { getRelevantContext } from "@/lib/rag/search";
import { z } from "zod";

const diagnosticSearchSchema = z.object({
  question: z.string().min(1),
  category: z.string().min(1),
  sector: z.string().optional(),
  language: z.enum(["fr", "en"]).default("fr"),
  limit: z.number().min(1).max(20).default(5),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = diagnosticSearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const context = await getRelevantContext(
      parsed.data.question,
      parsed.data.category,
      {
        sector: parsed.data.sector,
        language: parsed.data.language,
        limit: parsed.data.limit,
      },
    );

    return NextResponse.json({ data: { context, hasResults: context.length > 0 } });
  } catch (error) {
    console.error("[POST /api/rag/search/diagnostic]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
