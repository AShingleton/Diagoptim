/**
 * GET /api/rag/stats — Knowledge base statistics
 */
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where = {
      OR: [
        { isPublic: true } as const,
        { ownerId: userId } as const,
      ],
    };

    const [
      totalBases,
      totalDocuments,
      documentsByStatus,
      totalChunksResult,
      totalTokensResult,
      categoryCounts,
    ] = await Promise.all([
      prisma.knowledgeBase.count({ where }),
      prisma.knowledgeDocument.count({
        where: { knowledgeBase: where },
      }),
      prisma.knowledgeDocument.groupBy({
        by: ["status"],
        where: { knowledgeBase: where },
        _count: true,
      }),
      prisma.knowledgeDocument.aggregate({
        where: { knowledgeBase: where, status: "READY" },
        _sum: { totalChunks: true },
      }),
      prisma.knowledgeDocument.aggregate({
        where: { knowledgeBase: where, status: "READY" },
        _sum: { totalTokens: true },
      }),
      prisma.knowledgeDocument.groupBy({
        by: ["category"],
        where: { knowledgeBase: where, status: "READY" },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      data: {
        totalBases,
        totalDocuments,
        totalChunks: totalChunksResult._sum.totalChunks ?? 0,
        totalTokens: totalTokensResult._sum.totalTokens ?? 0,
        documentsByStatus: Object.fromEntries(
          documentsByStatus.map((d) => [d.status, d._count]),
        ),
        documentsByCategory: Object.fromEntries(
          categoryCounts.map((c) => [c.category ?? "uncategorized", c._count]),
        ),
      },
    });
  } catch (error) {
    console.error("[GET /api/rag/stats]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
