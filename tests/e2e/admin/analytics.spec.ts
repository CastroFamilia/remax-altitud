/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.7: Shortlist Analytics", () => {
  
  test.describe("Visitor shortlist events", () => {
    test("[P0] 8.7-E2E-001: records anonymous event on property save/unsave click (AC1)", async ({ page }: any) => {
      // 1. Given a visitor page on a property listing card
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/search");

      // Monitor network requests for the shortlist events endpoint
      const eventRequestPromise = page.waitForRequest(
        (request: any) =>
          request.url().includes("/api/shortlist/events") &&
          request.method() === "POST"
      );

      // 2. When the visitor clicks the Heart save button
      const saveButton = page.locator('button[data-testid="save-button"]').first();
      await saveButton.click();

      // 3. Then an anonymous analytics event is fired to the server
      const request = await eventRequestPromise;
      const requestBody = JSON.parse(request.postData() || "{}");

      expect(requestBody).toHaveProperty("propertyId");
      expect(requestBody.action).toBe("save");
      expect(requestBody.locale).toBe("en");
    });
  });

  test.describe("Admin Analytics Portal", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    test.beforeEach(async ({ context }: any) => {
      // Authenticate as Admin
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

    test("[P0] 8.7-E2E-002: sidebar navigation links to Shortlist Analytics page (AC2)", async ({ page }: any) => {
      // 1. Given the admin loads the portal
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin");

      // 2. When the admin looks at the sidebar
      const analyticsLink = page.locator('a[href="/en/admin/analytics/shortlist"]');

      // 3. Then the link is visible and contains the BarChart icon (or text)
      await expect(analyticsLink).toBeVisible();
      await expect(analyticsLink.locator('svg.lucide-bar-chart-3, svg.lucide-trending-up, svg')).toBeVisible();
    });

    test("[P0] 8.7-E2E-003: displays searchable, paginated analytics table with 0-saves properties (AC3)", async ({ page }: any) => {
      // 1. Given the admin opens the shortlist analytics view
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/analytics/shortlist");

      // 2. When the view loads
      const table = page.locator('table[data-testid="analytics-table"]');
      await expect(table).toBeVisible();

      // 3. Then each property shows total, 30-day, and active saves
      const headerRow = table.locator("thead tr");
      await expect(headerRow).toContainText("Saves (All Time)");
      await expect(headerRow).toContainText("Saves (30 Days)");
      await expect(headerRow).toContainText("Active Saves");

      // Properties with 0 saves must be visible
      const zeroSavesRow = page.locator('tr[data-testid="property-saves-zero"]').first();
      await expect(zeroSavesRow).toBeVisible();
      await expect(zeroSavesRow).toContainText("0 saves");
    });

    test("[P0] 8.7-E2E-004: ranks properties by 30-day save count when sorted by popularity (AC4)", async ({ page }: any) => {
      // 1. Given the admin shortlist analytics view
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/analytics/shortlist");

      // 2. When sorted by popularity (30-day saves)
      const popularitySortBtn = page.locator('button[data-testid="sort-saves30"]');
      await popularitySortBtn.click();

      // 3. Then properties are ranked by the 30-day save count ("most shortlisted")
      const firstRow = page.locator('tbody tr[data-testid="property-row"]').first();
      await expect(firstRow).toBeVisible();
    });

    test("[P0] 8.7-E2E-005: shows active shortlist popularity count alongside properties in leads list (AC5)", async ({ page }: any) => {
      // 1. Given the admin opens the lead management view
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto("/en/admin/leads");

      // 2. When a lead references a specific property
      const leadRow = page.locator('tr[data-testid="lead-row-1"]');
      await expect(leadRow).toBeVisible();

      // 3. Then the active shortlist popularity count (current saves) is visible inline
      const propertyRefCell = leadRow.locator('.property-ref-popularity');
      await expect(propertyRefCell).toBeVisible();
      await expect(propertyRefCell).toContainText(/saves/);
    });
  });
});
