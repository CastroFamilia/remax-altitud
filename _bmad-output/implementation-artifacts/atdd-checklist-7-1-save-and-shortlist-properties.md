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
storyId: '7.1'
storyKey: 7-1-save-and-shortlist-properties
storyFile: _bmad-output/implementation-artifacts/7-1-save-and-shortlist-properties.md
atddChecklistPath: _bmad-output/implementation-artifacts/atdd-checklist-7-1-save-and-shortlist-properties.md
generatedTestFiles:
  - tests/unit/hooks/use-shortlist.spec.tsx
  - tests/e2e/save-and-shortlist-properties.spec.ts
---

# ATDD Checklist: Story 7.1 — Save & Shortlist Properties

## TDD Red Phase (Current)

All test scaffolds generated with `test.skip()` or `describe.skip()` — RED PHASE.

- **Unit/Hook Tests**: 12 tests (all skipped)
  - `tests/unit/hooks/use-shortlist.spec.tsx`: 12 tests — covers shortlist pure utilities, react hook behavior, 20-item cap constraint, cross-component synchronization via custom change events, standard storage events, and SSR window-undefined checks.
- **E2E Tests**: 8 tests (all skipped)
  - `tests/e2e/save-and-shortlist-properties.spec.ts`: 8 tests — full user journeys covering heart icon toggles, aria-labels, 20-item cap toast notification, session-based tooltips, persistent header badges, localStorage persistence, and keyboard accessibility (Enter/Space triggers).

## Acceptance Criteria Coverage

| AC | Description | Test Level & File | Test/Assert IDs Covered |
|----|-------------|-------------------|--------------------------|
| AC #1 | Saved to localStorage on heart click, toggle visual state (stroke & fill accent) | Unit: `use-shortlist.spec.tsx`<br>E2E: `save-and-shortlist-properties.spec.ts` | Hook: "save property", "remove property"<br>E2E: "tapping the ♡ icon adds the property..." |
| AC #2 | Heart icon includes dynamic aria-label updates | E2E: `save-and-shortlist-properties.spec.ts` | E2E: "save button includes aria-label..." |
| AC #3 | Limit shortlist to 20 properties, display translated "limitReached" toast | Unit: `use-shortlist.spec.tsx`<br>E2E: `save-and-shortlist-properties.spec.ts` | Hook: "enforce 20-item cap constraint"<br>E2E: "attempting to add 21st property...", "limitReached in Spanish..." |
| AC #4 | Tapping 2nd save displays translated tooltip "agentTooltip" | E2E: `save-and-shortlist-properties.spec.ts` | E2E: "tapping 2nd save displays tooltip..." |
| AC #5 | Tooltip appears once per session only | E2E: `save-and-shortlist-properties.spec.ts` | E2E: "tapping 2nd save displays tooltip..." |
| AC #6 | Navigation bar persistent shortlist icon displays saved property count | E2E: `save-and-shortlist-properties.spec.ts` | E2E: "persistent shortlist icon in nav bar..." |
| AC #7 | Shortlist stored in localStorage persists across page navigations/browser sessions | Unit: `use-shortlist.spec.tsx`<br>E2E: `save-and-shortlist-properties.spec.ts` | Hook: "load initial state from localStorage"<br>E2E: "shortlist data stored in localStorage persists..." |
| AC #8 | SaveButton is a Client Component using `use-shortlist` hook | E2E: `save-and-shortlist-properties.spec.ts` | Covered implicitly by component rendering tests |
| AC #9 | Keyboard users can activate heart icon using Enter or Space keys | E2E: `save-and-shortlist-properties.spec.ts` | E2E: "save heart button supports activation..." |

## Test Strategy

### Stack Detected
`fullstack` — Next.js with Vitest (unit) + Playwright (E2E)

### Execution Mode
`sequential` (Step 2 ATDD orchestration)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit (jsdom) | Vitest | `tests/unit/hooks/use-shortlist.spec.tsx` | Verifies shortlist reactive hook, storage interactions, custom change events, limit checks, and server-side safety |
| E2E | Playwright | `tests/e2e/save-and-shortlist-properties.spec.ts` | Validates complete user journeys, visual indicator toggling, accessible labels, toast/tooltip notifications, nav bar updates, and keyboard control |

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1: Bilingual Translations
- Add the `Shortlist` namespace to `src/messages/en.json` and `src/messages/es.json` with keys: `limitReached`, `agentTooltip`, `saveLabel`, `removeLabel`.

### Task 2 & 3: Shortlist Utility & Hook (`use-shortlist.ts` & `shortlist.ts`)
1. Open `tests/unit/hooks/use-shortlist.spec.tsx`.
2. Change `describe.skip("Story 7.1: Shortlist Hook...", ...)` to `describe("Story 7.1: Shortlist Hook...", ...)` to activate unit tests.
3. Run `npm test -- tests/unit/hooks/use-shortlist.spec.tsx`.
4. Confirm tests FAIL (since the hook/utilities do not exist).
5. Implement `src/lib/utils/shortlist.ts` (with server-side guard returning `[]` / `success: false` if window is undefined).
6. Implement `src/hooks/use-shortlist.ts` with custom `'shortlist-change'` and standard `'storage'` event listeners.
7. Run `npm test -- tests/unit/hooks/use-shortlist.spec.tsx` again → tests must now PASS!

### Task 4 & 5: Shortlist Components (`save-button.tsx`, `shortlist-icon.tsx`)
1. Implement client components in `src/components/shortlist/`.
2. Wrap `ShortlistIcon` badge to prevent hydration shifts or mismatches (using `isLoaded` flag from the hook).
3. Ensure heart buttons have an accessible touch target (at least 44x44px), proper aria-labels, visual outlines (`#888`) or fills (`#660000`), and handle toast notifications on limit and tooltips on second save.

### E2E Validation
1. Open `tests/e2e/save-and-shortlist-properties.spec.ts`.
2. Remove `test.skip` progressively from test cases as you wire components into pages.
3. Run: `npx playwright test tests/e2e/save-and-shortlist-properties.spec.ts` (once Playwright environment is loaded and configured).

## Implementation Guidance

### New Files to Create
```
src/
  lib/
    utils/
      shortlist.ts                     ← NEW (pure JS/TS functions with SSR guards)
  hooks/
    use-shortlist.ts                   ← NEW (React custom state hook with custom window events)
  components/
    shortlist/
      save-button.tsx                  ← NEW (Client Component for heart ♡ button)
      shortlist-icon.tsx               ← NEW (Client Component for header link badge)
tests/
  unit/
    hooks/
      use-shortlist.spec.tsx           ← NEW (Vitest unit tests)
  e2e/
    save-and-shortlist-properties.spec.ts ← NEW (Playwright E2E tests)
```

### data-testid Contract (immutable)
- `save-property-button` — Heart toggle button element
- `header-shortlist-count` — Nav bar shortlist badge count element

### Critical Patterns
- **Hydration Guards**: Render standard placeholder or hidden state on the server, update once `isLoaded` becomes true.
- **Cross-Component Events**: Dispatching `shortlist-change` Event on add/remove allows sibling components (e.g. Header and Property Card) to instantly update their react state without page load or reload.

## ATDD Artifacts
- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-7-1-save-and-shortlist-properties.md`
- Unit tests: `tests/unit/hooks/use-shortlist.spec.tsx`
- E2E tests: `tests/e2e/save-and-shortlist-properties.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/7-1-save-and-shortlist-properties.md`
