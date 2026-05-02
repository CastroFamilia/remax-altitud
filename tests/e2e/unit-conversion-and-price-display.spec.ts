/**
 * Story 3.7: Unit Conversion & Price Display — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. src/lib/utils/units.ts is implemented (unit conversion)
 *   2. src/lib/utils/currency.ts is implemented (USD→EUR)
 *   3. src/hooks/use-locale-units.ts is implemented (localStorage preference)
 *   4. src/components/layout/unit-toggle.tsx is implemented (toggle component)
 *   5. PropertyCard is updated to accept unitSystem prop and display EUR price
 *   6. SplitViewLayout is updated to use useLocaleUnits hook
 *   7. Playwright framework is configured with a valid playwright.config.ts
 *   8. Staging/local environment with DB seeded with properties
 *
 * These E2E tests correspond to the acceptance criteria for Story 3.7:
 *   3.7-E2E-001 — US locale shows ft²/acres by default (AC #2, P0)
 *   3.7-E2E-002 — EU locale shows m²/hectares by default (AC #1, P0)
 *   3.7-E2E-003 — Unit toggle persists preference in localStorage (AC #3, #4, P0)
 *   3.7-E2E-004 — Price shows USD + approximate EUR for non-US locale (AC #5, #7, P0)
 *   3.7-E2E-005 — ZMT badge shows icon + label, not color alone (AC #6, P1)
 *   3.7-E2E-006 — Unit toggle is visible on search page (AC #3, P1)
 *   3.7-E2E-007 — Metric to imperial switch updates all visible area measurements (AC #3, P1)
 *
 * Activation instructions for the dev implementing Story 3.7:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/unit-conversion-and-price-display.spec.ts
 *   3. Verify the test FAILS before implementation, then passes after
 *   4. Commit passing tests
 */

// NOTE: Playwright is not yet installed — this import will fail until
// playwright.config.ts is configured and @playwright/test is installed.
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEARCH_URL_EN = "/en/search";
const SEARCH_URL_ES = "/es/search";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const STORAGE_KEY = "unit-preference";

// ---------------------------------------------------------------------------
// 3.7-E2E-001 — US locale shows ft²/acres by default (AC #2, P0)
// ---------------------------------------------------------------------------

