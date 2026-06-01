# Story 6.3: Community Mini-Map & Geo-Fence Display

**Status:** ready-for-dev
**GH Issue:** #103
**Epic:** 6 — Community Pages & Area Guides
**Story Key:** 6-3-community-mini-map-and-geo-fence-display
**Created:** 2026-05-27

---

## Story

As a **visitor**,
I want to see where a community is located on a map relative to the broader area,
So that I can understand the geography and proximity to key landmarks.

---

## Acceptance Criteria

1. **Given** a community page **When** the mini-map renders **Then** a Mapbox Static Images API `<img>` shows: the community pin, the broader area boundary, and nearby landmarks (beach, hospital, airport) (FR20). `data-testid="community-mini-map"` on the container.

2. **Given** the community's `geo_fence` polygon **When** stored in the database **Then** the polygon boundary is displayed on the mini-map as a shaded overlay via Mapbox Static API path overlay (FR20). `data-testid="geo-fence-overlay"` on the overlay indicator.

3. **Given** an area guide page **When** communities within that area are listed **Then** each community card includes a thumbnail mini-map showing its location within the area.

4. **And** mini-maps are lightweight static images (not interactive Mapbox GL instances) to minimize bundle impact. No Mapbox GL JS (`mapbox-gl`, `react-map-gl`) is imported on community or area guide pages.

5. **And** mini-maps include descriptive `alt` text containing both the community name and area name for accessibility (NFR24).

6. **And** the `communities` table includes a `geo_fence` geography column (Polygon 4326) for storing community boundary polygons.

7. **And** the `communities` table includes `latitude` and `longitude` columns for the community center-point coordinates used as the map pin.

---

## Tasks / Subtasks

