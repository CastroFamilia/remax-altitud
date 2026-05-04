/**
 * Story 5.1: Seller Landing Page & "List With Us" Form — ATDD Red-Phase E2E Scaffold
 *
 * TDD Phase: RED — all tests are test.skip() until the page and form are implemented.
 * Remove test.skip() per test when implementing to verify green phase.
 *
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Staging/local environment with Next.js running on BASE_URL
 *   - DB seeded with ≥1 active agent record
 *   - Mapbox token configured in NEXT_PUBLIC_MAPBOX_TOKEN
 *
 * Acceptance criteria covered:
 *   AC #1  — 5.1-E2E-003: SEO hero renders above form (h1, benefits, testimonials, process)
 *   AC #2  — 5.1-E2E-004: Progress bar updates through 3 steps and CTA initiates form
 *   AC #3  — 5.1-E2E-011: Map loads progressively after 2s; text field present immediately
 *   AC #4  — 5.1-E2E-007: Location text field remains functional when map fails to load
 *   AC #5  — (covered by unit tests 5.1-COMP-007) Step 2 full field rendering for Casa type
 *   AC #6  — (covered by unit test 5.1-COMP-002) Pricing-help checkbox makes price optional
 *   AC #7  — (covered by unit test 5.1-COMP-008) Step 3 field rendering
 *   AC #8  — 5.1-E2E-005: Back navigation preserves entered data across steps
 *   AC #9  — 5.1-E2E-009: Form completable in under 3 minutes on simulated 4G mobile
 *   AC #10 — 5.1-E2E-006: Validation errors appear in Spanish on /es/sell
 *   AC #11 — 5.1-E2E-001: 3-step seller form submits and shows confirmation with agent card
 *   AC #12 — 5.1-E2E-008: Seller landing page renders without JS (SSG)
 *   AC #13 — (covered by unit test 5.1-UNIT-001) All form strings in Spanish locale
 *   AC #14 — (covered by unit test 5.1-E2E-002) SellerForm absent from initial JS bundle
 *
 * data-testid contract (CANNOT rename once established):
 *   data-testid="seller-hero"             — SellerHero root section
 *   data-testid="seller-form"             — SellerForm wrapper
 *   data-testid="form-step-1"             — Step 1 container
 *   data-testid="form-step-2"             — Step 2 container
 *   data-testid="form-step-3"             — Step 3 container
 *   data-testid="progress-bar"            — Progress indicator
 *   data-testid="pricing-help-checkbox"   — Pricing help checkbox
 *   data-testid="location-map"            — Map container in LocationPicker
 *   data-testid="location-text-input"     — Text address input in LocationPicker
 *   data-testid="seller-confirmation"     — Confirmation screen
 *   data-testid="seller-form-skeleton"    — Skeleton shown during lazy-load
 */

// NOTE: Playwright is not yet installed — this import will fail until
// playwright.config.ts is configured and @playwright/test is installed.
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SELL_PAGE_EN = "/en/sell";
const SELL_PAGE_ES = "/es/sell";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };

// ---------------------------------------------------------------------------
// AC #1 — SEO Hero (P1, 5.1-E2E-003)
// ---------------------------------------------------------------------------

