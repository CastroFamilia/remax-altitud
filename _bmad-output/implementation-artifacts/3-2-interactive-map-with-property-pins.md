# Story 3.2: Interactive Map with Property Pins

Status: ready-for-dev

## Story

As a **visitor**,
I want to see property locations on an interactive map with terrain,
so that I can understand the geography and find properties in specific locations.

## Acceptance Criteria

1. **Given** the search page map **When** rendered **Then** Mapbox GL JS loads with 3D terrain showing the southern Costa Rica region (FR1).

2. **Given** properties in the database **When** the map viewport is visible **Then** property pins appear at their lat/lon coordinates (FR1).

3. **Given** many properties in a small area **When** zoomed out **Then** pins cluster into numbered cluster markers that expand on zoom in (FR1).

4. **Given** a property pin **When** clicked/tapped **Then** a preview card overlay appears showing: photo, price, title, specs (beds/baths/lot size), ZMT badge, and "View Details" CTA link.

5. **Given** the map **When** the user pans or zooms **Then** the grid updates to show only properties visible in the current map bounds.

6. **Given** Mapbox GL JS **When** loaded on the search page **Then** it is lazy-loaded as a separate async chunk — NOT included in the main JS bundle (AR25).

7. **And** the map renders with pins and clustering within 3s on 4G mobile (NFR4).

8. **And** map state (center, zoom, bounds) is managed via Zustand store (AR10).

9. **And** `data-testid="map-container"` is present on the `<MapView>` wrapper element (replaces the Story 3.1 `data-testid="map-placeholder"` div).

## Tasks / Subtasks

