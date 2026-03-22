"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lightbulb, TrendingUp, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MiniInsightProps {
  type: "positive" | "warning" | "tip";
  message: string;
  visible: boolean;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const insightConfig = {
  positive: {
    icon: TrendingUp,
    bg: "bg-emerald-500/10 border-emerald-500/30",
    iconBg: "bg-emerald-500/20 text-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10 border-amber-500/30",
    iconBg: "bg-amber-500/20 text-amber-600",
    text: "text-amber-700 dark:text-amber-400",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-blue-500/10 border-blue-500/30",
    iconBg: "bg-blue-500/20 text-blue-600",
    text: "text-blue-700 dark:text-blue-400",
  },
};

export function MiniInsight({
  type,
  message,
  visible,
  onDismiss,
  autoDismissMs = 5000,
}: MiniInsightProps) {
  const config = insightConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, onDismiss, autoDismissMs]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4",
            "backdrop-blur-md bg-card/80 shadow-lg",
            config.bg
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              config.iconBg
            )}
          >
            <Icon className="h-4 w-4" />
          </div>

          <p className={cn("flex-1 text-sm leading-relaxed", config.text)}>
            {message}
          </p>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
