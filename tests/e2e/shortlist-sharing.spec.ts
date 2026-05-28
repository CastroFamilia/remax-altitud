/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Story 7.3: Shareable Shortlist URL — E2E Tests
 *
 * All tests are test.skip() for the TDD RED phase.
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Local server running at http://localhost:3000
 *
 * Acceptance criteria covered:
 *   7.3-E2E-001 — Generates shareable URL via POST /api/shortlist and copies it to clipboard (AC #1, #6, P0)
 *   7.3-E2E-002 — Dynamic shared URL loads read-only properties list and Mapbox pins (AC #2, P0)
 *   7.3-E2E-003 — Friendly message rendered when shared shortlist is expired (AC #4, P0)
 *   7.3-E2E-004 — Loads using the current viewer's browser locale for UI translation (AC #5, P0)
 *   7.3-E2E-005 — Robots metadata tag enforces noindex, nofollow to prevent SEO indexing (P1)
 */

import { test, expect } from "@playwright/test";

const SHORTLIST_URL_EN = "/en/shortlist";
const SEARCH_URL_EN = "/en/search";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 7.3: Shareable Shortlist URL E2E Tests", () => {
  // ---------------------------------------------------------------------------
  // 7.3-E2E-001 — Generation and Clipboard Copy (AC #1, #6, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.3-E2E-001: Tapping 'Share my shortlist' calls POST /api/shortlist, returns share URL, and copies to clipboard with toast",
    async ({ page, context }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Grant clipboard-write permission
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      // Seed localStorage with property IDs
      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["ALT-PROP-1001", "ALT-PROP-1002"]));
      });

      await page.goto(SHORTLIST_URL_EN);

      // Mock the POST API response to guarantee predictable slug returned
      await page.route("**/api/shortlist", async (route: any) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            shareId: "testShare123",
            shareUrl: `${page.url()}/testShare123`,
          }),
        });
      });

      const shareBtn = page.getByRole("button", { name: "Share my shortlist" });
      await expect(shareBtn).toBeVisible();

      // Click share button
      await shareBtn.click();

      // Verify success toast notification displays
      const toast = page.getByText("Link copied! Share it with anyone.");
      await expect(toast).toBeVisible();

      // Verify clipboard contents matches mocked shareUrl
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain("/shortlist/testShare123");
    }
  );

  // ---------------------------------------------------------------------------
  // 7.3-E2E-002 — Dynamic read-only render (AC #2, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.3-E2E-002: Dynamic shared URL loads read-only page with correct properties, specs, banner, and map",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Navigate to a active shared URL
      await page.goto("/en/shortlist/testShare123");

      // Verify dynamic content banner
      const banner = page.getByText("Viewing a shared shortlist. Start saving properties to create your own!");
      await expect(banner).toBeVisible();

      // Verify properties are rendered but lack close/✕ remove button
      const card1 = page.locator("[data-testid='property-card-ALT-PROP-1001']");
      const card2 = page.locator("[data-testid='property-card-ALT-PROP-1002']");
      await expect(card1).toBeVisible();
      await expect(card2).toBeVisible();

      const removeBtn = page.locator("[data-testid='remove-ALT-PROP-1001']");
      await expect(removeBtn).toBeHidden(); // Read-only

      // Verify Mapbox mini-map loaded and rendered pins
      const mapView = page.locator("[data-testid='map-view']");
      await expect(mapView).toBeVisible();
      await expect(page.locator(".mapboxgl-marker")).toHaveCount(2);
    }
  );

  // ---------------------------------------------------------------------------
  // 7.3-E2E-003 — Expiration state (AC #4, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.3-E2E-003: Expired shared URL renders friendly message and CTA to return to search page",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Navigate to an expired shared URL
      await page.goto("/en/shortlist/expiredShare456");

      // Verify expired state content displays
      const expiredMsg = page.getByText("This shortlist has expired. Start a new search.");
      await expect(expiredMsg).toBeVisible();

      const browseCta = page.getByRole("link", { name: "Browse Listings" });
      await expect(browseCta).toBeVisible();
      await expect(browseCta).toHaveAttribute("href", "/en/search");

      // Ensure no property list or Mapbox pins render
      await expect(page.locator("[data-testid='map-view']")).toBeHidden();
      await expect(page.locator("[data-testid^='property-card-']")).toHaveCount(0);
    }
  );

  // ---------------------------------------------------------------------------
  // 7.3-E2E-004 — Current locale formatting (AC #5, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.3-E2E-004: Opening shared URL in Spanish loads interface components fully translated",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Access identical share slug via Spanish locale path
      await page.goto("/es/shortlist/testShare123");

      // Banner translation
      const bannerEs = page.getByText("Viendo una lista compartida. ¡Comienza a guardar propiedades para crear la tuya!");
      await expect(bannerEs).toBeVisible();

      // Expired case validation in Spanish
      await page.goto("/es/shortlist/expiredShare456");
      const expiredMsgEs = page.getByText("Esta lista compartida ha expirado. Comienza una nueva búsqueda.");
      await expect(expiredMsgEs).toBeVisible();
    }
  );

  // ---------------------------------------------------------------------------
  // 7.3-E2E-005 — Robots noindex, nofollow crawler compliance (P1)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 7.3-E2E-005: Robots meta tag enforces noindex, nofollow to prevent SEO crawling and index duplicates",
    async ({ page }: any) => {
      await page.goto("/en/shortlist/testShare123");

      const robotsMeta = page.locator("meta[name='robots']");
      await expect(robotsMeta).toHaveAttribute("content", "noindex, nofollow");
    }
  );
});
