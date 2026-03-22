export interface LeanTool {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  href: string;
  category: "analysis" | "strategy" | "improvement";
  tierRequired: string;
}

export interface VSMStep {
  id: string;
  name: string;
  type: "process" | "inventory" | "transport" | "delay" | "inspection";
  cycleTime?: number;
  waitTime?: number;
  valueAdded: boolean;
  position: { x: number; y: number };
}

export interface IshikawaCause {
  id: string;
  category: "man" | "machine" | "method" | "material" | "milieu" | "measurement";
  text: string;
  subCauses?: string[];
}
