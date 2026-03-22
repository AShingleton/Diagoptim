/**
 * DOCX report generation using the `docx` npm package.
 *
 * Produces a professional Word document with styled sections matching the
 * PDF report structure: cover, TOC, executive summary, waste analysis,
 * recommendations, roadmap, and appendices.
 *
 * @module reports/docx-generator
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  ShadingType,
  TableLayoutType,
} from "docx";

import type {
  ReportData,
  ReportConfig,
  ReportLocale,
} from "@/types/report";
import type { WasteCategory } from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Locale maps
// ---------------------------------------------------------------------------

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
  },
};

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------

const PRIMARY_COLOR = "3498DB";
const _HEADER_BG = "3498DB";
const HEADER_FG = "FFFFFF";
const ALT_ROW_BG = "F2F2F2";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a DOCX buffer from structured report data.
 *
 * @param reportData - Aggregated diagnostic data payload.
 * @param config     - Report configuration (format, locale, branding, etc.).
 * @returns A Buffer containing the DOCX file.
 */
export async function generateDocxReport(reportData: ReportData, config: ReportConfig): Promise<Buffer> {
  const locale = config.locale;
  const titles = SECTION_TITLES[locale];
  const wasteLabels = WASTE_LABELS[locale];
  const primaryColor = config.brandingColor?.replace("#", "") ?? PRIMARY_COLOR;

  const sections: (Paragraph | Table)[] = [];

  // Cover page
  sections.push(...buildCoverParagraphs(reportData, config, primaryColor));

  // Table of contents placeholder
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: titles.toc, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: locale === "fr"
        ? "(La table des matières sera générée automatiquement dans Word via Références > Table des matières)"
        : "(Table of contents can be generated in Word via References > Table of Contents)",
      spacing: { after: 200 },
    }),
  );

  // Build each requested section
  for (const sectionType of config.sections) {
    sections.push(new Paragraph({ children: [new PageBreak()] }));

    switch (sectionType) {
      case "executive_summary":
        sections.push(...buildExecutiveSummary(reportData, titles, locale, primaryColor));
        break;
      case "company_overview":
        sections.push(...buildCompanyOverview(reportData, titles));
        break;
      case "diagnostic_methodology":
        sections.push(...buildMethodology(titles, locale));
        break;
      case "waste_analysis":
        sections.push(...buildWasteAnalysis(reportData, titles, wasteLabels, primaryColor));
        break;
      case "swot_analysis":
        sections.push(...buildSwotAnalysis(reportData, titles));
        break;
      case "financial_analysis":
        sections.push(...buildFinancialAnalysis(reportData, titles, locale));
        break;
      case "recommendations":
        sections.push(...buildRecommendations(reportData, titles, locale));
        break;
      case "roadmap":
        sections.push(...buildRoadmapSection(reportData, titles, locale, primaryColor));
        break;
      case "appendices":
        sections.push(...buildAppendices(titles, locale));
        break;
    }
  }

  const doc = new Document({
    creator: "DiagOptim",
    title: `Diagnostic Report - ${reportData.company.name}`,
    description: "Generated by DiagOptim",
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: config.customHeader ?? "DiagOptim",
                    size: 16,
                    color: "999999",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: config.customFooter ?? "",
                    size: 16,
                    color: "999999",
                  }),
                ],
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildCoverParagraphs(data: ReportData, config: ReportConfig, primaryColor: string): Paragraph[] {
  const locale = config.locale;
  const title = locale === "fr" ? "Rapport de Diagnostic" : "Diagnostic Report";
  const subtitle = locale === "fr"
    ? "Analyse des gaspillages & plan d'optimisation"
    : "Waste Analysis & Optimization Plan";
  const dateStr = new Date(data.generatedAt).toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return [
    new Paragraph({ spacing: { before: 4000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: title, bold: true, size: 56, color: primaryColor }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({ text: subtitle, size: 28, color: "666666" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [
        new TextRun({ text: data.company.name, bold: true, size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [
        new TextRun({ text: dateStr, size: 24, color: "666666" }),
      ],
    }),
  ];
}

function buildExecutiveSummary(
  data: ReportData,
  titles: Record<string, string>,
  locale: ReportLocale,
  primaryColor: string,
): Paragraph[] {
  const scoreLabel = locale === "fr" ? "Score global" : "Global Score";
  const savingsLabel = locale === "fr" ? "Économies potentielles" : "Potential Savings";
  const actionsLabel = locale === "fr" ? "Actions identifiées" : "Identified Actions";

  const savings = data.financialSummary
    ? `${formatCurrency(data.financialSummary.potentialSavings.min, locale)} - ${formatCurrency(data.financialSummary.potentialSavings.max, locale)}`
    : "N/A";

  return [
    new Paragraph({ text: titles.executive_summary, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: `${scoreLabel}: `, bold: true }),
        new TextRun({ text: `${data.globalScore}/100`, bold: true, color: primaryColor, size: 28 }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${savingsLabel}: `, bold: true }),
        new TextRun({ text: savings }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${actionsLabel}: `, bold: true }),
        new TextRun({ text: `${data.roadmapActions.length}` }),
      ],
    }),
  ];
}

function buildCompanyOverview(data: ReportData, titles: Record<string, string>): (Paragraph | Table)[] {
  const rows = [
    ["Entreprise", data.company.name],
    ["Secteur", data.company.sector],
    ["Effectif", `${data.company.employeeCount}`],
    ["CA annuel", formatCurrency(data.company.annualRevenue, "fr")],
    ["Localisation", data.company.location],
  ];

  return [
    new Paragraph({ text: titles.company_overview, heading: HeadingLevel.HEADING_1 }),
    buildKeyValueTable(rows),
  ];
}

function buildMethodology(titles: Record<string, string>, locale: ReportLocale): Paragraph[] {
  const paras = locale === "fr"
    ? [
        "Le diagnostic repose sur l'analyse des 8 gaspillages du Lean Management (TIMWOODS), adaptée au contexte de l'entreprise.",
        "Chaque catégorie est évaluée sur une échelle de 0 à 100 via un questionnaire structuré, complété par l'analyse documentaire lorsque disponible.",
      ]
    : [
        "The diagnostic is based on the analysis of the 8 Lean Management wastes (TIMWOODS), adapted to the company context.",
        "Each category is scored from 0 to 100 through a structured questionnaire, supplemented by document analysis when available.",
      ];

  return [
    new Paragraph({ text: titles.diagnostic_methodology, heading: HeadingLevel.HEADING_1 }),
    ...paras.map((p) => new Paragraph({ text: p, spacing: { after: 100 } })),
  ];
}

function buildWasteAnalysis(
  data: ReportData,
  titles: Record<string, string>,
  wasteLabels: Record<WasteCategory, string>,
  primaryColor: string,
): Paragraph[] {
  const categories = Object.keys(data.wasteScores) as WasteCategory[];

  const headerRow = new TableRow({
    tableHeader: true,
    children: ["Catégorie", "Score", "Niveau"].map(
      (text) =>
        new TableCell({
          shading: { fill: primaryColor, type: ShadingType.SOLID, color: primaryColor },
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, color: HEADER_FG, size: 20 })],
            }),
          ],
        }),
    ),
  });

  const dataRows = categories.map((cat, idx) => {
    const score = data.wasteScores[cat];
    const level = score >= 70 ? "Bon" : score >= 40 ? "Moyen" : "Critique";
    const scoreColor = score >= 70 ? "27AE60" : score >= 40 ? "F39C12" : "E74C3C";
    const fill = idx % 2 === 1 ? ALT_ROW_BG : "FFFFFF";

    return new TableRow({
      children: [
        new TableCell({
          shading: { fill, type: ShadingType.SOLID, color: fill },
          children: [new Paragraph({ text: wasteLabels[cat] })],
        }),
        new TableCell({
          shading: { fill, type: ShadingType.SOLID, color: fill },
          children: [
            new Paragraph({
              children: [new TextRun({ text: `${score}/100`, bold: true, color: scoreColor })],
            }),
          ],
        }),
        new TableCell({
          shading: { fill, type: ShadingType.SOLID, color: fill },
          children: [new Paragraph({ text: level })],
        }),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });

  return [
    new Paragraph({ text: titles.waste_analysis, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: "(Radar chart: see PDF version or insert chart in Word)",
      spacing: { before: 100, after: 200 },
      children: [new TextRun({ text: "(Radar chart: see PDF version or insert chart in Word)", italics: true, color: "999999" })],
    }),
    table as unknown as Paragraph,
  ];
}

function buildSwotAnalysis(data: ReportData, titles: Record<string, string>): Paragraph[] {
  if (!data.swot) {
    return [
      new Paragraph({ text: titles.swot_analysis, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: "Analyse SWOT non disponible." }),
    ];
  }

  const buildSwotList = (heading: string, items: string[], color: string): Paragraph[] => [
    new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({ text: heading, bold: true, color })],
    }),
    ...items.map(
      (item) =>
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: item })],
        }),
    ),
  ];

  return [
    new Paragraph({ text: titles.swot_analysis, heading: HeadingLevel.HEADING_1 }),
    ...buildSwotList("Forces", data.swot.strengths, "27AE60"),
    ...buildSwotList("Faiblesses", data.swot.weaknesses, "E74C3C"),
    ...buildSwotList("Opportunités", data.swot.opportunities, "3498DB"),
    ...buildSwotList("Menaces", data.swot.threats, "F39C12"),
  ];
}

