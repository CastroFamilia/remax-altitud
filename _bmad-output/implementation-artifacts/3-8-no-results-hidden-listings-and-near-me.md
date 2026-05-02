# Story 3.8: No-Results, Hidden Listings & Near Me

**Status:** review
**GH Issue:** #92
**Epic:** 3 — Property Discovery & Search
**Story Key:** 3-8-no-results-hidden-listings-and-near-me

---

## Story

As a **visitor**,
I want helpful suggestions when no properties match and easy location-based search,
so that I'm never stuck at a dead end and can discover nearby properties.

---

## Acceptance Criteria

1. **Given** a search with filters that return zero results **When** the empty state renders **Then** it shows: "No properties match your filters in this area" + smart suggestions (relaxed filters or alternative areas) + "Tell an agent your dream home" WhatsApp CTA (FR12, UX-DR20)

2. **Given** the "Tell an agent" CTA in no-results **When** clicked **Then** WhatsApp opens with the search criteria forwarded in the message (FR12)

3. **Given** a previously visible listing that has been removed **When** its URL is visited **Then** a "No longer available" page appears with similar properties carousel and agent CTA (FR14, UX-DR20)

4. **Given** the "Near Me" button **When** clicked **Then** the browser Geolocation API is invoked (FR16)

5. **Given** geolocation is granted **When** coordinates are received **Then** the map flies to the user's location with a radius overlay showing nearby properties (FR16)

6. **Given** geolocation is denied **When** the permission is blocked **Then** the map centers on the nearest RE/MAX office location with a friendly message (FR16)

7. **And** every empty/error state has a forward path — no dead ends (UX-DR20)

---

## Tasks / Subtasks

