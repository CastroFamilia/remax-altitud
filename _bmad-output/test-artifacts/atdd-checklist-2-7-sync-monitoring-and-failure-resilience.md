---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
lastStep: step-04-generate-tests
lastSaved: '2026-04-25'
storyId: '2.7'
storyKey: 2-7-sync-monitoring-and-failure-resilience
storyFile: _bmad-output/implementation-artifacts/2-7-sync-monitoring-and-failure-resilience.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-2-7-sync-monitoring-and-failure-resilience.md
generatedTestFiles:
  - tests/unit/sync/alert.spec.ts
  - tests/unit/db/properties-unavailable.spec.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/2-7-sync-monitoring-and-failure-resilience.md
  - _bmad/tea/config.yaml
  - vitest.config.ts
  - tests/unit/sync/pipeline-error-handling.spec.ts
  - tests/unit/db/properties.spec.ts
---

# ATDD Checklist — Story 2.7: Sync Monitoring & Failure Resilience

## Step 1: Preflight & Context

**Stack detected:** `fullstack` (Next.js 15 App Router + backend sync pipeline, Vitest unit tests)

**Prerequisites verified:**
- Story status: `ready-for-dev` ✅
- Test framework: Vitest (`vitest.config.ts`) ✅
- Existing test pattern: `tests/unit/**/*.spec.ts` ✅

**Acceptance criteria loaded:**
1. AC #1: Alert sent when all 3 retries exhausted (FR51, NFR17)
2. AC #2: Site serves existing DB data when API unreachable (FR52, NFR18)
3. AC #3: Removed listing → `is_visible=false`, URL resolves to "No longer available" page (FR53)
4. AC #4: ISR on-demand revalidation fires for affected pages (AR6) — already implemented
5. AC #5: `sync_logs` shows timestamps, counts, status, error details — no new columns needed
6. AC #6: Zero downtime — all existing listings accessible on sync failure (NFR18)

---

## Step 2: Generation Mode

**Mode:** AI Generation (sequential, backend/fullstack project, no browser recording needed)

---

## Step 3: Test Strategy

| AC | Scenario | Level | Priority | File |
|----|----------|-------|----------|------|
| #1 | `sendSyncFailureAlert` called with webhook URL via POST | Unit | P0 | `alert.spec.ts` |
| #1 | `sendSyncFailureAlert` body contains error message | Unit | P0 | `alert.spec.ts` |
| #1 | `sendSyncFailureAlert` not called when webhook not set | Unit | P0 | `alert.spec.ts` |
| #6 | `sendSyncFailureAlert` swallows fetch errors, does NOT throw | Unit | P0 | `alert.spec.ts` |
| #1 | Pipeline catch block calls `sendSyncFailureAlert` on exception | Integration | P0 | `pipeline-error-handling.spec.ts` |
| #1 | `sendSyncFailureAlert` called with error message text | Integration | P0 | `pipeline-error-handling.spec.ts` |
| #1 | `updateSyncLog` called BEFORE `sendSyncFailureAlert` (order) | Integration | P0 | `pipeline-error-handling.spec.ts` |
| #1 | `sendSyncFailureAlert` NOT called on pipeline success | Integration | P1 | `pipeline-error-handling.spec.ts` |
| #1 | `sendSyncFailureAlert` NOT called on partial status | Integration | P1 | `pipeline-error-handling.spec.ts` |
| #3 | `getPropertyBySlug` returns soft-deleted properties | Unit | P0 | `properties-unavailable.spec.ts` |
| #3 | `getPropertyBySlug` returns null for nonexistent slug | Unit | P0 | `properties-unavailable.spec.ts` |
| #3 | `getSimilarProperties` filters `isVisible=true` | Unit | P0 | `properties-unavailable.spec.ts` |
| #3 | `getSimilarProperties` uses `areaSlug` filter when provided | Unit | P0 | `properties-unavailable.spec.ts` |
| #3 | `getSimilarProperties` falls back to any visible when `areaSlug=null` | Unit | P0 | `properties-unavailable.spec.ts` |
| #3 | `getSimilarProperties` orders by `syncedAt DESC` | Unit | P1 | `properties-unavailable.spec.ts` |
| #3 | `getSimilarProperties` defaults to limit=3 | Unit | P1 | `properties-unavailable.spec.ts` |

**Updated existing files (alert mock added):**
- `tests/unit/sync/pipeline-error-handling.spec.ts` — alert mock + new ATDD describe block
- `tests/unit/sync/pipeline-happy-path.spec.ts` — alert mock added
- `tests/unit/sync/pipeline-image-integration.spec.ts` — alert mock added
- `tests/unit/sync/sync-route.spec.ts` — alert mock added

---

## Step 4: Test Generation (TDD Red Phase)

### Generated Files

#### `tests/unit/sync/alert.spec.ts` (NEW)
Red-phase scaffolds for `src/lib/sync/alert.ts`:
- 6 tests: webhook configured → fetch called with correct args (P0/P1/P2)
- 3 tests: webhook not configured → graceful degradation, no fetch, no throw (P0/P1)
- 3 tests: fetch throws/fails → error swallowed, no throw, returns void (P0/P1)
- Total: **12 red-phase tests** (all marked `it.skip`)

#### `tests/unit/db/properties-unavailable.spec.ts` (NEW)
Red-phase scaffolds for `getPropertyBySlug` and `getSimilarProperties`:
- 5 tests: `getPropertyBySlug` — returns soft-deleted, visible, null (P0/P1)
- 9 tests: `getSimilarProperties` — filter, order, limit, null areaSlug (P0/P1/P2)
- Total: **14 red-phase tests** (all marked `it.skip`)

#### Updated existing files
- `pipeline-error-handling.spec.ts`: alert mock + **5 new red-phase ATDD tests** in new describe block
- `pipeline-happy-path.spec.ts`: alert mock only (no new tests)
- `pipeline-image-integration.spec.ts`: alert mock only (no new tests)
- `sync-route.spec.ts`: alert mock only (no new tests)

### TDD Phase Compliance
All new tests use `it.skip()` — they assert expected behavior and will fail until implementation is complete. Existing tests (non-skip) remain unmodified.

---

## Summary

| Metric | Value |
|--------|-------|
| New test files | 2 |
| Modified test files | 4 |
| Total new red-phase tests | 31 |
| TDD phase | RED (all skipped) |
| Existing tests affected | 0 regressions |
