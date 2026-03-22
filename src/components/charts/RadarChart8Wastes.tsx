"use client";

import { useTranslation } from "@/hooks/useTranslation";
import type { WasteScores, WasteCategory } from "@/types/diagnostic";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RadarChart8WastesProps {
  scores: WasteScores;
  previousScores?: WasteScores;
}

const WASTE_KEYS: WasteCategory[] = [
  "overproduction",
  "waiting",
  "transport",
  "overprocessing",
  "inventory",
  "motion",
  "defects",
  "skills",
];

function getScoreColor(score: number): string {
  if (score <= 3) return "hsl(142, 71%, 45%)"; // green
  if (score <= 6) return "hsl(48, 96%, 53%)"; // yellow
  return "hsl(0, 84%, 60%)"; // red
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    payload: { waste: string; fullLabel: string; score: number; previous?: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const color = getScoreColor(data.score);

  return (
    <div className="glass rounded-lg px-3 py-2 shadow-lg border border-border/50">
      <p className="font-heading font-semibold text-sm text-foreground">
        {data.fullLabel}
      </p>
      <p className="text-sm mt-1" style={{ color }}>
        Score: <span className="font-bold">{data.score.toFixed(1)}</span>/10
      </p>
      {data.previous !== undefined && (
        <p className="text-sm text-muted-foreground mt-0.5">
          Prev: <span className="font-medium">{data.previous.toFixed(1)}</span>/10
        </p>
      )}
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { score: number };
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const color = getScoreColor(payload.score);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="white"
      strokeWidth={1.5}
    />
  );
}

export default function RadarChart8Wastes({
  scores,
  previousScores,
}: RadarChart8WastesProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const data = useMemo(
    () =>
      WASTE_KEYS.map((key) => ({
        waste: key,
        fullLabel: t(`diagnostic.wastes.${key}` as Parameters<typeof t>[0]),
        label: t(`diagnostic.wastes.${key}` as Parameters<typeof t>[0]).slice(0, 12),
        score: scores[key],
        previous: previousScores?.[key],
      })),
    [scores, previousScores, t]
  );

  const handleAnimationStart = useCallback(() => {
    setIsVisible(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
      onAnimationStart={handleAnimationStart}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          {/* Color zone backgrounds via multiple PolarRadiusAxis ticks */}
          <PolarGrid
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
          />
          <PolarAngleAxis
            dataKey="label"
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
              fontWeight: 500,
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            tickCount={6}
            axisLine={false}
          />

          {/* Color zone reference areas rendered as radars */}
          <Radar
            name="zone-red"
            dataKey={() => 10}
            fill="hsl(0, 84%, 60%)"
            fillOpacity={0.05}
            stroke="none"
            isAnimationActive={false}
          />
          <Radar
            name="zone-yellow"
            dataKey={() => 6}
            fill="hsl(48, 96%, 53%)"
            fillOpacity={0.05}
            stroke="none"
            isAnimationActive={false}
          />
          <Radar
            name="zone-green"
            dataKey={() => 3}
            fill="hsl(142, 71%, 45%)"
            fillOpacity={0.08}
            stroke="none"
            isAnimationActive={false}
          />

          {/* Previous scores - dashed overlay */}
          {previousScores && (
            <Radar
              name="previous"
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.05}
              isAnimationActive={isVisible}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          )}

          {/* Current scores */}
          <Radar
            name="current"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            dot={<CustomDot />}
            isAnimationActive={isVisible}
            animationDuration={1500}
            animationEasing="ease-out"
          />

          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(142, 71%, 45%)" }}
          />
          <span>0-3 Bon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(48, 96%, 53%)" }}
          />
          <span>3-6 Moyen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(0, 84%, 60%)" }}
          />
          <span>6-10 Critique</span>
        </div>
        {previousScores && (
          <div className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-muted-foreground" />
            <span>Diagnostic pr&eacute;c&eacute;dent</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
