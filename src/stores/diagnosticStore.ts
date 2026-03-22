import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DiagnosticStep,
  DiagnosticAnswer,
  DiagnosticFraming,
  DiagnosticInsight,
  WasteScores,
  SWOTData,
} from "@/types/diagnostic";
import type { CompanyProfile } from "@/types/company";

interface DiagnosticStore {
  // Current diagnostic state
  diagnosticId: string | null;
  currentStep: DiagnosticStep;
  currentQuestionIndex: number;
  answers: Record<string, DiagnosticAnswer>;
  framing: DiagnosticFraming;
  companyProfile: Partial<CompanyProfile>;
  completionPercentage: number;
  insights: DiagnosticInsight[];
  showInsight: boolean;
  wasteScores: WasteScores | null;
  globalScore: number | null;
  swotData: SWOTData | null;

  // Actions
  startNewDiagnostic: () => void;
  setStep: (step: DiagnosticStep) => void;
  setQuestionIndex: (index: number) => void;
  addAnswer: (questionId: string, value: unknown) => void;
  updateFraming: (data: Partial<DiagnosticFraming>) => void;
  updateCompanyProfile: (data: Partial<CompanyProfile>) => void;
  setCompletionPercentage: (pct: number) => void;
  addInsight: (insight: DiagnosticInsight) => void;
  setShowInsight: (show: boolean) => void;
  setWasteScores: (scores: WasteScores) => void;
  setGlobalScore: (score: number) => void;
  setSwotData: (data: SWOTData) => void;
  reset: () => void;
}

const initialFraming: DiagnosticFraming = {
  financialGoalType: null,
  financialGoalAmount: null,
  timeHorizonMonths: null,
  autonomyLevel: null,
};

export const useDiagnosticStore = create<DiagnosticStore>()(
  persist(
    (set) => ({
      diagnosticId: null,
      currentStep: "framing",
      currentQuestionIndex: 0,
      answers: {},
      framing: initialFraming,
      companyProfile: {},
      completionPercentage: 0,
      insights: [],
      showInsight: false,
      wasteScores: null,
      globalScore: null,
      swotData: null,

      startNewDiagnostic: () =>
        set({
          diagnosticId: crypto.randomUUID(),
          currentStep: "framing",
          currentQuestionIndex: 0,
          answers: {},
          framing: initialFraming,
          companyProfile: {},
          completionPercentage: 0,
          insights: [],
          showInsight: false,
          wasteScores: null,
          globalScore: null,
          swotData: null,
        }),

      setStep: (step) => set({ currentStep: step, currentQuestionIndex: 0 }),
      setQuestionIndex: (index) => set({ currentQuestionIndex: index }),

      addAnswer: (questionId, value) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: {
              questionId,
              value,
              timestamp: new Date().toISOString(),
            },
          },
        })),

      updateFraming: (data) =>
        set((state) => ({
          framing: { ...state.framing, ...data },
        })),

      updateCompanyProfile: (data) =>
        set((state) => ({
          companyProfile: { ...state.companyProfile, ...data },
        })),

      setCompletionPercentage: (pct) => set({ completionPercentage: pct }),

      addInsight: (insight) =>
        set((state) => ({
          insights: [...state.insights, insight],
          showInsight: true,
        })),

      setShowInsight: (show) => set({ showInsight: show }),
      setWasteScores: (scores) => set({ wasteScores: scores }),
      setGlobalScore: (score) => set({ globalScore: score }),
      setSwotData: (data) => set({ swotData: data }),

      reset: () =>
        set({
          diagnosticId: null,
          currentStep: "framing",
          currentQuestionIndex: 0,
          answers: {},
          framing: initialFraming,
          companyProfile: {},
          completionPercentage: 0,
          insights: [],
          showInsight: false,
          wasteScores: null,
          globalScore: null,
          swotData: null,
        }),
    }),
    { name: "diagoptim-diagnostic" }
  )
);
