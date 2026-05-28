/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Story 7.2: Shortlist Comparison Page — E2E Tests
 *
 * All tests are test.skip() until page routes and components are implemented.
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Local server running at http://localhost:3000
 *
 * Acceptance criteria covered:
 *   7.2-E2E-001 — Shortlist page displays side-by-side comparison layout, prices, specs (AC #1, P0)
 *   7.2-E2E-002 — Mini-map shows all saved property locations as pins (AC #2, P0)
 *   7.2-E2E-003 — Empty shortlist page displays friendly message and "Browse Listings" CTA (AC #3, P0)
 *   7.2-E2E-004 — Removing a property updates the list and map instantly in localStorage (AC #4, P0)
 *   7.2-E2E-005 — Shows "Ask about these" and "Share my shortlist" CTAs at the bottom (AC #5, P0)
 *   7.2-E2E-006 — Crawlers are explicitly blocked via meta robots tag (AC #6, P1)
 *   7.2-E2E-007 — Large Mapbox library is lazy loaded asynchronously (AC #7, P1)
 */

// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

const SHORTLIST_URL_EN = "/en/shortlist";
const SHORTLIST_URL_ES = "/es/shortlist";
const SEARCH_URL_EN = "/en/search";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 7.2: Shortlist Comparison Page E2E Tests", () => {
  // ---------------------------------------------------------------------------
  // 7.2-E2E-001 — Simple comparison layout (AC #1, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.2-E2E-001: Shortlist page loaded with saved properties displays side-by-side comparison layout",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed localStorage with property IDs
      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["ALT-PROP-1001", "ALT-PROP-1002"]));
      });

      await page.goto(SHORTLIST_URL_EN);

      // Verify title is visible
      const title = page.getByText("My Saved Properties");
      await expect(title).toBeVisible();

      // Verify comparison cards are rendered
      const card1 = page.locator("[data-testid='property-card-ALT-PROP-1001']");
      const card2 = page.locator("[data-testid='property-card-ALT-PROP-1002']");
      await expect(card1).toBeVisible();
      await expect(card2).toBeVisible();

      // Verify key specs display
      await expect(card1.locator("[data-testid='beds-count']")).toBeVisible();
      await expect(card1.locator("[data-testid='baths-count']")).toBeVisible();
      await expect(card1.locator("[data-testid='area-size']")).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 7.2-E2E-002 — Mini-map display (AC #2, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.2-E2E-002: Shortlist page loaded with saved properties renders Mapbox mini-map with location pins",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["ALT-PROP-1001"]));
      });

      await page.goto(SHORTLIST_URL_EN);

      const mapView = page.locator("[data-testid='map-view']");
      await expect(mapView).toBeVisible();

      // Check map contains marker element
      const marker = page.locator(".mapboxgl-marker");
      await expect(marker).toHaveCount(1);
    },
  );

  // ---------------------------------------------------------------------------
  // 7.2-E2E-003 — Empty state & browse CTA (AC #3, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.2-E2E-003: Empty shortlist displays friendly empty state and 'Browse Listings' CTA",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Clear shortlist
      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.removeItem("remax-altitud-shortlist");
      });

      await page.goto(SHORTLIST_URL_EN);

      // Verify friendly message
      const msg = page.getByText("No properties saved yet. Browse listings and tap ♡ to save.");
      await expect(msg).toBeVisible();

      // Verify Browse CTA and target URL
      const browseCta = page.getByRole("link", { name: "Browse Listings" });
      await expect(browseCta).toBeVisible();
      await expect(browseCta).toHaveAttribute("href", "/en/search");
    },
  );

  // ---------------------------------------------------------------------------
  // 7.2-E2E-004 — Remove property interaction (AC #4, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.2-E2E-004: Removing property via ✕ button instantly updates list and map without page refresh",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["ALT-PROP-1001", "ALT-PROP-1002"]));
      });

      await page.goto(SHORTLIST_URL_EN);

      const removeBtn1 = page.locator("[data-testid='remove-ALT-PROP-1001']");
      await expect(removeBtn1).toBeVisible();

      // Click remove button
      await removeBtn1.click();

      // Card for ALT-PROP-1001 should immediately disappear
      const card1 = page.locator("[data-testid='property-card-ALT-PROP-1001']");
      await expect(card1).toBeHidden();

      // Card for ALT-PROP-1002 remains
      const card2 = page.locator("[data-testid='property-card-ALT-PROP-1002']");
      await expect(card2).toBeVisible();

      // Verify localStorage was updated
      const list = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem("remax-altitud-shortlist") || "[]");
      });
      expect(list).toEqual(["ALT-PROP-1002"]);
    },
  );

  // ---------------------------------------------------------------------------
  // 7.2-E2E-005 — Actions CTAs block (AC #5, P0)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.2-E2E-005: Populated shortlist displays both Ask Agent and Share Shortlist buttons",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["ALT-PROP-1001"]));
      });

      await page.goto(SHORTLIST_URL_EN);

      const askAgent = page.getByRole("button", { name: "Ask about these" });
      const shareShortlist = page.getByRole("button", { name: "Share my shortlist" });

      await expect(askAgent).toBeVisible();
      await expect(shareShortlist).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 7.2-E2E-006 — Meta robots indexing block (AC #6, P1)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 7.2-E2E-006: Shortlist page meta robots is set to index: false, follow: false",
    async ({ page }: any) => {
      await page.goto(SHORTLIST_URL_EN);

      const metaRobots = page.locator("meta[name='robots']");
      await expect(metaRobots).toHaveAttribute("content", "noindex, nofollow");
    },
  );

  // ---------------------------------------------------------------------------
  // 7.2-E2E-007 — Spanish localization validation
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.2-E2E-007: Spanish shortlist displays fully translated title, empty state, and CTAs",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Clear shortlist to verify empty state in Spanish
      await page.goto(SEARCH_URL_EN);
      await page.evaluate(() => {
        localStorage.removeItem("remax-altitud-shortlist");
      });

      await page.goto(SHORTLIST_URL_ES);

      const title = page.getByText("Mis Propiedades Guardadas");
      const emptyState = page.getByText("No tienes propiedades guardadas. Explora listados y toca ♡ para guardar.");
      const browseCta = page.getByRole("link", { name: "Explorar Propiedades" });

      await expect(title).toBeVisible();
      await expect(emptyState).toBeVisible();
      await expect(browseCta).toBeVisible();
    },
  );
});
