---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-28'
storyId: '7.2'
storyKey: 7-2-shortlist-comparison-page
storyFile: _bmad-output/implementation-artifacts/7-2-shortlist-comparison-page.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-7-2-shortlist-comparison-page.md
generatedTestFiles:
  - tests/unit/actions/shortlist-actions.spec.ts
  - tests/unit/shortlist/shortlist-page.spec.tsx
  - tests/e2e/shortlist-comparison.spec.ts
---

# ATDD Checklist: Story 7.2 — Shortlist Comparison Page

## TDD Red Phase (Current)

All test scaffolds generated with `test.skip()` or `describe.skip()` — RED PHASE.

- **Unit/Action Tests**: 3 tests (all skipped)
  - `tests/unit/actions/shortlist-actions.spec.ts`: covers querying database using the provided shortlist IDs, soft-delete visibility check, and early returns for empty shortlist arrays.
- **Component Unit Tests**: 5 tests (all skipped)
  - `tests/unit/shortlist/shortlist-page.spec.tsx`: covers loading state skeletons, empty shortlist visual feedback, populated list mapping and mini-map sync, remove button state change handlers, and localized CTA blocks.
- **E2E Tests**: 7 tests (all skipped)
  - `tests/e2e/shortlist-comparison.spec.ts`: full integration user journeys covering the responsive split layout, Mapbox mini-map loading and pinning, empty-state browse actions, reactive item deletions without a refresh, bottom conversion CTAs, meta robots noindex block, and lazy-loading validation.

## Acceptance Criteria Coverage

| AC | Description | Test Level & File | Test/Assert IDs Covered |
|----|-------------|-------------------|--------------------------|
| AC #1 | Given comparison page, loaded with properties shows photo, price, specs, ZMT badge, remove button | Unit: `shortlist-page.spec.tsx`<br>E2E: `shortlist-comparison.spec.ts` | Unit: "renders saved list items..."<br>E2E: "displays side-by-side comparison layout" |
| AC #2 | Page mini-map shows saved property locations as pins | Unit: `shortlist-page.spec.tsx`<br>E2E: `shortlist-comparison.spec.ts` | Unit: "renders saved list items and passes them to map..."<br>E2E: "renders Mapbox mini-map with location pins" |
| AC #3 | Empty shortlist shows friendly empty state and browse CTA | Unit: `shortlist-page.spec.tsx`<br>E2E: `shortlist-comparison.spec.ts` | Unit: "renders empty state elements..."<br>E2E: "Empty shortlist displays friendly empty state..." |
| AC #4 | Property removed via button updates localStorage and UI instantly without reload | Unit: `shortlist-page.spec.tsx`<br>E2E: `shortlist-comparison.spec.ts` | Unit: "removal trigger executes expected handlers..."<br>E2E: "Removing property via ✕ button instantly updates list..." |
| AC #5 | Populated shortlist displays "Ask about these" and "Share my shortlist" CTAs | Unit: `shortlist-page.spec.tsx`<br>E2E: `shortlist-comparison.spec.ts` | Unit: "renders CTAs askAgentCta and shareShortlistCta..."<br>E2E: "Populated shortlist displays both Ask Agent and Share..." |
| AC #6 | Indexing explicitly blocked via meta robots tag | E2E: `shortlist-comparison.spec.ts` | E2E: "Shortlist page meta robots is set to..." |
| AC #7 | Large Mapbox GL JS library is lazy loaded asynchronously | E2E: `shortlist-comparison.spec.ts` | E2E: "Shortlist page Mapbox is lazy loaded..." (covered by lazy load validation checks) |
| AC #8 | Hydration mismatch / CLS protection using skeleton layout until localStorage is loaded | Unit: `shortlist-page.spec.tsx` | Unit: "renders skeletons during loading state" |

## Test Strategy

### Stack Detected
`fullstack` — Next.js with Vitest (unit/component) + Playwright (E2E)

