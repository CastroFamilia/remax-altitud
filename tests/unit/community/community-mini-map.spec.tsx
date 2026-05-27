/**
 * ATDD Scaffolds — Story 6.3: Community Mini-Map & Geo-Fence Display
 * Component Tests: CommunityMiniMap, buildCommunityMiniMapUrl, buildAreaThumbnailMapUrl
 *
 * TDD RED PHASE — all tests will FAIL until:
 *   1. src/lib/map/static-map.ts is created (server-only URL builder)
 *   2. src/components/community/community-mini-map.tsx is created (Server Component)
 *   3. src/lib/db/schema/communities.ts has latitude, longitude, geoFenceCoords columns
 *   4. src/components/area/community-card.tsx is extended with thumbnail map props
 *   5. src/messages/en.json has CommunityPage.miniMap keys
 *   6. src/messages/es.json has CommunityPage.miniMap keys
 *
 * Coverage from test-design-epic-6.md:
 *   6.3-COMP-001 — Mini-map shows community pin and area boundary from geo-fence polygon (P1)
 *   6.3-COMP-002 — Mini-map alt text includes community name and area name (P1, R-013)
 *   6.3-COMP-003 — No Mapbox GL JS bundle loaded on community pages (P2, R-007)
 *
 * Additional component-level coverage:
 *   AC #1  — Mini-map renders as static <img> with Mapbox Static Images API URL
 *   AC #2  — Geo-fence polygon overlay baked into static image URL
 *   AC #4  — Static images only — no Mapbox GL JS imports
 *   AC #5  — Alt text includes community name and area name (NFR24)
 *   AC #6  — communities table has geoFenceCoords JSONB column
 *   AC #7  — communities table has latitude and longitude columns
 *
 * Activation instructions:
 *   1. Remove the test you are implementing from its describe.skip or it.skip block
 *   2. Run: npx vitest run tests/unit/community/community-mini-map.spec.tsx
 *   3. Verify the test FAILS before implementation, then passes after
 */

import { describe, expect, it, vi } from "vitest";
// NOTE: Factory imports removed — these source-inspection tests use fs.readFileSync
// rather than component rendering. Factories are available in
// ../../fixtures/community-factories.ts and ../../fixtures/area-factories.ts
// for future behavioral tests.

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
// 6.3-COMP-001 — Mini-map URL contains community pin and geo-fence polygon (P1)
// ---------------------------------------------------------------------------

describe("buildCommunityMiniMapUrl (6.3-COMP-001, AC #1, #2)", () => {
  it("[P1] 6.3-COMP-001: static-map.ts source exists with server-only guard and exports buildCommunityMiniMapUrl", async () => {
    // AC #4 — static images only; server-only module
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    // Must have server-only guard
    expect(source).toContain('import "server-only"');
    // Must export the URL builder function
    expect(source).toContain("buildCommunityMiniMapUrl");
  });

  it("[P1] 6.3-COMP-001b: buildCommunityMiniMapUrl generates Mapbox Static Images API URL with community pin marker", async () => {
    // AC #1 — URL must contain the pin marker with community lat/lng
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    // Must reference Mapbox Static API base URL
    expect(source).toContain("api.mapbox.com/styles/v1");
    expect(source).toContain("static");

    // Must include pin marker overlay
    expect(source).toContain("pin-l");

    // Must use community latitude and longitude
    expect(source).toContain("latitude");
    expect(source).toContain("longitude");
  });

  it("[P1] 6.3-COMP-001c: buildCommunityMiniMapUrl includes geo-fence path overlay when geoFenceCoords is present", async () => {
    // AC #2 — geo-fence polygon displayed as shaded overlay via path parameter
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    // Must handle geoFenceCoords
    expect(source).toContain("geoFenceCoords");

    // Must encode path overlay for the polygon
    expect(source).toMatch(/path[-_]|encodeGeoFencePath/);

    // Must have fill opacity for the shaded overlay
    expect(source).toMatch(/fill|opacity|0\.\d/);
  });

  it("[P1] 6.3-COMP-001d: buildCommunityMiniMapUrl uses gold color (#C2A661) for pin and polygon stroke", async () => {
    // Design token: --color-gold (#C2A661) for brand consistency
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    // Must use gold color
    expect(source).toMatch(/C2A661/i);
  });

  it("[P2] buildAreaThumbnailMapUrl exists for community card thumbnails (AC #3)", async () => {
    // AC #3 — area guide community cards include thumbnail mini-maps
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    // Must export a thumbnail variant
    expect(source).toContain("buildAreaThumbnailMapUrl");
  });

  it("[P2] buildCommunityMiniMapUrl uses @2x retina suffix by default", async () => {
    // High-DPI screen support
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    expect(source).toContain("@2x");
  });

  it("[P2] buildCommunityMiniMapUrl uses access_token parameter from MAPBOX_TOKEN config", async () => {
    // Must use the centralized MAPBOX_TOKEN from map config
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    expect(source).toContain("access_token");
    expect(source).toContain("MAPBOX_TOKEN");
  });
});

