"use client";

import type { DiagnosticQuestion } from "@/types/diagnostic";

export const framingQuestions: DiagnosticQuestion[] = [
  {
    id: "framing_goal_type",
    category: "framing",
    questionKey: "Quel est votre objectif financier principal ?",
    type: "card-select",
    required: true,
    options: [
      {
        id: "increase_revenue",
        label: "Augmenter le chiffre d'affaires",
        description: "Developper les ventes et la croissance",
        icon: "target",
      },
      {
        id: "reduce_costs",
        label: "Reduire les couts",
        description: "Optimiser les depenses et les processus",
        icon: "trending-down",
      },
    ],
    weight: 1,
  },
  {
    id: "framing_goal_amount",
    category: "framing",
    questionKey: "Quel montant visez-vous (en euros) ?",
    type: "number",
    required: true,
    weight: 1,
  },
  {
    id: "framing_time_horizon",
    category: "framing",
    questionKey: "Sur quel horizon de temps souhaitez-vous atteindre cet objectif ?",
    type: "slider",
    sliderMin: 3,
    sliderMax: 36,
    sliderLabels: { min: "3 mois", max: "36 mois" },
    required: true,
    weight: 1,
  },
  {
    id: "framing_autonomy",
    category: "framing",
    questionKey: "Quel niveau d'accompagnement souhaitez-vous ?",
    type: "card-select",
    required: true,
    options: [
      {
        id: "self",
        label: "Autonome",
        description: "Je veux faire seul avec les recommandations",
        icon: "compass",
      },
      {
        id: "guided",
        label: "Guide",
        description: "Des conseils reguliers et un suivi",
        icon: "users",
      },
      {
        id: "accompanied",
        label: "Accompagne",
        description: "Un expert m'aide a chaque etape",
        icon: "target",
      },
    ],
    weight: 1,
  },
];

interface FramingQuestionsProps {
  children?: React.ReactNode;
}

export function FramingQuestions({ children }: FramingQuestionsProps) {
  return <>{children}</>;
}
