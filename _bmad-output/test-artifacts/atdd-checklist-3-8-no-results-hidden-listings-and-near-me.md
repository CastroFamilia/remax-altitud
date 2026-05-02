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
storyId: '3.8'
storyKey: 3-8-no-results-hidden-listings-and-near-me
storyFile: _bmad-output/implementation-artifacts/3-8-no-results-hidden-listings-and-near-me.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-3-8-no-results-hidden-listings-and-near-me.md
generatedTestFiles:
  - tests/unit/search/no-results-state.spec.tsx
  - tests/unit/search/use-geolocation.spec.tsx
  - tests/unit/search/near-me-button.spec.tsx
  - tests/e2e/no-results-hidden-listings-and-near-me.spec.ts
inputDocuments:
  - _bmad/tea/config.yaml
  - _bmad-output/implementation-artifacts/3-8-no-results-hidden-listings-and-near-me.md
  - _bmad-output/test-artifacts/test-design-epic-3.md
  - vitest.config.mts
  - tests/unit/search/property-grid.spec.tsx
  - resources/knowledge/data-factories.md
  - resources/knowledge/component-tdd.md
  - resources/knowledge/test-quality.md
  - resources/knowledge/test-healing-patterns.md
  - resources/knowledge/selector-resilience.md
---

# ATDD Checklist: Story 3.8 — No-Results, Hidden Listings & Near Me

## TDD Red Phase (Current)

All red-phase test scaffolds generated.

- Unit Tests: 20 tests across 3 spec files (all skipped with `it.skip()`)
  - `tests/unit/search/no-results-state.spec.tsx` — 6 tests
  - `tests/unit/search/use-geolocation.spec.tsx` — 6 tests
  - `tests/unit/search/near-me-button.spec.tsx` — 6 tests
- Updated Spec: `tests/unit/search/property-grid.spec.tsx` — 2 new `it.skip()` tests added + NoResultsState mock injected
- E2E Tests: 7 tests (all skipped with `test.skip()`)
  - `tests/e2e/no-results-hidden-listings-and-near-me.spec.ts`

## Acceptance Criteria Coverage

| AC | Description | Test File | Test IDs |
|----|-------------|-----------|----------|
| AC #1 | No-results state shows suggestions + WhatsApp CTA | `no-results-state.spec.tsx`, `property-grid.spec.tsx`, E2E | `3.8-E2E-002` |
| AC #2 | WhatsApp CTA forwards search criteria in message | `no-results-state.spec.tsx`, E2E | `3.8-E2E-002`, `3.8-E2E-005` |
| AC #3 | Hidden listing URL shows "no longer available" + similar properties | E2E | `3.8-E2E-003` |
| AC #4 | Near Me button invokes Geolocation API | `near-me-button.spec.tsx`, E2E | `3.8-E2E-001`, `3.8-E2E-004` |
| AC #5 | Geolocation granted → map flies to user coords | `use-geolocation.spec.tsx`, `near-me-button.spec.tsx`, E2E | `3.8-E2E-004` |
| AC #6 | Geolocation denied → fallback to nearest office + message | `use-geolocation.spec.tsx`, `near-me-button.spec.tsx`, E2E | `3.8-E2E-001` |
| AC #7 | Every empty/error state has a forward path | E2E | `3.8-E2E-002`, `3.8-E2E-003` |
| R-007 | errorCallback MUST be provided — prevents unhandled rejection | `use-geolocation.spec.tsx` | R-007 unit test |

## Test Strategy

### Unit Tests (Vitest + jsdom)

**`no-results-state.spec.tsx`** — P0/P1 tests for `NoResultsState` component:
- Root element has `data-testid="no-results-state"`
- Renders without throwing with empty filters `{}`
- WhatsApp href contains `wa.me`
- WhatsApp href encodes active filter values (type, price, multiple fields)
- WhatsApp anchor has `data-testid="no-results-whatsapp-cta"`

**`use-geolocation.spec.tsx`** — P0/P1 tests for `useGeolocation` hook:
- Initial state is `{ status: 'idle', coords: null, fallbackCoords: null }`
- Success path: `status === 'success'`, coords match
- PERMISSION_DENIED (code 1): `status === 'denied'`, fallbackCoords non-null, fallbackMessage non-null
- POSITION_UNAVAILABLE (code 2): `status === 'error'`, fallbackCoords non-null
- No geolocation support: `status === 'error'` with fallback (R-007 guard)

**`near-me-button.spec.tsx`** — P0 tests for `NearMeButton` component:
- Renders `data-testid="near-me-button"`
- Enabled when status is `'idle'`, disabled when `'loading'`
- Click calls `requestLocation`
- `onLocationSuccess` called when status → `'success'`
- `onLocationFallback` called when status → `'denied'`

**`property-grid.spec.tsx`** — 2 new P0 `it.skip()` tests added (Story 3.8):
- Renders `NoResultsState` when `properties=[]` and `isLoading=false`
- Passes `filters` prop through to `NoResultsState`

