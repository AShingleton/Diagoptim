import type { PrismaClient } from '@prisma/client';

/**
 * A user may access a diagnostic if they own the company OR they are the
 * assigned scoping respondent (ScopingStakeholder.respondentUserId) for it.
 */
export async function canAccessDiagnostic(
  prisma: PrismaClient,
  diagnosticId: string,
  userId: string,
): Promise<boolean> {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    include: { company: { select: { userId: true } } },
  });
  if (!diagnostic) return false;
  if (diagnostic.company.userId === userId) return true;

  const stakeholder = await prisma.scopingStakeholder.findFirst({
    where: { diagnosticId, respondentUserId: userId },
    select: { id: true },
  });
  return stakeholder !== null;
}
