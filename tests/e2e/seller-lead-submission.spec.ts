/**
 * Story 5.3: Seller Lead Storage, Routing & Source Tracking — E2E Scaffold
 *
 * TDD Phase: RED — all tests are test.skip() until backend API is implemented.
 * Remove test.skip() per test when implementing to verify green phase.
 *
 * This E2E test validates the full seller form → API → confirmation flow
 * with a REAL backend (no mocks). It verifies:
 *   - Seller form submission creates a lead via POST /api/leads (AC #1)
 *   - CMA form submission creates a lead with source = "cma_form" (AC #2)
 *   - UTM parameters are captured from the URL (AC #4)
 *   - Agent match card shows on confirmation (AC #6)
 *   - WhatsApp click fires tracking event (AC #5)
 *
 * Covers (from test-design-epic-5.md):
 *   5.1-E2E-001 (extended) — full form → API → confirmation with real agent
 *   5.3-UNIT-006 — WhatsApp click event tracking
 *
 * Prerequisites:
 *   - Playwright configured (@playwright/test installed)
 *   - Next.js running on BASE_URL
 *   - Database with leads table migrated
 *   - LEAD_ENCRYPTION_KEY env var set
 *   - ≥1 seeded active agent with office
 *
 * data-testid contracts (from Stories 5.1/5.2, CANNOT rename):
 *   seller-form, form-step-1/2/3, progress-bar, pricing-help-checkbox
 *   location-text-input, seller-confirmation, agent-card
 *   cma-form, cma-confirmation
 *
 * Environment: Playwright (E2E)
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
const SELL_PAGE_EN_WITH_UTM =
  "/en/sell?utm_source=facebook&utm_medium=ad&utm_campaign=sellers_pz";
const CMA_PAGE_EN = "/en/sell"; // CMA form is accessible on the same page
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ---------------------------------------------------------------------------
// Helper: fill the 3-step seller form and submit
// ---------------------------------------------------------------------------

async function fillAndSubmitSellerForm(page: any) {
  // Start the form
  const startButton = page.getByRole("button", {
    name: /get started|comenzar/i,
  });
  await expect(startButton).toBeVisible({ timeout: 10000 });
  await startButton.click();

  // Step 1: Basics
  await expect(page.getByTestId("form-step-1")).toBeVisible();
  const casaRadio = page.getByRole("radio", { name: /casa|house/i }).first();
  await casaRadio.click();
  await page.getByTestId("location-text-input").fill("Pérez Zeledón, Costa Rica");
  await page.getByRole("button", { name: /next|siguiente/i }).click();

  // Step 2: Details
  await expect(page.getByTestId("form-step-2")).toBeVisible();
  const priceInput = page.getByRole("spinbutton", { name: /price|precio/i });
  if (await priceInput.isVisible()) {
    await priceInput.fill("250000");
  }
  await page.getByRole("button", { name: /next|siguiente/i }).click();

  // Step 3: Contact
  await expect(page.getByTestId("form-step-3")).toBeVisible();
  await page.getByRole("textbox", { name: /name|nombre/i }).fill("Carlos Vendedor");
  await page
    .getByRole("textbox", { name: /phone|teléfono|whatsapp/i })
    .fill("+50688881234");

  // Submit
  const submitButton = page.getByRole("button", { name: /submit|enviar/i });
  await submitButton.click();
}

// ---------------------------------------------------------------------------
// Story 5.3 E2E — Seller form → API → Confirmation
// ---------------------------------------------------------------------------

test.describe("Story 5.3: Seller Lead Storage & Routing (ATDD Red Phase)", () => {
  // -------------------------------------------------------------------------
  // AC #1: Seller form creates lead via POST /api/leads
  // -------------------------------------------------------------------------

  test.skip(
    "[P0] 5.3-E2E: seller form submission creates lead via /api/leads and shows confirmation with assigned agent",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — /api/leads route not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // Intercept the API call to verify it fires
      const apiPromise = page.waitForResponse(
        (resp: any) =>
          resp.url().includes("/api/leads") && resp.request().method() === "POST",
      );

      await fillAndSubmitSellerForm(page);

      // Wait for API response
      const apiResponse = await apiPromise;
      expect(apiResponse.status()).toBe(201);

      const responseBody = await apiResponse.json();
      expect(responseBody.leadId).toBeDefined();
      expect(responseBody.assignedAgentId).toBeDefined();

      // Confirmation screen must appear with agent card (AC #6)
      const confirmation = page.getByTestId("seller-confirmation");
      await expect(confirmation).toBeVisible({ timeout: 10000 });

      // Agent card must be visible in confirmation
      const agentCard = confirmation.locator(
        '[data-testid="agent-card"], [class*="agent"]',
      );
      await expect(agentCard.first()).toBeVisible();
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: UTM parameters captured from URL
  // -------------------------------------------------------------------------

  test.skip(
    "[P1] 5.3-E2E-UTM: UTM parameters from URL are sent in the lead API payload",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — UTM capture not yet wired to API
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN_WITH_UTM);

      // Intercept API call and capture the request body
      let requestBody: any;
      await page.route("**/api/leads", async (route: any) => {
        requestBody = route.request().postDataJSON();
        await route.continue();
      });

      await fillAndSubmitSellerForm(page);

      // Wait for confirmation
      await expect(page.getByTestId("seller-confirmation")).toBeVisible({
        timeout: 10000,
      });

      // Verify UTM fields were included in the API payload
      expect(requestBody).toBeDefined();
      expect(requestBody.utm_source).toBe("facebook");
      expect(requestBody.utm_medium).toBe("ad");
      expect(requestBody.utm_campaign).toBe("sellers_pz");
    },
  );

  // -------------------------------------------------------------------------
  // AC #9: Duplicate submission shows "Already submitted" (409)
  // -------------------------------------------------------------------------

  test.skip(
    "[P0] 5.3-E2E-DEDUP: submitting the same form twice within 60s shows 'Already submitted' message",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — deduplication not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // First submission — should succeed
      await fillAndSubmitSellerForm(page);
      await expect(page.getByTestId("seller-confirmation")).toBeVisible({
        timeout: 10000,
      });

      // Navigate back and submit again
      await page.goto(SELL_PAGE_EN);
      await fillAndSubmitSellerForm(page);

      // Second submission should show duplicate message (409 handling in UI)
      // The UI should display an "already submitted" or similar message
      const duplicateMessage = page.getByText(/already submitted|ya enviado/i);
      await expect(duplicateMessage).toBeVisible({ timeout: 10000 });
    },
  );

  // -------------------------------------------------------------------------
  // AC #5: WhatsApp click tracking (5.3-UNIT-006)
  // -------------------------------------------------------------------------

  test.skip(
    "[P2] 5.3-UNIT-006: WhatsApp click on confirmation fires tracking event with source context",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — WhatsApp click tracking not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // Complete form submission first
      await fillAndSubmitSellerForm(page);
      await expect(page.getByTestId("seller-confirmation")).toBeVisible({
        timeout: 10000,
      });

      // Intercept the tracking API call
      const trackingPromise = page.waitForRequest(
        (req: any) =>
          req.url().includes("/api/leads") &&
          req.method() === "POST" &&
          req.postDataJSON()?.source === "whatsapp_click",
      );

      // Click the WhatsApp CTA
      const whatsappButton = page
        .getByTestId("seller-confirmation")
        .getByRole("link", { name: /whatsapp/i });
      await expect(whatsappButton).toBeVisible();
      await whatsappButton.click();

      // Tracking request should have fired (fire-and-forget)
      const trackingRequest = await trackingPromise;
      const trackingBody = trackingRequest.postDataJSON();
      expect(trackingBody.source).toBe("whatsapp_click");
      expect(trackingBody.intent).toBe("sell");
    },
  );

  // -------------------------------------------------------------------------
  // AC #8: Validation errors from API shown to user
  // -------------------------------------------------------------------------

  test.skip(
    "[P1] 5.3-E2E-VALIDATION: API validation error (400) shows user-friendly error message",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — error handling UI not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // Mock API to return 400
      await page.route("**/api/leads", (route: any) => {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Validation failed",
            issues: [{ path: ["phone"], message: "Phone is required" }],
          }),
        });
      });

      // Start form and try to submit (skip filling phone by mocking)
      const startButton = page.getByRole("button", {
        name: /get started|comenzar/i,
      });
      await startButton.click();

      // Fill minimal fields and submit (phone will be rejected by API)
      // ... (form would need to be filled enough to reach submission)

      // Error message should appear
      const errorMessage = page.getByText(/error|validation|failed/i);
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    },
  );

  // -------------------------------------------------------------------------
  // AC #10: Server error shows retry button
  // -------------------------------------------------------------------------

  test.skip(
    "[P0] 5.3-E2E-ERROR: server error (500) shows error message with retry option",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — error handling UI not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(SELL_PAGE_EN);

      // Mock API to return 500
      await page.route("**/api/leads", (route: any) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Lead creation failed" }),
        });
      });

      await fillAndSubmitSellerForm(page);

      // Must show error (NOT silent success) — R-002
      const errorMessage = page.getByText(
        /error|failed|try again|intentar de nuevo/i,
      );
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Must NOT show confirmation screen (lead was not created)
      await expect(page.getByTestId("seller-confirmation")).not.toBeVisible();
    },
  );
});