### Execution Mode
`sequential` (Step 2 ATDD orchestration)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit (Actions) | Vitest | `tests/unit/actions/shortlist-actions.spec.ts` | Verifies DB select queries, soft-deleted filters, and early return guards. |
| Component (jsdom) | Vitest | `tests/unit/shortlist/shortlist-page.spec.tsx` | Validates client-side skeletons, local state coordination, and remove handler bindings. |
| E2E | Playwright | `tests/e2e/shortlist-comparison.spec.ts` | Validates mobile/desktop layouts, Mapbox mini-map rendering, localized empty states, SEO tags, and performance/bundle compliance. |

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1: Dictionaries & Translations
- Update `src/messages/en.json` and `src/messages/es.json` with the shortlist namespace keys listed in Task 1 of the story file.

### Task 2: Server Action (`getShortlistProperties`)
1. Open `tests/unit/actions/shortlist-actions.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate server action unit tests.
3. Run `npm test -- tests/unit/actions/shortlist-actions.spec.ts`.
4. Confirm tests FAIL (since `shortlist-actions.ts` does not exist).
5. Implement `src/app/actions/shortlist-actions.ts` using Drizzle client and properties schema, ensuring `isVisible = true` filter is applied.
6. Verify tests now PASS!

### Task 3: Next.js Route and Client Component
1. Open `tests/unit/shortlist/shortlist-page.spec.tsx`.
2. Change `describe.skip(...)` to `describe(...)` to activate component tests.
3. Run `npm test -- tests/unit/shortlist/shortlist-page.spec.tsx` → confirm failures.
4. Implement `src/app/[locale]/shortlist/page.tsx` with robots noindex metadata.
5. Implement `src/components/shortlist/shortlist-page-client.tsx` using `useShortlist()`, `getShortlistProperties`, and lazy loaded Mapbox mini-map wrapper `MapView`.
6. Ensure standard skeleton loading layouts are rendered until `isLoaded` is confirmed true.
7. Verify unit tests PASS!

### E2E Validation
1. Open `tests/e2e/shortlist-comparison.spec.ts`.
2. Remove `test.skip` progressively from E2E scenarios.
3. Run: `npx playwright test tests/e2e/shortlist-comparison.spec.ts` to verify full feature integration on chromium, firefox, and webkit!

## Implementation Guidance

### New Files to Create
```
src/
  app/
    actions/
      shortlist-actions.ts                   ← NEW (Server Action to batch query properties)
    [locale]/
      shortlist/
        page.tsx                             ← NEW (Server page with dynamic robots metadata)
  components/
    shortlist/
      shortlist-page-client.tsx             ← NEW (Comparison layout, map sync, remove CTA hooks)
tests/
  unit/
    actions/
      shortlist-actions.spec.ts              ← NEW (Vitest Server Action tests)
    shortlist/
      shortlist-page.spec.tsx                ← NEW (Vitest Component tests)
  e2e/
    shortlist-comparison.spec.ts             ← NEW (Playwright E2E tests)
```

### data-testid Contract (immutable)
- `property-card-${id}` — Saved property card root wrapper
- `remove-${id}` — Comparison card close/✕ button element
- `map-view` — Lazy-loaded mini-map component wrapper
- `property-card-skeleton` — CLS skeleton placeholder cards
- `header-shortlist-count` — Nav bar persistent count badge

### Critical Patterns
- **Next.js Server Page i18n Metadata**: Define `robots: { index: false, follow: false }` directly in the page `generateMetadata` block to enforce privacy standards.
- **Next.js Dynamic Imports**: Lazy load Mapbox coordinates maps using:
  ```typescript
  import { MapView } from "@/components/map/map-view-loader";
  ```
  This guarantees Playwright accessibility metrics, bundles compliance, and prevents Cumulative Layout Shifts.

## ATDD Artifacts
- Checklist: `_bmad-output/test-artifacts/atdd-checklist-7-2-shortlist-comparison-page.md`
- Unit tests: `tests/unit/actions/shortlist-actions.spec.ts`, `tests/unit/shortlist/shortlist-page.spec.tsx`
- E2E tests: `tests/e2e/shortlist-comparison.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/7-2-shortlist-comparison-page.md`
