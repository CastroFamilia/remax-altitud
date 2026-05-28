---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-27'
storyId: '6.3'
storyKey: 6-3-community-mini-map-and-geo-fence-display
storyFile: _bmad-output/implementation-artifacts/6-3-community-mini-map-and-geo-fence-display.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-6-3-community-mini-map-and-geo-fence-display.md
generatedTestFiles:
  - tests/unit/community/community-mini-map.spec.tsx
  - tests/e2e/community-mini-map.spec.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/6-3-community-mini-map-and-geo-fence-display.md
  - _bmad-output/test-artifacts/test-design-epic-6.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad/tea/config.yaml
---

# ATDD Checklist: Story 6.3 — Community Mini-Map & Geo-Fence Display

## Story Overview

- **Story ID:** 6.3
- **Epic:** 6 — Community Pages & Area Guides
- **GH Issue:** #103
- **Status:** ready-for-dev

**Story:** As a visitor, I want to see where a community is located on a map relative to the broader area, so that I can understand the geography and proximity to key landmarks.

---

## TDD Red Phase (Current)

✅ Red-phase test scaffolds generated

- **Component Tests:** 22 tests (all will fail until implementation)
- **E2E Tests:** 11 tests (all skipped with `test.skip()`)

---

## Acceptance Criteria Coverage

| AC # | Acceptance Criterion | Component Tests | E2E Tests | Priority |
|------|---------------------|-----------------|-----------|----------|
| AC #1 | Mini-map renders as Mapbox Static Images API `<img>` with community pin, area boundary, landmarks | 6.3-COMP-001, 001b, 001c, 001d | 6.3-E2E-001, 001c | P1 |
| AC #2 | Geo-fence polygon boundary displayed as shaded overlay | 6.3-COMP-001c | 6.3-E2E-001b | P1 |
| AC #3 | Area guide community cards include thumbnail mini-maps | CommunityCard thumbnail tests | 6.3-E2E-002 | P2 |
| AC #4 | Mini-maps are lightweight static images (no Mapbox GL JS) | 6.3-COMP-003, 003b | 6.3-E2E-001 (canvas check) | P2 |
| AC #5 | Alt text includes community name and area name (NFR24) | 6.3-COMP-002, 002b | 6.3-E2E-001d | P1 |
| AC #6 | communities table has geoFenceCoords column | Schema geo columns test | — | P1 |
| AC #7 | communities table has latitude and longitude columns | Schema geo columns test | — | P1 |

---

## Test Design Traceability

| Test Design ID | Story AC | Test Level | Risk Link | Test File | Status |
|---------------|----------|------------|-----------|-----------|--------|
| 6.3-E2E-001 | AC #1, #4 | E2E | R-007 | tests/e2e/community-mini-map.spec.ts | 🔴 RED |
| 6.3-COMP-001 | AC #1, #2 | Component | — | tests/unit/community/community-mini-map.spec.tsx | 🔴 RED |
| 6.3-COMP-002 | AC #5 | Component | R-013 | tests/unit/community/community-mini-map.spec.tsx | 🔴 RED |
| 6.3-E2E-002 | AC #3 | E2E | — | tests/e2e/community-mini-map.spec.ts | 🔴 RED |
| 6.3-COMP-003 | AC #4 | Component | R-007 | tests/unit/community/community-mini-map.spec.tsx | 🔴 RED |
| 6.3-E2E-003 | — | E2E | — | tests/e2e/community-mini-map.spec.ts | 🔴 RED |

---

## Risk Coverage

| Risk ID | Score | Description | Test Coverage |
|---------|-------|-------------|---------------|
| R-007 | 4 | Mini-map loads interactive Mapbox GL JS instead of static image (230KB bundle) | 6.3-COMP-003 (no mapbox-gl imports), 6.3-E2E-001 (no canvas element) |
| R-013 | 1 | Mini-map alt text missing or generic | 6.3-COMP-002 (alt text template), 6.3-E2E-001d (alt contains names) |

---

## Generated Test Files

### Component Tests

**File:** `tests/unit/community/community-mini-map.spec.tsx`

