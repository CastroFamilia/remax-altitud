# Story 3.3: Search Filters & URL State

Status: ready-for-dev

## Story

As a **visitor**,
I want to filter properties by type, price, size, rooms, and location,
so that I only see properties that match my needs.

## Acceptance Criteria

1. **Given** the filter bar **When** displayed **Then** it shows filters for: Type (dropdown), Price Range (dual-handle slider with min/max inputs), Bedrooms (dropdown), Bathrooms (dropdown), Lot Size (range), Location (hierarchy dropdown) (FR3).

2. **Given** a property type of "Land/Lot" is selected **When** filters render **Then** bedrooms and bathrooms filters are hidden (context-sensitive) (FR3).

3. **Given** any filter is changed **When** it's a checkbox or dropdown **Then** results update instantly (UX-DR21).

4. **Given** the price slider **When** dragged **Then** results update with 300ms debounce to prevent request flooding (UX-DR21).

5. **Given** active filters **When** displayed above results **Then** each shows as a dismissible chip with × button; "Clear all" appears if 2+ active (UX-DR21).

6. **Given** each filter option **When** rendered **Then** it shows the matching result count: "Casa (12)" "Lote (8)" (UX-DR21).

7. **Given** the location hierarchy filter **When** selecting a Province **Then** it drills down to available Cantones, then Distritos (FR5).

8. **Given** all filter states **When** applied **Then** they are serialized into URL query params (shareable, bookmarkable) (UX-DR21).

9. **And** filter queries execute via Server Actions using PostGIS (AR23 / ADR-5).

10. **And** filter changes reflect within 500ms client-side (NFR5).

## Tasks / Subtasks

