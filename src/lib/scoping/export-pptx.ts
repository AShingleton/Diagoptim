import pptxgen from "pptxgenjs";
import type { ScopingSynthesis } from "@/lib/ai/engine";

const M6: Record<string, string> = {
  man: "Main d'oeuvre", machine: "Machines", method: "Methodes",
  material: "Matieres", measurement: "Mesure", environment: "Milieu",
};

export async function synthesisToPptx(synth: ScopingSynthesis, projectName: string): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  const NAVY = "1B4F72";

  const cover = pptx.addSlide();
  cover.background = { color: "F4F7FA" };
  cover.addText("Cahier des charges", { x: 0.6, y: 2.2, w: 12, h: 1, fontSize: 40, bold: true, color: NAVY });
  cover.addText("Automatisation / agent IA - " + projectName, { x: 0.6, y: 3.3, w: 12, h: 0.6, fontSize: 20, color: "555555" });

  const content = (h: string, body: string) => {
    const s = pptx.addSlide();
    s.addText(h, { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 24, bold: true, color: NAVY });
    s.addText(body || "-", { x: 0.6, y: 1.4, w: 12, h: 5.6, fontSize: 15, color: "333333", valign: "top" });
  };
  const bullets = (h: string, items: string[]) => {
    const s = pptx.addSlide();
    s.addText(h, { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 24, bold: true, color: NAVY });
    const runs = items.length
      ? items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } }))
      : [{ text: "-" }];
    s.addText(runs, { x: 0.6, y: 1.4, w: 12, h: 5.6, fontSize: 15, color: "333333", valign: "top" });
  };

  content("Contexte (A3 - boite 1)", synth.a3.background);
  content("Probleme / etat actuel (A3 - boite 2)", synth.a3.problemStatement);
  content("Objectif cible (A3 - boite 3)", synth.a3.goal);
  content("Analyse des causes racines (A3 - boite 4)", synth.a3.rootCauseAnalysis);

  const ishikawaItems: string[] = [];
  for (const k of Object.keys(M6)) {
    const causes = (synth.ishikawa.causes as Record<string, string[]>)[k] ?? [];
    causes.forEach((c) => ishikawaItems.push(`${M6[k]} : ${c}`));
  }
  ishikawaItems.push(`>> Cause racine : ${synth.ishikawa.rootCause}`);
  bullets("Ishikawa 6M", ishikawaItems);

  const c = synth.cahierDesCharges;
  content("Perimetre fonctionnel", c.perimetre);
  bullets("Taches a automatiser (priorisees)", c.tachesAAutomatiser.map((t) => `${t.tache} - ${t.frequence} - priorite ${t.priorite}`));
  bullets("Cas d'usage agent IA", c.casUsageAgentIA.map((u) => `${u.processus} : ${u.usage}`));
  content("Donnees & integrations", c.donneesEtIntegrations);
  content("Contraintes & risques", c.contraintesEtRisques);
  bullets("Points de vue par role", c.pointsDeVueParRole.map((r) => `${r.role} : ${r.synthese}`));
  content("Priorisation & roadmap", c.priorisation);
  content("Criteres de recette", c.criteresDeRecette);

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
