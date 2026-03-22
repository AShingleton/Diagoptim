"use client";

import { useTranslation } from "@/hooks/useTranslation";
import type { SWOTData } from "@/types/diagnostic";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";

interface SWOTMatrixProps {
  data: SWOTData;
  onUpdate?: (data: SWOTData) => void;
  editable?: boolean;
}

type SWOTCategory = keyof SWOTData;

interface QuadrantConfig {
  key: SWOTCategory;
  labelKey: string;
  fallback: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

const QUADRANTS: QuadrantConfig[] = [
  {
    key: "strengths",
    labelKey: "diagnostic.swot.strengths",
    fallback: "Forces",
    icon: "S",
    bgColor: "from-green-500/8 to-green-500/3",
    borderColor: "border-green-500/20 hover:border-green-500/40",
    textColor: "text-green-600 dark:text-green-400",
    badgeBg: "bg-green-500/15",
  },
  {
    key: "weaknesses",
    labelKey: "diagnostic.swot.weaknesses",
    fallback: "Faiblesses",
    icon: "W",
    bgColor: "from-red-500/8 to-red-500/3",
    borderColor: "border-red-500/20 hover:border-red-500/40",
    textColor: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-500/15",
  },
  {
    key: "opportunities",
    labelKey: "diagnostic.swot.opportunities",
    fallback: "Opportunit\u00e9s",
    icon: "O",
    bgColor: "from-blue-500/8 to-blue-500/3",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    textColor: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/15",
  },
  {
    key: "threats",
    labelKey: "diagnostic.swot.threats",
    fallback: "Menaces",
    icon: "T",
    bgColor: "from-orange-500/8 to-orange-500/3",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
    textColor: "text-orange-600 dark:text-orange-400",
    badgeBg: "bg-orange-500/15",
  },
];

interface SWOTItemProps {
  text: string;
  index: number;
  category: SWOTCategory;
  config: QuadrantConfig;
  editable: boolean;
  onEdit: (category: SWOTCategory, index: number, value: string) => void;
  onRemove: (category: SWOTCategory, index: number) => void;
}

function SWOTItem({
  text,
  index,
  category,
  config,
  editable,
  onEdit,
  onRemove,
}: SWOTItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== text) {
      onEdit(category, index, trimmed);
    } else {
      setEditValue(text);
    }
    setIsEditing(false);
  }, [editValue, text, category, index, onEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        setEditValue(text);
        setIsEditing(false);
      }
    },
    [handleSave, text]
  );

  if (isEditing && editable) {
    return (
      <motion.div
        layout
        className="flex items-center gap-1.5"
      >
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-background/80 border border-input rounded-md px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </motion.div>
    );
  }

  const isLong = text.length > 60;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex items-start gap-2"
    >
      <span
        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${config.badgeBg}`}
      />
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (editable) {
              setIsEditing(true);
            } else if (isLong) {
              setIsExpanded(!isExpanded);
            }
          }}
          className={`text-left text-sm text-foreground/90 leading-snug ${
            editable
              ? "cursor-text hover:text-foreground"
              : isLong
                ? "cursor-pointer"
                : "cursor-default"
          } ${!isExpanded && isLong ? "line-clamp-2" : ""}`}
        >
          {text}
        </button>
      </div>
      {editable && (
        <button
          type="button"
          onClick={() => onRemove(category, index)}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 p-0.5 rounded hover:bg-destructive/10"
          aria-label="Supprimer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-destructive"
          >
            <path
              d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

interface AddItemInputProps {
  category: SWOTCategory;
  config: QuadrantConfig;
  onAdd: (category: SWOTCategory, value: string) => void;
}

function AddItemInput({ category, config, onAdd }: AddItemInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(category, trimmed);
      setValue("");
      setIsAdding(false);
    }
  }, [value, category, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setValue("");
        setIsAdding(false);
      }
    },
    [handleSubmit]
  );

  if (isAdding) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-1.5 mt-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (!value.trim()) setIsAdding(false);
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Nouvel \u00e9l\u00e9ment..."
          className="flex-1 bg-background/80 border border-input rounded-md px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleSubmit}
          className={`p-1 rounded ${config.badgeBg} ${config.textColor}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7L5.5 10.5L12 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => setIsAdding(true)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`mt-2 flex items-center gap-1 text-xs ${config.textColor} opacity-60 hover:opacity-100 transition-opacity`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 2.5V9.5M2.5 6H9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      Ajouter
    </motion.button>
  );
}

export default function SWOTMatrix({
  data,
  onUpdate,
  editable = false,
}: SWOTMatrixProps) {
  const { t } = useTranslation();

  const handleEdit = useCallback(
    (category: SWOTCategory, index: number, value: string) => {
      if (!onUpdate) return;
      const newData = { ...data };
      newData[category] = [...newData[category]];
      newData[category][index] = value;
      onUpdate(newData);
    },
    [data, onUpdate]
  );

  const handleRemove = useCallback(
    (category: SWOTCategory, index: number) => {
      if (!onUpdate) return;
      const newData = { ...data };
      newData[category] = newData[category].filter((_, i) => i !== index);
      onUpdate(newData);
    },
    [data, onUpdate]
  );

  const handleAdd = useCallback(
    (category: SWOTCategory, value: string) => {
      if (!onUpdate) return;
      const newData = { ...data };
      newData[category] = [...newData[category], value];
      onUpdate(newData);
    },
    [data, onUpdate]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {QUADRANTS.map((config, quadrantIndex) => {
        const items = data[config.key];
        const label =
          t(config.labelKey as Parameters<typeof t>[0]) || config.fallback;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: quadrantIndex * 0.1,
              duration: 0.4,
              ease: "easeOut" as const,
            }}
            className={`
              relative overflow-hidden rounded-xl border
              bg-gradient-to-br ${config.bgColor}
              ${config.borderColor}
              backdrop-blur-md
              bg-card/60 dark:bg-card/40
              transition-colors duration-200
              p-4 min-h-[160px]
            `}
          >
            {/* Glassmorphism inner highlight */}
            <div className="absolute inset-0 bg-white/5 dark:bg-white/[0.02] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-2 mb-3 relative">
              <span
                className={`
                  w-7 h-7 rounded-lg flex items-center justify-center
                  font-heading font-bold text-sm
                  ${config.badgeBg} ${config.textColor}
                `}
              >
                {config.icon}
              </span>
              <h3 className={`font-heading font-semibold text-sm ${config.textColor}`}>
                {label}
              </h3>
              <span className="ml-auto text-xs text-muted-foreground font-medium">
                {items.length}
              </span>
            </div>

            {/* Items list */}
            <div className="space-y-2 relative">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <SWOTItem
                    key={`${config.key}-${index}-${item}`}
                    text={item}
                    index={index}
                    category={config.key}
                    config={config}
                    editable={editable}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                  />
                ))}
              </AnimatePresence>

              {items.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic py-2">
                  Aucun \u00e9l\u00e9ment
                </p>
              )}
            </div>

            {/* Add button */}
            {editable && (
              <AnimatePresence>
                <AddItemInput
                  category={config.key}
                  config={config}
                  onAdd={handleAdd}
                />
              </AnimatePresence>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
