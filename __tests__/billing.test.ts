import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/billing/plans";
import { calculateCommission } from "@/lib/billing/stripe-connect";

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

describe("Billing - Plan definitions", () => {
  it("defines all 4 standard plans", () => {
    expect(PLANS.free).toBeDefined();
    expect(PLANS.starter).toBeDefined();
    expect(PLANS.pro).toBeDefined();
    expect(PLANS.expert).toBeDefined();
  });

  it("defines consultant plans", () => {
    expect(PLANS.consultant_solo).toBeDefined();
    expect(PLANS.consultant_cabinet).toBeDefined();
  });

  it("all plan names are defined", () => {
    for (const [key, plan] of Object.entries(PLANS)) {
      expect(key).toBeTruthy();
      expect(plan).toBeDefined();
    }
  });

  it("free plan costs nothing (getPlanPrice returns 0)", () => {
    expect(PLANS.free.price.monthly).toBe(0);
    expect(PLANS.free.price.yearly).toBe(0);
  });

  it("annual price is less than 12x monthly price", () => {
    const paidPlans = ["starter", "pro", "expert"] as const;
    for (const plan of paidPlans) {
      const def = PLANS[plan];
      expect(
        def.price.yearly,
        `${plan} yearly should be less than 12x monthly`,
      ).toBeLessThan(def.price.monthly * 12);
    }
  });

  it("plans have increasing limits", () => {
    expect(PLANS.free.limits.diagnosticsPerMonth).toBeLessThan(
      PLANS.starter.limits.aiQueriesPerMonth,
    );
    expect(PLANS.starter.limits.aiQueriesPerMonth).toBeLessThan(
      PLANS.pro.limits.aiQueriesPerMonth,
    );
  });
});

// ---------------------------------------------------------------------------
// Feature access (canAccessFeature equivalent)
// ---------------------------------------------------------------------------

describe("Billing - Feature access", () => {
  it("free plan has basic_diagnostic feature", () => {
    expect(PLANS.free.features).toContain("basic_diagnostic");
  });

  it("free plan blocks premium features", () => {
    expect(PLANS.free.features).not.toContain("full_diagnostic");
    expect(PLANS.free.features).not.toContain("api_access");
    expect(PLANS.free.features).not.toContain("all_tools");
  });

  it("pro plan allows all standard features", () => {
    expect(PLANS.pro.features).toContain("full_diagnostic");
    expect(PLANS.pro.features).toContain("all_tools");
  });

  it("expert plan has comprehensive features", () => {
    expect(PLANS.expert.features).toContain("custom_diagnostic");
    expect(PLANS.expert.features).toContain("all_tools");
    expect(PLANS.expert.features).toContain("api_access");
  });
});

// ---------------------------------------------------------------------------
// Plan gating
// ---------------------------------------------------------------------------

describe("Billing - Plan gating", () => {
  it("free plan limits diagnostics to 1 per month", () => {
    expect(PLANS.free.limits.diagnosticsPerMonth).toBe(1);
  });

  it("free plan has no document analysis", () => {
    expect(PLANS.free.limits.documentsPerMonth).toBe(0);
  });

  it("starter plan allows document uploads", () => {
    expect(PLANS.starter.limits.documentsPerMonth).toBeGreaterThan(0);
  });

  it("pro plan has unlimited diagnostics", () => {
    expect(PLANS.pro.limits.diagnosticsPerMonth).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// Affiliate commission
// ---------------------------------------------------------------------------

describe("Billing - Affiliate commission", () => {
  it("calculates 20% commission", () => {
    const commission = calculateCommission(10000, 1); // 100 EUR payment, month 1
    expect(commission).toBe(2000); // 20 EUR in cents
  });

  it("returns 0 after 12 months", () => {
    const commission = calculateCommission(10000, 13);
    expect(commission).toBe(0);
  });

  it("returns commission at month 12", () => {
    const commission = calculateCommission(10000, 12);
    expect(commission).toBe(2000);
  });

  it("handles zero amount", () => {
    const commission = calculateCommission(0, 1);
    expect(commission).toBe(0);
  });
});
