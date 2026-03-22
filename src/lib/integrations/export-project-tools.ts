/**
 * Export roadmap to project management tools.
 *
 * Generates data structures compatible with Trello, Notion,
 * and iCalendar (.ics) format.
 *
 * @module integrations/export-project-tools
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoadmapAction {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  dueDate: string | null;
  estimatedGainMin: number;
  estimatedGainMax: number;
  assignee?: string;
}

interface Roadmap {
  id: string;
  companyName: string;
  diagnosticDate: string;
  actions: RoadmapAction[];
}

// ---------------------------------------------------------------------------
// Trello export
// ---------------------------------------------------------------------------

export interface TrelloBoard {
  name: string;
  lists: TrelloList[];
}

interface TrelloList {
  name: string;
  cards: TrelloCard[];
}

interface TrelloCard {
  name: string;
  desc: string;
  due: string | null;
  labels: string[];
}

export function exportToTrello(roadmap: Roadmap): TrelloBoard {
  const actionsByStatus: Record<string, RoadmapAction[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const action of roadmap.actions) {
    (actionsByStatus[action.status] ?? actionsByStatus.todo).push(action);
  }

  const mapCard = (action: RoadmapAction): TrelloCard => ({
    name: action.title,
    desc: [
      action.description,
      "",
      `Priorité: ${action.priority}`,
      `Effort: ${action.effort} | Impact: ${action.impact}`,
      `Gains estimés: ${action.estimatedGainMin}€ - ${action.estimatedGainMax}€`,
      action.assignee ? `Assigné à: ${action.assignee}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    due: action.dueDate,
    labels: [action.category, action.priority],
  });

  return {
    name: `DiagOptim - ${roadmap.companyName}`,
    lists: [
      { name: "À faire", cards: actionsByStatus.todo.map(mapCard) },
      { name: "En cours", cards: actionsByStatus.in_progress.map(mapCard) },
      { name: "Terminé", cards: actionsByStatus.done.map(mapCard) },
    ],
  };
}

// ---------------------------------------------------------------------------
// Notion export
// ---------------------------------------------------------------------------

export interface NotionDatabase {
  title: string;
  properties: Record<string, NotionProperty>;
  rows: NotionRow[];
}

interface NotionProperty {
  type: "title" | "rich_text" | "select" | "date" | "number" | "status";
}

interface NotionRow {
  properties: Record<string, unknown>;
}

export function exportToNotion(roadmap: Roadmap): NotionDatabase {
  return {
    title: `DiagOptim - ${roadmap.companyName}`,
    properties: {
      Action: { type: "title" },
      Description: { type: "rich_text" },
      Catégorie: { type: "select" },
      Priorité: { type: "select" },
      Effort: { type: "select" },
      Impact: { type: "select" },
      Statut: { type: "status" },
      Échéance: { type: "date" },
      "Gain Min (€)": { type: "number" },
      "Gain Max (€)": { type: "number" },
    },
    rows: roadmap.actions.map((action) => ({
      properties: {
        Action: action.title,
        Description: action.description,
        Catégorie: action.category,
        Priorité: action.priority,
        Effort: action.effort,
        Impact: action.impact,
        Statut: action.status === "todo" ? "À faire" : action.status === "in_progress" ? "En cours" : "Terminé",
        Échéance: action.dueDate,
        "Gain Min (€)": action.estimatedGainMin,
        "Gain Max (€)": action.estimatedGainMax,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// iCalendar (.ics) export
// ---------------------------------------------------------------------------

export function generateICalendar(roadmap: Roadmap): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DiagOptim//Roadmap//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:DiagOptim - ${escapeIcal(roadmap.companyName)}`,
  ];

  for (const action of roadmap.actions) {
    if (!action.dueDate) continue;

    const uid = `${action.id}@diagoptim.com`;
    const dtStamp = formatIcalDate(new Date());
    const dtStart = formatIcalDate(new Date(action.dueDate));

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `SUMMARY:${escapeIcal(action.title)}`,
      `DESCRIPTION:${escapeIcal(action.description)}\\nPriorité: ${action.priority}\\nGains: ${action.estimatedGainMin}€-${action.estimatedGainMax}€`,
      `CATEGORIES:${escapeIcal(action.category)}`,
      action.priority === "critical" || action.priority === "high"
        ? "PRIORITY:1"
        : "PRIORITY:5",
      "BEGIN:VALARM",
      "TRIGGER:-P3D",
      "ACTION:DISPLAY",
      `DESCRIPTION:Action DiagOptim: ${escapeIcal(action.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/**
 * Exports a roadmap to CSV format.
 *
 * Columns: title, category, status, priority, due_date, estimated_gain_min,
 * estimated_gain_max, effort, impact, assignee
 */
export function exportToCSV(roadmap: Roadmap): string {
  const headers = [
    'title',
    'category',
    'status',
    'priority',
    'due_date',
    'estimated_gain_min',
    'estimated_gain_max',
    'effort',
    'impact',
    'assignee',
  ];

  const rows = roadmap.actions.map((action) => [
    escapeCSVField(action.title),
    escapeCSVField(action.category),
    action.status,
    action.priority,
    action.dueDate ?? '',
    String(action.estimatedGainMin),
    String(action.estimatedGainMax),
    action.effort,
    action.impact,
    escapeCSVField(action.assignee ?? ''),
  ]);

  const lines = [headers.join(','), ...rows.map((row) => row.join(','))];
  return lines.join('\n');
}

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeIcal(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcalDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
