import type { PrismaClient } from "@prisma/client";
import { generateScopingSynthesis, type RespondentBundle, type ScopingSynthesis } from "@/lib/ai/engine";

/** Gathers each COMPLETED respondent's scoping answers, grouped by role. */
export async function gatherRespondentData(
  prisma: PrismaClient,
  projectId: string,
): Promise<{ projectName: string; companyName: string; respondents: RespondentBundle[] }> {
  const project = await prisma.scopingProject.findUnique({
    where: { id: projectId },
    include: {
      company: { select: { name: true } },
      stakeholders: {
        include: { diagnostic: { include: { answers: { where: { phase: "scoping" } } } } },
      },
    },
  });
  if (!project) throw new Error("Projet introuvable");
  const respondents: RespondentBundle[] = [];
  for (const s of project.stakeholders) {
    if (s.diagnostic?.status !== "completed") continue;
    respondents.push({
      role: s.roleLabel,
      answers: s.diagnostic.answers.map((a) => ({
        question: a.questionText,
        category: a.category,
        answer: typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer),
      })),
    });
  }
  return { projectName: project.name, companyName: project.company.name, respondents };
}

/** Runs the full synthesis and persists A3 + Ishikawa at project level; marks status. */
export async function runSynthesis(
  prisma: PrismaClient,
  projectId: string,
): Promise<ScopingSynthesis> {
  const { projectName, companyName, respondents } = await gatherRespondentData(prisma, projectId);
  if (respondents.length === 0) throw new Error("Aucun avis recueilli pour la synthese");
  const synthesis = await generateScopingSynthesis(projectName, companyName, respondents);

  // Replace any prior synthesis for this project (idempotent re-run)
  await prisma.a3Report.deleteMany({ where: { scopingProjectId: projectId } });
  await prisma.ishikawaDiagram.deleteMany({ where: { scopingProjectId: projectId } });

  await prisma.a3Report.create({
    data: {
      scopingProjectId: projectId,
      background: synthesis.a3.background,
      problemStatement: synthesis.a3.problemStatement,
      goal: synthesis.a3.goal,
      rootCauseAnalysis: synthesis.a3.rootCauseAnalysis,
      countermeasures: synthesis.cahierDesCharges as unknown as object,
      implementationPlan: { priorisation: synthesis.cahierDesCharges.priorisation, taches: synthesis.cahierDesCharges.tachesAAutomatiser } as unknown as object,
      followUp: { criteres: synthesis.cahierDesCharges.criteresDeRecette, strategic: synthesis.strategic ?? null, automatisation: synthesis.automatisation ?? null, kpis: synthesis.kpis ?? null } as unknown as object,
    },
  });
  await prisma.ishikawaDiagram.create({
    data: {
      scopingProjectId: projectId,
      problem: synthesis.ishikawa.problem,
      causes: synthesis.ishikawa.causes as unknown as object,
      rootCause: synthesis.ishikawa.rootCause,
      prioritizedCauses: [] as unknown as object,
    },
  });
  // Persist the SBS value stream + Hoshin objective on the project when present.
  await prisma.scopingProject.update({
    where: { id: projectId },
    data: {
      status: "synthesized",
      ...(synthesis.strategic?.sbs?.valueStream ? { valueStream: synthesis.strategic.sbs.valueStream } : {}),
      ...(synthesis.strategic?.hoshin?.objective ? { strategicObjective: synthesis.strategic.hoshin.objective } : {}),
    },
  });
  return synthesis;
}

/** Reads back the stored synthesis for display (from A3Report.countermeasures). */
export async function getStoredSynthesis(prisma: PrismaClient, projectId: string): Promise<ScopingSynthesis | null> {
  const a3 = await prisma.a3Report.findFirst({ where: { scopingProjectId: projectId }, orderBy: { createdAt: "desc" } });
  const ishikawa = await prisma.ishikawaDiagram.findFirst({ where: { scopingProjectId: projectId }, orderBy: { createdAt: "desc" } });
  if (!a3 || !ishikawa) return null;
  const cdc = a3.countermeasures as unknown as ScopingSynthesis["cahierDesCharges"];
  const followUp = (a3.followUp ?? {}) as { strategic?: ScopingSynthesis["strategic"]; automatisation?: ScopingSynthesis["automatisation"]; kpis?: ScopingSynthesis["kpis"] };
  const strategic = followUp.strategic ?? undefined;
  const automatisation = followUp.automatisation ?? undefined;
  const kpis = followUp.kpis ?? undefined;
  return {
    a3: { background: a3.background, problemStatement: a3.problemStatement, goal: a3.goal, rootCauseAnalysis: a3.rootCauseAnalysis },
    ishikawa: { problem: ishikawa.problem, causes: ishikawa.causes as unknown as ScopingSynthesis["ishikawa"]["causes"], rootCause: ishikawa.rootCause },
    cahierDesCharges: cdc,
    ...(strategic ? { strategic } : {}),
    ...(automatisation ? { automatisation } : {}),
    ...(kpis ? { kpis } : {}),
  };
}
