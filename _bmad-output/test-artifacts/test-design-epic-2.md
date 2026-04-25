---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-04-25'
inputDocuments:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/implementation-artifacts/2-1-database-schema-and-drizzle-models.md'
  - '_bmad-output/implementation-artifacts/2-2-api-integration-and-data-fetching.md'
  - '_bmad-output/implementation-artifacts/sprint-status.yaml'
  - '_bmad/tea/config.yaml'
  - 'skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
epicScope:
  completed: ['2.1', '2.2']
  inScope: ['2.3', '2.4', '2.5', '2.6', '2.7']
---

# Test Design: Epic 2 — Data Pipeline & Property Database

**Date:** 2026-04-25
**Author:** Sebicas (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 2 — Data Pipeline & Property Database

---

## Executive Summary

**Scope:** Epic-level test design for Stories 2.3–2.7 of Epic 2 (Stories 2.1 and 2.2 are done and merged; their schema and API-client tests are treated as implemented prerequisites).

The Data Pipeline is the nervous system of the RE/MAX Altitud platform. It orchestrates a daily 8-step sync from the RE/MAX CCA API: fetch → validate → diff → translate → optimize → upsert → cleanup → revalidate. Failures here propagate to every downstream epic. The risk profile is dominated by **data integrity**, **external service reliability**, and **operational observability** concerns.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥ 6): 5
- Critical categories: DATA, OPS, TECH, PERF

**Coverage Summary:**

- P0 scenarios: 14 (~30–45 hours)
- P1 scenarios: 18 (~20–35 hours)
- P2 scenarios: 16 (~10–20 hours)
- P3 scenarios: 6 (~3–6 hours)
- **Total estimated effort:** ~63–106 hours (~8–13 days)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| Story 2.1 schema unit tests | Already done/merged; schema stability validated by migration | Treat as invariant prerequisite; rerun migration test in CI |
| Story 2.2 API-client unit tests | Done/merged; Zod parse + retry logic covered | Include integration-level smoke tests in 2.3's pipeline tests |
| Frontend/UI rendering | Epic 3+ concern | Epic 3 test plan will own UI-level assertions |
| Admin UI for sync logs | Epic 8 concern (Story 8.1) | Log content correctness is in scope; display is not |
| Mapbox / Geolocation | Not part of this epic | N/A |
| PostGIS geo-fence matching for communities | Epic 6 story 6.5 | Covered when community tagging stories are in scope |

---

## Risk Assessment

### High-Priority Risks (Score ≥ 6)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|------|--------|-------|------------|-------|----------|
| R-001 | DATA | Sync silently corrupts property records if diff logic misidentifies "unchanged" vs "changed" fields (e.g., JSONB deep-equality check fails) | 2 | 3 | 6 | Contract unit tests for diff logic; before/after DB assertions in integration tests | Dev | Before 2.3 merge |
| R-002 | OPS | Sync failure alert is not delivered (misconfigured webhook/email env var) — admin never knows the pipeline is broken | 2 | 3 | 6 | Sentinel test that deliberately fails sync and asserts alert delivery (or log entry if webhook not configured) | Dev | Before 2.7 merge |
| R-003 | DATA | Translation pipeline overwrites API-provided Spanish content with AI translation (violates Story 2.5 AC: preserve existing ES content) | 3 | 2 | 6 | Test: seed property with `title_es` populated → run translation step → assert `title_es` unchanged | Dev | Before 2.5 merge |
| R-004 | PERF | Full sync exceeds 2-hour NFR15 limit under load (1,000 listings × image optimization + DeepL calls) | 2 | 3 | 6 | Measure pipeline duration in integration test with mock external calls; establish baseline; add CI timing assertion | Dev | Before 2.3 merge |
| R-005 | TECH | ISR revalidation (/api/revalidate) not triggered after sync, causing stale listing pages in production | 2 | 3 | 6 | Integration test: run full sync → assert revalidation endpoint was called (mock or spy) | Dev | Before 2.3 merge |

