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
storyId: '7.4'
storyKey: 7-4-smart-agent-routing-from-shortlist
storyFile: _bmad-output/implementation-artifacts/7-4-smart-agent-routing-from-shortlist.md
atddChecklistPath: _bmad-output/implementation-artifacts/atdd-checklist-7-4-smart-agent-routing-from-shortlist.md
generatedTestFiles:
  - tests/unit/shortlist/smart-routing.spec.tsx
  - tests/unit/actions/shortlist-agent-actions.spec.ts
  - tests/unit/leads/api-leads-routing.spec.ts
  - tests/unit/leads/leads-query.spec.ts
  - tests/e2e/smart-agent-routing.spec.ts
---

# ATDD Checklist: Story 7.4 — Smart Agent Routing from Shortlist

## TDD Red Phase (Current)

All test scaffolds generated with `describe.skip()` or `test.skip()` — RED PHASE.

- **Component Unit Tests**: 4 tests (all skipped)
  - `tests/unit/shortlist/smart-routing.spec.tsx`: covers routing logic detection (Single, Majority, Ties), background leads API POST mapping, dynamic WhatsApp and Email messages, and dynamic selection modal triggers.
- **Server Action Tests**: 3 tests (all skipped)
  - `tests/unit/actions/shortlist-agent-actions.spec.ts`: covers querying properties joined with agent details using left join, filtering out non-visible (isVisible = false) properties, and handling empty lists.
- **Leads API Tests**: 2 tests (all skipped)
  - `tests/unit/leads/api-leads-routing.spec.ts`: covers Zod schema validation for UUID arrays and assignedAgentId UUID, and coordinate-matching bypass when assignedAgentId is provided.
- **Database Query Tests**: 1 test (skipped)
  - `tests/unit/leads/leads-query.spec.ts`: covers query helper grouping logic by assigned coordinator agent and other agents.
- **E2E Integration Tests**: 4 tests (all skipped)
  - `tests/e2e/smart-agent-routing.spec.ts`: covers full user journey scenarios for single agents, majority agents, tied distribution modal selections, and alternative email channels.

## Acceptance Criteria Coverage

| AC | Description | Test Level & File | Test/Assert IDs Covered |
|----|-------------|-------------------|--------------------------|
| AC #1 | "Ask about these" CTA routes directly to WhatsApp pre-populated when 1 agent | Component: `smart-routing.spec.tsx`<br>E2E: `smart-agent-routing.spec.ts` | Unit: "routes to single agent directly..."<br>E2E: "Automatic routing to WhatsApp for Single Agent..." |
| AC #2 | Majority (2+) properties belong to 1 agent auto-suggests that agent | Component: `smart-routing.spec.tsx`<br>E2E: `smart-agent-routing.spec.ts` | Unit: "shows majority agent auto-suggest banner..."<br>E2E: "Majority agent suggestion alert..." |
| AC #3 | Tied distribution launches AgentSelectionModal showing agent details sorted by language | Component: `smart-routing.spec.tsx`<br>E2E: `smart-agent-routing.spec.ts` | Unit: "shows AgentSelectionModal on tie..."<br>E2E: "AgentSelectionModal tie distribution..." |
| AC #4 | Pre-populated WhatsApp message contains all property references (titles + apiIds) | Component: `smart-routing.spec.tsx`<br>E2E: `smart-agent-routing.spec.ts` | Unit: "routes to single agent directly..."<br>E2E: "Automatic routing to WhatsApp for Single Agent..." |
| AC #5 | Shortlist lead database record captures: assignedAgentId, shortlistPropertyIds, source, intent, UTMs, locale | API Route: `api-leads-routing.spec.ts`<br>Component: `smart-routing.spec.tsx` | Unit: "accepts assignedAgentId and shortlistPropertyIds..."<br>Unit: "routes to single agent directly..." |
| AC #6 | Admin query helper groups properties by assigned coordinator agent vs other agents | DB Query: `leads-query.spec.ts` | Unit: "retrieves shortlist lead details, grouping properties..." |
| AC #7 | AgentSelectionModal is lazy-loaded asynchronously (~5KB) on click | Component: `smart-routing.spec.tsx` | Unit: "shows AgentSelectionModal on tie..." |
| AC #8 | Email CTA alternative triggers lead capture and opens mailto link | Component: `smart-routing.spec.tsx`<br>E2E: `smart-agent-routing.spec.ts` | Unit: "supports email alternative with lead capture..."<br>E2E: "Alternative email contact triggers..." |

## Test Strategy

### Stack Detected
`fullstack` — Next.js with Vitest (unit/component) + Playwright (E2E)

### Execution Mode
`sequential` (Step 2 ATDD orchestration)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit (Actions) | Vitest | `tests/unit/actions/shortlist-agent-actions.spec.ts` | Verifies DB select/left-join query and visibility filtering. |
| API Route / Zod | Vitest | `tests/unit/leads/api-leads-routing.spec.ts` | Verifies leads endpoint Zod validations, coordinator mapping, and coordinate bypass. |
| DB Grouping | Vitest | `tests/unit/leads/leads-query.spec.ts` | Verifies admin query grouping logic for coordinator agent listings vs other agents. |
| Component (jsdom) | Vitest | `tests/unit/shortlist/smart-routing.spec.tsx` | Validates routing state machine detection, banners, dynamically lazy-loaded selection modal, and redirect formatting. |
| E2E | Playwright | `tests/e2e/smart-agent-routing.spec.ts` | Validates full end-to-end user flows, API payloads, and popup links. |

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1: Localization Keys
- Implement localization keys in `src/messages/en.json` and `src/messages/es.json` under `ShortlistRouting` namespace.

