/**
 * Public procurement export - Mémoire Technique generator.
 *
 * Generates a "mémoire technique" document for French public procurement
 * (marchés publics), structured with standard sections: company presentation,
 * means and resources, references, methodology, and quality commitments.
 *
 * @module integrations/export-mp
 */

import type { ReportData, ReportConfig, ReportLocale } from "@/types/report";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Sections of a mémoire technique. */
export interface MemoireTechniqueSections {
  presentation: PresentationSection;
  moyens: MoyensSection;
  references: ReferencesSection;
  methodologie: MethodologieSection;
  engagementQualite: EngagementQualiteSection;
}

/** Company presentation section. */
export interface PresentationSection {
  companyName: string;
  description: string;
  sector: string;
  creationDate: string;
  employeeCount: number;
  annualRevenue: number;
  certifications: string[];
  location: string;
}

/** Means and resources section. */
export interface MoyensSection {
  humanResources: HumanResource[];
  technicalResources: string[];
  equipment: string[];
  softwareTools: string[];
}

/** Human resource entry. */
export interface HumanResource {
  role: string;
  count: number;
  qualifications: string[];
}

/** References section. */
export interface ReferencesSection {
  projects: ProjectReference[];
}

/** Project reference entry. */
export interface ProjectReference {
  clientName: string;
  projectTitle: string;
  year: number;
  description: string;
  amount: number;
  duration: string;
}

/** Methodology section. */
export interface MethodologieSection {
  approach: string;
  phases: MethodologyPhase[];
  qualityProcess: string;
  riskManagement: string;
}

/** Methodology phase. */
export interface MethodologyPhase {
  name: string;
  description: string;
  deliverables: string[];
  duration: string;
}

/** Quality commitment section. */
export interface EngagementQualiteSection {
  qualityPolicy: string;
  indicators: QualityIndicator[];
  continuousImprovement: string;
  environmentalCommitment: string;
}

/** Quality indicator. */
export interface QualityIndicator {
  name: string;
  target: string;
  measurementMethod: string;
}

/** Format for the generated document. */
export type MemoireFormat = "pdf" | "docx";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a mémoire technique document from a diagnostic report.
 *
 * The document is structured according to French public procurement
 * standards and leverages diagnostic data to populate quality and
 * methodology sections.
 *
 * @param diagnosticId - The diagnostic ID to base the mémoire on.
 * @param format       - Output format ("pdf" or "docx").
 * @returns A Buffer containing the generated document.
 */
