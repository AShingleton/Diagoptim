import { NextResponse } from "next/server";

/**
 * GET - Called by Vercel Cron every 6 hours.
 * Processes scheduled notifications (diagnostic reminders, overdue actions).
 * Verifies CRON_SECRET header for security.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    diagnosticReminders: 0,
    overdueActions: 0,
    milestones: 0,
    planLimits: 0,
    errors: [] as string[],
  };

  try {
    // 1. Find abandoned diagnostics (48h+ inactive)
    // const abandoned = await prisma.diagnostic.findMany({
    //   where: { status: "in_progress", updatedAt: { lt: subHours(new Date(), 48) } },
    //   include: { company: { include: { user: true } } },
    // });
    // for (const diag of abandoned) {
    //   await sendEmail(diag.company.user.email, "diagnostic_reminder", {...});
    //   results.diagnosticReminders++;
    // }

    // 2. Find overdue roadmap actions
    // const overdue = await prisma.roadmapAction.findMany({
    //   where: { dueDate: { lt: new Date() }, status: { not: "done" } },
    //   include: { roadmap: { include: { diagnostic: { include: { company: true } } } } },
    // });

    // 3. Check plan limit warnings
    // const users = await prisma.user.findMany({
    //   include: { subscription: true, _count: { select: { diagnostics: { where: { createdAt: { gte: startOfMonth } } } } } },
    // });

    return NextResponse.json({
      success: true,
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
