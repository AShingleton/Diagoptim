"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback, useRef } from "react";

interface MatrixAction {
  id: string;
  title: string;
  impact: number;
  effort: number;
}

interface ImpactEffortMatrixProps {
  actions: MatrixAction[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  action: MatrixAction | null;
}

const QUADRANT_LABELS = [
  { key: "quickWins", labelKey: "diagnostic.matrix.quickWins", x: 25, y: 25 },
  { key: "majorProjects", labelKey: "diagnostic.matrix.majorProjects", x: 75, y: 25 },
  { key: "fillIns", labelKey: "diagnostic.matrix.fillIns", x: 25, y: 75 },
  { key: "thankless", labelKey: "diagnostic.matrix.thankless", x: 75, y: 75 },
] as const;

const QUADRANT_FALLBACKS: Record<string, string> = {
  quickWins: "Quick Wins",
  majorProjects: "Projets majeurs",
  fillIns: "Compl\u00e9ments",
  thankless: "T\u00e2ches ingrates",
};

function getQuadrantColor(effort: number, impact: number): string {
  if (impact >= 5 && effort < 5) return "hsl(142, 71%, 45%)"; // Quick Wins - green
  if (impact >= 5 && effort >= 5) return "hsl(210, 70%, 55%)"; // Major Projects - blue
  if (impact < 5 && effort < 5) return "hsl(48, 96%, 53%)"; // Fill-ins - yellow
  return "hsl(0, 84%, 60%)"; // Thankless - red
}

export default function ImpactEffortMatrix({
  actions,
}: ImpactEffortMatrixProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    action: null,
  });

  // Padding and dimensions as percentages
  const padding = 50;
  const viewWidth = 500;
  const viewHeight = 500;
  const plotLeft = padding;
  const plotTop = padding;
  const plotWidth = viewWidth - padding * 2;
  const plotHeight = viewHeight - padding * 2;

  const mapToSvg = useCallback(
    (effort: number, impact: number) => ({
      x: plotLeft + (effort / 10) * plotWidth,
      y: plotTop + (1 - impact / 10) * plotHeight,
    }),
    [plotLeft, plotTop, plotWidth, plotHeight]
  );

  const mappedActions = useMemo(
    () =>
      actions.map((action) => ({
        ...action,
        pos: mapToSvg(action.effort, action.impact),
        color: getQuadrantColor(action.effort, action.impact),
      })),
    [actions, mapToSvg]
  );

  const handleMouseEnter = useCallback(
    (action: MatrixAction, event: React.MouseEvent) => {
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top - 10,
        action,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false, action: null }));
  }, []);

  // Mid-points for quadrant centers
  const midX = plotLeft + plotWidth / 2;
  const midY = plotTop + plotHeight / 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full relative"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full h-auto max-h-[500px]"
        role="img"
        aria-label="Impact vs Effort Matrix"
      >
        <defs>
          {/* Drop shadow for dots */}
          <filter id="dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Quadrant backgrounds */}
        {/* Quick Wins - top left (low effort, high impact) */}
        <rect
          x={plotLeft}
          y={plotTop}
          width={plotWidth / 2}
          height={plotHeight / 2}
          fill="hsl(142, 71%, 45%)"
          opacity={0.08}
        />
        {/* Major Projects - top right (high effort, high impact) */}
        <rect
          x={midX}
          y={plotTop}
          width={plotWidth / 2}
          height={plotHeight / 2}
          fill="hsl(210, 70%, 55%)"
          opacity={0.08}
        />
        {/* Fill-ins - bottom left (low effort, low impact) */}
        <rect
          x={plotLeft}
          y={midY}
          width={plotWidth / 2}
          height={plotHeight / 2}
          fill="hsl(48, 96%, 53%)"
          opacity={0.08}
        />
        {/* Thankless Tasks - bottom right (high effort, low impact) */}
        <rect
          x={midX}
          y={midY}
          width={plotWidth / 2}
          height={plotHeight / 2}
          fill="hsl(0, 84%, 60%)"
          opacity={0.08}
        />

        {/* Grid lines */}
        <line
          x1={midX}
          y1={plotTop}
          x2={midX}
          y2={plotTop + plotHeight}
          stroke="hsl(var(--border))"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <line
          x1={plotLeft}
          y1={midY}
          x2={plotLeft + plotWidth}
          y2={midY}
          stroke="hsl(var(--border))"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Border */}
        <rect
          x={plotLeft}
          y={plotTop}
          width={plotWidth}
          height={plotHeight}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1}
        />

        {/* Quadrant labels */}
        {QUADRANT_LABELS.map((q) => {
          const cx = plotLeft + (q.x / 100) * plotWidth;
          const cy = plotTop + (q.y / 100) * plotHeight;
          const label =
            t(q.labelKey as Parameters<typeof t>[0]) ||
            QUADRANT_FALLBACKS[q.key];
          return (
            <text
              key={q.key}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground/40 font-heading"
              fontSize={13}
              fontWeight={600}
            >
              {label}
            </text>
          );
        })}

        {/* Axis labels */}
        <text
          x={viewWidth / 2}
          y={viewHeight - 8}
          textAnchor="middle"
          className="fill-muted-foreground font-heading"
          fontSize={13}
          fontWeight={600}
        >
          Effort →
        </text>
        <text
          x={14}
          y={viewHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(-90, 14, ${viewHeight / 2})`}
          className="fill-muted-foreground font-heading"
          fontSize={13}
          fontWeight={600}
        >
          Impact →
        </text>

        {/* Axis tick labels */}
        {[0, 2, 4, 6, 8, 10].map((val) => {
          const x = plotLeft + (val / 10) * plotWidth;
          const y = plotTop + (1 - val / 10) * plotHeight;
          return (
            <g key={val}>
              {/* X axis ticks */}
              <text
                x={x}
                y={plotTop + plotHeight + 16}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {val}
              </text>
              {/* Y axis ticks */}
              <text
                x={plotLeft - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Action dots */}
        {mappedActions.map((action, index) => (
          <motion.g
            key={action.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1 + index * 0.08,
              duration: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            style={{ originX: `${action.pos.x}px`, originY: `${action.pos.y}px` }}
          >
            <circle
              cx={action.pos.x}
              cy={action.pos.y}
              r={12}
              fill={action.color}
              opacity={0.85}
              filter="url(#dot-shadow)"
              className="cursor-pointer transition-all duration-150 hover:opacity-100"
              onMouseEnter={(e) => handleMouseEnter(action, e)}
              onMouseLeave={handleMouseLeave}
              style={{ transformOrigin: `${action.pos.x}px ${action.pos.y}px` }}
            />
            <circle
              cx={action.pos.x}
              cy={action.pos.y}
              r={12}
              fill="transparent"
              stroke="white"
              strokeWidth={1.5}
              opacity={0.5}
              className="pointer-events-none"
            />
            {/* Action index label inside dot */}
            <text
              x={action.pos.x}
              y={action.pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={9}
              fontWeight={700}
              className="pointer-events-none"
            >
              {index + 1}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Tooltip overlay */}
      <AnimatePresence>
        {tooltip.visible && tooltip.action && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="glass absolute px-3 py-2 rounded-lg shadow-lg border border-border/50 pointer-events-none z-10 max-w-[200px]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="text-sm font-semibold text-foreground truncate">
              {tooltip.action.title}
            </p>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              <span>
                Impact:{" "}
                <span className="font-medium text-foreground">
                  {tooltip.action.impact}
                </span>
              </span>
              <span>
                Effort:{" "}
                <span className="font-medium text-foreground">
                  {tooltip.action.effort}
                </span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action legend */}
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {mappedActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{
                  background: action.color,
                  fontSize: 8,
                }}
              >
                {index + 1}
              </span>
              <span className="truncate max-w-[120px]">{action.title}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
