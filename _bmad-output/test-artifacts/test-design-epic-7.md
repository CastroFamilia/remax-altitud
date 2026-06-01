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
  - '_bmad/tea/config.yaml'
  - 'skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
  - '_bmad-output/test-artifacts/test-design-epic-6.md'
epicScope:
  inScope: ['7.1', '7.2', '7.3', '7.4']
---

# Test Design: Epic 7 — Shortlist & Smart Agent Routing

**Date:** 2026-05-28
**Author:** Sebicas (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 7 — Shortlist & Smart Agent Routing

---

## Executive Summary

**Scope:** Epic-level test design for Stories 7.1–7.4 of Epic 7. All stories are in backlog; this document governs the full epic test strategy before the first story begins.

Epic 7 is the **visitor collaboration and smart lead routing layer** of the platform. It introduces no-auth localStorage persistence for saving properties (up to 20), visual shortlist comparison, unique shareable shortlist links (with 30-day expiration stored in `shortlist_shares`), and a highly tailored smart agent routing engine. Based on the composition of the visitor's saved properties, the routing engine dynamically determines whether to directly contact a single agent, suggest a majority agent, or offer an agent selection screen (complete with language matching and one-agent coordination messaging).

This epic completes the core **buyer conversion funnel** for REMAX Altitud. It bridges passive property search with active agent relationship building. If the shortlist comparison crashes, visitors cannot review their selections. If the share link fails, they cannot collaborate with co-buyers. If the smart routing engine drops a lead payload or truncates the WhatsApp message, high-intent buyers are lost at the very bottom of the funnel.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥ 6): 5
- Critical categories: SEC, BUS, DATA, PERF
- No score-9 (BLOCK) risks — all high-priority risks scored 6 (MITIGATE threshold)

**Coverage Summary:**