- [x] Task 1: Upgrade `NoResultsState` to forward search criteria into WhatsApp CTA (AC: #1, #2)
  - [x] **File**: `src/components/property/no-results-state.tsx` (MODIFY — exists with basic WhatsApp stub)
  - [x] **Critical:** Currently uses a static `t("whatsappMessage")` string. Must be upgraded to accept and forward live search filters from URL state into the WhatsApp message.
  - [x] Add a `filters` prop (type `SearchFilters` from `@/types/search`): `interface NoResultsStateProps { filters: SearchFilters; }`
  - [x] Build a human-readable summary of active filters for the WhatsApp message:
    ```ts
    function buildSearchCriteriaSummary(filters: SearchFilters): string {
      const parts: string[] = [];
      if (filters.type) parts.push(`Type: ${filters.type}`);
      if (filters.priceMin !== undefined) parts.push(`Min price: $${filters.priceMin.toLocaleString('en-US')}`);
      if (filters.priceMax !== undefined) parts.push(`Max price: $${filters.priceMax.toLocaleString('en-US')}`);
      if (filters.bedrooms !== undefined) parts.push(`Bedrooms: ${filters.bedrooms}+`);
      if (filters.bathrooms !== undefined) parts.push(`Bathrooms: ${filters.bathrooms}+`);
      if (filters.areaSlug) parts.push(`Area: ${filters.areaSlug}`);
      if (filters.tags?.length) parts.push(`Tags: ${filters.tags.join(', ')}`);
      return parts.length ? parts.join(', ') : 'any property';
    }
    ```
  - [x] Build the WhatsApp message dynamically:
    ```ts
    const criteria = buildSearchCriteriaSummary(filters);
    const whatsAppHref = buildWhatsAppUrl(offices[0], `Hi, I'm looking for: ${criteria}`);
    ```
  - [x] Add `data-testid="no-results-state"` on the root element of `EmptyState` wrapper
  - [x] Add `data-testid="no-results-whatsapp-cta"` on the secondary action anchor (EmptyState's secondaryAction.label element)
  - [x] **DO NOT change** the `EmptyState` component itself — use it as-is
  - [x] **DO NOT change** the `EmptyState`'s `primaryAction` (adjust filters / browse) — keep it pointing to `/search`

- [x] Task 2: Wire `NoResultsState` into `PropertyGrid` and render it when zero results (AC: #1, #2)
  - [x] **File**: `src/components/property/property-grid.tsx` (MODIFY — exists from Story 3.5)
  - [x] Add `filters?: SearchFilters` prop to `PropertyGridProps`
  - [x] Import `NoResultsState` from `@/components/property/no-results-state`
  - [x] Replace the existing plain empty state text (`tGrid("empty")`) with `<NoResultsState filters={filters ?? {}} />` when `currentPageItems.length === 0 && !isLoading`:
    ```tsx
    {currentPageItems.length === 0 && !isLoading && (
      <div className="col-span-full">
        <NoResultsState filters={filters ?? {}} />
      </div>
    )}
    ```
  - [x] **Remove** the old `{tGrid("empty")}` div (it's replaced by `NoResultsState`)
  - [x] Pass `filters` through from `SplitViewLayout` → `PropertyGrid`

- [x] Task 3: Pass `filters` from `SplitViewLayout` to `PropertyGrid` (AC: #1, #2)
  - [x] **File**: `src/components/search/split-view-layout.tsx` (MODIFY — exists from Stories 3.1–3.7)
  - [x] Add `filters?: SearchFilters` to `SplitViewLayoutProps`
  - [x] Import `SearchFilters` from `@/types/search`
  - [x] Pass `filters={filterProperties !== undefined ? (filters ?? {}) : undefined}` to `<PropertyGrid filters={filters} />`
  - [x] In `SearchPageClient`, import `useSearchFilters` and pass `filters` prop to `SplitViewLayout`

- [x] Task 4: Pass `filters` from `SearchPageClient` to `SplitViewLayout` (AC: #1, #2)
  - [x] **File**: `src/components/search/search-page-client.tsx` (MODIFY — exists)
  - [x] The `filters` const already exists via `const { filters } = useSearchFilters();`
  - [x] Add `filters={filters}` prop to `<SplitViewLayout>` JSX
  - [x] Import `SearchFilters` type is not needed directly — it's typed via SplitViewLayout props

- [x] Task 5: Upgrade `ListingRemovedState` with a proper similar-properties display (AC: #3)
  - [x] **File**: `src/components/property/listing-removed-state.tsx` (MODIFY — exists with basic stub)
  - [x] **Currently:** uses a static `EmptyState` with basic CTA pointing to `/`
  - [x] **New behavior:** The property detail page (`src/app/[locale]/property/[slug]/page.tsx`) already renders the "no longer available" page with similar properties. The `ListingRemovedState` component is a simpler standalone widget. Review whether both are needed.
  - [x] **IMPORTANT**: The property detail page (`/property/[slug]/page.tsx`) **already fully implements** the hidden listing flow (soft delete → `getSimilarProperties` → renders cards with links). The `listing-removed-state.tsx` component is a **separate fallback** used elsewhere. Do NOT duplicate the logic — verify the page works, add `data-testid="listing-removed-state"` for testing if missing.
  - [x] Verify the property detail page (`src/app/[locale]/property/[slug]/page.tsx`) has `data-testid="listing-unavailable-page"` on its root container. **IMPORTANT**: `SimplePageLayout` does NOT accept a `data-testid` prop (it has no `data-*` forwarding). Wrap the `SimplePageLayout` call in a `<div>`:
    ```tsx
    <div data-testid="listing-unavailable-page">
      <SimplePageLayout pageTitle={t("heading")} intro={t("subtext")}>
        {/* ... existing similar properties content ... */}
      </SimplePageLayout>
    </div>
    ```
  - [x] Add `data-testid="similar-properties-list"` on the `<ul>` of similar properties in the page
  - [x] Add `data-testid="agent-cta"` on the WhatsApp CTA link in the listing-removed page (if present); or on the browse-all button fallback
  - [x] Update `ListingRemovedState.tsx` to add `data-testid="listing-removed-state"` on the `<EmptyState>` wrapper (for unit testing)

- [x] Task 6: Create `src/hooks/use-geolocation.ts` — Browser Geolocation API hook (AC: #4, #5, #6)
  - [x] Create the file at EXACTLY `src/hooks/use-geolocation.ts` — **this file does NOT exist yet** (architecture §3 specifies it)
  - [x] Add `'use client'` — this hook uses browser `navigator.geolocation` (client-only)
  - [x] Import offices coordinates from `@/lib/constants/offices-geo` (create this new const file, see Task 7 below)
  - [x] Define `GeolocationState` type:
    ```ts
    export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

    export interface GeolocationState {
      status: GeolocationStatus;
      coords: { lat: number; lng: number } | null;
      /** Set when denied — nearest office coordinates as fallback */
      fallbackCoords: { lat: number; lng: number } | null;
      /** Human-readable notification message for denied/error case */
      fallbackMessage: string | null;
    }
    ```
  - [x] Implement `useGeolocation()` hook:
    ```ts
    export function useGeolocation() {
      const [state, setState] = useState<GeolocationState>({
        status: 'idle',
        coords: null,
        fallbackCoords: null,
        fallbackMessage: null,
      });

      const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
          // Browser doesn't support geolocation — fall back to office
          setState({
            status: 'error',
            coords: null,
            fallbackCoords: OFFICE_PZ_COORDS,
            fallbackMessage: 'Location not supported — showing properties near our office.',
          });
          return;
        }

        setState(prev => ({ ...prev, status: 'loading' }));

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setState({
              status: 'success',
              coords: { lat: position.coords.latitude, lng: position.coords.longitude },
              fallbackCoords: null,
              fallbackMessage: null,
            });
          },
          (error) => {
            // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=UNAVAILABLE, 3=TIMEOUT
            const isDenied = error.code === 1; // GeolocationPositionError.PERMISSION_DENIED
            setState({
              status: isDenied ? 'denied' : 'error',
              coords: null,
              fallbackCoords: OFFICE_PZ_COORDS,
              fallbackMessage: isDenied
                ? "Location unavailable — showing properties near our Pérez Zeledón office"
                : "Location error — showing properties near our office",
            });
          },
          {
            enableHighAccuracy: false, // Battery-friendly for mobile
            timeout: 10000,
            maximumAge: 300000, // Accept 5min-old cache
          }
        );
      }, []);

      return { ...state, requestLocation };
    }
    ```
  - [x] **CRITICAL**: R-007 mitigation — the `errorCallback` MUST be provided (prevents unhandled rejection on permission denied). The error type must be `GeolocationPositionError` (not generic `Error`).
  - [x] Export: `GeolocationStatus`, `GeolocationState`, `useGeolocation`

- [x] Task 7: Create `src/lib/constants/offices-geo.ts` — Office lat/lng for geolocation fallback (AC: #6)
  - [x] Create `src/lib/constants/offices-geo.ts` — **new file** (not in architecture spec but needed to avoid circular imports)
  - [x] Export office fallback coordinates (sourced from Google Maps for RE/MAX Altitud offices):
    ```ts
    /** Pérez Zeledón office — RE/MAX Altitud main office, San Isidro de El General */
    export const OFFICE_PZ_COORDS = { lat: 9.3725, lng: -83.7011 };

    /** Dominical / Uvita office — RE/MAX Altitud Cero */
    export const OFFICE_DOMINICAL_COORDS = { lat: 9.2570, lng: -83.8850 };

    /**
     * Returns the nearest office coordinates based on user coords.
     * If no user coords provided, defaults to PZ (primary office).
     */
    export function getNearestOfficeCoords(
      userLat?: number,
      userLng?: number,
    ): { lat: number; lng: number } {
      if (userLat === undefined || userLng === undefined) return OFFICE_PZ_COORDS;
      const distPZ = Math.hypot(userLat - OFFICE_PZ_COORDS.lat, userLng - OFFICE_PZ_COORDS.lng);
      const distDOM = Math.hypot(userLat - OFFICE_DOMINICAL_COORDS.lat, userLng - OFFICE_DOMINICAL_COORDS.lng);
      return distPZ <= distDOM ? OFFICE_PZ_COORDS : OFFICE_DOMINICAL_COORDS;
    }
    ```
  - [x] Import `OFFICE_PZ_COORDS` in `use-geolocation.ts` for the fallback

- [x] Task 8: Create `src/components/search/near-me-button.tsx` — NearMe Client Component (AC: #4, #5, #6)
  - [x] Create the file at EXACTLY `src/components/search/near-me-button.tsx` — **this file does NOT exist yet** (architecture §3 specifies it at `src/components/search/near-me-button.tsx`)
  - [x] Add `'use client'` as first line
  - [x] Architecture §8: `NearMeButton` is explicitly listed as a Client Component (Geolocation API)
  - [x] Props:
    ```ts
    interface NearMeButtonProps {
      onLocationSuccess: (coords: { lat: number; lng: number }) => void;
      onLocationFallback: (coords: { lat: number; lng: number }, message: string) => void;
      className?: string;
    }
    ```
  - [x] Use `useGeolocation()` hook internally
  - [x] Use `useTranslations('NearMe')` for i18n
  - [x] Render a button that triggers `requestLocation()` on click:
    ```tsx
    <button
      type="button"
      data-testid="near-me-button"
      aria-label={t('label')}
      onClick={handleClick}
      disabled={status === 'loading'}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium",
        "hover:bg-muted transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <MapPin className="h-4 w-4" aria-hidden="true" />
      {status === 'loading' ? t('loading') : t('label')}
    </button>
    ```
  - [x] Import `MapPin` from `lucide-react`
  - [x] In `handleClick`: call `requestLocation()`. When `status` changes to `'success'` → call `onLocationSuccess(coords!)`. When `status` changes to `'denied'` or `'error'` → call `onLocationFallback(fallbackCoords!, fallbackMessage!)`.
  - [x] Use a `useEffect` to watch `status` changes and trigger the callbacks:
    ```ts
    useEffect(() => {
      if (status === 'success' && coords) {
        onLocationSuccess(coords);
      } else if ((status === 'denied' || status === 'error') && fallbackCoords) {
        onLocationFallback(fallbackCoords, fallbackMessage ?? 'Location unavailable');
      }
    }, [status, coords, fallbackCoords, fallbackMessage, onLocationSuccess, onLocationFallback]);
    ```
  - [x] Add `data-testid="near-me-button"` on root button element
  - [x] Export `NearMeButton`

- [x] Task 9: Add `flyToLocation` capability to MapView and integrate NearMeButton (AC: #4, #5, #6)
  - [x] **File**: `src/components/map/map-view.tsx` (MODIFY — frozen in Story 3.2 BUT story 3.8 must extend it)
  - [x] **CRITICAL**: The MapView `mapRef.current?.flyTo(...)` API already exists (used by cluster expand at line 196). Use the same pattern.
  - [x] Add a `flyToTarget` prop to `MapViewProps`:
    ```ts
    interface MapViewProps {
      properties: MapProperty[];
      locale: string;
      onBoundsChange?: (bounds: MapBounds) => void;
      /** Story 3.8: When set, map flies to these coordinates with given zoom */
      flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
    }
    ```
  - [x] Add a `useEffect` in `MapView` to react to `flyToTarget` changes:
    ```ts
    useEffect(() => {
      if (flyToTarget && mapRef.current) {
        mapRef.current.flyTo({
          center: [flyToTarget.lng, flyToTarget.lat],
          zoom: flyToTarget.zoom ?? 13,
          duration: 800, // 800ms per UX spec §Animation (Map fly-to = 800ms ease-in-out)
        });
      }
    }, [flyToTarget]);
    ```
  - [x] **DO NOT change** any existing MapView behavior — add only the new prop and its effect
  - [x] Also update `MapViewLoader` (if it wraps MapView props) to forward `flyToTarget`

- [x] Task 10: Add `flyToTarget` support to `SplitViewLayout` and render `NearMeButton` in filter bar (AC: #4, #5, #6)
  - [x] **File**: `src/components/search/split-view-layout.tsx` (MODIFY)
  - [x] Add state: `const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);`
  - [x] Add `fallbackMessage` state: `const [nearMeFallbackMessage, setNearMeFallbackMessage] = useState<string | null>(null);`
  - [x] Pass `flyToTarget={flyToTarget}` to `<MapView>` (via `MapViewLoader`)
  - [x] Import and render `<NearMeButton>` in the filter bar area (next to `UnitToggle`):
    ```tsx
    <NearMeButton
      onLocationSuccess={(coords) => {
        setFlyToTarget({ ...coords, zoom: 13 });
        setNearMeFallbackMessage(null);
      }}
      onLocationFallback={(coords, message) => {
        setFlyToTarget({ ...coords, zoom: 11 });
        setNearMeFallbackMessage(message);
      }}
    />
    ```
  - [x] Render the fallback message as a non-blocking notification banner when `nearMeFallbackMessage` is set:
    ```tsx
    {nearMeFallbackMessage && (
      <div
        role="status"
        aria-live="polite"
        data-testid="near-me-fallback-message"
        className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2"
      >
        <span>{nearMeFallbackMessage}</span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setNearMeFallbackMessage(null)}
          className="ml-4 text-amber-600 hover:text-amber-800"
        >
          ✕
        </button>
      </div>
    )}
    ```
  - [x] **NearMeButton placement**: The UX spec (`ux-design-specification.md` line 1191) shows the Near Me button in the filter bar: `"Horizontal row: Type, Price, Beds, Baths, Lifestyle chips, Near Me"`. Place `<NearMeButton>` inside `SearchFilterBar` (the filter bar component) rather than in `SplitViewLayout` if it fits the architecture better — see Task 11.

- [x] Task 11: Add `NearMeButton` to `SearchFilterBar` (AC: #4, #5, #6)
  - [x] **File**: `src/components/search/search-filter-bar.tsx` (MODIFY — exists from Story 3.3)
  - [x] The UX spec shows Near Me in the filter bar row (line 1191). This is the correct location.
  - [x] Add `onNearMeSuccess?: (coords: { lat: number; lng: number }) => void` and `onNearMeFallback?: (coords: { lat: number; lng: number }, message: string) => void` props to `SearchFilterBarProps`
  - [x] Import and render `<NearMeButton>` at the end of the filter chips row (after lifestyle tags)
  - [x] If callbacks are not provided from parent, the button can still work — `SplitViewLayout` passes the callbacks down through `SearchFilterBar`
  - [x] Alternatively (simpler approach): place `NearMeButton` directly in `SplitViewLayout` alongside the filter bar area, passing `flyToTarget` state setter as the callback. Pick the cleaner approach that requires fewer prop-drilling hops.
  - [x] **Architecture note**: `SearchFilterBar` is already `'use client'` — NearMeButton can be rendered inside it.

- [x] Task 12: Verify `MapViewLoader` forwards `flyToTarget` prop transparently (AC: #5, #6)
  - [x] **File**: `src/components/map/map-view-loader.tsx` (READ-ONLY — likely no changes needed)
  - [x] **IMPORTANT**: `MapViewLoader` uses `next/dynamic` to lazily import `MapView` and re-exports it as `export { MapView }`. It has NO separate props interface — it transparently forwards ALL props to the underlying `MapView`.
  - [x] Because `MapViewLoader` re-exports the dynamically-loaded `MapView`, adding `flyToTarget` to `MapViewProps` (Task 9) is sufficient — no changes to `map-view-loader.tsx` are required.
  - [x] Verify this by reading `map-view-loader.tsx`: if it uses `ComponentProps<typeof OriginalMapView>` or re-exports via `dynamic(() => ...)`, the type flows automatically.
  - [x] **Only change `map-view-loader.tsx` if** it has an explicit props interface that needs updating. Current implementation: no interface = no change needed.

- [x] Task 13: Add i18n keys for `NearMeButton` and related messages (AC: #4, #5, #6)
  - [x] **File**: `src/messages/en.json` — add new `"NearMe"` namespace at top level:
    ```json
    "NearMe": {
      "label": "Near Me",
      "loading": "Locating...",
      "fallbackMessage": "Location unavailable — showing properties near our Pérez Zeledón office",
      "fallbackDismiss": "Dismiss"
    }
    ```
  - [x] **File**: `src/messages/es.json` — add equivalent:
    ```json
    "NearMe": {
      "label": "Cerca de mí",
      "loading": "Localizando...",
      "fallbackMessage": "Ubicación no disponible — mostrando propiedades cerca de nuestra oficina en Pérez Zeledón",
      "fallbackDismiss": "Cerrar"
    }
    ```
  - [x] **DO NOT modify** existing `EmptyStates` i18n keys — they already exist and are in use
  - [x] **Update** `EmptyStates.noResults.whatsappMessage` to be more specific — it will be built dynamically in code (not from i18n), so the static key becomes a prefix/template base only

- [x] Task 14: Unit tests for `NoResultsState` (AC: #1, #2)
  - [x] Create `tests/unit/search/no-results-state.spec.tsx` (Vitest + jsdom — `environmentMatchGlobs` covers `tests/unit/search/**/*.spec.tsx`)
  - [x] Mocks needed:
    ```ts
    // imported AFTER mocks
    vi.mock('next-intl', () => ({
      useTranslations: vi.fn(() => (key: string) => key),
    }));
    vi.mock('@/lib/constants/offices', () => ({
      offices: [{ name: 'RE/MAX Altitud', whatsapp: '50627710000' }],
      buildWhatsAppUrl: vi.fn((office: { whatsapp: string }, msg?: string) =>
        `https://wa.me/${office.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`
      ),
    }));
    ```
  - [x] Tests to write:
    - `[P0]` renders `data-testid="no-results-state"` element
    - `[P0]` renders with empty filters `{}` without throwing
    - `[P0]` WhatsApp href contains `wa.me` when filters are empty
    - `[P0]` WhatsApp href contains filter criteria when type is set (`{ type: 'Casa' }` → message includes `"Casa"`)
    - `[P0]` WhatsApp href contains price when priceMin set
    - `[P0]` forwards multiple filter criteria (type + bedrooms + area)
    - `[P1]` renders with `data-testid="no-results-whatsapp-cta"` on secondary action anchor

- [x] Task 15: Unit tests for `useGeolocation` hook (AC: #4, #5, #6 — test design 3.8-E2E-001)
  - [x] Create `tests/unit/search/use-geolocation.spec.tsx` (Vitest + jsdom)
  - [x] Mock `navigator.geolocation` using `vi.stubGlobal`:
    ```ts
    function mockGeolocationSuccess(lat: number, lng: number) {
      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: vi.fn((success) =>
            success({ coords: { latitude: lat, longitude: lng, accuracy: 10 } })
          ),
        },
      });
    }
    function mockGeolocationDenied() {
      vi.stubGlobal('navigator', {
        geolocation: {
          getCurrentPosition: vi.fn((_success, error) =>
            error({ code: 1, message: 'User denied' })
          ),
        },
      });
    }
    ```
  - [x] Tests to write:
    - `[P0]` initial state is `{ status: 'idle', coords: null, fallbackCoords: null }`
    - `[P0]` after `requestLocation()` with success: `status === 'success'`, `coords.lat` and `coords.lng` match
    - `[P0]` after `requestLocation()` with PERMISSION_DENIED: `status === 'denied'`, `fallbackCoords` is non-null (nearest office)
    - `[P0]` after `requestLocation()` with error code 2: `status === 'error'`, `fallbackCoords` is non-null
    - `[P0]` `fallbackMessage` is non-null when denied
    - `[P1]` navigator.geolocation not available → `status === 'error'` with fallback coords (R-007 guard)

- [x] Task 16: Unit tests for `NearMeButton` component (AC: #4, #5, #6)
  - [x] Create `tests/unit/search/near-me-button.spec.tsx` (Vitest + jsdom)
  - [x] Mocks needed:
    ```ts
    // imported AFTER mocks
    vi.mock('next-intl', () => ({
      useTranslations: vi.fn(() => (key: string) => key),
    }));
    vi.mock('@/hooks/use-geolocation', () => ({
      useGeolocation: vi.fn(() => ({
        status: 'idle',
        coords: null,
        fallbackCoords: null,
        fallbackMessage: null,
        requestLocation: vi.fn(),
      })),
    }));
    ```
  - [x] Tests to write:
    - `[P0]` renders `data-testid="near-me-button"` element
    - `[P0]` button is enabled when status is 'idle'
    - `[P0]` button is disabled when status is 'loading'
    - `[P0]` clicking button calls `requestLocation`
    - `[P0]` `onLocationSuccess` is called when status transitions to 'success' with coords
    - `[P0]` `onLocationFallback` is called when status transitions to 'denied' with fallbackCoords

- [x] Task 17: Update `property-grid.spec.tsx` for new `NoResultsState` behavior (AC: regression)
  - [x] **File**: `tests/unit/search/property-grid.spec.tsx` (MODIFY — exists from Story 3.5)
  - [x] Add mock for `NoResultsState`:
    ```ts
    vi.mock('@/components/property/no-results-state', () => ({
      NoResultsState: ({ filters }: { filters: object }) => (
        <div data-testid="no-results-state">no-results: {JSON.stringify(filters)}</div>
      ),
    }));
    ```
  - [x] Add test: when `properties=[]` and `isLoading=false`, `data-testid="no-results-state"` is rendered (replacing old `tGrid("empty")` text assertion)
  - [x] Update/remove any test that asserts on the old empty state text `tGrid("empty")`
  - [x] **KEEP ALL EXISTING TESTS** — they must continue passing

- [x] Task 18: CI verification (AC: all)
  - [x] `npm run typecheck` → 0 new errors
  - [x] `npm run lint` → 0 errors
  - [x] `npm run format:check` → pass
  - [x] `npm run build` → pass
  - [x] `npm test` → all existing tests pass + new unit tests pass

---

## Dev Notes

### What Already Exists (DO NOT Reinvent)

The following components and infrastructure are already implemented and must be reused or extended:

```
src/components/property/no-results-state.tsx   ← EXISTS — upgrade WhatsApp message to use filters
src/components/property/listing-removed-state.tsx ← EXISTS — add testids
src/components/ui/empty-state.tsx              ← EXISTS — reusable shell, DO NOT change
src/lib/constants/offices.ts                   ← EXISTS — buildWhatsAppUrl(), offices[]
src/app/[locale]/property/[slug]/page.tsx       ← EXISTS — hidden listing page is FULLY IMPLEMENTED
src/lib/db/queries/properties.ts               ← EXISTS — getSimilarProperties() query exists
src/store/map-store.ts                         ← EXISTS, FROZEN — DO NOT change MapStore
src/components/search/split-view-layout.tsx    ← EXISTS — extend only (do not break Story 3.7 changes)
src/components/property/property-grid.tsx      ← EXISTS — add NoResultsState render
src/lib/utils/whatsapp.ts                      ← NOT YET CREATED — may be needed eventually but in-line the message build for now
```

**CRITICAL: The hidden listing page (`/property/[slug]`) is already fully implemented.** Do NOT recreate it. The `property/[slug]/page.tsx` already:
- Checks `property.isVisible` (soft-delete)
- Calls `getSimilarProperties(property.areaSlug, slug)` for similar listings
- Renders "No longer available" with similar properties list and browse CTA
- Shows agent CTA (browse all)

Your task is only to add `data-testid` attributes and ensure the `ListingRemovedState` component has a proper testid.

### Critical File Paths (New Files to CREATE)

```
src/hooks/use-geolocation.ts                ← NEW: Browser Geolocation API hook
src/lib/constants/offices-geo.ts            ← NEW: Office lat/lng constants
src/components/search/near-me-button.tsx    ← NEW: NearMe Client Component
tests/unit/search/no-results-state.spec.tsx ← NEW: NoResultsState tests
tests/unit/search/use-geolocation.spec.tsx  ← NEW: useGeolocation hook tests
tests/unit/search/near-me-button.spec.tsx   ← NEW: NearMeButton component tests
```

### Critical Files to MODIFY

```
src/components/property/no-results-state.tsx          ← Add filters prop + dynamic WhatsApp message
src/components/property/listing-removed-state.tsx     ← Add data-testid
src/components/property/property-grid.tsx             ← Use NoResultsState, add filters prop
src/components/search/split-view-layout.tsx           ← Add flyToTarget state, NearMeButton, fallback msg
src/components/search/search-page-client.tsx          ← Pass filters prop to SplitViewLayout
src/components/map/map-view.tsx                       ← Add flyToTarget prop + flyTo effect
src/components/map/map-view-loader.tsx                ← Forward flyToTarget prop
src/app/[locale]/property/[slug]/page.tsx             ← Add data-testid attributes only
src/messages/en.json                                  ← Add NearMe namespace
src/messages/es.json                                  ← Add NearMe namespace
tests/unit/search/property-grid.spec.tsx              ← Update for NoResultsState change
```

### Files to NOT Touch (Frozen)

```
src/types/search.ts                  ← Frozen: Story 3.3
src/store/map-store.ts               ← Frozen: Story 3.2 (do not change MapStore interface)
src/hooks/use-search-filters.ts      ← Frozen: Story 3.3
src/app/actions/search-actions.ts    ← Frozen: Story 3.3/3.5
src/lib/map/config.ts                ← Frozen: Story 3.2
src/lib/map/geo-utils.ts             ← Frozen: Story 3.2
src/components/ui/empty-state.tsx    ← DO NOT CHANGE (reuse as-is)
```

### Architecture Classification

| Component | Type | Reason |
|-----------|------|--------|
| `use-geolocation.ts` | Client hook (`'use client'`) | Uses `navigator.geolocation`, `useState` |
| `NearMeButton` | Client Component (`'use client'`) | Architecture §8 explicit; uses hook, triggers geolocation |
| `offices-geo.ts` | Pure utility (no client/server) | Pure coordinate constants + math |
| `NoResultsState` | Client Component (`'use client'`) | Uses `useTranslations`, WhatsApp href |
| `ListingRemovedState` | Client Component (`'use client'`) | Uses `useTranslations` |
| `PropertyGrid` | Client Component (`'use client'`) | Pre-existing, uses `useTranslations` |
| `SplitViewLayout` | Client Component (`'use client'`) | Pre-existing |

### State Management for Near Me (AR10)

The geolocation state and `flyToTarget` are **transient UI state** — they should NOT be persisted to localStorage or URL params:
- Geolocation coordinates are ephemeral (user's current position)
- `flyToTarget` lives in React state inside `SplitViewLayout`
- After the map flies to location, `flyToTarget` can be reset to `null` (or kept for re-fly)
- The map bounds automatically update when the map flies, triggering `onBoundsChange` → properties re-fetch

### Near Me UX Details (from UX spec)

Journey 6 (ux-design-specification.md §1628):
- Button tap → browser permission prompt (if first time)
- **Success path**: Map flies to user location (0.8s animation), radius overlay "Properties within 15km", pins load within radius, count shows "8 properties near you"
- **Denied path**: Map centers on nearest office area (PZ or Dominical), non-blocking notification: "Location unavailable — showing properties near our PZ office", user can dismiss and search manually
- **Fly-to animation**: 800ms ease-in-out (UX spec §Animation, line 2363)
- **Zoom level on success**: ~13 (shows ~15km radius comfortably)
- **Zoom level on fallback**: ~11 (shows broader office area)

### WhatsApp No-Results Message Format (FR12)

The UX spec (line 1970) defines the no-results WhatsApp message template:
```
No-results: "Hi [Agent], I'm looking for [forwarded search criteria]."
```

The `buildSearchCriteriaSummary` function should serialize active filters as human-readable text. Examples:
- Filters `{ type: 'Casa', priceMax: 200000, bedrooms: 3 }` → `"Hi, I'm looking for: Type: Casa, Max price: $200,000, Bedrooms: 3+"`
- No filters → `"Hi, I'm looking for: any property"`

The WhatsApp URL is built via the existing `buildWhatsAppUrl(offices[0], message)` from `@/lib/constants/offices`.

### `'use client'` Rule (Critical from Story 3.6 learnings)

**`'use client'` MUST be the FIRST LINE** of any Client Component file, before all imports. This was a critical lesson from prior stories. If violated, Next.js silently breaks SSR boundaries.

### data-testid Convention (Critical — DO NOT break regressions)

All new `data-testid` values must be lowercase-kebab-case. Existing testids must NOT be renamed:
- `property-card`, `property-price`, `property-specs`, `zmt-badge` — frozen from Story 3.5
- `unit-toggle` — frozen from Story 3.7
- `property-grid` — frozen from Story 3.5
- `pagination-prev`, `pagination-next` — frozen from Story 3.5

New testids for this story:
- `no-results-state` — root of `NoResultsState`
- `no-results-whatsapp-cta` — WhatsApp anchor in `NoResultsState`
- `near-me-button` — root button of `NearMeButton`
- `near-me-fallback-message` — fallback notification banner
- `listing-unavailable-page` — root container of hidden listing page
- `similar-properties-list` — `<ul>` in hidden listing page

### Mock Pattern for Vitest (Critical from Story 3.1 learnings)

All spec files MUST declare `vi.mock(...)` BEFORE the component/hook import, with the comment `// imported AFTER mocks`:

```ts
// BAD — mock after import (doesn't work):
import { NearMeButton } from '@/components/search/near-me-button';
vi.mock('@/hooks/use-geolocation', ...);

// GOOD — mock before import:
vi.mock('@/hooks/use-geolocation', ...);
// imported AFTER mocks
import { NearMeButton } from '@/components/search/near-me-button';
```

### Vitest Environment (from Story 3.5 learnings)

`environmentMatchGlobs` in `vitest.config.mts`:
- `tests/unit/search/**/*.spec.tsx` → `jsdom` (component tests)
- `tests/unit/search/**/*.spec.ts` → `node` (pure utils)

All new test files for this story use `.spec.tsx` (components/hooks with React) → `jsdom` environment.

### Geolocation Error Code (R-007 Mitigation)

`GeolocationPositionError.PERMISSION_DENIED` = code `1`. Must be handled explicitly:

```ts
const isDenied = error.code === 1; // GeolocationPositionError.PERMISSION_DENIED
```

Do NOT use `error.code === GeolocationPositionError.PERMISSION_DENIED` (TypeScript may not expose the static property). Use the numeric literal `1`.

### MapView flyTo Integration

The `mapRef.current?.flyTo()` pattern already exists in `map-view.tsx` at line 196 (used for cluster expansion). Use the same API:

```ts
mapRef.current?.flyTo({
  center: [lng, lat],
  zoom: zoom ?? 13,
  duration: 800, // per UX spec §Animation
});
```

The `MapViewLoader` wraps `MapView` with `next/dynamic`. Check `map-view-loader.tsx` to see if it re-exports MapView props directly or uses `ComponentProps<typeof MapView>`. Update accordingly.

### NearMeButton Placement Decision

Two valid options:
1. **In `SearchFilterBar`**: Closer to UX spec wire (filter bar shows Near Me). Requires prop drilling callbacks from `SplitViewLayout`.
2. **In `SplitViewLayout` alongside filter bar**: Simpler (no prop drilling). Slightly off-spec from wire but functionally equivalent.

**Recommended approach**: Place `NearMeButton` in `SplitViewLayout` (next to `UnitToggle`) since `SplitViewLayout` already owns the `flyToTarget` state. This avoids prop-drilling callbacks through `SearchFilterBar` and its tests. Update the filter bar's Task 11 to use Option 2.

### Radius Overlay (FR16 — Scope Boundary)

The UX spec describes a "radius overlay" showing "Properties within 15km" (Journey 6). Implementing a proper circle overlay requires Mapbox GL JS circle layer (source + layer API). This is **in scope for the Near Me feature** per FR16 and AC #5.

