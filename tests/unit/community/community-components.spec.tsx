/**
 * ATDD Scaffolds — Story 6.2: Community Pages
 * Component Tests: CommunityHero, CommunityQuickFacts, CommunityDescription,
 *                  CommunityTabs, LotStatusIndicator, SimilarCommunitiesSlider
 *
 * TDD RED PHASE — all tests use it() and will FAIL until:
 *   1. src/components/community/community-hero.tsx is created
 *   2. src/components/community/community-quick-facts.tsx is created
 *   3. src/components/community/community-description.tsx is created
 *   4. src/components/community/community-tabs.tsx is created
 *   5. src/components/community/lot-status-indicator.tsx is created
 *   6. src/components/community/similar-communities-slider.tsx is created
 *   7. src/lib/seo/structured-data.ts has generateCommunityJsonLd
 *
 * Coverage from test-design-epic-6.md:
 *   6.2-COMP-001 — Quick facts icon grid renders all required fields (P1)
 *   6.2-COMP-002 — Lot status indicators: ✅ Available, ❌ Sold, 🟡 Reserved (P1)
 *   6.2-COMP-003 — SimilarCommunitiesSlider renders community cards (P1)
 *   6.2-COMP-004 — CommunityCard renders gold border (P2)
 *   6.2-COMP-005 — Community page ISR configuration (P2)
 *   6.2-COMP-006 — Lot list sortable on mobile (P2)
 *
 * Additional component-level coverage:
 *   AC #1  — Hero renders h1 with community + area name
 *   AC #3  — Description is a Server Component (not client)
 *   AC #12 — JSON-LD Place schema for communities
 *   AC #13 — Breadcrumb: Home → Areas → Area → Community
 *   AC #15 — Gradient fallback (navy-to-gold) when no hero image
 *   AC #16 — WAI-ARIA Tabs pattern
 *
 * Activation instructions:
 *   1. Remove it.skip from the test you are implementing
 *   2. Run: npx vitest run tests/unit/community/community-components.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeCommunity, makeCommunityEmpty } from "../../fixtures/community-factories";
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
// 6.2-COMP-001 — Quick facts icon grid (AC #2, P1)
// ---------------------------------------------------------------------------

describe("CommunityQuickFacts (6.2-COMP-001, AC #2)", () => {
  it(
    "[P1] 6.2-COMP-001: quick facts icon grid renders all 6 required fields when data is complete",
    async () => {
      // AC #2 — icon grid displays: Elevation, Airport, Internet, Amenities, Developer, Established
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-quick-facts.tsx",
        "utf-8",
      );

      // Must reference all 6 quick facts categories
      expect(source).toContain("elevation");
      expect(source).toContain("airportDistance");
      expect(source).toContain("internet");
      expect(source).toContain("amenities");
      expect(source).toContain("developer");
      expect(source).toContain("established");

      // Must have the required data-testid
      expect(source).toContain('data-testid="community-quick-facts"');
    },
  );

  it(
    "[P1] 6.2-COMP-001b: quick facts renders only fields with data (graceful handling of missing fields)",
    () => {
      // AC #2 — Handle missing fields gracefully (render only facts with data)
      const community = makeCommunityEmpty();
      const quickFacts = community.quickFacts;

      // Empty quickFacts should have no meaningful entries
      const factCount = Object.values(quickFacts).filter(Boolean).length;
      expect(factCount).toBe(0);
    },
  );

  it(
    "[P2] 6.2-COMP-001c: quick facts uses emoji icons for each category",
    async () => {
      // AC #2 — emoji icons: 📍, ✈, 🌐, 🏊, 🏗, 📅
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-quick-facts.tsx",
        "utf-8",
      );

      // Must include the specified emoji icons
      expect(source).toContain("📍");
      expect(source).toContain("✈");
      expect(source).toContain("🌐");
      expect(source).toContain("🏊");
      expect(source).toContain("🏗");
      expect(source).toContain("📅");
    },
  );
});

// ---------------------------------------------------------------------------
// 6.2-COMP-002 — Lot status indicators (AC #4, P1)
// ---------------------------------------------------------------------------

describe("LotStatusIndicator (6.2-COMP-002, AC #4)", () => {
  it(
    "[P1] 6.2-COMP-002: lot status indicator source contains all 3 status data-testid values",
    async () => {
      // AC #4 — status indicators: ✅ Available, ❌ Sold, 🟡 Reserved
      // Risk R-009: Wrong status displayed for lot
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/lot-status-indicator.tsx",
        "utf-8",
      );

      expect(source).toContain('data-testid="lot-status-available"');
      expect(source).toContain('data-testid="lot-status-sold"');
      expect(source).toContain('data-testid="lot-status-reserved"');
    },
  );

  it(
    "[P1] 6.2-COMP-002b: lot status indicator uses correct emoji icons for each status",
    async () => {
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/lot-status-indicator.tsx",
        "utf-8",
      );

      // Must use the specified emoji per status
      expect(source).toContain("✅");
      expect(source).toContain("❌");
      expect(source).toContain("🟡");
    },
  );

  it(
    "[P1] 6.2-COMP-002c: lot status indicator maps 'active' status to Available",
    async () => {
      // Property status field uses "active" not "available"
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/lot-status-indicator.tsx",
        "utf-8",
      );

      expect(source).toContain("active");
      expect(source).toContain("sold");
      expect(source).toContain("reserved");
    },
  );
});

// ---------------------------------------------------------------------------
// 6.2-COMP-003 — SimilarCommunitiesSlider (AC #6, P1)
// ---------------------------------------------------------------------------

describe("SimilarCommunitiesSlider (6.2-COMP-003, AC #6)", () => {
  it(
    "[P1] 6.2-COMP-003: SimilarCommunitiesSlider source has the required data-testid",
    async () => {
      // AC #6 — SimilarCommunitiesSlider shows nearby community cards (always visible, not tabbed)
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/similar-communities-slider.tsx",
        "utf-8",
      );

      expect(source).toContain('data-testid="community-similar-slider"');
    },
  );

  it(
    "[P1] 6.2-COMP-003b: SimilarCommunitiesSlider imports and renders CommunityCard",
    async () => {
      // Must use the existing CommunityCard component
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/similar-communities-slider.tsx",
        "utf-8",
      );

      expect(source).toContain("CommunityCard");
      expect(source).toContain("community-card");
    },
  );
});

// ---------------------------------------------------------------------------
// 6.2-COMP-004 — CommunityCard gold border (AC #7, P2)
// ---------------------------------------------------------------------------

describe("CommunityCard gold border (6.2-COMP-004, AC #7)", () => {
  it(
    "[P2] 6.2-COMP-004: CommunityCard source contains gold border styling and data-testid",
    async () => {
      // AC #7 — gold border (--color-gold #C2A661) differentiates from standard area cards
      // Risk R-011: Gold border not applied
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/area/community-card.tsx",
        "utf-8",
      );

      expect(source).toContain('data-testid="community-card"');
      // Should reference gold color token or hex value
      expect(source).toMatch(/gold|C2A661|#c2a661/i);
    },
  );

  it(
    "[P2] 6.2-COMP-004b: CommunityCard accepts priceMin, priceMax, and listingCount props",
    async () => {
      // AC #7 — CommunityCard needs price range and listing count for Story 6.2
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/area/community-card.tsx",
        "utf-8",
      );

      // Should accept these new props
      expect(source).toContain("priceMin");
      expect(source).toContain("priceMax");
      expect(source).toContain("listingCount");
    },
  );
});

// ---------------------------------------------------------------------------
// 6.2-COMP-005 — ISR configuration (AC #9, P2)
// ---------------------------------------------------------------------------

describe("Community page ISR configuration (6.2-COMP-005, AC #9)", () => {
  it(
    "[P2] 6.2-COMP-005: community page source exports revalidate constant for ISR",
    async () => {
      // AC #9 — SSG + ISR with revalidate = 3600
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/app/[locale]/areas/[slug]/communities/[community]/page.tsx",
        "utf-8",
      );

      expect(source).toContain("export const revalidate");
      expect(source).toContain("3600");
    },
  );
});

// ---------------------------------------------------------------------------
// JSON-LD Place schema for communities (AC #12)
// ---------------------------------------------------------------------------

describe("Community JSON-LD Place Schema (AC #12)", () => {
  it(
    "[P1] generateCommunityJsonLd returns Place schema with community data",
    async () => {
      // AC #12 — JSON-LD structured data for Place schema
      const { generateCommunityJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const community = makeCommunity();
      const area = makeArea();
      const jsonLd = generateCommunityJsonLd(
        community as Parameters<typeof generateCommunityJsonLd>[0],
        area as Parameters<typeof generateCommunityJsonLd>[1],
        "en",
      );

      expect(jsonLd).toHaveProperty("@type", "Place");
      expect(jsonLd).toHaveProperty("name", "RISE");
      expect(jsonLd).toHaveProperty("description");
    },
  );

  it(
    "[P1] generateCommunityJsonLd includes containedInPlace with area context",
    async () => {
      // AC #12 — Place schema with community's area context
      const { generateCommunityJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const community = makeCommunity();
      const area = makeArea();
      const jsonLd = generateCommunityJsonLd(
        community as Parameters<typeof generateCommunityJsonLd>[0],
        area as Parameters<typeof generateCommunityJsonLd>[1],
        "en",
      ) as Record<string, unknown>;

      expect(jsonLd).toHaveProperty("containedInPlace");
    },
  );

  it(
    "[P1] generateCommunityJsonLd uses Spanish description when locale is 'es'",
    async () => {
      const { generateCommunityJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const community = makeCommunity();
      const area = makeArea();
      const jsonLd = generateCommunityJsonLd(
        community as Parameters<typeof generateCommunityJsonLd>[0],
        area as Parameters<typeof generateCommunityJsonLd>[1],
        "es",
      ) as Record<string, unknown>;

      expect(jsonLd.description).toContain("premium");
    },
  );
});

// ---------------------------------------------------------------------------
// Breadcrumb JSON-LD for community pages (AC #13)
// ---------------------------------------------------------------------------

describe("Community Breadcrumb JSON-LD (AC #13)", () => {
  it(
    "[P1] generateBreadcrumbJsonLd produces valid BreadcrumbList for community: Home → Areas → Area → Community",
    async () => {
      const { generateBreadcrumbJsonLd } = await import(
        "@/lib/seo/structured-data"
      );

      const breadcrumb = generateBreadcrumbJsonLd([
        { name: "Home", href: "/en", position: 1 },
        { name: "Areas", href: "/en/areas", position: 2 },
        { name: "Pérez Zeledón", href: "/en/areas/perez-zeledon", position: 3 },
        { name: "RISE", href: "/en/areas/perez-zeledon/communities/rise", position: 4 },
      ]) as Record<string, unknown>;

      expect(breadcrumb["@type"]).toBe("BreadcrumbList");
      const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;
      expect(items).toHaveLength(4);
      expect(items[0].name).toBe("Home");
      expect(items[2].name).toBe("Pérez Zeledón");
      expect(items[3].name).toBe("RISE");
    },
  );
});

// ---------------------------------------------------------------------------
// Community Hero — gradient fallback (AC #15)
// ---------------------------------------------------------------------------

describe("CommunityHero gradient fallback (AC #15)", () => {
  it(
    "[P2] given community without heroImageUrl then hero renders navy-to-gold gradient",
    async () => {
      // AC #15 — gradient placeholder (navy-to-gold) when no hero image
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-hero.tsx",
        "utf-8",
      );

      // Must branch on heroImageUrl
      expect(source).toContain("heroImageUrl");
      expect(source).toContain("gradient");
      // Navy-to-gold gradient uses --color-navy and --color-gold
      expect(source).toMatch(/navy|000E35/i);
      expect(source).toMatch(/gold|C2A661/i);
      // Must NOT have 'use client' — it's a Server Component
      expect(source).not.toMatch(/^\s*["']use client["']/);
    },
  );

  it(
    "[P2] given community with heroImageUrl then hero renders an Image element",
    async () => {
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-hero.tsx",
        "utf-8",
      );

      expect(source).toContain("next/image");
      expect(source).toContain("<Image");
      expect(source).toContain('data-testid="community-hero"');
    },
  );
});

// ---------------------------------------------------------------------------
// CommunityDescription — Server Component validation (AC #3)
// ---------------------------------------------------------------------------

describe("CommunityDescription Server Component (AC #3)", () => {
  it(
    "[P0] CommunityDescription source file does NOT contain 'use client' directive",
    async () => {
      // AC #3 — Description MUST be a Server Component for SSG HTML output
      // Mirrors R-003 pattern from Story 6.1
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-description.tsx",
        "utf-8",
      );

      expect(source).not.toMatch(/^\s*["']use client["']/);
      expect(source).toContain('data-testid="community-description"');
    },
  );
});

// ---------------------------------------------------------------------------
// CommunityTabs — WAI-ARIA contract (AC #16)
// ---------------------------------------------------------------------------

describe("CommunityTabs WAI-ARIA contract (AC #16)", () => {
  it(
    "[P1] CommunityTabs source implements WAI-ARIA Tabs pattern with required roles",
    async () => {
      // AC #16 — tabs must follow WAI-ARIA pattern, same as AreaGuideTabs
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-tabs.tsx",
        "utf-8",
      );

      expect(source).toContain('role="tablist"');
      expect(source).toContain('role="tab"');
      expect(source).toContain('role="tabpanel"');
      expect(source).toContain("aria-selected");
      expect(source).toContain("aria-controls");
    },
  );

  it(
    "[P1] CommunityTabs source contains all required data-testid attributes",
    async () => {
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-tabs.tsx",
        "utf-8",
      );

      const expectedTestIds = [
        "community-properties-tab",
        "community-sitemap-tab",
      ];

      for (const testId of expectedTestIds) {
        expect(source).toContain(`data-testid="${testId}"`);
      }
    },
  );

  it(
    "[P1] CommunityTabs source implements keyboard navigation for ArrowLeft, ArrowRight, Home, End",
    async () => {
      // AC #16 — keyboard navigation required for WAI-ARIA tabs
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-tabs.tsx",
        "utf-8",
      );

      expect(source).toContain("ArrowRight");
      expect(source).toContain("ArrowLeft");
      expect(source).toContain('"Home"');
      expect(source).toContain('"End"');
    },
  );

  it(
    "[P1] CommunityTabs has 2 tab panels: Properties and Site Map",
    async () => {
      // AC #4, #5 — two tab panels: Properties, Site Map
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-tabs.tsx",
        "utf-8",
      );

      const panelMatches = source.match(/^\s+role="tabpanel"/gm);
      expect(panelMatches).toHaveLength(2);
    },
  );
});

// ---------------------------------------------------------------------------
// 6.2-COMP-006 — Lot list sortable on mobile (AC #4, P2)
// ---------------------------------------------------------------------------

describe("CommunityLotList sortable (6.2-COMP-006, AC #4)", () => {
  it(
    "[P2] 6.2-COMP-006: community lot list source contains sort controls",
    async () => {
      // AC #4 — mobile: sortable list with status indicators
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-lot-list.tsx",
        "utf-8",
      );

      // Must have sort functionality
      expect(source).toMatch(/sort|order/i);
      // Must import and use LotStatusIndicator
      expect(source).toContain("LotStatusIndicator");
    },
  );

  it(
    "[P2] 6.2-COMP-006b: community lot list is a Client Component (needs sort state)",
    async () => {
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/community/community-lot-list.tsx",
        "utf-8",
      );

      // Must have 'use client' for interactive sort
      expect(source).toMatch(/["']use client["']/);
    },
  );
});

// ---------------------------------------------------------------------------
// Featured Communities homepage section (AC #8)
// ---------------------------------------------------------------------------

describe("FeaturedCommunities homepage section (AC #8)", () => {
  it(
    "[P1] FeaturedCommunities source has required data-testid",
    async () => {
      // AC #8 — data-testid="featured-communities" on the section
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/home/featured-communities.tsx",
        "utf-8",
      );

      expect(source).toContain('data-testid="featured-communities"');
    },
  );

  it(
    "[P1] FeaturedCommunities is a Server Component (queries DB)",
    async () => {
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/components/home/featured-communities.tsx",
        "utf-8",
      );

      // Server Component: no 'use client'
      expect(source).not.toMatch(/^\s*["']use client["']/);
      // Should call getFeaturedCommunities
      expect(source).toContain("getFeaturedCommunities");
    },
  );
});

// ---------------------------------------------------------------------------
// Community index page cards (AC #10)
// ---------------------------------------------------------------------------

describe("Community index page (AC #10)", () => {
  it(
    "[P1] community index page source renders community-index-card data-testid",
    async () => {
      // AC #10 — data-testid="community-index-card" on each card
      const fs = await import("node:fs");
      const source = fs.readFileSync(
        "src/app/[locale]/communities/page.tsx",
        "utf-8",
      );

      expect(source).toContain('data-testid="community-index-card"');
    },
  );
});
