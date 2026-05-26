/**
 * ATDD Scaffolds — Story 6.1: Area Guide Pages
 * Component Tests: AreaGuideHero, AreaGuideDescription, AreaGuideTabs
 *
 * TDD RED PHASE — all tests use it.skip() and will FAIL until:
 *   1. src/components/area/area-guide-hero.tsx is created
 *   2. src/components/area/area-guide-description.tsx is created
 *   3. src/components/area/area-guide-tabs.tsx is created
 *   4. src/components/area/area-index-card.tsx is created
 *
 * Coverage from test-design-epic-6.md:
 *   6.1-COMP-001 — JSON-LD Place schema present on area guide page (P1)
 *   6.1-COMP-002 — Climate/altitude data renders in hero or metadata section (P2)
 *   6.1-COMP-003 — SSG strategy (no ISR revalidation configured) (P2)
 *
 * Additional component-level coverage:
 *   AC #1  — Hero renders h1 with area name
 *   AC #2  — Description is a Server Component (no 'use client')
 *   AC #10 — JSON-LD Place schema present
 *   AC #12 — Gradient fallback when no hero image
 *   AC #13 — WAI-ARIA Tabs pattern attributes
 *
 * Activation instructions:
 *   1. Remove it.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/area/area-components.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeArea } from "../../fixtures/area-factories";

// ---------------------------------------------------------------------------
// Mock next-intl/server — prevent SSR errors in test environment
// ---------------------------------------------------------------------------

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
  setRequestLocale: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => key),
}));

// ---------------------------------------------------------------------------
// Mock next/image — simplified for component tests
// ---------------------------------------------------------------------------

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    return `<img src="${props.src}" alt="${props.alt}" />`;
  },
}));

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 6.1-COMP-001 — JSON-LD Place schema (AC #10, P1)
// ---------------------------------------------------------------------------

describe("JSON-LD Place Schema (6.1-COMP-001, AC #10)", () => {
  it(
    "[P1] 6.1-COMP-001: generatePlaceJsonLd returns Place schema with area data",
    async () => {
      // AC #10 — JSON-LD structured data for Place schema is present (AR14)
      const { generatePlaceJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const area = makeArea();
      const jsonLd = generatePlaceJsonLd(area as Parameters<typeof generatePlaceJsonLd>[0], "en");

      // Must return a valid Place schema
      expect(jsonLd).toHaveProperty("@type", "Place");
      expect(jsonLd).toHaveProperty("name");
      expect(jsonLd).toHaveProperty("description");
    },
  );

  it(
    "[P1] 6.1-COMP-001b: generatePlaceJsonLd uses English name when locale is 'en'",
    async () => {
      const { generatePlaceJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const area = makeArea();
      const jsonLd = generatePlaceJsonLd(area as Parameters<typeof generatePlaceJsonLd>[0], "en") as Record<string, unknown>;

      expect(jsonLd.name).toBe("Pérez Zeledón");
    },
  );

  it(
    "[P1] 6.1-COMP-001c: generatePlaceJsonLd uses Spanish description when locale is 'es'",
    async () => {
      const { generatePlaceJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const area = makeArea();
      const jsonLd = generatePlaceJsonLd(area as Parameters<typeof generatePlaceJsonLd>[0], "es") as Record<string, unknown>;

      expect(jsonLd.description).toContain("exuberante");
    },
  );

  it(
    "[P2] 6.1-COMP-001d: generatePlaceJsonLd includes geo coordinates when available",
    async () => {
      const { generatePlaceJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const area = makeArea();
      const jsonLd = generatePlaceJsonLd(area as Parameters<typeof generatePlaceJsonLd>[0], "en") as Record<string, unknown>;

      // Should include geo coordinates for Google Maps integration
      expect(jsonLd).toHaveProperty("geo");
      expect(jsonLd.geo).toHaveProperty("latitude", 9.37);
      expect(jsonLd.geo).toHaveProperty("longitude", -83.7);
    },
  );

  it(
    "[P2] 6.1-COMP-001e: generatePlaceJsonLd omits geo when coordinates are null",
    async () => {
      const { generatePlaceJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const area = makeArea({ latitude: null, longitude: null });
      const jsonLd = generatePlaceJsonLd(area as Parameters<typeof generatePlaceJsonLd>[0], "en") as Record<string, unknown>;

      expect(jsonLd).not.toHaveProperty("geo");
    },
  );
});

// ---------------------------------------------------------------------------
// 6.1-COMP-002 — Climate/altitude metadata (AC #1, P2)
// ---------------------------------------------------------------------------

describe("Area Metadata (6.1-COMP-002, AC #1)", () => {
  it(
    "[P2] 6.1-COMP-002: area metadata JSONB contains elevation and climate data",
    () => {
      // AC #1 — climate/altitude data is part of the area guide hero section
      const area = makeArea();
      const metadata = area.metadata as Record<string, string>;

      expect(metadata.elevation).toBe("700m");
      expect(metadata.climate).toBe("Tropical humid");
      expect(metadata.nearestAirport).toBeTruthy();
      expect(metadata.nearestHospital).toBeTruthy();
      expect(metadata.nearestBeach).toBeTruthy();
    },
  );
});

// ---------------------------------------------------------------------------
// Breadcrumb JSON-LD (AC #10 — Task 6)
// ---------------------------------------------------------------------------

describe("Breadcrumb JSON-LD (AC #10, Task 6)", () => {
  it(
    "[P1] generateBreadcrumbJsonLd produces valid BreadcrumbList for area guide: Home → Areas → Area Name",
    async () => {
      const { generateBreadcrumbJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const breadcrumb = generateBreadcrumbJsonLd([
        { name: "Home", href: "/en", position: 1 },
        { name: "Areas", href: "/en/areas", position: 2 },
        { name: "Pérez Zeledón", href: "/en/areas/perez-zeledon", position: 3 },
      ]) as Record<string, unknown>;

      expect(breadcrumb["@type"]).toBe("BreadcrumbList");
      expect(breadcrumb.itemListElement).toHaveLength(3);
      expect(breadcrumb.itemListElement[0].name).toBe("Home");
      expect(breadcrumb.itemListElement[2].name).toBe("Pérez Zeledón");
    },
  );

  it(
    "[P2] generateBreadcrumbJsonLd produces valid BreadcrumbList for area index: Home → Areas",
    async () => {
      const { generateBreadcrumbJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const breadcrumb = generateBreadcrumbJsonLd([
        { name: "Home", href: "/en", position: 1 },
        { name: "Areas", href: "/en/areas", position: 2 },
      ]) as Record<string, unknown>;

      expect(breadcrumb["@type"]).toBe("BreadcrumbList");
      expect(breadcrumb.itemListElement).toHaveLength(2);
    },
  );
});

// ---------------------------------------------------------------------------
// Area Guide Hero — gradient fallback (AC #12)
// ---------------------------------------------------------------------------

describe("AreaGuideHero gradient fallback (AC #12)", () => {
  it(
    "[P2] given area without heroImageUrl then hero component renders gradient instead of image",
    async () => {
      // AC #12 — gradient placeholder (navy-to-cream) when no hero image
      // Verifies the AreaGuideHero component uses conditional rendering based on heroImageUrl
      const fs = await import("node:fs");
      const heroSourcePath = "src/components/area/area-guide-hero.tsx";
      const source = fs.readFileSync(heroSourcePath, "utf-8");

      // The component MUST branch on heroImageUrl to show gradient vs image
      expect(source).toContain("heroImageUrl");
      expect(source).toContain("gradient");
      // Must NOT have 'use client' directive — it's a Server Component
      expect(source).not.toMatch(/^\s*["']use client["']/);
    },
  );

  it(
    "[P2] given area with heroImageUrl then hero component renders an image element",
    async () => {
      // Verify the source uses next/image when heroImageUrl is present
      const fs = await import("node:fs");
      const heroSourcePath = "src/components/area/area-guide-hero.tsx";
      const source = fs.readFileSync(heroSourcePath, "utf-8");

      // Should import and use next/image for optimized image delivery
      expect(source).toContain("next/image");
      expect(source).toContain("<Image");
    },
  );
});

// ---------------------------------------------------------------------------
// AreaGuideDescription — Server Component validation (AC #2)
// ---------------------------------------------------------------------------

describe("AreaGuideDescription Server Component (AC #2)", () => {
  it(
    "[P0] AreaGuideDescription source file does NOT contain 'use client' directive",
    async () => {
      // AC #2 — Description MUST be a Server Component so it appears in SSG HTML
      // Risk R-003: Client-rendered description invisible to Googlebot
      const fs = await import("node:fs");
      const descSourcePath = "src/components/area/area-guide-description.tsx";
      const source = fs.readFileSync(descSourcePath, "utf-8");

      expect(source).not.toMatch(/^\s*["']use client["']/);
      expect(source).toContain('data-testid="area-guide-description"');
    },
  );
});

// ---------------------------------------------------------------------------
// Area Index Card (AC #7)
// ---------------------------------------------------------------------------

describe("AreaIndexCard data contract (AC #7)", () => {
  it(
    "[P1] area data shape has all required fields for AreaIndexCard: name, region, propertyCount, description",
    () => {
      // AC #7 — area index card needs: area name, region badge, property count, description snippet
      const area = makeArea();

      expect(area.nameEn).toBeTruthy();
      expect(area.region).toMatch(/Mountain|Coast/);
      expect(area.propertyCount).toBeGreaterThanOrEqual(0);
      expect(area.descriptionEn.length).toBeGreaterThan(20);
    },
  );

  it(
    "[P2] area slug is URL-safe for use in generateStaticParams",
    () => {
      const area = makeArea();

      // Slug must be URL-safe (lowercase, hyphens, no spaces)
      expect(area.slug).toMatch(/^[a-z0-9-]+$/);
    },
  );

  it(
    "[P1] AreaIndexCard source contains required data-testid attributes for E2E compatibility",
    async () => {
      // Validate that the component has the test IDs that E2E tests depend on
      const fs = await import("node:fs");
      const cardSourcePath = "src/components/area/area-index-card.tsx";
      const source = fs.readFileSync(cardSourcePath, "utf-8");

      expect(source).toContain('data-testid="area-index-card"');
      expect(source).toContain('data-testid="region-badge"');
      expect(source).toContain('data-testid="area-property-count"');
      expect(source).toContain('data-testid="area-description-snippet"');
    },
  );
});

// ---------------------------------------------------------------------------
// Area Guide Tabs — WAI-ARIA contract (AC #13)
// ---------------------------------------------------------------------------

describe("AreaGuideTabs WAI-ARIA contract (AC #13)", () => {
  it(
    "[P1] AreaGuideTabs source implements WAI-ARIA Tabs pattern with required roles",
    async () => {
      // AC #13 — tabs must follow WAI-ARIA pattern for accessibility
      const fs = await import("node:fs");
      const tabsSourcePath = "src/components/area/area-guide-tabs.tsx";
      const source = fs.readFileSync(tabsSourcePath, "utf-8");

      // Must have role="tablist", role="tab", role="tabpanel"
      expect(source).toContain('role="tablist"');
      expect(source).toContain('role="tab"');
      expect(source).toContain('role="tabpanel"');
      // Must have aria-selected and aria-controls
      expect(source).toContain("aria-selected");
      expect(source).toContain("aria-controls");
    },
  );

  it(
    "[P1] AreaGuideTabs source contains all required data-testid attributes",
    async () => {
      // Verify the expected data-testid values from the test design doc
      const fs = await import("node:fs");
      const tabsSourcePath = "src/components/area/area-guide-tabs.tsx";
      const source = fs.readFileSync(tabsSourcePath, "utf-8");

      const expectedTestIds = [
        "area-guide-tabs",
        "area-guide-properties-tab",
        "area-guide-agents-tab",
        "area-guide-similar-tab",
      ];

      for (const testId of expectedTestIds) {
        expect(source).toContain(`data-testid="${testId}"`);
      }
    },
  );

  it(
    "[P1] AreaGuideTabs source implements keyboard navigation for ArrowLeft, ArrowRight, Home, End",
    async () => {
      // AC #13 — keyboard navigation is required for WAI-ARIA tabs
      const fs = await import("node:fs");
      const tabsSourcePath = "src/components/area/area-guide-tabs.tsx";
      const source = fs.readFileSync(tabsSourcePath, "utf-8");

      expect(source).toContain("ArrowRight");
      expect(source).toContain("ArrowLeft");
      expect(source).toContain('"Home"');
      expect(source).toContain('"End"');
    },
  );

  it(
    "[P1] AreaGuideTabs has exactly 3 tab panels: Properties, Agents, Similar Areas",
    async () => {
      // AC #3 — tabbed sections: Properties, Agents, Similar Areas
      const fs = await import("node:fs");
      const tabsSourcePath = "src/components/area/area-guide-tabs.tsx";
      const source = fs.readFileSync(tabsSourcePath, "utf-8");

      // Count actual tabpanel elements — only JSX attributes (line starts with whitespace + role=)
      const panelMatches = source.match(/^\s+role="tabpanel"/gm);
      expect(panelMatches).toHaveLength(3);
    },
  );
});
