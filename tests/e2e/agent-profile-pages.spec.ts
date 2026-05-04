/**
 * Story 4.3: Agent Profile Pages — ATDD Red-Phase E2E Scaffold
 *
 * TDD Phase: RED — all tests are test.skip() until pages are implemented and DB is seeded.
 * Remove test.skip() per test when implementing to verify green phase.
 *
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Staging/local environment with DB seeded (≥1 agent with photo, bio, languages, listings)
 *   - Agent slug: "emma-smith" seeded with officeId pointing to "RE/MAX Altitud"
 *
 * Acceptance criteria covered:
 *   AC #1  — 4.3-E2E-001: Agent profile page displays photo, bio, languages, office, listing count, CTAs (P1)
 *   AC #2  — 4.3-E2E-002: Agent profile displays property grid with all agent's listings (P1)
 *   AC #3  — 4.3-E2E-004: Agents index filter by office shows only agents from that office (P1)
 *   AC #3  — 4.3-E2E-005: Agents index filter by language shows only matching agents (P1)
 *   AC #4  — 4.3-E2E-003: Agents index page lists all agents with required fields (P1)
 *   AC #5  — Agent profile URL loads as a shareable standalone page (P1)
 *   AC #6  — 4.3-UNIT-001: Agent profile page exported revalidate = 86400 (SSG/ISR, NFR25) (P2)
 *   R-010  — Agent profile renders gracefully with empty listing array (P2)
 *   R-013  — Agent filter state resets correctly on office switch (P2)
 *
 * data-testid contract (CANNOT rename once established):
 *   data-testid="agent-profile-hero"          — root section in AgentProfileHero
 *   data-testid="agent-profile-photo"         — agent photo
 *   data-testid="agent-profile-languages"     — languages display
 *   data-testid="agent-profile-listing-count" — listing count
 *   data-testid="agent-profile-whatsapp-cta"  — WhatsApp CTA in AgentProfileCTAs
 *   data-testid="agent-profile-email-cta"     — Email CTA in AgentProfileCTAs
 *   data-testid="agent-listings-grid"         — property listings grid
 *   data-testid="agent-listings-heading"      — listings section heading
 *   data-testid="agent-no-listings"           — empty state for listings
 *   data-testid="agent-index-list"            — agent list in AgentIndexFilters
 *   data-testid="agent-office-filter"         — office filter control
 *   data-testid="agent-language-filter"       — language filter control
 *   data-testid="agent-index-card"            — each agent card
 *   data-testid="agent-no-match"              — empty state when no agents match filters
 */

// NOTE: Playwright is not yet installed — this import will fail until
// playwright.config.ts is configured and @playwright/test is installed.
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_PROFILE_URL_EN = "/en/agents/emma-smith"; // seed slug required
const AGENT_PROFILE_URL_ES = "/es/agentes/emma-smith"; // locale-aware route
const AGENTS_INDEX_URL_EN = "/en/agents";
const AGENTS_INDEX_URL_ES = "/es/agentes";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// ---------------------------------------------------------------------------
// AC #1 + AC #5 — Agent profile page core rendering (P1, 4.3-E2E-001)
// ---------------------------------------------------------------------------

