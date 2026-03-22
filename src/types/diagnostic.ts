export type QuestionType =
  | "slider"
  | "card-select"
  | "text"
  | "number"
  | "file-upload"
  | "yes-no-maybe"
  | "multi-select"
  | "date-picker";

export interface QuestionOption {
  id: string;
  label: string;
  labelEn?: string;
  icon?: string;
  description?: string;
  descriptionEn?: string;
}

export interface DiagnosticQuestion {
  id: string;
  category: WasteCategory | "framing" | "profile" | "documents" | "strategic";
  questionKey: string; // i18n key
  type: QuestionType;
  options?: QuestionOption[];
  sliderMin?: number;
  sliderMax?: number;
  sliderLabels?: { min: string; max: string };
  required?: boolean;
  conditionalOn?: { questionId: string; value: unknown };
  weight?: number;
}

export interface DiagnosticAnswer {
  questionId: string;
  value: unknown;
  timestamp: string;
}

export type WasteCategory =
  | "overproduction"
  | "waiting"
  | "transport"
  | "overprocessing"
  | "inventory"
  | "motion"
  | "defects"
  | "skills";

export interface WasteScores {
  overproduction: number;
  waiting: number;
  transport: number;
  overprocessing: number;
  inventory: number;
  motion: number;
  defects: number;
  skills: number;
}

export type FinancialGoalType = "increase_revenue" | "reduce_costs";
export type AutonomyLevel = "self" | "guided" | "accompanied";
export type DiagnosticStatus = "in_progress" | "completed" | "archived";

export interface DiagnosticFraming {
  financialGoalType: FinancialGoalType | null;
  financialGoalAmount: number | null;
  timeHorizonMonths: number | null;
  autonomyLevel: AutonomyLevel | null;
}

export interface DiagnosticInsight {
  id: string;
  type: "positive" | "warning" | "tip";
  messageKey: string;
  wasteCategory?: WasteCategory;
}

export interface DiagnosticResult {
  id: string;
  companyId: string;
  status: DiagnosticStatus;
  framing: DiagnosticFraming;
  globalScore: number;
  wasteScores: WasteScores;
  swotData: SWOTData | null;
  insights: DiagnosticInsight[];
  completionPercentage: number;
  answers: DiagnosticAnswer[];
  createdAt: string;
  completedAt: string | null;
}

export interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export type DiagnosticStep =
  | "framing"
  | "profile"
  | "documents"
  | "wastes"
  | "intermediate-results"
  | "strategic"
  | "results";

export interface DiagnosticState {
  currentStep: DiagnosticStep;
  currentQuestionIndex: number;
  answers: Record<string, DiagnosticAnswer>;
  framing: DiagnosticFraming;
  completionPercentage: number;
  insights: DiagnosticInsight[];
  showInsight: boolean;
}
