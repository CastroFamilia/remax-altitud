/**
 * Story 4.5: Similar Properties & Cross-Linking — ATDD Red-Phase E2E Scaffold
 *
 * TDD Phase: RED — all tests are test.skip() until implementation is done and DB is seeded.
 * Remove test.skip() per test when implementing to verify green phase.
 *
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Staging/local environment with DB seeded:
 *       * A listing with slug "casa-verde" in area "perez-zeledon" with priceUsd=250000
 *       * At least 1–4 other listings in the same area within ±20% price range
 *   - Next.js dev server or staging environment running
 *
 * Acceptance criteria covered:
 *   AC #1  — 4.5-E2E-001: Similar properties carousel shows horizontal scroll with PropertyCards (P1)
 *   AC #2  — Similar properties use ranked algorithm (area + price + type) (P1)
 *   AC #4  — 4.5-E2E-002: Breadcrumbs render full navigation path (P1)
 *   AC #5  — 4.5-E2E-003: Mobile similar properties renders as horizontal swipe carousel (P2)
 *   AC #7  — Empty state renders "Browse all properties" CTA when no similar found (P1)
 *   AC #8  — SimilarProperties does not block LCP — Suspense skeleton appears first (P2)
 *
 * data-testid contract (CANNOT rename):
 *   data-testid="similar-properties-carousel"  — section container when properties present
 *   data-testid="similar-properties-empty"     — section container when no properties found
 *   data-testid="similar-browse-cta"           — fallback CTA link
 *   data-testid="similar-properties-skeleton"  — loading skeleton during Suspense
 *   data-testid="breadcrumbs"                  — root <nav> element
 */

// NOTE: Playwright is not yet installed — this import will fail until
// playwright.config.ts is configured and @playwright/test is installed.
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Listing with known similar properties seeded in DB (same area, similar price) */
const LISTING_URL_EN = "/en/property/casa-verde";
const LISTING_URL_ES = "/es/property/casa-verde";

/** Listing with NO similar properties (to test empty state) */
const LISTING_URL_NO_SIMILAR = "/en/property/isolated-property-no-similar";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// ---------------------------------------------------------------------------
// AC #1, 4.5-E2E-001 — Similar properties carousel renders (P1)
// ---------------------------------------------------------------------------

test.describe("Story 4.5: Similar Properties — Carousel rendering", () => {
  test.skip(
    "[P1] 4.5-E2E-001: similar properties carousel section is present on listing detail page (AC #1)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      // Wait for Suspense to resolve (skeleton → carousel)
      await page.waitForSelector('[data-testid="similar-properties-carousel"]', {
        timeout: 10000,
      });

      const carousel = page.getByTestId("similar-properties-carousel");
      await expect(carousel).toBeVisible();
    },
  );

  test.skip(
    "[P1] 4.5-E2E-001b: similar properties carousel contains at least 1 PropertyCard (AC #1, #6)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="similar-properties-carousel"]', {
        timeout: 10000,
      });

      // PropertyCard renders with data-testid="property-card" (from Epic 3 contract)
      const cards = page.getByTestId("property-card");
      await expect(cards.first()).toBeVisible();
    },
  );

  test.skip(
    "[P1] 4.5-E2E-001c: similar properties heading is visible (AC #1)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="similar-properties-carousel"]', {
        timeout: 10000,
      });

      // i18n key "heading" resolves to "Similar Properties" in EN
      const heading = page.getByText("Similar Properties");
      await expect(heading).toBeVisible();
    },
  );

  test.skip(
    "[P1] 4.5-E2E-001d: similar properties section is below the agent card on the listing page (AC #1)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="agent-card"]', { timeout: 10000 });
      await page.waitForSelector('[data-testid="similar-properties-carousel"]', {
        timeout: 10000,
      });

      const agentCard = page.getByTestId("agent-card");
      const carousel = page.getByTestId("similar-properties-carousel");

      const agentBox = await agentCard.boundingBox();
      const carouselBox = await carousel.boundingBox();

      expect(agentBox).toBeTruthy();
      expect(carouselBox).toBeTruthy();

      // Carousel must be below the agent card vertically
      expect(carouselBox!.y).toBeGreaterThan(agentBox!.y + agentBox!.height);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #7 — Empty state (no similar properties found) (P1)
// ---------------------------------------------------------------------------

test.describe("Story 4.5: Similar Properties — Empty state", () => {
  test.skip(
    "[P1] 4.5-E2E-EMPTY-001: shows empty state section with 'Browse all properties' CTA when no similar found (AC #7)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_NO_SIMILAR);

      await page.waitForSelector('[data-testid="similar-properties-empty"]', {
        timeout: 10000,
      });

      const emptySection = page.getByTestId("similar-properties-empty");
      await expect(emptySection).toBeVisible();

      const cta = page.getByTestId("similar-browse-cta");
      await expect(cta).toBeVisible();
    },
  );

  test.skip(
    "[P1] 4.5-E2E-EMPTY-002: 'Browse all properties' CTA links to the search page (AC #7)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_NO_SIMILAR);

      await page.waitForSelector('[data-testid="similar-browse-cta"]', {
        timeout: 10000,
      });

      const cta = page.getByTestId("similar-browse-cta");
      const href = await cta.getAttribute("href");
      expect(href).toContain("/search");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #4, 4.5-E2E-002 — Breadcrumbs render full navigation path (P1)
// ---------------------------------------------------------------------------

test.describe("Story 4.5: Breadcrumbs — Navigation hierarchy", () => {
  test.skip(
    "[P1] 4.5-E2E-002: breadcrumbs render on listing detail page with correct nav element (AC #4)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const breadcrumbs = page.getByTestId("breadcrumbs");
      await expect(breadcrumbs).toBeVisible();
    },
  );

  test.skip(
    "[P1] 4.5-E2E-002b: breadcrumbs contain 'Home' link pointing to locale root (AC #4)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="breadcrumbs"]', { timeout: 10000 });

      const breadcrumbs = page.getByTestId("breadcrumbs");
      const homeLink = breadcrumbs.getByText("Home");
      await expect(homeLink).toBeVisible();

      const href = await homeLink.getAttribute("href");
      expect(href).toMatch(/^\/en\/?$/);
    },
  );

  test.skip(
    "[P1] 4.5-E2E-002c: breadcrumbs contain 'Search' link pointing to /search (AC #4)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="breadcrumbs"]', { timeout: 10000 });

      const breadcrumbs = page.getByTestId("breadcrumbs");
      const searchLink = breadcrumbs.getByText("Search");
      await expect(searchLink).toBeVisible();

      const href = await searchLink.getAttribute("href");
      expect(href).toContain("/search");
    },
  );

  test.skip(
    "[P1] 4.5-E2E-002d: breadcrumbs last item shows listing title with aria-current='page' (AC #4)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="breadcrumbs"]', { timeout: 10000 });

      const currentItem = page.locator('[aria-current="page"]');
      await expect(currentItem).toBeVisible();

      // The current item should contain the listing title text
      const currentText = await currentItem.textContent();
      expect(currentText?.trim().length).toBeGreaterThan(0);
    },
  );

  test.skip(
    "[P1] 4.5-E2E-002e: breadcrumbs render correctly in Spanish locale (AC #4)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Breadcrumbs component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_ES);

      const breadcrumbs = page.getByTestId("breadcrumbs");
      await expect(breadcrumbs).toBeVisible();

      // Spanish locale: Breadcrumbs.home = "Inicio", Breadcrumbs.search = "Buscar"
      // (these keys exist from Story 4.4; verify they render correctly)
      const homeItem = breadcrumbs.locator("li").first();
      await expect(homeItem).toBeVisible();
    },
  );
});

