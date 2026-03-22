import { describe, it, expect } from "vitest";
import {
  analyzeWastes,
  identifyTopWastes,
  estimateWasteImpact,
  type DiagnosticAnswerInput,
  type WasteScores,
} from "@/lib/diagnostic/waste-analyzer";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MANUFACTURING_ANSWERS: DiagnosticAnswerInput[] = [
  { questionKey: "q_transport_1", answer: "oui", score: 7, category: "transport" },
  { questionKey: "q_transport_2", answer: "parfois", score: 5, category: "transport" },
  { questionKey: "q_inventory_1", answer: "oui", score: 8, category: "inventory" },
  { questionKey: "q_inventory_2", answer: "oui", score: 6, category: "inventory" },
  { questionKey: "q_motion_1", answer: "non", score: 3, category: "motion" },
  { questionKey: "q_waiting_1", answer: "oui", score: 7, category: "waiting" },
  { questionKey: "q_overproduction_1", answer: "parfois", score: 5, category: "overproduction" },
  { questionKey: "q_overprocessing_1", answer: "oui", score: 6, category: "overprocessing" },
  { questionKey: "q_defects_1", answer: "oui", score: 8, category: "defects" },
  { questionKey: "q_skills_1", answer: "non", score: 3, category: "skills" },
];

const SERVICES_ANSWERS: DiagnosticAnswerInput[] = [
  { questionKey: "q_waiting_1", answer: "oui", score: 8, category: "waiting" },
  { questionKey: "q_overprocessing_1", answer: "oui", score: 7, category: "overprocessing" },
  { questionKey: "q_skills_1", answer: "oui", score: 6, category: "skills" },
  { questionKey: "q_transport_1", answer: "non", score: 2, category: "transport" },
  { questionKey: "q_motion_1", answer: "non", score: 2, category: "motion" },
  { questionKey: "q_defects_1", answer: "parfois", score: 4, category: "defects" },
  { questionKey: "q_overproduction_1", answer: "non", score: 3, category: "overproduction" },
  { questionKey: "q_inventory_1", answer: "non", score: 1, category: "inventory" },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Waste Analyzer - analyzeWastes", () => {
  it("returns scores for all 8 waste categories", () => {
    const result = analyzeWastes(MANUFACTURING_ANSWERS, "manufacturing", 1_000_000, 50);
    const categories = Object.keys(result.scores);
    expect(categories).toHaveLength(8);
    expect(categories).toContain("transport");
    expect(categories).toContain("inventory");
    expect(categories).toContain("motion");
    expect(categories).toContain("waiting");
    expect(categories).toContain("overproduction");
    expect(categories).toContain("overprocessing");
    expect(categories).toContain("defects");
    expect(categories).toContain("skills");
  });

  it("returns scores in 0-100 range", () => {
    const result = analyzeWastes(MANUFACTURING_ANSWERS, "manufacturing", 1_000_000, 50);
    for (const wasteScore of Object.values(result.scores)) {
      expect(wasteScore.score).toBeGreaterThanOrEqual(0);
      expect(wasteScore.score).toBeLessThanOrEqual(100);
    }
  });

  it("returns a global score", () => {
    const result = analyzeWastes(MANUFACTURING_ANSWERS, "manufacturing", 1_000_000, 50);
    expect(result.globalScore).toBeGreaterThanOrEqual(0);
    expect(result.globalScore).toBeLessThanOrEqual(100);
  });

  it("returns an analyzedAt timestamp", () => {
    const result = analyzeWastes(MANUFACTURING_ANSWERS, "manufacturing");
    expect(result.analyzedAt).toBeInstanceOf(Date);
  });

  it("handles empty answers without crashing", () => {
    const result = analyzeWastes([], "manufacturing", 500_000, 10);
    expect(result.globalScore).toBe(0);
    expect(Object.keys(result.scores)).toHaveLength(8);
  });
});

describe("Waste Analyzer - identifyTopWastes", () => {
  it("returns the requested number of top wastes", () => {
    const result = analyzeWastes(MANUFACTURING_ANSWERS, "manufacturing", 1_000_000, 50);
    const top3 = identifyTopWastes(result.scores, 3);
    expect(top3.length).toBeLessThanOrEqual(3);
    expect(top3.length).toBeGreaterThan(0);
  });

  it("returns wastes sorted by score descending", () => {
    const result = analyzeWastes(MANUFACTURING_ANSWERS, "manufacturing", 1_000_000, 50);
    const topAll = identifyTopWastes(result.scores, 8);
    for (let i = 1; i < topAll.length; i++) {
      expect(result.scores[topAll[i - 1]].score).toBeGreaterThanOrEqual(
        result.scores[topAll[i]].score,
      );
    }
  });

  it("returns correct count when fewer categories have data", () => {
    const sparseAnswers: DiagnosticAnswerInput[] = [
      { questionKey: "q_waiting_1", answer: "oui", score: 8, category: "waiting" },
      { questionKey: "q_defects_1", answer: "oui", score: 7, category: "defects" },
    ];
    const result = analyzeWastes(sparseAnswers, "manufacturing");
    const top5 = identifyTopWastes(result.scores, 5);
    // Only 2 categories have confidence > 0, so at most 2 are returned
    expect(top5.length).toBeLessThanOrEqual(2);
  });
});

describe("Waste Analyzer - different sectors produce different impacts", () => {
  it("manufacturing has higher inventory impact than services", () => {
    const mfgImpact = estimateWasteImpact("inventory", 70, 1_000_000, 50, "manufacturing");
    const svcImpact = estimateWasteImpact("inventory", 70, 1_000_000, 50, "services");
    // Manufacturing has a 1.5 multiplier for inventory
    expect(mfgImpact.annualLossEstimate).toBeGreaterThan(svcImpact.annualLossEstimate);
  });

  it("services has higher skills impact than manufacturing", () => {
    const mfgImpact = estimateWasteImpact("skills", 70, 1_000_000, 50, "manufacturing");
    const svcImpact = estimateWasteImpact("skills", 70, 1_000_000, 50, "services");
    // Services has a 1.5 multiplier for skills
    expect(svcImpact.annualLossEstimate).toBeGreaterThan(mfgImpact.annualLossEstimate);
  });

  it("impact estimates have min < max and both >= 0", () => {
    const impact = estimateWasteImpact("defects", 60, 2_000_000, 30, "manufacturing");
    expect(impact.annualLossLow).toBeLessThanOrEqual(impact.annualLossHigh);
    expect(impact.annualLossLow).toBeGreaterThanOrEqual(0);
    expect(impact.annualLossHigh).toBeGreaterThanOrEqual(0);
  });

  it("zero revenue produces zero impact", () => {
    const impact = estimateWasteImpact("waiting", 80, 0, 10, "services");
    expect(impact.annualLossEstimate).toBe(0);
    expect(impact.revenueImpactPercent).toBe(0);
  });
});
