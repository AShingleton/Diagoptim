/**
 * Renders synthesis prose. If the text contains an inline numbered enumeration
 * like "... : (1) A ; (2) B ; (3) C", it is turned into a bulleted list for
 * readability; otherwise it renders as a normal paragraph.
 */
export function Prose({ text }: { text: string }) {
  if (!text) return <p className="text-muted-foreground/60">—</p>;

  const markers = text.match(/\(\d+\)/g);
  if (markers && markers.length >= 2) {
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
    return (
      <div>
        {intro && <p>{intro} :</p>}
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
    );
  }

  return <p className="whitespace-pre-line">{text}</p>;
}
