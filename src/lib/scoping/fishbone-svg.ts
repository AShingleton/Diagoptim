import type { ScopingSynthesis } from "@/lib/ai/engine";
import { textPath } from "./fishbone-font-paths";

type Causes = ScopingSynthesis["ishikawa"]["causes"];

// EmbraceIA orange hero + a coordinated 6-colour category palette (readability, like standard Ishikawa templates).
const ORANGE = "#F06020";
const INK = "#2C3E50";
const GREY = "#8A97A5";
const RIB = "#B9C2CC";

const CATS = [
  { key: "man", label: "Main d'oeuvre", color: "#E8542F", icon: "users" },
  { key: "method", label: "Methodes", color: "#F2A03D", icon: "list" },
  { key: "measurement", label: "Mesure", color: "#2FB6A3", icon: "gauge" },
  { key: "machine", label: "Machines", color: "#3D9BE9", icon: "cog" },
  { key: "material", label: "Matieres", color: "#8E6FD1", icon: "box" },
  { key: "environment", label: "Milieu", color: "#2C5CC4", icon: "globe" },
] as const;
// index 0,1,2 = TOP ; 3,4,5 = BOTTOM

// Lucide-style stroke icon paths (24x24), drawn white inside the category circle.
const ICONS: Record<string, string> = {
  users:
    "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20 M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4 M15 4.6a3.5 3.5 0 0 1 0 6.8",
  list: "M8 6h11 M8 12h11 M8 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
  gauge: "M12 14l4-4 M20.5 15a8.5 8.5 0 1 0-17 0",
  cog: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  box: "M21 8v8l-9 5-9-5V8l9-5 9 5 M3.5 7.5 12 12l8.5-4.5 M12 12v9",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18",
};

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length >= maxLines && lines.join(" ").length < (text || "").length - 1) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1).trimEnd() + "…";
  }
  return lines.slice(0, maxLines);
}

export function buildFishboneSvg(causes: Causes, problem: string, rootCause: string): string {
  const W = 1500, H = 840;
  const spineY = 415;
  const spineX1 = 120, spineX2 = 1140;
  const CX = [340, 660, 980]; // three columns
  const CIRCLE_R = 34;
  const topCY = 132, botCY = H - 168;

  const iconG = (cx: number, cy: number, name: string) => `
    <g transform="translate(${cx - 12},${cy - 12})" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="${ICONS[name]}"/>
    </g>`;

  const category = (idx: number): string => {
    const c = CATS[idx];
    const top = idx < 3;
    const cx = CX[idx % 3];
    const cy = top ? topCY : botCY;
    const list = (causes as Record<string, string[]>)[c.key] ?? [];
    const spineAttach = cx + 190;
    const ax = cx + CIRCLE_R * 0.5, ay = top ? cy + CIRCLE_R * 0.7 : cy - CIRCLE_R * 0.7;
    const rib = `<line x1="${ax}" y1="${ay}" x2="${spineAttach}" y2="${spineY}" stroke="${RIB}" stroke-width="3"/>`;
    // sub-branches with cause text along the rib
    const n = Math.min(list.length, 4);
    let branches = "";
    for (let i = 0; i < n; i++) {
      const f = (i + 1) / (n + 1);
      const px = ax + (spineAttach - ax) * f;
      const py = ay + (spineY - ay) * f;
      const bx = px - 150; // horizontal sub-branch to the left
      branches += `<line x1="${px}" y1="${py}" x2="${bx}" y2="${py}" stroke="${RIB}" stroke-width="1.6"/>`;
      const lines = wrap(list[i], 26, 2);
      lines.forEach((ln, li) => {
        branches += textPath(ln, bx + 4, py - 6 - (lines.length - 1 - li) * 13, 12, { color: INK });
      });
    }
    const labelX = cx + CIRCLE_R + 10;
    return `
      ${rib}
      ${branches}
      <circle cx="${cx}" cy="${cy}" r="${CIRCLE_R}" fill="${c.color}"/>
      ${iconG(cx, cy, c.icon)}
      ${textPath(c.label, labelX, cy + 6, 18, { bold: true, color: c.color })}`;
  };

  // Effect arrow (right) — big orange chevron with the problem inside.
  const ex = 1150, ew = 310, eh = 250, ey = spineY - eh / 2;
  const tx = ex + 72; // clear of the left chevron notch
  const effect = `
    <polygon points="${ex},${ey} ${ex + ew - 70},${ey} ${ex + ew},${spineY} ${ex + ew - 70},${ey + eh} ${ex},${ey + eh} ${ex + 55},${spineY}"
      fill="${ORANGE}"/>
    ${textPath("PROBLEME", tx, spineY - 64, 19, { bold: true, color: "#fff" })}
    ${wrap(problem, 22, 6)
      .map((l, i) => textPath(l, tx, spineY - 40 + i * 16, 12.5, { color: "#fff" }))
      .join("")}`;

  // Tail arrow (left)
  const tail = `<polygon points="30,${spineY} 110,${spineY - 34} 110,${spineY + 34}" fill="${ORANGE}"/>`;

  const rootLines = wrap("Cause racine : " + rootCause, 175, 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  ${textPath("Diagramme d'Ishikawa (6M)", 40, 42, 26, { bold: true, color: ORANGE })}

  <line x1="${spineX1}" y1="${spineY}" x2="${spineX2}" y2="${spineY}" stroke="${INK}" stroke-width="5"/>
  ${tail}
  ${effect}
  ${[0, 1, 2, 3, 4, 5].map(category).join("")}

  <line x1="40" y1="${H - 54}" x2="${W - 40}" y2="${H - 54}" stroke="${ORANGE}" stroke-width="1"/>
  ${rootLines
    .map((l, i) => textPath(l, 40, H - 32 + i * 16, 13, { bold: i === 0, color: i === 0 ? INK : GREY }))
    .join("")}
</svg>`;
}
