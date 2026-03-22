/**
 * Notification rules configuration.
 *
 * Defines all automated notification triggers, conditions, channels,
 * and templates (FR/EN). Used by the cron API routes and job processor.
 *
 * @module notifications/rules
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationChannel = "email" | "push" | "in_app";

export interface NotificationTemplate {
  fr: { title: string; body: string };
  en: { title: string; body: string };
}

export interface NotificationRule {
  trigger: string;
  condition: string;
  channels: NotificationChannel[];
  template: NotificationTemplate;
  maxFrequency?: string;
  celebrationAnimation?: boolean;
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export const NOTIFICATION_RULES: NotificationRule[] = [
  {
    trigger: "diagnostic_abandoned",
    condition: 'diagnostic.status === "in_progress" && lastActivity > 48h',
    channels: ["email", "push"],
    template: {
      fr: {
        title: "Votre diagnostic vous attend !",
        body: "Vous étiez à {progress}%. Reprenez en 5 minutes.",
      },
      en: {
        title: "Your diagnostic awaits!",
        body: "You were at {progress}%. Resume in 5 minutes.",
      },
    },
    maxFrequency: "72h",
  },
  {
    trigger: "action_overdue",
    condition: 'roadmapAction.dueDate < now() && roadmapAction.status !== "done"',
    channels: ["email", "push", "in_app"],
    template: {
      fr: {
        title: "Action en retard",
        body: 'L\'action "{actionTitle}" devait être terminée le {dueDate}. Besoin d\'aide ?',
      },
      en: {
        title: "Overdue action",
        body: 'Action "{actionTitle}" was due on {dueDate}. Need help?',
      },
    },
    maxFrequency: "7d",
  },
  {
    trigger: "milestone_reached",
    condition: "completedActionsCount % 3 === 0",
    channels: ["push", "in_app"],
    template: {
      fr: {
        title: "Bravo !",
        body: "Vous avez complété {count} actions ! Gains estimés : +{gains}€",
      },
      en: {
        title: "Congrats!",
        body: "You completed {count} actions! Estimated gains: +{gains}€",
      },
    },
    celebrationAnimation: true,
  },
  {
    trigger: "rediagnostic_reminder",
    condition: "lastDiagnostic.completedAt < now() - 90d",
    channels: ["email"],
    template: {
      fr: {
        title: "3 mois depuis votre dernier diagnostic",
        body: "Il est temps de mesurer vos progrès ! Lancez un nouveau diagnostic.",
      },
      en: {
        title: "3 months since your last diagnostic",
        body: "Time to measure your progress! Start a new diagnostic.",
      },
    },
    maxFrequency: "30d",
  },
  {
    trigger: "weekly_summary",
    condition: "dayOfWeek === 1 && user.hasActiveSubscription",
    channels: ["email"],
    template: {
      fr: {
        title: "Votre résumé hebdomadaire DiagOptim",
        body: "Voici un récapitulatif de votre semaine : {summary}",
      },
      en: {
        title: "Your weekly DiagOptim summary",
        body: "Here is your weekly recap: {summary}",
      },
    },
  },
  {
    trigger: "plan_limit_approaching",
    condition: "usage.diagnosticsThisMonth >= plan.diagnosticsPerMonth * 0.8",
    channels: ["in_app"],
    template: {
      fr: {
        title: "Vous approchez de votre limite",
        body: "Il vous reste {remaining} diagnostic(s) ce mois. Passez au plan supérieur pour continuer.",
      },
      en: {
        title: "Approaching your limit",
        body: "You have {remaining} diagnostic(s) left this month. Upgrade to continue.",
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Template interpolation helper
// ---------------------------------------------------------------------------

/**
 * Replaces `{key}` placeholders in a template string with values from data.
 */
export function interpolateTemplate(
  template: string,
  data: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    data[key] !== undefined ? String(data[key]) : `{${key}}`,
  );
}
