import type { PrismaClient } from '@prisma/client';

export interface CreateProjectInput {
  userId: string;
  companyId: string;
  name: string;
  ownerType: 'consultant' | 'client_lead';
  requiredRespondents: number;
}

export async function createProject(prisma: PrismaClient, input: CreateProjectInput) {
  return prisma.scopingProject.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      ownerType: input.ownerType,
      createdByUserId: input.userId,
      requiredRespondents: input.requiredRespondents,
      status: 'draft',
    },
  });
}

export async function listProjects(prisma: PrismaClient, userId: string) {
  return prisma.scopingProject.findMany({
    where: { OR: [{ createdByUserId: userId }, { company: { userId } }] },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { stakeholders: true } } },
  });
}
