import type { ScopingSynthesis } from "@/lib/ai/engine";

type Causes = ScopingSynthesis["ishikawa"]["causes"];

const ORANGE = "#F06020";
const ORANGE_DARK = "#C74E17";
const INK = "#2C2C2C";
const GREY = "#5B6470";

const TOP = [
  { key: "man", label: "Main d'oeuvre" },
  { key: "method", label: "Methodes" },
  { key: "measurement", label: "Mesure" },
] as const;
const BOTTOM = [
  { key: "machine", label: "Machines" },
  { key: "material", label: "Matieres" },
  { key: "environment", label: "Milieu" },
] as const;

const CX = [300, 620, 940]; // category column centres
const W = 1420;
const H = 900;
const SPINE_Y = 430;
const BOX_W = 190;
const BOX_H = 40;
const TOP_BOX_Y = 40;
const BOT_BOX_Y = 774;
const LINE_H = 17;
const CAUSE_MAX = 5;
const WRAP_CHARS = 28;

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Greedy word-wrap to maxChars/line, capped at maxLines (… on overflow). */
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
  if (lines.length >= maxLines) {
    const joined = lines.join(" ");
    if (joined.length < (text || "").length - 1) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, WRAP_CHARS - 1).trimEnd() + "…";
    }
  }
  return lines.slice(0, maxLines);
}

function wrappedCauses(causes: string[]): string[][] {
  return causes.slice(0, CAUSE_MAX).map((c) => wrap(c, WRAP_CHARS, 2));
}

function blockHeight(wrapped: string[][]): number {
  return wrapped.reduce((h, lines) => h + lines.length * LINE_H + 5, 0);
}

/** Renders causes top-to-bottom from topY, left-aligned ending at ~cx (never crossing the rib). */
function causeBlock(cx: number, topY: number, wrapped: string[][]): string {
  const x = cx - 158;
  let out = "";
  let y = topY;
  for (const lines of wrapped) {
    lines.forEach((line, i) => {
      out += `<text x="${x}" y="${y}" font-family="FishSans" font-size="12.5" fill="${INK}">${esc(
        (i === 0 ? "• " : "  ") + line,
      )}</text>`;
      y += LINE_H;
    });
    y += 5;
  }
  return out;
}

function categoryBox(cx: number, y: number, label: string): string {
  const x = cx - BOX_W / 2;
  return `<rect x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="8" fill="${ORANGE}"/>
    <text x="${cx}" y="${y + BOX_H / 2 + 5}" text-anchor="middle" font-family="FishSans" font-weight="bold" font-size="17" fill="#fff">${esc(label)}</text>`;
}

export function buildFishboneSvg(causes: Causes, problem: string, rootCause: string): string {
  const spineX1 = 60, spineX2 = 1140;

  const column = (m: { key: string; label: string }, i: number, top: boolean): string => {
    const cx = CX[i];
    const boxY = top ? TOP_BOX_Y : BOT_BOX_Y;
    const ribStartY = top ? boxY + BOX_H : boxY;
    const attachX = cx + 150;
    const wrapped = wrappedCauses((causes as Record<string, string[]>)[m.key] ?? []);
    const topY = top ? boxY + BOX_H + 26 : boxY - 12 - blockHeight(wrapped);
    return `${categoryBox(cx, boxY, m.label)}
    <line x1="${cx}" y1="${ribStartY}" x2="${attachX}" y2="${SPINE_Y}" stroke="${ORANGE}" stroke-width="2.5"/>
    ${causeBlock(cx, topY, wrapped)}`;
  };

  const problemLines = wrap(problem, 30, 6);
  const headX = 1150, headW = 240, headY = SPINE_Y - 80, headH = 160;
  const rootLines = wrap("Cause racine : " + rootCause, 160, 3);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="40" y="30" font-family="FishSans" font-weight="bold" font-size="26" fill="${ORANGE}">Ishikawa 6M</text>

  <line x1="${spineX1}" y1="${SPINE_Y}" x2="${spineX2}" y2="${SPINE_Y}" stroke="${INK}" stroke-width="3.5"/>
  <polygon points="${spineX2},${SPINE_Y - 10} ${spineX2 + 18},${SPINE_Y} ${spineX2},${SPINE_Y + 10}" fill="${INK}"/>

  <rect x="${headX}" y="${headY}" width="${headW}" height="${headH}" rx="10" fill="${ORANGE}" stroke="${ORANGE_DARK}" stroke-width="2"/>
  <text x="${headX + headW / 2}" y="${headY + 26}" text-anchor="middle" font-family="FishSans" font-weight="bold" font-size="15" fill="#fff">PROBLÈME</text>
  ${problemLines
    .map((l, i) => `<text x="${headX + 16}" y="${headY + 50 + i * 17}" font-family="FishSans" font-size="12.5" fill="#fff">${esc(l)}</text>`)
    .join("")}

  ${TOP.map((m, i) => column(m, i, true)).join("")}
  ${BOTTOM.map((m, i) => column(m, i, false)).join("")}

  <line x1="40" y1="${H - 58}" x2="${W - 40}" y2="${H - 58}" stroke="${ORANGE}" stroke-width="1"/>
  ${rootLines
    .map(
      (l, i) =>
        `<text x="40" y="${H - 36 + i * 16}" font-family="FishSans" font-size="13" font-weight="${i === 0 ? "bold" : "normal"}" fill="${i === 0 ? INK : GREY}">${esc(l)}</text>`,
    )
    .join("")}
</svg>`;
}
