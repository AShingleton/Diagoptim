import { describe, it, expect } from "vitest";

/**
 * Question Engine Tests
 *
 * Tests the decision tree structure, phase management,
 * plan gating, and conditional branching.
 */

import {
  QUESTION_TREE,
  TOTAL_QUESTION_COUNT,
  getPhasesForType,
  planMeetsRequirement,
} from "@/lib/diagnostic/decision-tree";

// Helper: flatten the Record into an array of all questions
function getAllQuestions() {
  return Object.values(QUESTION_TREE).flat();
}

// ---------------------------------------------------------------------------
// Decision Tree - Structure
// ---------------------------------------------------------------------------

describe("Decision Tree - Structure", () => {
  it("has questions defined in the tree", () => {
    const allQuestions = getAllQuestions();
    expect(allQuestions.length).toBeGreaterThan(0);
  });

  it("has a positive total question count", () => {
    expect(TOTAL_QUESTION_COUNT).toBeGreaterThan(0);
  });

  it("all questions have required fields", () => {
    const allQuestions = getAllQuestions();
    for (const q of allQuestions) {
      expect(q.id).toBeTruthy();
      expect(q.phase).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Phase management
// ---------------------------------------------------------------------------

describe("Decision Tree - Phase management", () => {
  it("returns phases for full diagnostic", () => {
    const phases = getPhasesForType("full");
    expect(phases.length).toBeGreaterThan(3);
    expect(phases).toContain("framing");
    expect(phases).toContain("profile");
    expect(phases).toContain("wastes");
  });

  it("returns fewer phases for quick diagnostic", () => {
    const fullPhases = getPhasesForType("full");
    const quickPhases = getPhasesForType("quick");
    expect(quickPhases.length).toBeLessThanOrEqual(fullPhases.length);
  });
});

// ---------------------------------------------------------------------------
// Plan gating
// ---------------------------------------------------------------------------

describe("Decision Tree - Plan gating", () => {
  it("free plan meets basic requirements", () => {
    expect(planMeetsRequirement("free", "free")).toBe(true);
  });

  it("free plan does not meet pro requirements", () => {
    expect(planMeetsRequirement("free", "pro")).toBe(false);
  });

  it("pro plan meets starter requirements", () => {
    expect(planMeetsRequirement("pro", "starter")).toBe(true);
  });

  it("expert plan meets all requirements", () => {
    expect(planMeetsRequirement("expert", "free")).toBe(true);
    expect(planMeetsRequirement("expert", "starter")).toBe(true);
    expect(planMeetsRequirement("expert", "pro")).toBe(true);
    expect(planMeetsRequirement("expert", "expert")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Conditional branching (services sector skips inventory)
// ---------------------------------------------------------------------------

describe("Decision Tree - Conditional branching", () => {
  it("has inventory-related questions", () => {
    const allQuestions = getAllQuestions();
    const inventoryQuestions = allQuestions.filter(
      (q) => q.id.includes("inventory") || q.id.includes("stock"),
    );
    expect(inventoryQuestions.length).toBeGreaterThan(0);
  });

  it("inventory questions have skip conditions for services sector", () => {
    const allQuestions = getAllQuestions();
    const inventoryQuestions = allQuestions.filter(
      (q) => q.id.includes("inventory") || q.id.includes("stock"),
    );
    const withConditions = inventoryQuestions.filter(
      (q) => q.skipIf !== undefined,
    );
    expect(withConditions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Question limits
// ---------------------------------------------------------------------------

describe("Decision Tree - Question limits", () => {
  it("no phase has more than 50 main questions", () => {
    for (const [phase, questions] of Object.entries(QUESTION_TREE)) {
      expect(
        questions.length,
        `Phase ${phase} has too many questions`,
      ).toBeLessThanOrEqual(50);
    }
  });
});
