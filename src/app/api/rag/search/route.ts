/**
 * POST /api/rag/search — Search the knowledge base
 */
import { type NextRequest, NextResponse } from "next/server";
import { searchKnowledge } from "@/lib/rag/search";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1).max(1000),
  mode: z.enum(["semantic", "text", "hybrid"]).default("hybrid"),
  limit: z.number().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  language: z.enum(["fr", "en"]).default("fr"),
  knowledgeBaseId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = searchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const results = await searchKnowledge({
      ...parsed.data,
      userId,
      includePrivate: true,
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("[POST /api/rag/search]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
