---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-05-02'
storyId: '4.3'
storyKey: '4-3-agent-profile-pages'
storyFile: '_bmad-output/implementation-artifacts/4-3-agent-profile-pages.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-4-3-agent-profile-pages.md'
generatedTestFiles:
  - 'tests/unit/listing/agent-profile-hero.spec.tsx'
  - 'tests/unit/listing/agent-index-filters.spec.tsx'
  - 'tests/unit/db/agents-profile-queries.spec.ts'
  - 'tests/e2e/agent-profile-pages.spec.ts'
inputDocuments:
  - '_bmad-output/implementation-artifacts/4-3-agent-profile-pages.md'
  - '_bmad-output/test-artifacts/test-design-epic-4.md'
  - '_bmad/tea/config.yaml'
---

# ATDD Checklist: Story 4.3 — Agent Profile Pages

**Story:** 4.3 — Agent Profile Pages
**Date:** 2026-05-02
**TDD Phase:** RED (all scaffolds generated with `test.skip()`)
**Execution Mode:** SEQUENTIAL (API + Component + E2E)

---

## TDD Red Phase Status

All test scaffolds generated with `test.skip()`. Tests assert EXPECTED behavior
that will FAIL until the feature is implemented. This is intentional (TDD red phase).

- Unit/Component Tests: 21 tests (all `test.skip()`)
- E2E Tests: 10 tests (all `test.skip()`)
- **Total: 31 red-phase test scaffolds**

---

## Acceptance Criteria Coverage

| AC | Description | Test File | Tests |
|----|-------------|-----------|-------|
| AC #1 | Agent profile: photo, name, bio, languages, office, listing count, CTAs | `agent-profile-hero.spec.tsx` + `agent-profile-pages.spec.ts` | 4.3-COMP-001..010, 4.3-E2E-001 |
| AC #2 | Agent profile: property grid below bio | `agent-profile-pages.spec.ts` | 4.3-E2E-002 |
| AC #3 | Agents index: filter by office and language | `agent-index-filters.spec.tsx` + `agent-profile-pages.spec.ts` | 4.3-COMP-013..020, 4.3-E2E-004, 4.3-E2E-005 |
| AC #4 | Agents index: all active agents with required fields | `agent-index-filters.spec.tsx` + `agent-profile-pages.spec.ts` | 4.3-COMP-011..012, 4.3-E2E-003 |
| AC #5 | Shareable standalone agent profile URLs | `agent-profile-pages.spec.ts` | 4.3-E2E-001b |
| AC #6 | SSG/ISR (NFR25) — revalidate = 86400 | `agents-profile-queries.spec.ts` (via ISR verification) | 4.3-DB-004..005 |
| AC #7 | Agent data from synced database (Epic 2) | `agents-profile-queries.spec.ts` | 4.3-DB-001..011 |

---

## Generated Files

### Unit / Component Test Files

| File | Tests | Priority Coverage | Status |
|------|-------|-------------------|--------|
| `tests/unit/listing/agent-profile-hero.spec.tsx` | 10 | P0: 5, P1: 3, P2: 2 | RED (test.skip) |
| `tests/unit/listing/agent-index-filters.spec.tsx` | 10 | P0: 4, P1: 4, P2: 2 | RED (test.skip) |
| `tests/unit/db/agents-profile-queries.spec.ts` | 11 | P0: 5, P1: 6 | RED (test.skip) |

### E2E Test File

| File | Tests | Priority Coverage | Status |
|------|-------|-------------------|--------|
| `tests/e2e/agent-profile-pages.spec.ts` | 10 | P1: 6, P2: 4 | RED (test.skip) |

---

## Risk Coverage

| Risk ID | Description | Covered By | Priority |
|---------|-------------|------------|----------|
| R-010 | Agent profile renders with stale/missing listings — ISR revalidation risk | `4.3-E2E-002b`, `4.3-COMP-008` | P2 |
| R-013 | Agent filter state not cleared on second office selection (UX bug) | `4.3-COMP-020`, `4.3-E2E-004b` | P2 |

