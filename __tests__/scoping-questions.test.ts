import { describe, it, expect } from 'vitest';
import { QUESTION_TREE } from '@/lib/diagnostic/decision-tree';

describe('scoping question set', () => {
  const qs = (QUESTION_TREE as Record<string, Array<{ id: string; phase: string; category: string; scoringWeight: number }>>).scoping;
  it('has 25-32 questions all on the scoping phase', () => {
    expect(qs.length).toBeGreaterThanOrEqual(25);
    expect(qs.length).toBeLessThanOrEqual(32);
    expect(qs.every((q) => q.phase === 'scoping')).toBe(true);
    expect(qs.every((q) => q.scoringWeight === 0)).toBe(true);
  });
  it('covers all six Ishikawa 6M categories', () => {
    const cats = new Set(qs.map((q) => q.category));
    for (const m of ['man', 'machine', 'method', 'material', 'measurement', 'environment']) {
      expect(cats.has(m)).toBe(true);
    }
  });
  it('has unique ids', () => {
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });
});
