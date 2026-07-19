import { describe, it, expect, vi } from 'vitest';
import * as engine from '@/lib/ai/engine';
import { runSynthesis, gatherRespondentData } from '@/lib/scoping/synthesis';

const SYNTH = {
  a3: { background: 'b', problemStatement: 'p', goal: 'g', rootCauseAnalysis: 'r' },
  ishikawa: {
    problem: 'pb',
    causes: { man: ['x'], machine: [], method: [], material: [], measurement: [], environment: [] },
    rootCause: 'rc',
  },
  cahierDesCharges: {
    contexte: 'c',
    perimetre: 'pe',
    tachesAAutomatiser: [],
    casUsageAgentIA: [],
    donneesEtIntegrations: 'd',
    contraintesEtRisques: 'cr',
    pointsDeVueParRole: [],
    priorisation: 'pr',
    criteresDeRecette: 'cd',
  },
};

type FakeStakeholder = {
  roleLabel: string;
  diagnostic: { status: string; answers: Array<{ questionText: string; category: string; answer: unknown }> } | null;
};

function prismaWith(respondentsCompleted: FakeStakeholder[]) {
  const project = { id: 'p1', name: 'Proj', company: { name: 'Boul' }, stakeholders: respondentsCompleted };
  return {
    scopingProject: {
      findUnique: vi.fn().mockResolvedValue(project),
      update: vi.fn().mockResolvedValue({}),
    },
    a3Report: { deleteMany: vi.fn().mockResolvedValue({}), create: vi.fn().mockResolvedValue({}) },
    ishikawaDiagram: { deleteMany: vi.fn().mockResolvedValue({}), create: vi.fn().mockResolvedValue({}) },
  };
}

describe('gatherRespondentData', () => {
  it('keeps only completed respondents and stringifies non-string answers', async () => {
    const prisma = prismaWith([
      {
        roleLabel: 'Vendeuse',
        diagnostic: { status: 'completed', answers: [{ questionText: 'q', category: 'man', answer: { a: 1 } }] },
      },
      { roleLabel: 'Gerant', diagnostic: { status: 'in_progress', answers: [] } },
      { roleLabel: 'Sans diag', diagnostic: null },
    ]);
    const r = await gatherRespondentData(prisma as never, 'p1');
    expect(r.projectName).toBe('Proj');
    expect(r.companyName).toBe('Boul');
    expect(r.respondents).toHaveLength(1);
    expect(r.respondents[0].role).toBe('Vendeuse');
    expect(r.respondents[0].answers[0].answer).toBe('{"a":1}');
  });

  it('throws when the project is not found', async () => {
    const prisma = prismaWith([]);
    prisma.scopingProject.findUnique.mockResolvedValueOnce(null);
    await expect(gatherRespondentData(prisma as never, 'nope')).rejects.toThrow();
  });
});

describe('runSynthesis', () => {
  it('gathers completed respondents and persists A3 + Ishikawa', async () => {
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue(JSON.stringify(SYNTH));
    const prisma = prismaWith([
      { roleLabel: 'Vendeuse', diagnostic: { status: 'completed', answers: [{ questionText: 'q', category: 'man', answer: 'a' }] } },
      { roleLabel: 'Gerant', diagnostic: { status: 'in_progress', answers: [] } },
    ]);
    const r = await runSynthesis(prisma as never, 'p1');
    expect(r.ishikawa.rootCause).toBe('rc');
    expect(prisma.a3Report.deleteMany).toHaveBeenCalledOnce();
    expect(prisma.ishikawaDiagram.deleteMany).toHaveBeenCalledOnce();
    expect(prisma.a3Report.create).toHaveBeenCalledOnce();
    expect(prisma.ishikawaDiagram.create).toHaveBeenCalledOnce();
    expect(prisma.scopingProject.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { status: 'synthesized' } });
  });

  it('throws when no completed respondent', async () => {
    vi.spyOn(engine.scopingAiDeps, 'chat').mockResolvedValue(JSON.stringify(SYNTH));
    const prisma = prismaWith([{ roleLabel: 'X', diagnostic: { status: 'in_progress', answers: [] } }]);
    await expect(runSynthesis(prisma as never, 'p1')).rejects.toThrow();
  });
});
