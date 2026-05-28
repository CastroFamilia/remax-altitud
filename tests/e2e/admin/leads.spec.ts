import { test, expect } from "@playwright/test";

test.describe("Story 8.2: Lead Management & Agent Assignment", () => {
  test.describe("Admin Leads View", () => {
    test.skip("displays all leads with required fields (AC1)", async ({ page }) => {
      // 1. Given the admin lead management view
      await page.goto("/admin/leads");
      
      // 2. When accessed
      // 3. Then it displays all leads with required fields
      const leadRow = page.locator('tr[data-testid="lead-row-1"]');
      await expect(leadRow.locator('td.lead-name')).toBeVisible();
      await expect(leadRow.locator('td.lead-email')).toBeVisible();
      await expect(leadRow.locator('td.lead-phone')).toBeVisible();
      await expect(leadRow.locator('td.lead-source')).toBeVisible();
      await expect(leadRow.locator('td.lead-intent')).toBeVisible();
      await expect(leadRow.locator('td.lead-property-ref')).toBeVisible();
      await expect(leadRow.locator('td.lead-language')).toBeVisible();
      await expect(leadRow.locator('td.lead-assigned-agent')).toBeVisible();
      await expect(leadRow.locator('td.lead-utm')).toBeVisible();
      await expect(leadRow.locator('td.lead-status')).toBeVisible();
      await expect(leadRow.locator('td.lead-created-at')).toBeVisible();
    });

    test.skip("shows shortlisted property refs grouped by assigned agent (AC2)", async ({ page }) => {
      // 1. Given a shortlist lead
      await page.goto("/admin/leads");
      const shortlistLead = page.locator('tr[data-testid="lead-shortlist-row"]');
      
      // 2. When viewed in the lead management view
      await shortlistLead.locator('button[data-testid="view-shortlist"]').click();
      
      // 3. Then it shows shortlisted property refs grouped by agent
      const shortlistDetails = page.locator('div[data-testid="shortlist-details"]');
      await expect(shortlistDetails).toContainText("Emma's: #");
      await expect(shortlistDetails).toContainText("Gustavo's: #");
    });

    test.skip("updates assigned agent and logs reassignment (AC3)", async ({ page }) => {
      // 1. Given a lead assigned to the wrong agent
      await page.goto("/admin/leads");
      const leadRow = page.locator('tr[data-testid="lead-reassign-row"]');
      
      // 2. When the admin uses the reassign action
      await leadRow.locator('button[data-testid="reassign-lead"]').click();
      await page.locator('select[data-testid="agent-select"]').selectOption("new-agent-id");
      await page.locator('button[data-testid="confirm-reassign"]').click();
      
      // 3. Then the lead's assigned agent is updated
      await expect(leadRow.locator('td.lead-assigned-agent')).toContainText("New Agent");
      
      // And a log entry records the reassignment
      await page.goto("/admin/leads/reassignment-logs");
      await expect(page.locator('tr[data-testid="log-entry"]')).toContainText("New Agent");
    });

    test.skip("filters lead list correctly (AC4)", async ({ page }) => {
      // 1. Given the lead list
      await page.goto("/admin/leads");
      
      // 2. When filtered by source
      await page.locator('select[data-testid="filter-source"]').selectOption("whatsapp");
      await page.locator('button[data-testid="apply-filters"]').click();
      
      // 3. Then the list updates to show only matching leads
      await expect(page).toHaveURL(/source=whatsapp/);
      const rows = page.locator('tr.lead-row');
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i).locator('td.lead-source')).toContainText("whatsapp");
      }
    });

    test.skip("displays per-agent lead history (AC5)", async ({ page }) => {
      // 1. Given the per-agent lead history view
      await page.goto("/admin/agents/history");
      
      // 2. When the admin selects an agent
      await page.locator('select[data-testid="agent-select"]').selectOption("agent-id-1");
      
      // 3. Then all leads ever assigned to that agent are displayed
      const historyRow = page.locator('tr[data-testid="history-row-1"]');
      await expect(historyRow.locator('td.lead-name')).toBeVisible();
      await expect(historyRow.locator('td.lead-type')).toBeVisible();
      await expect(historyRow.locator('td.lead-property-ref')).toBeVisible();
      await expect(historyRow.locator('td.lead-source')).toBeVisible();
    });

    test.skip("protects lead PII from unauthenticated users (AC6)", async ({ page }) => {
      // 1. Given an unauthenticated user
      // (Assuming the test runner starts unauthenticated by default)
      
      // 2. When they attempt to view the admin leads view
      const response = await page.goto("/admin/leads");
      
      // 3. Then they are redirected or shown an unauthorized message
      await expect(page).toHaveURL(/.*login.*/);
    });
  });
});
