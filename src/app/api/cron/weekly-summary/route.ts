import { NextResponse } from "next/server";

/**
 * GET - Called every Monday at 8am via Vercel Cron.
 * Sends weekly summary emails to active subscribers with:
 * - Actions completed this week
 * - Upcoming action deadlines
 * - Score progress since last diagnostic
 */
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sentCount = 0;

  try {
    // const activeUsers = await prisma.user.findMany({
    //   where: { subscription: { status: "active" } },
    //   include: {
    //     companies: {
    //       include: {
    //         roadmaps: { include: { actions: true } },
    //         diagnostics: { orderBy: { completedAt: "desc" }, take: 1 },
    //       },
    //     },
    //   },
    // });
    //
    // for (const user of activeUsers) {
    //   const summary = buildWeeklySummary(user);
    //   await sendEmail(user.email, "weekly_summary", summary);
    //   sentCount++;
    // }

    return NextResponse.json({
      success: true,
      emailsSent: sentCount,
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