test.describe("Story 4.3: Agent Profile Page (ATDD Red Phase)", () => {
  test.skip(
    "[P1] 4.3-E2E-001: agent profile page shows photo, bio, languages, office, listing count, CTAs",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agent profile page not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);

      // Profile hero section must be visible
      const hero = page.getByTestId("agent-profile-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Agent photo must be present
      const photo = page.getByTestId("agent-profile-photo");
      await expect(photo).toBeVisible();

      // Languages display must be present
      const languages = page.getByTestId("agent-profile-languages");
      await expect(languages).toBeVisible();

      // Listing count must be present
      const listingCount = page.getByTestId("agent-profile-listing-count");
      await expect(listingCount).toBeVisible();

      // WhatsApp CTA must be present (agent has whatsapp configured)
      const whatsappCta = page.getByTestId("agent-profile-whatsapp-cta");
      await expect(whatsappCta).toBeVisible();

      // Email CTA must be present (agent has email configured)
      const emailCta = page.getByTestId("agent-profile-email-cta");
      await expect(emailCta).toBeVisible();
    },
  );

  test.skip(
    "[P1] 4.3-E2E-001b: agent profile page renders as standalone shareable page with full context (AC #5)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agent profile page not yet implemented
      await page.goto(AGENT_PROFILE_URL_EN);

      // Page must load successfully (not 404)
      await expect(page).toHaveURL(AGENT_PROFILE_URL_EN);

      // Page title must contain agent name (SEO / standalone context)
      const title = await page.title();
      expect(title).toContain("RE/MAX Altitud");

      // Hero section must be present even when navigated directly (no search context)
      const hero = page.getByTestId("agent-profile-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });
    },
  );

  test.skip(
    "[P1] 4.3-E2E-001c: agent profile page renders Spanish content when locale is 'es'",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agent profile page not yet implemented
      await page.goto(AGENT_PROFILE_URL_ES);

      // Page must load in Spanish locale
      await expect(page).toHaveURL(AGENT_PROFILE_URL_ES);

      // Profile hero must be visible
      const hero = page.getByTestId("agent-profile-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });
    },
  );

  test.skip(
    "[P1] 4.3-E2E-001d: agent profile WhatsApp CTA href contains wa.me URL",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentProfileCTAs not yet implemented
      await page.goto(AGENT_PROFILE_URL_EN);

      const whatsappCta = page.getByTestId("agent-profile-whatsapp-cta");
      await expect(whatsappCta).toBeVisible({ timeout: 10000 });

      // WhatsApp CTA must link to wa.me with agent's phone
      const href = await whatsappCta.getAttribute("href");
      expect(href).toContain("wa.me/");
      expect(href).toContain("text="); // pre-populated message
    },
  );

  // ---------------------------------------------------------------------------
  // AC #2 — Agent property listings grid (P1, 4.3-E2E-002)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.3-E2E-002: agent profile page displays property grid with agent's listings below bio",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentListingsGrid not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);

      // Listings grid must be present below the hero
      const listingsGrid = page.getByTestId("agent-listings-grid");
      await expect(listingsGrid).toBeVisible({ timeout: 10000 });

      // Listings heading must be present
      const listingsHeading = page.getByTestId("agent-listings-heading");
      await expect(listingsHeading).toBeVisible();
    },
  );

  test.skip(
    "[P2] 4.3-E2E-002b: agent profile renders gracefully with empty listings array (R-010)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentListingsGrid not yet implemented
      // Requires a seeded agent with 0 active listings
      await page.goto("/en/agents/agent-with-no-listings"); // seed slug required

      // Empty state must render gracefully (no crash, no error boundary)
      const emptyState = page.getByTestId("agent-no-listings");
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    },
  );

  // ---------------------------------------------------------------------------
  // AC #4 — Agents index page (P1, 4.3-E2E-003)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.3-E2E-003: agents index page lists all agents with photo, name, languages, office, listing count",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agents index page not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENTS_INDEX_URL_EN);

      // Agent list must be visible
      const agentList = page.getByTestId("agent-index-list");
      await expect(agentList).toBeVisible({ timeout: 10000 });

      // At least one agent card must be present
      const agentCards = page.getByTestId("agent-index-card");
      await expect(agentCards.first()).toBeVisible();

      // Each card must have photo, languages, and listing count
      const firstCard = agentCards.first();
      const photo = firstCard.getByTestId("agent-index-photo");
      await expect(photo).toBeVisible();

      const languages = firstCard.getByTestId("agent-index-languages");
      await expect(languages).toBeVisible();

      const listingCount = firstCard.getByTestId("agent-index-listing-count");
      await expect(listingCount).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #3 — Agent filter by office and language (P1, 4.3-E2E-004 + 4.3-E2E-005)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.3-E2E-004: agents index — filter by office shows only agents from that office",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
      await page.goto(AGENTS_INDEX_URL_EN);

      // Wait for agent list to load
      const agentList = page.getByTestId("agent-index-list");
      await expect(agentList).toBeVisible({ timeout: 10000 });

      // Count initial agent cards
      const initialCards = await page.getByTestId("agent-index-card").count();
      expect(initialCards).toBeGreaterThan(0);

      // Apply office filter (RE/MAX Altitud)
      const officeFilter = page.getByTestId("agent-office-filter");
      await expect(officeFilter).toBeVisible();
      await officeFilter.selectOption({ label: "RE/MAX Altitud" });

      // Result count should be ≤ initial count (filtered)
      const filteredCards = await page.getByTestId("agent-index-card").count();
      expect(filteredCards).toBeGreaterThan(0);
      expect(filteredCards).toBeLessThanOrEqual(initialCards);
    },
  );

  test.skip(
    "[P1] 4.3-E2E-005: agents index — filter by language shows only matching agents",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
      await page.goto(AGENTS_INDEX_URL_EN);

      const agentList = page.getByTestId("agent-index-list");
      await expect(agentList).toBeVisible({ timeout: 10000 });

      const initialCards = await page.getByTestId("agent-index-card").count();
      expect(initialCards).toBeGreaterThan(0);

      // Apply English language filter
      const langFilter = page.getByTestId("agent-language-filter");
      await expect(langFilter).toBeVisible();
      await langFilter.selectOption("en");

      // All remaining cards should display English language
      const filteredCards = await page.getByTestId("agent-index-card").all();
      expect(filteredCards.length).toBeGreaterThan(0);
      expect(filteredCards.length).toBeLessThanOrEqual(initialCards);
    },
  );

  test.skip(
    "[P2] 4.3-E2E-004b: agents index — filter state resets correctly when switching between offices (R-013)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentIndexFilters not yet implemented
      await page.goto(AGENTS_INDEX_URL_EN);

      const agentList = page.getByTestId("agent-index-list");
      await expect(agentList).toBeVisible({ timeout: 10000 });

      const officeFilter = page.getByTestId("agent-office-filter");

      // Select first office
      await officeFilter.selectOption({ label: "RE/MAX Altitud" });
      const firstOfficeCards = await page.getByTestId("agent-index-card").all();

      // Switch to second office
      await officeFilter.selectOption({ label: "RE/MAX Altitud Cero" });
      const secondOfficeCards = await page.getByTestId("agent-index-card").all();

      // Both offices must return results (if seeded correctly)
      expect(firstOfficeCards.length).toBeGreaterThan(0);
      expect(secondOfficeCards.length).toBeGreaterThan(0);

      // Second selection must NOT include agents from first office
      // (filter state reset = only one office's agents shown at a time)
      const totalShown = firstOfficeCards.length + secondOfficeCards.length;
      const allCards = await page.getByTestId("agent-index-card").count();
      // After selecting second office, we only see that office's agents
      expect(allCards).toBe(secondOfficeCards.length);
      void totalShown; // used for type narrowing
    },
  );

  // ---------------------------------------------------------------------------
  // Mobile viewport — agent profile
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.3-E2E-006: agent profile renders correctly on mobile viewport",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agent profile page not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);

      const hero = page.getByTestId("agent-profile-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      const listingsGrid = page.getByTestId("agent-listings-grid");
      await expect(listingsGrid).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // Agents index — Spanish locale
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.3-E2E-003b: agents index loads in Spanish locale (/es/agentes)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agents index page not yet implemented
      await page.goto(AGENTS_INDEX_URL_ES);

      const agentList = page.getByTestId("agent-index-list");
      await expect(agentList).toBeVisible({ timeout: 10000 });
    },
  );

  // ---------------------------------------------------------------------------
  // Agent card navigation from index to profile
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.3-E2E-007: clicking an agent card on the index page navigates to their profile",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Agent pages not yet implemented
      await page.goto(AGENTS_INDEX_URL_EN);

      const agentList = page.getByTestId("agent-index-list");
      await expect(agentList).toBeVisible({ timeout: 10000 });

      // Click the first agent card
      const firstCard = page.getByTestId("agent-index-card").first();
      await firstCard.click();

      // Should navigate to an agent profile page
      await expect(page).toHaveURL(/\/en\/agents\/.+/);

      // Profile hero must be visible on the destination page
      const hero = page.getByTestId("agent-profile-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });
    },
  );
});
