---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-01'
storyId: '3.5'
storyKey: 3-5-property-cards-and-grid-view
storyFile: _bmad-output/implementation-artifacts/3-5-property-cards-and-grid-view.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-5-property-cards-and-grid-view.md
generatedTestFiles:
  - tests/unit/search/property-card.spec.tsx
  - tests/unit/search/property-grid.spec.tsx
  - tests/unit/search/save-button.spec.tsx
  - tests/unit/search/share-button.spec.tsx
  - tests/unit/search/split-view-layout.spec.tsx
  - tests/e2e/property-cards.spec.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/3-5-property-cards-and-grid-view.md
  - _bmad/tea/config.yaml
  - src/types/search.ts
  - vitest.config.mts
  - tests/unit/search/filter-chips.spec.tsx
  - tests/unit/search/split-view-layout.spec.tsx
  - tests/e2e/search-filters.spec.ts
---

# ATDD Checklist: Story 3.5 — Property Cards & Grid View

## TDD Red Phase (Current)

All acceptance test scaffolds generated and verified. All new tests use `it.skip()` / `test.skip()` (TDD red phase — intentionally failing until implementation).

### Test Count Summary

| Test Type | File | Tests | Status |
|-----------|------|-------|--------|
| Unit — Component | `tests/unit/search/property-card.spec.tsx` | 25 | RED (skipped) |
| Unit — Component | `tests/unit/search/property-grid.spec.tsx` | 18 | RED (skipped) |
| Unit — Component | `tests/unit/search/save-button.spec.tsx` | 11 | RED (skipped) |
| Unit — Component | `tests/unit/search/share-button.spec.tsx` | 8 | RED (skipped) |
| Unit — Component (updated) | `tests/unit/search/split-view-layout.spec.tsx` | 2 NEW (skip) + 9 existing (pass) | Mixed |
| E2E — User Journeys | `tests/e2e/property-cards.spec.ts` | 14 | RED (skipped) |

**Total new red-phase scaffolds: 78 tests (76 skipped + 9 existing passing preserved)**

## Acceptance Criteria Coverage

| AC | Description | Test Files | Priority |
|----|-------------|------------|----------|
| AC #1 | PropertyCard displays: hero image, region badge, price, title, specs row, ZMT badge, save + share icons | property-card.spec.tsx, property-cards.spec.ts | P0 |
| AC #2 | Desktop grid: 3-column layout (≥1024px) | property-grid.spec.tsx, split-view-layout.spec.tsx, property-cards.spec.ts | P0 |
| AC #3 | Tablet grid: 2-column layout (768-1023px) | property-grid.spec.tsx, property-cards.spec.ts | P0 |
| AC #4 | Mobile grid: single-column layout (<768px) | property-grid.spec.tsx, property-cards.spec.ts | P0 |
| AC #5 | Sort dropdown persists in URL params | property-cards.spec.ts | P1 (already impl in 3.3) |
| AC #6 | Pagination: ≤20 cards/page, prev/next controls | property-grid.spec.tsx, property-cards.spec.ts | P0 |
| AC #7 | Hover lift animation (200ms, shadow-lg) | property-card.spec.tsx, property-cards.spec.ts | P2 |
| AC #8 | Card images use aspect-ratio: 3/2 (CLS prevention) | property-card.spec.tsx, property-cards.spec.ts | P1 |
| AC #9 | Card images use next/image with sizes prop and WebP | property-card.spec.tsx | P0 |

## Existing Tests Preserved (Must Continue to Pass)

From Story 3.1/3.2/3.3 — `tests/unit/search/split-view-layout.spec.tsx`:
- `[P0]` renders map panel with lg:w-[60%] and grid panel with lg:w-[40%] when viewMode='split'
- `[P0]` renders data-testid='map-container' inside map panel when map is visible
- `[P0]` hides grid panel (adds 'lg:hidden' class) when viewMode='map'
- `[P0]` hides map panel (adds 'lg:hidden' class) when viewMode='grid'
- `[P0]` renders data-testid='pull-up-handle' element at mobile viewport
- `[P1]` renders side-panel toggle button with aria-expanded on tablet viewport
- `[P1]` map panel height uses calc(100vh - var(--header-height) - 3.5rem)
- `[P2]` renders ViewModeToggle above split panels on desktop
- `[P2]` renders SearchResultsSkeleton inside grid panel as placeholder

