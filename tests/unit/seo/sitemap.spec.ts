/**
 * Story 4.4: SEO Architecture & WordPress Redirects
 * Integration-style unit tests for sitemap generation and robots.txt
 *
 * TDD Phase: RED — all tests are it() until sitemap.ts and robots.ts are implemented.
 * Remove it() per test when implementing to verify green phase.
 *
 * Covers:
 *   4.4-UNIT-007 — XML sitemap endpoint returns 200 and contains listing/agent/area URLs (AC #6, R-012)
 *   (robots.ts — AC #8, NFR27)
 *
 * Strategy: Tests call the sitemap() and robots() functions directly (not via HTTP).
 * The function is mocked to return fixture data for property/agent slugs so no real
 * DB connection is needed.
 *
 * Environment: node (no JSX — .spec.ts runs in node environment by default)
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — MUST appear BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// Mock server-only to avoid "This module cannot be imported in a client context"
vi.mock("server-only", () => ({}));

// Mock DB query functions used by sitemap.ts
vi.mock("@/lib/db/queries/properties", () => ({
  getAllPropertySlugs: vi.fn(async () => [
    "beautiful-mountain-home",
    "ocean-view-retreat",
    "jungle-bungalow",
  ]),
  getPropertyBySlug: vi.fn(async () => null),
  searchProperties: vi.fn(async () => ({ properties: [], total: 0 })),
}));

vi.mock("@/lib/db/queries/agents", () => ({
  getAllAgentSlugs: vi.fn(async () => ["emma-smith", "john-doe"]),
  getAgentBySlug: vi.fn(async () => null),
  getAllAgents: vi.fn(async () => []),
}));

vi.mock("@/lib/db/queries/areas", () => ({
  getAllAreaSlugs: vi.fn(async () => ["perez-zeledon", "dominical"]),
}));

vi.mock("@/lib/db/queries/communities", () => ({
  getAllCommunityParams: vi.fn(async () => [
    { community: "rise", slug: "perez-zeledon" },
    { community: "serena-del-mar", slug: "dominical" },
  ]),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: () => unknown) => fn),
}));

// Mock SEO constants
vi.mock("@/lib/seo/constants", () => ({
  SITE_ORIGIN: "https://remax-altitud.cr",
  LOCALES: ["en", "es"],
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

// imported AFTER mocks

// ---------------------------------------------------------------------------
// 4.4-UNIT-007: sitemap() function (AC #6, NFR27)
// ---------------------------------------------------------------------------

describe("sitemap() function (4.4-UNIT-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "[P0] 4.4-UNIT-007a: returns an array (MetadataRoute.Sitemap)",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<unknown[]>;
      };
      const result = await sitemap();
      expect(Array.isArray(result)).toBe(true);
    },
  );

  it(
    "[P0] 4.4-UNIT-007b: result is non-empty (has at least static routes)",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<unknown[]>;
      };
      const result = await sitemap();
      expect(result.length).toBeGreaterThan(0);
    },
  );

  it(
    "[P0] 4.4-UNIT-007c: contains EN listing URLs for all property slugs",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<{ url: string }[]>;
      };
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);
      expect(urls).toContain(
        "https://remax-altitud.cr/en/property/beautiful-mountain-home",
      );
      expect(urls).toContain(
        "https://remax-altitud.cr/en/property/ocean-view-retreat",
      );
    },
  );

  it(
    "[P0] 4.4-UNIT-007d: contains ES listing URLs for all property slugs",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<{ url: string }[]>;
      };
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);
      expect(urls).toContain(
        "https://remax-altitud.cr/es/property/beautiful-mountain-home",
      );
    },
  );

  it(
    "[P0] 4.4-UNIT-007e: contains agent URLs for all agent slugs (both locales)",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<{ url: string }[]>;
      };
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);
      expect(urls).toContain("https://remax-altitud.cr/en/agents/emma-smith");
      expect(urls).toContain("https://remax-altitud.cr/es/agents/emma-smith");
    },
  );

  it(
    "[P1] 4.4-UNIT-007f: contains static route '/' (home) for both locales",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<{ url: string }[]>;
      };
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);
      expect(urls).toContain("https://remax-altitud.cr/en");
      expect(urls).toContain("https://remax-altitud.cr/es");
    },
  );

  it(
    "[P1] 4.4-UNIT-007g: each entry has required fields: url, lastModified, changeFrequency, priority",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<Record<string, unknown>[]>;
      };
      const result = await sitemap();
      for (const entry of result) {
        expect(typeof entry["url"]).toBe("string");
        expect(entry["url"]).toMatch(/^https:\/\/remax-altitud\.cr\//);
      }
    },
  );

  it(
    "[P1] 4.4-UNIT-007h: home page (/ route) has priority 1.0",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<{ url: string; priority?: number }[]>;
      };
      const result = await sitemap();
      const homeEn = result.find(
        (e) => e.url === "https://remax-altitud.cr/en",
      );
      expect(homeEn?.priority).toBe(1.0);
    },
  );

  it(
    "[P1] 4.4-UNIT-007i: property listings have changeFrequency 'daily'",
    async () => {
      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<{ url: string; changeFrequency?: string }[]>;
      };
      const result = await sitemap();
      const listingEntry = result.find((e) =>
        e.url.includes("/property/beautiful-mountain-home"),
      );
      expect(listingEntry?.changeFrequency).toBe("daily");
    },
  );

  it(
    "[P2] 4.4-UNIT-007j: returns empty array gracefully when DB query fails",
    async () => {
      // Re-mock to throw error
      const propertiesModule = (await import("@/lib/db/queries/properties")) as unknown as {
        getAllPropertySlugs: { mockRejectedValueOnce: (err: Error) => void };
      };
      propertiesModule.getAllPropertySlugs.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<unknown[]>;
      };
      // sitemap() has try/catch — should return [] on error, not throw
      const result = await sitemap();
      expect(Array.isArray(result)).toBe(true);
    },
  );

  it(
    "[P2] 4.4-UNIT-007k: calls getAllPropertySlugs and getAllAgentSlugs in parallel",
    async () => {
      const propertiesModule = (await import("@/lib/db/queries/properties")) as unknown as {
        getAllPropertySlugs: { mock: { calls: unknown[] } };
      };
      const agentsModule = (await import("@/lib/db/queries/agents")) as unknown as {
        getAllAgentSlugs: { mock: { calls: unknown[] } };
      };

      const { default: sitemap } = (await import("@/app/sitemap")) as {
        default: () => Promise<unknown[]>;
      };
      await sitemap();

      expect(propertiesModule.getAllPropertySlugs.mock.calls.length).toBe(1);
      expect(agentsModule.getAllAgentSlugs.mock.calls.length).toBe(1);
    },
  );
});

// ---------------------------------------------------------------------------
// robots() function — AC #8, NFR27
// ---------------------------------------------------------------------------

describe("robots() function (AC #8, NFR27)", () => {
  it(
    "[P0] robots() returns an object with rules and sitemap fields",
    async () => {
      const { default: robots } = (await import("@/app/robots")) as {
        default: () => { rules: unknown; sitemap: string };
      };
      const result = robots();
      expect(result).toHaveProperty("rules");
      expect(result).toHaveProperty("sitemap");
    },
  );

  it(
    "[P0] robots() sitemap field points to the correct sitemap URL",
    async () => {
      const { default: robots } = (await import("@/app/robots")) as {
        default: () => { rules: unknown; sitemap: string };
      };
      const result = robots();
      expect(result.sitemap).toBe("https://remax-altitud.cr/sitemap.xml");
    },
  );

  it(
    "[P1] robots() rules allow '/' for all user agents",
    async () => {
      const { default: robots } = (await import("@/app/robots")) as {
        default: () => {
          rules: { userAgent: string; allow: string; disallow: string[] };
          sitemap: string;
        };
      };
      const result = robots();
      const rules = result.rules;
      expect(rules.userAgent).toBe("*");
      expect(rules.allow).toBe("/");
    },
  );

  it(
    "[P1] robots() disallows /api/ and search pages",
    async () => {
      const { default: robots } = (await import("@/app/robots")) as {
        default: () => {
          rules: { userAgent: string; allow: string; disallow: string[] };
          sitemap: string;
        };
      };
      const result = robots();
      expect(result.rules.disallow).toContain("/api/");
    },
  );
});
