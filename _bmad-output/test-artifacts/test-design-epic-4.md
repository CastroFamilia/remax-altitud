---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-05-02'
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
  - '_bmad-output/test-artifacts/test-design-epic-3.md'
epicScope:
  inScope: ['4.1', '4.2', '4.3', '4.4', '4.5']
---

# Test Design: Epic 4 — Listing Detail & Agent Profiles

**Date:** 2026-05-02
**Author:** Sebicas (BAD — Epic Test Design Agent)
**Status:** Draft
**Mode:** Epic-Level (Phase 4)
**Epic:** 4 — Listing Detail & Agent Profiles

---

## Executive Summary

**Scope:** Epic-level test design for Stories 4.1–4.5 of Epic 4. All stories are in backlog; this document governs the full epic test strategy before the first story begins.

Epic 4 is the **conversion layer** of the platform. Visitors who discovered a property in Epic 3 now arrive at a gallery-first listing detail page, evaluate the property, contact the listing agent, and explore the agent's profile. It introduces five new technical surfaces: (1) `PropertyGallery` with lightbox and LQIP (lazy-loaded client component, ~25KB), (2) `StickyMobileCTA` with `IntersectionObserver`, (3) SSG/ISR listing and agent pages (SEO critical), (4) full JSON-LD structured data, and (5) WordPress 301 redirect infrastructure. The `SimilarProperties` carousel reuses the `PropertyCard` from Epic 3.

This epic has **the highest SEO risk of any epic so far**: a broken redirect map or missing structured data directly damages organic traffic, which is the primary lead-generation channel. It also introduces the first **WhatsApp lead conversion flow** — the most revenue-sensitive action in the entire application.

**Risk Summary:**

- Total risks identified: 12
- High-priority risks (score ≥ 6): 7
- Critical categories: BUS, PERF, SEC, TECH

**Coverage Summary:**

- P0 scenarios: 13 (~22–38 hours)
- P1 scenarios: 19 (~22–38 hours)
- P2 scenarios: 14 (~8–18 hours)
- P3 scenarios: 5 (~2–5 hours)
- **Total effort:** ~54–99 hours (~1.5–2.5 weeks)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|-----------|
| **WhatsApp message delivery** | External platform; not testable in automated CI | Verify the generated wa.me URL/intent string is correctly formatted with the right phone number, message text, and UTM params |
| **Google Search Console indexing latency** | External; 301 resolves to correct destination is the testable boundary | Test that redirects return HTTP 301 and resolve within <50ms; sitemap presence is the in-scope coverage |
| **YouTube video playback quality/buffering** | Third-party CDN | Test that the `<iframe>` embed is present with correct `src`, `allow`, and `title` attributes |
| **LQIP image generation quality** | Build-time concern (aesthetic) | Test that the LQIP placeholder CSS is applied before the full image resolves |
| **DeepL/GPT-4 translation accuracy** | Epic 2 concern; translations are pre-stored in DB | Verify translated strings are served for the active locale; not re-translated live |
| **Agent photo CMS/upload UI** | Admin interface (Epic 8) | Test that the photo URL is rendered in `<img>` with correct `alt` text |

---

## Epic 3 Infrastructure Carry-Over

Stories 4.1–4.5 build on the test infrastructure established in Epic 3. The following apply immediately:

### Test Infrastructure (Already in Place)

- Vitest `environmentMatchGlobs` — `jsdom` applied to `tests/unit/**/*.spec.tsx`. All Epic 4 component tests in `tests/unit/listing/` will inherit this automatically. **Do not change the glob.**
- `@testing-library/react`, `jsdom`, `@testing-library/user-event` installed.
- `vi.mock(...)` hoisting pattern — declare before imports; add comment `// imported AFTER mocks`.
- `data-testid` contract from Epic 3 (`property-card`, `property-card-image`) is relied upon by the `SimilarProperties` carousel in Story 4.5.

### New `data-testid` Contract for Epic 4

