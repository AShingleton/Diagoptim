/**
 * PUT /api/notifications/preferences
 * Update notification preferences.
 *
 * Stores preferences as user metadata since there is no dedicated
 * NotificationPreferences model. Uses the AuditLog table for persistence
 * of the latest preference snapshot.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const channelPrefSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
});

const preferencesSchema = z.object({
  diagnosticReminder: channelPrefSchema,
  actionDue: channelPrefSchema,
  milestone: channelPrefSchema,
  trainingNew: channelPrefSchema,
  rediagnostic: channelPrefSchema,
});

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Store preferences as an audit log entry for now
    // TODO: Create a dedicated NotificationPreference model
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'update_notification_preferences',
        resource: 'notification_preferences',
        details: JSON.parse(JSON.stringify(parsed.data)),
      },
    });

    return NextResponse.json({ data: parsed.data });
  } catch (error) {
    console.error('[PUT /api/notifications/preferences]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
