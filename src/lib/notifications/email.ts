/**
 * EMAIL SERVICE — BREVO (ex-SendinBlue)
 *
 * Replaces Resend with Brevo for transactional emails.
 *
 * Environment variables:
 * BREVO_API_KEY=xkeysib-...
 * EMAIL_FROM_NAME=DiagOptim
 * EMAIL_FROM_EMAIL=noreply@diagoptim.com
 *
 * 10 bilingual (FR/EN) email templates:
 * 1. welcome — Welcome email after signup
 * 2. diagnostic_reminder — "Your diagnostic is waiting" (after 48h)
 * 3. report_ready — "Your report is ready to download"
 * 4. action_overdue — "A roadmap action is overdue"
 * 5. weekly_summary — Weekly summary (Monday morning)
 * 6. rediagnostic_reminder — "3 months since your last diagnostic"
 * 7. milestone_reached — "Congrats! You completed X actions"
 * 8. plan_limit — "You're approaching your plan limit"
 * 9. password_reset — Password reset
 * 10. team_invite — Team invitation
 *
 * @module notifications/email
 */

import * as brevo from "@getbrevo/brevo";

// ---------------------------------------------------------------------------
// Brevo client setup
// ---------------------------------------------------------------------------

let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getApiInstance(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    const key = process.env.BREVO_API_KEY;
    if (!key) throw new Error("BREVO_API_KEY environment variable is not set");
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      key,
    );
  }
  return apiInstance;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailLocale = "fr" | "en";

export type EmailTemplate =
  | "welcome"
  | "diagnostic_reminder"
  | "report_ready"
  | "action_overdue"
  | "weekly_summary"
  | "rediagnostic_reminder"
  | "milestone_reached"
  | "plan_limit"
  | "password_reset"
  | "team_invite";

interface EmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface WeeklySummaryStats {
  actionsCompleted: number;
  actionsUpcoming: number;
  scoreProgress: number;
  currentScore: number;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  try {
    const api = getApiInstance();
    const mail = new brevo.SendSmtpEmail();
    mail.sender = {
      name: process.env.EMAIL_FROM_NAME || "DiagOptim",
      email: process.env.EMAIL_FROM_EMAIL || "noreply@diagoptim.com",
    };
    mail.to = [{ email: params.to, name: params.toName }];
    mail.subject = params.subject;
    mail.htmlContent = params.htmlContent;
    if (params.textContent) mail.textContent = params.textContent;

    const result = await api.sendTransacEmail(mail);
    return { success: true, messageId: result.body.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Brevo email error:", message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Template senders
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  to: string,
  name: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr ? "Bienvenue sur DiagOptim !" : "Welcome to DiagOptim!",
    htmlContent: buildEmailHtml({
      title: isFr ? "Bienvenue !" : "Welcome!",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Merci de vous être inscrit sur DiagOptim. Vous êtes prêt à lancer votre premier diagnostic Lean et découvrir les opportunités d'optimisation de votre entreprise.</p>
<p><strong>En 3 étapes :</strong></p>
<ol>
  <li>Complétez le profil de votre entreprise</li>
  <li>Lancez votre diagnostic (15-20 minutes)</li>
  <li>Recevez votre rapport personnalisé avec plan d'action</li>
</ol>`
        : `<p>Hello ${esc(name)},</p>
<p>Thank you for signing up on DiagOptim. You're ready to launch your first Lean diagnostic and discover optimization opportunities for your business.</p>
<p><strong>In 3 steps:</strong></p>
<ol>
  <li>Complete your company profile</li>
  <li>Launch your diagnostic (15-20 minutes)</li>
  <li>Receive your personalized report with action plan</li>
</ol>`,
      ctaLabel: isFr ? "Commencer mon diagnostic" : "Start my diagnostic",
      ctaUrl: `${getBaseUrl()}/dashboard`,
      locale,
    }),
  });
}

export async function sendDiagnosticReminder(
  to: string,
  name: string,
  progress: number,
  diagnosticUrl: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? "Rappel : Votre diagnostic DiagOptim vous attend"
      : "Reminder: Your DiagOptim diagnostic is waiting",
    htmlContent: buildEmailHtml({
      title: isFr ? "Continuez votre diagnostic" : "Continue your diagnostic",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Vous avez commencé un diagnostic mais ne l'avez pas encore terminé. Reprenez là où vous en étiez pour obtenir votre analyse complète.</p>
<p>Progression actuelle : <strong>${progress}%</strong></p>`
        : `<p>Hello ${esc(name)},</p>
<p>You started a diagnostic but haven't completed it yet. Pick up where you left off to get your full analysis.</p>
<p>Current progress: <strong>${progress}%</strong></p>`,
      ctaLabel: isFr ? "Reprendre le diagnostic" : "Resume diagnostic",
      ctaUrl: diagnosticUrl,
      locale,
    }),
  });
}

