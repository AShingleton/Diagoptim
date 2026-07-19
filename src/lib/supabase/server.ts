import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Real server-side Supabase client (reads the auth cookie set at login).
 * Use in Server Components and Server Actions — never the mock in `./client`.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options }),
            );
          } catch {
            // Called from a Server Component with a read-only cookie store — safe to ignore.
          }
        },
      },
    },
  );
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Returns the authenticated user derived from the Supabase cookie, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const name =
    meta.full_name || meta.name || (user.email ?? "Utilisateur").split("@")[0];
  return { id: user.id, email: user.email ?? "", name };
}
