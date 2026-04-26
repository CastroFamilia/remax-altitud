---
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-quality-evaluation', 'step-03f-aggregate-scores', 'step-04-generate-report']
lastStep: 'step-04-generate-report'
lastSaved: '2026-04-26'
workflowType: 'testarch-test-review'
storyId: '3.2'
storyKey: '3-2-interactive-map-with-property-pins'
inputDocuments:
  - '_bmad-output/test-artifacts/atdd-checklist-3-2-interactive-map-with-property-pins.md'
  - '_bmad-output/test-artifacts/test-design-epic-3.md'
  - '_bmad/tea/config.yaml'
  - 'tests/unit/search/map-view.spec.tsx'
  - 'tests/unit/search/map-store.spec.ts'
  - 'tests/unit/search/geo-utils.spec.ts'
  - 'tests/unit/search/split-view-layout.spec.tsx'
  - 'tests/e2e/map-interactive.spec.ts'
executionMode: sequential
---

# Test Quality Review: Story 3.2 — Interactive Map with Property Pins

**Quality Score**: 94/100 (A — Excellent, post-fix)
**Pre-fix Score**: 91/100 (A — Good)
**Review Date**: 2026-04-26
**Review Scope**: Suite (5 test files, 33 unit tests + 6 skipped E2E scaffolds)
**Reviewer**: BMad TEA Agent (testarch-test-review v4.0)

---

Note: This review audits existing tests. Coverage mapping and coverage gates are out of scope. Use `trace` for coverage decisions.

## Executive Summary

**Overall Assessment**: Excellent (post-fix)

**Recommendation**: Approve

### Key Strengths

- Comprehensive mock strategy for Mapbox GL JS (canvas/WebGL incompatible with jsdom) — correct and well-documented
- Factory function `makeProperty()` with sensible defaults and override support in `map-view.spec.tsx`
- Correct vi.mock hoisting pattern established in Story 3.1 applied consistently across all new files
- Pure function tests in `geo-utils.spec.ts` are exemplary: deterministic, fast, no setup required
- E2E scaffolds appropriately deferred with `test.skip()` and `@ts-expect-error` for missing Playwright dependency
- ATDD coverage spans all testable ACs at unit level; non-testable ACs (clustering, pan-sync, perf) correctly deferred to Story 3.3 E2E

### Key Weaknesses (Pre-Fix)

- Zustand store shared state between tests in `map-store.spec.ts` — order-dependent initial-state assertions (HIGH isolation violation — FIXED)
- `document.querySelector` used instead of `screen.getByTestId()` in `map-view.spec.tsx` — masked duplicate testid in mock (MEDIUM maintainability + hidden correctness bug — FIXED)
- `react-map-gl` Map mock rendered `data-testid="map-container"` — duplicating the MapView outer wrapper's testid, causing ambiguous DOM (found and FIXED during querySelector→screen migration)

### Summary

The Story 3.2 test suite delivers 33 unit tests covering the Mapbox map component, Zustand store, geo-utilities, and a split-view regression. Two fixable issues were identified and resolved during this review. The `map-store.spec.ts` tests used a shared Zustand singleton without per-test state reset, making initial-state tests fragile under order variation. The `map-view.spec.tsx` file used `document.querySelector` throughout, which silently masked a duplicate `data-testid="map-container"` rendered by both the MapView outer wrapper and the react-map-gl mock stub. Both issues were fixed by adding a `beforeEach` store reset and migrating to Testing Library `screen` queries with a corrected mock stub testid. All 299 unit tests continue to pass after fixes.

---

## Quality Criteria Assessment

| Criterion                            | Status       | Violations | Notes |
| ------------------------------------ | ------------ | ---------- | ----- |
| BDD Format (Given-When-Then)         | ✅ PASS      | 0          | Implicit GWT via AC references and setup/assert separation |
| Test IDs                             | ✅ PASS      | 0          | P0/P1 markers on all tests; AC# references in names |
| Priority Markers (P0/P1/P2/P3)       | ✅ PASS      | 0          | All 33 unit tests marked P0 or P1 |
| Hard Waits (sleep, waitForTimeout)   | ⚠️ WARN      | 1          | `waitForTimeout(500)` in E2E `test.skip` block (deferred, not a blocker) |
| Determinism (no conditionals)        | ✅ PASS      | 0          | All unit tests fully deterministic with fixed mock returns |
| Isolation (cleanup, no shared state) | ✅ PASS      | 0          | FIXED: `beforeEach` store reset added to `map-store.spec.ts` |
| Fixture Patterns                     | ✅ PASS      | 0          | `makeProperty()` factory, `afterEach(cleanup)` in component tests |
| Data Factories                       | ✅ PASS      | 0          | `makeProperty(overrides)` with Partial<> pattern |
| Network-First Pattern                | N/A          | 0          | No network calls in unit tests; E2E deferred |
| Explicit Assertions                  | ✅ PASS      | 0          | All `expect()` calls visible in test body |
| Test Length (≤300 lines)             | ⚠️ WARN      | 1          | `map-view.spec.tsx` is 422 lines (exceeds 300-line guideline) |
| Test Duration (≤1.5 min)            | ✅ PASS      | 0          | Full suite: ~1s; map-view spec: 23ms |
| Flakiness Patterns                   | ✅ PASS      | 0          | No hard waits or order dependencies in unit tests post-fix |