| Attribute | Component | Story |
|-----------|-----------|-------|
| `data-testid="gallery-hero"` | PropertyGallery | 4.1 |
| `data-testid="gallery-thumbnail-strip"` | PropertyGallery | 4.1 |
| `data-testid="gallery-lightbox"` | PropertyGallery | 4.1 |
| `data-testid="gallery-photo-count"` | PropertyGallery | 4.1 |
| `data-testid="sticky-specs-bar"` | ListingDetailPage | 4.1 |
| `data-testid="agent-card"` | AgentCard | 4.2 |
| `data-testid="whatsapp-cta"` | WhatsAppCTA | 4.2 |
| `data-testid="email-cta"` | EmailCTA | 4.2 |
| `data-testid="sticky-mobile-cta"` | StickyMobileCTA | 4.2 |
| `data-testid="agent-transparency-note"` | AgentCard | 4.2 |
| `data-testid="agent-profile-header"` | AgentProfilePage | 4.3 |
| `data-testid="agent-listings-grid"` | AgentProfilePage | 4.3 |
| `data-testid="similar-properties-carousel"` | SimilarProperties | 4.5 |
| `data-testid="breadcrumbs"` | Breadcrumbs | 4.5 |

### PropertyGallery Lazy-Loading Note

`PropertyGallery` is lazy-loaded via `next/dynamic({ ssr: false })` (~25KB). The same module-mock pattern used for Mapbox in Epic 3 applies here for unit tests: `vi.mock('@/components/listing/PropertyGallery')`. Full gallery behavior is validated at the E2E level.

---

## Risk Assessment

> P (Probability) × I (Impact) = Score. Scores ≥ 6 require mitigation before the story ships.

### High-Priority Risks (Score ≥ 6)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner | Timeline |
|---------|-------|----------|-------------|---|---|-------|------------|-------|----------|
| R-001 | 4.4 | BUS | WordPress 301 redirect map is incomplete — old property/agent URLs resolve 404 instead of 301, destroying accumulated SEO equity during migration | 3 | 3 | 9 | Audit all WordPress URLs against the new slug mapping before deploy; add Playwright test suite that crawls a representative sample of old URLs and asserts HTTP 301 + correct destination | Dev/QA | Before 4.4 ships |
| R-002 | 4.1 | PERF | `PropertyGallery` is NOT lazy-loaded as a separate async chunk — 25KB gallery JS ships in the listing detail page's initial bundle, pushing app JS over 150KB budget (AR performance budget) | 2 | 3 | 6 | Build assertion test verifies `PropertyGallery` is absent from initial chunk; `next/dynamic({ ssr: false })` required | Dev | Before 4.1 ships |
| R-003 | 4.2 | BUS | WhatsApp `wa.me` URL uses wrong locale for pre-populated message — Spanish visitor receives English message (or vice versa), reducing lead conversion | 2 | 3 | 6 | Unit tests for `buildWhatsAppUrl()` with EN and ES fixtures; E2E test verifies final href contains correct locale message text | Dev/QA | Before 4.2 ships |
| R-004 | 4.4 | TECH | JSON-LD structured data missing or malformed on listing/agent pages — Google may demote or deindex pages, reducing organic traffic | 2 | 3 | 6 | Unit tests validate `generateListingJsonLd()` and `generateAgentJsonLd()` output against Schema.org spec; E2E test asserts `<script type="application/ld+json">` is present in page HTML | Dev | Before 4.4 ships |
| R-005 | 4.1 | PERF | Gallery first 3 images load >1s on 4G mobile (NFR6) — LQIP placeholders not applied or `priority` prop not set on first image, causing LCP regression | 2 | 3 | 6 | E2E test with Playwright throttled 4G; assert LCP ≤ 2.5s; verify first image has `priority` prop; assert LQIP blur class applied before full image resolves | QA | Before 4.1 ships |
| R-006 | 4.2 | BUS | `StickyMobileCTA` does not hide when `AgentCard` enters viewport (IntersectionObserver not wired) — duplicate CTAs visible simultaneously on mobile, violating UX-DR9 | 2 | 3 | 6 | Unit test `IntersectionObserver` callback logic; E2E test on mobile viewport: scroll agent card into view; assert sticky bar is hidden | Dev/QA | Before 4.2 ships |
| R-007 | 4.4 | TECH | hreflang tags reference wrong locale URL or are missing — bilingual crawlers index the wrong language variant, causing keyword cannibalization | 2 | 3 | 6 | Unit test `generateAlternateLanguages()` for listing and agent slugs; E2E test asserts both `<link rel="alternate" hreflang="en">` and `<link rel="alternate" hreflang="es">` present on listing and agent pages | Dev | Before 4.4 ships |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Story | Category | Description | P | I | Score | Mitigation | Owner |
|---------|-------|----------|-------------|---|---|-------|------------|-------|
| R-008 | 4.1 | TECH | Lightbox swipe (mobile) or arrow-key navigation (desktop) fails — `useKeyboard` handler conflicts with Safari's back-gesture or arrow focus trap missing | 2 | 2 | 4 | Component test for keyboard navigation and focus trap; E2E on mobile viewport with pointer events for swipe | Dev/QA |
| R-009 | 4.1 | PERF | Sticky specs bar causes layout shift (CLS) on desktop scroll — `position: sticky` triggers reflow on older Safari | 1 | 3 | 3 | E2E CLS measurement on desktop scroll; assert CLS < 0.1 | QA |
| R-010 | 4.3 | DATA | Agent profile page renders with stale or missing listings — ISR revalidation window too large; agent leaves office but listings remain associated | 2 | 2 | 4 | API test verifying ISR `revalidate` value matches spec; component test that empty listing array renders gracefully | Dev |
| R-011 | 4.5 | BUS | Similar properties algorithm returns properties from wrong area or price band — bad UX and competitive comparison failure | 2 | 2 | 4 | Unit tests for similarity scoring function; assert returned properties match area + price range + type criteria | Dev |
| R-012 | 4.4 | OPS | XML sitemaps not regenerated after daily sync — new listing and agent pages absent from sitemap, invisible to crawlers for up to 24h after creation | 2 | 2 | 4 | Integration test: trigger sync mock; assert sitemap endpoint returns updated URLs; assert sitemap regeneration is invoked in sync pipeline | Dev |

