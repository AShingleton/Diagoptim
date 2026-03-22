/**
 * PDF report generation using Puppeteer.
 *
 * Renders a full HTML document (cover, TOC, sections, charts) and converts
 * it to a high-quality PDF buffer via a headless Chromium instance.
 *
 * @module reports/pdf-generator
 */

import type {
  ReportData,
  ReportConfig,
  ReportLocale,
  WasteRadarChartData,
} from "@/types/report";
import type { WasteCategory } from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Chart data types
// ---------------------------------------------------------------------------

/** Generic chart data point used by the SVG chart builder. */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/** Discriminated union for chart rendering. */
export type ChartData =
  | { type: "radar"; points: WasteRadarChartData[] }
  | { type: "bar"; points: ChartDataPoint[] }
  | { type: "timeline"; points: ChartDataPoint[] };

// ---------------------------------------------------------------------------
// Branding helpers
// ---------------------------------------------------------------------------

interface ReportBranding {
  primaryColor: string;
  logoUrl: string | null;
  headerText: string | null;
  footerText: string | null;
}

const WASTE_LABELS: Record<ReportLocale, Record<WasteCategory, string>> = {
  fr: {
    overproduction: "Surproduction",
    waiting: "Attentes",
    transport: "Transport",
    overprocessing: "Sur-traitement",
    inventory: "Stocks",
    motion: "Mouvements",
    defects: "Défauts",
    skills: "Compétences",
  },
  en: {
    overproduction: "Overproduction",
    waiting: "Waiting",
    transport: "Transport",
    overprocessing: "Over-processing",
    inventory: "Inventory",
    motion: "Motion",
    defects: "Defects",
    skills: "Skills",
  },
};

const SECTION_TITLES: Record<ReportLocale, Record<string, string>> = {
  fr: {
    executive_summary: "Synthèse",
    company_overview: "Présentation de l'entreprise",
    diagnostic_methodology: "Méthodologie du diagnostic",
    waste_analysis: "Analyse des gaspillages",
    swot_analysis: "Analyse SWOT",
    financial_analysis: "Analyse financière",
    recommendations: "Recommandations",
    roadmap: "Feuille de route",
    appendices: "Annexes",
    toc: "Table des matières",
    methodology: "Méthodologie",
    glossary: "Glossaire",
  },
  en: {
    executive_summary: "Executive Summary",
    company_overview: "Company Overview",
    diagnostic_methodology: "Diagnostic Methodology",
    waste_analysis: "Waste Analysis",
    swot_analysis: "SWOT Analysis",
    financial_analysis: "Financial Analysis",
    recommendations: "Recommendations",
    roadmap: "Roadmap",
    appendices: "Appendices",
    toc: "Table of Contents",
    methodology: "Methodology",
    glossary: "Glossary",
  },
};

// ---------------------------------------------------------------------------
// SVG chart generation
// ---------------------------------------------------------------------------

/**
 * Generates an inline SVG string for a given chart type.
 *
 * @param chartData - The data and type of the chart to render.
 * @param type      - Overrides the chart type if provided.
 * @returns SVG markup as a string.
 */
