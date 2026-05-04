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
storyId: '3.4'
storyKey: 3-4-lifestyle-tags-and-smart-presets
storyFile: _bmad-output/implementation-artifacts/3-4-lifestyle-tags-and-smart-presets.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-4-lifestyle-tags-and-smart-presets.md
generatedTestFiles:
  - tests/unit/search/lifestyle-tag-chips.spec.tsx
  - tests/unit/search/smart-preset-bar.spec.tsx
  - tests/e2e/lifestyle-tags-and-smart-presets.spec.ts
  - tests/unit/search/use-search-filters.spec.tsx (updated)
  - tests/unit/search/filter-chips.spec.tsx (updated)
  - tests/unit/search/search-filter-bar.spec.tsx (updated)
inputDocuments:
  - _bmad-output/implementation-artifacts/3-4-lifestyle-tags-and-smart-presets.md
  - _bmad/tea/config.yaml
  - tests/unit/search/use-search-filters.spec.tsx
  - tests/unit/search/filter-chips.spec.tsx
  - tests/unit/search/search-filter-bar.spec.tsx
  - tests/e2e/search-filters.spec.ts
  - vitest.config.mts
---

# ATDD Checklist: Story 3.4 — Lifestyle Tags & Smart Presets

## TDD Red Phase (Current)

All red-phase test scaffolds generated. Tests are marked with comments indicating they will
FAIL until the corresponding implementation is complete.

- Unit Tests (Vitest + jsdom): 62 tests (all red phase)
  - lifestyle-tag-chips.spec.tsx: 16 tests (NEW)
  - smart-preset-bar.spec.tsx: 14 tests (NEW)
  - use-search-filters.spec.tsx: 26 tests added (UPDATED — Story 3.4 additions)
  - filter-chips.spec.tsx: 10 tests added (UPDATED — Story 3.4 additions)
  - search-filter-bar.spec.tsx: 2 tests added + mock updates (UPDATED)
- E2E Tests (Playwright): 15 tests (all test.skip() — RED PHASE)
  - lifestyle-tags-and-smart-presets.spec.ts: 15 tests (NEW)

## Execution Mode

SEQUENTIAL (API → E2E) — automated run without subagent support

## Acceptance Criteria Coverage

| AC | Description | Unit Test Coverage | E2E Test Coverage |
|----|-------------|-------------------|-------------------|
| AC #1 | Lifestyle tag chips displayed with 5 options | lifestyle-tag-chips.spec.tsx [P0] | 3.4-E2E-001 [P0] |
| AC #1 | "Retire" displays as "Retirement Paradise" | lifestyle-tag-chips.spec.tsx [P0] | 3.4-E2E-001b [P0] |
| AC #2 | Chip tapped → toggles active state + filters immediately | lifestyle-tag-chips.spec.tsx [P0], search-filter-bar [P0] | 3.4-E2E-002 [P0] |
| AC #3 | Multiple tags selected simultaneously (OR logic) | lifestyle-tag-chips.spec.tsx [P1], use-search-filters toggleTag [P0] | 3.4-E2E-003 [P0] |
| AC #4 | Smart presets combine filter + lifestyle tag combos | smart-preset-bar.spec.tsx [P0] | 3.4-E2E-004 [P1] |
| AC #5 | Mountain Retirement preset navigates with correct params | smart-preset-bar.spec.tsx [P0] | 3.4-E2E-005 [P0] |
| AC #6 | Active tags appear as chips in active filter display | filter-chips.spec.tsx [P0] | 3.4-E2E-006 [P1] |
| AC #7 | Presets configurable without code changes | smart-preset-bar.spec.tsx [P1] | — |

## Test Strategy

### Test Level Breakdown

**Unit Tests (Vitest + jsdom)** — component behavior, hook logic, data processing:
- `LifestyleTagChips`: rendering, active state, click handler, display label mapping
- `SmartPresetBar`: rendering, preset navigation, URL building
- `useSearchFilters` (extended): tags parsing, toggleTag, activeFilterCount with tags
- `FilterChips` (extended): tag chip rendering, display labels, dismiss behavior
- `SearchFilterBar` (updated): LifestyleTagChips integration, mock updated with toggleTag

**E2E Tests (Playwright — skipped until implementation complete)**:
- Critical user journeys: tag chip interactions, preset navigation, URL sharability
- Mobile layout: tag chips in filter Sheet
- DB-level filtering: searchProperties returns correct results with tags filter

### Priority Distribution

| Priority | Tests | Description |
|----------|-------|-------------|
| P0 | 42 tests | Critical path — chip rendering, URL sync, preset navigation |
| P1 | 25 tests | Important — multiple select, mobile, display labels |
| P2 | 0 tests | — |
| P3 | 0 tests | — |

## Preserved Contracts (MUST NOT Break)

