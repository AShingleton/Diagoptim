import pptxgen from "pptxgenjs";
import type { ScopingSynthesis } from "@/lib/ai/engine";
import { parseEnumeration, stripMarkdown } from "@/lib/scoping/format";
import { BRAND, EMBRACEIA_LOGO_DATAURI } from "@/lib/scoping/brand";

// FR labels for the 6M Ishikawa categories.
const M6: Record<string, string> = {
  man: "Main d'œuvre",
  machine: "Machines",
  method: "Méthodes",
  material: "Matières",
  measurement: "Mesure",
  environment: "Milieu",
};

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

  // ---------- 2. A3 — one full slide per box (long boxes overflowed a 2×2 grid) ----------
  {
    const a3Boxes: Array<{ emoji: string; n: number; name: string; body: string }> = [
      { emoji: "🧭", n: 1, name: "Contexte", body: synth.a3.background },
      { emoji: "⚠️", n: 2, name: "Problème", body: synth.a3.problemStatement },
      { emoji: "🎯", n: 3, name: "Objectif", body: synth.a3.goal },
      { emoji: "🔎", n: 4, name: "Causes racines", body: synth.a3.rootCauseAnalysis },
    ];
    a3Boxes.forEach((b) => {
      const s = pptx.addSlide();
      header(s, `A3 — Boîte ${b.n} · ${b.name}`, "🧩");
      // Large single card; body renders with explicit height + fit:shrink so long text never spills out.
      s.addShape("roundRect", { x: 0.4, y: 1.1, w: PW - 0.8, h: 5.85, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
      s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
      s.addText(`${b.emoji}  Boîte ${b.n} · ${b.name}`, {
        x: 0.85,
        y: 1.3,
        w: PW - 1.7,
        h: 0.55,
        fontSize: 18,
        bold: true,
        color: BRAND.orangeDark,
        valign: "middle",
      });
      s.addShape("rect", { x: 0.85, y: 1.95, w: PW - 1.7, h: 0.03, fill: { color: BRAND.orange } });
      renderBody(s, b.body, { x: 0.85, y: 2.15, w: PW - 1.7, h: 4.6 }, 15);
      footer(s);
    });
  }

  // ---------- 3. ISHIKAWA FISHBONE ----------
  {
    const s = pptx.addSlide();
    header(s, "Analyse des causes — Ishikawa 6M", "🐟");

    const SPINE_Y = 3.9;

    // Horizontal spine, arrow pointing right into the PROBLÈME head.
    s.addShape("line", { x: 0.4, y: SPINE_Y, w: 9.4, h: 0, line: { color: BRAND.ink, width: 2.5, endArrowType: "triangle" } });

    // Effect head (right).
    s.addShape("roundRect", { x: 9.9, y: 3.0, w: 3.1, h: 1.7, fill: { color: BRAND.orange }, line: { color: BRAND.orangeDark, width: 1 } });
    s.addText(
      [
        { text: "PROBLÈME", options: { bold: true, fontSize: 12, color: BRAND.white, breakLine: true, paraSpaceAfter: 4 } },
        { text: stripMarkdown(trunc(synth.ishikawa.problem, 150)), options: { fontSize: 9, color: BRAND.orangeLight } },
      ],
      { x: 10.05, y: 3.1, w: 2.8, h: 1.5, valign: "top", align: "left", wrap: true, fit: "shrink" },
    );

    const centers = [2.3, 4.8, 7.3];
    const causes = synth.ishikawa.causes as Record<string, string[]>;

    const drawCategory = (key: string, cx: number, side: "top" | "bottom") => {
      const list = (causes[key] ?? []).slice(0, 5);
      const runs: Runs = list.length
        ? list.map((cause) => ({
            text: stripMarkdown(trunc(cause, 60)),
            options: { bullet: { characterCode: "2022", indent: 10 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 3 },
          }))
        : [{ text: "—", options: { color: BRAND.grey } }];

      if (side === "top") {
        // ONE diagonal bone: pill inner edge (upper) -> spine (lower-right). All top bones share the same vector => parallel.
        s.addShape("line", { x: cx + 0.2, y: 1.3, w: 0.75, h: SPINE_Y - 1.3, line: { color: BRAND.orange, width: 1.75 } });
        s.addShape("roundRect", { x: cx - 0.7, y: 0.8, w: 1.4, h: 0.45, fill: { color: BRAND.orange } });
        s.addText(M6[key], { x: cx - 0.7, y: 0.8, w: 1.4, h: 0.45, fontSize: 10, bold: true, color: BRAND.white, align: "center", valign: "middle" });
        // Cause box sits to the LEFT of the bone (bone starts at cx+0.2), so text never crosses the line.
        s.addText(runs, { x: cx - 1.9, y: 1.5, w: 2.1, h: 2.0, fontSize: 8, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
      } else {
        // ONE diagonal bone: spine (upper-right) -> pill inner edge (lower). flipH keeps all bottom bones parallel.
        s.addShape("line", { x: cx + 0.2, y: SPINE_Y, w: 0.75, h: 6.28 - SPINE_Y, flipH: true, line: { color: BRAND.orange, width: 1.75 } });
        s.addShape("roundRect", { x: cx - 0.7, y: 6.28, w: 1.4, h: 0.45, fill: { color: BRAND.orange } });
        s.addText(M6[key], { x: cx - 0.7, y: 6.28, w: 1.4, h: 0.45, fontSize: 10, bold: true, color: BRAND.white, align: "center", valign: "middle" });
        // Cause box sits to the LEFT of the bone, just above the pill.
        s.addText(runs, { x: cx - 1.9, y: 4.4, w: 2.1, h: 2.0, fontSize: 8, color: BRAND.ink, valign: "top", wrap: true, fit: "shrink" });
      }
    };

    (["man", "method", "measurement"] as const).forEach((k, i) => drawCategory(k, centers[i], "top"));
    (["machine", "material", "environment"] as const).forEach((k, i) => drawCategory(k, centers[i], "bottom"));

    s.addText(`Cause racine : ${stripMarkdown(trunc(synth.ishikawa.rootCause, 160))}`, {
      x: 0.4,
      y: 6.98,
      w: PW - 0.8,
      h: 0.35,
      fontSize: 11,
      italic: true,
      color: BRAND.grey,
      valign: "middle",
      wrap: true,
    });
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

  // ---------- 9. Contraintes & risques ----------
  contentSlide("Contraintes & risques", "🛡️", c.contraintesEtRisques);

  // ---------- 10. Priorisation, roadmap & recette (two cards) ----------
  twoCardSlide(
    "Priorisation & recette",
    "🗺️",
    { h: "🗺️  Priorisation & roadmap", body: c.priorisation },
    { h: "✅  Critères de recette", body: c.criteresDeRecette },
  );

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
