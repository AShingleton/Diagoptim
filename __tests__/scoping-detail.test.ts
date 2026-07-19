import { describe, it, expect, vi } from 'vitest';
import { addStakeholder, getProjectDetail, canManageProject } from '@/lib/scoping/service';

describe('addStakeholder', () => {
  it('creates a pending stakeholder', async () => {
    const create = vi.fn().mockResolvedValue({ id: 's1' });
    const prisma = { scopingStakeholder: { create } } as never;
    const r = await addStakeholder(prisma, { projectId: 'p1', fullName: 'Marie', email: 'marie@x.fr', roleLabel: 'Vendeuse' });
    expect(r).toEqual({ id: 's1' });
    expect(create).toHaveBeenCalledWith({ data: { projectId: 'p1', fullName: 'Marie', email: 'marie@x.fr', roleLabel: 'Vendeuse', hierarchyParentId: null, inviteStatus: 'pending' } });
  });
});

describe('canManageProject', () => {
  it('true for creator', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'p1' });
    const prisma = { scopingProject: { findFirst } } as never;
    expect(await canManageProject(prisma, 'p1', 'u1')).toBe(true);
  });
  it('false when none match', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const prisma = { scopingProject: { findFirst } } as never;
    expect(await canManageProject(prisma, 'p1', 'stranger')).toBe(false);
  });
});

describe('getProjectDetail', () => {
  it('computes completion from completed diagnostics', async () => {
    const project = {
      id: 'p1', name: 'Boulangerie', requiredRespondents: 2,
      stakeholders: [
        { id: 's1', diagnostic: { status: 'completed' } },
        { id: 's2', diagnostic: { status: 'in_progress' } },
        { id: 's3', diagnostic: null },
      ],
    };
    const findUnique = vi.fn().mockResolvedValue(project);
    const prisma = { scopingProject: { findUnique } } as never;
    const r = await getProjectDetail(prisma, 'p1');
    expect(r!.completion).toEqual({ completed: 1, required: 2, ready: false });
  });
});
