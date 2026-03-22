"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SliderInput } from "./SliderInput";
import { CardSelector } from "./CardSelector";
import {
  ArrowRight,
  SkipForward,
  Upload,
  Calendar,
  Euro,
} from "lucide-react";
import type { DiagnosticQuestion } from "@/types/diagnostic";

interface QuestionCardProps {
  question: DiagnosticQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  onNext: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

const questionVariants = {
  enter: { opacity: 0, y: 30, scale: 0.98 },
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.25 } },
};

export function QuestionCard({
  question,
  value,
  onChange,
  onNext,
  onSkip,
  showSkip = false,
}: QuestionCardProps) {
  const [dragActive, setDragActive] = useState(false);

  const isValid = useCallback((): boolean => {
    if (!question.required) return true;
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }, [question.required, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && isValid()) {
        e.preventDefault();
        onNext();
      }
    },
    [isValid, onNext]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onChange(files);
      }
    },
    [onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        onChange(files);
      }
    },
    [onChange]
  );

  const renderInput = () => {
    switch (question.type) {
      case "slider":
        return (
          <SliderInput
            value={typeof value === "number" ? value : question.sliderMin ?? 0}
            onChange={onChange}
            min={question.sliderMin ?? 0}
            max={question.sliderMax ?? 10}
            minLabel={question.sliderLabels?.min ?? "Jamais"}
            maxLabel={question.sliderLabels?.max ?? "Systematique"}
          />
        );

      case "card-select":
        return (
          <CardSelector
            options={
              question.options?.map((o) => ({
                id: o.id,
                label: o.label,
                description: o.description,
                icon: o.icon,
              })) ?? []
            }
            value={(value as string | string[]) ?? ""}
            onChange={onChange}
          />
        );

      case "multi-select":
        return (
          <CardSelector
            options={
              question.options?.map((o) => ({
                id: o.id,
                label: o.label,
                description: o.description,
                icon: o.icon,
              })) ?? []
            }
            value={(value as string[]) ?? []}
            onChange={onChange}
            multiSelect
          />
        );

      case "text":
        return question.id.includes("description") ||
          question.id.includes("products") ? (
          <Textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre reponse..."
            className="min-h-[100px] bg-card/50 backdrop-blur-sm"
            autoFocus
          />
        ) : (
          <Input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre reponse..."
            className="h-10 bg-card/50 backdrop-blur-sm"
            autoFocus
          />
        );

      case "number":
        return (
          <div className="relative">
            <Input
              type="number"
              value={value !== null && value !== undefined ? String(value) : ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange(v === "" ? null : Number(v));
              }}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="h-10 bg-card/50 backdrop-blur-sm pr-8"
              autoFocus
            />
            {(question.id.includes("revenue") ||
              question.id.includes("amount") ||
              question.id.includes("goal")) && (
              <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        );

      case "file-upload":
        return (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors",
              "backdrop-blur-sm bg-card/50",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/30"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8",
                dragActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                Glissez vos fichiers ici
              </p>
              <p className="text-xs text-muted-foreground">
                ou cliquez pour parcourir (PDF, Excel, images)
              </p>
            </div>
            <Label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="inline-flex h-8 items-center rounded-lg border border-input bg-background px-3 text-xs font-medium hover:bg-muted transition-colors">
                Parcourir
              </span>
            </Label>
            {Array.isArray(value) && (value as File[]).length > 0 && (
              <div className="mt-2 space-y-1 w-full">
                {(value as File[]).map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {(file.size / 1024).toFixed(0)} Ko
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "yes-no-maybe":
        return (
          <CardSelector
            options={[
              { id: "yes", label: "Oui", icon: "target" },
              { id: "no", label: "Non", icon: "trending-down" },
              { id: "maybe", label: "Peut-etre", icon: "compass" },
            ]}
            value={(value as string) ?? ""}
            onChange={onChange}
            columns={3}
          />
        );

      case "date-picker":
        return (
          <div className="relative">
            <Input
              type="date"
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 bg-card/50 backdrop-blur-sm"
              autoFocus
            />
            <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={questionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn(
        "w-full max-w-xl mx-auto rounded-2xl border p-6",
        "backdrop-blur-md bg-card/80 shadow-xl shadow-primary/5",
        "border-border/40"
      )}
    >
      {/* Question text */}
      <div className="mb-5 space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground leading-snug">
          {question.questionKey}
        </h3>
        {question.options && question.type === "card-select" && (
          <p className="text-xs text-muted-foreground">
            Selectionnez une option
          </p>
        )}
        {question.type === "multi-select" && (
          <p className="text-xs text-muted-foreground">
            Selectionnez une ou plusieurs options
          </p>
        )}
      </div>

      {/* Input area */}
      <div className="mb-6">{renderInput()}</div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div>
          {showSkip && !question.required && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="h-3.5 w-3.5 mr-1" />
              Passer
            </Button>
          )}
        </div>

        <Button
          onClick={onNext}
          disabled={question.required && !isValid()}
          size="lg"
          className="gap-1.5"
        >
          Suivant
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Enter hint */}
      {(question.type === "text" || question.type === "number") && (
        <p className="mt-3 text-center text-[10px] text-muted-foreground/60">
          Appuyez sur Entree pour continuer
        </p>
      )}
    </motion.div>
  );
}
