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
storyId: '3.7'
storyKey: 3-7-unit-conversion-and-price-display
storyFile: _bmad-output/implementation-artifacts/3-7-unit-conversion-and-price-display.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-7-unit-conversion-and-price-display.md
generatedTestFiles:
  - tests/unit/search/units.spec.ts
  - tests/unit/search/currency.spec.ts
  - tests/unit/search/unit-toggle.spec.tsx
  - tests/unit/search/property-card.spec.tsx
  - tests/e2e/unit-conversion-and-price-display.spec.ts
inputDocuments:
  - _bmad/tea/config.yaml
  - _bmad-output/implementation-artifacts/3-7-unit-conversion-and-price-display.md
  - _bmad-output/test-artifacts/test-design-epic-3.md
  - vitest.config.mts
  - tests/unit/search/property-card.spec.tsx
  - resources/knowledge/data-factories.md
  - resources/knowledge/component-tdd.md
  - resources/knowledge/test-quality.md
  - resources/knowledge/test-healing-patterns.md
  - resources/knowledge/selector-resilience.md
  - resources/knowledge/timing-debugging.md
  - resources/knowledge/overview.md
  - resources/knowledge/api-request.md
  - resources/knowledge/auth-session.md
  - resources/knowledge/recurse.md
---

# ATDD Checklist: Story 3.7 — Unit Conversion & Price Display

## Step 1: Preflight & Context

- **Stack detected:** `frontend` (Next.js, React, Vitest + Playwright)
- **Story file:** `_bmad-output/implementation-artifacts/3-7-unit-conversion-and-price-display.md`
- **Story ID:** 3.7
- **Story key:** `3-7-unit-conversion-and-price-display`
- **Config source:** `_bmad/tea/config.yaml`
- **Test artifacts dir:** `_bmad-output/test-artifacts/`
- **Framework:** Vitest (unit) + Playwright (E2E, scaffolded pending playwright.config.ts)
- **TEA flags:** `tea_use_playwright_utils: true`, `tea_browser_automation: auto`, `tea_execution_mode: auto`

## Step 2: Generation Mode

**Mode:** AI generation (sequential)

Acceptance criteria are clear and well-specified in the story. No live browser recording needed for unit tests. E2E tests follow the established project pattern (`test.skip()` with `// @ts-expect-error` for Playwright import until config is set up).

## Step 3: Test Strategy

### Acceptance Criteria → Test Mapping

| AC | Description | Test Level | Priority | Test ID |
|----|-------------|-----------|----------|---------|
| AC #1 | European locale → m²/hectares by default | Unit + E2E | P0 | 3.7-UNIT-001, 3.7-E2E-002 |
| AC #2 | US locale → ft²/acres by default | Unit + E2E | P0 | 3.7-UNIT-001, 3.7-E2E-001 |
| AC #3 | Unit toggle switches between m²/ha and ft²/acres | Unit + E2E | P0 | 3.7-E2E-003 |
| AC #4 | Unit preference persists in localStorage | Unit + E2E | P0 | 3.7-E2E-003 |
| AC #5 | Price shows USD as primary + EUR for non-US locales | Unit + E2E | P0 | 3.7-UNIT-003, 3.7-E2E-004 |
| AC #6 | ZMT badge shows icon + label (not color alone) | E2E | P1 | 3.7-E2E-005 |
| AC #7 | Price formatting respects locale conventions | Unit | P1 | 3.7-UNIT-003 |

### Test Levels Selected

- **Unit (Vitest):** Pure utility functions (`units.ts`, `currency.ts`) and component (`UnitToggle`)
- **E2E (Playwright):** Full user journeys — locale defaults, toggle interaction, EUR display, ZMT badge
- No API tests needed (no new API endpoints; this is a pure frontend story)

## Step 4: Test Generation (RED PHASE)

### TDD Red Phase Report

```
All tests generated as test.skip() scaffolds (RED PHASE).
Activated tests will FAIL until feature is implemented.
Scaffolds document expected behavior before implementation.
```

### Generated Test Files

#### Unit Tests (Vitest)

| File | Tests | Priority Coverage |
|------|-------|------------------|
| `tests/unit/search/units.spec.ts` | 15 | P0: 11, P1: 4 |
| `tests/unit/search/currency.spec.ts` | 12 | P0: 8, P1: 4 |
| `tests/unit/search/unit-toggle.spec.tsx` | 9 | P0: 6, P1: 3 |
| `tests/unit/search/property-card.spec.tsx` (updated) | +4 | P0: 2, P1: 2 |

