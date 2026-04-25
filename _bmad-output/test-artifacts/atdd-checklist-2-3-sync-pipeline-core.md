---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-04-25'
storyId: '2.3'
storyKey: 2-3-sync-pipeline-core
storyFile: _bmad-output/implementation-artifacts/2-3-sync-pipeline-core.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-2-3-sync-pipeline-core.md
generatedTestFiles:
  - tests/unit/sync/differ.spec.ts
  - tests/unit/sync/slugify.spec.ts
  - tests/unit/sync/pipeline.spec.ts
  - tests/unit/db/sync-log.spec.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/2-3-sync-pipeline-core.md
  - _bmad-output/test-artifacts/test-design-epic-2.md
  - _bmad/tea/config.yaml
  - vitest.config.ts
  - tests/unit/sync/api-client.spec.ts
  - tests/unit/sync/parser.spec.ts
  - tests/unit/sync/config.spec.ts
tddPhase: RED
workflowStatus: completed
---

# ATDD Checklist — Story 2.3: Sync Pipeline Core

**Date:** 2026-04-25
**Author:** BAD ATDD Agent
**TDD Phase:** RED — all generated tests use `it.skip()` until implementation is complete
**Story:** 2.3 — Sync Pipeline Core
**Test Framework:** Vitest (Node environment)

---

## Step 1 Summary: Preflight & Context

### Stack Detection

- **Detected stack:** `fullstack` (Next.js 15 + Vitest + no Playwright config)
- **Test execution:** Vitest with Node environment (no browser, no Playwright)
- **Pact.js Utils:** Enabled in TEA config but not applicable — this story has no consumer/provider contract boundary (the RE/MAX CCA API is an external HTTP API, not a Pact-compatible provider)
- **Browser automation:** Not applicable for this story (pure server-side sync pipeline)

### Prerequisites Verified

- [x] Story 2.3 has 16 clear, unambiguous acceptance criteria
- [x] Vitest configured in `vitest.config.ts` with `tests/unit/**/*.spec.ts` include pattern
- [x] `tests/setup/server-only-shim.ts` in place for `server-only` module resolution
- [x] Existing test patterns reviewed (api-client, parser, config, schema specs)
- [x] Epic 2 test design reviewed — P0/P1 scenarios for Story 2.3 identified
- [x] Story 2.3 implementation task list reviewed for module boundaries

---

## Step 2 Summary: Generation Mode

**Mode:** AI Generation (no browser recording needed)
**Rationale:** Story 2.3 is entirely server-side (sync pipeline). All ACs are testable as pure unit/integration tests with mocked dependencies. No UI flows, no browser interaction.

---

## Step 3 Summary: Test Strategy

### Acceptance Criteria → Test Mapping

| AC | Description | Test Level | Priority | File | Risk |
|----|-------------|-----------|----------|------|------|
| #1 | sync_log created with status="running" before API calls | Unit | P0 | pipeline.spec.ts | R-011 |
| #2 | SHA-256 hash computed; NEW/UPDATED/UNCHANGED/REMOVED classified | Unit | P0 | differ.spec.ts | R-001 |
| #3 | New properties inserted with all parsed fields | Unit | P0 | pipeline.spec.ts (upsertProperty call) | R-001 |
| #4 | Only changed columns written; unchanged = zero writes | Unit | P0 | differ.spec.ts + pipeline.spec.ts | R-001, R-004 |
| #5 | Expired listings (isExpired=true) treated as REMOVED | Unit | P0 | differ.spec.ts | R-001 |
| #6 | Listings absent from API → is_visible=false (soft delete) | Unit | P0 | differ.spec.ts + pipeline.spec.ts | R-001 |
| #7 | Previously soft-deleted listing re-appears → is_visible restored | Unit | P0 | differ.spec.ts | R-007 |
| #8 | Agents upserted; listing_count updated after property upserts | Unit | P1 | pipeline.spec.ts | — |
| #9 | sync_log updated: status="success", all counts accurate | Unit | P0 | pipeline.spec.ts + sync-log.spec.ts | R-011 |
| #10 | On uncaught exception: status="failure", errorMessage set, re-throw | Unit | P0 | pipeline.spec.ts + sync-log.spec.ts | R-002 |
| #11 | Invalid records skipped; error logged; status="partial" if any | Unit | P0 | pipeline.spec.ts + sync-log.spec.ts | R-001 |
| #12 | lotSizeUnitWarning=true → error entry in sync_log.errors; upsert not blocked | Unit | P1 | pipeline.spec.ts | — |
| #13 | /api/sync: 401 if CRON_SECRET missing/wrong | Unit | P0 | pipeline.spec.ts (route tests) | — |
| #14 | /api/revalidate called after successful sync (ISR) | Unit | P0 | pipeline.spec.ts | R-005 |
| #15 | Empty Altitud Cero office → pipeline completes without error | Unit | P0 | pipeline.spec.ts | R-010 |
| #16 | All toolchain checks pass; no client-side server-only leakage | Static | P1 | Verified at CI step | NFR11 |