### Low-Priority Risks (Score 1–2)

| Risk ID | Story | Category | Description | P | I | Score | Action |
|---------|-------|----------|-------------|---|---|-------|--------|
| R-013 | 4.3 | BUS | Agent filter (office / language) on agents index page has UX bug — filter state not cleared on second office selection | 1 | 2 | 2 | Component test for filter state reset | Dev |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Entry Criteria

- [x] Epic 3 fully done — all 8 stories merged; `PropertyCard` component available as shared dependency
- [x] Epic 2 data pipeline running — agents, listings, and translations available in DB with photo URLs and locale fields
- [x] Vitest jsdom environment configured (`tests/unit/**/*.spec.tsx`) — inherited from Epic 3
- [x] 433+ unit tests passing across Epics 1–3 (0 regressions)
- [ ] `PropertyGallery` lazy-load configured (`next/dynamic({ ssr: false })`) before Story 4.1 development starts
- [ ] WordPress URL audit complete and 301 redirect map populated in `next.config.ts` — required before Story 4.4
- [ ] Playwright framework configured — required before E2E tests run (scaffolds deferred until Playwright unskip; run `*framework` workflow)
- [ ] Test data: ≥10 seeded listing records with photos, video, bilingual content, agent associations — required before E2E unskip
- [ ] Test data: ≥5 seeded agent records with photo, bio, languages, office, listing associations — required before E2E unskip

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing (≥ 95%)
- [ ] No open high-severity bugs against P0 scenarios
- [ ] R-001 (redirect map completeness): verified by automated crawl test; 0 broken redirects
- [ ] R-004 (JSON-LD): structured data validation passing on listing and agent pages
- [ ] Core conversion flow (search → listing detail → WhatsApp CTA) validated E2E
- [ ] Lighthouse CI gate: performance ≥ 80 on listing detail and agent profile pages (NFR28)

---

## Test Coverage Plan

> P0/P1/P2/P3 = **priority and risk level**, NOT execution timing. Execution scheduling is handled in the Execution Strategy section.

### P0 (Critical)

