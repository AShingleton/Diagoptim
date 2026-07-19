import { describe, it, expect, vi } from 'vitest';
import { canAccessDiagnostic } from '@/lib/diagnostic/access';

function mkPrisma(diag: unknown, stakeholder: unknown) {
  return {
    diagnostic: { findUnique: vi.fn().mockResolvedValue(diag) },
    scopingStakeholder: { findFirst: vi.fn().mockResolvedValue(stakeholder) },
  } as never;
}

describe('canAccessDiagnostic', () => {
  it('allows the company owner', async () => {
    const p = mkPrisma({ id: 'd1', company: { userId: 'u1' } }, null);
    expect(await canAccessDiagnostic(p, 'd1', 'u1')).toBe(true);
  });
  it('allows a stakeholder respondent on their own diagnostic', async () => {
    const p = mkPrisma({ id: 'd1', company: { userId: 'owner' } }, { id: 's1' });
    expect(await canAccessDiagnostic(p, 'd1', 'u2')).toBe(true);
  });
  it('denies an unrelated user', async () => {
    const p = mkPrisma({ id: 'd1', company: { userId: 'owner' } }, null);
    expect(await canAccessDiagnostic(p, 'd1', 'stranger')).toBe(false);
  });
  it('returns false when the diagnostic is missing', async () => {
    const p = mkPrisma(null, null);
    expect(await canAccessDiagnostic(p, 'dX', 'u1')).toBe(false);
  });
});
