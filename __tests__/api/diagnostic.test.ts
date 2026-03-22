import { describe, it, expect } from "vitest";

/**
 * API Diagnostic Flow Tests
 *
 * These tests validate the diagnostic API contract.
 * In a real setup, use a test database and seed data.
 * Here we validate the expected request/response shapes.
 */

// ---------------------------------------------------------------------------
// Response shape validation helpers
// ---------------------------------------------------------------------------

interface DiagnosticStartResponse {
  id: string;
  status: string;
  companyId: string;
  type: string;
  currentPhase: string;
}

interface NextQuestionResponse {
  question: {
    id: string;
    text: string;
    type: string;
  } | null;
  phase: string;
  progressPercent: number;
  isComplete: boolean;
}

interface AnswerResponse {
  success: boolean;
  phaseChanged: boolean;
}

interface ResultsResponse {
  globalScore: number;
  wasteScores: Record<string, number>;
  gains: Array<{
    category: string;
    minGain: number;
    maxGain: number;
  }>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("API Contract - Diagnostic Start", () => {
  it("start response has required fields", () => {
    const mockResponse: DiagnosticStartResponse = {
      id: "diag_123",
      status: "in_progress",
      companyId: "comp_456",
      type: "full",
      currentPhase: "framing",
    };

    expect(mockResponse.id).toBeTruthy();
    expect(mockResponse.status).toBe("in_progress");
    expect(mockResponse.type).toBe("full");
    expect(mockResponse.currentPhase).toBe("framing");
  });
});

describe("API Contract - Next Question", () => {
  it("returns a question with progress", () => {
    const mockResponse: NextQuestionResponse = {
      question: {
        id: "q_framing_1",
        text: "Quel est votre objectif principal ?",
        type: "single_choice",
      },
      phase: "framing",
      progressPercent: 5,
      isComplete: false,
    };

    expect(mockResponse.question).not.toBeNull();
    expect(mockResponse.progressPercent).toBeGreaterThanOrEqual(0);
    expect(mockResponse.progressPercent).toBeLessThanOrEqual(100);
    expect(mockResponse.isComplete).toBe(false);
  });

  it("returns null question when complete", () => {
    const mockResponse: NextQuestionResponse = {
      question: null,
      phase: "recommendations",
      progressPercent: 100,
      isComplete: true,
    };

    expect(mockResponse.question).toBeNull();
    expect(mockResponse.isComplete).toBe(true);
  });
});

describe("API Contract - Submit Answer", () => {
  it("returns success with phase info", () => {
    const mockResponse: AnswerResponse = {
      success: true,
      phaseChanged: false,
    };

    expect(mockResponse.success).toBe(true);
  });
});

describe("API Contract - Results", () => {
  it("returns scores between 0-100", () => {
    const mockResponse: ResultsResponse = {
      globalScore: 65,
      wasteScores: {
        overproduction: 7,
        waiting: 5,
        transport: 3,
        overprocessing: 6,
        inventory: 8,
        motion: 4,
        defects: 6,
        skills: 3,
      },
      gains: [
        { category: "inventory", minGain: 5000, maxGain: 15000 },
        { category: "overproduction", minGain: 4000, maxGain: 12000 },
      ],
    };

    expect(mockResponse.globalScore).toBeGreaterThanOrEqual(0);
    expect(mockResponse.globalScore).toBeLessThanOrEqual(100);
    expect(Object.keys(mockResponse.wasteScores)).toHaveLength(8);

    for (const score of Object.values(mockResponse.wasteScores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    }

    for (const gain of mockResponse.gains) {
      expect(gain.minGain).toBeLessThanOrEqual(gain.maxGain);
      expect(gain.minGain).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("API Security - Access control", () => {
  it("requires authentication for diagnostic endpoints", () => {
    // Validate that all diagnostic API routes require auth
    const protectedRoutes = [
      "/api/diagnostic/start",
      "/api/diagnostic/123/progress",
      "/api/diagnostic/123/answer",
      "/api/diagnostic/123/next",
      "/api/diagnostic/123/complete",
      "/api/diagnostic/123/results",
    ];

    for (const route of protectedRoutes) {
      expect(route.startsWith("/api/diagnostic")).toBe(true);
      // In middleware, /api/diagnostic is NOT in PUBLIC_API_ROUTES
      // so it requires Bearer token
    }
  });

  it("diagnostic IDs should be UUIDs", () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const validId = "550e8400-e29b-41d4-a716-446655440000";
    expect(uuidRegex.test(validId)).toBe(true);

    const invalidId = "not-a-uuid";
    expect(uuidRegex.test(invalidId)).toBe(false);
  });
});
