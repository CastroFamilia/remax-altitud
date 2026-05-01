/**
 * Story 3.4: Lifestyle Tags & Smart Presets — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. LifestyleTagChips component is implemented in SearchFilterBar
 *   2. SmartPresetBar component is implemented
 *   3. useSearchFilters is extended with toggleTag + tags URL param
 *   4. searchProperties Server Action is extended with tags && operator
 *   5. FilterChips extended to show active tag chips
 *   6. Playwright framework is configured with a valid playwright.config.ts
 *   7. Staging/local environment with DB seeded with properties having lifestyle tags
 *
 * These E2E tests correspond to the P0/P1 acceptance criteria for Story 3.4:
 *   3.4-E2E-001 — Lifestyle tag chips appear in filter bar with all 5 tags (AC #1, P0)
 *   3.4-E2E-002 — Tapping a tag chip toggles active state and filters results (AC #2, P0)
 *   3.4-E2E-003 — Multiple tags can be selected (OR logic) (AC #3, P0)
 *   3.4-E2E-004 — Smart preset bar renders with configurable presets (AC #4, P1)
 *   3.4-E2E-005 — Clicking mountain-retirement preset navigates with correct URL params (AC #5, P0)
 *   3.4-E2E-006 — Active lifestyle tags appear as chips in FilterChips row (AC #6, P1)
 *   3.4-E2E-007 — Tags URL param is shareable/bookmarkable (AC #8, P0)
 *   3.4-E2E-008 — 'Retire' tag displays as 'Retirement Paradise' (AC #1, P0)
 *   3.4-E2E-009 — Mobile: lifestyle tag chips render in filter sheet (AC #2, P1)
 *
 * Activation instructions for the dev implementing Story 3.4:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/lifestyle-tags-and-smart-presets.spec.ts
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
const SEARCH_URL_WITH_TAG = "/en/search?tags=Investment+Property";
const SEARCH_URL_WITH_MULTI_TAGS = "/en/search?tags=Investment+Property,Rental+Potential";
const SEARCH_URL_WITH_MIXED_FILTERS = "/en/search?type=Casa&tags=Retire";

// ---------------------------------------------------------------------------
// 3.4-E2E-001 — Lifestyle tag chips appear in filter bar (AC #1, P0)
// ---------------------------------------------------------------------------

test.describe("Story 3.4: Lifestyle Tags & Smart Presets E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.4-E2E-001: lifestyle tag chip row renders in filter bar with all 5 tag options",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — LifestyleTagChips not yet integrated into SearchFilterBar
      await page.goto(SEARCH_URL_EN);

      // Lifestyle tag chips container must be present
      const chipsContainer = page.getByTestId("lifestyle-tag-chips");
      await expect(chipsContainer).toBeVisible();

      // All 5 tag chips must be present
      await expect(page.getByTestId("lifestyle-tag-chip-investment-property")).toBeVisible();
      await expect(page.getByTestId("lifestyle-tag-chip-rental-potential")).toBeVisible();
      await expect(page.getByTestId("lifestyle-tag-chip-vacation-home")).toBeVisible();
      await expect(page.getByTestId("lifestyle-tag-chip-retire")).toBeVisible();
      await expect(page.getByTestId("lifestyle-tag-chip-commercial")).toBeVisible();
    },
  );

  test.skip(
    "[P0] 3.4-E2E-001b: 'Retire' tag chip displays label 'Retirement Paradise' (not 'Retire')",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — LifestyleTagChips not yet implemented
      await page.goto(SEARCH_URL_EN);

      const retireChip = page.getByTestId("lifestyle-tag-chip-retire");
      await expect(retireChip).toBeVisible();

      // Must display "Retirement Paradise", not the stored value "Retire"
      await expect(retireChip).toContainText("Retirement Paradise");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-002 — Tapping a chip toggles active state and updates URL (AC #2, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.4-E2E-002: clicking a tag chip adds it to URL as tags param and applies active style",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — LifestyleTagChips + useSearchFilters tags support not yet implemented
      await page.goto(SEARCH_URL_EN);

      const investmentChip = page.getByTestId("lifestyle-tag-chip-investment-property");
      await expect(investmentChip).toBeVisible();

      // Chip must NOT be active initially
      const initialClass = await investmentChip.getAttribute("class");
      expect(initialClass).not.toContain("bg-brand-blue");

      // Click the chip
      await investmentChip.click();

      // URL must update immediately with tags=Investment+Property
      await expect(page).toHaveURL(/tags=Investment/);

      // Chip must now show active state
      const activeClass = await investmentChip.getAttribute("class");
      expect(activeClass).toContain("bg-brand-blue");
    },
  );

  test.skip(
    "[P0] 3.4-E2E-002b: clicking an active tag chip removes it from URL (toggle off)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — LifestyleTagChips + useSearchFilters not yet implemented
      // Navigate with tag already active
      await page.goto(SEARCH_URL_WITH_TAG);

      const investmentChip = page.getByTestId("lifestyle-tag-chip-investment-property");
      await expect(investmentChip).toBeVisible();

      // Chip should be active (URL has this tag)
      const activeClass = await investmentChip.getAttribute("class");
      expect(activeClass).toContain("bg-brand-blue");

      // Click to deactivate
      await investmentChip.click();

      // URL must no longer contain the tag
      await expect(page).not.toHaveURL(/tags=/);

      // Chip must no longer be active
      const inactiveClass = await investmentChip.getAttribute("class");
      expect(inactiveClass).not.toContain("bg-brand-blue");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-003 — Multiple tag selection (OR logic) (AC #3, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.4-E2E-003: selecting multiple tags adds all to URL as comma-separated tags param",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters toggleTag not yet implemented
      await page.goto(SEARCH_URL_EN);

      // Select first tag
      await page.getByTestId("lifestyle-tag-chip-investment-property").click();
      await expect(page).toHaveURL(/tags=Investment/);

      // Select second tag
      await page.getByTestId("lifestyle-tag-chip-rental-potential").click();

      // URL must contain both tags (comma-separated)
      await expect(page).toHaveURL(/tags=/);
      const url = page.url();
      expect(url).toContain("Investment");
      expect(url).toContain("Rental");

      // Both chips must be active
      const chip1Class = await page.getByTestId("lifestyle-tag-chip-investment-property").getAttribute("class");
      const chip2Class = await page.getByTestId("lifestyle-tag-chip-rental-potential").getAttribute("class");
      expect(chip1Class).toContain("bg-brand-blue");
      expect(chip2Class).toContain("bg-brand-blue");
    },
  );

  test.skip(
    "[P0] 3.4-E2E-003b: navigating to URL with multiple tags restores all chips as active",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters tags parsing not yet implemented
      await page.goto(SEARCH_URL_WITH_MULTI_TAGS);

      // Both chips from URL must be active
      const chip1Class = await page.getByTestId("lifestyle-tag-chip-investment-property").getAttribute("class");
      const chip2Class = await page.getByTestId("lifestyle-tag-chip-rental-potential").getAttribute("class");
      expect(chip1Class).toContain("bg-brand-blue");
      expect(chip2Class).toContain("bg-brand-blue");

      // Third chip must be inactive
      const chip3Class = await page.getByTestId("lifestyle-tag-chip-vacation-home").getAttribute("class");
      expect(chip3Class).not.toContain("bg-brand-blue");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-004 — Smart preset bar renders (AC #4, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.4-E2E-004: smart preset bar renders with all configured preset buttons",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SmartPresetBar not yet implemented
      await page.goto(SEARCH_URL_EN);

      const presetBar = page.getByTestId("smart-preset-bar");
      await expect(presetBar).toBeVisible();

      // All 4 default presets must render
      await expect(page.getByTestId("preset-mountain-retirement")).toBeVisible();
      await expect(page.getByTestId("preset-beach-investment")).toBeVisible();
      await expect(page.getByTestId("preset-rental-potential")).toBeVisible();
      await expect(page.getByTestId("preset-vacation-home")).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-005 — Clicking preset navigates with correct URL params (AC #5, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.4-E2E-005: clicking 'mountain-retirement' preset navigates to /en/search with area, type, and tags params",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SmartPresetBar not yet implemented
      await page.goto(SEARCH_URL_EN);

      const mountainBtn = page.getByTestId("preset-mountain-retirement");
      await expect(mountainBtn).toBeVisible();
      await mountainBtn.click();

      // Must navigate to search with preset filters applied
      await expect(page).toHaveURL(/\/en\/search/);
      await expect(page).toHaveURL(/area=perez-zeledon/);
      await expect(page).toHaveURL(/type=Casa/);
      await expect(page).toHaveURL(/tags=Retire/);
    },
  );

  test.skip(
    "[P0] 3.4-E2E-005b: clicking 'beach-investment' preset navigates with area=uvita and tags=Investment",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SmartPresetBar not yet implemented
      await page.goto(SEARCH_URL_EN);

      await page.getByTestId("preset-beach-investment").click();

      await expect(page).toHaveURL(/\/en\/search/);
      await expect(page).toHaveURL(/area=uvita/);
      await expect(page).toHaveURL(/tags=Investment/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-006 — Active lifestyle tags appear as chips in FilterChips row (AC #6, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.4-E2E-006: active tag appears as a chip in the FilterChips row (AC #6)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — FilterChips tags extension not yet implemented
      await page.goto(SEARCH_URL_WITH_TAG);

      // FilterChips container must be visible (tags are active)
      const chipsContainer = page.getByTestId("filter-chips");
      await expect(chipsContainer).toBeVisible();

      // The active tag must appear as a chip in FilterChips
      const chips = chipsContainer.locator('[data-testid="filter-chip"]');
      const chipTexts = await chips.allTextContents();
      const hasTagChip = chipTexts.some((t: string) => t.includes("Investment Property"));
      expect(hasTagChip).toBe(true);
    },
  );

  test.skip(
    "[P1] 3.4-E2E-006b: 'Retire' tag chip in FilterChips shows 'Retirement Paradise' display label",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — FilterChips tags extension + TAG_DISPLAY_LABELS not yet implemented
      await page.goto(SEARCH_URL_WITH_MIXED_FILTERS);

      const chipsContainer = page.getByTestId("filter-chips");
      await expect(chipsContainer).toBeVisible();

      // The chip for "Retire" must display "Retirement Paradise"
      await expect(chipsContainer).toContainText("Retirement Paradise");
    },
  );

  test.skip(
    "[P1] 3.4-E2E-006c: activeFilterCount includes tags count (2 selected tags = 2 in count)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — activeFilterCount in useSearchFilters not extended yet
      await page.goto(SEARCH_URL_WITH_MULTI_TAGS);

      // With 2 tags selected, "Clear all" must appear (activeFilterCount >= 2)
      const clearAll = page.getByTestId("clear-all-filters");
      await expect(clearAll).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-007 — Tags URL param is shareable/bookmarkable (AC #8 analogue, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.4-E2E-007: navigating directly to URL with tags param restores tag chip active states",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters tags parsing not yet implemented
      await page.goto(SEARCH_URL_WITH_MULTI_TAGS);

      // Both chips must be active from URL
      await expect(page.getByTestId("lifestyle-tag-chip-investment-property")).toBeVisible();
      const chip1Class = await page.getByTestId("lifestyle-tag-chip-investment-property").getAttribute("class");
      expect(chip1Class).toContain("bg-brand-blue");

      const chip2Class = await page.getByTestId("lifestyle-tag-chip-rental-potential").getAttribute("class");
      expect(chip2Class).toContain("bg-brand-blue");
    },
  );

  test.skip(
    "[P0] 3.4-E2E-007b: tags URL param uses comma-separated encoding (no spaces, correct encoding)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — useSearchFilters serialization for tags not yet implemented
      await page.goto(SEARCH_URL_EN);

      // Select a tag
      await page.getByTestId("lifestyle-tag-chip-rental-potential").click();

      // URL must have tags= with comma-separated format (URLSearchParams encoding)
      const url = page.url();
      expect(url).toMatch(/tags=/);
      // Investment+Property or Investment%20Property (URL encoding of space)
      expect(url).toMatch(/Rental/);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-008 — Server action filters by lifestyle tags (AC #3, DB level, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.4-E2E-008: filtering by 'Investment Property' tag returns only properties with that tag",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — searchProperties Server Action tags filter not yet implemented
      // NOTE: requires DB seeded with properties having lifestyle tags
      await page.goto(SEARCH_URL_EN);

      // Select Investment Property tag
      await page.getByTestId("lifestyle-tag-chip-investment-property").click();

      // Wait for results to update
      await page.waitForSelector('[data-testid="property-count"], [data-testid="search-results-skeleton"]', {
        state: "visible",
        timeout: 2000,
      });

      // Results should be filtered (property count changes)
      // This is a smoke test — exact count depends on DB seed
      const filterBar = page.getByTestId("search-filter-bar");
      await expect(filterBar).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.4-E2E-009 — Mobile: lifestyle tag chips render in filter sheet (AC #2, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.4-E2E-009: on mobile, lifestyle tag chips render inside the filter Sheet",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — mobile Sheet integration not yet implemented
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 Pro

      await page.goto(SEARCH_URL_EN);

      // Tap the mobile Filters button
      const mobileButton = page.getByTestId("mobile-filters-button");
      await expect(mobileButton).toBeVisible();
      await mobileButton.click();

      // Sheet must open
      const sheet = page.locator('[role="dialog"]');
      await expect(sheet).toBeVisible();

      // Lifestyle tag chips must be inside the sheet
      const tagsInSheet = sheet.getByTestId("lifestyle-tag-chips");
      await expect(tagsInSheet).toBeVisible();
    },
  );
});
