---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-04-25'
storyId: '3.1'
storyKey: 3-1-search-page-layout-and-split-view
storyFile: _bmad-output/implementation-artifacts/3-1-search-page-layout-and-split-view.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-1-search-page-layout-and-split-view.md
generatedTestFiles:
  - tests/unit/search/split-view-layout.spec.tsx
  - tests/unit/search/view-mode-toggle.spec.tsx
  - tests/unit/search/search-filter-bar.spec.tsx
inputDocuments:
  - _bmad-output/implementation-artifacts/3-1-search-page-layout-and-split-view.md
  - _bmad/tea/config.yaml
  - vitest.config.ts
  - _bmad-output/test-artifacts/test-design-epic-3.md
---

# ATDD Checklist — Story 3.1: Search Page Layout & Split-View

**Date:** 2026-04-25
**Story ID:** 3.1
**Story Key:** 3-1-search-page-layout-and-split-view
**Stack Detected:** frontend/fullstack (Next.js 15 App Router, React 19, Vitest unit tests)
**TDD Phase:** RED (all scaffolds skipped)

---

## Step 1: Preflight & Context

**Stack detected:** `fullstack` — Next.js 15 App Router + CSR Client Components, Vitest unit tests.

**Prerequisites verified:**
- Story status: `ready-for-dev` ✅
- Test framework: Vitest (`vitest.config.ts`) — `tests/unit/**/*.spec.ts` and `tests/unit/**/*.spec.tsx` ✅
- No `@testing-library/react` installed — tests use DOM queries + `vi.mock()` pattern ✅
- No Playwright config — no E2E scaffold needed for this story (layout/unit scope) ✅
- Existing pattern: `describe`/`it.skip()` with `vi.mock()` for module isolation ✅

**Story scope:** Pure layout/shell story. All components are stubs. No API endpoints, no server-side logic. E2E tests deferred to Story 3.3+ when routes and interactions are testable end-to-end.

**API tests:** Not generated — this story introduces no API endpoints. Search query API is Story 3.3.

---

## Step 2: Generation Mode

**Mode:** AI Generation — sequential.

Rationale: Frontend layout story with no live server to record against (components not yet built). No Playwright config present. All tests generated from acceptance criteria + story task specification.

---

## Step 3: Test Strategy

### Acceptance Criteria → Test Scenarios Mapping

| AC # | Criterion | Test Level | Priority | Test File |
|------|-----------|-----------|----------|-----------|
| AC #1 | Desktop split-view: map 60% left, grid 40% right (≥1024px) | Component (Vitest) | P0 | split-view-layout.spec.tsx |
| AC #1 | Map placeholder (data-testid="map-placeholder") renders when map visible | Component (Vitest) | P0 | split-view-layout.spec.tsx |
| AC #1 | Map panel height = calc(100vh - header - filter bar) | Component (Vitest) | P1 | split-view-layout.spec.tsx |
| AC #2 | "Full Map" toggle → map w-full, grid hidden | Component (Vitest) | P0 | split-view-layout.spec.tsx |
| AC #3 | "Full Grid" toggle → grid w-full, map hidden | Component (Vitest) | P0 | split-view-layout.spec.tsx |
| AC #4 | Tablet 60/40 split + side-panel toggle (aria-expanded) | Component (Vitest) | P1 | split-view-layout.spec.tsx |
| AC #5 | Mobile: pull-up handle (data-testid="pull-up-handle") present + non-interactive | Component (Vitest) | P0 | split-view-layout.spec.tsx |
| AC #2 | ViewModeToggle: "Split View" is default active (bg-brand-navy) | Component (Vitest) | P0 | view-mode-toggle.spec.tsx |
| AC #2 | "Full Map" click → router.replace(?view=map, scroll:false) + onViewModeChange("map") | Component (Vitest) | P0 | view-mode-toggle.spec.tsx |
| AC #3 | "Full Grid" click → router.replace(?view=grid, scroll:false) + onViewModeChange("grid") | Component (Vitest) | P0 | view-mode-toggle.spec.tsx |
| AC #7 | Existing URL params preserved when changing view mode | Component (Vitest) | P0 | view-mode-toggle.spec.tsx |
| AC #1 | Toggle hidden on mobile (`hidden lg:flex`) | Component (Vitest) | P1 | view-mode-toggle.spec.tsx |
| AC #6 | Filter bar: sticky top-0 z-10 positioning | Component (Vitest) | P0 | search-filter-bar.spec.tsx |
| AC #6 | Filter bar h-14 desktop height, bg-background, border-b | Component (Vitest) | P1 | search-filter-bar.spec.tsx |
| AC #6 | Loading placeholder aria-label="Filter bar loading" | Component (Vitest) | P1 | search-filter-bar.spec.tsx |
| AC #5 | Mobile compact bar: h-12, "Filters" button + SlidersHorizontal icon | Component (Vitest) | P1 | search-filter-bar.spec.tsx |
| AC #8 | SearchFilterBar is a Client Component ('use client') | Component (Vitest) | P2 | search-filter-bar.spec.tsx |