- [ ] Task 1: Install dependencies (AC: #1, #3, #6, #8)
  - [ ] `npm install react-map-gl@7 mapbox-gl@3 zustand@5 supercluster`
  - [ ] Add dev deps: `npm install -D @types/mapbox-gl @types/supercluster`
  - [ ] Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local` (currently blank — dev must obtain a token from mapbox.com and set it before this story can render)

- [ ] Task 2: Create Zustand map store (AC: #5, #8)
  - [ ] Create `src/store/map-store.ts` — this is a plain TypeScript module, NOT a React component; do NOT add `'use client'` directive (Zustand stores are plain modules; the `'use client'` directive belongs only on React component files)
  - [ ] Store shape:
    ```ts
    type MapBounds = { north: number; south: number; east: number; west: number };
    type MapStore = {
      center: { lng: number; lat: number };
      zoom: number;
      bounds: MapBounds | null;
      setCenter: (center: { lng: number; lat: number }) => void;
      setZoom: (zoom: number) => void;
      setBounds: (bounds: MapBounds) => void;
    };
    ```
  - [ ] Use `create<MapStore>()(...)` from `zustand` — do NOT use `immer` or `devtools` middleware in this story (keep it minimal)
  - [ ] Default center: `{ lng: -83.70, lat: 9.38 }` — the geographic midpoint between Pérez Zeledón and Dominical/Uvita in southern Costa Rica
  - [ ] Default zoom: `10`
  - [ ] Export a named `useMapStore` hook

- [ ] Task 3: Create Mapbox configuration module (AC: #1)
  - [ ] Create `src/lib/map/config.ts`
  - [ ] Export `MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""` — NEXT_PUBLIC env var is safe for the client
  - [ ] Export `DEFAULT_MAP_CENTER = { lng: -83.70, lat: 9.38 }` (mirrors store default)
  - [ ] Export `DEFAULT_MAP_ZOOM = 10`
  - [ ] Export `MAP_STYLE = "mapbox://styles/mapbox/outdoors-v12"` — Mapbox Outdoors style shows terrain, roads, and vegetation; ideal for southern Costa Rica geography
  - [ ] Export `MAX_BOUNDS` as a `LngLatBoundsLike` tuple: `[[-86.0, 7.5], [-81.5, 11.5]]` — tightly fits the southern Costa Rica region; prevents users from panning off the coverage area
  - [ ] Create `src/lib/map/geo-utils.ts`
  - [ ] Export `boundsFromMapboxEvent(event: ViewStateChangeEvent): MapBounds` — import `ViewStateChangeEvent` from `react-map-gl`; extract `north/south/east/west` via `event.target.getBounds().getNorth()` etc.
  - [ ] Export `formatPriceAbbrev(price: number): string` — returns `"$1.2M"` for ≥1,000,000; `"$250K"` for ≥1,000; `"$500"` for <1,000

- [ ] Task 4: Create `MapPropertyPopup` component (AC: #4)
  - [ ] Create `src/components/map/map-property-popup.tsx` with `'use client'` directive
  - [ ] Props:
    ```ts
    interface MapPropertyPopupProps {
      property: {
        id: string;
        slug: string;
        titleEn: string;
        titleEs: string;
        priceUsd: number;
        bedrooms: number | null;
        bathrooms: number | null;
        lotSizeM2: number | null;
        zmtStatus: string;
        images: { url: string; alt?: string }[];
        latitude: number;
        longitude: number;
      };
      locale: string;
      onClose: () => void;
    }
    ```
  - [ ] Use `<Popup>` from `react-map-gl` (already imported); anchor: `"bottom"`; offset: `[0, -30]`; `closeButton={false}` (use custom close button)
  - [ ] Content: small card (max-w-xs) with thumbnail image (first in images array, fallback to muted bg if empty), price in USD (formatted with `toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })`), title (titleEn or titleEs based on locale), specs row (beds · baths · lot size), ZMT badge (text label only, not color-coded per accessibility requirements), and "View Details" link (`<Link href={`/${locale}/property/${slug}`}>`  from `@/i18n/navigation`)
  - [ ] Use `data-testid="map-property-popup"` on the root div
  - [ ] Close button: `<button onClick={onClose} aria-label="Close property preview" data-testid="map-popup-close">`
  - [ ] ZMT status display: `titled → "Titled"`, `concession → "Concession"`, `zmt_restricted → "ZMT Restricted"` (add i18n keys under `MapView.zmtStatus.*`)

- [ ] Task 5: Create `MapClusterPin` and `MapPricePin` components (AC: #2, #3)
  - [ ] Create `src/components/map/map-cluster-pin.tsx` with `'use client'` directive
  - [ ] Props: `{ count: number; onClick: () => void }`
  - [ ] Render a circular badge: `w-10 h-10 rounded-full bg-brand-navy text-white text-sm font-bold flex items-center justify-center shadow-md cursor-pointer` — touch target ≥ 44px (UX-DR7)
  - [ ] Create `src/components/map/map-price-pin.tsx` with `'use client'` directive
  - [ ] Props: `{ price: number; isSelected: boolean; onClick: () => void }`
  - [ ] Render a pill badge: `px-2 py-1 rounded-full text-xs font-semibold shadow-md cursor-pointer` — bg: `bg-brand-navy text-white` (unselected), `bg-white text-brand-navy border-2 border-brand-navy` (selected)
  - [ ] Price display: abbreviated — import `formatPriceAbbrev` from `@/lib/map/geo-utils` (defined in Task 3 — do NOT reimplement)
  - [ ] Both pins must have `role="button"`, `aria-label`, and `tabIndex={0}` for keyboard accessibility (UX-DR22)

- [ ] Task 6: Create `MapView` client component (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9)
  - [ ] Create `src/components/map/map-view.tsx` with `'use client'` directive
  - [ ] This component renders the actual Mapbox map and handles all map interactions
  - [ ] Props:
    ```ts
    interface MapViewProps {
      properties: MapProperty[]; // see type below
      locale: string;
      onBoundsChange?: (bounds: MapBounds) => void;
    }
    type MapProperty = {
      id: string; slug: string; titleEn: string; titleEs: string;
      priceUsd: number; bedrooms: number | null; bathrooms: number | null;
      lotSizeM2: number | null; zmtStatus: string;
      images: { url: string; alt?: string }[];
      latitude: number; longitude: number;
    };
    ```
  - [ ] Use `Map` (aliased as `MapboxMap`) and `Marker` from `react-map-gl`; import mapbox-gl CSS: `import "mapbox-gl/dist/mapbox-gl.css"`
  - [ ] Map initialization:
    - `mapboxAccessToken={MAPBOX_TOKEN}`
    - `mapStyle={MAP_STYLE}` (from `src/lib/map/config.ts`)
    - `initialViewState={{ longitude: center.lng, latitude: center.lat, zoom }}` (from Zustand store via `useMapStore`)
    - `maxBounds={MAX_BOUNDS}` (from config)
    - `terrain={{ source: 'mapbox-dem', exaggeration: 1.2 }}` — enables 3D terrain (FR1, AC #1)
  - [ ] Add Mapbox DEM terrain source in the `onLoad` callback:
    ```ts
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
    ```
  - [ ] Handle `onMove` event: update Zustand store center + zoom + call `onBoundsChange` with new bounds
  - [ ] Clustering: implement client-side clustering using the Supercluster algorithm (`supercluster` package installed in Task 1)
    - Group nearby pins at current zoom level into cluster markers
    - Render `<MapClusterPin>` for clusters, `<MapPricePin>` for individual properties
    - Use `<Marker>` from `react-map-gl` to position each pin/cluster
  - [ ] Pin click: set `selectedPropertyId` local state; render `<MapPropertyPopup>` at the pin's lat/lon
  - [ ] Cluster click: zoom map in by 2 levels centered on the cluster (standard clustering UX)
  - [ ] Keyboard: pin markers have `tabIndex={0}` and `onKeyDown` handler for Enter/Space → same as click
  - [ ] `data-testid="map-container"` on the outermost wrapper `<div>` (REPLACES `data-testid="map-placeholder"` from Story 3.1)
  - [ ] Accessibility: add `aria-label="Property locations map"` on the map container

- [ ] Task 7: Create `MapViewLoader` — the dynamically-imported wrapper (AC: #6)
  - [ ] Create `src/components/map/map-view-loader.tsx` (regular file, no `'use client'` — the dynamic import handles that)
  - [ ] Use `next/dynamic` to lazy-load `MapView`:
    ```ts
    import dynamic from "next/dynamic";
    const MapView = dynamic(() => import("./map-view"), {
      ssr: false,
      loading: () => <div data-testid="map-container" className="h-full w-full bg-muted animate-pulse" />,
    });
    export { MapView };
    ```
  - [ ] This ensures Mapbox GL JS (~230KB) is NOT in the main bundle (AR25, R-001 mitigation)
  - [ ] The `loading` fallback retains `data-testid="map-container"` so tests that check for the testid don't break during load

- [ ] Task 8: Create `getPropertiesForMap` Server Action (AC: #2, #5)
  - [ ] Create `src/app/actions/map-actions.ts` (Server Action file, no `'use client'`)
  - [ ] Add `"use server"` directive at the top
  - [ ] Export `async function getPropertiesForMap(bounds?: { north: number; south: number; east: number; west: number }): Promise<MapProperty[]>`
  - [ ] Query `properties` table via Drizzle: filter `isVisible = true`, `latitude IS NOT NULL`, `longitude IS NOT NULL`
  - [ ] If `bounds` provided, filter using PostGIS: `WHERE geo && ST_MakeEnvelope(west, south, east, north, 4326)::geography` — use Drizzle's `sql` template for raw PostGIS expression
  - [ ] Return only the fields needed by the map (id, slug, titleEn, titleEs, priceUsd, bedrooms, bathrooms, lotSizeM2, zmtStatus, images, latitude, longitude) — do NOT return the full property record
  - [ ] Limit to 500 properties maximum (PostGIS spatial index `idx_properties_geo` is already on the `geo` column per schema — verify it exists)
  - [ ] Import path for db: `import { db } from "@/lib/db/client"`; schema: `import { properties } from "@/lib/db/schema"`

- [ ] Task 9: Wire `MapView` into `SplitViewLayout` (AC: #1, #2, #5, #9)
  - [ ] Update `src/components/search/split-view-layout.tsx`:
    - Replace `<div data-testid="map-placeholder" className="h-full w-full bg-muted" />` with `<MapView properties={properties} locale={locale} onBoundsChange={handleBoundsChange} />`
    - Add props: `properties: MapProperty[]` and `locale: string` to `SplitViewLayoutProps`
    - Import `{ MapView }` from `@/components/map/map-view-loader` (NOT direct import of `map-view`)
    - The `onBoundsChange` handler updates Zustand store via `useMapStore` (already available in the component since it's `'use client'`)
  - [ ] **Fix regression in `tests/unit/search/split-view-layout.spec.tsx`:** The Story 3.1 test has a `data-testid="map-placeholder"` assertion at line 110–114. Update it to `data-testid="map-container"` (the new testid from MapViewLoader's loading fallback). The test comment on line 11 also references `map-placeholder` — update that too. This prevents a test regression from Story 3.1's placeholder being replaced.
  - [ ] Update `src/components/search/search-page-client.tsx`:
    - Call `getPropertiesForMap()` using `useEffect` + `useState` (initial load with no bounds filter — loads all visible properties)
    - When `onBoundsChange` fires (after initial map interaction), call `getPropertiesForMap(bounds)` to refresh
    - Pass `properties` and `locale` (from `useParams()` from `next/navigation`) down to `SplitViewLayout`
    - Show count in pull-up handle: pass `propertyCount` as a prop to `SplitViewLayout` (Story 3.1 hardcoded `24` — replace with real count)
  - [ ] **Do NOT change the existing Suspense boundary in `page.tsx`** — it's correct as-is

- [ ] Task 10: Add i18n keys (AC: #4)
  - [ ] In `src/messages/en.json` under the existing `"SearchPage"` key, add:
    ```json
    "MapView": {
      "ariaLabel": "Property locations map",
      "loading": "Loading map...",
      "closePopup": "Close property preview",
      "viewDetails": "View Details",
      "zmtStatus": {
        "titled": "Titled",
        "concession": "Concession",
        "zmt_restricted": "ZMT Restricted"
      },
      "specs": {
        "beds": "{count} bed",
        "baths": "{count} bath",
        "lotSize": "{size} m²"
      }
    }
    ```
  - [ ] Add equivalent Spanish keys to `src/messages/es.json`

- [ ] Task 11: Tests (AC: all)
  - [ ] Create `tests/unit/search/map-view.spec.tsx` — Vitest + jsdom (file lives in `tests/unit/search/` to get jsdom env from `environmentMatchGlobs`)
  - [ ] **Mock strategy (mandatory):** `vi.mock('react-map-gl')` before importing `MapView` — Mapbox GL JS uses WebGL which does NOT function in jsdom. Mock must be declared before component imports (established pattern from Story 3.1)
  - [ ] Test: map container renders with `data-testid="map-container"` (3.2-UNIT-001 coverage)
  - [ ] Test: with `properties=[]`, no markers rendered (no crash)
  - [ ] Test: with 1 property, one `<MapPricePin>` marker is rendered (mock Marker from react-map-gl)
  - [ ] Test: clicking a pin sets selected state and renders popup with property title
  - [ ] Test: popup close button calls `onClose` and hides popup
  - [ ] Create `tests/unit/search/map-store.spec.ts` (Vitest, node env — no jsdom needed)
  - [ ] Test: initial state has correct default center (`lng: -83.70, lat: 9.38`) and zoom (`10`)
  - [ ] Test: `setCenter`, `setZoom`, `setBounds` update state correctly
  - [ ] Create `tests/unit/search/geo-utils.spec.ts` (Vitest, node env)
  - [ ] Test: `formatPriceAbbrev(250000)` returns `"$250K"`
  - [ ] Test: `formatPriceAbbrev(1200000)` returns `"$1.2M"`
  - [ ] Test: `formatPriceAbbrev(500)` returns `"$500"` (below 1K, show full)

- [ ] Task 12: CI verification (AC: all)
  - [ ] `npm run typecheck` → 0 new errors
  - [ ] `npm run lint` → 0 errors
  - [ ] `npm run format:check` → pass
  - [ ] `npm run build` → pass (Mapbox chunk must NOT appear in main bundle — check build output)
  - [ ] `npm test` → all existing tests pass + new map tests pass

## Dev Notes

### Critical Architecture Decisions

**Mapbox must be lazy-loaded — NO exceptions (AR25, R-001):**

The architecture mandates `dynamic(() => import(), { ssr: false })` for Mapbox. This is not optional:
- Mapbox GL JS is ~230KB gzipped — including it in the main bundle would violate the 150KB budget
- SSR is impossible (Mapbox uses `window`/`canvas`/WebGL)
- Use `MapViewLoader` (Task 7) as the only import point for `MapView` inside `SplitViewLayout`
- **NEVER** `import MapView from './map-view'` directly in components — always use the loader

**Zustand store location:** `src/store/map-store.ts` (new directory; architecture mentions "zustand" for map viewport state — AR10). The `src/store/` directory does not exist yet; create it. Do NOT put the store in `src/lib/`. Zustand stores are plain TypeScript modules — do NOT add `'use client'` to the store file itself; that directive belongs on React component files only. Components that import `useMapStore` must themselves be Client Components.

**Server Actions directory:** `src/app/actions/` does not exist yet — create it. Server Actions in Next.js App Router can live anywhere in `src/app/` (or `src/` with `"use server"` at the top). The `src/app/actions/` convention is used here for discoverability.

**react-map-gl v7 API (important breaking change from v6):**
- In v7, the `Map` component's `onMove` handler receives a `ViewStateChangeEvent` — use `event.viewState` for center/zoom, and `event.target.getBounds()` for bounds
- Import: `import { Map as MapboxMap, Marker, Popup } from 'react-map-gl'`
- MapboxMap requires `mapboxAccessToken` prop (v7 change — not `mapboxApiAccessToken`)
- CSS import is required: `import 'mapbox-gl/dist/mapbox-gl.css'` inside `map-view.tsx`

**Supercluster for clustering:** The architecture does not prescribe a specific clustering library, but the React + Mapbox ecosystem standard is `supercluster` (installed in Task 1). Use `useMemo` to compute clusters when `properties` array or `zoom` changes. Supercluster operates on GeoJSON FeatureCollection — convert `MapProperty[]` to GeoJSON points before passing to Supercluster, then map the cluster output back to Marker positions.

**Token availability is a blocker:**
`NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local` is currently blank. The map will not render without a valid token. Dev must:
1. Create a free Mapbox account at mapbox.com
2. Generate a public token (safe for client-side use)
3. Add to `.env.local`: `NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYW55dXNlciJ9...`
The CI/CD staging environment also needs this token configured. **This story cannot ship to staging without it.**

**Server Action for map data:**
Server Actions (created in Task 8) live in `src/app/actions/` — this convention is consistent with Next.js App Router patterns. The action uses the existing PostGIS `geo` column (with `idx_properties_geo` GiST index already in production) for spatial bounding-box filtering. The query uses Drizzle's `sql` template for the raw PostGIS `ST_MakeEnvelope` expression since Drizzle doesn't have first-class PostGIS support.

**Rendering strategy — no change to page.tsx:**
Search page is CSR (AR9). `src/app/[locale]/search/page.tsx` is a Server Component shell that just calls `setRequestLocale` and renders `<SearchPageClient />` inside `<Suspense>`. Do NOT add Server Action calls inside `page.tsx` — all data fetching for the map is triggered client-side from `search-page-client.tsx`.

**Map style choice — Mapbox Outdoors:**
`mapbox://styles/mapbox/outdoors-v12` is chosen because it shows terrain contours, forest cover, and roads — critical for international buyers trying to understand southern Costa Rica's mountainous/coastal geography ("Map as storytelling" — UX spec §2). The `satellite-streets-v12` style is an alternative if client prefers aerial view.

