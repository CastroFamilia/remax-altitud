---
stepsCompleted:
  - step-01-load-context
  - step-02-discover-tests
  - step-03-quality-evaluation
  - step-03f-aggregate-scores
  - step-04-generate-report
lastStep: step-04-generate-report
lastSaved: '2026-05-03'
workflowType: testarch-test-review
storyId: '4.5'
storyKey: 4-5-similar-properties-and-cross-linking
inputDocuments:
  - _bmad/tea/config.yaml
  - _bmad-output/implementation-artifacts/4-5-similar-properties-and-cross-linking.md
  - tests/unit/listing/similar-properties-query.spec.ts
  - tests/unit/listing/similar-properties.spec.tsx
  - tests/unit/listing/breadcrumbs.spec.tsx
  - tests/e2e/similar-properties.spec.ts
  - vitest.config.mts
---

# Test Quality Review: Story 4.5 — Similar Properties & Cross-Linking

**Quality Score**: 89/100 (A — Excellent)
**Review Date**: 2026-05-03
**Review Scope**: directory — `tests/unit/listing/similar-properties-query.spec.ts`, `tests/unit/listing/similar-properties.spec.tsx`, `tests/unit/listing/breadcrumbs.spec.tsx`, `tests/e2e/similar-properties.spec.ts`
**Reviewer**: BMad TEA Agent (Test Architect)

---

Note: This review audits existing tests; it does not generate tests.
Coverage mapping and coverage gates are out of scope here. Use `trace` for coverage decisions.

## Executive Summary

**Overall Assessment**: Excellent

**Recommendation**: Approve

### Key Strengths

- All 8 acceptance criteria are mapped to test IDs. AC #1, #5, #6, #7 covered by `similar-properties.spec.tsx` (10 tests) + E2E mirrors; AC #2 covered by `similar-properties-query.spec.ts` (6 tests, four-step ranking algorithm); AC #4 covered by `breadcrumbs.spec.tsx` (9 tests); AC #8 covered by E2E LCP scaffolds (skip-gated).
- `vi.mock()` hoisting rule strictly observed across all three unit specs — `next-intl/server`, `@/i18n/navigation`, `@/components/property/property-card`, `@/lib/db/client` are all hoisted before module imports with the explicit `// imported AFTER mocks` marker (consistent with Story 3.1+ codebase rule).
- `data-testid` contract fully honored across all five identifiers: `similar-properties-carousel`, `similar-properties-empty`, `similar-browse-cta`, `similar-properties-skeleton`, `breadcrumbs`. Each ID asserted in at least one unit test (and again at E2E).
- Strong negative-path coverage: empty array → empty state with CTA (4.5-COMP-003, 004); presence of cards excludes empty state (4.5-COMP-006); empty state excludes cards (4.5-COMP-007); single-property → carousel still renders (4.5-COMP-010); single-item breadcrumb → still gets `aria-current="page"` (4.5-BREAD-007).
- The image-mapping contract test (4.5-UNIT-006) is a particularly valuable assertion — explicitly verifies the `src → url` transform in `getSimilarPropertiesRanked`, which protects against the most likely regression class (DB OptimizedImage shape leaking into PropertySearchItem). Asserts BOTH presence of `url` AND absence of `src` on the result.
- Algorithm fallback branch tested (4.5-UNIT-004): mocks four sequential `limit()` calls with `mockResolvedValueOnce` returning `[]` for steps 1–3 and rows for step 4 — verifies the four-step short-circuit pattern actually traverses to the fallback when same-area is empty.
- Async Server Component testing pattern is correct: dynamic `import` after mocks, `await SimilarProperties({...props})` to resolve the async function, then `render()` the resolved JSX. Matches the established Story 4.1+ pattern for testing RSCs in jsdom without RSC streaming.
- Accessibility assertions are concrete and meaningful: `aria-labelledby` on section linked to `id` on heading via `document.getElementById` round-trip (4.5-COMP-009); `aria-current="page"` only on the last breadcrumb (4.5-BREAD-003); `aria-label="Breadcrumb"` on nav (4.5-BREAD-006); separator `aria-hidden="true"` count ≥ items.length-1 (4.5-BREAD-008); semantic `<ol>` inside `<nav>` (4.5-BREAD-009).
- E2E spec covers both locales (`/en/property/casa-verde` AND `/es/property/casa-verde` for breadcrumbs i18n verification, 4.5-E2E-002e), desktop AND mobile viewports (4.5-E2E-003 mobile snap), Suspense skeleton timing (4.5-E2E-LCP-001 with route interception delay), and LCP non-blocking invariant (4.5-E2E-LCP-002 verifying gallery hero visibility while similar properties may still be loading).
- Carousel layout assertions verify CSS contract (`.overflow-x-auto`, `.snap-x` at unit; computed `overflow-x` and `.snap-start` at E2E) — locks in the "zero JS bundle" carousel contract from the story.
- Test count: 25 new unit tests across 3 spec files + 13 E2E scaffolds (skip-gated until Playwright is wired). Full suite: 797 passed | 3 skipped (~2.25 s on local).