### Medium-Priority Risks (Score 3–4)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|------|--------|-------|------------|-------|
| R-006 | DATA | Lifestyle tag manual overrides reset on re-sync (violates Story 2.6 AC) | 2 | 2 | 4 | Test: set manual tag → re-run sync → assert tag preserved | Dev |
| R-007 | DATA | Soft-deleted listings (is_visible=false) reappear if they return in the API feed after removal | 2 | 2 | 4 | Test: soft-delete → API returns listing again → assert it is re-activated (is_visible=true, not duplicated) | Dev |
| R-008 | PERF | DeepL rate-limit not handled gracefully; translation step crashes pipeline instead of resuming | 2 | 2 | 4 | Stub DeepL with 429 response → assert exponential backoff, no pipeline crash | Dev |
| R-009 | DATA | Image optimization stores images with non-predictable URLs, breaking JSONB array references | 2 | 2 | 4 | Integration test: assert image URL format after optimization step | Dev |
| R-010 | OPS | Altitud Cero office with zero listings triggers an error instead of graceful no-op (Story 2.2 AC) | 1 | 3 | 3 | Integration test: mock empty Altitud Cero endpoint → assert sync succeeds | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Category | Description | Prob | Impact | Score | Action |
|---------|----------|-------------|------|--------|-------|--------|
| R-011 | OPS | Sync log record not created at pipeline start (missing "running" status) | 1 | 2 | 2 | Unit test: assert sync_log row created with status "running" before any API call | Monitor |
| R-012 | DATA | API birthday field accidentally surfaced in a public endpoint | 1 | 2 | 2 | Integration test: fetch agent via public API route → assert no birthday field in response | Monitor |

### Risk Category Legend

- **TECH**: Technical/Architecture fragility, integration gaps
- **SEC**: Security (access controls, data exposure)
- **PERF**: Performance (SLA violations, timeout, throughput)
- **DATA**: Data integrity (loss, corruption, silently wrong values)
- **BUS**: Business logic errors
- **OPS**: Operations (deployment, monitoring, alerting)

---

## Entry Criteria

- [x] Stories 2.1 (schema) and 2.2 (API client) are merged and CI green
- [x] PostgreSQL + PostGIS running in CI/dev environment
- [x] Drizzle migrations applied to test database
- [ ] Story under test (2.3–2.7) is implemented and branch is open for review
- [ ] External services (DeepL, OpenAI, RE/MAX API) are mockable/stubbable in test environment
- [ ] `DATABASE_URL` and relevant API keys available as env vars in CI (or stubbed)

## Exit Criteria

- [ ] All P0 tests passing (100% pass rate required)
- [ ] All P1 tests passing or failures triaged (≥ 95%)
- [ ] Risks R-001 through R-005 verified as mitigated by corresponding tests
- [ ] No open high-risk (score ≥ 6) items without a passing test or documented waiver
- [ ] Sync pipeline end-to-end test (happy path + failure path) green in CI
- [ ] Test coverage ≥ 80% for pipeline modules

---

## Test Coverage Plan

### P0 (Critical) — Run on every commit/PR

**Criteria:** Blocks core data pipeline + High risk (≥ 6) + No workaround

