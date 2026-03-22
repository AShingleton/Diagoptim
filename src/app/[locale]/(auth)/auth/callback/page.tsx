'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Activity, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Supabase browser client (singleton per page lifetime)
// ---------------------------------------------------------------------------

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve the locale from URL params, falling back to browser language. */
function resolveLocale(paramLocale: string | undefined): Locale {
  if (paramLocale && (locales as readonly string[]).includes(paramLocale)) {
    return paramLocale as Locale;
  }

  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if ((locales as readonly string[]).includes(browserLang)) {
      return browserLang as Locale;
    }
  }

  return defaultLocale;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = resolveLocale(params?.locale as string | undefined);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  const handleCallback = useCallback(async () => {
    setError(null);
    setProcessing(true);

    try {
      const supabase = getSupabase();

      // ----- 1. Try to get an existing session first -----
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setProcessing(false);
        return;
      }

      let session = sessionData.session;

      // ----- 2. If no session, check URL for code or error -----
      if (!session) {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          setError(errorDescription ?? errorParam);
          setProcessing(false);
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError(exchangeError.message);
            setProcessing(false);
            return;
          }

          session = exchangeData.session;
        } else {
          setError(
            locale === 'fr'
              ? "Aucune session ou code d'autorisation trouvé."
              : 'No session or authorization code found.',
          );
          setProcessing(false);
          return;
        }
      }

      // ----- 3. Create / update user profile -----
      if (session?.user) {
        const user = session.user;

        // Check if a profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // New user — create profile with free plan
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            plan: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          // Existing user — update last sign-in metadata
          await supabase
            .from('profiles')
            .update({
              avatar_url: user.user_metadata?.avatar_url ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);
        }
      }

      // ----- 4. Redirect to dashboard -----
      router.replace(`/${locale}/dashboard`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : locale === 'fr'
            ? 'Une erreur inattendue est survenue.'
            : 'An unexpected error occurred.',
      );
      setProcessing(false);
    }
  }, [router, searchParams, locale]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2.5"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">DiagOptim</span>
          </Link>

          {/* Error card */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-semibold">
                {locale === 'fr'
                  ? "Erreur d'authentification"
                  : 'Authentication error'}
              </h2>
            </div>

            <p className="text-sm text-destructive/80">{error}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleCallback()}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {locale === 'fr' ? 'Réessayer' : 'Retry'}
              </Button>

              <Link href={`/${locale}/login`}>
                <Button>
                  {locale === 'fr'
                    ? 'Retour à la connexion'
                    : 'Back to login'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mx-auto mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">DiagOptim</span>
        </div>

        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />

        <p className="text-sm text-muted-foreground">
          {locale === 'fr' ? 'Connexion en cours...' : 'Signing you in...'}
        </p>
      </div>
    </div>
  );
}
