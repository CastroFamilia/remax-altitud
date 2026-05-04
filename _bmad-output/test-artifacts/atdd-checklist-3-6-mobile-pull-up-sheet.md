---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-02'
storyId: '3.6'
storyKey: 3-6-mobile-pull-up-sheet
storyFile: _bmad-output/implementation-artifacts/3-6-mobile-pull-up-sheet.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-6-mobile-pull-up-sheet.md
generatedTestFiles:
  - tests/unit/search/map-pull-up-sheet.spec.tsx
  - tests/unit/search/split-view-layout.spec.tsx
  - tests/e2e/mobile-pull-up-sheet.spec.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/3-6-mobile-pull-up-sheet.md
  - _bmad/tea/config.yaml
  - vitest.config.mts
  - tests/unit/search/split-view-layout.spec.tsx
  - tests/e2e/property-cards.spec.ts
  - _bmad-output/test-artifacts/test-design-epic-3.md
---

# ATDD Checklist: Story 3.6 — Mobile Pull-Up Sheet

## TDD Red Phase (Current)

All acceptance test scaffolds generated and verified. All new tests use `it.skip()` / `test.skip()` (TDD red phase — intentionally failing until implementation).

### Test Count Summary

| Test Type | File | Tests | Status |
|-----------|------|-------|--------|
| Unit — Component (NEW) | `tests/unit/search/map-pull-up-sheet.spec.tsx` | 10 | RED (skipped) |
| Unit — Component (UPDATED) | `tests/unit/search/split-view-layout.spec.tsx` | mock added; all existing tests pass | Mixed |
| E2E — User Journeys (NEW) | `tests/e2e/mobile-pull-up-sheet.spec.ts` | 8 | RED (skipped) |

**Total new red-phase scaffolds: 18 tests (10 unit + 8 E2E, all skipped)**

## Acceptance Criteria Coverage

| AC | Description | Test Files | Priority |
|----|-------------|------------|----------|
| AC #1 | Mobile viewport (<768px): pull-up sheet handle appears at bottom | map-pull-up-sheet.spec.tsx, mobile-pull-up-sheet.spec.ts | P0 |
| AC #2 | Peeked state (15vh): shows handle bar + "{N} properties in view" count only | map-pull-up-sheet.spec.tsx, mobile-pull-up-sheet.spec.ts | P0 |
| AC #3 | Half state (50vh): horizontal scroll carousel of 2-3 card previews | map-pull-up-sheet.spec.tsx, mobile-pull-up-sheet.spec.ts | P0 |
| AC #4 | Full state (85vh): scrollable list + close button to return to peeked | map-pull-up-sheet.spec.tsx, mobile-pull-up-sheet.spec.ts | P0 |
| AC #5 | Drag snap animation to nearest point with spring physics (300ms, cubic-bezier) | mobile-pull-up-sheet.spec.ts | P1 |
| AC #6 | Pull-to-refresh disabled via overscroll-behavior: none | map-pull-up-sheet.spec.tsx, mobile-pull-up-sheet.spec.ts | P1 |
| AC #7 | ARIA: role="region", aria-label="Property list", aria-expanded toggling | map-pull-up-sheet.spec.tsx, mobile-pull-up-sheet.spec.ts | P0 |

## Unit Test Coverage: `map-pull-up-sheet.spec.tsx`

| Test | AC | Priority | Status |
|------|----|----------|--------|
| renders data-testid='pull-up-sheet' in peeked state by default | #1 | P0 | RED (skip) |
| renders data-testid='pull-up-handle' drag handle bar | #2 | P0 | RED (skip) |
| peeked state: shows property count label, no PropertyCard | #2 | P0 | RED (skip) |
| has role='region' and aria-label='Property list' | #7 | P0 | RED (skip) |
| has aria-expanded='false' in peeked; 'true' when initialState='half' | #7 | P0 | RED (skip) |
| full state: renders PropertyCards for all properties | #4 | P1 | RED (skip) |
| full state: renders SearchResultsSkeleton when isLoading=true | #4 | P1 | RED (skip) |
| full state: close button updates data-state to 'peeked' | #4 | P1 | RED (skip) |
| half state: renders up to 3 PropertyCards in horizontal scroll | #3 | P2 | RED (skip) |
| applies height based on snap state; overscroll-behavior: none on scroll container | #5, #6 | P2 | RED (skip) |
| root element has 'lg:hidden' class | #1 | P2 | RED (skip) |

## E2E Test Coverage: `mobile-pull-up-sheet.spec.ts`