**3D Terrain setup:**
Terrain requires adding a `raster-dem` source in the `onLoad` callback and setting `terrain` on the map. This is Mapbox v3 API — it works with `mapbox://mapbox.mapbox-terrain-dem-v1`. The `exaggeration: 1.2` makes the dramatic topography of the Southern Zone (Chirripó mountains, coastal cliffs) visually readable.

### Component File Map

**New files to create:**
```
src/store/
  map-store.ts                           ← Zustand map state (center, zoom, bounds)

src/lib/map/
  config.ts                              ← Mapbox token, map style, default center, max bounds
  geo-utils.ts                           ← boundsFromMapboxEvent, formatPriceAbbrev

src/components/map/
  map-view.tsx                           ← Mapbox Map + Markers + Popup (lazy-loaded via loader)
  map-view-loader.tsx                    ← next/dynamic wrapper (ssr: false)
  map-property-popup.tsx                 ← Preview card shown on pin tap
  map-cluster-pin.tsx                    ← Circular cluster badge
  map-price-pin.tsx                      ← Individual property price pill

src/app/actions/
  map-actions.ts                         ← Server Action: getPropertiesForMap(bounds?)

tests/unit/search/
  map-view.spec.tsx                      ← Component tests (jsdom env, react-map-gl mocked)
  map-store.spec.ts                      ← Zustand store unit tests (node env)
  geo-utils.spec.ts                      ← Pure function tests (node env)
```

