/**
 * POST /api/rag/ingest — Ingest a single document (multipart upload or text)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestDocument, ingestText } from "@/lib/rag/ingestion";
import type { DocumentSourceType } from "@prisma/client";

const ALLOWED_MIME: Record<string, DocumentSourceType> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "text/markdown": "MARKDOWN",
  "text/html": "HTML",
  "text/csv": "CSV",
};

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    // Multipart file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
      const title = formData.get("title") as string;
      const category = formData.get("category") as string | null;
      const subcategory = formData.get("subcategory") as string | null;
      const tags = formData.get("tags") as string | null;
      const language = (formData.get("language") as "fr" | "en") ?? "fr";

      if (!file || !knowledgeBaseId || !title) {
        return NextResponse.json(
          { error: "Missing required fields: file, knowledgeBaseId, title" },
          { status: 400 },
        );
      }

      const sourceType = ALLOWED_MIME[file.type];
      if (!sourceType) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 },
        );
      }

      // Verify KB ownership
      const kb = await prisma.knowledgeBase.findFirst({
        where: { id: knowledgeBaseId, OR: [{ ownerId: userId }, { isPublic: true }] },
      });
      if (!kb) {
        return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await ingestDocument(buffer, sourceType, {
        knowledgeBaseId,
        title,
        category: category ?? undefined,
        subcategory: subcategory ?? undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        language,
      });

      return NextResponse.json({ data: result }, { status: 201 });
    }

    // JSON body (manual text entry)
    const body = await request.json();
    const { knowledgeBaseId, title, content, category, subcategory, tags, language } = body as {
      knowledgeBaseId: string;
      title: string;
      content: string;
      category?: string;
      subcategory?: string;
      tags?: string[];
      language?: "fr" | "en";
    };

    if (!knowledgeBaseId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: knowledgeBaseId, title, content" },
        { status: 400 },
      );
    }

    const result = await ingestText(content, {
      knowledgeBaseId,
      title,
      category,
      subcategory,
      tags,
      language,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/rag/ingest]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
