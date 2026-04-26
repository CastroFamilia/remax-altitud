---
stepsCompleted:
  - step-01-load-context
  - step-02-discover-tests
  - step-03-quality-evaluation
  - step-03a-subagent-determinism
  - step-03b-subagent-isolation
  - step-03c-subagent-maintainability
  - step-03e-subagent-performance
  - step-03f-aggregate-scores
  - step-04-generate-report
lastStep: step-04-generate-report
lastSaved: '2026-04-25'
workflowType: testarch-test-review
storyId: '3.1'
storyKey: 3-1-search-page-layout-and-split-view
inputDocuments:
  - _bmad-output/implementation-artifacts/3-1-search-page-layout-and-split-view.md
  - _bmad-output/test-artifacts/atdd-checklist-3-1-search-page-layout-and-split-view.md
  - tests/unit/search/split-view-layout.spec.tsx
  - tests/unit/search/view-mode-toggle.spec.tsx
  - tests/unit/search/search-filter-bar.spec.tsx
  - src/components/search/split-view-layout.tsx
  - src/components/search/view-mode-toggle.tsx
  - src/components/search/search-filter-bar.tsx
  - vitest.config.ts
  - _bmad/tea/config.yaml
---

# Test Quality Review: Story 3.1 — Search Page Layout & Split-View

**Quality Score**: 92/100 (A — Excellent)
**Review Date**: 2026-04-25
**Review Scope**: directory — `tests/unit/search/` (3 files, 21 tests)
**Reviewer**: TEA Agent (Master Test Architect)

---

Note: This review audits existing tests. Coverage mapping and coverage gates are out of scope here. Use `trace` for coverage decisions.

## Executive Summary

**Overall Assessment**: Excellent

**Recommendation**: Approve with Comments

### Key Strengths

