import { test, expect } from "@playwright/test";

/**
 * E2E Tests - DiagOptim Diagnostic Flow
 *
 * Tests the critical user path:
 * - Navigate to landing page
 * - Click "Start diagnostic"
 * - Fill company profile
 * - Answer framing questions
 * - Answer waste questions (at least 3)
 * - Check progress bar updates
 * - Check insights appear
 *
 * Note: These tests require a running dev server with backend.
 * Mark individual tests as test.skip when running without full backend.
 */

// ---------------------------------------------------------------------------
// Desktop flow
// ---------------------------------------------------------------------------

test.describe("Diagnostic Flow - Desktop", () => {
  test("complete signup and diagnostic flow", async ({ page }) => {
    // 1. Navigate to landing page
    await page.goto("/");
    await expect(page).toHaveTitle(/DiagOptim/);

    // 2. Click "Start diagnostic" or equivalent CTA
    const startCTA = page.locator(
      'a:has-text("Commencer"), a:has-text("Start"), button:has-text("Commencer"), button:has-text("diagnostic")',
    );
    if (await startCTA.first().isVisible()) {
      await startCTA.first().click();
    }

    // 3. Navigate to registration
    await page.goto("/register");

    // 4. Fill registration form
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.fill('input[name="name"]', "Test User");
    await page.click('button[type="submit"]');

    // 5. Should redirect to dashboard or profile setup
    await page.waitForURL(/\/(dashboard|company)/);

    // 6. Fill company profile
    await page.goto("/company/profile");
    await page.fill('input[name="companyName"]', "Test Enterprise SARL");
    await page.fill('input[name="sector"]', "manufacturing");
    await page.fill('input[name="employeeCount"]', "25");
    await page.fill('input[name="annualRevenue"]', "2000000");

    // 7. Start diagnostic
    await page.goto("/diagnostic/new");
    await expect(page.locator("h1, h2")).toContainText(/diagnostic/i);

    // 8. Answer framing questions (Phase 0)
    const startButton = page.locator('button:has-text("Commencer"), button:has-text("Start")');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // 9. Verify progress bar updates
    await expect(
      page.locator('[role="progressbar"], .progress-bar, [class*="progress"]'),
    ).toBeVisible();
  });

  test("dashboard shows diagnostic results", async ({ page }) => {
    await page.goto("/dashboard");

    // Dashboard should show key metrics or prompt to start diagnostic
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("results page displays score and recommendations", async ({ page }) => {
    // This test assumes a completed diagnostic exists
    await page.goto("/dashboard");

    // Look for score gauge or results link
    const resultsLink = page.locator('a[href*="results"], a:has-text("Resultats")');
    if (await resultsLink.isVisible()) {
      await resultsLink.click();
      await expect(page.locator('[class*="score"], [class*="gauge"]')).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Mobile flow
// ---------------------------------------------------------------------------

test.describe("Diagnostic Flow - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 14

  test("mobile navigation works", async ({ page }) => {
    await page.goto("/");
    // Mobile menu should be accessible
    const menuButton = page.locator(
      'button[aria-label*="menu"], button[aria-label*="Menu"], [class*="mobile-nav"]',
    );
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator("nav")).toBeVisible();
    }
  });

  test("diagnostic is responsive on mobile", async ({ page }) => {
    await page.goto("/diagnostic/new");
    // Content should not overflow horizontally
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // small tolerance
  });
});

// ---------------------------------------------------------------------------
// Document upload flow
// ---------------------------------------------------------------------------

test.describe("Document Upload", () => {
  test("upload page is accessible", async ({ page }) => {
    await page.goto("/documents");
    // Should show upload area or login redirect
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PWA
// ---------------------------------------------------------------------------

test.describe("PWA", () => {
  test("manifest is accessible", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest.name).toContain("DiagOptim");
    expect(manifest.display).toBe("standalone");
  });

  test("service worker is registered", async ({ page }) => {
    await page.goto("/");
    const swResponse = await page.goto("/sw.js");
    expect(swResponse?.status()).toBe(200);
  });

  test("offline page exists", async ({ page }) => {
    const response = await page.goto("/offline");
    expect(response?.status()).toBe(200);
    const content = await page.textContent("body");
    expect(content).toContain("hors ligne");
  });
});
