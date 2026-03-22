export type TrainingType = "video" | "memory_sheet" | "guide";
export type TrainingCategory = "theory" | "practice" | "sector_specific";

export interface Training {
  id: string;
  title: string;
  titleEn?: string;
  type: TrainingType;
  category: TrainingCategory;
  methodology?: string;
  contentUrl?: string;
  durationMinutes?: number;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  tierRequired: string;
  locale: string;
  createdAt: string;
}

export interface TrainingProgress {
  id: string;
  userId: string;
  trainingId: string;
  completed: boolean;
  progressPercent: number;
  completedAt?: string;
}
