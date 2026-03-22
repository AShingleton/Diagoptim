/**
 * GET    /api/rag/documents/[id] — Document detail with chunks
 * DELETE /api/rag/documents/[id] — Delete document and its embeddings
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
      include: {
        knowledgeBase: { select: { id: true, name: true, type: true } },
        chunks: {
          orderBy: { chunkIndex: "asc" },
          select: {
            id: true,
            chunkIndex: true,
            content: true,
            tokenCount: true,
            metadata: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ data: doc });
  } catch (error) {
    console.error("[GET /api/rag/documents/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
        knowledgeBase: { ownerId: userId },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Delete embeddings first (cascade from chunks will handle via FK)
    await prisma.$executeRawUnsafe(
      `DELETE FROM knowledge_embeddings WHERE chunk_id IN (SELECT id FROM "KnowledgeChunk" WHERE "documentId" = $1)`,
      id,
    );

    // Delete the document (cascades to chunks)
    await prisma.knowledgeDocument.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rag/documents/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
