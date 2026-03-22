// ---------------------------------------------------------------------------
// Mock Supabase client
// Replace with real createBrowserClient from @supabase/ssr later.
// ---------------------------------------------------------------------------

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
}

const demoUser: MockUser = {
  id: "demo-user-001",
  email: "demo@diagoptim.com",
  user_metadata: {
    full_name: "Marie Dupont",
    avatar_url: undefined,
  },
};

interface MockAuthResponse {
  data: { user: MockUser | null };
  error: null | { message: string };
}

const mockAuth = {
  async getUser(): Promise<MockAuthResponse> {
    return { data: { user: demoUser }, error: null };
  },

  async signInWithPassword(_creds: {
    email: string;
    password: string;
  }): Promise<MockAuthResponse> {
    return { data: { user: demoUser }, error: null };
  },

  async signUp(_creds: {
    email: string;
    password: string;
    options?: { data: Record<string, string> };
  }): Promise<MockAuthResponse> {
    return { data: { user: demoUser }, error: null };
  },

  async signInWithOAuth(_opts: {
    provider: string;
    options?: { redirectTo: string };
  }): Promise<{ data: { url: string }; error: null }> {
    return { data: { url: "#" }, error: null };
  },

  async resetPasswordForEmail(
    _email: string
  ): Promise<{ data: object; error: null }> {
    return { data: {}, error: null };
  },

  async signOut(): Promise<{ error: null }> {
    return { error: null };
  },

  onAuthStateChange(
    _cb: (
      event: string,
      session: { user: MockUser } | null
    ) => void
  ) {
    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  },
};

interface EqChain {
  eq: (_col: string, _val: string) => EqChain;
  single: () => Promise<{ data: null; error: null }>;
  then: (resolve: (v: { data: unknown[]; error: null }) => void) => Promise<void>;
}

function makeEqChain(): EqChain {
  return {
    eq: (_col: string, _val: string) => makeEqChain(),
    single: async () => ({ data: null, error: null }),
    async then(resolve: (v: { data: unknown[]; error: null }) => void) {
      resolve({ data: [], error: null });
    },
  };
}

export const supabase = {
  auth: mockAuth,

  from(_table: string) {
    return {
      select: (_cols?: string) => {
        const eqChain: ReturnType<typeof makeEqChain> = makeEqChain();
        return eqChain;
      },
      insert: (_row: unknown) => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      update: (_row: unknown) => ({
        eq: (_col: string, _val: string) => ({
          async then(resolve: (v: { data: null; error: null }) => void) {
            resolve({ data: null, error: null });
          },
        }),
      }),
      delete: () => ({
        eq: (_col: string, _val: string) => ({
          async then(resolve: (v: { data: null; error: null }) => void) {
            resolve({ data: null, error: null });
          },
        }),
      }),
    };
  },
};

export type SupabaseClient = typeof supabase;
