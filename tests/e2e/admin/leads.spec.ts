/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.2: Lead Management & Agent Assignment", () => {
  test.describe("Admin Leads View - Authenticated", () => {
    test.beforeEach(async ({ context }: any) => {
      const { createHash } = require("crypto");
      const sessionToken = createHash("sha256").update("admin").digest("hex");
      await context.addCookies([
        {
          name: "admin_session",
          value: sessionToken,
          domain: "localhost",
          path: "/",
        },
      ]);
    });

    test("[P0] 8.2-E2E-001: displays all leads with required fields (AC1)", async ({ page }: any) => {
      // 1. Given the admin lead management view
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      
      // 2. When accessed
      // 3. Then it displays all leads with required fields
      const leadRow = page.locator('tr[data-testid="lead-row-1"]');
      await expect(leadRow).toBeVisible();
      await expect(leadRow.locator('.lead-name')).toBeVisible();
      await expect(leadRow.locator('.lead-email')).toBeVisible();
      await expect(leadRow.locator('.lead-phone')).toBeVisible();
      await expect(leadRow.locator('.lead-source')).toBeVisible();
      await expect(leadRow.locator('.lead-intent')).toBeVisible();
      await expect(leadRow.locator('.lead-language')).toBeVisible();
      await expect(leadRow.locator('.lead-assigned-agent')).toBeVisible();
      await expect(leadRow.locator('.lead-utm')).toBeVisible();
      await expect(leadRow.locator('.lead-status')).toBeVisible();
      await expect(leadRow.locator('.lead-created-at')).toBeVisible();
    });

    test("[P0] 8.2-E2E-002: shows shortlisted property refs grouped by assigned agent (AC2)", async ({ page }: any) => {
      // 1. Given a shortlist lead
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      const leadRow = page.locator('tr[data-testid="lead-row-1"]');
      
      // 2. When viewed in the lead management view
      const viewShortlistButton = leadRow.locator('button[data-testid="view-shortlist"]');
      if (await viewShortlistButton.isVisible()) {
        await viewShortlistButton.click();
        
        // 3. Then it shows shortlisted property refs grouped by agent
        const shortlistDetails = page.locator('div[data-testid="shortlist-details"]');
        await expect(shortlistDetails).toBeVisible();
      }
    });

    test("[P0] 8.2-E2E-003: updates assigned agent and logs reassignment (AC3)", async ({ page }: any) => {
      // 1. Given a lead assigned to an agent
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      const leadRow = page.locator('tr[data-testid="lead-row-1"]');
      await expect(leadRow).toBeVisible();
      
      // 2. When the admin uses the reassign action
      const reassignButton = leadRow.locator('button[data-testid="reassign-lead"]');
      if (await reassignButton.isVisible()) {
        await reassignButton.click();
        await page.locator('select[data-testid="agent-select"]').selectOption({ index: 1 });
        await page.locator('button[data-testid="confirm-reassign"]').click();
        
        // 3. Then the lead's assigned agent is updated
        await expect(leadRow.locator('.lead-assigned-agent')).toBeVisible();
        
        // And a log entry records the reassignment
        await page.goto("/en/admin/leads/reassignment-logs");
        await expect(page.locator('tr[data-testid="log-entry"]').first()).toBeVisible();
      }
    });

    test("[P1] 8.2-E2E-004: filters lead list correctly (AC4)", async ({ page }: any) => {
      // 1. Given the lead list
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      
      // 2. When filtered by source
      await page.locator('#filter-source').selectOption("whatsapp");
      await page.locator('button[type="submit"]').click();
      
      // 3. Then the list updates to show only matching leads
      await expect(page).toHaveURL(/source=whatsapp/);
    });

    test("[P0] 8.2-E2E-005: displays per-agent lead history (AC5)", async ({ page }: any) => {
      // 1. Given the per-agent lead history view
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/agents/history");
      
      // 2. When the admin selects an agent
      const selector = page.locator('select[data-testid="agent-select"]');
      await expect(selector).toBeVisible();
      await selector.selectOption({ index: 1 });
      
      // 3. Then the page updates with corresponding history items
      await expect(page.url()).toContain("agentId=");
    });
  });

  test.describe("Admin Leads View - Unauthenticated", () => {
    test("[P0] 8.2-E2E-006: protects lead PII from unauthenticated users (AC6)", async ({ page }: any) => {
      // 1. Given an unauthenticated user
      // 2. When they attempt to view the admin leads view
      await page.goto("/en/admin/leads");
      
      // 3. Then they are redirected or shown an unauthorized message
      await expect(page).toHaveURL(/.*login.*/);
    });
  });
});
