import { jsPDF } from "jspdf";
import { parseEnumeration } from "@/lib/scoping/format";
import type { ScopingSynthesis } from "@/lib/ai/engine";

const M6: Record<string, string> = {
  man: "Main d'oeuvre",
  machine: "Machines",
  method: "Methodes",
  material: "Matieres",
  measurement: "Mesure",
  environment: "Milieu",
};

const NAVY: [number, number, number] = [27, 79, 114];
const GREY: [number, number, number] = [100, 100, 100];
const BODY: [number, number, number] = [45, 45, 45];

const BODY_SIZE = 10.5;
const LINE_H = 15;

export function synthesisToPdf(synth: ScopingSynthesis, projectName: string): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;

  // Adds a page when the requested vertical space would overflow the bottom margin.
  const ensure = (space: number) => {
    if (y + space > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 13) => {
    y += 10; // ~10pt space above every section
    ensure(size + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...NAVY);
    doc.text(text, margin, y);
    y += 4;
    // short accent underline (40pt wide) under the heading
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 40, y);
    y += 10;
    doc.setTextColor(...BODY);
  };

  const subHeading = (text: string) => {
    y += 4;
    ensure(LINE_H + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...NAVY);
    doc.text(text, margin, y);
    y += LINE_H;
    doc.setTextColor(...BODY);
  };

  const paragraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...BODY);
    for (const line of doc.splitTextToSize(text || "-", width)) {
      ensure(LINE_H);
      doc.text(line, margin, y);
      y += LINE_H;
    }
    y += 4;
  };

  // Bullet with a hanging indent: the marker sits at margin+14, the text (and
  // every wrapped continuation line) aligns at textX.
  const bullet = (text: string) => {
    const markerX = margin + 14;
    const textX = markerX + 12;
    const wrapW = width - (textX - margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...BODY);
    const lines = doc.splitTextToSize(text || "-", wrapW);
    lines.forEach((line: string, i: number) => {
      ensure(LINE_H);
      if (i === 0) doc.text("•", markerX, y);
      doc.text(line, textX, y);
      y += LINE_H;
    });
  };

  // Reusable prose renderer: converts an inline "(1)…(2)…" enumeration into
  // proper bullets (intro as a paragraph, each item as a bullet); otherwise
  // renders a wrapped paragraph.
  const prose = (text: string) => {
    const parsed = parseEnumeration(text);
    if (parsed && parsed.items.length) {
      if (parsed.intro) paragraph(parsed.intro);
      parsed.items.forEach(bullet);
      y += 4;
    } else {
      paragraph(text);
    }
  };

  // --- Title block ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text("Cahier des charges", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...GREY);
  doc.text(projectName, margin, y);
  y += 14;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  doc.setTextColor(...BODY);

  // --- A3 ---
  heading("A3 - Contexte");
  prose(synth.a3.background);
  heading("A3 - Probleme / etat actuel");
  prose(synth.a3.problemStatement);
  heading("A3 - Objectif cible");
  prose(synth.a3.goal);
  heading("A3 - Analyse des causes racines");
  prose(synth.a3.rootCauseAnalysis);

  // --- Ishikawa 6M ---
  heading("Ishikawa 6M - " + synth.ishikawa.problem, 12);
  const causes = synth.ishikawa.causes as Record<string, string[]>;
  for (const k of Object.keys(M6)) {
    const list = causes[k] ?? [];
    if (list.length) {
      subHeading(M6[k]);
      list.forEach(bullet);
    }
  }
  y += 4;
  ensure(LINE_H * 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(...BODY);
  doc.text("Cause racine : ", margin, y);
  const labelW = doc.getTextWidth("Cause racine : ");
  doc.setFont("helvetica", "normal");
  const rcLines = doc.splitTextToSize(synth.ishikawa.rootCause || "-", width - labelW);
  rcLines.forEach((line: string, i: number) => {
    ensure(LINE_H);
    doc.text(line, i === 0 ? margin + labelW : margin, y);
    y += LINE_H;
  });
  y += 4;

  // --- Cahier des charges ---
  const c = synth.cahierDesCharges;
  heading("Contexte & objectifs");
  prose(c.contexte);
  heading("Perimetre fonctionnel");
  prose(c.perimetre);

  heading("Taches a automatiser (priorisees)");
  c.tachesAAutomatiser.forEach((t) => bullet(`${t.tache} - ${t.frequence} - priorite ${t.priorite}`));
  y += 4;

  heading("Cas d'usage agent IA");
  c.casUsageAgentIA.forEach((u) => bullet(`${u.processus} : ${u.usage} (causes : ${u.causesTraitees})`));
  y += 4;

  heading("Donnees & integrations");
  prose(c.donneesEtIntegrations);
  heading("Contraintes & risques");
  prose(c.contraintesEtRisques);

  heading("Points de vue par role");
  c.pointsDeVueParRole.forEach((r) => bullet(`${r.role} : ${r.synthese}`));
  y += 4;

  heading("Priorisation & roadmap");
  prose(c.priorisation);
  heading("Criteres de recette");
  prose(c.criteresDeRecette);

  // --- Footer: page number, bottom-center, on every page ---
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`${i} / ${n}`, pageW / 2, pageH - margin / 2, { align: "center" });
  }

  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}