### Tests NOT generated in this story (deferred)

| Test Type | Reason |
|-----------|--------|
| E2E: search page route loads at /en/search | No Playwright config; route not implemented until Tasks 1-2 done |
| E2E: URL param view=map persists on reload | Deferred to Story 3.3 (URL state integration) |
| API: search query endpoint | No API in this story; Story 3.3 owns filter/query API |
| Integration: SearchPageClient + SplitViewLayout integration | Covered implicitly by component tests; no separate integration level |

---

## Step 4: TDD Red Phase — Generated Tests

### 4.1 Test File: split-view-layout.spec.tsx

**File:** `tests/unit/search/split-view-layout.spec.tsx`
**TDD Phase:** RED (all tests use `it.skip()`)
**Tests:** 8 scaffolds

| # | Test Name | Priority | AC |
|---|-----------|----------|-----|
| 1 | renders map panel with w-[60%] and grid panel with w-[40%] when viewMode='split' | P0 | #1 |
| 2 | renders data-testid='map-placeholder' inside map panel when map is visible | P0 | #1 |
| 3 | hides grid panel (adds 'hidden' class) when viewMode='map' | P0 | #2 |
| 4 | hides map panel (adds 'hidden' class) when viewMode='grid' | P0 | #3 |
| 5 | renders data-testid='pull-up-handle' element at mobile viewport | P0 | #5 |
| 6 | renders side-panel toggle button with aria-expanded on tablet viewport | P1 | #4 |
| 7 | map panel height uses calc(100vh - var(--header-height) - 3.5rem) on desktop | P1 | #1 |
| 8 | renders ViewModeToggle above split panels on desktop | P2 | #1 |
| 9 | renders SearchResultsSkeleton inside grid panel as placeholder | P2 | #1 |

Priority coverage: P0×5, P1×2, P2×2

### 4.2 Test File: view-mode-toggle.spec.tsx

**File:** `tests/unit/search/view-mode-toggle.spec.tsx`
**TDD Phase:** RED (all tests use `it.skip()`)
**Tests:** 5 scaffolds

| # | Test Name | Priority | AC |
|---|-----------|----------|-----|
| 1 | 'Split View' button has active class (bg-brand-navy text-white) when viewMode='split' | P0 | #2 |
| 2 | clicking 'Full Map' button calls router.replace with view=map param and calls onViewModeChange('map') | P0 | #2 |
| 3 | clicking 'Full Grid' button calls router.replace with view=grid param and calls onViewModeChange('grid') | P0 | #3 |
| 4 | preserves existing URL params (e.g. locale, filter) when changing view mode | P0 | #7 |
| 5 | toggle container has 'hidden lg:flex' classes | P1 | #1 |
| 6 | renders three segmented buttons: 'Split View', 'Full Map', 'Full Grid' | P1 | #2/#3 |

Priority coverage: P0×4, P1×2

### 4.3 Test File: search-filter-bar.spec.tsx

**File:** `tests/unit/search/search-filter-bar.spec.tsx`
**TDD Phase:** RED (all tests use `it.skip()`)
**Tests:** 5 scaffolds

| # | Test Name | Priority | AC |
|---|-----------|----------|-----|
| 1 | filter bar container has position: sticky and top: 0 | P0 | #6 |
| 2 | filter bar has h-14 height and correct background/border classes on desktop | P1 | #6 |
| 3 | renders a loading placeholder with aria-label='Filter bar loading' | P1 | #6 |
| 4 | renders compact 'Filters' button with SlidersHorizontal icon on mobile | P1 | #5 |
| 5 | filter bar has h-12 class on mobile viewport | P2 | #5 |
| 6 | SearchFilterBar is a Client Component (file must start with 'use client') | P2 | #8 |

Priority coverage: P0×1, P1×3, P2×2

### 4.4 Summary Statistics

