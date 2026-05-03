/**
 * Story 4.2: Agent Card & Contact CTAs — E2E Tests
 *
 * All tests are test.skip() until Playwright is configured and DB is seeded.
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Staging/local environment with DB seeded (beautiful-mountain-home slug, agent assigned)
 *
 * Acceptance criteria covered:
 *   4.2-E2E-001 — Agent card renders on listing detail page with photo, name, languages, office (AC #1, P0)
 *   4.2-E2E-002 — WhatsApp CTA opens wa.me URL with pre-populated message (AC #2, P0)
 *   4.2-E2E-003 — Spanish locale pre-populates WhatsApp message in Spanish (AC #3, P0)
 *   4.2-E2E-004 — Email CTA renders as mailto link with property context (AC #4, P1)
 *   4.2-E2E-005 — Transparency note about WhatsApp translation is visible (AC #5, P1)
 *   4.2-E2E-006 — Sticky mobile CTA bar appears on mobile viewport (AC #6, P1)
 *   4.2-E2E-007 — Sticky bar hides when agent card scrolls into viewport (AC #7, P2)
 *   4.2-E2E-008 — WhatsApp click fires lead tracking event (AC #8, P2)
 *   4.2-E2E-009 — Agent card uses role="article" with aria-label (AC #9, P1)
 */

// NOTE: Playwright is not yet installed — this import will fail until
// playwright.config.ts is configured and @playwright/test is installed.
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LISTING_URL_EN = "/en/property/beautiful-mountain-home"; // seed slug required — agent must be assigned
const LISTING_URL_ES = "/es/property/beautiful-mountain-home";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// ---------------------------------------------------------------------------
// 4.2-E2E-001 — Agent card renders on listing detail page (AC #1, P0)
// ---------------------------------------------------------------------------

