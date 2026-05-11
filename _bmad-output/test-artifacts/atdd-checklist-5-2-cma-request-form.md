---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-11'
storyId: '5.2'
storyKey: 5-2-cma-request-form
storyFile: _bmad-output/implementation-artifacts/5-2-cma-request-form.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-5-2-cma-request-form.md
generatedTestFiles:
  - tests/unit/seller/cma-form.spec.tsx
inputDocuments:
  - _bmad-output/implementation-artifacts/5-2-cma-request-form.md
  - _bmad-output/test-artifacts/test-design-epic-5.md
  - _bmad/tea/config.yaml
  - _bmad-output/test-artifacts/atdd-checklist-5-1-seller-landing-page-and-list-with-us-form.md
---

# ATDD Checklist: Story 5.2 — CMA Request Form

**Story ID:** 5.2
**Story Key:** `5-2-cma-request-form`
**Date:** 2026-05-11
**Stack:** fullstack (Next.js 14 SSG + React + Vitest)
**TDD Phase:** RED — all scaffolded tests use `it.skip()`

---

## TDD Red Phase Summary

All scaffolded tests are in **RED phase** (skipped). They assert expected behavior
that will only pass once the feature is implemented.

| Category | File | Tests (all skipped) |
|----------|------|---------------------|
| Unit/Component (Vitest) | `tests/unit/seller/cma-form.spec.tsx` | 12 |
| **Total** | | **12** |

---

## Acceptance Criteria → Test Coverage

| AC | Description | Test ID | File | Priority |
|----|-------------|---------|------|----------|
| AC #1 | CMA form loads with value proposition | 5.2-E2E-001 | unit/seller/cma-form.spec.tsx | P1 |
| AC #2 | Form collects all required fields (name, phone, email, type, location, size, comment) | 5.2-COMP-001 | unit/seller/cma-form.spec.tsx | P0 |
| AC #3 | Lead stored with source="cma_form" intent="sell" | 5.2-COMP-003 | unit/seller/cma-form.spec.tsx | P0 |
| AC #4 | CMA confirmation screen with agent card | 5.2-COMP-004 | unit/seller/cma-form.spec.tsx | P1 |
| AC #5 | CMA accessible as secondary CTA on seller page | 5.2-E2E-001 | unit/seller/cma-form.spec.tsx | P1 |
| AC #6 | Form labels/validation in selected locale | 5.2-COMP-006 | unit/seller/cma-form.spec.tsx | P2 |
| AC #7 | Shares form field components with seller form | 5.2-COMP-005 | unit/seller/cma-form.spec.tsx | P1 |

---

## Risk Mitigations

| Risk | Score | Mitigation Test | Status |
|------|-------|----------------|--------|
| R-009: CMA source/intent tagging | 3 | 5.2-COMP-003 (buildCmaLeadPayload) | RED — awaiting implementation |
| R-011: Validation errors in wrong locale | 3 | 5.2-COMP-006 | RED — awaiting implementation |

---

## data-testid Contract (Frozen — CANNOT Rename)

| `data-testid` | Component | File |
|--------------|-----------|------|
| `cma-form` | `CmaForm` wrapper | `src/components/seller/cma-form.tsx` |
| `cma-form-fields` | Form fields container | `src/components/seller/cma-form.tsx` |
| `cma-confirmation` | CMA confirmation screen | `src/components/seller/seller-confirmation.tsx` |
| `cma-hero` | CMA value proposition section | `src/components/seller/cma-hero.tsx` |
| `cma-submit-button` | Submit button | `src/components/seller/cma-form.tsx` |
| `location-text-input` | Text address input (reused from 5.1) | `src/components/seller/location-picker.tsx` |
| `location-map` | Map container (reused from 5.1) | `src/components/seller/location-picker.tsx` |

---

## Recommended Activation Order

| Order | Component | Tests to Activate |
|-------|-----------|------------------|
| 1 | `CmaHero` | `cma-form.spec.tsx` — 5.2-E2E-001 |
| 2 | `CmaForm` fields rendering | `cma-form.spec.tsx` — 5.2-COMP-001 |
| 3 | `CmaForm` validation | `cma-form.spec.tsx` — 5.2-COMP-002 tests |
| 4 | `buildCmaLeadPayload` | `cma-form.spec.tsx` — 5.2-COMP-003 |
| 5 | `CmaForm` confirmation flow | `cma-form.spec.tsx` — 5.2-COMP-004 |
| 6 | `CmaForm` i18n | `cma-form.spec.tsx` — 5.2-COMP-006 |

---

## ATDD Artifacts

- **Story file:** `_bmad-output/implementation-artifacts/5-2-cma-request-form.md`
- **This checklist:** `_bmad-output/test-artifacts/atdd-checklist-5-2-cma-request-form.md`
- **Component tests:** `tests/unit/seller/cma-form.spec.tsx`
- **Next workflow:** `bmad-dev-story` → implement story 5.2 with these tests guiding the TDD cycle
