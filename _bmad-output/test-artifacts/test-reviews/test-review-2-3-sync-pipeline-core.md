---
stepsCompleted:
  - step-01-load-context
  - step-02-discover-tests
  - step-03-quality-evaluation
  - step-03f-aggregate-scores
  - step-04-generate-report
lastStep: step-04-generate-report
lastSaved: '2026-04-25'
storyId: '2.3'
storyKey: 2-3-sync-pipeline-core
reviewScope: suite
detectedStack: fullstack
inputDocuments:
  - _bmad-output/implementation-artifacts/2-3-sync-pipeline-core.md
  - _bmad-output/test-artifacts/atdd-checklist-2-3-sync-pipeline-core.md
  - _bmad-output/test-artifacts/test-design-epic-2.md
  - _bmad/tea/config.yaml
  - src/lib/sync/differ.ts
  - src/lib/sync/utils/slugify.ts
  - src/lib/sync/pipeline.ts
  - src/lib/db/queries/sync-log.ts
  - src/lib/db/queries/properties.ts
  - src/lib/db/queries/agents.ts
  - tests/unit/sync/differ.spec.ts
  - tests/unit/sync/slugify.spec.ts
  - tests/unit/sync/pipeline.spec.ts
  - tests/unit/db/sync-log.spec.ts
---

# Test Quality Review — Story 2.3: Sync Pipeline Core

**Date:** 2026-04-25
**Reviewer:** BAD Master Test Architect
**Story:** 2.3 — Sync Pipeline Core
**Test Framework:** Vitest (Node environment, no browser)
**Review Scope:** All new test files for Story 2.3

---

## Executive Summary

| Metric | Value |
|---|---|
| Overall Score | 90/100 |
| Overall Grade | A |
| Total Tests | 77 passing + 3 pre-existing skips |
| Test Files Reviewed | 4 |
| Violations Found | 4 (0 HIGH, 1 MEDIUM, 3 LOW) |
| Status | APPROVED — all findings applied |

---

## Dimension Scores

| Dimension | Score | Grade | Weight | Contribution |
|---|---|---|---|---|
| Determinism | 97/100 | A+ | 30% | 29.1 |
| Isolation | 98/100 | A+ | 30% | 29.4 |
| Maintainability | 72/100 | C | 25% | 18.0 |
| Performance | 92/100 | A | 15% | 13.8 |
| **Overall** | **90/100** | **A** | 100% | 90.3 |

---

## Test Files Discovered

| File | Lines | Tests | Priority Range |
|---|---|---|---|
| `tests/unit/sync/differ.spec.ts` | 287 | 9 | P0–P2 |
| `tests/unit/sync/slugify.spec.ts` | 71 | 10 | P0–P3 |
| `tests/unit/sync/pipeline.spec.ts` | 632 | 15 | P0–P1 |
| `tests/unit/db/sync-log.spec.ts` | 202 | 6 | P0–P1 |

---

## Findings

### Finding F-001 — HIGH — Maintainability
**File:** `tests/unit/sync/pipeline.spec.ts` (632 lines)
**Category:** test-too-long
**Description:** The pipeline spec file is 632 lines, more than double the 300-line guideline (test-quality.md §4). The file mixes three distinct concerns: happy-path orchestration, error handling / edge cases, and route authorization guard. Large files are hard to understand, debug, and maintain.
**Action Applied:** Split into three focused files:
- `tests/unit/sync/pipeline-happy-path.spec.ts` (5 tests, ~180 lines) — AC #1, #3, #4, #9, #14
- `tests/unit/sync/pipeline-error-handling.spec.ts` (7 tests, ~230 lines) — AC #6, #8, #10, #11, #12, #14, #15
- `tests/unit/sync/sync-route.spec.ts` (3 tests, ~150 lines) — AC #13 auth guard
- Old `pipeline.spec.ts` removed.

