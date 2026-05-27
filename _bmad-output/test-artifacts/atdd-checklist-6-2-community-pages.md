---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-27'
storyId: '6.2'
storyKey: 6-2-community-pages
storyFile: _bmad-output/implementation-artifacts/6-2-community-pages.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-6-2-community-pages.md
generatedTestFiles:
  - tests/e2e/community-pages.spec.ts
  - tests/unit/community/community-queries.spec.ts
  - tests/unit/community/community-components.spec.tsx
  - tests/fixtures/community-factories.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/6-2-community-pages.md
  - _bmad-output/test-artifacts/test-design-epic-6.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/test-artifacts/atdd-checklist-6-1-area-guide-pages.md
  - tests/unit/area/area-queries.spec.ts
  - tests/unit/area/area-components.spec.tsx
  - tests/e2e/area-guide-pages.spec.ts
  - tests/fixtures/area-factories.ts
  - vitest.config.mts
---

# ATDD Checklist — Story 6.2: Community Pages

**Story:** As a visitor, I want to explore curated community developments with quick facts, availability status, and filtered properties, so that I can evaluate premium developments and check which lots/homes are available.

**TDD Phase:** 🔴 RED — All tests are scaffolded with `test.skip()` / `it.skip()` and will fail until implementation.

---

## Preflight Summary

- **Stack:** Frontend (Next.js + Vitest + Playwright)
- **Generation Mode:** AI Generation (acceptance criteria are clear, standard SSG+ISR page scenarios)
- **Execution Mode:** Sequential (single agent)
- **Test Framework:** Vitest (unit/component), Playwright (E2E)
- **Story Status:** ready-for-dev

---

## Test Strategy — AC to Test Level Mapping

| AC # | Acceptance Criteria Summary | Test Level | Priority | Test ID |
|------|---------------------------|------------|----------|---------|
| AC #1 | Hero with community name, tagline, price range | E2E | P0 | 6.2-E2E-002 |
| AC #2 | Quick facts icon grid (6 fields) | Component | P1 | 6.2-COMP-001 |
| AC #3 | Description always visible (not tabbed) for SEO | E2E | P1 | 6.2-E2E-005 |
| AC #4 | Properties tab with filtered grid + lot status indicators | E2E, Component | P0, P1 | 6.2-E2E-001, 6.2-COMP-002 |
| AC #5 | Site Map tab (desktop) / lot list (mobile) | E2E | P1 | 6.2-E2E-007, 6.2-E2E-008 |
| AC #6 | SimilarCommunitiesSlider (always visible) | Component | P1 | 6.2-COMP-003 |
| AC #7 | CommunityCard with gold border | Component | P2 | 6.2-COMP-004 |
| AC #8 | Featured Communities on homepage (2-3 gold-bordered cards) | E2E | P0 | 6.2-E2E-004 |
| AC #9 | SSG + ISR (revalidate = 3600) | Component | P2 | 6.2-COMP-005 |
| AC #10 | Community index page lists all communities | E2E | P1 | 6.2-E2E-006 |
| AC #11 | Locale support (EN/ES) via next-intl | E2E | P2 | 6.2-E2E-009 |
| AC #12 | JSON-LD Place schema for communities | Component | P1 | COMP-jsonld |
| AC #13 | Breadcrumb: Home → Areas → Area → Community | Component | P1 | COMP-breadcrumb |
| AC #14 | Empty state for zero properties | E2E | P1 | 6.2-E2E-014 |
| AC #15 | Gradient fallback (navy-to-gold) when no hero image | Component, E2E | P2 | COMP-hero-fallback, 6.2-E2E-015 |
| AC #16 | WAI-ARIA Tabs pattern with keyboard navigation | Component, E2E | P1 | COMP-tabs-aria, 6.2-E2E-016 |

---

## Generated Test Files

### 1. E2E Tests: `tests/e2e/community-pages.spec.ts`

