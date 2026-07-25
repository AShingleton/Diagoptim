/**
 * GET    /api/rag/knowledge-base/[id] — Detail of a knowledge base
 * DELETE /api/rag/knowledge-base/[id] — Delete a knowledge base
 */
import { type NextRequest, NextResponse } from "next/server";
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

    const kb = await prisma.knowledgeBase.findFirst({
      where: {
        id,
        OR: [{ isPublic: true }, { ownerId: userId }],
      },
      include: {
        documents: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            totalChunks: true,
            totalTokens: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { documents: true } },
      },
    });

    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
    }

    return NextResponse.json({ data: kb });
  } catch (error) {
    console.error("[GET /api/rag/knowledge-base/[id]]", error);
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

    const kb = await prisma.knowledgeBase.findFirst({
      where: { id, ownerId: userId },
    });

    if (!kb) {
      return NextResponse.json({ error: "Knowledge base not found or access denied" }, { status: 404 });
    }

    await prisma.knowledgeBase.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rag/knowledge-base/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
