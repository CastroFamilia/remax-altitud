---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-25'
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
  - '_bmad-output/test-artifacts/test-design-epic-5.md'
epicScope:
  inScope: ['6.1', '6.2', '6.3', '6.4', '6.5']
---

# Test Design: Epic 6 — Community Pages & Area Guides

**Date:** 2026-05-25
**Author:** Sebicas (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 6 — Community Pages & Area Guides

---

## Executive Summary

**Scope:** Epic-level test design for Stories 6.1–6.5 of Epic 6. All stories are in backlog; this document governs the full epic test strategy before the first story begins.

Epic 6 is the **content discovery and community showcase layer** of the platform. It introduces area guide pages with lifestyle narratives, community landing pages with hero imagery, quick facts, and filtered property listings, community mini-maps with geo-fence overlays, investment context (appreciation trends, rental yield), and the PostGIS geo-fence auto-tagging pipeline step that automatically assigns properties to communities based on their geographic coordinates.

This epic is the primary **SEO content engine** — area guides and community pages are SSG-rendered, keyword-targeted pages designed to rank for queries like "Pérez Zeledón real estate" and "RISE development Costa Rica." Every community page is a landing page that converts organic traffic into property discovery and lead generation. A broken community page or a geo-fence that fails to tag properties means an entire development's listings are invisible to visitors browsing by community.

The geo-fence auto-tagging pipeline (Story 6.5) is the most technically complex component: it extends the daily sync pipeline (Epic 2, Step 6) with PostGIS `ST_Within` spatial queries, must handle admin manual overrides without clobbering them, and must correctly re-tag properties when coordinates change. A silent failure here means community pages show stale or missing listings indefinitely.

**Risk Summary:**

- Total risks identified: 13
- High-priority risks (score ≥ 6): 5
- Critical categories: DATA, BUS, SEO, PERF

**Coverage Summary:**

- P0 scenarios: 14 (~24–42 hours)
- P1 scenarios: 18 (~20–36 hours)
- P2 scenarios: 14 (~10–20 hours)
- P3 scenarios: 5 (~3–6 hours)
- **Total effort:** ~57–104 hours (~1.5–2.5 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| **Mapbox tile rendering quality** | Third-party CDN; aesthetic quality is not testable | Test that the mini-map container is rendered with correct coordinates; verify static image `src` URL contains expected lat/lng parameters |
| **Community content authoring workflow** | Admin content creation is an Epic 8 concern | Verify that community pages render correctly from seeded DB data; content authoring UI is out of scope |
| **Admin geo-fence polygon drawing UI** | Epic 8 concern (admin interface) | Test geo-fence matching against pre-seeded polygons in the DB; the admin drawing tool is not part of Epic 6 |
| **Full Mapbox GL interactive map on community pages** | Architecture specifies static map images (not interactive instances) for community mini-maps | Verify static image rendered; verify no Mapbox GL JS bundle loaded on community pages |
| **Investment data sourcing / accuracy** | Admin-curated static content per FR45; data accuracy is a content concern | Test that when investment data exists it renders with disclaimer; when absent, section is hidden |
| **Property detail page rendering** | Epic 4 concern; PropertyCard component tested in Epics 3–4 | Verify PropertyCard renders within community/area filtered grids; card internals already tested |
| **Search filter logic for lifestyle tags** | Core filter logic tested in Epic 3 | Verify that tag filter returns tagged properties; filter mechanics tested in prior epics |
| **DeepL translation quality for community descriptions** | Translation pipeline tested in Epic 2 | Test that bilingual content fields (en/es) render in correct locale; translation accuracy is external |

---

## Epic 5 Infrastructure Carry-Over

Stories 6.1–6.5 build on the test infrastructure established in Epics 3–5. The following apply immediately:

### Test Infrastructure (Already in Place)

- Vitest `environmentMatchGlobs` — `jsdom` applied to `tests/unit/**/*.spec.tsx`. All Epic 6 component tests in `tests/unit/community/` and `tests/unit/area/` will inherit this automatically.
- `@testing-library/react`, `jsdom`, `@testing-library/user-event` installed.
- `vi.mock(...)` hoisting pattern — declare before imports; add comment `// imported AFTER mocks`.
- `data-testid` contracts from Epics 3–5 remain in force; Epic 6 must not break them.
- `PropertyCard` component with established `data-testid="property-card"` contract — reused in filtered grids on area/community pages.
- `AgentCard` component with established `data-testid="agent-card"` contract — reused in area guide "Agents" tab.

### New `data-testid` Contract for Epic 6

| Attribute | Component | Story |
|-----------|-----------|-------|
| `data-testid="area-guide-hero"` | AreaGuidePage | 6.1 |
| `data-testid="area-guide-description"` | AreaGuidePage | 6.1 |
| `data-testid="area-guide-tabs"` | AreaGuidePage | 6.1 |
| `data-testid="area-guide-properties-tab"` | AreaGuidePage | 6.1 |
| `data-testid="area-guide-agents-tab"` | AreaGuidePage | 6.1 |
| `data-testid="area-guide-similar-tab"` | AreaGuidePage | 6.1 |
| `data-testid="area-index-card"` | AreaIndexPage | 6.1 |
| `data-testid="community-hero"` | CommunityPage | 6.2 |
| `data-testid="community-quick-facts"` | CommunityQuickFacts | 6.2 |
| `data-testid="community-description"` | CommunityPage | 6.2 |
| `data-testid="community-properties-tab"` | CommunityPage | 6.2 |
| `data-testid="community-sitemap-tab"` | CommunityPage | 6.2 |
| `data-testid="community-similar-slider"` | SimilarCommunitiesSlider | 6.2 |
| `data-testid="community-card"` | CommunityCard | 6.2 |
| `data-testid="featured-communities"` | HomepageFeaturedCommunities | 6.2 |
| `data-testid="community-index-card"` | CommunityIndexPage | 6.2 |
| `data-testid="community-mini-map"` | CommunityMiniMap | 6.3 |
| `data-testid="geo-fence-overlay"` | CommunityMiniMap | 6.3 |
| `data-testid="investment-context"` | InvestmentContext | 6.4 |
| `data-testid="investment-disclaimer"` | InvestmentContext | 6.4 |
| `data-testid="lot-status-available"` | LotStatusIndicator | 6.2 |
| `data-testid="lot-status-sold"` | LotStatusIndicator | 6.2 |
| `data-testid="lot-status-reserved"` | LotStatusIndicator | 6.2 |

---

## Risk Assessment

> P (Probability) × I (Impact) = Score. Scores ≥ 6 require mitigation before the story ships.

### High-Priority Risks (Score ≥ 6)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|-------|----------|-------------|---|---|-------|------------|-------|----------|
| R-001 | 6.5 | DATA | Geo-fence auto-tagging overwrites admin manual override — sync pipeline's `ST_Within` query resets a manually-assigned `community_id`, causing curated community assignments to be silently reverted each night | 2 | 3 | 6 | Integration test: seed property with manual `community_id` outside its polygon; run geo-tag step; assert `community_id` is NOT overwritten; unit test for override-preservation flag in geo-tagger logic | Dev | Before 6.5 ships |
| R-002 | 6.5 | DATA | Geo-fence matching assigns wrong community — overlapping polygons or incorrect `ST_Within` boundary causes a property to be tagged to the wrong community; community page shows foreign listings | 2 | 3 | 6 | Integration test with two non-overlapping polygons: seed property inside polygon A; run geo-tag; assert `community_id = A`, not B; test property at polygon boundary; test overlapping polygon edge case (first-match wins or area-based tiebreak) | Dev | Before 6.5 ships |
| R-003 | 6.1 | SEO | Area guide description rendered behind a tab (not always-visible) — Googlebot may not index tabbed content; SEO value of the 300-500 word lifestyle narrative is lost; area pages fail to rank for target keywords | 2 | 3 | 6 | E2E test: load area guide page; assert description section is visible in initial DOM (not hidden by tab state); assert description content is present in SSG HTML output (not client-rendered) | Dev/QA | Before 6.1 ships |
| R-004 | 6.2 | BUS | Community page shows zero properties despite geo-fence containing active listings — `community_id` join fails, query filter is wrong, or ISR cache is stale; visitor sees an empty community and bounces | 2 | 3 | 6 | Integration test: seed community with geo-fence + 3 properties tagged to it; load community page; assert property grid shows 3 cards; E2E test: navigate to community page; assert property count matches expected | Dev/QA | Before 6.2 ships |
| R-005 | 6.2 | SEO | Community pages not generating correct SSG + ISR paths — `generateStaticParams()` fails to return all community slugs; community pages return 404 on cold start; SEO indexing fails | 2 | 3 | 6 | Build test: run `next build`; assert all seeded community slugs appear in the generated paths; E2E test: request community URL; assert 200 status (not 404) | Dev | Before 6.2 ships |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner |
|---------|-------|----------|-------------|---|---|-------|------------|-------|
| R-006 | 6.5 | DATA | Property coordinate change during sync does not re-tag community — property moves from community A's polygon to community B's, but `community_id` remains A because geo-tagger only processes `community_id IS NULL` | 2 | 2 | 4 | Integration test: seed property in polygon A with `community_id = A`; update coordinates to polygon B; run geo-tag; assert `community_id` updated to B | Dev |
| R-007 | 6.3 | PERF | Mini-map loads interactive Mapbox GL JS instead of static image — 230KB bundle loaded on every community page, violating architecture spec and performance budget; community page LCP degrades | 2 | 2 | 4 | Build test: assert Mapbox GL JS is NOT in the community page JS bundle; E2E test: verify mini-map renders as `<img>` tag with Mapbox Static API URL, not a `<canvas>` element | Dev |
| R-008 | 6.4 | BUS | Investment context section renders as empty section when no data available — FR45/UX-DR20 requires graceful hiding, but an empty `<section>` with header and no content appears instead | 2 | 2 | 4 | Component test: render InvestmentContext with `null`/`undefined` data; assert component returns `null` (no DOM output); E2E test: load area without investment data; assert no empty section visible | Dev |
| R-009 | 6.2 | BUS | Lot status indicators show wrong state — ✅/❌/🟡 status badges don't match actual property status (available/sold/reserved); buyer sees "Available" for a sold lot | 2 | 2 | 4 | Component test: render lot list with mixed statuses; assert correct status icons and labels for each; integration test: seed properties with different statuses; assert rendered indicators match DB | Dev |
| R-010 | 6.1 | BUS | Area index page missing property count or showing stale counts — denormalized `property_count` on areas table not updated after sync; area card shows "0 properties" when 50 exist | 1 | 3 | 3 | Integration test: seed 10 properties in area; load area index; assert property count ≥ 10 on area card | Dev |
| R-011 | 6.2 | BUS | Gold border not applied to CommunityCard — UX-DR33 requires `--color-gold` border to differentiate community cards from area cards; visual distinction lost | 1 | 2 | 2 | Component test: render CommunityCard; assert border-color CSS property matches `--color-gold` token value | Dev |
| R-012 | 6.2 | BUS | Desktop "Site Map" tab visible on mobile — AC states it should be hidden on mobile, replaced by sortable lot list | 1 | 2 | 2 | E2E test: load community page at 360px viewport; assert site map tab is not visible; assert lot list is visible | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Story | Category | Description | P | I | Score | Action |
|---------|-------|----------|-------------|---|---|-------|--------|
| R-013 | 6.3 | BUS | Mini-map alt text missing or generic — NFR24 accessibility requirement for descriptive alt text on static map images | 1 | 1 | 1 | Component test: render mini-map; assert `alt` attribute contains community name and area name | Dev |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **SEO**: Search Engine Optimization (indexing, ranking, crawlability)
- **OPS**: Operations (deployment, config, monitoring)

---

## Entry Criteria

- [x] Epics 2–4 fully done — all stories merged; `PropertyCard`, `AgentCard`, `SimilarAreasSlider` components available
- [x] Epic 2 data pipeline running — `properties`, `communities`, `areas` tables populated
- [x] PostGIS extension enabled — `ST_Within`, `ST_MakeEnvelope` functions available
- [x] Vitest jsdom environment configured (`tests/unit/**/*.spec.tsx`) — inherited from Epics 3–5
- [x] Test suite passing across Epics 1–5 with 0 regressions
- [ ] `communities` table schema populated with ≥2 seeded communities including `geo_fence` polygons — required before Story 6.5 integration tests
- [ ] `areas` table seeded with ≥3 areas with `property_count` denormalized field populated — required before Story 6.1 tests
- [ ] Community page routes defined (`/{locale}/areas/[slug]/communities/[community]`) — required before E2E tests
- [ ] Area guide routes defined (`/{locale}/areas/[slug]`) — required before E2E tests
- [ ] Mapbox Static API access token configured in environment — required before mini-map rendering tests
- [ ] Playwright framework configured — required before E2E tests run (inherited from prior epic; unskip epic-6 suite)
- [ ] Test data: ≥10 seeded properties with geo-coordinates, ≥3 inside community polygons, ≥2 with lifestyle tags "Investment Property" / "Rental Potential" — required before filtered grid and geo-fence tests

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing (≥ 95%)
- [ ] No open high-severity bugs against P0 scenarios
- [ ] R-001 (manual override preservation): confirmed via integration test that admin-set `community_id` survives sync
- [ ] R-002 (correct community assignment): polygon boundary tests passing
- [ ] R-003 (description visibility): SSG HTML contains description content (not tab-gated)
- [ ] R-004 (community property grid): community page renders correct filtered properties
- [ ] R-005 (SSG path generation): `next build` produces all expected community paths
- [ ] Core discovery flow (`/en/areas/perez-zeledon` → area guide → community card → community page → filtered properties) validated E2E
- [ ] Both EN and ES locales tested on area guide and community pages

---

## Test Coverage Plan

> P0/P1/P2/P3 = **priority and risk level**, NOT execution timing. Execution scheduling is handled in the Execution Strategy section.

### P0 (Critical)

**Criteria:** Blocks core user journey + High risk (score ≥ 6) + No workaround

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 6.5-INT-001 | 6.5 | Geo-fence auto-tagging assigns `community_id` to properties inside polygon via `ST_Within` | Integration | R-002 | Seed community with polygon + property with coordinates inside polygon; run geo-tag step; assert `community_id` set correctly |
| 6.5-INT-002 | 6.5 | Admin manual override preserved — geo-tagger does NOT reset manually-assigned `community_id` | Integration | R-001 | Seed property with manual `community_id` outside its geo-fence; run geo-tag; assert `community_id` unchanged |
| 6.5-INT-003 | 6.5 | Property outside all community polygons has `community_id = null` after geo-tagging | Integration | R-002 | Seed property with coordinates outside all polygons; run geo-tag; assert `community_id` is null |
| 6.5-INT-004 | 6.5 | Property coordinate change triggers re-tagging to new community | Integration | R-006 | Seed property in polygon A with `community_id = A`; update coordinates to polygon B; run geo-tag; assert `community_id = B` |
| 6.5-UNIT-001 | 6.5 | New community creation + next sync auto-populates matching properties | Unit | R-002 | Seed new community polygon containing existing properties; run geo-tag; assert matching properties now tagged |
| 6.1-E2E-001 | 6.1 | Area guide description is always visible (not behind tab) for SEO indexing | E2E | R-003 | Load area guide page; assert `data-testid="area-guide-description"` is visible in viewport without clicking any tab |
| 6.1-E2E-002 | 6.1 | Area guide page SSG renders full description content in initial HTML | E2E | R-003 | Fetch area guide page raw HTML (no JS execution); assert description text present in response body |
| 6.2-E2E-001 | 6.2 | Community page renders filtered property grid with correct property count | E2E | R-004 | Seed 3 properties tagged to community; load community page; assert 3 property cards in grid |
| 6.2-E2E-002 | 6.2 | Community page renders hero, tagline, price range, quick facts, and description | E2E | R-004 | Load community page; assert all sections present: `data-testid="community-hero"`, `data-testid="community-quick-facts"`, `data-testid="community-description"` |
| 6.2-INT-001 | 6.2 | `generateStaticParams()` returns all community slugs for SSG path generation | Integration | R-005 | Seed 3 communities; call `generateStaticParams()`; assert all 3 slug/area combinations returned |
| 6.2-E2E-003 | 6.2 | Community page returns 200 (not 404) on cold cache access | E2E | R-005 | Request seeded community URL; assert HTTP 200 |
| 6.1-E2E-003 | 6.1 | Area guide Properties tab shows property grid filtered to this area | E2E | — | Load area guide; click Properties tab; assert rendered PropertyCards all belong to expected area |
| 6.4-COMP-001 | 6.4 | Investment context section hidden gracefully when no data available | Component | R-008 | Render InvestmentContext with `investmentData = null`; assert component returns null (no DOM output) |
| 6.2-E2E-004 | 6.2 | Featured Communities section on homepage renders 2-3 gold-bordered cards with correct data | E2E | R-005 | Load homepage; assert `data-testid="featured-communities"` contains 2-3 community cards with gold borders |

**Total P0:** 14 scenarios (~24–42 hours)

---

### P1 (High)

**Criteria:** Important feature path + Medium risk (score 3–5) + Common workflow

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 6.1-E2E-004 | 6.1 | Area guide renders hero image with area name as h1 | E2E | — | Assert `h1` contains area name; assert hero image rendered |
| 6.1-E2E-005 | 6.1 | Area guide Agents tab shows AgentCards for agents covering this area | E2E | — | Click Agents tab; assert AgentCards rendered with `data-testid="agent-card"` |
| 6.1-E2E-006 | 6.1 | Area guide Similar Areas section shows SimilarAreasSlider with nearby area cards | E2E | — | Assert `data-testid="area-guide-similar-tab"` or similar section rendered with area cards |
| 6.1-E2E-007 | 6.1 | Area guide shows linked CommunityCards with gold border for communities in this area | E2E | R-011 | Assert CommunityCards within area guide have gold border style |
| 6.1-E2E-008 | 6.1 | Area index page (`/{locale}/areas`) lists all areas with hero cards, region badge, property count, description snippet | E2E | R-010 | Load area index; assert all seeded areas displayed with required fields |
| 6.1-COMP-001 | 6.1 | JSON-LD structured data for Place schema present on area guide page | Component | — | Render area guide; assert `<script type="application/ld+json">` contains Place schema with correct fields |
| 6.2-COMP-001 | 6.2 | Community quick facts icon grid renders all required fields (elevation, airport distance, infrastructure, amenities, developer, year) | Component | — | Render CommunityQuickFacts with full data; assert 6 icon-label pairs rendered |
| 6.2-COMP-002 | 6.2 | Lot status indicators render correct icons and labels: ✅ Available, ❌ Sold, 🟡 Reserved | Component | R-009 | Render lot list with mixed statuses; assert each lot has correct indicator |
| 6.2-E2E-005 | 6.2 | Community description (300-500 words) always visible (not tabbed) for SEO | E2E | — | Load community page; assert description visible in initial render without tab interaction |
| 6.2-E2E-006 | 6.2 | Community index page (`/{locale}/communities`) lists all communities with hero cards | E2E | — | Load community index; assert all seeded communities displayed |
| 6.2-E2E-007 | 6.2 | Desktop: Site Map tab visible and shows zoomable master plan image | E2E | R-012 | Load community page at desktop viewport (1280px); assert site map tab present and image rendered |
| 6.2-E2E-008 | 6.2 | Mobile: Site Map tab hidden; sortable lot list visible instead | E2E | R-012 | Load community page at 360px viewport; assert site map tab not visible; assert lot list visible |
| 6.2-COMP-003 | 6.2 | SimilarCommunitiesSlider renders nearby community cards (always visible, not tabbed) | Component | — | Render slider with 3 community cards; assert all rendered outside tab container |
| 6.3-E2E-001 | 6.3 | Community mini-map renders as static image (not interactive Mapbox GL) | E2E | R-007 | Load community page; assert mini-map is `<img>` tag; assert no Mapbox GL `<canvas>` element |
| 6.3-COMP-001 | 6.3 | Mini-map shows community pin and area boundary from geo-fence polygon | Component | — | Render mini-map with polygon data; assert image URL contains polygon coordinates and pin |
| 6.3-COMP-002 | 6.3 | Mini-map alt text includes community name and area name for accessibility | Component | R-013 | Render mini-map; assert `alt` attribute contains both community and area name |
| 6.4-COMP-002 | 6.4 | Investment context renders appreciation trends and rental yield with mandatory disclaimer | Component | — | Render with investment data; assert `data-testid="investment-context"` and `data-testid="investment-disclaimer"` both present |
| 6.4-E2E-001 | 6.4 | Listing detail page for "Investment Property" tagged listing includes area investment context | E2E | — | Load investment-tagged listing; assert investment context section visible with area data |

**Total P1:** 18 scenarios (~20–36 hours)

---

### P2 (Medium)

**Criteria:** Secondary feature + Low risk (score 1–2) + Edge cases

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 6.1-COMP-002 | 6.1 | Area guide renders climate/altitude data in the hero or metadata section | Component | — | Render area guide with metadata JSONB; assert elevation, climate data displayed |
| 6.1-COMP-003 | 6.1 | Area guide SSG strategy (static generation) — no ISR revalidation configured | Component | — | Assert area guide page config has `revalidate: false` or uses `generateStaticParams()` without ISR |
| 6.1-E2E-009 | 6.1 | Area guide page content displays in ES when locale is Spanish | E2E | — | Load `/es/areas/perez-zeledon`; assert h1, description, tab labels in Spanish |
| 6.2-COMP-004 | 6.2 | CommunityCard renders gold border (`--color-gold`) differentiating from area cards | Component | R-011 | Assert border-color matches design token `--color-gold` |
| 6.2-COMP-005 | 6.2 | Community page SSG + ISR configured with on-demand revalidation after sync | Component | — | Assert community page config has ISR revalidation; assert `revalidateTag('communities')` is called by sync |
| 6.2-E2E-009 | 6.2 | Community page content displays in ES when locale is Spanish | E2E | — | Load community page in ES; assert hero, tagline, description, quick facts labels in Spanish |
| 6.2-E2E-010 | 6.2 | Community page renders price range ("Homes from $X–$Y") from denormalized min/max | E2E | — | Assert price range text matches seeded `price_min_usd` and `price_max_usd` |
| 6.2-COMP-006 | 6.2 | Lot list sortable by status and price on mobile | Component | — | Render lot list; interact with sort controls; assert order changes |
| 6.3-E2E-002 | 6.3 | Area guide community cards include thumbnail mini-maps showing location within area | E2E | — | Load area guide; assert each community card has a mini-map thumbnail |
| 6.3-COMP-003 | 6.3 | Mini-map static image loads lightweight (no Mapbox GL JS bundle on page) | Component | R-007 | Assert community page JS bundle does NOT include `mapbox-gl` module |
| 6.4-E2E-002 | 6.4 | Search page filters by "Investment Property" and "Rental Potential" lifestyle tags | E2E | — | Select "Investment Property" tag; assert filtered results only contain investment-tagged properties |
| 6.4-COMP-003 | 6.4 | Disclaimer text is always co-rendered with investment data (cannot be removed independently) | Component | — | Render with investment data; remove disclaimer; assert it still appears (tied to data rendering) |
| 6.5-UNIT-002 | 6.5 | Geo-tagger uses PostGIS `ST_Within` for spatial queries (not application-level point-in-polygon) | Unit | — | Assert geo-tag SQL query contains `ST_Within`; verify PostGIS function call |
| 6.5-INT-005 | 6.5 | Geo-tagger extends Epic 2 sync pipeline Step 6 (no separate pipeline created) | Integration | — | Assert geo-tagging is called within sync pipeline orchestrator; no standalone cron job |

**Total P2:** 14 scenarios (~10–20 hours)

---

### P3 (Low)

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Test ID | Story | Requirement / AC | Test Level | Notes |
|---------|-------|-----------------|------------|-------|
| 6.1-E2E-010 | 6.1 | Area guide page Lighthouse performance score ≥ 80 on mobile | E2E | Run Lighthouse CI; assert score ≥ 80 on `/{locale}/areas/{slug}` |
| 6.2-E2E-011 | 6.2 | Community page Lighthouse performance score ≥ 80 on mobile | E2E | Run Lighthouse CI; assert score ≥ 80 on community page |
| 6.2-E2E-012 | 6.2 | Community page LCP < 2.5s on simulated 4G mobile | E2E | Playwright throttled 4G; assert LCP metric < 2500ms |
| 6.3-E2E-003 | 6.3 | Mini-map static image loads in < 1s | E2E | Assert mini-map `<img>` load event fires within 1s |
| 6.5-INT-006 | 6.5 | Geo-tagging step processes 300 properties in < 5 seconds | Integration | Seed 300 properties; time geo-tag step; assert < 5000ms |

**Total P3:** 5 scenarios (~3–6 hours)

---

## Execution Strategy

**Philosophy:** Run everything in PRs unless a test is expensive or long-running. The Playwright suite parallelizes across workers.

### Every PR

- All Vitest unit + component tests (`npm test`) — includes geo-tagger unit tests, component rendering tests, investment context tests
- All Playwright E2E functional tests (`playwright test --grep "epic-6"`) — once Playwright is unskipped for this epic

### Nightly / Regression

- Lighthouse CI performance benchmarks (P3)
- Full E2E suite across both locales (EN + ES)
- Geo-tagging performance test (300 properties benchmark)
- Full area guide + community discovery flow regression

### Before Story Ships (Story-Level Gates)

- **Before 6.1 ships:** R-003 (description visibility in SSG HTML), area guide Properties/Agents/Similar tabs render, area index page, locale tests
- **Before 6.2 ships:** R-004 (community property grid), R-005 (SSG path generation), featured communities on homepage, community index, lot status indicators, mobile/desktop responsive tests
- **Before 6.3 ships:** R-007 (static map, not interactive GL), mini-map alt text accessibility, geo-fence overlay rendering
- **Before 6.4 ships:** R-008 (graceful hiding), investment disclaimer co-rendering, lifestyle tag filter integration
- **Before 6.5 ships:** R-001 (manual override preservation), R-002 (correct polygon matching), coordinate-change re-tagging, null-coordinate handling, sync pipeline integration

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Effort/Scenario | Total Hours | Notes |
|----------|-------|----------------|-------------|-------|
| P0 | 14 | ~2–3h | ~24–42h | PostGIS integration tests, SSG validation, E2E flows |
| P1 | 18 | ~1–2h | ~20–36h | Component + E2E + responsive tests |
| P2 | 14 | ~0.5–1h | ~10–20h | Component + unit + build assertion |
| P3 | 5 | ~0.5–1h | ~3–6h | Lighthouse + performance benchmarks |
| **Total** | **51** | — | **~57–104h** | **~1.5–2.5 weeks** |

### Prerequisites

**Test Data:**

- `communityFactory` — seeded communities with `geo_fence` polygons (≥3 records, including RISE, Santa Elena Hills, Serena)
- `areaFactory` — seeded areas with metadata, property counts, hero images (≥3 records)
- `propertyFactory` — seeded properties with geo-coordinates inside/outside community polygons (≥10 records)
- Investment context data for at least 1 area (appreciation trends, rental yield)
- Properties with mixed lot statuses (available, sold, reserved) for status indicator tests

**Tooling:**

- Vitest + RTL for component and unit tests
- Playwright for E2E (area guide flow, community page, responsive breakpoints)
- Playwright viewport configs: mobile (360px), tablet (768px), desktop (1280px)
- PostGIS test database with spatial functions enabled
- Drizzle test DB client for raw spatial query verification

**Environment:**

- Test DB with `communities` table including `geo_fence` (Polygon 4326) column populated
- Test DB with `areas` table seeded with metadata JSONB fields
- Mapbox Static API token in `MAPBOX_ACCESS_TOKEN` env variable
- Playwright configured for mobile viewport (360px) and desktop (1280px)

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
- [ ] R-001 (manual override): admin-set `community_id` survives sync pipeline — integration test passing
- [ ] R-002 (correct community): polygon boundary matching verified with ≥2 polygons
- [ ] R-003 (SEO description): area guide description confirmed visible in SSG HTML without tab interaction
- [ ] R-004 (community properties): filtered property grid renders correct count on community page
- [ ] R-005 (SSG paths): `next build` generates all expected community page paths
- [ ] Core discovery flow validated E2E: area index → area guide → community card → community page → property detail
- [ ] Both EN and ES locales tested on area guide and community pages

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|-------------------|--------|-----------------|
| **PropertyCard (Epic 3–4)** | Reused in area guide Properties tab and community filtered grid; breaking change in PropertyCard props would break community/area property displays | Assert `data-testid="property-card"` still renders in existing Epic 3–4 E2E tests after Epic 6 changes |
| **AgentCard (Epic 4)** | Reused in area guide Agents tab; breaking change would break agent listing | Assert `data-testid="agent-card"` still renders in existing Epic 4 tests |
| **Sync Pipeline (Epic 2)** | Story 6.5 extends Step 6 of the sync pipeline; changes must not break existing sync steps (fetch, validate, diff, translate, optimize, upsert, revalidate) | Run full sync pipeline integration test; assert all 8 steps complete successfully after geo-tagger changes |
| **Homepage (Epic 1)** | Featured Communities section added to homepage; must not break existing hero, navigation, or footer | Run existing Epic 1 homepage E2E tests; assert no regression |
| **Search filters (Epic 3)** | Investment discovery (6.4) validates lifestyle tag filtering already built in Epic 3 | Assert existing lifestyle tag filter tests still pass |
| **ISR revalidation (Epic 2)** | Community pages use `revalidateTag('communities')` called by sync pipeline; new tag must not conflict with existing revalidation tags | Assert `revalidateTag('properties')` and `revalidateTag('agents')` still function after adding `revalidateTag('communities')` |
| **Drizzle schema** | `communities` table schema additions (geo_fence polygon) must not break existing migrations | Run full migration against test DB; assert existing `properties`, `agents`, `areas`, `leads`, `sync_logs` tables intact |
| **i18n namespace** | New `area` and `community` translation namespaces; must not overwrite existing keys | Assert existing EN/ES keys untouched; add `area.*` and `community.*` keys without collision |

---

## Assumptions and Dependencies

### Assumptions

1. The `communities` table schema with `geo_fence` (Polygon 4326) column is already defined in Drizzle from Epic 2 data pipeline migrations.
2. The `areas` table with `metadata` JSONB field (elevation, climate, distances) is seeded with content before Story 6.1 development begins.
3. Mapbox Static API is used for community mini-maps (not interactive Mapbox GL JS instances), per architecture spec.
4. Area guide routes follow the pattern `/{locale}/areas/[slug]` and community routes follow `/{locale}/areas/[area]/communities/[community]`.
5. The geo-tagger module (`src/lib/sync/geo-tagger.ts`) is a function that can be unit-tested with a test DB containing PostGIS functions — it is NOT a standalone service.
6. Investment context data (appreciation trends, rental yield) is stored as part of the `areas.metadata` JSONB field or a dedicated column — admin-curated, not API-sourced.
7. The `SimilarAreasSlider` and `SimilarCommunitiesSlider` components use the same carousel/slider pattern established in Epic 4.
8. Featured Communities on the homepage are configured via a query (e.g., top 3 communities by listing count or admin-curated order) — not hardcoded.
9. Lot status (Available/Sold/Reserved) maps to the `properties.status` field or a community-specific status field.

### Dependencies

1. **PostGIS extension** — Required in test DB for `ST_Within` spatial queries in geo-tagging tests
2. **Community polygon test data** — ≥3 non-overlapping GeoJSON polygons seeded in `communities.geo_fence` column
3. **Mapbox Static API token** — Required in CI for mini-map rendering tests
4. **Playwright epic-6 suite tag** — Required before E2E tests run in CI; must be added to Playwright config
5. **Property fixtures with coordinates** — Properties seeded with lat/lng inside and outside community polygons

### Risks to Plan

- **Risk:** PostGIS extension not available in CI test environment (some CI runners use vanilla PostgreSQL without spatial extensions)
  - **Impact:** All geo-fence integration tests (6.5-INT-*) would fail
  - **Contingency:** Use Docker-based CI with PostGIS image (`postgis/postgis:16-3.4`); document in CI setup guide

- **Risk:** Community polygon data format varies between GeoJSON and WKT across different seeding scripts
  - **Impact:** `ST_Within` queries fail with geometry type mismatch
  - **Contingency:** Standardize on WKT format in test fixtures; add validation test that seeded polygons are valid geometries

- **Risk:** Mapbox Static API rate limits hit during parallel CI test runs
  - **Impact:** Mini-map rendering tests fail intermittently
  - **Contingency:** Mock Mapbox Static API responses in E2E tests using Playwright route interception; test URL structure rather than rendered pixels

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for Story 6.1 before development starts (separate workflow; not auto-run).
- Run `*atdd` again for Stories 6.2, 6.3, 6.4, and 6.5 at the start of each respective story.
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

- PRD: `_bmad-output/planning-artifacts/prd.md` (FR17–FR21, FR44, FR45, FR50, NFR24)
- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 6, Stories 6.1–6.5)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (§4 database schema, §5 sync pipeline Step 6, §3 directory structure, §9 SEO)
- Prior Test Design: `_bmad-output/test-artifacts/test-design-epic-5.md` (carry-over infrastructure)
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