- [ ] Task 1: Define `SearchFilters` type and URL param schema (AC: #1, #2, #8)
  - [ ] Create `src/types/search.ts` — canonical `SearchFilters` type:
    ```ts
    export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'relevance';
    export interface SearchFilters {
      type?: string;          // URL param: "type"
      priceMin?: number;      // URL param: "price_min"
      priceMax?: number;      // URL param: "price_max"
      bedrooms?: number;      // URL param: "bedrooms"
      bathrooms?: number;     // URL param: "bathrooms"
      lotSizeMin?: number;    // URL param: "lot_min"
      lotSizeMax?: number;    // URL param: "lot_max"
      areaSlug?: string;      // URL param: "area" (Province/Cantón/Distrito slug)
      sort?: SortOption;      // URL param: "sort"
      view?: 'split' | 'map' | 'grid'; // URL param: "view" (already exists in 3.1)
    }
    ```
  - [ ] Architecture mandates: **Search filters = URL query params** (AR10 / §8 State Management table). Do NOT use Zustand or React state for filter values — they MUST live in the URL.
  - [ ] URL param names must be short, human-readable, and lowercase (per UX spec §9 SEO — "Clean, semantic URLs").

- [ ] Task 2: Create `use-search-filters` hook (AC: #3, #4, #8)
  - [ ] Create `src/hooks/use-search-filters.ts` (architecture mandates this hook at `src/hooks/use-search-params.ts` — use the name `use-search-filters.ts` to match the feature; the architecture hook name is just a guide)
  - [ ] This hook is the single source of truth for reading and writing search filter URL state
  - [ ] Use `useSearchParams()` from `next/navigation` to read current filter values
  - [ ] Use `useRouter()` from `next/navigation` with `router.replace(url, { scroll: false })` to update URL without page reload
  - [ ] Hook must return:
    ```ts
    interface UseSearchFiltersReturn {
      filters: SearchFilters;
      setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K] | undefined) => void;
      clearFilter: (key: keyof SearchFilters) => void;
      clearAll: () => void;
      activeFilterCount: number; // count excluding 'view' and 'sort'
    }
    ```
  - [ ] `setFilter` must be debounced at 300ms for numeric inputs (price slider, lot size) — use `useCallback` + `useRef` debounce pattern (no external debounce library needed)
  - [ ] For instant-update filters (type, bedrooms, bathrooms, area, sort), no debounce — update immediately
  - [ ] When updating URL: merge new filter value into existing params; do NOT wipe other params
  - [ ] `clearAll` removes all filter params except `view` (view mode is not a filter)
  - [ ] **Client Component only** — this hook uses `useSearchParams` which requires `'use client'`

- [ ] Task 3: Create `searchProperties` Server Action (AC: #9, #1, #2, #6, #10)
  - [ ] Create `src/app/actions/search-actions.ts` with `"use server"` directive at top
  - [ ] **DO NOT modify** `src/app/actions/map-actions.ts` (Story 3.2, frozen)
  - [ ] Export `async function searchProperties(filters: SearchFilters): Promise<SearchResult>`
  - [ ] `SearchResult` type:
    ```ts
    export interface PropertySearchItem {
      id: string; slug: string; titleEn: string; titleEs: string;
      priceUsd: number; bedrooms: number | null; bathrooms: number | null;
      lotSizeM2: number | null; constructionM2: number | null;
      zmtStatus: string; propertyType: string; areaSlug: string | null;
      images: { url: string; alt?: string }[];
      latitude: number | null; longitude: number | null;
    }
    export interface SearchResult {
      properties: PropertySearchItem[];
      total: number;
      facets: FilterFacets;
    }
    export interface FilterFacets {
      byType: { value: string; count: number }[];   // "Casa (12)"
      byBedrooms: { value: number; count: number }[];
      byBathrooms: { value: number; count: number }[];
    }
    ```
  - [ ] Implement query using architecture's `searchProperties` pattern from `architecture.md §6`:
    ```ts
    // Use Drizzle from: import { db } from "@/lib/db/client"
    // Schema: import { properties } from "@/lib/db/schema"
    // Use: and(), eq(), gte(), lte(), sql, desc(), asc(), isNotNull()
    ```
  - [ ] Filter conditions to implement (all optional, AND logic):
    - `type` → `eq(properties.propertyType, filters.type)`
    - `priceMin` → `gte(properties.priceUsd, filters.priceMin)`
    - `priceMax` → `lte(properties.priceUsd, filters.priceMax)`
    - `bedrooms` → `gte(properties.bedrooms, filters.bedrooms)` (minimum bedrooms)
    - `bathrooms` → `gte(properties.bathrooms, filters.bathrooms)` (minimum bathrooms)
    - `lotSizeMin` → `gte(properties.lotSizeM2, filters.lotSizeMin)`
    - `lotSizeMax` → `lte(properties.lotSizeM2, filters.lotSizeMax)`
    - `areaSlug` → `eq(properties.areaSlug, filters.areaSlug)`
    - always: `eq(properties.isVisible, true)`
  - [ ] Sort order: `price_asc` → `asc(properties.priceUsd)`, `price_desc` → `desc(properties.priceUsd)`, default → `desc(properties.createdAt)`
  - [ ] Pagination: `limit(50).offset(0)` for MVP (pagination Story 3.5)
  - [ ] **Facets query**: run a second aggregation query to compute counts per type and bedroom/bathroom value for the current filter set (excluding the dimension being faceted). Use Drizzle `sql` for `COUNT(*)` + `GROUP BY`.
  - [ ] Validate all numeric filter inputs (guard against NaN, Infinity, out-of-range values) before passing to Drizzle. Use `Number.isFinite()` checks — same defensive pattern as `sanitizeBounds` in `map-actions.ts`.

- [ ] Task 4: Replace `SearchFilterBar` stub with real filter controls (AC: #1, #2, #3, #4, #5, #6)
  - [ ] **File to modify**: `src/components/search/search-filter-bar.tsx` (Story 3.1 stub — this story owns it per Story 3.2 scope boundary)
  - [ ] Keep `'use client'` directive and `data-testid="search-filter-bar"` (existing tests in `search-filter-bar.spec.tsx` assert on these — do NOT break them)
  - [ ] Keep `sticky top-[var(--header-height)] z-10` positioning classes (existing test assertion)
  - [ ] Keep `h-12 md:h-14 bg-background border-b border-border` classes (existing test assertion)
  - [ ] Replace the `animate-pulse` loading placeholder div with real desktop filter controls
  - [ ] Keep the mobile compact bar (`data-testid="mobile-filters-button"`) as the tap target; it opens a `<Sheet>` (from `src/components/ui/sheet.tsx` — already in the codebase) containing the full filter set on mobile
  - [ ] Desktop filter bar layout (horizontal, visible `md:flex`):
    - Type dropdown → `<Select>` from `radix-ui` package (already installed: `"radix-ui": "^1.4.3"`)
    - Price Range → dual-handle slider + min/max inputs (see Task 5 for Slider implementation)
    - Bedrooms dropdown → `<Select>` from `radix-ui`
    - Bathrooms dropdown → `<Select>` from `radix-ui`
    - Lot Size range → dual-handle slider (or min/max text inputs for MVP simplicity)
    - Location → hierarchy dropdown (Province → Cantón — Distrito is out of scope for MVP since areaSlug covers it)
    - Sort dropdown → "Newest," "Price ↑," "Price ↓," "Relevance"
  - [ ] All filter controls use `use-search-filters` hook to read/write URL state
  - [ ] Context-sensitive: when `type === 'land'` or `type === 'lot'` or type value matching land property types from DB, hide bedrooms and bathrooms controls (AC #2)
  - [ ] Property types from DB schema: `propertyType` is `text` — real values are from RE/MAX CCA API. Use these known types: `"Casa"`, `"Apartamento"`, `"Lote"`, `"Terreno"`, `"Comercial"`, `"Finca"`. For land-type detection: `['Lote', 'Terreno', 'Finca'].includes(filters.type)`
  - [ ] Active filter chips row: render below the control row; only visible when `activeFilterCount > 0`

- [ ] Task 5: Implement dual-handle price slider (AC: #4)
  - [ ] `@radix-ui/react-slider` is installed (as a transitive dependency of `radix-ui`). Confirmed in `node_modules/@radix-ui/react-slider`. Use it:
    ```ts
    import * as Slider from "@radix-ui/react-slider";
    // Do NOT use "radix-ui" named export — the unified package does not re-export subpackages in its dist
    ```
  - [ ] Create `src/components/search/price-range-slider.tsx` with `'use client'` directive
  - [ ] Props:
    ```ts
    interface PriceRangeSliderProps {
      min?: number;       // default 0
      max?: number;       // default 5_000_000
      step?: number;      // default 10_000
      value: [number, number];
      onChange: (value: [number, number]) => void; // called with debounce from parent
    }
    ```
  - [ ] Render Radix Slider with 2 thumbs + two number inputs (min/max) that sync with slider
  - [ ] Format displayed prices as `$250K` / `$1.2M` — reuse `formatPriceAbbrev` from `src/lib/map/geo-utils.ts` (Story 3.2, already exists — do NOT reimplement)
  - [ ] Input fields: formatted display; on blur, parse and call `onChange`
  - [ ] Touch targets: slider thumbs must be ≥ 44px (UX-DR7). Use `w-[44px] h-[44px]` on the thumb element.
  - [ ] `data-testid="price-range-slider"` on the root div

- [ ] Task 6: Implement active filter chips (AC: #5)
  - [ ] Create `src/components/search/filter-chips.tsx` with `'use client'` directive
  - [ ] Architecture file structure: `src/components/search/filter-chips.tsx` (matches architecture §3 directory listing)
  - [ ] Props:
    ```ts
    interface FilterChipsProps {
      filters: SearchFilters;
      onClearFilter: (key: keyof SearchFilters) => void;
      onClearAll: () => void;
    }
    ```
  - [ ] Render one chip per active filter (exclude `view` and `sort` from chips)
  - [ ] Chip format: `"Type: Casa ×"`, `"Price: $100K–$500K ×"`, `"Beds: 3+ ×"`, `"Area: Pérez Zeledón ×"`
  - [ ] "Clear all" link appears when `activeFilterCount >= 2`
  - [ ] Chip color: `bg-brand-blue text-white` — use the `--brand-blue` design token (#0043FF) which maps to the Tailwind utility `bg-brand-blue` in `src/styles/globals.css`. The UX spec calls it `--color-blue-bright` but the actual CSS variable registered in `@theme inline` is `--color-brand-blue: var(--brand-blue)` where `--brand-blue: #0043FF`. Use `bg-brand-blue` in className. Do NOT use hex values (Tailwind v4 CSS-first rule).
  - [ ] `data-testid="filter-chips"` on the chips container
  - [ ] `data-testid="clear-all-filters"` on the "Clear all" button

- [ ] Task 7: Wire filters into `SearchPageClient` (AC: #3, #4, #9, #10)
  - [ ] **File to modify**: `src/components/search/search-page-client.tsx`
  - [ ] Import and use `useSearchFilters` hook to extract current `SearchFilters` from URL
  - [ ] Add effect: when `filters` change, call `searchProperties(filters)` Server Action
  - [ ] Use separate state for `filterProperties: PropertySearchItem[]` (from `search-actions.ts`) vs `mapProperties: MapProperty[]` (from `map-actions.ts` — Story 3.2). The map needs a specific subset shape; search results need a richer shape.
  - [ ] Pass `filterProperties` and `facets` to `SearchFilterBar` and `SplitViewLayout` as props
  - [ ] Pass `mapProperties` to `SplitViewLayout` for the map panel (unchanged from Story 3.2)
  - [ ] **Debounce coordination**: the `use-search-filters` hook handles debounce at URL write time; `SearchPageClient` just reacts to URL changes via `useSearchParams`. The effect dependency is `filters` (stable reference from hook).
  - [ ] Race condition: use same `requestSeqRef` monotonic counter pattern from Story 3.2 to prevent stale filter responses overwriting newer ones
  - [ ] On filter change: show `SearchResultsSkeleton` immediately (optimistic UI) while fetching — pass `isLoading` boolean to grid panel
  - [ ] Error handling: `.catch(console.error)` — same pattern as Story 3.2

- [ ] Task 8: Update `SplitViewLayout` to accept filter data (AC: #1, #5, #6)
  - [ ] **File to modify**: `src/components/search/split-view-layout.tsx`
  - [ ] Add optional props: `filterProperties?: PropertySearchItem[]`, `facets?: FilterFacets`, `isLoading?: boolean`
  - [ ] Pass `facets` down to `SearchFilterBar` for filter count display ("Casa (12)")
  - [ ] Pass `isLoading` to grid panel (when true, show `SearchResultsSkeleton`; when false, show grid — Story 3.5 replaces skeleton with real cards)
  - [ ] `SearchFilterBar` already receives facets and renders counts — pass `facets` as a prop to `SearchFilterBar`
  - [ ] Do NOT change the map panel — it continues receiving `mapProperties` and `onBoundsChange` (Story 3.2 unchanged)
  - [ ] Do NOT break `data-testid="map-panel"`, `data-testid="grid-panel"`, `data-testid="pull-up-handle"` (existing tests)

- [ ] Task 9: Location hierarchy for area filter (AC: #7)
  - [ ] The architecture mentions `src/lib/constants/areas.ts` (does NOT exist yet — create it)
  - [ ] For MVP, the location filter uses the flat `areaSlug` field from the `properties` table (column `area_slug: text`). Full Province → Cantón → Distrito drill-down requires a separate areas table (Epic 6, Story 6.1) — **defer full hierarchy to Epic 6**.
  - [ ] MVP implementation: fetch distinct `areaSlug` values from the DB and render as a flat dropdown. Create a helper in `search-actions.ts`:
    ```ts
    export async function getAvailableAreas(): Promise<{ slug: string; label: string }[]>
    // Query: SELECT DISTINCT area_slug FROM properties WHERE is_visible=true AND area_slug IS NOT NULL
    ```
  - [ ] Display format: capitalize the area slug for the label ("perez-zeledon" → "Pérez Zeledón") — use a mapping constant or title-case the slug with a simple utility
  - [ ] `data-testid="area-filter"` on the location dropdown

- [ ] Task 10: Add i18n keys (AC: #1, #5)
  - [ ] In `src/messages/en.json`, add under `"SearchPage"` key:
    ```json
    "filters": {
      "type": "Type",
      "typeAll": "All Types",
      "price": "Price",
      "pricePlaceholder": "$0 – Any",
      "bedrooms": "Beds",
      "bedroomsAny": "Any",
      "bathrooms": "Baths",
      "bathroomsAny": "Any",
      "lotSize": "Lot Size",
      "location": "Location",
      "locationAll": "All Areas",
      "sort": "Sort",
      "sortNewest": "Newest",
      "sortPriceAsc": "Price ↑",
      "sortPriceDesc": "Price ↓",
      "sortRelevance": "Relevance",
      "clearAll": "Clear all",
      "activeChip": "{label}: {value}",
      "dismiss": "Remove {label} filter",
      "propertyTypes": {
        "Casa": "House",
        "Apartamento": "Apartment",
        "Lote": "Lot",
        "Terreno": "Land",
        "Comercial": "Commercial",
        "Finca": "Farm"
      }
    }
    ```
  - [ ] Add equivalent Spanish keys to `src/messages/es.json` — types in Spanish: Casa, Apartamento, Lote, Terreno, Comercial, Finca (same; Costa Rica uses these terms in Spanish too)

- [ ] Task 11: Tests (AC: all)
  - [ ] **Update** `tests/unit/search/search-filter-bar.spec.tsx`:
    - **MUST update** the test at line 104-115 that asserts `aria-label="Filter bar loading"` and `animate-pulse` — these come from the stub placeholder that this story removes. Replace this test assertion with one checking that the Type dropdown control renders (`data-testid="type-filter"` or by role).
    - **Keep** all existing assertions that are still valid: `data-testid="search-filter-bar"`, `sticky`, `top-[var(--header-height)]`, `z-10`, `h-12`, `h-14`, `bg-background`, `border-b`, `border-border`, `data-testid="mobile-filters-button"`, `'use client'` file check.
    - Add new tests: Type dropdown renders; selecting "Lote" hides bedrooms/bathrooms controls (AC #2); active filter chips appear when filter set; "Clear all" appears when 2+ active.
  - [ ] Create `tests/unit/search/use-search-filters.spec.tsx` (**NOTE: `.tsx` extension, NOT `.ts`** — hooks that use `useSearchParams`/`useRouter` need React context, so jsdom env is required per vitest `environmentMatchGlobs` in `tests/unit/search/**/*.spec.tsx`)
    - Use `renderHook` from `@testing-library/react` (already installed)
    - Mock `next/navigation`: `useSearchParams`, `useRouter`
    - Test: `filters` parsed from URL params correctly (type, priceMin, priceMax, bedrooms)
    - Test: `setFilter('type', 'Casa')` calls `router.replace` with correct URL
    - Test: `clearAll()` removes all filter params except `view`
    - Test: `activeFilterCount` correctly counts filters (excludes `view`)
  - [ ] Create `tests/unit/search/filter-chips.spec.tsx` (Vitest + jsdom)
    - Mock `next/navigation`, `next-intl`
    - Test: renders one chip per active filter
    - Test: "Clear all" visible when 2+ active filters, hidden when 1
    - Test: clicking × on a chip calls `onClearFilter` with correct key
    - Test: `data-testid="filter-chips"` present
  - [ ] Create `tests/unit/search/price-range-slider.spec.tsx` (Vitest + jsdom)
    - Mock Radix Slider (vi.mock('@radix-ui/react-slider') or mock via `radix-ui`)
    - Test: renders with `data-testid="price-range-slider"`
    - Test: displays formatted price values ($250K, $1.2M format)
    - Test: calls onChange when value changes

- [ ] Task 12: CI verification (AC: all)
  - [ ] `npm run typecheck` → 0 new errors
  - [ ] `npm run lint` → 0 errors
  - [ ] `npm run format:check` → pass
  - [ ] `npm run build` → pass
  - [ ] `npm test` → all existing tests pass + new filter tests pass

## Dev Notes

### Critical Architecture Decisions — DO NOT VIOLATE

**Search filters MUST live in URL query params — NOT Zustand, NOT React state (AR10):**

The architecture `§8 State Management` table is explicit:
- `Search filters` → URL query params (shareable)
- `Map viewport` → Zustand (non-shareable, per-session)

Filter state in URL means: browser back/forward work, links are shareable, bookmarkable. This is a core product requirement (UX-DR21). Never lift filter state into Zustand or component state.

**Server Action for search queries (ADR-5):**

Architecture ADR-5: "Server Actions over REST API for Search." The search query runs server-side (zero client-side DB connection), benefits from Next.js built-in caching, type-safe end-to-end. The search action file location is `src/app/actions/search-actions.ts` (parallel to existing `map-actions.ts`).

**Existing `map-actions.ts` is FROZEN (Story 3.2):**

Do NOT modify `src/app/actions/map-actions.ts`. The map action fetches properties for the map (lat/lon required, max 500, optimized for map rendering). The search action fetches properties for the grid (richer data, facets, pagination-ready). These are separate concerns.

**`@radix-ui/react-slider` is installed — use it directly:**

`"radix-ui": "^1.4.3"` is in `package.json`, and its dependency `@radix-ui/react-slider` is present in `node_modules/@radix-ui/react-slider`. Import Slider as:
```ts
import * as Slider from "@radix-ui/react-slider";
```
Do NOT import from `"radix-ui"` unified package directly (its `dist/` directory does not re-export subpackages). The Sheet component is already in `src/components/ui/sheet.tsx` — use it for mobile filter panel. Do NOT install additional slider libraries.

**No `nuqs` or other URL sync library:**

The codebase does not use `nuqs`. Use `useSearchParams()` + `useRouter()` from `next/navigation` directly. The `use-search-filters` hook abstracts the read/write pattern. Keep it simple.

**`formatPriceAbbrev` already exists — do NOT reimplement:**

`src/lib/map/geo-utils.ts` (Story 3.2) exports `formatPriceAbbrev(price: number): string`. Import from `@/lib/map/geo-utils`. This prevents wheel-reinvention.

### Component File Map

**New files to create:**
```
src/types/search.ts                          ← SearchFilters, SearchResult, FilterFacets types
src/hooks/use-search-filters.ts              ← URL filter state hook (read/write)

src/components/search/
  price-range-slider.tsx                     ← Dual-handle Radix Slider for price
  filter-chips.tsx                           ← Active filter chips row (architecture §3)

src/app/actions/
  search-actions.ts                          ← searchProperties() + getAvailableAreas() Server Actions
```

**Files to modify (Story 3.3 owns these):**
```
src/components/search/search-filter-bar.tsx  ← Replace stub with real filter controls
src/components/search/search-page-client.tsx ← Wire filters → searchProperties() → grid
src/components/search/split-view-layout.tsx  ← Add filterProperties, facets, isLoading props
src/messages/en.json                         ← Add SearchPage.filters i18n keys
src/messages/es.json                         ← Add Spanish equivalents
```

**Files to NOT touch (frozen from previous stories):**
```
src/app/actions/map-actions.ts               ← Story 3.2, frozen
src/store/map-store.ts                       ← Story 3.2, frozen
src/lib/map/config.ts                        ← Story 3.2, frozen
src/lib/map/geo-utils.ts                     ← Story 3.2, frozen (but import formatPriceAbbrev!)
src/components/map/map-view.tsx              ← Story 3.2, frozen
src/components/map/map-view-loader.tsx       ← Story 3.2, frozen
src/app/[locale]/search/page.tsx             ← Story 3.1, correct as-is
src/lib/db/schema/properties.ts             ← Epic 2, frozen
src/lib/db/queries/properties.ts            ← Epic 2, frozen (use for reference only)
```

### URL State Schema

Filter URL params (all optional):
```
/en/search?type=Casa&price_min=100000&price_max=500000&bedrooms=3&bathrooms=2&lot_min=500&lot_max=5000&area=perez-zeledon&sort=price_asc&view=split
```

**Parsing rules:**
- `type`: raw string, validated against known property type list
- `price_min`, `price_max`: `parseInt` — guard with `Number.isFinite()`
- `bedrooms`, `bathrooms`: `parseInt` — minimum value (≥ N)
- `lot_min`, `lot_max`: `parseFloat` — m² values
- `area`: raw string (areaSlug)
- `sort`: one of `newest | price_asc | price_desc | relevance`
- `view`: one of `split | map | grid` (existing, unchanged from Story 3.1)

### DB Schema — Relevant Columns

From `src/lib/db/schema/properties.ts` (do NOT modify):
```
properties.propertyType  → text, filterable (type param)
properties.priceUsd      → integer, filterable (price_min/price_max)
properties.bedrooms      → integer | null, filterable (bedrooms param)
properties.bathrooms     → integer | null, filterable (bathrooms param)
properties.lotSizeM2     → doublePrecision | null, filterable (lot_min/lot_max)
properties.areaSlug      → text | null, filterable (area param)
properties.isVisible     → boolean, always filter: isVisible=true
properties.createdAt     → timestamp, used for "Newest" sort
```

**Indexes already on the schema:**
```
idx_properties_search → (isVisible, propertyType, priceUsd, areaSlug) WHERE isVisible=true
idx_properties_geo    → GiST on geo column (used by Story 3.2)
idx_properties_tags   → GIN on lifestyleTags (used by Story 3.4)
```
The composite `idx_properties_search` index covers the most common filter combinations. Queries with `type`, `price`, and `area` filters will benefit.

### Filter UI Patterns — UX Requirements

From UX spec `§Search & Filter Patterns`:
- **Instant update**: checkboxes, dropdowns — no debounce, immediate URL write
- **Debounced 300ms**: price slider, lot size range — prevent request flooding (UX-DR21)
- **No "Apply" button**: filters apply immediately as user interacts
- **Active filter chips**: shown above results when any filter active; each has × dismiss
- **"Clear all"**: appears when 2+ active filters (NOT when only 1)
- **Filter counts**: `"Casa (12)"` — facets returned from `searchProperties()` action
- **Context-sensitive**: Land types (`Lote`, `Terreno`, `Finca`) hide bedrooms and bathrooms

From UX spec `§Component Responsive Behavior`:
- Desktop filter bar: horizontal row, all controls visible
- Mobile: `"Filters" button → slide-out Sheet` (radix Sheet, already in `src/components/ui/sheet.tsx`)

From UX spec `§Filter Chips`:
- Active filter chips use `--color-blue-bright` (#0043FF) — design token in `src/styles/globals.css`
- Chip min-height ≥ 44px (UX-DR7 touch targets)

From UX spec `§URL state`:
- `All filters + sort + map bounds encoded in URL query params. Shareable, bookmarkable.`
- Map bounds are NOT in the filter URL (they're in Zustand per AR10) — only filter params

### Architecture Compliance Checklist

- [ ] `SearchFilters` type is the canonical definition in `src/types/search.ts` — import from there, never redefine
- [ ] `search-actions.ts` has `"use server"` at top — Server Action
- [ ] `use-search-filters.ts` is a Client-only hook (uses `useSearchParams`)
- [ ] `SearchFilterBar` remains `'use client'` with existing sticky positioning
- [ ] `price-range-slider.tsx` is `'use client'` — interactive DOM
- [ ] `filter-chips.tsx` is `'use client'` — interactive DOM
- [ ] Filter values NEVER stored in Zustand (AR10 violation prevention)
- [ ] `formatPriceAbbrev` imported from `@/lib/map/geo-utils` — NOT reimplemented
- [ ] Numeric filter inputs sanitized with `Number.isFinite()` before DB query

### Test Patterns — Mandatory (from Stories 3.1 and 3.2 Learnings)

1. **`vi.mock` hoisting**: Declare all mocks BEFORE component imports. Comment `// imported AFTER mocks`. This is the established pattern in ALL 6 existing spec files.
2. **jsdom env**: Files in `tests/unit/search/**/*.spec.tsx` automatically get jsdom (vitest.config.ts `environmentMatchGlobs`). Do NOT change the glob.
3. **`.spec.ts` (no x)**: Pure TypeScript tests (hooks, utilities) use `.spec.ts` (node env). React component tests use `.spec.tsx` (jsdom env).
4. **Mock `next/navigation`**: Any component/hook using `useSearchParams` or `useRouter` MUST mock `next/navigation`.
5. **Mock `next-intl`**: Any component using `useTranslations` MUST mock `next-intl`.
6. **Existing test assertions that MUST be preserved** in `search-filter-bar.spec.tsx`:
   - `data-testid="search-filter-bar"` — preserve on root div
   - `className` contains `sticky`, `top-[var(--header-height)]`, `z-10`, `h-12`, `h-14`, `bg-background`, `border-b`, `border-border` — keep these CSS classes on the root
   - `data-testid="mobile-filters-button"` — preserve on mobile button
   - File starts with `'use client'` — preserve
   - **Test at line 104-115** (`animate-pulse` / `aria-label="Filter bar loading"`) — **MUST be updated** since the stub placeholder is removed by this story. Replace it with a test asserting real filter controls exist (e.g., the type dropdown).
7. **Tailwind v4 CSS-first**: Use design tokens from `globals.css`. The correct token for the UX-spec's `--color-blue-bright` is `bg-brand-blue` (maps to `--brand-blue: #0043FF` in `:root`). Do NOT use hardcoded hex values.

### Data Flow Diagram (Story 3.3)

```
[page.tsx (Server RSC)]
  └─► [SearchPageClient (Client, 'use client')]
        ├─► useSearchFilters() ← reads URL params via useSearchParams()
        │     └─► filters: SearchFilters (from URL)
        │
        ├─► searchProperties(filters) [Server Action, search-actions.ts]
        │     └─► PostgreSQL + idx_properties_search
        │           └─► Returns { properties[], total, facets }
        │
        ├─► getPropertiesForMap() [Server Action, map-actions.ts — Story 3.2 unchanged]
        │     └─► Returns MapProperty[] for map pins
        │
        ├─► [SearchFilterBar] ← receives filters, facets, setFilter, clearAll
        │     ├─► Type dropdown, Price slider, Beds/Baths dropdowns, Lot range, Area
        │     ├─► [FilterChips] ← active filter chips row
        │     └─► Mobile: "Filters" button → <Sheet> with all controls
        │
        └─► [SplitViewLayout]
              ├─► [MapViewLoader → MapView] ← mapProperties (unchanged)
              └─► [Grid panel] ← filterProperties + isLoading + facets
                    └─► [SearchResultsSkeleton] (Story 3.5 replaces with real cards)
```

### Story Scope Boundaries

**This story DOES implement:**
- `SearchFilters` type definition
- `use-search-filters` hook (URL read/write)
- `searchProperties` Server Action with PostGIS query and facets
- `SearchFilterBar` replacement with real filter controls (Type, Price, Beds, Baths, Lot, Location, Sort)
- `PriceRangeSlider` component using Radix Slider
- `FilterChips` component with × dismiss and "Clear all"
- Context-sensitive filter hiding for land types
- URL state encoding/decoding of all filters
- Facet counts on filter options ("Casa (12)")
- Mobile filter Sheet integration
- Unit tests for all new components and hooks
- i18n keys for all filter labels

**This story does NOT implement:**
- Full Province → Cantón → Distrito location hierarchy (Epic 6, Story 6.1 — use flat areaSlug for MVP)
- Lifestyle tag filters (Story 3.4 — stub in filter bar is fine)
- Real property cards in grid view (Story 3.5 — `SearchResultsSkeleton` stays)
- Pagination (Story 3.5)
- "Near Me" button (Story 3.8)
- Sort persisting to server-side rendering (it's URL state, good enough for MVP)
- Playwright E2E tests (ATDD phase, Story 3.3 step 2)
- Unit conversion on filter inputs (Story 3.7)

### Previous Story Intelligence

**From Story 3.2 (immediately preceding):**
1. The `SearchFilterBar` is currently a stub (`src/components/search/search-filter-bar.tsx`) — Story 3.2 explicitly called it out as "Story 3.3 owns this." The stub has tests in `search-filter-bar.spec.tsx` that assert on CSS classes and testids — preserve those testids and CSS contracts.

2. `search-page-client.tsx` already uses `useSearchParams()` for view mode — the filter hook pattern is a natural extension of the existing param reading.

3. `SplitViewLayout` already receives `properties`, `locale`, `propertyCount`, `onBoundsChange` — adding `filterProperties`, `facets`, `isLoading` is additive (no breaking changes to existing props).

4. The `requestSeqRef` monotonic counter pattern in `search-page-client.tsx` must be extended for the new filter fetch (separate sequence counter from the bounds-change counter — or reuse same counter if only one fetch at a time is needed).

5. `vi.mock('next/navigation')` mock in `search-filter-bar.spec.tsx` already mocks `useSearchParams` — the new filter controls will need the same mock to be complete.

**From Story 3.1 learnings:**
- `esbuild: { jsx: "automatic" }` in `vitest.config.ts` — no additional Vite plugins needed
- Tailwind v4 CSS-first — use design tokens from `globals.css`, not hex values
- Responsive modifiers in tests: assert on `"md:flex"` not `"flex"` for desktop-only elements

### Git Intelligence

Recent commits:
1. `Fix: Map Image Placeholder & Dev Environment Hardening (#124)` — Story 3.2 patch
2. `story-3.2-interactive-map-with-property-pins - fixes #86 (#123)` — Story 3.2 main commit
3. `chore(phase0): refresh dependency-graph timestamp` — no code changes

**Key patterns established in Story 3.2 to follow:**
- Server Actions in `src/app/actions/` with `"use server"` directive
- Input sanitization with `Number.isFinite()` (see `sanitizeBounds` in `map-actions.ts`)
- Race condition prevention with `requestSeqRef` + sequence number (see `search-page-client.tsx`)
- Error handling: `.catch(console.error)` pattern on all Server Action calls

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: Search Filters & URL State]
- [Source: _bmad-output/planning-artifacts/epics.md#FR3 — Filter by type, price, bedrooms, bathrooms, lot size, location]
- [Source: _bmad-output/planning-artifacts/epics.md#FR5 — Location hierarchy Province → Cantón → Distrito]
- [Source: _bmad-output/planning-artifacts/epics.md#NFR5 — Filter changes ≤500ms]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5: Server Actions over REST API for Search]
- [Source: _bmad-output/planning-artifacts/architecture.md#§6 Search Query API (Server Action) — searchProperties() pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#§8 State Management — Search filters = URL query params (AR10)]
- [Source: _bmad-output/planning-artifacts/architecture.md#§8 Client vs. Server Component Split — SearchFilters is 'use client']
- [Source: _bmad-output/planning-artifacts/architecture.md#§3 Directory Architecture — search-filters.tsx, filter-chips.tsx, use-search-params.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md#§3 src/types/search.ts — Search filter/result types]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§Search & Filter Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§Responsive Design — filter bar desktop vs mobile]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR21 — URL state, chips, debounce]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR7 — Touch targets ≥44px]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§Color tokens — --color-blue-bright for active filters]
- [Source: _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md#Story Scope Boundaries — SearchFilterBar stub is Story 3.3]
- [Source: _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md#Dev Notes — formatPriceAbbrev in geo-utils.ts]
- [Source: src/lib/db/schema/properties.ts — propertyType, priceUsd, bedrooms, bathrooms, lotSizeM2, areaSlug, isVisible]
- [Source: src/app/actions/map-actions.ts — sanitizeBounds pattern, Server Action structure]
- [Source: src/components/search/search-page-client.tsx — requestSeqRef pattern, useSearchParams usage]
- [Source: src/components/ui/sheet.tsx — mobile filter Sheet component]
- [Source: package.json — radix-ui@1.4.3 (includes Slider), zustand@5, formatPriceAbbrev reuse]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-3-search-filters-and-url-state.md`
- Unit (Hook): `tests/unit/search/use-search-filters.spec.tsx`
- Unit (Component): `tests/unit/search/filter-chips.spec.tsx`
- Unit (Component): `tests/unit/search/price-range-slider.spec.tsx`
- Unit (Server Action): `tests/unit/search/search-actions.spec.ts`
- Updated: `tests/unit/search/search-filter-bar.spec.tsx`
- E2E: `tests/e2e/search-filters.spec.ts`

### File List
