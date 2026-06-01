---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-04'
inputDocuments:
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/implementation-artifacts/sprint-status.yaml'
  - '_bmad/tea/config.yaml'
  - 'skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
  - '_bmad-output/test-artifacts/test-design-epic-4.md'
epicScope:
  inScope: ['5.1', '5.2', '5.3']
---

# Test Design: Epic 5 — Seller Lead Capture

**Date:** 2026-05-04
**Author:** Sebicas (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 5 — Seller Lead Capture

---

## Executive Summary

**Scope:** Epic-level test design for Stories 5.1–5.3 of Epic 5. All stories are in backlog; this document governs the full epic test strategy before the first story begins.

Epic 5 is the **seller acquisition layer** of the platform. It introduces the first active lead-generation forms: a 3-step progressive seller listing form (`/{locale}/sell`), a Comparative Market Analysis (CMA) request form, and the backend infrastructure to store, route, and track those leads. This epic also introduces the first **PII handling** (name, phone, email with column-level encryption), the first **API POST endpoint** (`/api/leads`), and the first **agent routing logic** (geo-coordinate → nearest office → active agent assignment).

The conversion funnel introduced here is the core revenue pathway for the REMAX Altitud business: a seller who fills out the form is a qualified lead. A single form submission can generate a listing worth $6,000–$18,000 in commission. **Every bug that silently drops a lead submission is a direct revenue loss.**

**Risk Summary:**

- Total risks identified: 11
- High-priority risks (score ≥ 6): 6
- Critical categories: SEC, BUS, DATA, PERF

**Coverage Summary:**

- P0 scenarios: 12 (~20–36 hours)
- P1 scenarios: 16 (~18–30 hours)
- P2 scenarios: 12 (~8–16 hours)
- P3 scenarios: 4 (~2–4 hours)
- **Total effort:** ~48–86 hours (~1.5–2 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|-----------|
| **WhatsApp message delivery to agent** | External platform; not testable in automated CI | Verify the agent's phone number in the matched record is correct; test WhatsApp deep-link URL format on the confirmation screen |
| **Google Maps / geocoding accuracy** | Third-party service; correctness of geocode results is external | Test that coordinates are captured and stored when the map interaction fires; test fallback to text-only when map fails |
| **Email delivery to agent** | Transactional email is an Epic 8 concern (lead notification infrastructure) | Test that lead record is created with correct fields; email notification pipeline is out of Epic 5 scope |
| **Admin lead management UI** | Epic 8 concern | Verify lead is stored correctly in DB; admin UI is not in scope here |
| **Lead assignment algorithm correctness for edge-case geo-coordinates** | Business decision about office boundaries; requires field testing | Test that the routing function is called with the submitted coordinates and returns an agent_id; correctness of boundary logic is a smoke test |
| **Mapbox tile rendering quality** | Third-party CDN; aesthetic | Test that the map container is present and receives the `load` event within a timeout |
| **UTM parameter interpretation / analytics dashboards** | GA4 dashboards are outside the platform boundary | Test that UTM parameters from the URL are captured and stored on the lead record |

---

## Epic 4 Infrastructure Carry-Over

Stories 5.1–5.3 build on the test infrastructure established in Epics 3–4. The following apply immediately:

### Test Infrastructure (Already in Place)

- Vitest `environmentMatchGlobs` — `jsdom` applied to `tests/unit/**/*.spec.tsx`. All Epic 5 component tests in `tests/unit/seller/` will inherit this automatically.
- `@testing-library/react`, `jsdom`, `@testing-library/user-event` installed.
- `vi.mock(...)` hoisting pattern — declare before imports; add comment `// imported AFTER mocks`.
- `data-testid` contracts from Epics 3–4 remain in force; Epic 5 must not break them.

### New `data-testid` Contract for Epic 5

| Attribute | Component | Story |
|-----------|-----------|-------|
| `data-testid="seller-hero"` | SellerLandingPage | 5.1 |
| `data-testid="seller-form"` | SellerForm | 5.1 |
| `data-testid="form-step-1"` | SellerForm | 5.1 |
| `data-testid="form-step-2"` | SellerForm | 5.1 |
| `data-testid="form-step-3"` | SellerForm | 5.1 |
| `data-testid="progress-bar"` | SellerForm | 5.1 |
| `data-testid="pricing-help-checkbox"` | SellerForm Step 2 | 5.1 |
| `data-testid="location-map"` | LocationPicker | 5.1 |
| `data-testid="location-text-input"` | LocationPicker | 5.1 |
| `data-testid="cma-form"` | CMARequestForm | 5.2 |
| `data-testid="cma-confirmation"` | CMAConfirmationScreen | 5.2 |
| `data-testid="agent-match-card"` | AgentMatchCard | 5.2 |
| `data-testid="seller-confirmation"` | SellerConfirmationScreen | 5.1 |

### SellerForm Lazy-Loading Note

`SellerForm` is lazy-loaded via `next/dynamic` (~15KB, not in main bundle per AR performance budget). The same module-mock pattern used for `PropertyGallery` in Epic 4 applies here for unit tests: `vi.mock('@/components/seller/SellerForm')`. Full form behavior is validated at the E2E level.

---

## Risk Assessment

> P (Probability) × I (Impact) = Score. Scores ≥ 6 require mitigation before the story ships.

### High-Priority Risks (Score ≥ 6)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|-------|----------|-------------|---|---|-------|------------|-------|----------|
| R-001 | 5.3 | SEC | Lead PII (phone, email) stored in plaintext — AR17 and NFR9 require column-level encryption; if encryption is not implemented, a DB breach exposes seller personal data | 2 | 3 | 6 | Integration test asserts that `leads` table phone/email columns are NOT stored as plaintext (verify column is ciphertext, not raw string); unit test for `encryptField()` / `decryptField()` helper; verify encryption key is loaded from env, not hardcoded | Dev | Before 5.3 ships |
| R-002 | 5.3 | DATA | Silent lead drop — a server error in `POST /api/leads` returns 500 without persisting the record, and neither the user nor the developer is notified; seller lead is permanently lost | 2 | 3 | 6 | Integration test: simulate DB error; assert Sentry captures the error (AR19); assert response is a clear error (not silent 200); E2E test: if POST fails, show user a retry/error UI (not silent success) | Dev/QA | Before 5.3 ships |
| R-003 | 5.3 | DATA | Duplicate lead submission — seller taps "Submit" twice due to slow network; two lead records created for the same phone + source within 60s; agent is confused by duplicate contact | 2 | 3 | 6 | API test: POST same payload twice within 60s; assert second request returns 409 or a friendly "Already submitted" response; assert only one record in DB | Dev | Before 5.3 ships |
| R-004 | 5.1 | BUS | Map pin-drop silently fails to capture coordinates — seller drops a pin but the `coordinates` field is undefined in the payload; agent receives no location; lead quality severely degraded | 2 | 3 | 6 | Component test: simulate map `click` event; assert form state captures lat/lng; integration test: submit with coordinates; assert lead record has non-null lat/lng; E2E test: drop pin; assert hidden lat/lng inputs have values before submit | Dev/QA | Before 5.1 ships |
| R-005 | 5.3 | BUS | Agent routing fails or returns no agent — the geo-routing logic throws or returns `null`; lead is stored without `assigned_agent_id`; no one receives the lead and it is permanently orphaned | 2 | 3 | 6 | Unit test: `matchAgentByCoordinates()` with PZ coordinates → assert Altitud PZ agent returned; with Dominical coordinates → assert Altitud Cero agent; with null coordinates → assert fallback agent or error logged; API test: submit without coordinates; assert lead is still created (fallback routing) | Dev | Before 5.3 ships |
| R-006 | 5.1 | PERF | SellerForm not lazy-loaded — ~15KB form component included in main bundle, pushing total JS over 150KB budget (AR11 performance budget); SSG page initial load degraded | 2 | 3 | 6 | Build assertion test: verify `SellerForm` is absent from the initial JS chunk; verify `next/dynamic` is used; seller landing page LCP should not regress | Dev | Before 5.1 ships |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner |
|---------|-------|----------|-------------|---|---|-------|------------|-------|
| R-007 | 5.1 | TECH | Multi-step form data loss on navigation — pressing browser Back or refreshing between steps clears previously entered data; seller must start over | 2 | 2 | 4 | Component test: enter data in step 1; advance to step 2; go back; assert step 1 data is preserved in component state | Dev |
| R-008 | 5.1 | BUS | "I need help with pricing" checkbox does not attach note to lead record — AC states a note must be added; if missing, agent receives no signal that seller needs pricing consultation | 2 | 2 | 4 | Unit test: `buildLeadPayload()` with checkbox checked → assert `notes` field includes "needs pricing consultation" string; API test: submit with checkbox; assert lead record `notes` field non-empty | Dev |
| R-009 | 5.2 | DATA | CMA form stored with wrong `source` or `intent` — lead is tagged `source: "seller_form"` instead of `"cma_form"`, making it impossible to distinguish CMA vs. listing inquiries in analytics | 2 | 2 | 4 | Integration test: submit CMA form; assert `source === "cma_form"` and `intent === "sell"` in persisted record; separately assert seller form uses `source === "seller_form"` | Dev |
| R-010 | 5.3 | SEC | UTM parameters passed directly to SQL without sanitization — if UTM values are not validated through the Zod schema, a malicious actor could inject data | 2 | 2 | 4 | API test: submit with `utm_source` containing SQL injection string; assert Zod rejects or sanitizes; assert DB value is the safe sanitized string; assert no SQL error | Dev |
| R-011 | 5.1 | BUS | Form validation errors appear in wrong locale — inline error messages render in English when locale is `es`, violating FR32 | 1 | 3 | 3 | E2E test: load `/es/sell`; leave required field empty; tap Next; assert error message text is in Spanish | Dev/QA |

### Low-Priority Risks (Score 1–2)

| Risk ID | Story | Category | Description | P | I | Score | Action |
|---------|-------|----------|-------------|---|---|-------|--------|
| R-012 | 5.1 | BUS | Bedrooms/Bathrooms dropdowns visible for Lote/Terreno property type — AC states these should be hidden; UX inconsistency | 1 | 2 | 2 | Component test: select "Lote/Terreno"; assert beds/baths dropdowns are hidden | Dev |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Entry Criteria

- [x] Epic 4 fully done — all 5 stories merged; `AgentCard` component available as shared dependency for agent match card
- [x] Epic 2 data pipeline running — agents table populated with photo, languages, office, active status
- [x] Vitest jsdom environment configured (`tests/unit/**/*.spec.tsx`) — inherited from Epics 3–4
- [x] Test suite passing across Epics 1–4 with 0 regressions
- [ ] `leads` table schema defined and migrated (Drizzle) with all fields per Story 5.3 AC — required before Story 5.3 development
- [ ] Column-level encryption helpers (`encryptField`, `decryptField`) implemented or stubbed — required before Story 5.3
- [ ] Agent routing function interface defined (`matchAgentByCoordinates(lat, lng): AgentId | null`) — required before Story 5.3
- [ ] Playwright framework configured — required before E2E tests run (scaffolded in prior epic; unskip epic-5 suite)
- [ ] Test data: ≥5 seeded agent records with office, active status, and coordinates bounding box — required before integration/E2E tests
- [ ] Environment variable `LEAD_ENCRYPTION_KEY` set in test environment — required before encryption tests pass

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing (≥ 95%)
- [ ] No open high-severity bugs against P0 scenarios
- [ ] R-001 (PII encryption): confirmed via integration test that phone/email columns are ciphertext
- [ ] R-002 (silent lead drop): Sentry error capture verified; user-facing error state confirmed
- [ ] R-003 (duplicate submission): idempotency test passing (409 on duplicate within 60s)
- [ ] R-004 (coordinates capture): pin-drop → DB coordinate verified end-to-end
- [ ] R-005 (agent routing): unit tests covering PZ, Cero, and null-coordinate paths
- [ ] Core conversion flow (`/en/sell` → 3-step form → submit → confirmation with agent card) validated E2E
- [ ] Both EN and ES locales tested on the seller landing page and form

---

## Test Coverage Plan

> P0/P1/P2/P3 = **priority and risk level**, NOT execution timing. Execution scheduling is handled in the Execution Strategy section.

### P0 (Critical)

**Criteria:** Blocks core user journey + High risk (score ≥ 6) + No workaround

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 5.3-API-001 | 5.3 | POST `/api/leads` stores all seller form fields (name, phone, email, source, intent, property details, assigned_agent_id) | API | R-002 | Submit full seller payload; assert 201 and DB record matches all fields |
| 5.3-API-002 | 5.3 | Duplicate submission within 60s (same phone + source) returns friendly rejection | API | R-003 | POST twice with same phone+source within 60s; assert second returns 409; assert only 1 DB record |
| 5.3-API-003 | 5.3 | POST `/api/leads` with DB error → Sentry captures error; response is not silent 200 | API | R-002 | Mock DB throw; assert Sentry.captureException called; assert response status 500 + error body |
| 5.3-UNIT-001 | 5.3 | `encryptField()` produces ciphertext (not plaintext) for phone and email values | Unit | R-001 | Assert output is NOT the input string; assert decryption round-trips correctly |
| 5.3-UNIT-002 | 5.3 | `leads` table phone and email columns stored as ciphertext, not plaintext | Integration | R-001 | Insert lead; read raw DB value; assert raw value !== original phone string |
| 5.3-UNIT-003 | 5.3 | `matchAgentByCoordinates()` returns Altitud PZ agent for Pérez Zeledón coordinates | Unit | R-005 | Seed PZ office + agent; call with PZ coords; assert returned agent_id belongs to PZ office |
| 5.3-UNIT-004 | 5.3 | `matchAgentByCoordinates()` returns Altitud Cero agent for Dominical/Uvita coordinates | Unit | R-005 | Seed Cero office + agent; call with Dominical coords; assert agent_id is Cero agent |
| 5.3-UNIT-005 | 5.3 | `matchAgentByCoordinates()` handles null coordinates without throwing (fallback) | Unit | R-005 | Call with null; assert returns fallback agent or null without exception |
| 5.1-COMP-001 | 5.1 | Map pin-drop event captures lat/lng into form state | Component | R-004 | Simulate map `click` with coordinates; assert form state contains `lat` and `lng` |
| 5.1-E2E-001 | 5.1 | 3-step seller form submits successfully end-to-end on `/en/sell` | E2E | R-004, R-006 | Fill all 3 steps; submit; assert confirmation screen with agent match card |
| 5.1-E2E-002 | 5.1 | SellerForm chunk is NOT in initial JS bundle (lazy-loaded per AR performance budget) | Unit/Build | R-006 | Assert `SellerForm` absent from initial chunk; `next/dynamic` verified |
| 5.2-API-001 | 5.2 | CMA form submission stores `source = "cma_form"` and `intent = "sell"` | API | R-009 | Submit CMA payload; assert DB record has correct source and intent |

**Total P0:** 12 scenarios (~20–36 hours)

---

### P1 (High)

**Criteria:** Important feature path + Medium risk (score 3–5) + Common workflow

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 5.1-E2E-003 | 5.1 | Seller landing page renders SEO hero (h1/h2, benefits, process, testimonials) above form | E2E | — | Assert hero section present; h1 visible; `data-testid="seller-hero"` rendered |
| 5.1-E2E-004 | 5.1 | Progress bar updates correctly as user advances through 3 steps | E2E | — | Step 1 → assert bar at 33%; Step 2 → 66%; Step 3 → 100% |
| 5.1-E2E-005 | 5.1 | Back navigation preserves entered data (R-007) | E2E | R-007 | Enter data in step 1; go to step 2; press Back; assert step 1 data still populated |
| 5.1-COMP-002 | 5.1 | "I need help with pricing" checkbox makes price field optional and attaches note to payload | Component | R-008 | Check checkbox; assert price field no longer `required`; assert `buildLeadPayload()` includes pricing note |
| 5.1-COMP-003 | 5.1 | Inline validation errors appear in correct locale (EN on `/en/sell`) | Component | R-011 | Leave Name empty; click Next; assert error text in English |
| 5.1-E2E-006 | 5.1 | Inline validation errors appear in Spanish on `/es/vende` | E2E | R-011 | Load ES route; leave required field empty; assert Spanish error message |
| 5.1-COMP-004 | 5.1 | Step 1 hides Bedrooms/Bathrooms when "Lote/Terreno" property type is selected | Component | R-012 | Select Lote/Terreno; assert beds/baths fields hidden |
| 5.1-E2E-007 | 5.1 | Location text field is functional when map fails to load (fallback flow) | E2E | — | Block map script; assert text input accepts address; form submits without coordinates |
| 5.3-API-004 | 5.3 | POST `/api/leads` Zod schema rejects missing required fields with clear error | API | R-010 | POST without phone; assert 400 with field-specific error message |
| 5.3-API-005 | 5.3 | UTM parameters from URL are captured and stored on lead record | API | — | POST with utm_source, utm_medium, utm_campaign; assert all stored on record |
| 5.3-API-006 | 5.3 | HTTP referrer is captured and stored on lead record | API | — | POST with `Referer` header; assert referrer stored on record |
| 5.3-API-007 | 5.3 | Seller form lead stores `source = "seller_form"` and `intent = "sell"` | API | R-009 | Submit seller form payload; assert source and intent on DB record |
| 5.3-API-008 | 5.3 | POST `/api/leads` validates input through Zod and sanitizes utm_source (R-010) | API | R-010 | POST with SQL injection string in utm_source; assert Zod rejects or sanitizes; no DB error |
| 5.2-E2E-001 | 5.2 | CMA form loads with value proposition ("what a CMA is and why it's free") | E2E | — | Load CMA form; assert introductory text visible before form fields |
| 5.2-E2E-002 | 5.2 | CMA confirmation screen shows matched agent card with WhatsApp + Email CTAs | E2E | — | Submit CMA form; assert `data-testid="cma-confirmation"` with agent name, photo, CTAs |
| 5.2-COMP-001 | 5.2 | CMA form shares location picker component with seller listing form | Component | — | Import location picker in both forms; assert same `data-testid="location-map"` contract |

**Total P1:** 16 scenarios (~18–30 hours)

---

### P2 (Medium)

**Criteria:** Secondary feature + Low risk (score 1–2) + Edge cases

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 5.1-COMP-005 | 5.1 | Property Type radio group renders 5 options: Casa, Lote/Terreno, Finca, Condominio, Comercial | Component | — | Mount Step 1; assert all 5 options rendered |
| 5.1-COMP-006 | 5.1 | Size field renders with m²/acres/ft² unit toggle | Component | — | Mount Step 1; assert unit toggle with 3 options |
| 5.1-COMP-007 | 5.1 | Step 2 renders Price Expectation, "I need help with pricing" checkbox, Description, Photos upload, Beds/Baths | Component | — | Mount Step 2 with Casa type; assert all fields visible |
| 5.1-COMP-008 | 5.1 | Step 3 renders Name, Phone/WhatsApp, Email (marked optional), Preferred Language | Component | — | Mount Step 3; assert all fields; assert email has optional label |
| 5.1-E2E-008 | 5.1 | Seller landing page is SSG (no client-only render) | E2E | — | Load page with JS disabled; assert hero and CTA still rendered |
| 5.1-E2E-009 | 5.1 | Form is completable in under 3 minutes on simulated low-end mobile (4G) | E2E | — | Playwright throttled 4G + mobile viewport; time full form completion; assert < 180s |
| 5.1-UNIT-001 | 5.1 | All form labels, placeholders, and button text render in ES on Spanish locale | Unit | — | Render form with `locale="es"`; assert i18n strings applied |
| 5.3-API-009 | 5.3 | POST `/api/leads` creates lead record with all schema fields per AC (id, name, email, phone, source, intent, language, assigned_agent_id, property_id null, notes, status "new", utm_*, referrer, created_at) | API | — | Submit complete payload; assert all 14+ fields present in DB record |
| 5.3-UNIT-006 | 5.3 | WhatsApp click on confirmation page is recorded as a lead event with source context | Unit | — | Simulate WhatsApp button click on confirmation; assert analytics event fired with source |
| 5.2-COMP-002 | 5.2 | CMA form is accessible as secondary CTA on seller landing page without navigation | Component | — | Mount seller page; assert "Request a Free CMA" CTA present; assert it opens CMA form in-page |
| 5.2-UNIT-001 | 5.2 | CMA form labels, validation messages, and confirmation text display in ES on Spanish locale | Unit | — | Render CMA form with `locale="es"`; assert Spanish strings |
| 5.2-COMP-003 | 5.2 | CMA form Comment/Message field is optional (no required validator) | Component | — | Submit CMA form without comment; assert no validation error on that field |

**Total P2:** 12 scenarios (~8–16 hours)

---

### P3 (Low)

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Test ID | Story | Requirement / AC | Test Level | Notes |
|---------|-------|-----------------|------------|-------|
| 5.1-E2E-010 | 5.1 | Seller landing page Lighthouse performance score ≥ 80 on mobile (NFR28) | E2E | Run Lighthouse CI; assert score ≥ 80 on `/en/sell` |
| 5.1-E2E-011 | 5.1 | Map loads progressively after 2s — initial render shows text field first | E2E | Assert text input visible immediately; assert map container appears after 2s delay |
| 5.2-E2E-003 | 5.2 | CMA form page has appropriate SEO meta title and description (FR69 parity) | E2E | Assert `<title>` and `<meta name="description">` in page `<head>` |
| 5.3-API-010 | 5.3 | POST `/api/leads` responds within 500ms under normal load | API | Assert response time < 500ms for single lead submission |

**Total P3:** 4 scenarios (~2–4 hours)

---

## Execution Strategy

**Philosophy:** Run everything in PRs unless a test is expensive or long-running. The Playwright suite parallelizes across workers.

### Every PR

- All Vitest unit + component tests (`npm test`) — includes encryption unit tests, routing unit tests, form component tests
- All Playwright E2E functional tests (`playwright test --grep "epic-5"`) — once Playwright is unskipped for this epic

### Nightly / Regression

- Lighthouse CI performance benchmarks (P3)
- Full E2E suite across both locales (EN + ES)
- Deduplication / idempotency stress test (rapid sequential POSTs)

### Before Story Ships (Story-Level Gates)

- **Before 5.1 ships:** R-006 (lazy-load build assertion), R-004 (coordinate capture), form locale tests
- **Before 5.2 ships:** R-009 (CMA source/intent), confirmation screen E2E
- **Before 5.3 ships:** R-001 (PII encryption), R-002 (silent drop + Sentry), R-003 (idempotency), R-005 (agent routing), R-010 (Zod/UTM sanitization)

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Effort/Scenario | Total Hours | Notes |
|----------|-------|----------------|-------------|-------|
| P0 | 12 | ~2–3h | ~20–36h | Encryption, API, E2E with fixtures |
| P1 | 16 | ~1–2h | ~18–30h | Component + API + E2E |
| P2 | 12 | ~0.5–1h | ~8–16h | Component + unit |
| P3 | 4 | ~0.5h | ~2–4h | Lighthouse + benchmarks |
| **Total** | **44** | — | **~48–86h** | **~1.5–2 weeks** |

### Prerequisites

**Test Data:**

- `agentFactory` — seeded agents with `office: "PZ" | "Cero"`, active status, photo, languages (5+ records)
- `leadFactory` — lead records for regression/idempotency tests
- Encryption key in `TEST_LEAD_ENCRYPTION_KEY` env variable

**Tooling:**

- Vitest + RTL for component and unit tests
- Playwright for E2E (seller form flow, confirmation, locale)
- Playwright throttling profile for 4G mobile simulation
- Drizzle test DB client for raw column inspection (encryption verification)

**Environment:**

- Test DB with `leads` schema migrated
- `LEAD_ENCRYPTION_KEY` env variable in CI and local test environments
- Playwright configured for mobile viewport (360px — $150 Android baseline)

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (no exceptions)
- **P1 pass rate:** ≥ 95% (waivers required for failures)
- **P2/P3 pass rate:** ≥ 90% (informational)
- **High-risk mitigations:** 100% complete or approved waivers before release

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥ 6) items unmitigated
- [ ] R-001 (PII encryption): raw DB column confirmed as ciphertext
- [ ] R-002 (silent drop): Sentry integration test passing
- [ ] R-003 (idempotency): duplicate-within-60s returns 409
- [ ] R-005 (agent routing): both office routing paths verified by unit tests
- [ ] Core conversion flow validated E2E in both EN and ES locales

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|-------------------|--------|-----------------|
| **AgentCard (Epic 4)** | Reused as `AgentMatchCard` on confirmation screen; breaking change in AgentCard props would break confirmation | Assert `data-testid="agent-card"` still renders with required props across existing Epic 4 E2E tests |
| **LocationPicker (new, shared)** | Used by both SellerForm (5.1) and CMARequestForm (5.2); internal API contract must be stable | Component test in 5.2 must pass the same `onCoordinatesChange` callback interface used in 5.1 |
| **`/api/leads` endpoint** | New endpoint; must not conflict with any existing API routes | Verify no route collision; all existing E2E tests still passing after endpoint introduction |
| **Drizzle `leads` schema** | New table; migration must not break existing tables | Run full migration against test DB; assert existing `properties`, `agents`, `sync_logs` tables intact |
| **i18n namespace** | New `seller` translation namespace; must not overwrite existing keys | Assert existing EN/ES keys untouched; add `seller.*` keys without collision |

---

## Assumptions and Dependencies

### Assumptions

1. The `leads` table schema will be defined in Drizzle before Story 5.3 development begins.
2. Column-level encryption is implemented as a Drizzle column transformer or a utility function wrapping field write/read — not as a separate service.
3. Agent routing (`matchAgentByCoordinates`) is a pure function that can be unit-tested without a live PostGIS instance; it accepts coordinates and a seeded agents array.
4. The seller landing page route is `/{locale}/sell` (EN) and `/{locale}/vende` (ES) — or a single route with locale-based content. The exact route structure must be confirmed before E2E test paths are written.
5. The `SellerForm` component is exported from `@/components/seller/SellerForm` and uses `next/dynamic` for lazy loading.
6. Photo upload in Step 2 is an optional enhancement; failed upload should not block form submission.

### Dependencies

1. **`leads` Drizzle schema** — Required before Story 5.3 API tests can run
2. **`LEAD_ENCRYPTION_KEY` env variable** — Required in CI before encryption tests pass
3. **Agent fixture data** — Required before routing unit tests and E2E confirmation screen tests
4. **Playwright epic-5 suite tag** — Required before E2E tests run in CI; must be added to Playwright config

### Risks to Plan

- **Risk:** Photo upload (S3 or similar) may introduce additional encryption/privacy scope not covered in Epic 5 AC
  - **Impact:** Photos containing PII metadata could be a compliance gap
  - **Contingency:** Treat photo upload as optional feature; verify it is stripped of EXIF metadata before storage

- **Risk:** Agent routing boundary for Pérez Zeledón vs. Dominical offices is not geo-fenced — it is a business rule
  - **Impact:** Routing tests must use known coordinates that unambiguously belong to one office
  - **Contingency:** Get fixture coordinate sets from the business (e.g., the REMAX Altitud office address lat/lng) before writing routing tests

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for Story 5.1 before development starts (separate workflow; not auto-run).
- Run `*atdd` again for Stories 5.2 and 5.3 at the start of each respective story.
- Run `*automate` for broader coverage once implementation exists.
- Run `*trace` after implementation to generate the traceability matrix linking these test IDs to story acceptance criteria.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: Date:
- [ ] Tech Lead: Date:
- [ ] QA Lead: Date:

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection
- `test-priorities-matrix.md` — P0–P3 prioritization

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md` (FR40–FR43, FR54, NFR9, AR17–AR19)
- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 5, Stories 5.1–5.3)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (§8 performance budget, §10 lead PII, §11 monitoring)
- Prior Test Design: `_bmad-output/test-artifacts/test-design-epic-4.md` (carry-over infrastructure)
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
