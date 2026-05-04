---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-04'
storyId: '5.1'
storyKey: 5-1-seller-landing-page-and-list-with-us-form
storyFile: _bmad-output/implementation-artifacts/5-1-seller-landing-page-and-list-with-us-form.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-5-1-seller-landing-page-and-list-with-us-form.md
generatedTestFiles:
  - tests/e2e/seller-landing-page.spec.ts
  - tests/unit/seller/seller-form.spec.tsx
  - tests/unit/seller/location-picker.spec.tsx
  - tests/unit/seller/seller-hero.spec.tsx
inputDocuments:
  - _bmad-output/implementation-artifacts/5-1-seller-landing-page-and-list-with-us-form.md
  - _bmad-output/test-artifacts/test-design-epic-5.md
  - _bmad/tea/config.yaml
  - tests/e2e/agent-profile-pages.spec.ts
  - tests/unit/listing/agent-profile-hero.spec.tsx
---

# ATDD Checklist: Story 5.1 — Seller Landing Page & "List With Us" Form

**Story ID:** 5.1
**Story Key:** `5-1-seller-landing-page-and-list-with-us-form`
**Date:** 2026-05-04
**Stack:** fullstack (Next.js 14 SSG + React + Vitest + Playwright)
**TDD Phase:** RED — all scaffolded tests use `test.skip()` / `it.skip()`

---

## TDD Red Phase Summary

All scaffolded tests are in **RED phase** (skipped). They assert expected behavior
that will only pass once the feature is implemented.

| Category | File | Tests (all skipped) |
|----------|------|---------------------|
| E2E (Playwright) | `tests/e2e/seller-landing-page.spec.ts` | 12 |
| Unit/Component (Vitest) | `tests/unit/seller/seller-form.spec.tsx` | 14 |
| Unit/Component (Vitest) | `tests/unit/seller/location-picker.spec.tsx` | 8 |
| Unit/Component (Vitest) | `tests/unit/seller/seller-hero.spec.tsx` | 6 |
| **Total** | | **40** |

---

## Acceptance Criteria → Test Coverage

| AC | Description | Test ID | File | Priority |
|----|-------------|---------|------|----------|
| AC #1 | SEO hero renders h1/h2, benefits, process, testimonials (200–300 words) | 5.1-E2E-003 | e2e/seller-landing-page.spec.ts | P1 |
| AC #1 | Hero renders as async Server Component | 5.1-COMP-001b (SellerHero) | unit/seller/seller-hero.spec.tsx | P1 |
| AC #2 | "Get Started" CTA shows 3-step form + progress bar | 5.1-E2E-004 | e2e/seller-landing-page.spec.ts | P1 |
| AC #2 | Progress bar updates through steps | 5.1-E2E-004b | e2e/seller-landing-page.spec.ts | P1 |
| AC #3 | Map loads progressively after 2s; text field immediate | 5.1-E2E-011 | e2e/seller-landing-page.spec.ts | P3 |
| AC #3 | Map pin-drop captures lat/lng into form state | 5.1-COMP-001 | unit/seller/location-picker.spec.tsx | P0 |
| AC #4 | Text field functional when map fails to load | 5.1-E2E-007 | e2e/seller-landing-page.spec.ts | P1 |
| AC #4 | LocationPicker fallback: text only when map unavailable | fallback test | unit/seller/location-picker.spec.tsx | P1 |
| AC #5 | Property Type radio shows 5 options | 5.1-COMP-005 | unit/seller/seller-form.spec.tsx | P2 |
| AC #5 | Size field has m²/acres/ft² toggle | 5.1-COMP-006 | unit/seller/seller-form.spec.tsx | P2 |
| AC #5 | Step 2 renders all fields for Casa type | 5.1-COMP-007 | unit/seller/seller-form.spec.tsx | P2 |
| AC #6 | Pricing-help checkbox makes price optional + attaches note | 5.1-COMP-002 | unit/seller/seller-form.spec.tsx | P1 |
| AC #6 | buildLeadPayload includes pricing consultation note | 5.1-COMP-002b | unit/seller/seller-form.spec.tsx | P1 |
| AC #7 | Step 3 renders Name, Phone, Email (optional), Language | 5.1-COMP-008 | unit/seller/seller-form.spec.tsx | P2 |
| AC #8 | Back navigation preserves entered data | 5.1-E2E-005 | e2e/seller-landing-page.spec.ts | P1 |
| AC #9 | Form completable under 3 min on 4G mobile | 5.1-E2E-009 | e2e/seller-landing-page.spec.ts | P2 |
| AC #10 | Validation errors in Spanish on /es/sell | 5.1-E2E-006 | e2e/seller-landing-page.spec.ts | P1 |
| AC #10 | Validation errors in English (EN locale) | 5.1-COMP-003 | unit/seller/seller-form.spec.tsx | P1 |
| AC #11 | 3-step form submits → confirmation with agent card | 5.1-E2E-001 | e2e/seller-landing-page.spec.ts | P0 |
| AC #12 | Page renders without JS (SSG) | 5.1-E2E-008 | e2e/seller-landing-page.spec.ts | P2 |
| AC #12 | SellerHero is Server Component (no 'use client') | file-content check | unit/seller/seller-hero.spec.tsx | P2 |
| AC #13 | All form strings in Spanish locale | 5.1-UNIT-001 | unit/seller/seller-form.spec.tsx | P2 |
| AC #14 | SellerForm lazy-loaded via next/dynamic (~15KB) | 5.1-E2E-002 | unit/seller/seller-form.spec.tsx | P0 |
| AC #14 | SellerForm named export contract | export check | unit/seller/seller-form.spec.tsx | P0 |

