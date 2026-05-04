---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-04-26'
storyId: '3.3'
storyKey: 3-3-search-filters-and-url-state
storyFile: _bmad-output/implementation-artifacts/3-3-search-filters-and-url-state.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-3-search-filters-and-url-state.md
generatedTestFiles:
  - tests/unit/search/search-actions.spec.ts
  - tests/unit/search/use-search-filters.spec.tsx
  - tests/unit/search/filter-chips.spec.tsx
  - tests/unit/search/price-range-slider.spec.tsx
  - tests/unit/search/search-filter-bar.spec.tsx
  - tests/e2e/search-filters.spec.ts
---

# ATDD Checklist: Story 3.3 — Search Filters & URL State

## TDD Red Phase (Current)

All acceptance test scaffolds generated and verified. All new tests use `it.skip()` / `test.skip()` (TDD red phase — intentionally failing until implementation).

### Test Count Summary

| Test Type | File | Tests | Status |
|-----------|------|-------|--------|
| Unit — Hook | `tests/unit/search/use-search-filters.spec.tsx` | 16 | RED (skipped) |
| Unit — Component | `tests/unit/search/filter-chips.spec.tsx` | 11 | RED (skipped) |
| Unit — Component | `tests/unit/search/price-range-slider.spec.tsx` | 7 | RED (skipped) |
| Unit — Component | `tests/unit/search/search-filter-bar.spec.tsx` | 6 NEW (skip) + 5 existing (pass) | Mixed |
| Unit — Server Action | `tests/unit/search/search-actions.spec.ts` | 18 | RED (skipped) |
| E2E — User Journeys | `tests/e2e/search-filters.spec.ts` | 11 | RED (skipped) |

**Total new red-phase scaffolds: 69 tests (58 skipped + 5 passing preserved from Story 3.1/3.2)**

## Acceptance Criteria Coverage

| AC | Description | Test Files | Priority |
|----|-------------|------------|----------|
| AC #1 | Filter bar shows Type, Price, Beds, Baths, Lot, Location controls | search-filter-bar.spec.tsx, search-filters.spec.ts | P0 |
| AC #2 | Land types (Lote/Terreno/Finca) hide bedrooms/bathrooms | search-filter-bar.spec.tsx, search-filters.spec.ts | P0 |
| AC #3 | Checkbox/dropdown filters update instantly | use-search-filters.spec.tsx, search-filters.spec.ts | P0 |
| AC #4 | Price slider updates with 300ms debounce | use-search-filters.spec.tsx, price-range-slider.spec.tsx, search-filters.spec.ts | P0 |
| AC #5 | Active filter chips with × dismiss; "Clear all" at 2+ | filter-chips.spec.tsx, search-filter-bar.spec.tsx, search-filters.spec.ts | P0 |
| AC #6 | Filter options show result counts ("Casa (12)") | search-actions.spec.ts, search-filters.spec.ts | P1 |
| AC #7 | Location hierarchy dropdown (flat areaSlug MVP) | search-actions.spec.ts, search-filters.spec.ts | P2 |
| AC #8 | Filter states serialized into URL query params | use-search-filters.spec.tsx, search-filters.spec.ts | P0 |
| AC #9 | Filter queries via Server Actions using Drizzle | search-actions.spec.ts | P0 |
| AC #10 | Filter changes reflect within 500ms client-side | search-filters.spec.ts | P1 |

## Existing Tests Preserved (Must Continue to Pass)

From Story 3.1 — `tests/unit/search/search-filter-bar.spec.tsx`:
- `[P0]` filter bar container has sticky positioning with `top-[var(--header-height)]`
- `[P1]` filter bar has h-14 height and correct background/border classes
- `[P1]` renders compact Filters button on mobile with SlidersHorizontal icon
- `[P2]` filter bar has h-12 class on mobile viewport
- `[P2]` SearchFilterBar is a Client Component (starts with 'use client')

**UPDATED test (was Story 3.1 animate-pulse — now Story 3.3):**
- `[P1]` `[SKIPPED]` renders Type dropdown control on desktop (`data-testid="type-filter"`)

## Story 3.3 ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-3-search-filters-and-url-state.md`
- Unit (Hook): `tests/unit/search/use-search-filters.spec.tsx`
- Unit (Components): `tests/unit/search/filter-chips.spec.tsx`, `price-range-slider.spec.tsx`
- Unit (Server Action): `tests/unit/search/search-actions.spec.ts`
- Updated: `tests/unit/search/search-filter-bar.spec.tsx`
- E2E: `tests/e2e/search-filters.spec.ts`

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. **Task 1** (Define `SearchFilters` type): No test to activate — types used by other tests
2. **Task 2** (`use-search-filters` hook): Remove `it.skip` from `use-search-filters.spec.tsx`
3. **Task 3** (`searchProperties` Server Action): Remove `it.skip` from `search-actions.spec.ts`
4. **Task 4** (`SearchFilterBar` real controls): Remove `it.skip` from `search-filter-bar.spec.tsx` (Story 3.3 tests)
5. **Task 5** (`PriceRangeSlider`): Remove `it.skip` from `price-range-slider.spec.tsx`
6. **Task 6** (`FilterChips`): Remove `it.skip` from `filter-chips.spec.tsx`

For each task:
1. Remove `it.skip()` / `test.skip()` from the relevant test(s)
2. Run: `npm test` or `npx vitest run tests/unit/search/<file>`
3. Verify tests FAIL before implementation (confirms red phase was correct)
4. Implement the feature
5. Verify tests PASS after implementation (green phase)
6. Commit passing tests

## Architecture Compliance Checklist

- [ ] `SearchFilters` type defined in `src/types/search.ts` — import from there only
- [ ] `search-actions.ts` has `"use server"` at top
- [ ] `use-search-filters.ts` has `"use client"` at top (uses `useSearchParams`)
- [ ] `SearchFilterBar` remains `'use client'` with existing sticky positioning
- [ ] `price-range-slider.tsx` has `"use client"` directive
- [ ] `filter-chips.tsx` has `"use client"` directive
- [ ] Filter values NEVER stored in Zustand (AR10 violation prevention)
- [ ] `formatPriceAbbrev` imported from `@/lib/map/geo-utils` — NOT reimplemented
- [ ] Numeric filter inputs sanitized with `Number.isFinite()` before DB query

## Key Risks and Assumptions

1. **Radix Slider in jsdom**: `@radix-ui/react-slider` requires layout APIs not available in jsdom. The mock in `price-range-slider.spec.tsx` handles this. E2E tests cover real slider behavior.
2. **DB mock for search-actions**: Tests use a mocked Drizzle client. Integration/E2E tests are needed to verify real PostGIS query behavior.
3. **next/navigation mock**: All tests using `useSearchParams`/`useRouter` mock `next/navigation`. Ensure mock is consistent across all files.
4. **E2E prerequisite**: `tests/e2e/search-filters.spec.ts` requires Playwright to be installed and a running app with seeded DB. Do not activate until infrastructure is ready.
5. **Story 3.3 scope**: Full Province → Cantón → Distrito hierarchy is deferred to Epic 6. The `area-filter` test uses a flat `areaSlug` dropdown.

## Execution Mode

- **Mode**: Sequential (single agent, no subagents)
- **Stack**: Fullstack (Next.js 15 frontend + PostgreSQL backend via Drizzle)
- **Framework**: Vitest (unit), Playwright (E2E — not yet installed)
- **TDD Phase**: RED (all new tests skipped)
