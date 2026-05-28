/**
 * Story 8.1: Sync Status Dashboard & Monitoring — E2E Integration Tests
 *
 * All tests are test.skip() until components and APIs are implemented.
 *
 * Covers:
 *   - 8.1-E2E-001: Dashboard displays recent sync logs correctly with color badges for statuses (AC #1, #2)
 *   - 8.1-E2E-002: Applying date range and status filters updates URL or filters logs on dashboard (AC #3)
 *   - 8.1-E2E-003: Expanding a failed log displays diagnostic error text from the database column (AC #2)
 *   - 8.1-E2E-004: Stats summary is loaded showing active listings count and last successful sync timestamp (AC #4)
 */

// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

const ADMIN_SYNC_PAGE_URL_EN = "/en/admin";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.1: Sync Status Dashboard E2E Tests", () => {
  // ---------------------------------------------------------------------------
  // 8.1-E2E-001: Dashboard displays recent sync logs with correct statuses
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 8.1-E2E-001: loads the dashboard and displays sync logs chronological list with status badges",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);

      // Verify the title is displayed
      await expect(page.locator("h1")).toContainText("Sync Status & Monitoring");

      // Verify log rows are rendered
      const rows = page.getByTestId("sync-log-row");
      await expect(rows.first()).toBeVisible();

      // Check status badge contains valid content
      const statusBadge = rows.first().getByTestId("sync-status-badge");
      await expect(statusBadge).toBeVisible();
    }
  );

  // ---------------------------------------------------------------------------
  // 8.1-E2E-002: Applying filters (status + date range)
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 8.1-E2E-002: applying date range and status filters updates filtered logs list",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);

      // Verify filters section is visible
      const filterSection = page.getByText("Filters");
      await expect(filterSection).toBeVisible();

      // Set date inputs
      await page.locator("input[type='date']").first().fill("2026-05-01");
      await page.locator("input[type='date']").last().fill("2026-05-28");

      // Select a status
      await page.locator("select").selectOption("failure");

      // Click apply filters
      await page.role("button", { name: "Apply Filters" }).click();

      // Verify URL parameters or visual filtered state
      expect(page.url()).toContain("status=failure");
      expect(page.url()).toContain("startDate=2026-05-01");
    }
  );

  // ---------------------------------------------------------------------------
  // 8.1-E2E-003: Expand failure log and view diagnostic errors
  // ---------------------------------------------------------------------------
  test.skip(
    "[P0] 8.1-E2E-003: expanding a failed log displays diagnostic error text",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);

      // Find a row marked as failure
      const failureRow = page.locator("[data-testid='sync-log-row']").filter({ hasText: "Failure" }).first();
      await expect(failureRow).toBeVisible();

      // Clicking to expand accordion
      await failureRow.click();

      // Assert error message and JSON diagnostics are visible
      const diagnosticSection = page.getByTestId("error-diagnostic-details");
      await expect(diagnosticSection).toBeVisible();
      await expect(diagnosticSection).toContainText("API timeout");
    }
  );

  // ---------------------------------------------------------------------------
  // 8.1-E2E-004: Summary statistics loading
  // ---------------------------------------------------------------------------
  test.skip(
    "[P1] 8.1-E2E-004: loads and displays active listings count and last success timestamp",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);

      // Assert active listings metric card
      const activeListingsCard = page.getByText("Active Listings");
      await expect(activeListingsCard).toBeVisible();

      // Assert last success card
      const lastSuccessCard = page.getByText("Last Successful Sync");
      await expect(lastSuccessCard).toBeVisible();
    }
  );
});