### Finding F-002 — MEDIUM — Maintainability
**Files:** `tests/unit/sync/differ.spec.ts` (lines 21–76), `tests/unit/sync/pipeline.spec.ts` (lines 70–136)
**Category:** duplicate-factory
**Description:** `makeRawProperty()` factory function duplicated verbatim across two test files (55+ lines each). `makeRawAgent()` and `makeSyncLog()` also duplicated. DRY violation risks divergence when `RawProperty` shape changes in future stories.
**Action Applied:** Extracted all shared factories to `tests/unit/sync/factories.ts`. Both `differ.spec.ts` and the three new pipeline spec files import from this shared module.

### Finding F-003 — LOW — Determinism
**File:** `tests/unit/db/sync-log.spec.ts` (line 46), `tests/unit/sync/pipeline.spec.ts` (line 142)
**Category:** time-dependency
**Description:** `makeSyncLogRow()` in `sync-log.spec.ts` used `new Date("2026-04-25T12:00:00Z")` (fixed — acceptable). The `makeSyncLog()` in `pipeline.spec.ts` used `new Date()` (wall-clock — non-deterministic). While no test assertion depended on `startedAt` from the factory object, using a floating timestamp in factories is a latent risk and inconsistent with best practices.
**Action Applied:** 
- `makeSyncLog()` in shared `factories.ts` uses `FIXED_STARTED_AT = new Date("2026-04-25T12:00:00.000Z")`.
- `makeSyncLogRow()` in `sync-log.spec.ts` extracted `FIXED_STARTED_AT` constant for clarity and consistency.

### Finding F-004 — LOW — Maintainability / Performance
**File:** `tests/unit/sync/pipeline.spec.ts` (lines 581, 594, 620)
**Category:** dynamic-import-in-test-body
**Description:** Route handler imported with `await import("@/app/api/sync/route")` inside three separate `it()` bodies. This triggers module resolution on each test call rather than once per suite, adding latency and obscuring the import dependency at the top of the file.
**Action Applied:** In `sync-route.spec.ts` (the replacement file), the route handler is imported at module level: `import { POST } from "@/app/api/sync/route"`. This is cleaner and avoids repeated dynamic resolution.

---

## Quality Dimension Details

### Determinism (97/100 — A+)

All tests are deterministic. No `Math.random()`, no `Date.now()` assertions without proper handling, no `waitForTimeout()`. The `startedAt >= before` lower-bound assertion in `sync-log.spec.ts` is an acceptable timing pattern (lower-bound, not exact). Hash tests use fixed inputs. `diffProperties` tests use pure in-memory records.

**Remaining risk (LOW):** Fixed with Finding F-003 — `makeSyncLog()` now uses a pinned timestamp.

### Isolation (98/100 — A+)

Excellent isolation:
- All external modules mocked via `vi.mock()` hoisting
- `vi.clearAllMocks()` in `beforeEach` prevents mock state bleed
- `vi.restoreAllMocks()` in `afterEach` cleans up spy overrides
- Env vars saved/restored per test via `savedEnv` pattern
- `global.fetch` reset in `beforeEach` — state pollution from per-test overrides is prevented by beforeEach guard

### Maintainability (72/100 — C → improved after fixes)

Before fixes: 72/100 due to F-001 (HIGH — 632-line file) and F-002 (MEDIUM — factory duplication).
After fixes: estimated 91/100 — all three split files are under 260 lines, shared factory eliminates duplication.

**Remaining good patterns:**
- Clear `[P0]`/`[P1]` priority tagging in test names
- AC reference comments in each test
- Risk ID references (R-001, R-004, R-005, R-007, R-010, R-011)
- `describe` blocks group related tests logically
- Factory override pattern prevents test coupling

### Performance (92/100 — A)

All tests are pure unit tests running in Node with no I/O. Total suite runs in ~409ms. No serial constraints, no hard waits. The minor deduction is for the dynamic import pattern (F-004, now fixed).

---

## Acceptance Criteria Coverage