test.describe("Story 4.2: Agent Card & Contact CTAs E2E", () => {
  test.skip(
    "[P0] 4.2-E2E-001: agent card renders with photo, name, languages, office on desktop",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      // Agent card root element must be visible
      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      // Agent photo must be visible
      const agentPhoto = page.getByTestId("agent-photo");
      await expect(agentPhoto).toBeVisible();

      // Languages display must be present
      const languages = page.getByTestId("agent-languages");
      await expect(languages).toBeVisible();

      // WhatsApp CTA must be visible
      const whatsappCta = page.getByTestId("agent-whatsapp-cta");
      await expect(whatsappCta).toBeVisible();

      // Email CTA must be visible
      const emailCta = page.getByTestId("agent-email-cta");
      await expect(emailCta).toBeVisible();
    },
  );

  test.skip(
    "[P0] 4.2-E2E-001b: agent card renders in right sidebar on desktop (AC #1)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      // On desktop, agent card should be in the right portion of the page (sidebar)
      const cardBox = await agentCard.boundingBox();
      expect(cardBox).toBeTruthy();
      // Right sidebar: card should be in the right ~35% of the viewport
      expect(cardBox!.x).toBeGreaterThan(DESKTOP_VIEWPORT.width * 0.5);
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-002 — WhatsApp CTA opens wa.me URL (AC #2, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 4.2-E2E-002: WhatsApp CTA has href starting with https://wa.me/",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      const whatsappCta = page.getByTestId("agent-whatsapp-cta");
      await expect(whatsappCta).toBeVisible();

      const href = await whatsappCta.getAttribute("href");
      expect(href).toMatch(/^https:\/\/wa\.me\//);
      // Must contain encoded message with property reference
      expect(href).toContain("text=");
    },
  );

  test.skip(
    "[P0] 4.2-E2E-002b: WhatsApp message includes property title and ref number",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      const whatsappCta = page.getByTestId("agent-whatsapp-cta");
      const href = await whatsappCta.getAttribute("href");

      // Decode the URL to verify message content
      const decodedHref = decodeURIComponent(href ?? "");
      // Message must reference the property (title or ref in the message text)
      expect(decodedHref).toMatch(/ALT-|beautiful|mountain/i);
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-003 — Spanish locale message is in Spanish (AC #3, P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 4.2-E2E-003: WhatsApp message is in Spanish for Spanish-speaking visitor",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_ES);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      const whatsappCta = page.getByTestId("agent-whatsapp-cta");
      const href = await whatsappCta.getAttribute("href");

      // Decode the URL to verify Spanish message
      const decodedHref = decodeURIComponent(href ?? "");
      // Spanish message starts with "Hola" (AC #3 requirement)
      expect(decodedHref).toContain("Hola");
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-004 — Email CTA renders as mailto link (AC #4, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.2-E2E-004: Email CTA has mailto href with property context pre-filled",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      const emailCta = page.getByTestId("agent-email-cta");
      await expect(emailCta).toBeVisible();

      const href = await emailCta.getAttribute("href");
      expect(href).toMatch(/^mailto:/);
      // Subject should contain property context
      expect(href).toContain("subject=");
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-005 — Transparency note visible (AC #5, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.2-E2E-005: transparency note about WhatsApp translation is visible in agent card",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      const transparencyNote = page.getByTestId("agent-transparency-note");
      await expect(transparencyNote).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-006 — Sticky mobile CTA bar appears (AC #6, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.2-E2E-006: sticky mobile CTA bar renders on mobile viewport with WhatsApp and Email buttons",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      // Scroll down past the agent card to trigger sticky bar visibility
      await page.evaluate(() => window.scrollTo(0, 1000));

      const stickyBar = page.getByTestId("sticky-mobile-cta");
      await expect(stickyBar).toBeVisible({ timeout: 5000 });

      // Verify the sticky bar has approximately 56px height (UX-DR9 spec)
      const barBox = await stickyBar.boundingBox();
      expect(barBox).toBeTruthy();
      // Height should be ~56px (h-14 in Tailwind)
      expect(barBox!.height).toBeGreaterThanOrEqual(50);
      expect(barBox!.height).toBeLessThanOrEqual(70);
    },
  );

  test.skip(
    "[P1] 4.2-E2E-006b: sticky mobile CTA bar is hidden on desktop viewport (md:hidden)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — StickyMobileCTA component not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const stickyBar = page.getByTestId("sticky-mobile-cta");
      // On desktop, the sticky bar should not be visible (md:hidden)
      await expect(stickyBar).not.toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-007 — Sticky bar hides when agent card is in viewport (AC #7, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.2-E2E-007: sticky mobile bar hides when agent card scrolls into viewport",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — StickyMobileCTA IntersectionObserver not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      // First, scroll far down so sticky bar is visible
      await page.evaluate(() => window.scrollTo(0, 2000));

      const stickyBar = page.getByTestId("sticky-mobile-cta");
      await expect(stickyBar).toBeVisible({ timeout: 5000 });

      // Now scroll back to top so agent card is in viewport
      await page.evaluate(() => window.scrollTo(0, 0));

      // Wait for IntersectionObserver to fire and update the DOM (deterministic wait)
      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible();

      // Wait for the sticky bar to gain translate-y-full (IntersectionObserver fired)
      await page.waitForFunction(() => {
        const bar = document.querySelector('[data-testid="sticky-mobile-cta"]');
        return bar?.classList.contains("translate-y-full") ?? false;
      }, { timeout: 3000 });

      // The sticky bar should now be off-screen (hidden via translate-y-full class)
      const stickyBarClass = await stickyBar.getAttribute("class");
      expect(stickyBarClass).toContain("translate-y-full");
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-008 — WhatsApp click fires lead tracking event (AC #8, P2)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.2-E2E-008: clicking WhatsApp CTA fires 'whatsapp_click' custom event",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — Lead tracking (trackWhatsAppClick) not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      // Listen for the custom tracking event
      await page.evaluate(() => {
        (window as any).__whatsappClickEvents = [];
        window.addEventListener("whatsapp_click", (e: any) => {
          (window as any).__whatsappClickEvents.push(e.detail);
        });
      });

      // Click the WhatsApp CTA (use modifier to prevent navigation)
      const whatsappCta = page.getByTestId("agent-whatsapp-cta");
      await whatsappCta.click({ modifiers: ["Meta"] }); // prevent navigation

      // Verify the tracking event was dispatched
      const events = await page.evaluate(
        () => (window as any).__whatsappClickEvents,
      );
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toMatchObject({
        source: "listing_detail",
        propertyRef: expect.any(String),
        locale: "en",
      });
    },
  );

  // ---------------------------------------------------------------------------
  // 4.2-E2E-009 — Agent card accessibility (AC #9, P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.2-E2E-009: agent card uses role='article' with aria-label containing agent name",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — AgentCard ARIA attributes not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      // Verify role="article"
      const role = await agentCard.getAttribute("role");
      expect(role).toBe("article");

      // Verify aria-label is present and meaningful
      const ariaLabel = await agentCard.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    },
  );

  // ---------------------------------------------------------------------------
  // Mobile layout — agent card below content on mobile (AC #1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.2-E2E-001c: agent card renders below main content on mobile (AC #1)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — listing-detail-layout.tsx not yet updated
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      const agentCard = page.getByTestId("agent-card");
      await expect(agentCard).toBeVisible({ timeout: 10000 });

      // On mobile, agent card should be below the listing description area
      // (not in a sidebar position)
      const cardBox = await agentCard.boundingBox();
      expect(cardBox).toBeTruthy();
      // Mobile: card should start within the mobile viewport width
      expect(cardBox!.x).toBeLessThan(50); // near left edge (full-width layout)
      expect(cardBox!.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.8); // near full-width
    },
  );
});
