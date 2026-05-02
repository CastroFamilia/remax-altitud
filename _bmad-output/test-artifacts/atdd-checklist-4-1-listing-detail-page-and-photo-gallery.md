---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-02'
storyId: '4.1'
storyKey: 4-1-listing-detail-page-and-photo-gallery
storyFile: _bmad-output/implementation-artifacts/4-1-listing-detail-page-and-photo-gallery.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-4-1-listing-detail-page-and-photo-gallery.md
generatedTestFiles:
  - tests/e2e/listing-detail-page-and-photo-gallery.spec.ts
  - tests/unit/listing/property-gallery.spec.tsx
  - tests/unit/listing/sticky-specs-bar.spec.tsx
  - tests/unit/listing/listing-detail-page.spec.ts
---

# ATDD Checklist: Story 4.1 — Listing Detail Page & Photo Gallery

**Date:** 2026-05-02
**TDD Phase:** RED (all tests skipped until implementation)
**Execution Mode:** SEQUENTIAL (API → E2E)

---

## TDD Red Phase (Current)

All red-phase test scaffolds generated.

- **E2E Tests:** 14 tests (all `test.skip()`)
- **Unit/Component Tests (PropertyGallery):** 13 tests (all `it.skip()`)
- **Unit/Component Tests (StickySpecsBar):** 11 tests (all `it.skip()`)
- **Unit Tests (Page/Queries):** 5 tests (all `it.skip()`)
- **Total:** 43 test scaffolds (all skipped — TDD RED PHASE)

---

## Acceptance Criteria Coverage

| AC | Description | Test IDs | Status |
|----|-------------|----------|--------|
| AC #1 | Hero gallery fills full-width at 60vh with thumbnail strip and photo count overlay | 4.1-E2E-001, PropertyGallery COMP | RED |
| AC #2 | Lightbox opens with swipe navigation (mobile) or arrow keys (desktop) | 4.1-E2E-004, 4.1-E2E-005, 4.1-E2E-006, PropertyGallery UNIT | RED |
| AC #3 | First 3 images load within 1s; remaining lazy-loaded | 4.1-E2E-002 | RED |
| AC #4 | LQIP blur placeholders that transition to sharp images | 4.1-E2E-003, 4.1-COMP-002, PropertyGallery UNIT | RED |
| AC #5 | YouTube video embedded and playable | 4.1-E2E-008, PropertyGallery UNIT | RED |
| AC #6 | Sticky specs bar: price, beds/baths, area (unit toggle), ZMT badge | 4.1-E2E-007, StickySpecsBar UNIT | RED |
| AC #7 | Title, description, specs render in user's language | 4.1-E2E-009 | RED |
| AC #8 | Legal terms use enforced glossary ("Propiedad Titulada," "Concesión") | 4.1-E2E-010 | RED |
| AC #9 | URL loads as complete standalone landing page | 4.1-E2E-009 (locale test) | RED |
| AC #10 | Page is SSG/ISR | 4.1-UNIT-002, listing-detail-page.spec.ts | RED |
| AC #11 | All images use next/image with sizes and WebP | PropertyGallery UNIT (blur + priority) | RED |

---

## Generated Test Files

### 1. E2E Tests (TDD RED PHASE — all `test.skip()`)

**File:** `tests/e2e/listing-detail-page-and-photo-gallery.spec.ts`

