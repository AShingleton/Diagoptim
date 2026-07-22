import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PUBLIC_API_ROUTES: string[] = [
  "/api/auth",
  "/api/billing/webhook",
  "/api/health",
  "/api/cron",
  "/api/lead", // public landing lead capture (own CORS, no auth)
];

const PROTECTED_PAGE_PREFIXES: string[] = [
  "/dashboard",
  "/diagnostic",
  "/company",
  "/reports",
  "/settings",
  "/tools",
  "/roadmap",
  "/training",
  "/support",
  "/affiliate",
];

const AUTH_PAGES: string[] = ["/login", "/register", "/forgot-password"];

const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
];

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

// ---------------------------------------------------------------------------
// Rate limits by plan
// ---------------------------------------------------------------------------

interface PlanRateLimit {
  perMinute: number;
  perHour: number;
}

const PLAN_RATE_LIMITS: Record<string, PlanRateLimit> = {
  free: { perMinute: 10, perHour: 100 },
  starter: { perMinute: 30, perHour: 500 },
  pro: { perMinute: 60, perHour: 2000 },
  expert: { perMinute: 120, perHour: 5000 },
};

const DEFAULT_RATE_LIMIT: PlanRateLimit = PLAN_RATE_LIMITS.free;

// ---------------------------------------------------------------------------
// In-memory rate-limiter
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): { allowed: boolean; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  // Periodic cleanup
  if (rateLimitStore.size > 10_000) {
    for (const [k, v] of rateLimitStore) {
      if (now >= v.resetAt) rateLimitStore.delete(k);
    }
  }

  return {
    allowed: entry.count <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: Math.ceil(entry.resetAt / 1000),
  };
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp: number;
  aud: string;
  user_metadata?: {
    plan?: string;
  };
}

function decodeJwt(token: string): SupabaseJwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as SupabaseJwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: SupabaseJwtPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

// ---------------------------------------------------------------------------
// Path matching helpers
// ---------------------------------------------------------------------------

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (page) => pathname === page || pathname.startsWith(page + "/"),
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api");
}

// ---------------------------------------------------------------------------
// Locale detection
// ---------------------------------------------------------------------------

function detectLocale(request: NextRequest): string {
  // 1. Check cookie
  const localeCookie = request.cookies.get("locale")?.value;
  if (localeCookie && ["fr", "en"].includes(localeCookie)) return localeCookie;

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get("accept-language") ?? "";
  if (acceptLang.includes("fr")) return "fr";
  if (acceptLang.includes("en")) return "en";

  return "fr"; // Default
}

// ---------------------------------------------------------------------------
// White-label detection
// ---------------------------------------------------------------------------

