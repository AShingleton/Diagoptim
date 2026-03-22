/**
 * Notification scheduler (cron-like).
 *
 * Manages scheduled notifications with support for diagnostic reminders,
 * action due-date reminders, and re-diagnostic reminders. Uses an in-memory
 * queue with periodic processing. In production, jobs are processed
 * via the Supabase-backed job queue (see src/lib/jobs/processor.ts).
 *
 * @module notifications/scheduler
 */

import { sendEmail } from "./email";
import { sendPushNotification, hasSubscription } from "./push";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported notification channels. */
export type NotificationChannel = "email" | "push" | "both";

/** Status of a scheduled notification. */
export type ScheduledNotificationStatus = "pending" | "processing" | "sent" | "failed" | "cancelled";

/** A scheduled notification entry. */
export interface ScheduledNotification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string;
  url?: string;
  emailTemplate?: string;
  emailData?: Record<string, string>;
  scheduledAt: Date;
  status: ScheduledNotificationStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  lastAttemptAt: Date | null;
  error: string | null;
}

/** Options for scheduling a notification. */
export interface ScheduleOptions {
  userId: string;
  channel?: NotificationChannel;
  type: string;
  title: string;
  body: string;
  url?: string;
  emailTemplate?: string;
  emailData?: Record<string, string>;
  delayMs: number;
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// In-memory queue (replace with persistent store in production)
// ---------------------------------------------------------------------------

const notificationQueue: Map<string, ScheduledNotification> = new Map();
let processingInterval: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Schedules a notification for future delivery.
 *
 * @param options - The scheduling options including user, channel, content, and delay.
 * @returns The scheduled notification record.
 */
export async function scheduleNotification(options: ScheduleOptions): Promise<ScheduledNotification> {
  const id = generateId();
  const notification: ScheduledNotification = {
    id,
    userId: options.userId,
    channel: options.channel ?? "email",
    type: options.type,
    title: options.title,
    body: options.body,
    url: options.url,
    emailTemplate: options.emailTemplate,
    emailData: options.emailData,
    scheduledAt: new Date(Date.now() + options.delayMs),
    status: "pending",
    retryCount: 0,
    maxRetries: options.maxRetries ?? 3,
    createdAt: new Date(),
    lastAttemptAt: null,
    error: null,
  };

  notificationQueue.set(id, notification);
  return notification;
}

/**
 * Processes all scheduled notifications that are due.
 *
 * Iterates over pending notifications whose `scheduledAt` time has passed,
 * attempts delivery via the configured channel, and updates status accordingly.
 *
 * @returns The number of notifications processed.
 */
export async function processScheduledNotifications(): Promise<number> {
  const now = new Date();
  let processedCount = 0;

  for (const [_id, notification] of notificationQueue.entries()) {
    if (notification.status !== "pending") {
      continue;
    }

    if (notification.scheduledAt > now) {
      continue;
    }

    notification.status = "processing";
    notification.lastAttemptAt = now;

    try {
      await deliverNotification(notification);
      notification.status = "sent";
      processedCount++;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      notification.error = errorMessage;
      notification.retryCount++;

      if (notification.retryCount >= notification.maxRetries) {
        notification.status = "failed";
      } else {
        // Exponential backoff: 1min, 4min, 9min, ...
        const backoffMs = Math.pow(notification.retryCount, 2) * 60_000;
        notification.scheduledAt = new Date(Date.now() + backoffMs);
        notification.status = "pending";
      }
    }
  }

  // Clean up old sent/failed notifications (older than 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  for (const [id, notification] of notificationQueue.entries()) {
    if (
      (notification.status === "sent" || notification.status === "failed") &&
      notification.createdAt < sevenDaysAgo
    ) {
      notificationQueue.delete(id);
    }
  }

  return processedCount;
}

/**
 * Schedules a reminder for an incomplete diagnostic.
 *
 * @param userId       - The user to remind.
 * @param diagnosticId - The diagnostic ID.
 * @param delayMs      - Delay in milliseconds before sending.
 */
export async function scheduleDiagnosticReminder(
  userId: string,
  diagnosticId: string,
  delayMs: number,
): Promise<void> {
  await scheduleNotification({
    userId,
    channel: "both",
    type: "diagnostic_reminder",
    title: "Continuez votre diagnostic",
    body: "Vous avez un diagnostic en cours. Reprenez-le pour obtenir votre analyse complète.",
    url: `/diagnostic/${diagnosticId}`,
    emailTemplate: "diagnostic_reminder",
    emailData: {
      diagnosticId,
      diagnosticUrl: `${getBaseUrl()}/diagnostic/${diagnosticId}`,
    },
    delayMs,
  });
}

