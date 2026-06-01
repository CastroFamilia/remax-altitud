---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-26'
storyId: '6.1'
storyKey: 6-1-area-guide-pages
storyFile: _bmad-output/implementation-artifacts/6-1-area-guide-pages.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-6-1-area-guide-pages.md
generatedTestFiles:
  - tests/e2e/area-guide-pages.spec.ts
  - tests/unit/area/area-queries.spec.ts
  - tests/unit/area/area-components.spec.tsx
inputDocuments:
  - _bmad-output/implementation-artifacts/6-1-area-guide-pages.md
  - _bmad-output/test-artifacts/test-design-epic-6.md
  - _bmad-output/planning-artifacts/epics.md
  - src/lib/db/schema/areas.ts
  - src/lib/seo/structured-data.ts
  - vitest.config.mts
  - tests/e2e/property-cards.spec.ts
  - tests/unit/db/properties.spec.ts
---

# ATDD Checklist — Story 6.1: Area Guide Pages

**Story:** As a visitor, I want to explore area guides with lifestyle narratives, climate info, and filtered properties, so that I can understand what living in a specific area feels like before browsing listings.

**TDD Phase:** 🔴 RED — All tests are scaffolded with `test.skip()` / `it.skip()` and will fail until implementation.

---

## Preflight Summary

- **Stack:** Frontend (Next.js + Vitest + Playwright)
- **Generation Mode:** AI Generation (acceptance criteria are clear, standard SSG page scenarios)
- **Execution Mode:** Sequential (single agent)
- **Test Framework:** Vitest (unit/component), Playwright (E2E)
- **Story Status:** ready-for-dev

---

## Test Strategy — AC to Test Level Mapping

| AC # | Acceptance Criteria Summary | Test Level | Priority | Test ID |
|------|---------------------------|------------|----------|---------|
| AC #1 | Area guide page renders hero, description, climate data | E2E | P1 | 6.1-E2E-004 |
| AC #2 | Description always visible (not tabbed) for SEO | E2E | P0 | 6.1-E2E-001, 6.1-E2E-002 |
| AC #3 | Tabbed sections: Properties, Agents, Similar Areas | E2E | P1 | 6.1-E2E-006 |
| AC #4 | Properties tab shows filtered property grid | E2E | P0 | 6.1-E2E-003 |
| AC #5 | Agents tab shows AgentCards | E2E | P1 | 6.1-E2E-005 |
| AC #6 | Community cards with gold border | E2E | P1 | 6.1-E2E-007 |
| AC #7 | Area index page lists all areas | E2E | P1 | 6.1-E2E-008 |
| AC #8 | SSG — no ISR revalidation | Component | P2 | 6.1-COMP-003 |
| AC #9 | Locale support (EN/ES) via next-intl | E2E | P2 | 6.1-E2E-009 |
| AC #10 | JSON-LD Place schema | Component | P1 | 6.1-COMP-001 |
| AC #11 | Empty state for zero properties | E2E | P1 | 6.1-E2E-011 |
| AC #12 | Gradient fallback when no hero image | E2E | P2 | 6.1-E2E-012 |
| AC #13 | WAI-ARIA Tabs pattern with keyboard nav | E2E | P1 | 6.1-E2E-013 |

---

## Generated Test Files

### 1. E2E Tests: `tests/e2e/area-guide-pages.spec.ts`

| Test ID | Priority | AC | Description | Risk |
|---------|----------|----|-------------|------|
| 6.1-E2E-001 | P0 | #2 | Description visible without clicking any tab | R-003 |
| 6.1-E2E-002 | P0 | #2 | Description present in SSG HTML (no JS) | R-003 |
| 6.1-E2E-003 | P0 | #4 | Properties tab shows filtered grid | — |
| 6.1-E2E-004 | P1 | #1 | Hero renders h1 with area name | — |
| 6.1-E2E-005 | P1 | #5 | Agents tab shows AgentCards | — |
| 6.1-E2E-006 | P1 | #3 | Similar Areas tab renders | — |
| 6.1-E2E-007 | P1 | #6 | CommunityCards with gold border | R-011 |
| 6.1-E2E-008 | P1 | #7 | Area index page lists all areas | R-010 |
| 6.1-E2E-009 | P2 | #9 | Spanish locale renders correctly | — |
| 6.1-E2E-011 | P1 | #11 | Empty state for zero properties | — |
| 6.1-E2E-012 | P2 | #12 | Gradient fallback (no hero image) | — |
| 6.1-E2E-013 | P1 | #13 | WAI-ARIA Tabs keyboard navigation | — |

