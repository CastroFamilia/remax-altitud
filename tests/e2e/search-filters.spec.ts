/**
 * Story 3.3: Search Filters & URL State — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. SearchFilterBar real controls are implemented
 *   2. useSearchFilters hook is implemented
 *   3. searchProperties Server Action is implemented
 *   4. Playwright framework is configured with a valid playwright.config.ts
 *   5. Staging/local environment with DB seeded with properties
 *
 * These E2E tests correspond to the P0/P1 acceptance criteria for Story 3.3:
 *   3.3-E2E-001 — Filter bar renders all 6 filter controls on desktop (AC #1, P0)
 *   3.3-E2E-002 — Selecting a land type hides bedrooms/bathrooms (AC #2, P0)
 *   3.3-E2E-003 — Selecting a filter updates URL params instantly (AC #3, #8, P0)
 *   3.3-E2E-004 — Price slider updates URL with 300ms debounce (AC #4, P0)
 *   3.3-E2E-005 — Active filter chips appear; × dismiss clears filter (AC #5, P0)
 *   3.3-E2E-006 — "Clear all" appears when 2+ active and clears all (AC #5, P1)
 *   3.3-E2E-007 — Filter options show result counts: "Casa (12)" (AC #6, P1)
 *   3.3-E2E-008 — Location hierarchy dropdown (flat areaSlug list) (AC #7, P2)
 *   3.3-E2E-009 — URL params are shareable/bookmarkable (AC #8, P0)
 *   3.3-E2E-010 — Filter change reflects within 500ms client-side (AC #10, P1)
 *
 * Activation instructions for the dev implementing Story 3.3:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/search-filters.spec.ts
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
const SEARCH_URL_WITH_FILTERS = "/en/search?type=Casa&bedrooms=3";

// ---------------------------------------------------------------------------
// 3.3-E2E-001 — Filter bar renders all filter controls on desktop (AC #1, P0)
// ---------------------------------------------------------------------------

test.describe("Story 3.3: Search Filters & URL State E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.3-E2E-001: filter bar renders Type, Price, Beds, Baths, Lot Size, Location controls on desktop",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SearchFilterBar not yet implemented
      await page.goto(SEARCH_URL_EN);

      // Filter bar must be present
      const filterBar = page.getByTestId("search-filter-bar");
      await expect(filterBar).toBeVisible();

      // All six filter controls must be present on desktop
      await expect(page.getByTestId("type-filter")).toBeVisible();
      await expect(page.getByTestId("price-range-slider")).toBeVisible();
      await expect(page.getByTestId("bedrooms-filter")).toBeVisible();
      await expect(page.getByTestId("bathrooms-filter")).toBeVisible();
      await expect(page.getByTestId("lot-size-filter")).toBeVisible();
      await expect(page.getByTestId("area-filter")).toBeVisible();

      // Animate-pulse loading stub must NOT be present (Story 3.1 stub removed)
      await expect(page.locator('[aria-label="Filter bar loading"]')).not.toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-002 — Land type hides bedrooms/bathrooms (AC #2, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.3-E2E-002: selecting 'Lote' (land type) hides bedrooms and bathrooms filter controls",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SearchFilterBar real controls not yet implemented
      await page.goto(SEARCH_URL_EN);

      // Open Type dropdown and select Lote
      const typeFilter = page.getByTestId("type-filter");
      await typeFilter.click();

      // Select Lote option from dropdown
      await page.getByRole("option", { name: /Lote/i }).click();

      // Verify URL updated
      await expect(page).toHaveURL(/type=Lote/);

      // Bedrooms and bathrooms controls must be hidden
      await expect(page.getByTestId("bedrooms-filter")).not.toBeVisible();
      await expect(page.getByTestId("bathrooms-filter")).not.toBeVisible();

      // Other filters still visible
      await expect(page.getByTestId("price-range-slider")).toBeVisible();
      await expect(page.getByTestId("area-filter")).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-003 — Selecting a filter updates URL params instantly (AC #3, #8, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.3-E2E-003: selecting 'Casa' in Type dropdown instantly updates URL with type=Casa",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters and SearchFilterBar not yet implemented
      await page.goto(SEARCH_URL_EN);

      const typeFilter = page.getByTestId("type-filter");
      await typeFilter.click();

      await page.getByRole("option", { name: /^Casa$/i }).click();

      // URL must update immediately (no Apply button — instant update per UX-DR21)
      await expect(page).toHaveURL(/type=Casa/);
    },
  );

  test.skip(
    "[P0] 3.3-E2E-003b: selecting bedrooms=3 instantly updates URL with bedrooms=3",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters and SearchFilterBar not yet implemented
      await page.goto(SEARCH_URL_EN);

      const bedroomsFilter = page.getByTestId("bedrooms-filter");
      await bedroomsFilter.click();
      await page.getByRole("option", { name: /^3\+?$/i }).click();

      await expect(page).toHaveURL(/bedrooms=3/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-004 — Price slider updates with 300ms debounce (AC #4, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.3-E2E-004: dragging price slider updates URL with 300ms debounce (not on every pixel)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — PriceRangeSlider and useSearchFilters not yet implemented
      await page.goto(SEARCH_URL_EN);

      const slider = page.getByTestId("price-range-slider");
      await expect(slider).toBeVisible();

      // Type a price into the min input field and verify debounced URL update
      const priceInputs = slider.locator("input[type='number']");
      const minInput = priceInputs.first();
      await minInput.fill("150000");
      await minInput.press("Tab"); // trigger blur/update

      // TODO(test-review-3.3): Replace waitForTimeout with smart assertion when activating.
      // Use: await expect(page).toHaveURL(/price_min=150000/, { timeout: 1000 });
      // Playwright polls internally — no fixed sleep needed. (test-review advisory)
      await page.waitForTimeout(400);

      // URL should have price_min=150000
      await expect(page).toHaveURL(/price_min=150000/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-005 — Active filter chips with × dismiss (AC #5, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.3-E2E-005: active filter chips appear above results; × button dismisses chip and clears filter",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — FilterChips and useSearchFilters not yet implemented
      await page.goto(SEARCH_URL_WITH_FILTERS);

      // Chips container must be visible (we have type=Casa active)
      const chipsContainer = page.getByTestId("filter-chips");
      await expect(chipsContainer).toBeVisible();

      // Type chip must be present
      const chips = chipsContainer.locator('[data-testid="filter-chip"]');
      await expect(chips).toHaveCount(2); // type + bedrooms

      // Click × on the type chip (first chip)
      const firstDismiss = chips.first().locator('[data-testid="chip-dismiss"]');
      await firstDismiss.click();

      // URL must no longer have type= param
      await expect(page).not.toHaveURL(/type=/);

      // Only 1 chip remains
      await expect(chips).toHaveCount(1);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-006 — "Clear all" with 2+ active filters (AC #5, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.3-E2E-006: 'Clear all' button appears when 2+ filters active; clicking it clears all filter params",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — FilterChips and useSearchFilters not yet implemented
      await page.goto(SEARCH_URL_WITH_FILTERS); // type=Casa&bedrooms=3

      const clearAll = page.getByTestId("clear-all-filters");
      await expect(clearAll).toBeVisible();

      await clearAll.click();

      // All filter params removed from URL
      await expect(page).not.toHaveURL(/type=/);
      await expect(page).not.toHaveURL(/bedrooms=/);

      // 'view' param should be preserved if it was in the URL
      // Filter chips must be gone
      const chipsContainer = page.getByTestId("filter-chips");
      const isGone =
        (await chipsContainer.count()) === 0 ||
        !(await chipsContainer.isVisible());
      expect(isGone).toBe(true);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-007 — Filter option counts: "Casa (12)" (AC #6, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.3-E2E-007: Type dropdown shows result counts for each property type: 'Casa (N)'",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — searchProperties Server Action + FilterFacets not implemented
      await page.goto(SEARCH_URL_EN);

      const typeFilter = page.getByTestId("type-filter");
      await typeFilter.click();

      // Each option must show a count: "Casa (12)", "Lote (8)", etc.
      const options = page.locator('[role="option"]');
      const firstOptionText = await options.first().textContent();

      // Text must match pattern: "Type name (count)"
      expect(firstOptionText).toMatch(/\w+\s*\(\d+\)/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-008 — Location dropdown (flat areaSlug list) (AC #7, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 3.3-E2E-008: Location dropdown shows available area slugs from DB as selectable options",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — getAvailableAreas() and area-filter not yet implemented
      await page.goto(SEARCH_URL_EN);

      const areaFilter = page.getByTestId("area-filter");
      await expect(areaFilter).toBeVisible();
      await areaFilter.click();

      // At least one area option must be available
      const options = page.locator('[role="option"]');
      await expect(options).not.toHaveCount(0);

      // Select first available area
      await options.first().click();

      // URL must have area= param
      await expect(page).toHaveURL(/area=/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-009 — URL params are shareable/bookmarkable (AC #8, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.3-E2E-009: navigating directly to URL with filter params restores filter state",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters URL parsing not yet implemented
      // Navigate directly to a URL with pre-set filters (simulates bookmarked URL)
      await page.goto("/en/search?type=Casa&price_min=100000&price_max=500000&bedrooms=3");

      // Filter bar must reflect the URL state
      const filterBar = page.getByTestId("search-filter-bar");
      await expect(filterBar).toBeVisible();

      // Active filter chips must reflect all 3 active filters (type + priceMin+priceMax + bedrooms)
      // Note: priceMin+priceMax count as separate or combined — implementation decides
      const chipsContainer = page.getByTestId("filter-chips");
      await expect(chipsContainer).toBeVisible();

      // "Clear all" must be present (3+ filters active)
      const clearAll = page.getByTestId("clear-all-filters");
      await expect(clearAll).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.3-E2E-010 — Filter change reflects within 500ms client-side (AC #10, NFR5)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.3-E2E-010: filter change triggers result update within 500ms (NFR5)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — searchProperties Server Action not yet implemented
      await page.goto(SEARCH_URL_EN);

      // TODO(test-review-3.3): Remove Date.now()/elapsed check when activating.
      // The waitForSelector timeout: 500 already enforces the NFR — if the element
      // is not visible within 500ms Playwright throws, which IS the assertion.
      // The Date.now() wrapper is redundant and environment-sensitive. (test-review advisory)
      const start = Date.now();

      // Select a type filter
      const typeFilter = page.getByTestId("type-filter");
      await typeFilter.click();
      await page.getByRole("option", { name: /^Casa$/i }).click();

      // Wait for result grid to update (SearchResultsSkeleton or result count change)
      // timeout: 500 enforces NFR5 — Playwright throws if not visible within 500ms
      await page.waitForSelector('[data-testid="search-results-skeleton"], [data-testid="property-count"]', {
        state: "visible",
        timeout: 500,
      });

      const elapsed = Date.now() - start;
      // Filter change must produce visible UI response within 500ms (NFR5)
      expect(elapsed).toBeLessThanOrEqual(500);
    },
  );

  // ---------------------------------------------------------------------------
  // Mobile: filter Sheet opens on button click (AC #1, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.3-E2E-011: tapping 'Filters' button on mobile opens Sheet with all filter controls",
    async ({ page, context }: any) => {
      // THIS TEST WILL FAIL — mobile filter Sheet not yet implemented
      // Emulate mobile viewport
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro

      await page.goto(SEARCH_URL_EN);

      // Mobile Filters button must be visible
      const mobileButton = page.getByTestId("mobile-filters-button");
      await expect(mobileButton).toBeVisible();

      // Tap the button
      await mobileButton.click();

      // Sheet must open with filter controls
      const sheet = page.locator('[role="dialog"]');
      await expect(sheet).toBeVisible();

      // Type filter must be inside the sheet
      await expect(sheet.getByTestId("type-filter")).toBeVisible();
    },
  );
});