**Criteria:** Blocks core user journey + High risk (score ≥ 6) + No workaround

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 4.1-E2E-001 | 4.1 | Hero gallery renders full-width at 60vh with photo count overlay | E2E | R-005 | Assert gallery container dimensions; photo count label visible |
| 4.1-E2E-002 | 4.1 | First 3 gallery images load within 1s on throttled 4G (NFR6) | E2E | R-005 | Playwright throttled 4G; assert first 3 `<img>` loaded; measure time |
| 4.1-E2E-003 | 4.1 | LQIP blur placeholder transitions to sharp image (UX-DR19) | E2E | R-005 | Assert blur CSS applied before full image; assert removed after load |
| 4.1-UNIT-001 | 4.1 | `PropertyGallery` chunk is NOT in main JS bundle (lazy-loaded per performance budget) | Unit/Build | R-002 | Assert `PropertyGallery` absent from initial chunk; `next/dynamic` verified |
| 4.2-E2E-001 | 4.2 | WhatsApp CTA opens wa.me URL with EN message for English locale | E2E | R-003 | Assert `href` contains `wa.me/+506…` and EN message text |
| 4.2-E2E-002 | 4.2 | WhatsApp CTA opens wa.me URL with ES message for Spanish locale | E2E | R-003 | Assert `href` contains ES pre-populated message text |
| 4.2-UNIT-001 | 4.2 | `buildWhatsAppUrl()` builds correct wa.me URL with locale message, agent phone, property title, ref | Unit | R-003 | Unit test EN + ES fixtures; assert phone, title, ref present in URL |
| 4.2-E2E-003 | 4.2 | StickyMobileCTA hides when AgentCard scrolls into viewport (IntersectionObserver) | E2E | R-006 | Mobile viewport; scroll until agent card visible; assert sticky bar hidden |
| 4.4-UNIT-001 | 4.4 | `generateListingJsonLd()` produces valid RealEstateListing JSON-LD with required fields | Unit | R-004 | Assert `@type`, `price`, `address`, `geo`, `image`, `description` present |
| 4.4-UNIT-002 | 4.4 | `generateAgentJsonLd()` produces valid RealEstateAgent JSON-LD with required fields | Unit | R-004 | Assert `@type`, `name`, `image`, `telephone`, `areaServed` present |
| 4.4-E2E-001 | 4.4 | Listing detail page contains `<script type="application/ld+json">` with RealEstateListing schema | E2E | R-004 | Assert JSON-LD script tag in page source; parse and validate `@type` |
| 4.4-UNIT-003 | 4.4 | WordPress 301 redirect: `/property/:id` → `/en/property/:slug` returns HTTP 301 | API | R-001 | Assert status code 301 and `Location` header points to correct new URL |
| 4.4-UNIT-004 | 4.4 | `generateAlternateLanguages()` produces correct hreflang for EN + ES listing slug | Unit | R-007 | Assert both `{hrefLang: 'en', href: '…/en/property/…'}` and `es` variant |

**Total P0:** 13 scenarios (~22–38 hours)

---

### P1 (High)