- [ ] Task 1: Add geo-fence and coordinate columns to communities schema (AC: #6, #7)
  - [ ] 1.1 Add `latitude` (`doublePrecision`) and `longitude` (`doublePrecision`) columns to `src/lib/db/schema/communities.ts` — nullable, used as center pin for mini-map
  - [ ] 1.2 Add `geoFenceCoords` (`jsonb`) column to `src/lib/db/schema/communities.ts` — stores the polygon as a GeoJSON `coordinates` array (array of `[lng, lat]` pairs). Use JSONB instead of PostGIS geography type to avoid Drizzle ORM complexity for this read-only display use case. Story 6.5 will add the actual PostGIS `geo_fence` geography column for `ST_Within` queries.
  - [ ] 1.3 Update `Community` and `NewCommunity` types (already auto-inferred from schema)
  - [ ] 1.4 Generate Drizzle migration: `npx drizzle-kit generate` → verify SQL → `npx drizzle-kit push`
  - [ ] 1.5 Update seed data for existing communities (RISE, Santa Elena Hills, Serena del Mar) to include `latitude`, `longitude`, and `geoFenceCoords` — use realistic southern Costa Rica coordinates

- [ ] Task 2: Create Mapbox Static Image URL builder utility (AC: #1, #2, #4)
  - [ ] 2.1 Create `src/lib/map/static-map.ts` with `import "server-only"` guard
  - [ ] 2.2 Implement `buildCommunityMiniMapUrl(options)` — constructs a Mapbox Static Images API URL with:
    - Center: community `latitude`/`longitude`
    - Zoom: ~13 (community scale)
    - Size: `600x400` (community page) or `300x200` (thumbnail)
    - Style: `mapbox/outdoors-v12` (reuse `MAP_STYLE` slug)
    - Pin marker: using `pin-l` with custom color for community center
    - Path overlay: geo-fence polygon encoded as polyline for shaded boundary (if `geoFenceCoords` available)
    - Access token: `NEXT_PUBLIC_MAPBOX_TOKEN` from `@/lib/map/config`
    - `@2x` retina suffix for high-DPI screens
  - [ ] 2.3 Implement `buildAreaThumbnailMapUrl(options)` — smaller version for community card thumbnails (300x200, zoom ~11)
  - [ ] 2.4 Implement `encodeGeoFencePath(coords)` — converts GeoJSON polygon coordinates to Mapbox Static API `path` parameter with fill color and stroke
  - [ ] 2.5 Export types: `MiniMapOptions`, `ThumbnailMapOptions`

- [ ] Task 3: Create CommunityMiniMap Server Component (AC: #1, #2, #5)
  - [ ] 3.1 Create `src/components/community/community-mini-map.tsx` — **Server Component** (no `use client`)
  - [ ] 3.2 Render as `<img>` tag using `buildCommunityMiniMapUrl()` — NOT `next/image` (external Mapbox CDN URL; use native `<img>` with `loading="lazy"` and `decoding="async"`)
  - [ ] 3.3 Set `alt` text: `"Map of {community.name} in {areaName}"` (AC #5, NFR24)
  - [ ] 3.4 Add `data-testid="community-mini-map"` on the container `<figure>` element
  - [ ] 3.5 Add `data-testid="geo-fence-overlay"` on a `<span>` indicator rendered conditionally when `geoFenceCoords` is present (the overlay is baked into the static image URL, but the testid confirms geo-fence data was used)
  - [ ] 3.6 Handle missing coordinates gracefully: if `latitude`/`longitude` are null, render nothing (return `null`)
  - [ ] 3.7 Wrap in a `<figure>` with `<figcaption>` showing localized "Community Location" label
  - [ ] 3.8 Responsive: 100% width container, max-width 600px, centered, with `aspect-[3/2]` placeholder

- [ ] Task 4: Integrate mini-map into community page (AC: #1, #2)
  - [ ] 4.1 Update `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` to import and render `CommunityMiniMap` between `CommunityDescription` and `CommunityTabs`
  - [ ] 4.2 Pass `community`, `areaName`, and `locale` props to `CommunityMiniMap`
  - [ ] 4.3 Fetch the area data (already available in page as `area`) for the `areaName` prop

- [ ] Task 5: Add thumbnail mini-maps to area guide community cards (AC: #3)
  - [ ] 5.1 Update `src/components/area/community-card.tsx` — add optional `latitude`, `longitude`, and `geoFenceCoords` props
  - [ ] 5.2 When coordinates are present, render a thumbnail mini-map image above or below the hero image area (small 300x200 map)
  - [ ] 5.3 Use `buildAreaThumbnailMapUrl()` from the static-map utility
  - [ ] 5.4 Add `alt` text: `"Location of {name}"` for the thumbnail
  - [ ] 5.5 Update area guide page (`src/app/[locale]/areas/[slug]/page.tsx`) to pass `latitude`, `longitude`, `geoFenceCoords` to `CommunityCard`

- [ ] Task 6: Add i18n strings (AC: #5)
  - [ ] 6.1 Add `miniMap` keys to `CommunityPage` namespace in `src/messages/en.json`: `miniMap.heading` ("Community Location"), `miniMap.alt` ("Map of {community} in {area}"), `miniMap.geoFenceLabel` ("Community boundary shown")
  - [ ] 6.2 Add same keys to `src/messages/es.json`: `miniMap.heading` ("Ubicación de la Comunidad"), `miniMap.alt` ("Mapa de {community} en {area}"), `miniMap.geoFenceLabel` ("Límite de la comunidad mostrado")

---

## Dev Notes

### Critical: Static Image, NOT Interactive Map

Architecture explicitly states mini-maps must be **static images** — NOT interactive Mapbox GL JS instances. The interactive Mapbox GL JS bundle is ~230KB (lazy-loaded only on the search page). Community pages must NOT import `mapbox-gl`, `react-map-gl`, or any component from `src/components/map/`.

**Use the Mapbox Static Images API:**
```
https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/{overlays}/{lon},{lat},{zoom},{bearing},{pitch}/{width}x{height}{@2x}?access_token={token}
```

**Verification:** E2E test should confirm no `<canvas>` element on community pages (Mapbox GL renders to canvas; static maps render as `<img>`).

### Mapbox Static Images API — URL Construction

```typescript
// src/lib/map/static-map.ts
import "server-only";
import { MAPBOX_TOKEN } from "@/lib/map/config";

const MAPBOX_STATIC_BASE = "https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static";

interface MiniMapOptions {
  latitude: number;
  longitude: number;
  geoFenceCoords?: [number, number][] | null; // GeoJSON polygon ring [[lng,lat], ...]
  communityName: string;
  zoom?: number;      // default 13
  width?: number;     // default 600
  height?: number;    // default 400
  retina?: boolean;   // default true
}

/**
 * Builds a Mapbox Static Images API URL for a community mini-map.
 * Includes community pin marker + optional geo-fence polygon overlay.
 */
export function buildCommunityMiniMapUrl(options: MiniMapOptions): string {
  const {
    latitude,
    longitude,
    geoFenceCoords,
    zoom = 13,
    width = 600,
    height = 400,
    retina = true,
  } = options;

  const overlays: string[] = [];

  // Geo-fence polygon path overlay (shaded fill)
  if (geoFenceCoords && geoFenceCoords.length >= 3) {
    const pathOverlay = encodeGeoFencePath(geoFenceCoords);
    overlays.push(pathOverlay);
  }

  // Community center pin marker (gold color)
  overlays.push(`pin-l+C2A661(${longitude},${latitude})`);

  const overlayStr = overlays.join(",");
  const retinaStr = retina ? "@2x" : "";

  return `${MAPBOX_STATIC_BASE}/${overlayStr}/${longitude},${latitude},${zoom}/${width}x${height}${retinaStr}?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Encodes a GeoJSON polygon coordinate ring as a Mapbox Static API path overlay.
 * Format: path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({encoded_polyline})
 */
function encodeGeoFencePath(coords: [number, number][]): string {
  // Mapbox Static API accepts raw coordinate pairs in path syntax
  const coordStr = coords.map(([lng, lat]) => `[${lng},${lat}]`).join(",");
  // stroke: 2px gold (#C2A661), fill: gold with 20% opacity
  return `path-2+C2A661-0.8+C2A661-0.2(${encodeURIComponent(coordStr)})`;
}
```

**IMPORTANT:** The Mapbox Static API has a URL length limit of ~8,192 characters. For complex polygons, you may need to simplify the coordinates. Most community geo-fences are simple polygons (4-8 points) well within limits.

### Schema Changes — JSONB for Polygon Display

The `communities` table currently has the PostGIS `geo_fence` column **commented out** (line 18-20 of `src/lib/db/schema/communities.ts`). Story 6.5 will enable the PostGIS geography column for `ST_Within` spatial queries.

For this story (6.3), add:
- `latitude` / `longitude` — community center-point for the pin
- `geoFenceCoords` — JSONB storing the polygon coordinates for **display only** (renders on static map)

```typescript
// Add to src/lib/db/schema/communities.ts
latitude: doublePrecision("latitude"),
longitude: doublePrecision("longitude"),
geoFenceCoords: jsonb("geo_fence_coords").default(null),
```

This approach avoids:
1. Drizzle ORM PostGIS column type complexity (no `geography` Drizzle type without custom SQL)
2. Requiring PostGIS extension for simple polygon rendering
3. Breaking changes when Story 6.5 adds the actual `geo_fence` PostGIS column

### Seed Data — Realistic Coordinates

Update seed data for communities with realistic southern Costa Rica coordinates:

| Community | Latitude | Longitude | Area |
|-----------|----------|-----------|------|
| RISE | 9.3500 | -83.6500 | Pérez Zeledón |
| Santa Elena Hills | 9.2800 | -83.7800 | Dominical |
| Serena del Mar | 9.1700 | -83.7500 | Uvita |

**Geo-fence polygon example (RISE):**
```json
[
  [-83.655, 9.345],
  [-83.645, 9.345],
  [-83.645, 9.355],
  [-83.655, 9.355],
  [-83.655, 9.345]
]
```

### Component Architecture

```
CommunityMiniMap (Server Component)
├── <figure data-testid="community-mini-map">
│   ├── <img src={staticMapUrl} alt="Map of {name} in {area}" loading="lazy" />
│   ├── <span data-testid="geo-fence-overlay" /> (conditional — when geoFenceCoords present)
│   └── <figcaption>{t("miniMap.heading")}</figcaption>
└── Returns null if latitude/longitude missing
```

### Existing Components — REUSE, DO NOT RECREATE

| Component | Location | Usage |
|-----------|----------|-------|
| `MAPBOX_TOKEN` | `src/lib/map/config.ts` | Access token for static API |
| `MAP_STYLE` | `src/lib/map/config.ts` | Style slug (`outdoors-v12`) |
| `CommunityCard` | `src/components/area/community-card.tsx` | Extend with thumbnail map props |
| Community page | `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` | Insert mini-map component |
| Area guide page | `src/app/[locale]/areas/[slug]/page.tsx` | Pass coords to CommunityCard |

### DO NOT Import on Community/Area Pages

- `mapbox-gl`
- `react-map-gl`
- `src/components/map/map-view.tsx`
- `src/components/map/map-view-loader.tsx`
- Any component from `src/components/map/`

### Styling

- **Container**: `max-w-2xl mx-auto`, rounded corners (`rounded-lg`), overflow hidden
- **Image**: `w-full h-auto`, `aspect-[3/2]`
- **Figcaption**: `text-sm text-text-muted text-center mt-2`
- **Thumbnail (card)**: `w-full h-auto aspect-[3/2] rounded-md`
- **Spacing**: Standard section spacing (`py-8 px-4 sm:px-6 lg:px-8`)

### Accessibility (NFR24)

- `alt` text MUST include community name and area name: `"Map of RISE in Pérez Zeledón"`
- `<figure>` + `<figcaption>` semantic structure
- Geo-fence overlay indicator uses `aria-label` describing boundary is shown
- Static images are inherently accessible (no keyboard trap like interactive maps)

### Testing Strategy

**Required `data-testid` attributes** (from `test-design-epic-6.md`):

| Attribute | Component |
|-----------|-----------|
| `data-testid="community-mini-map"` | CommunityMiniMap container |
| `data-testid="geo-fence-overlay"` | Geo-fence presence indicator |

**Key test scenarios:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| 6.3-E2E-001 | P1 | Community mini-map renders as `<img>` (not interactive Mapbox GL `<canvas>`) |
| 6.3-COMP-001 | P1 | Mini-map shows community pin and area boundary from geo-fence polygon |
| 6.3-COMP-002 | P1 | Mini-map alt text includes community name and area name |
| 6.3-E2E-002 | P2 | Area guide community cards include thumbnail mini-maps |
| 6.3-COMP-003 | P2 | No Mapbox GL JS bundle loaded on community pages |
| 6.3-E2E-003 | P3 | Mini-map static image loads in < 1s |

**Component test strategy:**

```typescript
// tests/unit/community/community-mini-map.spec.tsx
import { render, screen } from "@testing-library/react";
import { CommunityMiniMap } from "@/components/community/community-mini-map";

// Mock next-intl
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));

describe("CommunityMiniMap", () => {
  it("renders static <img> with correct alt text", () => {
    render(<CommunityMiniMap community={mockCommunity} areaName="Pérez Zeledón" locale="en" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", expect.stringContaining("RISE"));
    expect(img).toHaveAttribute("alt", expect.stringContaining("Pérez Zeledón"));
    expect(img.tagName).toBe("IMG"); // NOT canvas
  });

  it("returns null when coordinates missing", () => {
    const { container } = render(
      <CommunityMiniMap community={{ ...mockCommunity, latitude: null, longitude: null }} areaName="Test" locale="en" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows geo-fence overlay indicator when geoFenceCoords present", () => {
    render(<CommunityMiniMap community={mockCommunityWithGeoFence} areaName="Test" locale="en" />);
    expect(screen.getByTestId("geo-fence-overlay")).toBeInTheDocument();
  });
});
```

### Project Structure Notes

New files to create:
```
src/
├── lib/map/
│   └── static-map.ts              # Mapbox Static Image URL builder (server-only)
└── components/community/
    └── community-mini-map.tsx      # Server Component (static <img>)
```

Files to modify:
```
src/lib/db/schema/communities.ts              — Add latitude, longitude, geoFenceCoords columns
src/app/[locale]/areas/[slug]/communities/[community]/page.tsx  — Insert CommunityMiniMap
src/components/area/community-card.tsx        — Add optional thumbnail map
src/app/[locale]/areas/[slug]/page.tsx        — Pass coords to CommunityCard
src/messages/en.json                          — Add miniMap i18n keys
src/messages/es.json                          — Add miniMap i18n keys
```

### Do NOT Modify

- `src/components/map/map-view.tsx` — interactive map, not relevant
- `src/components/map/map-view-loader.tsx` — lazy loader for interactive map
- `src/lib/map/geo-utils.ts` — interactive map utilities
- `src/store/map-store.ts` — interactive map state
- Any `data-testid` from prior stories

### Previous Story Learnings (Story 6.2)

- Community page already follows `area guide` pattern with Server + Client component split
- `CommunityCard` uses native `<img>` (not `next/image`) — follow same pattern for static maps
- Gold color token: `--color-gold` (#C2A661) — reuse for pin marker color
- Community schema exports `Community` type used across all community components
- `getCommunityBySlugAndArea` returns `communities` table row only (not joined area data) — area is fetched separately

### References

- [Source: _bmad-output/planning-artifacts/epics.md#L1809-L1833](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L1809-L1833) — Story 6.3 requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#L525](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/prd.md#L525) — FR20: community mini-map static map image
- [Source: _bmad-output/planning-artifacts/architecture.md#L478-L496](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L478-L496) — COMMUNITIES entity with geo_fence polygon
- [Source: _bmad-output/planning-artifacts/architecture.md#L877](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L877) — Mapbox GL JS lazy-loaded (~230KB) — search page only
- [Source: _bmad-output/planning-artifacts/architecture.md#L995](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L995) — NEXT_PUBLIC_MAPBOX_TOKEN env variable
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L107-L108](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L107-L108) — data-testid contracts for Story 6.3
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L136](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L136) — Risk R-007: mini-map loads interactive GL instead of static
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L147](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L147) — Risk R-013: mini-map alt text accessibility
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L239-L241](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L239-L241) — P1 test scenarios for Story 6.3
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L263-L264](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L263-L264) — P2 test scenarios for Story 6.3
- [Source: src/lib/map/config.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/map/config.ts) — MAPBOX_TOKEN and MAP_STYLE constants
- [Source: src/lib/db/schema/communities.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/communities.ts) — Current communities schema (geo_fence commented out)
- [Source: src/components/area/community-card.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/components/area/community-card.tsx) — CommunityCard to extend with thumbnail
- [Source: src/app/[locale]/areas/[slug]/communities/[community]/page.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/%5Blocale%5D/areas/%5Bslug%5D/communities/%5Bcommunity%5D/page.tsx) — Community page to insert mini-map
- [Source: src/app/[locale]/areas/[slug]/page.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/%5Blocale%5D/areas/%5Bslug%5D/page.tsx) — Area guide page passing community data
- [Source: _bmad-output/implementation-artifacts/6-2-community-pages.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/implementation-artifacts/6-2-community-pages.md) — Story 6.2 patterns and learnings

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
