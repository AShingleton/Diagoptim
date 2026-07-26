/**
 * GET /api/documents/[id]/extracted
 * Get the extracted data for a document after OCR/AI processing.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: documentId } = await params;

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { company: { select: { userId: true } } },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.company.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!document.extractedData) {
      return NextResponse.json(
        { error: 'No extracted data available yet. Document may still be processing.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        documentId: document.id,
        type: document.type,
        extractedData: document.extractedData,
        validatedByUser: document.validatedByUser,
      },
    });
  } catch (error) {
    console.error('[GET /api/documents/[id]/extracted]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
