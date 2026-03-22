"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DiagnosticStep } from "@/types/diagnostic";

interface ProgressBarProps {
  percentage: number;
  currentStep: DiagnosticStep;
}

const STEPS: { key: DiagnosticStep; label: string }[] = [
  { key: "framing", label: "Cadrage" },
  { key: "profile", label: "Profil" },
  { key: "documents", label: "Documents" },
  { key: "wastes", label: "Gaspillages" },
  { key: "intermediate-results", label: "Bilan" },
  { key: "strategic", label: "Strategie" },
  { key: "results", label: "Resultats" },
];

const stepOrder: DiagnosticStep[] = STEPS.map((s) => s.key);

export function ProgressBar({ percentage, currentStep }: ProgressBarProps) {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="w-full space-y-2">
      {/* Percentage + progress track */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
        <motion.span
          key={Math.round(percentage)}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-xs font-semibold text-primary tabular-nums min-w-[3ch] text-right"
        >
          {Math.round(percentage)}%
        </motion.span>
      </div>

      {/* Step labels */}
      <div className="flex justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.key}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-primary scale-100"
                    : isCurrent
                      ? "bg-primary scale-125 ring-2 ring-primary/30"
                      : "bg-muted-foreground/20 scale-75"
                )}
              />
              <span
                className={cn(
                  "text-[10px] leading-none transition-colors hidden sm:block",
                  isCurrent
                    ? "text-primary font-semibold"
                    : isCompleted
                      ? "text-foreground/60"
                      : "text-muted-foreground/40"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