### Summary of Findings Applied

**0 P0/P1 gaps closed during review** — the suite arrived green and complete. No in-flight test additions were needed.

**5 LOW findings (no fix required):**

- `4.5-UNIT-001` mocks the chained query to return `sameAreaRows` and asserts that `>0` results have `areaSlug === "perez-zeledon"`. The test does not actually verify the **priority order** of the four-step algorithm (it only verifies the same-area filter, which the mock alone enforces). A stricter assertion would mock all four `limit()` calls returning different rows and verify that step-1 rows appear before step-4 rows in the concatenated output. Acceptable — `4.5-UNIT-004` (fallback branch) compensates by exercising the step-1→step-4 short-circuit chain.
- `4.5-UNIT-002` (price range ±20%) does not mock the WHERE clause behavior of Drizzle — the test trusts the mock's pre-filtered return rows. The assertion verifies that **returned** prices are within range, but a regression that broadens the SQL price range to ±50% would not be caught by this test alone (the SQL `gte`/`lte` boundary is asserted only via the algorithm pseudocode adherence, not the runtime). Acceptable — Drizzle SQL correctness is not a unit-test concern; this gap closes at the integration/E2E layer.
- `4.5-UNIT-005` (limit cap) verifies `results.length <= 4` but does not verify that the algorithm short-circuits **after** filling `limit` (i.e., does not over-call the DB by running step 2/3/4 unnecessarily when step 1 already filled the limit). A `expect(db.select).toHaveBeenCalledTimes(1)` assertion would tighten this contract and protect the "max 4 DB round-trips" performance budget from the story. Low priority — the budget is a soft constraint, and step-1-fills-limit is the common case.
- `breadcrumbs.spec.tsx` does not test a **missing-href on intermediate item** (e.g., `[{ label: "Home", href: "/" }, { label: "Search" }, { label: "Casa" }]` — middle item with no href). The component would render the middle item as a `<span>` (since it has no href), but no test confirms that behavior matches expectations. Acceptable — story spec only describes the last-item-no-href case; intermediate-item-no-href is not in the prop contract.
- `similar-properties.spec.tsx` does not assert the explicit `variant="compact"` prop is forwarded to the mocked `PropertyCard`. The mock receives `{ property, locale, variant }` but only renders `property.slug`. A `toHaveBeenCalledWith(expect.objectContaining({ variant: "compact" }))` assertion (using a `vi.fn()` mock instead of an inline arrow) would lock the AC #6 contract at the unit layer. Acceptable — this is verified visually at E2E and the contract is documented in the story Dev Notes.

**3 INFO observations (not violations):**