**Files to modify:**
```
src/components/search/split-view-layout.tsx         ← Replace map-placeholder with <MapView>
src/components/search/search-page-client.tsx         ← Add data fetching + pass properties/locale
src/messages/en.json                                 ← Add MapView keys
src/messages/es.json                                 ← Add MapView keys (Spanish)
package.json                                         ← Add react-map-gl, mapbox-gl, zustand, supercluster
tests/unit/search/split-view-layout.spec.tsx         ← Update map-placeholder → map-container (regression fix)
```

**Files already done — do NOT touch:**
```
src/app/[locale]/search/page.tsx               ← Story 3.1, correct as-is
src/components/search/view-mode-toggle.tsx     ← Story 3.1, correct as-is
src/components/search/search-filter-bar.tsx    ← Story 3.1 stub, Story 3.3 owns this
src/lib/db/schema/properties.ts                ← Epic 2, latitude/longitude/geo already correct
src/lib/constants/offices.ts                   ← Already has office data (no geo coords yet — use hardcoded defaults)
```

### Test Patterns — Mandatory Rules from Story 3.1

1. **vi.mock hoisting:** Declare `vi.mock('react-map-gl', ...)` BEFORE any component imports. Comment `// imported AFTER mocks` on the component import line. This is the established and verified pattern.
2. **Responsive modifier assertions:** Test Tailwind classes using responsive modifiers (`"lg:hidden"`, `"md:block"`) — bare utilities like `"hidden"` are vacuously true (Story 3.1 lesson).
3. **Complementary not.toContain:** When testing toggle state, add `expect(...).not.toContain('opposing-class')` alongside the positive assertion.
4. **Mock react-map-gl fully:** `Map`, `Marker`, `Popup` all need stubs. Minimal example:
   ```ts
   vi.mock('react-map-gl', () => ({
     Map: ({ children, onLoad }: any) => { onLoad?.({ target: { getBounds: () => ({ getNorth: () => 11, getSouth: () => 7, getEast: () => -81, getWest: () => -86 }) } }); return <div data-testid="map-container">{children}</div>; },
     Marker: ({ children }: any) => <div>{children}</div>,
     Popup: ({ children }: any) => <div data-testid="map-property-popup">{children}</div>,
   }));
   ```