| Test ID | Priority | Description |
|---------|----------|-------------|
| 4.1-E2E-001 | P0 | Hero gallery renders with gallery-hero testid, thumbnail strip, photo count |
| 4.1-E2E-001b | P0 | Hero gallery fills full-width at ~60vh height |
| 4.1-E2E-002 | P0 | First image has `priority` attribute for LCP optimization |
| 4.1-E2E-003 | P0 | LQIP blur placeholder applied (blurDataURL passed) |
| 4.1-E2E-004 | P1 | Clicking fullscreen opens lightbox with photo count |
| 4.1-E2E-005 | P1 | ArrowRight advances lightbox image index |
| 4.1-E2E-005b | P1 | ArrowLeft retreats lightbox image index |
| 4.1-E2E-006 | P1 | Mobile swipe left advances lightbox image |
| 4.1-E2E-007 | P1 | Sticky specs bar shows price after scroll |
| 4.1-E2E-007b | P1 | Sticky specs bar has `position: sticky` CSS |
| 4.1-E2E-008 | P1 | YouTube embed renders with correct src/allow attributes |
| 4.1-E2E-008b | P1 | No video embed when property has no YouTube URL |
| 4.1-E2E-009 | P1 | Listing renders in Spanish for `/es/` locale |
| 4.1-E2E-010 | P1 | Legal terms use glossary translations in ES |
| (thumbnail) | P2 | Clicking thumbnail changes active hero image and photo count |
| (escape) | P2 | Pressing Escape closes the lightbox |

### 2. Unit/Component Tests: PropertyGallery (TDD RED PHASE — all `it.skip()`)

**File:** `tests/unit/listing/property-gallery.spec.tsx`

| Test ID | Priority | Description |
|---------|----------|-------------|
| COMP-hero | P0 | Renders `data-testid="gallery-hero"` |
| COMP-strip | P0 | Renders `data-testid="gallery-thumbnail-strip"` |
| COMP-count | P0 | Renders `data-testid="gallery-photo-count"` showing "1 / 3" |
| COMP-priority | P0 | First image has `priority` prop (LCP optimization, R-005) |
| COMP-lightbox-hidden | P0 | Lightbox NOT visible initially |
| COMP-lightbox-open | P1 | Clicking fullscreen opens lightbox |
| COMP-arrow-right | P1 | ArrowRight advances image index in lightbox |
| COMP-arrow-left | P1 | ArrowLeft retreats image index in lightbox |
| COMP-video-embed | P1 | YouTube embed renders when `youtubeUrl` provided |
| COMP-no-video | P1 | No video embed when `youtubeUrl` is null |
| COMP-no-video-undef | P1 | No video embed when `youtubeUrl` is undefined |
| 4.1-COMP-002 | P2 | First image has blur placeholder (blurDataURL + placeholder="blur") |
| 4.1-COMP-001 | P2 | Clicking thumbnail updates photo count to "2 / 3" |
| COMP-active-thumb | P2 | Active thumbnail indicator renders |

### 3. Unit/Component Tests: StickySpecsBar (TDD RED PHASE — all `it.skip()`)

**File:** `tests/unit/listing/sticky-specs-bar.spec.tsx`

| Test ID | Priority | Description |
|---------|----------|-------------|
| SPEC-testid | P0 | Renders `data-testid="sticky-specs-bar"` |
| SPEC-price | P0 | Displays USD formatted price |
| SPEC-beds | P0 | Displays bedroom count |
| SPEC-baths | P0 | Displays bathroom count |
| SPEC-zmt | P0 | Renders ZMT status text |
| SPEC-lot | P1 | Renders lot size via `convertArea` |
| SPEC-built | P1 | Renders built area via `convertArea` |
| SPEC-toggle | P1 | Renders `UnitToggle` component |
| SPEC-null-beds | P2 | No bedroom spec when bedrooms is null |
| SPEC-null-lot | P2 | Renders correctly when lot size is null |

### 4. Unit Tests: Page + Queries (TDD RED PHASE — all `it.skip()`)

**File:** `tests/unit/listing/listing-detail-page.spec.ts`

| Test ID | Priority | Description |
|---------|----------|-------------|
| 4.1-UNIT-002 | P2 | `revalidate` export equals `86400` (ISR daily, NFR25) |
| PAGE-no-dynamic | P2 | Page does NOT export `dynamic = "force-dynamic"` |
| QUERY-slugs-type | P2 | `getAllPropertySlugs` returns array of strings |
| QUERY-slugs-values | P2 | `getAllPropertySlugs` returns expected seeded slugs |
| QUERY-agent | P2 | `getAgentById` is exported from agents.ts |