export async function sendReportReady(
  to: string,
  name: string,
  reportUrl: string,
  globalScore: number,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? "Votre rapport DiagOptim est prêt !"
      : "Your DiagOptim report is ready!",
    htmlContent: buildEmailHtml({
      title: isFr ? "Rapport prêt" : "Report ready",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Votre rapport de diagnostic a été généré avec succès. Il contient votre analyse complète des 8 gaspillages, vos recommandations personnalisées et votre feuille de route.</p>
<p>Score global : <strong>${globalScore}/100</strong></p>`
        : `<p>Hello ${esc(name)},</p>
<p>Your diagnostic report has been generated successfully. It contains your complete analysis of the 8 wastes, personalized recommendations, and your roadmap.</p>
<p>Global score: <strong>${globalScore}/100</strong></p>`,
      ctaLabel: isFr ? "Télécharger le rapport" : "Download report",
      ctaUrl: reportUrl,
      locale,
    }),
  });
}

export async function sendActionOverdue(
  to: string,
  name: string,
  actionTitle: string,
  dueDate: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? `Action en retard : "${actionTitle}"`
      : `Overdue action: "${actionTitle}"`,
    htmlContent: buildEmailHtml({
      title: isFr ? "Action en retard" : "Overdue action",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>L'action suivante de votre feuille de route est en retard :</p>
<div style="background:#f8f9fa;padding:15px;border-radius:8px;border-left:4px solid #e74c3c;margin:15px 0;">
  <strong>${esc(actionTitle)}</strong><br/>
  Échéance : ${esc(dueDate)}
</div>
<p>Nous vous encourageons à la traiter dès que possible pour maintenir votre progression.</p>`
        : `<p>Hello ${esc(name)},</p>
<p>The following action from your roadmap is overdue:</p>
<div style="background:#f8f9fa;padding:15px;border-radius:8px;border-left:4px solid #e74c3c;margin:15px 0;">
  <strong>${esc(actionTitle)}</strong><br/>
  Due date: ${esc(dueDate)}
</div>
<p>We encourage you to address it as soon as possible to maintain your progress.</p>`,
      ctaLabel: isFr ? "Voir la feuille de route" : "View roadmap",
      ctaUrl: `${getBaseUrl()}/roadmap`,
      locale,
    }),
  });
}