5. **vi.mock('next/navigation'):** Required for any component using `useParams` or `useSearchParams`.
6. **vi.mock('next-intl'):** Required for components using `useTranslations`.

### Architecture Compliance Checklist

- [ ] `MapView` is `'use client'` — Mapbox requires browser APIs (canvas, WebGL)
- [ ] `MapViewLoader` uses `dynamic(..., { ssr: false })` — no SSR for Mapbox
- [ ] `map-view.tsx` is ONLY imported via `map-view-loader.tsx` — never directly
- [ ] `getPropertiesForMap` has `"use server"` at top — Server Action
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` read via `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` — NEXT_PUBLIC prefix is required for client-side access
- [ ] Map state (center, zoom, bounds) is in Zustand store — NOT in React `useState` or URL params (per AR10)
- [ ] Filter/view state remains in URL params — unchanged from Story 3.1 (AR10 distinction: filters=URL, map viewport=Zustand)

### Risk Mitigations (from Epic 3 Test Design)

**R-001 (score 6): Mapbox bundle not lazy-loaded:**
- Mitigation: `MapViewLoader` uses `dynamic(..., { ssr: false })` (Task 7)
- Verification: `npm run build` output — `mapbox` must NOT appear in the main `/_next/static/chunks/main*.js` chunk

**R-002 (score 6): Map + pins fail within 3s on 4G:**
- Mitigation: GeoJSON for properties is fetched via Server Action (server-side, no client DB call); Mapbox tiles are CDN-cached (NFR20); terrain DEM is loaded async after initial render
- Verification: 3.2-E2E-001 (Playwright, 4G throttle) — Part of ATDD phase (Story step 2)

**R-012 (score 4): Map bounds ↔ grid sync stale:**
- Mitigation: `onBoundsChange` callback fires on every `onMove` event; `search-page-client` re-fetches properties on bounds change (Task 9)
- Verification: 3.2-E2E-003 (Playwright) — Part of ATDD phase

### Data Flow Diagram

```
[page.tsx (Server)]
  └─► [SearchPageClient (Client)]
        ├─► getPropertiesForMap() [Server Action, initial load]
        │     └─► PostgreSQL + PostGIS (latitude IS NOT NULL, isVisible=true)
        │           └─► Returns MapProperty[] (max 500)
        ├─► [SearchFilterBar] (stub, Story 3.3)
        └─► [SplitViewLayout]
              ├─► [MapViewLoader → MapView (lazy, CSR only)]
              │     ├─► Mapbox GL JS (react-map-gl, dynamic import)
              │     ├─► MapPricePin / MapClusterPin (Markers)
              │     ├─► MapPropertyPopup (on pin tap)
              │     └─► onBoundsChange → useMapStore.setBounds()
              │           └─► triggers getPropertiesForMap(bounds) refresh
              └─► [SearchResultsSkeleton] (grid panel, Story 3.5 replaces)