function detectWhiteLabel(request: NextRequest): string | null {
  const host = request.headers.get("host") ?? "";
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").host;

  // If the host doesn't match the main app domain, it's a white-label domain
  if (host && host !== appHost && host !== "localhost:3000") {
    return host;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CORS handler
// ---------------------------------------------------------------------------

function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const origin = request.headers.get("Origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Also allow white-label origins
  const whiteLabel = detectWhiteLabel(request);
  if (origin && whiteLabel) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Plan feature gating
// ---------------------------------------------------------------------------

interface PlanFeatures {
  maxDiagnostics: number;
  maxDocuments: number;
  leanTools: boolean;
  aiInsights: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  teamMembers: number;
  consultantDashboard: boolean;
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    maxDiagnostics: 1,
    maxDocuments: 3,
    leanTools: false,
    aiInsights: false,
    whiteLabel: false,
    apiAccess: false,
    teamMembers: 0,
    consultantDashboard: false,
  },
  starter: {
    maxDiagnostics: 5,
    maxDocuments: 20,
    leanTools: true,
    aiInsights: false,
    whiteLabel: false,
    apiAccess: false,
    teamMembers: 2,
    consultantDashboard: false,
  },
  pro: {
    maxDiagnostics: -1, // unlimited
    maxDocuments: -1,
    leanTools: true,
    aiInsights: true,
    whiteLabel: false,
    apiAccess: true,
    teamMembers: 10,
    consultantDashboard: false,
  },
  expert: {
    maxDiagnostics: -1,
    maxDocuments: -1,
    leanTools: true,
    aiInsights: true,
    whiteLabel: true,
    apiAccess: true,
    teamMembers: -1,
    consultantDashboard: true,
  },
};

/** Route prefixes that require specific plan features */
const FEATURE_GATED_ROUTES: Array<{ prefix: string; feature: keyof PlanFeatures }> = [
  { prefix: "/api/tools/vsm", feature: "leanTools" },
  { prefix: "/api/tools/ishikawa", feature: "leanTools" },
  { prefix: "/api/tools/a3", feature: "leanTools" },
  { prefix: "/api/tools/swot", feature: "leanTools" },
  { prefix: "/api/ai/insights", feature: "aiInsights" },
  { prefix: "/api/white-label", feature: "whiteLabel" },
  { prefix: "/api/team", feature: "teamMembers" },
  { prefix: "/api/consultant", feature: "consultantDashboard" },
];

function checkPlanAccess(pathname: string, plan: string): { allowed: boolean; feature: string | null } {
  const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;

  for (const gate of FEATURE_GATED_ROUTES) {
    if (pathname.startsWith(gate.prefix)) {
      const value = features[gate.feature];
      // For boolean features, check directly; for numbers, check > 0 or -1 (unlimited)
      const allowed = typeof value === "boolean" ? value : (value as number) !== 0;
      if (!allowed) {
        return { allowed: false, feature: gate.feature };
      }
    }
  }

  return { allowed: true, feature: null };
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

function applySecurityHeaders(response: NextResponse): void {
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://eu.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://eu.posthog.com wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  // HSTS - 1 year, include subdomains, preload
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()",
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ---- CORS preflight ----
  if (request.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(request, preflightResponse);
  }

  // ---- Skip static assets ----
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/screenshots/") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return NextResponse.next();
  }

  // ---- Detect locale and white-label ----
  const locale = detectLocale(request);
  const whiteLabelDomain = detectWhiteLabel(request);

  // ---- API routes ----
  if (isApiRoute(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    // Default rate limit (will be upgraded after auth)
    const rateLimit = checkRateLimit(ip, DEFAULT_RATE_LIMIT.perMinute);

    if (!rateLimit.allowed) {
      const errorBody = {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          statusCode: 429,
        },
      };
      const rateLimitedResponse = NextResponse.json(errorBody, { status: 429 });
      rateLimitedResponse.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
      rateLimitedResponse.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      rateLimitedResponse.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
      rateLimitedResponse.headers.set("Retry-After", "60");
      applySecurityHeaders(rateLimitedResponse);
      return applyCorsHeaders(request, rateLimitedResponse);
    }

    // Public API routes bypass auth
    if (isPublicApiRoute(pathname)) {
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
      response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
      response.headers.set("X-RateLimit-Reset", String(rateLimit.resetAt));
      applySecurityHeaders(response);
      return applyCorsHeaders(request, response);
    }

    // API auth check
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      const errorBody = {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header.",
          statusCode: 401,
        },
      };
      const unauthResponse = NextResponse.json(errorBody, { status: 401 });
      applySecurityHeaders(unauthResponse);
      return applyCorsHeaders(request, unauthResponse);
    }

    const payload = decodeJwt(token);

    if (!payload || isTokenExpired(payload)) {
      const errorBody = {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Token is invalid or expired.",
          statusCode: 401,
        },
      };
      const expiredResponse = NextResponse.json(errorBody, { status: 401 });
      applySecurityHeaders(expiredResponse);
      return applyCorsHeaders(request, expiredResponse);
    }

    // Apply plan-based rate limiting
    const userPlan = payload.user_metadata?.plan ?? "free";
    const planLimit = PLAN_RATE_LIMITS[userPlan] ?? DEFAULT_RATE_LIMIT;
    const userRateLimit = checkRateLimit(`user:${payload.sub}`, planLimit.perMinute);

    if (!userRateLimit.allowed) {
      const errorBody = {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Plan rate limit exceeded. Upgrade for higher limits.",
          statusCode: 429,
        },
      };
      const rateLimitedResponse = NextResponse.json(errorBody, { status: 429 });
      rateLimitedResponse.headers.set("X-RateLimit-Limit", String(userRateLimit.limit));
      rateLimitedResponse.headers.set("X-RateLimit-Remaining", String(userRateLimit.remaining));
      rateLimitedResponse.headers.set("X-RateLimit-Reset", String(userRateLimit.resetAt));
      applySecurityHeaders(rateLimitedResponse);
      return applyCorsHeaders(request, rateLimitedResponse);
    }

    // Plan feature gating
    const planAccess = checkPlanAccess(pathname, userPlan);
    if (!planAccess.allowed) {
      const errorBody = {
        success: false,
        error: {
          code: "PLAN_REQUIRED",
          message: `Your current plan (${userPlan}) does not include access to this feature. Please upgrade.`,
          feature: planAccess.feature,
          statusCode: 403,
        },
      };
      const forbiddenResponse = NextResponse.json(errorBody, { status: 403 });
      applySecurityHeaders(forbiddenResponse);
      return applyCorsHeaders(request, forbiddenResponse);
    }

    // Pass user info downstream via headers
    const response = NextResponse.next();
    response.headers.set("X-User-Id", payload.sub);
    response.headers.set("X-User-Email", payload.email ?? "");
    response.headers.set("X-User-Role", payload.role ?? "authenticated");
    response.headers.set("X-User-Plan", userPlan);
    response.headers.set("X-Locale", locale);
    if (whiteLabelDomain) {
      response.headers.set("X-WhiteLabel-Domain", whiteLabelDomain);
    }
    response.headers.set("X-RateLimit-Limit", String(userRateLimit.limit));
    response.headers.set("X-RateLimit-Remaining", String(userRateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(userRateLimit.resetAt));
    applySecurityHeaders(response);
    return applyCorsHeaders(request, response);
  }

  // ---- Page-level auth using Supabase cookie ----
  const supabaseCookies = request.cookies.getAll();
  const authCookie = supabaseCookies.find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"),
  );

  let userPayload: SupabaseJwtPayload | null = null;

  if (authCookie) {
    try {
      const parsed = JSON.parse(authCookie.value);
      const accessToken = Array.isArray(parsed) ? parsed[0] : parsed;
      if (typeof accessToken === "string") {
        const decoded = decodeJwt(accessToken);
        if (decoded && !isTokenExpired(decoded)) {
          userPayload = decoded;
        }
      }
    } catch {
      const decoded = decodeJwt(authCookie.value);
      if (decoded && !isTokenExpired(decoded)) {
        userPayload = decoded;
      }
    }
  }

  const isAuthenticated = userPayload !== null;

  // Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && isProtectedPage(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();

  // Set locale and white-label headers for pages too
  response.headers.set("X-Locale", locale);
  if (whiteLabelDomain) {
    response.headers.set("X-WhiteLabel-Domain", whiteLabelDomain);
  }
  applySecurityHeaders(response);

  return response;
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
