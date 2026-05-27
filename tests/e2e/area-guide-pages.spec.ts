/**
 * Story 6.1: Area Guide Pages — E2E Test Scaffolds
 *
 * TDD RED PHASE — all tests use test.skip() and will FAIL until:
 *   1. Area guide page is implemented (src/app/[locale]/areas/[slug]/page.tsx)
 *   2. Area index page is implemented (src/app/[locale]/areas/page.tsx)
 *   3. AreaGuideHero, AreaGuideDescription, AreaGuideTabs components exist
 *   4. DB queries for areas are implemented (src/lib/db/queries/areas.ts)
 *   5. Areas table is seeded with ≥3 areas including metadata
 *   6. Playwright framework is configured
 *
 * Test IDs from test-design-epic-6.md:
 *   6.1-E2E-001 — Description always visible (not behind tab) (AC #2, P0, R-003)
 *   6.1-E2E-002 — Description present in SSG HTML (no JS) (AC #2, P0, R-003)
 *   6.1-E2E-003 — Properties tab shows filtered grid (AC #4, P0)
 *   6.1-E2E-004 — Hero renders area name as h1 (AC #1, P1)
 *   6.1-E2E-005 — Agents tab shows AgentCards (AC #5, P1)
 *   6.1-E2E-006 — Similar Areas section renders (AC #3, P1)
 *   6.1-E2E-007 — CommunityCards with gold border (AC #6, P1)
 *   6.1-E2E-008 — Area index page lists all areas (AC #7, P1)
 *   6.1-E2E-009 — Spanish locale renders correctly (AC #9, P2)
 *   6.1-E2E-010 — Lighthouse performance ≥ 80 (P3)
 *
 * Activation instructions for the dev implementing Story 6.1:
 *   1. Remove test.skip from the test you are implementing
 *   2. Run: npx playwright test tests/e2e/area-guide-pages.spec.ts
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

const AREA_GUIDE_URL_EN = "/en/areas/perez-zeledon";
const AREA_GUIDE_URL_ES = "/es/areas/perez-zeledon";
const AREA_INDEX_URL_EN = "/en/areas";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ---------------------------------------------------------------------------
// 6.1-E2E-001 — Description always visible (AC #2, P0, R-003)
// ---------------------------------------------------------------------------

test.describe("Story 6.1: Area Guide Pages E2E (ATDD — RED PHASE)", () => {
  test.skip(
    "[P0] 6.1-E2E-001: area guide description is always visible (not behind a tab) for SEO indexing",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — area guide page not yet implemented
      // Risk R-003: Description behind tab kills SEO indexing of lifestyle narrative
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      // Description section MUST be visible in viewport without clicking any tab
      const description = page.getByTestId("area-guide-description");
      await expect(description).toBeVisible({ timeout: 10000 });

      // Verify it has meaningful content (not empty)
      const text = await description.textContent();
      expect(text!.trim().length).toBeGreaterThan(50);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-002 — Description in SSG HTML (AC #2, P0, R-003)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 6.1-E2E-002: area guide SSG HTML contains description text (no JS execution needed)",
    async ({ request }: any) => {
      // THIS TEST WILL FAIL — area guide page not yet implemented
      // Risk R-003: Client-rendered description is invisible to Googlebot
      // Fetch raw HTML without JS execution to verify SSG output
      const response = await request.get(AREA_GUIDE_URL_EN);
      expect(response.status()).toBe(200);

      const html = await response.text();

      // The description data-testid must be present in the raw HTML
      expect(html).toContain('data-testid="area-guide-description"');

      // Description content must be in the initial HTML (not client-rendered)
      // At minimum, the description section should have substantive text
      // that matches the area's lifestyle narrative from the DB
      expect(html).toMatch(/Pérez Zeledón|perez.zeledon/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-003 — Properties tab shows filtered grid (AC #4, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 6.1-E2E-003: Properties tab shows property grid filtered to this area",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — area guide tabs not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      // Click the Properties tab
      const tabsContainer = page.getByTestId("area-guide-tabs");
      await expect(tabsContainer).toBeVisible({ timeout: 10000 });

      // Find and click the Properties tab trigger
      const propertiesTab = tabsContainer.getByRole("tab", {
        name: /properties/i,
      });
      await propertiesTab.click();

      // Properties tab panel should be visible
      const propertiesPanel = page.getByTestId("area-guide-properties-tab");
      await expect(propertiesPanel).toBeVisible();

      // PropertyCards should be rendered within the panel
      // (If area has properties, cards should be visible; if zero, empty state shows)
      const cards = propertiesPanel.getByTestId("property-card");
      const emptyState = propertiesPanel.locator(
        '[data-testid="area-no-properties"]',
      );

      const cardCount = await cards.count();
      if (cardCount === 0) {
        // AC #11: Empty state message when zero properties
        await expect(emptyState).toBeVisible();
      } else {
        await expect(cards.first()).toBeVisible();
      }
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-004 — Hero renders area name as h1 (AC #1, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-004: area guide hero renders hero image with area name as h1",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AreaGuideHero not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      // Hero section must be visible
      const hero = page.getByTestId("area-guide-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // h1 must be inside the hero and contain the area name
      const h1 = hero.locator("h1");
      await expect(h1).toBeVisible();
      const headingText = await h1.textContent();
      expect(headingText!.toLowerCase()).toContain("pérez zeledón");

      // Hero should have an image or gradient fallback (AC #12)
      const heroImage = hero.locator("img");
      const hasImage = (await heroImage.count()) > 0;
      if (hasImage) {
        await expect(heroImage.first()).toBeVisible();
      }
      // If no image, gradient fallback is CSS-only — validated via visual check
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-005 — Agents tab shows AgentCards (AC #5, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-005: area guide Agents tab shows AgentCards for agents covering this area",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AreaGuideTabs not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      const tabsContainer = page.getByTestId("area-guide-tabs");
      await expect(tabsContainer).toBeVisible({ timeout: 10000 });

      // Click the Agents tab
      const agentsTab = tabsContainer.getByRole("tab", { name: /agents/i });
      await agentsTab.click();

      // Agents tab panel should show AgentCards
      const agentsPanel = page.getByTestId("area-guide-agents-tab");
      await expect(agentsPanel).toBeVisible();

      // At least one AgentCard should be visible (MVP: all agents serve all areas)
      const agentCards = agentsPanel.getByTestId("agent-card");
      await expect(agentCards.first()).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-006 — Similar Areas section (AC #3, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-006: area guide Similar Areas tab shows SimilarAreasSlider with nearby area cards",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SimilarAreasSlider not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      const tabsContainer = page.getByTestId("area-guide-tabs");
      await expect(tabsContainer).toBeVisible({ timeout: 10000 });

      // Click the Similar Areas tab
      const similarTab = tabsContainer.getByRole("tab", {
        name: /similar/i,
      });
      await similarTab.click();

      // Similar Areas tab panel should be visible
      const similarPanel = page.getByTestId("area-guide-similar-tab");
      await expect(similarPanel).toBeVisible();

      // Should contain area cards (same region, excluding current area)
      const areaCards = similarPanel.locator("[data-testid]");
      const count = await areaCards.count();
      expect(count).toBeGreaterThan(0);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-007 — CommunityCards with gold border (AC #6, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-007: area guide shows linked CommunityCards with gold border for communities in this area",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — CommunityCard not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      // Wait for page to load
      const hero = page.getByTestId("area-guide-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Community cards within the area guide should have gold border
      const communityCards = page.locator(
        '[data-testid="community-card"]',
      );
      const count = await communityCards.count();

      // If communities exist for this area, verify gold border
      if (count > 0) {
        const firstCard = communityCards.first();
        await expect(firstCard).toBeVisible();

        // Verify gold border color (--color-gold: #C2A661)
        const borderColor = await firstCard.evaluate((el: Element) => {
          return window.getComputedStyle(el).borderColor;
        });
        // RGB equivalent of #C2A661 is rgb(194, 166, 97)
        expect(borderColor).toContain("194, 166, 97");
      }
      // If no communities linked yet (placeholder), test passes vacuously
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-008 — Area index page (AC #7, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-008: area index page lists all areas with hero cards, region badge, property count, description snippet",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — area index page not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_INDEX_URL_EN);

      // At least one area index card should be visible
      const areaCards = page.getByTestId("area-index-card");
      await expect(areaCards.first()).toBeVisible({ timeout: 10000 });

      const firstCard = areaCards.first();

      // Card should show area name
      const name = firstCard.locator("h2, h3");
      await expect(name).toBeVisible();
      const nameText = await name.textContent();
      expect(nameText!.trim().length).toBeGreaterThan(0);

      // Card should show region badge (Mountain or Coast)
      const badge = firstCard.locator('[data-testid="region-badge"]');
      await expect(badge).toBeVisible();
      const badgeText = await badge.textContent();
      expect(badgeText).toMatch(/Mountain|Coast|Montaña|Costa/i);

      // Card should show property count
      const propCount = firstCard.locator(
        '[data-testid="area-property-count"]',
      );
      await expect(propCount).toBeVisible();

      // Card should show description snippet
      const snippet = firstCard.locator(
        '[data-testid="area-description-snippet"]',
      );
      await expect(snippet).toBeVisible();
      const snippetText = await snippet.textContent();
      expect(snippetText!.trim().length).toBeGreaterThan(10);
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-009 — Spanish locale (AC #9, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 6.1-E2E-009: area guide page content displays in ES when locale is Spanish",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — i18n for area guide not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_ES);

      // Hero section should be visible
      const hero = page.getByTestId("area-guide-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // h1 should contain the Spanish name
      const h1 = hero.locator("h1");
      await expect(h1).toBeVisible();

      // Tab labels should be in Spanish
      const tabsContainer = page.getByTestId("area-guide-tabs");
      await expect(tabsContainer).toBeVisible();

      // Spanish tab labels: "Propiedades", "Agentes", "Áreas Similares"
      const tabs = tabsContainer.getByRole("tab");
      const tabTexts: string[] = [];
      for (let i = 0; i < (await tabs.count()); i++) {
        tabTexts.push((await tabs.nth(i).textContent())!);
      }
      // At least one tab label should be in Spanish
      const hasSpanish = tabTexts.some(
        (t: string) =>
          /propiedades|agentes|similares/i.test(t),
      );
      expect(hasSpanish).toBe(true);

      // Description should be in Spanish (the ES version of the narrative)
      const description = page.getByTestId("area-guide-description");
      await expect(description).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-011 — Empty state for zero properties (AC #11, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-011: area guide with zero properties shows localized empty state message",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — empty state not yet implemented
      // This test requires an area with zero properties seeded in the DB
      await page.setViewportSize(DESKTOP_VIEWPORT);
      // Navigate to an area known to have zero properties
      await page.goto("/en/areas/empty-test-area");

      const tabsContainer = page.getByTestId("area-guide-tabs");
      await expect(tabsContainer).toBeVisible({ timeout: 10000 });

      // Click Properties tab
      const propertiesTab = tabsContainer.getByRole("tab", {
        name: /properties/i,
      });
      await propertiesTab.click();

      // Empty state message should be visible
      const propertiesPanel = page.getByTestId("area-guide-properties-tab");
      await expect(propertiesPanel).toBeVisible();

      const emptyMessage = propertiesPanel.locator(
        '[data-testid="area-no-properties"]',
      );
      await expect(emptyMessage).toBeVisible();
      const messageText = await emptyMessage.textContent();
      expect(messageText!.toLowerCase()).toMatch(
        /no properties|sin propiedades/,
      );
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-012 — Hero gradient fallback (AC #12, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 6.1-E2E-012: area without hero image renders gradient placeholder (navy-to-cream)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — gradient fallback not yet implemented
      // Requires an area with heroImageUrl = null seeded in the DB
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/areas/no-hero-test-area");

      const hero = page.getByTestId("area-guide-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Should NOT have an <img> element (no hero image)
      const heroImage = hero.locator("img");
      const imageCount = await heroImage.count();
      expect(imageCount).toBe(0);

      // Should have a gradient background (CSS check)
      const bgImage = await hero.evaluate((el: Element) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      // Gradient should include navy-ish and cream-ish colors
      expect(bgImage).toContain("gradient");
    },
  );

  // ---------------------------------------------------------------------------
  // 6.1-E2E-013 — WAI-ARIA Tabs pattern (AC #13, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 6.1-E2E-013: area guide tabs follow WAI-ARIA Tabs pattern with keyboard navigation",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — WAI-ARIA tabs not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AREA_GUIDE_URL_EN);

      const tabsContainer = page.getByTestId("area-guide-tabs");
      await expect(tabsContainer).toBeVisible({ timeout: 10000 });

      // Verify role="tablist" on the tab container
      const tablist = tabsContainer.getByRole("tablist");
      await expect(tablist).toBeVisible();

      // Verify role="tab" on each tab trigger
      const tabs = tablist.getByRole("tab");
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(3); // Properties, Agents, Similar Areas

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