// ---------------------------------------------------------------------------
// CMA form E2E
// ---------------------------------------------------------------------------

test.describe("Story 5.3: CMA Form → API (ATDD Red Phase)", () => {
  test.skip(
    "[P0] 5.2-API-001-E2E: CMA form submission creates lead via /api/leads with source='cma_form'",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — CMA → API wiring not yet implemented
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(CMA_PAGE_EN);

      // Intercept API call
      const apiPromise = page.waitForResponse(
        (resp: any) =>
          resp.url().includes("/api/leads") && resp.request().method() === "POST",
      );

      // Find and fill CMA form
      const cmaForm = page.getByTestId("cma-form");
      await expect(cmaForm).toBeVisible({ timeout: 10000 });

      // Fill CMA fields
      await cmaForm.getByRole("textbox", { name: /name|nombre/i }).fill("Ana CMA");
      await cmaForm
        .getByRole("textbox", { name: /phone|teléfono|whatsapp/i })
        .fill("+50677772222");

      // Fill location
      const locationInput = cmaForm.getByTestId("location-text-input");
      if (await locationInput.isVisible()) {
        await locationInput.fill("Dominical, Costa Rica");
      }

      // Submit CMA form
      const submitButton = cmaForm.getByRole("button", {
        name: /submit|enviar|request/i,
      });
      await submitButton.click();

      // Verify API was called
      const apiResponse = await apiPromise;
      expect(apiResponse.status()).toBe(201);

      const body = await apiResponse.json();
      expect(body.leadId).toBeDefined();

      // CMA confirmation must show
      const confirmation = page.getByTestId("cma-confirmation");
      await expect(confirmation).toBeVisible({ timeout: 10000 });
    },
  );
});