export async function sendWeeklySummary(
  to: string,
  name: string,
  stats: WeeklySummaryStats,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? "Votre résumé hebdomadaire DiagOptim"
      : "Your DiagOptim weekly summary",
    htmlContent: buildEmailHtml({
      title: isFr ? "Résumé de la semaine" : "Weekly summary",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Voici votre résumé hebdomadaire :</p>
<table style="width:100%;border-collapse:collapse;margin:15px 0;">
  <tr style="background:#f8f9fa;">
    <td style="padding:10px;border-bottom:1px solid #dee2e6;">Actions complétées</td>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;text-align:right;">${stats.actionsCompleted}</td>
  </tr>
  <tr>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;">Actions à venir</td>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;text-align:right;">${stats.actionsUpcoming}</td>
  </tr>
  <tr style="background:#f8f9fa;">
    <td style="padding:10px;border-bottom:1px solid #dee2e6;">Score actuel</td>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;text-align:right;">${stats.currentScore}/100</td>
  </tr>
  <tr>
    <td style="padding:10px;">Progression du score</td>
    <td style="padding:10px;font-weight:bold;text-align:right;color:${stats.scoreProgress >= 0 ? "#27AE60" : "#e74c3c"};">${stats.scoreProgress >= 0 ? "+" : ""}${stats.scoreProgress} pts</td>
  </tr>
</table>`
        : `<p>Hello ${esc(name)},</p>
<p>Here is your weekly summary:</p>
<table style="width:100%;border-collapse:collapse;margin:15px 0;">
  <tr style="background:#f8f9fa;">
    <td style="padding:10px;border-bottom:1px solid #dee2e6;">Actions completed</td>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;text-align:right;">${stats.actionsCompleted}</td>
  </tr>
  <tr>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;">Upcoming actions</td>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;text-align:right;">${stats.actionsUpcoming}</td>
  </tr>
  <tr style="background:#f8f9fa;">
    <td style="padding:10px;border-bottom:1px solid #dee2e6;">Current score</td>
    <td style="padding:10px;border-bottom:1px solid #dee2e6;font-weight:bold;text-align:right;">${stats.currentScore}/100</td>
  </tr>
  <tr>
    <td style="padding:10px;">Score progress</td>
    <td style="padding:10px;font-weight:bold;text-align:right;color:${stats.scoreProgress >= 0 ? "#27AE60" : "#e74c3c"};">${stats.scoreProgress >= 0 ? "+" : ""}${stats.scoreProgress} pts</td>
  </tr>
</table>`,
      ctaLabel: isFr ? "Voir mon tableau de bord" : "View my dashboard",
      ctaUrl: `${getBaseUrl()}/dashboard`,
      locale,
    }),
  });
}

export async function sendRediagnosticReminder(
  to: string,
  name: string,
  lastDiagDate: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? "Il est temps de refaire votre diagnostic !"
      : "Time for a new diagnostic!",
    htmlContent: buildEmailHtml({
      title: isFr
        ? "Nouveau diagnostic recommandé"
        : "New diagnostic recommended",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Votre dernier diagnostic date du <strong>${esc(lastDiagDate)}</strong>. Nous vous recommandons d'en effectuer un nouveau pour mesurer vos progrès et identifier de nouvelles opportunités d'optimisation.</p>`
        : `<p>Hello ${esc(name)},</p>
<p>Your last diagnostic was on <strong>${esc(lastDiagDate)}</strong>. We recommend running a new one to measure your progress and identify new optimization opportunities.</p>`,
      ctaLabel: isFr
        ? "Lancer un nouveau diagnostic"
        : "Launch new diagnostic",
      ctaUrl: `${getBaseUrl()}/diagnostic/new`,
      locale,
    }),
  });
}

export async function sendMilestoneReached(
  to: string,
  name: string,
  count: number,
  gains: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? `Bravo ! ${count} actions complétées !`
      : `Congrats! ${count} actions completed!`,
    htmlContent: buildEmailHtml({
      title: isFr ? "Félicitations !" : "Congratulations!",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Vous avez complété <strong>${count} actions</strong> de votre feuille de route. C'est un excellent progrès !</p>
<div style="background:#eafaf1;padding:15px;border-radius:8px;border-left:4px solid #27AE60;margin:15px 0;">
  Gains estimés cumulés : <strong>${esc(gains)}</strong>
</div>
<p>Continuez sur cette lancée pour maximiser vos résultats.</p>`
        : `<p>Hello ${esc(name)},</p>
<p>You've completed <strong>${count} actions</strong> from your roadmap. That's excellent progress!</p>
<div style="background:#eafaf1;padding:15px;border-radius:8px;border-left:4px solid #27AE60;margin:15px 0;">
  Estimated cumulative gains: <strong>${esc(gains)}</strong>
</div>
<p>Keep up the momentum to maximize your results.</p>`,
      ctaLabel: isFr ? "Voir mes résultats" : "View my results",
      ctaUrl: `${getBaseUrl()}/dashboard`,
      locale,
    }),
  });
}

export async function sendPlanLimit(
  to: string,
  name: string,
  usagePercent: number,
  planName: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? "Vous approchez de votre limite"
      : "You're approaching your plan limit",
    htmlContent: buildEmailHtml({
      title: isFr ? "Limite du plan" : "Plan limit",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Vous avez utilisé <strong>${usagePercent}%</strong> de votre plan <strong>${esc(planName)}</strong>.</p>
<p>Pour continuer à profiter de toutes les fonctionnalités sans interruption, pensez à passer au plan supérieur.</p>`
        : `<p>Hello ${esc(name)},</p>
<p>You've used <strong>${usagePercent}%</strong> of your <strong>${esc(planName)}</strong> plan.</p>
<p>To keep enjoying all features without interruption, consider upgrading your plan.</p>`,
      ctaLabel: isFr ? "Voir les plans" : "View plans",
      ctaUrl: `${getBaseUrl()}/billing`,
      locale,
    }),
  });
}

