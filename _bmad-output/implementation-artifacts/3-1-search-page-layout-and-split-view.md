# Story 3.1: Search Page Layout & Split-View

Status: ready-for-dev

## Story

As a **visitor**,
I want a search page where I can see both a map and property listings at the same time,
so that I can understand where properties are while browsing details.

## Acceptance Criteria

1. **Given** the search page loads on desktop (≥1024px) **When** rendered **Then** a split-view appears with map (60% left) and scrollable grid (40% right) — (FR2).

2. **Given** the split-view **When** the "Full Map" toggle is clicked **Then** the map expands to 100% width and the grid is hidden.

3. **Given** the split-view **When** the "Full Grid" toggle is clicked **Then** the grid expands to 100% width and the map is hidden.

4. **Given** tablet viewport (768–1023px) **When** the search page loads **Then** the map and grid split (60/40) with a side-panel toggle.

5. **Given** mobile viewport (<768px) **When** the search page loads **Then** the map is full-screen with a pull-up sheet handle visible at the bottom (handle stub — full sheet behaviour is Story 3.6).

6. **Given** a sticky filter bar **When** the user scrolls the results grid **Then** the filter bar remains fixed at the top of the grid panel.

7. **And** all search states (filters, sort, view mode) are encoded in URL query params and are shareable (UX-DR21, AR10).

8. **And** the search page route uses CSR; initial shell uses Server Components for the page wrapper; map and interactive UI use Client Components (AR9, Architecture rendering matrix).

## Tasks / Subtasks

