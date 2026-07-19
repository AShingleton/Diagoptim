import { describe, it, expect } from 'vitest';
import { getPhasesForType, QUESTION_TREE } from '@/lib/diagnostic/decision-tree';

describe('automation_scoping diagnostic type', () => {
  it('returns the scoping phase sequence', () => {
    expect(getPhasesForType('automation_scoping')).toEqual([
      'scoping', 'recommendations',
    ]);
  });

  it('exposes a scoping key in the question tree', () => {
    expect(QUESTION_TREE).toHaveProperty('scoping');
    expect(Array.isArray((QUESTION_TREE as Record<string, unknown[]>).scoping)).toBe(true);
  });
});
