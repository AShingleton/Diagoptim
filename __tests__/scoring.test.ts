import { describe, it, expect } from "vitest";
import {
  calculateWasteScore,
  calculateGlobalScore,
  getSectorWeights,
  estimateGains,
  calculatePriority,
  type SectorWeights,
} from "@/lib/ai/scoring";
import type { WasteScores, DiagnosticAnswer } from "@/types/diagnostic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAnswer(questionId: string, value: unknown): DiagnosticAnswer {
  return { questionId, value, timestamp: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const MANUFACTURING_SCORES: WasteScores = {
  overproduction: 7,
  waiting: 5,
  transport: 3,
  overprocessing: 6,
  inventory: 8,
  motion: 4,
  defects: 6,
  skills: 3,
};

const SERVICE_SCORES: WasteScores = {
  overproduction: 4,
  waiting: 7,
  transport: 2,
  overprocessing: 5,
  inventory: 0, // No inventory for services
  motion: 3,
  defects: 4,
  skills: 6,
};

// ---------------------------------------------------------------------------
// calculateWasteScore
// ---------------------------------------------------------------------------

describe("Scoring - calculateWasteScore", () => {
  it("returns 0 for no relevant answers", () => {
    const score = calculateWasteScore("overproduction", []);
    expect(score).toBe(0);
  });

  it("returns a score in the 0-10 range", () => {
    const answers = [
      makeAnswer("q_overproduction_1", "7"),
      makeAnswer("q_overproduction_2", "5"),
    ];
    const score = calculateWasteScore("overproduction", answers);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("ignores answers from other categories", () => {
    const answers = [
      makeAnswer("q_waiting_1", "8"),
      makeAnswer("q_defects_1", "9"),
    ];
    const score = calculateWasteScore("overproduction", answers);
    expect(score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateGlobalScore
// ---------------------------------------------------------------------------

describe("Scoring - calculateGlobalScore", () => {
  it("returns 100 for all zeros (no waste)", () => {
    const zeroScores: WasteScores = {
      overproduction: 0,
      waiting: 0,
      transport: 0,
      overprocessing: 0,
      inventory: 0,
      motion: 0,
      defects: 0,
      skills: 0,
    };
    const weights = getSectorWeights("manufacturing");
    expect(calculateGlobalScore(zeroScores, weights)).toBe(100);
  });

  it("returns 0 for all 10s (maximum waste)", () => {
    const maxScores: WasteScores = {
      overproduction: 10,
      waiting: 10,
      transport: 10,
      overprocessing: 10,
      inventory: 10,
      motion: 10,
      defects: 10,
      skills: 10,
    };
    const weights = getSectorWeights("manufacturing");
    const score = calculateGlobalScore(maxScores, weights);
    expect(score).toBe(0);
  });

  it("returns a score between 0-100 for typical data", () => {
    const weights = getSectorWeights("manufacturing");
    const score = calculateGlobalScore(MANUFACTURING_SCORES, weights);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns different scores for different sectors with same waste data", () => {
    const mfgWeights = getSectorWeights("manufacturing");
    const svcWeights = getSectorWeights("services");
    const mfgScore = calculateGlobalScore(MANUFACTURING_SCORES, mfgWeights);
    const svcScore = calculateGlobalScore(MANUFACTURING_SCORES, svcWeights);
    expect(mfgScore).not.toBe(svcScore);
  });
});

// ---------------------------------------------------------------------------
// getSectorWeights
// ---------------------------------------------------------------------------

describe("Scoring - getSectorWeights", () => {
  it("returns different weights for services vs manufacturing", () => {
    const mfgWeights = getSectorWeights("manufacturing");
    const svcWeights = getSectorWeights("services");
    // They should differ in at least inventory and skills
    expect(svcWeights.inventory).not.toBe(mfgWeights.inventory);
  });

  it("services sector reduces inventory weight", () => {
    const svcWeights = getSectorWeights("services");
    expect(svcWeights.inventory).toBeLessThan(0.10);
  });

  it("services sector increases skills weight", () => {
    const svcWeights = getSectorWeights("services");
    expect(svcWeights.skills).toBeGreaterThan(0.10);
  });

  it("returns default weights for unknown sector", () => {
    const weights = getSectorWeights("unknown_sector");
    expect(weights.overproduction).toBe(0.15);
    expect(weights.skills).toBe(0.10);
  });

  it("weights sum to approximately 1.0", () => {
    const sectors = ["manufacturing", "services", "construction", "retail", "food", "healthcare"];
    for (const sector of sectors) {
      const weights = getSectorWeights(sector);
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    }
  });
});

// ---------------------------------------------------------------------------
// estimateGains
// ---------------------------------------------------------------------------

describe("Scoring - estimateGains", () => {
  const companyProfile = {
    annualRevenue: 1_000_000,
    name: "Test Corp",
    sector: "manufacturing",
    employeeCount: 50,
    location: "Paris",
    productsDescription: "Pieces metalliques",
    clientCount: 30,
    competitors: [],
  };

  it("returns min <= max for all gain estimates", () => {
    const gains = estimateGains(MANUFACTURING_SCORES, companyProfile);
    for (const gain of gains) {
      expect(gain.minGain).toBeLessThanOrEqual(gain.maxGain);
    }
  });

  it("all gains are >= 0", () => {
    const gains = estimateGains(MANUFACTURING_SCORES, companyProfile);
    for (const gain of gains) {
      expect(gain.minGain).toBeGreaterThanOrEqual(0);
      expect(gain.maxGain).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns gains for all 8 categories", () => {
    const gains = estimateGains(MANUFACTURING_SCORES, companyProfile);
    expect(gains).toHaveLength(8);
  });

  it("returns empty array for zero revenue", () => {
    const gains = estimateGains(MANUFACTURING_SCORES, { ...companyProfile, annualRevenue: 0 });
    expect(gains).toHaveLength(0);
  });

  it("returns higher gains for higher waste scores", () => {
    const lowScores: WasteScores = {
      overproduction: 1, waiting: 1, transport: 1, overprocessing: 1,
      inventory: 1, motion: 1, defects: 1, skills: 1,
    };
    const highScores: WasteScores = {
      overproduction: 9, waiting: 9, transport: 9, overprocessing: 9,
      inventory: 9, motion: 9, defects: 9, skills: 9,
    };
    const lowGains = estimateGains(lowScores, companyProfile);
    const highGains = estimateGains(highScores, companyProfile);
    const lowTotal = lowGains.reduce((sum, g) => sum + g.maxGain, 0);
    const highTotal = highGains.reduce((sum, g) => sum + g.maxGain, 0);
    expect(highTotal).toBeGreaterThan(lowTotal);
  });

  it("results are sorted by maxGain descending", () => {
    const gains = estimateGains(MANUFACTURING_SCORES, companyProfile);
    for (let i = 1; i < gains.length; i++) {
      expect(gains[i - 1].maxGain).toBeGreaterThanOrEqual(gains[i].maxGain);
    }
  });
});

// ---------------------------------------------------------------------------
// calculatePriority
// ---------------------------------------------------------------------------

describe("Scoring - calculatePriority", () => {
  it("returns higher value for high impact + low effort", () => {
    const highImpactLowEffort = calculatePriority(9, 2);
    const lowImpactHighEffort = calculatePriority(2, 9);
    expect(highImpactLowEffort).toBeGreaterThan(lowImpactHighEffort);
  });

  it("returns a value between 0 and 100", () => {
    const priority = calculatePriority(5, 5);
    expect(priority).toBeGreaterThanOrEqual(0);
    expect(priority).toBeLessThanOrEqual(100);
  });

  it("handles zero effort without crashing", () => {
    const priority = calculatePriority(8, 0);
    expect(priority).toBeGreaterThan(0);
    expect(priority).toBeLessThanOrEqual(100);
  });

  it("returns 0 for zero impact", () => {
    const priority = calculatePriority(0, 5);
    expect(priority).toBe(0);
  });
});