**Verification:** 9 existing tests pass, 2 new Story 3.5 tests are skipped (confirmed via `npx vitest run`).

## Story 3.5 ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-5-property-cards-and-grid-view.md`
- Unit (Components): `tests/unit/search/property-card.spec.tsx`
- Unit (Grid): `tests/unit/search/property-grid.spec.tsx`
- Unit (Client Components): `tests/unit/search/save-button.spec.tsx`, `tests/unit/search/share-button.spec.tsx`
- Updated: `tests/unit/search/split-view-layout.spec.tsx`
- E2E: `tests/e2e/property-cards.spec.ts`

## Test Strategy

**Stack detection:** `frontend` (Next.js project, vitest + jsdom for unit, playwright for E2E).
**Generation mode:** AI generation (sequential) — no live browser recording (components don't exist yet).

### Prioritization

**P0 (blocking):** PropertyCard renders correctly, grid responsive layout, pagination ≤20 items, data-testid presence, SaveButton/ShareButton basic functionality.

**P1 (high):** Aspect ratio CLS prevention, ZMT badge colors, sort URL persistence, shortlist full toast, initial saved state from localStorage.

**P2 (medium):** Hover animation classes, pagination page display, grid architecture compliance, line-clamp on title.

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `it.skip()` from the relevant test file(s)
2. Run tests: `npm test` or `npx vitest run tests/unit/search/<file>.spec.tsx`
3. Verify the activated test FAILS first (red phase confirmed), then passes after implementation (green phase)
4. If any activated tests still fail unexpectedly:
   - Fix implementation (feature bug), or
   - Fix test (test bug/assumption mismatch)
5. Commit passing tests

### Activation Guide by Task

| Story Task | Activate These Tests |
|------------|----------------------|
| Task 1: `PropertyCard` component | `property-card.spec.tsx` (all) |
| Task 2: `PropertyCardSkeleton` aspect ratio | Check `property-card.spec.tsx` AC#8 tests |
| Task 3: `PropertyGrid` component | `property-grid.spec.tsx` (all) |
| Task 4: `SaveButton` + `ShareButton` | `save-button.spec.tsx`, `share-button.spec.tsx` (all) |
| Task 5: `SplitViewLayout` update | `split-view-layout.spec.tsx` Story 3.5 tests |
| Task 9: All tests CI pass | All test files |

## Implementation Guidance

### Components to implement

- `src/components/property/property-card.tsx` — RSC, no `'use client'`
- `src/components/property/property-grid.tsx` — Client Component, `'use client'` first line
- `src/components/property/save-button.tsx` — Client Component, `'use client'` first line
- `src/components/property/share-button.tsx` — Client Component, `'use client'` first line

### Key UI flows

- PropertyCard: hero image (aspect 3/2), region badge (Mountain/Beach), price (Montserrat bold, accent color), title (2-line clamp), specs row (beds/baths omitted for Lote/Terreno/Finca), ZMT badge (colored by status), save + share buttons
- PropertyGrid: responsive 1/2/3 column grid, loading skeleton, pagination ≤20/page
- SaveButton: localStorage shortlist toggle, max 20 items, inline toast on full
- ShareButton: navigator.share → clipboard fallback, "Link copied!" toast

### Data & types

- `PropertySearchItem` from `src/types/search.ts` — FROZEN (no new fields)
- `formatPriceAbbrev` from `src/lib/map/geo-utils.ts` — reuse, do NOT recreate
- Region detection: `getRegionFromAreaSlug()` helper (new utility)
- Beach slugs: `['dominical', 'uvita', 'ojochal', 'quepos', 'manuel-antonio', 'jaco', 'tamarindo', 'nosara', 'samara', 'santa-teresa', 'playa-hermosa']`
- Mountain slugs: `['perez-zeledon']`

### ATDD Artifacts (dev handoff)

```
Checklist: _bmad-output/test-artifacts/atdd-checklist-3-5-property-cards-and-grid-view.md
Unit tests: tests/unit/search/property-card.spec.tsx
            tests/unit/search/property-grid.spec.tsx
            tests/unit/search/save-button.spec.tsx
            tests/unit/search/share-button.spec.tsx
Updated:    tests/unit/search/split-view-layout.spec.tsx
E2E:        tests/e2e/property-cards.spec.ts
```
