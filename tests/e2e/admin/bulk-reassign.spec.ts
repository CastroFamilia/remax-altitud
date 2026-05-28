/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.3: Bulk Lead Reassignment & Export", () => {
  test.describe("Admin Leads View - Authenticated", () => {
    test.beforeEach(async ({ context }: any) => {
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

    test.skip("[P0] 8.3-E2E-001: opens bulk reassignment modal and displays active lead counts (AC6)", async ({ page }: any) => {
      // 1. Given the admin leads management panel
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");

      // 2. When the admin clicks "Bulk Reassign" and selects a source agent
      const openModalBtn = page.locator('button[data-testid="bulk-reassign-btn"]');
      await expect(openModalBtn).toBeVisible();
      await openModalBtn.click();

      const modal = page.locator('div[data-testid="bulk-reassign-modal"]');
      await expect(modal).toBeVisible();

      const sourceAgentSelect = page.locator('select[data-testid="source-agent-select"]');
      await sourceAgentSelect.selectOption({ label: "Agent Emma" });

      // 3. Then it displays the correct number of leads assigned to that agent before confirmation
      const leadCountDisplay = page.locator('[data-testid="leads-count-display"]');
      await expect(leadCountDisplay).toBeVisible();
      await expect(leadCountDisplay).toContainText(/leads found/i);
    });

    test.skip("[P0] 8.3-E2E-002: performs bulk reassignment to single target agent with explicit confirmation (AC1, AC2, AC6)", async ({ page }: any) => {
      // 1. Given the bulk reassignment modal open
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      await page.locator('button[data-testid="bulk-reassign-btn"]').click();

      // 2. When the admin selects a source agent, a target agent, clicks reassign, and confirms in the confirmation dialog
      await page.locator('select[data-testid="source-agent-select"]').selectOption({ label: "Agent Emma" });
      await page.locator('input[data-testid="reassign-mode-single"]').check();
      await page.locator('select[data-testid="target-agent-select"]').selectOption({ label: "Agent Gustavo" });

      const reassignSubmitBtn = page.locator('button[data-testid="execute-reassign-btn"]');
      await reassignSubmitBtn.click();

      // Check confirmation prompt ("Are you sure? This will reassign X leads from [Source] to [Target].")
      const confirmDialog = page.locator('[data-testid="confirmation-dialog"]');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog).toContainText(/are you sure/i);
      
      const confirmBtn = page.locator('button[data-testid="confirm-reassign-dialog-btn"]');
      await confirmBtn.click();

      // 3. Then the leads are updated to the target agent, and reassignment logs are recorded
      const toast = page.locator('.toast-success');
      await expect(toast).toBeVisible();
      
      // Navigate to logs page to verify log entries exist
      await page.goto("/en/admin/leads/reassignment-logs");
      await expect(page.locator('tr[data-testid="log-entry"]').first()).toBeVisible();
    });

    test.skip("[P0] 8.3-E2E-003: distributes leads round-robin across multiple target agents (AC3)", async ({ page }: any) => {
      // 1. Given the bulk reassignment modal open
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      await page.locator('button[data-testid="bulk-reassign-btn"]').click();

      // 2. When the admin selects "distribute" across multiple selected target agents and confirms
      await page.locator('select[data-testid="source-agent-select"]').selectOption({ label: "Agent Emma" });
      await page.locator('input[data-testid="reassign-mode-distribute"]').check();
      
      // Select multiple target agents checkboxes
      await page.locator('input[data-testid="target-agent-checkbox-agent-1"]').check();
      await page.locator('input[data-testid="target-agent-checkbox-agent-2"]').check();

      await page.locator('button[data-testid="execute-reassign-btn"]').click();
      await page.locator('button[data-testid="confirm-reassign-dialog-btn"]').click();

      // 3. Then the leads are distributed evenly/round-robin among the target agents
      const toast = page.locator('.toast-success');
      await expect(toast).toBeVisible();
    });

    test.skip("[P0] 8.3-E2E-004: exports decrypted client contacts as CSV (AC4)", async ({ page }: any) => {
      // 1. Given the admin leads view
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");

      // 2. When the admin selects an agent and clicks "Export Contacts"
      const exportBtn = page.locator('button[data-testid="export-contacts-btn"]');
      await expect(exportBtn).toBeVisible();

      // Setup download listener
      const downloadPromise = page.waitForEvent("download");
      await exportBtn.click();
      const download = await downloadPromise;

      // 3. Then it downloads a CSV file with decrypted fields: Name, Email, Phone
      expect(download.suggestedFilename()).toContain(".csv");
      const path = await download.path();
      expect(path).toBeTruthy();
    });

    test.skip("[P0] 8.3-E2E-005: shows validation error when reassigning leads for source agent with zero leads (AC5)", async ({ page }: any) => {
      // 1. Given the bulk reassignment modal
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");
      await page.locator('button[data-testid="bulk-reassign-btn"]').click();

      // 2. When an agent with 0 leads is selected as source
      await page.locator('select[data-testid="source-agent-select"]').selectOption({ label: "Agent ZeroLeads" });

      // 3. Then it displays: "No leads to reassign for [Agent Name]"
      const errorMsg = page.locator('[data-testid="no-leads-validation-msg"]');
      await expect(errorMsg).toBeVisible();
      await expect(errorMsg).toContainText(/no leads to reassign/i);
    });
  });
});
