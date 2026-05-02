# Story 3.5: Property Cards & Grid View

Status: done

## Story

As a **visitor**,
I want to browse properties in a clean card grid with key details visible at a glance,
so that I can quickly scan and compare listings.

## Acceptance Criteria

1. **Given** the PropertyCard component **When** rendered **Then** it displays: hero image with region badge (Mountain/Beach), price (Montserrat 800, `--color-accent`), title, 1-2 line truncated description, specs row (beds · baths · lot · built area), ZMT badge, and ♡ save + share icons (UX-DR10).

2. **Given** desktop grid (≥1024px) **When** displaying results **Then** cards render in 3-column layout (min-width 350px per card).

3. **Given** tablet (768-1023px) **When** displaying results **Then** cards render in 2-column layout.

4. **Given** mobile (<768px) in grid view **When** displaying results **Then** cards render in single-column full-width layout.

5. **Given** the sort dropdown **When** selecting "Newest," "Price ↑," "Price ↓," or "Relevance" **Then** results reorder accordingly; sort persists in URL params (FR6).

6. **Given** many results **When** scrolling **Then** results paginate or progressively load with ≤ 20 cards per page (FR7).

7. **Given** a PropertyCard **When** hovered on desktop **Then** a 200ms lift animation plays with shadow-lg (UX-DR22).

8. **And** cards use `aspect-ratio: 3/2` on images to prevent CLS (NFR2).

9. **And** card images use `next/image` with `sizes` prop and WebP (UX-DR27).

## Tasks / Subtasks

