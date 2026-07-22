import { sendEmail } from "@/lib/notifications/email";

const LEAD_NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL || "anthony.shingleton@embraceIA.com";

export interface LeadInput {
  name: string;
  company: string;
  email: string;
  message?: string;
  score?: string;
  tier?: string;
  source?: string;
}

export interface LeadResult {
  ok: boolean;
  error?: string;
}

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Shared lead-capture: upserts a Brevo contact (non-fatal) then emails Anthony the
 * notification (the source of truth). Used by both the landing server action and the
 * public /api/lead endpoint (the latter serves the external Astro site).
 */
export async function captureLead(input: LeadInput): Promise<LeadResult> {
  const name = (input.name || "").trim();
  const company = (input.company || "").trim();
  const email = (input.email || "").trim();
  const message = (input.message || "").trim();
  const score = (input.score || "").trim();
  const tier = (input.tier || "").trim();
  const source = (input.source || "landing-cadrage-ia").trim();

  if (!name || !company || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Merci de renseigner un nom, une entreprise et un email valide." };
  }

  try {
    const key = process.env.BREVO_API_KEY;
    if (key) {
      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          attributes: { NOM: name, ENTREPRISE: company, MESSAGE: message, MATURITE_SCORE: score, MATURITE_NIVEAU: tier, SOURCE: source },
        }),
      });
    }
  } catch (e) {
    console.error("Brevo contact upsert failed:", e instanceof Error ? e.message : e);
  }

  try {
    const html = `
      <h2>Nouvelle demande de diagnostic de cadrage IA</h2>
      <ul>
        <li><strong>Nom :</strong> ${escapeHtml(name)}</li>
        <li><strong>Entreprise :</strong> ${escapeHtml(company)}</li>
        <li><strong>Email :</strong> ${escapeHtml(email)}</li>
        <li><strong>Maturité IA :</strong> ${escapeHtml(tier)} (${escapeHtml(score)}/8)</li>
        <li><strong>Message :</strong> ${escapeHtml(message) || "—"}</li>
        <li><strong>Source :</strong> ${escapeHtml(source)}</li>
      </ul>`;
    await sendEmail({ to: LEAD_NOTIFY_TO, subject: `Demande de diagnostic de cadrage — ${company}`, htmlContent: html });
  } catch (e) {
    console.error("Lead notification email failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Un problème est survenu. Réessayez ou écrivez à anthony.shingleton@embraceIA.com." };
  }

  return { ok: true };
}
