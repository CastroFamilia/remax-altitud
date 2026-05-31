/**
 * Story 4.4: SEO Architecture & WordPress Redirects — E2E Tests
 *
 * TDD Phase: RED — all tests are test.skip() until implementation is complete and
 * a seeded dev/staging environment is available.
 * Remove test.skip() per test when implementing to verify green phase.
 *
 * Prerequisites:
 *   - Playwright framework configured (playwright.config.ts)
 *   - Staging/local environment with DB seeded (≥1 property, ≥1 agent)
 *   - Seed slugs: "beautiful-mountain-home" (property), "emma-smith" (agent)
 *   - next.config.ts redirects() configured with staticRedirects
 *   - JSON-LD scripts added to listing and agent pages (Tasks 7 & 8)
 *
 * Acceptance criteria covered:
 *   AC #1  — 4.4-E2E-001: Listing detail page contains RealEstateListing JSON-LD (P0)
 *   AC #2  — 4.4-E2E-002: Agent profile page contains RealEstateAgent JSON-LD (P0)
 *   AC #5  — 4.4-E2E-003: hreflang tags present on listing and agent pages (P0)
 *   AC #8  — 4.4-E2E-004: Open Graph tags present on listing and agent pages (P1)
 *   AC #8  — 4.4-E2E-005: Title, meta description, and canonical URL present (P1)
 *   AC #7  — 4.4-E2E-006: WordPress redirect returns HTTP 301 (P2)
 *   AC #4  — 4.4-E2E-007: BreadcrumbList JSON-LD present on listing and agent pages (P1)
 *   AC #6  — 4.4-E2E-008: /sitemap.xml responds with 200 and contains URLs (P1)
 *   NFR26  — 4.4-E2E-009: Redirect response time < 50ms (P2)
 *   AC #9  — 4.4-E2E-010: Lighthouse SEO score ≥ 80 on listing page (P3 — advisory, see lighthouse CI)
 *
 * data-testid contract (CANNOT rename once established):
 *   data-testid="listing-jsonld"     — <script type="application/ld+json"> for RealEstateListing
 *   data-testid="breadcrumb-jsonld"  — <script type="application/ld+json"> for BreadcrumbList
 *   data-testid="agent-jsonld"       — <script type="application/ld+json"> for RealEstateAgent
 */

// NOTE: Playwright is not yet installed — this import will fail until
// playwright.config.ts is configured and @playwright/test is installed.
// @ts-expect-error — @playwright/test not yet installed
import { test, expect } from "@playwright/test";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LISTING_URL_EN = "/en/property/beautiful-mountain-home"; // seed slug required
const LISTING_URL_ES = "/es/property/beautiful-mountain-home";
const AGENT_PROFILE_URL_EN = "/en/agents/emma-smith"; // seed slug required
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ---------------------------------------------------------------------------
// AC #1 — 4.4-E2E-001: RealEstateListing JSON-LD on listing detail page (P0)
// ---------------------------------------------------------------------------

