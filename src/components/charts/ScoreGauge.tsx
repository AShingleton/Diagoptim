"use client";

import { useTranslation } from "@/hooks/useTranslation";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion";
import { useEffect, useRef } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

function getScoreGradientId(score: number): string {
  if (score <= 30) return "gauge-red";
  if (score <= 50) return "gauge-orange";
  if (score <= 70) return "gauge-yellow";
  return "gauge-green";
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score <= 30) return t("diagnostic.score.critical") || "Critique";
  if (score <= 50) return t("diagnostic.score.insufficient") || "Insuffisant";
  if (score <= 70) return t("diagnostic.score.average") || "Moyen";
  return t("diagnostic.score.good") || "Bon";
}

export default function ScoreGauge({
  score,
  size = 200,
  showLabel = true,
}: ScoreGaugeProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const motionScore = useMotionValue(0);
  const displayScore = useTransform(motionScore, (v) => Math.round(v));

  // Arc geometry
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc spans 270 degrees (from 135deg to 405deg / -225deg to 45deg)
  const startAngle = 135;
  const endAngle = 405;
  const totalArc = endAngle - startAngle; // 270

  // SVG arc path helpers
  function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
  ) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startA: number,
    endA: number
  ): string {
    const start = polarToCartesian(cx, cy, r, endA);
    const end = polarToCartesian(cx, cy, r, startA);
    const largeArcFlag = endA - startA <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  // Background arc path (full 270 degrees)
  const bgArcPath = describeArc(center, center, radius, startAngle, endAngle);

  // Circumference for stroke-dasharray animation
  const arcLength = (totalArc / 360) * 2 * Math.PI * radius;
  const targetDash = (score / 100) * arcLength;

  // Animate score counter
  useEffect(() => {
    if (isInView) {
      const controls = animate(motionScore, score, {
        duration: 1.8,
        ease: "easeOut" as const,
      });
      return controls.stop;
    }
  }, [isInView, score, motionScore]);

  const scoreGradient = getScoreGradientId(score);
  const label = getScoreLabel(score, t as (key: string) => string);

  return (
    <div
      ref={ref}
      className="relative inline-flex flex-col items-center"
      style={{ width: size, height: size + (showLabel ? 32 : 0) }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          {/* Red gradient */}
          <linearGradient id="gauge-red" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(0, 84%, 50%)" />
            <stop offset="100%" stopColor="hsl(0, 84%, 60%)" />
          </linearGradient>
          {/* Orange gradient */}
          <linearGradient id="gauge-orange" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(20, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(35, 95%, 55%)" />
          </linearGradient>
          {/* Yellow gradient */}
          <linearGradient id="gauge-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(35, 95%, 55%)" />
            <stop offset="100%" stopColor="hsl(48, 96%, 53%)" />
          </linearGradient>
          {/* Green gradient */}
          <linearGradient id="gauge-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(100, 60%, 50%)" />
            <stop offset="100%" stopColor="hsl(142, 71%, 45%)" />
          </linearGradient>

          {/* Full spectrum gradient for background ticks */}
          <linearGradient
            id="gauge-spectrum"
            x1="0%"
            y1="100%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="hsl(0, 84%, 60%)" />
            <stop offset="30%" stopColor="hsl(20, 90%, 55%)" />
            <stop offset="50%" stopColor="hsl(48, 96%, 53%)" />
            <stop offset="70%" stopColor="hsl(80, 60%, 50%)" />
            <stop offset="100%" stopColor="hsl(142, 71%, 45%)" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={bgArcPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.5}
        />

        {/* Tick marks */}
        {Array.from({ length: 28 }).map((_, i) => {
          const angle = startAngle + (i / 27) * totalArc;
          const isMajor = i % 9 === 0;
          const innerR = radius - strokeWidth / 2 - (isMajor ? 8 : 4);
          const outerR = radius - strokeWidth / 2 - 1;
          const p1 = polarToCartesian(center, center, innerR, angle);
          const p2 = polarToCartesian(center, center, outerR, angle);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={isMajor ? 1.5 : 0.75}
              opacity={0.3}
            />
          );
        })}

        {/* Animated score arc */}
        <motion.path
          d={bgArcPath}
          fill="none"
          stroke={`url(#${scoreGradient})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#gauge-glow)"
          strokeDasharray={`${arcLength}`}
          initial={{ strokeDashoffset: arcLength }}
          animate={isInView ? { strokeDashoffset: arcLength - targetDash } : {}}
          transition={{ duration: 1.8, ease: "easeOut" as const }}
        />

        {/* Score endpoint dot */}
        {isInView && (
          <motion.circle
            r={strokeWidth / 3}
            fill="white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.3 }}
            cx={polarToCartesian(
              center,
              center,
              radius,
              startAngle + (score / 100) * totalArc
            ).x}
            cy={polarToCartesian(
              center,
              center,
              radius,
              startAngle + (score / 100) * totalArc
            ).y}
          />
        )}

        {/* Center score number */}
        <motion.text
          x={center}
          y={center - size * 0.02}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-heading font-bold fill-foreground"
          style={{ fontSize: size * 0.28 }}
        >
          <motion.tspan>{displayScore}</motion.tspan>
        </motion.text>

        {/* "/100" below score */}
        <text
          x={center}
          y={center + size * 0.15}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.09 }}
        >
          /100
        </text>

        {/* Score label text */}
        <text
          x={center}
          y={center + size * 0.27}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-heading font-semibold"
          style={{ fontSize: size * 0.08 }}
          fill={
            score <= 30
              ? "hsl(0, 84%, 60%)"
              : score <= 50
                ? "hsl(20, 90%, 55%)"
                : score <= 70
                  ? "hsl(48, 96%, 53%)"
                  : "hsl(142, 71%, 45%)"
          }
        >
          {label}
        </text>
      </svg>

      {showLabel && (
        <motion.p
          className="text-sm font-medium text-muted-foreground mt-1"
          initial={{ opacity: 0, y: 5 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          Score global
        </motion.p>
      )}
    </div>
  );
}
