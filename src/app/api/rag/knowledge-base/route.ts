/**
 * POST /api/rag/knowledge-base — Create a knowledge base
 * GET  /api/rag/knowledge-base — List knowledge bases
 */
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum([
    "METHODOLOGY",
    "TEMPLATE",
    "GUIDE",
    "FORMATION",
    "CASE_STUDY",
    "BENCHMARK",
    "USER_CONTENT",
    "CONSULTANT_CONTENT",
  ]),
  isPublic: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const kb = await prisma.knowledgeBase.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        type: parsed.data.type,
        isPublic: parsed.data.isPublic,
        ownerId: userId,
      },
    });

    return NextResponse.json({ data: kb }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rag/knowledge-base]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bases = await prisma.knowledgeBase.findMany({
      where: {
        OR: [{ isPublic: true }, { ownerId: userId }],
      },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: bases });
  } catch (error) {
    console.error("[GET /api/rag/knowledge-base]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