// ---------------------------------------------------------------------------
// 6.3-COMP-002 — Mini-map alt text includes community name and area name (P1)
// ---------------------------------------------------------------------------

describe("CommunityMiniMap alt text (6.3-COMP-002, AC #5)", () => {
  it("[P1] 6.3-COMP-002: CommunityMiniMap source includes alt text template with community and area name", async () => {
    // AC #5 — descriptive alt text with community name + area name (NFR24)
    // Risk R-013: Alt text missing or generic
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    // Must contain alt attribute with community and area name references
    expect(source).toContain("alt");
    // Should reference community name and area name in the alt text
    expect(source).toMatch(/community\.?name|communityName|name/i);
    expect(source).toMatch(/area\.?name|areaName/i);
  });

  it("[P1] 6.3-COMP-002b: CommunityMiniMap has data-testid='community-mini-map' on container", async () => {
    // data-testid contract from test-design-epic-6.md
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    expect(source).toContain('data-testid="community-mini-map"');
  });

  it("[P1] 6.3-COMP-002c: CommunityMiniMap has data-testid='geo-fence-overlay' when geoFenceCoords present", async () => {
    // data-testid contract from test-design-epic-6.md
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    expect(source).toContain('data-testid="geo-fence-overlay"');
    // Should be conditional on geoFenceCoords
    expect(source).toContain("geoFenceCoords");
  });

  it("[P1] 6.3-COMP-002d: CommunityMiniMap renders as <img> (not interactive map canvas)", async () => {
    // AC #4 — static images, not interactive Mapbox GL instances
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    // Must render as <img> tag
    expect(source).toContain("<img");
    // Should use loading="lazy" for performance
    expect(source).toContain('loading="lazy"');
    // Must NOT be a next/image (external Mapbox CDN URL)
    expect(source).not.toContain("next/image");
  });

  it("[P1] CommunityMiniMap is a Server Component (no 'use client')", async () => {
    // Must be server component to avoid client-side Mapbox GL imports
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    expect(source).not.toMatch(/^\s*["']use client["']/);
  });

  it("[P1] CommunityMiniMap returns null when latitude/longitude are missing", async () => {
    // AC graceful handling — render nothing when coordinates are null
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    // Must check for null/missing coordinates and return null
    expect(source).toMatch(/return\s+null|!latitude|!longitude/);
  });

  it("[P2] CommunityMiniMap wraps in <figure> with <figcaption>", async () => {
    // Semantic HTML: figure + figcaption for the mini-map
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    expect(source).toContain("<figure");
    expect(source).toContain("<figcaption");
  });
});

// ---------------------------------------------------------------------------
// 6.3-COMP-003 — No Mapbox GL JS bundle on community pages (P2)
// ---------------------------------------------------------------------------

describe("No Mapbox GL JS on community pages (6.3-COMP-003, AC #4)", () => {
  it("[P2] 6.3-COMP-003: CommunityMiniMap does NOT import mapbox-gl or react-map-gl", async () => {
    // Risk R-007: Interactive Mapbox GL JS loaded instead of static image (230KB bundle)
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/community/community-mini-map.tsx",
      "utf-8",
    );

    expect(source).not.toContain("mapbox-gl");
    expect(source).not.toContain("react-map-gl");
    expect(source).not.toContain("map-view");
    expect(source).not.toContain("map-view-loader");
  });

  it("[P2] 6.3-COMP-003b: static-map.ts does NOT import mapbox-gl", async () => {
    // The URL builder is server-only and must not pull in GL JS
    const fs = await import("node:fs");
    const source = fs.readFileSync("src/lib/map/static-map.ts", "utf-8");

    expect(source).not.toContain("mapbox-gl");
    expect(source).not.toContain("react-map-gl");
  });

  it("[P2] community page source does NOT import any map/ component", async () => {
    // Community page must not import interactive map components
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/app/[locale]/areas/[slug]/communities/[community]/page.tsx",
      "utf-8",
    );

    // Must NOT import from src/components/map/
    expect(source).not.toContain("components/map/map-view");
    expect(source).not.toContain("components/map/map-view-loader");
    expect(source).not.toContain("mapbox-gl");
    expect(source).not.toContain("react-map-gl");
  });
});