| Test | Priority | AC | Description |
|------|----------|----|-------------|
| 6.3-COMP-001 | P1 | #1 | static-map.ts exists with server-only guard |
| 6.3-COMP-001b | P1 | #1 | URL contains Mapbox Static API base and pin marker |
| 6.3-COMP-001c | P1 | #2 | URL includes geo-fence path overlay |
| 6.3-COMP-001d | P1 | #1 | Gold color (#C2A661) used for pin/stroke |
| buildAreaThumbnailMapUrl | P2 | #3 | Thumbnail URL builder exists |
| @2x retina | P2 | — | Retina suffix in URL |
| access_token | P2 | — | MAPBOX_TOKEN in URL |
| 6.3-COMP-002 | P1 | #5 | Alt text template with community + area name |
| 6.3-COMP-002b | P1 | — | data-testid="community-mini-map" |
| 6.3-COMP-002c | P1 | — | data-testid="geo-fence-overlay" conditional |
| 6.3-COMP-002d | P1 | #4 | Renders as `<img>` with loading="lazy" |
| Server Component | P1 | #4 | No 'use client' directive |
| null handling | P1 | — | Returns null when coords missing |
| figure/figcaption | P2 | — | Semantic HTML wrapper |
| 6.3-COMP-003 | P2 | #4 | No mapbox-gl imports in component |
| 6.3-COMP-003b | P2 | #4 | No mapbox-gl in static-map.ts |
| community page | P2 | #4 | No map component imports on page |
| latitude schema | P1 | #7 | doublePrecision column |
| longitude schema | P1 | #7 | doublePrecision column |
| geoFenceCoords schema | P1 | #6 | jsonb column |
| en.json keys | P2 | #5 | miniMap i18n namespace |
| es.json keys | P2 | #5 | miniMap i18n namespace |

### E2E Tests

**File:** `tests/e2e/community-mini-map.spec.ts`

| Test | Priority | AC | Description |
|------|----------|----|-------------|
| 6.3-E2E-001 | P1 | #1, #4 | Mini-map renders as `<img>`, no `<canvas>` |
| 6.3-E2E-001b | P1 | #2 | Geo-fence overlay indicator present |
| 6.3-E2E-001c | P1 | #1 | Image URL contains lat/lng |
| 6.3-E2E-001d | P1 | #5 | Alt text includes community + area name |
| 6.3-E2E-001e | P1 | #1 | Mini-map in SSG HTML output |
| 6.3-E2E-001f | P2 | — | Responsive on mobile viewport |
| 6.3-E2E-001g | P2 | #5 | Spanish locale alt text |
| 6.3-E2E-002 | P2 | #3 | Area guide cards have thumbnail maps |
| 6.3-E2E-003 | P3 | — | Image loads in < 1s |
| null handling | P2 | — | No mini-map when coords missing |
| Community card thumbnail | P2 | #3 | Card accepts lat/lng/geoFenceCoords |

---

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. **Task 1 (Schema):** Remove skip from schema geo column tests → run → verify FAIL → add columns → verify PASS
2. **Task 2 (URL Builder):** Remove skip from `buildCommunityMiniMapUrl` tests → run → verify FAIL → implement → verify PASS
3. **Task 3 (Component):** Remove skip from `CommunityMiniMap` tests → run → verify FAIL → implement → verify PASS
4. **Task 4 (Page Integration):** Remove skip from E2E-001 tests → run → verify FAIL → integrate → verify PASS
5. **Task 5 (Thumbnails):** Remove skip from CommunityCard thumbnail tests and E2E-002 → implement → verify PASS
6. **Task 6 (i18n):** Remove skip from i18n tests → add keys → verify PASS

### Implementation Guidance

**New files to create:**

- `src/lib/map/static-map.ts` — Mapbox Static Image URL builder (server-only)
- `src/components/community/community-mini-map.tsx` — Server Component (static `<img>`)

**Files to modify:**

- `src/lib/db/schema/communities.ts` — Add latitude, longitude, geoFenceCoords columns
- `src/components/area/community-card.tsx` — Add thumbnail map props
- `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` — Insert CommunityMiniMap
- `src/app/[locale]/areas/[slug]/page.tsx` — Pass coords to CommunityCard
- `src/messages/en.json` — Add miniMap i18n keys
- `src/messages/es.json` — Add miniMap i18n keys

**Critical constraint:** Use Mapbox Static Images API only — do NOT import mapbox-gl, react-map-gl, or any component from `src/components/map/`.

---

## Completion Summary

- **Total test scaffolds:** 33 (22 component + 11 E2E)
- **All tests in TDD RED phase** (will fail until implementation)
- **Acceptance criteria coverage:** 7/7 ACs covered
- **Risk coverage:** R-007 (Mapbox GL bundle) and R-013 (alt text) mitigated
- **Next recommended workflow:** `dev-story` (implement Story 6.3)

---

**Generated by:** BMad TEA Agent — ATDD Workflow
**Date:** 2026-05-27