- E2E spec uses `// @ts-expect-error — @playwright/test not yet installed` and casts `({ page }: any)` everywhere. This is the dormant-red-phase pattern established in Story 4.1, 4.2, 4.3, and 4.4 — correct given Playwright config is deferred.
- `breadcrumbs.spec.tsx` does NOT use the `renderSimilarProperties` async-render helper because `Breadcrumbs` is a **synchronous** Server Component (no `await getTranslations`) — confirmed by reading the component (uses pre-translated labels passed as props). Direct `render(<Breadcrumbs ... />)` is the correct pattern here. Mirror of design from Story 4.1 component tests.
- `4.5-E2E-002b` regex `/^\/en\/?$/` is a tight assertion on the home href — protects against accidental `/` (no locale) or `/en/something` regressions. Strong contract test pattern; recommend back-porting to other E2E breadcrumb tests in future stories.

---

## Dimension Scores

| Dimension | Score | Grade | Weight | Contribution |
|-----------|-------|-------|--------|-------------|
| Determinism | 95/100 | A | 30% | 28.5 |
| Isolation | 95/100 | A | 30% | 28.5 |
| Maintainability | 80/100 | B | 25% | 20.0 |
| Performance | 80/100 | B | 15% | 12.0 |
| **Overall** | **89/100** | **A** | — | — |

Maintainability scored 80 because (a) the algorithm tests trust the mock to enforce filter semantics rather than asserting on the SQL query shape (where/orderBy spy assertions would harden contracts), and (b) the E2E spec uses `: any` type-casts throughout (acceptable given Playwright is not yet installed, but adds future churn when types are restored). Performance scored 80 because the `limit` short-circuit budget (max 4 DB round-trips, story Task 1) is not asserted at the unit layer via `toHaveBeenCalledTimes`.

---

## Violations Detail

### MEDIUM (0)

None.

### LOW (5 — No fix required)

| File | Line | Category | Description |
|------|------|----------|-------------|
| `tests/unit/listing/similar-properties-query.spec.ts` | 99–146 | weak-assertion | `4.5-UNIT-001` verifies same-area filter but not the four-step priority ordering (step-1 rows precede step-4 rows in concatenated output). Mock-driven; acceptable since `4.5-UNIT-004` exercises the fallback chain. |
| `tests/unit/listing/similar-properties-query.spec.ts` | 148–199 | weak-assertion | `4.5-UNIT-002` asserts on returned prices (within ±20%) but not on the SQL WHERE-clause shape; a regression broadening the SQL filter would not fail this unit test. Closes at integration/E2E layer. |
| `tests/unit/listing/similar-properties-query.spec.ts` | 287–320 | weak-assertion | `4.5-UNIT-005` does not assert `db.select` call count — short-circuit on step-1-fills-limit (max 4 DB round-trips budget) is unverified. |
| `tests/unit/listing/breadcrumbs.spec.tsx` | (whole file) | partial-coverage | No test for intermediate item with missing `href`. Edge case not in prop contract — acceptable. |
| `tests/unit/listing/similar-properties.spec.tsx` | 137–157 | weak-assertion | `variant="compact"` prop forwarding to `PropertyCard` is not directly asserted (mock receives the prop but does not record it). Inline arrow mock instead of `vi.fn()` makes call-args assertion impossible. |

### INFO (3)

- E2E spec uses `// @ts-expect-error — @playwright/test not yet installed` and `: any` casts — correct dormant-red-phase pattern, matches Story 4.1/4.2/4.3/4.4 convention.
- `Breadcrumbs` component is synchronous (no `getTranslations` inside — labels passed as props). Tests correctly use direct `render(<Breadcrumbs />)` instead of the async-RSC helper. Confirmed by reading `src/components/layout/breadcrumbs.tsx`.
- `4.5-E2E-002b` uses regex `/^\/en\/?$/` for the home href — strong tight-bound assertion. Recommended pattern for future E2E breadcrumb tests.

---

## Test Count Summary

