/**
 * GET /api/rag/documents/[id]/status — Ingestion status of a document
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const doc = await prisma.knowledgeDocument.findFirst({
      where: {
        id,
        knowledgeBase: {
          OR: [{ isPublic: true }, { ownerId: userId }],
        },
      },
      select: {
        id: true,
        status: true,
        totalChunks: true,
        totalTokens: true,
        processingError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ data: doc });
  } catch (error) {
    console.error("[GET /api/rag/documents/[id]/status]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