test.describe("Story 5.1: Seller Landing Page (ATDD Red Phase)", () => {
  test.skip(
    "[P1] 5.1-E2E-003: seller landing page renders SEO hero with h1, benefits, process, and testimonials above the form",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerHero not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // Hero section must render above the form (data-testid contract)
      const hero = page.getByTestId("seller-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Must contain an h1 heading (value proposition)
      const h1 = hero.locator("h1");
      await expect(h1).toBeVisible();

      // Page must contain 200–300 words of indexable content (AC #1)
      const heroText = await hero.textContent();
      const wordCount = (heroText ?? "").trim().split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeGreaterThanOrEqual(50); // conservative floor for CI

      // "Get Started" / "Comenzar" CTA must be visible
      const startButton = hero.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible();
    },
  );

  test.skip(
    "[P1] 5.1-E2E-003b: seller landing page hero is present in Spanish locale (/es/sell)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerHero not yet implemented
      await page.goto(SELL_PAGE_ES);

      const hero = page.getByTestId("seller-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Hero in ES must have h1
      const h1 = hero.locator("h1");
      await expect(h1).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #2 — Progress bar + CTA initiates form (P1, 5.1-E2E-004)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 5.1-E2E-004: clicking Get Started reveals 3-step form; progress bar shows step 1 active",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      await page.goto(SELL_PAGE_EN);

      // Click the hero CTA
      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      // Progress bar must appear (AC #2)
      const progressBar = page.getByTestId("progress-bar");
      await expect(progressBar).toBeVisible();

      // Step 1 container must be visible (form-step-1)
      const step1 = page.getByTestId("form-step-1");
      await expect(step1).toBeVisible();

      // Steps 2 and 3 must not be visible initially
      await expect(page.getByTestId("form-step-2")).not.toBeVisible();
      await expect(page.getByTestId("form-step-3")).not.toBeVisible();
    },
  );

  test.skip(
    "[P1] 5.1-E2E-004b: progress bar updates to step 2 and step 3 as user advances",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      await page.goto(SELL_PAGE_EN);

      // Navigate to the form
      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      // Fill step 1 required fields
      const propertyTypeRadio = page.getByRole("radio", { name: /casa|house/i }).first();
      await expect(propertyTypeRadio).toBeVisible();
      await propertyTypeRadio.click();

      const locationInput = page.getByTestId("location-text-input");
      await expect(locationInput).toBeVisible();
      await locationInput.fill("Pérez Zeledón, Costa Rica");

      // Advance to step 2
      const nextButton = page.getByRole("button", { name: /next|siguiente/i });
      await nextButton.click();

      // Step 2 must now be visible
      const step2 = page.getByTestId("form-step-2");
      await expect(step2).toBeVisible();

      // Progress bar aria-label should indicate step 2 of 3
      const progressBar = page.getByTestId("progress-bar");
      await expect(progressBar).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #8 — Back navigation preserves data (P1, 5.1-E2E-005)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 5.1-E2E-005: Back navigation from step 2 preserves step 1 data (R-007)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm multi-step state not yet implemented
      await page.goto(SELL_PAGE_EN);

      // Start the form
      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      // Fill step 1
      const casaRadio = page.getByRole("radio", { name: /casa|house/i }).first();
      await casaRadio.click();

      const locationInput = page.getByTestId("location-text-input");
      await locationInput.fill("Dominical, Costa Rica");

      // Advance to step 2
      const nextButton = page.getByRole("button", { name: /next|siguiente/i });
      await nextButton.click();
      await expect(page.getByTestId("form-step-2")).toBeVisible();

      // Go back to step 1
      const backButton = page.getByRole("button", { name: /back|atrás/i });
      await expect(backButton).toBeVisible();
      await backButton.click();

      // Step 1 must be visible again with data preserved
      const step1 = page.getByTestId("form-step-1");
      await expect(step1).toBeVisible();

      // Location value must be preserved (R-007)
      const locationInputAfterBack = page.getByTestId("location-text-input");
      await expect(locationInputAfterBack).toHaveValue("Dominical, Costa Rica");
    },
  );

  // ---------------------------------------------------------------------------
  // AC #10 — Validation errors in Spanish locale (P1, 5.1-E2E-006)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 5.1-E2E-006: inline validation errors appear in Spanish on /es/sell (R-011)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm i18n validation not yet implemented
      await page.goto(SELL_PAGE_ES);

      // Start the form
      const startButton = page.getByRole("button", { name: /comenzar|get started/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      // Tap Next without filling any fields
      const nextButton = page.getByRole("button", { name: /siguiente|next/i });
      await expect(nextButton).toBeVisible();
      await nextButton.click();

      // Validation error messages must appear in Spanish
      // The AC specifies: "Por favor selecciona un tipo de propiedad" or similar
      const errorMessages = page.locator('[role="alert"], .text-red-500, [class*="error"]');
      await expect(errorMessages.first()).toBeVisible();

      // Error must NOT be in English (i18n contract)
      const errorText = await errorMessages.first().textContent();
      // Spanish error should not start with "Please" (English)
      expect(errorText?.toLowerCase()).not.toMatch(/^please/);
    },
  );

  // ---------------------------------------------------------------------------
  // AC #4 — Location text field fallback (P1, 5.1-E2E-007)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 5.1-E2E-007: location text field remains functional when map fails to load (AC #4)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — LocationPicker fallback not yet implemented
      // Block Mapbox CDN to simulate map load failure
      await page.route("**api.mapbox.com**", (route: any) => route.abort());
      await page.route("**events.mapbox.com**", (route: any) => route.abort());

      await page.goto(SELL_PAGE_EN);

      // Start the form
      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      // Text input must be present and functional even when map fails
      const locationInput = page.getByTestId("location-text-input");
      await expect(locationInput).toBeVisible();

      // Must be able to type into the text field
      await locationInput.fill("San Gerardo de Dota, Costa Rica");
      await expect(locationInput).toHaveValue("San Gerardo de Dota, Costa Rica");

      // Form must still be submittable (advance to step 2)
      const casaRadio = page.getByRole("radio", { name: /casa|house/i }).first();
      await casaRadio.click();
      const nextButton = page.getByRole("button", { name: /next|siguiente/i });
      await nextButton.click();

      // Must reach step 2 without error
      await expect(page.getByTestId("form-step-2")).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #11 — Full 3-step submission → confirmation (P0, 5.1-E2E-001)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 5.1-E2E-001: 3-step seller form submits successfully and shows confirmation screen with agent card",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm and SellerConfirmation not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // Step 1: Basics
      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      await expect(page.getByTestId("form-step-1")).toBeVisible();

      const casaRadio = page.getByRole("radio", { name: /casa|house/i }).first();
      await casaRadio.click();

      const locationInput = page.getByTestId("location-text-input");
      await locationInput.fill("Pérez Zeledón, San José, Costa Rica");

      const nextButton1 = page.getByRole("button", { name: /next|siguiente/i });
      await nextButton1.click();

      // Step 2: Details
      await expect(page.getByTestId("form-step-2")).toBeVisible();

      // Price field must be present; fill it to satisfy required validation.
      const priceInput = page.getByRole("spinbutton", { name: /price|precio/i });
      await expect(priceInput).toBeVisible();
      await priceInput.fill("250000");

      const nextButton2 = page.getByRole("button", { name: /next|siguiente/i });
      await nextButton2.click();

      // Step 3: Contact
      await expect(page.getByTestId("form-step-3")).toBeVisible();

      await page.getByRole("textbox", { name: /name|nombre/i }).fill("Carlos Vendedor");
      await page.getByRole("textbox", { name: /phone|teléfono|whatsapp/i }).fill("+50688881234");

      // Submit
      const submitButton = page.getByRole("button", { name: /submit|enviar/i });
      await expect(submitButton).toBeVisible();
      await submitButton.click();

      // Confirmation screen must appear (AC #11)
      const confirmation = page.getByTestId("seller-confirmation");
      await expect(confirmation).toBeVisible({ timeout: 10000 });

      // Agent match card must be visible inside confirmation
      const agentCard = confirmation.locator('[data-testid="agent-card"], [class*="agent"]');
      await expect(agentCard.first()).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #12 — SSG: page renders without JS (P2, 5.1-E2E-008)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 5.1-E2E-008: seller landing page hero and CTA render with JavaScript disabled (SSG — AC #12)",
    async ({ browser }: any) => {
      // THIS TEST WILL FAIL — SSG page not yet implemented
      // Launch new context with JS disabled to verify SSG
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();

      await page.goto(SELL_PAGE_EN);

      // Hero must render server-side (SSG)
      const hero = page.getByTestId("seller-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Skeleton fallback is acceptable for the form container (SellerForm is CSR)
      const formArea = page.getByTestId("seller-form-skeleton");
      await expect(formArea).toBeVisible();

      await context.close();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #9 — Form completable in under 3 minutes on 4G mobile (P2, 5.1-E2E-009)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 5.1-E2E-009: form is completable in under 3 minutes on simulated 4G mobile (AC #9)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);

      // Simulate 4G throttling (approximate: 4Mbps down, 3Mbps up, 100ms RTT)
      const client = await page.context().newCDPSession(page);
      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
        uploadThroughput: (3 * 1024 * 1024) / 8,    // 3 Mbps
        latency: 100,
      });

      const startTime = Date.now();

      await page.goto(SELL_PAGE_EN);

      // Step 1
      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 15000 });
      await startButton.click();
      await expect(page.getByTestId("form-step-1")).toBeVisible();

      const casaRadio = page.getByRole("radio", { name: /casa|house/i }).first();
      await casaRadio.click();
      await page.getByTestId("location-text-input").fill("Platanillo, Costa Rica");
      await page.getByRole("button", { name: /next|siguiente/i }).click();

      // Step 2
      await expect(page.getByTestId("form-step-2")).toBeVisible();
      await page.getByRole("button", { name: /next|siguiente/i }).click();

      // Step 3
      await expect(page.getByTestId("form-step-3")).toBeVisible();
      await page.getByRole("textbox", { name: /name|nombre/i }).fill("Carlos Vendedor");
      await page.getByRole("textbox", { name: /phone|teléfono|whatsapp/i }).fill("+50688881234");
      await page.getByRole("button", { name: /submit|enviar/i }).click();

      // Confirmation must appear
      await expect(page.getByTestId("seller-confirmation")).toBeVisible({ timeout: 15000 });

      const totalMs = Date.now() - startTime;
      const THREE_MINUTES_MS = 3 * 60 * 1000;

      // AC #9: completable in under 3 minutes
      expect(totalMs).toBeLessThan(THREE_MINUTES_MS);
    },
  );

  // ---------------------------------------------------------------------------
  // AC #3 — Map loads progressively after 2s (P3, 5.1-E2E-011)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P3] 5.1-E2E-011: map loads progressively — text input visible immediately, map container appears after 2s",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — LocationPicker progressive loading not yet implemented
      await page.goto(SELL_PAGE_EN);

      const startButton = page.getByRole("button", { name: /get started|comenzar/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
      await startButton.click();

      // Text input must be visible immediately (no 2s wait)
      const locationInput = page.getByTestId("location-text-input");
      await expect(locationInput).toBeVisible({ timeout: 500 });

      // Map container should appear after progressive 2s delay (AC #3)
      const mapContainer = page.getByTestId("location-map");
      await expect(mapContainer).toBeVisible({ timeout: 5000 });
    },
  );

  // ---------------------------------------------------------------------------
  // Mobile viewport — complete flow
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] seller landing page renders correctly on mobile viewport (375px)",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — SellerForm not yet implemented
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      const hero = page.getByTestId("seller-hero");
      await expect(hero).toBeVisible({ timeout: 10000 });

      // Form container should be present (skeleton or loaded)
      const formArea = page.locator(
        '[data-testid="seller-form"], [data-testid="seller-form-skeleton"]'
      );
      await expect(formArea.first()).toBeVisible();
    },
  );
});
