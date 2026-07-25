import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 * Returns service health status.
 * - 200 if all critical services are reachable
 * - 503 if any critical service is degraded
 */
export async function GET(): Promise<NextResponse> {
  const services: Record<string, boolean> = {
    db: false,
  };

  // Check database
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    services.db = true;
  } catch {
    services.db = false;
  }

  const allHealthy = Object.values(services).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? "ok" : "degraded",
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