| Story | Requirement | Scenario | Test Level | Risk Link | Owner |
|-------|-------------|----------|------------|-----------|-------|
| 2.3 | AR5: 8-step pipeline runs end-to-end | Happy path: fetch → validate → diff → upsert → log success | API/Integration | R-001 | Dev |
| 2.3 | AR5: diff detects new listings | New listing in API → inserted in DB with all parsed fields | Unit | R-001 | Dev |
| 2.3 | AR5: diff detects updated listings | Changed field in API → only changed columns updated | Unit | R-001 | Dev |
| 2.3 | AR3: soft delete on removal | Listing removed from API → is_visible=false, slug preserved | Unit | R-001 | Dev |
| 2.3 | NFR15: pipeline completes in <2h | Benchmark with 1,000 mocked records; assert duration | Integration | R-004 | Dev |
| 2.3 | AR6: ISR revalidation triggered | After successful sync → /api/revalidate called | Integration | R-005 | Dev |
| 2.3 | FR55: invalid records skipped | Zod-invalid record → skipped, logged in errors[], pipeline continues | Unit | R-001 | Dev |
| 2.3 | sync_log lifecycle | sync_log created as "running" → updated to "success"/"failed" | Unit | R-011 | Dev |
| 2.5 | FR48: translation does not overwrite ES | Seed property with title_es → run translation → assert title_es unchanged | Unit | R-003 | Dev |
| 2.5 | NFR19: DeepL rate-limit backoff | Stub 429 → assert retry with backoff, no crash | Unit | R-008 | Dev |
| 2.5 | FR55: translation failure isolated | Translation throws → listing skipped, pipeline continues, error logged | Unit | R-003 | Dev |
| 2.6 | FR49: manual tag override preserved | Set manual tag → re-sync → tag unchanged | Unit | R-006 | Dev |
| 2.7 | FR51: failure alert sent | All 3 retries exhausted → alert fired (spy/log assertion) | Integration | R-002 | Dev |
| 2.7 | NFR18: site resilience on failure | Sync fails → DB retains last-good state, no visible error to users | Integration | R-002 | Dev |

**Total P0:** 14 scenarios, ~30–45 hours

---

### P1 (High) — Run on PR to main

**Criteria:** Important pipeline features + Medium risk (3–4) + Common operational paths

| Story | Requirement | Scenario | Test Level | Risk Link | Owner |
|-------|-------------|----------|------------|-----------|-------|
| 2.3 | API8: empty Altitud Cero office | Mock empty office endpoint → sync completes without error | Integration | R-010 | Dev |
| 2.3 | AR5: agent sync alongside properties | AgentsPerOffice fetched → agents upserted | Integration | — | Dev |
| 2.3 | API7: expired listing flagged | ExpirationDate in past → flagged for removal during diff | Unit | R-007 | Dev |
| 2.3 | R-007: soft-deleted listing reactivates | is_visible=false → API returns it again → is_visible=true | Unit | R-007 | Dev |
| 2.3 | NFR17: retry logic | API fails 1st+2nd call → succeeds 3rd → sync completes | Unit | R-004 | Dev |
| 2.3 | API field parsing | API1 casing, API2 lat/lon float, API3 image split, API4 ES title fallback | Unit | R-001 | Dev |
| 2.3 | API5+API6 field selection | ConstructionSize used; LotSizeArea cross-validated | Unit | R-001 | Dev |
| 2.3 | API10: phone normalization | "506 XXXXXXXX" → WhatsApp-compatible format | Unit | R-001 | Dev |
| 2.4 | FR47: WebP conversion | Source image → WebP output, JSONB array updated | Integration | R-009 | Dev |
| 2.4 | FR47: responsive sizes | 3 sizes (400/800/1600px) generated per image | Integration | R-009 | Dev |
| 2.4 | UX-DR35: image ≤ 200KB | Each optimized variant ≤ 200KB | Integration | R-009 | Dev |
| 2.4 | API3: URL normalization | Space-encoded URL → normalized, predictable path | Unit | R-009 | Dev |
| 2.5 | FR48: new listing translated | EN-only listing → title_es + description_es populated | Unit | — | Dev |
| 2.5 | FR33: glossary terms preserved | "Titled Property" → consistent glossary translation | Unit | — | Dev |
| 2.6 | FR49: auto-tag assignment | Condo in tourist zone → "Rental Potential" tag | Unit | — | Dev |
| 2.6 | FR49: new rule without code change | Add rule to config → new listing tagged on next sync | Integration | — | Dev |
| 2.7 | NFR18: last-good state served | DB state unchanged after failed sync | Unit | R-002 | Dev |
| 2.7 | AR6: selective ISR revalidation | Only affected property pages revalidated | Integration | R-005 | Dev |