**Total Violations (post-fix)**: 0 Critical, 0 High, 2 Medium, 0 Low

---

## Quality Score Breakdown

```
Starting Score:          100

Dimension Scores (weighted):
  Determinism (30%):     96/100 × 0.30 = 28.8
  Isolation (30%):       95/100 × 0.30 = 28.5   (pre-fix: 88 → post-fix: 95)
  Maintainability (25%): 90/100 × 0.25 = 22.5   (pre-fix: 85 → post-fix: 90)
  Performance (15%):     98/100 × 0.15 = 14.7

Weighted Overall (post-fix): 94.5 → 94/100

Grade: A (Excellent)
```

---

## Critical Issues (Must Fix)

No critical issues detected post-fix. ✅

---

## Findings Applied During Review

### Finding 1 (HIGH — FIXED): Zustand Store Singleton — Order-Dependent Initial State Tests

**Severity**: HIGH (Isolation)
**Location**: `tests/unit/search/map-store.spec.ts`, describe block
**Criterion**: Isolation — no shared state between tests

**Issue Description**:
Zustand stores are JavaScript module-level singletons. The `useMapStore` instance persists across all tests in the file. Tests #4–#8 (setCenter, setZoom, setBounds) mutate the store state. Tests #1–#3 assert the initial state (`center: {lng: -83.7, lat: 9.38}`, `zoom: 10`, `bounds: null`). These initial-state assertions pass only because they run first in sequential order. In any scenario where tests ran in a different order — or if a future test was inserted before them — they would fail with the mutated values.

**Pre-Fix Code**:
```typescript
describe("useMapStore — Zustand map state store (AC #8)", () => {
  // No beforeEach reset — initial state tests are order-dependent
  it("[P0] initial state has center at lng: -83.70, lat: 9.38 ...", () => {
    const state = useMapStore.getState();
    expect(state.center).toEqual({ lng: -83.7, lat: 9.38 }); // FAILS if setCenter ran first
  });
```

**Applied Fix**:
```typescript
import { describe, expect, it, beforeEach } from "vitest";

describe("useMapStore — Zustand map state store (AC #8)", () => {
  // Reset store to initial state before each test.
  // Zustand stores are singletons — mutations in one test persist to the next
  // unless explicitly reset. This ensures order-independence and parallel safety.
  beforeEach(() => {
    useMapStore.setState({ center: { lng: -83.7, lat: 9.38 }, zoom: 10, bounds: null });
  });
```

**Why This Matters**:
Without the reset, the test suite is fragile to insertion order changes, IDE test-runner re-ordering, and future parallel execution. The fix costs zero overhead (Zustand `setState` is synchronous).

---

### Finding 2 (MEDIUM — FIXED): `document.querySelector` Instead of `screen.getByTestId` + Hidden Mock Duplication

**Severity**: MEDIUM (Maintainability / Correctness)
**Location**: `tests/unit/search/map-view.spec.tsx`, 12 occurrences
**Criterion**: Maintainability — use Testing Library `screen` queries per Story 3.1 lesson learned

**Issue Description**:
All interactive DOM queries used `document.querySelector('[data-testid="..."]')` instead of the Testing Library `screen.getByTestId()` / `screen.queryByTestId()` recommended in the Epic 3 test design. The Story 3.1 test review lesson explicitly states: "Use `screen.getByRole()` from `@testing-library/react` where semantics are testable — prefer over raw `document.querySelector('[data-testid]')`."

Additionally, the `document.querySelector` usage masked a correctness bug: the `react-map-gl` Map mock rendered `<div data-testid="map-container" ...>` which duplicated the MapView outer wrapper's `data-testid="map-container"`. `document.querySelector` silently returned the first match; `screen.getByTestId` correctly throws when multiple elements match, making the ambiguity visible.

**Pre-Fix Code (example)**:
```typescript
const container = document.querySelector('[data-testid="map-container"]');
expect(container).not.toBeNull();
// Also in mock:
// Map: () => <div data-testid="map-container" aria-label={ariaLabel}> ...
// ← This duplicated the outer MapView div's testid — masked by querySelector
```