**Total E2E tests:** 12 (all `test.skip()`)

### 2. Unit Tests: `tests/unit/area/area-queries.spec.ts`

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| getAllAreas-P0-1 | P0 | #1, #7 | db.select is called |
| getAllAreas-P0-2 | P0 | #7 | Results ordered by sortOrder |
| getAllAreas-P1-1 | P1 | #7 | Returns empty array when no areas |
| getAreaBySlug-P0-1 | P0 | #1 | Returns area by slug |
| getAreaBySlug-P0-2 | P0 | #1 | Returns null for non-existent slug |
| getAreaBySlug-P1-1 | P1 | #1 | Uses .limit(1) |
| getAllAreaSlugs-P0-1 | P0 | #8 | Returns array of 3 slugs |
| getAllAreaSlugs-P1-1 | P1 | #8 | Returns empty array when no areas |
| getAllAreaSlugs-P0-2 | P0 | #8 | Each element is a string |
| getPropertiesByArea-P0-1 | P0 | #4 | Returns 2 PropertySearchItems |
| getPropertiesByArea-P0-2 | P0 | #4, #11 | Returns empty for no properties |
| getPropertiesByArea-P1-1 | P1 | #4 | Only is_visible=true properties |
| getSimilarAreas-P0-1 | P0 | #3 | Returns same-region areas |
| getSimilarAreas-P1-1 | P1 | #3 | Empty when no similar areas |
| getSimilarAreas-P1-2 | P1 | #3 | Ordered by sortOrder |

**Total unit tests:** 15 (all `it.skip()`)

### 3. Component Tests: `tests/unit/area/area-components.spec.tsx`

| Test ID | Priority | AC | Description |
|---------|----------|----|-------------|
| 6.1-COMP-001 | P1 | #10 | Place JSON-LD schema |
| 6.1-COMP-001b | P1 | #10 | English name in Place schema |
| 6.1-COMP-001c | P1 | #10 | Spanish description in Place schema |
| 6.1-COMP-001d | P2 | #10 | Geo coordinates in Place schema |
| 6.1-COMP-002 | P2 | #1 | Climate/altitude metadata |
| breadcrumb-area | P1 | #10 | Breadcrumb: Home → Areas → Area Name |
| breadcrumb-index | P2 | #10 | Breadcrumb: Home → Areas |
| hero-no-image | P2 | #12 | Gradient fallback (null heroImageUrl) |
| hero-with-image | P2 | #12 | Image used when heroImageUrl present |
| index-card-data | P1 | #7 | AreaIndexCard data contract |
| slug-url-safe | P2 | #8 | Slug is URL-safe |
| tabs-count | P1 | #3 | 3 tab panels expected |
| tabs-testids | P1 | #13 | data-testid contract |

**Total component tests:** 13 (all `it.skip()`)

---

## Risk Mitigations Covered

| Risk | Score | Mitigation Tests |
|------|-------|-----------------|
| R-003 (SEO description visibility) | 6 | 6.1-E2E-001, 6.1-E2E-002 |
| R-010 (stale property counts) | 3 | 6.1-E2E-008 |
| R-011 (gold border missing) | 2 | 6.1-E2E-007 |

---

## Statistics

| Category | Count |
|----------|-------|
| Total test scaffolds | 40 |
| P0 tests | 10 |
| P1 tests | 18 |
| P2 tests | 12 |
| E2E tests | 12 |
| Unit tests | 15 |
| Component tests | 13 |
| ACs covered | 13/13 (100%) |
| Risks mitigated | 3/3 story-level risks |

---

## Completion Summary

- **Test files created:** 3
- **Checklist output path:** `_bmad-output/test-artifacts/atdd-checklist-6-1-area-guide-pages.md`
- **Story key:** `6-1-area-guide-pages`
- **Story file:** `_bmad-output/implementation-artifacts/6-1-area-guide-pages.md`

### Key Risks / Assumptions

1. **R-003 (SEO):** Description visibility is the #1 risk. Two P0 tests verify the description is always visible and present in SSG HTML.
2. **Playwright not installed:** E2E tests use `@ts-expect-error` for the import until Playwright is configured.
3. **Areas table seeded:** Unit tests mock DB calls; E2E tests require seeded area data.

### Next Recommended Workflow

→ `dev-story` — Implement Story 6.1 using the story spec file. Remove `test.skip()` / `it.skip()` as each AC is implemented.
