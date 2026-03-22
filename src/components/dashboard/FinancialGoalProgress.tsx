"use client";

import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

interface FinancialGoalProgressProps {
  current: number;
  goal: number;
  label?: string;
}

export function FinancialGoalProgress({ current, goal, label }: FinancialGoalProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const progress = Math.min((current / goal) * 100, 100);

  const motionValue = useMotionValue(0);
  const displayCurrent = useTransform(motionValue, (v) =>
    Math.round(v).toLocaleString("fr-FR")
  );

  useEffect(() => {
    if (isInView) {
      animate(motionValue, current, { duration: 1.2, ease: "easeOut" });
    }
  }, [isInView, current, motionValue]);

  return (
    <div ref={ref} className="space-y-3">
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <motion.span className="text-3xl font-bold text-primary">
            {displayCurrent}
          </motion.span>
          <span className="text-lg text-muted-foreground">€</span>
        </div>
        <span className="text-sm text-muted-foreground">
          / {goal.toLocaleString("fr-FR")}€
        </span>
      </div>
      <div className="relative h-4 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${progress}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {progress.toFixed(0)}%
      </p>
    </div>
  );
}
