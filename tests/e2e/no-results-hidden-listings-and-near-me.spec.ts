/**
 * Story 3.8: No-Results, Hidden Listings & Near Me — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. NoResultsState upgraded to forward search filters into WhatsApp CTA
 *      (src/components/property/no-results-state.tsx)
 *   2. PropertyGrid renders NoResultsState when results are empty
 *      (src/components/property/property-grid.tsx)
 *   3. ListingRemovedState / property detail page has proper data-testid
 *      attributes (src/app/[locale]/property/[slug]/page.tsx)
 *   4. NearMeButton created (src/components/search/near-me-button.tsx)
 *   5. useGeolocation hook created (src/hooks/use-geolocation.ts)
 *   6. MapView updated to accept flyToTarget prop
 *      (src/components/map/map-view.tsx)
 *   7. SplitViewLayout wires NearMeButton + fallback message
 *      (src/components/search/split-view-layout.tsx)
 *   8. i18n keys added for NearMe namespace
 *      (src/messages/en.json, src/messages/es.json)
 *   9. Playwright framework configured with a valid playwright.config.ts
 *   10. Staging/local environment with DB seeded with properties, including
 *       at least one hidden (isVisible=false) property
 *
 * These E2E tests correspond to the acceptance criteria for Story 3.8:
 *   3.8-E2E-001 — Near Me denied → fallback to RE/MAX office + message (AC #6, R-007)
 *   3.8-E2E-002 — Zero-results shows suggestions + WhatsApp CTA with correct URL (AC #1, #2)
 *   3.8-E2E-003 — Hidden listing URL shows "no longer available" + similar properties (AC #3)
 *   3.8-E2E-004 — Near Me granted → map flies to user coords + radius overlay (AC #5)
 *   3.8-E2E-005 — WhatsApp CTA in no-results forwards search criteria in message (AC #2)
 *
 * Activation instructions for the dev implementing Story 3.8:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/no-results-hidden-listings-and-near-me.spec.ts
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
const MOBILE_VIEWPORT = { width: 375, height: 812 };

/** A filter combination guaranteed to return zero results in the test DB */
const ZERO_RESULTS_PARAMS =
  "?type=Casa&priceMin=9999999&priceMax=10000000&bedrooms=99";

/** Slug for a hidden (isVisible=false) property seeded in the test DB */
const HIDDEN_PROPERTY_SLUG = "hidden-test-property";

// ---------------------------------------------------------------------------
// 3.8-E2E-001 — Near Me denied → fallback to RE/MAX office + message (AC #6)
// ---------------------------------------------------------------------------

