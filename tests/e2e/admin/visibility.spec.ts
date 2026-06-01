/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";
import { createHash } from "crypto";

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Story 8.6: Listing Visibility & SEO Monitoring - E2E Tests (ATDD RED)", () => {
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

  test("[P0] 8.6-E2E-001: displays listings with visibility toggles and active admin hidden filter (AC1, AC7)", async ({
    page,
  }: any) => {
    // Given the admin visibility view
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/visibility");

    // When viewed
    // Then it displays properties in a table with visibility status and quick filters
    const table = page.locator('table[data-testid="listings-visibility-table"]');
    await expect(table).toBeVisible();

    const hiddenFilter = page.locator('input[data-testid="filter-hidden-only-checkbox"]');
    await expect(hiddenFilter).toBeVisible();

    const firstListingRow = page.locator('tr[data-testid="listing-visibility-row"]').first();
    await expect(firstListingRow).toBeVisible();
    await expect(firstListingRow.locator('[data-testid="visibility-toggle-btn"]')).toBeVisible();
  });

  test("[P0] 8.6-E2E-002: admin toggles property visibility to hidden and verifies exclusion (AC1, AC3, AC6)", async ({
    page,
  }: any) => {
    // Given the admin visibility view
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/visibility");

    const firstRow = page.locator('tr[data-testid="listing-visibility-row"]').first();
    const toggleButton = firstRow.locator('[data-testid="visibility-toggle-btn"]');
    const propertySlug = await firstRow.getAttribute("data-property-slug");

    // When admin toggles visibility to hidden
    await toggleButton.click();

    // Then visibility badge updates to "Hidden"
    const badge = firstRow.locator('[data-testid="visibility-status-badge"]');
    await expect(badge).toHaveText("Hidden");

    // And search results exclude this property
    await page.goto(`/en/search?q=${propertySlug}`);
    const noResults = page.locator('[data-testid="no-results-message"]');
    await expect(noResults).toBeVisible();

    // Cleanup: Restore visibility to visible to ensure test state isolation
    await page.goto("/en/admin/visibility");
    const targetRow = page.locator(`tr[data-property-slug="${propertySlug}"]`);
    const toggleBackBtn = targetRow.locator('[data-testid="visibility-toggle-btn"]');
    await toggleBackBtn.click();
    
    // Assert status is successfully restored to Visible
    const restoredBadge = targetRow.locator('[data-testid="visibility-status-badge"]');
    await expect(restoredBadge).toHaveText("Visible");
  });

  test("[P0] 8.6-E2E-003: directly accessing a hidden listing displays a high-converting Agent CTA (AC2)", async ({
    page,
  }: any) => {
    // Given a listing that has been set to hidden (e.g. slug: "ocean-view-condo")
    const hiddenListingSlug = "ocean-view-condo";

    // When a visitor directly accesses its URL
    await page.goto(`/en/property/${hiddenListingSlug}`);

    // Then they see a graceful "No longer available" message
    const heading = page.locator('h1[data-testid="unavailable-heading"]');
    await expect(heading).toHaveText("No longer available");

    // And a premium, high-converting Agent Card CTA is displayed
    const agentCard = page.locator('[data-testid="unavailable-agent-cta-card"]');
    await expect(agentCard).toBeVisible();

    // With a pre-filled WhatsApp/Email contact button
    const whatsappBtn = agentCard.locator('a[data-testid="agent-whatsapp-btn"]');
    await expect(whatsappBtn).toBeVisible();
    
    const href = await whatsappBtn.getAttribute("href");
    expect(href).toContain("text=");
    expect(href).toContain("no longer available");
  });

  test("[P1] 8.6-E2E-004: displays integrated GSC and GA4 analytics metrics on the SEO Dashboard (AC4, AC5)", async ({
    page,
  }: any) => {
    // Given the admin visibility and SEO dashboard
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/en/admin/visibility");

    // When accessing the SEO/Analytics tab/section
    const analyticsSection = page.locator('[data-testid="seo-monitoring-dashboard"]');
    await expect(analyticsSection).toBeVisible();

    // Then they can view GSC widget data (Organic traffic trends, impressions, CTR, Top keywords)
    const gscWidget = page.locator('[data-testid="gsc-analytics-widget"]');
    await expect(gscWidget).toBeVisible();
    await expect(gscWidget.locator('[data-testid="gsc-impressions-metric"]')).toBeVisible();
    await expect(gscWidget.locator('[data-testid="gsc-ctr-metric"]')).toBeVisible();

    // And they can view GA4 widget data (Top performing pages, list saves, page views)
    const ga4Widget = page.locator('[data-testid="ga4-analytics-widget"]');
    await expect(ga4Widget).toBeVisible();
    await expect(ga4Widget.locator('[data-testid="ga4-popular-pages-list"]')).toBeVisible();

    // And rendering any page contains GA4 cookieless integration scripts
    await page.goto("/en");
    const gaScript = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    await expect(gaScript).toBeAttached();
  });
});
