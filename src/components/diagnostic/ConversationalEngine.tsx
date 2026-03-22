"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDiagnosticStore } from "@/stores/diagnosticStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import { ProgressBar } from "./ProgressBar";
import { MiniInsight } from "./MiniInsight";
import { framingQuestions } from "./FramingQuestions";
import { profileQuestions } from "./CompanyProfile";
import {
  Save,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import type {
  DiagnosticQuestion,
  DiagnosticStep,
  WasteCategory,
} from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Document upload question
// ---------------------------------------------------------------------------
const documentQuestions: DiagnosticQuestion[] = [
  {
    id: "documents_upload",
    category: "documents",
    questionKey:
      "Avez-vous des documents a partager ? (bilans, P&L, tableaux de bord...)",
    type: "file-upload",
    required: false,
    weight: 0,
  },
];

// ---------------------------------------------------------------------------
// Waste questions -- 2 per category = 16
// ---------------------------------------------------------------------------
const wasteLabels: Record<WasteCategory, { name: string; q1: string; q2: string }> = {
  overproduction: {
    name: "Surproduction",
    q1: "Produisez-vous regulierement plus que la demande reelle ?",
    q2: "Vos stocks de produits finis augmentent-ils sans commande client ?",
  },
  waiting: {
    name: "Attente",
    q1: "Vos equipes attendent-elles souvent des informations ou validations ?",
    q2: "Y a-t-il des temps morts reguliers dans vos processus ?",
  },
  transport: {
    name: "Transport",
    q1: "Les deplacements de materiaux/documents sont-ils optimises ?",
    q2: "Y a-t-il des allers-retours inutiles entre services ou sites ?",
  },
  overprocessing: {
    name: "Sur-qualite",
    q1: "Effectuez-vous des taches qui n'apportent pas de valeur au client ?",
    q2: "Vos processus comportent-ils des etapes redondantes ?",
  },
  inventory: {
    name: "Stocks",
    q1: "Avez-vous des stocks excessifs de matieres ou fournitures ?",
    q2: "Des produits restent-ils longtemps en stock avant d'etre utilises ?",
  },
  motion: {
    name: "Mouvements",
    q1: "Vos collaborateurs effectuent-ils des deplacements inutiles au quotidien ?",
    q2: "L'ergonomie des postes de travail est-elle optimisee ?",
  },
  defects: {
    name: "Defauts",
    q1: "Quel est le taux de retouches ou de rebuts dans votre activite ?",
    q2: "Les reclamations clients liees a la qualite sont-elles frequentes ?",
  },
  skills: {
    name: "Competences",
    q1: "Les competences de vos collaborateurs sont-elles pleinement utilisees ?",
    q2: "Y a-t-il un ecart entre les competences disponibles et les besoins ?",
  },
};

const wasteCategories: WasteCategory[] = [
  "overproduction",
  "waiting",
  "transport",
  "overprocessing",
  "inventory",
  "motion",
  "defects",
  "skills",
];

const wasteQuestions: DiagnosticQuestion[] = wasteCategories.flatMap(
  (cat) => [
    {
      id: `waste_${cat}_1`,
      category: cat as WasteCategory,
      questionKey: wasteLabels[cat].q1,
      type: "slider" as const,
      sliderMin: 0,
      sliderMax: 10,
      sliderLabels: { min: "Jamais", max: "Systematique" },
      required: true,
      weight: 1,
    },
    {
      id: `waste_${cat}_2`,
      category: cat as WasteCategory,
      questionKey: wasteLabels[cat].q2,
      type: "slider" as const,
      sliderMin: 0,
      sliderMax: 10,
      sliderLabels: { min: "Jamais", max: "Systematique" },
      required: true,
      weight: 1,
    },
  ]
);

// ---------------------------------------------------------------------------
// Strategic questions
// ---------------------------------------------------------------------------
const strategicQuestions: DiagnosticQuestion[] = [
  {
    id: "strategic_priorities",
    category: "strategic",
    questionKey: "Quels sont vos 3 axes prioritaires d'amelioration ?",
    type: "multi-select",
    required: false,
    options: [
      { id: "quality", label: "Qualite", icon: "target" },
      { id: "costs", label: "Reduction des couts", icon: "trending-down" },
      { id: "speed", label: "Rapidite / delais", icon: "compass" },
      { id: "innovation", label: "Innovation", icon: "cpu" },
      { id: "hr", label: "Ressources humaines", icon: "users" },
      { id: "digital", label: "Transformation digitale", icon: "cpu" },
    ],
    weight: 1,
  },
  {
    id: "strategic_constraints",
    category: "strategic",
    questionKey: "Quelles sont vos principales contraintes actuelles ?",
    type: "text",
    required: false,
    weight: 1,
  },
];

// ---------------------------------------------------------------------------
// All questions in order, grouped by step
// ---------------------------------------------------------------------------
const STEP_ORDER: DiagnosticStep[] = [
  "framing",
  "profile",
  "documents",
  "wastes",
  "intermediate-results",
  "strategic",
  "results",
];

const questionsByStep: Record<string, DiagnosticQuestion[]> = {
  framing: framingQuestions,
  profile: profileQuestions,
  documents: documentQuestions,
  wastes: wasteQuestions,
  strategic: strategicQuestions,
};

const ALL_QUESTIONS: DiagnosticQuestion[] = [
  ...framingQuestions,
  ...profileQuestions,
  ...documentQuestions,
  ...wasteQuestions,
  ...strategicQuestions,
];

// ---------------------------------------------------------------------------
// Insight generation helpers
// ---------------------------------------------------------------------------
interface InsightData {
  type: "positive" | "warning" | "tip";
  message: string;
}

function generateInsight(
  answeredCount: number,
  answers: Record<string, unknown>
): InsightData | null {
  // After framing
  if (answeredCount === 4) {
    const goalType = answers["framing_goal_type"];
    if (goalType === "reduce_costs") {
      return {
        type: "tip",
        message:
          "La reduction des couts est souvent le levier le plus rapide. Le diagnostic va identifier vos gaspillages principaux.",
      };
    }
    return {
      type: "positive",
      message:
        "Excellent objectif ! Nous allons maintenant mieux comprendre votre entreprise pour personnaliser les recommandations.",
    };
  }

  // After profile
  if (answeredCount === 10) {
    const employees = answers["profile_employees"];
    if (typeof employees === "number" && employees > 50) {
      return {
        type: "tip",
        message:
          "Avec plus de 50 salaries, les gaspillages lies aux mouvements et a l'attente sont souvent les plus impactants.",
      };
    }
    return {
      type: "positive",
      message:
        "Profil enregistre ! Passons maintenant a l'analyse des 8 categories de gaspillage.",
    };
  }

  // Mid waste (after 8 waste questions = 4 categories)
  if (answeredCount === 19) {
    const wasteKeys = Object.keys(answers).filter((k) => k.startsWith("waste_"));
    const wasteValues = wasteKeys
      .map((k) => answers[k])
      .filter((v): v is number => typeof v === "number");
    const avg = wasteValues.length > 0
      ? wasteValues.reduce((a, b) => a + b, 0) / wasteValues.length
      : 0;

    if (avg > 6) {
      return {
        type: "warning",
        message: `Score moyen de ${avg.toFixed(1)}/10 -- Des gains significatifs sont possibles. Continuons l'analyse.`,
      };
    }
    return {
      type: "positive",
      message: `Score moyen de ${avg.toFixed(1)}/10 -- Bon niveau, voyons si d'autres categories revelent des opportunites.`,
    };
  }

  // After all wastes
  if (answeredCount === 27) {
    return {
      type: "tip",
      message:
        "Analyse des gaspillages terminee ! Plus que quelques questions strategiques avant vos resultats.",
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ConversationalEngine() {
  const { t } = useTranslation();
  const store = useDiagnosticStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Local values for current question (before committing to store)
  const [localValue, setLocalValue] = useState<unknown>(null);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);

  // Flatten questions relevant to the current step sequence
  const allQuestions = ALL_QUESTIONS;
  const totalQuestions = allQuestions.length;

  // Global question index across all steps
  const globalIndex = store.currentQuestionIndex;
  const currentQuestion = allQuestions[globalIndex] ?? null;

  // Derive which step we're on based on current question
  const currentStep = useMemo((): DiagnosticStep => {
    if (!currentQuestion) return "results";
    const cat = currentQuestion.category;
    if (cat === "framing") return "framing";
    if (cat === "profile") return "profile";
    if (cat === "documents") return "documents";
    if (cat === "strategic") return "strategic";
    // Waste categories
    if (wasteCategories.includes(cat as WasteCategory)) return "wastes";
    return "wastes";
  }, [currentQuestion]);

  // Keep store step in sync
  useEffect(() => {
    if (currentStep !== store.currentStep) {
      store.setStep(currentStep);
    }
  }, [currentStep, store]);

  // Compute completion percentage
  const answeredCount = Object.keys(store.answers).length;
  const percentage = Math.round((answeredCount / totalQuestions) * 100);

  useEffect(() => {
    store.setCompletionPercentage(percentage);
  }, [percentage, store]);

  // Load existing answer when navigating to a question
  useEffect(() => {
    if (currentQuestion) {
      const existing = store.answers[currentQuestion.id];
      setLocalValue(existing ? existing.value : null);
    }
  }, [globalIndex, currentQuestion, store.answers]);

  // Auto-scroll to bottom when question changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalIndex]);

  // Start diagnostic on first mount if no ID
  useEffect(() => {
    if (!store.diagnosticId) {
      store.startNewDiagnostic();
    }
  }, [store]);

  // Handle moving to next question
  const handleNext = useCallback(() => {
    if (!currentQuestion) return;

    // Save answer
    store.addAnswer(currentQuestion.id, localValue);

    // Sync framing data
    if (currentQuestion.category === "framing") {
      if (currentQuestion.id === "framing_goal_type") {
        store.updateFraming({ financialGoalType: localValue as "increase_revenue" | "reduce_costs" });
      } else if (currentQuestion.id === "framing_goal_amount") {
        store.updateFraming({ financialGoalAmount: localValue as number });
      } else if (currentQuestion.id === "framing_time_horizon") {
        store.updateFraming({ timeHorizonMonths: localValue as number });
      } else if (currentQuestion.id === "framing_autonomy") {
        store.updateFraming({ autonomyLevel: localValue as "self" | "guided" | "accompanied" });
      }
    }

    // Sync company profile data
    if (currentQuestion.category === "profile") {
      if (currentQuestion.id === "profile_company_name") {
        store.updateCompanyProfile({ name: localValue as string });
      } else if (currentQuestion.id === "profile_sector") {
        store.updateCompanyProfile({ sector: localValue as string });
      } else if (currentQuestion.id === "profile_employees") {
        store.updateCompanyProfile({ employeeCount: localValue as number });
      } else if (currentQuestion.id === "profile_revenue") {
        store.updateCompanyProfile({ annualRevenue: localValue as number });
      } else if (currentQuestion.id === "profile_location") {
        store.updateCompanyProfile({ location: localValue as string });
      } else if (currentQuestion.id === "profile_products") {
        store.updateCompanyProfile({ productsDescription: localValue as string });
      }
    }

    const nextAnsweredCount = answeredCount + 1;

    // Check for insight trigger
    const insight = generateInsight(nextAnsweredCount, {
      ...Object.fromEntries(
        Object.entries(store.answers).map(([k, v]) => [k, v.value])
      ),
      [currentQuestion.id]: localValue,
    });

    if (insight) {
      setInsightData(insight);
      setShowInsight(true);
    }

    // Compute waste scores when all waste questions done
    const nextIndex = globalIndex + 1;
    const isLastWaste =
      currentQuestion.id === "waste_skills_2" ||
      (nextIndex < allQuestions.length &&
        allQuestions[nextIndex]?.category === "strategic" &&
        currentQuestion.category !== "strategic" &&
        currentQuestion.category !== "documents" &&
        currentQuestion.category !== "profile" &&
        currentQuestion.category !== "framing");

    if (isLastWaste || currentQuestion.id === "waste_skills_2") {
      computeWasteScores({
        ...Object.fromEntries(
          Object.entries(store.answers).map(([k, v]) => [k, v.value])
        ),
        [currentQuestion.id]: localValue,
      });
    }

    // Move to next or finish
    if (nextIndex >= totalQuestions) {
      store.setQuestionIndex(totalQuestions);
      store.setStep("results");
    } else {
      store.setQuestionIndex(nextIndex);
    }

    setLocalValue(null);
  }, [currentQuestion, localValue, globalIndex, store, answeredCount, allQuestions, totalQuestions]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;
    const nextIndex = globalIndex + 1;
    if (nextIndex >= totalQuestions) {
      store.setQuestionIndex(totalQuestions);
      store.setStep("results");
    } else {
      store.setQuestionIndex(nextIndex);
    }
    setLocalValue(null);
  }, [currentQuestion, globalIndex, store, totalQuestions]);

  // Compute waste scores from answers
  const computeWasteScores = useCallback(
    (allAnswers: Record<string, unknown>) => {
      const scores: Record<string, number> = {};
      for (const cat of wasteCategories) {
        const v1 = allAnswers[`waste_${cat}_1`];
        const v2 = allAnswers[`waste_${cat}_2`];
        const s1 = typeof v1 === "number" ? v1 : 0;
        const s2 = typeof v2 === "number" ? v2 : 0;
        scores[cat] = Math.round(((s1 + s2) / 2) * 10) / 10;
      }
      store.setWasteScores(scores as any);

      const values = Object.values(scores);
      const global =
        values.length > 0
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : 0;
      store.setGlobalScore(global);
    },
    [store]
  );

  // Save and resume
  const handleSave = useCallback(() => {
    // Store is already persisted via zustand persist middleware
    setSaveConfirm(true);
    setTimeout(() => setSaveConfirm(false), 2500);
  }, []);

  // Past answers for chat history display
  const pastAnswers = useMemo(() => {
    const entries: { question: DiagnosticQuestion; value: unknown }[] = [];
    for (let i = 0; i < globalIndex; i++) {
      const q = allQuestions[i];
      if (!q) continue;
      const answer = store.answers[q.id];
      if (answer) {
        entries.push({ question: q, value: answer.value });
      }
    }
    return entries;
  }, [globalIndex, allQuestions, store.answers]);

  // Format answer for display
  const formatAnswer = useCallback((q: DiagnosticQuestion, value: unknown): string => {
    if (value === null || value === undefined) return "---";

    switch (q.type) {
      case "card-select": {
        const opt = q.options?.find((o) => o.id === value);
        return opt ? opt.label : String(value);
      }
      case "multi-select": {
        if (Array.isArray(value)) {
          return value
            .map((v) => {
              const opt = q.options?.find((o) => o.id === v);
              return opt ? opt.label : v;
            })
            .join(", ");
        }
        return String(value);
      }
      case "slider":
        return `${value}/10`;
      case "number":
        if (
          q.id.includes("revenue") ||
          q.id.includes("amount") ||
          q.id.includes("goal")
        ) {
          return `${Number(value).toLocaleString("fr-FR")} EUR`;
        }
        return String(value);
      case "file-upload":
        if (Array.isArray(value)) {
          return `${(value as File[]).length} fichier(s)`;
        }
        return "Aucun fichier";
      default:
        return String(value);
    }
  }, []);

  // Results screen
  if (currentStep === "results" || globalIndex >= totalQuestions) {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-center"
        >
          Diagnostic termine !
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-center max-w-md"
        >
          Vos resultats sont prets. Score global :{" "}
          <span className="font-bold text-primary">
            {store.globalScore !== null ? `${store.globalScore}/10` : "En cours de calcul..."}
          </span>
        </motion.p>
        {store.wasteScores && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md space-y-2"
          >
            {wasteCategories.map((cat) => {
              const score = (store.wasteScores as any)?.[cat] ?? 0;
              const pct = (score / 10) * 100;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-28 text-right">
                    {wasteLabels[cat].name}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className={cn(
                        "h-full rounded-full",
                        score <= 3
                          ? "bg-emerald-500"
                          : score <= 6
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                    />
                  </div>
                  <span className="text-xs tabular-nums font-semibold w-8">
                    {score}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Header: progress + save */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar percentage={percentage} currentStep={currentStep} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="shrink-0 gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saveConfirm ? "Sauvegarde !" : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Chat history (past answers) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {pastAnswers.map(({ question, value }, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-xl mx-auto space-y-1.5"
          >
            {/* Question bubble */}
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                <MessageSquare className="h-3 w-3" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {question.questionKey}
              </p>
            </div>
            {/* Answer bubble */}
            <div className="ml-8 inline-block rounded-xl bg-primary/5 border border-primary/10 px-3 py-1.5">
              <p className="text-sm font-medium text-foreground">
                {formatAnswer(question, value)}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Mini insight */}
        <div className="max-w-xl mx-auto">
          <MiniInsight
            type={insightData?.type ?? "tip"}
            message={insightData?.message ?? ""}
            visible={showInsight}
            onDismiss={() => setShowInsight(false)}
          />
        </div>

        {/* Current question */}
        <div className="pt-4 pb-8">
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                value={localValue}
                onChange={setLocalValue}
                onNext={handleNext}
                onSkip={handleSkip}
                showSkip={!currentQuestion.required}
              />
            )}
          </AnimatePresence>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Question counter at bottom */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/30 px-4 py-2 text-center">
        <p className="text-[11px] text-muted-foreground tabular-nums">
          Question {globalIndex + 1} sur {totalQuestions}
          {currentQuestion && (
            <span className="ml-2 text-primary/60 font-medium">
              {currentStep === "wastes" && currentQuestion.category !== "strategic"
                ? `-- ${wasteLabels[currentQuestion.category as WasteCategory]?.name ?? ""}`
                : ""}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