| Test ID | Priority | AC | Description | Risk |
|---------|----------|----|-------------|------|
| 6.2-E2E-001 | P0 | #4 | Filtered property grid with correct count | R-004 |
| 6.2-E2E-002 | P0 | #1-3 | Hero, tagline, price range, quick facts, description | R-004 |
| 6.2-E2E-003 | P0 | #9 | Page returns 200 on cold cache (not 404) | R-005 |
| 6.2-E2E-004 | P0 | #8 | Featured Communities on homepage (gold-bordered cards) | R-005 |
| 6.2-E2E-005 | P1 | #3 | Description always visible (not tabbed) for SEO | — |
| 6.2-E2E-005b | P1 | #3 | Description present in SSG HTML (no JS) | — |
| 6.2-E2E-006 | P1 | #10 | Community index page lists all communities | — |
| 6.2-E2E-007 | P1 | #5 | Desktop: Site Map tab visible with image | R-012 |
| 6.2-E2E-008 | P1 | #5 | Mobile: Site Map tab hidden; lot list visible | R-012 |
| 6.2-E2E-009 | P2 | #11 | Spanish locale renders correctly | — |
| 6.2-E2E-010 | P2 | #1 | Price range from DB values | — |
| 6.2-E2E-014 | P1 | #14 | Empty state for zero properties | — |
| 6.2-E2E-015 | P2 | #15 | Gradient fallback (navy-to-gold) | — |
| 6.2-E2E-016 | P1 | #16 | WAI-ARIA Tabs keyboard navigation | — |

**Total E2E tests:** 14 (all `test.skip()`)

### 2. Unit Tests: `tests/unit/community/community-queries.spec.ts`

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| getAllCommunities-P0-1 | P0 | #1, #10 | db.select is called |
| getAllCommunities-P0-2 | P0 | #10 | Results ordered by name |
| getAllCommunities-P1-1 | P1 | #10 | Returns empty array when no communities |
| getCommunityBySlugAndArea-P0-1 | P0 | #1 | Returns community by slug+area |
| getCommunityBySlugAndArea-P0-2 | P0 | #1 | Returns null for non-existent |
| getCommunityBySlugAndArea-P1-1 | P1 | #1 | Uses .limit(1) |
| getCommunityBySlugAndArea-P1-2 | P1 | #1 | Joins with areas table |
| getAllCommunityParams-P0-1 (6.2-INT-001) | P0 | #9 | Returns 3 slug/area pairs |
| getAllCommunityParams-P1-1 | P1 | #9 | Returns empty when no communities |
| getAllCommunityParams-P0-2 | P0 | #9 | Each element has community+slug strings |
| getPropertiesByCommunityId-P0-1 | P0 | #4 | Returns 3 PropertySearchItems |
| getPropertiesByCommunityId-P0-2 | P0 | #4, #14 | Returns empty for no properties |
| getPropertiesByCommunityId-P1-1 | P1 | #4 | Only is_visible=true properties |
| getSimilarCommunities-P0-1 | P0 | #6 | Returns same-area communities |
| getSimilarCommunities-P1-1 | P1 | #6 | Empty when no similar communities |
| getSimilarCommunities-P1-2 | P1 | #6 | Ordered by name |
| getFeaturedCommunities-P0-1 | P0 | #8 | Returns top by listing count |
| getFeaturedCommunities-P1-1 | P1 | #8 | Empty when no listings |
| getFeaturedCommunities-P1-2 | P1 | #8 | Uses provided limit |
| getCommunitiesByAreaId-P0-1 | P0 | #7 | Returns 2 community objects |
| getCommunitiesByAreaId-P1-1 | P1 | #7 | Returns empty for no communities |
| getCommunitiesByAreaId-P1-2 | P1 | #7 | Ordered by name |

**Total unit tests:** 22 (all `it.skip()`)