### Task 2: Modify POST `/api/leads` and Zod Schema
1. Open `tests/unit/leads/api-leads-routing.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate API route unit tests.
3. Run `npm test -- tests/unit/leads/api-leads-routing.spec.ts`.
4. Confirm tests FAIL.
5. Update `src/app/api/leads/route.ts` to extend the Zod schema and bypass coordinates check if `assignedAgentId` is supplied.
6. Verify unit tests now PASS!

### Task 3: Implement Server Action to Retrieve Properties Joined with Agent Details
1. Open `tests/unit/actions/shortlist-agent-actions.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate server action unit tests.
3. Run `npm test -- tests/unit/actions/shortlist-agent-actions.spec.ts` → confirm failures.
4. Implement `getShortlistPropertiesWithAgents` in `src/app/actions/shortlist-actions.ts`.
5. Verify unit tests PASS!

### Task 4 & 5: Implement dynamic Selection Modal, Routing, and Lead capture
1. Open `tests/unit/shortlist/smart-routing.spec.tsx`.
2. Change `describe.skip(...)` to `describe(...)` to activate component tests.
3. Run `npm test -- tests/unit/shortlist/smart-routing.spec.tsx` → confirm failures.
4. Implement dynamic `AgentSelectionModal` in `src/components/shortlist/agent-selection-modal.tsx` and integrate it via dynamic import inside `src/components/shortlist/shortlist-page-client.tsx`.
5. Implement smart routing and lead capture trigger in `src/components/shortlist/shortlist-page-client.tsx`.
6. Verify unit tests PASS!

### Task 6: Implement Grouping Query Helper
1. Open `tests/unit/leads/leads-query.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate query unit tests.
3. Run `npm test -- tests/unit/leads/leads-query.spec.ts` → confirm failures.
4. Implement `getShortlistLeadDetails` in `src/lib/db/queries/leads.ts`.
5. Verify unit tests PASS!

### E2E Validation
1. Open `tests/e2e/smart-agent-routing.spec.ts`.
2. Remove `test.skip` progressively from E2E scenarios.
3. Run: `npx playwright test tests/e2e/smart-agent-routing.spec.ts` to verify full feature integration!

## Implementation Guidance

### New Files to Create or Modify
```
src/
  messages/
    en.json                               ← MODIFY (Add ShortlistRouting localization)
    es.json                               ← MODIFY (Add ShortlistRouting localization)
  app/
    api/
      leads/
        route.ts                          ← MODIFY (Zod schema and coordinates bypass)
    actions/
      shortlist-actions.ts                ← MODIFY (Add getShortlistPropertiesWithAgents server action)
  lib/
    db/
      queries/
        leads.ts                          ← MODIFY (Add getShortlistLeadDetails grouping helper)
  components/
    shortlist/
      agent-selection-modal.tsx           ← NEW (Lazy-loaded agent coordinator modal)
      shortlist-page-client.tsx           ← MODIFY (Routing algorithm, autosuggest banner, dynamic import modal)
tests/
  unit/
    shortlist/
      smart-routing.spec.tsx              ← NEW (Vitest Component and Routing tests)
    actions/
      shortlist-agent-actions.spec.ts     ← NEW (Vitest Server Action tests)
    leads/
      api-leads-routing.spec.ts           ← NEW (Vitest API Zod and controller tests)
      leads-query.spec.ts                 ← NEW (Vitest DB grouping helper tests)
  e2e/
    smart-agent-routing.spec.ts           ← NEW (Playwright E2E tests)
```

### data-testid Contract (immutable)
- `ask-agent-button` — CTA button to trigger "Ask about these" routing flow
- `majority-agent-suggest` — Banner suggesting majority agent Emma
- `agent-selection-modal` — Coordinator agent select modal root
- `contact-email-button` — Button triggering the alternative email mailto flow

### Critical Patterns
- **Lazy Loading dynamic modal**:
  ```typescript
  const AgentSelectionModal = dynamic(
    () => import("./agent-selection-modal").then((mod) => mod.AgentSelectionModal),
    { ssr: false, loading: () => <ModalShimmer /> }
  );
  ```
  Strictly compliant with AR performance budget.

## ATDD Artifacts
- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-7-4-smart-agent-routing-from-shortlist.md`
- Unit tests: `tests/unit/shortlist/smart-routing.spec.tsx`, `tests/unit/actions/shortlist-agent-actions.spec.ts`, `tests/unit/leads/api-leads-routing.spec.ts`, `tests/unit/leads/leads-query.spec.ts`
- E2E tests: `tests/e2e/smart-agent-routing.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/7-4-smart-agent-routing-from-shortlist.md`