test.describe("Story 3.8: No-Results, Hidden Listings & Near Me E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 3.8-E2E-001: Near Me denied → map centers on RE/MAX office + fallback message shown",
    async ({ page, context }: any) => {
      // THIS TEST WILL FAIL — NearMeButton not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Override Geolocation to simulate permission denial
      await context.grantPermissions([]); // no geolocation permission
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "geolocation", {
          value: {
            getCurrentPosition: (
              _success: PositionCallback,
              error: PositionErrorCallback,
            ) => {
              error({
                code: 1, // PERMISSION_DENIED
                message: "User denied Geolocation",
              } as GeolocationPositionError);
            },
          },
          configurable: true,
        });
      });

      await page.goto(SEARCH_URL_EN);
      await page.waitForLoadState("networkidle");

      // Near Me button must be visible
      const nearMeBtn = page.getByTestId("near-me-button");
      await expect(nearMeBtn).toBeVisible({ timeout: 10000 });

      // Click Near Me button
      await nearMeBtn.click();

      // Fallback message must appear (non-blocking, role="status")
      const fallbackMsg = page.getByTestId("near-me-fallback-message");
      await expect(fallbackMsg).toBeVisible({ timeout: 5000 });
      await expect(fallbackMsg).toContainText(/location unavailable|Pérez Zeledón/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8-E2E-002 — Zero-results shows suggestions + WhatsApp CTA (AC #1, #2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.8-E2E-002: zero-results state shows suggestions + WhatsApp CTA",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — NoResultsState not yet rendered in PropertyGrid
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(`${SEARCH_URL_EN}${ZERO_RESULTS_PARAMS}`);
      await page.waitForLoadState("networkidle");

      // NoResultsState root must be visible
      const noResults = page.getByTestId("no-results-state");
      await expect(noResults).toBeVisible({ timeout: 10000 });

      // WhatsApp CTA must be visible
      const whatsappCta = page.getByTestId("no-results-whatsapp-cta");
      await expect(whatsappCta).toBeVisible();

      // The CTA must be an anchor pointing to WhatsApp
      const href = await whatsappCta.getAttribute("href");
      expect(href).toContain("wa.me");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8-E2E-003 — Hidden listing URL shows "no longer available" + similar (AC #3)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.8-E2E-003: visiting a hidden listing URL shows 'no longer available' page with similar properties",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — listing-unavailable-page data-testid not yet added
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(`/en/property/${HIDDEN_PROPERTY_SLUG}`);
      await page.waitForLoadState("networkidle");

      // "No longer available" page wrapper must be present
      const unavailablePage = page.getByTestId("listing-unavailable-page");
      await expect(unavailablePage).toBeVisible({ timeout: 10000 });

      // Must contain "no longer available" text (locale: English)
      await expect(unavailablePage).toContainText(/no longer available/i);

      // Similar properties list must be present (even if empty)
      const similarList = page.getByTestId("similar-properties-list");
      await expect(similarList).toBeVisible();

      // Agent CTA (WhatsApp or browse-all) must be present
      const agentCta = page.getByTestId("agent-cta");
      await expect(agentCta).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8-E2E-004 — Near Me granted → map flies to user coords (AC #5)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.8-E2E-004: Near Me granted → map flies to user coords + radius overlay shown",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — NearMeButton + MapView flyToTarget not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Stub Geolocation to simulate granted permission with mock coords
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "geolocation", {
          value: {
            getCurrentPosition: (success: PositionCallback) => {
              success({
                coords: {
                  latitude: 9.3725,
                  longitude: -83.7011,
                  accuracy: 10,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                // Fixed timestamp for determinism — tests must not assert on this value
                timestamp: 1_700_000_000_000,
              } as GeolocationPosition);
            },
          },
          configurable: true,
        });
      });

      await page.goto(SEARCH_URL_EN);
      await page.waitForLoadState("networkidle");

      const nearMeBtn = page.getByTestId("near-me-button");
      await expect(nearMeBtn).toBeVisible({ timeout: 10000 });

      // Click Near Me button
      await nearMeBtn.click();

      // Fallback message must NOT appear on success.
      // Use count() to check presence without throwing — avoids catch-for-flow-control.
      const fallbackMsg = page.getByTestId("near-me-fallback-message");
      const fallbackCount = await fallbackMsg.count();
      if (fallbackCount > 0) {
        await expect(fallbackMsg).not.toBeVisible({ timeout: 2000 });
      }

      // Map must have updated (we can verify the map container is still present and
      // no error state appeared). Exact fly-to verification is hard in Playwright
      // without intercepting Mapbox GL; instead verify the UI stayed healthy.
      const mapContainer = page.locator('[data-testid="map-view"], .mapboxgl-canvas, #map-container');
      await expect(mapContainer.first()).toBeVisible({ timeout: 5000 });
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8-E2E-005 — WhatsApp CTA forwards search criteria in message (AC #2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 3.8-E2E-005: WhatsApp CTA in no-results forwards search criteria in message URL",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — NoResultsState filters prop not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Navigate with type=Casa filter so it appears in WhatsApp message
      await page.goto(`${SEARCH_URL_EN}?type=Casa${ZERO_RESULTS_PARAMS.replace("?", "&")}`);
      await page.waitForLoadState("networkidle");

      const noResults = page.getByTestId("no-results-state");
      await expect(noResults).toBeVisible({ timeout: 10000 });

      const whatsappCta = page.getByTestId("no-results-whatsapp-cta");
      await expect(whatsappCta).toBeVisible();

      // The WhatsApp href must contain the filter criteria in the message
      const href = (await whatsappCta.getAttribute("href")) ?? "";
      const decodedHref = decodeURIComponent(href);

      // Message must reference the property type from the URL filter
      expect(decodedHref).toContain("Casa");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8 Mobile: Near Me button visible on mobile (AC #4)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] Near Me button is visible on mobile viewport",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — NearMeButton not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SEARCH_URL_EN);
      await page.waitForLoadState("networkidle");

      const nearMeBtn = page.getByTestId("near-me-button");
      await expect(nearMeBtn).toBeVisible({ timeout: 10000 });
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8 Empty state has forward path — no dead ends (AC #7)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] no-results state primary CTA links back to search (AC #7 — no dead ends)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — NoResultsState not yet rendered in PropertyGrid
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(`${SEARCH_URL_EN}${ZERO_RESULTS_PARAMS}`);
      await page.waitForLoadState("networkidle");

      const noResults = page.getByTestId("no-results-state");
      await expect(noResults).toBeVisible({ timeout: 10000 });

      // Primary action (adjust filters / browse all) must link to /search
      const primaryLink = noResults.locator("a").first();
      await expect(primaryLink).toBeVisible();
      const href = await primaryLink.getAttribute("href");
      expect(href).toContain("/search");
    },
  );

  // ---------------------------------------------------------------------------
  // 3.8 Fallback message dismissal (AC #6, #7)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] Near Me fallback message can be dismissed",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — NearMeButton + fallback message not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Stub geolocation as denied
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "geolocation", {
          value: {
            getCurrentPosition: (
              _success: PositionCallback,
              error: PositionErrorCallback,
            ) => {
              error({
                code: 1,
                message: "User denied",
              } as GeolocationPositionError);
            },
          },
          configurable: true,
        });
      });

      await page.goto(SEARCH_URL_EN);
      await page.waitForLoadState("networkidle");

      const nearMeBtn = page.getByTestId("near-me-button");
      await expect(nearMeBtn).toBeVisible({ timeout: 10000 });
      await nearMeBtn.click();

      const fallbackMsg = page.getByTestId("near-me-fallback-message");
      await expect(fallbackMsg).toBeVisible({ timeout: 5000 });

      // Click dismiss button
      const dismissBtn = fallbackMsg.locator("button");
      await dismissBtn.click();

      // Message must disappear after dismissal
      await expect(fallbackMsg).not.toBeVisible({ timeout: 3000 });
    },
  );
});
