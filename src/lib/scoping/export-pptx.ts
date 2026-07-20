import pptxgen from "pptxgenjs";
import type { ScopingSynthesis } from "@/lib/ai/engine";
import { parseEnumeration, stripMarkdown } from "@/lib/scoping/format";
import { BRAND, EMBRACEIA_LOGO_DATAURI } from "@/lib/scoping/brand";
import { fishbonePngDataUri } from "@/lib/scoping/fishbone-image";

const trunc = (s: string, n: number): string => {
  const t = (s || "").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

export async function synthesisToPptx(synth: ScopingSynthesis, projectName: string): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33in x 7.5in

  const PW = 13.33;
  const PH = 7.5;

  type TextBox = { x: number; y: number; w: number; h: number };
  type Runs = pptxgen.TextProps[];

  let pageNo = 0;

  // ---------- Reusable master chrome ----------

  /** Top orange band with a white bold title + emoji icon, logo top-right, orangeDark accent line. */
  const header = (s: pptxgen.Slide, title: string, emoji: string) => {
    s.addShape("rect", { x: 0, y: 0, w: PW, h: 0.9, fill: { color: BRAND.orange } });
    s.addShape("rect", { x: 0, y: 0.9, w: PW, h: 0.05, fill: { color: BRAND.orangeDark } });
    s.addText(`${emoji}  ${title}`, {
      x: 0.4,
      y: 0,
      w: PW - 1.6,
      h: 0.9,
      fontSize: 22,
      bold: true,
      color: BRAND.white,
      valign: "middle",
    });
    // The EmbraceIA logo PNG is orange, so it needs a white backing chip to stay visible on the orange band.
    const logoX = PW - 0.75;
    const logoY = 0.15;
    const logoW = 0.6;
    const logoH = 0.6;
    s.addShape("roundRect", {
      x: logoX - 0.05,
      y: logoY - 0.05,
      w: logoW + 0.1,
      h: logoH + 0.1,
      rectRadius: 0.05,
      fill: { color: BRAND.white },
      line: { type: "none" },
    });
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: logoX, y: logoY, w: logoW, h: logoH });
  };

  /** Small grey footer, bottom-left brand line + right-side project/page filler. */
  const footer = (s: pptxgen.Slide) => {
    pageNo += 1;
    s.addShape("rect", { x: 0.4, y: 7.13, w: 0.14, h: 0.14, fill: { color: BRAND.orange } });
    s.addText("EmbraceIA · Cahier des charges", {
      x: 0.62,
      y: 7.06,
      w: 7,
      h: 0.3,
      fontSize: 9,
      color: BRAND.grey,
      valign: "middle",
    });
    s.addText(`${trunc(projectName, 40)}  ·  ${pageNo}`, {
      x: PW - 4.3,
      y: 7.06,
      w: 3.9,
      h: 0.3,
      fontSize: 9,
      color: BRAND.grey,
      align: "right",
      valign: "middle",
    });
  };

  /** Big rounded content card filling most of the slide body. */
  const bigCard = (s: pptxgen.Slide, y = 1.1, h = 5.85) =>
    s.addShape("roundRect", { x: 0.4, y, w: PW - 0.8, h, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });

  /** Renders text as bulleted enumeration OR paragraph, always stripMarkdown'd, autofit. */
  const renderBody = (s: pptxgen.Slide, text: string, box: TextBox, fontSize = 12) => {
    const parsed = parseEnumeration(text || "");
    if (parsed && parsed.items.length) {
      const runs: Runs = [];
      if (parsed.intro)
        runs.push({ text: stripMarkdown(parsed.intro), options: { bold: true, color: BRAND.ink, breakLine: true, paraSpaceAfter: 8 } });
      parsed.items.forEach((it) =>
        runs.push({
          text: stripMarkdown(it),
          options: { bullet: { characterCode: "25B8", indent: 16 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 5 },
        }),
      );
      s.addText(runs, { ...box, fontSize, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    } else {
      s.addText(stripMarkdown(text || "—"), { ...box, fontSize, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink", paraSpaceAfter: 6 });
    }
  };

  /** Full content slide (header + big card + body). */
  const contentSlide = (title: string, emoji: string, body: string) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } }); // side accent bar
    renderBody(s, body, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35 }, 14);
    footer(s);
  };

  /**
   * Builds bullet runs from a list of item strings. When an item hides an inline
   * "(1)…(2)…" enumeration, its intro becomes the top bullet and each numbered
   * part becomes an indented sub-bullet (so nothing renders as one dense run).
   */
  const bulletRunsFromItems = (items: string[]): Runs => {
    if (!items.length) return [{ text: "—", options: { color: BRAND.grey } }];
    const runs: Runs = [];
    items.forEach((raw) => {
      const clean = stripMarkdown(raw);
      const parsed = parseEnumeration(clean);
      if (parsed && parsed.items.length) {
        runs.push({
          text: stripMarkdown(parsed.intro) || "…",
          options: { bullet: { characterCode: "25B8", indent: 18 }, bold: true, color: BRAND.ink, breakLine: true, paraSpaceAfter: 3 },
        });
        parsed.items.forEach((it) =>
          runs.push({
            text: stripMarkdown(it),
            options: { bullet: { characterCode: "2022", indent: 34 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 3 },
          }),
        );
      } else {
        runs.push({
          text: clean,
          options: { bullet: { characterCode: "25B8", indent: 18 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 8 },
        });
      }
    });
    return runs;
  };

  /** Bulleted list slide. */
  const bulletSlide = (title: string, emoji: string, items: string[]) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
    s.addText(bulletRunsFromItems(items), { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, fontSize: 14, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  };

  /**
   * Role viewpoints slide: each role rendered as a bold lead, then its synthèse
   * split via parseEnumeration into sub-bullets (or a paragraph when there is no
   * inline "(n)" list) so nothing shows as one dense run.
   */
  const roleSlide = (title: string, emoji: string, roles: Array<{ role: string; synthese: string }>) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
    const runs: Runs = [];
    if (!roles.length) {
      runs.push({ text: "—", options: { color: BRAND.grey } });
    } else {
      roles.forEach((r) => {
        runs.push({
          text: stripMarkdown(r.role),
          options: { bold: true, color: BRAND.orangeDark, breakLine: true, paraSpaceBefore: 8, paraSpaceAfter: 3 },
        });
        const parsed = parseEnumeration(stripMarkdown(r.synthese));
        if (parsed && parsed.items.length) {
          if (parsed.intro)
            runs.push({ text: stripMarkdown(parsed.intro), options: { color: BRAND.ink, breakLine: true, paraSpaceAfter: 3 } });
          parsed.items.forEach((it) =>
            runs.push({
              text: stripMarkdown(it),
              options: { bullet: { characterCode: "25B8", indent: 18 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 3 },
            }),
          );
        } else {
          runs.push({ text: stripMarkdown(r.synthese || "—"), options: { color: BRAND.ink, breakLine: true, paraSpaceAfter: 3 } });
        }
      });
    }
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, fontSize: 13, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  };

  /** Two side-by-side cards on one slide. */
  const twoCardSlide = (title: string, emoji: string, left: { h: string; body: string }, right: { h: string; body: string }) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    const cw = (PW - 0.8 - 0.4) / 2; // two cards + centre gap
    const cards = [
      { x: 0.4, ...left },
      { x: 0.4 + cw + 0.4, ...right },
    ];
    cards.forEach((c) => {
      s.addShape("roundRect", { x: c.x, y: 1.1, w: cw, h: 5.85, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
      s.addShape("rect", { x: c.x, y: 1.1, w: cw, h: 0.5, fill: { color: BRAND.orange } });
      s.addText(c.h, { x: c.x + 0.2, y: 1.1, w: cw - 0.4, h: 0.5, fontSize: 14, bold: true, color: BRAND.white, valign: "middle" });
      renderBody(s, c.body, { x: c.x + 0.25, y: 1.75, w: cw - 0.5, h: 5.05 }, 12);
    });
    footer(s);
  };

  /** Splits a free-text string into vertical bullet items (enumeration, else ; . ,). */
  const clausesToItems = (text: string): string[] => {
    const cleaned = stripMarkdown(text || "").trim();
    if (!cleaned) return [];
    const parsed = parseEnumeration(cleaned);
    if (parsed && parsed.items.length) return parsed.items.map((s) => stripMarkdown(s));
    let parts = cleaned.split(/\s*;\s*/).filter(Boolean);
    if (parts.length < 2) parts = cleaned.split(/\.\s+/).filter(Boolean);
    if (parts.length < 2) parts = cleaned.split(/\s*,\s*/).filter(Boolean);
    return parts.map((p) => p.replace(/[.;,\s]+$/, "").trim()).filter(Boolean);
  };

  /** Two side-by-side cards, each rendered as a vertical bullet list. */
  const twoBulletCardSlide = (
    title: string,
    emoji: string,
    left: { h: string; items: string[] },
    right: { h: string; items: string[] },
  ) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    const cw = (PW - 0.8 - 0.4) / 2;
    const cards = [
      { x: 0.4, ...left },
      { x: 0.4 + cw + 0.4, ...right },
    ];
    cards.forEach((cd) => {
      s.addShape("roundRect", { x: cd.x, y: 1.1, w: cw, h: 5.85, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
      s.addShape("rect", { x: cd.x, y: 1.1, w: cw, h: 0.5, fill: { color: BRAND.orange } });
      s.addText(cd.h, { x: cd.x + 0.2, y: 1.1, w: cw - 0.4, h: 0.5, fontSize: 14, bold: true, color: BRAND.white, valign: "middle" });
      const runs: Runs = (cd.items.length ? cd.items : ["—"]).map((it) => ({
        text: stripMarkdown(it),
        options: { bullet: { characterCode: "25B8", indent: 16 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 6 },
      }));
      s.addText(runs, { x: cd.x + 0.25, y: 1.75, w: cw - 0.5, h: 5.05, fontSize: 13, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    });
    footer(s);
  };

  /** Parses "Lot 1 : … Lot 2 : …" (or sentences) into ordered roadmap phases. */
  const parseLots = (text: string): Array<{ label: string; desc: string }> => {
    const cleaned = stripMarkdown(text || "");
    const lots: Array<{ label: string; desc: string }> = [];
    const re = /Lot\s*(\d+)\s*:?\s*([^.]*)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cleaned)) !== null) {
      lots.push({ label: `Lot ${m[1]}`, desc: m[2].trim().replace(/[.;,\s]+$/, "") });
    }
    if (!lots.length) {
      cleaned.split(/\.\s+/).map((s) => s.trim()).filter(Boolean).forEach((s, i) => lots.push({ label: `Phase ${i + 1}`, desc: s }));
    }
    return lots.slice(0, 6);
  };

  /** Roadmap as a staircase Gantt: one row per phase, bars stepping across the timeline. */
  const ganttSlide = (title: string, emoji: string, priorisationText: string) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
    const lots = parseLots(priorisationText);
    const N = Math.max(lots.length, 1);
    const labelW = 3.2;
    const gridX = 0.85 + labelW;
    const gridRight = PW - 0.85;
    const gridW = gridRight - gridX;
    const cols = N;
    const colW = gridW / cols;
    const topY = 1.55;
    const rowsTop = topY + 0.45;
    const rowH = Math.min(1.0, (6.35 - rowsTop) / N);
    // timeline header + gridlines
    for (let i = 0; i < cols; i++) {
      s.addText(`Phase ${i + 1}`, { x: gridX + i * colW, y: topY, w: colW, h: 0.35, fontSize: 11, bold: true, color: BRAND.orangeDark, align: "center" });
      s.addShape("line", { x: gridX + i * colW, y: rowsTop, w: 0, h: N * rowH, line: { color: "E5E7EB", width: 1 } });
    }
    s.addShape("line", { x: gridRight, y: rowsTop, w: 0, h: N * rowH, line: { color: "E5E7EB", width: 1 } });
    lots.forEach((lot, i) => {
      const ry = rowsTop + i * rowH;
      const runs: Runs = [
        { text: lot.label, options: { bold: true, color: BRAND.ink, fontSize: 12, breakLine: true } },
      ];
      if (lot.desc) runs.push({ text: trunc(lot.desc, 70), options: { color: BRAND.grey, fontSize: 10, breakLine: true } });
      s.addText(runs, { x: 0.85, y: ry, w: labelW - 0.15, h: rowH, fontSize: 12, valign: "middle", wrap: true, fit: "shrink" });
      const bx = gridX + i * colW + 0.06;
      const bw = colW - 0.12;
      s.addShape("roundRect", { x: bx, y: ry + rowH * 0.22, w: bw, h: rowH * 0.56, rectRadius: 0.05, fill: { color: BRAND.orange }, line: { type: "none" } });
    });
    s.addText("Séquencement indicatif — à affiner avec les parties prenantes", {
      x: 0.85, y: 6.5, w: PW - 1.7, h: 0.3, fontSize: 9, italic: true, color: BRAND.grey, valign: "middle",
    });
    footer(s);
  };

  // ---------- 1. COVER ----------
  {
    const s = pptx.addSlide();
    s.background = { color: BRAND.orange };
    // White backing chip so the orange logo stays visible on the orange cover.
    s.addShape("roundRect", {
      x: (PW - 1.7) / 2,
      y: 1.05,
      w: 1.7,
      h: 1.7,
      rectRadius: 0.85,
      fill: { color: BRAND.white },
      line: { type: "none" },
    });
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: (PW - 1.5) / 2, y: 1.15, w: 1.5, h: 1.5 });
    s.addShape("rect", { x: (PW - 2.6) / 2, y: 3.05, w: 2.6, h: 0.06, fill: { color: BRAND.white } });
    s.addText("Cahier des charges", { x: 0.5, y: 3.25, w: PW - 1, h: 1.0, fontSize: 44, bold: true, color: BRAND.white, align: "center" });
    s.addText(`Automatisation & agent IA — ${trunc(projectName, 60)}`, {
      x: 0.5,
      y: 4.35,
      w: PW - 1,
      h: 0.7,
      fontSize: 22,
      color: BRAND.orangeLight,
      align: "center",
    });
    s.addText("EmbraceIA", { x: 0.5, y: 6.6, w: PW - 1, h: 0.4, fontSize: 13, bold: true, color: BRAND.white, align: "center" });
  }

  // ---------- 2. A3 — Boxes 1-3 merged (Contexte / Problème / Objectif) on one slide ----------
  {
    const s = pptx.addSlide();
    header(s, "Analyse A3 — État des lieux", "🧩");
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
    const sections: Array<{ label: string; body: string }> = [
      { label: "🧭  Contexte", body: synth.a3.background },
      { label: "⚠️  Problème / état actuel", body: synth.a3.problemStatement },
      { label: "🎯  Objectif cible", body: synth.a3.goal },
    ];
    const runs: Runs = [];
    sections.forEach((sec) => {
      runs.push({ text: sec.label, options: { bold: true, fontSize: 15, color: BRAND.orangeDark, breakLine: true, paraSpaceBefore: 8, paraSpaceAfter: 3 } });
      runs.push({ text: stripMarkdown(sec.body || "—"), options: { fontSize: 12.5, color: BRAND.ink, breakLine: true, paraSpaceAfter: 6 } });
    });
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  }

  // ---------- 3. ISHIKAWA FISHBONE (before the root-cause box) ----------
  {
    const s = pptx.addSlide();
    header(s, "Analyse des causes — Ishikawa 6M", "🐟");
    // The finished 6M fishbone is rendered by @/lib/scoping/fishbone-image and
    // embedded as a single centered PNG. Source SVG is 1500 x 840 → true aspect
    // 840/1500 (the old 900/1420 stretched it vertically).
    const iw = 9.6;
    s.addImage({ data: fishbonePngDataUri(synth.ishikawa), x: (PW - iw) / 2, y: 1.45, w: iw, h: iw * (840 / 1500) });
    footer(s);
  }

  // ---------- 4. A3 — Boîte 4 · Causes racines (listed one below the other) ----------
  {
    const s = pptx.addSlide();
    header(s, "A3 — Boîte 4 · Causes racines", "🔎");
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
    // Headline: the single deepest root cause; then the breakdown as a vertical list.
    const breakdown = clausesToItems(synth.a3.rootCauseAnalysis);
    const runs: Runs = [
      { text: "Cause racine principale", options: { bold: true, fontSize: 13, color: BRAND.orangeDark, breakLine: true, paraSpaceAfter: 2 } },
      { text: stripMarkdown(synth.ishikawa.rootCause || "—"), options: { fontSize: 14, color: BRAND.ink, breakLine: true, paraSpaceAfter: 12 } },
      { text: "Causes racines identifiées", options: { bold: true, fontSize: 13, color: BRAND.orangeDark, breakLine: true, paraSpaceAfter: 4 } },
      ...(breakdown.length ? breakdown : ["—"]).map((it) => ({
        text: stripMarkdown(it),
        options: { bullet: { characterCode: "25B8", indent: 16 }, fontSize: 13, color: BRAND.ink, breakLine: true, paraSpaceAfter: 6 },
      })),
    ];
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
    footer(s);
  }

  const c = synth.cahierDesCharges;

  // ---------- 4. Contexte & périmètre (two cards) ----------
  twoCardSlide(
    "Contexte & périmètre",
    "📋",
    { h: "Contexte", body: c.contexte },
    { h: "Périmètre fonctionnel", body: c.perimetre },
  );

  // ---------- 5. Tâches à automatiser ----------
  bulletSlide(
    "Tâches à automatiser",
    "⚙️",
    c.tachesAAutomatiser.map((t) => `${stripMarkdown(t.tache)} — ${stripMarkdown(t.frequence)} · priorité ${stripMarkdown(t.priorite)}`),
  );

  // ---------- 6. Cas d'usage agent IA ----------
  bulletSlide(
    "Cas d'usage agent IA",
    "🤖",
    c.casUsageAgentIA.map((u) => `${stripMarkdown(u.processus)} : ${stripMarkdown(u.usage)}`),
  );

  // ---------- 7. Points de vue par rôle ----------
  roleSlide("Points de vue par rôle", "👥", c.pointsDeVueParRole);

  // ---------- 8. Données & intégrations ----------
  contentSlide("Données & intégrations", "🗄️", c.donneesEtIntegrations);

  // ---------- 9. Contraintes & risques (two bulleted cards) ----------
  {
    const cr = stripMarkdown(c.contraintesEtRisques || "");
    const split = cr.split(/risques?\s*:/i);
    const contraintesTxt = (split[0] || "").replace(/^\s*contraintes?\s*:/i, "").trim();
    const risquesTxt = (split[1] || "").trim();
    twoBulletCardSlide(
      "Contraintes & risques",
      "🛡️",
      { h: "Contraintes", items: clausesToItems(contraintesTxt) },
      { h: "Risques", items: clausesToItems(risquesTxt) },
    );
  }

  // ---------- 10. Roadmap (Gantt) ----------
  ganttSlide("Priorisation & roadmap", "🗺️", c.priorisation);

  // ---------- 11. Critères de succès (own slide) ----------
  bulletSlide("Critères de succès", "✅", clausesToItems(c.criteresDeRecette));

  // ---------- 11. Prochaines étapes (closing) ----------
  {
    const s = pptx.addSlide();
    header(s, "Prochaines étapes", "🚀");
    // Big card holds the action list; ends above the CTA line so nothing overlaps.
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
      ...steps.map((t) => ({
        text: t,
        options: { bullet: { characterCode: "25B8", indent: 20 }, color: BRAND.ink, fontSize: 14, breakLine: true, paraSpaceAfter: 8 },
      })),
    ];
    s.addText(runs, { x: 0.85, y: 1.45, w: PW - 1.7, h: 3.9, fontSize: 14, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });

    // White chip + EmbraceIA logo, centred above the CTA line.
    const logoW = 0.55;
    const logoH = 0.55;
    const logoX = (PW - logoW) / 2;
    const logoY = 5.85;
    s.addShape("roundRect", { x: logoX - 0.07, y: logoY - 0.07, w: logoW + 0.14, h: logoH + 0.14, rectRadius: 0.06, fill: { color: BRAND.white }, line: { color: BRAND.orange, width: 1 } });
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: logoX, y: logoY, w: logoW, h: logoH });

    // Centred orange call-to-action line.
    s.addText("EmbraceIA — Excellence opérationnelle & IA · www.embraceIA.com", {
      x: 0.5,
      y: 6.55,
      w: PW - 1,
      h: 0.45,
      fontSize: 15,
      bold: true,
      color: BRAND.orange,
      align: "center",
      valign: "middle",
    });
    footer(s);
  }

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
