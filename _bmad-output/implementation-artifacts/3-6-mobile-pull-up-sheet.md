# Story 3.6: Mobile Pull-Up Sheet

Status: ready-for-dev

## Story

As a **mobile visitor**,
I want a pull-up sheet over the map to browse property cards,
so that I can see the map and listings without switching views.

## Acceptance Criteria

1. **Given** mobile viewport (<768px) on the search page **When** the map is displayed **Then** a pull-up sheet handle appears at the bottom of the screen (UX-DR8).

2. **Given** the pull-up sheet in "peeked" state (15vh) **When** displayed **Then** it shows only the handle bar + "{N} properties in view" count (UX-DR8).

3. **Given** the pull-up sheet **When** dragged up to 50vh **Then** it snaps to "half" state showing 2-3 card previews in horizontal scroll (UX-DR8).

4. **Given** the pull-up sheet **When** dragged up to 85vh **Then** it snaps to "full" state showing a scrollable list with a close button to return to map (UX-DR8).

5. **Given** the pull-up sheet drag **When** released between snap points **Then** it animates to the nearest snap point with spring physics (300ms, cubic-bezier) (UX-DR22).

6. **Given** pull-to-refresh **When** on the search page **Then** it is explicitly disabled via `overscroll-behavior: none` (UX-DR34).

7. **And** the sheet uses `role="region"` with `aria-label="Property list"` and `aria-expanded` toggling between `true` (full/half) and `false` (peeked) for state (UX-DR25).

## Tasks / Subtasks