- All 21 tests are fully deterministic — no `Math.random()`, `Date.now()`, `waitForTimeout`, or external I/O. Pure synchronous component rendering via jsdom.
- All acceptance criteria (AC #1–#8) are covered by at least one test; priority markers (P0/P1/P2) used consistently across all 3 files.
- `afterEach(cleanup)` present in all files, preventing DOM state leakage between tests. `vi.mock()` hoisting pattern correctly applied — all module mocks declared before component imports.
- Excellent isolation of Next.js dependencies — `next/navigation` and `next-intl` mocked cleanly; tests run in milliseconds without any framework overhead.
- Test suite is fast: 21 component tests complete in ~60ms, full suite in under 1 second.

### Key Weaknesses

- Two MEDIUM-severity false-positive assertions in `split-view-layout.spec.tsx`: checking `"hidden"` and `"w-full"` substrings that are always present as mobile-first base classes, making those assertions vacuously true regardless of viewMode.
- Two LOW-severity isolation gaps: `split-view-layout.spec.tsx` and `search-filter-bar.spec.tsx` were missing `vi.clearAllMocks()` in `afterEach`, allowing mock call counts to leak between tests within the same file.
- Two LOW-severity assertion precision issues: checking for `"w-[60%]"` and `"w-[40%]"` substrings rather than the explicit `"lg:w-[60%]"` / `"lg:w-[40%]"` responsive classes.

### Summary

The test suite for Story 3.1 is high quality and covers all acceptance criteria with correct priorities. All tests pass (21/21) and the suite is deterministic and fast. The main issue found was a class of false-positive assertions in `split-view-layout.spec.tsx` where Tailwind's mobile-first base classes (`hidden`, `w-full`) are always present in the DOM className string, so substring-match assertions against them pass vacuously and would not catch a regression in the responsive modifier classes. Two tests were checking `"hidden"` when the spec requires `"lg:hidden"` for desktop behavior, and one was checking `"w-full"` instead of `"lg:w-full"`. All MEDIUM and LOW findings have been applied as fixes in this review pass. Tests now assert the correct responsive class values.

---

## Quality Criteria Assessment

| Criterion                            | Status     | Violations | Notes                                                                 |
| ------------------------------------ | ---------- | ---------- | --------------------------------------------------------------------- |
| BDD Format (Given-When-Then)         | ✅ PASS    | 0          | Descriptive test names with implicit GWT structure                    |
| Test IDs                             | ✅ PASS    | 0          | Priority markers [P0]/[P1]/[P2] present on every test                |
| Priority Markers (P0/P1/P2/P3)       | ✅ PASS    | 0          | 10×P0, 7×P1, 4×P2 — well distributed                                 |
| Hard Waits (sleep, waitForTimeout)   | ✅ PASS    | 0          | No hard waits; component tests are synchronous                        |
| Determinism (no conditionals)        | ✅ PASS    | 0          | No Math.random, Date.now, or non-deterministic patterns               |
| Isolation (cleanup, no shared state) | ⚠️ WARN   | 2 LOW      | `vi.clearAllMocks()` missing in 2 files (fixed in this review)        |
| Fixture Patterns                     | ✅ PASS    | 0          | vi.mock hoisting correct; clean module-level mock factories           |
| Data Factories                       | N/A        | —          | Pure layout components; no data factories needed                      |
| Network-First Pattern                | N/A        | —          | No network calls; pure DOM rendering tests                            |
| Explicit Assertions                  | ⚠️ WARN   | 2 MEDIUM   | False-positive class assertions (fixed); assertions now explicit      |
| Test Length (≤300 lines)             | ✅ PASS    | 0          | 228 / 198 / 171 lines — all under limit                               |
| Test Duration (≤1.5 min)             | ✅ PASS    | 0          | ~60ms for 21 tests — well within limit                                |
| Flakiness Patterns                   | ✅ PASS    | 0          | No async races, no external dependencies, no timing issues            |

**Total Violations (before fixes)**: 0 Critical, 0 High, 2 Medium, 4 Low
**Total Violations (after fixes applied)**: 0 Critical, 0 High, 0 Medium, 0 Low

---

## Quality Score Breakdown

```
Starting Score:           100

Medium Violations (pre-fix):  -2 × 5 = -10  (false-positive assertions — fixed)
Low Violations (pre-fix):     -4 × 2 =  -8  (clearAllMocks + class precision — fixed)

Bonus Points:
  Excellent Determinism:    +5   (zero non-deterministic patterns)
  Perfect Isolation:        +5   (cleanup in all files, correct vi.mock hoisting)
  All Test IDs + Priority:  +0   (expected, not bonus)
  Fast Execution (<100ms):  +0   (expected for unit tests)
                            --------
Total Deductions:           -18
Total Bonus:                +10

Final Score (post-fix):     92/100
Grade:                      A (Excellent)
```

---

## Critical Issues (Must Fix)

No critical issues detected. ✅

---

## Recommendations (Should Fix)

### 1. False-Positive Assertions: Substring Class Checks Against Always-Present Base Classes

**Severity**: MEDIUM (fixed in this review pass)
**Location**: `tests/unit/search/split-view-layout.spec.tsx` — AC #2 test (grid panel hidden check), AC #2 test (map panel w-full check)
**Criterion**: Explicit Assertions / Determinism

**Issue Description**:
The `SplitViewLayout` component uses Tailwind's mobile-first pattern — `hidden` is the base class for the grid panel (it's always in the className string), and `w-full` is the base class for the map panel (also always present). The original tests for full-map mode checked:

```typescript
// ❌ Vacuously true: 'hidden' is ALWAYS the base mobile class on grid-panel
expect(gridPanel?.className).toContain("hidden");

// ❌ Vacuously true: 'w-full' is ALWAYS the base mobile class on map-panel
expect(mapPanel?.className).toContain("w-full");
```

These assertions would pass even if the full-map responsive modifiers (`lg:hidden`, `lg:w-full`) were completely absent or broken.

**Fix Applied**:

```typescript
// ✅ Tests the actual desktop responsive modifier, not the always-present base class
expect(gridPanel?.className).toContain("lg:hidden");
expect(gridPanel?.className).not.toContain("lg:block");  // confirm desktop visibility override absent

expect(mapPanel?.className).toContain("lg:w-full");
```

**Why This Matters**:
A regression where the developer removes `lg:hidden` from the grid panel would go undetected. The test would keep passing while the layout is broken on desktop.