test.describe("Story 4.4: SEO Architecture — JSON-LD structured data (ATDD Red Phase)", () => {
  test.skip(
    "[P0] 4.4-E2E-001: listing detail page contains <script type='application/ld+json'> with @type: 'RealEstateListing'",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — JSON-LD not yet implemented in listing page
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Locate the JSON-LD script with the listing-specific data-testid
      const listingJsonLdScript = page.locator(
        'script[type="application/ld+json"][data-testid="listing-jsonld"]',
      );
      await expect(listingJsonLdScript).toHaveCount(1);

      // Parse and validate @type
      const content = await listingJsonLdScript.textContent();
      const jsonLd = JSON.parse(content!);
      expect(jsonLd["@type"]).toBe("RealEstateListing");
    },
  );

  test.skip(
    "[P0] 4.4-E2E-001b: RealEstateListing JSON-LD has required Schema.org fields",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const script = page.locator(
        'script[type="application/ld+json"][data-testid="listing-jsonld"]',
      );
      const content = await script.textContent();
      const jsonLd = JSON.parse(content!);

      // Required fields per AC #1 (AR14) and 4.4-UNIT-001
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("RealEstateListing");
      expect(jsonLd["name"]).toBeTruthy();
      expect(jsonLd["price"]).toBeTruthy();
      expect(jsonLd["address"]).toBeTruthy();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #2 — 4.4-E2E-002: RealEstateAgent JSON-LD on agent profile page (P0)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P0] 4.4-E2E-002: agent profile page contains <script type='application/ld+json'> with @type: 'RealEstateAgent'",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — JSON-LD not yet implemented in agent page
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);
      await page.waitForLoadState("networkidle");

      const agentJsonLdScript = page.locator(
        'script[type="application/ld+json"][data-testid="agent-jsonld"]',
      );
      await expect(agentJsonLdScript).toHaveCount(1);

      const content = await agentJsonLdScript.textContent();
      const jsonLd = JSON.parse(content!);
      expect(jsonLd["@type"]).toBe("RealEstateAgent");
    },
  );

  test.skip(
    "[P0] 4.4-E2E-002b: RealEstateAgent JSON-LD has required Schema.org fields",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);
      await page.waitForLoadState("networkidle");

      const script = page.locator(
        'script[type="application/ld+json"][data-testid="agent-jsonld"]',
      );
      const content = await script.textContent();
      const jsonLd = JSON.parse(content!);

      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@type"]).toBe("RealEstateAgent");
      expect(jsonLd["name"]).toBeTruthy();
    },
  );

  // ---------------------------------------------------------------------------
  // AC #4 — BreadcrumbList JSON-LD (P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.4-E2E-007: listing detail page contains BreadcrumbList JSON-LD",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const breadcrumbScript = page.locator(
        'script[type="application/ld+json"][data-testid="breadcrumb-jsonld"]',
      );
      await expect(breadcrumbScript).toHaveCount(1);

      const content = await breadcrumbScript.textContent();
      const jsonLd = JSON.parse(content!);
      expect(jsonLd["@type"]).toBe("BreadcrumbList");
      expect(Array.isArray(jsonLd["itemListElement"])).toBe(true);
      expect(jsonLd["itemListElement"].length).toBeGreaterThanOrEqual(2);
    },
  );

  test.skip(
    "[P1] 4.4-E2E-007b: agent profile page contains BreadcrumbList JSON-LD",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);
      await page.waitForLoadState("networkidle");

      const breadcrumbScript = page.locator(
        'script[type="application/ld+json"][data-testid="breadcrumb-jsonld"]',
      );
      await expect(breadcrumbScript).toHaveCount(1);

      const content = await breadcrumbScript.textContent();
      const jsonLd = JSON.parse(content!);
      expect(jsonLd["@type"]).toBe("BreadcrumbList");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #5 — 4.4-E2E-003: hreflang tags (P0, R-007)
// ---------------------------------------------------------------------------

test.describe("Story 4.4: hreflang alternate language tags (4.4-E2E-003)", () => {
  test.skip(
    "[P0] 4.4-E2E-003a: listing detail page has hreflang='en' alternate link tag",
    async ({ page }: any) => {
      // THIS TEST WILL FAIL — hreflang not yet configured via buildAlternatesMetadata
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    },
  );

  test.skip(
    "[P0] 4.4-E2E-003b: listing detail page has hreflang='es' alternate link tag",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
    },
  );

  test.skip(
    "[P0] 4.4-E2E-003c: hreflang EN href points to the /en/ URL variant",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const enLink = page.locator('link[rel="alternate"][hreflang="en"]');
      const href = await enLink.getAttribute("href");
      expect(href).toContain("/en/property/");
    },
  );

  test.skip(
    "[P0] 4.4-E2E-003d: hreflang ES href points to the /es/ URL variant",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const esLink = page.locator('link[rel="alternate"][hreflang="es"]');
      const href = await esLink.getAttribute("href");
      expect(href).toContain("/es/property/");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-003e: agent profile page has both hreflang EN and ES alternate links",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);
      await page.waitForLoadState("networkidle");

      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
    },
  );

  test.skip(
    "[P1] 4.4-E2E-003f: ES locale listing page also has both hreflang tags",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_ES);
      await page.waitForLoadState("networkidle");

      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #8 — 4.4-E2E-004: Open Graph tags (P1, FR69)
