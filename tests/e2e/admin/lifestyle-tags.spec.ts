/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.4: Lifestyle Tag Administration - E2E Tests", () => {
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

  test("[P0] 8.4-E2E-001: displays all active property listings in tag management page (AC1, AC7)", async ({
    page,
  }: any) => {
    // Given the admin lifestyle tags view
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/tags");

    // When viewed
    // Then it displays properties in a searchable and paginated table with their active tags
    const table = page.locator('table[data-testid="listings-tags-table"]');
    await expect(table).toBeVisible();

    const searchInput = page.locator('input[data-testid="search-listings-input"]');
    await expect(searchInput).toBeVisible();

    const firstListingRow = page.locator('tr[data-testid="listing-tags-row"]').first();
    await expect(firstListingRow).toBeVisible();
    await expect(firstListingRow.locator('[data-testid="listing-ref-code"]')).toBeVisible();
    await expect(firstListingRow.locator('[data-testid="listing-tags-chips"]')).toBeVisible();
  });

  test("[P0] 8.4-E2E-002: adds a tag to a listing and revalidates (AC2, AC6)", async ({
    page,
  }: any) => {
    // Given the admin lifestyle tags view
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/tags");

    const firstRow = page.locator('tr[data-testid="listing-tags-row"]').first();
    const manageButton = firstRow.locator('button[data-testid="manage-tags-btn"]');
    await manageButton.click();

    // When the admin adds a tag (e.g. "Investment Property")
    const modal = page.locator('[data-testid="manage-tags-modal"]');
    await expect(modal).toBeVisible();

    const tagCheckbox = modal.locator('input[value="investment-property"]');
    await tagCheckbox.check();

    const saveButton = modal.locator('button[data-testid="save-tags-btn"]');
    await saveButton.click();

    // Then the tag is appended to the listing and revalidated
    await expect(modal).not.toBeVisible();
    const activeChips = firstRow.locator('[data-testid="listing-tags-chips"]');
    await expect(activeChips).toContainText("Investment Property");
  });

  test("[P0] 8.4-E2E-003: removes a tag from a listing (AC3)", async ({ page }: any) => {
    // Given a listing with tags
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/tags");

    const firstRow = page.locator('tr[data-testid="listing-tags-row"]').first();
    const manageButton = firstRow.locator('button[data-testid="manage-tags-btn"]');
    await manageButton.click();

    // When the admin removes a tag
    const modal = page.locator('[data-testid="manage-tags-modal"]');
    await expect(modal).toBeVisible();

    const tagCheckbox = modal.locator('input[value="investment-property"]');
    await tagCheckbox.uncheck();

    const saveButton = modal.locator('button[data-testid="save-tags-btn"]');
    await saveButton.click();

    // Then the tag is removed from the listing's array
    await expect(modal).not.toBeVisible();
    const activeChips = firstRow.locator('[data-testid="listing-tags-chips"]');
    await expect(activeChips).not.toContainText("Investment Property");
  });

  test("[P1] 8.4-E2E-004: overrides auto-tagging from sync pipeline (AC4)", async ({
    page,
  }: any) => {
    // Given the admin tag management UI
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/tags");

    // When an admin manually overrides a tag
    const firstRow = page.locator('tr[data-testid="listing-tags-row"]').first();
    const manageButton = firstRow.locator('button[data-testid="manage-tags-btn"]');
    await manageButton.click();

    const modal = page.locator('[data-testid="manage-tags-modal"]');
    const tagCheckbox = modal.locator('input[value="luxury-property"]');
    await tagCheckbox.check();

    const saveButton = modal.locator('button[data-testid="save-tags-btn"]');
    await saveButton.click();

    // Then the manual override is visible and takes precedence
    const activeChips = firstRow.locator('[data-testid="listing-tags-chips"]');
    await expect(activeChips).toContainText("Luxury Property");
  });
});
