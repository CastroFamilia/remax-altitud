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
storyId: '4.2'
storyKey: 4-2-agent-card-and-contact-ctas
storyFile: _bmad-output/implementation-artifacts/4-2-agent-card-and-contact-ctas.md
atddChecklistPath: _bmad-output/implementation-artifacts/atdd-checklist-4-2-agent-card-and-contact-ctas.md
generatedTestFiles:
  - tests/unit/listing/agent-card.spec.tsx
  - tests/unit/listing/sticky-mobile-cta.spec.tsx
  - tests/unit/listing/whatsapp-utils.spec.ts
  - tests/e2e/agent-card-and-contact-ctas.spec.ts
---

# ATDD Checklist: Story 4.2 — Agent Card & Contact CTAs

## TDD Red Phase (Current)

All test scaffolds generated with `test.skip()` — RED PHASE.

- Unit Tests: 22 tests (all skipped)
  - `agent-card.spec.tsx`: 14 tests — AgentCard component
  - `sticky-mobile-cta.spec.tsx`: 8 tests — StickyMobileCTA component
  - `whatsapp-utils.spec.ts`: 5 tests — whatsapp utility functions
- E2E Tests: 12 tests (all skipped)
  - `agent-card-and-contact-ctas.spec.ts`: 12 tests — full user journeys

## Acceptance Criteria Coverage

| AC | Description | Test File | Test IDs |
|----|-------------|-----------|----------|
| AC #1 | Agent card shows photo, name, languages, office, WhatsApp + Email | `agent-card.spec.tsx`, `e2e/agent-card-and-contact-ctas.spec.ts` | COMP-001–006, E2E-001, E2E-001b, E2E-001c |
| AC #2 | WhatsApp CTA opens wa.me URL with pre-populated message | `agent-card.spec.tsx`, `whatsapp-utils.spec.ts`, `e2e` | COMP-008, UTIL-001, UTIL-003, E2E-002, E2E-002b |
| AC #3 | Spanish locale pre-populates WhatsApp message in Spanish | `whatsapp-utils.spec.ts`, `e2e` | UTIL-002, E2E-003 |
| AC #4 | Email CTA opens mailto with property context | `agent-card.spec.tsx`, `e2e` | COMP-009, E2E-004 |
| AC #5 | Transparency note about WhatsApp translation | `agent-card.spec.tsx`, `e2e` | COMP-007, E2E-005 |
| AC #6 | Sticky mobile CTA bar (56px) with WhatsApp + Email | `sticky-mobile-cta.spec.tsx`, `e2e` | STICKY-001–006, E2E-006, E2E-006b |
| AC #7 | Sticky bar hides when agent card is in viewport | `sticky-mobile-cta.spec.tsx`, `e2e` | STICKY-007, STICKY-008, E2E-007 |
| AC #8 | WhatsApp clicks tracked as lead events | `agent-card.spec.tsx`, `e2e` | COMP-010, E2E-008 |
| AC #9 | Agent card uses role="article" with ARIA labels | `agent-card.spec.tsx`, `e2e` | COMP-013, COMP-014, E2E-009 |

## Test Strategy

### Stack Detected
`frontend` — Next.js with Vitest (unit) + Playwright (E2E)

### Execution Mode
`sequential` (single-agent workflow)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit/Component | Vitest + jsdom | `tests/unit/listing/agent-card.spec.tsx` | AgentCard component behavior |
| Unit/Component | Vitest + jsdom | `tests/unit/listing/sticky-mobile-cta.spec.tsx` | StickyMobileCTA component behavior |
| Unit (node) | Vitest | `tests/unit/listing/whatsapp-utils.spec.ts` | Pure function utility testing |
| E2E | Playwright | `tests/e2e/agent-card-and-contact-ctas.spec.ts` | Full user journey validation |

