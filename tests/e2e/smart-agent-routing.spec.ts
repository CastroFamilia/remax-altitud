/**
 * Story 7.4: Smart Agent Routing from Shortlist — E2E Integration Tests
 *
 * All tests are test.skip() until components and APIs are implemented and fully integrated.
 *
 * Covers:
 *   - 7.4-E2E-001: Clicking "Ask about these" automatically routes to WhatsApp for Single Agent shortlist (AC #1, #4, #5)
 *   - 7.4-E2E-002: Shows auto-suggest alert when a majority agent is found (AC #2)
 *   - 7.4-E2E-003: Launches AgentSelectionModal on tie/even agent distribution with language auto-sorting and educational interstitial (AC #3, #7)
 *   - 7.4-E2E-004: Supports Email alternative opening mailto link and capturing lead (AC #8)
 */

// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SHORTLIST_PAGE_URL_EN = "/en/shortlist";
const SHORTLIST_PAGE_URL_ES = "/es/shortlist";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 7.4: Smart Agent Routing E2E Tests", () => {
  // ---------------------------------------------------------------------------
  // 7.4-E2E-001: Automatic routing to WhatsApp for Single Agent shortlist
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.4-E2E-001: Tapping 'Ask about these' with a single agent shortlist triggers background lead and opens WhatsApp",
    async ({ page, context }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed shortlist with properties belonging to 1 agent in localStorage
      await page.goto(SHORTLIST_PAGE_URL_EN);
      await page.evaluate(() => {
        // e.g., 2 properties both listed by Emma
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["prop-emma-1", "prop-emma-2"]));
      });
      await page.reload();

      // Intercept Leads API request
      const leadPromise = page.waitForRequest((req: any) =>
        req.url().includes("/api/leads") && req.method() === "POST"
      );

      // Intercept WhatsApp new page popup/redirect
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        page.getByTestId("ask-agent-button").click(),
      ]);

      // Check lead capture was POSTed with correct payload
      const leadRequest = await leadPromise;
      const leadData = JSON.parse(leadRequest.postData());
      expect(leadData.assignedAgentId).toBe("agent-emma-uuid");
      expect(leadData.shortlistPropertyIds).toEqual(["prop-emma-1", "prop-emma-2"]);
      expect(leadData.source).toBe("whatsapp_click");

      // Verify WhatsApp URL
      const popupUrl = popup.url();
      expect(popupUrl).toContain("wa.me/50688888888");
      expect(popupUrl).toContain(encodeURIComponent("prop-emma-1"));
      expect(popupUrl).toContain(encodeURIComponent("prop-emma-2"));
    }
  );

  // ---------------------------------------------------------------------------
  // 7.4-E2E-002: Majority agent suggestion alert
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.4-E2E-002: Tapping 'Ask about these' with a majority agent shortlist shows suggestion banner",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed shortlist with 3 properties (2 from Emma, 1 from Gustavo)
      await page.goto(SHORTLIST_PAGE_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem(
          "remax-altitud-shortlist",
          JSON.stringify(["prop-emma-1", "prop-emma-2", "prop-gustavo-1"])
        );
      });
      await page.reload();

      await page.getByTestId("ask-agent-button").click();

      // Check majority alert banner is visible
      const majorityAlert = page.getByTestId("majority-agent-suggest");
      await expect(majorityAlert).toBeVisible();
      await expect(majorityAlert).toContainText("Emma specializes in the areas you're exploring");

      // Primary contact button for Emma
      await expect(page.getByRole("button", { name: "Contact Emma" })).toBeVisible();
      // Secondary choose different agent button
      await expect(page.getByRole("button", { name: "Choose a different agent" })).toBeVisible();
    }
  );

  // ---------------------------------------------------------------------------
  // 7.4-E2E-003: AgentSelectionModal tie distribution
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 7.4-E2E-003: Evenly distributed shortlist triggers AgentSelectionModal",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      // Seed shortlist with tied properties (1 Emma, 1 Gustavo)
      await page.goto(SHORTLIST_PAGE_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem(
          "remax-altitud-shortlist",
          JSON.stringify(["prop-emma-1", "prop-gustavo-1"])
        );
      });
      await page.reload();

      await page.getByTestId("ask-agent-button").click();

      // Modal should appear directly
      const selectionModal = page.getByTestId("agent-selection-modal");
      await expect(selectionModal).toBeVisible();
      await expect(selectionModal.getByText("Select Your Coordinator Agent")).toBeVisible();
      await expect(selectionModal.getByText("One agent, all your visits")).toBeVisible();

      // Verify agents are sorted by language or correctly present
      await expect(selectionModal.getByText("Emma")).toBeVisible();
      await expect(selectionModal.getByText("Gustavo")).toBeVisible();
    }
  );

  // ---------------------------------------------------------------------------
  // 7.4-E2E-004: Email contact alternative
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 7.4-E2E-004: Alternative email contact triggers lead capture and opens mailto link",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);

      await page.goto(SHORTLIST_PAGE_URL_EN);
      await page.evaluate(() => {
        localStorage.setItem("remax-altitud-shortlist", JSON.stringify(["prop-emma-1"]));
      });
      await page.reload();

      // Trigger routing
      await page.getByTestId("ask-agent-button").click();

      // We trigger alternative contact option for Email
      const emailButton = page.getByTestId("contact-email-button");
      await expect(emailButton).toBeVisible();

      const leadPromise = page.waitForRequest((req: any) =>
        req.url().includes("/api/leads") && req.method() === "POST"
      );

      await emailButton.click();

      const leadRequest = await leadPromise;
      const leadData = JSON.parse(leadRequest.postData());
      expect(leadData.source).toBe("contact_form");
      expect(leadData.assignedAgentId).toBe("agent-emma-uuid");
    }
  );
});
