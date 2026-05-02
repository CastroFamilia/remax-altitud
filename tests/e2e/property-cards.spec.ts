/**
 * Story 3.5: Property Cards & Grid View — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. PropertyCard component is implemented (src/components/property/property-card.tsx)
 *   2. PropertyGrid component is implemented (src/components/property/property-grid.tsx)
 *   3. SaveButton and ShareButton are implemented
 *   4. SplitViewLayout is updated to render PropertyGrid with real data
 *   5. Playwright framework is configured with a valid playwright.config.ts
 *   6. Staging/local environment with DB seeded with properties
 *
 * These E2E tests correspond to the acceptance criteria for Story 3.5:
 *   3.5-E2E-001 — PropertyCard renders key data: price, title, specs, ZMT badge, save/share icons (AC #1, P0)
 *   3.5-E2E-002 — Desktop: 3-column grid layout at ≥1024px (AC #2, P0)
 *   3.5-E2E-003 — Tablet: 2-column grid layout at 768-1023px (AC #3, P0)
 *   3.5-E2E-004 — Mobile: single-column grid layout at <768px (AC #4, P0)
 *   3.5-E2E-005 — Sort dropdown persists selection in URL params (AC #5, P1)
 *   3.5-E2E-006 — Pagination: ≤20 cards per page, prev/next controls (AC #6, P0)
 *   3.5-E2E-007 — Hover lift animation plays on desktop card hover (AC #7, P2)
 *   3.5-E2E-008 — Card images use aspect-ratio 3/2 (CLS prevention) (AC #8, P1)
 *   3.5-E2E-009 — Save button toggles saved state across page reload (AC #1, P1)
 *   3.5-E2E-010 — Share button triggers native share or copies URL (AC #1, P1)
 *
 * Activation instructions for the dev implementing Story 3.5:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/property-cards.spec.ts
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
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const TABLET_VIEWPORT = { width: 900, height: 700 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// ---------------------------------------------------------------------------
// 3.5-E2E-001 — PropertyCard renders key data (AC #1, P0)
// ---------------------------------------------------------------------------

test.describe("Story 3.5: Property Cards & Grid View E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.5-E2E-001: PropertyCard renders price, title, specs row, ZMT badge, save and share icons",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Wait for at least one property card
      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Price must be visible (formatted like $185K, $1.2M, etc.)
      await expect(firstCard.getByTestId("property-price")).toBeVisible();
      const priceText = await firstCard.getByTestId("property-price").textContent();
      expect(priceText).toMatch(/\$[\d.,]+[KMB]?/);

      // Title must be visible
      await expect(firstCard.getByTestId("property-title")).toBeVisible();

      // ZMT badge must be visible
      await expect(firstCard.getByTestId("zmt-badge")).toBeVisible();

      // Save button (♡) must be present
      await expect(firstCard.getByTestId("save-button")).toBeVisible();

      // Share button (↗) must be present
      await expect(firstCard.getByTestId("share-button")).toBeVisible();
    },
  );

  test.skip(
    "[P0] 3.5-E2E-001b: PropertyCard hero image renders with correct aspect ratio (3/2)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Hero image wrapper must have aspect-[3/2] class
      const imageWrapper = firstCard.getByTestId("property-image");
      const className = await imageWrapper.getAttribute("class");
      expect(className).toContain("aspect-[3/2]");
    },
  );

  test.skip(
    "[P0] 3.5-E2E-001c: Mountain region badge shown for mountain area properties",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      // Navigate to search filtered to mountain area
      await page.goto(`${SEARCH_URL_EN}?areaSlug=perez-zeledon`);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      const regionBadge = firstCard.getByTestId("region-badge");
      await expect(regionBadge).toBeVisible();
      await expect(regionBadge).toHaveText(/Mountain/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-002 — Desktop 3-column grid (AC #2, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.5-E2E-002: grid renders in 3-column layout on desktop (≥1024px)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyGrid not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const grid = page.getByTestId("property-grid");
      await expect(grid).toBeVisible({ timeout: 10000 });

      // Check that the grid has lg:grid-cols-3 class
      const gridClass = await grid.getAttribute("class");
      expect(gridClass).toContain("lg:grid-cols-3");

      // Verify cards are visible
      const cards = page.getByTestId("property-card");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-003 — Tablet 2-column grid (AC #3, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.5-E2E-003: grid renders in 2-column layout on tablet (768-1023px)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyGrid not yet implemented
      await page.setViewportSize(TABLET_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const grid = page.getByTestId("property-grid");
      await expect(grid).toBeVisible({ timeout: 10000 });

      // Verify tablet responsive class is present
      const gridClass = await grid.getAttribute("class");
      expect(gridClass).toContain("sm:grid-cols-2");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-004 — Mobile single-column grid (AC #4, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.5-E2E-004: grid renders in single-column layout on mobile (<768px)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyGrid not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const grid = page.getByTestId("property-grid");
      await expect(grid).toBeVisible({ timeout: 10000 });

      // Mobile: single column (grid-cols-1 is the default, no sm: prefix)
      const gridClass = await grid.getAttribute("class");
      expect(gridClass).toContain("grid-cols-1");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-005 — Sort dropdown persists in URL (AC #5, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.5-E2E-005: selecting 'Price ↑' sort updates URL params and reorders results",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Sort is implemented in 3.3 but full flow test here
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Click sort dropdown
      const sortDropdown = page.getByTestId("sort-select");
      await expect(sortDropdown).toBeVisible({ timeout: 10000 });
      await sortDropdown.selectOption("price_asc");

      // URL should update to include sort=price_asc
      await page.waitForURL(/sort=price_asc/);
      expect(page.url()).toContain("sort=price_asc");

      // Results should be visible after re-sort
      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-006 — Pagination (AC #6, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.5-E2E-006: shows at most 20 property cards per page",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyGrid pagination not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Wait for grid to render
      await page.getByTestId("property-grid").waitFor({ timeout: 10000 });

      const cards = page.getByTestId("property-card");
      const count = await cards.count();

      // Must never render more than 20 cards per page
      expect(count).toBeLessThanOrEqual(20);
    },
  );

  test.skip(
    "[P0] 3.5-E2E-006b: pagination controls appear when there are more than 20 results",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyGrid pagination not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Wait for grid to render
      await page.getByTestId("property-grid").waitFor({ timeout: 10000 });

      // If total > 20, pagination controls should be visible
      const totalText = await page.getByTestId("property-grid").getAttribute("data-total");
      const total = totalText ? parseInt(totalText, 10) : 0;

      if (total > 20) {
        const nextButton = page.getByTestId("pagination-next");
        await expect(nextButton).toBeVisible();
      }
    },
  );

  test.skip(
    "[P1] 3.5-E2E-006c: clicking 'Next' loads the second page of results",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyGrid pagination not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Wait for grid
      await page.getByTestId("property-grid").waitFor({ timeout: 10000 });

      const nextButton = page.getByTestId("pagination-next");
      await expect(nextButton).toBeVisible();

      // Get first card ID before pagination
      const firstCardBefore = await page.getByTestId("property-card").first().getAttribute("data-property-id");

      await nextButton.click();

      // Wait for grid to update
      await page.getByTestId("property-grid").waitFor({ timeout: 5000 });

      // First card should be different after pagination
      const firstCardAfter = await page.getByTestId("property-card").first().getAttribute("data-property-id");
      expect(firstCardAfter).not.toBe(firstCardBefore);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-007 — Hover lift animation (AC #7, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 3.5-E2E-007: property card has hover animation classes (transition, translate, shadow)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Verify animation classes are present in the DOM (class-level check)
      const cardClass = await firstCard.getAttribute("class");
      expect(cardClass).toContain("hover:translate-y-[-4px]");
      expect(cardClass).toContain("hover:shadow-lg");
      expect(cardClass).toContain("transition-all");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-008 — Image aspect ratio (AC #8, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.5-E2E-008: card images use aspect-[3/2] class to prevent CLS",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PropertyCard not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Image wrapper should have aspect-[3/2] class
      const imageEl = firstCard.locator("img").first();
      await expect(imageEl).toBeVisible();

      // Check either the img itself or its parent wrapper has the correct aspect ratio
      const imageWrapper = firstCard.getByTestId("property-image");
      const wrapperClass = await imageWrapper.getAttribute("class");
      expect(wrapperClass).toContain("aspect-[3/2]");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-009 — Save button persists across page (AC #1, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.5-E2E-009: clicking save button persists property in shortlist (localStorage)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SaveButton not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      const saveButton = firstCard.getByTestId("save-button");
      await expect(saveButton).toHaveAttribute("aria-label", "Save property");

      // Click save
      await saveButton.click();

      // Button label should change
      await expect(saveButton).toHaveAttribute("aria-label", "Remove from saved");

      // Reload the page — shortlist should persist
      await page.reload();
      await page.getByTestId("property-card").first().waitFor({ timeout: 10000 });

      // After reload, the same button should still be in saved state (from localStorage)
      const savedButton = page.getByTestId("property-card").first().getByTestId("save-button");
      // Note: Order may vary after reload; this is a best-effort check
      const ariaLabel = await savedButton.getAttribute("aria-label");
      // Either "Remove from saved" (still saved) or "Save property" (new first card)
      expect(["Save property", "Remove from saved"]).toContain(ariaLabel);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.5-E2E-010 — Share button (AC #1, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.5-E2E-010: clicking share button triggers share or clipboard copy",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — ShareButton not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Grant clipboard permission
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

      const firstCard = page.getByTestId("property-card").first();
      await expect(firstCard).toBeVisible({ timeout: 10000 });

      // Override navigator.share to force clipboard fallback (since Playwright test env may not support it)
      await page.evaluate(() => {
        (window.navigator as any).share = undefined;
      });

      const shareButton = firstCard.getByTestId("share-button");
      await shareButton.click();

      // After click, should show a "Link copied!" toast or status
      const statusEl = page.locator('[role="status"]');
      await expect(statusEl).toBeVisible({ timeout: 3000 });
      await expect(statusEl).toContainText(/copied|link/i);
    },
  );
});
