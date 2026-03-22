/**
 * GET /api/export/data
 * GDPR data export - all user data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user data in parallel
    const [
      user,
      companies,
      subscription,
      notifications,
      trainingProgress,
      supportPacks,
      teamMemberships,
      auditLogs,
      whiteLabelConfig,
      consultantClients,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          locale: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.company.findMany({
        where: { userId },
        include: {
          diagnostics: {
            include: {
              answers: true,
              insights: true,
              roadmap: { include: { actions: true } },
              vsmMaps: true,
              ishikawaDiagrams: true,
              a3Reports: true,
              swotAnalyses: true,
              steepleAnalyses: true,
              porterAnalyses: true,
              bcgMatrices: true,
              hoshinMatrices: true,
            },
          },
          documents: true,
        },
      }),
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userTrainingProgress.findMany({
        where: { userId },
        include: { training: { select: { title: true, type: true } } },
      }),
      prisma.supportPack.findMany({
        where: { userId },
        include: { sessions: true },
      }),
      prisma.teamMember.findMany({
        where: { userId },
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.whiteLabelConfig.findUnique({ where: { userId } }),
      prisma.consultantClient.findMany({
        where: { consultantId: userId },
        include: { company: { select: { id: true, name: true } } },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      subscription,
      companies,
      notifications,
      trainingProgress,
      supportPacks,
      teamMemberships,
      auditLogs,
      whiteLabelConfig,
      consultantClients,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="diagoptim-data-export-${userId}.json"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/export/data]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
