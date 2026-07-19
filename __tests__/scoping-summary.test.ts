import { describe, it, expect, vi } from 'vitest';
import * as engine from '@/lib/ai/engine';

describe('summarizeRespondentViewpoint', () => {
  it('parses summary + painPoints from the model', async () => {
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue(
      '{"summary":"Le boulanger passe trop de temps sur les commandes.","painPoints":[{"text":"Ressaisie des commandes","category":"material"}]}'
    );
    const r = await engine.summarizeRespondentViewpoint(
      [{ questionTextFr: 'q', category: 'material', answer: 'je ressaisis les commandes' }],
      'boulangerie'
    );
    expect(r.summary).toContain('commandes');
    expect(r.painPoints).toHaveLength(1);
    expect(r.painPoints[0].category).toBe('material');
  });
  it('defaults painPoints to [] when absent', async () => {
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue('{"summary":"Rien de particulier."}');
    const r = await engine.summarizeRespondentViewpoint([], 'boulangerie');
    expect(r.painPoints).toEqual([]);
  });
});