---

## Risk Mitigations

| Risk | Score | Mitigation Test | Status |
|------|-------|----------------|--------|
| R-004: Map pin-drop silently fails to capture coordinates | 6 (HIGH) | 5.1-COMP-001 (`location-picker.spec.tsx`) | RED — awaiting implementation |
| R-006: SellerForm not lazy-loaded (bundle bloat) | 6 (HIGH) | 5.1-E2E-002 (export contract + file check) | RED — awaiting implementation |
| R-007: Multi-step data loss on Back navigation | 4 | 5.1-E2E-005 | RED — awaiting implementation |
| R-008: Pricing-help checkbox doesn't attach note | 4 | 5.1-COMP-002 + 5.1-COMP-002b | RED — awaiting implementation |
| R-011: Validation errors in wrong locale | 3 | 5.1-E2E-006 + 5.1-COMP-003 | RED — awaiting implementation |
| R-012: Beds/Baths visible for Lote/Terreno | 2 | 5.1-COMP-004 | RED — awaiting implementation |

---

## data-testid Contract (Frozen — CANNOT Rename)

| `data-testid` | Component | File |
|--------------|-----------|------|
| `seller-hero` | `SellerHero` | `src/components/seller/seller-hero.tsx` |
| `seller-form` | `SellerForm` wrapper | `src/components/seller/seller-form.tsx` |
| `form-step-1` | Step 1 container | `src/components/seller/seller-form.tsx` |
| `form-step-2` | Step 2 container | `src/components/seller/seller-form.tsx` |
| `form-step-3` | Step 3 container | `src/components/seller/seller-form.tsx` |
| `progress-bar` | Progress indicator | `src/components/seller/seller-form.tsx` |
| `pricing-help-checkbox` | Pricing help checkbox | `src/components/seller/seller-form.tsx` |
| `location-map` | Map container | `src/components/seller/location-picker.tsx` |
| `location-text-input` | Text address input | `src/components/seller/location-picker.tsx` |
| `seller-confirmation` | Confirmation screen | `src/components/seller/seller-confirmation.tsx` |
| `seller-form-skeleton` | Skeleton during lazy-load | `src/components/seller/seller-form-skeleton.tsx` |
| `beds-baths-fields` | Beds/baths conditional wrapper | `src/components/seller/seller-form.tsx` |