- [ ] Task 1: Install `@use-gesture/react` dependency (AC: #3, #4, #5)
  - [ ] Run `npm install @use-gesture/react` in the worktree — **this package is NOT yet installed** (architecture §10 lists it at ~5KB, preferred over framer-motion ~32KB)
  - [ ] Pin version to `^10.x` (architecture: `@use-gesture/react | 10.x | package.json exact version`)
  - [ ] Verify `package.json` reflects the new dependency after install

- [ ] Task 2: Create `MapPullUpSheet` Client Component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Create `src/components/map/map-pull-up-sheet.tsx` — **this file does NOT exist yet** (stub handle is currently inline in `split-view-layout.tsx` lines 168-178)
  - [ ] Add `'use client'` as the first line — this IS a Client Component (gesture tracking, state)
  - [ ] Props interface:
    ```ts
    interface MapPullUpSheetProps {
      properties: PropertySearchItem[];
      locale: string;
      propertyCount: number;         // total visible count for the handle label
      isLoading?: boolean;
      initialState?: 'peeked' | 'half' | 'full'; // for unit test control only; defaults to 'peeked'
    }
    ```
  - [ ] Import `PropertySearchItem` from `@/types/search`
  - [ ] Import `useTranslations` from `next-intl`
  - [ ] **Three snap states** managed via `useState<'peeked' | 'half' | 'full'>`:
    - `peeked` = 15vh (default on mount)
    - `half` = 50vh
    - `full` = 85vh
  - [ ] **Height management**: use a `div` with `style={{ height: sheetHeight }}` where `sheetHeight` maps state to `'15vh'`, `'50vh'`, `'85vh'`. Add CSS transition: `transition: height 300ms cubic-bezier(0.32, 0.72, 0, 1)` for snap animation (UX-DR22 spring physics approximation)
  - [ ] **Drag gesture via `@use-gesture/react`**:
    ```ts
    import { useDrag } from '@use-gesture/react';
    const bind = useDrag(({ movement: [, my], last }) => {
      if (!last) return; // only snap on release
      // Determine new state based on final drag position
      // Negative my = dragged up; positive = dragged down
      // Current height as offset: compute target snap from direction + magnitude
      if (my < -60) {
        // dragged up significantly → advance one state
        setState(prev => prev === 'peeked' ? 'half' : 'full');
      } else if (my > 60) {
        // dragged down significantly → retreat one state
        setState(prev => prev === 'full' ? 'half' : 'peeked');
      }
      // else: insufficient drag → snap back to current state (no change)
    }, { axis: 'y' });
    ```
  - [ ] **Peeked state content**: drag handle bar + property count label only
    ```tsx
    {/* Drag handle */}
    <div aria-hidden="true" className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 my-2 flex-shrink-0" />
    {/* Property count */}
    <span className="text-xs text-muted-foreground text-center pb-1">
      {t('pullUpHandle.propertiesCount', { count: propertyCount })}
    </span>
    ```
  - [ ] **Half state content** (50vh): drag handle + count + horizontal scroll carousel of PropertyCards
    ```tsx
    {state !== 'peeked' && (
      <div className="flex-1 overflow-hidden">
        {state === 'half' && (
          <div className="flex gap-3 overflow-x-auto px-3 pb-2 snap-x snap-mandatory">
            {properties.slice(0, 3).map(p => (
              <div key={p.id} className="snap-start flex-shrink-0 w-[280px]">
                <PropertyCard property={p} locale={locale} variant="compact" />
              </div>
            ))}
          </div>
        )}
        {state === 'full' && (
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {isLoading ? <SearchResultsSkeleton /> : properties.map(p => (
              <div key={p.id} className="mb-3">
                <PropertyCard property={p} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </div>
    )}
    ```
  - [ ] **Full state close button**: renders a button at the top-right corner that sets state back to `'peeked'`
    ```tsx
    {state === 'full' && (
      <button
        type="button"
        onClick={() => setState('peeked')}
        className="absolute top-2 right-3 text-xs text-muted-foreground underline"
        aria-label={t('pullUpSheet.closeLabel')}
      >
        {t('pullUpSheet.close')}
      </button>
    )}
    ```
  - [ ] **ARIA attributes** (AC #7):
    ```tsx
    <section
      role="region"
      aria-label={t('pullUpSheet.regionLabel')}
      aria-expanded={state !== 'peeked' ? 'true' : 'false'}
      data-testid="pull-up-sheet"
      data-state={state}
      ...
    >
    ```
    - Note: `aria-expanded` must be the string `"true"` / `"false"` (not a boolean) to avoid TypeScript type errors on the `section` element. WAI-ARIA allows `aria-expanded` on elements with `role="region"` as a state descriptor — the epics spec explicitly requires it.
  - [ ] **`initialState` prop for testability** (critical for unit tests): add an optional `initialState?: 'peeked' | 'half' | 'full'` prop and use it in `useState`:
    ```ts
    const [state, setState] = useState<'peeked' | 'half' | 'full'>(initialState ?? 'peeked');
    ```
    This lets unit tests directly set the sheet to `'half'` or `'full'` without simulating drag gestures (which are mocked). Include this prop in the interface and in Task 6 test setup.
  - [ ] **`overscroll-behavior: none`** (AC #6): add `style={{ overscrollBehavior: 'none' }}` on the scroll container inside the full state. Also add `touch-none` on the drag handle zone (prevent native scroll conflict during drag)
  - [ ] **Position**: `fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border rounded-t-2xl shadow-lg lg:hidden flex flex-col`
  - [ ] `data-testid="pull-up-sheet"` on root element; `data-testid="pull-up-handle"` on the drag handle bar div (keep this testid — existing tests in `split-view-layout.spec.tsx` assert on `pull-up-handle`)

- [ ] Task 3: Update `SplitViewLayout` to use `MapPullUpSheet` (AC: #1–#7)
  - [ ] **File**: `src/components/search/split-view-layout.tsx` (exists — Story 3.1/3.3/3.5)
  - [ ] Remove the **inline pull-up handle stub** (lines 168-178 — `data-testid="pull-up-handle"` fixed div)
  - [ ] Import `MapPullUpSheet` from `@/components/map/map-pull-up-sheet`
  - [ ] Replace inline stub with `<MapPullUpSheet>`:
    ```tsx
    <MapPullUpSheet
      properties={filterProperties ?? []}
      locale={locale}
      propertyCount={count}
      isLoading={isLoading}
    />
    ```
  - [ ] The `MapPullUpSheet` component itself is `lg:hidden` — renders only on mobile, invisible on ≥1024px
  - [ ] **DO NOT BREAK** existing `data-testid` values: `map-panel`, `grid-panel` — these are asserted in `split-view-layout.spec.tsx`
  - [ ] **DO NOT touch** map panel logic, MapView props, or tablet side-panel toggle
  - [ ] `filterProperties` prop already exists on `SplitViewLayout` — pass it through to `MapPullUpSheet`

- [ ] Task 4: Add `overscroll-behavior: none` to search page (AC: #6)
  - [ ] **File**: `src/app/[locale]/search/page.tsx` (exists)
  - [ ] Add a wrapper `<div style={{ overscrollBehavior: 'none' }}>` around `<SearchPageClient />` OR add className `overscroll-none` (Tailwind utility available in v4)
  - [ ] Alternative: add to `src/components/search/search-page-client.tsx` outermost `<div>` — add `className="flex flex-col overscroll-none"` (replaces `"flex flex-col"`)
  - [ ] **Prefer** the `search-page-client.tsx` approach (co-located with scroll behavior) — add `overscroll-none` to the root `<div className="flex flex-col">` → `<div className="flex flex-col overscroll-none">`

- [ ] Task 5: Add i18n keys for `MapPullUpSheet` (AC: #2, #4, #7)
  - [ ] **File**: `src/messages/en.json` — add under `"SearchPage"`:
    ```json
    "pullUpSheet": {
      "regionLabel": "Property list",
      "close": "Back to map",
      "closeLabel": "Close property list and return to map"
    }
    ```
  - [ ] **File**: `src/messages/es.json` — add equivalent under `"SearchPage"`:
    ```json
    "pullUpSheet": {
      "regionLabel": "Lista de propiedades",
      "close": "Volver al mapa",
      "closeLabel": "Cerrar lista de propiedades y volver al mapa"
    }
    ```
  - [ ] Note: `pullUpHandle.propertiesCount` already exists in both locale files — **do NOT re-add it**

- [ ] Task 6: Unit tests for `MapPullUpSheet` (AC: all)
  - [ ] Create `tests/unit/search/map-pull-up-sheet.spec.tsx` (Vitest + jsdom — `environmentMatchGlobs` rule already covers `tests/unit/search/**/*.spec.tsx`)
  - [ ] **Mocks needed**:
    ```ts
    vi.mock('next-intl', () => ({
      useTranslations: vi.fn(() => (key: string, vals?: Record<string,unknown>) => {
        if (key === 'pullUpHandle.propertiesCount' && vals) return `${vals.count} properties`;
        if (key === 'pullUpSheet.regionLabel') return 'Property list';
        if (key === 'pullUpSheet.close') return 'Back to map';
        if (key === 'pullUpSheet.closeLabel') return 'Close property list and return to map';
        return key;
      }),
    }));
    vi.mock('@use-gesture/react', () => ({
      useDrag: vi.fn(() => () => ({})), // returns bind fn that returns empty spread
    }));
    vi.mock('@/components/property/property-card', () => ({
      PropertyCard: ({ property }: { property: { id: string } }) =>
        <div data-testid="property-card" data-id={property.id} />,
    }));
    vi.mock('@/components/search/search-results-skeleton', () => ({
      SearchResultsSkeleton: () => <div data-testid="search-results-skeleton" />,
    }));
    ```
  - [ ] Tests to write:
    - `[P0]` renders `data-testid="pull-up-sheet"` in peeked state by default
    - `[P0]` renders `data-testid="pull-up-handle"` (drag handle bar)
    - `[P0]` peeked state: shows property count label, does NOT show PropertyCard
    - `[P0]` has `role="region"` and `aria-label="Property list"`
    - `[P0]` has `aria-expanded="false"` in peeked state
    - `[P0]` has `aria-expanded="false"` in peeked state; has `aria-expanded="true"` when `initialState="half"` — use `initialState` prop for direct state control in tests
    - `[P1]` full state (`initialState="full"`): renders PropertyCards for all properties
    - `[P1]` full state (`initialState="full"`): renders `SearchResultsSkeleton` when `isLoading=true`
    - `[P1]` full state (`initialState="full"`): renders close button; clicking it updates `data-state` to `"peeked"`
    - `[P2]` half state (`initialState="half"`): renders up to 3 PropertyCards in horizontal scroll container
  - [ ] **Note on state testing**: use `data-state={state}` on the root element (already specified in Task 2). Use `initialState` prop to put the component in the desired state for each test. Use `@testing-library/user-event` `userEvent.click()` for close button test.
  - [ ] **Note on `@use-gesture/react` types**: the package ships its own TypeScript definitions — no `@types/use-gesture` needed.

- [ ] Task 7: Update `split-view-layout.spec.tsx` (AC: regression protection)
  - [ ] **File**: `tests/unit/search/split-view-layout.spec.tsx` (exists — Story 3.1/3.5)
  - [ ] Add mock for `@/components/map/map-pull-up-sheet`:
    ```ts
    vi.mock('@/components/map/map-pull-up-sheet', () => ({
      MapPullUpSheet: ({ propertyCount }: { propertyCount: number }) => (
        <div data-testid="pull-up-handle" data-count={propertyCount} />
      ),
    }));
    ```
  - [ ] **KEEP ALL EXISTING TESTS** — they must all continue passing
  - [ ] The existing test `[P0] renders data-testid='pull-up-handle' element` will continue passing since the mock emits `data-testid="pull-up-handle"` — verify this test still passes with the mock in place

- [ ] Task 8: CI verification (AC: all)
  - [ ] `npm run typecheck` → 0 new errors
  - [ ] `npm run lint` → 0 errors
  - [ ] `npm run format:check` → pass
  - [ ] `npm run build` → pass
  - [ ] `npm test` → all existing tests pass + new `map-pull-up-sheet.spec.tsx` tests pass

## Dev Notes

### CRITICAL: `@use-gesture/react` is NOT installed — install it first

Architecture §10 specifies `@use-gesture/react ~5KB` (preferred over `framer-motion ~32KB`). It is **not** in `package.json` yet. Run `npm install @use-gesture/react` before writing any component code. The `useDrag` hook is the only import needed.

### Architecture Classification: MapPullUpSheet = Client Component

The `MapPullUpSheet` MUST be `'use client'` because it:
1. Uses `useState` for snap state
2. Uses `@use-gesture/react` (browser gesture API)
3. Uses `style` with inline CSS transitions
4. Has interactive close button and drag behavior

### Snap Animation: CSS Transitions, NOT JS Animation

The UX spec says "300ms, cubic-bezier" and "spring physics." **Do not import framer-motion.** Use CSS `transition: height 300ms cubic-bezier(0.32, 0.72, 0, 1)` applied via `style` prop. The `@use-gesture/react` library handles drag tracking; CSS handles the animation. This is the architecture's intended approach (UX spec line 1929: "CSS scroll-snap-type... supplement with @use-gesture/react").

### `data-testid="pull-up-handle"` Must Survive the Refactor

The existing test `split-view-layout.spec.tsx` line 212-223 asserts `data-testid="pull-up-handle"` exists and `onclick` is null. The stub is moving from `SplitViewLayout` into `MapPullUpSheet`. To keep the test passing:
1. The `MapPullUpSheet` mock in `split-view-layout.spec.tsx` must emit `data-testid="pull-up-handle"` (see Task 7 above)
2. The `MapPullUpSheet` component itself must have `data-testid="pull-up-handle"` on the drag handle bar div — NOT on the root `<section>`
3. The existing test checks `onclick === null` — the drag handle div uses `@use-gesture/react` `bind()` spread (which attaches `onPointerDown`, not `onClick`), so `onclick` stays null on the div element

### Existing i18n Key: `pullUpHandle.propertiesCount`

The `pullUpHandle.propertiesCount` key already exists in both `en.json` and `es.json` under `SearchPage`. In `MapPullUpSheet`, call it as:
```ts
const t = useTranslations('SearchPage');
t('pullUpHandle.propertiesCount', { count: propertyCount })
```
Do NOT add this key again. Only add the new `pullUpSheet.*` keys.

### PropertyCard Import in MapPullUpSheet

`PropertyCard` is a **Server Component** (no `'use client'`) that imports `useTranslations` from `next-intl` (works in RSC). However, `MapPullUpSheet` is a Client Component. Client Components can render Server Components as children — but **importing an RSC into a Client Component forces the RSC to run in a "use client" boundary.**

The solution: since `PropertyCard` uses `next-intl`'s `useTranslations` (which has client-side support), this import will work. But confirm the pattern used in `split-view-layout.tsx` (which is also a Client Component that renders `PropertyGrid` which renders `PropertyCard`). Follow the same pattern.

If TypeScript raises a server/client boundary error at build time, add `'use client'` to `property-card.tsx` as a fallback — but try without it first.

### SearchResultsSkeleton Location

`src/components/search/search-results-skeleton.tsx` already exists (Story 1.7). Import as:
```ts
import { SearchResultsSkeleton } from '@/components/search/search-results-skeleton';
```

### Tailwind v4 CSS-First — No Hardcoded Values

Use Tailwind utilities for all styling:
- `bg-background`, `border-border`, `rounded-t-2xl`, `shadow-lg`
- `text-muted-foreground`, `bg-muted-foreground/30`
- `overscroll-none` (v4 utility)
- `touch-none` on drag handle zone
- NO inline hex colors
- Inline `style` is acceptable only for: `height` (dynamic snap), `transition` (non-Tailwind cubic-bezier), `overscrollBehavior`

### File Structure — Exact Paths

**Files to CREATE (do not exist):**
```
src/components/map/map-pull-up-sheet.tsx          ← New: MapPullUpSheet Client Component
tests/unit/search/map-pull-up-sheet.spec.tsx      ← New: unit tests
```

**Files to MODIFY (already exist):**
```
src/components/search/split-view-layout.tsx       ← Replace inline stub with <MapPullUpSheet>
src/components/search/search-page-client.tsx      ← Add overscroll-none to root div
src/messages/en.json                              ← Add pullUpSheet keys
src/messages/es.json                              ← Add pullUpSheet keys
tests/unit/search/split-view-layout.spec.tsx      ← Add MapPullUpSheet mock
```

**Files to NOT touch (frozen):**
```
src/components/property/property-card.tsx         ← Frozen: Story 3.5
src/components/property/property-grid.tsx         ← Frozen: Story 3.5
src/app/actions/search-actions.ts                 ← Frozen: Story 3.3/3.5
src/types/search.ts                               ← Frozen: Story 3.3
src/store/map-store.ts                            ← Frozen: Story 3.2
src/components/map/map-view.tsx                   ← Frozen: Story 3.2
src/hooks/use-search-filters.ts                   ← Frozen: Story 3.3
```

### UX Spec Compliance (UX-DR8, UX-DR22, UX-DR25, UX-DR34)

**Three-state sheet anatomy** (from UX spec §MapPullUpSheet, line 1921–1929):

| State | Height | Map Visibility | Content |
|-------|--------|----------------|---------|
| Peeked | 15vh | Fully visible | Handle + count only |
| Half | 50vh | Partially visible | Horizontal card carousel (2-3 cards) |
| Full | 85vh | Hidden behind | Full scrollable list + close button |

**Animation** (UX-DR22): `transition: height 300ms cubic-bezier(0.32, 0.72, 0, 1)` — matches the "pull-up sheet snap" row in the UX animation table.

**ARIA** (UX-DR25): `role="region"`, `aria-label="Property list"` (matches i18n key `pullUpSheet.regionLabel`), `aria-expanded={state !== 'peeked'}`.

**Pull-to-refresh disable** (UX-DR34): `overscrollBehavior: 'none'` on the scroll container + `overscroll-none` on the search page root.

### Risk R-006: iOS Safari Drag Conflict

Test design (test-design-epic-3.md §R-006) identifies "Pull-up sheet drag conflicts with iOS Safari native scroll/overscroll-behavior." Mitigations baked into the implementation:
1. `touch-action: none` on the drag handle zone (via `touch-none` Tailwind class)
2. `overscroll-behavior: none` on the sheet scroll container
3. Using `@use-gesture/react` which correctly calls `e.preventDefault()` during pointer events

### Previous Story Intelligence (Story 3.5)

Key patterns from Story 3.5 that carry forward:
1. **`'use client'` must be the first line** of any Client Component file (before imports)
2. **`data-testid` must survive refactors** — never rename/remove existing testids
3. **Inline toast pattern** (no Sonner/shadcn Toast): irrelevant here, but the `MapPullUpSheet` has no toasts
4. **`PropertyCard` RSC pattern**: outer RSC + `<SaveButton>` Client child — don't break it
5. **Mock pattern for `next-intl`**: `vi.mock('next-intl', () => ({ useTranslations: vi.fn(() => (key: string) => key) }))` — but ICU plural mocks need count interpolation (see split-view-layout.spec.tsx lines 37-43 for the exact pattern)
6. **`@use-gesture/react` mock**: return `vi.fn(() => () => ({}))` from `useDrag` — the component spreads the bind result, so an empty object spread is safe

### References

- Story 3.6 in epics: `_bmad-output/planning-artifacts/epics.md` §Story 3.6
- UX spec §MapPullUpSheet: `_bmad-output/planning-artifacts/ux-design-specification.md` lines 1917–1930
- UX spec §Mobile pull-up sheet states: lines 1197–1205
- UX spec §Animation: line 2364 (pull-up sheet snap: 300ms, cubic-bezier(0.32, 0.72, 0, 1))
- Architecture §Component directory: `_bmad-output/planning-artifacts/architecture.md` lines 238–243
- Architecture §@use-gesture/react: line 896
- Architecture §MobileMapLayout: line 480
- Test design §R-006: `_bmad-output/test-artifacts/test-design-epic-3.md` line 153
- Test design §Story 3.6 E2E tests: lines 257–286
- Existing pull-up stub: `src/components/search/split-view-layout.tsx` lines 168-178
- Existing i18n keys: `src/messages/en.json` and `es.json` under `SearchPage.pullUpHandle`
- `PropertySearchItem` type: `src/types/search.ts`
- `PropertyCard` component: `src/components/property/property-card.tsx`
- `SearchResultsSkeleton`: `src/components/search/search-results-skeleton.tsx`
- Vitest environment config (jsdom for `tests/unit/search/**`): `vitest.config.mts` lines 19-22

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-6-mobile-pull-up-sheet.md`
- Unit tests: `tests/unit/search/map-pull-up-sheet.spec.tsx`
- Updated unit tests: `tests/unit/search/split-view-layout.spec.tsx`
- E2E tests: `tests/e2e/mobile-pull-up-sheet.spec.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
