import pptxgen from "pptxgenjs";
import type { ScopingSynthesis } from "@/lib/ai/engine";
import { parseEnumeration } from "@/lib/scoping/format";

// Palette
const NAVY = "1B4F72";
const BLUE = "2E86C1";
const LIGHT = "EAF2F8";
const INK = "2C3E50";
const GREY = "5D6D7E";
const WHITE = "FFFFFF";

const M6: Record<string, string> = {
  man: "Main d'œuvre",
  machine: "Machines",
  method: "Méthodes",
  material: "Matières",
  measurement: "Mesure",
  environment: "Milieu",
};

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export async function synthesisToPptx(synth: ScopingSynthesis, projectName: string): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33in x 7.5in

  // ---- Reusable header (NAVY title + thin BLUE accent bar) ----
  const titleBar = (s: pptxgen.Slide, h: string) => {
    s.addText(h, { x: 0.6, y: 0.4, w: 12.1, h: 0.7, fontSize: 24, bold: true, color: NAVY, valign: "middle" });
    s.addShape("rect", { x: 0.62, y: 1.12, w: 3.2, h: 0.06, fill: { color: BLUE } });
  };

  // ---- Card behind content ----
  const card = (s: pptxgen.Slide) =>
    s.addShape("roundRect", { x: 0.5, y: 1.4, w: 12.3, h: 5.7, fill: { color: LIGHT }, line: { color: BLUE, width: 0.5 } });

  type Run = { text: string; options?: object };

  // ---- Content slide: paragraph OR bulleted enumeration ----
  const content = (h: string, body: string) => {
    const s = pptx.addSlide();
    titleBar(s, h);
    card(s);
    const parsed = parseEnumeration(body || "");
    if (parsed && parsed.items.length) {
      const runs: Run[] = [];
      if (parsed.intro) runs.push({ text: parsed.intro, options: { bold: true, color: INK, breakLine: true, paraSpaceAfter: 8 } });
      parsed.items.forEach((it) => runs.push({ text: it, options: { bullet: true, color: INK, breakLine: true, paraSpaceAfter: 4 } }));
      s.addText(runs, { x: 0.9, y: 1.7, w: 11.5, h: 5.1, fontSize: 14, color: INK, valign: "top" });
    } else {
      s.addText(body || "-", { x: 0.9, y: 1.7, w: 11.5, h: 5.1, fontSize: 14, color: INK, valign: "top" });
    }
  };

  // ---- Bulleted list slide ----
  const bullets = (h: string, items: string[]) => {
    const s = pptx.addSlide();
    titleBar(s, h);
    card(s);
    const runs: Run[] = items.length
      ? items.map((t) => ({ text: t, options: { bullet: true, color: INK, breakLine: true, paraSpaceAfter: 5 } }))
      : [{ text: "-", options: { color: INK } }];
    s.addText(runs, { x: 0.9, y: 1.7, w: 11.5, h: 5.1, fontSize: 14, color: INK, valign: "top" });
  };

  // ---- 1. COVER ----
  const cover = pptx.addSlide();
  cover.background = { color: NAVY };
  cover.addShape("rect", { x: 0.6, y: 2.05, w: 2.6, h: 0.1, fill: { color: BLUE } });
  cover.addText("Cahier des charges", { x: 0.6, y: 2.3, w: 12, h: 1.1, fontSize: 40, bold: true, color: WHITE });
  cover.addText("Automatisation & agent IA — " + projectName, { x: 0.6, y: 3.5, w: 12, h: 0.7, fontSize: 20, color: LIGHT });

  // ---- 2-5. A3 boxes ----
  const a3Box = (n: number, name: string, body: string) => content(`A3 · Boîte ${n} - ${name}`, body);
  a3Box(1, "Contexte", synth.a3.background);
  a3Box(2, "Problème / état actuel", synth.a3.problemStatement);
  a3Box(3, "Objectif cible", synth.a3.goal);
  a3Box(4, "Analyse des causes racines", synth.a3.rootCauseAnalysis);

  // ---- 6. ISHIKAWA FISHBONE (drawn with shapes) ----
  {
    const s = pptx.addSlide();
    s.addText("Ishikawa 6M", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 24, bold: true, color: NAVY });
    s.addShape("rect", { x: 0.52, y: 0.95, w: 3.2, h: 0.06, fill: { color: BLUE } });

    // Spine (horizontal line, arrow into the effect head)
    s.addShape("line", { x: 0.5, y: 3.9, w: 9.2, h: 0, line: { color: INK, width: 2.5, endArrowType: "triangle" } });

    // Effect head box on the right
    s.addShape("roundRect", { x: 9.8, y: 3.1, w: 3.2, h: 1.6, fill: { color: NAVY }, line: { color: BLUE, width: 1 } });
    s.addText(
      [
        { text: "PROBLÈME", options: { bold: true, fontSize: 11, color: WHITE, breakLine: true } },
        { text: trunc(synth.ishikawa.problem || "", 140), options: { fontSize: 9, color: LIGHT } },
      ],
      { x: 9.95, y: 3.2, w: 2.95, h: 1.4, valign: "top", align: "left" },
    );

    const centers = [2.2, 4.7, 7.2];
    const causes = synth.ishikawa.causes as Record<string, string[]>;

    const drawCategory = (key: string, cx: number, side: "top" | "bottom") => {
      const list = (causes[key] ?? []).slice(0, 4).map((c) => ({ text: trunc(c, 34), options: { breakLine: true } }));
      if (side === "top") {
        // bone: diagonal down-right, meeting the spine at y≈3.9
        s.addShape("line", { x: cx + 0.3, y: 1.7, w: 0.9, h: 2.2, line: { color: BLUE, width: 1.5 } });
        // category pill
        s.addShape("roundRect", { x: cx - 0.75, y: 1.15, w: 1.7, h: 0.4, fill: { color: BLUE } });
        s.addText(M6[key], { x: cx - 0.75, y: 1.15, w: 1.7, h: 0.4, fontSize: 10, bold: true, color: WHITE, align: "center", valign: "middle" });
        // causes under the pill
        if (list.length) s.addText(list, { x: cx - 1.15, y: 1.6, w: 1.95, h: 1.55, fontSize: 9, color: INK, valign: "top" });
      } else {
        // bone: diagonal from the spine (y≈3.9) down to the pill
        s.addShape("line", { x: cx + 0.3, y: 3.9, w: 0.9, h: 2.2, line: { color: BLUE, width: 1.5 } });
        // category pill
        s.addShape("roundRect", { x: cx - 0.75, y: 6.35, w: 1.7, h: 0.4, fill: { color: BLUE } });
        s.addText(M6[key], { x: cx - 0.75, y: 6.35, w: 1.7, h: 0.4, fontSize: 10, bold: true, color: WHITE, align: "center", valign: "middle" });
        // causes above the pill
        if (list.length) s.addText(list, { x: cx - 1.15, y: 4.7, w: 1.95, h: 1.55, fontSize: 9, color: INK, valign: "bottom" });
      }
    };

    // TOP: man / method / measurement
    (["man", "method", "measurement"] as const).forEach((k, i) => drawCategory(k, centers[i], "top"));
    // BOTTOM: machine / material / environment
    (["machine", "material", "environment"] as const).forEach((k, i) => drawCategory(k, centers[i], "bottom"));

    s.addText(`Cause racine : ${trunc(synth.ishikawa.rootCause || "", 150)}`, {
      x: 0.5,
      y: 7.02,
      w: 12.3,
      h: 0.4,
      fontSize: 11,
      italic: true,
      color: GREY,
    });
  }

  // ---- 7+. Cahier des charges ----
  const c = synth.cahierDesCharges;
  content("Contexte", c.contexte);
  content("Périmètre fonctionnel", c.perimetre);
  bullets(
    "Tâches à automatiser",
    c.tachesAAutomatiser.map((t) => `${t.tache} — ${t.frequence} · priorité ${t.priorite}`),
  );
  bullets(
    "Cas d'usage agent IA",
    c.casUsageAgentIA.map((u) => `${u.processus} : ${u.usage}`),
  );
  bullets(
    "Points de vue par rôle",
    c.pointsDeVueParRole.map((r) => `${r.role} : ${r.synthese}`),
  );
  content("Données & intégrations", c.donneesEtIntegrations);
  content("Contraintes & risques", c.contraintesEtRisques);
  content("Priorisation & roadmap", c.priorisation);
  content("Critères de recette", c.criteresDeRecette);

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