```

### Story Scope Boundaries

**This story DOES implement:**
- All Mapbox GL JS integration (install, config, render, 3D terrain)
- Zustand map store
- Property pin rendering and clustering (Supercluster)
- Pin tap → preview popup → "View Details" link
- Map bounds → grid sync (fires `onBoundsChange`; grid stays as skeleton for now)
- `getPropertiesForMap` Server Action
- Unit tests for all new components and utilities
- `data-testid="map-container"` (replaces `map-placeholder`)

**This story does NOT implement:**
- Actual property grid with real cards (Story 3.5 — `SearchResultsSkeleton` stays)
- Search/filter logic (Story 3.3)
- Lifestyle tags (Story 3.4)
- Full pull-up sheet gestures (Story 3.6 — handle stub from 3.1 stays unchanged)
- Unit conversion (Story 3.7)
- No-results state (Story 3.8)
- "Near Me" geolocation button (Story 3.8)
- Playwright E2E tests (Stories 3.2 E2E tests are in ATDD step — run after dev)
- CSP headers for Mapbox (deferred, noted in deferred-work.md from Story 1.1 code review)

### UX Reference

**Map composition (UX spec §2):**
```
Split-view map panel (60% left on desktop)
├─ Mapbox GL map (3D terrain, Outdoors style)
├─ Property pins: price pills (individual) + circle clusters (groups)
└─ Pin tap → preview card overlay (photo + price + specs + ZMT + CTA)
```

**Touch targets:** Cluster pins (40px × 40px, w-10 h-10) and price pins (min 44px wide) — (UX-DR7: ≥ 44px touch targets)

**Color tokens to use (do NOT use hex values):**
- Active pin / cluster background: `bg-brand-navy` (`#000E35`)
- Selected pin: `bg-white border-2 border-brand-navy text-brand-navy`
- Cluster count text: `text-white`
- Popup card: `bg-background border border-border rounded-lg shadow-lg`
- ZMT badge: `bg-muted text-muted-foreground text-xs rounded px-1.5 py-0.5`

