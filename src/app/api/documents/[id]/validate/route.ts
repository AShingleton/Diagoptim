/**
 * POST /api/documents/[id]/validate
 * Mark a document's extracted data as validated by the user.
 * Optionally accepts corrected extracted data.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const validateSchema = z.object({
  correctedData: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
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
        { error: 'No extracted data to validate. Document may still be processing.' },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      validatedByUser: true,
    };

    // If the user provided corrected data, merge it with the existing extracted data
    if (parsed.data.correctedData) {
      const existingData = document.extractedData as Record<string, unknown>;
      updateData.extractedData = { ...existingData, ...parsed.data.correctedData };
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        documentId: updated.id,
        validatedByUser: updated.validatedByUser,
        extractedData: updated.extractedData,
      },
    });
  } catch (error) {
    console.error('[POST /api/documents/[id]/validate]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
