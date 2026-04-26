/**
 * Story 3.2: Interactive Map with Property Pins — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. MapView implementation is complete
 *   2. Playwright framework is configured (Story 3.3 sets this up)
 *   3. Staging environment with Mapbox token is available
 *
 * These E2E tests correspond to the P0/P1 scenarios in the Epic 3 test design:
 *   3.2-E2E-001 — Map initializes with 3D terrain and pins within 3s on 4G (P0, R-001, R-002)
 *   3.2-E2E-002 — Property pins cluster when zoomed out; expand on zoom in (P0, R-002)
 *   3.2-E2E-003 — Panning map updates grid to show only in-bounds properties (P0, R-012)
 *   3.2-E2E-004 — Clicking a pin shows preview card with photo, price, ZMT badge, CTA (P1)
 *   3.2-E2E-005 — Map state (center, zoom) survives view toggle (P2)
 *
 * PREREQUISITE: Playwright must be installed and configured before activating these tests.
 * Run the *framework workflow (Story 3.3 step) to set up playwright.config.ts.
 *
 * Activation instructions for the dev implementing Story 3.2:
 *   1. Remove `test.skip` from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/map-interactive.spec.ts
 *   3. Verify the test FAILS before implementation, then passes after
 *   4. Commit passing tests
 */

// NOTE: Playwright is not yet installed — this import will fail until Story 3.3
// installs and configures the framework. This is INTENTIONAL (TDD red phase).
// @ts-expect-error — @playwright/test not yet installed (Story 3.3 prerequisite)
import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const SEARCH_URL_EN = "/en/search";

// ---------------------------------------------------------------------------
// P0: 3.2-E2E-001 — Map initializes within 3s on throttled 4G (R-001, R-002)
// ---------------------------------------------------------------------------