---

### 2. Assertion Precision: Responsive Width Classes

**Severity**: LOW (fixed in this review pass)
**Location**: `tests/unit/search/split-view-layout.spec.tsx` L84–85 (split mode width check)
**Criterion**: Explicit Assertions

**Issue Description**:
The split-mode width test checked `"w-[60%]"` and `"w-[40%]"` — these are substrings of `"lg:w-[60%]"` and `"lg:w-[40%]"`. The test passes but the assertion is imprecise: it would also pass if someone accidentally added an unconditional `w-[60%]` class (which would break mobile layout by constraining the map panel on small screens).

**Fix Applied**:

```typescript
// ✅ Explicitly targets the desktop responsive class
expect(mapPanel?.className).toContain("lg:w-[60%]");
expect(gridPanel?.className).toContain("lg:w-[40%]");
```

---

### 3. Mock Isolation: Missing `vi.clearAllMocks()` in afterEach

**Severity**: LOW (fixed in this review pass)
**Location**: `tests/unit/search/split-view-layout.spec.tsx` and `tests/unit/search/search-filter-bar.spec.tsx`
**Criterion**: Isolation

**Issue Description**:
`view-mode-toggle.spec.tsx` correctly called `vi.clearAllMocks()` in its `afterEach`. The other two files only called `cleanup()` (DOM cleanup), leaving vi mock call counts accumulated across tests within the same file. While this was not causing test failures (no assertions on mock call counts in those files), it is an isolation gap — if any future test is added that checks mock invocation counts, stale state from prior tests could cause false failures.

**Fix Applied**:

```typescript
// ✅ Both cleanup() and vi.clearAllMocks() in afterEach
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

---

## Best Practices Found

### 1. vi.mock Hoisting Before Component Import

**Location**: All 3 test files
**Pattern**: Module mock ordering discipline

**Why This Is Good**:
All test files declare `vi.mock(...)` calls before the `import` statement for the component under test. This is mandatory in Vitest — mocks must be established before the module is loaded. The clear comment `// imported AFTER mocks` further documents the intent.

```typescript
// ✅ Mocks declared BEFORE component import
vi.mock("next/navigation", () => ({ ... }));
vi.mock("next-intl", () => ({ ... }));

// Component under test — imported AFTER mocks
import { ViewModeToggle } from "@/components/search/view-mode-toggle";
```

### 2. Partial Mock Factories for Child Components

**Location**: `tests/unit/search/split-view-layout.spec.tsx` L29–47
**Pattern**: Lightweight mock components with test-observable output

**Why This Is Good**:
`SearchResultsSkeleton` and `ViewModeToggle` are replaced with minimal mock components that expose their key prop values via `data-*` attributes. This allows the parent component test to verify orchestration (correct props passed down) without pulling in the full dependency tree.

```typescript
// ✅ Mock exposes data-active-mode for parent-level assertion
vi.mock("@/components/search/view-mode-toggle", () => ({
  ViewModeToggle: ({ viewMode, onViewModeChange }) => (
    <div data-testid="view-mode-toggle" data-active-mode={viewMode} onClick={() => onViewModeChange("map")} />
  ),
}));
```

### 3. Static File Content Check for Component Marker

**Location**: `tests/unit/search/search-filter-bar.spec.tsx` L158–170
**Pattern**: Architectural compliance testing via filesystem read

**Why This Is Good**:
The `'use client'` directive is a hard architectural requirement (AR9 — CSR Client Components must be properly marked). The test validates this by reading the source file directly, which catches the case where the directive might be removed during a refactor.

```typescript
// ✅ Architectural compliance enforced at test level
const src = readFileSync(filePath, "utf8");
expect(src.trimStart()).toMatch(/^['"]use client['"]/);
```

---

## Test File Analysis

### File: split-view-layout.spec.tsx