**Total P1:** 18 scenarios, ~20–35 hours

---

### P2 (Medium) — Run nightly/weekly

**Criteria:** Secondary flows + Low risk (1–2) + Edge cases and operational checks

| Story | Requirement | Scenario | Test Level | Risk Link | Owner |
|-------|-------------|----------|------------|-----------|-------|
| 2.3 | NFR11: no API keys in client-side | Source scan: assert no API key in any client bundle | Static Analysis | — | Dev |
| 2.3 | sync_log: partial sync recorded | Some records fail Zod → status "partial", error count correct | Unit | R-011 | Dev |
| 2.3 | NFR29: backup checkpoint | Verify backup hook/script runs post-sync | OPS check | — | Dev |
| 2.3 | NFR15: incremental processing | Only changed fields updated, not full-table re-write | Unit | R-004 | Dev |
| 2.4 | api_raw preserved | Original API image URLs retained in api_raw JSONB | Unit | — | Dev |
| 2.4 | Zero images edge case | Listing with no images → sync continues, images array empty | Unit | — | Dev |
| 2.5 | Translation idempotency | Re-running translation on already-translated listing → no change | Unit | — | Dev |
| 2.5 | Missing translation graceful | DeepL throws non-429 error → listing skipped, others continue | Unit | R-008 | Dev |
| 2.6 | Large rule set | 50+ rules → tagging still completes under 30s | Performance | — | Dev |
| 2.6 | Tag deduplication | Same tag from two rules → stored only once in JSONB array | Unit | — | Dev |
| 2.7 | sync_log admin readability | Log contains timestamps, counts, status, error details (content test) | Unit | R-011 | Dev |
| 2.7 | FR53: removed listing page | is_visible=false → URL resolves to "No longer available" (content assertion) | API/Integration | — | Dev |
| 2.3 | API9: birthday field hidden | Public agent endpoint response → no birthday field | API | R-012 | Dev |
| 2.3 | Altitud Cero 2-agent fetch | 2 agents returned from Altitud Cero → both upserted | Integration | R-010 | Dev |
| 2.3 | Concurrent sync guard | Two sync triggers fired simultaneously → only one runs | Unit | — | Dev |
| 2.4 | Already-optimized image skip | Image URL unchanged → no re-optimization | Unit | — | Dev |

**Total P2:** 16 scenarios, ~10–20 hours

---

### P3 (Low) — Run on-demand / exploratory

**Criteria:** Nice-to-have, benchmarks, exploratory

| Story | Requirement | Scenario | Test Level | Owner |
|-------|-------------|----------|------------|-------|
| 2.3 | Throughput benchmark | Measure sync throughput: records/minute, p95 latency | Performance | Dev |
| 2.3 | Chaos: DB disconnect mid-sync | Kill DB connection mid-pipeline → assert error logged, no partial state | Chaos | Dev |
| 2.5 | Language expansion | Add 3rd language (FR) to config → translation runs without code change | Exploratory | Dev |
| 2.6 | Rule audit | Manual review of tagging rules vs. business definitions | Manual | PM |
| 2.7 | Alert fatigue | Multiple failures in 1 hour → single alert, not flood | OPS | Dev |
| All | Observability | Sentry error capture for each pipeline stage | OPS | Dev |

**Total P3:** 6 scenarios, ~3–6 hours

---

## Execution Order

### Smoke Tests (< 5 min, run first)

**Purpose:** Prove the environment and prerequisite stories are intact before pipeline tests.

- [ ] PostGIS extension enabled + GiST index exists (`EXPLAIN` query) (30s)
- [ ] `npm run db:migrate` runs without error (45s)
- [ ] `/api/health` returns 200 (15s)
- [ ] RE/MAX API mock client returns valid response (30s)

