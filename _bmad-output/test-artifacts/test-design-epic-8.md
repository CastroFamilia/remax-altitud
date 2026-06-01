---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-28'
inputDocuments:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
epicScope:
  inScope: ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7']
---

# Test Design: Epic 8 — Administration & Operations

**Date:** 2026-05-28
**Author:** Nico (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 8 — Administration & Operations

---

## Executive Summary

**Scope:** Epic-level test design for Stories 8.1–8.7 of Epic 8. All stories are in backlog; this document governs the full epic test strategy before the first story begins.

Epic 8 is the **administrative control, content curation, and operational monitoring layer** of the platform. It introduces custom authenticated admin dashboard views and APIs enabling administrative users to monitor data sync pipeline status logs, manage and reassign leads with full source context (including cross-agent shortlist visibility), perform bulk lead reassignment with immutable logging and CSV exports of client contacts during agent departures, curate lifestyle tags and community assignments on properties, perform community CRUD with interactive geo-fence polygon drawing using Mapbox, manage listing visibility toggles with ISR on-demand revalidation, and review aggregate shortlist demand intelligence analytics.

This epic wraps around all prior epics (1–7), completing the **operational lifecycle** of the REMAX Altitud platform. If administrative authentication is bypassed, private buyer/seller lead data (PII) is exposed, violating privacy policies. If bulk reassignment crashes or drops leads, business continuity is severely disrupted during agent departures. If listing visibility toggles fail to revalidate edge caches, hidden/removed listings remain publicly accessible, leading to customer confusion and stale listings on search engines.

**Risk Summary:**

- Total risks identified: 10
- High-priority risks (score ≥ 6): 6
- Critical categories: SEC, DATA, BUS, PERF

**Coverage Summary:**

- P0 scenarios: 13 (~20–35 hours)
- P1 scenarios: 13 (~15–28 hours)
- P2 scenarios: 7 (~5–12 hours)
- P3 scenarios: 4 (~2–4 hours)
- **Total effort:** ~42–79 hours (~1–1.5 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| **Google Analytics 4 / Google Search Console external dashboard interfaces** | Third-party systems; cannot be automated or inspected inside standard workspace CI | Assert the GA4 script is loaded on all views and runs in cookieless mode (`NFR12`) |
| **Email/WhatsApp actual message delivery from alerts** | External email/WhatsApp servers; cannot be verified reliably in CI | Verify the alerting function is invoked with correct recipient and payload structure; mock external network delivery |
| **Manual data entry on listing imports** | Listings are populated via the daily sync pipeline (Epic 2) | Mock listing records with various data shapes in database fixtures; verify tag overrides are preserved |
| **Mapbox GL JS drawing canvas visual aesthetics** | Subjective layout details are out of scope for functional tests | Assert Mapbox canvas renders inside the community polygon editor; verify drawn coordinate arrays are compiled correctly |
| **CSV client contact data import into external CRMs** | Out-of-scope external integrations | Verify the generated CSV file contains the correct columns and comma-separated records, matching strict schema checks |
| **Historical sync logs database archival scheduling** | Database maintenance concern rather than functional validation | Test that queries on large `sync_logs` tables are optimized with indices on the `started_at` column |

---

## Epic 7 Infrastructure Carry-Over

Stories 8.1–8.7 build on the test infrastructure established in Epics 1–7. The following apply immediately:

### Test Infrastructure (Already in Place)
- Vitest `environmentMatchGlobs` — `jsdom` applied to `tests/unit/**/*.spec.tsx` and node environment for `/tests/integration/` where Drizzle tests execute.
- `@testing-library/react`, `jsdom`, `@testing-library/user-event` installed.
- Drizzle ORM client inside testing setups for database direct validation.
- Playwright E2E framework configured and integrated into standard workspace CI pipelines.
- Mocking libraries for intercepting external Mapbox GL JS and Google Analytics requests.

### New `data-testid` Contract for Epic 8

| Attribute | Component | Story |
|-----------|-----------|-------|
| `data-testid="sync-log-row"` | AdminSyncLogsDashboard | 8.1 |
| `data-testid="sync-status-badge"` | AdminSyncLogsDashboard | 8.1 |
| `data-testid="lead-table"` | AdminLeadsDashboard | 8.2 |
| `data-testid="lead-reassign-btn"` | AdminLeadsDashboard | 8.2 |
| `data-testid="bulk-reassign-modal"` | AdminBulkReassignModal | 8.3 |
| `data-testid="export-csv-btn"` | AdminBulkReassignModal | 8.3 |
| `data-testid="lifestyle-tag-chip"` | AdminListingDetail | 8.4 |
| `data-testid="community-map-editor"` | AdminCommunityDetail | 8.5 |
| `data-testid="listing-visibility-toggle"`| AdminListingsDashboard | 8.6 |
| `data-testid="popularity-rank-table"`| AdminShortlistAnalytics | 8.7 |

---

## Risk Assessment

> P (Probability) × I (Impact) = Score. Scores ≥ 6 require mitigation before the story ships.

### High-Priority Risks (Score ≥ 6)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|-------|----------|-------------|---|---|-------|------------|-------|----------|
| R-001 | 8.2 | SEC | Admin authorization bypass — unauthenticated users can access `/admin/*` or `/api/admin/*` endpoints due to missing or misconfigured auth middleware. | 2 | 3 | 6 | Enforce `AR16` custom auth in middleware; write unit/integration tests asserting unauthenticated requests receive 401/403 or redirect to login. | Dev | Before 8.2 ships |
| R-002 | 8.2 | DATA | Lead PII encryption failure / plaintext leak — lead contact details are saved in plaintext due to encryption failure, or leaked via logs, violating `NFR9` PII security. | 2 | 3 | 6 | Write database integration tests asserting raw `leads` table columns store encrypted values; verify decrypted output is strictly restricted to authenticated admin APIs. | Dev | Before 8.2 ships |
| R-003 | 8.3 | BUS | CSV export data harvesting — unauthorized agents or users bypass interface guards to hit `/api/admin/leads/export` directly and download client contacts. | 2 | 3 | 6 | Enforce strict role-based access checking inside the export API route; add unit tests asserting 403 Forbidden for non-admin sessions. | Dev | Before 8.3 ships |
| R-004 | 8.3 | DATA | Bulk reassignment failure / lost context — reassignment fails halfway or drops original agent records due to lack of transactional execution, leaving DB in a corrupt state. | 2 | 3 | 6 | Execute all bulk reassignment updates inside a PostgreSQL database transaction (`db.transaction`). Assert transactional rollback if one lead update fails. | Dev/QA | Before 8.3 ships |
| R-006 | 8.6 | BUS | Stale listing visibility edge caches — toggling listing visibility to "hidden" does not clear the page edge caches immediately, leaving hidden listings publicly active. | 2 | 3 | 6 | Implement on-demand revalidation `/api/revalidate` inside the toggle action. Verify in E2E tests that search listings update within 500ms of toggle. | Dev | Before 8.6 ships |
| R-007 | 8.7 | SEC | Shortlist analytics PII leakage — anonymous event tracking accidentally captures visitor IP addresses or cookies, violating cookieless privacy guidelines. | 2 | 3 | 6 | Assert Zod input schemas reject tracking requests containing PII; assert database columns strictly cover only non-identifying keys (`property_id`, `locale`, `action`). | Dev | Before 8.7 ships |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner |
|---------|-------|----------|-------------|---|---|-------|------------|-------|
| R-005 | 8.1 | PERF | Sync log query degradation — as the sync logs table grows to thousands of entries, query execution degrades and dashboard LCP exceeds 2.5s. | 2 | 2 | 4 | Add spatial and index optimizations on `started_at` in the `sync_logs` table. Validate query performance with 10k seeded records. | Dev |
| R-008 | 8.5 | TECH | PostGIS polygon boundaries database crash — drawn community coordinates compile into self-intersecting or invalid polygons, crashing spatial queries during auto-tagging. | 2 | 2 | 4 | Use Turf.js client-side to validate drawn polygons; validate GeoJSON geometries via strict Zod schemas before saving to DB. | Dev |
| R-009 | 8.1 | OPS | Sync failure email/WhatsApp alert flood — consecutive sync failures trigger thousands of individual notifications, flooding operational channels. | 2 | 2 | 4 | Implement alert throttling/rate-limiting within the sync log notifier module (e.g. max 1 alert per 4 hours for identical errors). | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Story | Category | Description | P | I | Score | Action |
|---------|-------|----------|-------------|---|---|-------|--------|
| R-010 | 8.6 | BUS | Broken SEO redirect loops — legacy WordPress 301 mappings target hidden listings or form infinite redirect cycles. | 1 | 2 | 2 | Write automated redirect suite executing daily checks to assert target status resolves successfully in <50ms. | Monitor |

---

## Entry Criteria

- [x] Epic 2 fully complete — `sync_logs` table defined and populated; sync pipeline active.
- [x] Epic 7 fully complete — localStorage saved count, shortlist comparison grids, and shortlist shares ready.
- [x] Database schema is functional — `leads`, `agents`, `properties`, and `communities` tables are fully migrated.
- [x] Playwright E2E and Vitest environments fully configured in CI pipeline.
- [ ] Drizzle schema updated to include column encryption methods for lead fields (required before Story 8.2).
- [ ] Mapbox drawing tools dynamic integration configured inside the admin workspace (required before Story 8.5).
- [ ] English and Spanish localization namespaces populated under `admin` keys (required before Story 8.1).

## Exit Criteria

- [ ] All P0 automated tests passing (100% success rate).
- [ ] All P1 automated tests passing (≥ 95% success rate).
- [ ] No open high-priority bugs (score ≥ 6) left unmitigated.
- [ ] R-001 (Admin auth): verified admin pages require valid session token, redirecting invalid requests.
- [ ] R-002 (PII encryption): verified that lead records contain encrypted ciphertext in PostgreSQL.
- [ ] R-006 (Visibility cache purge): verified ISR revalidation purges hidden properties from searches instantly.
- [ ] Complete E2E administrative flow validated (unauthenticated block → login → view sync logs → edit community polygon → reassign lead).

---

## Test Coverage Plan

> **Note:** P0/P1/P2/P3 specify priority and risk levels, NOT execution timing. Execution scheduling is defined in the Execution Strategy section.

### P0 (Critical)

**Criteria:** Blocks core journey + High risk (score ≥ 6) + No workaround.

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 8.1-API-001 | 8.1 | GET `/api/admin/sync-logs` returns chronological list of sync status metrics | API | R-005 | Assert response contains begun, ended, status, and property sync counts |
| 8.1-E2E-001 | 8.1 | Dashboard displays recent sync logs correctly with color badges for statuses | E2E | — | Load dashboard; assert log cards with correct status colors render in DOM |
| 8.2-API-001 | 8.2 | GET `/api/admin/leads` restricts access to authorized admin sessions | API | R-001 | Request without valid session token; assert 401/403 response; verify no PII exposed |
| 8.2-API-002 | 8.2 | Leads list payload returns full source, agent, intent, and UTM metadata fields | API | R-002 | Request authenticated; assert response fields map precisely to schema requirements |
| 8.2-UNIT-001| 8.2 | Shortlist lead grouping logic divides properties by assigned agent vs other agents | Unit | — | Seed mock lead with mixed agent properties; assert helper splits properties correctly |
| 8.2-API-003 | 8.2 | Reassigning lead updates agent ID and logs immutable record in history logs | API | — | Reassign lead; assert `leads.assigned_agent_id` updated; verify history log is written |
| 8.3-API-001 | 8.3 | Bulk reassignment executes inside transaction and rolls back entire bulk if one fails | API | R-004 | Induce DB error halfway through bulk reassignment; verify zero lead agent IDs were committed |
| 8.3-UNIT-001| 8.3 | Round-robin distribution algorithm divides leads evenly among target agents | Unit | — | Distribute 10 leads to 3 agents; assert assignments are balanced (4, 3, 3 distribution) |
| 8.3-API-002 | 8.3 | GET `/api/admin/leads/export` requires admin auth and generates clean CSV contact list | API | R-003 | Authenticate admin; request CSV export; verify CSV format holds name, email, phone |
| 8.4-API-001 | 8.4 | Admin manual lifestyle tag overrides are preserved during subsequent daily sync | API | — | Save admin tag override; run sync pipeline; assert admin tag overrides are not reset |
| 8.5-API-001 | 8.5 | Creating community saves geo-fence polygon as PostGIS `Polygon 4326` type in DB | API | R-008 | POST community with GeoJSON polygon; assert DB record saved as valid spatial type |
| 8.6-API-001 | 8.6 | Toggling listing visibility to false triggers ISR revalidation and hides it from search | API | R-006 | Toggle visibility; assert direct GET on listing returns 404 or inactive; search returns empty |
| 8.7-API-001 | 8.7 | POST `/api/shortlist/track` validates anonymous payload and rejects visitor PII | API | R-007 | Send tracker payload with IP/cookie parameters; assert Zod schema rejects input |

**Total P0:** 13 tests, ~20–35 hours

---

### P1 (High)

**Criteria:** Important feature path + Medium risk (score 3–5) + Common workflow.

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 8.1-API-002 | 8.1 | Sync failures capture error diagnostics in DB and trigger exactly 1 admin notification | API | R-009 | Trigger pipeline crash; verify alert notifier is called once; assert `error_message` is logged |
| 8.1-E2E-002 | 8.1 | Sync log dashboard supports filtering logs by date ranges and status codes | E2E | — | Filter logs on dashboard; assert rows displayed match selected constraints |
| 8.2-E2E-001 | 8.2 | Admin lead management board allows filtering leads by agent, intent, or UTM source | E2E | — | Apply multiple filter options; assert visible records update dynamically |
| 8.2-E2E-002 | 8.2 | Lead detail view displays shortlist popularity metrics alongside contact details | E2E | — | Load lead profile; assert active shortlist count matches database statistics |
| 8.3-E2E-001 | 8.3 | Bulk reassignment action triggers explicit visual confirmation dialog | E2E | — | Click bulk reassign; assert confirmation modal displays counts before proceed |
| 8.3-E2E-002 | 8.3 | Reassigning agent with zero active leads displays helpful empty notice message | E2E | — | Trigger reassignment for inactive agent; assert "No leads to reassign" message renders |
| 8.4-E2E-001 | 8.4 | Listing detail dashboard allows editing and saving lifestyle tags on listings | E2E | — | Edit tags in dashboard; assert UI updates and changes are committed to database |
| 8.5-E2E-001 | 8.5 | Community editor validates drawn geo-fence boundaries on MapboxGL map before saving | E2E | R-008 | Draw self-intersecting polygon; assert editor warns user and denies commit |
| 8.5-API-002 | 8.5 | Manual community listing assignment overrides are preserved during PostGIS auto-tagging | API | — | Assign listing manually; run sync pipeline; assert manual community matches override |
| 8.6-E2E-001 | 8.6 | Accessing hidden property directly via URL renders "No longer available" page with CTAs | E2E | — | Navigate to `/property/hidden-property`; assert placeholder page with similar listings renders |
| 8.6-API-002 | 8.6 | GA4 script loads in cookieless analytics format on all public-facing pages | API | R-007 | Request homepage; verify GA4 script is configured with `client_storage: 'none'` |
| 8.7-E2E-001 | 8.7 | Shortlist analytics dashboard ranks active listings based on 30-day save popularity | E2E | — | Load analytics dashboard; assert most-shortlisted listing displays first in popularity ranking |
| 8.7-API-002 | 8.7 | Properties with zero shortlist saves render in analytics list as "0 saves" | API | — | Assert listings with empty saved records show in list with 0 saves counts |

**Total P1:** 13 tests, ~15–28 hours

---

### P2 (Medium)

**Criteria:** Secondary flows + Low/medium risk + Edge cases.

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 8.1-UNIT-001 | 8.1 | Formatting helpers convert sync duration milliseconds to human readable formats | Unit | — | Assert `formatSyncDuration(5000000)` outputs `"1h 23m 20s"` |
| 8.2-API-004 | 8.2 | GET `/api/admin/leads/history` returns per-agent leads filterable by type | API | — | Call history endpoint with agent query; assert results return all assigned buyer/seller types |
| 8.3-UNIT-002 | 8.3 | Bulk reassignment history logs are immutable and reject PUT/DELETE calls | Unit | — | Attempt update/delete on logs using Drizzle runner; assert DB constraint or ORM rejects |
| 8.4-UNIT-001 | 8.4 | Constants configuration parser reads new tags in `constants/lifestyle-tags.ts` | Unit | — | Add tag; check parser output maps correctly |
| 8.5-E2E-002 | 8.5 | Community details form validates and saves required metadata in both EN and ES | E2E | — | Create community; assert validation errors display if EN or ES title fields are omitted |
| 8.6-E2E-002 | 8.6 | Legacy WordPress 301 redirect mapping returns correct status and resolves in <50ms | E2E | R-010 | Trigger redirect E2E request; assert status is 301 and response latency is < 50ms |
| 8.7-UNIT-001 | 8.7 | Aggregation helper queries active counts in `shortlist_events` table correctly | Unit | — | Seed mock events; check aggregation returns exact count matches |

**Total P2:** 7 tests, ~5–12 hours

---

### P3 (Low)

**Criteria:** Performance benchmarks + Exploratory + Nice-to-have.

| Test ID | Story | Requirement / AC | Test Level | Notes |
|---------|-------|-----------------|------------|-------|
| 8.1-E2E-003 | 8.1 | Dashboard sync status table renders LCP < 2.5s when loading 1,000 logs | E2E | Verify index optimizations sustain LCP speed thresholds |
| 8.2-E2E-003 | 8.2 | Admin lead management table supports pagination or progressive infinite scroll loading | E2E | Verify viewport performance stays smooth under heavy rows rendering |
| 8.5-E2E-003 | 8.5 | Polygon editor performance is stable when drawing highly complex polygons | E2E | Assert Mapbox canvas responds smoothly when coordinate load exceeds 100 points |
| 8.6-E2E-003 | 8.6 | Lighthouse accessibility compliance score on admin dashboards is ≥ 90 | E2E | Execute Lighthouse audit; check color contrast and keyboard tab traps |

**Total P3:** 4 tests, ~2–4 hours

---

## Execution Strategy

**Philosophy:** Ensure security boundaries and transactional integrity are validated in CI for every pull request, leaving slow performance audits or heavy data generations for nightly regressions.

### Every PR

- **Vitest Unit & Integration Suite:** Executes all tests under `tests/unit/admin/` and Drizzle-focused database tests automatically (~1-2 mins).
- **Playwright E2E Suite:** Runs functional E2E tests (`playwright test --grep "epic-8"`) covering authentication blocks, reassignments, and toggles (~5-8 mins).

### Nightly / Regression

- Full browser automation run across all dashboards.
- Index load testing (measuring query latency with 10k mock sync log rows).
- Full audit checking for broken redirect mappings or loop detections.
- Lighthouse CI accessibility audits on admin dashboard views.

### Before Story Ships (Story-Level Gates)

- **Before 8.1 ships:** Verification of dashboard columns, chronological order, and rate-limiting alerts during pipeline sync crashes.
- **Before 8.2 ships:** `R-001` (Auth middleware verification), `R-002` (PII database encryption check), history audit logs.
- **Before 8.3 ships:** `R-003` (Export CSV authentication lock), `R-004` (Bulk reassignment transactional checks).
- **Before 8.4 ships:** Verification of admin tag persistence over subsequent pipeline updates.
- **Before 8.5 ships:** Validation of PostGIS coordinates mapping and simple closed boundary checks in drawn geo-fences.
- **Before 8.6 ships:** `R-006` (Listing visibility ISR cache purges), direct access redirect checks.
- **Before 8.7 ships:** `R-007` (Zod tracking PII exclusions), popularity ranking checks.

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 13 | 2.0 | ~20–35 | Transaction rollbacks, middleware auth validation, encrypted DB queries |
| P1 | 13 | 1.0 | ~15–28 | Dashboard widgets, map canvas mock integrations, date queries |
| P2 | 7 | 0.5 | ~5–12 | Millisecond helpers, constants configuration, redirections |
| P3 | 4 | 0.25 | ~2–4 | Benchmarks, Lighthouse compliance, complex coords |
| **Total** | **37** | **-** | **~42–79** | **~1–1.5 weeks** |

### Prerequisites

**Test Data:**
- `agentFactory` — seeds active/inactive agents with office mappings.
- `leadFactory` — seeds lead contacts with source identifiers, intent type, and UTM parameters.
- `syncLogFactory` — seeds chronological sync progress blocks.
- `communityFactory` — seeds community metadata and coordinate boundaries.

**Tooling:**
- Vitest and React Testing Library for component/hook validation.
- Playwright with mobile ($150 Android 360px) and desktop (1280px) viewports.
- Crypto/pg-vault tools to test column encryption inside Postgres directly.

**Environment:**
- Test PostgreSQL instance running with PostGIS capabilities enabled.
- Intercepted Mapbox tokens mocked out during CI workflows to avoid rate constraints.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (mandatory).
- **P1 pass rate:** ≥ 95% (minor issues waivable with approvals).
- **P2/P3 pass rate:** ≥ 90% (informational status).
- **High-priority mitigations:** 100% complete and passing before merging stories.

### Coverage Targets

- **Admin Authentication Middleware:** 100% coverage via unit & integration tests.
- **Lead PII database encryption:** 100% database verification.
- **Bulk Reassignment Transactional Safety:** 100% coverage under forced failures.
- **ISR Edge Purges on Visibility Toggles:** ≥ 90% verification coverage.

---

## Mitigation Plans

### R-001: Admin Authorization Bypass (Score: 6)

- **Mitigation Strategy:**
  1. Build a strict route middleware executing validation checks on standard sessions/cookies/headers.
  2. Implement an integration test attempting unauthenticated requests on dashboard pages and API paths; verify all return 401/403 or redirect.
  3. Validate that JWT or authentication signatures are checked with high-entropy cryptographic keys.
- **Owner:** Dev
- **Timeline:** Before Story 8.2 ships
- **Status:** Planned
- **Verification:** Run E2E suites verifying unauthorized attempts are completely blocked.

### R-002: Lead PII Encryption Failure / Plaintext Leak (Score: 6)

- **Mitigation Strategy:**
  1. Configure pg-based or app-level cryptographically secure column-level encryption on the `leads` table using secure variables.
  2. Implement a database test inserting mock leads, calling raw queries directly on the DB table, and asserting that name/email/phone values return strictly as encrypted ciphertext.
  3. Assert decrypted values are only emitted inside routes protected by authorized administrator middleware layers.
- **Owner:** Dev
- **Timeline:** Before Story 8.2 ships
- **Status:** Planned
- **Verification:** Database query assertion tests running over mock data records.

### R-003: CSV Export Data Harvesting (Score: 6)

- **Mitigation Strategy:**
  1. Enforce strict role-based access checks directly inside `/api/admin/leads/export`.
  2. Add automated tests asserting that calls from standard user profiles or unauthenticated headers immediately trigger a 403 Forbidden.
  3. Ensure that CSV downloads are explicitly recorded in admin access log books with timestamps and target agent names.
- **Owner:** Dev
- **Timeline:** Before Story 8.3 ships
- **Status:** Planned
- **Verification:** API integration tests checking role validation barriers.

### R-004: Bulk Reassignment Failure / Lost Context (Score: 6)

- **Mitigation Strategy:**
  1. Run the bulk reassignment logic inside a single Drizzle database transaction (`db.transaction(...)`).
  2. Write an integration test where bulk updates are interrupted by a database failure mid-execution; verify that zero changes commit and the DB rolls back completely.
  3. Validate that original assigned agents and reassignment logs are written cleanly for every update.
- **Owner:** Dev
- **Timeline:** Before Story 8.3 ships
- **Status:** Planned
- **Verification:** Forced database connection crash test during bulk execution.

### R-006: Stale Listing Visibility Edge Caches (Score: 6)

- **Mitigation Strategy:**
  1. Trigger Next.js on-demand ISR revalidation (`res.revalidate(...)`) immediately upon updating a listing's visibility to false.
  2. Write an E2E test verifying that search results and direct listing page cache updates propagate immediately (<500ms client-side reflection).
  3. Ensure that error states in revalidation do not drop the visibility update; log revalidation failures to Sentry.
- **Owner:** Dev
- **Timeline:** Before Story 8.6 ships
- **Status:** Planned
- **Verification:** E2E check asserting 404/redirect redirects upon hiding property.

### R-007: Shortlist Analytics PII Leakage (Score: 6)

- **Mitigation Strategy:**
  1. Leverage strict Zod input schemas inside `/api/shortlist/track` that reject payloads containing device footprints, IPs, or cookies.
  2. Write unit tests checking that the analytics endpoint discards request metadata and only records non-identifying keys (`property_id`, `locale`, `action`, `created_at`).
  3. Review the `shortlist_events` schema to ensure there are no PII columns or relation references to visitor profiles.
- **Owner:** Dev
- **Timeline:** Before Story 8.7 ships
- **Status:** Planned
- **Verification:** Payload parameter validation tests.

---

## Assumptions and Dependencies

### Assumptions

1. The testing database is provisioned with PostGIS extensions active.
2. Next.js on-demand ISR revalidation endpoint is configured with a high-entropy secret (`API_SECRET`).
3. Administrative sessions are validated via secure cryptographic session tokens.
4. Shortlist events aggregate directly from a lightweight event table without real-time performance delays on MVP volumes.

### Dependencies

1. **Mapbox Drawing Library:** The admin polygon designer depends on Mapbox drawing canvas integrations being functional inside the editor.
2. **PII Encryption Configuration:** Column-level encryption setups must be completed in the database environment before lead processing features are active.
3. **Analytics Account Setups:** Cookieless analytics tracking relies on GA4 configurations being prepared by the PM team.

### Risks to Plan

- **Risk:** Mapbox drawing engine canvas failure in CI.
  - **Impact:** E2E polygon creation tests crash.
  - **Contingency:** Mock the drawing canvas component in CI runs; assert that drawing canvas trigger updates return the correct mock coordinate strings.

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|-------------------|--------|------------------|
| **`sync` pipeline (Epic 2)** | Sync logs reads from database tables populated by Epic 2. | Run Epic 2 sync pipeline integration tests; assert sync errors capture in `sync_logs` seamlessly. |
| **`shortlist` state (Epic 7)** | Shortlist popularity tracking compiles anonymous click events. | Validate that saving/unsaving properties continues to behave correctly on Search and Detail pages. |
| **`POST /api/leads` (Epic 5/7)** | Lead submissions insert records inside tables read by the admin. | Ensure traditional buyer and seller lead creation flows insert records safely without breaking column encryption. |

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection
- `test-priorities-matrix.md` — P0–P3 prioritization

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md` (FR56–FR66, NFR8–NFR10, NFR12)
- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 8, Stories 8.1–8.7)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (§10 Auth/PII safety, §5 sync logs, §7 ISR revalidation)

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