#### E2E Tests (Playwright)

| File | Tests | Priority Coverage |
|------|-------|------------------|
| `tests/e2e/unit-conversion-and-price-display.spec.ts` | 13 | P0: 8, P1: 5 |

**Total: 53 tests** (all with `test.skip()` — TDD RED PHASE)

### Test IDs Covered from Test Design

| Test ID | File | Status |
|---------|------|--------|
| 3.7-UNIT-001 | `tests/unit/search/units.spec.ts` | Scaffolded (RED) |
| 3.7-UNIT-002 | `tests/unit/search/units.spec.ts` | Scaffolded (RED) |
| 3.7-UNIT-003 | `tests/unit/search/currency.spec.ts` | Scaffolded (RED) |
| 3.7-E2E-001 | `tests/e2e/unit-conversion-and-price-display.spec.ts` | Scaffolded (RED) |
| 3.7-E2E-002 | `tests/e2e/unit-conversion-and-price-display.spec.ts` | Scaffolded (RED) |
| 3.7-E2E-003 | `tests/e2e/unit-conversion-and-price-display.spec.ts` | Scaffolded (RED) |
| 3.7-E2E-004 | `tests/e2e/unit-conversion-and-price-display.spec.ts` | Scaffolded (RED) |
| 3.7-E2E-005 | `tests/e2e/unit-conversion-and-price-display.spec.ts` | Scaffolded (RED) |

## Step 5: Validate & Complete

### Checklist Validation

- [x] Story has clear acceptance criteria — verified (7 ACs)
- [x] Stack detected correctly — `frontend` (Next.js + Vitest)
- [x] Framework config accessible — `vitest.config.mts` present
- [x] Unit test files created with correct naming (`.spec.ts` for pure utils, `.spec.tsx` for components)
- [x] Environment mapping correct — `tests/unit/search/**/*.spec.tsx` → jsdom; `.spec.ts` → node
- [x] All tests use `test.skip()` or `it()` with failing imports (TDD RED PHASE)
- [x] All tests assert EXPECTED behavior (not placeholder `expect(true).toBe(true)`)
- [x] Resilient selectors used in E2E tests (getByTestId, getByRole)
- [x] E2E tests follow project pattern (`// @ts-expect-error` for Playwright not installed)
- [x] Regression tests added to `property-card.spec.tsx` with mocks for new imports
- [x] Story metadata captured in checklist frontmatter
- [x] No orphaned browser sessions (no browser automation used)
- [x] Test IDs from test-design-epic-3.md covered: 3.7-UNIT-001/002/003, 3.7-E2E-001 through 005

### Fixture Needs (for green phase)

- No new fixtures needed (unit tests are self-contained with mocks)
- E2E tests require seeded DB with properties of various ZMT statuses

### Risks & Assumptions

| Risk ID | Description | Mitigation |
|---------|-------------|-----------|
| R-011 | FOUC — localStorage not read on first render | Initialize useState with localStorage read (not useEffect) |
| R-014 | Exact formula verification for unit constants | Tests assert exact SQFT_PER_M2=10.7639, M2_PER_ACRE=4046.86 |
| — | EUR_RATE is static (not live) | Tests validate it's between 0.8-1.0, approximately 0.92 |
| — | PropertyCard is RSC — no hooks | unitSystem passed as prop from parent Client Component |

### Next Steps

1. **Implement Story 3.7** (run `bmad-dev-story` workflow)
2. **Activate unit tests** one task at a time:
   - Task 1: Remove `test.skip` in `units.spec.ts` → implement `src/lib/utils/units.ts`
   - Task 2: Remove `test.skip` in `currency.spec.ts` → implement `src/lib/utils/currency.ts`
   - Task 3/4: Remove `test.skip` in `unit-toggle.spec.tsx` → implement hook + component
   - Task 5-7: Remove `test.skip` in updated `property-card.spec.tsx` → update PropertyCard
3. **After implementation:** Run `npm test` → verify all activated tests pass
4. **E2E:** Install Playwright + configure `playwright.config.ts` → activate E2E tests

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-7-unit-conversion-and-price-display.md`
- Unit tests: `tests/unit/search/units.spec.ts`
- Unit tests: `tests/unit/search/currency.spec.ts`
- Component tests: `tests/unit/search/unit-toggle.spec.tsx`
- Regression tests: `tests/unit/search/property-card.spec.tsx` (updated)
- E2E tests: `tests/e2e/unit-conversion-and-price-display.spec.ts`