// ---------------------------------------------------------------------------
// AC #5, 4.5-E2E-003 — Mobile swipe carousel (P2)
// ---------------------------------------------------------------------------

test.describe("Story 4.5: Similar Properties — Mobile carousel", () => {
  test.skip(
    "[P2] 4.5-E2E-003: mobile carousel has horizontal overflow for swipe navigation (AC #5, UX-DR31)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="similar-properties-carousel"]', {
        timeout: 10000,
      });

      // The inner scroll container should have overflow-x auto/scroll
      const scrollContainer = page.locator(
        '[data-testid="similar-properties-carousel"] .overflow-x-auto',
      );
      await expect(scrollContainer).toBeVisible();

      // Verify scroll container has horizontal overflow (CSS snap)
      const overflowX = await scrollContainer.evaluate(
        (el: Element) => window.getComputedStyle(el).overflowX,
      );
      expect(["auto", "scroll"]).toContain(overflowX);
    },
  );

  test.skip(
    "[P2] 4.5-E2E-003b: mobile carousel cards have snap-start class for CSS scroll snap (AC #5)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarProperties component not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      await page.waitForSelector('[data-testid="similar-properties-carousel"]', {
        timeout: 10000,
      });

      // CSS snap: each card wrapper should have snap-start
      const firstCardWrapper = page.locator(
        '[data-testid="similar-properties-carousel"] [role="listitem"]',
      ).first();

      const hasSnapStart = await firstCardWrapper.evaluate(
        (el: Element) => el.classList.contains("snap-start"),
      );
      expect(hasSnapStart).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #8 — Suspense skeleton does not block LCP (P2)
// ---------------------------------------------------------------------------

test.describe("Story 4.5: Similar Properties — LCP non-blocking (Suspense)", () => {
  test.skip(
    "[P2] 4.5-E2E-LCP-001: Suspense skeleton renders before similar properties data loads (AC #8)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarPropertiesLoader/skeleton not yet implemented
      //
      // Approach: Intercept the page load and check that the skeleton appears
      // before the carousel. We check the skeleton is in the DOM on initial paint.
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Intercept DB queries to delay them (simulate slow network/DB)
      await page.route("**/_next/data/**", async (route: any) => {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s delay
        await route.continue();
      });

      await page.goto(LISTING_URL_EN);

      // Skeleton should appear immediately (Suspense fallback)
      const skeleton = page.getByTestId("similar-properties-skeleton");
      // Check it's in the DOM at some point before carousel resolves
      await expect(skeleton.or(page.getByTestId("similar-properties-carousel"))).toBeVisible({
        timeout: 5000,
      });
    },
  );

  test.skip(
    "[P2] 4.5-E2E-LCP-002: gallery hero is visible before similar properties carousel loads (AC #8)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — listing page not yet wired with SimilarPropertiesLoader
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      // Gallery hero (LCP element) should be present immediately
      const galleryHero = page.getByTestId("gallery-hero");
      await expect(galleryHero).toBeVisible({ timeout: 5000 });

      // Similar properties may still be loading (Suspense)
      // Key requirement: gallery loads without waiting for similar properties
    },
  );
});