**Total:** 4 checks, ~2 min

### P0 Tests (< 20 min)

**Purpose:** Critical path validation — pipeline integrity and data correctness.

- [ ] End-to-end happy path: fetch → validate → diff → upsert → log "success" (API/Integration)
- [ ] Diff: new, updated, and removed listing detection (Unit)
- [ ] Soft delete: is_visible=false, slug preserved (Unit)
- [ ] sync_log lifecycle: running → success (Unit)
- [ ] ISR revalidation called after sync (Integration)
- [ ] Zod-invalid record skipped, pipeline continues (Unit)
- [ ] Translation: ES content not overwritten (Unit)
- [ ] DeepL 429 → backoff, no crash (Unit)
- [ ] Translation failure isolated (Unit)
- [ ] Manual lifestyle tag preserved on re-sync (Unit)
- [ ] Failure alert after 3 retries exhausted (Integration)
- [ ] Site resilience: DB unchanged after sync failure (Integration)
- [ ] NFR15 benchmark: 1,000 records within time limit (Integration)

### P1 Tests (< 45 min)

**Purpose:** Important feature coverage — API edge cases, image optimization, translation, tagging.

- [ ] Empty Altitud Cero office: sync no-op (Integration)
- [ ] API field parsing suite: API1–API10 (Unit)
- [ ] Retry logic: 3x with exponential backoff (Unit)
- [ ] Image WebP conversion + 3 responsive sizes (Integration)
- [ ] Image ≤ 200KB validation (Integration)
- [ ] Translation: new listing → ES columns populated (Unit)
- [ ] Glossary terms preserved in translation (Unit)
- [ ] Auto-tagging: condo → "Rental Potential" (Unit)
- [ ] Rule config: new rule without code change (Integration)
- [ ] Selective ISR: only affected pages revalidated (Integration)

### P2/P3 Tests (< 60 min, nightly)

**Purpose:** Full regression coverage, edge cases, operational checks.

- [ ] API key not in client bundle (Static)
- [ ] Birthday field hidden from public API (API)
- [ ] Concurrent sync guard (Unit)
- [ ] Throughput benchmark (Performance, weekly)
- [ ] All remaining P2 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test (avg) | Total Hours | Notes |
|----------|-------|-----------------|-------------|-------|
| P0 | 14 | 2.5–3.5 | ~35–49 | Complex integration + mock setup |
| P1 | 18 | 1.0–2.0 | ~18–36 | Mix of unit and integration |
| P2 | 16 | 0.5–1.0 | ~8–16 | Edge cases, mostly unit |
| P3 | 6 | 0.5–1.0 | ~3–6 | On-demand, exploratory |
| **Total** | **54** | — | **~64–107 hours** | **~8–13 days** |

### Prerequisites

**Test Data / Factories:**

- `PropertyFactory` — Faker-based, generates valid API-shaped property objects with all fields (API1–API10 quirks)
- `AgentFactory` — Generates agent records with phone normalization and no birthday field
- `SyncLogFactory` — Creates sync_log rows for status transition tests
- `LifestyleRuleConfig` — JSON fixture with sample tagging rules

**External Service Mocks:**

- RE/MAX CCA API: MSW or test double returning `PropertyFactory` arrays for both office GUIDs; separate stub for empty Altitud Cero
- DeepL API: MSW stub returning translated text; 429 stub for rate-limit tests
- OpenAI API: MSW stub for creative translation scenarios
- `/api/revalidate`: Spy/interceptor to assert it was called with correct paths

**Tooling:**

- Vitest (unit + integration) with `@testcontainers/postgresql` for DB isolation
- MSW (Mock Service Worker) for external HTTP stubbing
- Drizzle test utilities for DB seeding/teardown
- Node `perf_hooks` for timing assertions (NFR15)

**Environment:**

