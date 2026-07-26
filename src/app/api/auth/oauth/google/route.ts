/**
 * POST /api/auth/oauth/google
 * Initiate Google OAuth flow via Supabase Auth.
 * Returns the OAuth URL to redirect the user to.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL;
    const redirectTo = `${origin}/fr/auth/callback`;

    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      data: { url: data.url },
    });
  } catch (error) {
    console.error('[POST /api/auth/oauth/google]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
