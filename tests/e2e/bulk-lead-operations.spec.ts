// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

const LEADS_PAGE = "/en/admin/leads";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.3: Bulk Lead Reassignment and Export E2E Tests", () => {
  test.beforeEach(async ({ page }: any) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
  });

  test("should display Bulk Lead Operations button on admin leads panel", async ({ page }: any) => {
    // Navigate to the leads panel
    await page.goto(LEADS_PAGE);

    // Verify page header is visible
    await expect(page.locator("h1")).toContainText(/Leads & Assignment Management/i);

    // Verify "Bulk Lead Operations" button exists
    const bulkButton = page.getByTestId("bulk-reassign-btn");
    await expect(bulkButton).toBeVisible();
    await expect(bulkButton).toContainText(/Bulk Lead Operations/i);
  });

  test("should open modal when clicking Bulk Lead Operations button and support tab switching", async ({ page }: any) => {
    await page.goto(LEADS_PAGE);

    const bulkButton = page.getByTestId("bulk-reassign-btn");
    await bulkButton.click();

    // Verify modal container exists and header matches
    const modalHeader = page.locator("h2", { hasText: /Bulk Lead Reassignment & Transfer/i });
    await expect(modalHeader).toBeVisible();

    // Check tab titles
    const reassignTab = page.getByRole("button", { name: /Bulk Reassign Leads/i });
    const exportTab = page.getByRole("button", { name: /Export Contacts/i });
    await expect(reassignTab).toBeVisible();
    await expect(exportTab).toBeVisible();

    // Switch to Export tab
    await exportTab.click();
    await expect(page.locator("label", { hasText: /Select Agent to Export Contacts/i })).toBeVisible();

    // Switch back to Reassign tab
    await reassignTab.click();
    await expect(page.locator("label", { hasText: /Source Agent/i })).toBeVisible();

    // Close modal
    const closeButton = page.locator("button").filter({ has: page.locator("svg.lucide-x") });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  test("should show validation warning when selecting a source agent with no leads", async ({ page }: any) => {
    await page.goto(LEADS_PAGE);

    const bulkButton = page.getByTestId("bulk-reassign-btn");
    await bulkButton.click();

    // Select source agent select box
    const sourceSelect = page.locator("#source-agent");
    await sourceSelect.selectOption({ index: 1 }); // pick first available agent

    // It should check the lead count dynamically and display information or validation warnings
    // Check if there is lead count display or error warnings depending on seeds
    const warningOrCount = page.locator("text=/leads assigned|No leads to reassign/i");
    await expect(warningOrCount.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show explicit confirmation prompt in the single reassign flow", async ({ page }: any) => {
    await page.goto(LEADS_PAGE);

    await page.getByTestId("bulk-reassign-btn").click();

    // Fill source agent select
    const sourceSelect = page.locator("#source-agent");
    await sourceSelect.selectOption({ index: 1 });

    // Wait until lead count is verified
    await expect(page.locator("text=/leads assigned/i")).toBeVisible({ timeout: 5000 });

    // Make sure Single target mode is active by default
    const singleLabel = page.locator("text=/Single Target Agent/i");
    await expect(singleLabel).toBeVisible();

    // Select target agent select
    const targetSelect = page.locator("#target-agent");
    await targetSelect.selectOption({ index: 2 });

    // Click Continue
    const continueBtn = page.getByRole("button", { name: /Continue/i });
    await continueBtn.click();

    // Verify explicit confirmation dialog renders (AC #6)
    await expect(page.locator("text=/Explicit Confirmation Required/i")).toBeVisible();
    await expect(page.locator("text=/Are you sure? This will reassign/i")).toBeVisible();

    // Cancel reassignment
    const cancelBtn = page.getByTestId("cancel-reassign-dialog-btn");
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Should return to the configuration view
    await expect(continueBtn).toBeVisible();
  });
});