**Applied Fix**:
```typescript
// Mock: changed stub testid to avoid duplication with MapView outer wrapper
Map: () => (
  <div data-testid="mapbox-map-stub" aria-label={ariaLabel}>
    {children}
  </div>
);

// Tests: migrated to screen queries
const container = screen.getByTestId("map-container"); // throws if 0 or >1 matches
expect(screen.queryByTestId("map-property-popup-card")).toBeNull();
expect(screen.queryAllByTestId("map-price-pin")).toHaveLength(0);
```

**Why This Matters**:
`screen.getByTestId` is semantically stronger: it throws with a descriptive error if the element is not found (vs `document.querySelector` returning null and requiring `not.toBeNull()`). The duplicate testid bug, now exposed and fixed, would have caused false positives in DOM assertions if the mock had returned wrong aria-label values.

---

## Findings Deferred (Not Fixed)

### Deferred 1 (MEDIUM): `waitForTimeout(500)` in E2E scaffold

**Location**: `tests/e2e/map-interactive.spec.ts`, line 128
**Status**: Deferred — E2E test is `test.skip()`, Playwright not yet installed
**Action**: When Story 3.3 activates E2E tests, replace with `page.waitForResponse()` on the Server Action endpoint, or `page.waitForTimeout` should wait for a debounce-triggered network response rather than a fixed time. Assign to Story 3.3 activation step.

---

## Best Practices Found

### 1. Correct vi.mock Hoisting Pattern

**Location**: `tests/unit/search/map-view.spec.tsx`, top of file
**Pattern**: Mocks declared before component imports

```typescript
// react-map-gl uses canvas/WebGL — must be mocked for jsdom.
vi.mock("react-map-gl", () => ({ ... }));
vi.mock("@/store/map-store", () => ({ ... }));
vi.mock("@/lib/map/config", () => ({ ... }));
// ... more mocks ...

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------
import { MapView } from "@/components/map/map-view"; // imported AFTER mocks
```

This correctly applies Vitest's automatic hoisting semantics and documents the intent for future maintainers.

### 2. Pure Function Test Completeness in `geo-utils.spec.ts`

**Location**: `tests/unit/search/geo-utils.spec.ts`
**Pattern**: Boundary value coverage

The `formatPriceAbbrev` test suite covers all three branches (≥1M, ≥1K, <1K) plus boundary values (exactly 1M, exactly 1K, $0, $999, $999K). The `boundsFromMapboxEvent` tests use a local factory (`makeMockMapEvent`) to create typed test doubles matching the react-map-gl v7 event shape, and cover both a wide viewport and a tight local viewport.

### 3. Static Assertion for Bundle Constraint (AC #6)

**Location**: `tests/unit/search/map-view.spec.tsx`, line 396–422
**Pattern**: Source-file content assertion for architectural constraints

```typescript
const content = fs.readFileSync(loaderPath, "utf8");
expect(content).toContain("next/dynamic");
expect(content).toContain("ssr: false");
expect(content).not.toContain("import MapView from");
```

This creative approach verifies the lazy-loading architecture constraint (AR25: Mapbox must not be in the main bundle) without requiring a full build. It's fast, deterministic, and runs in the normal `npm test` flow.

### 4. Proper afterEach Cleanup in Component Tests

