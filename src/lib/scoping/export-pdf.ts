import { jsPDF } from "jspdf";
import { parseEnumeration, stripMarkdown, toPdfSafe } from "@/lib/scoping/format";
import { BRAND, EMBRACEIA_LOGO_DATAURI } from "@/lib/scoping/brand";
import { fishbonePngDataUri } from "@/lib/scoping/fishbone-image";
import type { ScopingSynthesis } from "@/lib/ai/engine";

const M6: Record<string, string> = {
  man: "Main d'oeuvre",
  machine: "Machines",
  method: "Methodes",
  material: "Matieres",
  measurement: "Mesure",
  environment: "Milieu",
};

// Hex "RRGGBB" -> [r, g, b] for jsPDF colour setters.
const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

const BODY_SIZE = 10.5;
const LINE_H = 15;

export function synthesisToPdf(synth: ScopingSynthesis, projectName: string): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentWidth = pageW - margin * 2;
  let y = margin;

  // Adds a page when the requested vertical space would overflow the bottom margin.
  const ensure = (space: number) => {
    if (y + space > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Normalise every measured/printed string to Latin-1 so jsPDF can measure it.
  // Unmeasurable chars (smart quotes, arrows…) break splitTextToSize word-wrap,
  // producing letter-spacing + overflow. Always route text through clean().
  const clean = (t: string): string => toPdfSafe(stripMarkdown(t));

  const heading = (text: string, size = 13) => {
    y += 10; // ~10pt space above every section
    ensure(size + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...rgb(BRAND.orange));
    for (const line of doc.splitTextToSize(clean(text), contentWidth)) {
      doc.text(line, margin, y);
      y += size + 2;
    }
    y += 2;
    // short accent underline (40pt wide) under the heading
    doc.setDrawColor(...rgb(BRAND.orange));
    doc.setLineWidth(1.5);
    doc.line(margin, y, margin + 40, y);
    y += 10;
    doc.setTextColor(...rgb(BRAND.ink));
  };

  const subHeading = (text: string) => {
    y += 4;
    ensure(LINE_H + 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...rgb(BRAND.orange));
    for (const line of doc.splitTextToSize(clean(text), contentWidth)) {
      doc.text(line, margin, y);
      y += LINE_H;
    }
    doc.setTextColor(...rgb(BRAND.ink));
  };

  const paragraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...rgb(BRAND.ink));
    const body = clean(text) || "-";
    for (const line of doc.splitTextToSize(body, contentWidth)) {
      ensure(LINE_H);
      doc.text(line, margin, y);
      y += LINE_H;
    }
    y += 4;
  };

  // Bullet with a hanging indent: the marker "•" sits at margin+14, the text
  // (and every wrapped continuation line) aligns at margin+26.
  const bullet = (text: string) => {
    const markerX = margin + 14;
    const textX = margin + 26;
    const wrapW = contentWidth - 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    const body = clean(text) || "-";
    const lines = doc.splitTextToSize(body, wrapW);
    lines.forEach((line: string, i: number) => {
      ensure(LINE_H);
      if (i === 0) {
        doc.setTextColor(...rgb(BRAND.orange));
        doc.setFontSize(9);
        doc.text("•", markerX, y);
        doc.setFontSize(BODY_SIZE);
      }
      doc.setTextColor(...rgb(BRAND.ink));
      doc.text(line, textX, y);
      y += LINE_H;
    });
  };

  // Reusable prose renderer: converts an inline "(1)…(2)…" enumeration into
  // proper bullets (intro as a paragraph, each item as a bullet); otherwise
  // renders a wrapped paragraph. Markdown is stripped up-front.
  const prose = (text: string) => {
    const body = clean(text);
    const parsed = parseEnumeration(body);
    if (parsed && parsed.items.length) {
      if (parsed.intro) paragraph(parsed.intro);
      parsed.items.forEach(bullet);
      y += 4;
    } else {
      paragraph(body);
    }
  };

  // --- Header / title block (page 1) ---
  doc.addImage(EMBRACEIA_LOGO_DATAURI, "PNG", pageW - margin - 40, margin - 8, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...rgb(BRAND.orange));
  doc.text("Cahier des charges", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...rgb(BRAND.grey));
  doc.text(clean(projectName), margin, y);
  y += 14;
  doc.setDrawColor(...rgb(BRAND.orange));
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  doc.setTextColor(...rgb(BRAND.ink));

  // --- A3 ---
  heading("A3 - Contexte");
  prose(synth.a3.background);
  heading("A3 - Probleme / etat actuel");
  prose(synth.a3.problemStatement);
  heading("A3 - Objectif cible");
  prose(synth.a3.goal);
  heading("A3 - Analyse des causes racines");
  prose(synth.a3.rootCauseAnalysis);

  // --- Strategic layer (optional; rendered only when collected) ---
  const TN: Record<string, string> = { human: "Developpement humain", quality: "Qualite", delivery: "Ponctualite", cost: "Cout" };
  const VS: Record<string, string> = { demand: "Demand", delivery: "Delivery", development: "Development", support: "Support" };
  const strat = synth.strategic;
  if (strat?.hoshin) {
    heading("Alignement strategique (Hoshin)");
    paragraph("Objectif strategique (12-18 mois) : " + (strat.hoshin.objective || "-"));
    if (strat.hoshin.trueNorth) paragraph("Indicateur True North vise : " + (TN[strat.hoshin.trueNorth] ?? strat.hoshin.trueNorth));
    if (strat.hoshin.breakthroughs?.length) { subHeading("Percees prioritaires"); strat.hoshin.breakthroughs.forEach(bullet); }
    if (strat.hoshin.alignment) paragraph("Lien projet / strategie : " + strat.hoshin.alignment);
  }
  if (strat?.steeple) {
    heading("Contexte STEEPLE");
    ([["Societe", strat.steeple.social], ["Technologie", strat.steeple.technological], ["Economie", strat.steeple.economic], ["Environnement", strat.steeple.environmental], ["Politique", strat.steeple.political], ["Legal", strat.steeple.legal], ["Ethique", strat.steeple.ethical]] as Array<[string, string]>)
      .forEach(([l, t]) => { if (t) { subHeading(l); paragraph(t); } });
  }
  if (strat?.swot) {
    heading("SWOT / TOWS");
    ([["Forces", strat.swot.strengths], ["Faiblesses", strat.swot.weaknesses], ["Opportunites", strat.swot.opportunities], ["Menaces", strat.swot.threats]] as Array<[string, string[]]>)
      .forEach(([l, arr]) => { if (arr?.length) { subHeading(l); arr.forEach(bullet); } });
  }
  if (strat?.sbs) {
    heading("Positionnement SBS");
    paragraph("Chaine de valeur : " + (VS[strat.sbs.valueStream] ?? strat.sbs.valueStream));
    if (strat.sbs.rationale) paragraph(strat.sbs.rationale);
  }

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
  doc.setTextColor(...rgb(BRAND.ink));
  doc.text("Cause racine : ", margin, y);
  const labelW = doc.getTextWidth("Cause racine : ");
  doc.setFont("helvetica", "normal");
  const rcLines = doc.splitTextToSize(clean(synth.ishikawa.rootCause) || "-", contentWidth - labelW);
  rcLines.forEach((line: string, i: number) => {
    ensure(LINE_H);
    doc.text(line, i === 0 ? margin + labelW : margin, y);
    y += LINE_H;
  });
  y += 4;

  // --- Ishikawa fishbone diagram (own PORTRAIT page) ---
  // The finished 6M fishbone is rendered by @/lib/scoping/fishbone-image and
  // embedded here as a single PNG. The source SVG is 1500 x 840, so the true
  // aspect is 840/1500 — using it avoids the vertical stretch the old 900/1420
  // ratio introduced. Placed fit-to-width on a portrait page, centred vertically.
  function drawFishbone() {
    doc.addPage("a4", "portrait");
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const imgW = pw - 2 * margin;
    const imgH = imgW * (840 / 1500);
    const imgY = Math.max(margin, (ph - imgH) / 2);
    doc.addImage(fishbonePngDataUri(synth.ishikawa), "PNG", margin, imgY, imgW, imgH);
    doc.addPage("a4", "portrait");
    y = margin; // continue the document in portrait
  }
  drawFishbone();

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
  c.pointsDeVueParRole.forEach((r) => {
    subHeading(r.role);
    prose(r.synthese);
  });
  y += 4;

  heading("Priorisation & roadmap");
  prose(c.priorisation);
  heading("Criteres de succes");
  prose(c.criteresDeRecette);

  // --- Footer: page number, bottom-center, on every page ---
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...rgb(BRAND.grey));
    const label = `${i} / ${n}`;
    // Centre manually (no align option — that triggers jsPDF char-spacing).
    doc.text(label, pageW / 2 - doc.getTextWidth(label) / 2, pageH - margin / 2);
  }

  return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
}