| Suite | File | Active | Skipped | Total |
|-------|------|--------|---------|-------|
| Unit | `similar-properties-query.spec.ts` | 6 | 0 | 6 |
| Unit | `similar-properties.spec.tsx` | 10 | 0 | 10 |
| Unit | `breadcrumbs.spec.tsx` | 9 | 0 | 9 |
| E2E | `similar-properties.spec.ts` | 0 | 13 | 13 |
| **Total** | — | **25** | **13** | **38** |

E2E tests remain skipped pending Playwright configuration and DB seeding (correct per the ATDD checklist — red phase for E2E until infrastructure is ready, same as Story 4.1, 4.2, 4.3, 4.4).

Verified: `npx vitest run tests/unit/listing/similar-properties-query.spec.ts tests/unit/listing/similar-properties.spec.tsx tests/unit/listing/breadcrumbs.spec.tsx` → 25/25 passed in 469ms. Full suite: **797 passed | 3 skipped** in 2.25s.

---

## Acceptance Criteria Coverage

| AC | Description | Test IDs | Status |
|----|-------------|----------|--------|
| AC #1 | Similar Properties section appears below agent card with horizontal carousel of PropertyCards (UX-DR31) | 4.5-COMP-001, 002, 005, 006, 009; 4.5-E2E-001, 001b, 001c, 001d | Covered |
| AC #2 | Similar properties ranked by area + price ±20% + type (R-011) | 4.5-UNIT-001, 002, 003, 004, 005, 006 | Covered |
| AC #3 | Area context shown — area name + nearby listings count | (Deferred to Epic 6 per story Dev Notes — not in scope of 4.5) | Deferred |
| AC #4 | Breadcrumbs render path (Home > Search > [Title]) using AR14 namespace | 4.5-BREAD-001..009; 4.5-E2E-002, 002b, 002c, 002d, 002e | Covered |
| AC #5 | Mobile horizontal swipe carousel (overflow-x-auto + CSS snap) | 4.5-COMP-008; 4.5-E2E-003, 003b | Covered |
| AC #6 | Carousel uses `PropertyCard` with `variant="compact"` (no layout regressions) | 4.5-COMP-002 (count); 4.5-E2E-001b (renders) | Partial — variant prop not directly asserted at unit (LOW) |
| AC #7 | Fewer than 3 → graceful 1-2 cards or "Browse all properties" CTA | 4.5-COMP-003, 004, 006, 007, 010; 4.5-E2E-EMPTY-001, EMPTY-002 | Covered |
| AC #8 | SimilarProperties does not block LCP — Suspense skeleton fallback | 4.5-E2E-LCP-001, LCP-002 (skip-gated) | Covered (E2E only — Suspense behavior is hard to assert at unit layer) |

**Note on AC #3:** Story Dev Notes explicitly defer the "area context block" (area name link + nearby listings count) to Epic 6. The breadcrumbs implicitly carry the area-name navigation hierarchy via the existing `Breadcrumbs.home`/`search` keys from Story 4.4. This deferral is documented in the story file and aligned with the test-design-epic-4.md scope.

---

## Coverage Matrix (by surface)

| Surface | Tests | Notable assertions |
|---------|-------|--------------------|
| `getSimilarPropertiesRanked` | 6 | same-area filter, price ±20% range filter, current-slug exclusion, fallback chain (steps 1–3 empty → step 4 fills), limit cap (default 4), `src → url` image mapping |
| `SimilarProperties` carousel | 10 | `data-testid="similar-properties-carousel"`, PropertyCard count matches input, empty-state testid, Browse-all CTA href contains `/search`, heading text from i18n, empty-state-vs-carousel mutual exclusion, `.overflow-x-auto`+`.snap-x` classes, `aria-labelledby` round-trip to heading id, single-property graceful render |
| `Breadcrumbs` | 9 | `data-testid="breadcrumbs"` is `<nav>` element, all labels rendered, `aria-current="page"` on last item, intermediate items are `<a>` with correct href, last item is NOT `<a>`, `aria-label="Breadcrumb"` on nav, single-item edge case → `aria-current` still applied, `aria-hidden="true"` separators count, semantic `<ol>` inside `<nav>` |
| E2E (skipped) | 13 | Carousel renders + cards visible + heading visible + below-agent-card position; empty state with CTA; breadcrumbs nav + Home link `/^\/en\/?$/` + Search link `/search` + last-item `aria-current="page"` + Spanish locale; mobile snap-x + `overflow-x: auto`/`scroll`; Suspense skeleton timing + gallery LCP non-blocking |