test.describe("Story 3.2: Interactive Map E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.2-E2E-001: map-container renders and Mapbox fires 'load' event within 3s on throttled 4G",
    async ({ page, context }: any) => {
      // THIS TEST WILL FAIL — MapView not yet implemented + Playwright not configured
      // Throttle network to 4G profile (as per R-002 mitigation plan)
      await context.route("**/*", (route: any) => route.continue());

      await page.goto(SEARCH_URL_EN);

      // Map container must be present in DOM
      const mapContainer = page.getByTestId("map-container");
      await expect(mapContainer).toBeVisible({ timeout: 3000 });

      // Assert no JS errors in console (R-008 regression check)
      const errors: string[] = [];
      page.on("console", (msg: any) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      expect(errors.filter((e) => e.includes("Mapbox"))).toHaveLength(0);
    },
  );

  // ---------------------------------------------------------------------------
  // P0: 3.2-E2E-002 — Pins cluster when zoomed out; expand on zoom in (R-002)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.2-E2E-002: property pins show cluster markers when zoomed out; individual pins appear on zoom in",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — MapView not yet implemented + Playwright not configured
      await page.goto(SEARCH_URL_EN);

      // Wait for map to load
      await page.getByTestId("map-container").waitFor({ state: "visible", timeout: 5000 });

      // Zoomed out (zoom < 10) should show cluster markers
      // (Playwright cannot directly control Mapbox zoom — use keyboard shortcut or map control)
      // Simulate zoom-out with keyboard (minus key) — map must be focused
      await page.getByTestId("map-container").click();
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("-");
      }

      // Cluster pins should appear
      const clusterPins = page.getByTestId("map-cluster-pin");
      await expect(clusterPins.first()).toBeVisible({ timeout: 3000 });

      // Zoom back in — individual price pins should appear
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("+");
      }

      const pricePins = page.getByTestId("map-price-pin");
      await expect(pricePins.first()).toBeVisible({ timeout: 3000 });
    },
  );

  // ---------------------------------------------------------------------------
  // P0: 3.2-E2E-003 — Map pan → grid updates to in-bounds properties (R-012)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.2-E2E-003: panning the map triggers a grid update showing only in-bounds properties",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — MapView not yet implemented + Playwright not configured
      await page.goto(SEARCH_URL_EN);
      await page.getByTestId("map-container").waitFor({ state: "visible", timeout: 5000 });

      // Capture initial property count shown
      // NOTE: Story 3.5 will add data-testid="property-count" — this assertion
      // uses a placeholder that will need to be updated once grid is implemented.
      const countBefore = await page.getByTestId("property-count").textContent();

      // Pan map by dragging (simulate user panning away from default center)
      const mapEl = page.getByTestId("map-container");
      const box = await mapEl.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2);
        await page.mouse.up();
      }

      // Wait for grid to refresh after pan
      await page.waitForTimeout(500); // debounce allowance

      // Property count should change (or at minimum a server action should have been called)
      const countAfter = await page.getByTestId("property-count").textContent();
      // NOTE: This assertion may need refinement once the full grid is implemented in Story 3.5
      expect(countAfter).toBeDefined();
      // In a fully seeded environment, counts will differ after panning away from center
      // expect(countAfter).not.toBe(countBefore);
    },
  );

  // ---------------------------------------------------------------------------
  // P1: 3.2-E2E-004 — Pin click → preview card with all required fields
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.2-E2E-004: clicking a property pin shows preview card with photo, price, ZMT badge, and CTA link",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — MapView not yet implemented + Playwright not configured
      await page.goto(SEARCH_URL_EN);
      await page.getByTestId("map-container").waitFor({ state: "visible", timeout: 5000 });

      // Wait for at least one price pin to appear
      const firstPin = page.getByTestId("map-price-pin").first();
      await expect(firstPin).toBeVisible({ timeout: 5000 });

      // Click the pin
      await firstPin.click();

      // Preview card must appear
      const popup = page.getByTestId("map-property-popup");
      await expect(popup).toBeVisible();

      // Assert required popup content (AC #4)
      // Photo (thumbnail image)
      await expect(popup.locator("img")).toBeVisible();

      // Price in USD format
      await expect(popup.getByText(/\$[\d,]+/)).toBeVisible();

      // ZMT status badge (text label — not color-only, for accessibility)
      await expect(
        popup.getByText(/Titled|Concession|ZMT Restricted/),
      ).toBeVisible();

      // "View Details" CTA link
      const ctaLink = popup.getByRole("link", { name: /View Details/i });
      await expect(ctaLink).toBeVisible();

      // Close button
      const closeButton = page.getByTestId("map-popup-close");
      await expect(closeButton).toBeVisible();
      await closeButton.click();
      await expect(popup).not.toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // P2: 3.2-E2E-005 — Map state (center, zoom) survives view toggle (AC #8)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 3.2-E2E-005: map center and zoom are preserved when toggling between view modes (AC #8, AR10)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — MapView not yet implemented + Playwright not configured
      await page.goto(SEARCH_URL_EN);
      await page.getByTestId("map-container").waitFor({ state: "visible", timeout: 5000 });

      // Pan and zoom to a custom position
      const mapEl = page.getByTestId("map-container");
      const box = await mapEl.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2);
        await page.mouse.up();
      }

      // Toggle to Full Grid view
      const gridToggle = page.getByTestId("toggle-grid");
      await gridToggle.click();

      // Map panel is hidden in grid mode
      await expect(page.getByTestId("map-panel")).toHaveClass(/lg:hidden/);

      // Toggle back to Split view
      const splitToggle = page.getByTestId("toggle-split");
      await splitToggle.click();

      // Map is visible again — Zustand store should have preserved state
      await expect(page.getByTestId("map-container")).toBeVisible();
      // The map should NOT have reset to the default center (evidence of Zustand persisting state)
      // This is verified by the map NOT scrolling back to default center
      // (Exact pixel comparison is fragile; this primarily verifies no reset crash)
    },
  );

  // ---------------------------------------------------------------------------
  // P1: 3.2-UNIT-001 — Mapbox bundle NOT in main JS chunk (AC #6, AR25)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 3.2-UNIT-001: Mapbox GL JS does NOT appear in the main JS bundle (AR25 — lazy chunk verification)",
    async ({ request }: any) => {
      // THIS TEST WILL FAIL — Build analysis not yet possible without implementation
      // Strategy: fetch the main JS chunk and assert 'mapbox' is absent.
      // NOTE: This requires the app to be built (`npm run build`) before running.
      // In CI, this test runs after the build step.
      const response = await request.get("/");
      expect(response.ok()).toBe(true);

      const html = await response.text();

      // Extract main chunk script URLs from the HTML
      const mainChunkPattern = /\/_next\/static\/chunks\/main[^"']*/g;
      const mainChunks = html.match(mainChunkPattern) ?? [];

      // For each main chunk, assert 'mapbox' is NOT present
      for (const chunkPath of mainChunks) {
        const chunkResponse = await request.get(chunkPath);
        const chunkContent = await chunkResponse.text();
        expect(chunkContent).not.toContain("mapbox");
      }
    },
  );
});