**Criteria:** Important feature path + Medium risk (score 3–5) + Common workflow

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 4.1-E2E-004 | 4.1 | Clicking fullscreen button opens lightbox with photo count and navigation arrows | E2E | R-008 | Assert lightbox element visible; photo count overlay correct |
| 4.1-E2E-005 | 4.1 | Desktop arrow key navigation advances/retreats lightbox images | E2E | R-008 | Press ArrowRight/ArrowLeft; assert image index changes |
| 4.1-E2E-006 | 4.1 | Mobile lightbox swipe left/right advances/retreats images (pointer events) | E2E | R-008 | Playwright pointer events; assert image index changes |
| 4.1-E2E-007 | 4.1 | Sticky specs bar becomes sticky on desktop scroll (price, beds/baths, area, ZMT badge) | E2E | R-009 | Scroll page; assert specs bar has sticky positioning; verify content |
| 4.1-E2E-008 | 4.1 | YouTube video embed is present and playable (has correct src and allow attributes) | E2E | — | Assert iframe src contains `youtube.com/embed`; `allow` has autoplay |
| 4.1-E2E-009 | 4.1 | Listing title and description render in Spanish when locale is `es` | E2E | — | Load `/es/property/…`; assert translated title and description |
| 4.1-E2E-010 | 4.1 | Legal terms render using glossary translations ("Propiedad Titulada", "Concesión") in ES | E2E | — | Load ES locale; assert glossary strings present |
| 4.2-E2E-004 | 4.2 | Agent card shows photo, name, languages, office, WhatsApp + Email buttons | E2E | — | Assert all agent card fields populated from fixture data |
| 4.2-E2E-005 | 4.2 | Agent transparency note renders about WhatsApp translation (FR36) | E2E | — | Assert `data-testid="agent-transparency-note"` visible |
| 4.2-E2E-006 | 4.2 | Mobile sticky CTA bar (56px, WhatsApp + Email) persists on scroll before agent card | E2E | R-006 | Assert sticky bar visible below header and above agent card scroll position |
| 4.3-E2E-001 | 4.3 | Agent profile page shows photo, bio, languages, office, listing count, CTAs | E2E | R-010 | Load `/en/agents/…`; assert all profile fields rendered |
| 4.3-E2E-002 | 4.3 | Agent profile page displays property grid with all listings for that agent | E2E | R-010 | Assert `data-testid="agent-listings-grid"` contains PropertyCard components |
| 4.3-E2E-003 | 4.3 | Agents index page (`/en/agents`) lists all agents with photo, name, languages, office, count | E2E | — | Load agents index; assert ≥1 agent card; verify fields |
| 4.3-E2E-004 | 4.3 | Agents index: filter by office shows only agents from that office | E2E | — | Select office filter; assert only matching agents remain |
| 4.3-E2E-005 | 4.3 | Agents index: filter by language shows only agents speaking that language | E2E | — | Select language filter; assert only matching agents remain |
| 4.4-E2E-002 | 4.4 | Agent profile page contains `<script type="application/ld+json">` with RealEstateAgent schema | E2E | R-004 | Assert JSON-LD `@type: RealEstateAgent` in page source |
| 4.4-E2E-003 | 4.4 | hreflang tags present on listing detail page referencing both EN and ES variants | E2E | R-007 | Assert `<link rel="alternate" hreflang="en">` and `hreflang="es"` in `<head>` |
| 4.5-E2E-001 | 4.5 | Similar properties carousel shows horizontal scroll with PropertyCards | E2E | R-011 | Assert carousel present; ≥1 PropertyCard rendered |
| 4.5-E2E-002 | 4.5 | Breadcrumbs render full path: Home > [Area] > Properties > [Title] | E2E | — | Assert breadcrumb text content matches expected hierarchy |

**Total P1:** 19 scenarios (~22–38 hours)

---

### P2 (Medium)

**Criteria:** Secondary feature + Low risk (score 1–3) + Edge cases

| Test ID | Story | Requirement / AC | Test Level | Risk Link | Notes |
|---------|-------|-----------------|------------|-----------|-------|
| 4.1-COMP-001 | 4.1 | Gallery renders thumbnail strip with correct active state on photo change | Component | — | Mount gallery; click thumbnail; assert active class |
| 4.1-COMP-002 | 4.1 | Gallery renders LQIP blur placeholder class before image resolves | Component | R-005 | Mount with unresolved image; assert blur CSS class applied |
| 4.1-UNIT-002 | 4.1 | Listing detail page is generated with ISR `revalidate` = 86400 (daily) (NFR25) | Unit | — | Assert `revalidate` export in page component |
| 4.2-UNIT-002 | 4.2 | AgentCard has `role="article"` with appropriate ARIA label (UX-DR25) | Unit | — | Assert ARIA attributes in rendered output |
| 4.2-UNIT-003 | 4.2 | Email CTA opens contact form or mailto with property context pre-filled | Unit | — | Assert `href` contains property title/ref; or modal opens |
| 4.3-UNIT-001 | 4.3 | Agent profile page is generated with ISR `revalidate` = 86400 (NFR25) | Unit | — | Assert `revalidate` export in page component |
| 4.3-UNIT-002 | 4.3 | Agent profile renders gracefully with empty listings array (no crashes) | Unit | R-010 | Mount with `listings: []`; assert empty state copy rendered |
| 4.3-COMP-001 | 4.3 | Agent filter state resets correctly when switching between offices | Component | R-013 | Select Altitud; select Altitud Cero; assert Altitud results cleared |
| 4.4-UNIT-005 | 4.4 | `generateBreadcrumbJsonLd()` produces valid BreadcrumbList JSON-LD | Unit | R-004 | Assert `@type: BreadcrumbList`; `itemListElement` with correct hierarchy |
| 4.4-UNIT-006 | 4.4 | WordPress redirect for `/agent/:name` → `/en/agents/:slug` returns HTTP 301 | API | R-001 | Assert HTTP 301 and Location header |
| 4.4-UNIT-007 | 4.4 | XML sitemap endpoint returns 200 and contains listing/agent/area URLs | API | R-012 | GET `/sitemap-properties-en.xml`; assert contains at least 1 listing URL |
| 4.5-UNIT-001 | 4.5 | Similar properties algorithm returns listings from same area by default | Unit | R-011 | Seed 5 same-area + 5 different-area; assert only same-area returned first |
| 4.5-UNIT-002 | 4.5 | Similar properties algorithm filters by similar price range (± 20%) | Unit | R-011 | Seed listings at varied prices; assert price band filtering |
| 4.5-E2E-003 | 4.5 | Mobile similar properties renders as horizontal swipe carousel (UX-DR31) | E2E | — | Mobile viewport; assert carousel horizontal overflow with scroll |