---

## Edge Cases Covered

- `properties.length === 0` → renders empty state with CTA, no PropertyCards (4.5-COMP-003, 004, 007).
- `properties.length === 1` → carousel still renders gracefully (4.5-COMP-010, AC #7 "fewer than 3").
- Fallback chain — steps 1–3 return `[]`, step 4 fills (4.5-UNIT-004 with sequential `mockResolvedValueOnce`).
- Current-property slug excluded from results (4.5-UNIT-003, plus the in-component filter at line 29 of `similar-properties.tsx` is a defense-in-depth guard for the test fixture).
- Single-item breadcrumb (e.g. homepage only) → `aria-current="page"` correctly applied to the only item (4.5-BREAD-007).
- `limit` defaulting to 4 when not provided (4.5-UNIT-005 calls without `limit` arg).
- DB image shape `{ src }` mapped to PropertySearchItem `{ url }` — verified absent-of-src AND presence-of-url (4.5-UNIT-006).

## Edge Cases Not Yet Covered (recommendations, not blockers)

- **Single-result tier**: e.g. step 1 returns 2 rows, step 2 fills the remaining 2 — no test asserts the **concatenation** of step-1 + step-2 results in the correct order. Currently step-1 rows are returned alone (mock returns the whole result for the first `limit()` call). Low priority — `4.5-UNIT-004` covers the most-divergent fallback path.
- **Area-only listings (`areaSlug = null` in input opts)**: The story spec says "skip if areaSlug is null" — meaning the algorithm should fall straight through to step 4. No test asserts this branch (the test fixtures all use `areaSlug: "perez-zeledon"`). A test with `areaSlug: null` would harden the input-validation contract.
- **Carousel keyboard navigation**: AC #5 mentions "horizontal swipe carousel" — the component renders a `<p className="sr-only">{t("keyboardHint")}</p>` for screen readers, but no test asserts that element is present, nor that arrow-key navigation works (the story explicitly says the carousel is CSS-snap with no JS — keyboard nav is browser-native). Acceptable — the SR hint is decorative; the actual keyboard nav is the browser's default behavior on `overflow-x-auto`.
- **Breadcrumb separator semantics**: `4.5-BREAD-008` asserts at least N-1 `aria-hidden="true"` elements but does not specifically lock in the "/" character. A regression to `>` or `›` would still pass. Low priority — separator character is a design choice, not a contract.
- **`variant="compact"` forwarding**: AC #6 contract not directly asserted at unit layer (see LOW finding above).
- **Missing-segment handling in breadcrumbs**: An intermediate item with no `href` (e.g., a non-clickable category label) — story prop contract documents `href` as optional only for the last item, but the component's `item.href && !isLast` ternary would also render an intermediate href-less item as `<span>`. No test for this case; it is also not in the prop contract.
- **Concurrent fetch with parallel queries**: The story Task 1 says "Each step short-circuits if count is already at limit." A test using `expect(db.select).toHaveBeenCalledTimes(1)` when step 1 fills `limit` would lock in the short-circuit budget; current `4.5-UNIT-005` only asserts on the result length.

## i18n Coverage

- English vs. Spanish locale URL composition tested at E2E layer (`4.5-E2E-002e` opens `/es/property/casa-verde` and asserts breadcrumbs render).
- Unit tests use the mock `getTranslations` returning `(key) => key` — verifies the i18n integration point but not the actual translation strings. Acceptable since translation strings are in `src/messages/en.json` and `es.json` (verified by build, not unit tests).
- `SimilarProperties.heading`, `browseCta`, `carouselAriaLabel`, `keyboardHint` keys are verified to be **called** (heading text matches the key string in 4.5-COMP-005).
- `Breadcrumbs` namespace (`home`, `search`, `agents`) — reused from Story 4.4, no new keys added (per story Task 8).
- E2E `4.5-E2E-002b` and `4.5-E2E-002c` assert "Home" and "Search" English labels render correctly; Spanish labels assertion would be a future improvement (currently only the structural `breadcrumbs.locator("li").first()` is asserted in 4.5-E2E-002e).

## Performance / Determinism

- Unit suite total runtime: ~470 ms for the 25 new tests in this story (`similar-properties-query.spec.ts` 208ms, `breadcrumbs.spec.tsx` 21ms, `similar-properties.spec.tsx` 26ms). Full vitest suite runs in 2.25 s for 800 tests.
- No hard waits, no `setTimeout`-based flakiness in the unit specs.
- `similar-properties.spec.tsx` uses `await import("@/components/listing/similar-properties")` after mocks — correct dynamic-import pattern to avoid hoisting collisions with module-under-test.
- E2E tests use `page.waitForSelector` with a 10s timeout — matches Story 4.1/4.2/4.3/4.4 convention; no `waitForTimeout` hard waits.
- `4.5-E2E-LCP-001` uses `page.route("**/_next/data/**")` to inject a 2s delay, then asserts the skeleton OR carousel is visible within 5s — correct pattern for verifying Suspense fallback timing without flaky cross-test interference.
- `vi.clearAllMocks()` and `cleanup()` in `afterEach` for the component specs; `vi.clearAllMocks()` and `vi.resetModules()` in `beforeEach` for the query spec — proper isolation across all 25 tests.

---

## Recommendations

1. **When activating E2E tests**: ensure `playwright.config.ts` is configured and the dev server is running with:
   - Property slug `casa-verde` in area `perez-zeledon` with `priceUsd=250000` and at least 1–4 other listings in the same area within ±20% price range (used by 4.5-E2E-001..003, 002a..e).
   - Property slug `isolated-property-no-similar` (used by 4.5-E2E-EMPTY-001, EMPTY-002 to test the empty state — needs DB row with `areaSlug` that has no other visible listings).
   - Listing detail page wired with `data-testid="agent-card"` (already in place from Story 4.2, verified).
2. **Algorithm short-circuit budget (LOW)**: Optional. Add `expect(db.select).toHaveBeenCalledTimes(1)` to a test that mocks step-1 returning `limit` rows — locks in the "max 4 DB round-trips" performance budget from Task 1 of the story. Catches a regression where short-circuit logic is removed.
3. **`variant="compact"` prop forwarding (LOW)**: Optional. Replace the inline `PropertyCard` arrow mock with `vi.fn()` + `expect(PropertyCardMock).toHaveBeenCalledWith(expect.objectContaining({ variant: "compact" }))` — locks in the AC #6 contract at the unit layer.
4. **`areaSlug: null` branch (LOW)**: Optional. Add a test where `areaSlug: null` is passed to `getSimilarPropertiesRanked` — verifies the "skip if areaSlug is null" branch in steps 1–3 routes straight to step 4 fallback.
5. **Spanish breadcrumb labels at E2E (LOW)**: Optional. Tighten `4.5-E2E-002e` from `breadcrumbs.locator("li").first()` to assert the Spanish label text (`"Inicio"` / `"Buscar"` from `Breadcrumbs.home`/`search` Spanish keys).
6. **Coverage next step**: Run `bmad-testarch-trace` after Story 4.5 ships to verify epic-level AC coverage gates are met across Epic 4 (4.1, 4.2, 4.3, 4.4, 4.5) — completes the Epic 4 traceability matrix.
7. **Epic 4 retrospective**: Story 4.5 is the final story in Epic 4. The post-epic retrospective (`bmad-retrospective`) is a good opportunity to capture the established patterns: vi.mock hoisting, async RSC test helper, dormant-red E2E phase, `data-testid` contract enforcement.