export function generateChartSvg(chartData: ChartData, type?: string): string {
  const resolvedType = type ?? chartData.type;

  switch (resolvedType) {
    case "radar":
      return buildRadarSvg(chartData as ChartData & { type: "radar" });
    case "bar":
      return buildBarSvg(chartData as ChartData & { type: "bar" });
    case "timeline":
      return buildTimelineSvg(chartData as ChartData & { type: "timeline" });
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><text x="50%" y="50%" text-anchor="middle" fill="#999">Unsupported chart type</text></svg>`;
  }
}

function buildRadarSvg(data: ChartData & { type: "radar" }): string {
  const cx = 200;
  const cy = 200;
  const maxRadius = 150;
  const points = data.points;
  const n = points.length;

  if (n === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"></svg>`;
  }

  const angleStep = (2 * Math.PI) / n;

  // Background grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];
  const gridLines = rings
    .map((r) => {
      const ringPoints = Array.from({ length: n }, (_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * maxRadius * r;
        const y = cy + Math.sin(angle) * maxRadius * r;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return `<polygon points="${ringPoints}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
    })
    .join("\n");

  // Axis lines
  const axes = points
    .map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxRadius;
      const y = cy + Math.sin(angle) * maxRadius;
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e0e0e0" stroke-width="1"/>`;
    })
    .join("\n");

  // Data polygon
  const dataPoints = points
    .map((p, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (p.score / 100) * maxRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Labels
  const labels = points
    .map((p, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * (maxRadius + 25);
      const y = cy + Math.sin(angle) * (maxRadius + 25);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="11" fill="#333">${p.label} (${p.score})</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="400" height="440">
${gridLines}
${axes}
<polygon points="${dataPoints}" fill="rgba(52,152,219,0.3)" stroke="#3498db" stroke-width="2"/>
${labels}
</svg>`;
}

function buildBarSvg(data: ChartData & { type: "bar" }): string {
  const width = 500;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 60, left: 50 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const points = data.points;
  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const barWidth = chartW / points.length - 8;

  const bars = points
    .map((p, i) => {
      const barH = (p.value / maxVal) * chartH;
      const x = margin.left + i * (chartW / points.length) + 4;
      const y = margin.top + chartH - barH;
      const color = p.color ?? "#3498db";
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${color}" rx="2"/>
<text x="${x + barWidth / 2}" y="${height - margin.bottom + 16}" text-anchor="middle" font-size="10" fill="#333">${p.label}</text>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartH}" stroke="#999" stroke-width="1"/>
<line x1="${margin.left}" y1="${margin.top + chartH}" x2="${width - margin.right}" y2="${margin.top + chartH}" stroke="#999" stroke-width="1"/>
${bars}
</svg>`;
}

function buildTimelineSvg(data: ChartData & { type: "timeline" }): string {
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const points = data.points;
  const maxVal = Math.max(...points.map((p) => p.value), 1);

  if (points.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"></svg>`;
  }

  const pathD = points
    .map((p, i) => {
      const x = margin.left + (i / Math.max(points.length - 1, 1)) * chartW;
      const y = margin.top + chartH - (p.value / maxVal) * chartH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<path d="${pathD}" fill="none" stroke="#3498db" stroke-width="2"/>
${points.map((p, i) => {
  const x = margin.left + (i / Math.max(points.length - 1, 1)) * chartW;
  return `<text x="${x.toFixed(1)}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#666">${p.label}</text>`;
}).join("\n")}
</svg>`;
}

// ---------------------------------------------------------------------------
// HTML report builder
// ---------------------------------------------------------------------------

/**
 * Builds a complete HTML document from the report data and configuration.
 *
 * @param reportData - Aggregated diagnostic data.
 * @param config     - User-selected report options.
 * @returns Full HTML string ready for Puppeteer rendering.
 */
export function buildHtmlReport(reportData: ReportData, config: ReportConfig): string {
  const locale = config.locale;
  const titles = SECTION_TITLES[locale];
  const wasteLabels = WASTE_LABELS[locale];
  const branding = extractBranding(config);

  const sections: string[] = [];

  // Cover page
  sections.push(buildCoverPage(reportData, branding, locale));

  // Table of contents
  sections.push(buildTableOfContents(config.sections, titles));

  // Build each requested section
  for (const sectionType of config.sections) {
    switch (sectionType) {
      case "executive_summary":
        sections.push(buildExecutiveSummary(reportData, titles, locale));
        break;
      case "company_overview":
        sections.push(buildCompanyOverview(reportData, titles));
        break;
      case "diagnostic_methodology":
        sections.push(buildMethodology(titles, locale));
        break;
      case "waste_analysis":
        sections.push(buildWasteAnalysis(reportData, titles, wasteLabels, config));
        break;
      case "swot_analysis":
        sections.push(buildSwotAnalysis(reportData, titles));
        break;
      case "financial_analysis":
        sections.push(buildFinancialAnalysis(reportData, titles, locale));
        break;
      case "recommendations":
        sections.push(buildRecommendations(reportData, titles, locale));
        break;
      case "roadmap":
        sections.push(buildRoadmap(reportData, titles, locale));
        break;
      case "appendices":
        sections.push(buildAppendices(titles, locale));
        break;
    }
  }

  return wrapHtmlDocument(sections.join("\n"), branding, locale);
}

function extractBranding(config: ReportConfig): ReportBranding {
  return {
    primaryColor: config.brandingColor ?? "#3498db",
    logoUrl: config.brandingLogoUrl,
    headerText: config.customHeader,
    footerText: config.customFooter,
  };
}

function wrapHtmlDocument(body: string, branding: ReportBranding, locale: ReportLocale): string {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DiagOptim Report</title>
  <style>
    @page { size: A4; margin: 20mm 15mm 25mm 15mm; }
    body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    h1 { color: ${branding.primaryColor}; font-size: 22pt; margin-top: 0; page-break-after: avoid; }
    h2 { color: ${branding.primaryColor}; font-size: 16pt; border-bottom: 2px solid ${branding.primaryColor}; padding-bottom: 4px; page-break-after: avoid; }
    h3 { color: #555; font-size: 13pt; page-break-after: avoid; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: ${branding.primaryColor}; color: #fff; padding: 8px 10px; text-align: left; font-size: 10pt; }
    td { padding: 6px 10px; border-bottom: 1px solid #e0e0e0; font-size: 10pt; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .page-break { page-break-before: always; }
    .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
    .cover h1 { font-size: 30pt; margin-bottom: 10px; }
    .cover .subtitle { font-size: 14pt; color: #666; }
    .cover .logo { max-height: 80px; margin-bottom: 30px; }
    .toc a { text-decoration: none; color: #333; }
    .toc li { margin: 6px 0; font-size: 12pt; }
    .metric-box { display: inline-block; width: 30%; text-align: center; margin: 10px 1%; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .metric-box .value { font-size: 28pt; font-weight: bold; color: ${branding.primaryColor}; }
    .metric-box .label { font-size: 10pt; color: #666; }
    .recommendation-card { border-left: 4px solid ${branding.primaryColor}; padding: 10px 15px; margin: 10px 0; background: #f8f9fa; }
    .priority-high { border-left-color: #e74c3c; }
    .priority-medium { border-left-color: #f39c12; }
    .priority-low { border-left-color: #27ae60; }
    .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .swot-cell { padding: 12px; border-radius: 6px; }
    .swot-strengths { background: #d4edda; }
    .swot-weaknesses { background: #f8d7da; }
    .swot-opportunities { background: #d1ecf1; }
    .swot-threats { background: #fff3cd; }
    .chart-container { text-align: center; margin: 20px 0; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #999; padding: 5px; }
  </style>
</head>
<body>
${body}
${branding.footerText ? `<div class="footer">${escapeHtml(branding.footerText)}</div>` : ""}
</body>
</html>`;
}

function buildCoverPage(data: ReportData, branding: ReportBranding, locale: ReportLocale): string {
  const dateStr = new Date(data.generatedAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const title = locale === "fr" ? "Rapport de Diagnostic" : "Diagnostic Report";
  const subtitle = locale === "fr" ? "Analyse des gaspillages & plan d'optimisation" : "Waste Analysis & Optimization Plan";

  return `<div class="cover">
${branding.logoUrl ? `<img class="logo" src="${escapeHtml(branding.logoUrl)}" alt="Logo"/>` : ""}
<h1>${title}</h1>
<div class="subtitle">${subtitle}</div>
<div style="margin-top:30px; font-size:16pt; font-weight:bold;">${escapeHtml(data.company.name)}</div>
<div style="margin-top:10px; color:#666;">${dateStr}</div>
${branding.headerText ? `<div style="margin-top:20px; font-size:11pt; color:#888;">${escapeHtml(branding.headerText)}</div>` : ""}
</div>`;
}

function buildTableOfContents(sectionTypes: string[], titles: Record<string, string>): string {
  const items = sectionTypes
    .map((s, i) => `<li>${i + 1}. ${titles[s] ?? s}</li>`)
    .join("\n");

  return `<div class="page-break">
<h2>${titles.toc}</h2>
<ol class="toc">${items}</ol>
</div>`;
}

function buildExecutiveSummary(data: ReportData, titles: Record<string, string>, locale: ReportLocale): string {
  const scoreLabel = locale === "fr" ? "Score global" : "Global Score";
  const savingsLabel = locale === "fr" ? "Économies potentielles" : "Potential Savings";
  const actionsLabel = locale === "fr" ? "Actions identifiées" : "Identified Actions";

  const savings = data.financialSummary
    ? `${formatCurrency(data.financialSummary.potentialSavings.min, locale)} - ${formatCurrency(data.financialSummary.potentialSavings.max, locale)}`
    : "N/A";

  return `<div class="page-break">
<h2>${titles.executive_summary}</h2>
<div style="text-align:center; margin:30px 0;">
  <div class="metric-box"><div class="value">${data.globalScore}/100</div><div class="label">${scoreLabel}</div></div>
  <div class="metric-box"><div class="value">${savings}</div><div class="label">${savingsLabel}</div></div>
  <div class="metric-box"><div class="value">${data.roadmapActions.length}</div><div class="label">${actionsLabel}</div></div>
</div>
</div>`;
}

function buildCompanyOverview(data: ReportData, titles: Record<string, string>): string {
  return `<div class="page-break">
<h2>${titles.company_overview}</h2>
<table>
  <tr><td><strong>Entreprise</strong></td><td>${escapeHtml(data.company.name)}</td></tr>
  <tr><td><strong>Secteur</strong></td><td>${escapeHtml(data.company.sector)}</td></tr>
  <tr><td><strong>Effectif</strong></td><td>${data.company.employeeCount}</td></tr>
  <tr><td><strong>CA annuel</strong></td><td>${formatCurrency(data.company.annualRevenue, "fr")}</td></tr>
  <tr><td><strong>Localisation</strong></td><td>${escapeHtml(data.company.location)}</td></tr>
</table>
</div>`;
}

function buildMethodology(titles: Record<string, string>, locale: ReportLocale): string {
  const content = locale === "fr"
    ? `<p>Le diagnostic repose sur l'analyse des <strong>8 gaspillages du Lean Management</strong> (TIMWOODS), adaptée au contexte de l'entreprise. Chaque catégorie est évaluée sur une échelle de 0 à 100 via un questionnaire structuré, complété par l'analyse documentaire lorsque disponible.</p>
<p>La méthodologie inclut :</p>
<ul>
  <li>Questionnaire de cadrage (objectifs, contexte)</li>
  <li>Évaluation par catégorie de gaspillage</li>
  <li>Analyse SWOT stratégique</li>
  <li>Analyse financière (si documents fournis)</li>
  <li>Génération de recommandations priorisées</li>
</ul>`
    : `<p>The diagnostic is based on the analysis of the <strong>8 Lean Management wastes</strong> (TIMWOODS), adapted to the company context. Each category is scored from 0 to 100 through a structured questionnaire, supplemented by document analysis when available.</p>
<p>The methodology includes:</p>
<ul>
  <li>Framing questionnaire (objectives, context)</li>
  <li>Evaluation per waste category</li>
  <li>Strategic SWOT analysis</li>
  <li>Financial analysis (if documents provided)</li>
  <li>Prioritized recommendation generation</li>
</ul>`;

  return `<div class="page-break">
<h2>${titles.diagnostic_methodology}</h2>
${content}
</div>`;
}

function buildWasteAnalysis(
  data: ReportData,
  titles: Record<string, string>,
  wasteLabels: Record<WasteCategory, string>,
  config: ReportConfig,
): string {
  const categories = Object.keys(data.wasteScores) as WasteCategory[];

  const radarChart = config.includeCharts
    ? generateChartSvg({
        type: "radar",
        points: categories.map((cat) => ({
          category: cat,
          label: wasteLabels[cat],
          score: data.wasteScores[cat],
        })),
      })
    : "";

  const tableRows = categories
    .map((cat) => {
      const score = data.wasteScores[cat];
      const level = score >= 70 ? "Bon" : score >= 40 ? "Moyen" : "Critique";
      const color = score >= 70 ? "#27ae60" : score >= 40 ? "#f39c12" : "#e74c3c";
      return `<tr><td>${wasteLabels[cat]}</td><td style="color:${color}; font-weight:bold;">${score}/100</td><td>${level}</td></tr>`;
    })
    .join("\n");

  return `<div class="page-break">
<h2>${titles.waste_analysis}</h2>
${radarChart ? `<div class="chart-container">${radarChart}</div>` : ""}
<table>
  <thead><tr><th>Catégorie</th><th>Score</th><th>Niveau</th></tr></thead>
  <tbody>${tableRows}</tbody>
</table>
</div>`;
}

function buildSwotAnalysis(data: ReportData, titles: Record<string, string>): string {
  if (!data.swot) {
    return `<div class="page-break"><h2>${titles.swot_analysis}</h2><p>Analyse SWOT non disponible.</p></div>`;
  }

  const renderList = (items: string[]): string =>
    items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  return `<div class="page-break">
<h2>${titles.swot_analysis}</h2>
<div class="swot-grid">
  <div class="swot-cell swot-strengths"><h3>Forces</h3><ul>${renderList(data.swot.strengths)}</ul></div>
  <div class="swot-cell swot-weaknesses"><h3>Faiblesses</h3><ul>${renderList(data.swot.weaknesses)}</ul></div>
  <div class="swot-cell swot-opportunities"><h3>Opportunités</h3><ul>${renderList(data.swot.opportunities)}</ul></div>
  <div class="swot-cell swot-threats"><h3>Menaces</h3><ul>${renderList(data.swot.threats)}</ul></div>
</div>
</div>`;
}

function buildFinancialAnalysis(data: ReportData, titles: Record<string, string>, locale: ReportLocale): string {
  const fin = data.financialSummary;
  if (!fin) {
    const msg = locale === "fr" ? "Analyse financière non disponible (aucun document financier fourni)." : "Financial analysis not available (no financial documents provided).";
    return `<div class="page-break"><h2>${titles.financial_analysis}</h2><p>${msg}</p></div>`;
  }

  return `<div class="page-break">
<h2>${titles.financial_analysis}</h2>
<table>
  <tr><td><strong>Chiffre d'affaires</strong></td><td>${formatCurrency(fin.totalRevenue, locale)}</td></tr>
  <tr><td><strong>Charges totales</strong></td><td>${formatCurrency(fin.totalExpenses, locale)}</td></tr>
  <tr><td><strong>Résultat net</strong></td><td>${formatCurrency(fin.netIncome, locale)}</td></tr>
  <tr><td><strong>Coût estimé des gaspillages</strong></td><td>${formatCurrency(fin.estimatedWasteCost, locale)}</td></tr>
  <tr><td><strong>Économies potentielles</strong></td><td>${formatCurrency(fin.potentialSavings.min, locale)} - ${formatCurrency(fin.potentialSavings.max, locale)}</td></tr>
</table>
</div>`;
}

function buildRecommendations(data: ReportData, titles: Record<string, string>, locale: ReportLocale): string {
  const sortedSheets = [...data.memorySheets].sort((a, b) => a.score - b.score);

  const cards = sortedSheets
    .flatMap((sheet) =>
      sheet.recommendations.map((rec) => {
        const priorityClass = `priority-${rec.priority}`;
        const effortLabel = locale === "fr"
          ? { low: "Faible", medium: "Moyen", high: "Élevé" }[rec.effortLevel]
          : { low: "Low", medium: "Medium", high: "High" }[rec.effortLevel];
        const gainLabel = locale === "fr" ? "Gain estimé" : "Estimated gain";
        const timeLabel = locale === "fr" ? "semaines" : "weeks";

        return `<div class="recommendation-card ${priorityClass}">
<h3>${escapeHtml(rec.title)}</h3>
<p>${escapeHtml(rec.description)}</p>
<p><strong>${gainLabel}:</strong> ${formatCurrency(rec.estimatedGain, locale)} | <strong>Effort:</strong> ${effortLabel} | <strong>Durée:</strong> ${rec.timelineWeeks} ${timeLabel}</p>
</div>`;
      }),
    )
    .join("\n");

  return `<div class="page-break">
<h2>${titles.recommendations}</h2>
${cards || "<p>Aucune recommandation générée.</p>"}
</div>`;
}

function buildRoadmap(data: ReportData, titles: Record<string, string>, locale: ReportLocale): string {
  if (data.roadmapActions.length === 0) {
    const msg = locale === "fr" ? "Aucune action définie." : "No actions defined.";
    return `<div class="page-break"><h2>${titles.roadmap}</h2><p>${msg}</p></div>`;
  }

  const headerAction = locale === "fr" ? "Action" : "Action";
  const headerPriority = locale === "fr" ? "Priorité" : "Priority";
  const headerGain = locale === "fr" ? "Gain estimé" : "Est. Gain";
  const headerEffort = "Effort";
  const headerStatus = "Status";
  const headerDue = locale === "fr" ? "Échéance" : "Due Date";

  const rows = data.roadmapActions
    .sort((a, b) => a.priority - b.priority)
    .map((action) => {
      return `<tr>
<td>${escapeHtml(action.title)}</td>
<td>${action.priority}</td>
<td>${formatCurrency(action.estimatedGain, locale)}</td>
<td>${action.effortLevel}</td>
<td>${action.status}</td>
<td>${action.dueDate ?? "-"}</td>
</tr>`;
    })
    .join("\n");

  return `<div class="page-break">
<h2>${titles.roadmap}</h2>
<table>
  <thead><tr><th>${headerAction}</th><th>${headerPriority}</th><th>${headerGain}</th><th>${headerEffort}</th><th>${headerStatus}</th><th>${headerDue}</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</div>`;
}

function buildAppendices(titles: Record<string, string>, locale: ReportLocale): string {
  const methodologyTitle = titles.methodology;
  const glossaryTitle = titles.glossary;

  const methodContent = locale === "fr"
    ? `<p>Le framework TIMWOODS identifie 8 catégories de gaspillages dans les processus organisationnels : Transport, Inventaire, Mouvement, Attente, Surproduction, Sur-traitement, Défauts et Compétences sous-utilisées.</p>`
    : `<p>The TIMWOODS framework identifies 8 categories of waste in organizational processes: Transport, Inventory, Motion, Waiting, Overproduction, Over-processing, Defects, and underutilized Skills.</p>`;

  const glossaryItems = locale === "fr"
    ? [
        ["Lean Management", "Méthode de gestion visant à éliminer les gaspillages et améliorer continuellement les processus."],
        ["TIMWOODS", "Acronyme pour les 8 gaspillages : Transport, Inventaire, Mouvement, Attente, Surproduction, Sur-traitement, Défauts, Compétences."],
        ["Quick Win", "Action à faible effort et fort impact, réalisable rapidement."],
        ["ROI", "Retour sur investissement."],
      ]
    : [
        ["Lean Management", "Management method aimed at eliminating waste and continuously improving processes."],
        ["TIMWOODS", "Acronym for the 8 wastes: Transport, Inventory, Motion, Waiting, Overproduction, Over-processing, Defects, Skills."],
        ["Quick Win", "Low-effort, high-impact action achievable quickly."],
        ["ROI", "Return on Investment."],
      ];

  const glossaryRows = glossaryItems
    .map(([term, def]) => `<tr><td><strong>${term}</strong></td><td>${def}</td></tr>`)
    .join("\n");

  return `<div class="page-break">
<h2>${titles.appendices}</h2>
<h3>${methodologyTitle}</h3>
${methodContent}
<h3>${glossaryTitle}</h3>
<table>
  <thead><tr><th>Terme</th><th>Définition</th></tr></thead>
  <tbody>${glossaryRows}</tbody>
</table>
</div>`;
}

// ---------------------------------------------------------------------------
// PDF generation via Puppeteer
// ---------------------------------------------------------------------------

/**
 * Generates a PDF buffer from structured report data.
 *
 * Uses Puppeteer to launch a headless browser, load the rendered HTML,
 * and print it as a paginated PDF.
 *
 * @param reportData - Aggregated diagnostic data payload.
 * @param config     - Report configuration (format, locale, branding, etc.).
 * @returns A Buffer containing the PDF file contents.
 */
export async function generatePdfReport(reportData: ReportData, config: ReportConfig): Promise<Buffer> {
  // Dynamic import to avoid bundling Puppeteer in client builds
  const puppeteer = await import("puppeteer");

  const html = buildHtmlReport(reportData, config);

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
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px; width:100%; text-align:center; color:#999;">
        ${config.customHeader ? escapeHtml(config.customHeader) : "DiagOptim"}
      </div>`,
      footerTemplate: `<div style="font-size:8px; width:100%; text-align:center; color:#999;">
        ${config.customFooter ? escapeHtml(config.customFooter) : ""}
        <span style="margin-left:20px;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
      margin: { top: "20mm", bottom: "25mm", left: "15mm", right: "15mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(amount: number, locale: ReportLocale): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
