import { describe, it, expect, vi } from 'vitest';
import { inviteStakeholder } from '@/lib/scoping/invite';

function deps(overrides: Record<string, unknown> = {}) {
  const prisma = {
    scopingStakeholder: {
      findUnique: vi.fn().mockResolvedValue({ id: 's1', email: 'marie@x.fr', fullName: 'Marie', inviteStatus: 'pending', diagnosticId: null, project: { name: 'Boulangerie', companyId: 'c1' } }),
      update: vi.fn().mockResolvedValue({}),
    },
    diagnostic: { create: vi.fn().mockResolvedValue({ id: 'd1' }) },
  };
  return { prisma, createOrGetUser: vi.fn().mockResolvedValue({ id: 'u1', tempPassword: 'TmpPw1!' }), sendEmail: vi.fn().mockResolvedValue({}), appUrl: 'https://diagnostic.embraceia.com', ...overrides } as never;
}

describe('inviteStakeholder', () => {
  it('creates account + diagnostic + sends email, sets invited', async () => {
    const d = deps();
    const r = await inviteStakeholder(d, 's1');
    expect(r).toEqual({ status: 'invited', diagnosticId: 'd1' });
    expect((d as any).prisma.diagnostic.create).toHaveBeenCalledOnce();
    expect((d as any).sendEmail).toHaveBeenCalledOnce();
    expect((d as any).prisma.scopingStakeholder.update).toHaveBeenCalledWith({ where: { id: 's1' }, data: { respondentUserId: 'u1', diagnosticId: 'd1', inviteStatus: 'invited' } });
  });
  it('is idempotent when already invited', async () => {
    const p = {
      scopingStakeholder: { findUnique: vi.fn().mockResolvedValue({ id: 's1', email: 'm@x.fr', fullName: 'M', inviteStatus: 'invited', diagnosticId: 'dExisting', project: { name: 'B', companyId: 'c1' } }), update: vi.fn() },
      diagnostic: { create: vi.fn() },
    };
    const d = deps({ prisma: p });
    const r = await inviteStakeholder(d, 's1');
    expect(r.diagnosticId).toBe('dExisting');
    expect((p as any).diagnostic.create).not.toHaveBeenCalled();
  });
});