### Additional Edge Cases (from Epic 2 Test Design)

| Scenario | File | Priority | Risk |
|----------|------|----------|------|
| null apiHash in DB → treated as UPDATED | differ.spec.ts | P2 | R-001 |
| 300 UNCHANGED records → zero upsertProperty calls | pipeline.spec.ts | P1 | R-004 (NFR15) |
| /api/revalidate returns 500 → pipeline still succeeds | pipeline.spec.ts | P1 | R-005 |
| Slug generation with accented chars (Árbol → arbol) | slugify.spec.ts | P0 | — |
| Slug conflict resolution (suffix appended) | slugify.spec.ts | P1 | — |
| Partial patch to updateSyncLog (only provided fields written) | sync-log.spec.ts | P1 | R-011 |

---

## Step 4 Summary: Generated Test Files

### 1. `tests/unit/sync/differ.spec.ts`

**Module:** `src/lib/sync/differ.ts` (not yet implemented)
**ACs Covered:** #2, #4, #5, #6, #7
**Risks:** R-001 (diff correctness)

| Test | Priority | Status |
|------|----------|--------|
| computePropertyHash — same hash for identical inputs | P0 | SKIPPED (red phase) |
| computePropertyHash — different hash when priceUsd changes | P0 | SKIPPED (red phase) |
| computePropertyHash — different hash when titleEn changes | P1 | SKIPPED (red phase) |
| computePropertyHash — different hash when images change | P1 | SKIPPED (red phase) |
| computePropertyHash — images array order is sorted (stable hash) | P1 | SKIPPED (red phase) |
| computePropertyHash — apiRaw excluded from hash | P2 | SKIPPED (red phase) |
| diffProperties — new API record → NEW | P0 | SKIPPED (red phase) |
| diffProperties — changed hash → UPDATED | P0 | SKIPPED (red phase) |
| diffProperties — same hash + is_visible=true → UNCHANGED | P0 | SKIPPED (red phase) |
| diffProperties — DB-only record → REMOVED | P0 | SKIPPED (red phase) |
| diffProperties — is_visible=false + same hash → UPDATED (reactivation) | P0 | SKIPPED (red phase) |
| diffProperties — isExpired=true → REMOVED | P0 | SKIPPED (red phase) |
| diffProperties — mixed batch (all 4 categories) | P1 | SKIPPED (red phase) |
| diffProperties — 300 UNCHANGED = zero writes | P1 | SKIPPED (red phase) |
| diffProperties — null apiHash → UPDATED | P2 | SKIPPED (red phase) |

**Test count:** 15

---

### 2. `tests/unit/sync/slugify.spec.ts`

**Module:** `src/lib/sync/utils/slugify.ts` (not yet implemented)
**ACs Covered:** #3
**Task:** Task 9

