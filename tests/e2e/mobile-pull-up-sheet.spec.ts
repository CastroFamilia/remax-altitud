/**
 * Story 3.6: Mobile Pull-Up Sheet — E2E Test Scaffolds
 *
 * E2E SCAFFOLDS — all tests use test.skip() awaiting Playwright setup:
 *   [DONE] MapPullUpSheet component implemented (src/components/map/map-pull-up-sheet.tsx)
 *   [DONE] @use-gesture/react installed
 *   [DONE] SplitViewLayout updated to use MapPullUpSheet
 *   [DONE] overscroll-behavior: none applied to search page root
 *   [DONE] i18n keys pullUpSheet.* added to en.json / es.json
 *   [TODO] Playwright framework configured with a valid playwright.config.ts
 *   [TODO] Staging/local environment with DB seeded with properties
 *
 * These E2E tests correspond to the acceptance criteria for Story 3.6:
 *   3.6-E2E-001 — Pull-up sheet peeked state shows handle + property count (AC #1, #2, P0)
 *   3.6-E2E-002 — Pull-up sheet drags to half (50vh) snap point (AC #3, P0, R-006)
 *   3.6-E2E-003 — Pull-up sheet drags to full (85vh) snap point (AC #4, P0, R-006)
 *   3.6-E2E-004 — Pull-up sheet has ARIA: role=region, aria-label, aria-expanded (AC #7, P0)
 *   3.6-E2E-005 — Pull-to-refresh is disabled on search page (AC #6, P1)
 *   3.6-E2E-006 — Sheet animates to nearest snap point on release between snap points (AC #5, P1, R-006)
 *   3.6-E2E-007 — Full state close button returns sheet to peeked state (AC #4, P1)
 *   3.6-E2E-008 — Sheet renders only on mobile viewport (<768px); hidden on desktop (AC #1, P1)
 *
 * Risk coverage:
 *   R-006: Pull-up sheet drag conflicts with iOS Safari native scroll/overscroll-behavior
 *
 * Activation instructions for the dev implementing Story 3.6:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/mobile-pull-up-sheet.spec.ts --project=chromium
 *   3. For mobile gesture tests use: --project=Mobile Chrome (375x812 viewport)
 *   4. Verify the test FAILS before implementation, then passes after
 *   5. Commit passing tests
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
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ---------------------------------------------------------------------------
// 3.6-E2E-001 — Peeked state: handle + property count visible (AC #1, #2, P0)
// ---------------------------------------------------------------------------

test.describe("Story 3.6: Mobile Pull-Up Sheet E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.6-E2E-001: pull-up sheet appears at bottom with handle and property count in peeked state on mobile",
    async ({ page }: any) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Pull-up sheet must be present
      const sheet = page.getByTestId("pull-up-sheet");
      await expect(sheet).toBeVisible();

      // Default state is peeked
      await expect(sheet).toHaveAttribute("data-state", "peeked");

      // Drag handle bar is visible
      const handle = page.getByTestId("pull-up-handle");
      await expect(handle).toBeVisible();

      // Property count label is visible (e.g., "12 properties")
      const countLabel = sheet.getByText(/\d+ properties/);
      await expect(countLabel).toBeVisible();

      // No property cards in peeked state
      const cards = page.getByTestId("property-card");
      await expect(cards).toHaveCount(0);
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-002 — Drag to half (50vh) snap point (AC #3, P0, R-006)
  // -------------------------------------------------------------------------

  test.skip(
    "[P0] 3.6-E2E-002: dragging pull-up handle up significantly snaps sheet to half state (50vh)",
    async ({ page }: any) => {
      // Risk R-006: pull-up drag may conflict with iOS Safari native scroll
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const handle = page.getByTestId("pull-up-handle");
      await expect(handle).toBeVisible();

      // Simulate drag gesture upward by more than 60px (threshold for snap advance)
      const handleBox = await handle.boundingBox();
      expect(handleBox).not.toBeNull();

      const startX = handleBox!.x + handleBox!.width / 2;
      const startY = handleBox!.y + handleBox!.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 100, { steps: 10 }); // drag up 100px
      await page.mouse.up();

      // Sheet should snap to half state
      const sheet = page.getByTestId("pull-up-sheet");
      await expect(sheet).toHaveAttribute("data-state", "half");

      // aria-expanded should be "true" in half state
      await expect(sheet).toHaveAttribute("aria-expanded", "true");

      // 2-3 property card previews in horizontal scroll
      const cards = page.getByTestId("property-card");
      await expect(cards).toHaveCount(expect.objectContaining({ asymmetricMatch: (n: number) => n >= 1 && n <= 3 }));
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-003 — Drag to full (85vh) snap point (AC #4, P0, R-006)
  // -------------------------------------------------------------------------

  test.skip(
    "[P0] 3.6-E2E-003: dragging pull-up handle up from half state snaps sheet to full state (85vh)",
    async ({ page }: any) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // First advance to half state
      const handle = page.getByTestId("pull-up-handle");
      const handleBox = await handle.boundingBox();
      expect(handleBox).not.toBeNull();

      const startX = handleBox!.x + handleBox!.width / 2;
      const startY = handleBox!.y + handleBox!.height / 2;

      // Drag to half
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 100, { steps: 10 });
      await page.mouse.up();

      const sheet = page.getByTestId("pull-up-sheet");
      await expect(sheet).toHaveAttribute("data-state", "half");

      // Drag again from half to full
      const handleBox2 = await handle.boundingBox();
      const startX2 = handleBox2!.x + handleBox2!.width / 2;
      const startY2 = handleBox2!.y + handleBox2!.height / 2;

      await page.mouse.move(startX2, startY2);
      await page.mouse.down();
      await page.mouse.move(startX2, startY2 - 100, { steps: 10 });
      await page.mouse.up();

      // Sheet should now be in full state (85vh)
      await expect(sheet).toHaveAttribute("data-state", "full");
      await expect(sheet).toHaveAttribute("aria-expanded", "true");

      // Full scrollable property list should be visible
      const cards = page.getByTestId("property-card");
      await expect(cards.first()).toBeVisible();

      // Close button must appear in full state
      const closeButton = page.getByRole("button", { name: "Close property list and return to map" });
      await expect(closeButton).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-004 — ARIA attributes (AC #7, P0)
  // -------------------------------------------------------------------------

  test.skip(
    "[P0] 3.6-E2E-004: pull-up sheet has role='region', aria-label='Property list', aria-expanded toggling",
    async ({ page }: any) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // The sheet region must be identifiable by assistive technologies
      const region = page.getByRole("region", { name: "Property list" });
      await expect(region).toBeVisible();

      // Default peeked state: aria-expanded="false"
      await expect(region).toHaveAttribute("aria-expanded", "false");

      // After dragging to half, aria-expanded should flip to "true"
      const handle = page.getByTestId("pull-up-handle");
      const handleBox = await handle.boundingBox();
      const startX = handleBox!.x + handleBox!.width / 2;
      const startY = handleBox!.y + handleBox!.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 100, { steps: 10 });
      await page.mouse.up();

      await expect(region).toHaveAttribute("aria-expanded", "true");
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-005 — Pull-to-refresh disabled via overscroll-behavior: none (AC #6, P1)
  // -------------------------------------------------------------------------

  test.skip(
    "[P1] 3.6-E2E-005: pull-to-refresh is disabled on search page (overscroll-behavior: none)",
    async ({ page }: any) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Verify overscroll-behavior: none is present on the search page root element
      // This is the CSS signal that tells the browser not to trigger pull-to-refresh
      const searchRoot = page.locator(".overscroll-none").first();
      await expect(searchRoot).toBeAttached();

      // Computed style check: overscroll-behavior should be "none"
      const overscrollBehavior = await searchRoot.evaluate(
        (el: Element) => window.getComputedStyle(el).overscrollBehavior,
      );
      // Browsers may report "none none" or "none" depending on shorthand expansion
      expect(overscrollBehavior).toMatch(/^none/);
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-006 — Snap to nearest point on release between snap points (AC #5, P1, R-006)
  // -------------------------------------------------------------------------

  test.skip(
    "[P1] 3.6-E2E-006: releasing sheet between snap points animates to nearest snap point",
    async ({ page }: any) => {
      // Tests the spring physics snap behavior when drag is insufficient to advance state
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      const sheet = page.getByTestId("pull-up-sheet");
      await expect(sheet).toHaveAttribute("data-state", "peeked");

      const handle = page.getByTestId("pull-up-handle");
      const handleBox = await handle.boundingBox();
      const startX = handleBox!.x + handleBox!.width / 2;
      const startY = handleBox!.y + handleBox!.height / 2;

      // Drag upward by only 30px (below the 60px threshold) — should snap BACK to peeked
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX, startY - 30, { steps: 5 });
      await page.mouse.up();

      // Sheet must snap back to peeked (insufficient drag)
      await expect(sheet).toHaveAttribute("data-state", "peeked");
      await expect(sheet).toHaveAttribute("aria-expanded", "false");
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-007 — Close button returns sheet from full to peeked (AC #4, P1)
  // -------------------------------------------------------------------------

  test.skip(
    "[P1] 3.6-E2E-007: clicking close button in full state returns sheet to peeked",
    async ({ page }: any) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // Advance to full state via two drags
      const handle = page.getByTestId("pull-up-handle");
      for (let i = 0; i < 2; i++) {
        const box = await handle.boundingBox();
        const cx = box!.x + box!.width / 2;
        const cy = box!.y + box!.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx, cy - 100, { steps: 10 });
        await page.mouse.up();
      }

      const sheet = page.getByTestId("pull-up-sheet");
      await expect(sheet).toHaveAttribute("data-state", "full");

      // Click close button
      const closeButton = page.getByRole("button", { name: "Close property list and return to map" });
      await expect(closeButton).toBeVisible();
      await closeButton.click();

      // Sheet returns to peeked
      await expect(sheet).toHaveAttribute("data-state", "peeked");
      await expect(sheet).toHaveAttribute("aria-expanded", "false");

      // Close button should no longer be visible
      await expect(closeButton).not.toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // 3.6-E2E-008 — Sheet hidden on desktop (lg:hidden) (AC #1, P1)
  // -------------------------------------------------------------------------

  test.skip(
    "[P1] 3.6-E2E-008: pull-up sheet is not visible on desktop viewport (lg:hidden CSS class)",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SEARCH_URL_EN);

      // The sheet element should exist in the DOM (CSS hides it)
      const sheet = page.getByTestId("pull-up-sheet");
      await expect(sheet).toBeAttached();

      // But it should NOT be visible at desktop breakpoint (lg:hidden)
      await expect(sheet).not.toBeVisible();
    },
  );
});
