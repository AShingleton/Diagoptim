"use server";

import { sendEmail } from "@/lib/notifications/email";

const LEAD_NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL || "anthony.shingleton@embraceIA.com";

export interface LeadResult {
  ok: boolean;
  error?: string;
}

/**
 * Captures a landing-page lead: upserts a Brevo contact (so it lands in the CRM /
 * nurture list) and emails Anthony a notification. Fails soft — a Brevo hiccup must
 * not lose the lead, so the notification email is attempted regardless.
 */
export async function submitLead(formData: FormData): Promise<LeadResult> {
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const score = String(formData.get("score") ?? "").trim();
  const tier = String(formData.get("tier") ?? "").trim();

  if (!name || !company || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Merci de renseigner un nom, une entreprise et un email valide." };
  }

  // 1) Brevo contact upsert (non-fatal on error)
  try {
    const key = process.env.BREVO_API_KEY;
    if (key) {
      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          email,
          updateEnabled: true,
          attributes: {
            NOM: name,
            ENTREPRISE: company,
            MESSAGE: message,
            MATURITE_SCORE: score,
            MATURITE_NIVEAU: tier,
            SOURCE: "landing-cadrage-ia",
          },
        }),
      });
    }
  } catch (e) {
    console.error("Brevo contact upsert failed:", e instanceof Error ? e.message : e);
  }

  // 2) Notification to Anthony (this is the source of truth — must be attempted)
  try {
    const html = `
      <h2>Nouvelle demande de diagnostic de cadrage IA</h2>
      <ul>
        <li><strong>Nom :</strong> ${escapeHtml(name)}</li>
        <li><strong>Entreprise :</strong> ${escapeHtml(company)}</li>
        <li><strong>Email :</strong> ${escapeHtml(email)}</li>
        <li><strong>Maturité IA :</strong> ${escapeHtml(tier)} (${escapeHtml(score)}/8)</li>
        <li><strong>Message :</strong> ${escapeHtml(message) || "—"}</li>
      </ul>
      <p>Source : landing /cadrage.</p>`;
    await sendEmail({
      to: LEAD_NOTIFY_TO,
      subject: `Demande de diagnostic de cadrage — ${company}`,
      htmlContent: html,
    });
  } catch (e) {
    console.error("Lead notification email failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Un problème est survenu. Réessayez ou écrivez à anthony.shingleton@embraceIA.com." };
  }

  return { ok: true };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
