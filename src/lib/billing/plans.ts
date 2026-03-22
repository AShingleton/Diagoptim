import type { SubscriptionTier, SupportPackType } from "@/types/billing";

/**
 * Resource limits for a subscription plan.
 */
export interface PlanLimits {
  /** Maximum number of diagnostics per month (-1 = unlimited) */
  diagnosticsPerMonth: number;
  /** Maximum number of action items per diagnostic (-1 = unlimited) */
  actionsPerDiagnostic: number;
  /** Maximum number of documents that can be analyzed per month (-1 = unlimited) */
  documentsPerMonth: number;
  /** Maximum number of AI queries per month */
  aiQueriesPerMonth: number;
  /** Maximum number of team members (-1 = unlimited) */
  teamMembers: number;
  /** Maximum file upload size in MB */
  maxUploadSizeMb: number;
  /** Number of days data is retained (-1 = unlimited) */
  dataRetentionDays: number;
}

/**
 * Feature flags available per plan.
 */
export type PlanFeature =
  | "basic_diagnostic"
  | "full_diagnostic"
  | "custom_diagnostic"
  | "basic_report"
  | "full_report"
  | "advanced_report"
  | "pdf_export"
  | "excel_export"
  | "basic_tools"
  | "all_tools"
  | "document_analysis"
  | "team_collaboration"
  | "api_access"
  | "white_label"
  | "email_support"
  | "priority_support"
  | "dedicated_support"
  | "onboarding"
  | "client_management"
  | "multi_client"
  | "custom_branding"
  | "memory_sheets"
  | "action_tracking"
  | "benchmarking"
  | "integrations";

/** Consultant-specific subscription tiers */
type ConsultantTier = "consultant_solo" | "consultant_cabinet";

/** All plan identifiers including consultant tiers */
type PlanId = SubscriptionTier | ConsultantTier;

/**
 * Complete plan definition including pricing, limits, and features.
 */
interface PlanDefinition {
  /** Unique plan identifier */
  id: PlanId;
  /** Display name (French) */
  name: string;
  /** Short description (French) */
  description: string;
  /** Pricing in EUR */
  price: {
    monthly: number;
    yearly: number;
  };
  /** Resource limits */
  limits: PlanLimits;
  /** Enabled features */
  features: PlanFeature[];
  /** Whether this plan is highlighted in the pricing UI */
  highlighted: boolean;
  /** Target audience description */
  targetAudience: string;
}

/**
 * Support pack definition for one-time purchases.
 */
interface SupportPackDefinition {
  /** Pack type identifier */
  id: SupportPackType;
  /** Display name (French) */
  name: string;
  /** Short description (French) */
  description: string;
  /** Price in EUR (one-time) */
  price: number;
  /** Number of consulting hours included */
  hours: number;
  /** Validity period in days */
  validityDays: number;
  /** Included services */
  includes: string[];
}

/**
 * Support subscription definition for recurring consulting.
 */
interface SupportSubscriptionDefinition {
  /** Subscription identifier */
  id: "essential" | "premium";
  /** Display name (French) */
  name: string;
  /** Short description (French) */
  description: string;
  /** Monthly price in EUR */
  priceMonthly: number;
  /** Hours included per month */
  hoursPerMonth: number;
  /** Included services */
  includes: string[];
}

/**
 * All subscription plans available in DiagOptim.
 * Includes 4 standard tiers and 2 consultant tiers.
 */
