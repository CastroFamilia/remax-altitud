/**
 * Story 7.1: Save & Shortlist Properties — E2E Tests
 *
 * All tests are test.skip() until components are implemented and database is seeded.
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Local server running at http://localhost:3000
 *
 * Acceptance criteria covered:
 *   7.1-E2E-001 — Add/remove property from shortlist on click, icon visual state changes (AC #1, P0)
 *   7.1-E2E-002 — Hearts include appropriate accessibility aria-label that toggles (AC #2, P0)
 *   7.1-E2E-003 — Shortlist limits at 20 items, displays translated toast error "limitReached" (AC #3, P0)
 *   7.1-E2E-004 — Displays tooltip on 2nd save once per session (AC #4, #5, P1)
 *   7.1-E2E-005 — persistent count badge displays in the header/nav bar (AC #6, P0)
 *   7.1-E2E-006 — Shortlist persists in localStorage across reloads and navigations (AC #7, P0)
 *   7.1-E2E-007 — Heart button is keyboard-accessible with Enter/Space (AC #9, P1)
 */

// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PROPERTY_DETAIL_URL_EN = "/en/property/beautiful-mountain-home";
const PROPERTY_DETAIL_URL_ES = "/es/property/beautiful-mountain-home";
const HOMEPAGE_URL_EN = "/en";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 7.1: Save & Shortlist Properties E2E Tests", () => {
  // ---------------------------------------------------------------------------
  // 7.1-E2E-001 — Add/remove property from shortlist and verify style (AC #1, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.1-E2E-001: tapping the ♡ icon adds the property to shortlist, changes icon styles and saves to localStorage",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(PROPERTY_DETAIL_URL_EN);

      const saveButton = page.getByTestId("save-property-button");
      await expect(saveButton).toBeVisible();

      // Should start as outline state
      const heartIcon = saveButton.locator("svg");
      await expect(heartIcon).toHaveClass(/stroke-current|stroke-\[#888\]/);
      await expect(heartIcon).not.toHaveClass(/fill-current|fill-\[var\(--color-accent\)\]/);

      // Tap ♡ button
      await saveButton.click();

      // Class/styles must change to filled state for accessibility (fill and stroke)
      await expect(heartIcon).toHaveClass(/fill-\[#660000\]|fill-accent/);

      // Verify it was saved to localStorage
      const localStorageShortlist = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem("remax-altitud-shortlist") || "[]");
      });
      expect(localStorageShortlist).toContain("api-property-id"); // expects seeded ID
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-002 — Hearts include appropriate accessibility aria-label (AC #2, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.1-E2E-002: save button includes aria-label that updates with toggle state",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(PROPERTY_DETAIL_URL_EN);

      const saveButton = page.getByTestId("save-property-button");
      await expect(saveButton).toBeVisible();

      // Initial state: "Save property"
      await expect(saveButton).toHaveAttribute("aria-label", "Save property");

      // Click to save
      await saveButton.click();

      // Toggled state: "Remove from saved"
      await expect(saveButton).toHaveAttribute("aria-label", "Remove from saved");
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-003 — Shortlist limits at 20 items (AC #3, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.1-E2E-003: attempting to add 21st property triggers limit toast notification and denies save",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed 20 items in localStorage beforehand
      await page.goto(PROPERTY_DETAIL_URL_EN);
      await page.evaluate(() => {
        const ids = Array.from({ length: 20 }, (_, i) => `ALT-PROP-${1000 + i}`);
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(ids));
      });

      // Reload page to ingest state
      await page.reload();

      const saveButton = page.getByTestId("save-property-button");
      await expect(saveButton).toBeVisible();

      // Click to save the 21st
      await saveButton.click();

      // Toast notification should show translation for `limitReached` ("Remove one to add more")
      const toast = page.getByText("Remove one to add more");
      await expect(toast).toBeVisible();

      // Verify the item count is still 20 in localStorage
      const count = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem("remax-altitud-shortlist") || "[]").length;
      });
      expect(count).toBe(20);
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-003-ES — limitReached in Spanish (AC #3, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.1-E2E-003-ES: Spanish translation limits shortlist and triggers " +
      "'Elimina una para agregar más' toast",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed 20 items in localStorage beforehand
      await page.goto(PROPERTY_DETAIL_URL_ES);
      await page.evaluate(() => {
        const ids = Array.from({ length: 20 }, (_, i) => `ALT-PROP-${1000 + i}`);
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(ids));
      });

      // Reload page to ingest state
      await page.reload();

      const saveButton = page.getByTestId("save-property-button");
      await expect(saveButton).toBeVisible();

      // Click to save the 21st
      await saveButton.click();

      // Toast notification should show translation in Spanish ("Elimina una para agregar más")
      const toast = page.getByText("Elimina una para agregar más");
      await expect(toast).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-004 — Displays tooltip on 2nd save once per session (AC #4, #5, P1)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 7.1-E2E-004: tapping 2nd save displays tooltip 'Save more — your agent will show you all of them.' only once per session",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed 1 item in localStorage beforehand
      await page.goto(PROPERTY_DETAIL_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["ALT-PROP-1001"]));
      });

      // Reload page to ingest state
      await page.reload();

      const saveButton = page.getByTestId("save-property-button");
      await saveButton.click();

      // Second item saved! Tooltip should show up
      const tooltip = page.getByText("Save more — your agent will show you all of them.");
      await expect(tooltip).toBeVisible();

      // Now remove it and save again in the same session - tooltip should not repeat
      await saveButton.click(); // remove
      await saveButton.click(); // save again as 2nd item

      await expect(tooltip).not.toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-005 — Persistent count badge in navigation bar (AC #6, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.1-E2E-005: persistent shortlist icon in navigation bar displays the saved count as a badge",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(HOMEPAGE_URL_EN);

      const headerShortlistCount = page.getByTestId("header-shortlist-count");
      // Initially empty / hidden count or zero if loaded
      await expect(headerShortlistCount).toBeHidden();

      // Go to detail page and save property
      await page.goto(PROPERTY_DETAIL_URL_EN);
      const saveButton = page.getByTestId("save-property-button");
      await saveButton.click();

      // Nav bar badge count should immediately update reactively to 1
      await expect(headerShortlistCount).toBeVisible();
      await expect(headerShortlistCount).toHaveText("1");
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-006 — Shortlist persists in localStorage across navigations (AC #7, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.1-E2E-006: shortlist data stored in localStorage persists across page navigations and browser sessions",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(PROPERTY_DETAIL_URL_EN);

      const saveButton = page.getByTestId("save-property-button");
      await saveButton.click();

      // Navigate to homepage
      await page.goto(HOMEPAGE_URL_EN);

      // Nav bar badge count should still show "1" (state persisted in localStorage)
      const headerShortlistCount = page.getByTestId("header-shortlist-count");
      await expect(headerShortlistCount).toBeVisible();
      await expect(headerShortlistCount).toHaveText("1");
    },
  );

  // ---------------------------------------------------------------------------
  // 7.1-E2E-007 — Heart button is keyboard-accessible with Enter/Space (AC #9, P1)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 7.1-E2E-007: save heart button supports activation via Enter and Space keys",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(PROPERTY_DETAIL_URL_EN);

      const saveButton = page.getByTestId("save-property-button");
      await expect(saveButton).toBeVisible();

      // Focus the element using tab key
      await page.keyboard.press("Tab");
      // Keep pressing tab until button is focused
      let isFocused = await saveButton.evaluate((el: any) => document.activeElement === el);
      let attempts = 0;
      while (!isFocused && attempts < 20) {
        await page.keyboard.press("Tab");
        isFocused = await saveButton.evaluate((el: any) => document.activeElement === el);
        attempts++;
      }
      expect(isFocused).toBe(true);

      // Press Enter key to trigger click
      await page.keyboard.press("Enter");

      // Verify the heart is now saved and active
      const heartIcon = saveButton.locator("svg");
      await expect(heartIcon).toHaveClass(/fill-\[#660000\]|fill-accent/);

      // Press Space key to toggle/remove it
      await page.keyboard.press("Space");

      // Verify heart is outline again
      await expect(heartIcon).toHaveClass(/stroke-current|stroke-\[#888\]/);
    },
  );
});
