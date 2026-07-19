import { describe, it, expect, vi } from 'vitest';
import { createProject, listProjects } from '@/lib/scoping/service';

describe('scoping service', () => {
  it('createProject inserts a draft project owned by the user', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'p1' });
    const prisma = { scopingProject: { create } } as never;
    const r = await createProject(prisma, { userId: 'u1', companyId: 'c1', name: 'Boulangerie X', ownerType: 'consultant', requiredRespondents: 3 });
    expect(r).toEqual({ id: 'p1' });
    expect(create).toHaveBeenCalledWith({ data: { companyId: 'c1', name: 'Boulangerie X', ownerType: 'consultant', createdByUserId: 'u1', requiredRespondents: 3, status: 'draft' } });
  });
  it('listProjects returns projects the user created or owns via company', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'p1' }]);
    const prisma = { scopingProject: { findMany } } as never;
    const r = await listProjects(prisma, 'u1');
    expect(r).toEqual([{ id: 'p1' }]);
    const arg = findMany.mock.calls[0][0];
    expect(arg.where.OR).toEqual([{ createdByUserId: 'u1' }, { company: { userId: 'u1' } }]);
  });
});
