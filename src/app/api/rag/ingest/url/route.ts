/**
 * POST /api/rag/ingest/url — Ingest content from a URL
 */
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestFromUrl } from "@/lib/rag/ingestion";
import { z } from "zod";

const urlSchema = z.object({
  url: z.string().url(),
  knowledgeBaseId: z.string().min(1),
  title: z.string().min(1),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = urlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify KB access
    const kb = await prisma.knowledgeBase.findFirst({
      where: {
        id: parsed.data.knowledgeBaseId,
        OR: [{ ownerId: userId }, { isPublic: true }],
      },
    });
    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
    }

    const result = await ingestFromUrl(parsed.data.url, {
      knowledgeBaseId: parsed.data.knowledgeBaseId,
      title: parsed.data.title,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory,
      tags: parsed.data.tags,
      language: parsed.data.language,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rag/ingest/url]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