Implementation approach:
- After `flyToTarget` is set (success case), add a Mapbox circle layer centered on user coords
- Use `useEffect` in `MapView` to add/remove the circle source and layer
- Circle radius: 15km = ~0.135 degrees latitude at Costa Rica latitude
- Remove overlay when `flyToTarget` is cleared or on next filter interaction
- **Simpler alternative** (acceptable for MVP): Show a `<Marker>` pin at user location with a pulsing blue dot instead of a full circle overlay. This is less work and still satisfies AC #5 ("map flies to user's location with a radius overlay showing nearby properties").

Choose the Marker approach for MVP to avoid the complexity of Mapbox source/layer management in tests.

### Test Design Coverage (Epic 3)

Test IDs from `_bmad-output/test-artifacts/test-design-epic-3.md` that this story must address:

| Test ID | Type | Coverage | AC |
|---------|------|----------|----|
| 3.8-E2E-001 | E2E | Near Me denied → fallback to RE/MAX office + message | AC #6, R-007 |
| 3.8-E2E-002 | E2E | Zero-results shows suggestions + WhatsApp CTA with correct URL | AC #1, #2 |
| 3.8-E2E-003 | E2E | Hidden listing URL shows "no longer available" + similar properties | AC #3 |
| 3.8-E2E-004 | E2E | Near Me granted → map flies to user coords + radius overlay | AC #5 |
| 3.8-E2E-005 | E2E | WhatsApp CTA in no-results forwards search criteria in message | AC #2 |

