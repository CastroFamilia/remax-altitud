/**
 * Story 4.1: Listing Detail Page & Photo Gallery
 * Tests: ISR revalidation constant + getAllPropertySlugs query
 *
 * Covers:
 *   4.1-UNIT-002 — Listing detail page has ISR revalidate = 86400 (daily) (AC #10, NFR25)
 *   AC #10      — getAllPropertySlugs returns string array for generateStaticParams
 *
 * Environment: node (no JSX — .spec.ts runs in node environment by default)
 */

import { vi, describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// Mock drizzle db to avoid real DB calls
// Note: properties.ts and agents.ts import from "@/lib/db/client" (not "@/lib/db")
vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([
            { slug: "beautiful-mountain-home" },
            { slug: "ocean-view-retreat" },
            { slug: "jungle-bungalow-perez-zeledon" },
          ]),
        ),
        limit: vi.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

// Mock server-only to avoid server-only import error in test environment
vi.mock("server-only", () => ({}));

// Mock next/cache for the revalidateTag function used in the sync pipeline
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

// Mock next/headers — required by some server components
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(() => null) })),
  headers: vi.fn(() => ({ get: vi.fn(() => null) })),
}));

// Mock next/navigation — required by pages and next-intl internals
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/en/property/test"),
  useParams: vi.fn(() => ({ locale: "en" })),
  useSelectedLayoutSegment: vi.fn(() => null),
  useSelectedLayoutSegments: vi.fn(() => []),
}));

// Mock @/i18n/navigation to avoid next-intl internals that import next/navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: unknown }) => children,
  redirect: vi.fn(),
  usePathname: vi.fn(() => "/en/property/test"),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  getPathname: vi.fn(() => "/en/property/test"),
}));

// Mock next-intl/navigation to prevent ESM resolution issues
vi.mock("next-intl/navigation", () => ({
  createNavigation: vi.fn(() => ({
    Link: ({ children }: { children: unknown }) => children,
    redirect: vi.fn(),
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    getPathname: vi.fn(),
  })),
}));

// Mock next-intl server
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(
    () =>
      async (key: string) =>
        key,
  ),
  getLocale: vi.fn(async () => "en"),
}));

// Mock next/dynamic to avoid issues with lazy-loaded components
vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

// Mock PropertyGallery and its loader to avoid component resolution errors in page module
vi.mock("@/components/listing/property-gallery", () => ({
  PropertyGallery: () => null,
  default: () => null,
}));

vi.mock("@/components/listing/property-gallery-loader", () => ({
  PropertyGalleryLoader: () => null,
  default: () => null,
}));

// Mock ListingDetailLayout to avoid component resolution errors in page module
vi.mock("@/components/listing/listing-detail-layout", () => ({
  ListingDetailLayout: () => null,
  default: () => null,
}));

// ---------------------------------------------------------------------------
// Tests — ISR revalidation constant (4.1-UNIT-002)
// ---------------------------------------------------------------------------

describe("Listing Detail Page — ISR revalidation (Story 4.1)", () => {
  it(
    "[P2] 4.1-UNIT-002: page exports revalidate = 86400 (daily ISR revalidation, NFR25)",
    async () => {
      const pageModule = (await import(
        "@/app/[locale]/property/[slug]/page"
      )) as Record<string, unknown>;

      // The page must export revalidate = 86400
      // This confirms SSG/ISR is configured (not force-dynamic)
      expect(pageModule["revalidate"]).toBe(86400);
    },
  );

  it(
    "[P2] page does NOT export dynamic = 'force-dynamic' (must be removed per Task 1)",
    async () => {
      const pageModule = (await import(
        "@/app/[locale]/property/[slug]/page"
      )) as Record<string, unknown>;

      // force-dynamic must be removed — its presence means ISR is disabled
      expect(pageModule["dynamic"]).not.toBe("force-dynamic");
    },
  );
});

// ---------------------------------------------------------------------------
// Tests — getAllPropertySlugs query
// ---------------------------------------------------------------------------

describe("getAllPropertySlugs query (Story 4.1)", () => {
  it(
    "[P2] getAllPropertySlugs is exported from properties.ts and returns string array",
    async () => {
      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as Record<string, unknown>;

      const getAllPropertySlugs = propertiesModule[
        "getAllPropertySlugs"
      ] as () => Promise<string[]>;
      expect(getAllPropertySlugs).toBeDefined();
      expect(typeof getAllPropertySlugs).toBe("function");

      const slugs = await getAllPropertySlugs();
      expect(Array.isArray(slugs)).toBe(true);
      expect(slugs.length).toBeGreaterThan(0);
      slugs.forEach((slug) => {
        expect(typeof slug).toBe("string");
        expect(slug.length).toBeGreaterThan(0);
      });
    },
  );

  it(
    "[P2] getAllPropertySlugs returns only slugs for visible properties",
    async () => {
      const propertiesModule = (await import(
        "@/lib/db/queries/properties"
      )) as Record<string, unknown>;

      const getAllPropertySlugs = propertiesModule[
        "getAllPropertySlugs"
      ] as () => Promise<string[]>;

      const slugs = await getAllPropertySlugs();
      // Based on db mock: should include the 3 seeded slugs
      expect(slugs).toContain("beautiful-mountain-home");
    },
  );
});

// ---------------------------------------------------------------------------
// Tests — getAgentById query
// ---------------------------------------------------------------------------

describe("getAgentById query (Story 4.1)", () => {
  it(
    "[P2] getAgentById is exported from agents.ts",
    async () => {
      const agentsModule = (await import(
        "@/lib/db/queries/agents"
      )) as Record<string, unknown>;

      const getAgentById = agentsModule["getAgentById"];
      expect(getAgentById).toBeDefined();
      expect(typeof getAgentById).toBe("function");
    },
  );
});
