/**
 * GET /api/rag/documents — List ingested documents
 */
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const where: Record<string, unknown> = {
      knowledgeBase: {
        OR: [{ isPublic: true }, { ownerId: userId }],
      },
    };

    if (knowledgeBaseId) where.knowledgeBaseId = knowledgeBaseId;
    if (status) where.status = status;
    if (category) where.category = category;

    const [documents, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where,
        select: {
          id: true,
          title: true,
          sourceType: true,
          status: true,
          category: true,
          subcategory: true,
          tags: true,
          language: true,
          totalChunks: true,
          totalTokens: true,
          processingError: true,
          createdAt: true,
          knowledgeBase: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.knowledgeDocument.count({ where }),
    ]);

    return NextResponse.json({ data: documents, total, limit, offset });
  } catch (error) {
    console.error("[GET /api/rag/documents]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