- PostgreSQL + PostGIS Docker container (via Testcontainers or pre-provisioned CI service)
- All API keys as CI env vars (or MSW-stubbed — preferred for determinism)
- `DATABASE_URL` pointing to isolated test database per CI run

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions; blocking for merge)
- **P1 pass rate:** ≥ 95% (failures require documented triage before merge)
- **P2/P3 pass rate:** ≥ 90% (informational; tracked in nightly CI)
- **High-risk mitigations (R-001–R-005):** 100% — each must have a green test before merge

### Coverage Targets

- **Critical pipeline paths:** ≥ 80% line coverage for `src/lib/sync/` modules
- **Data integrity scenarios:** 100% of ACs in Stories 2.3–2.7 with at least one test
- **Security scenarios (API9, NFR11):** 100%
- **External service failure paths:** 100% (each external dependency must have a failure test)

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] Risks R-001 through R-005 each verified by a passing green test
- [ ] No high-risk (score ≥ 6) items in OPEN status without a passing test
- [ ] Birthday field (API9) confirmed absent from any public response
- [ ] API keys (NFR11) confirmed absent from client-side bundle

---

## Mitigation Plans

### R-001: Silent Data Corruption in Diff Logic (Score: 6)

**Mitigation Strategy:** Write contract unit tests for the diff function covering: field type coercions, JSONB deep-equality, null vs empty string, and a full before/after DB assertion comparing inserted → re-synced records.
**Owner:** Dev
**Timeline:** Before Story 2.3 merge
**Status:** Planned
**Verification:** All 3 P0 diff tests green in CI

### R-002: Failure Alert Not Delivered (Score: 6)

**Mitigation Strategy:** Add an integration test that stubs the sync to fail after 3 retries and asserts: (a) the alert call is made (spy), OR (b) if no external alert config, a structured log entry with `severity: "critical"` is written. Document the expected env var for production alerting in `.env.example`.
**Owner:** Dev
**Timeline:** Before Story 2.7 merge
**Status:** Planned
**Verification:** P0 alert test green; `.env.example` updated

### R-003: Translation Overwrites Existing ES Content (Score: 6)

**Mitigation Strategy:** Seed a property with `title_es = "Casa de prueba"`, run the translation step, assert `title_es` unchanged. Include this as a P0 test gating Story 2.5.
**Owner:** Dev
**Timeline:** Before Story 2.5 merge
**Status:** Planned
**Verification:** P0 translation preservation test green

### R-004: Sync Exceeds 2-Hour Limit (Score: 6)

**Mitigation Strategy:** Benchmark test using 1,000 mocked API records with all external calls stubbed (near-zero latency). Establish baseline duration. Assert pipeline completes under a configurable threshold (e.g., 5 min with stubs; extrapolate to real-world estimate). Add CI assertion so regressions are caught.
**Owner:** Dev
**Timeline:** Before Story 2.3 merge
**Status:** Planned
**Verification:** P0 timing test green; baseline duration documented

### R-005: ISR Revalidation Not Triggered (Score: 6)

**Mitigation Strategy:** Spy on the `/api/revalidate` internal call within the sync pipeline. Assert it is called after successful sync with the correct paths. Run in integration test against a test Next.js server or via endpoint spy.
**Owner:** Dev
**Timeline:** Before Story 2.3 merge
**Status:** Planned
**Verification:** P0 ISR test green

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|------------------|--------|-----------------|
| **Story 2.1 — Schema** | Pipeline writes to these tables; schema changes break pipeline | Drizzle migration test must re-run clean in CI on each PR |
| **Story 2.2 — API Client** | Pipeline uses API client; parser changes affect all downstream | Existing API client unit tests must stay green |
| **Epic 3 — Search** | Reads from `properties` table; sync changes affect search results | Run search smoke test after sync integration test |
| **Epic 4 — Listing Detail** | ISR revalidation from sync refreshes listing pages | Assert ISR endpoint called (P0 R-005 test) |
| **Epic 8 — Admin** | Reads sync_logs table | Assert sync_log schema and content (P2 test) |
| **next-intl i18n** | Translation columns feed multilingual rendering | Translation content tests (P1) |