---

## Generation Mode

- **Stack detected:** fullstack (Next.js 14, React, Playwright, Vitest)
- **Generation mode:** AI (sequential)
- **Playwright Utils:** enabled
- **Knowledge fragments used:** selector-resilience, fixture-architecture, component-tdd, test-quality

---

## Next Steps (Task-by-Task Activation)

During implementation of each component/task:

1. Remove `it.skip()` / `test.skip()` from the relevant test(s)
2. Run: `npm test` (Vitest) or `npx playwright test tests/e2e/seller-landing-page.spec.ts`
3. Verify activated tests **FAIL** before implementation (red phase confirmed)
4. Implement the feature
5. Verify activated tests **PASS** after implementation (green phase)
6. Commit passing tests

### Recommended Activation Order

| Order | Component | Tests to Activate |
|-------|-----------|------------------|
| 1 | `SellerHero` (Server Component) | `seller-hero.spec.tsx` — all |
| 2 | `LocationPicker` (text field first) | `location-picker.spec.tsx` — text field tests |
| 3 | `LocationPicker` (map integration) | `location-picker.spec.tsx` — 5.1-COMP-001 map tests |
| 4 | `SellerForm` Step 1 | `seller-form.spec.tsx` — Step 1 describe block |
| 5 | `SellerForm` Step 2 | `seller-form.spec.tsx` — Step 2 describe block |
| 6 | `SellerForm` Step 3 | `seller-form.spec.tsx` — Step 3 describe block |
| 7 | `SellerForm` validation | `seller-form.spec.tsx` — Validation describe block |
| 8 | `SellerConfirmation` | (integration via E2E) |
| 9 | Full E2E flow | `e2e/seller-landing-page.spec.ts` — 5.1-E2E-001 first |
| 10 | E2E: SSG, mobile, locale, Back nav | remaining E2E tests |

---

## Implementation Guidance

### New files to create

```
src/app/[locale]/sell/page.tsx                      ← SSG page (follow about/page.tsx pattern)
src/components/seller/seller-form.tsx               ← 'use client', lazy-loaded, react-hook-form
src/components/seller/seller-form-skeleton.tsx      ← skeleton during lazy-load
src/components/seller/seller-hero.tsx               ← Server Component (no 'use client')
src/components/seller/location-picker.tsx           ← 'use client', progressive map
src/components/seller/seller-confirmation.tsx       ← 'use client', uses AgentCard
src/messages/en.json                                ← MODIFY: add SellerPage namespace
src/messages/es.json                                ← MODIFY: add SellerPage namespace
```

### Critical patterns

- `SellerForm` must use `next/dynamic` with `{ ssr: false }` (R-006)
- `SellerForm` must use `react-hook-form` with a single `useForm()` instance across all 3 steps
- `LocationPicker` text field renders immediately; map loads progressively after 2s via `useEffect`
- All validation messages must use `SellerPage.form.validation.*` i18n keys
- `AgentCard` reuse in `SellerConfirmation`: pass `propertyTitle=""` and `propertyRef=""`

---

## ATDD Artifacts

- **Story file:** `_bmad-output/implementation-artifacts/5-1-seller-landing-page-and-list-with-us-form.md`
- **This checklist:** `_bmad-output/test-artifacts/atdd-checklist-5-1-seller-landing-page-and-list-with-us-form.md`
- **E2E tests:** `tests/e2e/seller-landing-page.spec.ts`
- **Component tests:** `tests/unit/seller/seller-form.spec.tsx`
- **Component tests:** `tests/unit/seller/location-picker.spec.tsx`
- **Component tests:** `tests/unit/seller/seller-hero.spec.tsx`
- **Next workflow:** `bmad-dev-story` → implement story 5.1 with these tests guiding the TDD cycle