function buildFinancialAnalysis(
  data: ReportData,
  titles: Record<string, string>,
  locale: ReportLocale,
): (Paragraph | Table)[] {
  const fin = data.financialSummary;
  if (!fin) {
    return [
      new Paragraph({ text: titles.financial_analysis, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({
        text: locale === "fr"
          ? "Analyse financière non disponible."
          : "Financial analysis not available.",
      }),
    ];
  }

  const rows = [
    ["Chiffre d'affaires", formatCurrency(fin.totalRevenue, locale)],
    ["Charges totales", formatCurrency(fin.totalExpenses, locale)],
    ["Résultat net", formatCurrency(fin.netIncome, locale)],
    ["Coût estimé des gaspillages", formatCurrency(fin.estimatedWasteCost, locale)],
    [
      "Économies potentielles",
      `${formatCurrency(fin.potentialSavings.min, locale)} - ${formatCurrency(fin.potentialSavings.max, locale)}`,
    ],
  ];

  return [
    new Paragraph({ text: titles.financial_analysis, heading: HeadingLevel.HEADING_1 }),
    buildKeyValueTable(rows),
  ];
}

function buildRecommendations(
  data: ReportData,
  titles: Record<string, string>,
  locale: ReportLocale,
): Paragraph[] {
  const result: Paragraph[] = [
    new Paragraph({ text: titles.recommendations, heading: HeadingLevel.HEADING_1 }),
  ];

  const sortedSheets = [...data.memorySheets].sort((a, b) => a.score - b.score);

  for (const sheet of sortedSheets) {
    for (const rec of sheet.recommendations) {
      const priorityColor =
        rec.priority === "high" ? "E74C3C" : rec.priority === "medium" ? "F39C12" : "27AE60";
      const effortLabel = locale === "fr"
        ? { low: "Faible", medium: "Moyen", high: "Élevé" }[rec.effortLevel]
        : { low: "Low", medium: "Medium", high: "High" }[rec.effortLevel];

      result.push(
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({ text: `[${rec.priority.toUpperCase()}] `, bold: true, color: priorityColor }),
            new TextRun({ text: rec.title, bold: true }),
          ],
        }),
        new Paragraph({ text: rec.description }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Gain: ${formatCurrency(rec.estimatedGain, locale)} | Effort: ${effortLabel} | ${rec.timelineWeeks} ${locale === "fr" ? "semaines" : "weeks"}`,
              italics: true,
              color: "666666",
              size: 18,
            }),
          ],
        }),
      );
    }
  }

  return result;
}

function buildRoadmapSection(
  data: ReportData,
  titles: Record<string, string>,
  locale: ReportLocale,
  primaryColor: string,
): Paragraph[] {
  if (data.roadmapActions.length === 0) {
    return [
      new Paragraph({ text: titles.roadmap, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: locale === "fr" ? "Aucune action définie." : "No actions defined." }),
    ];
  }

  const headers = ["Action", locale === "fr" ? "Priorité" : "Priority", "Gain", "Effort", "Status", locale === "fr" ? "Échéance" : "Due"];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (text) =>
        new TableCell({
          shading: { fill: primaryColor, type: ShadingType.SOLID, color: primaryColor },
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, color: HEADER_FG, size: 18 })],
            }),
          ],
        }),
    ),
  });

  const sorted = [...data.roadmapActions].sort((a, b) => a.priority - b.priority);

  const dataRows = sorted.map((action, idx) => {
    const fill = idx % 2 === 1 ? ALT_ROW_BG : "FFFFFF";
    const cells = [
      action.title,
      `${action.priority}`,
      formatCurrency(action.estimatedGain, locale),
      action.effortLevel,
      action.status,
      action.dueDate ?? "-",
    ];

    return new TableRow({
      children: cells.map(
        (text) =>
          new TableCell({
            shading: { fill, type: ShadingType.SOLID, color: fill },
            children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
          }),
      ),
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });

  return [
    new Paragraph({ text: titles.roadmap, heading: HeadingLevel.HEADING_1 }),
    table as unknown as Paragraph,
  ];
}

function buildAppendices(titles: Record<string, string>, locale: ReportLocale): Paragraph[] {
  const glossary = locale === "fr"
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

  return [
    new Paragraph({ text: titles.appendices, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      text: locale === "fr" ? "Glossaire" : "Glossary",
      heading: HeadingLevel.HEADING_2,
    }),
    ...glossary.flatMap(([term, def]) => [
      new Paragraph({
        spacing: { before: 100 },
        children: [
          new TextRun({ text: `${term}: `, bold: true }),
          new TextRun({ text: def }),
        ],
      }),
    ]),
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildKeyValueTable(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: rows.map(
      ([key, value], idx) =>
        new TableRow({
          children: [
            new TableCell({
              shading: {
                fill: idx % 2 === 0 ? "FFFFFF" : ALT_ROW_BG,
                type: ShadingType.SOLID,
                color: idx % 2 === 0 ? "FFFFFF" : ALT_ROW_BG,
              },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: key, bold: true })],
                }),
              ],
            }),
            new TableCell({
              shading: {
                fill: idx % 2 === 0 ? "FFFFFF" : ALT_ROW_BG,
                type: ShadingType.SOLID,
                color: idx % 2 === 0 ? "FFFFFF" : ALT_ROW_BG,
              },
              children: [new Paragraph({ text: value })],
            }),
          ],
        }),
    ),
  });
}

function formatCurrency(amount: number, locale: ReportLocale): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
