import { jsPDF } from "jspdf";
import type { ScopingSynthesis } from "@/lib/ai/engine";

const M6: Record<string, string> = {
  man: "Main d'oeuvre", machine: "Machines", method: "Methodes",
  material: "Matieres", measurement: "Mesure", environment: "Milieu",
};

export function synthesisToPdf(synth: ScopingSynthesis, projectName: string): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;
  const ensure = (space: number) => { if (y + space > pageH - margin) { doc.addPage(); y = margin; } };
  const heading = (text: string, size = 13) => {
    ensure(size + 18); doc.setFont("helvetica", "bold"); doc.setFontSize(size);
    doc.setTextColor(27, 79, 114); doc.text(text, margin, y); y += size + 6; doc.setTextColor(40, 40, 40);
  };
  const para = (text: string) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    for (const line of doc.splitTextToSize(text || "-", width)) { ensure(14); doc.text(line, margin, y); y += 14; }
    y += 6;
  };
  const bullet = (text: string) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const lines = doc.splitTextToSize("- " + text, width - 8);
    lines.forEach((line: string, i: number) => { ensure(14); doc.text(line, margin + (i === 0 ? 0 : 8), y); y += 14; });
  };

  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(27, 79, 114);
  doc.text("Cahier des charges", margin, y); y += 22;
  doc.setFontSize(12); doc.setTextColor(100, 100, 100); doc.text(projectName, margin, y); y += 22;
  doc.setTextColor(40, 40, 40);

  heading("A3 . Contexte"); para(synth.a3.background);
  heading("A3 . Probleme / etat actuel"); para(synth.a3.problemStatement);
  heading("A3 . Objectif cible"); para(synth.a3.goal);
  heading("A3 . Analyse des causes racines"); para(synth.a3.rootCauseAnalysis);

  heading("Ishikawa 6M - " + synth.ishikawa.problem, 12);
  for (const k of Object.keys(M6)) {
    const causes = (synth.ishikawa.causes as Record<string, string[]>)[k] ?? [];
    if (causes.length) { heading(M6[k], 11); causes.forEach(bullet); y += 4; }
  }
  para("Cause racine : " + synth.ishikawa.rootCause);

  const c = synth.cahierDesCharges;
  heading("Contexte & objectifs"); para(c.contexte);
  heading("Perimetre fonctionnel"); para(c.perimetre);
  heading("Taches a automatiser (priorisees)");
  c.tachesAAutomatiser.forEach((t) => bullet(`${t.tache} - ${t.frequence} - priorite ${t.priorite}`));
  y += 4;
  heading("Cas d'usage agent IA");
  c.casUsageAgentIA.forEach((u) => bullet(`${u.processus} : ${u.usage} (causes traitees : ${u.causesTraitees})`));
  y += 4;
  heading("Donnees & integrations"); para(c.donneesEtIntegrations);
  heading("Contraintes & risques"); para(c.contraintesEtRisques);
  heading("Points de vue par role");
  c.pointsDeVueParRole.forEach((r) => bullet(`${r.role} : ${r.synthese}`));
  y += 4;
  heading("Priorisation & roadmap"); para(c.priorisation);
  heading("Criteres de recette"); para(c.criteresDeRecette);

  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}