// ---------------------------------------------------------------------------

test.describe("Story 4.4: Open Graph and meta tags (4.4-E2E-004, 4.4-E2E-005)", () => {
  test.skip(
    "[P1] 4.4-E2E-004a: listing page has og:title meta tag",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveCount(1);
      const content = await ogTitle.getAttribute("content");
      expect(content).toBeTruthy();
    },
  );

  test.skip(
    "[P1] 4.4-E2E-004b: listing page has og:description meta tag",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    },
  );

  test.skip(
    "[P1] 4.4-E2E-004c: listing page has og:image meta tag",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveCount(1);
    },
  );

  test.skip(
    "[P1] 4.4-E2E-004d: listing page has og:url meta tag",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const ogUrl = page.locator('meta[property="og:url"]');
      await expect(ogUrl).toHaveCount(1);
      const content = await ogUrl.getAttribute("content");
      expect(content).toContain("/en/property/");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-004e: agent profile page has Open Graph tags (og:title, og:description)",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(AGENT_PROFILE_URL_EN);
      await page.waitForLoadState("networkidle");

      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    },
  );

  // ---------------------------------------------------------------------------
  // AC #8 — 4.4-E2E-005: Title, meta description, canonical URL (P1)
  // ---------------------------------------------------------------------------

  test.skip(
    "[P1] 4.4-E2E-005a: listing page has non-empty <title> tag containing 'REMAX Altitud'",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title).toContain("REMAX Altitud");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-005b: listing page has meta name='description' with non-empty content",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const metaDesc = page.locator('meta[name="description"]');
      await expect(metaDesc).toHaveCount(1);
      const content = await metaDesc.getAttribute("content");
      expect(content).toBeTruthy();
      expect(content!.length).toBeGreaterThan(10);
    },
  );

  test.skip(
    "[P1] 4.4-E2E-005c: listing page has <link rel='canonical'> pointing to the correct URL",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = await canonical.getAttribute("href");
      expect(href).toContain("https://remax-altitud.cr/en/property/");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-005d: canonical URL is absolute (starts with https://)",
    async ({ page }: any) => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.goto(LISTING_URL_EN);
      await page.waitForLoadState("networkidle");

      const canonical = page.locator('link[rel="canonical"]');
      const href = await canonical.getAttribute("href");
      expect(href).toMatch(/^https:\/\//);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #7 — 4.4-E2E-006: WordPress 301 redirects (P2, R-001, NFR26)
// ---------------------------------------------------------------------------

test.describe("Story 4.4: WordPress 301 redirects (4.4-E2E-006)", () => {
  test.skip(
    "[P2] 4.4-E2E-006a: GET /contact returns HTTP 301 redirect",
    async ({ request }: any) => {
      // THIS TEST WILL FAIL — static redirects not yet added to next.config.ts
      // Using request.get() with redirect: "manual" to inspect the 301 status code
      const response = await request.get("/contact", { maxRedirects: 0 });
      expect(response.status()).toBe(301);
    },
  );

  test.skip(
    "[P2] 4.4-E2E-006b: GET /contact Location header points to /en/contact",
    async ({ request }: any) => {
      const response = await request.get("/contact", { maxRedirects: 0 });
      const location = response.headers()["location"];
      expect(location).toContain("/en/contact");
    },
  );

  test.skip(
    "[P2] 4.4-E2E-006c: GET /listings returns HTTP 301 redirect to /en/search",
    async ({ request }: any) => {
      const response = await request.get("/listings", { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      const location = response.headers()["location"];
      expect(location).toContain("/en/search");
    },
  );

  test.skip(
    "[P2] 4.4-E2E-006d: GET /propiedades returns HTTP 301 redirect to /es/search",
    async ({ request }: any) => {
      const response = await request.get("/propiedades", { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      const location = response.headers()["location"];
      expect(location).toContain("/es/search");
    },
  );

  test.skip(
    "[P2] 4.4-E2E-006e: GET /agents returns HTTP 301 redirect to /en/agents",
    async ({ request }: any) => {
      const response = await request.get("/agents", { maxRedirects: 0 });
      expect(response.status()).toBe(301);
    },
  );

  test.skip(
    "[P2] 4.4-E2E-006f: GET /agentes returns HTTP 301 redirect to /es/agents",
    async ({ request }: any) => {
      const response = await request.get("/agentes", { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      const location = response.headers()["location"];
      expect(location).toContain("/es/agents");
    },
  );

  // ---------------------------------------------------------------------------
  // NFR26 — redirect response time < 50ms
  // ---------------------------------------------------------------------------

  test.skip(
    "[P2] 4.4-E2E-009: 301 redirect response time is < 50ms (NFR26)",
    async ({ request }: any) => {
      const start = Date.now();
      const response = await request.get("/contact", { maxRedirects: 0 });
      const elapsed = Date.now() - start;

      expect(response.status()).toBe(301);
      // next.config.ts redirects are matched at CDN/proxy layer — typically 1-5ms
      expect(elapsed).toBeLessThan(50);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — 4.4-E2E-008: XML sitemap (P1, NFR27, R-012)
// ---------------------------------------------------------------------------

test.describe("Story 4.4: XML sitemap at /sitemap.xml (4.4-E2E-008)", () => {
  test.skip(
    "[P1] 4.4-E2E-008a: GET /sitemap.xml returns HTTP 200",
    async ({ request }: any) => {
      const response = await request.get("/sitemap.xml");
      expect(response.status()).toBe(200);
    },
  );

  test.skip(
    "[P1] 4.4-E2E-008b: /sitemap.xml Content-Type is application/xml",
    async ({ request }: any) => {
      const response = await request.get("/sitemap.xml");
      const contentType = response.headers()["content-type"];
      expect(contentType).toContain("xml");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-008c: /sitemap.xml body contains at least one property URL",
    async ({ request }: any) => {
      const response = await request.get("/sitemap.xml");
      const body = await response.text();
      expect(body).toContain("/en/property/");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-008d: /sitemap.xml body contains at least one agent URL",
    async ({ request }: any) => {
      const response = await request.get("/sitemap.xml");
      const body = await response.text();
      expect(body).toContain("/en/agents/");
    },
  );

  test.skip(
    "[P1] 4.4-E2E-008e: /sitemap.xml contains both EN and ES URL variants",
    async ({ request }: any) => {
      const response = await request.get("/sitemap.xml");
      const body = await response.text();
      expect(body).toContain("remax-altitud.cr/en/");
      expect(body).toContain("remax-altitud.cr/es/");
    },
  );

  test.skip(
    "[P2] 4.4-E2E-008f: /robots.txt allows '/' and includes sitemap URL",
    async ({ request }: any) => {
      const response = await request.get("/robots.txt");
      expect(response.status()).toBe(200);
      const body = await response.text();
      expect(body).toContain("Allow: /");
      expect(body).toContain("sitemap.xml");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #9 — 4.4-E2E-010: Lighthouse SEO score (P3 — advisory, run nightly)
// ---------------------------------------------------------------------------
// This test is intentionally left as a documentation-only skip.
// Lighthouse CI runs nightly via .github/workflows/lighthouse.yml and
// is NOT a PR gate. See Task 14 in the story file.
//
// test.skip(
//   "[P3] 4.4-E2E-010: Lighthouse SEO score ≥ 80 on listing detail page (NFR28)",
//   async () => {
//     // Run via lhci autorun — see .lighthouserc.js configuration
//     // This test is excluded from the regular Playwright suite.
//   }
// );