export async function sendPasswordReset(
  to: string,
  name: string,
  resetUrl: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    toName: name,
    subject: isFr
      ? "Réinitialisation de votre mot de passe"
      : "Reset your password",
    htmlContent: buildEmailHtml({
      title: isFr ? "Mot de passe oublié" : "Forgot password",
      body: isFr
        ? `<p>Bonjour ${esc(name)},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
<p style="font-size:12px;color:#999;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Ce lien expire dans 1 heure.</p>`
        : `<p>Hello ${esc(name)},</p>
<p>You requested a password reset. Click the button below to choose a new password.</p>
<p style="font-size:12px;color:#999;">If you didn't request this, please ignore this email. This link expires in 1 hour.</p>`,
      ctaLabel: isFr
        ? "Réinitialiser mon mot de passe"
        : "Reset my password",
      ctaUrl: resetUrl,
      locale,
    }),
  });
}

export async function sendTeamInvite(
  to: string,
  inviterName: string,
  companyName: string,
  inviteUrl: string,
  locale: EmailLocale = "fr",
): Promise<EmailResult> {
  const isFr = locale === "fr";
  return sendEmail({
    to,
    subject: isFr
      ? `${inviterName} vous invite sur DiagOptim`
      : `${inviterName} invited you to DiagOptim`,
    htmlContent: buildEmailHtml({
      title: isFr ? "Invitation" : "Invitation",
      body: isFr
        ? `<p>Bonjour,</p>
<p><strong>${esc(inviterName)}</strong> vous invite à rejoindre l'équipe de <strong>${esc(companyName)}</strong> sur DiagOptim pour collaborer sur le diagnostic et l'optimisation de l'entreprise.</p>`
        : `<p>Hello,</p>
<p><strong>${esc(inviterName)}</strong> invites you to join the team at <strong>${esc(companyName)}</strong> on DiagOptim to collaborate on the company's diagnostic and optimization.</p>`,
      ctaLabel: isFr ? "Accepter l'invitation" : "Accept invitation",
      ctaUrl: inviteUrl,
      locale,
    }),
  });
}

// ---------------------------------------------------------------------------
// HTML email builder
// ---------------------------------------------------------------------------

interface EmailHtmlParams {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  locale: EmailLocale;
}

function buildEmailHtml(params: EmailHtmlParams): string {
  const { title, body, ctaLabel, ctaUrl, locale } = params;
  const isFr = locale === "fr";
  const footerText = isFr
    ? "Cet email a été envoyé par DiagOptim. Si vous n'êtes pas le destinataire prévu, veuillez ignorer ce message."
    : "This email was sent by DiagOptim. If you are not the intended recipient, please disregard this message.";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f4f4f7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:20px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1B4F72,#2E86C1);padding:30px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">${esc(title)}</h1>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:30px 40px;font-size:14px;line-height:1.6;color:#333;">
          ${body}
          <!-- CTA -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${esc(ctaUrl)}" style="display:inline-block;background:#27AE60;color:#ffffff;padding:14px 30px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
              ${esc(ctaLabel)}
            </a>
          </div>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f8f9fa;padding:20px 40px;text-align:center;font-size:11px;color:#999;">
          <p style="margin:0;">DiagOptim - ${isFr ? "Optimisez votre performance" : "Optimize your performance"}</p>
          <p style="margin:5px 0 0 0;">${footerText}</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://app.diagoptim.com";
}