export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Gratuit",
    description: "Découvrez DiagOptim avec un diagnostic de base",
    price: { monthly: 0, yearly: 0 },
    limits: {
      diagnosticsPerMonth: 1,
      actionsPerDiagnostic: 3,
      documentsPerMonth: 0,
      aiQueriesPerMonth: 10,
      teamMembers: 1,
      maxUploadSizeMb: 5,
      dataRetentionDays: 30,
    },
    features: [
      "basic_diagnostic",
      "basic_report",
      "memory_sheets",
    ],
    highlighted: false,
    targetAudience: "Dirigeants curieux souhaitant tester l'outil",
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "Pour les TPE/PME qui démarrent leur démarche Lean",
    price: { monthly: 49, yearly: 470 },
    limits: {
      diagnosticsPerMonth: -1,
      actionsPerDiagnostic: 10,
      documentsPerMonth: 5,
      aiQueriesPerMonth: 50,
      teamMembers: 3,
      maxUploadSizeMb: 25,
      dataRetentionDays: 365,
    },
    features: [
      "basic_diagnostic",
      "full_report",
      "pdf_export",
      "basic_tools",
      "email_support",
      "memory_sheets",
      "action_tracking",
    ],
    highlighted: false,
    targetAudience: "TPE/PME de 5-20 salariés",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Pour les entreprises engagées dans l'amélioration continue",
    price: { monthly: 149, yearly: 1430 },
    limits: {
      diagnosticsPerMonth: -1,
      actionsPerDiagnostic: -1,
      documentsPerMonth: 20,
      aiQueriesPerMonth: 200,
      teamMembers: 10,
      maxUploadSizeMb: 50,
      dataRetentionDays: -1,
    },
    features: [
      "full_diagnostic",
      "advanced_report",
      "pdf_export",
      "excel_export",
      "all_tools",
      "document_analysis",
      "team_collaboration",
      "priority_support",
      "memory_sheets",
      "action_tracking",
      "benchmarking",
      "integrations",
    ],
    highlighted: true,
    targetAudience: "PME/ETI de 20-250 salariés",
  },
  expert: {
    id: "expert",
    name: "Expert",
    description: "Pour les grandes entreprises avec des besoins avancés",
    price: { monthly: 299, yearly: 2870 },
    limits: {
      diagnosticsPerMonth: -1,
      actionsPerDiagnostic: -1,
      documentsPerMonth: -1,
      aiQueriesPerMonth: -1,
      teamMembers: -1,
      maxUploadSizeMb: 100,
      dataRetentionDays: -1,
    },
    features: [
      "custom_diagnostic",
      "advanced_report",
      "pdf_export",
      "excel_export",
      "all_tools",
      "document_analysis",
      "team_collaboration",
      "api_access",
      "white_label",
      "dedicated_support",
      "onboarding",
      "memory_sheets",
      "action_tracking",
      "benchmarking",
      "integrations",
    ],
    highlighted: false,
    targetAudience: "ETI/Grandes entreprises, 250+ salariés",
  },
  consultant_solo: {
    id: "consultant_solo",
    name: "Consultant Solo",
    description: "Pour les consultants indépendants en Lean/Excellence opérationnelle",
    price: { monthly: 199, yearly: 1910 },
    limits: {
      diagnosticsPerMonth: -1,
      actionsPerDiagnostic: -1,
      documentsPerMonth: 30,
      aiQueriesPerMonth: 300,
      teamMembers: 1,
      maxUploadSizeMb: 50,
      dataRetentionDays: -1,
    },
    features: [
      "full_diagnostic",
      "advanced_report",
      "pdf_export",
      "excel_export",
      "all_tools",
      "document_analysis",
      "client_management",
      "custom_branding",
      "priority_support",
      "memory_sheets",
      "action_tracking",
      "benchmarking",
    ],
    highlighted: false,
    targetAudience: "Consultants indépendants Lean/Qualité",
  },
  consultant_cabinet: {
    id: "consultant_cabinet",
    name: "Consultant Cabinet",
    description: "Pour les cabinets de conseil avec plusieurs consultants",
    price: { monthly: 499, yearly: 4790 },
    limits: {
      diagnosticsPerMonth: -1,
      actionsPerDiagnostic: -1,
      documentsPerMonth: -1,
      aiQueriesPerMonth: -1,
      teamMembers: -1,
      maxUploadSizeMb: 100,
      dataRetentionDays: -1,
    },
    features: [
      "custom_diagnostic",
      "advanced_report",
      "pdf_export",
      "excel_export",
      "all_tools",
      "document_analysis",
      "team_collaboration",
      "api_access",
      "white_label",
      "client_management",
      "multi_client",
      "custom_branding",
      "dedicated_support",
      "onboarding",
      "memory_sheets",
      "action_tracking",
      "benchmarking",
      "integrations",
    ],
    highlighted: false,
    targetAudience: "Cabinets de conseil, 3+ consultants",
  },
} as const;