Unit tests (Tasks 14–16) provide early coverage for the R-007 risk. E2E tests (above) to be created in the ATDD phase.

### Key Architecture References

- Architecture §3 file structure: `near-me-button.tsx` → `src/components/search/`, `use-geolocation.ts` → `src/hooks/`
- Architecture §8 Client/Server table: `NearMeButton (Geolocation API)` → Client, `SimilarProperties` → Server
- Architecture §State Management (line 865): Unit preference → localStorage; no mention of geolocation state → use React state
- ADR-6 (line 1121): Soft delete for removed listings — already implemented in `property/[slug]/page.tsx`
- PRD §FR12 (line 514): Search criteria forwarded in WhatsApp no-results CTA
- PRD §FR14 (line 516): Hidden listing → "No longer available" + similar properties
- PRD §FR16 (line 518): Near Me button → Geolocation API → map fly-to; denied → nearest office
- UX spec Journey 6 (line 1628): Full Near Me flow with mermaid diagram
- UX spec Empty States table (line 2311): Empty search → WhatsApp; Listing removed → similar properties

### Previous Story Intelligence (Story 3.7)

Key patterns from Story 3.7 that carry forward:
1. **`'use client'` must be the first line** — before all imports
2. **`data-testid` must survive refactors** — never rename/remove existing testids
3. **Server/Client boundary**: `PropertyCard` is RSC — pass data via props not hooks
4. **Mock pattern for `next-intl`**: `vi.mock('next-intl', () => ({ useTranslations: vi.fn(() => (key: string) => key) }))`
5. **Vitest environment**: `.spec.tsx` in `tests/unit/search/` → jsdom; `.spec.ts` → node
6. **Review patches applied**: `try/catch` around localStorage, `Intl.NumberFormat` guards, UnitToggle mounted in SplitViewLayout