### 3. Component Tests: `tests/unit/community/community-components.spec.tsx`

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| 6.2-COMP-001 | P1 | #2 | Quick facts renders all 6 fields |
| 6.2-COMP-001b | P1 | #2 | Graceful handling of missing fields |
| 6.2-COMP-001c | P2 | #2 | Uses emoji icons for each category |
| 6.2-COMP-002 | P1 | #4 | Lot status 3 data-testid values |
| 6.2-COMP-002b | P1 | #4 | Correct emoji icons per status |
| 6.2-COMP-002c | P1 | #4 | Maps 'active' → Available |
| 6.2-COMP-003 | P1 | #6 | SimilarCommunitiesSlider data-testid |
| 6.2-COMP-003b | P1 | #6 | Uses CommunityCard component |
| 6.2-COMP-004 | P2 | #7 | Gold border + data-testid |
| 6.2-COMP-004b | P2 | #7 | Accepts priceMin/priceMax/listingCount |
| 6.2-COMP-005 | P2 | #9 | Exports revalidate constant |
| COMP-jsonld-1 | P1 | #12 | generateCommunityJsonLd Place schema |
| COMP-jsonld-2 | P1 | #12 | containedInPlace with area context |
| COMP-jsonld-3 | P1 | #12 | Spanish description when locale='es' |
| COMP-breadcrumb | P1 | #13 | 4-level breadcrumb for community |
| COMP-hero-fallback-1 | P2 | #15 | Navy-to-gold gradient |
| COMP-hero-fallback-2 | P2 | #15 | Image element when hero exists |
| COMP-desc-server | P0 | #3 | No 'use client' directive |
| COMP-tabs-aria-1 | P1 | #16 | WAI-ARIA roles |
| COMP-tabs-aria-2 | P1 | #16 | data-testid attributes |
| COMP-tabs-aria-3 | P1 | #16 | Keyboard navigation |
| COMP-tabs-panels | P1 | #16 | 2 tab panels |
| 6.2-COMP-006 | P2 | #4 | Lot list sort controls |
| 6.2-COMP-006b | P2 | #4 | Lot list is Client Component |
| COMP-featured-1 | P1 | #8 | FeaturedCommunities data-testid |
| COMP-featured-2 | P1 | #8 | FeaturedCommunities Server Component |
| COMP-index-card | P1 | #10 | Community index card data-testid |

**Total component tests:** 27 (all `it.skip()`)

### 4. Test Fixtures: `tests/fixtures/community-factories.ts`

| Factory | Description |
|---------|-------------|
| `makeCommunity()` | RISE community — full data, all quick facts |
| `makeCommunity2()` | Santa Elena Hills — no site map image |
| `makeCommunity3()` | Serena del Mar — no hero image (gradient fallback) |
| `makeCommunityEmpty()` | Empty community — zero properties, no images |

---

## Risk Mitigations Covered

| Risk | Score | Mitigation Tests |
|------|-------|-----------------| 
| R-004 (community property grid) | 6 | 6.2-E2E-001, 6.2-E2E-002, getPropertiesByCommunityId-P0-* |
| R-005 (SSG path generation) | 6 | 6.2-E2E-003, 6.2-E2E-004, getAllCommunityParams-P0-* (6.2-INT-001) |
| R-009 (wrong lot status) | 4 | 6.2-COMP-002, 6.2-COMP-002b, 6.2-COMP-002c |
| R-011 (gold border missing) | 2 | 6.2-COMP-004 |
| R-012 (site map on mobile) | 2 | 6.2-E2E-007, 6.2-E2E-008 |

---

## Statistics

| Category | Count |
|----------|-------|
| Total test scaffolds | 63 |
| P0 tests | 15 |
| P1 tests | 33 |
| P2 tests | 15 |
| E2E tests | 14 |
| Unit tests | 22 |
| Component tests | 27 |
| Test fixtures | 4 factories |
| ACs covered | 16/16 (100%) |
| Risks mitigated | 5/5 story-level risks |

---

## Completion Summary

- **Test files created:** 4
- **Checklist output path:** `_bmad-output/test-artifacts/atdd-checklist-6-2-community-pages.md`
- **Story key:** `6-2-community-pages`
- **Story file:** `_bmad-output/implementation-artifacts/6-2-community-pages.md`

### Key Risks / Assumptions

1. **R-004 (BUS, Score 6):** Community property grid is the #1 business risk. Three P0 tests verify the filtered property grid renders the correct count.
2. **R-005 (SEO, Score 6):** SSG path generation is critical. P0 tests verify `generateStaticParams()` returns all slug pairs and community pages return HTTP 200.
3. **Playwright not installed:** E2E tests use `@ts-expect-error` for the import until Playwright is configured.
4. **Communities table not yet created:** Unit tests mock DB calls; E2E tests require seeded community data.
5. **Test patterns mirror Story 6.1:** All conventions follow the established patterns from `atdd-checklist-6-1-area-guide-pages.md`.

### Next Recommended Workflow

→ `dev-story` — Implement Story 6.2 using the story spec file. Remove `test.skip()` / `it.skip()` as each AC is implemented.
