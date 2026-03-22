"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  showTicks?: boolean;
}

function getSliderColor(value: number, min: number, max: number): string {
  const ratio = (value - min) / (max - min);
  if (ratio <= 0.3) return "text-emerald-500";
  if (ratio <= 0.6) return "text-amber-500";
  return "text-red-500";
}

function getSliderBg(value: number, min: number, max: number): string {
  const ratio = (value - min) / (max - min);
  if (ratio <= 0.3) return "bg-emerald-500";
  if (ratio <= 0.6) return "bg-amber-500";
  return "bg-red-500";
}

export function SliderInput({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  minLabel = "Jamais",
  maxLabel = "Systematique",
  showTicks = true,
}: SliderInputProps) {
  const colorClass = useMemo(() => getSliderColor(value, min, max), [value, min, max]);
  const bgClass = useMemo(() => getSliderBg(value, min, max), [value, min, max]);

  const handleChange = useCallback(
    (newValue: number | readonly number[]) => {
      const v = Array.isArray(newValue) ? newValue[0] : newValue;
      onChange(v);
    },
    [onChange]
  );

  const ticks = useMemo(() => {
    const count = Math.floor((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => min + i * step);
  }, [min, max, step]);

  return (
    <div className="w-full space-y-4">
      {/* Current value display */}
      <div className="flex justify-center">
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold",
            bgClass,
            "text-white shadow-lg"
          )}
        >
          {value}
        </motion.div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <Slider
          value={[value]}
          onValueChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={cn(
            "[&_[data-slot=slider-range]]:" + bgClass,
            "[&_[data-slot=slider-thumb]]:border-2",
            "[&_[data-slot=slider-thumb]]:h-5 [&_[data-slot=slider-thumb]]:w-5"
          )}
        />
      </div>

      {/* Tick marks */}
      {showTicks && (
        <div className="relative flex justify-between px-1">
          {ticks.map((tick) => (
            <div
              key={tick}
              className={cn(
                "flex flex-col items-center",
                tick === value ? colorClass : "text-muted-foreground/50"
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-0.5 rounded-full mb-1",
                  tick === value ? bgClass : "bg-muted-foreground/30"
                )}
              />
              <span className="text-[10px] tabular-nums">{tick}</span>
            </div>
          ))}
        </div>
      )}

      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-emerald-600 font-medium">{minLabel}</span>
        <span className="text-red-600 font-medium">{maxLabel}</span>
      </div>
    </div>
  );
}
