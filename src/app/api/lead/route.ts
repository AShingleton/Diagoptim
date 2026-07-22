import { NextResponse } from "next/server";
import { captureLead } from "@/lib/leads/capture";

export const dynamic = "force-dynamic";

// Public lead-capture endpoint for the external EmbraceIA marketing site (Astro,
// cross-origin). Allow-listed in middleware (no auth). CORS restricted to embraceia.com.
const ALLOWED = new Set([
  "https://embraceia.com",
  "https://www.embraceia.com",
  "https://next.embraceia.com",
  "https://diagnostic.embraceia.com",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED.has(origin) ? origin : "https://www.embraceia.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get("origin")) });
}

export async function POST(req: Request) {
  const cors = corsHeaders(req.headers.get("origin"));
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête invalide." }, { status: 400, headers: cors });
  }
  const result = await captureLead({
    name: String(body.name ?? ""),
    company: String(body.company ?? ""),
    email: String(body.email ?? ""),
    message: String(body.message ?? ""),
    score: String(body.score ?? ""),
    tier: String(body.tier ?? ""),
    source: "landing-cadrage-site",
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: cors });
}