- [x] Task 1: Create `PropertyCard` component (AC: #1, #2, #3, #4, #7, #8, #9)
  - [x] Create `src/components/property/property-card.tsx` — **does NOT exist yet** (skeleton is at `property-card-skeleton.tsx`)
  - [x] Architecture classification: **Server Component** — no `'use client'` unless save/share button interaction requires it (per architecture §8: "PropertyCard (static data)" → Server Component). The save button (♡) IS interactive — use a wrapper pattern: outer card is RSC, inner `<SaveButton>` is a Client Component
  - [x] Props interface:
    ```ts
    interface PropertyCardProps {
      property: PropertySearchItem; // from @/types/search — already defined Story 3.3
      locale: string;               // for localized title (titleEn / titleEs)
      variant?: 'default' | 'compact' | 'horizontal'; // default: 'default'
    }
    ```
  - [x] **Card is a link**: wrap entire card in `<Link href={`/${locale}/property/${property.slug}`}>` from `next/link`. Save + Share buttons use `e.stopPropagation()` to prevent navigation
  - [x] **Hero image**: use `next/image` with `sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"` and `aspect-ratio: 3/2` enforced via `className="aspect-[3/2] w-full object-cover"`. Use `property.images[0]?.url` as `src`; fallback to `/property-placeholder.svg` (already in `public/` from Fix PR #124)
  - [x] **Region badge** (top-left overlay): determine region from `property.areaSlug` — map known beach areas to "Beach" and mountain areas to "Mountain". Create a pure helper `getRegionFromAreaSlug(areaSlug: string | null): 'Mountain' | 'Beach' | null`. Known beach slugs: `['dominical', 'uvita', 'ojochal', 'quepos', 'manuel-antonio', 'jaco', 'tamarindo', 'nosara', 'samara', 'santa-teresa', 'playa-hermosa']`. Mountain slugs: `['perez-zeledon']`. Use `bg-brand-mountain` and `bg-brand-beach` Tailwind tokens for badge colors
  - [x] **Price**: Montserrat 800 via `font-bold` (Montserrat is configured as the heading font). Use `text-[--color-accent]` for color (maps to `--brand-burgundy: #660000`). Format with `formatPriceAbbrev` from `src/lib/map/geo-utils.ts` — **do NOT reinvent this function**
  - [x] **Title**: localized — `property.locale === 'es' ? property.titleEs : property.titleEn`. 2-line clamp: `line-clamp-2`
  - [x] **Description**: NOT in `PropertySearchItem` type — omit description from the card grid for now (the type doesn't expose it). Note: for Phase 2 listing detail, description fields exist in the DB but are not returned by `searchProperties` Server Action. Do NOT add description to `PropertySearchItem` in this story.
  - [x] **Specs row**: `beds · baths · lot · built area`. Beds: `${property.bedrooms ?? '-'} bed`. Baths: `${property.bathrooms ?? '-'} bath`. Lot: `${property.lotSizeM2 ? formatArea(property.lotSizeM2) : '-'}`. Built: `${property.constructionM2 ? formatArea(property.constructionM2) : '-'}`. For land/lot types (`['Lote', 'Terreno', 'Finca'].includes(property.propertyType)`), omit beds/baths and show only lot size. `formatArea` → simple inline util: `value >= 10000 ? `${(value/10000).toFixed(1)} ha` : `${Math.round(value)} m²``
  - [x] **ZMT badge**: use `property.zmtStatus` values: `titled` → "✓ Titled Property" (green), `concession` → "Concession" (amber), `zmt_restricted` → "ZMT Restricted" (red). Use `bg-green-100 text-green-800`, `bg-amber-100 text-amber-800`, `bg-red-100 text-red-800` — NO hardcoded hex colors (Tailwind v4 rule). ZMT badge must show icon + label (not color alone, per UX-DR accessibility spec)
  - [x] **Save button (♡)**: this is interactive — import `<SaveButton>` (Task 4 below) as a Client Component child
  - [x] **Share button**: interactive (uses browser API) — must be a separate Client Component `<ShareButton>` (Task 4b). Import it like `<SaveButton>`. Do NOT inline `onClick` in the RSC `PropertyCard`
  - [x] **Hover animation**: `transition-all duration-200 ease-out hover:translate-y-[-4px] hover:shadow-lg` — uses `--shadow-lg` token (already defined in globals.css as `0 10px 30px rgba(0,0,0,0.1)`)
  - [x] **Accessibility**: `role="article"`, `aria-label={\`Property: ${title}, $${price}\`}`. ♡ button: `aria-label="Save property"` / `aria-label="Remove from saved"` toggling based on saved state
  - [x] `data-testid="property-card"` on the root element
  - [x] `variant='compact'`: 1-line description clamp, reduced padding. `variant='horizontal'`: side-by-side image (40%) + info (60%) layout

- [x] Task 2: Update `PropertyCardSkeleton` to match 3/2 aspect ratio (AC: #8)
  - [x] **File**: `src/components/property/property-card-skeleton.tsx` (already exists — Story 1.7 created it)
  - [x] Current skeleton uses `aspect-[4/3]` — **update to `aspect-[3/2]`** to match PropertyCard (prevents CLS when real cards replace skeletons)
  - [x] Keep `data-testid` if present; keep `aria-busy="true"`

- [x] Task 3: Create `PropertyGrid` component (AC: #2, #3, #4, #6)
  - [x] Create `src/components/property/property-grid.tsx` with `'use client'` — **this IS a Client Component** because it manages `page` state locally when used standalone, and receives `onPageChange` callback. Add `'use client'` as the first line
  - [x] Props:
    ```ts
    interface PropertyGridProps {
      properties: PropertySearchItem[];
      locale: string;
      isLoading?: boolean;
      total?: number;       // total result count for pagination display
      page?: number;        // current page (default 1)
      onPageChange?: (page: number) => void;
    }
    ```
  - [x] **Responsive grid classes**: `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6`
    - Mobile: 1 col (default)
    - Tablet (sm: 768px): 2 col
    - Desktop (lg: 1024px): 3 col
  - [x] When `isLoading=true`: render `<SearchResultsSkeleton />` (already exists at `src/components/search/search-results-skeleton.tsx`) — **reuse, do NOT duplicate skeleton rendering**
  - [x] When `properties.length === 0` and `!isLoading`: render no-results state (empty div with message — full no-results spec is Story 3.8; for now just a simple empty message)
  - [x] **Pagination**: show ≤ 20 cards per page. `const ITEMS_PER_PAGE = 20`. Compute `currentPageItems = properties.slice((page-1)*20, page*20)`. Render simple prev/next buttons + "Page X of Y" when `total > 20`
  - [x] `data-testid="property-grid"` on the root element

- [x] Task 4: Create `SaveButton` and `ShareButton` Client Components (AC: #1)
  - [x] Create `src/components/property/save-button.tsx` with `'use client'`
  - [x] Props: `{ propertyId: string; propertyTitle: string }`
  - [x] Uses `localStorage` key `'shortlist'` — architecture §8: "Shortlist → localStorage (persistent, client-only)" (AR10)
  - [x] **Do NOT create a full shortlist manager** — that is Story 7.1. For this story, implement minimal save-to-localStorage toggle only
  - [x] localStorage schema: `string[]` of property IDs, max 20 entries (architecture cap)
  - [x] States: saved (♡ filled, `text-[--color-accent]`) / unsaved (♡ outline, `text-muted-foreground`). Toggle: add/remove from array. If `length >= 20` and trying to add, show inline toast
  - [x] **No toast library is installed** (no `sonner`, no `shadcn/ui` Toast component). Use the inline `useState` toast pattern from `src/components/lead/contact-form.tsx`:
    - Add `const [showToast, setShowToast] = useState(false)` + auto-dismiss `useEffect` (2s timeout)
    - Render a small `<div role="status">` with the message when `showToast` is true
  - [x] `aria-label` toggles: `"Save property"` / `"Remove from saved"`
  - [x] `data-testid="save-button"` on the button
  - [x] Create `src/components/property/share-button.tsx` with `'use client'`
  - [x] Props: `{ slug: string; title: string; locale: string }`
  - [x] Share logic: `await navigator.share({ url: window.location.origin + '/' + locale + '/property/' + slug, title })` if `navigator.share` is defined; else fall back to `navigator.clipboard.writeText(url)` + show brief "Link copied!" inline toast (same pattern as above)
  - [x] `data-testid="share-button"` on the button

- [x] Task 5: Update `SplitViewLayout` to render real PropertyGrid in grid panel (AC: #2, #3, #4)
  - [x] **File**: `src/components/search/split-view-layout.tsx` (exists — Story 3.1/3.3)
  - [x] **Currently** the grid panel renders `<SearchResultsSkeleton />` unconditionally — replace with `<PropertyGrid>` when `_filterProperties` is available
  - [x] Remove `void _filterProperties` suppression line; actually use the prop
  - [x] Import `PropertyGrid` from `@/components/property/property-grid`
  - [x] Pass `filterProperties` to `PropertyGrid` as `properties`; pass `isLoading` to `PropertyGrid`
  - [x] Pass `locale` prop (already received) to `PropertyGrid`
  - [x] **Do NOT break**: `data-testid="map-panel"`, `data-testid="grid-panel"`, `data-testid="pull-up-handle"` (existing tests assert on these)
  - [x] **Do NOT touch** map panel logic or MapView props

- [x] Task 6: Update `searchProperties` Server Action for pagination (AC: #6)
  - [x] **File**: `src/app/actions/search-actions.ts` (exists — Story 3.3)
  - [x] Current: `limit(50).offset(0)` — update to accept optional `page` param and apply `limit(20).offset((page-1)*20)`
  - [x] Add `page?: number` to `SearchFilters` type in `src/types/search.ts`
  - [x] Update function signature: `searchProperties(filters: SearchFilters, page = 1)`
  - [x] `sanitizeNumber` the page value too: clamp to `Math.max(1, Math.floor(page))`
  - [x] The `total` field in `SearchResult` already exists — it correctly counts all matching rows. Verify the total aggregation query is NOT affected by the limit/offset (it is a separate count query — confirm this is already the case in the existing implementation)
  - [x] **Do NOT change** `getAvailableAreas` or facets logic

- [x] Task 7: Update `SearchPageClient` to support pagination (AC: #6)
  - [x] **File**: `src/components/search/search-page-client.tsx` (exists — Story 3.3)
  - [x] Add `page` state: `const [page, setPage] = useState(1)` — **page resets to 1 when filters change**
  - [x] Pass `page` to `searchProperties(filters, page)` call
  - [x] Store `total` from search result: `const [total, setTotal] = useState(0)` and update from `result.total`
  - [x] Pass `total` and `page` and `onPageChange` to `SplitViewLayout` → `PropertyGrid`
  - [x] When filters change (in the `useEffect`), reset page to 1 before fetching
  - [x] Architecture reminder: page is **ephemeral UI state** — it does NOT need to go in the URL per the state management table (only `search filters` go in URL, not pagination cursor)

- [x] Task 8: Add i18n keys for property cards (AC: #1)
  - [x] In `src/messages/en.json`, add under a new `"PropertyCard"` key at the top level:
    ```json
    "PropertyCard": {
      "saveProperty": "Save property",
      "removeFromSaved": "Remove from saved",
      "shortlistFull": "Shortlist full (20 max)",
      "region": {
        "mountain": "Mountain",
        "beach": "Beach"
      },
      "zmtStatus": {
        "titled": "Titled Property",
        "concession": "Concession",
        "zmt_restricted": "ZMT Restricted"
      },
      "specs": {
        "beds": "{count} bed",
        "baths": "{count} bath",
        "lot": "{size}",
        "built": "{size} built"
      },
      "share": "Share property",
      "viewDetails": "View details"
    }
    ```
  - [x] Add equivalent Spanish keys in `src/messages/es.json`:
    ```json
    "PropertyCard": {
      "saveProperty": "Guardar propiedad",
      "removeFromSaved": "Quitar de guardados",
      "shortlistFull": "Lista llena (máx. 20)",
      "region": {
        "mountain": "Montaña",
        "beach": "Playa"
      },
      "zmtStatus": {
        "titled": "Propiedad Titulada",
        "concession": "Concesión",
        "zmt_restricted": "Restringida ZMT"
      },
      "specs": {
        "beds": "{count} hab.",
        "baths": "{count} baño",
        "lot": "{size}",
        "built": "{size} construido"
      },
      "share": "Compartir propiedad",
      "viewDetails": "Ver detalles"
    }
    ```
  - [x] Add grid pagination i18n under `"SearchPage"`:
    ```json
    "grid": {
      "page": "Page {page} of {total}",
      "prev": "Previous",
      "next": "Next",
      "showing": "Showing {count} of {total} properties"
    }
    ```

- [x] Task 9: Tests (AC: all)
  - [x] Create `tests/unit/search/property-card.spec.tsx` (Vitest + jsdom — matches `environmentMatchGlobs` pattern `tests/unit/search/**/*.spec.tsx`)
    - **Mock**: `next/link`, `next/image`, `next/navigation`, `next-intl`, localStorage
    - Test: renders with `data-testid="property-card"` present
    - Test: displays formatted price using `formatPriceAbbrev` output (e.g., "$185K")
    - Test: region badge "Mountain" shown for `areaSlug="perez-zeledon"`
    - Test: region badge "Beach" shown for `areaSlug="dominical"`
    - Test: ZMT badge text "Titled Property" shown for `zmtStatus="titled"`
    - Test: beds/baths hidden when `propertyType="Lote"`
    - Test: hover class `hover:translate-y-[-4px]` present on root element
    - Test: image has `aspect-[3/2]` class
  - [x] Create `tests/unit/search/property-grid.spec.tsx` (Vitest + jsdom)
    - Test: renders `data-testid="property-grid"`
    - Test: renders `SearchResultsSkeleton` when `isLoading=true`
    - Test: renders N PropertyCards when given N properties
    - Test: shows max 20 cards per page when >20 properties passed
    - Test: pagination controls appear when `total > 20`
  - [x] Create `tests/unit/search/save-button.spec.tsx` (Vitest + jsdom)
    - Mock localStorage
    - Test: renders with `data-testid="save-button"`
    - Test: `aria-label="Save property"` in default state
    - Test: clicking saves propertyId to localStorage and changes `aria-label` to "Remove from saved"
    - Test: clicking again removes from localStorage
  - [x] Create `tests/unit/search/share-button.spec.tsx` (Vitest + jsdom)
    - Mock `navigator.share` and `navigator.clipboard.writeText`
    - Test: renders with `data-testid="share-button"`
    - Test: calls `navigator.share` when available
    - Test: falls back to `navigator.clipboard.writeText` when `navigator.share` is undefined
  - [x] **Update** `tests/unit/search/split-view-layout.spec.tsx`:
    - Add test: grid panel renders `PropertyGrid` (not `SearchResultsSkeleton`) when `filterProperties` is provided
    - **Keep** all existing test assertions (do not break `data-testid="grid-panel"`, `data-testid="map-panel"`, `data-testid="pull-up-handle"`)

- [x] Task 10: CI verification (AC: all)
  - [x] `npm run typecheck` → 0 new errors
  - [x] `npm run lint` → 0 errors
  - [x] `npm run format:check` → pass
  - [x] `npm run build` → pass
  - [x] `npm test` → all existing tests pass + new card/grid tests pass

## Dev Notes

### Critical Architecture Decisions — DO NOT VIOLATE

**PropertyCard = Server Component (with Client sub-component for interactivity):**

Architecture §8 explicitly classifies `PropertyCard (static data)` as a Server Component. The `SaveButton` (♡) is Client-only (localStorage access). Pattern:
```tsx
// property-card.tsx (Server Component — no 'use client')
import { SaveButton } from './save-button'; // Client Component child
export function PropertyCard({ property, locale }: PropertyCardProps) {
  return (
    <article data-testid="property-card" ...>
      <Link href={...}>...</Link>
      <SaveButton propertyId={property.id} propertyTitle={...} />
    </article>
  );
}
```

**`PropertySearchItem` type is FROZEN from Story 3.3 — do NOT add fields:**

The `PropertySearchItem` type in `src/types/search.ts` was established in Story 3.3. It does NOT include a `description` field. Do NOT add description to this type or to the `searchProperties` Server Action query — that would require DB query changes and belongs in the listing detail story (4.1). The PropertyCard must work without description for the grid view.

**`searchProperties` in `src/app/actions/search-actions.ts` — modify minimally:**

Only add `page` parameter for pagination. Do NOT change the SELECT columns, facet logic, or `getAvailableAreas`. The `total` count is already a separate aggregation query — adding `LIMIT/OFFSET` to the main query does NOT affect the `total` field.

**AC #5 (sort) is already fully implemented in Story 3.3 — no new work needed:**

The `sort` parameter is already in `SearchFilters` (`src/types/search.ts`), already serialized to URL params by `useSearchFilters` hook, and already applied in `searchProperties` Server Action. The `SearchFilterBar` already renders the sort dropdown (Story 3.3 Task 4). AC #5 is verified, not implemented, in this story. DO NOT re-implement sort logic.

**`formatPriceAbbrev` is already in `src/lib/map/geo-utils.ts` (Story 3.2):**

Do NOT create a new price formatting function. Import from `@/lib/map/geo-utils`. This function handles `$185K`, `$1.2M`, `$500` formats correctly.

**Tailwind v4 CSS-first — no hardcoded hex colors:**

Use design token utilities: `text-[--color-accent]` (burgundy price), `bg-brand-mountain`, `bg-brand-beach`, `bg-brand-burgundy`. Never inline `#660000`. Token map (from `src/styles/globals.css`):
- Price color: `text-[--color-accent]` → `--brand-burgundy: #660000`
- Mountain badge: `bg-brand-mountain` → `--brand-mountain` (greenish)
- Beach badge: `bg-brand-beach` → `--brand-beach` (blue/teal)
- Shadow on hover: `hover:shadow-lg` → `--shadow-lg: 0 10px 30px rgba(0,0,0,0.1)`

**Image fallback: `/property-placeholder.svg` exists in `public/`:**

Added in Fix PR #124 (`public/property-placeholder.svg`). Use as `next/image` fallback `src` when `property.images[0]?.url` is null/undefined.

**Pagination is ephemeral UI state — NOT in URL:**

Architecture §8 state management table: `Search filters → URL query params`. Pagination cursor (`page`) is NOT a search filter — it is reset on every filter change and does NOT belong in URL params. Store in `useState` in `SearchPageClient`.

**SplitViewLayout grid panel has intentional forward-compat stubs from Story 3.3:**

The `_filterProperties` and `_facets` props are already accepted (but suppressed with `void`) in `split-view-layout.tsx`. This story activates them. Remove the `void _filterProperties` suppression and actually use it to pass to `PropertyGrid`. Keep `void _facets` until a future story needs facets in the grid panel.

**`SearchResultsSkeleton` is already wired correctly:**

`src/components/search/search-results-skeleton.tsx` imports `PropertyCardSkeleton` and renders 6 skeletons in a 3-col grid. This component is already used as the loading state. Do NOT duplicate this — pass `isLoading` to `PropertyGrid` which then renders `<SearchResultsSkeleton />`.

### File Structure — Exact Paths

**Files to CREATE (do not exist):**
```
src/components/property/property-card.tsx       ← New: main PropertyCard component (RSC)
src/components/property/property-grid.tsx        ← New: Client Component grid layout + pagination
src/components/property/save-button.tsx          ← New: Client Component for ♡ save
src/components/property/share-button.tsx         ← New: Client Component for share
tests/unit/search/property-card.spec.tsx         ← New: PropertyCard unit tests
tests/unit/search/property-grid.spec.tsx         ← New: PropertyGrid unit tests
tests/unit/search/save-button.spec.tsx           ← New: SaveButton unit tests
```

**Files to MODIFY (already exist):**
```
src/components/property/property-card-skeleton.tsx   ← Fix: aspect-[4/3] → aspect-[3/2]
src/components/search/split-view-layout.tsx          ← Activate: use _filterProperties
src/app/actions/search-actions.ts                    ← Add: page parameter + limit(20)
src/types/search.ts                                  ← Add: page?: number to SearchFilters
src/components/search/search-page-client.tsx         ← Add: page state + total state
src/messages/en.json                                 ← Add: PropertyCard + grid i18n keys
src/messages/es.json                                 ← Add: PropertyCard + grid i18n keys
tests/unit/search/split-view-layout.spec.tsx         ← Update: add PropertyGrid test
```

**Files to NOT touch (frozen):**
```
src/app/actions/map-actions.ts          ← Frozen: Story 3.2
src/store/map-store.ts                  ← Frozen: Story 3.2
src/components/map/map-view.tsx         ← Frozen: Story 3.2
src/hooks/use-search-filters.ts         ← Frozen: Story 3.3
src/components/search/filter-chips.tsx  ← Frozen: Story 3.3
```

### UX Spec Compliance (UX-DR10, UX-DR22, UX-DR27)

**PropertyCard anatomy** (exact layout from UX §Custom Component Specifications):
```
┌──────────────────────────────┐
│  [Hero Image]          ♡     │ ← Save icon (top-right, absolute positioned)
│   MOUNTAIN                   │ ← Region badge (top-left overlay)
├──────────────────────────────┤
│  $185,000                    │ ← Price (Montserrat 800, --color-accent)
│  3BR Mountain House — PZ     │ ← Title (2-line clamp)
│  🛏 3  🚿 2  📐 400m²  🏗 180m² │ ← Specs row
│  ✓ Titled Property           │ ← ZMT badge
│                    ♡ ↗       │ ← Save + Share (bottom CTA area)
└──────────────────────────────┘
```

Note: The top-right ♡ icon is the SAVE button. The bottom-right ♡ ↗ are DUPLICATE save+share. UX spec shows both positions. Keep save icon at **top-right absolute positioned** on the image, AND include save+share in the card body footer area.

**Card states:**
- Default: `shadow-subtle` (`--shadow-sm`)
- Hover: `hover:translate-y-[-4px] hover:shadow-lg` with `transition-all duration-200 ease-out`
- Saved ♡: filled burgundy (`text-[--color-accent]`)

**Responsive grid breakpoints:**
| Viewport | Grid | Tailwind |
|----------|------|---------|
| < 768px (mobile) | 1 col | `grid-cols-1` |
| 768–1023px (tablet) | 2 col | `sm:grid-cols-2` |
| ≥ 1024px (desktop) | 3 col | `lg:grid-cols-3` |

### Previous Story Intelligence (Story 3.3)

Key patterns from Story 3.3 that carry forward:
1. **Client Component hook pattern**: hooks that use `useSearchParams` are Client-only with `.tsx` extension
2. **Race condition prevention**: `requestSeqRef` monotonic counter pattern — already in `SearchPageClient`. The page-change fetch reuses this same pattern
3. **`'use client'` placement**: must be the FIRST line of the file (before any imports)
4. **`data-testid` must survive refactors**: any `data-testid` cited in the test files must be preserved
5. **Facet pattern**: `byType`, `byBedrooms`, `byBathrooms` — the search result returns these. Story 3.5 does NOT need to display facets in the grid (they stay in the filter bar from Story 3.3)
6. **`sanitizeNumber` pattern**: already implemented for numeric filter values. Apply the same guard for `page` parameter

### Testing Notes

**Test environment**: All files under `tests/unit/search/` with `.spec.tsx` extension automatically get `jsdom` environment (from `vitest.config.mts` `environmentMatchGlobs` rule). Use `.tsx` extension for all new component tests.

**next/image mock**: next/image needs to be mocked in jsdom tests. Check existing test files (e.g., `map-view.spec.tsx`) for the established mock pattern used in this project.

**next/link mock**: similarly mock `next/link` as a plain `<a>` tag wrapper.

**localStorage mock**: jsdom provides a basic localStorage. Use `localStorage.clear()` in `beforeEach` to prevent test pollution.

**`next-intl` mock**: see existing tests (`filter-chips.spec.tsx`) for the established mock pattern — likely `vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))`.

### Project Structure Notes

- `src/components/property/` is the correct directory for all property domain components (architecture §3)
- `src/components/shortlist/save-button.tsx` is listed in the architecture directory layout — BUT the architecture also lists `src/components/property/` components first and `SaveButton` is closely tied to `PropertyCard`. Place `save-button.tsx` in `src/components/property/` (co-located with its primary consumer) rather than creating a new `shortlist/` directory this story. The full shortlist module is Story 7.1.
- Tests for property components go in `tests/unit/search/` (not a separate `property/` subdirectory) — this matches the existing `environmentMatchGlobs` config which grants jsdom only to `tests/unit/search/**`

### References

- Story 3.3 implementation: `_bmad-output/implementation-artifacts/3-3-search-filters-and-url-state.md` — all the existing hooks, actions, and types to build upon
- PropertyCard anatomy: `_bmad-output/planning-artifacts/ux-design-specification.md` §Custom Component Specifications → PropertyCard (lines 1773–1812)
- PropertyCard responsive grid: `_bmad-output/planning-artifacts/ux-design-specification.md` §Responsive Design (line 2414)
- Architecture component classification: `_bmad-output/planning-artifacts/architecture.md` §8 Frontend Architecture → Client vs. Server Component Split
- State management decisions: `_bmad-output/planning-artifacts/architecture.md` §8 Frontend Architecture → State Management table
- Design tokens: `src/styles/globals.css` — all `--color-brand-*`, `--shadow-*` tokens
- `formatPriceAbbrev`: `src/lib/map/geo-utils.ts` line 44
- Image placeholder: `public/property-placeholder.svg` (added PR #124)
- Inline toast pattern (no external toast lib): `src/components/lead/contact-form.tsx` lines 13-21
- PropertyCardSkeleton: `src/components/property/property-card-skeleton.tsx`
- SearchResultsSkeleton: `src/components/search/search-results-skeleton.tsx`
- SplitViewLayout forward-compat stubs: `src/components/search/split-view-layout.tsx` lines 51-61
- Vitest environment config: `vitest.config.mts` lines 19-22

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Implemented all 10 tasks in story 3.5 in a single session.
- PropertyCard (RSC): hero image with 3/2 aspect via fill+positioned wrapper, region badge (Mountain/Beach), price (Montserrat bold + --color-accent), title (line-clamp-2), specs row (land type hides beds/baths), ZMT badge (icon+color+text), hover animation (200ms lift + shadow-lg), SaveButton + ShareButton as Client Component children.
- PropertyCardSkeleton: updated aspect-[4/3] → aspect-[3/2] to prevent CLS.
- PropertyGrid (Client Component): responsive 1/2/3-col grid, pagination (≤20/page), isLoading → SearchResultsSkeleton, empty state.
- SaveButton (Client Component): localStorage toggle with 20-cap, inline toast pattern.
- ShareButton (Client Component): navigator.share with clipboard fallback and inline toast.
- SplitViewLayout: activated filterProperties prop (was _filterProperties), renders PropertyGrid when provided, SearchResultsSkeleton when not. Added total/page/onPageChange props.
- searchProperties: updated limit 50→20 with page-based offset.
- SearchPageClient: added page/total state, reset page on filter change.
- i18n: added PropertyCard keys (en + es) and grid pagination keys under SearchPage.
- All 78 skipped ATDD tests activated and passing (433 total, 3 pre-existing skips, 0 failures).
- Updated search-actions.spec.ts pagination test from limit(50) to limit(20) to reflect new behavior.

### File List

**New files:**
- src/components/property/property-card.tsx
- src/components/property/property-grid.tsx
- src/components/property/save-button.tsx
- src/components/property/share-button.tsx

**Modified files:**
- src/components/property/property-card-skeleton.tsx
- src/components/property/save-button.tsx (code review fix: cross-instance sync + visible toast)
- src/components/property/share-button.tsx (code review fix: i18n linkCopied + visible toast)
- src/components/property/property-grid.tsx (code review fix: i18n strings, totalPages min 1)
- src/components/search/split-view-layout.tsx
- src/components/search/search-page-client.tsx (code review fix: merged page-reset effect to prevent double fetch)
- src/app/actions/search-actions.ts
- src/messages/en.json (code review fix: added grid.empty key)
- src/messages/es.json (code review fix: added grid.empty key)
- tests/unit/search/property-card.spec.tsx
- tests/unit/search/property-grid.spec.tsx (code review fix: i18n mock returns interpolated templates)
- tests/unit/search/save-button.spec.tsx
- tests/unit/search/share-button.spec.tsx
- tests/unit/search/split-view-layout.spec.tsx
- tests/unit/search/search-actions.spec.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Review Findings

- [x] [Review][Patch] PropertyGrid hardcodes UI strings (Previous/Next/Page/empty) — bypasses i18n keys defined in `SearchPage.grid` [src/components/property/property-grid.tsx:54,69,73,84]
- [x] [Review][Patch] ShareButton hardcodes "Link copied!" — `linkCopied` key exists in messages but unused; Spanish users see English [src/components/property/share-button.tsx:60]
- [x] [Review][Patch] SaveButton shortlist-full toast is sr-only — users hitting the 20-cap get no visible feedback; spec required visible inline toast [src/components/property/save-button.tsx:88-92]
- [x] [Review][Patch] PropertyCard renders SaveButton twice with independent local state — clicking one button does not update the other (each instance only reads localStorage once on mount) [src/components/property/property-card.tsx:181-189]
- [x] [Review][Patch] SearchPageClient triggers two `searchProperties` requests when filters change — separate page-reset and fetch effects both run with the old page before the page state settles [src/components/search/search-page-client.tsx:80-106]
- [x] [Review][Defer] SaveButton `propertyTitle` prop is declared but unused — kept for forward compatibility (toast personalization in Story 7.1) [src/components/property/save-button.tsx:8] — deferred, low priority
- [x] [Review][Defer] ShareButton silent when neither `navigator.share` nor `navigator.clipboard` is available — older browsers get no feedback [src/components/property/share-button.tsx:25-45] — deferred, edge browser support
- [x] [Review][Defer] Empty-string image URL not explicitly guarded — relies on `?? "/property-placeholder.svg"` which only fires for null/undefined [src/components/property/property-card.tsx:81] — deferred, data integrity belongs upstream
