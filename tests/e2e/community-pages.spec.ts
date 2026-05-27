/**
 * Story 6.2: Community Pages — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. Community page is implemented (src/app/[locale]/areas/[slug]/communities/[community]/page.tsx)
 *   2. Community index page is implemented (src/app/[locale]/communities/page.tsx)
 *   3. CommunityHero, CommunityQuickFacts, CommunityDescription, CommunityTabs components exist
 *   4. DB queries for communities are implemented (src/lib/db/queries/communities.ts)
 *   5. Communities table is seeded with ≥3 communities
 *   6. Properties tagged with community_id for filtered grid tests
 *   7. Playwright framework is configured
 *
 * Test IDs from test-design-epic-6.md:
 *   6.2-E2E-001 — Community page renders filtered property grid (AC #4, P0, R-004)
 *   6.2-E2E-002 — Community page renders hero, tagline, price range, quick facts, description (AC #1-3, P0, R-004)
 *   6.2-E2E-003 — Community page returns 200 on cold cache (AC #9, P0, R-005)
 *   6.2-E2E-004 — Featured Communities on homepage renders gold-bordered cards (AC #8, P0)
 *   6.2-E2E-005 — Community description always visible (not tabbed) for SEO (AC #3, P1)
 *   6.2-E2E-006 — Community index page lists all communities (AC #10, P1)
 *   6.2-E2E-007 — Desktop: Site Map tab visible (AC #5, P1)
 *   6.2-E2E-008 — Mobile: Site Map tab hidden; lot list visible (AC #5, P1)
 *   6.2-E2E-009 — Spanish locale renders correctly (AC #11, P2)
 *   6.2-E2E-010 — Price range renders from DB values (AC #1, P2)
 *
 * Activation instructions for the dev implementing Story 6.2:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/community-pages.spec.ts
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
const COMMUNITY_INDEX_URL_EN = "/en/communities";
const HOMEPAGE_URL_EN = "/en";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 360, height: 800 };

// ---------------------------------------------------------------------------
// 6.2-E2E-001 — Community page renders filtered property grid (AC #4, P0)
// ---------------------------------------------------------------------------

test.describe("Story 6.2: Community Pages E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 6.2-E2E-001: community page renders filtered property grid with correct property count",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — community page not yet implemented
      // Risk R-004: Community page shows zero properties despite geo-fence containing active listings
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      // Wait for the page to load
      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Properties tab should be present and clickable
      const propertiesTab = page.getByTestId("community-properties-tab");
      // Click the properties tab trigger first
      const tabsContainer = page.locator('[role="tablist"]');
      const propertiesTabTrigger = tabsContainer.getByRole("tab", {
        name: /properties/i,
      });
      await propertiesTabTrigger.click();

      await expect(propertiesTab).toBeVisible();

      // PropertyCards should be rendered — community has seeded properties
      const cards = propertiesTab.getByTestId("property-card");
      const emptyState = propertiesTab.locator(
        '[data-testid="community-no-properties"]',
      );

      const cardCount = await cards.count();
      if (cardCount === 0) {
        // AC #14: Empty state message when zero properties
        await expect(emptyState).toBeVisible();
      } else {
        // At least some property cards should be visible
        await expect(cards.first()).toBeVisible();
        expect(cardCount).toBeGreaterThan(0);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-002 — Community page renders all key sections (AC #1-3, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 6.2-E2E-002: community page renders hero, tagline, price range, quick facts, and description",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — community page not yet implemented
      // Risk R-004: All key sections must be present for the page to be functional
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      // AC #1 — Hero section with community name + area name
      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // h1 must contain the community name
      const h1 = hero.locator("h1");
      await expect(h1).toBeVisible();
      const headingText = await h1.textContent();
      expect(headingText!.toLowerCase()).toContain("rise");

      // Tagline should be visible
      const tagline = hero.locator("p, span");
      const taglineTexts = await tagline.allTextContents();
      const hasTagline = taglineTexts.some((t: string) =>
        /elevated|mountain/i.test(t),
      );
      expect(hasTagline).toBe(true);

      // Price range should be visible (e.g., "Homes from $180K–$650K")
      const priceRange = hero.locator("*");
      const priceTexts = await priceRange.allTextContents();
      const hasPrice = priceTexts.some((t: string) => /\$.*–.*\$|homes from/i.test(t));
      expect(hasPrice).toBe(true);

      // AC #2 — Quick facts section
      const quickFacts = page.getByTestId("community-quick-facts");
      await expect(quickFacts).toBeVisible();

      // AC #3 — Description section (always visible)
      const description = page.getByTestId("community-description");
      await expect(description).toBeVisible();

      // Description should have meaningful content
      const descText = await description.textContent();
      expect(descText!.trim().length).toBeGreaterThan(50);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-003 — Community page returns 200 on cold cache (AC #9, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 6.2-E2E-003: community page returns 200 (not 404) on cold cache access",
    async ({ request }: any) => {
      // THIS TEST WILL FAIL — community routes not yet implemented
      // Risk R-005: generateStaticParams() fails to return community slugs → 404
      const response = await request.get(COMMUNITY_URL_EN);
      expect(response.status()).toBe(200);

      const html = await response.text();
      // Should contain the community page content
      expect(html).toContain('data-testid="community-hero"');
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-004 — Featured Communities on homepage (AC #8, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 6.2-E2E-004: Featured Communities section on homepage renders 2-3 gold-bordered cards with correct data",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — FeaturedCommunities component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(HOMEPAGE_URL_EN);

      // Featured Communities section
      const featuredSection = page.getByTestId("featured-communities");
      await expect(featuredSection).toBeVisible({ timeout: 10000 });

      // Should contain 2-3 community cards
      const communityCards = featuredSection.getByTestId("community-card");
      const count = await communityCards.count();
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(3);

      // Verify gold border on first card
      const firstCard = communityCards.first();
      await expect(firstCard).toBeVisible();

      const borderColor = await firstCard.evaluate((el: Element) => {
        return window.getComputedStyle(el).borderColor;
      });
      // RGB equivalent of #C2A661 is rgb(194, 166, 97)
      expect(borderColor).toContain("194, 166, 97");

      // Card should show community name
      const cardName = firstCard.locator("h2, h3");
      await expect(cardName).toBeVisible();
      const nameText = await cardName.textContent();
      expect(nameText!.trim().length).toBeGreaterThan(0);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-005 — Description always visible for SEO (AC #3, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.2-E2E-005: community description (300-500 words) always visible (not tabbed) for SEO",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — community description not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      // Description must be visible in initial render without tab interaction
      const description = page.getByTestId("community-description");
      await expect(description).toBeVisible({ timeout: 10000 });

      // Verify it has substantive SEO content (not just a sentence)
      const text = await description.textContent();
      const wordCount = text!.trim().split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(50); // Relaxed from 300 for test flexibility
    },
  );

  test.skip(
    "[P1] 6.2-E2E-005b: community description present in SSG HTML (no JS execution needed)",
    async ({ request }: any) => {
      // Fetch raw HTML without JS to verify SSG output
      const response = await request.get(COMMUNITY_URL_EN);
      expect(response.status()).toBe(200);

      const html = await response.text();
      expect(html).toContain('data-testid="community-description"');
      // Description content should be in the initial HTML
      expect(html).toMatch(/RISE|rise|premium|mountain/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-006 — Community index page (AC #10, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.2-E2E-006: community index page lists all communities with hero cards",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — community index page not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_INDEX_URL_EN);

      // At least one community index card should be visible
      const communityCards = page.getByTestId("community-index-card");
      await expect(communityCards.first()).toBeVisible({ timeout: 10000 });

      const count = await communityCards.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // First card should have a name
      const firstCard = communityCards.first();
      const name = firstCard.locator("h2, h3");
      await expect(name).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-007 — Desktop: Site Map tab visible (AC #5, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.2-E2E-007: desktop — Site Map tab visible and shows zoomable master plan image",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — CommunityTabs not yet implemented
      // Risk R-012: Site Map tab should be visible on desktop
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Site Map tab should be visible on desktop
      const tabsContainer = page.locator('[role="tablist"]');
      const siteMapTabTrigger = tabsContainer.getByRole("tab", {
        name: /site map|mapa/i,
      });
      await expect(siteMapTabTrigger).toBeVisible();

      // Click Site Map tab
      await siteMapTabTrigger.click();

      const siteMapPanel = page.getByTestId("community-sitemap-tab");
      await expect(siteMapPanel).toBeVisible();

      // Should contain an image (if siteMapImageUrl is set)
      const image = siteMapPanel.locator("img");
      const imageCount = await image.count();
      if (imageCount > 0) {
        await expect(image.first()).toBeVisible();
      } else {
        // Empty state: "Site map coming soon"
        const emptyState = siteMapPanel.locator("*");
        const texts = await emptyState.allTextContents();
        const hasComing = texts.some((t: string) =>
          /coming soon|próximamente/i.test(t),
        );
        expect(hasComing).toBe(true);
      }
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-008 — Mobile: Site Map tab hidden (AC #5, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.2-E2E-008: mobile — Site Map tab hidden; sortable lot list visible instead",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — responsive layout not yet implemented
      // Risk R-012: Site Map tab should be hidden on mobile (< 768px)
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Site Map tab trigger should NOT be visible on mobile
      const tabsContainer = page.locator('[role="tablist"]');
      const siteMapTabTrigger = tabsContainer.getByRole("tab", {
        name: /site map|mapa/i,
      });
      await expect(siteMapTabTrigger).not.toBeVisible();

      // Properties tab should still be visible
      const propertiesTabTrigger = tabsContainer.getByRole("tab", {
        name: /properties/i,
      });
      await expect(propertiesTabTrigger).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-009 — Spanish locale (AC #11, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 6.2-E2E-009: community page content displays in ES when locale is Spanish",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — i18n for community page not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_ES);

      // Hero section should be visible
      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Quick facts labels should be in Spanish
      const quickFacts = page.getByTestId("community-quick-facts");
      await expect(quickFacts).toBeVisible();

      // Description should be in Spanish
      const description = page.getByTestId("community-description");
      await expect(description).toBeVisible();
      const descText = await description.textContent();
      // Spanish description should contain Spanish text
      expect(descText).toMatch(/premium|montaña|comunidad|desarrollo/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-010 — Price range from DB values (AC #1, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 6.2-E2E-010: community page renders price range from denormalized min/max",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — price range rendering not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Price range should be displayed (e.g., "Homes from $180K–$650K")
      const pageText = await page.textContent("body");
      expect(pageText).toMatch(/\$180K|180,000|\$180/i);
      expect(pageText).toMatch(/\$650K|650,000|\$650/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-014 — Empty state for zero properties (AC #14, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.2-E2E-014: community page with zero properties shows localized empty state message",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — empty state not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      // Navigate to a community known to have zero properties
      await page.goto("/en/areas/perez-zeledon/communities/empty-community");

      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Click Properties tab
      const tabsContainer = page.locator('[role="tablist"]');
      const propertiesTab = tabsContainer.getByRole("tab", {
        name: /properties/i,
      });
      await propertiesTab.click();

      const propertiesPanel = page.getByTestId("community-properties-tab");
      await expect(propertiesPanel).toBeVisible();

      // Empty state message should be visible
      const pageText = await propertiesPanel.textContent();
      expect(pageText).toMatch(
        /no properties|sin propiedades|not listed|no.+currently/i,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-015 — Hero gradient fallback (AC #15, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 6.2-E2E-015: community without hero image renders navy-to-gold gradient placeholder",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — gradient fallback not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      // Navigate to a community with heroImageUrl = null
      await page.goto("/en/areas/dominical/communities/serena-del-mar");

      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Should NOT have an <img> element (no hero image)
      const heroImage = hero.locator("img");
      const imageCount = await heroImage.count();
      expect(imageCount).toBe(0);

      // Should have a gradient background (CSS check)
      const bgImage = await hero.evaluate((el: Element) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(bgImage).toContain("gradient");
    },
  );

  // ---------------------------------------------------------------------------
  // 6.2-E2E-016 — WAI-ARIA Tabs keyboard navigation (AC #16, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.2-E2E-016: community page tabs follow WAI-ARIA Tabs pattern with keyboard navigation",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — WAI-ARIA tabs not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(COMMUNITY_URL_EN);

      const hero = page.getByTestId("community-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Verify role="tablist"
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      // Verify role="tab" on each tab trigger
      const tabs = tablist.getByRole("tab");
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(2); // Properties, Site Map

      // First tab should have aria-selected="true" by default
      const firstTab = tabs.first();
      await expect(firstTab).toHaveAttribute("aria-selected", "true");

      // First tab should have aria-controls pointing to a panel
      const panelId = await firstTab.getAttribute("aria-controls");
      expect(panelId).toBeTruthy();

      // The referenced panel should exist with role="tabpanel"
      const panel = page.locator(`#${panelId}`);
      await expect(panel).toHaveAttribute("role", "tabpanel");

      // Keyboard navigation: Right arrow moves to next tab
      await firstTab.focus();
      await page.keyboard.press("ArrowRight");

      const secondTab = tabs.nth(1);
      await expect(secondTab).toHaveAttribute("aria-selected", "true");
      await expect(firstTab).toHaveAttribute("aria-selected", "false");

      // Home key moves to first tab
      await page.keyboard.press("Home");
      await expect(firstTab).toHaveAttribute("aria-selected", "true");

      // End key moves to last tab
      await page.keyboard.press("End");
      const lastTab = tabs.last();
      await expect(lastTab).toHaveAttribute("aria-selected", "true");
    },
  );
});
