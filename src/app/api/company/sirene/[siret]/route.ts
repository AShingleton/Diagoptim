/**
 * GET /api/company/sirene/[siret]
 * Lookup a company by SIRET number via the INSEE SIRENE API.
 * Returns structured company data from the French business registry.
 */
import { NextRequest, NextResponse } from 'next/server';
import { searchBySiret } from '@/lib/integrations/sirene';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siret: string }> },
) {
  try {
    const { siret } = await params;

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate SIRET format (14 digits)
    const cleanSiret = siret.replace(/\s/g, '');
    if (!/^\d{14}$/.test(cleanSiret)) {
      return NextResponse.json(
        { error: 'Invalid SIRET format. Expected 14 digits.' },
        { status: 400 },
      );
    }

    const result = await searchBySiret(cleanSiret);

    if (!result) {
      return NextResponse.json(
        { error: 'No company found for this SIRET' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[GET /api/company/sirene/[siret]]', error);

    if (error instanceof Error && error.message.includes('INSEE_SIRENE_API_TOKEN')) {
      return NextResponse.json(
        { error: 'SIRENE API not configured' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