| Test | Priority | Status |
|------|----------|--------|
| Plain English title → lowercased hyphenated slug | P0 | SKIPPED (red phase) |
| Accented characters stripped via NFD | P0 | SKIPPED (red phase) |
| Leading/trailing hyphens trimmed | P0 | SKIPPED (red phase) |
| Special chars → hyphens, collapsed | P0 | SKIPPED (red phase) |
| Suffix appended when provided | P1 | SKIPPED (red phase) |
| Empty string → empty string | P1 | SKIPPED (red phase) |
| All-special-chars → empty string | P1 | SKIPPED (red phase) |
| Spanish characters (ñ, ü, ó) | P2 | SKIPPED (red phase) |
| Very long title → no runtime error | P2 | SKIPPED (red phase) |
| Digits preserved | P3 | SKIPPED (red phase) |

**Test count:** 10

---

### 3. `tests/unit/db/sync-log.spec.ts`

**Module:** `src/lib/db/queries/sync-log.ts` (not yet implemented)
**ACs Covered:** #1, #9, #10, #11
**Risks:** R-011

| Test | Priority | Status |
|------|----------|--------|
| createSyncLog — inserts row with status="running" | P0 | SKIPPED (red phase) |
| createSyncLog — startedAt=now() included | P0 | SKIPPED (red phase) |
| updateSyncLog — updates to status="success" with counts | P0 | SKIPPED (red phase) |
| updateSyncLog — updates to status="failure" with errorMessage | P0 | SKIPPED (red phase) |
| updateSyncLog — updates to status="partial" with errors | P1 | SKIPPED (red phase) |
| updateSyncLog — partial patch (only provided fields) | P1 | SKIPPED (red phase) |

**Test count:** 6

---

### 4. `tests/unit/sync/pipeline.spec.ts`

**Module:** `src/lib/sync/pipeline.ts` + `src/app/api/sync/route.ts` (not yet implemented)
**ACs Covered:** #1, #3, #4, #6, #8, #9, #10, #11, #12, #13, #14, #15
**Risks:** R-001, R-002, R-004, R-005, R-007, R-010, R-011

| Test | Priority | Status |
|------|----------|--------|
| createSyncLog called BEFORE fetchPropertiesForOffice | P0 | SKIPPED (red phase) |
| 4 endpoints fetched in parallel | P0 | SKIPPED (red phase) |
| sync_log updated to "success" with accurate counts | P0 | SKIPPED (red phase) |
| Zero writes for UNCHANGED records (300 unchanged) | P0 | SKIPPED (red phase) |
| /api/revalidate called after successful sync | P0 | SKIPPED (red phase) |
| Uncaught exception → status="failure", re-throw | P0 | SKIPPED (red phase) |
| Parse errors → status="partial" | P0 | SKIPPED (red phase) |
| Altitud Cero empty → sync completes successfully | P0 | SKIPPED (red phase) |
| lotSizeUnitWarning → error logged, upsert not blocked | P1 | SKIPPED (red phase) |
| Revalidation failure → pipeline still succeeds | P1 | SKIPPED (red phase) |
| Soft-delete REMOVED apiIds | P1 | SKIPPED (red phase) |
| Agent listing_count updated after property upserts | P1 | SKIPPED (red phase) |
| /api/sync: 401 when no Authorization header | P0 | SKIPPED (red phase) |
| /api/sync: 401 when wrong CRON_SECRET | P0 | SKIPPED (red phase) |
| /api/sync: 200 + pipeline triggered on valid CRON_SECRET | P1 | SKIPPED (red phase) |

**Test count:** 15

---

## Step 5 Summary: Validation & Completion

### TDD Red Phase Compliance

- [x] All tests use `it.skip()` — none will run until developer activates them
- [x] All tests assert EXPECTED behavior (not placeholder `expect(true).toBe(true)`)
- [x] No active passing tests — this is TDD RED phase
- [x] Temp artifacts stored in `_bmad-output/test-artifacts/`, not random locations

### AC Coverage Audit

