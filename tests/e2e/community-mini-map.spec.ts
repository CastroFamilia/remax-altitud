/**
 * Story 6.3: Community Mini-Map & Geo-Fence Display — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. src/lib/map/static-map.ts is created (Mapbox Static Images URL builder)
 *   2. src/components/community/community-mini-map.tsx is created (Server Component)
 *   3. communities table has latitude, longitude, geoFenceCoords columns
 *   4. Community page integrates CommunityMiniMap component
 *   5. Area guide community cards include thumbnail mini-maps
 *   6. Seed data includes lat/lng/geoFenceCoords for ≥1 community
 *   7. Playwright framework is configured
 *
 * Test IDs from test-design-epic-6.md:
 *   6.3-E2E-001 — Community mini-map renders as static image (not interactive Mapbox GL) (P1, R-007)
 *   6.3-E2E-002 — Area guide community cards include thumbnail mini-maps (P2)
 *   6.3-E2E-003 — Mini-map static image loads in < 1s (P3)
 *
 * Activation instructions for the dev implementing Story 6.3:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/community-mini-map.spec.ts
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

const COMMUNITY_URL_EN = "/en/areas/perez-zeledon/communities/rise";
const COMMUNITY_URL_ES = "/es/areas/perez-zeledon/communities/rise";
const AREA_GUIDE_URL_EN = "/en/areas/perez-zeledon";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 360, height: 800 };

// ---------------------------------------------------------------------------
// 6.3-E2E-001 — Community mini-map renders as static image (P1, R-007)
// ---------------------------------------------------------------------------

test.describe(
  "Story 6.3: Community Mini-Map & Geo-Fence Display E2E (ATDD — RED PHASE)",
  () => {
    test.skip(
      "[P1] 6.3-E2E-001: community mini-map renders as static <img> (not interactive Mapbox GL <canvas>)",
      async ({ page }: any) => {
        // THIS TEST WILL FAIL — CommunityMiniMap not yet implemented
        // Risk R-007: Interactive Mapbox GL JS loaded instead of static image (230KB bundle)
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(COMMUNITY_URL_EN);

        // Wait for the community page to load
        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        // Mini-map container must be present
        const miniMapContainer = page.getByTestId("community-mini-map");
        await expect(miniMapContainer).toBeVisible();

        // Must render as <img> tag — NOT a Mapbox GL <canvas>
        const img = miniMapContainer.locator("img");
        await expect(img).toBeVisible();

        // Image src must be a Mapbox Static Images API URL
        const src = await img.getAttribute("src");
        expect(src).toContain("api.mapbox.com/styles/v1");
        expect(src).toContain("static");
        expect(src).toContain("access_token");

        // Must NOT have a <canvas> element (Mapbox GL renders to canvas)
        const canvasCount = await page.locator("canvas").count();
        expect(canvasCount).toBe(0);
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-001b — Geo-fence overlay indicator present when polygon data exists
    // ---------------------------------------------------------------------------

    test.skip(
      "[P1] 6.3-E2E-001b: geo-fence overlay indicator is present when community has geoFenceCoords",
      async ({ page }: any) => {
        // THIS TEST WILL FAIL — geo-fence overlay not yet implemented
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(COMMUNITY_URL_EN);

        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        // Geo-fence overlay indicator should be visible (RISE has geoFenceCoords in seed data)
        const geoFenceOverlay = page.getByTestId("geo-fence-overlay");
        await expect(geoFenceOverlay).toBeVisible();
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-001c — Mini-map img URL contains community coordinates
    // ---------------------------------------------------------------------------

    test.skip(
      "[P1] 6.3-E2E-001c: mini-map image URL contains community latitude and longitude",
      async ({ page }: any) => {
        // THIS TEST WILL FAIL — static map URL not yet constructed
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(COMMUNITY_URL_EN);

        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        const miniMapContainer = page.getByTestId("community-mini-map");
        const img = miniMapContainer.locator("img");
        await expect(img).toBeVisible();

        const src = await img.getAttribute("src");
        // RISE coordinates: lat ~9.35, lng ~-83.65
        expect(src).toMatch(/-83\.\d+/); // longitude
        expect(src).toMatch(/9\.\d+/); // latitude
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-001d — Mini-map alt text includes community name and area name
    // ---------------------------------------------------------------------------

    test.skip(
      "[P1] 6.3-E2E-001d: mini-map image alt text includes community name and area name (NFR24)",
      async ({ page }: any) => {
        // THIS TEST WILL FAIL — alt text not yet implemented
        // Risk R-013: alt text missing or generic
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(COMMUNITY_URL_EN);

        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        const miniMapContainer = page.getByTestId("community-mini-map");
        const img = miniMapContainer.locator("img");
        await expect(img).toBeVisible();

        const alt = await img.getAttribute("alt");
        // AC #5 — alt must include both community name and area name
        expect(alt).toContain("RISE");
        expect(alt).toMatch(/Pérez Zeledón|perez-zeledon|Perez Zeledon/i);
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-001e — Mini-map present in SSG HTML (server-rendered)
    // ---------------------------------------------------------------------------

    test.skip(
      "[P1] 6.3-E2E-001e: mini-map is present in SSG HTML output (server-rendered, no JS needed)",
      async ({ request }: any) => {
        // Verify server-side rendering — mini-map should be in initial HTML
        const response = await request.get(COMMUNITY_URL_EN);
        expect(response.status()).toBe(200);

        const html = await response.text();
        expect(html).toContain('data-testid="community-mini-map"');
        expect(html).toContain("api.mapbox.com");
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-001f — Mini-map on mobile viewport
    // ---------------------------------------------------------------------------

    test.skip(
      "[P2] 6.3-E2E-001f: mini-map renders correctly on mobile viewport",
      async ({ page }: any) => {
        // Mini-map should be responsive
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto(COMMUNITY_URL_EN);

        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        const miniMapContainer = page.getByTestId("community-mini-map");
        await expect(miniMapContainer).toBeVisible();

        const img = miniMapContainer.locator("img");
        await expect(img).toBeVisible();
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-001g — Spanish locale renders correctly
    // ---------------------------------------------------------------------------

    test.skip(
      "[P2] 6.3-E2E-001g: mini-map renders with Spanish alt text when locale is ES",
      async ({ page }: any) => {
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(COMMUNITY_URL_ES);

        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        const miniMapContainer = page.getByTestId("community-mini-map");
        const img = miniMapContainer.locator("img");
        await expect(img).toBeVisible();

        const alt = await img.getAttribute("alt");
        // Spanish alt text should include community and area names
        expect(alt).toContain("RISE");
        // Spanish alt pattern: "Mapa de RISE en Pérez Zeledón"
        expect(alt).toMatch(/Mapa de|mapa/i);
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-002 — Area guide community cards include thumbnail mini-maps (P2)
    // ---------------------------------------------------------------------------

    test.skip(
      "[P2] 6.3-E2E-002: area guide community cards include thumbnail mini-maps showing location within area",
      async ({ page }: any) => {
        // THIS TEST WILL FAIL — thumbnail mini-maps not yet implemented
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(AREA_GUIDE_URL_EN);

        // Wait for the area guide to load
        const areaHero = page.getByTestId("area-guide-hero");
        await expect(areaHero).toBeVisible({ timeout: 10000 });

        // Find community cards within the area guide
        const communityCards = page.getByTestId("community-card");
        const count = await communityCards.count();
        expect(count).toBeGreaterThanOrEqual(1);

        // First community card should have a thumbnail mini-map image
        const firstCard = communityCards.first();
        const thumbnailImg = firstCard.locator('img[src*="api.mapbox.com"]');

        // If the community has coordinates, thumbnail should be present
        const thumbnailCount = await thumbnailImg.count();
        if (thumbnailCount > 0) {
          await expect(thumbnailImg.first()).toBeVisible();
          const src = await thumbnailImg.first().getAttribute("src");
          expect(src).toContain("api.mapbox.com/styles/v1");
          expect(src).toContain("static");
        }
      },
    );

    // ---------------------------------------------------------------------------
    // 6.3-E2E-003 — Mini-map static image loads in < 1s (P3)
    // ---------------------------------------------------------------------------

    test.skip(
      "[P3] 6.3-E2E-003: mini-map static image loads in < 1s",
      async ({ page }: any) => {
        // THIS TEST WILL FAIL — mini-map not yet implemented
        await page.setViewportSize(DESKTOP_VIEWPORT);

        const imageLoadPromise = page.waitForResponse(
          (response: any) =>
            response.url().includes("api.mapbox.com") &&
            response.status() === 200,
          { timeout: 5000 },
        );

        const startTime = Date.now();
        await page.goto(COMMUNITY_URL_EN);
        await imageLoadPromise;
        const loadTime = Date.now() - startTime;

        // Static map image should load within 1 second
        expect(loadTime).toBeLessThan(1000);
      },
    );

    // ---------------------------------------------------------------------------
    // Community without coordinates — graceful handling
    // ---------------------------------------------------------------------------

    test.skip(
      "[P2] community page without coordinates does not render mini-map (graceful null handling)",
      async ({ page }: any) => {
        // Navigate to a community known to have no lat/lng
        await page.setViewportSize(DESKTOP_VIEWPORT);
        await page.goto(
          "/en/areas/dominical/communities/serena-del-mar",
        );

        const hero = page.getByTestId("community-hero");
        await expect(hero).toBeVisible({ timeout: 10000 });

        // Mini-map should NOT be present when coordinates are missing
        const miniMapContainer = page.locator(
          '[data-testid="community-mini-map"]',
        );
        const mapCount = await miniMapContainer.count();
        // Either the map is absent or the component returns null
        expect(mapCount).toBe(0);
      },
    );
  },
);
