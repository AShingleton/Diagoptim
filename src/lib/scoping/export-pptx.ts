import pptxgen from "pptxgenjs";
import type { ScopingSynthesis } from "@/lib/ai/engine";
import { parseEnumeration, stripMarkdown, boldSegments } from "@/lib/scoping/format";
import { BRAND, EMBRACEIA_LOGO_DATAURI } from "@/lib/scoping/brand";
import { fishbonePngDataUri } from "@/lib/scoping/fishbone-image";

const trunc = (s: string, n: number): string => {
  const t = (s || "").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

// The 6M categories, in canonical order, with an icon + accent colour for the
// per-arête detail slides (colours match the fishbone diagram palette).
const CATS6 = [
  { key: "man", name: "Main d'œuvre", emoji: "👤", color: "E8542F" },
  { key: "method", name: "Méthodes", emoji: "📋", color: "F2A03D" },
  { key: "measurement", name: "Mesure", emoji: "📊", color: "2FB6A3" },
  { key: "machine", name: "Machines", emoji: "⚙️", color: "3D9BE9" },
  { key: "material", name: "Matières", emoji: "📦", color: "8E6FD1" },
  { key: "environment", name: "Milieu", emoji: "🌐", color: "2C5CC4" },
] as const;

export async function synthesisToPptx(synth: ScopingSynthesis, projectName: string): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33in x 7.5in

  const PW = 13.33;

  type TextBox = { x: number; y: number; w: number; h: number };
  type Runs = pptxgen.TextProps[];

  let pageNo = 0;

  // Removes markdown that must NOT render (backticks, headings) but KEEPS **bold**
  // markers so boldSegments can turn them into real bold runs.
  const cleanKeepBold = (t: string): string =>
    (t || "").replace(/`/g, "").replace(/^#{1,6}\s*/gm, "").trim();

  type LineOpts = {
    marker?: string; // literal bullet glyph incl. trailing spaces, e.g. "▸  "
    indentSpaces?: number; // leading spaces (sub-bullet indent)
    color?: string;
    bold?: boolean;
    fontSize?: number;
    spaceAfter?: number;
    spaceBefore?: number;
  };

  /**
   * Appends one paragraph (a "line") to a runs array, splitting **bold** spans into
   * separate runs so inline bold renders. pptxgen's own `bullet` property can't
   * coexist with a multi-run bold paragraph (it drops the marker or splits the
   * line), so the bullet is emitted as a literal orange glyph run at the start —
   * the whole line stays one paragraph (only the last run carries breakLine).
   */
  const pushRich = (runs: Runs, text: string, o: LineOpts) => {
    const segs = boldSegments(cleanKeepBold(text));
    const list = segs.length ? segs : [{ text: "", bold: false }];
    const lead = o.indentSpaces ? " ".repeat(o.indentSpaces) : "";
    if (o.marker) {
      runs.push({ text: lead + o.marker, options: { color: BRAND.orange, bold: true, ...(o.fontSize ? { fontSize: o.fontSize } : {}) } });
    } else if (lead) {
      runs.push({ text: lead, options: { ...(o.fontSize ? { fontSize: o.fontSize } : {}) } });
    }
    list.forEach((seg, i) => {
      const isLast = i === list.length - 1;
      runs.push({
        text: seg.text,
        options: {
          bold: !!o.bold || seg.bold,
          color: o.color ?? BRAND.ink,
          ...(o.fontSize ? { fontSize: o.fontSize } : {}),
          ...(isLast
            ? {
                ...(o.spaceBefore != null ? { paraSpaceBefore: o.spaceBefore } : {}),
                ...(o.spaceAfter != null ? { paraSpaceAfter: o.spaceAfter } : {}),
                breakLine: true,
              }
            : {}),
        },
      });
    });
  };

  const MARK = "▸  ";
  const SUBMARK = "•  ";

  // ---------- Reusable master chrome ----------

  const header = (s: pptxgen.Slide, title: string, emoji: string, accent = BRAND.orange) => {
    s.addShape("rect", { x: 0, y: 0, w: PW, h: 0.9, fill: { color: BRAND.orange } });
    s.addShape("rect", { x: 0, y: 0.9, w: PW, h: 0.05, fill: { color: BRAND.orangeDark } });
    s.addText(`${emoji}  ${title}`, { x: 0.4, y: 0, w: PW - 1.6, h: 0.9, fontSize: 22, bold: true, color: BRAND.white, valign: "middle" });
    const logoX = PW - 0.75, logoY = 0.15, logoW = 0.6, logoH = 0.6;
    s.addShape("roundRect", { x: logoX - 0.05, y: logoY - 0.05, w: logoW + 0.1, h: logoH + 0.1, rectRadius: 0.05, fill: { color: BRAND.white }, line: { type: "none" } });
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: logoX, y: logoY, w: logoW, h: logoH });
    void accent;
  };

  const footer = (s: pptxgen.Slide) => {
    pageNo += 1;
    s.addShape("rect", { x: 0.4, y: 7.13, w: 0.14, h: 0.14, fill: { color: BRAND.orange } });
    s.addText("EmbraceIA · Cahier des charges", { x: 0.62, y: 7.06, w: 7, h: 0.3, fontSize: 9, color: BRAND.grey, valign: "middle" });
    s.addText(`${trunc(projectName, 40)}  ·  ${pageNo}`, { x: PW - 4.3, y: 7.06, w: 3.9, h: 0.3, fontSize: 9, color: BRAND.grey, align: "right", valign: "middle" });
  };

  const bigCard = (s: pptxgen.Slide, y = 1.1, h = 5.85) =>
    s.addShape("roundRect", { x: 0.4, y, w: PW - 0.8, h, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });

  const sideAccent = (s: pptxgen.Slide, color: string = BRAND.orange) =>
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color } });

  /** Renders text as a bulleted enumeration OR a paragraph, with inline bold, autofit. */
  const renderBody = (s: pptxgen.Slide, text: string, box: TextBox, fontSize = 12) => {
    const parsed = parseEnumeration(text || "");
    const runs: Runs = [];
    if (parsed && parsed.items.length) {
      if (parsed.intro) pushRich(runs, parsed.intro, { bold: true, color: BRAND.ink, spaceAfter: 8 });
      parsed.items.forEach((it) => pushRich(runs, it, { marker: MARK, color: BRAND.ink, spaceAfter: 5 }));
    } else {
      pushRich(runs, text || "—", { color: BRAND.ink, spaceAfter: 6 });
    }
    s.addText(runs, { ...box, fontSize, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
  };

  /** Builds bullet runs from item strings; an item hiding "(1)…(2)…" expands into sub-bullets. */
  const bulletRunsFromItems = (items: string[]): Runs => {
    if (!items.length) return [{ text: "—", options: { color: BRAND.grey } }];
    const runs: Runs = [];
    items.forEach((raw) => {
      const parsed = parseEnumeration(cleanKeepBold(raw));
      if (parsed && parsed.items.length) {
        pushRich(runs, parsed.intro || "…", { marker: MARK, bold: true, color: BRAND.ink, spaceAfter: 3 });
        parsed.items.forEach((it) => pushRich(runs, it, { marker: SUBMARK, indentSpaces: 4, color: BRAND.ink, spaceAfter: 3 }));
      } else {
        pushRich(runs, raw, { marker: MARK, color: BRAND.ink, spaceAfter: 8 });
      }
    });
    return runs;
  };

  const bulletSlide = (title: string, emoji: string, items: string[]) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    sideAccent(s);
    s.addText(bulletRunsFromItems(items), { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, fontSize: 14, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  };

  const contentSlide = (title: string, emoji: string, body: string) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    sideAccent(s);
    renderBody(s, body, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35 }, 14);
    footer(s);
  };

  const roleSlide = (title: string, emoji: string, roles: Array<{ role: string; synthese: string }>) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    sideAccent(s);
    const runs: Runs = [];
    if (!roles.length) {
      runs.push({ text: "—", options: { color: BRAND.grey } });
    } else {
      roles.forEach((r) => {
        pushRich(runs, r.role, { bold: true, color: BRAND.orangeDark, spaceBefore: 8, spaceAfter: 3 });
        const parsed = parseEnumeration(cleanKeepBold(r.synthese));
        if (parsed && parsed.items.length) {
          if (parsed.intro) pushRich(runs, parsed.intro, { color: BRAND.ink, spaceAfter: 3 });
          parsed.items.forEach((it) => pushRich(runs, it, { marker: MARK, color: BRAND.ink, spaceAfter: 3 }));
        } else {
          pushRich(runs, r.synthese || "—", { color: BRAND.ink, spaceAfter: 3 });
        }
      });
    }
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, fontSize: 13, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  };

  /** Two side-by-side cards, bodies rendered via renderBody (bold + enumeration aware). */
  const twoCardSlide = (title: string, emoji: string, left: { h: string; body: string }, right: { h: string; body: string }) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    const cw = (PW - 0.8 - 0.4) / 2;
    [{ x: 0.4, ...left }, { x: 0.4 + cw + 0.4, ...right }].forEach((c) => {
      s.addShape("roundRect", { x: c.x, y: 1.1, w: cw, h: 5.85, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
      s.addShape("rect", { x: c.x, y: 1.1, w: cw, h: 0.5, fill: { color: BRAND.orange } });
      s.addText(c.h, { x: c.x + 0.2, y: 1.1, w: cw - 0.4, h: 0.5, fontSize: 14, bold: true, color: BRAND.white, valign: "middle" });
      renderBody(s, c.body, { x: c.x + 0.25, y: 1.75, w: cw - 0.5, h: 5.05 }, 12);
    });
    footer(s);
  };

  /** Splits a free-text string into vertical bullet items (enumeration, else ; . ,); keeps bold. */
  const clausesToItems = (text: string): string[] => {
    const cleaned = cleanKeepBold(text).trim();
    if (!cleaned) return [];
    const parsed = parseEnumeration(cleaned);
    if (parsed && parsed.items.length) return parsed.items;
    let parts = cleaned.split(/\s*;\s*/).filter(Boolean);
    if (parts.length < 2) parts = cleaned.split(/\.\s+/).filter(Boolean);
    if (parts.length < 2) parts = cleaned.split(/\s*,\s*/).filter(Boolean);
    return parts.map((p) => p.replace(/[.;,\s]+$/, "").trim()).filter(Boolean);
  };

  /** Two side-by-side cards, each a vertical bullet list (bold-aware). */
  const twoBulletCardSlide = (title: string, emoji: string, left: { h: string; items: string[] }, right: { h: string; items: string[] }) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    const cw = (PW - 0.8 - 0.4) / 2;
    [{ x: 0.4, ...left }, { x: 0.4 + cw + 0.4, ...right }].forEach((cd) => {
      s.addShape("roundRect", { x: cd.x, y: 1.1, w: cw, h: 5.85, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
      s.addShape("rect", { x: cd.x, y: 1.1, w: cw, h: 0.5, fill: { color: BRAND.orange } });
      s.addText(cd.h, { x: cd.x + 0.2, y: 1.1, w: cw - 0.4, h: 0.5, fontSize: 14, bold: true, color: BRAND.white, valign: "middle" });
      const runs: Runs = [];
      (cd.items.length ? cd.items : ["—"]).forEach((it) => pushRich(runs, it, { marker: MARK, color: BRAND.ink, spaceAfter: 6 }));
      s.addText(runs, { x: cd.x + 0.25, y: 1.75, w: cw - 0.5, h: 5.05, fontSize: 13, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    });
    footer(s);
  };

  /**
   * Parses a roadmap string into phases with week ranges. Handles
   * "Phase N (Semaines X-Y): …" (variable durations), else "Lot N" (4-week blocks),
   * else sentences (4-week blocks). Returns ordered phases with start/end weeks.
   */
  type Phase = { label: string; ws: number; we: number; desc: string };
  const parsePhases = (text: string): Phase[] => {
    const cleaned = stripMarkdown(text || "");
    const phases: Phase[] = [];
    // Phase headers like "Phase 1 (Critique - Semaines 1-4) :" — tolerate ANY words
    // between "(" and "Semaines" (e.g. a priority label). The description is then
    // everything up to the NEXT phase header (so sub-tasks (1)(2)… stay attached).
    const headerRe = /Phase\s*(\d+)\s*\([^)]*?Semaines?\s*(\d+)\s*(?:[-–—à]|a)\s*(\d+)[^)]*\)\s*:?/gi;
    const heads: Array<{ num: string; ws: number; we: number; start: number; end: number }> = [];
    let m: RegExpExecArray | null;
    while ((m = headerRe.exec(cleaned)) !== null) {
      heads.push({ num: m[1], ws: parseInt(m[2], 10), we: parseInt(m[3], 10), start: m.index, end: headerRe.lastIndex });
    }
    if (heads.length) {
      heads.forEach((h, i) => {
        const to = i + 1 < heads.length ? heads[i + 1].start : cleaned.length;
        const desc = cleaned.slice(h.end, to).replace(/^[\s:–—-]+/, "").replace(/[\s.]+$/, "").trim();
        phases.push({ label: `Phase ${h.num}`, ws: h.ws, we: h.we, desc });
      });
      return phases.slice(0, 8);
    }
    const lotRe = /Lot\s*(\d+)\s*:?\s*([^.]*)/gi;
    let i = 0;
    while ((m = lotRe.exec(cleaned)) !== null) {
      phases.push({ label: `Lot ${m[1]}`, ws: i * 4 + 1, we: i * 4 + 4, desc: m[2].trim().replace(/[.;,\s]+$/, "") });
      i++;
    }
    if (phases.length) return phases.slice(0, 8);
    cleaned.split(/\.\s+/).map((s) => s.trim()).filter(Boolean).forEach((s, idx) => phases.push({ label: `Phase ${idx + 1}`, ws: idx * 4 + 1, we: idx * 4 + 4, desc: s }));
    return phases.slice(0, 8);
  };

  /** Roadmap Gantt: full phase description (bulleted) on the left, week axis on top,
   *  each bar spanning its real weeks (variable length), horizontal week labels. */
  const ganttSlide = (title: string, emoji: string, priorisationText: string) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    sideAccent(s);
    const phases = parsePhases(priorisationText);
    const N = Math.max(phases.length, 1);
    const maxWeek = Math.max(...phases.map((p) => p.we), 1);
    const labelW = 4.4;
    const gridX = 0.85 + labelW;
    const gridRight = PW - 0.55;
    const gridW = gridRight - gridX;
    const weekW = gridW / maxWeek;
    const topY = 1.6;
    const rowsTop = topY + 0.45;
    const rowH = Math.min(1.5, (6.5 - rowsTop) / N);
    s.addText("Semaines", { x: gridX, y: topY - 0.3, w: 2, h: 0.25, fontSize: 10, italic: true, bold: true, color: BRAND.orangeDark, align: "left" });
    // Week gridlines + HORIZONTAL labels (wide, centred boxes so "S12" never wraps).
    const step = maxWeek > 24 ? 4 : maxWeek > 12 ? 2 : 1;
    for (let w = 0; w <= maxWeek; w++) {
      const x = gridX + w * weekW;
      s.addShape("line", { x, y: rowsTop, w: 0, h: N * rowH, line: { color: "E5E7EB", width: 1 } });
      if (w > 0 && w % step === 0) {
        const lw = Math.max(weekW * step, 0.5);
        s.addText(`S${w}`, { x: x - lw / 2, y: topY, w: lw, h: 0.3, fontSize: 10, color: BRAND.grey, align: "center", valign: "middle" });
      }
    }
    phases.forEach((p, i) => {
      const ry = rowsTop + i * rowH;
      // Left: phase label + FULL description (sub-tasks as bullets when present).
      const runs: Runs = [];
      runs.push({ text: p.label, options: { bold: true, color: BRAND.ink, fontSize: 13, breakLine: true, paraSpaceAfter: 2 } });
      const parsed = parseEnumeration(cleanKeepBold(p.desc));
      if (parsed && parsed.items.length) {
        if (parsed.intro) pushRich(runs, parsed.intro, { color: BRAND.grey, fontSize: 9.5, spaceAfter: 2 });
        parsed.items.forEach((it) => pushRich(runs, it, { marker: MARK, color: BRAND.grey, fontSize: 9.5, spaceAfter: 1 }));
      } else if (p.desc) {
        pushRich(runs, p.desc, { color: BRAND.grey, fontSize: 10 });
      }
      s.addText(runs, { x: 0.85, y: ry + 0.05, w: labelW - 0.2, h: rowH - 0.1, valign: "top", wrap: true, fit: "shrink" });
      // Bar
      const barH = Math.min(0.5, rowH * 0.42);
      const by = ry + (rowH - barH) / 2;
      const bx = gridX + (p.ws - 1) * weekW + 0.03;
      const bw = Math.max((p.we - p.ws + 1) * weekW - 0.06, 0.25);
      s.addShape("roundRect", { x: bx, y: by, w: bw, h: barH, rectRadius: 0.05, fill: { color: BRAND.orange }, line: { type: "none" } });
      s.addText(`S${p.ws}-${p.we}`, { x: bx, y: by, w: bw, h: barH, fontSize: 9, bold: true, color: BRAND.white, align: "center", valign: "middle" });
    });
    s.addText("Séquencement indicatif — à affiner avec les parties prenantes", { x: 0.85, y: 6.68, w: PW - 1.7, h: 0.28, fontSize: 9, italic: true, color: BRAND.grey });
    footer(s);
  };

  /** Suggested KPI monitoring dashboard — a visual mockup (stat tiles + 2 charts). */
  const dashboardSlide = () => {
    const s = pptx.addSlide();
    header(s, "Tableau de bord de suivi — proposition", "📊");
    const tiles = [
      { value: "-70%", label: "Temps de saisie", color: BRAND.orange },
      { value: "0", label: "Double saisie", color: "2FB6A3" },
      { value: "-45%", label: "Ruptures de stock", color: "E8542F" },
      { value: "95%", label: "Adoption équipe", color: "3D9BE9" },
    ];
    const gap = 0.3;
    const tileW = (PW - 0.8 - gap * 3) / 4;
    const tileY = 1.2, tileH = 1.55;
    tiles.forEach((t, i) => {
      const tx = 0.4 + i * (tileW + gap);
      s.addShape("roundRect", { x: tx, y: tileY, w: tileW, h: tileH, rectRadius: 0.08, fill: { color: "FFFFFF" }, line: { color: t.color, width: 1.5 } });
      s.addShape("rect", { x: tx, y: tileY, w: 0.12, h: tileH, fill: { color: t.color } });
      s.addText(t.value, { x: tx + 0.2, y: tileY + 0.12, w: tileW - 0.35, h: 0.8, fontSize: 34, bold: true, color: t.color, align: "left", valign: "middle" });
      s.addText(t.label, { x: tx + 0.22, y: tileY + 0.92, w: tileW - 0.4, h: 0.5, fontSize: 12, color: BRAND.ink, align: "left", valign: "top" });
    });
    const chartY = 3.05, chartH = 3.4;
    const bar = [{ name: "Erreurs / mois", labels: ["M1", "M2", "M3", "M4", "M5", "M6"], values: [42, 30, 20, 12, 6, 3] }];
    s.addChart(pptx.ChartType.bar, bar, { x: 0.5, y: chartY, w: 6.1, h: chartH, barDir: "col", chartColors: [BRAND.orange], showTitle: true, title: "Erreurs de saisie / mois (↓)", titleColor: BRAND.ink, titleFontSize: 13, showValue: false, showLegend: false, catAxisLabelColor: BRAND.grey, valAxisLabelColor: BRAND.grey });
    const dough = [{ name: "Adoption", labels: ["Adopté", "En cours", "À faire"], values: [70, 20, 10] }];
    s.addChart(pptx.ChartType.doughnut, dough, { x: 7.0, y: chartY, w: 5.8, h: chartH, chartColors: [BRAND.orange, "F2A03D", "E5E7EB"], showTitle: true, title: "Adoption par site", titleColor: BRAND.ink, titleFontSize: 13, showLegend: true, legendPos: "b", legendColor: BRAND.grey, holeSize: 60, showValue: true, dataLabelColor: "FFFFFF", dataLabelFontSize: 11 });
    s.addText("Maquette indicative — indicateurs à définir avec le client", { x: 0.5, y: 6.65, w: PW - 1, h: 0.3, fontSize: 9, italic: true, color: BRAND.grey });
    footer(s);
  };

  // ---------- 1. COVER ----------
  {
    const s = pptx.addSlide();
    s.background = { color: BRAND.orange };
    s.addShape("roundRect", { x: (PW - 1.7) / 2, y: 1.05, w: 1.7, h: 1.7, rectRadius: 0.85, fill: { color: BRAND.white }, line: { type: "none" } });
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: (PW - 1.5) / 2, y: 1.15, w: 1.5, h: 1.5 });
    s.addShape("rect", { x: (PW - 2.6) / 2, y: 3.05, w: 2.6, h: 0.06, fill: { color: BRAND.white } });
    s.addText("Cahier des charges", { x: 0.5, y: 3.25, w: PW - 1, h: 1.0, fontSize: 44, bold: true, color: BRAND.white, align: "center" });
    s.addText(`Automatisation & agent IA — ${trunc(projectName, 60)}`, { x: 0.5, y: 4.35, w: PW - 1, h: 0.7, fontSize: 22, color: BRAND.orangeLight, align: "center" });
    s.addText("EmbraceIA", { x: 0.5, y: 6.6, w: PW - 1, h: 0.4, fontSize: 13, bold: true, color: BRAND.white, align: "center" });
  }

  // ---------- 2. A3 — Boxes 1-3 (Contexte / Problème / Objectif) on one slide, labelled ----------
  {
    const s = pptx.addSlide();
    header(s, "Analyse A3 — État des lieux", "🧩");
    bigCard(s);
    sideAccent(s);
    const sections: Array<{ label: string; body: string }> = [
      { label: "🧭  Boîte 1 · Contexte", body: synth.a3.background },
      { label: "⚠️  Boîte 2 · Problème / état actuel", body: synth.a3.problemStatement },
      { label: "🎯  Boîte 3 · Objectif cible", body: synth.a3.goal },
    ];
    const runs: Runs = [];
    sections.forEach((sec) => {
      runs.push({ text: sec.label, options: { bold: true, fontSize: 15, color: BRAND.orangeDark, breakLine: true, paraSpaceBefore: 8, paraSpaceAfter: 3 } });
      pushRich(runs, sec.body || "—", { color: BRAND.ink, fontSize: 12.5, spaceAfter: 6 });
    });
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  }

  // ---------- 3. ISHIKAWA FISHBONE (overview) ----------
  {
    const s = pptx.addSlide();
    header(s, "Analyse des causes — Ishikawa 6M", "🐟");
    const iw = 9.6;
    s.addImage({ data: fishbonePngDataUri(synth.ishikawa), x: (PW - iw) / 2, y: 1.45, w: iw, h: iw * (840 / 1500) });
    footer(s);
  }

  // ---------- 4. One slide per fishbone arête (6M detail) ----------
  {
    const causes = synth.ishikawa.causes as Record<string, string[]>;
    CATS6.forEach((cat) => {
      const s = pptx.addSlide();
      header(s, `Ishikawa — ${cat.name}`, cat.emoji);
      bigCard(s);
      sideAccent(s, cat.color);
      s.addText(`${cat.name}`, { x: 0.85, y: 1.3, w: PW - 1.7, h: 0.5, fontSize: 18, bold: true, color: cat.color, valign: "middle" });
      s.addShape("rect", { x: 0.85, y: 1.9, w: PW - 1.7, h: 0.03, fill: { color: cat.color } });
      const items = causes[cat.key] ?? [];
      const runs: Runs = [];
      (items.length ? items : ["—"]).forEach((it) => pushRich(runs, it, { marker: MARK, color: BRAND.ink, spaceAfter: 8 }));
      s.addText(runs, { x: 0.85, y: 2.15, w: PW - 1.7, h: 4.6, fontSize: 15, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
      footer(s);
    });
  }

  // ---------- 5. A3 — Boîte 4 · Causes racines (vertical list) ----------
  {
    const s = pptx.addSlide();
    header(s, "A3 — Boîte 4 · Causes racines", "🔎");
    bigCard(s);
    sideAccent(s);
    const breakdown = clausesToItems(synth.a3.rootCauseAnalysis);
    const runs: Runs = [];
    runs.push({ text: "Cause racine principale", options: { bold: true, fontSize: 13, color: BRAND.orangeDark, breakLine: true, paraSpaceAfter: 2 } });
    pushRich(runs, synth.ishikawa.rootCause || "—", { color: BRAND.ink, fontSize: 14, spaceAfter: 12 });
    runs.push({ text: "Causes racines identifiées", options: { bold: true, fontSize: 13, color: BRAND.orangeDark, breakLine: true, paraSpaceAfter: 4 } });
    (breakdown.length ? breakdown : ["—"]).forEach((it) => pushRich(runs, it, { marker: MARK, color: BRAND.ink, fontSize: 13, spaceAfter: 6 }));
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  }

  const c = synth.cahierDesCharges;

  // ---------- 6. Contexte & périmètre (two cards) ----------
  twoCardSlide("Contexte & périmètre", "📋", { h: "Contexte", body: c.contexte }, { h: "Périmètre fonctionnel", body: c.perimetre });

  // ---------- 7. Tâches à automatiser ----------
  bulletSlide("Tâches à automatiser", "⚙️", c.tachesAAutomatiser.map((t) => `**${t.tache}** — ${t.frequence} · priorité ${t.priorite}`));

  // ---------- 8. Cas d'usage agent IA ----------
  bulletSlide("Cas d'usage agent IA", "🤖", c.casUsageAgentIA.map((u) => `**${u.processus}** : ${u.usage}`));

  // ---------- 9. Points de vue par rôle ----------
  roleSlide("Points de vue par rôle", "👥", c.pointsDeVueParRole);

  // ---------- 10. Données & intégrations ----------
  contentSlide("Données & intégrations", "🗄️", c.donneesEtIntegrations);

  // ---------- 11. Contraintes & risques (two bulleted cards) ----------
  {
    const cr = cleanKeepBold(c.contraintesEtRisques || "");
    const split = cr.split(/risques?\s*:/i);
    const contraintesTxt = (split[0] || "").replace(/^\s*contraintes?\s*:/i, "").trim();
    const risquesTxt = (split[1] || "").trim();
    twoBulletCardSlide("Contraintes & risques", "🛡️", { h: "Contraintes", items: clausesToItems(contraintesTxt) }, { h: "Risques", items: clausesToItems(risquesTxt) });
  }

  // ---------- 12. Roadmap (Gantt, weeks) ----------
  ganttSlide("Priorisation & roadmap", "🗺️", c.priorisation);

  // ---------- 13. Critères de succès ----------
  bulletSlide("Critères de succès", "✅", clausesToItems(c.criteresDeRecette));

  // ---------- 14. Tableau de bord de suivi (KPIs) — mockup ----------
  dashboardSlide();

  // ---------- 14. Prochaines étapes (closing) ----------
  {
    const s = pptx.addSlide();
    header(s, "Prochaines étapes", "🚀");
    s.addShape("roundRect", { x: 0.4, y: 1.1, w: PW - 0.8, h: 4.55, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 4.55, fill: { color: BRAND.orange } });
    const steps = [
      "Valider ce cahier des charges avec les parties prenantes",
      "Prioriser le lot 1 (quick wins à fort impact)",
      "Lancer un POC sur le cas d'usage prioritaire (agent IA / automatisation)",
      "Planifier le déploiement et la conduite du changement",
      "Mesurer les gains via les critères de succès définis",
    ];
    const runs: Runs = [
      { text: "Pour transformer ce cadrage en résultats :", options: { bold: true, color: BRAND.orangeDark, fontSize: 16, breakLine: true, paraSpaceAfter: 10 } },
      ...steps.map((t) => ({ text: t, options: { bullet: { characterCode: "25B8", indent: 20 }, color: BRAND.ink, fontSize: 14, breakLine: true, paraSpaceAfter: 8 } })),
    ];
    s.addText(runs, { x: 0.85, y: 1.45, w: PW - 1.7, h: 3.9, fontSize: 14, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    const logoW = 0.55, logoH = 0.55, logoX = (PW - logoW) / 2, logoY = 5.85;
    s.addShape("roundRect", { x: logoX - 0.07, y: logoY - 0.07, w: logoW + 0.14, h: logoH + 0.14, rectRadius: 0.06, fill: { color: BRAND.white }, line: { color: BRAND.orange, width: 1 } });
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: logoX, y: logoY, w: logoW, h: logoH });
    s.addText("EmbraceIA — Excellence opérationnelle & IA · www.embraceIA.com", { x: 0.5, y: 6.55, w: PW - 1, h: 0.45, fontSize: 15, bold: true, color: BRAND.orange, align: "center", valign: "middle" });
    footer(s);
  }

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
