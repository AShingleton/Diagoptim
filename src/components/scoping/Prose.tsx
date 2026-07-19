import { parseEnumeration, boldSegments } from "@/lib/scoping/format";

/** Renders text with **bold** segments turned into real bold. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {boldSegments(text).map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold text-foreground">{seg.text}</strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Renders synthesis prose: inline numbered enumerations "(1)…(2)…" become a
 * bulleted list, and Markdown **bold** is rendered as bold (not shown raw).
 */
export function Prose({ text }: { text: string }) {
  if (!text) return <p className="text-muted-foreground/60">—</p>;

  const parsed = parseEnumeration(text);
  if (parsed) {
    return (
      <div>
        {parsed.intro && <p><Inline text={parsed.intro} /> :</p>}
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {parsed.items.map((it, i) => (
            <li key={i}><Inline text={it} /></li>
          ))}
        </ul>
      </div>
    );
  }

  return <p className="whitespace-pre-line"><Inline text={text} /></p>;
}
