/**
 * POST /api/documents/upload
 * Upload a document (multipart form data).
 * Saves the file to Supabase Storage and creates a Document record
 * queued for analysis.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const VALID_DOC_TYPES = [
  'invoice',
  'quote',
  'balance_sheet',
  'insurance',
  'brochure_company',
  'brochure_client',
] as const;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('companyId') as string | null;
    const documentType = formData.get('type') as string | null;

    if (!file || !companyId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, companyId, type' },
        { status: 400 },
      );
    }

    // Validate document type
    if (!VALID_DOC_TYPES.includes(documentType as typeof VALID_DOC_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${VALID_DOC_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 },
      );
    }

    // Verify company ownership
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 },
      );
    }

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `documents/${companyId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await getSupabaseAdmin().storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        companyId,
        type: documentType as typeof VALID_DOC_TYPES[number],
        filename: file.name,
        storagePath,
        mimeType: file.type,
        size: file.size,
        validatedByUser: false,
      },
    });

    // Create a document analysis job
    const { createDocumentJob } = await import('@/lib/jobs/processor');
    const job = await createDocumentJob(document.id);

    return NextResponse.json(
      {
        data: {
          documentId: document.id,
          storagePath: document.storagePath,
          jobId: job.id,
          status: job.status === 'COMPLETED' ? 'analyzed' : 'pending',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/documents/upload]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