**Visual reference:** `_bmad-output/planning-artifacts/search_page_mockup_1775316383692.png` and `_bmad-output/planning-artifacts/mobile_map_mockup_1775316436946.png`

### Previous Story Intelligence (Story 3.1 Learnings)

All from `_bmad-output/test-artifacts/test-design-epic-3.md` §"Story 3.1 Implementation Learnings":

1. **jsdom environment:** Tests in `tests/unit/search/**/*.spec.tsx` automatically get jsdom. `environmentMatchGlobs` is already configured in `vitest.config.ts` — do NOT change the glob. New map spec files belong in `tests/unit/search/`.

2. **esbuild JSX transform:** `esbuild: { jsx: "automatic" }` in vitest.config.ts handles TSX transform — do NOT add `@vitejs/plugin-react`.

3. **`vi.mock` hoisting pattern:** All 3 existing spec files use `vi.mock(...)` declared before component imports with `// imported AFTER mocks` comment. Replicate this exactly.

4. **`data-testid` contract update:** `data-testid="map-placeholder"` (set in Story 3.1 `split-view-layout.tsx`) must be REPLACED with `data-testid="map-container"` (on the `<MapView>` wrapper). The 3.1 test `split-view-layout.spec.tsx` asserts on `map-placeholder` — update that test assertion to `map-container` in this story.

