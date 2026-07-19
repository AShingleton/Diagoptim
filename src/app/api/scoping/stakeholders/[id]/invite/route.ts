import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { canManageProject } from '@/lib/scoping/service';
import { sendEmail } from '@/lib/notifications/email';
import { inviteStakeholder } from '@/lib/scoping/invite';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Create a Supabase auth user for the given email, or return the existing one.
 * Uses the admin API with the service role key. Never logs the key.
 */
async function createOrGetUser(email: string): Promise<{ id: string; tempPassword: string | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin configuration is missing');
  }

  const headers = {
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'User-Agent': BROWSER_UA,
  };

  const tempPassword = `${randomUUID().slice(0, 16)}!aA1`;

  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password: tempPassword, email_confirm: true }),
  });

  if (createRes.status === 200 || createRes.status === 201) {
    const body = (await createRes.json()) as { id: string };
    return { id: body.id, tempPassword };
  }

  // Already registered -> look the user up by email.
  if (createRes.status === 422) {
    const listRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?per_page=200`,
      { method: 'GET', headers },
    );
    if (!listRes.ok) {
      throw new Error(`Failed to list existing users (status ${listRes.status})`);
    }
    const listBody = (await listRes.json()) as { users?: Array<{ id: string; email?: string }> };
    const match = (listBody.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!match) {
      throw new Error('User reported as already registered but not found in listing');
    }
    return { id: match.id, tempPassword: null };
  }

  throw new Error(`Failed to create auth user (status ${createRes.status})`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stakeholder = await prisma.scopingStakeholder.findUnique({
      where: { id },
      select: { projectId: true },
    });
    if (!stakeholder) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    if (!(await canManageProject(prisma, stakeholder.projectId, userId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await inviteStakeholder(
      {
        prisma,
        createOrGetUser,
        sendEmail: (p) => sendEmail(p),
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://diagnostic.embraceia.com',
      },
      id,
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /api/scoping/stakeholders/[id]/invite]', message);
    return NextResponse.json({ error: 'Failed to invite stakeholder' }, { status: 500 });
  }
}
