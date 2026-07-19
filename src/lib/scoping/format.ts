/**
 * Shared text formatting for the scoping synthesis (used by the on-screen Prose
 * component AND the PDF/PPTX exporters so the rendering is consistent).
 *
 * Detects an inline numbered enumeration such as
 *   "... : (1) A ; (2) B ; (3) C"
 * and returns the intro + the list items; returns null when there is no such
 * enumeration (render the text as a plain paragraph).
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