```
TDD Phase: RED
Total test scaffolds: 20
  - split-view-layout.spec.tsx: 9 (all it.skip())
  - view-mode-toggle.spec.tsx:  6 (all it.skip())
  - search-filter-bar.spec.tsx: 5 (all it.skip())
API tests:  N/A (no API endpoints in this story)
E2E tests:  N/A (no Playwright config; deferred to Story 3.3)
Priority:   P0×10, P1×7, P2×4, P3×0
Expected to fail: YES (TDD red phase — components not implemented)
```

---

## Step 5: Validation & Completion

### Validation Checklist

- [x] Prerequisites satisfied: story ready-for-dev, Vitest configured
- [x] Test files created in correct location: `tests/unit/search/`
- [x] All tests use `it.skip()` — TDD red-phase scaffolds
- [x] No placeholder assertions (`expect(true).toBe(true)`) — all assert EXPECTED behavior
- [x] `vi.mock("next/navigation")` declared before component imports in all files
- [x] All acceptance criteria covered by at least one test
- [x] Fixture needs documented (none required — tests use DOM queries + vi.mock)
- [x] Story metadata and handoff paths captured in YAML frontmatter
- [x] No CLI browser sessions opened (no Playwright config present)
- [x] Temp artifacts stored in `_bmad-output/test-artifacts/` — not `/tmp/`

### Key Risks & Assumptions

| Risk | Mitigation |
|------|-----------|
| No `@testing-library/react` installed — tests use raw DOM queries | When dev installs `@testing-library/react`, tests should be upgraded to use `render()` + `getByRole()` for more robust assertions |
| Vitest config uses `environment: "node"` — `.tsx` component tests need `jsdom` | Dev must verify vitest.config.ts supports TSX environments, or add `@vitest/browser` / `jsdom` environment for component tests |
| Tests assert CSS class names — brittle if class names change | Acceptable for this story (layout fidelity is tested via classes). Critical classes (w-[60%], hidden, sticky, top-0) are stable architecture requirements |
| `data-testid` attributes must be added in implementation | Dev must add `data-testid="map-panel"`, `data-testid="grid-panel"`, `data-testid="pull-up-handle"`, `data-testid="search-filter-bar"`, `data-testid="toggle-split"`, `data-testid="toggle-map"`, `data-testid="toggle-grid"`, `data-testid="view-mode-toggle-container"`, `data-testid="mobile-filters-button"` |

### Vitest Environment Note

The current `vitest.config.ts` sets `environment: "node"`. Component tests in `.spec.tsx` files that render React JSX will need either:
1. A `jsdom` or `happy-dom` environment (add `@vitest/jsdom` or configure `environment: 'jsdom'` in vitest config for the search test directory), OR
2. A Playwright Browser mode test approach

Dev should configure this before activating the red-phase tests. The scaffolds are structured to work once the environment is correct.

---

## Next Steps: Task-by-Task Activation

During implementation of each task, activate the corresponding tests:

### Task 3 — SplitViewLayout
1. Create `src/components/search/split-view-layout.tsx`
2. Remove `it.skip()` from tests in `split-view-layout.spec.tsx`
3. Run: `npm test tests/unit/search/split-view-layout.spec.tsx`
4. Verify: P0 tests fail first (RED), then pass after implementation (GREEN)
5. Ensure `data-testid` attributes are present

### Task 4 — ViewModeToggle
1. Create `src/components/search/view-mode-toggle.tsx`
2. Remove `it.skip()` from tests in `view-mode-toggle.spec.tsx`
3. Run: `npm test tests/unit/search/view-mode-toggle.spec.tsx`
4. Verify: router.replace called with correct params

### Task 5 — SearchFilterBar
1. Create `src/components/search/search-filter-bar.tsx`
2. Remove `it.skip()` from tests in `search-filter-bar.spec.tsx`
3. Run: `npm test tests/unit/search/search-filter-bar.spec.tsx`
4. Verify: sticky positioning, aria-label, mobile compact variant

### CI Gate (Task 8)
After all tasks complete:
- `npm run typecheck` → 0 new errors
- `npm run lint` → 0 errors
- `npm run format:check` → pass
- `npm run build` → pass
- `npm test` → 0 failures (all 20 activated scaffolds green)

---

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-1-search-page-layout-and-split-view.md`
- Unit tests: `tests/unit/search/split-view-layout.spec.tsx`
- Unit tests: `tests/unit/search/view-mode-toggle.spec.tsx`
- Unit tests: `tests/unit/search/search-filter-bar.spec.tsx`
