/**
 * POST /api/auth/register
 * Register a new user via Supabase Auth, then create a User record
 * and a free Subscription in the database.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  locale: z.enum(['fr', 'en']).optional().default('fr'),
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, name, locale } = parsed.data;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    const supabaseUserId = authData.user.id;

    // Create User + free Subscription in DB
    const user = await prisma.user.create({
      data: {
        id: supabaseUserId,
        email,
        name,
        locale,
        subscription: {
          create: {
            plan: 'free',
            status: 'active',
          },
        },
      },
      include: { subscription: true },
    });

    return NextResponse.json({ data: { user } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
