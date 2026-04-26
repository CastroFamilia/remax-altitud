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
  - '_bmad-output/implementation-artifacts/sprint-status.yaml'
  - '_bmad/tea/config.yaml'
  - 'skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - 'skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
epicScope:
  completed: []
  inScope: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8']
---

# Test Design: Epic 3 — Property Discovery & Search

**Date:** 2026-04-25
**Author:** Sebicas (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 3 — Property Discovery & Search

---

## Executive Summary

**Scope:** Epic-level test design for Stories 3.1–3.8 of Epic 3. All 8 stories are in `backlog` status. Story 3.1 (Search Page Layout & Split-View) is the first to be developed.

Epic 3 is the core product experience: an interactive map + property grid search system. It introduces Mapbox GL JS, URL-state-driven filters, Zustand for map state, mobile pull-up sheet gestures, unit conversion logic, and geolocation-based discovery. This is a UI-heavy epic with significant client-side complexity, a new third-party map SDK (Mapbox GL), and PostGIS query performance requirements.

**Risk Summary:**

- Total risks identified: 14
- High-priority risks (score ≥ 6): 8
- Critical categories: TECH, PERF, BUS

**Coverage Summary:**

- P0 scenarios: 12 (~20–35 hours)
- P1 scenarios: 22 (~25–40 hours)
- P2 scenarios: 18 (~10–20 hours)
- P3 scenarios: 8 (~3–8 hours)
- **Total effort:** ~58–103 hours (~1.5–3 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|-----------|
| **Mapbox tile rendering correctness** | Third-party responsibility; not testable in CI | Smoke test that map container mounts and initializes without JS errors |
| **EUR conversion rate accuracy** | Exchange rate is approximate by design (FR10) | Unit test the conversion formula; accept rate drift as non-blocking |
| **WhatsApp message delivery** | External platform; cannot be verified in automated tests | Verify the generated URL/intent string is correctly formatted |
| **DeepL translation quality** | Epic 2 concern; translations are pre-stored in DB for Epic 3 | Verify translated strings are served when locale is set; not translated live |
| **Geolocation hardware accuracy** | Browser/device concern | Mock the Geolocation API in tests; verify application logic handles both grant and deny |

---

## Risk Assessment

> Note: P (Probability) × I (Impact) = Score. Scores ≥ 6 require mitigation before story ships.

### High-Priority Risks (Score ≥ 6)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|-------|----------|-------------|---|---|-------|------------|-------|----------|
| R-001 | 3.2 | TECH | Mapbox GL JS not lazy-loaded as separate async chunk (AR25) — bundle bloat degrades LCP on mobile | 2 | 3 | 6 | E2E test verifies Mapbox is NOT in main JS bundle; use `next build` bundle analysis | Dev | Before 3.2 ships |
| R-002 | 3.2 | PERF | Map + pins fail to render within 3s on 4G mobile (NFR4) — tile load latency + clustering overhead | 2 | 3 | 6 | Performance test with throttled network; assert map `load` event fires within 3s on 4G profile | QA | Before 3.2 ships |
| R-003 | 3.3 | TECH | URL params deserialized without validation — malformed or injected values cause JS error or unexpected DB query | 2 | 3 | 6 | Unit test URL param parser with fuzz inputs; E2E test that navigating to bad params shows graceful error state | Dev | Before 3.3 ships |
| R-004 | 3.3 | PERF | Filter changes exceed 500ms client-side response (NFR5) — debounce tuning + PostGIS query latency | 2 | 3 | 6 | Integration test Server Action response time with populated DB; assert P95 < 500ms | QA | Before 3.3 ships |
| R-005 | 3.5 | PERF | PropertyCard images cause CLS — aspect-ratio: 3/2 not enforced, layout shifts on slow networks (NFR2) | 2 | 3 | 6 | Playwright CLS assertion on search page; check `aspect-ratio` CSS is applied via component test | QA | Before 3.5 ships |
| R-006 | 3.6 | TECH | Pull-up sheet drag conflicts with iOS Safari native scroll/overscroll-behavior — sheet becomes unresponsive | 3 | 2 | 6 | E2E test on mobile viewport with pointer events simulating drag; assert snap behavior; test `overscroll-behavior: none` is applied | QA | Before 3.6 ships |
| R-007 | 3.8 | BUS | Geolocation "Near Me" — `PermissionDeniedError` not handled → JS error or blank map with no user feedback | 2 | 3 | 6 | E2E test mocking `navigator.geolocation` to reject; assert map falls back to nearest RE/MAX office with friendly message | Dev/QA | Before 3.8 ships |
| R-008 | 3.1 | TECH | React hydration error at Server/Client Component boundary — interactive elements fail silently after initial render | 2 | 3 | 6 | E2E test that toggles (Full Map, Full Grid) respond after hydration; assert no `console.error` hydration warnings | Dev | Before 3.1 ships |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner |
|---------|-------|----------|-------------|---|---|-------|------------|-------|
| R-009 | 3.1 | TECH | Split-view layout breaks at boundary viewports (768px, 1023px) — CSS regression | 2 | 2 | 4 | Component test at exact breakpoints; Playwright viewport resize test | Dev |
| R-010 | 3.3 | DATA | Price slider sends malformed min/max values to Server Action — unexpected or broken DB query | 2 | 2 | 4 | Unit test input validation in Server Action; assert safe defaults and error shape | Dev |
| R-011 | 3.7 | BUS | localStorage unit preference not initialized on first render — FOUC (flash of unconverted units) | 2 | 2 | 4 | Component test asserting SSR-safe default; E2E test that preference persists across reload | Dev |
| R-012 | 3.2 | DATA | Map bounds ↔ grid sync stale — panning map does not update grid, or grid shows out-of-viewport results | 2 | 2 | 4 | E2E test: pan map, assert grid updates to show only visible-bounds properties | QA |
| R-013 | 3.4 | BUS | Lifestyle tag OR-logic not implemented — multiple tags produce AND query, returning empty results | 2 | 2 | 4 | Unit test filter query builder; E2E test selecting two lifestyle tags and verifying union result set | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Story | Category | Description | P | I | Score | Action |
|---------|-------|----------|-------------|---|---|-------|--------|
| R-014 | 3.7 | BUS | Unit conversion math incorrect (ft²/m², acres/ha) — property specs wrong for some locales | 1 | 3 | 3 | Unit test conversion formulas with known values |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Entry Criteria

- [ ] Epic 2 data pipeline fully operational (properties available in DB with valid lat/lon, translations, lifestyle tags)
- [ ] Mapbox GL JS token configured in environment (dev + staging)
- [ ] PostGIS extension enabled and spatial indexes in place (from Epic 2)
- [ ] Search page route (`/[locale]/search`) scaffolded and deployable
- [ ] Vitest available; Playwright framework established (or setup completed via `*framework` workflow)
- [ ] Test data: ≥50 seeded properties with varied types, price ranges, locations, and lifestyle tags

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing (≥95%)
- [ ] No open high-severity bugs against P0 scenarios
- [ ] All 8 risks scored ≥ 6 have verified mitigations in place
- [ ] Core UX flow (search → filter → map → card → detail link) validated E2E

---

## Test Coverage Plan

> P0/P1/P2/P3 = **priority and risk level**, NOT execution timing. Execution scheduling is handled in the Execution Strategy section.

### P0 (Critical)

**Criteria:** Blocks core user journey + High risk (score ≥ 6) + No workaround

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 3.1-E2E-001 | 3.1 | Desktop split-view renders: 60% map / 40% grid at ≥1024px | E2E | R-008 | Assert both panels visible; no hydration errors in console |
| 3.1-E2E-002 | 3.1 | "Full Map" toggle hides grid, expands map to 100% | E2E | R-008 | Assert grid hidden, map fills viewport |
| 3.1-E2E-003 | 3.1 | "Full Grid" toggle hides map, expands grid to 100% | E2E | R-008 | Assert map hidden, grid fills viewport |
| 3.2-E2E-001 | 3.2 | Map initializes with 3D terrain and pins within 3s on throttled 4G | E2E | R-001, R-002 | Use Playwright throttle; assert map `load` event ≤ 3s |
| 3.2-E2E-002 | 3.2 | Property pins cluster when zoomed out; expand on zoom in | E2E | R-002 | Simulate zoom out/in; assert cluster markers appear and dissolve |
| 3.2-E2E-003 | 3.2 | Panning map updates grid to show only in-bounds properties | E2E | R-012 | Pan map; assert grid count matches viewport bounds |
| 3.3-E2E-001 | 3.3 | Filter by property type updates results instantly (checkbox/dropdown) | E2E | R-004 | Select filter; assert results update within 500ms |
| 3.3-UNIT-001 | 3.3 | URL param parser rejects malformed/injected values with safe defaults | Unit | R-003 | Fuzz inputs: negative prices, XSS strings, out-of-range values |
| 3.3-E2E-002 | 3.3 | Active filters serialize to URL; page reload restores same results | E2E | R-003 | Apply filters; copy URL; reload; assert same filtered state |
| 3.5-E2E-001 | 3.5 | PropertyCard images have no CLS (aspect-ratio: 3/2 enforced) | E2E | R-005 | Playwright CLS measurement on search page with slow images |
| 3.8-E2E-001 | 3.8 | "Near Me" with geolocation denied falls back to RE/MAX office + friendly message | E2E | R-007 | Mock `navigator.geolocation` to deny; assert fallback behavior |
| 3.8-E2E-002 | 3.8 | Zero-results state shows suggestions + WhatsApp CTA with correct URL | E2E | R-007 | Apply filters returning 0 results; assert empty state content |

**Total P0:** 12 scenarios (~20–35 hours)

---

### P1 (High)

**Criteria:** Important feature path + Medium risk (score 3–5) + Common workflow

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 3.1-E2E-004 | 3.1 | Tablet viewport (768–1023px) shows split-view with side-panel toggle | E2E | R-009 | Assert 60/40 split and toggle button present |
| 3.1-E2E-005 | 3.1 | Mobile viewport (<768px) shows full-screen map with pull-up sheet handle | E2E | R-009 | Assert map is 100% width; pull-up handle visible |
| 3.1-E2E-006 | 3.1 | Filter bar remains sticky when scrolling results grid | E2E | — | Scroll grid; assert filter bar stays fixed |
| 3.2-E2E-004 | 3.2 | Clicking a property pin shows preview card with photo, price, ZMT badge, CTA | E2E | R-012 | Click pin; assert popup content |
| 3.2-UNIT-001 | 3.2 | Mapbox chunk is NOT included in main JS bundle (lazy-loaded per AR25) | Unit/Build | R-001 | Assert bundle analysis; `mapbox` absent from main chunk |
| 3.3-E2E-003 | 3.3 | Price slider debounces 300ms before firing search | E2E | R-004 | Drag slider rapidly; assert requests fire only after 300ms idle |
| 3.3-E2E-004 | 3.3 | "Land/Lot" property type hides bedrooms/bathrooms filters | E2E | — | Select Land/Lot; assert bed/bath filters not rendered |
| 3.3-E2E-005 | 3.3 | Active filter chips show with dismiss × button; "Clear all" at 2+ | E2E | — | Apply 2 filters; assert chips and Clear all button |
| 3.3-E2E-006 | 3.3 | Location hierarchy drills: Province → Cantón → Distrito | E2E | — | Select province; assert cantones populate; select cantón; assert distritos |
| 3.3-UNIT-002 | 3.3 | Price slider Server Action input validation returns safe error on bad values | Unit | R-010 | Send negative/null/overflow values; assert error shape |
| 3.4-E2E-001 | 3.4 | Lifestyle tag chips toggle on/off; active state highlighted (--color-blue-bright) | E2E | R-013 | Click chip; assert active CSS class |
| 3.4-E2E-002 | 3.4 | Two lifestyle tags selected → results show union (OR logic) | E2E | R-013 | Select 2 tags; assert combined result set |
| 3.4-UNIT-001 | 3.4 | Lifestyle tag filter query builder uses OR logic | Unit | R-013 | Assert SQL/query has OR operator for multiple tags |
| 3.4-E2E-003 | 3.4 | Smart preset (e.g., "Mountain Retirement Homes") applies correct URL params | E2E | — | Click preset; assert URL params match config |
| 3.5-E2E-002 | 3.5 | Desktop grid renders 3-column layout (≥1024px) | E2E | — | Assert grid has 3 columns at 1280px viewport |
| 3.5-E2E-003 | 3.5 | Sort dropdown reorders results and persists sort in URL | E2E | — | Change sort; assert order changes; check URL param |
| 3.5-E2E-004 | 3.5 | Pagination/progressive load shows ≤20 cards per page | E2E | — | Count cards; trigger next page; assert ≤20 new cards |
| 3.6-E2E-001 | 3.6 | Pull-up sheet peeked state shows handle + property count | E2E | R-006 | Assert handle visible and count label |
| 3.6-E2E-002 | 3.6 | Pull-up sheet drags to half (50vh) and full (85vh) snap points | E2E | R-006 | Simulate drag gestures; assert snap positions |
| 3.7-E2E-001 | 3.7 | US locale shows ft² / acres by default | E2E | R-011 | Set locale to en-US; assert units |
| 3.7-E2E-002 | 3.7 | EU locale shows m² / hectares by default | E2E | R-011 | Set locale to de-DE; assert units |
| 3.7-E2E-003 | 3.7 | Unit toggle switches between m²/ft² and persists in localStorage | E2E | R-011 | Toggle; reload; assert preference preserved |

**Total P1:** 22 scenarios (~25–40 hours)

---

### P2 (Medium)

**Criteria:** Secondary feature + Low risk (score 1–3) + Edge cases

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 3.1-COMP-001 | 3.1 | Split-view container renders at exact 768px breakpoint (no layout break) | Component | R-009 | Viewport resize test |
| 3.1-COMP-002 | 3.1 | Split-view container renders at exact 1023px breakpoint | Component | R-009 | Viewport resize test |
| 3.2-E2E-005 | 3.2 | Map state (center, zoom) is managed via Zustand (AR10) — survives view toggle | E2E | — | Toggle Full Map/Grid; assert map position unchanged |
| 3.3-UNIT-003 | 3.3 | Filter count display: each option shows matching result count (e.g., "Casa (12)") | Unit | — | Mock result counts; assert count labels |
| 3.4-E2E-004 | 3.4 | Active lifestyle tags appear as chips in active filter display | E2E | — | Select lifestyle tag; assert chip rendered |
| 3.4-UNIT-002 | 3.4 | Smart presets are configurable without code changes (JSON/DB driven) | Unit | — | Assert preset config is loaded from external source, not hardcoded |
| 3.5-COMP-001 | 3.5 | PropertyCard renders all required fields: image, price, title, specs, ZMT badge | Component | — | Mount card with mock data; assert all fields present |
| 3.5-COMP-002 | 3.5 | PropertyCard hover triggers 200ms lift animation (shadow-lg) | Component | — | Hover simulation; assert CSS transition applied |
| 3.5-COMP-003 | 3.5 | PropertyCard images use `next/image` with `sizes` and WebP format | Component | — | Assert img element has correct attributes |
| 3.5-E2E-005 | 3.5 | Tablet grid renders 2-column layout (768–1023px) | E2E | — | Assert 2 columns at 800px viewport |
| 3.5-E2E-006 | 3.5 | Mobile grid renders single-column full-width layout (<768px) | E2E | — | Assert 1 column at 375px viewport |
| 3.6-E2E-003 | 3.6 | Pull-up sheet has `role="region"`, `aria-label="Property list"`, `aria-expanded` | E2E | — | Assert ARIA attributes |
| 3.6-E2E-004 | 3.6 | Pull-to-refresh is disabled on search page (overscroll-behavior: none) | E2E | — | Attempt pull-to-refresh gesture; assert no refresh |
| 3.6-E2E-005 | 3.6 | Sheet animates to nearest snap point with spring physics on release between points | E2E | R-006 | Release mid-drag; assert snap animation |
| 3.7-UNIT-001 | 3.7 | ft² ↔ m² conversion formula correct (1 ft² = 0.0929 m²) | Unit | R-014 | Assert with known values |
| 3.7-UNIT-002 | 3.7 | acres ↔ hectares conversion correct (1 acre = 0.4047 ha) | Unit | R-014 | Assert with known values |
| 3.7-E2E-004 | 3.7 | Price shows USD primary + approximate EUR for non-US locale | E2E | — | Set EU locale; assert dual price display |
| 3.8-E2E-003 | 3.8 | Hidden listing URL shows "no longer available" page with similar properties | E2E | — | Navigate to removed listing; assert 410/redirect and content |

**Total P2:** 18 scenarios (~10–20 hours)

---

### P3 (Low)

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Test ID | Story | Requirement / AC | Test Level | Notes |
|---------|-------|-----------------|------------|-------|
| 3.3-E2E-007 | 3.3 | Filter count updates reflect real-time after filter change | E2E | Exploratory: verify counts stay in sync |
| 3.7-E2E-005 | 3.7 | ZMT badge shows correct label for Titled/Concession/ZMT Restricted (not color-only) | E2E | Accessibility check: icon + label present |
| 3.7-UNIT-003 | 3.7 | Price formatting respects locale (comma vs period separators) | Unit | Edge case: 1,234,567 vs 1.234.567 |
| 3.8-E2E-004 | 3.8 | "Near Me" with geolocation granted flies map to user coordinates with radius overlay | E2E | Mock geolocation to grant; assert map center and radius |
| 3.8-E2E-005 | 3.8 | WhatsApp CTA in no-results state forwards search criteria in message | E2E | Assert WhatsApp URL encodes filter params |
| 3.2-PERF-001 | 3.2 | Map + pins render within 3s on simulated 4G (LH/Playwright perf profile) | Perf | Nightly benchmark; informational |
| 3.3-PERF-001 | 3.3 | Filter Server Action P95 response time < 500ms with 1000-property dataset | Perf | Nightly benchmark; informational |
| 3.5-PERF-001 | 3.5 | CLS score < 0.1 on search page load (Lighthouse) | Perf | Weekly benchmark; informational |

**Total P3:** 8 scenarios (~3–8 hours)

---

## Execution Strategy

**Philosophy:** Run all Playwright tests on every PR (<15 min with parallelization). Defer only expensive performance benchmarks to nightly/weekly.

### Every PR

- All P0 + P1 + P2 Playwright E2E, component, and unit tests
- Vitest unit tests (already in CI from Epic 2)
- Expected duration: ~10–15 minutes

### Nightly

- P3 performance benchmarks (3.2-PERF-001, 3.3-PERF-001) — requires populated staging DB
- Pull-up sheet drag gesture tests on real mobile viewport profiles (if flaky in PR)

### Weekly

- 3.5-PERF-001 Lighthouse CLS audit
- Full regression across all viewports (375px, 768px, 1024px, 1280px, 1920px)

---

## Resource Estimates

| Priority | Count | Effort Range | Notes |
|----------|-------|-------------|-------|
| P0 | 12 | ~20–35 hours | E2E setup, mock geolocation, Mapbox stub |
| P1 | 22 | ~25–40 hours | Drag gestures, localStorage, bundle analysis |
| P2 | 18 | ~10–20 hours | Component tests, unit conversions, ARIA checks |
| P3 | 8 | ~3–8 hours | Perf benchmarks, exploratory |
| **Total** | **60** | **~58–103 hours** | **~1.5–3 weeks** |

### Prerequisites

**Test Data:**

- Property factory: ≥50 properties with varied types, prices, lat/lon, lifestyle tags, ZMT status
- Locale fixtures: `en-US` and `de-DE` browser contexts
- Geolocation mock: Grant + deny scenarios

**Tooling:**

- Playwright for E2E and component tests (install via `*framework` workflow if not done)
- Vitest for unit tests (already configured)
- Playwright `--throttling` for 4G mobile perf simulation
- `@playwright/test` `page.evaluate` for mocking `navigator.geolocation`

**Environment:**

- Staging DB with ≥50 seeded properties and valid PostGIS spatial data
- Mapbox token available in staging env
- `overscroll-behavior: none` must be set on search page before 3.6 tests run

---

## Quality Gate Criteria

- **P0 pass rate:** 100% (no exceptions)
- **P1 pass rate:** ≥95% (failures require triage before merge)
- **P2/P3 pass rate:** ≥90% (informational; do not block merge)
- **High-risk mitigations (R-001 through R-008):** 100% complete or formally waived before story ships
- **Coverage target:** ≥80% of acceptance criteria across all 8 stories

---

## Mitigation Plans

### R-001: Mapbox bundle not lazy-loaded (Score: 6)

**Mitigation Strategy:**
1. Verify `next/dynamic` with `{ ssr: false }` wraps the `react-map-gl` import
2. Run `next build --analyze` and assert `mapbox` is absent from the main JS chunk
3. Add build-time bundle size assertion to CI

**Owner:** Dev  
**Timeline:** Before Story 3.2 ships  
**Status:** Planned  
**Verification:** Bundle analysis output shows Mapbox in separate async chunk

---

### R-002: Map + pins do not render within 3s on 4G mobile (Score: 6)

**Mitigation Strategy:**
1. Playwright test with `page.emulateNetworkConditions('4G')` or equivalent throttle
2. Assert Mapbox `load` event fires within 3000ms
3. Pre-load property pin GeoJSON via Server Component to minimize client fetch

**Owner:** QA  
**Timeline:** Before Story 3.2 ships  
**Status:** Planned  
**Verification:** Test passes consistently in CI with throttled network

---

### R-003: URL params not validated — malformed values cause errors (Score: 6)

**Mitigation Strategy:**
1. Implement a `parseSearchParams` utility with Zod schema validation
2. Unit test with fuzz inputs (negative prices, SQL fragments, XSS strings)
3. E2E test navigating to `/search?price_min=-1&beds=abc` asserts graceful fallback state

**Owner:** Dev  
**Timeline:** Before Story 3.3 ships  
**Status:** Planned  
**Verification:** Unit tests pass; E2E shows no errors on bad URL

---

### R-004: Filter response time exceeds 500ms (Score: 6)

**Mitigation Strategy:**
1. Add PostGIS spatial indexes for property search queries (verify from Epic 2 schema)
2. Measure Server Action response time with timing assertion in integration test
3. Tune debounce to 300ms for sliders per AC; dropdowns update immediately

**Owner:** QA + Dev  
**Timeline:** Before Story 3.3 ships  
**Status:** Planned  
**Verification:** P1 integration test asserts P95 Server Action < 500ms

---

### R-005: PropertyCard images cause CLS (Score: 6)

**Mitigation Strategy:**
1. Enforce `aspect-ratio: 3/2` on image container in component definition
2. Playwright `page.evaluate` to measure CLS via LayoutShift API
3. Assert CLS < 0.1 during card render with simulated slow images

**Owner:** QA + Dev  
**Timeline:** Before Story 3.5 ships  
**Status:** Planned  
**Verification:** CLS assertion test passes on simulated slow-image load

---

### R-006: Pull-up sheet drag conflicts with iOS Safari scroll (Score: 6)

**Mitigation Strategy:**
1. Apply `touch-action: pan-y` and `overscroll-behavior: none` on the sheet container
2. Playwright pointer event simulation for drag-to-snap gestures
3. Test on mobile viewport (375×812); assert snap positions and no native pull-to-refresh

**Owner:** Dev + QA  
**Timeline:** Before Story 3.6 ships  
**Status:** Planned  
**Verification:** Drag gesture E2E tests pass on mobile viewport without flakiness

---

### R-007: Geolocation PermissionDeniedError not handled (Score: 6)

**Mitigation Strategy:**
1. Wrap `navigator.geolocation.getCurrentPosition` in try/catch with explicit error type check
2. E2E test: mock geolocation to call `errorCallback` with `PERMISSION_DENIED` code
3. Assert map centers on RE/MAX office coordinates + toast/message visible

**Owner:** Dev  
**Timeline:** Before Story 3.8 ships  
**Status:** Planned  
**Verification:** E2E test 3.8-E2E-001 passes

---

### R-008: React hydration error at Server/Client Component boundary (Score: 6)

**Mitigation Strategy:**
1. Ensure all interactive components (toggles, filter bar) are `'use client'` and receive no dynamic server-only data in initial props
2. E2E test: load search page, click Full Map toggle, assert response (no `console.error` with "Hydration")
3. Review Server/Client boundary diagram in architecture before Story 3.1 implementation

**Owner:** Dev  
**Timeline:** Before Story 3.1 ships  
**Status:** Planned  
**Verification:** No hydration errors in E2E run; toggles respond after first render

---

## Assumptions and Dependencies

### Assumptions

1. PostGIS spatial indexes from Epic 2 are in place and performant for up to 5,000 properties.
2. Mapbox GL JS v3.x API is stable; no breaking changes expected during Epic 3.
3. `overscroll-behavior: none` is sufficient to disable pull-to-refresh on all mobile browsers in scope.
4. Playwright can simulate pointer drag events reliably enough to test pull-up sheet snapping in CI.
5. The EUR conversion rate is fetched once at build time (or approximate static rate) — not a live rate.

### Dependencies

1. Epic 2 data pipeline must be fully operational with ≥50 seeded properties — required before any E2E test can run.
2. Mapbox API token must be provisioned for staging environment — required before Story 3.2.
3. Playwright must be installed and configured in the project — run `*framework` workflow if not done.

### Risks to Plan

- **Risk:** Playwright cannot reliably simulate Mapbox map interactions (canvas-based rendering)
  - **Impact:** Pin click and clustering tests may be flaky
  - **Contingency:** Mock Mapbox at the module boundary; test the React layer independently; use snapshots for visual regression

- **Risk:** PostGIS query performance degrades with realistic data volume
  - **Impact:** R-004 filter response tests fail in CI
  - **Contingency:** Add EXPLAIN ANALYZE to queries in dev; escalate index strategy to Epic 2 database owner

---

## Interworking & Regression

| Component/Service | Impact on Epic 3 | Regression Scope |
|------------------|-----------------|-----------------|
| **Epic 2 sync pipeline** | Property data source for all search results | All unit tests for DB schema (tests/unit/db/) must continue to pass |
| **Epic 1 design system** | PropertyCard, filter chips, layout tokens | Existing design system component tests must pass |
| **Epic 1 i18n (Story 1.4)** | Locale context for unit display + price formatting | Locale switch tests from Story 1.4 must not regress |
| **Mapbox GL JS** | Map rendering, pins, clustering | Smoke test: map container mounts without JS errors |

---

## Follow-on Workflows

- Run `*atdd` to generate failing P0 tests for Story 3.1 (separate workflow; not auto-run).
- Run `*framework` if Playwright is not yet configured in the project.
- Run `*automate` for broader coverage once implementation exists.

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification and gate decision framework
- `probability-impact.md` — Risk scoring methodology (P × I matrix)
- `test-levels-framework.md` — Test level selection (Unit / Integration / Component / E2E)
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- Epic: `_bmad-output/planning-artifacts/epics.md` (lines 1060–1371)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`

---

**Generated by:** BMad TEA Agent — Test Architect Module  
**Workflow:** `bmad-testarch-test-design`  
**Version:** 4.0 (BMad v6)
