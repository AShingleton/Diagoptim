import { jsPDF } from "jspdf";
import { parseEnumeration, stripMarkdown } from "@/lib/scoping/format";
import { BRAND, EMBRACEIA_LOGO_DATAURI } from "@/lib/scoping/brand";
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

  const heading = (text: string, size = 13) => {
    y += 10; // ~10pt space above every section
    ensure(size + 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...rgb(BRAND.orange));
    for (const line of doc.splitTextToSize(stripMarkdown(text), contentWidth)) {
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
    for (const line of doc.splitTextToSize(stripMarkdown(text), contentWidth)) {
      doc.text(line, margin, y);
      y += LINE_H;
    }
    doc.setTextColor(...rgb(BRAND.ink));
  };

  const paragraph = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...rgb(BRAND.ink));
    const clean = stripMarkdown(text) || "-";
    for (const line of doc.splitTextToSize(clean, contentWidth)) {
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
    const clean = stripMarkdown(text) || "-";
    const lines = doc.splitTextToSize(clean, wrapW);
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
    const clean = stripMarkdown(text);
    const parsed = parseEnumeration(clean);
    if (parsed && parsed.items.length) {
      if (parsed.intro) paragraph(parsed.intro);
      parsed.items.forEach(bullet);
      y += 4;
    } else {
      paragraph(clean);
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
  doc.text(stripMarkdown(projectName), margin, y);
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
  const rcLines = doc.splitTextToSize(stripMarkdown(synth.ishikawa.rootCause) || "-", contentWidth - labelW);
  rcLines.forEach((line: string, i: number) => {
    ensure(LINE_H);
    doc.text(line, i === 0 ? margin + labelW : margin, y);
    y += LINE_H;
  });
  y += 4;

  // --- Ishikawa fishbone diagram (own landscape page) ---
  const drawFishbone = () => {
    doc.addPage("a4", "landscape");
    const lw = doc.internal.pageSize.getWidth();
    const lh = doc.internal.pageSize.getHeight();
    const midY = lh / 2;

    // Title top-left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...rgb(BRAND.orange));
    doc.text("Ishikawa 6M", 40, 40);

    // Spine
    const spineStartX = 40;
    const spineEndX = lw - 190;
    doc.setDrawColor(...rgb(BRAND.ink));
    doc.setLineWidth(2);
    doc.line(spineStartX, midY, spineEndX, midY);
    // Arrowhead at right end of spine
    doc.line(spineEndX, midY, spineEndX - 12, midY - 7);
    doc.line(spineEndX, midY, spineEndX - 12, midY + 7);

    // Effect head (problem)
    doc.setFillColor(...rgb(BRAND.orange));
    doc.roundedRect(lw - 185, midY - 40, 150, 80, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PROBLEME", lw - 175, midY - 24);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const headLines = doc.splitTextToSize(stripMarkdown(synth.ishikawa.problem) || "-", 140);
    let hy = midY - 12;
    for (const line of headLines.slice(0, 8)) {
      doc.text(line, lw - 178, hy);
      hy += 8;
    }

    // 6 categories: top row + bottom row
    const topKeys: string[] = ["man", "method", "measurement"];
    const bottomKeys: string[] = ["machine", "material", "environment"];
    const xCentres = [180, 380, 580];
    const yTop = 70;
    const yBot = lh - 70;
    const pillW = 120;
    const pillH = 22;

    const drawCategory = (key: string, xc: number, top: boolean) => {
      const list = (causes[key] ?? []).slice(0, 4);
      const pillY = top ? yTop - pillH / 2 : yBot - pillH / 2;

      // Pill
      doc.setFillColor(...rgb(BRAND.orange));
      doc.roundedRect(xc - pillW / 2, pillY, pillW, pillH, 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const label = M6[key];
      doc.text(label, xc - doc.getTextWidth(label) / 2, pillY + pillH / 2 + 3);

      // Bone: diagonal line from pill toward spine base point below/above it.
      // Base point sits on the spine, offset so top bones stay parallel and
      // bottom bones stay parallel.
      const baseX = xc + 90;
      doc.setDrawColor(...rgb(BRAND.orange));
      doc.setLineWidth(1.5);
      if (top) {
        doc.line(xc, yTop + pillH / 2, baseX, midY);
      } else {
        doc.line(xc, yBot - pillH / 2, baseX, midY);
      }

      // Causes text on the outer side of the pill
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...rgb(BRAND.ink));
      let cy = top ? pillY - 6 - (list.length - 1) * 11 : pillY + pillH + 12;
      for (const cause of list) {
        const clean = stripMarkdown(cause);
        const first = doc.splitTextToSize(clean, 150)[0] ?? "";
        const truncated = first.length > 40 ? first.slice(0, 39) + "…" : first;
        doc.text("- " + truncated, xc - pillW / 2, cy);
        cy += 11;
      }
    };

    topKeys.forEach((k, i) => drawCategory(k, xCentres[i], true));
    bottomKeys.forEach((k, i) => drawCategory(k, xCentres[i], false));

    // Bottom caption: root cause
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...rgb(BRAND.grey));
    const rc = "Cause racine : " + (stripMarkdown(synth.ishikawa.rootCause) || "-");
    const capLines = doc.splitTextToSize(rc, lw - 80);
    let capY = lh - 30;
    for (const line of capLines.slice(0, 2)) {
      doc.text(line, 40, capY);
      capY += 11;
    }

    // Back to portrait for the rest of the document
    doc.addPage("a4", "portrait");
    y = margin;
    doc.setTextColor(...rgb(BRAND.ink));
  };
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
  heading("Criteres de recette");
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