/**
 * Schedules action due-date reminders for all actions in a roadmap.
 *
 * Creates a reminder 3 days before each action's due date.
 *
 * @param roadmapId - The roadmap ID whose actions to schedule reminders for.
 */
export async function scheduleActionReminders(roadmapId: string): Promise<void> {
  // In production, fetch actions from database by roadmapId
  // For now, this is a placeholder that demonstrates the scheduling pattern
  const REMINDER_LEAD_TIME_MS = 3 * 24 * 60 * 60 * 1000; // 3 days before due date

  // Placeholder: in production, iterate over actual roadmap actions
  // const actions = await fetchRoadmapActions(roadmapId);
  // for (const action of actions) {
  //   if (action.dueDate) {
  //     const dueDate = new Date(action.dueDate);
  //     const reminderDate = new Date(dueDate.getTime() - REMINDER_LEAD_TIME_MS);
  //     const delayMs = Math.max(0, reminderDate.getTime() - Date.now());
  //     await scheduleNotification({
  //       userId: action.assignedTo ?? "",
  //       channel: "both",
  //       type: "action_due_reminder",
  //       title: `Action à réaliser : ${action.title}`,
  //       body: `L'action "${action.title}" arrive à échéance le ${action.dueDate}.`,
  //       url: `/roadmap`,
  //       emailTemplate: "action_due_reminder",
  //       emailData: { actionTitle: action.title, dueDate: action.dueDate },
  //       delayMs,
  //     });
  //   }
  // }

  void roadmapId;
  void REMINDER_LEAD_TIME_MS;
}

/**
 * Schedules a re-diagnostic reminder to be sent after a specified number of months.
 *
 * @param userId - The user to remind.
 * @param months - Number of months from now to send the reminder.
 */
export async function scheduleRediagnosticReminder(
  userId: string,
  months: number,
): Promise<void> {
  const delayMs = months * 30 * 24 * 60 * 60 * 1000; // Approximate months in ms

  await scheduleNotification({
    userId,
    channel: "email",
    type: "rediagnostic_reminder",
    title: "Temps pour un nouveau diagnostic",
    body: `Cela fait ${months} mois depuis votre dernier diagnostic. Lancez-en un nouveau pour mesurer vos progrès.`,
    url: "/diagnostic/new",
    emailTemplate: "rediagnostic_reminder",
    emailData: {
      monthsSince: `${months}`,
      diagnosticUrl: `${getBaseUrl()}/diagnostic/new`,
    },
    delayMs,
  });
}

/**
 * Cancels a scheduled notification by its ID.
 *
 * @param notificationId - The notification ID to cancel.
 * @returns `true` if the notification was found and cancelled.
 */
export function cancelNotification(notificationId: string): boolean {
  const notification = notificationQueue.get(notificationId);
  if (!notification || notification.status !== "pending") {
    return false;
  }
  notification.status = "cancelled";
  return true;
}

/**
 * Starts the periodic notification processor.
 *
 * @param intervalMs - Processing interval in milliseconds (default: 60000 = 1 minute).
 */
export function startScheduler(intervalMs: number = 60_000): void {
  if (processingInterval) {
    return; // Already running
  }
  processingInterval = setInterval(() => {
    void processScheduledNotifications();
  }, intervalMs);
}

/**
 * Stops the periodic notification processor.
 */
export function stopScheduler(): void {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
  }
}

/**
 * Returns all pending notifications for a user.
 *
 * @param userId - The user ID to query.
 * @returns Array of pending scheduled notifications.
 */
export function getPendingNotifications(userId: string): ScheduledNotification[] {
  const results: ScheduledNotification[] = [];
  for (const notification of notificationQueue.values()) {
    if (notification.userId === userId && notification.status === "pending") {
      results.push(notification);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Internal delivery
// ---------------------------------------------------------------------------

async function deliverNotification(notification: ScheduledNotification): Promise<void> {
  const { channel, userId, title, body, url, emailTemplate, emailData: _emailData } = notification;

  if (channel === "email" || channel === "both") {
    if (emailTemplate) {
      await sendEmail({
        to: userId,
        subject: title,
        htmlContent: body,
      });
    }
  }

  if (channel === "push" || channel === "both") {
    if (hasSubscription(userId)) {
      await sendPushNotification(userId, title, body, url);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://app.diagoptim.com";
}
