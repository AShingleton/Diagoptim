/**
 * DiagOptim Monitoring Script
 * Run via cron or Railway scheduled task.
 *
 * Usage: npx tsx scripts/monitor.ts
 *
 * Checks:
 * 1. GET /api/health — alerts if not 200
 * 2. Reports status to console (extend with email alerts via Brevo/Resend)
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ALERT_EMAIL = process.env.ALERT_EMAIL || "";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";

interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
  services: Record<string, boolean>;
}

async function checkHealth(): Promise<{ ok: boolean; data?: HealthResponse; error?: string }> {
  try {
    const response = await fetch(`${APP_URL}/api/health`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = (await response.json()) as HealthResponse;
    return { ok: response.status === 200, data };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function sendAlert(subject: string, body: string): Promise<void> {
  if (!BREVO_API_KEY || !ALERT_EMAIL) {
    console.error(`[ALERT] ${subject}: ${body}`);
    return;
  }

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "DiagOptim Monitor", email: "monitor@diagoptim.com" },
        to: [{ email: ALERT_EMAIL }],
        subject,
        textContent: body,
      }),
    });
    console.log(`[ALERT] Email sent to ${ALERT_EMAIL}`);
  } catch (err) {
    console.error("[ALERT] Failed to send email:", err);
  }
}

async function main(): Promise<void> {
  console.log(`[${new Date().toISOString()}] DiagOptim Monitor - checking ${APP_URL}`);

  const health = await checkHealth();

  if (!health.ok) {
    const message = health.error
      ? `Health check failed: ${health.error}`
      : `Health check degraded: ${JSON.stringify(health.data?.services)}`;
    console.error(`❌ ${message}`);
    await sendAlert("DiagOptim - Health Check FAILED", message);
    process.exit(1);
  }

  console.log(`✅ Health: ${health.data?.status} | Version: ${health.data?.version} | Uptime: ${Math.round(health.data?.uptime ?? 0)}s`);

  // Check individual services
  if (health.data?.services) {
    for (const [service, ok] of Object.entries(health.data.services)) {
      if (!ok) {
        const message = `Service degraded: ${service}`;
        console.warn(`⚠️  ${message}`);
        await sendAlert(`DiagOptim - Service Degraded: ${service}`, message);
      }
    }
  }
}

main();