The following data-testid contracts from earlier stories are preserved and extended:

- `data-testid="search-filter-bar"` — root container (Story 3.1)
- `data-testid="mobile-filters-button"` — mobile button (Story 3.1)
- `data-testid="filter-chips"` — chips container (Story 3.3)
- `data-testid="clear-all-filters"` — clear all button (Story 3.3)
- `data-testid="type-filter"`, `"price-range-slider"`, etc. — filter controls (Story 3.3)

New contracts added by Story 3.4:
- `data-testid="lifestyle-tag-chips"` — tag chips container
- `data-testid="lifestyle-tag-chip-{tag-slug}"` — individual tag chips (e.g., `lifestyle-tag-chip-investment-property`)
- `data-testid="smart-preset-bar"` — preset bar container
- `data-testid="preset-{preset-id}"` — individual preset buttons (e.g., `preset-mountain-retirement`)

## Next Steps (Task-by-Task Activation)

During implementation of each task, activate the corresponding tests:

### Task 1 & 2: types/search.ts + useSearchFilters tags support
Activate in `tests/unit/search/use-search-filters.spec.tsx`:
- "Story 3.4 additions" describe block: tags parsing tests
- toggleTag tests
- activeFilterCount tests

```bash
npx vitest run tests/unit/search/use-search-filters.spec.tsx
```

### Task 3: searchProperties Server Action tags filter
No dedicated unit tests for this task (DB query with GIN index — integration test territory).
The E2E test `3.4-E2E-008` covers this at the integration level when activated.

### Task 4: LifestyleTagChips component
Activate all tests in `tests/unit/search/lifestyle-tag-chips.spec.tsx`:
```bash
npx vitest run tests/unit/search/lifestyle-tag-chips.spec.tsx
```

### Task 5: search-presets.ts constants
Activate in `tests/unit/search/smart-preset-bar.spec.tsx`:
- "search-presets.ts constants file exists without use client or server-only" test

### Task 6: SmartPresetBar component
Activate all tests in `tests/unit/search/smart-preset-bar.spec.tsx`:
```bash
npx vitest run tests/unit/search/smart-preset-bar.spec.tsx
```

### Task 7: Integrate LifestyleTagChips into SearchFilterBar
Activate in `tests/unit/search/search-filter-bar.spec.tsx`:
- "Story 3.4: LifestyleTagChips integration" tests

```bash
npx vitest run tests/unit/search/search-filter-bar.spec.tsx
```

### Task 8: Extend FilterChips for tags
Activate all tests in `tests/unit/search/filter-chips.spec.tsx`:
- "Story 3.4 additions: FilterChips renders active lifestyle tag chips" describe block

```bash
npx vitest run tests/unit/search/filter-chips.spec.tsx
```

### E2E Activation (after full feature implementation)
Remove `test.skip()` from `tests/e2e/lifestyle-tags-and-smart-presets.spec.ts` and run:
```bash
npx playwright test tests/e2e/lifestyle-tags-and-smart-presets.spec.ts
```

## ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-4-lifestyle-tags-and-smart-presets.md`
- Unit tests (new): `tests/unit/search/lifestyle-tag-chips.spec.tsx`
- Unit tests (new): `tests/unit/search/smart-preset-bar.spec.tsx`
- E2E tests (new): `tests/e2e/lifestyle-tags-and-smart-presets.spec.ts`
- Unit tests (updated): `tests/unit/search/use-search-filters.spec.tsx`
- Unit tests (updated): `tests/unit/search/filter-chips.spec.tsx`
- Unit tests (updated): `tests/unit/search/search-filter-bar.spec.tsx`

## Key Risks & Assumptions

1. **`latestParamsRef` pattern**: `toggleTag` must use `latestParamsRef.current` to avoid stale
   closure on rapid clicks — this is documented in the story's Dev Notes and the test verifies
   the behavior, not the implementation detail.

2. **`LIFESTYLE_TAGS` frozen**: Tests mock the constant rather than importing it live, ensuring
   test isolation from Story 2.6 changes. Story 2.6 tag values must NOT be modified.

3. **`buildSearchUrl` export**: The `use-search-filters.ts` module must export `buildSearchUrl`
   as a named export. Tests verify this. The function prevents serialization divergence between
   preset URL generation and filter bar URL writing.

4. **Playwright not installed**: E2E tests use `@ts-expect-error` for the Playwright import.
   They will remain skipped until Playwright is installed and configured.

5. **DB seed required for E2E-008**: The DB-level filtering E2E test requires properties with
   lifestyle tags in the database. Activate only with a seeded staging environment.

## Summary

TDD Red Phase complete. 77 test scaffolds generated across 6 files (3 new, 3 updated).
All new tests are in RED phase — they assert expected behavior before implementation.
All existing test contracts from Stories 3.1–3.3 are preserved and extended.
