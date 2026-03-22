import type { PricingPlan, SupportPack } from "@/types/billing";
import type { LeanTool } from "@/types/tools";
import type { WasteCategory } from "@/types/diagnostic";

export const WASTE_CATEGORIES: { key: WasteCategory; icon: string; color: string }[] = [
  { key: "overproduction", icon: "Factory", color: "#E74C3C" },
  { key: "waiting", icon: "Clock", color: "#E67E22" },
  { key: "transport", icon: "Truck", color: "#F1C40F" },
  { key: "overprocessing", icon: "Settings", color: "#3498DB" },
  { key: "inventory", icon: "Package", color: "#9B59B6" },
  { key: "motion", icon: "Move", color: "#1ABC9C" },
  { key: "defects", icon: "AlertTriangle", color: "#E74C3C" },
  { key: "skills", icon: "Users", color: "#2E86C1" },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    nameKey: "pricing.free",
    price: { monthly: 0, annual: 0 },
    features: [
      "pricing.features.oneDiagnostic",
      "pricing.features.basicReport",
      "pricing.features.threeActions",
      "pricing.features.memorySheets",
    ],
  },
  {
    id: "starter",
    nameKey: "pricing.starter",
    price: { monthly: 49, annual: 470 },
    features: [
      "pricing.features.unlimitedDiagnostics",
      "pricing.features.fullReport",
      "pricing.features.tenActions",
      "pricing.features.basicTools",
      "pricing.features.emailSupport",
    ],
  },
  {
    id: "pro",
    nameKey: "pricing.pro",
    price: { monthly: 149, annual: 1430 },
    features: [
      "pricing.features.unlimitedDiagnostics",
      "pricing.features.advancedReport",
      "pricing.features.unlimitedActions",
      "pricing.features.allTools",
      "pricing.features.documentAnalysis",
      "pricing.features.teamCollaboration",
      "pricing.features.prioritySupport",
    ],
    highlighted: true,
    badge: "pricing.popular",
  },
  {
    id: "expert",
    nameKey: "pricing.expert",
    price: { monthly: 299, annual: 2870 },
    features: [
      "pricing.features.everything",
      "pricing.features.customDiagnostic",
      "pricing.features.apiAccess",
      "pricing.features.whiteLabel",
      "pricing.features.dedicatedSupport",
      "pricing.features.onboarding",
    ],
  },
];

export const SUPPORT_PACKS: SupportPack[] = [
  {
    id: "coup_de_pouce",
    nameKey: "support.coupDePouce",
    price: 299,
    hours: 2,
    features: ["support.features.videoCall", "support.features.actionPlan", "support.features.followUp"],
  },
  {
    id: "acceleration",
    nameKey: "support.acceleration",
    price: 699,
    hours: 5,
    features: [
      "support.features.deepDive",
      "support.features.workshopFacilitation",
      "support.features.monthlyFollowUp",
    ],
  },
  {
    id: "transformation",
    nameKey: "support.transformation",
    price: 1499,
    hours: 12,
    features: [
      "support.features.fullAudit",
      "support.features.implementationSupport",
      "support.features.quarterlyReview",
      "support.features.teamTraining",
    ],
  },
];

export const LEAN_TOOLS: LeanTool[] = [
  { id: "vsm", nameKey: "tools.vsm", descriptionKey: "tools.vsmDesc", icon: "GitBranch", href: "/tools/vsm", category: "analysis", tierRequired: "starter" },
  { id: "ishikawa", nameKey: "tools.ishikawa", descriptionKey: "tools.ishikawaDesc", icon: "Network", href: "/tools/ishikawa", category: "analysis", tierRequired: "starter" },
  { id: "a3", nameKey: "tools.a3", descriptionKey: "tools.a3Desc", icon: "FileText", href: "/tools/a3", category: "improvement", tierRequired: "pro" },
  { id: "swot", nameKey: "tools.swot", descriptionKey: "tools.swotDesc", icon: "Grid2x2", href: "/tools/swot", category: "strategy", tierRequired: "starter" },
  { id: "dmaic", nameKey: "tools.dmaic", descriptionKey: "tools.dmaicDesc", icon: "Target", href: "/tools/dmaic", category: "improvement", tierRequired: "pro" },
  { id: "steeple", nameKey: "tools.steeple", descriptionKey: "tools.steepleDesc", icon: "Building", href: "/tools/steeple", category: "strategy", tierRequired: "pro" },
  { id: "hoshin", nameKey: "tools.hoshin", descriptionKey: "tools.hoshinDesc", icon: "Compass", href: "/tools/hoshin", category: "strategy", tierRequired: "expert" },
  { id: "porter", nameKey: "tools.porter", descriptionKey: "tools.porterDesc", icon: "Shield", href: "/tools/porter", category: "strategy", tierRequired: "pro" },
  { id: "bcg", nameKey: "tools.bcg", descriptionKey: "tools.bcgDesc", icon: "PieChart", href: "/tools/bcg", category: "strategy", tierRequired: "pro" },
  { id: "mckinsey", nameKey: "tools.mckinsey", descriptionKey: "tools.mckinseyDesc", icon: "BarChart3", href: "/tools/mckinsey", category: "strategy", tierRequired: "expert" },
];
