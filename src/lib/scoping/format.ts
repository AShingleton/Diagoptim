/**
 * Shared text formatting for the scoping synthesis (used by the on-screen Prose
 * component AND the PDF/PPTX exporters so the rendering is consistent).
 */

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
