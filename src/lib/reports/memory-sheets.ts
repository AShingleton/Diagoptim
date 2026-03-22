/**
 * Memory sheet (fiche mémo) generation.
 *
 * Each memory sheet is a concise 1-2 page summary for a single waste category,
 * including definition, business impact, key indicators, concrete actions,
 * and further reading resources.
 *
 * @module reports/memory-sheets
 */

import type {
  MemorySheetRecommendation,
  ReportLocale,
} from "@/types/report";
import type { WasteCategory } from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured data for rendering a memory sheet. */
export interface MemorySheetData {
  wasteCategory: WasteCategory;
  score: number;
  title: string;
  definition: string;
  businessImpact: string;
  keyIndicators: string[];
  concreteActions: MemorySheetAction[];
  resources: MemorySheetResource[];
  locale: ReportLocale;
}

/** A concrete action included in the memory sheet. */
export interface MemorySheetAction {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  effortLevel: "low" | "medium" | "high";
  estimatedGain: number;
  timelineWeeks: number;
}

/** External resource or further reading link. */
export interface MemorySheetResource {
  title: string;
  url: string;
  type: "article" | "video" | "tool" | "training";
}

// ---------------------------------------------------------------------------
// Waste category knowledge base
// ---------------------------------------------------------------------------

interface WasteCategoryInfo {
  titleFr: string;
  titleEn: string;
  definitionFr: string;
  definitionEn: string;
  impactFr: string;
  impactEn: string;
  indicatorsFr: string[];
  indicatorsEn: string[];
  resourcesFr: MemorySheetResource[];
  resourcesEn: MemorySheetResource[];
}