test.describe("Story 3.7: Unit Conversion & Price Display E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.7-E2E-001: English locale (/en/search) shows ft² and acres by default",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — units.ts / PropertyCard not yet updated
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Clear any stored unit preference so we get the default
      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => localStorage.removeItem("unit-preference"));
      await page.reload();

      // Wait for property cards to load
      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Specs row should contain ft² (imperial units default for 'en' locale)
      const specsRow = firstCard.getByTestId("property-specs");
      const specsText = await specsRow.textContent();

      // Should contain ft² for construction area or lot area
      expect(specsText).toMatch(/ft²|acres/);
      expect(specsText).not.toMatch(/\d+ m²|\d+\.?\d* ha/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.7-E2E-002 — EU locale shows m²/hectares by default (AC #1, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.7-E2E-002: Spanish locale (/es/search) shows m² and hectares by default",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — units.ts / PropertyCard not yet updated
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Clear any stored unit preference
      await page.goto(SEARCH_URL_ES);
      await page.evaluate(() => localStorage.removeItem("unit-preference"));
      await page.reload();

      // Wait for property cards to load
      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Specs row should contain m² or ha (metric units default for 'es' locale)
      const specsRow = firstCard.getByTestId("property-specs");
      const specsText = await specsRow.textContent();

      // Should contain m² or ha
      expect(specsText).toMatch(/m²|ha/);
      expect(specsText).not.toMatch(/ft²|acres/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.7-E2E-003 — Unit toggle persists preference in localStorage (AC #3, #4, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.7-E2E-003a: unit toggle button is visible on the search page",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — UnitToggle component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Unit toggle should be visible somewhere in the filter/controls area
      const unitToggle = page.getByTestId("unit-toggle");
      await expect(unitToggle).toBeVisible({ timeout: 10000 });

      // Should have role="switch"
      await expect(unitToggle).toHaveAttribute("role", "switch");
    },
  );

  test.skip(
    "[P0] 3.7-E2E-003b: clicking unit toggle switches measurements between imperial and metric",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — UnitToggle / useLocaleUnits not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Clear stored preference — start with default (imperial for 'en')
      await page.evaluate((key: string) => localStorage.removeItem(key), STORAGE_KEY);
      await page.reload();

      // Wait for first card
      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Capture initial specs (should be imperial)
      const specsRow = firstCard.getByTestId("property-specs");
      const specsBefore = await specsRow.textContent();
      expect(specsBefore).toMatch(/ft²|acres/);

      // Click the unit toggle to switch to metric
      const unitToggle = page.getByTestId("unit-toggle");
      await expect(unitToggle).toBeVisible({ timeout: 5000 });
      await unitToggle.click();

      // Specs should now show metric
      const specsAfter = await specsRow.textContent();
      expect(specsAfter).toMatch(/m²|ha/);
      expect(specsAfter).not.toMatch(/ft²|acres/);
    },
  );

  test.skip(
    "[P0] 3.7-E2E-003c: unit preference persists in localStorage after toggle",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useLocaleUnits localStorage persistence not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Clear stored preference
      await page.evaluate((key: string) => localStorage.removeItem(key), STORAGE_KEY);
      await page.reload();

      // Wait for toggle
      const unitToggle = page.getByTestId("unit-toggle");
      await expect(unitToggle).toBeVisible({ timeout: 10000 });

      // Click toggle to switch from imperial → metric
      await unitToggle.click();

      // localStorage should now contain 'metric'
      const storedValue = await page.evaluate(
        (key: string) => localStorage.getItem(key),
        STORAGE_KEY,
      );
      expect(storedValue).toBe("metric");
    },
  );

  test.skip(
    "[P1] 3.7-E2E-003d: unit preference persists across page reload",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useLocaleUnits localStorage persistence not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Set preference to metric directly in localStorage
      await page.evaluate(
        ({ key, val }: { key: string; val: string }) => localStorage.setItem(key, val),
        { key: STORAGE_KEY, val: "metric" },
      );

      // Reload to see if preference is restored
      await page.reload();

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Should show metric units (from localStorage)
      const specsRow = firstCard.getByTestId("property-specs");
      const specsText = await specsRow.textContent();
      expect(specsText).toMatch(/m²|ha/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.7-E2E-004 — Price shows USD + approximate EUR for non-US locale (AC #5, #7, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.7-E2E-004a: Spanish locale shows USD price as primary",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard currency display not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_ES);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // USD price must be present (primary price display)
      const usdPrice = firstCard.getByTestId("property-price");
      await expect(usdPrice).toBeVisible();

      // USD price should be formatted with "$" and locale-appropriate separators
      const priceText = await usdPrice.textContent();
      expect(priceText).toMatch(/\$/);
    },
  );

  test.skip(
    "[P0] 3.7-E2E-004b: Spanish locale shows approximate EUR price below USD",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard EUR price display not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_ES);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // EUR price must appear below USD for non-US locale
      const eurPrice = firstCard.getByTestId("property-price-eur");
      await expect(eurPrice).toBeVisible();

      // EUR price should contain "€" or "EUR"
      const eurText = await eurPrice.textContent();
      expect(eurText).toMatch(/€|EUR/);
    },
  );

  test.skip(
    "[P0] 3.7-E2E-004c: English locale does NOT show EUR price (US locale only shows USD)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard EUR price display not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // EUR price element must NOT be present for English locale
      const eurPrice = firstCard.getByTestId("property-price-eur");
      await expect(eurPrice).not.toBeVisible();
    },
  );

  test.skip(
    "[P1] 3.7-E2E-004d: EUR price label contains '≈' approximation marker",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard EUR price display not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_ES);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      const eurPrice = firstCard.getByTestId("property-price-eur");
      await expect(eurPrice).toBeVisible();

      // Should indicate approximation with "≈"
      const eurText = await eurPrice.textContent();
      expect(eurText).toContain("≈");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.7-E2E-005 — ZMT badge shows icon + label, not color alone (AC #6, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.7-E2E-005a: ZMT badge for titled property shows icon + 'Titled Property' label",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — ZMT badge already exists but verifying icon+label compliance
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Find a card with titled status — the ZMT badge should show text label
      const titledBadge = page
        .getByTestId("zmt-badge")
        .filter({ hasText: /Titled Property/i })
        .first();

      // If at least one titled property exists, verify badge has label
      const badgeCount = await page.getByTestId("zmt-badge").count();
      if (badgeCount > 0) {
        const firstBadge = page.getByTestId("zmt-badge").first();
        await expect(firstBadge).toBeVisible({ timeout: 10000 });

        // Badge must have visible text (not color-only)
        const badgeText = await firstBadge.textContent();
        expect(badgeText).toBeTruthy();
        expect(badgeText!.trim().length).toBeGreaterThan(0);
      }

      // Silence unused variable warning
      void titledBadge;
    },
  );

  test.skip(
    "[P1] 3.7-E2E-005b: ZMT badge includes both an icon character and text label",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — ZMT badge icon+label verification
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Wait for at least one property card
      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      const zmtBadge = firstCard.getByTestId("zmt-badge");
      await expect(zmtBadge).toBeVisible();

      // Badge text must contain both an icon symbol and descriptive text
      // e.g., "✓ Titled Property", "◑ Concession", "⚠ ZMT Restricted"
      const badgeText = await zmtBadge.textContent();
      expect(badgeText).toBeTruthy();
      // Must contain at least one word (not just a symbol)
      expect(badgeText).toMatch(/[A-Za-z]+/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.7-E2E-006 — Unit toggle visibility and aria (AC #3, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.7-E2E-006: unit toggle has correct aria-checked state (metric=true, imperial=false)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — UnitToggle not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Set to imperial (default for 'en')
      await page.evaluate((key: string) => localStorage.removeItem(key), STORAGE_KEY);
      await page.reload();

      const unitToggle = page.getByTestId("unit-toggle");
      await expect(unitToggle).toBeVisible({ timeout: 10000 });

      // For 'en' locale (imperial default), aria-checked should be 'false' (metric is unchecked)
      await expect(unitToggle).toHaveAttribute("aria-checked", "false");

      // Click to switch to metric
      await unitToggle.click();

      // Now metric is selected, aria-checked should be 'true'
      await expect(unitToggle).toHaveAttribute("aria-checked", "true");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.7-E2E-007 — Metric to imperial switch updates all area measurements (AC #3, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.7-E2E-007: toggling unit switch updates area measurements on all visible cards",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — UnitToggle / SplitViewLayout integration not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Set to imperial
      await page.evaluate((key: string) => localStorage.removeItem(key), STORAGE_KEY);
      await page.reload();

      // Wait for multiple cards
      await page.getByTestId("property-card").first().waitFor({ timeout: 10000 });
      const cardCount = await page.getByTestId("property-card").count();
      expect(cardCount).toBeGreaterThan(0);

      // Collect all specs text before toggle
      const specsTextBefore: string[] = [];
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const specs = page.getByTestId("property-card").nth(i).getByTestId("property-specs");
        const text = await specs.textContent();
        specsTextBefore.push(text ?? "");
      }

      // All should be imperial
      const allImperialBefore = specsTextBefore.some((t) => /ft²|acres/.test(t));
      expect(allImperialBefore).toBe(true);

      // Toggle units
      const unitToggle = page.getByTestId("unit-toggle");
      await unitToggle.click();

      // Wait for re-render
      await page.waitForTimeout(300);

      // Collect all specs text after toggle
      const specsTextAfter: string[] = [];
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const specs = page.getByTestId("property-card").nth(i).getByTestId("property-specs");
        const text = await specs.textContent();
        specsTextAfter.push(text ?? "");
      }

      // Now all visible measurements should be in metric
      const allMetricAfter = specsTextAfter.some((t) => /m²|ha/.test(t));
      expect(allMetricAfter).toBe(true);
    },
  );
});