| Test ID | AC | Priority | Risk | Status |
|---------|----|----------|------|--------|
| 3.6-E2E-001 | #1, #2 | P0 | — | RED (skip) |
| 3.6-E2E-002 | #3 | P0 | R-006 | RED (skip) |
| 3.6-E2E-003 | #4 | P0 | R-006 | RED (skip) |
| 3.6-E2E-004 | #7 | P0 | — | RED (skip) |
| 3.6-E2E-005 | #6 | P1 | — | RED (skip) |
| 3.6-E2E-006 | #5 | P1 | R-006 | RED (skip) |
| 3.6-E2E-007 | #4 | P1 | — | RED (skip) |
| 3.6-E2E-008 | #1 | P1 | — | RED (skip) |

## Existing Tests Preserved (Must Continue to Pass)

From Story 3.1/3.2/3.3/3.5 — `tests/unit/search/split-view-layout.spec.tsx`:
- `[P0]` renders map panel with lg:w-[60%] and grid panel with lg:w-[40%] when viewMode='split'
- `[P0]` renders data-testid='map-container' inside map panel when map is visible
- `[P0]` hides grid panel (adds 'lg:hidden' class) when viewMode='map'
- `[P0]` hides map panel (adds 'lg:hidden' class) when viewMode='grid'
- `[P0]` renders data-testid='pull-up-handle' element at mobile viewport ← **preserved via MapPullUpSheet mock**
- `[P1]` renders side-panel toggle button with aria-expanded on tablet viewport
- `[P1]` map panel height uses calc(100vh - var(--header-height) - 3.5rem)
- `[P2]` renders ViewModeToggle above split panels on desktop
- `[P2]` renders SearchResultsSkeleton inside grid panel as placeholder
- `[P0]` (Story 3.5) renders PropertyGrid in grid panel when filterProperties provided
- `[P1]` (Story 3.5) does NOT render PropertyGrid when filterProperties is not provided

**Verification:** The `vi.mock('@/components/map/map-pull-up-sheet')` mock emits `data-testid="pull-up-handle"` so the existing `pull-up-handle` assertion continues passing after the inline stub is moved to `MapPullUpSheet`.

## Story 3.6 ATDD Artifacts

- **Checklist:** `_bmad-output/test-artifacts/atdd-checklist-3-6-mobile-pull-up-sheet.md`
- **Unit tests:** `tests/unit/search/map-pull-up-sheet.spec.tsx`
- **Updated unit tests:** `tests/unit/search/split-view-layout.spec.tsx`
- **E2E tests:** `tests/e2e/mobile-pull-up-sheet.spec.ts`

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `it.skip()` / `test.skip()` from the relevant test in `map-pull-up-sheet.spec.tsx` or `mobile-pull-up-sheet.spec.ts`
2. Run `npx vitest run tests/unit/search/map-pull-up-sheet.spec.tsx` (unit) or `npx playwright test tests/e2e/mobile-pull-up-sheet.spec.ts` (E2E)
3. Verify the activated test **FAILS** before implementation
4. Implement the feature (Task 1–7)
5. Verify the activated test **PASSES** after implementation
6. Commit passing tests

## Implementation Guidance

**Files to create:**
- `src/components/map/map-pull-up-sheet.tsx` — `MapPullUpSheet` Client Component
- `tests/unit/search/map-pull-up-sheet.spec.tsx` — unit tests (this file)

**Files to modify:**
- `src/components/search/split-view-layout.tsx` — replace inline pull-up stub with `<MapPullUpSheet>`
- `src/components/search/search-page-client.tsx` — add `overscroll-none` to root div
- `src/messages/en.json` — add `pullUpSheet.*` i18n keys
- `src/messages/es.json` — add `pullUpSheet.*` i18n keys (Spanish)
- `tests/unit/search/split-view-layout.spec.tsx` — add `MapPullUpSheet` mock (DONE in ATDD step)

**Priority order for activation:**
1. P0 unit tests (peeked state, ARIA, handle) → after Task 2 (create MapPullUpSheet)
2. P0 E2E tests (3.6-E2E-001, 004) → after Task 3 (wire into SplitViewLayout)
3. P0 E2E drag tests (3.6-E2E-002, 003) → after Task 1 + 2 (gesture library + component)
4. P1 unit tests (full state, loading, close button) → after Task 2
5. P1 E2E tests (overscroll, snap, close) → after Task 4 + 2
6. P2 unit tests → last (style/CSS assertions)

## Risk Mitigation Coverage

| Risk | Mitigation | Test Coverage |
|------|-----------|---------------|
| R-006: iOS Safari drag conflict | `touch-action: none` on handle, `overscroll-behavior: none` on scroll container, `@use-gesture/react` `e.preventDefault()` | 3.6-E2E-002, 003, 005, 006; unit test P2 |
