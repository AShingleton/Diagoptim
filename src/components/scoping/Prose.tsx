import { parseEnumeration } from "@/lib/scoping/format";

/**
 * Renders synthesis prose. Inline numbered enumerations like
 * "... : (1) A ; (2) B ; (3) C" are turned into a bulleted list for readability;
 * otherwise the text renders as a normal paragraph.
 */
export function Prose({ text }: { text: string }) {
  if (!text) return <p className="text-muted-foreground/60">—</p>;

  const parsed = parseEnumeration(text);
  if (parsed) {
    return (
      <div>
        {parsed.intro && <p>{parsed.intro} :</p>}
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {parsed.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </div>
    );
  }

  return <p className="whitespace-pre-line">{text}</p>;
}