const WASTE_KNOWLEDGE_BASE: Record<WasteCategory, WasteCategoryInfo> = {
  overproduction: {
    titleFr: "Surproduction",
    titleEn: "Overproduction",
    definitionFr:
      "La surproduction consiste à produire plus que ce que le client demande, plus tôt que nécessaire ou plus vite que le rythme de consommation. C'est souvent considéré comme le pire des gaspillages car il génère tous les autres.",
    definitionEn:
      "Overproduction means producing more than the customer demands, earlier than needed, or faster than the consumption rate. It is often considered the worst waste as it generates all others.",
    impactFr:
      "Augmentation des stocks, immobilisation de trésorerie, risque d'obsolescence, espace de stockage supplémentaire, et masquage de problèmes de qualité.",
    impactEn:
      "Increased inventory, tied-up cash flow, risk of obsolescence, additional storage space, and masking of quality issues.",
    indicatorsFr: [
      "Niveau de stock moyen vs demande client",
      "Taux de rotation des stocks",
      "Pourcentage de production non commandée",
      "Délai entre production et livraison",
    ],
    indicatorsEn: [
      "Average stock level vs customer demand",
      "Inventory turnover rate",
      "Percentage of unordered production",
      "Lead time between production and delivery",
    ],
    resourcesFr: [
      { title: "Le Lean Manufacturing en pratique", url: "https://lean.org", type: "article" },
      { title: "Système Kanban", url: "https://kanbanize.com", type: "tool" },
    ],
    resourcesEn: [
      { title: "Lean Manufacturing in Practice", url: "https://lean.org", type: "article" },
      { title: "Kanban System", url: "https://kanbanize.com", type: "tool" },
    ],
  },
  waiting: {
    titleFr: "Attentes",
    titleEn: "Waiting",
    definitionFr:
      "Les attentes correspondent aux temps morts où les personnes, machines ou matériaux sont inactifs en raison de retards, goulots d'étranglement ou manque de synchronisation.",
    definitionEn:
      "Waiting refers to idle time when people, machines, or materials are inactive due to delays, bottlenecks, or lack of synchronization.",
    impactFr:
      "Perte de productivité, allongement des délais de livraison, sous-utilisation des ressources et frustration des équipes.",
    impactEn:
      "Lost productivity, extended lead times, resource underutilization, and team frustration.",
    indicatorsFr: [
      "Temps d'attente moyen entre les étapes",
      "Taux d'utilisation des machines",
      "Ratio temps à valeur ajoutée / temps total",
      "Nombre d'interruptions par jour",
    ],
    indicatorsEn: [
      "Average wait time between steps",
      "Machine utilization rate",
      "Value-added time / total time ratio",
      "Number of interruptions per day",
    ],
    resourcesFr: [
      { title: "Value Stream Mapping", url: "https://lean.org/vsm", type: "tool" },
    ],
    resourcesEn: [
      { title: "Value Stream Mapping", url: "https://lean.org/vsm", type: "tool" },
    ],
  },
  transport: {
    titleFr: "Transport",
    titleEn: "Transport",
    definitionFr:
      "Le gaspillage de transport concerne tout déplacement inutile de matériaux, produits ou informations qui n'ajoute pas de valeur pour le client.",
    definitionEn:
      "Transport waste refers to any unnecessary movement of materials, products, or information that adds no value for the customer.",
    impactFr:
      "Coûts logistiques accrus, risques de dommages, délais allongés et empreinte carbone augmentée.",
    impactEn:
      "Increased logistics costs, damage risks, extended lead times, and higher carbon footprint.",
    indicatorsFr: [
      "Distance parcourue par unité produite",
      "Coût de transport / chiffre d'affaires",
      "Nombre de manipulations par produit",
      "Taux de dommages pendant le transport",
    ],
    indicatorsEn: [
      "Distance traveled per unit produced",
      "Transport cost / revenue ratio",
      "Number of handlings per product",
      "Damage rate during transport",
    ],
    resourcesFr: [
      { title: "Optimisation des flux", url: "https://lean.org/flow", type: "article" },
    ],
    resourcesEn: [
      { title: "Flow Optimization", url: "https://lean.org/flow", type: "article" },
    ],
  },
  overprocessing: {
    titleFr: "Sur-traitement",
    titleEn: "Over-processing",
    definitionFr:
      "Le sur-traitement consiste à effectuer des opérations ou à fournir une qualité supérieure à ce que le client demande ou est prêt à payer.",
    definitionEn:
      "Over-processing means performing operations or providing quality beyond what the customer requires or is willing to pay for.",
    impactFr:
      "Coûts de production excessifs, temps de cycle allongés, complexité inutile et ressources gaspillées.",
    impactEn:
      "Excessive production costs, extended cycle times, unnecessary complexity, and wasted resources.",
    indicatorsFr: [
      "Nombre d'étapes sans valeur ajoutée",
      "Taux de retouches",
      "Coût qualité / chiffre d'affaires",
      "Temps passé sur des tâches administratives redondantes",
    ],
    indicatorsEn: [
      "Number of non-value-added steps",
      "Rework rate",
      "Quality cost / revenue ratio",
      "Time spent on redundant administrative tasks",
    ],
    resourcesFr: [
      { title: "Analyse de la valeur", url: "https://lean.org/value-analysis", type: "article" },
    ],
    resourcesEn: [
      { title: "Value Analysis", url: "https://lean.org/value-analysis", type: "article" },
    ],
  },
  inventory: {
    titleFr: "Stocks",
    titleEn: "Inventory",
    definitionFr:
      "Le gaspillage de stocks concerne tout excès de matières premières, d'en-cours ou de produits finis au-delà du minimum nécessaire pour satisfaire la demande client.",
    definitionEn:
      "Inventory waste refers to any excess of raw materials, work-in-progress, or finished goods beyond the minimum needed to satisfy customer demand.",
    impactFr:
      "Immobilisation de trésorerie, coûts de stockage, risque d'obsolescence, espace occupé et complexité de gestion accrue.",
    impactEn:
      "Tied-up cash flow, storage costs, obsolescence risk, occupied space, and increased management complexity.",
    indicatorsFr: [
      "Valeur moyenne des stocks",
      "Taux de rotation des stocks",
      "Taux d'obsolescence",
      "Coût de stockage / CA",
    ],
    indicatorsEn: [
      "Average inventory value",
      "Inventory turnover rate",
      "Obsolescence rate",
      "Storage cost / revenue ratio",
    ],
    resourcesFr: [
      { title: "Gestion des stocks en Lean", url: "https://lean.org/inventory", type: "article" },
    ],
    resourcesEn: [
      { title: "Lean Inventory Management", url: "https://lean.org/inventory", type: "article" },
    ],
  },
  motion: {
    titleFr: "Mouvements",
    titleEn: "Motion",
    definitionFr:
      "Les mouvements inutiles sont les déplacements physiques des personnes qui ne contribuent pas à la création de valeur : marche, recherche d'outils, gestes ergonomiquement mauvais.",
    definitionEn:
      "Unnecessary motion refers to physical movements of people that do not contribute to value creation: walking, searching for tools, ergonomically poor gestures.",
    impactFr:
      "Perte de temps, fatigue accrue, risques de TMS (troubles musculosquelettiques) et productivité réduite.",
    impactEn:
      "Time loss, increased fatigue, risk of musculoskeletal disorders, and reduced productivity.",
    indicatorsFr: [
      "Distance parcourue par opérateur/jour",
      "Temps de recherche d'outils/informations",
      "Taux de TMS",
      "Score ergonomique des postes de travail",
    ],
    indicatorsEn: [
      "Distance walked per operator per day",
      "Tool/information search time",
      "Musculoskeletal disorder rate",
      "Workstation ergonomic score",
    ],
    resourcesFr: [
      { title: "5S et organisation du poste de travail", url: "https://lean.org/5s", type: "article" },
    ],
    resourcesEn: [
      { title: "5S and Workplace Organization", url: "https://lean.org/5s", type: "article" },
    ],
  },
  defects: {
    titleFr: "Défauts",
    titleEn: "Defects",
    definitionFr:
      "Les défauts englobent tous les produits ou services non conformes nécessitant une reprise, un rebut ou une correction, ainsi que les erreurs dans les processus administratifs.",
    definitionEn:
      "Defects encompass all non-conforming products or services requiring rework, scrap, or correction, as well as errors in administrative processes.",
    impactFr:
      "Coûts de non-qualité, insatisfaction client, retards de livraison et perte de réputation.",
    impactEn:
      "Non-quality costs, customer dissatisfaction, delivery delays, and reputation loss.",
    indicatorsFr: [
      "Taux de non-conformité",
      "Coût de la non-qualité (rebuts + retouches)",
      "Nombre de réclamations clients",
      "Taux de retour",
    ],
    indicatorsEn: [
      "Non-conformity rate",
      "Non-quality cost (scrap + rework)",
      "Number of customer complaints",
      "Return rate",
    ],
    resourcesFr: [
      { title: "Poka-Yoke : systèmes anti-erreur", url: "https://lean.org/poka-yoke", type: "article" },
    ],
    resourcesEn: [
      { title: "Poka-Yoke: Error-proofing Systems", url: "https://lean.org/poka-yoke", type: "article" },
    ],
  },
  skills: {
    titleFr: "Compétences sous-utilisées",
    titleEn: "Underutilized Skills",
    definitionFr:
      "Ce gaspillage survient lorsque les talents, compétences et idées des collaborateurs ne sont pas pleinement exploités. Il inclut le manque de formation, l'absence de participation aux décisions et la sous-utilisation des expertises.",
    definitionEn:
      "This waste occurs when employee talents, skills, and ideas are not fully leveraged. It includes lack of training, absence of decision-making participation, and underutilization of expertise.",
    impactFr:
      "Démotivation, turnover élevé, innovation freinée et perte d'avantage concurrentiel.",
    impactEn:
      "Demotivation, high turnover, hindered innovation, and loss of competitive advantage.",
    indicatorsFr: [
      "Taux de turnover",
      "Nombre de suggestions d'amélioration par collaborateur",
      "Heures de formation par an par salarié",
      "Score d'engagement des équipes",
    ],
    indicatorsEn: [
      "Turnover rate",
      "Number of improvement suggestions per employee",
      "Training hours per year per employee",
      "Team engagement score",
    ],
    resourcesFr: [
      { title: "Management participatif", url: "https://lean.org/respect-for-people", type: "article" },
      { title: "Kaizen et amélioration continue", url: "https://lean.org/kaizen", type: "article" },
    ],
    resourcesEn: [
      { title: "Participative Management", url: "https://lean.org/respect-for-people", type: "article" },
      { title: "Kaizen and Continuous Improvement", url: "https://lean.org/kaizen", type: "article" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates structured data for a memory sheet based on the waste category,
 * score, and recommendations from the diagnostic.
 *
 * @param wasteCategory    - The waste category this sheet covers.
 * @param score            - The diagnostic score for this category (0-100).
 * @param recommendations  - Recommendations from the diagnostic relevant to this category.
 * @param locale           - Output locale (defaults to "fr").
 * @returns Structured memory sheet data ready for rendering.
 */
export function generateMemorySheet(
  wasteCategory: WasteCategory,
  score: number,
  recommendations: MemorySheetRecommendation[],
  locale: ReportLocale = "fr",
): MemorySheetData {
  const info = WASTE_KNOWLEDGE_BASE[wasteCategory];
  const isFr = locale === "fr";

  const concreteActions: MemorySheetAction[] = recommendations
    .slice(0, 5)
    .map((rec) => ({
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      effortLevel: rec.effortLevel,
      estimatedGain: rec.estimatedGain,
      timelineWeeks: rec.timelineWeeks,
    }));

  return {
    wasteCategory,
    score,
    title: isFr ? info.titleFr : info.titleEn,
    definition: isFr ? info.definitionFr : info.definitionEn,
    businessImpact: isFr ? info.impactFr : info.impactEn,
    keyIndicators: isFr ? info.indicatorsFr : info.indicatorsEn,
    concreteActions,
    resources: isFr ? info.resourcesFr : info.resourcesEn,
    locale,
  };
}

/**
 * Generates a PDF buffer for a single memory sheet using Puppeteer.
 *
 * @param sheetData - Structured memory sheet data.
 * @returns A Buffer containing the memory sheet PDF.
 */
export async function generateMemorySheetPdf(sheetData: MemorySheetData): Promise<Buffer> {
  const puppeteer = await import("puppeteer");

  const html = buildMemorySheetHtml(sheetData);

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// HTML builder for memory sheet
// ---------------------------------------------------------------------------

function buildMemorySheetHtml(data: MemorySheetData): string {
  const isFr = data.locale === "fr";
  const scoreColor = data.score >= 70 ? "#27ae60" : data.score >= 40 ? "#f39c12" : "#e74c3c";
  const scoreLabel = data.score >= 70
    ? (isFr ? "Bon" : "Good")
    : data.score >= 40
      ? (isFr ? "Moyen" : "Average")
      : (isFr ? "Critique" : "Critical");

  const indicatorsHtml = data.keyIndicators
    .map((ind) => `<li>${escapeHtml(ind)}</li>`)
    .join("\n");

  const actionsHtml = data.concreteActions
    .map((action) => {
      const priorityColor =
        action.priority === "high" ? "#e74c3c" : action.priority === "medium" ? "#f39c12" : "#27ae60";
      const effortLabel = isFr
        ? { low: "Faible", medium: "Moyen", high: "Élevé" }[action.effortLevel]
        : { low: "Low", medium: "Medium", high: "High" }[action.effortLevel];

      return `<div class="action-card" style="border-left: 4px solid ${priorityColor};">
<div class="action-title">${escapeHtml(action.title)}</div>
<div class="action-desc">${escapeHtml(action.description)}</div>
<div class="action-meta">
  ${isFr ? "Gain" : "Gain"}: ${formatCurrency(action.estimatedGain)} |
  Effort: ${effortLabel} |
  ${action.timelineWeeks} ${isFr ? "semaines" : "weeks"}
</div>
</div>`;
    })
    .join("\n");

  const resourcesHtml = data.resources
    .map((res) => {
      const typeEmoji = { article: "📄", video: "🎥", tool: "🔧", training: "🎓" }[res.type];
      return `<li>${typeEmoji} <a href="${escapeHtml(res.url)}">${escapeHtml(res.title)}</a></li>`;
    })
    .join("\n");

  const whatIsTitle = isFr ? "Qu'est-ce que c'est ?" : "What is it?";
  const impactTitle = isFr ? "Impact sur votre activité" : "Impact on your business";
  const indicatorsTitle = isFr ? "Indicateurs clés à surveiller" : "Key indicators to watch";
  const actionsTitle = isFr ? "Actions concrètes" : "Concrete actions";
  const resourcesTitle = isFr ? "Pour aller plus loin" : "Further reading";

  return `<!DOCTYPE html>
<html lang="${data.locale}">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.5; margin: 0; padding: 0; }
  .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 25px 30px; border-radius: 0 0 12px 12px; }
  .header h1 { margin: 0; font-size: 24pt; }
  .header .subtitle { font-size: 12pt; opacity: 0.8; margin-top: 5px; }
  .score-badge { display: inline-block; background: ${scoreColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 16pt; font-weight: bold; margin-top: 10px; }
  .section { margin: 20px 30px; }
  .section h2 { color: #2c3e50; font-size: 14pt; border-bottom: 2px solid #3498db; padding-bottom: 4px; }
  .definition { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db; }
  .impact { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12; }
  .indicators { list-style: none; padding: 0; }
  .indicators li { padding: 6px 0; border-bottom: 1px solid #eee; }
  .indicators li:before { content: "📊 "; }
  .action-card { background: #f8f9fa; margin: 10px 0; padding: 12px 15px; border-radius: 6px; }
  .action-title { font-weight: bold; font-size: 11pt; }
  .action-desc { color: #555; margin-top: 4px; }
  .action-meta { margin-top: 6px; font-size: 9pt; color: #888; }
  .resources { list-style: none; padding: 0; }
  .resources li { padding: 4px 0; }
  .resources a { color: #3498db; text-decoration: none; }
  .footer { text-align: center; font-size: 8pt; color: #999; margin-top: 30px; padding: 10px; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="header">
  <h1>${isFr ? "Fiche Mémo" : "Memory Sheet"}</h1>
  <div class="subtitle">${escapeHtml(data.title)}</div>
  <div class="score-badge">${data.score}/100 - ${scoreLabel}</div>
</div>

<div class="section">
  <h2>${whatIsTitle}</h2>
  <div class="definition">${escapeHtml(data.definition)}</div>
</div>

<div class="section">
  <h2>${impactTitle}</h2>
  <div class="impact">${escapeHtml(data.businessImpact)}</div>
</div>

<div class="section">
  <h2>${indicatorsTitle}</h2>
  <ul class="indicators">${indicatorsHtml}</ul>
</div>

<div class="section">
  <h2>${actionsTitle}</h2>
  ${actionsHtml || `<p>${isFr ? "Aucune action spécifique identifiée." : "No specific actions identified."}</p>`}
</div>

<div class="section">
  <h2>${resourcesTitle}</h2>
  <ul class="resources">${resourcesHtml}</ul>
</div>

<div class="footer">
  ${isFr ? "Généré par DiagOptim" : "Generated by DiagOptim"} | ${new Date().toLocaleDateString(isFr ? "fr-FR" : "en-GB")}
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
