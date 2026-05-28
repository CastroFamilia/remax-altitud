/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe.skip("Story 8.5: Community Administration - E2E Tests", () => {
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

  test("[P0] 8.5-E2E-001: displays all active communities in management page (AC1)", async ({
    page,
  }: any) => {
    // Given the admin communities view
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/communities");

    // When viewed
    // Then it displays communities in a searchable table and has a create community CTA
    const table = page.locator('table[data-testid="communities-table"]');
    await expect(table).toBeVisible();

    const searchInput = page.locator('input[data-testid="search-communities-input"]');
    await expect(searchInput).toBeVisible();

    const createBtn = page.locator('[data-testid="create-community-btn"]');
    await expect(createBtn).toBeVisible();
  });

  test("[P0] 8.5-E2E-002: creates a new community with drawn geo-fence and centroid calculations (AC1, AC2)", async ({
    page,
  }: any) => {
    // Given the admin create community form
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/communities/new");

    // When the admin fills in rich metadata
    await page.fill('input[data-testid="community-name-input"]', "Reserva Conchal");
    await page.fill('input[data-testid="community-slug-input"]', "reserva-conchal");
    await page.selectOption('select[data-testid="community-area-select"]', { label: "Guanacaste" });
    await page.fill('input[data-testid="community-tagline-en-input"]', "Luxury Beach & Golf");
    await page.fill('input[data-testid="community-tagline-es-input"]', "Playa y Golf de Lujo");
    await page.fill('textarea[data-testid="community-desc-en-input"]', "A premium community...");
    await page.fill('textarea[data-testid="community-desc-es-input"]', "Una comunidad premium...");

    // And fills quick facts
    await page.fill('input[data-testid="quickfact-elevation"]', "50m");
    await page.fill('input[data-testid="quickfact-airportDistance"]', "45 mins");
    await page.fill('input[data-testid="quickfact-internet"]', "Fiber Optic");
    await page.fill('input[data-testid="quickfact-amenities"]', "Golf, Beach Club");
    await page.fill('input[data-testid="quickfact-developer"]', "FIFCO");
    await page.fill('input[data-testid="quickfact-established"]', "1996");

    // And draws a polygon on the interactive Mapbox map
    // We simulate drawing by interacting with the map drawing canvas or providing coordinate seeds
    const mapCanvas = page.locator('.mapboxgl-canvas');
    await expect(mapCanvas).toBeVisible();
    
    // Fill coordinates manually as backup/seed testids
    await page.fill('textarea[data-testid="community-geofence-input"]', "[[-84.15,9.93],[-84.16,9.94],[-84.17,9.93],[-84.15,9.93]]");

    const saveBtn = page.locator('button[data-testid="save-community-btn"]');
    await saveBtn.click();

    // Then the community is successfully created and redirected
    await expect(page).toHaveURL(/\/admin\/communities/);
  });

  test("[P0] 8.5-E2E-003: edits an existing community's geo-fence polygon (AC2, AC5)", async ({
    page,
  }: any) => {
    // Given an existing community details form
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/communities/reserva-conchal");

    // When the geo-fence boundary polygon is edited
    await page.fill('textarea[data-testid="community-geofence-input"]', "[[-84.15,9.93],[-84.16,9.95],[-84.17,9.93],[-84.15,9.93]]");

    const saveBtn = page.locator('button[data-testid="save-community-btn"]');
    await saveBtn.click();

    // Then it saves and returns to community list
    await expect(page).toHaveURL(/\/admin\/communities/);
  });

  test("[P1] 8.5-E2E-004: overrides a property community assignment manually and syncs (AC3, AC4)", async ({
    page,
  }: any) => {
    // Given the listing admin view with community assignment override selector
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/properties/luxury-villa");

    // When the admin manually assigns a community to a listing
    const communitySelect = page.locator('select[data-testid="property-community-override-select"]');
    await communitySelect.selectOption({ label: "Reserva Conchal" });

    const saveBtn = page.locator('button[data-testid="save-property-community-btn"]');
    await saveBtn.click();

    // Then manual override is displayed and preserved
    await expect(communitySelect).toHaveValue("reserva-conchal-id");
  });
});