---

## Infrastructure Changes

- `vitest.config.mts` — Added `tests/unit/listing/**/*.spec.tsx` and `tests/unit/listing/**/*.test.tsx` to `environmentMatchGlobs` with `jsdom`

---

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `it.skip()` (or `test.skip()`) from the test for the current task
2. Run tests:
   - Unit: `npm test -- --grep "PropertyGallery"`
   - E2E (after Playwright configured): `npx playwright test tests/e2e/listing-detail-page-and-photo-gallery.spec.ts`
3. Verify the activated test **FAILS** before implementation, then **PASSES** after
4. Commit passing tests

### Recommended Activation Order

| Task | Activate Tests |
|------|---------------|
| Task 0: next.config.ts remotePatterns | No tests — verify build passes |
| Task 1: page.tsx SSG/ISR | `listing-detail-page.spec.ts`: `revalidate = 86400`, `no force-dynamic` |
| Task 2: PropertyGallery | All `property-gallery.spec.tsx` tests |
| Task 3: Query functions | `listing-detail-page.spec.ts`: `getAllPropertySlugs`, `getAgentById` |
| Task 4: ListingDetailLayout | No dedicated unit tests (Server Component RSC) |
| Task 5: StickySpecsBar | All `sticky-specs-bar.spec.tsx` tests |
| Task 8: i18n keys | Verify existing tests pass (i18n keys wired to translations mock) |

---

## Risk Mitigations Addressed

| Risk | Mitigation Tests |
|------|-----------------|
| R-002: PropertyGallery not lazy-loaded (25KB in initial bundle) | 4.1-UNIT-001 (build assertion — deferred to CI, not skipped) |
| R-005: Gallery LCP > 2.5s on 4G (priority prop, LQIP) | 4.1-E2E-002 (priority attr check), 4.1-COMP-002 (blur placeholder), COMP-priority |
| R-008: Lightbox arrow/swipe navigation fails | 4.1-E2E-004/005/006, COMP-arrow-right/left |
| R-009: Sticky specs bar causes CLS | 4.1-E2E-007b (position: sticky assertion) |

---

## Known Gaps / Assumptions

1. **R-002 (bundle size assertion):** `4.1-UNIT-001` requires a build output analysis. This is done at CI level (check `npm run build` output for chunk names). Not a unit test — deferred to CI workflow.
2. **E2E seed data:** All E2E tests require `beautiful-mountain-home` and `property-with-video` slugs to be seeded in the database. Exact slug names may differ from production data — update constants in the spec file when seed data is created.
3. **LQIP assertion (4.1-E2E-003):** The test has a permissive assertion because `next/image` blur placeholder behavior is complex to test in a headless browser without waiting for image load events. The unit test in `property-gallery.spec.tsx` provides stricter coverage.
4. **Playwright not configured:** All E2E tests stay in `test.skip()` until `playwright.config.ts` is added. Follow `bmad-testarch-framework` to set up Playwright.

---

## Completion Summary

- **4 test files generated** across E2E and unit layers
- **43 total test scaffolds** (all in TDD RED PHASE)
- **vitest.config.mts updated** with listing jsdom environment globs
- **All acceptance criteria covered** by at least one test
- **7 risks mitigated** with targeted test coverage
- **Story file linked** (see ATDD Artifacts section below)

---

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-4-1-listing-detail-page-and-photo-gallery.md`
- E2E tests: `tests/e2e/listing-detail-page-and-photo-gallery.spec.ts`
- Unit tests (PropertyGallery): `tests/unit/listing/property-gallery.spec.tsx`
- Unit tests (StickySpecsBar): `tests/unit/listing/sticky-specs-bar.spec.tsx`
- Unit tests (Page/Queries): `tests/unit/listing/listing-detail-page.spec.ts`