### Note: No API Tests
This story introduces no new API endpoints. The WhatsApp tracking is client-side only (placeholder for Epic 5 / Story 5.3). E2E and unit tests cover all acceptance criteria.

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1: `src/lib/utils/whatsapp.ts`
1. Remove `test.skip()` from `whatsapp-utils.spec.ts` tests: UTIL-001, UTIL-002, UTIL-003, UTIL-004, UTIL-005
2. Run: `npm test -- tests/unit/listing/whatsapp-utils.spec.ts`
3. Verify tests FAIL (module doesn't exist yet)
4. Implement `buildWhatsAppMessage` and `buildWhatsAppUrl`
5. Run again → tests must PASS

### Task 2: `src/lib/utils/utm.ts`
- No dedicated unit tests for this story (simple utility, covered implicitly by tracking integration)
- Implement `extractUtmParams` per story spec

### Task 3: `src/components/agent/agent-card.tsx`
1. Remove `test.skip()` from `agent-card.spec.tsx` tests: COMP-001 through COMP-014
2. Run: `npm test -- tests/unit/listing/agent-card.spec.tsx`
3. Verify tests FAIL (component doesn't exist yet)
4. Implement `AgentCard` component
5. Run again → tests must PASS

### Task 4: `src/components/lead/whatsapp-cta.tsx`
- Needed by Task 3 mock; activate COMP-010 after implementing `trackWhatsAppClick`

### Task 6: `src/components/lead/sticky-mobile-cta.tsx`
1. Remove `test.skip()` from `sticky-mobile-cta.spec.tsx`: STICKY-001 through STICKY-008
2. Run: `npm test -- tests/unit/listing/sticky-mobile-cta.spec.tsx`
3. Verify tests FAIL (component doesn't exist yet)
4. Implement `StickyMobileCTA` component
5. Run again → tests must PASS

### E2E Tests (after full feature is wired in)
1. Ensure playwright.config.ts is configured and DB is seeded with `beautiful-mountain-home` property
2. Remove `test.skip()` from E2E tests progressively: E2E-001 → E2E-002 → E2E-003 → ...
3. Run: `npx playwright test tests/e2e/agent-card-and-contact-ctas.spec.ts`

## Implementation Guidance

### New Files to Create
```
src/
  components/
    agent/
      agent-card.tsx                   ← NEW (Client Component — 'use client')
    lead/
      whatsapp-cta.tsx                 ← NEW (lead event tracking utility)
      sticky-mobile-cta.tsx            ← NEW (Client Component — 'use client')
  lib/
    utils/
      whatsapp.ts                      ← NEW (pure functions — no 'use client')
      utm.ts                           ← NEW (browser-safe UTM extractor)
    db/queries/
      offices.ts                       ← CREATE or MODIFY (add getOfficeById)
  messages/
    en.json                            ← MODIFY (add AgentCard, StickyMobileCTA namespaces)
    es.json                            ← MODIFY (add AgentCard, StickyMobileCTA namespaces)
  app/[locale]/property/[slug]/
    page.tsx                           ← MODIFY (add officeName resolution)
public/images/
  agent-placeholder.svg                ← NEW (fallback photo)
```

### data-testid Contract (immutable)
```
data-testid="agent-card"           — root <article> in AgentCard
data-testid="agent-photo"          — agent photo image
data-testid="agent-languages"      — languages display element
data-testid="agent-whatsapp-cta"   — WhatsApp CTA link
data-testid="agent-email-cta"      — Email CTA link
data-testid="agent-transparency-note" — FR36 transparency note
data-testid="sticky-mobile-cta"    — sticky bottom bar container
```

### Critical Patterns
- `vi.mock()` calls MUST appear before any `import` statements (hoisting requirement)
- All user-visible strings MUST use `useTranslations` — NO hardcoded English
- `cn` utility: `import { cn } from "@/lib/utils"` — used by all Client Components
- `IntersectionObserver` must be mocked globally in jsdom tests (`vi.stubGlobal`)

## ATDD Artifacts

- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-4-2-agent-card-and-contact-ctas.md`
- Unit tests: `tests/unit/listing/agent-card.spec.tsx`
- Unit tests: `tests/unit/listing/sticky-mobile-cta.spec.tsx`
- Unit tests: `tests/unit/listing/whatsapp-utils.spec.ts`
- E2E tests: `tests/e2e/agent-card-and-contact-ctas.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/4-2-agent-card-and-contact-ctas.md`
