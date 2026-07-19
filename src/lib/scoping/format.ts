/**
 * Shared text formatting for the scoping synthesis (used by the on-screen Prose
 * component AND the PDF/PPTX exporters so the rendering is consistent).
 */

/**
 * Normalises text to characters jsPDF's standard (WinAnsi) font can measure and
 * render. Non-measurable characters (smart quotes, dashes, arrows, ellipsis,
 * non-breaking spaces…) otherwise break jsPDF's word-wrap → overflow + a garbled
 * "letter-spaced" render. Call this on every string sent to the PDF exporter.
 */
export function toPdfSafe(text: string): string {
  if (!text) return "";
  return text
    .replace(/[‘’‚′ʼ]/g, "'")
    .replace(/[“”„″«»]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[←-⇿➔➤⮕]/g, "->")
    .replace(/[   ​  ]/g, " ")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\xFF\n\r\t]/g, ""); // drop anything still outside Latin-1
}

/** Removes Markdown emphasis the model sometimes emits (**bold**, *italic*, `code`, # headings). */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();
}

/** Splits text on **…** markers into segments, flagging the bold ones (for the on-screen render). */
export function boldSegments(text: string): { text: string; bold: boolean }[] {
  const out: { text: string; bold: boolean }[] = [];
  (text || "").split(/\*\*/).forEach((p, i) => {
    if (p) out.push({ text: p, bold: i % 2 === 1 });
  });
  return out;
}

/**
 * Detects an inline numbered enumeration such as "... : (1) A ; (2) B ; (3) C"
 * and returns the intro + list items; returns null when there is none.
 */
export function parseEnumeration(text: string): { intro: string; items: string[] } | null {
  if (!text) return null;
  const markers = text.match(/\(\d+\)/g);
  if (!markers || markers.length < 2) return null;
  const firstIdx = text.indexOf(markers[0]);
  const intro = text
    .slice(0, firstIdx)
    .trim()
    .replace(/[:\-–—]\s*$/, "")
    .trim();
  const items = text
    .slice(firstIdx)
    .split(/\(\d+\)/)
    .map((s) =>
      s
        .trim()
        .replace(/^[:\-–—;.\s]+/, "")
        .replace(/[;\s]+$/, ""),
    )
    .filter(Boolean);
  return { intro, items };
}