- [ ] Task 1: Create search page route and Server Component shell (AC: #1, #8)
  - [ ] Create `src/app/[locale]/search/page.tsx` — Server Component wrapper.
  - [ ] Call `setRequestLocale(locale)` (import from `"next-intl/server"`) — required for all `[locale]/` pages.
  - [ ] Export `generateMetadata` returning `{ robots: { index: false, follow: false } }` — search is filter-shareable but must NOT be indexed (see Architecture URL Strategy table: "Filter-shareable but not indexed").
  - [ ] Render `<SearchPageClient />` as the sole child — the server component is just a locale setup + metadata shell.
  - [ ] Do NOT add `export const dynamic` — search is CSR so SSR/ISR is irrelevant.

- [ ] Task 2: Create `SearchPageClient` Client Component (AC: #1, #7, #8)
  - [ ] Create `src/components/search/search-page-client.tsx` with `'use client'` directive.
  - [ ] This component owns all search page state (view mode, etc.) and renders the layout shell.
  - [ ] Import and render `<SplitViewLayout>` (to be created in Task 3).
  - [ ] Import and render `<SearchFilterBar>` (stub for Story 3.3 — see Task 5).
  - [ ] Read `viewMode` from URL params using `useSearchParams()` from `next/navigation`; default to `"split"`.
  - [ ] Pass `viewMode` as prop to `<SplitViewLayout>`.

- [ ] Task 3: Create `SplitViewLayout` Client Component (AC: #1, #2, #3, #4, #5)
  - [ ] Create `src/components/search/split-view-layout.tsx` with `'use client'` directive.
  - [ ] Props: `viewMode: "split" | "map" | "grid"`, `onViewModeChange: (mode: "split" | "map" | "grid") => void`.
  - [ ] **Desktop (≥1024px) — split mode (default):** Map panel `w-[60%]` fixed (non-scrolling, `h-[calc(100vh-var(--header-height)-3.5rem)]` — subtracts header + filter bar h-14), Grid panel `w-[40%]` scrollable overflow-y-auto. Both panels side-by-side using flex row.
  - [ ] **Desktop — full map mode:** Map `w-full`, grid `hidden`.
  - [ ] **Desktop — full grid mode:** Map `hidden`, grid `w-full`.
  - [ ] **Tablet (768–1023px):** Same 60/40 split; grid panel hidden behind side-panel toggle button (aria-expanded). Toggle button reveals grid as an overlay panel (sliding from right).
  - [ ] **Mobile (<768px):** Map `w-full h-screen`. Pull-up sheet handle: a 40px tall handle bar at `bottom-0` with `position: fixed`, containing a drag indicator line and property count text (e.g. "24 properties"). No sheet behaviour in this story — the handle is a non-interactive stub, styled and positioned for Story 3.6 to activate. Add `data-testid="pull-up-handle"`.
  - [ ] Use Tailwind responsive prefixes: `lg:` for ≥1024px, `md:` for 768–1023px, no prefix for mobile-first (<768px).
  - [ ] Map placeholder: render `<div data-testid="map-placeholder" className="h-full w-full bg-muted" />` — Story 3.2 will replace with `<MapView>`.
  - [ ] Grid placeholder: render `<SearchResultsSkeleton />` — Story 3.5 replaces with `<PropertyGrid>`.
  - [ ] Render `<ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />` above the split panels (desktop/tablet only, hidden on mobile). `ViewModeToggle` is created in Task 4.

- [ ] Task 4: Create `ViewModeToggle` UI component (AC: #2, #3)
  - [ ] Create `src/components/search/view-mode-toggle.tsx` with `'use client'` directive.
  - [ ] Three segmented buttons: "Split View" (default), "Full Map", "Full Grid".
  - [ ] Props: `viewMode: "split" | "map" | "grid"`, `onViewModeChange: (mode: "split" | "map" | "grid") => void`. On click, update the URL param `view` via `useRouter` + `useSearchParams` from `next/navigation` (do NOT use `router.push` with full URL rebuild; use `router.replace` to preserve other params), then call `onViewModeChange` to notify parent.
  - [ ] Pattern for URL param update:
    ```ts
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newMode);
    router.replace(`?${params.toString()}`, { scroll: false });
    ```
  - [ ] Active state: `bg-brand-navy text-white` for active button, `bg-transparent` for inactive.
  - [ ] Hidden on mobile (`hidden lg:flex`).

- [ ] Task 5: Create `SearchFilterBar` stub (AC: #6)
  - [ ] Create `src/components/search/search-filter-bar.tsx` with `'use client'` directive.
  - [ ] This is a layout stub — Story 3.3 implements the actual filters.
  - [ ] Render a `<div>` with `position: sticky`, `top: 0`, `z-index: 10` (above content, below modals).
  - [ ] Height `h-14` (56px), `bg-background`, `border-b border-border`, `flex items-center px-4 gap-3`.
  - [ ] Placeholder content: a grey rounded bar `w-full h-8 bg-muted rounded animate-pulse` with `aria-label="Filter bar loading"` — Story 3.3 replaces this with actual filter controls.
  - [ ] On mobile: renders as a `h-12` compact bar with "Filters" button text and filter icon (lucide `SlidersHorizontal`).

- [ ] Task 6: Add i18n keys for search page (AC: #1)
  - [ ] Add to `src/messages/en.json` under a new `"SearchPage"` namespace:
    ```json
    "SearchPage": {
      "title": "Search Properties",
      "description": "Search homes, land, and commercial properties in Costa Rica",
      "viewToggle": {
        "split": "Split View",
        "map": "Full Map",
        "grid": "Full Grid"
      },
      "filterBar": {
        "label": "Filters",
        "loading": "Filter bar loading"
      },
      "pullUpHandle": {
        "propertiesCount": "{count} properties"
      }
    }
    ```
  - [ ] Add equivalent Spanish keys to `src/messages/es.json`:
    ```json
    "SearchPage": {
      "title": "Buscar Propiedades",
      "description": "Busca casas, terrenos y propiedades comerciales en Costa Rica",
      "viewToggle": {
        "split": "Vista dividida",
        "map": "Solo mapa",
        "grid": "Solo lista"
      },
      "filterBar": {
        "label": "Filtros",
        "loading": "Cargando filtros"
      },
      "pullUpHandle": {
        "propertiesCount": "{count} propiedades"
      }
    }
    ```

- [ ] Task 7: Tests (AC: all)
  - [ ] Create `tests/unit/search/split-view-layout.spec.tsx`:
    - **Test: desktop split (default)** — renders map panel with `w-[60%]` and grid panel with `w-[40%]` when `viewMode="split"` at `lg` breakpoint.
    - **Test: full map mode** — grid panel has `hidden` class when `viewMode="map"`.
    - **Test: full grid mode** — map panel has `hidden` class when `viewMode="grid"`.
    - **Test: mobile pull-up handle** — element with `data-testid="pull-up-handle"` is present at mobile viewport; handle is not interactive (no onClick handler on stub).
    - **Test: map placeholder** — `data-testid="map-placeholder"` renders when map panel is visible.
  - [ ] Create `tests/unit/search/view-mode-toggle.spec.tsx`:
    - Mock `next/navigation` (`useRouter`, `useSearchParams`).
    - **Test: default active state** — "Split View" button has active class by default.
    - **Test: mode switch** — clicking "Full Map" calls router.replace with `view=map` param AND calls `onViewModeChange("map")`.
    - **Test: preserves existing params** — existing URL params are not dropped when view mode changes.
  - [ ] Create `tests/unit/search/search-filter-bar.spec.tsx`:
    - **Test: sticky positioning** — container has `position: sticky` and `top: 0`.
    - **Test: mobile compact** — renders "Filters" button with `SlidersHorizontal` icon on mobile.

- [ ] Task 8: CI verification (AC: all)
  - [ ] `npm run typecheck` → 0 new errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run format:check` → pass.
  - [ ] `npm run build` → pass.
  - [ ] `npm test` → 0 new failures (all new tests pass; existing tests remain green).

## Dev Notes

### Critical Architecture Compliance

**Route: `src/app/[locale]/search/page.tsx`** — This path is explicitly declared in the Architecture directory tree (§3). Do NOT create at any other path. The route is `/[locale]/search`.

**Rendering strategy: CSR** — Architecture rendering matrix: Search/Map is `CSR | N/A (client-side) | API cache`. Do NOT add `export const revalidate` or `export const dynamic = "force-static"`. The page shell is a Server Component but the actual search UI is fully client-side.

**Server/Client Component split (AR9):**
- `src/app/[locale]/search/page.tsx` → Server Component (locale setup, metadata only)
- `src/components/search/search-page-client.tsx` → `'use client'` (owns all interactive state)
- `src/components/search/split-view-layout.tsx` → `'use client'` (layout with responsive behavior)
- `src/components/search/view-mode-toggle.tsx` → `'use client'` (URL param manipulation)
- `src/components/search/search-filter-bar.tsx` → `'use client'` (stub — Story 3.3 will add filter state)

**URL params for state (AR10):** View mode, filters, and sort MUST live in URL query params — not React state or localStorage. Use `useSearchParams()` + `router.replace()` with `{ scroll: false }`. This makes searches bookmarkable and shareable (UX-DR21).

**Header height variable:** The split-view map panel height must account for the site header AND the sticky filter bar. Use `h-[calc(100vh-var(--header-height)-3.5rem)]` (3.5rem = 56px = h-14, the filter bar height). Check `src/styles/globals.css` for `--header-height` — if not yet defined, add `--header-height: 64px` to the `:root` block. Do NOT hardcode pixel values — use the CSS variable so it's easy to update. The UX spec explicitly states the split-view height is "100vh - header - filterbar".

**Mapbox: do NOT install yet** — Mapbox GL JS is Story 3.2. This story creates a `div` placeholder. Do NOT add `mapbox-gl`, `react-map-gl`, or any Mapbox npm package in this story. The architecture states Mapbox must be lazy-loaded (AR25, `dynamic(() => import(), { ssr: false })`). Story 3.2 owns that.

**zustand: do NOT install yet** — Map viewport state (zustand) is Story 3.2. Do not add `zustand` or create a map store in this story.

**Do NOT create `SplitViewLayout` or `MobileMapLayout` under `src/components/layout/`** — the Architecture source tree places search-specific layout components in `src/components/search/`. Layout domain (`src/components/layout/`) is for global layout primitives (header, footer, simple-page-layout). The UX spec mentions `SplitViewLayout` as a search-domain concept.

**`SearchResultsSkeleton` already exists:** `src/components/search/search-results-skeleton.tsx` — import and use it as the grid panel placeholder. Do NOT recreate it.

**`PropertyCardSkeleton` already exists:** `src/components/property/property-card-skeleton.tsx` — the skeleton uses `aspect-[4/3]` images. The grid panel should render `SearchResultsSkeleton` (which uses it) to give proper layout fidelity.

**No-results and listing-removed states already exist:** `src/components/property/no-results-state.tsx` and `src/components/property/listing-removed-state.tsx` — do NOT create new empty state components in this story.

**Tailwind v4 (CSS-first config):** The project uses Tailwind v4 with `@theme` directives in `src/styles/globals.css` (NOT a `tailwind.config.ts` file). Use standard Tailwind utility classes. Design tokens already available: `bg-brand-navy`, `text-brand-navy`, `bg-brand-burgundy`, `border-border`, `bg-muted`, `bg-background`, `text-text-muted`. Do NOT define inline hex values.

**Header exists and hides on search page (UX spec §5):** The UX spec states: "Hide on: Homepage, search page (map is the navigation)". However, the header provides locale/language controls. For this story, KEEP the header visible — this is a layout concern that can be addressed as a follow-on. Do not introduce complexity around hiding the header; focus on the split-view layout.

**SEO: search is NOT indexed** — Architecture URL Strategy: "Search | filter-shareable but not indexed." Return `robots: { index: false, follow: false }` in `generateMetadata`.

**`setRequestLocale` is required** — All `[locale]/` page routes must call `setRequestLocale(locale)` from `next-intl/server`. Pattern established in Story 2.7 and throughout existing pages. Non-negotiable.

### Previous Story Intelligence (Epic 2)

**Established patterns from Story 2.7 and prior:**
- Server Component pages: `params` is a `Promise<{ locale: string }>` — must `await params` before using.
- `setRequestLocale(locale)` called immediately after destructuring locale from params.
- `getTranslations` (not `useTranslations`) in Server Components; `useTranslations` in Client Components.
- `import { Link } from "@/i18n/navigation"` for localized links (NOT Next.js `<Link>` directly).
- `cn()` from `@/lib/utils` for conditional class merging.
- Button component: `import { Button } from "@/components/ui/button"`.

**Story 1.3 (Core Layout)** established `Header` and `Footer` in `src/components/layout/`. The search page DOES have a header (uses the same root `[locale]/layout.tsx`). The `<main id="main-content">` wrapper is in the locale layout — do NOT add another `<main>` inside the search page.

**Story 1.7 (Loading States)** established `SearchResultsSkeleton` and `PropertyCardSkeleton`. Use them, do not recreate.

### Git Intelligence (Recent Commits)

Last 5 commits:
1. `test: add Epic 3 test design — Property Discovery & Search` — E2E test scaffolding already exists for Epic 3
2. `test(db): add upsertProperty slug-conflict retry coverage`
3. `fix(sync): detect slug conflict via err.cause with postgres-js driver`
4. `docs: Epic 2 retrospective — Data Pipeline & Property Database`
5. `story-2.7-sync-monitoring-and-failure-resilience`

**Key pattern from recent work:** Test files use Vitest (`vi.mock`, `vi.fn()`). Unit tests live in `tests/unit/`. Use `describe`/`it` blocks. Component tests should use `@testing-library/react`.

### Project Structure Notes

**New files to create in this story:**
- `src/app/[locale]/search/page.tsx` — search route (Server Component shell)
- `src/components/search/search-page-client.tsx` — CSR page container
- `src/components/search/split-view-layout.tsx` — responsive layout
- `src/components/search/view-mode-toggle.tsx` — view mode switcher
- `src/components/search/search-filter-bar.tsx` — filter bar stub
- `tests/unit/search/split-view-layout.spec.tsx`
- `tests/unit/search/view-mode-toggle.spec.tsx`
- `tests/unit/search/search-filter-bar.spec.tsx`

**Files to modify in this story:**
- `src/messages/en.json` — add `SearchPage` namespace
- `src/messages/es.json` — add `SearchPage` namespace
- `src/styles/globals.css` — add `--header-height` CSS variable to `:root` if not present

**Files already implemented — do NOT touch:**
- `src/components/search/search-results-skeleton.tsx` (Story 1.7)
- `src/components/property/property-card-skeleton.tsx` (Story 1.7)
- `src/components/property/no-results-state.tsx` (Story 1.7)
- `src/components/property/listing-removed-state.tsx` (Story 1.7)
- `src/components/layout/header.tsx`, `footer.tsx` etc. (Story 1.3)

### Story Scope Boundaries

**This story does NOT implement:**
- Mapbox map (Story 3.2)
- Search filters logic (Story 3.3)
- Lifestyle tag filters (Story 3.4)
- Property card grid with real data (Story 3.5)
- Full pull-up sheet gestures/animations (Story 3.6)
- Unit conversion toggle (Story 3.7)
- No-results state (Story 3.8)

**This story DOES implement:**
- The search page route with correct metadata
- The responsive split-view layout shell (60/40, full-map, full-grid)
- View mode toggles updating URL params
- Sticky filter bar placeholder
- Mobile pull-up handle stub
- i18n keys for all search page text
- Unit tests for layout behavior

### UX Reference

**Search page composition (UX spec §2 "Map as Product"):**
```
Filter bar (sticky top, h-56px)
├── Desktop: horizontal filter row
└── Mobile: compact "Filters" button

Split-view container (below filter bar, h = 100vh - header - filterbar)
├── Map panel [60% left] — fixed height, non-scrolling
└── Grid panel [40% right] — scrollable, overflow-y-auto
    └── 2-column property card grid

View mode toggles (above split-view)
└── Split | Full Map | Full Grid (desktop/tablet only)

Mobile: map 100% + pull-up handle at bottom
```

**Responsive breakpoints:**
- `< 768px` (mobile): map fullscreen + pull-up handle stub
- `768–1023px` (tablet/`md:`): 60/40 split + side-panel toggle
- `≥ 1024px` (desktop/`lg:`): 60/40 split + Full Map / Full Grid toggles

**Visual reference:** `_bmad-output/planning-artifacts/search_page_mockup_1775316383692.png` and `_bmad-output/planning-artifacts/mobile_map_mockup_1775316436946.png`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: Search Page Layout & Split-View]
- [Source: _bmad-output/planning-artifacts/architecture.md#Rendering Strategy Matrix]
- [Source: _bmad-output/planning-artifacts/architecture.md#Directory Architecture §3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Client vs. Server Component Split §8]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management §8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Splitting Strategy §8 — AR25]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Search Page — Map as Product §2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Components]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Breakpoints]
- AR9, AR10, AR25: [Source: _bmad-output/planning-artifacts/epics.md#Architecture Requirements]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-1-search-page-layout-and-split-view.md`
- Unit tests (RED phase): `tests/unit/search/split-view-layout.spec.tsx`
- Unit tests (RED phase): `tests/unit/search/view-mode-toggle.spec.tsx`
- Unit tests (RED phase): `tests/unit/search/search-filter-bar.spec.tsx`

### Debug Log References

### Completion Notes List

### File List

**New files to create:**
- `src/app/[locale]/search/page.tsx`
- `src/components/search/search-page-client.tsx`
- `src/components/search/split-view-layout.tsx`
- `src/components/search/view-mode-toggle.tsx`
- `src/components/search/search-filter-bar.tsx`
- `tests/unit/search/split-view-layout.spec.tsx`
- `tests/unit/search/view-mode-toggle.spec.tsx`
- `tests/unit/search/search-filter-bar.spec.tsx`

**Files to modify:**
- `src/messages/en.json`
- `src/messages/es.json`
- `src/styles/globals.css`