---

## Assumptions and Dependencies

### Assumptions

1. External services (DeepL, RE/MAX API, OpenAI) will be stubbed with MSW in CI — no real API calls in automated tests.
2. Testcontainers or an equivalent PostgreSQL+PostGIS service is available in CI (confirmed by Story 2.1 setup).
3. The sync pipeline is implemented as a set of discrete, composable step functions (making unit testing of individual steps feasible).
4. `CRON_SECRET` and `API_SECRET` are available as CI env vars for endpoint testing.
5. Story 2.3 is the prerequisite for 2.4–2.7; tests for 2.4–2.7 can stub or reuse Story 2.3's pipeline runner.

### Dependencies

1. **MSW setup** — Required before Story 2.3 testing; no external calls in CI. Required by: Story 2.3 start.
2. **Testcontainers config** — PostgreSQL+PostGIS must be provisioned in GitHub Actions CI. Required by: Story 2.3 start.
3. **PropertyFactory** — Faker-based factory with API1–API10 quirks built in. Required by: Story 2.3 start.
4. **Story 2.3 merged** — Required by Stories 2.4, 2.5, 2.6, 2.7 (they extend the pipeline).

### Risks to This Plan

- **Risk:** MSW setup is complex for a full-stack Next.js project; may need different approach for API route tests.
  - **Impact:** P0 integration tests delayed.
  - **Contingency:** Use `nock` or direct module mocking for Node.js test environment; reserve MSW for browser-level tests.

- **Risk:** Testcontainers slow in CI (30–60s startup) inflating test suite time.
  - **Impact:** Developer experience degraded.
  - **Contingency:** Use a pre-warmed Postgres service in GitHub Actions (service container) instead of Testcontainers.

---

## Follow-on Workflows (Manual)

- Run `*atdd` for Stories 2.3–2.7 to generate failing P0 tests prior to implementation (separate workflow; not auto-run).
- Run `*automate` after implementation to expand unit test coverage to P2/P3 level.
- Run `*trace` after Story 2.7 merge to validate full AC-to-test traceability for Epic 2.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: Sebicas — Date: ______
- [ ] Tech Lead: Sebicas — Date: ______
- [ ] QA Lead: (BAD Agent) — Date: 2026-04-25

**Comments:** Initial draft produced by BAD Epic-Start Test Design agent on 2026-04-25. Covers Stories 2.3–2.7; Stories 2.1 and 2.2 treated as done prerequisites.

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (probability × impact, score ≥ 6 = mitigation required)
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection (Unit / Integration / API / E2E)
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- **PRD:** `_bmad-output/planning-artifacts/prd.md` (FR46–FR55, NFR15–NFR20)
- **Epic/Stories:** `_bmad-output/planning-artifacts/epics.md` (§ Epic 2, Stories 2.1–2.7)
- **Architecture:** `_bmad-output/planning-artifacts/architecture.md` (AR1–AR6, AD-5, AD-8, AD-9)
- **Story 2.1 implementation:** `_bmad-output/implementation-artifacts/2-1-database-schema-and-drizzle-models.md`
- **Story 2.2 implementation:** `_bmad-output/implementation-artifacts/2-2-api-integration-and-data-fetching.md`
- **Sprint status:** `_bmad-output/implementation-artifacts/sprint-status.yaml`

### GH Issues

| Story | Issue |
|-------|-------|
| 2.1 | #78 (done) |
| 2.2 | #79 (done) |
| 2.3 | #80 |
| 2.4 | #81 |
| 2.5 | #82 |
| 2.6 | #83 |
| 2.7 | #84 |

---

**Generated by:** BMad BAD Agent — Epic Test Design (Epic-Start Phase)
**Workflow:** `bmad-testarch-test-design` (Epic-Level Mode, Create path)
**Version:** 4.0 (BMad v6)