- P0 scenarios: 13 (~22–40 hours)
- P1 scenarios: 16 (~16–30 hours)
- P2 scenarios: 12 (~8–16 hours)
- P3 scenarios: 4 (~2–4 hours)
- **Total effort:** ~48–90 hours (~1.5–2 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| **WhatsApp application launch / messaging state** | External application; cannot be automated or inspected in CI | Verify the generated deep-link URL format and parameters (phone number and fully encoded text body) in both component and E2E tests |
| **Email delivery delivery success** | Out of scope for this front-end / lead capture layer | Verify the native `mailto` link or fallback API call contains the correct recipient, subject, and body format |
| **Real estate agent active listing counts correctness** | Business logic determined by the daily sync pipeline (Epic 2) | Mock agent active listing counts in test data fixtures; verify they display correctly on the selection cards |
| **Mapbox map tile loading performance** | Third-party tile server latency is external to application | Test that the comparison page mini-map container is present and receives correct coordinates; verify no Mapbox GL JS bundle is loaded |
| **Visual comparison grid responsiveness on extreme viewports (<320px)** | Standard target viewports cover $150 Android (360px) and above | Target responsive assertions to 360px (mobile) and 1280px (desktop) viewport baselines |
| **Long-term sharing link cleanup automation** | Clean-up of expired db records is a server cron / database optimization concerns | Assert that sharing link requests older than 30 days return a friendly expired error page; backend database clean-up script is out of scope |

---

## Epic 6 Infrastructure Carry-Over

Stories 7.1–7.4 build on the test infrastructure established in Epics 3–6. The following apply immediately:

### Test Infrastructure (Already in Place)

- Vitest `environmentMatchGlobs` — `jsdom` applied to `tests/unit/**/*.spec.tsx`. All Epic 7 hooks and components in `tests/unit/shortlist/` will inherit this automatically.
- `@testing-library/react`, `jsdom`, `@testing-library/user-event` installed.
- `vi.mock(...)` hoisting pattern — declare before imports; add comment `// imported AFTER mocks`.
- `data-testid` contracts from Epics 3–6 remain in force; Epic 7 must not break them.
- `AgentCard` component with established `data-testid="agent-card"` contract — reused inside the Agent Selection Modal.

### New `data-testid` Contract for Epic 7

| Attribute | Component | Story |
|-----------|-----------|-------|
| `data-testid="save-heart-button"` | SaveHeartButton | 7.1 |
| `data-testid="shortlist-nav-badge"` | ShortlistNavBadge | 7.1 |
| `data-testid="shortlist-grid"` | ShortlistPage | 7.2 |
| `data-testid="shortlist-mini-map"` | ShortlistPage | 7.2 |
| `data-testid="shortlist-empty-state"` | ShortlistPage | 7.2 |
| `data-testid="remove-shortlist-item"` | ShortlistPage | 7.2 |
| `data-testid="ask-agent-button"` | ShortlistPage | 7.2 |
| `data-testid="share-shortlist-button"` | ShortlistPage | 7.2 |
| `data-testid="agent-selection-modal"` | AgentSelectionModal | 7.4 |
| `data-testid="agent-routing-card"` | AgentRoutingCard | 7.4 |
| `data-testid="routing-interstitial-text"`| AgentSelectionModal | 7.4 |

---

## Risk Assessment

> P (Probability) × I (Impact) = Score. Scores ≥ 6 require mitigation before the story ships.

### High-Priority Risks (Score ≥ 6)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|-------|----------|-------------|---|---|-------|------------|-------|----------|
| R-001 | 7.3 | SEC | Shortlist Share ID enumeration — sequential or easily guessable share URLs (e.g. `/shortlist/123`) let malicious actors harvest private shortlists or user search preferences. | 2 | 3 | 6 | Use a cryptographically secure, high-entropy unique slug (12+ character NanoID or UUID-v4) for `share_id`. Write unit test verifying non-sequential ID generation. | Dev | Before 7.3 ships |
| R-002 | 7.4 | BUS | WhatsApp deep-link truncation — a user with a max-capacity shortlist (20 properties) generates a pre-populated message exceeding the ~2000 character limit for WhatsApp click-to-chat links, causing a silent crash when tapped. | 2 | 3 | 6 | E2E and API tests verifying deep-link generation handles 20 properties. If characters exceed a safe threshold (1800 chars), dynamically shorten listing descriptions or format as a link to their shared shortlist. | Dev | Before 7.4 ships |
| R-003 | 7.4 | DATA | Shortlist lead database drop — lead creation fails to store the `shortlist_property_ids[]` array or fails silently on slow connections, dropping high-intent buyers without coordination context. | 2 | 3 | 6 | API integration tests asserting lead payload schema validation (Zod) and persistence of `shortlist_property_ids` column. Client-side retry logic and visible error states. | Dev/QA | Before 7.4 ships |
| R-004 | 7.1 | BUS | Hydration mismatch / flashing navigation badge — localStorage is read before hydration completes, causing server-client HTML mismatch or a jarring visual flash (e.g., 0 saved → 5 saved). | 2 | 3 | 6 | Use a mounted state inside `useEffect` or next/dynamic with `ssr: false` to delay reading localStorage until hydration finishes. Validate via E2E snapshot tests. | Dev | Before 7.1 ships |
| R-005 | 7.4 | PERF | Agent selection modal bundle bloat — loading the AgentSelectionModal and associated assets in the main bundle pushes the homepage/search pages over the 150KB budget (AR11), degrading LCP. | 2 | 3 | 6 | Use `next/dynamic` to lazy-load the AgentSelectionModal. Verify modal components are only requested from the network when "Ask about these" is tapped. | Dev | Before 7.4 ships |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner |
|---------|-------|----------|-------------|---|---|-------|------------|-------|
| R-006 | 7.2 | BUS | Shortlist loads inactive / hidden properties — a property in a user's localStorage shortlist is soft-deleted or hidden (`is_visible=false`); loading it throws an error or displays dead links. | 2 | 2 | 4 | API filter in `/api/shortlist` to automatically exclude `is_visible=false` listings; gracefully remove them from localStorage with a friendly UI notice. | Dev |
| R-007 | 7.4 | TECH | Smart routing logic mismatch — tied or even property distributions route incorrectly or bypass the AgentSelectionModal, assigning the lead to an irrelevant agent. | 2 | 2 | 4 | Unit test suite verifying routing calculations with explicit inputs (single-agent, majority-agent, multi-agent ties). | Dev |
| R-008 | 7.3 | SEC | Private properties returned via share link — sharing a shortlist exposes properties that have been marked hidden or expired since the share was generated, violating administrative visibility rules. | 1 | 3 | 3 | Ensure the share loading endpoint filters out `is_visible=false` properties from the returned list, showing "Listing no longer available" placeholders instead. | Dev |
| R-009 | 7.1 | BUS | Heart icon outline/fill colors inaccessible — color contrast between outline (#888) and filled states is insufficient for low-vision users, failing WCAG 2.1 AA compliance (NFR21). | 1 | 3 | 3 | Enforce distinct color and fill changes (outline style changes to fully-solid color with `--color-accent` #660000) and ensure dynamic `aria-label` updates. | Dev/QA |
| R-010 | 7.4 | BUS | Agent sorting fails language match — English visitors are matched with Spanish-only agents or vice-versa, causing immediate communication friction on WhatsApp. | 1 | 3 | 3 | Unit test the sorting algorithm to ensure active agents are ranked by language match first. E2E test language toggle impact. | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Story | Category | Description | P | I | Score | Action |
|---------|-------|----------|-------------|---|---|-------|--------|
| R-011 | 7.1 | UX | Duplicate "your agent will show you all of them" tooltips — the tooltip triggers repeatedly across a single session, annoying the visitor. | 2 | 1 | 2 | Store a `tooltip_shown` flag in `sessionStorage` to suppress duplicate alerts. | Monitor |
| R-012 | 7.2 | BUS | Share button clicked on empty shortlist — share button triggers API request without properties, causing a server-side 400 or empty share record. | 1 | 2 | 2 | Disable the share and routing buttons when the shortlist is empty; add client-side validation. | Monitor |

---

## Entry Criteria

- [x] Epic 4 fully complete — `AgentCard` and `PropertyCard` shared components are available in the repository.
- [x] Database schema is functional — `properties` and `agents` tables are fully migrated and populated with mock listings.
- [x] Vitest `jsdom` testing environment configured for frontend unit/component tests.
- [x] Playwright E2E framework configured and integrated into standard workspace CI pipelines.
- [ ] `shortlist_shares` table schema defined in Drizzle and migrated on the target DB environment (required before Story 7.3).
- [ ] Test agent dataset seeded with varied languages, offices (Altitud PZ / Altitud Cero), and coordinates (required before Story 7.4).
- [ ] Language translation keys configured under `shortlist` namespace for EN and ES (required before Story 7.1).

## Exit Criteria

- [ ] All P0 automated tests passing (100% success rate).
- [ ] All P1 automated tests passing (≥ 95% success rate).
- [ ] No open high-priority bugs (score ≥ 6) left unmitigated.
- [ ] R-001 (high-entropy Share ID): verified that slugs are secure strings (not auto-incremented integers).
- [ ] R-002 (WhatsApp deep-link format): tested with maximum 20 listings without browser truncation or failure.
- [ ] R-003 (leads schema): confirmed `shortlist_property_ids` column properly holds array values in DB.
- [ ] R-004 (hydration mismatch): verified Next.js hydration issues resolved on both mobile and desktop.
- [ ] Complete E2E shortlist user flow validated (`search` → save 3 properties → `shortlist comparison` → `share` → `ask about these` → WhatsApp payload).

---

## Test Coverage Plan

> **Note:** P0/P1/P2/P3 specify priority and risk levels, NOT execution timing. Execution scheduling is defined in the Execution Strategy section.

### P0 (Critical)

**Criteria:** Blocks core conversion journey + High risk (score ≥ 6) + No workaround.

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 7.1-UNIT-001 | 7.1 | `use-shortlist` hook persists saved property IDs in `localStorage` across page changes | Unit | R-004 | Assert saved array matches inputted IDs; verify persistence on multiple mounts |
| 7.1-COMP-001 | 7.1 | SaveHeartButton renders correct `aria-label` and toggles outline/fill state on click | Component | R-009 | Assert outline SVG changes to filled `--color-accent` #660000; assert `aria-label` updates |
| 7.1-COMP-002 | 7.1 | Saving 21st property shows "Remove one to add more" toast notification and rejects save | Component | — | Seed 20 items in localStorage; attempt to save 21st; assert toast triggered; assert count remains 20 |
| 7.2-E2E-001 | 7.2 | Shortlist comparison page displays visual layout and remove (✕) button for saved items | E2E | R-006 | Seed localStorage with 2 properties; load `/shortlist`; assert 2 PropertyCards and remove buttons render |
| 7.2-E2E-002 | 7.2 | Tapping remove (✕) immediately removes item from `localStorage` and updates visual grid | E2E | — | Tap remove button; assert `localStorage` updated; assert card is removed from DOM without page reload |
| 7.3-API-001 | 7.3 | POST `/api/shortlist` generates cryptographically secure 12+ character unique slug | API | R-001 | POST shortlist payload; assert 201 response containing high-entropy NanoID/UUID slug |
| 7.3-E2E-001 | 7.3 | Share URL loads read-only comparison page with same properties on another device | E2E | R-008 | Request generated share URL; assert page renders correct property details and mini-map |
| 7.4-UNIT-001 | 7.4 | Smart routing logic suggestions match single listing agent when all properties belong to 1 agent | Unit | R-007 | Seed properties with 1 agent; run routing calculation; assert correct single agent matched |
| 7.4-UNIT-002 | 7.4 | Smart routing suggests majority agent (2+ properties) with custom text and secondary choice | Unit | R-007 | Seed properties (2 Agent A, 1 Agent B); run router; assert majority agent text and options returned |
| 7.4-UNIT-003 | 7.4 | Smart routing displays selection modal when properties are evenly tied | Unit | R-007 | Seed properties (1 Agent A, 1 Agent B); run router; assert AgentSelectionModal trigger returned |
| 7.4-COMP-001 | 7.4 | AgentSelectionModal is lazy-loaded and not present in initial page JS bundle | Unit/Build | R-005 | Assert dynamic import is used; verify modal module chunk only requested upon trigger |
| 7.4-API-001 | 7.4 | Creating shortlist lead stores `shortlist_property_ids` array, agent, source, intent and UTM data | API | R-003 | POST lead payload; assert database record matches all details, particularly the property IDs array |
| 7.4-E2E-001 | 7.4 | WhatsApp CTA generated deep-link parses 20 properties without truncation | E2E | R-002 | Seed 20 items; click WhatsApp CTA; assert deep link URL contains all 20 property reference IDs |

**Total P0:** 13 tests, ~22–40 hours

---

### P1 (High)

**Criteria:** Important feature path + Medium risk (score 3–5) + Common workflow.

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 7.1-COMP-003 | 7.1 | Tapping 2nd saved heart shows "Save more — your agent will show you" tooltip | Component | R-011 | Save 1st, then 2nd; assert tooltip rendered; verify it does not render on 3rd or subsequent saves |
| 7.1-E2E-003 | 7.1 | Shortlist nav icon shows correct saved count badge on all views | E2E | R-004 | Save 3 properties; navigate from search to homepage; assert count badge is persistently '3' |
| 7.1-COMP-004 | 7.1 | Keyboard users can focus and toggle the heart button using Enter or Space keys | Component | — | Tab to heart button; assert focused state; press Enter; assert saved state toggles |
| 7.2-E2E-002 | 7.2 | Shortlist mini-map shows pins for all saved properties in correct coordinates | E2E | — | Load `/shortlist` with 3 properties; assert 3 markers render on Mapbox mini-map container |
| 7.2-E2E-004 | 7.2 | Shortlist page shows friendly empty state with search CTA when no properties saved | E2E | — | Clear localStorage; load `/shortlist`; assert `data-testid="shortlist-empty-state"` is visible |
| 7.2-E2E-005 | 7.2 | Comparison CTA buttons hidden when shortlist has 0 properties | E2E | R-012 | Verify "Ask about these" and "Share" buttons are not visible on empty shortlist page |
| 7.3-API-002 | 7.3 | POST `/api/shortlist` rejects requests with non-existent or hidden property IDs | API | R-008 | Send payload with invalid property ID; assert 400 response; assert no share record created |
| 7.3-E2E-002 | 7.3 | Tapping "Share my shortlist" copies link to clipboard and triggers confirmation toast | E2E | — | Click Share; assert link copied to clipboard; assert "Link copied!" toast is displayed |
| 7.3-E2E-003 | 7.3 | Accessing expired share link (>30 days) displays friendly notice and search CTA | E2E | — | Seed expired share in DB; access URL; assert "This shortlist has expired" text visible |
| 7.3-UNIT-001 | 7.3 | Share URL uses the current viewer's i18n locale, not the original sharer's | Unit | — | Share generated in `en` accessed via `/es/shortlist/xyz`; assert Spanish labels render |
| 7.4-UNIT-004 | 7.4 | Agents in Selection Modal are sorted based on language match to visitor locale | Unit | R-010 | Detected locale `es` → assert Spanish-fluent agents are ranked first in the list |
| 7.4-E2E-002 | 7.4 | Email CTA on selection modal opens native mail client with correct pre-populated details | E2E | — | Click email CTA; assert `mailto:` link contains agent address, reference IDs, and formatted body |
| 7.4-COMP-002 | 7.4 | Education interstitial regarding one-agent model is displayed in Selection Modal | Component | — | Open modal; assert "one agent coordinates all visits" text matches UX-DR specifications |
| 7.4-API-002 | 7.4 | Lead creation API rejects invalid phone numbers or payloads via strict Zod validation | API | R-003 | POST invalid payload; assert 400 response with descriptive error validation map |
| 7.4-API-003 | 7.4 | Lead UTM capture extracts and parses UTM query parameters correctly from source URL | API | — | Submit lead from URL with `utm_campaign`; assert DB record contains matching campaign |
| 7.4-E2E-003 | 7.4 | Mobile sticky CTA bar is hidden when the Agent Selection Modal is visible | E2E | — | Open Selection Modal on mobile viewport; assert sticky mobile contact bar is hidden |

**Total P1:** 16 tests, ~16–30 hours

---

### P2 (Medium)

**Criteria:** Secondary flows + Low/medium risk + Edge cases.

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 7.1-UNIT-002 | 7.1 | Tooltip sessionStorage flag prevents repeat messages in a single browser session | Unit | R-011 | Trigger tooltip; reload; save another property; assert tooltip is not shown again |
| 7.1-E2E-004 | 7.1 | Heart icon outline/fill states render correctly in ES locale | E2E | — | Save property on `/es/search`; assert heart filled; verify ES `aria-label` updates |
| 7.2-COMP-002 | 7.2 | Shortlist items dynamically hide Beds/Baths layout for "Lote/Terreno" properties | Component | — | Save a Lote type listing; load shortlist; assert Beds/Baths labels are absent from that item |
| 7.2-COMP-003 | 7.2 | Real estate prices display correct approximate EUR conversion for non-US locales | Component | — | Render shortlist; check price column for non-US locale; assert USD + approximate EUR conversion |
| 7.2-COMP-004 | 7.2 | ZMT badge renders correctly on shortlist cards matching listing ownership status | Component | — | Verify ZMT Restricted/Concession/Titled badge renders on comparison cards |
| 7.3-API-003 | 7.3 | POST `/api/shortlist` handles special characters and formatting in property IDs | API | — | POST with URL-encoded property reference IDs; assert database stores them cleanly |
| 7.3-E2E-004 | 7.3 | Read-only shared shortlist page does not display active "✕ Remove" button | E2E | — | Load `/shortlist/[share_id]`; assert no remove (✕) elements exist on property cards |
| 7.4-UNIT-005 | 7.4 | Smart routing handles tied agent distribution deterministically (e.g. alphabetical or load balanced) | Unit | R-007 | Seed tie; verify routing resolution returns consistent state matching fallback guidelines |
| 7.4-COMP-003 | 7.4 | Agent selection card displays agent photo, name, office, languages and listing counts | Component | — | Mount selection card; assert all metadata attributes match seeded DB values |
| 7.4-E2E-004 | 7.4 | Selection Modal traps keyboard focus and prevents underlying body scroll when open | E2E | — | Open modal; verify Tab loop is constrained inside modal; verify body scroll disabled |
| 7.4-E2E-005 | 7.4 | Cross-agent shortlist lead details are visible and clearly categorized in Admin Lead View | E2E | — | Load Admin Lead detail; assert shortlist properties are grouped by listing agent |
| 7.4-API-004 | 7.4 | POST `/api/leads` sanitizes and escapes incoming strings to prevent database script injections | API | R-003 | POST with raw tags in fields; assert strings sanitized in database record |

**Total P2:** 12 tests, ~8–16 hours

---

### P3 (Low)

**Criteria:** Performance benchmarks + Exploratory + Nice-to-have.

| Test ID | Story | Requirement / AC | Test Level | Notes |
|---------|-------|-----------------|------------|-------|
| 7.2-E2E-006 | 7.2 | Shortlist page LCP < 2.5s on simulated 4G mobile connection | E2E | Verify LCP performance meets NFR1 specifications on mobile |
| 7.2-E2E-007 | 7.2 | Shortlist comparison page Lighthouse accessibility score ≥ 90 | E2E | Run Lighthouse audit; verify contrast, landmarks, and labels satisfy criteria |
| 7.3-API-004 | 7.3 | Share creation API responds within 300ms under standard loads | API | Assert request-response latency meets performance thresholds |
| 7.4-E2E-006 | 7.4 | WhatsApp URL generation executes in < 150ms on click | E2E | Measure click to deep-link redirection delay; assert responsive transition |

**Total P3:** 4 tests, ~2–4 hours

---

## Execution Strategy

**Philosophy:** Run all automated functional unit and E2E tests inside PR checks to prevent regression early. Playwright parallelization ensures quick execution.

### Every PR

- **Vitest Unit & Component Suite:** Runs all tests under `tests/unit/shortlist/` automatically (~1-2 mins).
- **Playwright E2E Suite:** Executes functional E2E paths (`playwright test --grep "epic-7"`) across mobile and desktop browser environments (~5-8 mins).

### Nightly / Regression

- Full browser automation suite across all locales (`en` and `es`).
- Lighthouse CI accessibility and performance audits on `/shortlist` and `/shortlist/[share_id]` pages.
- Large payload edge-case testing (e.g. simulating 20 properties in WhatsApp link generation, slow networks).

### Before Story Ships (Story-Level Gates)

- **Before 7.1 ships:** R-004 (hydration mismatch E2E check), `localStorage` persistence, limit of 20 items.
- **Before 7.2 ships:** Remove items from comparison grid, empty states, mini-map coordination.
- **Before 7.3 ships:** R-001 (Share ID Nanoid high-entropy), E2E shared page read-only state, link copy clipboard logic.
- **Before 7.4 ships:** R-002 (WhatsApp link character length truncation check), R-003 (leads database schema arrays), R-005 (modal dynamic loading verification), smart routing calculations.

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 13 | 2.0 | ~22–40 | Complex state, localStorage E2E, NanoID verification |
| P1 | 16 | 1.0 | ~16–30 | Component rendering, clipboard actions, modals |
| P2 | 12 | 0.5 | ~8–16 | Locale tests, layout adjustments, admin logs |
| P3 | 4 | 0.25 | ~2–4 | Lighthouse, execution latency benchmarks |
| **Total** | **45** | **-** | **~48–90** | **~1.5–2 weeks** |

### Prerequisites

**Test Data:**
- `agentFactory` — seeds agents with offices, languages (EN/ES/both), active flags.
- `propertyFactory` — seeds properties with unique agent associations, visible flags, coordinates.
- `shortlistShareFactory` — seeds pre-configured shared lists (including expired records).

**Tooling:**
- Vitest and React Testing Library for fast, decoupled unit/component validations.
- Playwright with viewport configurations for mobile ($150 Android 360px) and desktop (1280px).
- Drizzle ORM client inside testing setups for database direct validation.

**Environment:**
- Test DB populated with active and inactive property fixtures.
- Local storage simulator configured for mock headless test runs.
- Mapbox access tokens mocked for static E2E executions to avoid rate-limiting.

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate:** 100% (mandatory).
- **P1 pass rate:** ≥ 95% (minor non-blocking issues may receive triaged waivers).
- **P2/P3 pass rate:** ≥ 90% (informational)
- **High-priority mitigations:** 100% verified and passing before merging stories.

### Coverage Targets

- **Core Routing Calculations:** 100% coverage via unit tests.
- **LocalStorage State Syncing:** ≥ 90% coverage.
- **Lead Capture & PII validations:** 100% verification of encryption and arrays.

### Non-Negotiable Requirements

- [ ] All P0 tests pass.
- [ ] No unmitigated high-priority (≥ 6) risks.
- [ ] R-001: Verified that shortlist share URLs use Nanoid (non-incremental).
- [ ] R-002: WhatsApp deep-link generation passes with 20 property references without browser error.
- [ ] R-003: Database lead record correctly saves the `shortlist_property_ids` as a native PostgreSQL array.

---

## Mitigation Plans

### R-001: Shortlist Share ID Enumeration (Score: 6)

- **Mitigation Strategy:** 
  1. Build a helper generator using `nanoid` (12 characters, safe alphabet).
  2. Implement an integration test generating 100 share links; verify zero duplicate collisions and non-sequential nature.
  3. Validate `/api/shortlist` only responds with the Nanoid, never exposing the internal db integer index.
- **Owner:** Dev
- **Timeline:** Before Story 7.3 ships
- **Status:** Planned
- **Verification:** Execute NanoID entropy tests and API endpoint payload inspections.

### R-002: WhatsApp Deep-Link Truncation (Score: 6)

- **Mitigation Strategy:** 
  1. Implement a character counter inside the WhatsApp deep-link generator.
  2. If the string length exceeds 1800 characters (max safe URL length for some systems), switch from listing all property descriptions to a simplified string: *"Hello, I am interested in these properties from my shortlist: [Shortlist URL]"*.
  3. Unit test the generator with 1, 5, 10, and 20 property combinations.
- **Owner:** Dev
- **Timeline:** Before Story 7.4 ships
- **Status:** Planned
- **Verification:** Test deep-link clicks with the maximum 20-listing mock array; assert URL complies with length limits.

### R-003: Shortlist Lead Database Drop (Score: 6)

- **Mitigation Strategy:** 
  1. Leverage Drizzle's strict schema compiler to enforce `shortlist_property_ids` as a native text array (`text("shortlist_property_ids").array()`).
  2. Write an API validation test asserting a 400 Bad Request if the payload contains non-array property inputs.
  3. Implement automated Sentry error logging on endpoint db failures.
- **Owner:** Dev
- **Timeline:** Before Story 7.4 ships
- **Status:** Planned
- **Verification:** Integration tests verifying mock SQL insert failures propagate to Sentry and return correct 500 codes.

---

## Assumptions and Dependencies

### Assumptions

1. The platform database uses a PostgreSQL environment supporting native array types (`text[]`) via Drizzle.
2. The user's browser supports standard `localStorage` capabilities; browser configurations that block storage fall back to in-memory shortlist caching.
3. Agents are fluent in either English, Spanish, or both, enabling predictable sorting behavior.
4. Shared shortlists are read-only and do not allow the viewer to mutate the original creator's database share record.

### Dependencies

1. **`shortlist_shares` DB Migration:** The schema changes to support shared shortlists must be deployed before Story 7.3 starts.
2. **Playwright unskipping:** The `epic-7` test suite tags must be unskipped in the Playwright CI action prior to merge validations.
3. **Agent dataset population:** Correct agent metadata (languages spoken, active status, office coordinates) must be seeded.

### Risks to Plan

- **Risk:** Mapbox Static Map API limits or key issues in CI build pipelines.
  - **Impact:** E2E visual/mini-map tests fail.
  - **Contingency:** Intercept Mapbox Static image requests via Playwright mock routing; verify only the request URL structure rather than fetching live pixels from Mapbox servers in automated runs.

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|-------------------|--------|------------------|
| **`PropertyCard` (Epic 3/4)** | Reused within the shortlist grid. Changes to PropertyCard attributes may break the comparison page structure. | Verify `PropertyCard` E2E tests pass; assert `data-testid="property-card"` renders correctly in the shortlist grid. |
| **`AgentCard` (Epic 4)** | Reused inside the Selection Modal. Prop updates on `AgentCard` could break the modal selection views. | Run existing `AgentCard` component tests; verify display within the dynamic selection viewport. |
| **Lead Submission Route (`POST /api/leads`)** | Epic 7 extends this endpoint to capture shortlist property IDs and custom routing parameters. Existing buyer/seller lead forms must continue to submit perfectly. | Run Epic 5 seller lead E2E tests; assert that traditional lead creations without shortlist parameters are unaffected. |
| **ISR / On-Demand Revalidation (Epic 2)** | Listing visibility checks inside the shortlist page require fresh DB states. | Verify that marking a listing `is_visible = false` immediately propagates to the shortlist filtered payload via ISR revalidation. |

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection
- `test-priorities-matrix.md` — P0–P3 prioritization

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md` (FR22–FR28, NFR21, NFR22)
- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 7, Stories 7.1–7.4)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (§8 state management / localStorage, §10 lead security/validation)
- Prior Test Design: `_bmad-output/test-artifacts/test-design-epic-6.md` (carry-over visual patterns)

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
