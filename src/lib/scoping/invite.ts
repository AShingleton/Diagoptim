import type { PrismaClient } from '@prisma/client';

export interface InviteDeps {
  prisma: PrismaClient;
  createOrGetUser: (email: string) => Promise<{ id: string; tempPassword: string | null }>;
  sendEmail: (params: { to: string; toName?: string; subject: string; htmlContent: string }) => Promise<unknown>;
  appUrl: string;
}

export async function inviteStakeholder(deps: InviteDeps, stakeholderId: string): Promise<{ status: string; diagnosticId: string }> {
  const { prisma } = deps;
  const stakeholder = await prisma.scopingStakeholder.findUnique({
    where: { id: stakeholderId },
    include: { project: { select: { name: true, companyId: true } } },
  });
  if (!stakeholder) throw new Error('Stakeholder not found');

  // Idempotent: already fully invited
  if (stakeholder.diagnosticId && stakeholder.inviteStatus !== 'pending') {
    return { status: stakeholder.inviteStatus, diagnosticId: stakeholder.diagnosticId };
  }

  const user = await deps.createOrGetUser(stakeholder.email);
  const diagnostic = await prisma.diagnostic.create({
    data: {
      companyId: stakeholder.project.companyId,
      type: 'automation_scoping',
      targetAmount: 0,
      targetType: 'cost_reduction',
      targetTimeMonths: 6,
      autonomyLevel: 'accompanied',
      currentPhase: 'framing',
      status: 'in_progress',
    },
  });
  await prisma.scopingStakeholder.update({
    where: { id: stakeholderId },
    data: { respondentUserId: user.id, diagnosticId: diagnostic.id, inviteStatus: 'invited' },
  });

  const link = `${deps.appUrl}/fr/scoping/respond/${diagnostic.id}`;
  const creds = user.tempPassword
    ? `<p>Identifiants : <b>${stakeholder.email}</b> / mot de passe : <b>${user.tempPassword}</b></p>`
    : '';
  await deps.sendEmail({
    to: stakeholder.email,
    toName: stakeholder.fullName,
    subject: `Votre avis sur le projet ${stakeholder.project.name}`,
    htmlContent: `<p>Bonjour ${stakeholder.fullName},</p><p>Vous etes invite(e) a partager votre point de vue pour le cadrage du projet <b>${stakeholder.project.name}</b>.</p>${creds}<p><a href="${link}">Demarrer (10-15 min)</a></p>`,
  });

  return { status: 'invited', diagnosticId: diagnostic.id };
}
