import type { ScopingSynthesis } from "@/lib/ai/engine";

type Causes = ScopingSynthesis["ishikawa"]["causes"];

const TOP = [
  { key: "man", label: "Main d'œuvre" },
  { key: "method", label: "Méthodes" },
  { key: "measurement", label: "Mesure" },
] as const;
const BOTTOM = [
  { key: "machine", label: "Machines" },
  { key: "material", label: "Matières" },
  { key: "environment", label: "Milieu" },
] as const;

// Spine base points (x on the spine) and the category block centre x, per column.
const COLS = [
  { baseX: 250, cx: 190 },
  { baseX: 500, cx: 440 },
  { baseX: 750, cx: 690 },
];

const NAVY = "#1B4F72";
const BLUE = "#2E86C1";
const INK = "#cbd5e1"; // slate-300 (readable on dark bg)
const MUTED = "#94a3b8";

function trunc(s: string, n = 42): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Renders the 6M Ishikawa as a fishbone diagram (top 3 / bottom 3 branches to a spine). */
export function FishboneDiagram({
  causes,
  problem,
  rootCause,
}: {
  causes: Causes;
  problem: string;
  rootCause: string;
}) {
  const spineY = 280;
  const headX = 905;

  const branch = (
    col: { baseX: number; cx: number },
    label: string,
    list: string[],
    side: "top" | "bottom",
  ) => {
    const tipY = side === "top" ? 60 : 500;
    const pillY = side === "top" ? 44 : 516;
    // Bone line from near the pill to the spine base point.
    const boneStartY = side === "top" ? tipY + 18 : tipY - 18;
    const shown = list.slice(0, 4).map((c) => trunc(c));
    return (
      <g key={label + side}>
        <line x1={col.cx + 35} y1={boneStartY} x2={col.baseX} y2={spineY} stroke={BLUE} strokeWidth={2} opacity={0.6} />
        <rect x={col.cx - 70} y={pillY - 16} width={140} height={22} rx={11} fill={NAVY} />
        <text x={col.cx} y={pillY} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{label}</text>
        {shown.map((c, i) => (
          <text
            key={i}
            x={col.cx - 66}
            y={side === "top" ? pillY + 20 + i * 16 : pillY - 30 - i * 16}
            fontSize={10.5}
            fill={INK}
          >• {c}</text>
        ))}
        {list.length > 4 && (
          <text x={col.cx - 66} y={side === "top" ? pillY + 20 + 4 * 16 : pillY - 30 - 4 * 16} fontSize={10} fill={MUTED}>
            +{list.length - 4} autre(s)…
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card p-3">
      <svg viewBox="0 0 1120 560" className="min-w-[900px]" role="img" aria-label="Diagramme d'Ishikawa 6M">
        {/* Spine */}
        <line x1={60} y1={spineY} x2={headX} y2={spineY} stroke={INK} strokeWidth={3} />
        <polygon points={`${headX},${spineY - 8} ${headX + 14},${spineY} ${headX},${spineY + 8}`} fill={INK} />
        {/* Head (effect) */}
        <rect x={headX + 14} y={spineY - 58} width={190} height={116} rx={10} fill={NAVY} stroke={BLUE} />
        <text x={headX + 109} y={spineY - 34} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">PROBLÈME</text>
        <foreignObject x={headX + 22} y={spineY - 22} width={174} height={74}>
          <div style={{ fontSize: "10px", lineHeight: "1.2", color: "#e2e8f0" }}>
            {trunc(problem, 130)}
          </div>
        </foreignObject>
        {/* Branches */}
        {TOP.map((m, i) => branch(COLS[i], m.label, causes[m.key] ?? [], "top"))}
        {BOTTOM.map((m, i) => branch(COLS[i], m.label, causes[m.key] ?? [], "bottom"))}
      </svg>
      <p className="mt-2 border-t border-border/50 pt-2 text-sm">
        <span className="font-semibold text-foreground">Cause racine :</span>{" "}
        <span className="text-muted-foreground">{rootCause}</span>
      </p>
    </div>
  );
}