// ---------------------------------------------------------------------------
// Schema — latitude, longitude, geoFenceCoords columns (AC #6, #7)
// ---------------------------------------------------------------------------

describe("Community schema geo columns (AC #6, #7)", () => {
  it("[P1] communities schema has latitude column (doublePrecision)", async () => {
    // AC #7 — latitude column for community center-point
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/lib/db/schema/communities.ts",
      "utf-8",
    );

    expect(source).toContain("latitude");
    expect(source).toContain("doublePrecision");
  });

  it("[P1] communities schema has longitude column (doublePrecision)", async () => {
    // AC #7 — longitude column for community center-point
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/lib/db/schema/communities.ts",
      "utf-8",
    );

    expect(source).toContain("longitude");
    expect(source).toContain("doublePrecision");
  });

  it("[P1] communities schema has geoFenceCoords column (jsonb)", async () => {
    // AC #6 — geo_fence_coords JSONB column for polygon display
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/lib/db/schema/communities.ts",
      "utf-8",
    );

    expect(source).toContain("geoFenceCoords");
    expect(source).toContain("jsonb");
    expect(source).toContain("geo_fence_coords");
  });
});

// ---------------------------------------------------------------------------
// i18n strings (AC #5, Task 6)
// ---------------------------------------------------------------------------

describe("Mini-map i18n strings (AC #5, Task 6)", () => {
  it("[P2] en.json has CommunityPage.miniMap keys", async () => {
    const fs = await import("node:fs");
    const enJson = JSON.parse(
      fs.readFileSync("src/messages/en.json", "utf-8"),
    );

    // Must have miniMap namespace under CommunityPage
    const miniMap = enJson?.CommunityPage?.miniMap;
    expect(miniMap).toBeDefined();
    expect(miniMap.heading).toBeDefined();
    expect(miniMap.alt).toBeDefined();
    expect(miniMap.geoFenceLabel).toBeDefined();
  });

  it("[P2] es.json has CommunityPage.miniMap keys", async () => {
    const fs = await import("node:fs");
    const esJson = JSON.parse(
      fs.readFileSync("src/messages/es.json", "utf-8"),
    );

    const miniMap = esJson?.CommunityPage?.miniMap;
    expect(miniMap).toBeDefined();
    expect(miniMap.heading).toBeDefined();
    expect(miniMap.alt).toBeDefined();
    expect(miniMap.geoFenceLabel).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// CommunityCard thumbnail mini-map extension (AC #3, Task 5)
// ---------------------------------------------------------------------------

describe("CommunityCard thumbnail mini-map (AC #3, Task 5)", () => {
  it("[P2] CommunityCard source accepts latitude, longitude, geoFenceCoords props", async () => {
    // AC #3 — community cards include thumbnail mini-maps
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/area/community-card.tsx",
      "utf-8",
    );

    expect(source).toContain("latitude");
    expect(source).toContain("longitude");
    expect(source).toContain("geoFenceCoords");
  });

  it("[P2] CommunityCard renders thumbnail map image when coordinates present", async () => {
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      "src/components/area/community-card.tsx",
      "utf-8",
    );

    // Should reference the static map utility for thumbnails
    expect(source).toMatch(/buildAreaThumbnailMapUrl|static-map/);
  });
});