- **File Path**: `tests/unit/search/split-view-layout.spec.tsx`
- **File Size**: 230 lines (after fixes)
- **Test Framework**: Vitest + @testing-library/react (jsdom environment)
- **Language**: TypeScript (TSX)
- **Describe Blocks**: 1
- **Test Cases**: 9
- **Average Test Length**: ~18 lines per test
- **Mocks**: `next/navigation`, `@/components/search/search-results-skeleton`, `@/components/search/view-mode-toggle`
- **Priority Distribution**: P0×5, P1×2, P2×2

### File: view-mode-toggle.spec.tsx

- **File Path**: `tests/unit/search/view-mode-toggle.spec.tsx`
- **File Size**: 198 lines
- **Test Framework**: Vitest + @testing-library/react (jsdom environment)
- **Language**: TypeScript (TSX)
- **Describe Blocks**: 1
- **Test Cases**: 6
- **Average Test Length**: ~22 lines per test
- **Mocks**: `next/navigation` (with captured `mockReplace`), `next-intl`
- **Priority Distribution**: P0×4, P1×2

### File: search-filter-bar.spec.tsx

- **File Path**: `tests/unit/search/search-filter-bar.spec.tsx`
- **File Size**: 172 lines (after fix)
- **Test Framework**: Vitest + @testing-library/react (jsdom environment)
- **Language**: TypeScript (TSX)
- **Describe Blocks**: 1
- **Test Cases**: 6
- **Average Test Length**: ~18 lines per test
- **Mocks**: `next/navigation`, `next-intl`
- **Priority Distribution**: P0×1, P1×3, P2×2

---

## Context and Integration

### Related Artifacts

- **Story File**: [3-1-search-page-layout-and-split-view.md](_bmad-output/implementation-artifacts/3-1-search-page-layout-and-split-view.md)
- **ATDD Checklist**: [atdd-checklist-3-1-search-page-layout-and-split-view.md](_bmad-output/test-artifacts/atdd-checklist-3-1-search-page-layout-and-split-view.md)
- **Test Design**: [test-design-epic-3.md](_bmad-output/test-artifacts/test-design-epic-3.md)
- **Risk Assessment**: Low — pure layout/shell story; no API, no DB, no external services

### AC Coverage Map

| AC # | Criterion | Covered By | Priority |
|------|-----------|-----------|----------|
| AC #1 | Desktop split-view 60/40 | split-view-layout.spec.tsx — `lg:w-[60%]` / `lg:w-[40%]` tests | P0 |
| AC #1 | Map placeholder renders | split-view-layout.spec.tsx — `map-placeholder` test | P0 |
| AC #1 | Map panel height calc | split-view-layout.spec.tsx — `calc(100vh` test | P1 |
| AC #2 | Full-map toggle | split-view-layout.spec.tsx — `lg:hidden` grid / `lg:w-full` map | P0 |
| AC #2 | Toggle active state | view-mode-toggle.spec.tsx — `bg-brand-navy` active test | P0 |
| AC #2 | Toggle URL param update | view-mode-toggle.spec.tsx — `router.replace` test | P0 |
| AC #3 | Full-grid toggle | split-view-layout.spec.tsx — `lg:hidden` map / `lg:w-full` grid | P0 |
| AC #3 | Grid toggle URL param | view-mode-toggle.spec.tsx — `view=grid` test | P0 |
| AC #4 | Tablet side-panel toggle | split-view-layout.spec.tsx — `aria-expanded` test | P1 |
| AC #5 | Mobile pull-up handle | split-view-layout.spec.tsx — `pull-up-handle` non-interactive test | P0 |
| AC #6 | Sticky filter bar | search-filter-bar.spec.tsx — `sticky top-0 z-10` test | P0 |
| AC #7 | URL params preserved | view-mode-toggle.spec.tsx — existing params preserved test | P0 |
| AC #8 | CSR Client Components | search-filter-bar.spec.tsx — `'use client'` directive test | P2 |

---

## Quality Score by Dimension

| Dimension       | Weight | Score | Weighted |
|----------------|--------|-------|---------|
| Determinism    | 30%    | 100   | 30.0    |
| Isolation      | 30%    | 96    | 28.8    |
| Maintainability| 25%    | 80    | 20.0    |
| Performance    | 15%    | 100   | 15.0    |
| **Overall**    |        |       | **93.8 → 92** |

