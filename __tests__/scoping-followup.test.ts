import { describe, it, expect, vi, afterEach } from 'vitest';
import * as engine from '@/lib/ai/engine';

describe('generateScopingFollowUp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a follow-up when the model provides one', async () => {
    // Hermetic: stub the AI call so no real network request is made.
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue(
      '{"followUp":"Combien de fois par semaine ?"}',
    );

    const r = await engine.generateScopingFollowUp({
      questionTextFr: 'q',
      category: 'method',
      answer: 'je ressaisis les commandes a la main chaque jour',
    });

    expect(r.followUp).toBe('Combien de fois par semaine ?');
  });

  it('returns null when the model returns null', async () => {
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue('{"followUp":null}');

    const r = await engine.generateScopingFollowUp({
      questionTextFr: 'q',
      category: 'man',
      answer: 'rien de particulier',
    });

    expect(r.followUp).toBeNull();
  });

  it('strips markdown fences and passes options through to chat', async () => {
    const spy = vi
      .spyOn(engine.scopingAiDeps, 'chat')
      .mockResolvedValue('```json\n{"followUp":"Depuis quand ?"}\n```');

    const r = await engine.generateScopingFollowUp({
      questionTextFr: 'Comment gerez-vous les commandes ?',
      category: 'material',
      answer: 'on perd du temps a re-saisir chaque bon de commande manuellement',
      sector: 'construction',
    });

    expect(r.followUp).toBe('Depuis quand ?');
    expect(spy).toHaveBeenCalledTimes(1);
    const [, messages, options] = spy.mock.calls[0];
    expect(messages).toEqual([
      { role: 'user', content: expect.stringContaining('construction') },
    ]);
    expect(options).toMatchObject({ temperature: 0.4, maxTokens: 256 });
  });

  it('coerces a missing followUp field to null', async () => {
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue('{}');

    const r = await engine.generateScopingFollowUp({
      questionTextFr: 'q',
      category: 'measurement',
      answer: 'aucune mesure particuliere en place aujourd hui',
    });

    expect(r.followUp).toBeNull();
  });
});
