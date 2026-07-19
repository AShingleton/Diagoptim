import { jsPDF } from "jspdf";
import { parseEnumeration, stripMarkdown, toPdfSafe } from "@/lib/scoping/format";
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

  // --- Ishikawa fishbone diagram (own landscape page) ---
  // Canonical 6M fishbone. The page is split into three non-overlapping zones:
  //   Top band    (y 20 -> 70):        title only
  //   Middle band (y ~80 -> lh-90):    the diagram (spine, head, ribs, causes)
  //   Bottom band (y lh-80 -> lh-30):  root-cause caption only
  const drawFishbone = () => {
    doc.addPage("a4", "landscape");
    const lw = doc.internal.pageSize.getWidth();
    const lh = doc.internal.pageSize.getHeight();
    const spineY = lh / 2;

    // --- Top zone: title top-left only ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...rgb(BRAND.orange));
    doc.text("Ishikawa 6M", 40, 40);

    // --- Middle zone: spine ---
    const spineStartX = 45;
    const spineEndX = lw - 200; // stops just before the effect head
    doc.setDrawColor(...rgb(BRAND.ink));
    doc.setLineWidth(2);
    doc.line(spineStartX, spineY, spineEndX, spineY);
    // Arrowhead at the right end, pointing into the effect head
    doc.line(spineEndX, spineY, spineEndX - 12, spineY - 7);
    doc.line(spineEndX, spineY, spineEndX - 12, spineY + 7);

    // Effect head (the problem)
    doc.setFillColor(...rgb(BRAND.orange));
    doc.roundedRect(lw - 195, spineY - 42, 160, 84, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("PROBLEME", lw - 187, spineY - 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const headLines = doc.splitTextToSize(clean(synth.ishikawa.problem) || "-", 148);
    let hy = spineY - 12;
    for (const line of headLines.slice(0, 5)) {
      doc.text(line, lw - 187, hy);
      hy += 9;
    }

    // --- Middle zone: 6 category ribs ---
    // TOP row = man / method / measurement ; BOTTOM row = machine / material / environment
    const topKeys = ["man", "method", "measurement"];
    const bottomKeys = ["machine", "material", "environment"];
    const xCentres = [190, 400, 610];
    const boxW = 130;
    const boxH = 20;
    const yTop = 95; // top edge of the top-row label boxes
    const yBot = lh - 100; // top edge of the bottom-row label boxes
    const attachDX = 70; // spine attachment offset -> keeps each row's ribs parallel

    const drawCategory = (key: string, xc: number, top: boolean) => {
      const boxY = top ? yTop : yBot;

      // Category label box
      doc.setFillColor(...rgb(BRAND.orange));
      doc.roundedRect(xc - boxW / 2, boxY, boxW, boxH, 4, 4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const label = M6[key];
      doc.text(label, xc - doc.getTextWidth(label) / 2, boxY + boxH / 2 + 3);

      // Rib: single diagonal from the box's inner edge to the spine attachment.
      // Start point is identical offset for every box in a row, so ribs stay parallel.
      doc.setDrawColor(...rgb(BRAND.orange));
      doc.setLineWidth(1.5);
      const startY = top ? boxY + boxH : boxY; // inner-bottom (top) / inner-top (bottom)
      doc.line(xc, startY, xc + attachDX, spineY);

      // Causes: up to 4, left-aligned inside the wedge (x = xc-95 .. xc+35),
      // stacked so the block sits between the box and the spine (no overlap).
      const list = (causes[key] ?? []).slice(0, 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...rgb(BRAND.ink));
      const textX = xc - 95;
      const lineGap = 9;
      const rows: string[] = [];
      for (const cause of list) {
        const truncated = cause.length > 70 ? cause.slice(0, 69) + "..." : cause;
        const wrapped = doc.splitTextToSize(clean(truncated), 120).slice(0, 2);
        wrapped.forEach((ln: string, i: number) => rows.push((i === 0 ? "- " : "  ") + ln));
      }
      const blockH = rows.length * lineGap;
      // Top row: start just below the box, grow downward toward the spine.
      // Bottom row: end just above the box, so the block sits above it (toward the spine).
      let cy = top ? boxY + boxH + 12 : boxY - 12 - blockH + lineGap;
      for (const r of rows) {
        doc.text(r, textX, cy);
        cy += lineGap;
      }
    };

    topKeys.forEach((k, i) => drawCategory(k, xCentres[i], true));
    bottomKeys.forEach((k, i) => drawCategory(k, xCentres[i], false));

    // --- Bottom band: root-cause caption only, with a thin orange separator above ---
    const bandY = lh - 80;
    doc.setDrawColor(...rgb(BRAND.orange));
    doc.setLineWidth(0.75);
    doc.line(40, bandY, lw - 40, bandY);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...rgb(BRAND.ink));
    const rcLabel = "Cause racine : ";
    doc.text(rcLabel, 40, bandY + 20);
    const rcLabelW = doc.getTextWidth(rcLabel);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...rgb(BRAND.grey));
    const rcLines = doc.splitTextToSize(clean(synth.ishikawa.rootCause) || "-", lw - 80 - rcLabelW);
    let capY = bandY + 20;
    rcLines.forEach((line: string, i: number) => {
      doc.text(line, i === 0 ? 40 + rcLabelW : 40, capY);
      capY += 11;
    });

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