export async function generateMemoireTechnique(
  diagnosticId: string,
  format: MemoireFormat = "pdf",
): Promise<Buffer> {
  // In production, fetch diagnostic and company data from database
  // const diagnostic = await fetchDiagnostic(diagnosticId);
  // const company = await fetchCompany(diagnostic.companyId);

  const sections = buildPlaceholderSections();
  const html = buildMemoireHtml(sections);

  if (format === "docx") {
    return generateMemoireDocx(sections);
  }

  return generateMemoirePdf(html);
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

async function generateMemoirePdf(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");

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
      headerTemplate: `<div style="font-size:8px; width:100%; text-align:center; color:#999;">Mémoire Technique - Confidentiel</div>`,
      footerTemplate: `<div style="font-size:8px; width:100%; text-align:center; color:#999;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// DOCX generation
// ---------------------------------------------------------------------------

async function generateMemoireDocx(sections: MemoireTechniqueSections): Promise<Buffer> {
  const {
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
  } = await import("docx");

  const PRIMARY_COLOR = "2C3E50";

  const paragraphs: InstanceType<typeof Paragraph>[] = [];

  // Cover page
  paragraphs.push(
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "MÉMOIRE TECHNIQUE", bold: true, size: 56, color: PRIMARY_COLOR })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [new TextRun({ text: sections.presentation.companyName, bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: "Document confidentiel", italics: true, color: "999999", size: 22 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // 1. Présentation de l'entreprise
  paragraphs.push(
    new Paragraph({ text: "1. Présentation de l'entreprise", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: sections.presentation.description, spacing: { after: 100 } }),
    new Paragraph({
      children: [
        new TextRun({ text: "Secteur d'activité : ", bold: true }),
        new TextRun({ text: sections.presentation.sector }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Effectif : ", bold: true }),
        new TextRun({ text: `${sections.presentation.employeeCount} collaborateurs` }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Chiffre d'affaires : ", bold: true }),
        new TextRun({ text: formatCurrency(sections.presentation.annualRevenue) }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Localisation : ", bold: true }),
        new TextRun({ text: sections.presentation.location }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // 2. Moyens
  paragraphs.push(
    new Paragraph({ text: "2. Moyens humains et techniques", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "2.1 Ressources humaines", heading: HeadingLevel.HEADING_2 }),
  );

  for (const hr of sections.moyens.humanResources) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${hr.role} (${hr.count}) : `, bold: true }),
          new TextRun({ text: hr.qualifications.join(", ") }),
        ],
        spacing: { after: 50 },
      }),
    );
  }

  paragraphs.push(
    new Paragraph({ text: "2.2 Moyens techniques", heading: HeadingLevel.HEADING_2 }),
    ...sections.moyens.technicalResources.map(
      (r) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: r })] }),
    ),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // 3. Références
  paragraphs.push(
    new Paragraph({ text: "3. Références", heading: HeadingLevel.HEADING_1 }),
  );

  for (const ref of sections.references.projects) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [new TextRun({ text: `${ref.projectTitle} (${ref.year})`, bold: true })],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Client : ${ref.clientName} | Montant : ${formatCurrency(ref.amount)} | Durée : ${ref.duration}` }),
        ],
      }),
      new Paragraph({ text: ref.description }),
    );
  }

  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  // 4. Méthodologie
  paragraphs.push(
    new Paragraph({ text: "4. Méthodologie", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: sections.methodologie.approach, spacing: { after: 100 } }),
  );

  for (const phase of sections.methodologie.phases) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 150 },
        children: [new TextRun({ text: `${phase.name} (${phase.duration})`, bold: true })],
      }),
      new Paragraph({ text: phase.description }),
      ...phase.deliverables.map(
        (d) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: d })] }),
      ),
    );
  }

  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  // 5. Engagement qualité
  paragraphs.push(
    new Paragraph({ text: "5. Engagement Qualité", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: sections.engagementQualite.qualityPolicy, spacing: { after: 100 } }),
    new Paragraph({ text: "5.1 Indicateurs qualité", heading: HeadingLevel.HEADING_2 }),
  );

  for (const indicator of sections.engagementQualite.indicators) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${indicator.name} : `, bold: true }),
          new TextRun({ text: `Objectif ${indicator.target} - Mesure : ${indicator.measurementMethod}` }),
        ],
        spacing: { after: 50 },
      }),
    );
  }

  paragraphs.push(
    new Paragraph({ text: "5.2 Amélioration continue", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: sections.engagementQualite.continuousImprovement }),
    new Paragraph({ text: "5.3 Engagement environnemental", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: sections.engagementQualite.environmentalCommitment }),
  );

  const doc = new Document({
    creator: "DiagOptim",
    title: `Mémoire Technique - ${sections.presentation.companyName}`,
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Mémoire Technique - Confidentiel", size: 16, color: "999999" })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: sections.presentation.companyName, size: 16, color: "999999" })],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

function buildMemoireHtml(sections: MemoireTechniqueSections): string {
  const { presentation, moyens, references, methodologie, engagementQualite } = sections;

  const referencesHtml = references.projects
    .map(
      (ref) => `<div style="margin:10px 0; padding:10px; background:#f8f9fa; border-radius:6px;">
<strong>${esc(ref.projectTitle)} (${ref.year})</strong><br/>
Client : ${esc(ref.clientName)} | Montant : ${formatCurrency(ref.amount)} | Durée : ${esc(ref.duration)}<br/>
<em>${esc(ref.description)}</em>
</div>`,
    )
    .join("\n");

  const phasesHtml = methodologie.phases
    .map(
      (phase) => `<div style="margin:10px 0; padding:10px; border-left:3px solid #3498db; background:#f8f9fa;">
<strong>${esc(phase.name)} (${esc(phase.duration)})</strong>
<p>${esc(phase.description)}</p>
<ul>${phase.deliverables.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
</div>`,
    )
    .join("\n");

  const indicatorsHtml = engagementQualite.indicators
    .map(
      (ind) =>
        `<tr><td><strong>${esc(ind.name)}</strong></td><td>${esc(ind.target)}</td><td>${esc(ind.measurementMethod)}</td></tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-size: 11pt; color: #333; line-height: 1.6; }
  h1 { color: #2c3e50; font-size: 20pt; border-bottom: 3px solid #2c3e50; padding-bottom: 5px; page-break-after: avoid; }
  h2 { color: #3498db; font-size: 14pt; page-break-after: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #2c3e50; color: #fff; padding: 8px; text-align: left; }
  td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
  .cover { text-align: center; padding-top: 200px; page-break-after: always; }
  .cover h1 { border: none; font-size: 30pt; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
<div class="cover">
  <h1>MÉMOIRE TECHNIQUE</h1>
  <p style="font-size:18pt; margin-top:20px;">${esc(presentation.companyName)}</p>
  <p style="color:#999; margin-top:40px;">Document confidentiel</p>
  <p style="color:#999;">${new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}</p>
</div>

<h1>1. Présentation de l'entreprise</h1>
<p>${esc(presentation.description)}</p>
<table>
  <tr><td><strong>Secteur</strong></td><td>${esc(presentation.sector)}</td></tr>
  <tr><td><strong>Effectif</strong></td><td>${presentation.employeeCount} collaborateurs</td></tr>
  <tr><td><strong>Chiffre d'affaires</strong></td><td>${formatCurrency(presentation.annualRevenue)}</td></tr>
  <tr><td><strong>Localisation</strong></td><td>${esc(presentation.location)}</td></tr>
  ${presentation.certifications.length > 0 ? `<tr><td><strong>Certifications</strong></td><td>${presentation.certifications.map(esc).join(", ")}</td></tr>` : ""}
</table>

<div class="page-break"></div>
<h1>2. Moyens humains et techniques</h1>
<h2>2.1 Ressources humaines</h2>
<table>
  <thead><tr><th>Fonction</th><th>Effectif</th><th>Qualifications</th></tr></thead>
  <tbody>
${moyens.humanResources.map((hr) => `<tr><td>${esc(hr.role)}</td><td>${hr.count}</td><td>${hr.qualifications.map(esc).join(", ")}</td></tr>`).join("\n")}
  </tbody>
</table>
<h2>2.2 Moyens techniques</h2>
<ul>${moyens.technicalResources.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>

<div class="page-break"></div>
<h1>3. Références</h1>
${referencesHtml}

<div class="page-break"></div>
<h1>4. Méthodologie</h1>
<p>${esc(methodologie.approach)}</p>
${phasesHtml}
<h2>Gestion des risques</h2>
<p>${esc(methodologie.riskManagement)}</p>

<div class="page-break"></div>
<h1>5. Engagement Qualité</h1>
<p>${esc(engagementQualite.qualityPolicy)}</p>
<h2>5.1 Indicateurs qualité</h2>
<table>
  <thead><tr><th>Indicateur</th><th>Objectif</th><th>Mesure</th></tr></thead>
  <tbody>${indicatorsHtml}</tbody>
</table>
<h2>5.2 Amélioration continue</h2>
<p>${esc(engagementQualite.continuousImprovement)}</p>
<h2>5.3 Engagement environnemental</h2>
<p>${esc(engagementQualite.environmentalCommitment)}</p>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Placeholder data builder
// ---------------------------------------------------------------------------

function buildPlaceholderSections(): MemoireTechniqueSections {
  return {
    presentation: {
      companyName: "[Nom de l'entreprise]",
      description:
        "[Description de l'entreprise, son histoire, ses valeurs et son positionnement sur le marché.]",
      sector: "[Secteur d'activité]",
      creationDate: "[Date de création]",
      employeeCount: 0,
      annualRevenue: 0,
      certifications: [],
      location: "[Localisation]",
    },
    moyens: {
      humanResources: [
        {
          role: "Directeur / Responsable projet",
          count: 1,
          qualifications: ["[Qualifications et expérience]"],
        },
        {
          role: "Techniciens / Opérateurs",
          count: 0,
          qualifications: ["[Qualifications et certifications]"],
        },
      ],
      technicalResources: [
        "[Équipement technique principal]",
        "[Logiciels et outils numériques]",
      ],
      equipment: [],
      softwareTools: [],
    },
    references: {
      projects: [
        {
          clientName: "[Client 1]",
          projectTitle: "[Intitulé du projet]",
          year: 2024,
          description: "[Description du projet, résultats obtenus]",
          amount: 0,
          duration: "[Durée]",
        },
        {
          clientName: "[Client 2]",
          projectTitle: "[Intitulé du projet]",
          year: 2023,
          description: "[Description du projet, résultats obtenus]",
          amount: 0,
          duration: "[Durée]",
        },
      ],
    },
    methodologie: {
      approach:
        "[Description de l'approche méthodologique globale de l'entreprise pour la réalisation de la prestation.]",
      phases: [
        {
          name: "Phase 1 : Cadrage",
          description: "[Description de la phase de cadrage]",
          deliverables: ["[Livrable 1]", "[Livrable 2]"],
          duration: "[Durée estimée]",
        },
        {
          name: "Phase 2 : Réalisation",
          description: "[Description de la phase de réalisation]",
          deliverables: ["[Livrable 1]", "[Livrable 2]"],
          duration: "[Durée estimée]",
        },
        {
          name: "Phase 3 : Livraison & suivi",
          description: "[Description de la phase de livraison]",
          deliverables: ["[Livrable final]", "[Rapport de suivi]"],
          duration: "[Durée estimée]",
        },
      ],
      qualityProcess:
        "[Description du processus qualité appliqué pendant la prestation.]",
      riskManagement:
        "[Description de la gestion des risques : identification, évaluation, plan de mitigation.]",
    },
    engagementQualite: {
      qualityPolicy:
        "[Politique qualité de l'entreprise et engagement envers le client.]",
      indicators: [
        {
          name: "Taux de satisfaction client",
          target: "> 90%",
          measurementMethod: "Enquête de satisfaction post-prestation",
        },
        {
          name: "Respect des délais",
          target: "> 95%",
          measurementMethod: "Suivi des jalons projet",
        },
        {
          name: "Taux de non-conformité",
          target: "< 2%",
          measurementMethod: "Registre des non-conformités",
        },
      ],
      continuousImprovement:
        "[Démarche d'amélioration continue : revues de processus, retours d'expérience, plans d'action correctifs.]",
      environmentalCommitment:
        "[Engagement environnemental : politique RSE, actions concrètes, certifications environnementales.]",
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