| AC | Test(s) Present | Priority |
|----|-----------------|----------|
| #1 (sync_log created before API calls) | pipeline.spec.ts + sync-log.spec.ts | P0 |
| #2 (diff classifies records) | differ.spec.ts | P0 |
| #3 (new properties inserted with all fields) | pipeline.spec.ts | P0 |
| #4 (only changed cols written) | differ.spec.ts + pipeline.spec.ts | P0 |
| #5 (expired → removed) | differ.spec.ts | P0 |
| #6 (absent → soft delete) | differ.spec.ts + pipeline.spec.ts | P0 |
| #7 (soft-deleted + reappears → reactivated) | differ.spec.ts | P0 |
| #8 (agents upserted; listing_count updated) | pipeline.spec.ts | P1 |
| #9 (sync_log success + counts) | pipeline.spec.ts + sync-log.spec.ts | P0 |
| #10 (sync_log failure + errorMessage) | pipeline.spec.ts + sync-log.spec.ts | P0 |
| #11 (parse errors → partial) | pipeline.spec.ts + sync-log.spec.ts | P0 |
| #12 (lotSizeUnitWarning logged, not blocking) | pipeline.spec.ts | P1 |
| #13 (401 without CRON_SECRET) | pipeline.spec.ts (route tests) | P0 |
| #14 (ISR revalidate called) | pipeline.spec.ts | P0 |
| #15 (empty Altitud Cero → no error) | pipeline.spec.ts | P0 |
| #16 (toolchain CI check) | Not a unit test — enforced at CI (Task 11) | P1 |

**Coverage: 15/16 ACs covered by unit tests. AC #16 (CI toolchain) verified at build time.**

### Test Count Summary

| File | Tests | Priority Breakdown |
|------|-------|-------------------|
| differ.spec.ts | 15 | P0:8 P1:4 P2:2 P3:0 |
| slugify.spec.ts | 10 | P0:4 P1:3 P2:2 P3:1 |
| sync-log.spec.ts | 6 | P0:4 P1:2 P2:0 P3:0 |
| pipeline.spec.ts | 15 | P0:9 P1:5 P2:1 P3:0 |
| **Total** | **46** | P0:25 P1:14 P2:5 P3:1 |

### Risks Covered by Generated Tests

| Risk | ID | Covered By |
|------|----|------------|
| Diff logic misidentifies UNCHANGED → corruption | R-001 | differ.spec.ts (all hash/diff tests) |
| ISR revalidation not triggered | R-005 | pipeline.spec.ts |
| Soft-deleted listing doesn't reactivate | R-007 | differ.spec.ts |
| Empty Altitud Cero → pipeline crash | R-010 | pipeline.spec.ts |
| sync_log not created at start | R-011 | pipeline.spec.ts + sync-log.spec.ts |
| Incremental processing (NFR15) | R-004 | differ.spec.ts + pipeline.spec.ts |

### Fixture Needs (for developer)

The following fixtures already exist and are usable by the new tests:
- `tests/fixtures/remax-api/properties-pz-sample.json`
- `tests/fixtures/remax-api/properties-pz-empty.json`
- `tests/fixtures/remax-api/agents-pz-sample.json`

No additional fixture files are required — tests use inline factory functions.

### Key Assumptions

1. `RawProperty` and `RawAgent` types are exported from `@/lib/sync/parser` (already implemented in Story 2.2)
2. `DiffResult` type is exported from `@/lib/sync/differ.ts` (to be created in this story)
3. `SyncLog` type is exported from `@/lib/db/schema/sync-logs.ts` (created in Story 2.1)
4. The `db` export from `@/lib/db/client` is mockable via `vi.mock`
5. `/api/sync` route uses `Authorization: Bearer <CRON_SECRET>` header pattern
6. `fetchPropertiesForOffice` and `fetchAgentsForOffice` return `{ records, parseErrors }` (Story 2.2 shape)

### Handoff Paths

- **Story file:** `_bmad-output/implementation-artifacts/2-3-sync-pipeline-core.md`
- **Test files:** `tests/unit/sync/differ.spec.ts`, `tests/unit/sync/slugify.spec.ts`, `tests/unit/sync/pipeline.spec.ts`, `tests/unit/db/sync-log.spec.ts`
- **Next workflow:** `bmad-dev-story` — implement Story 2.3 against these red-phase scaffolds
- **Activation:** After implementing each module, remove `it.skip` → `it` for the corresponding test group to enter the GREEN phase

---

*Generated by bmad-testarch-atdd workflow — Story 2.3 — 2026-04-25*
