---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-04-26'
storyId: '3.2'
storyKey: '3-2-interactive-map-with-property-pins'
storyFile: '_bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-3-2-interactive-map-with-property-pins.md'
generatedTestFiles:
  - 'tests/unit/search/map-view.spec.tsx'
  - 'tests/unit/search/map-store.spec.ts'
  - 'tests/unit/search/geo-utils.spec.ts'
  - 'tests/e2e/map-interactive.spec.ts'
tddPhase: RED
---

# ATDD Checklist: Story 3.2 — Interactive Map with Property Pins

**Date:** 2026-04-26
**Author:** BMad TEA Agent — ATDD Workflow
**TDD Phase:** RED (all test scaffolds use `it.skip()`)
**Story:** 3.2 — Interactive Map with Property Pins
**Status:** Red-phase scaffolds generated — awaiting implementation

---

## TDD Red Phase (Current State)

All test scaffolds are generated with `it.skip()` / `test.skip()`. Tests assert EXPECTED behavior but will FAIL until:

1. `src/store/map-store.ts` is created (AC #8)
2. `src/lib/map/config.ts` and `src/lib/map/geo-utils.ts` are created (AC #1, #4, #5)
3. `src/components/map/map-view.tsx` is created (AC #1, #2, #4, #9)
4. `src/components/map/map-view-loader.tsx` is created (AC #6)
5. `src/components/map/map-property-popup.tsx` is created (AC #4)
6. `src/components/map/map-price-pin.tsx` and `map-cluster-pin.tsx` are created (AC #2, #3)
7. `SplitViewLayout` is wired to `MapView` (AC #9)
8. Playwright framework is configured (Story 3.3 prerequisite for E2E tests)

---

## Acceptance Criteria Coverage

| AC | Description | Test File | Test ID(s) | Priority | Status |
|----|-------------|-----------|------------|----------|--------|
| AC #1 | Mapbox GL JS loads with 3D terrain | `map-view.spec.tsx` | map-container renders, aria-label | P0 | RED |
| AC #2 | Property pins at lat/lon coordinates | `map-view.spec.tsx` | no markers empty, one pin, lat/lon position | P0 | RED |
| AC #3 | Clustering zoomed out | `tests/e2e/map-interactive.spec.ts` | 3.2-E2E-002 | P0 | RED (E2E deferred) |
| AC #4 | Pin click → preview card | `map-view.spec.tsx` | popup shows title, close button | P1 | RED |
| AC #5 | Map pan → grid updates | `tests/e2e/map-interactive.spec.ts` | 3.2-E2E-003 | P0 | RED (E2E deferred) |
| AC #6 | Lazy-loaded async chunk | `map-view.spec.tsx` (build assert) | MapViewLoader uses next/dynamic ssr:false | P1 | RED |
| AC #7 | Perf ≤3s on 4G mobile | `tests/e2e/map-interactive.spec.ts` | 3.2-E2E-001 | P3 | RED (E2E deferred) |
| AC #8 | Zustand store for map state | `map-store.spec.ts` | initial state, setCenter, setZoom, setBounds | P0 | RED |
| AC #9 | data-testid="map-container" | `map-view.spec.tsx` | renders with correct testid | P0 | RED |
| Utility | formatPriceAbbrev | `geo-utils.spec.ts` | $250K, $1.2M, $500 | P0 | RED |
| Utility | boundsFromMapboxEvent | `geo-utils.spec.ts` | extracts north/south/east/west | P0 | RED |
| Regression | split-view map-placeholder → map-container | `split-view-layout.spec.tsx` | updated assertion | P0 | GREEN (immediate fix) |

---

## Generated Test Files

### Unit Tests (Vitest + jsdom / node)

#### `tests/unit/search/map-view.spec.tsx` — P0/P1 (jsdom env)

Tests (all `it.skip()`):
- `[P0]` renders map wrapper with `data-testid='map-container'` (AC #9, #1)
- `[P0]` map container has `aria-label='Property locations map'` (AC #1)
- `[P0]` renders no markers when properties array is empty (AC #2)
- `[P0]` renders one MapPricePin when single property passed (AC #2)
- `[P0]` each Marker is positioned at property's lat/lon (AC #2)
- `[P1]` clicking a price pin renders MapPropertyPopup with title (AC #4)
- `[P1]` popup not rendered before any pin click (AC #4)
- `[P1]` clicking popup close button hides popup (AC #4)
- `[P1]` MapView reads center/zoom from Zustand store (AC #8)
- `[P1]` onBoundsChange callback fires when map moves (AC #5 integration)
- `[P1]` MapViewLoader uses next/dynamic with ssr:false (AC #6) — build assertion

Mock strategy (mandatory from Story 3.1 learnings):
- `vi.mock('react-map-gl')` — Map, Marker, Popup all stubbed
- `vi.mock('mapbox-gl/dist/mapbox-gl.css')` — no-op
- `vi.mock('@/store/map-store')` — deterministic center/zoom
- `vi.mock('@/lib/map/config')` — test token
- `vi.mock('@/lib/map/geo-utils')` — stub formatPriceAbbrev / boundsFromMapboxEvent
- `vi.mock('next/navigation')` — useParams → locale 'en'
- `vi.mock('next-intl')` — useTranslations stub
- `vi.mock('@/components/map/map-property-popup')` — isolated popup stub
- `vi.mock('@/components/map/map-price-pin')` — isolated pin stub
- `vi.mock('@/components/map/map-cluster-pin')` — isolated cluster stub

#### `tests/unit/search/map-store.spec.ts` — P0/P1 (node env)

Tests (all `it.skip()`):
- `[P0]` initial center: `{ lng: -83.70, lat: 9.38 }`
- `[P0]` initial zoom: `10`
- `[P0]` initial bounds: `null`
- `[P0]` setCenter updates center; leaves zoom/bounds unchanged
- `[P0]` setZoom updates zoom; leaves center unchanged
- `[P0]` setBounds updates bounds; leaves center/zoom unchanged
- `[P1]` exports named `useMapStore` hook
- `[P1]` store file does NOT contain `'use client'` directive

#### `tests/unit/search/geo-utils.spec.ts` — P0 (node env)

Tests (all `it.skip()`):
- `[P0]` `formatPriceAbbrev(1_200_000)` → `"$1.2M"`
- `[P0]` `formatPriceAbbrev(1_000_000)` → `"$1.0M"`
- `[P0]` `formatPriceAbbrev(2_500_000)` → `"$2.5M"`
- `[P0]` `formatPriceAbbrev(250_000)` → `"$250K"`
- `[P0]` `formatPriceAbbrev(1_000)` → `"$1K"`
- `[P0]` `formatPriceAbbrev(999_000)` → `"$999K"`
- `[P0]` `formatPriceAbbrev(500)` → `"$500"`
- `[P0]` `formatPriceAbbrev(0)` → `"$0"`
- `[P0]` `formatPriceAbbrev(999)` → `"$999"`
- `[P0]` `boundsFromMapboxEvent(event)` extracts north/south/east/west
- `[P0]` `boundsFromMapboxEvent` returns all four keys
- `[P0]` `boundsFromMapboxEvent` correct values for tight local viewport

#### `tests/unit/search/split-view-layout.spec.tsx` — REGRESSION FIX

Updated (NOT skipped — immediate fix required before dev implements Story 3.2):
- Changed `data-testid="map-placeholder"` assertion → `data-testid="map-container"`
- Added `vi.mock("@/components/map/map-view-loader")` stub returning map-container
- Updated test comment to reference Story 3.2 change

### E2E Scaffolds (Playwright — deferred to Story 3.3 framework setup)

#### `tests/e2e/map-interactive.spec.ts` — P0/P1/P2 (all `test.skip()`)

- `[P0]` 3.2-E2E-001: map-container renders within 3s on 4G throttle (R-001, R-002)
- `[P0]` 3.2-E2E-002: pins cluster on zoom-out; expand on zoom-in (R-002)
- `[P0]` 3.2-E2E-003: map pan → grid update (R-012)
- `[P1]` 3.2-E2E-004: pin click → popup with photo, price, ZMT badge, CTA
- `[P2]` 3.2-E2E-005: map state (center/zoom) survives view toggle (AC #8, AR10)
- `[P1]` 3.2-UNIT-001: Mapbox NOT in main JS bundle (AR25, AC #6)

**Note:** `@playwright/test` import is marked `@ts-expect-error` — Playwright is not yet installed.
Activate after Story 3.3 runs the `*framework` workflow.

---

## Acceptance Criteria NOT Fully Scaffolded at Unit Level

| AC | Reason | Coverage Path |
|----|--------|---------------|
| AC #3 (Clustering zoomed out) | Supercluster + Mapbox zoom interaction requires a real browser with canvas rendering — not feasible in jsdom even with module mocks | E2E: 3.2-E2E-002 in `tests/e2e/map-interactive.spec.ts` (deferred to Story 3.3 Playwright setup) |
| AC #5 (Map pan → grid sync) | Requires real onMove events from Mapbox and Server Action execution with a live DB | E2E: 3.2-E2E-003 (deferred). The `onBoundsChange` callback is unit-tested indirectly via the mock onLoad path |
| AC #7 (≤3s on 4G mobile) | Performance timing cannot be reliably measured in jsdom | E2E: 3.2-E2E-001 with Playwright network throttle (deferred) |

---

## Regression Fix (Immediate — No Skip)

The `split-view-layout.spec.tsx` file is updated in this story (NOT skipped) to:
1. Replace `data-testid="map-placeholder"` assertion with `data-testid="map-container"`
2. Add `vi.mock("@/components/map/map-view-loader")` that returns the map-container stub

This fix must be applied BEFORE the dev implements `SplitViewLayout` changes in Task 9,
otherwise the existing 3.1 tests will break when `map-placeholder` is removed from the DOM.

---

## Task-by-Task Activation Guide

During implementation, remove `it.skip(` for the relevant task:

| Task | Tests to activate |
|------|------------------|
| Task 2: Zustand map store | All tests in `map-store.spec.ts` |
| Task 3: config.ts + geo-utils.ts | All tests in `geo-utils.spec.ts` |
| Task 4–6: Map components | `map-view.spec.tsx` tests for popup, pins |
| Task 6: MapView wrapper | `map-view.spec.tsx` — map-container, aria-label, empty state |
| Task 7: MapViewLoader | `map-view.spec.tsx` — bundle lazy-load assertion |
| Task 9: Wire into SplitViewLayout | `split-view-layout.spec.tsx` — already updated (no skip) |
| After Playwright setup (Story 3.3) | All tests in `tests/e2e/map-interactive.spec.ts` |

---

## Risk Coverage

| Risk | Test Coverage |
|------|---------------|
| R-001: Mapbox bundle not lazy-loaded (score 6) | `map-view.spec.tsx` lazy-load assertion (P1); 3.2-UNIT-001 in E2E spec |
| R-002: Map + pins >3s on 4G (score 6) | 3.2-E2E-001 (P0, Playwright, deferred) |
| R-012: Map bounds ↔ grid sync stale (score 4) | 3.2-E2E-003 (P0, Playwright, deferred); onBoundsChange unit test |

---

## Next Steps

1. **Activate** `split-view-layout.spec.tsx` regression fix immediately (no implementation needed — it's a test-only change)
2. **Implement** Tasks 1–9 as defined in the story file
3. **Activate** unit tests task-by-task by removing `it.skip()` for the task being implemented
4. **Run:** `pnpm test` (or `npm test`) after each activation — verify RED before GREEN
5. **After Story 3.3** sets up Playwright: activate E2E tests in `tests/e2e/map-interactive.spec.ts`
6. **Run:** `npm run build --analyze` to verify Mapbox is in a separate async chunk (R-001 mitigation)

---

## ATDD Artifacts

- **Checklist:** `_bmad-output/test-artifacts/atdd-checklist-3-2-interactive-map-with-property-pins.md`
- **Unit tests:** `tests/unit/search/map-view.spec.tsx`
- **Unit tests:** `tests/unit/search/map-store.spec.ts`
- **Unit tests:** `tests/unit/search/geo-utils.spec.ts`
- **E2E scaffolds:** `tests/e2e/map-interactive.spec.ts`
- **Regression fix:** `tests/unit/search/split-view-layout.spec.tsx` (updated, not new)

---

**Generated by:** BMad TEA Agent — ATDD Workflow (bmad-testarch-atdd)
**Workflow:** Steps 1–5 (sequential mode)
**TDD Phase:** RED — test scaffolds generated, awaiting implementation
