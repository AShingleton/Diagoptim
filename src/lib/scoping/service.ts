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

export interface AddStakeholderInput {
  projectId: string;
  fullName: string;
  email: string;
  roleLabel: string;
  hierarchyParentId?: string | null;
}

export async function addStakeholder(prisma: PrismaClient, input: AddStakeholderInput) {
  return prisma.scopingStakeholder.create({
    data: {
      projectId: input.projectId,
      fullName: input.fullName,
      email: input.email,
      roleLabel: input.roleLabel,
      hierarchyParentId: input.hierarchyParentId ?? null,
      inviteStatus: 'pending',
    },
  });
}

export async function canManageProject(prisma: PrismaClient, projectId: string, userId: string): Promise<boolean> {
  const p = await prisma.scopingProject.findFirst({
    where: { id: projectId, OR: [{ createdByUserId: userId }, { company: { userId } }] },
    select: { id: true },
  });
  return p !== null;
}

export async function getProjectDetail(prisma: PrismaClient, projectId: string) {
  const project = await prisma.scopingProject.findUnique({
    where: { id: projectId },
    include: {
      stakeholders: {
        orderBy: { createdAt: 'asc' },
        include: { hierarchyParent: { select: { id: true, fullName: true } }, diagnostic: { select: { status: true } } },
      },
    },
  });
  if (!project) return null;
  const completed = project.stakeholders.filter((s) => s.diagnostic?.status === 'completed').length;
  const required = project.requiredRespondents;
  return { ...project, completion: { completed, required, ready: completed >= required } };
}