**Total P2:** 14 scenarios (~8–18 hours)

---

### P3 (Low)

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Test ID | Story | Requirement / AC | Test Level | Notes |
|---------|-------|-----------------|------------|-------|
| 4.1-E2E-010 | 4.1 | Listing page Lighthouse performance score ≥ 80 (NFR28) | E2E | Run Lighthouse CI against listing detail; assert score ≥ 80 |
| 4.3-E2E-006 | 4.3 | Agent profile page Lighthouse performance score ≥ 80 (NFR28) | E2E | Run Lighthouse CI against agent profile; assert score ≥ 80 |
| 4.4-E2E-004 | 4.4 | Open Graph tags present on listing and agent pages (FR69) | E2E | Assert `og:title`, `og:description`, `og:image`, `og:url` in `<head>` |
| 4.4-E2E-005 | 4.4 | Title tag, meta description, and canonical URL present on listing page (FR69) | E2E | Assert `<title>`, `<meta name="description">`, `<link rel="canonical">` |
| 4.4-UNIT-008 | 4.4 | 301 redirect returns response < 50ms (NFR26) | API | Assert response time on representative sample of redirects |

**Total P3:** 5 scenarios (~2–5 hours)

---

## Execution Strategy

**Philosophy:** Run everything in PRs unless a test is expensive or long-running. Playwright parallelizes 100s of tests in 10–15 minutes.

### Every PR

- All Vitest unit + component tests (`npm test`)
- All Playwright E2E functional tests (`playwright test`) — once Playwright is unskipped
- Estimated total: ~12–15 minutes

### Nightly / Weekly

- Lighthouse CI performance audits (P3: 4.1-E2E-010, 4.3-E2E-006) — slow; run nightly on staging
- 301 redirect crawl test (full redirect map coverage) — run nightly after deploy

---

## Resource Estimates

| Priority | Count | Total Hours | Notes |
|----------|-------|-------------|-------|
| P0 | 13 | ~22–38 hours | Redirect and SEO tests are higher effort; E2E setup required |
| P1 | 19 | ~22–38 hours | Mostly E2E; reuse fixture data from P0 tests |
| P2 | 14 | ~8–18 hours | Component + unit; faster to implement |
| P3 | 5 | ~2–5 hours | Lighthouse + OG; lightweight assertions |
| **Total** | **51** | **~54–99 hours** | **~1.5–2.5 weeks** |

### Prerequisites

**Test Data:**
- `listingFactory` — at least 10 listings with: photos array, video URL, bilingual title/description, area, agent association, ZMT badge, price, beds/baths, lot/built area
- `agentFactory` — at least 5 agents with: photo URL, bilingual bio, languages array, office, listing associations
- WordPress URL fixture map — representative sample of 20+ old `/property/:id` and `/agent/:name` URLs mapped to new slugs

**Tooling:**
- Playwright (E2E) — run `*framework` workflow if not yet configured
- Vitest + `@testing-library/react` (unit/component) — already installed from Epic 3
- `next-test-api-route-handler` or `supertest` for API/redirect tests
- Lighthouse CI plugin for Playwright (P3)

