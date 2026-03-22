export type ActionCategory = "quick_win" | "short_term" | "structural" | "transformation";
export type EffortLevel = "low" | "medium" | "high";
export type ActionStatus = "todo" | "in_progress" | "completed" | "skipped";

export interface RoadmapAction {
  id: string;
  diagnosticId: string;
  companyId: string;
  title: string;
  description?: string;
  category: ActionCategory;
  priority: number;
  estimatedGain: number;
  effortLevel: EffortLevel;
  status: ActionStatus;
  dueDate?: string;
  assignedTo?: string;
  wasteCategory?: string;
  methodology?: string;
  trainingId?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
}
