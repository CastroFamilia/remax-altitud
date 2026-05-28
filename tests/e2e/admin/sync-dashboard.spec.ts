/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

const ADMIN_SYNC_PAGE_URL_EN = "/en/admin";
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.1: Sync Status Dashboard E2E Tests", () => {
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

  test(
    "[P0] 8.1-E2E-001: loads the dashboard and displays sync logs chronological list with status badges",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);
      await expect(page.locator("h1")).toContainText("Sync Status & Monitoring");
      const rows = page.getByTestId("sync-log-row");
      await expect(rows.first()).toBeVisible();
      const statusBadge = rows.first().getByTestId("sync-status-badge");
      await expect(statusBadge).toBeVisible();
    }
  );

  test(
    "[P1] 8.1-E2E-002: applying date range and status filters updates filtered logs list",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);
      const filterSection = page.getByText("Filters");
      await expect(filterSection).toBeVisible();
      await page.locator("input[type='date']").first().fill("2026-05-01");
      await page.locator("input[type='date']").last().fill("2026-05-28");
      await page.locator("select").selectOption("failure");
      await page.role("button", { name: "Apply Filters" }).click();
      expect(page.url()).toContain("status=failure");
      expect(page.url()).toContain("startDate=2026-05-01");
    }
  );

  test(
    "[P0] 8.1-E2E-003: expanding a failed log displays diagnostic error text",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);
      const failureRow = page.locator("[data-testid='sync-log-row']").filter({ hasText: "Failure" }).first();
      await expect(failureRow).toBeVisible();
      await failureRow.click();
      const diagnosticSection = page.getByTestId("error-diagnostic-details");
      await expect(diagnosticSection).toBeVisible();
      await expect(diagnosticSection).toContainText("API timeout");
    }
  );

  test(
    "[P1] 8.1-E2E-004: loads and displays active listings count and last success timestamp",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(ADMIN_SYNC_PAGE_URL_EN);
      const activeListingsCard = page.getByText("Active Listings");
      await expect(activeListingsCard).toBeVisible();
      const lastSuccessCard = page.getByText("Last Successful Sync");
      await expect(lastSuccessCard).toBeVisible();
    }
  );
});