---

## Test Strategy Summary

**Stack Detected:** `frontend` (Next.js + React)
**Execution Mode:** Sequential (AI generation, no browser recording needed for red-phase)
**Framework:** Vitest (unit/component) + Playwright (E2E, scaffolded for future activation)

### Test Level Distribution

| Level | Count | Rationale |
|-------|-------|-----------|
| Component (jsdom) | 20 | Server components (hero, listings grid) + Client components (filters, index card) |
| DB Unit (node) | 11 | Pure query functions — no browser needed |
| E2E (Playwright) | 10 | Full user journeys: profile page, index page, filtering |

### Key Design Decisions

1. **AsyncServerComponent pattern**: `AgentProfileHero` is a Server Component returning a Promise. Tests
   must await the component render. Pattern: `render(await AgentProfileHero({...}))`.
2. **vi.mock hoisting rule**: All `vi.mock()` calls are before `import` statements in every test file.
   Hard rule since Story 3.1 — violations cause silent test failures.
3. **Dynamic imports in tests**: DB query tests use `await import(...)` inside `test.skip()` to prevent
   module resolution failures before implementation exists.
4. **E2E seed requirement**: E2E tests require a seeded agent with slug `emma-smith`. These tests stay
   skipped until Playwright is configured and DB is seeded.
5. **ISR export verification**: `revalidate = 86400` is a module-level export in page.tsx files — verified
   by checking module export shape, not browser behavior.

---

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `test.skip()` from the test for the current task's component/function
2. Run tests: `npm test` (unit) or `npx playwright test` (E2E)
3. **RED**: Verify the activated test FAILS first (expected — feature not implemented)
4. Implement the feature
5. **GREEN**: Verify the activated test now PASSES
6. Commit passing tests

### Recommended Activation Order (matches story task order)

| Story Task | Tests to Activate | File |
|------------|-------------------|------|
| Task 1: `agents.ts` query functions | `4.3-DB-001..011` | `agents-profile-queries.spec.ts` |
| Task 2: `AgentProfileHero` | `4.3-COMP-001..010` | `agent-profile-hero.spec.tsx` |
| Task 7: `AgentIndexFilters` | `4.3-COMP-011..020` | `agent-index-filters.spec.tsx` |
| Tasks 5+6: Profile + Index pages | `4.3-E2E-001..007` | `agent-profile-pages.spec.ts` |

---

## Implementation Guidance

### API Endpoints / DB Functions to Implement (Task 1)

- `getAgentBySlug(slug: string)` — agent profile page lookup
- `getAllAgentSlugs()` — `generateStaticParams` at build time
- `getAllAgents()` — agents index page data
- `getPropertiesByAgentId(agentId: string)` — agent's listing grid

### UI Components to Implement

- `src/components/agent/agent-profile-hero.tsx` (Server Component)
- `src/components/agent/agent-profile-ctas.tsx` (Client Component — `'use client'`)
- `src/components/agent/agent-listings-grid.tsx` (Server Component)
- `src/components/agent/agent-index-card.tsx` (Client Component)
- `src/components/agent/agent-index-filters.tsx` (Client Component — `'use client'`)

### Pages to Implement

- `src/app/[locale]/agents/[slug]/page.tsx` (Agent profile — SSG+ISR)
- `src/app/[locale]/agents/page.tsx` (Agents index — ISR)

---

## ATDD Artifacts

- **Checklist:** `_bmad-output/test-artifacts/atdd-checklist-4-3-agent-profile-pages.md`
- **Unit test (hero):** `tests/unit/listing/agent-profile-hero.spec.tsx`
- **Unit test (filters):** `tests/unit/listing/agent-index-filters.spec.tsx`
- **DB unit tests:** `tests/unit/db/agents-profile-queries.spec.ts`
- **E2E tests:** `tests/e2e/agent-profile-pages.spec.ts`
