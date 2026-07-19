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
    s.addImage({ data: EMBRACEIA_LOGO_DATAURI, x: PW - 0.75, y: 0.15, w: 0.6, h: 0.6 });
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
      s.addText(runs, { ...box, fontSize, color: BRAND.ink, valign: "top", fit: "shrink" });
    } else {
      s.addText(stripMarkdown(text || "—"), { ...box, fontSize, color: BRAND.ink, valign: "top", fit: "shrink", paraSpaceAfter: 6 });
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

  /** Bulleted list slide. */
  const bulletSlide = (title: string, emoji: string, items: string[]) => {
    const s = pptx.addSlide();
    header(s, title, emoji);
    bigCard(s);
    s.addShape("rect", { x: 0.4, y: 1.1, w: 0.14, h: 5.85, fill: { color: BRAND.orange } });
    const runs: Runs = items.length
      ? items.map((t) => ({
          text: stripMarkdown(t),
          options: { bullet: { characterCode: "25B8", indent: 18 }, color: BRAND.ink, breakLine: true, paraSpaceAfter: 8 },
        }))
      : [{ text: "—", options: { color: BRAND.grey } }];
    s.addText(runs, { x: 0.85, y: 1.35, w: PW - 1.7, h: 5.35, fontSize: 14, color: BRAND.ink, valign: "top", fit: "shrink" });
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

  // ---------- 2. A3 — 4 boxes on one slide (2×2) ----------
  {
    const s = pptx.addSlide();
    header(s, "A3 — Cadrage du problème", "🧩");
    const cw = (PW - 0.8 - 0.4) / 2;
    const ch = (5.85 - 0.4) / 2;
    const col = [0.4, 0.4 + cw + 0.4];
    const row = [1.1, 1.1 + ch + 0.4];
    const boxes: Array<{ emoji: string; n: number; name: string; body: string; cx: number; cy: number }> = [
      { emoji: "🧭", n: 1, name: "Contexte", body: synth.a3.background, cx: col[0], cy: row[0] },
      { emoji: "⚠️", n: 2, name: "Problème", body: synth.a3.problemStatement, cx: col[1], cy: row[0] },
      { emoji: "🎯", n: 3, name: "Objectif", body: synth.a3.goal, cx: col[0], cy: row[1] },
      { emoji: "🔎", n: 4, name: "Causes racines", body: synth.a3.rootCauseAnalysis, cx: col[1], cy: row[1] },
    ];
    boxes.forEach((b) => {
      s.addShape("roundRect", { x: b.cx, y: b.cy, w: cw, h: ch, fill: { color: BRAND.orangeLight }, line: { color: BRAND.orange, width: 1 } });
      s.addText(`${b.emoji}  Boîte ${b.n} · ${b.name}`, {
        x: b.cx + 0.22,
        y: b.cy + 0.1,
        w: cw - 0.4,
        h: 0.4,
        fontSize: 14,
        bold: true,
        color: BRAND.orangeDark,
        valign: "middle",
      });
      s.addShape("rect", { x: b.cx + 0.22, y: b.cy + 0.52, w: cw - 0.44, h: 0.03, fill: { color: BRAND.orange } });
      renderBody(s, b.body, { x: b.cx + 0.22, y: b.cy + 0.62, w: cw - 0.44, h: ch - 0.78 }, 11);
    });
    footer(s);
  }

  // ---------- 3. ISHIKAWA FISHBONE ----------
  {
    const s = pptx.addSlide();
    header(s, "Analyse des causes — Ishikawa 6M", "🐟");

    // Spine
    s.addShape("line", { x: 0.4, y: 3.9, w: 9.4, h: 0, line: { color: BRAND.ink, width: 2.5, endArrowType: "triangle" } });

    // Effect head
    s.addShape("roundRect", { x: 9.9, y: 3.0, w: 3.1, h: 1.7, fill: { color: BRAND.orange }, line: { color: BRAND.orangeDark, width: 1 } });
    s.addText(
      [
        { text: "PROBLÈME", options: { bold: true, fontSize: 12, color: BRAND.white, breakLine: true, paraSpaceAfter: 4 } },
        { text: stripMarkdown(trunc(synth.ishikawa.problem, 150)), options: { fontSize: 9, color: BRAND.orangeLight } },
      ],
      { x: 10.05, y: 3.1, w: 2.8, h: 1.5, valign: "top", align: "left", fit: "shrink" },
    );

    const centers = [2.3, 4.8, 7.3];
    const causes = synth.ishikawa.causes as Record<string, string[]>;

    const drawCategory = (key: string, cx: number, side: "top" | "bottom") => {
      const list = (causes[key] ?? []).slice(0, 5);
      const runs: Runs = list.length
        ? list.map((c) => ({
            text: stripMarkdown(trunc(c, 55)),
            options: { bullet: { characterCode: "2022", indent: 10 }, breakLine: true, paraSpaceAfter: 3 },
          }))
        : [{ text: "—", options: { color: BRAND.grey } }];

      if (side === "top") {
        // diagonal bone from pill (upper-left) down to spine (lower-right)
        s.addShape("line", { x: cx - 0.2, y: 1.6, w: 1.25, h: 2.3, line: { color: BRAND.orange, width: 1.5 } });
        s.addShape("roundRect", { x: cx - 0.85, y: 1.15, w: 1.7, h: 0.42, fill: { color: BRAND.orange } });
        s.addText(M6[key], { x: cx - 0.85, y: 1.15, w: 1.7, h: 0.42, fontSize: 10, bold: true, color: BRAND.white, align: "center", valign: "middle" });
        s.addText(runs, { x: cx - 1.1, y: 1.62, w: 2.2, h: 2.1, fontSize: 8.5, color: BRAND.ink, valign: "top", fit: "shrink" });
      } else {
        // diagonal bone from spine (upper-left) down to pill (lower-right)
        s.addShape("line", { x: cx - 0.2, y: 3.9, w: 1.25, h: 2.3, line: { color: BRAND.orange, width: 1.5 } });
        s.addShape("roundRect", { x: cx - 0.85, y: 6.45, w: 1.7, h: 0.42, fill: { color: BRAND.orange } });
        s.addText(M6[key], { x: cx - 0.85, y: 6.45, w: 1.7, h: 0.42, fontSize: 10, bold: true, color: BRAND.white, align: "center", valign: "middle" });
        s.addText(runs, { x: cx - 1.1, y: 4.15, w: 2.2, h: 2.2, fontSize: 8.5, color: BRAND.ink, valign: "top", fit: "shrink" });
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
  bulletSlide(
    "Points de vue par rôle",
    "👥",
    c.pointsDeVueParRole.map((r) => `${stripMarkdown(r.role)} : ${stripMarkdown(r.synthese)}`),
  );

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
