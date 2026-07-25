/**
 * DELETE /api/documents/[id]
 * Delete a document. Removes from both Supabase Storage and the database.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

export async function DELETE(
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

    // Remove from Supabase Storage
    const { error: storageError } = await getSupabaseAdmin().storage
      .from('documents')
      .remove([document.storagePath]);

    if (storageError) {
      console.warn(`Failed to delete file from storage: ${storageError.message}`);
      // Continue with DB deletion even if storage removal fails
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json(
      { data: { deleted: true, documentId } },
      { status: 200 },
    );
  } catch (error) {
    console.error('[DELETE /api/documents/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
