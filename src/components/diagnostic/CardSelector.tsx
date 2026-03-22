"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Target,
  TrendingDown,
  Users,
  Compass,
  Factory,
  Briefcase,
  ShoppingCart,
  Cpu,
  Heart,
  HardHat,
  Wheat,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

interface CardOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface CardSelectorProps {
  options: CardOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  columns?: 2 | 3 | 4;
}

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  "trending-down": TrendingDown,
  users: Users,
  compass: Compass,
  factory: Factory,
  briefcase: Briefcase,
  "shopping-cart": ShoppingCart,
  cpu: Cpu,
  heart: Heart,
  "hard-hat": HardHat,
  wheat: Wheat,
  more: MoreHorizontal,
};

function getIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}

export function CardSelector({
  options,
  value,
  onChange,
  multiSelect = false,
  columns = 2,
}: CardSelectorProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = useCallback(
    (optionId: string) => {
      if (multiSelect) {
        const current = Array.isArray(value) ? value : [];
        const newValue = current.includes(optionId)
          ? current.filter((v) => v !== optionId)
          : [...current, optionId];
        onChange(newValue);
      } else {
        onChange(optionId);
      }
    },
    [value, onChange, multiSelect]
  );

  const gridClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <motion.div
      className={cn("grid gap-3", gridClass)}
      layout
    >
      {options.map((option, index) => {
        const isSelected = selectedValues.includes(option.id);
        const Icon = getIcon(option.icon);

        return (
          <motion.button
            key={option.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
              "backdrop-blur-sm bg-card/80",
              "hover:shadow-lg hover:shadow-primary/5",
              isSelected
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border/50 hover:border-primary/30"
            )}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                layoutId="card-selector-check"
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                &#10003;
              </motion.div>
            )}

            {Icon && (
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}

            <div className="space-y-0.5">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {option.label}
              </p>
              {option.description && (
                <p className="text-xs text-muted-foreground leading-snug">
                  {option.description}
                </p>
              )}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