5. **Tailwind v4 CSS-first:** Use design tokens (`bg-brand-navy`, `text-brand-navy`, etc.) from `src/styles/globals.css`. No hardcoded hex values.

6. **Pattern: `params` is a Promise** in Server Components — not needed here since the search page Client Component uses `useParams()`.

### Git Intelligence

Recent commits:
1. `test(epic-3): update test design — mark 3.1 done, add implementation learnings for 3.2–3.8` — test design is current and authoritative for this story
2. `chore(phase0): refresh dependency-graph timestamp to 2026-04-26` — no code changes
3. `story-3.1-search-page-layout-split-view` — established all patterns this story builds upon

**Key insight from PR #122:** The search-page-client, split-view-layout, view-mode-toggle, and search-filter-bar files are the foundation. This story modifies split-view-layout and search-page-client to replace the map placeholder with the real map. All other Story 3.1 files are unchanged.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: Interactive Map with Property Pins]
- [Source: _bmad-output/planning-artifacts/architecture.md#Key Architectural Decisions — AD-3 (Mapbox GL JS via react-map-gl)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Directory Architecture §3 — map/ components]
- [Source: _bmad-output/planning-artifacts/architecture.md#Client vs. Server Component Split §8]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management §8 — Map viewport via Zustand]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Splitting Strategy §8 — AR25, Mapbox lazy-loaded]
- [Source: _bmad-output/planning-artifacts/architecture.md#Performance Budget §8 — Mapbox ~230KB separate chunk]
- [Source: _bmad-output/planning-artifacts/architecture.md#Technology Version Pinning — react-map-gl 7.x, mapbox-gl 3.x]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Map as storytelling §2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Touch targets UX-DR7]
- [Source: _bmad-output/test-artifacts/test-design-epic-3.md#Story 3.1 Implementation Learnings]
- [Source: _bmad-output/test-artifacts/test-design-epic-3.md#Risk Assessment — R-001, R-002, R-012]
- [Source: _bmad-output/test-artifacts/test-design-epic-3.md#P0 Coverage — 3.2-E2E-001, 3.2-E2E-002, 3.2-E2E-003]
- [Source: _bmad-output/test-artifacts/test-design-epic-3.md#P1 Coverage — 3.2-E2E-004, 3.2-UNIT-001]
- [Source: _bmad-output/test-artifacts/test-design-epic-3.md#P2 Coverage — 3.2-E2E-005]
- [Source: _bmad-output/implementation-artifacts/3-1-search-page-layout-and-split-view.md#Dev Notes]
- FR1, FR1: [Source: _bmad-output/planning-artifacts/epics.md#Property Discovery Requirements]
- NFR4, NFR20: [Source: _bmad-output/planning-artifacts/epics.md#Non-Functional Requirements]
- AR10, AR25, AR9: architecture decisions referenced throughout epics.md

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
