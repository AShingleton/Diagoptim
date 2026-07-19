import opentype from "opentype.js";
import { FISHBONE_FONT_REGULAR, FISHBONE_FONT_BOLD } from "./fishbone-font";

// Parse the embedded subset fonts ONCE. Converting text -> vector paths at render
// time removes any runtime font dependency, so the fishbone renders identically on
// Windows, Vercel Linux, in the PDF and in the PPTX (resvg only ever draws paths).
function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

let REGULAR: opentype.Font | null = null;
let BOLD: opentype.Font | null = null;

function fonts(): { regular: opentype.Font; bold: opentype.Font } {
  if (!REGULAR) REGULAR = opentype.parse(toArrayBuffer(FISHBONE_FONT_REGULAR));
  if (!BOLD) BOLD = opentype.parse(toArrayBuffer(FISHBONE_FONT_BOLD));
  return { regular: REGULAR, bold: BOLD };
}

export type Anchor = "start" | "middle" | "end";

/** Advance width of a string at a given size (for anchoring / layout). */
export function textWidth(text: string, size: number, bold = false): number {
  const f = bold ? fonts().bold : fonts().regular;
  return f.getAdvanceWidth(text || "", size);
}

/**
 * Renders a text string as an SVG <path> filled with `color`.
 * (x, y) is the baseline position, respecting the anchor like SVG text-anchor.
 */
export function textPath(
  text: string,
  x: number,
  y: number,
  size: number,
  opts: { bold?: boolean; color?: string; anchor?: Anchor } = {},
): string {
  const { bold = false, color = "#000", anchor = "start" } = opts;
  const clean = text || "";
  const f = bold ? fonts().bold : fonts().regular;
  let dx = x;
  if (anchor !== "start") {
    const w = f.getAdvanceWidth(clean, size);
    dx = anchor === "middle" ? x - w / 2 : x - w;
  }
  const d = f.getPath(clean, dx, y, size).toPathData(2);
  return `<path d="${d}" fill="${color}"/>`;
}
