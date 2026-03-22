"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TimelineDataPoint {
  date: string;
  score: number;
}

interface TimelineChartProps {
  data?: TimelineDataPoint[];
}

// Demo data for when no data is provided
const DEMO_DATA: TimelineDataPoint[] = [
  { date: "2025-01-15", score: 32 },
  { date: "2025-03-01", score: 41 },
  { date: "2025-05-10", score: 48 },
  { date: "2025-07-20", score: 55 },
  { date: "2025-09-05", score: 63 },
  { date: "2025-11-12", score: 71 },
  { date: "2026-01-08", score: 78 },
];

function formatDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatTooltipDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getScoreColor(score: number): string {
  if (score <= 30) return "hsl(0, 84%, 60%)";
  if (score <= 50) return "hsl(20, 90%, 55%)";
  if (score <= 70) return "hsl(48, 96%, 53%)";
  return "hsl(142, 71%, 45%)";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: TimelineDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const score = data.value;
  const color = getScoreColor(score);

  return (
    <div className="glass rounded-lg px-3 py-2 shadow-lg border border-border/50">
      <p className="text-xs text-muted-foreground">
        {formatTooltipDate(data.payload.date)}
      </p>
      <p className="text-lg font-heading font-bold mt-0.5" style={{ color }}>
        {score}
        <span className="text-xs font-normal text-muted-foreground ml-1">
          /100
        </span>
      </p>
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: TimelineDataPoint;
  index?: number;
  dataLength: number;
}

function CustomDot({ cx, cy, payload, index, dataLength }: CustomDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const isLast = index === dataLength - 1;
  const color = getScoreColor(payload.score);

  return (
    <g>
      {isLast && (
        <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.2}>
          <animate
            attributeName="r"
            values="8;14;8"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.05;0.2"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isLast ? 5 : 3.5}
        fill={color}
        stroke="white"
        strokeWidth={2}
      />
    </g>
  );
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  const chartData = useMemo(() => {
    const source = data && data.length > 0 ? data : DEMO_DATA;
    return source.map((point) => ({
      ...point,
      formattedDate: formatDateLabel(point.date),
    }));
  }, [data]);

  const isDemo = !data || data.length === 0;

  // Calculate score change
  const scoreChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].score;
    const last = chartData[chartData.length - 1].score;
    return last - first;
  }, [chartData]);

  const gradientId = "timeline-area-gradient";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" as const }}
      className="w-full"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-heading font-semibold text-foreground">
            {t("diagnostic.timeline.title" as Parameters<typeof t>[0]) ||
              "\u00c9volution du score"}
          </h3>
          {isDemo && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Donn\u00e9es de d\u00e9monstration
            </p>
          )}
        </div>
        {scoreChange !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.4 }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              scoreChange >= 0
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={scoreChange < 0 ? "rotate-180" : ""}
            >
              <path
                d="M6 2.5V9.5M6 2.5L3 5.5M6 2.5L9 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {scoreChange >= 0 ? "+" : ""}
            {scoreChange} pts
          </motion.div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            stroke="hsl(var(--border))"
            opacity={0.3}
            vertical={false}
          />

          <XAxis
            dataKey="formattedDate"
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          />

          <YAxis
            domain={[0, 100]}
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
            tickLine={false}
            axisLine={false}
            width={35}
            tickCount={6}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={(props: Record<string, unknown>) => (
              <CustomDot
                cx={props.cx as number}
                cy={props.cy as number}
                payload={props.payload as TimelineDataPoint}
                index={props.index as number}
                dataLength={chartData.length}
              />
            )}
            activeDot={{
              r: 6,
              fill: "hsl(var(--primary))",
              stroke: "white",
              strokeWidth: 2,
            }}
            isAnimationActive={isInView}
            animationDuration={1500}
            animationEasing="ease-out"
          />

          {/* Reference lines for zones */}
          {[30, 50, 70].map((threshold) => (
            <line
              key={threshold}
              x1="0%"
              y1={`${100 - threshold}%`}
              x2="100%"
              y2={`${100 - threshold}%`}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="2 6"
              strokeOpacity={0.15}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Score zone legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        {[
          { label: "0-30", color: "hsl(0, 84%, 60%)", text: "Critique" },
          { label: "30-50", color: "hsl(20, 90%, 55%)", text: "Insuffisant" },
          { label: "50-70", color: "hsl(48, 96%, 53%)", text: "Moyen" },
          { label: "70-100", color: "hsl(142, 71%, 45%)", text: "Bon" },
        ].map((zone) => (
          <div key={zone.label} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: zone.color }}
            />
            <span>{zone.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
