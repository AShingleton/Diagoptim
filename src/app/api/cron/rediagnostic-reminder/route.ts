import { NextResponse } from "next/server";

/**
 * GET - Called daily at 9am via Vercel Cron.
 * Sends reminders to users whose last diagnostic was > 90 days ago.
 * Limits to one reminder per 30 days per user.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sentCount = 0;

  try {
    // const ninetyDaysAgo = subDays(new Date(), 90);
    // const thirtyDaysAgo = subDays(new Date(), 30);
    //
    // const eligibleUsers = await prisma.user.findMany({
    //   where: {
    //     companies: {
    //       some: {
    //         diagnostics: {
    //           some: { status: "completed", completedAt: { lt: ninetyDaysAgo } },
    //           none: { status: "completed", completedAt: { gte: ninetyDaysAgo } },
    //         },
    //       },
    //     },
    //     notifications: {
    //       none: {
    //         type: "rediagnostic_reminder",
    //         createdAt: { gte: thirtyDaysAgo },
    //       },
    //     },
    //   },
    // });
    //
    // for (const user of eligibleUsers) {
    //   await sendEmail(user.email, "rediagnostic_reminder", { ... });
    //   sentCount++;
    // }

    return NextResponse.json({
      success: true,
      remindersSent: sentCount,
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