/**
 * Support packs available for one-time purchase.
 */
export const SUPPORT_PACKS: Record<SupportPackType, SupportPackDefinition> = {
  coup_de_pouce: {
    id: "coup_de_pouce",
    name: "Coup de Pouce",
    description: "Un accompagnement ponctuel pour débloquer une situation",
    price: 299,
    hours: 2,
    validityDays: 30,
    includes: [
      "Visioconférence avec un expert Lean",
      "Analyse de votre diagnostic",
      "Plan d'action personnalisé",
      "Suivi par email pendant 2 semaines",
    ],
  },
  acceleration: {
    id: "acceleration",
    name: "Accélération",
    description: "Un accompagnement renforcé pour accélérer votre transformation",
    price: 699,
    hours: 5,
    validityDays: 60,
    includes: [
      "Analyse approfondie de vos processus",
      "Animation d'un atelier d'amélioration",
      "Suivi mensuel pendant 2 mois",
      "Accès prioritaire au support",
      "Templates personnalisés",
    ],
  },
  transformation: {
    id: "transformation",
    name: "Transformation",
    description: "Un accompagnement complet pour transformer votre organisation",
    price: 1499,
    hours: 12,
    validityDays: 90,
    includes: [
      "Audit complet de vos processus",
      "Accompagnement à la mise en oeuvre",
      "Revue trimestrielle des résultats",
      "Formation de votre équipe",
      "Support dédié pendant 3 mois",
      "Rapports d'avancement personnalisés",
    ],
  },
} as const;

/**
 * Recurring support subscriptions.
 */
export const SUPPORT_SUBSCRIPTIONS: Record<"essential" | "premium", SupportSubscriptionDefinition> = {
  essential: {
    id: "essential",
    name: "Essentiel",
    description: "Un accompagnement régulier pour maintenir la dynamique",
    priceMonthly: 199,
    hoursPerMonth: 2,
    includes: [
      "2h d'accompagnement mensuel",
      "Revue mensuelle des indicateurs",
      "Support email prioritaire",
      "Accès aux webinaires exclusifs",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Un accompagnement intensif pour une transformation rapide",
    priceMonthly: 499,
    hoursPerMonth: 5,
    includes: [
      "5h d'accompagnement mensuel",
      "Revue hebdomadaire des indicateurs",
      "Support téléphonique dédié",
      "Animation d'ateliers sur site",
      "Accès aux webinaires exclusifs",
      "Rapports personnalisés",
    ],
  },
} as const;

/**
 * Returns the resource limits for a given plan.
 *
 * @param plan - The plan identifier
 * @returns The PlanLimits for the specified plan
 * @throws Error if the plan ID is not recognized
 */
export function getPlanLimits(plan: string): PlanLimits {
  const planDef = PLANS[plan as PlanId];
  if (!planDef) {
    throw new Error(`Unknown plan: ${plan}`);
  }
  return { ...planDef.limits };
}

/**
 * Checks whether a given plan includes access to a specific feature.
 *
 * @param plan - The plan identifier
 * @param feature - The feature to check access for
 * @returns True if the plan includes the feature, false otherwise
 */
export function canAccessFeature(plan: string, feature: string): boolean {
  const planDef = PLANS[plan as PlanId];
  if (!planDef) {
    return false;
  }
  return planDef.features.includes(feature as PlanFeature);
}

/**
 * Returns the price for a plan at a given billing interval.
 *
 * @param plan - The plan identifier
 * @param interval - The billing interval ("month" or "year")
 * @returns The price in EUR
 * @throws Error if the plan ID is not recognized
 */
export function getPlanPrice(plan: string, interval: "month" | "year"): number {
  const planDef = PLANS[plan as PlanId];
  if (!planDef) {
    throw new Error(`Unknown plan: ${plan}`);
  }
  return interval === "month" ? planDef.price.monthly : planDef.price.yearly;
}
