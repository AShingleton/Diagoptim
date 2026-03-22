"use client";

import type { DiagnosticQuestion } from "@/types/diagnostic";

export const profileQuestions: DiagnosticQuestion[] = [
  {
    id: "profile_company_name",
    category: "profile",
    questionKey: "Quel est le nom de votre entreprise ?",
    type: "text",
    required: true,
    weight: 0,
  },
  {
    id: "profile_sector",
    category: "profile",
    questionKey: "Dans quel secteur d'activite evoluez-vous ?",
    type: "card-select",
    required: true,
    options: [
      { id: "industry", label: "Industrie", icon: "factory", description: "Production, fabrication, transformation" },
      { id: "services", label: "Services", icon: "briefcase", description: "Conseil, prestations, B2B/B2C" },
      { id: "commerce", label: "Commerce", icon: "shopping-cart", description: "Distribution, retail, e-commerce" },
      { id: "tech", label: "Tech & Digital", icon: "cpu", description: "Logiciel, SaaS, IT" },
      { id: "health", label: "Sante", icon: "heart", description: "Medical, pharma, bien-etre" },
      { id: "construction", label: "BTP", icon: "hard-hat", description: "Construction, amenagement, renovation" },
      { id: "agriculture", label: "Agriculture", icon: "wheat", description: "Agro-alimentaire, elevage, culture" },
      { id: "other", label: "Autre", icon: "more", description: "Autre secteur d'activite" },
    ],
    weight: 0,
  },
  {
    id: "profile_employees",
    category: "profile",
    questionKey: "Combien de salaries compte votre entreprise ?",
    type: "number",
    required: true,
    weight: 0,
  },
  {
    id: "profile_revenue",
    category: "profile",
    questionKey: "Quel est votre chiffre d'affaires annuel (en euros) ?",
    type: "number",
    required: true,
    weight: 0,
  },
  {
    id: "profile_location",
    category: "profile",
    questionKey: "Ou est situee votre entreprise ? (Ville ou departement)",
    type: "text",
    required: true,
    weight: 0,
  },
  {
    id: "profile_products",
    category: "profile",
    questionKey: "Decrivez brievement vos produits ou services principaux.",
    type: "text",
    required: false,
    weight: 0,
  },
];

interface CompanyProfileProps {
  children?: React.ReactNode;
}

export function CompanyProfile({ children }: CompanyProfileProps) {
  return <>{children}</>;
}