**Environment:**
- Staging deployment of Next.js with ISR revalidation enabled
- DB seeded with test listings + agents
- `NEXT_PUBLIC_MAPBOX_TOKEN` configured (for listing map embeds, if any)
- `WA_TEST_PHONE` env var for WhatsApp URL construction tests

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥ 95% (waivers require sign-off)
- **P2/P3 pass rate**: ≥ 90% (informational)
- **R-001 (redirects)**: 0 broken redirects (HTTP 404 on any old URL = blocker)
- **R-004 (JSON-LD)**: Valid structured data on 100% of listing and agent pages

### Coverage Targets

- **Critical paths** (listing detail → WhatsApp CTA): ≥ 80%
- **SEO surfaces** (JSON-LD, hreflang, sitemaps, redirects): 100%
- **Business logic** (WhatsApp URL builder, similar properties, agent filter): ≥ 70%

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥ 6) items unmitigated at ship time
- [ ] R-001 redirect map verified complete before Story 4.4 ships
- [ ] Performance budget maintained: app JS initial bundle < 150KB; listing page LCP < 2.5s

---

## Risk Mitigation Plans

### R-001: WordPress Redirect Map Incomplete (Score: 9)

**Mitigation Strategy:**
1. Export all WordPress URLs from existing site via WordPress export or Screaming Frog crawl
2. Build mapping table: old slug → new Next.js slug (property type, area, title)
3. Populate `next.config.ts` `redirects` array with complete mapping
4. Write automated crawl test: for each old URL in fixture map, assert HTTP 301 + correct `Location` header ≠ current page
5. Gate Story 4.4 PR: redirect crawl test must pass 100% before merge

**Owner:** Dev
**Timeline:** Before Story 4.4 development starts
**Status:** Planned
**Verification:** `4.4-UNIT-003` + `4.4-UNIT-006` tests pass; crawl test shows 0 broken redirects

### R-002: PropertyGallery Not Lazy-Loaded (Score: 6)

**Mitigation Strategy:**
1. Implement `next/dynamic({ ssr: false })` for `PropertyGallery` in listing detail page
2. Add build assertion in CI that scans `_next/static/chunks/` for gallery bundle name (absent from initial chunk)
3. Gate Story 4.1 PR: build assertion `4.1-UNIT-001` must pass

**Owner:** Dev
**Timeline:** Story 4.1 implementation start
**Status:** Planned
**Verification:** `4.1-UNIT-001` test passes; bundle analysis confirms gallery chunk is separate

### R-003: WhatsApp Locale Mismatch (Score: 6)

**Mitigation Strategy:**
1. Implement `buildWhatsAppUrl(locale, agentPhone, propertyTitle, propertyRef)` as a pure function
2. Unit test: EN fixture → assert English message text; ES fixture → assert Spanish message text
3. E2E test: load listing in ES locale; inspect WhatsApp `href`; assert Spanish message

**Owner:** Dev/QA
**Timeline:** Story 4.2 implementation
**Status:** Planned
**Verification:** `4.2-UNIT-001`, `4.2-E2E-001`, `4.2-E2E-002` pass

### R-004: JSON-LD Missing or Malformed (Score: 6)

**Mitigation Strategy:**
1. Create `generateListingJsonLd()` and `generateAgentJsonLd()` as pure, unit-testable functions
2. Unit tests validate required Schema.org fields against a spec snapshot
3. E2E test: load listing page; `document.querySelector('script[type="application/ld+json"]')`; parse JSON; assert `@type`
4. Gate Story 4.4 PR: all JSON-LD unit tests pass before merge

**Owner:** Dev
**Timeline:** Story 4.4 implementation
**Status:** Planned
**Verification:** `4.4-UNIT-001`, `4.4-UNIT-002`, `4.4-E2E-001`, `4.4-E2E-002` pass

### R-005: Gallery LCP Regression (Score: 6)

**Mitigation Strategy:**
1. First gallery image must use `priority` prop (eager loading, preloaded in `<head>`)
2. LQIP blur placeholder applied via CSS before full image resolves
3. Remaining images use `loading="lazy"` (Next.js default)
4. E2E test: throttle to 4G; measure time for first 3 images to load; assert ≤ 1s