### Tailwind v4 CSS-First — No Hardcoded Values

- Use design tokens: `bg-background`, `border-border`, `text-muted-foreground`, `text-brand-navy`
- WhatsApp button: use `bg-brand-whatsapp` (token exists, see `design-system/page.tsx` line 68)
- Fallback notification: `bg-amber-50 border-amber-200 text-amber-800` (amber = warning, consistent with UX "non-blocking notification")
- No inline hex colors

---

## Dev Notes

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-8-no-results-hidden-listings-and-near-me.md`
- Unit tests: `tests/unit/search/no-results-state.spec.tsx`
- Unit tests: `tests/unit/search/use-geolocation.spec.tsx`
- Unit tests: `tests/unit/search/near-me-button.spec.tsx`
- E2E tests: `tests/e2e/no-results-hidden-listings-and-near-me.spec.ts`
- Updated spec: `tests/unit/search/property-grid.spec.tsx` (NoResultsState mock + 2 new it.skip tests added)

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No debug issues. ATDD tests were pre-existing in RED phase (all `it.skip`). Implementation followed test specs. NoResultsState required custom layout (not using EmptyState) to add data-testid on the WhatsApp anchor without modifying EmptyState component.

### Completion Notes List

- Task 1: Upgraded NoResultsState with filters prop, buildSearchCriteriaSummary() helper, dynamic WhatsApp href, data-testids on root and WhatsApp anchor
- Task 2: PropertyGrid now renders NoResultsState when empty (replaces tGrid("empty") text)
- Task 3: SplitViewLayout passes filters prop to PropertyGrid
- Task 4: SearchPageClient passes filters={filters} to SplitViewLayout
- Task 5: Added data-testids to property slug page (listing-unavailable-page, similar-properties-list, agent-cta) and ListingRemovedState wrapper
- Task 6: Created use-geolocation.ts hook with R-007 errorCallback compliance
- Task 7: Created offices-geo.ts with OFFICE_PZ_COORDS, OFFICE_DOMINICAL_COORDS, getNearestOfficeCoords()
- Task 8: Created near-me-button.tsx Client Component
- Task 9: Added flyToTarget prop + useEffect to MapView
- Task 10: Added flyToTarget/nearMeFallbackMessage state + NearMeButton + fallback banner to SplitViewLayout
- Task 11: NearMeButton placed in SplitViewLayout (Option 2, cleaner per story recommendation)
- Task 12: MapViewLoader confirmed transparent — no changes needed
- Task 13: Added NearMe namespace to en.json and es.json
- Tasks 14-17: Activated ATDD tests by removing it.skip; 20 new tests pass
- Task 18: typecheck 0 errors, lint 0 errors, format pass, build pass, 583 tests pass

### File List

- src/components/property/no-results-state.tsx
- src/components/property/listing-removed-state.tsx
- src/components/property/property-grid.tsx
- src/components/search/split-view-layout.tsx
- src/components/search/search-page-client.tsx
- src/components/map/map-view.tsx
- src/app/[locale]/property/[slug]/page.tsx
- src/messages/en.json
- src/messages/es.json
- src/hooks/use-geolocation.ts (NEW)
- src/lib/constants/offices-geo.ts (NEW)
- src/components/search/near-me-button.tsx (NEW)
- tests/unit/search/no-results-state.spec.tsx
- tests/unit/search/use-geolocation.spec.tsx
- tests/unit/search/near-me-button.spec.tsx
- tests/unit/search/property-grid.spec.tsx