### E2E Tests (Playwright)

**`no-results-hidden-listings-and-near-me.spec.ts`** — 7 E2E scenarios:
- `3.8-E2E-001 [P0]` — Near Me denied → fallback message shown with office reference
- `3.8-E2E-002 [P0]` — Zero-results state shows NoResultsState + WhatsApp CTA
- `3.8-E2E-003 [P0]` — Hidden listing URL shows "no longer available" + similar properties list + agent CTA
- `3.8-E2E-004 [P0]` — Near Me granted → map stays functional (fly-to invoked)
- `3.8-E2E-005 [P0]` — WhatsApp CTA href encodes search filter criteria
- `[P1]` — Near Me button visible on mobile viewport
- `[P1]` — No-results primary CTA links to `/search` (no dead ends)
- `[P1]` — Near Me fallback message can be dismissed

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

1. **Task 1 (NoResultsState upgrade)**: Remove `it.skip` from `no-results-state.spec.tsx`
   - Run: `npx vitest run tests/unit/search/no-results-state.spec.tsx`
   - Verify tests FAIL, implement, verify tests PASS

2. **Task 2 + 3 + 4 (PropertyGrid + filters chain)**: Remove `it.skip` from `property-grid.spec.tsx` Story 3.8 tests
   - Run: `npx vitest run tests/unit/search/property-grid.spec.tsx`
   - Verify new tests FAIL, implement, verify PASS

3. **Task 6 (useGeolocation hook)**: Remove `it.skip` from `use-geolocation.spec.tsx`
   - Run: `npx vitest run tests/unit/search/use-geolocation.spec.tsx`
   - Verify tests FAIL, implement, verify PASS

4. **Task 8 (NearMeButton)**: Remove `it.skip` from `near-me-button.spec.tsx`
   - Run: `npx vitest run tests/unit/search/near-me-button.spec.tsx`
   - Verify tests FAIL, implement, verify PASS

5. **After full feature implementation**: Remove `test.skip` from E2E tests:
   - Run: `npx playwright test tests/e2e/no-results-hidden-listings-and-near-me.spec.ts`
   - Verify E2E tests PASS

6. **Regression check**: `npm test` — all existing tests must pass

## Implementation Guidance

### New files to CREATE:

```
src/hooks/use-geolocation.ts                ← NEW: Browser Geolocation API hook
src/lib/constants/offices-geo.ts            ← NEW: Office lat/lng constants
src/components/search/near-me-button.tsx    ← NEW: NearMe Client Component
```

### Existing files to MODIFY:

```
src/components/property/no-results-state.tsx       ← Add filters prop + dynamic WhatsApp message
src/components/property/listing-removed-state.tsx  ← Add data-testid
src/components/property/property-grid.tsx          ← Use NoResultsState, add filters prop
src/components/search/split-view-layout.tsx        ← Add flyToTarget state, NearMeButton, fallback msg
src/components/search/search-page-client.tsx       ← Pass filters prop to SplitViewLayout
src/components/map/map-view.tsx                    ← Add flyToTarget prop + flyTo effect
src/app/[locale]/property/[slug]/page.tsx          ← Add data-testid attributes only
src/messages/en.json                               ← Add NearMe namespace
src/messages/es.json                               ← Add NearMe namespace
tests/unit/search/property-grid.spec.tsx           ← Updated (done in ATDD phase)
```

### Critical data-testid values (new):

| testid | Element | Story task |
|--------|---------|------------|
| `no-results-state` | Root of `NoResultsState` | Task 1 |
| `no-results-whatsapp-cta` | WhatsApp anchor in `NoResultsState` | Task 1 |
| `near-me-button` | Root button of `NearMeButton` | Task 8 |
| `near-me-fallback-message` | Fallback notification banner | Task 10 |
| `listing-unavailable-page` | Root container of hidden listing page | Task 5 |
| `similar-properties-list` | `<ul>` in hidden listing page | Task 5 |

### Key risks:

- **R-007**: `navigator.geolocation.getCurrentPosition` errorCallback MUST be provided — missing it causes unhandled rejection on permission denied. Covered by `use-geolocation.spec.tsx`.
- **`'use client'` rule**: Must be the FIRST line in `near-me-button.tsx` and `use-geolocation.ts` — before ALL imports.
- **Mock ordering**: All `vi.mock()` calls MUST be before component/hook imports in spec files.
- **E2E prerequisite**: `HIDDEN_PROPERTY_SLUG` must be seeded in the test DB as `isVisible=false`.

### ATDD Handoff

- Story file: `_bmad-output/implementation-artifacts/3-8-no-results-hidden-listings-and-near-me.md`
- Next workflow: `bmad-dev-story` (implement the feature)
- Post-implementation workflow: `bmad-testarch-automate` (activate skipped tests)