**Owner:** QA
**Timeline:** Story 4.1 implementation
**Status:** Planned
**Verification:** `4.1-E2E-001`, `4.1-E2E-002`, `4.1-E2E-003` pass

### R-006: StickyMobileCTA Not Hidden on AgentCard Visibility (Score: 6)

**Mitigation Strategy:**
1. `StickyMobileCTA` wires `IntersectionObserver` targeting `data-testid="agent-card"`
2. Unit test: mock `IntersectionObserver`; trigger intersection; assert sticky bar hidden
3. E2E test: mobile viewport (375px); scroll until agent card fully visible; assert `data-testid="sticky-mobile-cta"` is hidden

**Owner:** Dev/QA
**Timeline:** Story 4.2 implementation
**Status:** Planned
**Verification:** `4.2-E2E-003`, `4.2-E2E-006` pass

### R-007: hreflang Tags Missing or Wrong (Score: 6)

**Mitigation Strategy:**
1. `generateAlternateLanguages(slug)` is a pure function — unit-testable
2. Unit tests: assert both `en` and `es` alternate URLs contain correct slug
3. E2E test: inspect `<head>` of listing and agent pages; assert both hreflang tags present
4. Gate Story 4.4: hreflang unit + E2E tests pass before merge

**Owner:** Dev
**Timeline:** Story 4.4 implementation
**Status:** Planned
**Verification:** `4.4-UNIT-004`, `4.4-E2E-003` pass

---

## Assumptions and Dependencies

### Assumptions

1. `PropertyCard` component from Epic 3 is stable and available as a shared component with no breaking changes required for Epic 4.
2. Agent data (photo URL, bio, languages, office, listing associations) is available in the DB schema from Epic 2's sync pipeline.
3. The WordPress URL structure is fully auditable (crawl or export) before Story 4.4 development begins.
4. Translation glossary terms ("Propiedad Titulada", "Concesión") are stored in the DB and served at query time, not hardcoded in components.
5. `IntersectionObserver` is available in the test environment — if jsdom does not support it, polyfill or mock at the test boundary.

### Dependencies

1. WordPress URL audit complete — Required before Story 4.4 development starts
2. Playwright framework configured — Required before any E2E tests unskip (run `*framework` workflow)
3. Test data factories (`listingFactory`, `agentFactory`) — Required before E2E unskip
4. ISR staging environment — Required for E2E tests against SSG/ISR pages

### Risks to Plan

- **Risk**: WordPress URL audit discovers unexpected URL patterns not covered by the redirect map
  - **Impact**: Redirect test failures; SEO equity loss for those URLs
  - **Contingency**: Extend the audit scope; add a catch-all pattern for the most common old URL structure; monitor 404s in Search Console post-launch

- **Risk**: `IntersectionObserver` behaves differently in jsdom (component tests) vs. browser (E2E)
  - **Impact**: Unit tests may pass while production behavior fails
  - **Contingency**: Validate `StickyMobileCTA` behavior exclusively at the E2E level; mock `IntersectionObserver` in unit/component tests

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|-------------------|--------|-----------------|
| **PropertyCard (Epic 3)** | Reused by `SimilarProperties` carousel and `AgentProfilePage` | All Epic 3 unit tests must continue to pass (0 regressions); `4.5-E2E-001` confirms card renders in new context |
| **Search page (Epic 3)** | Listing detail pages are navigated to from search results | Smoke test: navigate from `/en/search` to a listing detail page; assert full page renders |
| **Data sync pipeline (Epic 2)** | Agent and listing data feed all Epic 4 pages | At least one agent + listing record available in test DB before E2E tests run |
| **i18n routing (Epic 1)** | `/en/` and `/es/` variants of listing and agent pages must route correctly | Load both `/en/property/…` and `/es/property/…` from same slug; assert translated content |

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests for each story before dev begins (separate workflow; not auto-run).
- Run `*automate` for broader coverage once implementation exists.
- Run `*framework` to configure Playwright if not yet done.

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework (P × I scoring, gate logic)
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection (unit / component / API / E2E)
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Epic: `_bmad-output/planning-artifacts/epics.md` (lines 1373–1580)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epic 3 Test Design (prior art): `_bmad-output/test-artifacts/test-design-epic-3.md`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

**Generated by**: BMad TEA Agent — Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