All 16 ACs from Story 2.3 are covered:

| AC | Tests | Priority |
|---|---|---|
| #1 — sync_log created before API call | pipeline-happy-path: P0 (2 tests) | P0 |
| #2 — SHA-256 hash + diff classification | differ: 9 tests | P0–P2 |
| #3 — New properties inserted with all fields | pipeline-happy-path: upsertProperty spy | P0 |
| #4 — Unchanged = zero writes | differ + pipeline-happy-path: P0 | P0 |
| #5 — Expired → REMOVED | differ: P0 | P0 |
| #6 — Absent from API → soft-delete | differ + pipeline-error-handling | P0/P1 |
| #7 — Reactivation (is_visible=false) | differ: P0 | P0 |
| #8 — Agent listing_count updated after upserts | pipeline-error-handling: P1 | P1 |
| #9 — Success status + counts | pipeline-happy-path: P0 | P0 |
| #10 — Failure status on uncaught exception | pipeline-error-handling: P0 | P0 |
| #11 — Partial status on parse errors | pipeline-error-handling: P0 | P0 |
| #12 — lotSizeUnitWarning logged, not blocking | pipeline-error-handling: P1 | P1 |
| #13 — CRON_SECRET auth guard | sync-route: P0 (3 tests) | P0 |
| #14 — ISR revalidation called (best-effort) | pipeline-happy-path + error-handling: P0/P1 | P0/P1 |
| #15 — Empty Altitud Cero → no-op | pipeline-error-handling: P0 | P0 |
| #16 — All checks pass | verified via npm test | — |

---

## NFR Compliance

| NFR | Test Coverage | Notes |
|---|---|---|
| NFR15 (incremental processing) | differ 300-record unchanged test + pipeline P0 | Zero DB writes for UNCHANGED confirmed |
| NFR11 / AR16 (server-only) | `server-only` shim in vitest config | New files with `import "server-only"` work automatically |
| AR6 (ISR best-effort) | pipeline-error-handling P1 | Non-2xx revalidate does not crash pipeline |
| AR3 / FR53 (no hard deletes) | `softDeleteProperties` mock verified | is_visible=false, not DELETE |

---

## Recommendations

1. **Coverage trace (out of scope for test-review):** Run `/bmad-testarch-trace` to verify traceability matrix completeness, especially for AC #3 (full field mapping in `upsertProperty`) which is tested indirectly via mock call assertions.

2. **Integration test gap:** No test verifies the actual Drizzle `onConflictDoUpdate` behavior against a real Postgres instance. This is acceptable for Story 2.3 (pure unit tests per story spec), but should be added in a future integration test story for the properties upsert path.

3. **Missing P2 edge case for `upsertProperty` slug conflict:** The slug conflict retry path (`isSlugConflict` branch in `properties.ts`) is untested. Consider adding a test that simulates a DB unique constraint error on `slug` to verify the retry with `apiId` suffix.

---

## Coverage Note

Coverage analysis is out of scope for `test-review`. Use `/bmad-testarch-trace` to map tests to ACs and identify any coverage gaps.

---

## Post-Review File Inventory

**New files:**
- `tests/unit/sync/factories.ts` — shared RawProperty / RawAgent / SyncLog factories
- `tests/unit/sync/pipeline-happy-path.spec.ts` — 5 happy-path orchestration tests
- `tests/unit/sync/pipeline-error-handling.spec.ts` — 7 error/edge-case tests
- `tests/unit/sync/sync-route.spec.ts` — 3 auth-guard tests for /api/sync route

**Modified files:**
- `tests/unit/sync/differ.spec.ts` — now imports `makeRawProperty` from shared factories
- `tests/unit/db/sync-log.spec.ts` — `makeSyncLogRow` uses `FIXED_STARTED_AT` constant

**Deleted files:**
- `tests/unit/sync/pipeline.spec.ts` — replaced by the three split files above

**Test count:** 77 passing (unchanged — same test logic, same coverage)