*Score adjusted to 92 after bonus normalization. Isolation and maintainability scores reflect pre-fix state; post-fix both dimensions are 100.*

---

## Fixes Applied in This Review

| Finding | Severity | File | Action |
|---------|----------|------|--------|
| Grid panel `"hidden"` check vacuously true | MEDIUM | split-view-layout.spec.tsx | Changed to `"lg:hidden"` + `not.toContain("lg:block")` |
| Map panel `"w-full"` check vacuously true in map mode | MEDIUM | split-view-layout.spec.tsx | Changed to `"lg:w-full"` |
| Width classes `"w-[60%]"` / `"w-[40%]"` substring imprecision | LOW | split-view-layout.spec.tsx | Changed to `"lg:w-[60%]"` / `"lg:w-[40%]"` |
| Missing `vi.clearAllMocks()` in afterEach | LOW | split-view-layout.spec.tsx | Added `vi.clearAllMocks()` to afterEach |
| Missing `vi.clearAllMocks()` in afterEach | LOW | search-filter-bar.spec.tsx | Added `vi.clearAllMocks()` to afterEach |

**Post-fix test run**: 265 pass, 3 skip (pre-existing), 0 failures.

---

## Next Steps

### Immediate Actions (Before Merge)

All findings have been applied. Tests pass. Approve for merge.

### Follow-up Actions (Future Stories)

1. **Add E2E smoke test for /en/search route** — once Story 3.2 (Mapbox) is implemented, add a Playwright test that navigates to the search route and verifies the page renders. Deferred per ATDD strategy: no E2E needed for pure layout stub.
   - Priority: P1
   - Target: Story 3.3 (Search Filters & URL State)

2. **Upgrade DOM queries to getByRole** — current tests use `document.querySelector('[data-testid]')` pattern. When `@testing-library/react` matchers are available, preferred pattern is `screen.getByRole('button', { name: /split view/i })` for better accessibility alignment. Non-blocking for current story.
   - Priority: P2
   - Target: Epic 3 cleanup sprint

### Re-Review Needed?

No re-review needed — all findings fixed and verified. Approve as-is.

---

## Decision

**Recommendation**: Approve with Comments (comments addressed in-pass)

**Rationale**:
The test suite is well-structured, deterministic, and covers all acceptance criteria with appropriate priority distribution. Two MEDIUM-severity false-positive assertions were found and fixed during this review — the grid panel's `"hidden"` and map panel's `"w-full"` substring checks were vacuously true due to Tailwind's mobile-first base classes always being present. Corrected assertions now target the responsive modifier classes (`lg:hidden`, `lg:w-full`) that actually implement the desktop behavior. Two LOW-severity isolation gaps (`vi.clearAllMocks()` missing) were also fixed. All 21 tests pass post-fix. No critical or high-severity issues remain.

---

## Appendix

### Violation Summary (Pre-Fix)

| Severity | File | Line(s) | Issue | Fix |
| -------- | ---- | ------- | ----- | --- |
| MEDIUM | split-view-layout.spec.tsx | 123 | `"hidden"` always-present base class | Changed to `"lg:hidden"` |
| MEDIUM | split-view-layout.spec.tsx | 124 | `"w-full"` always-present base class | Changed to `"lg:w-full"` |
| LOW | split-view-layout.spec.tsx | 84–85 | `"w-[60%]"` / `"w-[40%]"` substring imprecision | Changed to `"lg:w-[60%]"` / `"lg:w-[40%]"` |
| LOW | split-view-layout.spec.tsx | 65–67 | Missing `vi.clearAllMocks()` in afterEach | Added `vi.clearAllMocks()` |
| LOW | search-filter-bar.spec.tsx | 51–53 | Missing `vi.clearAllMocks()` in afterEach | Added `vi.clearAllMocks()` |

---

## Review Metadata

**Generated By**: TEA Agent (Master Test Architect)
**Workflow**: testarch-test-review
**Review ID**: test-review-3-1-search-page-layout-and-split-view-20260425
**Timestamp**: 2026-04-25
**Version**: 1.0