**Location**: `tests/unit/search/map-view.spec.tsx`, line 207–210
```typescript
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

This pattern, carried from the Story 3.1 established pattern, prevents DOM accumulation and mock call count leakage between tests.

---

## Test File Analysis

### File Inventory (Story 3.2 scope)

| File | Lines | Tests | Env | Status |
|------|-------|-------|-----|--------|
| `tests/unit/search/map-view.spec.tsx` | 422 | 11 | jsdom | ✅ All passing |
| `tests/unit/search/map-store.spec.ts` | 198 | 11 | node | ✅ All passing |
| `tests/unit/search/geo-utils.spec.ts` | 191 | 12 | node | ✅ All passing |
| `tests/unit/search/split-view-layout.spec.tsx` | 270 | 9 | jsdom | ✅ All passing (regression) |
| `tests/e2e/map-interactive.spec.ts` | 251 | 6 | playwright | ⏭️ All `.skip` (Story 3.3) |

**Total unit tests in scope**: 43 (33 new + 9 regression + 1 regression fix counted in split-view)
**Suite-wide totals**: 299 passing, 3 skipped (pre-existing schema deferrals)

### Priority Distribution (Story 3.2 unit tests)

| Priority | Count |
|----------|-------|
| P0 | 18 |
| P1 | 15 |
| P2+ | 0 |

### AC Coverage (Unit Level)

| AC | Coverage | Notes |
|----|----------|-------|
| AC #1 (Mapbox loads, 3D terrain) | Unit (map-view: testid + aria-label + onLoad path) | ✅ |
| AC #2 (Pins at lat/lon) | Unit (map-view: 3 tests) | ✅ |
| AC #3 (Clustering) | E2E only (deferred) | ⏭️ |
| AC #4 (Pin click → popup) | Unit (map-view: 3 tests) | ✅ |
| AC #5 (Pan → grid sync) | Unit (onBoundsChange callback) + E2E (deferred) | ✅/⏭️ |
| AC #6 (Lazy chunk) | Unit (static file assertion) | ✅ |
| AC #7 (≤3s 4G perf) | E2E only (deferred) | ⏭️ |
| AC #8 (Zustand store) | Unit (map-store: 11 tests) | ✅ |
| AC #9 (data-testid present) | Unit (map-view: renders correctly) | ✅ |
| formatPriceAbbrev | Unit (geo-utils: 9 cases) | ✅ |
| boundsFromMapboxEvent | Unit (geo-utils: 3 cases) | ✅ |

---

## Context and Integration

### Related Artifacts

- **Story File**: `_bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md`
- **ATDD Checklist**: `_bmad-output/test-artifacts/atdd-checklist-3-2-interactive-map-with-property-pins.md`
- **Test Design**: `_bmad-output/test-artifacts/test-design-epic-3.md`
- **Previous Review**: `_bmad-output/test-artifacts/test-reviews/test-review-3-1-search-page-layout-and-split-view.md`
- **Risk Coverage**: R-001 (lazy chunk) → covered by static assertion; R-002, R-012 → E2E deferred

---

## Knowledge Base References

- **test-quality.md** — Definition of Done: no hard waits, <300 lines, self-cleaning
- **data-factories.md** — `makeProperty(overrides)` factory pattern
- **selector-resilience.md** — `screen.getByTestId()` preferred over `document.querySelector`
- **test-healing-patterns.md** — Stale selector pattern and isolation fixes
- **component-tdd.md** — Provider isolation and cleanup in component tests
- **test-levels-framework.md** — Unit vs E2E level selection rationale

---

## Next Steps

### Immediate Actions (Before Merge)

No blocking items remaining. All findings resolved.

### Follow-up Actions (Story 3.3 activation)

1. **Activate E2E tests in `tests/e2e/map-interactive.spec.ts`** after Playwright framework setup
   - Replace `test.skip()` with active tests
   - Replace `waitForTimeout(500)` with `page.waitForResponse()` on the bounds Server Action
   - Priority: P0, Owner: Dev/QA, Story 3.3

2. **Consider splitting `map-view.spec.tsx`** if file grows beyond 422 lines
   - Currently at 422 lines (exceeds 300-line guideline)
   - Split candidates: popup interaction tests → `map-view-popup.spec.tsx`
   - Priority: P2, Target: Story 3.4 backlog

### Re-Review Needed?

✅ No re-review needed — approve as-is.

---

## Decision

**Recommendation**: Approve

**Rationale**:
Test quality score is 94/100 (A — Excellent) after two targeted fixes applied during this review. The two issues found (Zustand singleton isolation and document.querySelector maintainability) were both fixed in-session and verified with the full passing test suite (299 passing, 3 skipped — unchanged baseline). The test suite correctly exercises all testable ACs at unit level with appropriate mock boundaries for Mapbox GL JS, defers non-testable scenarios (clustering, pan-sync, performance) to E2E scaffolds correctly marked `.skip`, and applies the hoisting and cleanup patterns established in Story 3.1. The static assertion for lazy-chunk architecture (AC #6) is a novel and effective technique for enforcing build constraints in the unit test layer.

---

## Appendix

### Violations Fixed During Review

| File | Line | Severity | Criterion | Issue | Fix Applied |
|------|------|----------|-----------|-------|-------------|
| `map-store.spec.ts` | 31 (describe block) | HIGH | Isolation | No `beforeEach` store reset — initial state tests order-dependent | Added `beforeEach(() => useMapStore.setState(...))` |
| `map-view.spec.tsx` | multiple | MEDIUM | Maintainability | `document.querySelector` instead of `screen.getByTestId` | Migrated all 12 occurrences to `screen` API |
| `map-view.spec.tsx` | 47 (mock) | MEDIUM | Correctness | Mock `Map` rendered duplicate `data-testid="map-container"` | Changed mock stub testid to `"mapbox-map-stub"` |

### Deferred Violations

| File | Line | Severity | Criterion | Issue | Target |
|------|------|----------|-----------|-------|--------|
| `map-interactive.spec.ts` | 128 | MEDIUM | Determinism | `waitForTimeout(500)` hard wait | Story 3.3 E2E activation |

---

**Generated By**: BMad TEA Agent — testarch-test-review
**Review ID**: test-review-3-2-interactive-map-with-property-pins-20260426
**Timestamp**: 2026-04-26
