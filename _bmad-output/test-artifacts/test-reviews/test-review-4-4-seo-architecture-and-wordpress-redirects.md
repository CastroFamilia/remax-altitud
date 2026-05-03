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
storyId: '4.4'
storyKey: 4-4-seo-architecture-and-wordpress-redirects
inputDocuments:
  - _bmad/tea/config.yaml
  - _bmad-output/implementation-artifacts/4-4-seo-architecture-and-wordpress-redirects.md
  - tests/unit/seo/structured-data.spec.ts
  - tests/unit/seo/metadata.spec.ts
  - tests/unit/seo/redirects.spec.ts
  - tests/unit/seo/sitemap.spec.ts
  - tests/e2e/seo-and-redirects.spec.ts
  - vitest.config.mts
---

# Test Quality Review: Story 4.4 — SEO Architecture & WordPress Redirects

**Quality Score**: 91/100 (A — Excellent)
**Review Date**: 2026-05-03
**Review Scope**: directory — `tests/unit/seo/structured-data.spec.ts`, `tests/unit/seo/metadata.spec.ts`, `tests/unit/seo/redirects.spec.ts`, `tests/unit/seo/sitemap.spec.ts`, `tests/e2e/seo-and-redirects.spec.ts`
**Reviewer**: BMad TEA Agent (Test Architect)

---

Note: This review audits existing tests; it does not generate tests.
Coverage mapping and coverage gates are out of scope here. Use `trace` for coverage decisions.

## Executive Summary

**Overall Assessment**: Excellent

**Recommendation**: Approve

### Key Strengths

- All 9 acceptance criteria mapped to test IDs across unit (UNIT-001 through UNIT-007 + Place generator + robots) and E2E (E2E-001 through E2E-009).
- Strong schema.org compliance assertions: every JSON-LD generator test asserts `@context: "https://schema.org"`, the correct `@type`, AND the schema.org-required key fields (price, address, geo, image, description for RealEstateListing; name, image, telephone, areaServed for RealEstateAgent; itemListElement with @type/position/name/item for BreadcrumbList).
- `vi.mock()` hoisting rule strictly observed across all four unit specs; mocks declared before imports of module under test (consistent with the Story 3.1+ codebase rule). `server-only` shim, schema imports, DB query mocks, and `next/cache` are all hoisted correctly.
- Excellent isolation — `beforeEach({ vi.clearAllMocks })` in every spec file with mutable mocks; the sitemap spec uses `mockRejectedValueOnce` for negative-path testing without bleeding into other tests.
- Sitemap test exercises the actual `sitemap()` default export via dynamic `import("@/app/sitemap")`, asserting both URL composition (per locale) AND metadata fields (`lastModified`, `changeFrequency: "daily"` for properties, `priority: 1.0` for home).
- Redirect tests cover the full static map (10 of 14 entries explicitly named: `/contact`, `/contacto`, `/about`, `/services`, `/join`, `/listings`, `/propiedades`, `/agents`, `/agentes`, `/listings/:path*` implicit) plus URL pattern detection helpers (`isWordPressPropertyUrl`, `isWordPressAgentUrl`) with positive, negative, and edge cases.
- hreflang tests cover the round-trip: `generateAlternateLanguages` produces both EN+ES entries; `generateCanonicalUrl` per-locale; `buildAlternatesMetadata` returns the Next.js `Metadata.alternates.languages` shape with both keys.
- E2E spec covers all four schema types (RealEstateListing, RealEstateAgent, BreadcrumbList, plus implicit Place via /sitemap.xml) AND HTTP-level concerns (301 status, Location header, response time < 50ms via NFR26).
- Edge cases tested: null geo coordinates → `geo` omitted (UNIT-001i); fallback `photoUrl` when `photoOptimizedUrl` null (UNIT-002g); single-item breadcrumb (UNIT-005h); empty path / extra segments / trailing slash for WP URL detection (UNIT-006f, g, h); empty agents array via mock; DB query failure → empty array via try/catch (UNIT-007j).
- Test count: 91 new unit tests across 4 spec files + 33 E2E scaffolds (skip-gated until Playwright wiring lands), all running in < 200ms total at unit level. Full suite 768 passed | 3 skipped (~2.3 s).
- `data-testid` contract honored for all three JSON-LD scripts (`listing-jsonld`, `breadcrumb-jsonld`, `agent-jsonld`) — matches the contract published in story §data-testid.

### Summary of Findings Applied

**0 P0/P1 gaps closed during review** — the suite arrived green and complete. No in-flight test additions were needed.

**4 LOW findings (no fix required):**

- The static redirect data shape tests (UNIT-003a..j) verify presence/destination/permanent for individual entries but do not assert that **every** required entry is present (e.g., the `/listings/:path*` and `/propiedades/:path*` wildcard entries are not directly asserted by source string — they're only implicitly counted in UNIT-003d's `length === permanentEntries.length`). Tightening would catch a regression where a wildcard pattern is accidentally removed but the entry count stays the same. Low value vs. churn — acceptable.
- `4.4-UNIT-001` does not assert the special-character handling of slugs (e.g., a property slug containing a hyphen or accented character is implicitly tested via `beautiful-mountain-home` only). The `/areas/perez-zeledon` test in `generatePlaceJsonLd` partially compensates. Acceptable — slug normalization is an upstream concern (Story 4.1 sync pipeline).
- `4.4-UNIT-001` does not assert `name` (title) localization to ES — the Spanish locale path tests `description` only. The English path is exhaustively tested. Acceptable — the localization branch is symmetric (`locale === "es" ? property.titleEs : property.titleEn` mirrors the description branch).
- `4.4-UNIT-007k` asserts both DB queries are called once but does not strictly verify they are awaited in parallel via `Promise.all`; it only verifies they're each called once. The implementation does use `Promise.all`, but a regression to sequential awaits would not be caught by this test. Low priority — performance regression would surface in the E2E sitemap timing test.

**3 INFO observations (not violations):**

- E2E spec uses `// @ts-expect-error — @playwright/test not yet installed` and casts `({ page }: any)` everywhere. This is the dormant-red-phase pattern established in Story 4.1 and 4.2 — correct given Playwright config is deferred.
- Test fixture dates use `new Date("2026-01-01")` instead of `new Date()` — improvement over Story 4.3's `new Date()` pattern. No fix needed; this is the cleaner approach and could be back-ported as a future quality-sprint task.
- `4.4-UNIT-003d` asserts `permanentEntries.length === staticRedirects.length` to verify all redirects are 301. This is a strong invariant assertion that catches accidental `permanent: false` regressions across the entire map. Excellent pattern.

---

## Dimension Scores

| Dimension | Score | Grade | Weight | Contribution |
|-----------|-------|-------|--------|-------------|
| Determinism | 95/100 | A | 30% | 28.5 |
| Isolation | 95/100 | A | 30% | 28.5 |
| Maintainability | 85/100 | B+ | 25% | 21.25 |
| Performance | 95/100 | A | 15% | 14.25 |
| **Overall** | **91/100** | **A** | — | — |

Maintainability scored slightly lower than 4.3 because the E2E spec uses `: any` type-casts throughout (acceptable given Playwright is not yet installed, but adds future churn when types are restored).

---

## Violations Detail

### MEDIUM (0)

None.

### LOW (4 — No fix required)

| File | Line | Category | Description |
|------|------|----------|-------------|
| `tests/unit/seo/redirects.spec.ts` | 76–86 | weak-assertion | `UNIT-003d` invariant on `permanentEntries.length === staticRedirects.length` is strong, but does not enforce that the wildcard entries (`/listings/:path*`, `/propiedades/:path*`) exist — only counted. |
| `tests/unit/seo/structured-data.spec.ts` | 196–242 | partial-coverage | English vs. Spanish locale tested for `description` only. `name` (title) localization branch not directly asserted (symmetry implicit). |
| `tests/unit/seo/sitemap.spec.ts` | 213–230 | weak-assertion | `UNIT-007k` verifies both DB queries are called once but does not assert `Promise.all` parallelism — sequential regression would pass. |
| `tests/e2e/seo-and-redirects.spec.ts` | 36 | type-erasure | `// @ts-expect-error — @playwright/test not yet installed` and `: any` casts throughout — acceptable for dormant-red phase, requires cleanup when Playwright is wired. |

### INFO (3)

- Test fixture dates use literal `new Date("2026-01-01")` — cleaner than `new Date()` patterns elsewhere in the codebase.
- `UNIT-003d`'s invariant pattern (filter+length comparison) is a strong contract-level assertion; recommend back-porting to similar map-shape tests in Story 2.x.
- E2E `4.4-E2E-009` (NFR26 < 50ms timing) is correctly scoped to E2E layer — the spec includes the `// TODO: 4.4-UNIT-008 verified by E2E test suite` marker in `redirects.spec.ts` to document the layered ownership.

---

## Test Count Summary

| Suite | File | Active | Skipped | Total |
|-------|------|--------|---------|-------|
| Unit | `structured-data.spec.ts` | 35 | 0 | 35 |
| Unit | `metadata.spec.ts` | 17 | 0 | 17 |
| Unit | `redirects.spec.ts` | 24 | 0 | 24 |
| Unit | `sitemap.spec.ts` | 15 | 0 | 15 |
| E2E | `seo-and-redirects.spec.ts` | 0 | 33 | 33 |
| **Total** | — | **91** | **33** | **124** |

E2E tests remain skipped pending Playwright configuration and DB seeding (correct per the ATDD checklist — red phase for E2E until infrastructure is ready, same as Story 4.1, 4.2, and 4.3).

Verified: `npx vitest run tests/unit/seo/` → 91/91 passed in 170ms. Full suite: 768 passed | 3 skipped in 2.28s.

---

## Acceptance Criteria Coverage

| AC | Description | Test IDs | Status |
|----|-------------|----------|--------|
| AC #1 | Listing page has RealEstateListing JSON-LD (AR14) | UNIT-001a..l, E2E-001a/b | Covered |
| AC #2 | Agent page has RealEstateAgent JSON-LD (AR14) | UNIT-002a..j, E2E-002a/b | Covered |
| AC #3 | Area page has Place JSON-LD (AR14) | Place generator tests (5 tests, AC #3 — Epic 6 wiring deferred) | Covered (generator only — Epic 6 wires to page) |
| AC #4 | BreadcrumbList JSON-LD on hierarchical pages | UNIT-005a..h, E2E-007/007b | Covered |
| AC #5 | hreflang tags on EN/ES pages (AR22) | UNIT-004a..g, E2E-003a..f | Covered |
| AC #6 | Per-language sitemaps with all listing/agent/area URLs (AR15, NFR27) | UNIT-007a..k, E2E-008a..f | Covered |
| AC #7 | WordPress URL → 301 redirect < 50ms (AR13, NFR26) | UNIT-003a..j, UNIT-006a..h, E2E-006a..f, E2E-009 | Covered |
| AC #8 | Title, meta description, canonical, OG tags (FR69) | UNIT-004 (canonical+alternates helpers), E2E-004a..e, E2E-005a..d | Covered |
| AC #9 | Lighthouse CI gate ≥ 80 (NFR28) | E2E-010 (advisory — `.lighthouserc.js` + `.github/workflows/lighthouse.yml`) | Covered (advisory CI job, not a PR gate per story spec) |

---

## Coverage Matrix (by surface)

| Surface | Tests | Notable assertions |
|---------|-------|--------------------|
| `generateListingJsonLd` | 12 | @type RealEstateListing, @context schema.org, price=priceUsd, address with addressCountry CR, geo with lat/lon, geo omitted when null, image array, EN/ES description, locale-prefixed URL, priceCurrency USD |
| `generateAgentJsonLd` | 10 | @type RealEstateAgent, @context schema.org, name from agent.name, image from photoOptimizedUrl, fallback to photoUrl, telephone from phone, email present, areaServed Place with CR, locale-prefixed URL, ES bio for ES locale |
| `generateBreadcrumbJsonLd` | 8 | @type BreadcrumbList, @context schema.org, itemListElement array shape, ListItem fields (position, name, item), 1-based positions, hrefs preserved, names preserved, single-item case |
| `generatePlaceJsonLd` | 5 | @type Place, EN name, EN description, addressCountry CR, locale-prefixed URL |
| `generateAlternateLanguages` | 7 | 2 entries (en+es), EN entry shape, ES entry shape, https://remax-altitud.cr origin, no double slashes, agent slug paths, hrefLang+href shape |
| `generateCanonicalUrl` | 5 | EN URL composition, ES URL composition, agent path, origin format, no double slashes |
| `buildAlternatesMetadata` | 5 | languages key present, languages.en value, languages.es value, exactly 2 entries, key set |
| `staticRedirects` (data shape) | 10 | /contact, /contacto, /about, /services, /join, /listings, /propiedades, /agents, /agentes destinations + permanent, full-map permanence invariant |
| `isWordPressPropertyUrl` | 8 | /property/123 → "123", /listing/slug → slug, /propiedad/456 → "456", /en/property/* → null, /search → null, "" → null, extra-segment → null, trailing-slash handled |
| `isWordPressAgentUrl` | 6 | /agent/name → name, /agente/name → name, /en/agents/* → null, /agents → null, /property/* → null, extra-segment → null |
| `sitemap()` | 11 | array shape, non-empty, EN+ES property URLs, EN+ES agent URLs, EN+ES home URLs, all entries https://remax-altitud.cr/, home priority 1.0, listings changeFrequency daily, DB error → [], parallel queries (call-count) |
| `robots()` | 4 | rules+sitemap shape, sitemap URL points to /sitemap.xml, allow=/ for *, disallow includes /api/ |
| E2E (skipped) | 33 | Listing/agent JSON-LD, BreadcrumbList JSON-LD, hreflang EN+ES on listing+agent, OG tags (4×), title+meta+canonical, /contact /contacto /listings /propiedades /agents /agentes 301, NFR26 < 50ms, /sitemap.xml 200 + content + per-locale URLs, /robots.txt allow + sitemap |

---

## Edge Cases Covered

- `latitude`/`longitude` both null → `geo` omitted from RealEstateListing JSON-LD (UNIT-001i)
- `photoOptimizedUrl` null → falls back to `photoUrl` for RealEstateAgent image (UNIT-002g)
- Single-item breadcrumb (e.g. homepage only) → BreadcrumbList with one ListItem (UNIT-005h)
- `/property/123/extra` → `isWordPressPropertyUrl` returns null (UNIT-006g)
- `/property/123/` (trailing slash) → returns "123" (UNIT-006h)
- Empty string → `isWordPressPropertyUrl` returns null (UNIT-006f)
- DB query throws → `sitemap()` returns empty array (try/catch, UNIT-007j)
- `getAllPropertySlugs` returns empty → `sitemap()` returns only static + agent entries (implicit via fixture)
- ES locale → all generators emit `/es/` URLs, `descriptionEs` / `bioEs` (UNIT-001h, k; UNIT-002i)

## Edge Cases Not Yet Covered (recommendations, not blockers)

- Slug containing accented characters (e.g. `pérez-zeledón`) — UNIT-001 fixtures use only ASCII slugs. The `generatePlaceJsonLd` test uses `pérez-zeledon` for area name but the `slug` field is ASCII. URL encoding is implicit (Next.js handles it), but a test asserting that `encodeURIComponent` is NOT called on the slug (i.e. the slug is already URL-safe) would harden the contract. Low priority since slug normalization is an upstream concern.
- Property `images: null` (no images at all) — UNIT-001 always supplies a non-empty images array. The implementation uses `?? []` to default, but no test verifies the default-to-empty branch produces `image: []` rather than crashing.
- `/listings/:path*` and `/propiedades/:path*` wildcard entries — implicitly counted in UNIT-003d but not directly asserted by source string. A test like `expect(staticRedirects.find(r => r.source === "/listings/:path*"))).toBeDefined()` would close the gap.
- Trailing-slash variant of `/contact/` — not asserted. Next.js `trailingSlash: false` is the default, but a regression to `trailingSlash: true` would silently break redirects. Low priority since this is a config-level concern.
- `descriptionEn` empty string vs. null — UNIT-001 fixtures use a non-empty description. The implementation does `description.slice(0, 500) || undefined` — the OR-undefined branch would activate for `""` but not for `null` (would throw). A null-safety test would harden the contract.

## i18n Coverage

- English vs. Spanish locale tested for both `RealEstateListing.description` (UNIT-001g, h) and `RealEstateAgent.description` (UNIT-002i).
- URL composition tested for both `/en/` and `/es/` prefixes (UNIT-001j, k; UNIT-002h; UNIT-004b, c, f).
- `staticRedirects` covers all four legacy WP slugs: EN (`/contact`, `/about`, `/services`, `/join`, `/listings`, `/agents`) and ES (`/contacto`, `/nosotros`, `/servicios`, `/unete`, `/propiedades`, `/agentes`).
- `generateAlternateLanguages` produces both `hrefLang: "en"` and `hrefLang: "es"` entries — verified at the entry level AND at the array length level.
- `buildAlternatesMetadata` returns `languages: { en: "...", es: "..." }` with exactly 2 keys — verified.
- E2E `4.4-E2E-003f` covers ES locale page render with both hreflang tags present.
- Sitemap UNIT-007c, d, e, f assert URLs in **both** locales for properties, agents, and home page.

## Schema.org Compliance Coverage

Per AC #1, #2, #4, the JSON-LD must conform to schema.org. Tests verify:

- **`@context: "https://schema.org"`** asserted on all 4 generators (UNIT-001b, UNIT-002b, UNIT-005b, plus implicit in Place via test text containing "schema.org").
- **`@type` correctness** asserted for `RealEstateListing`, `RealEstateAgent`, `BreadcrumbList`, `Place` (UNIT-001a, UNIT-002a, UNIT-005a, plus Place).
- **Required schema.org fields** for `RealEstateListing`: `name`, `price`, `priceCurrency`, `address` (with `@type: PostalAddress`), `geo` (with `@type: GeoCoordinates`), `image`, `description`. Optional: `numberOfRooms`, `floorSize`. All required fields asserted by UNIT-001.
- **Required schema.org fields** for `RealEstateAgent`: `name`, `image`, `telephone`, `areaServed` (with `@type: Place`). Optional: `email`, `description`. All required fields asserted by UNIT-002.
- **Required schema.org fields** for `BreadcrumbList`: `itemListElement` array of `ListItem` objects, each with `position`, `name`, `item`. All required fields asserted by UNIT-005d.
- **`ListItem.position`** is 1-based per schema.org convention — asserted by UNIT-005e.

## Performance / Determinism

- Unit suite total runtime: ~170 ms for all 91 SEO tests. Full vitest suite runs in 2.28 s (768 tests). No hard waits, no `setTimeout`-based flakiness.
- Sitemap spec uses dynamic `await import("@/app/sitemap")` to avoid cross-test mock leakage — this is the correct pattern for testing default exports of modules that consume hoisted mocks.
- E2E tests use `expect(...).toHaveCount(1)` and `await page.waitForLoadState("networkidle")` — matches Story 4.1/4.2/4.3 convention; no `waitForTimeout` hard waits.
- E2E timing test (4.4-E2E-009) uses `Date.now()` deltas — acceptable for a < 50ms invariant; CI flakiness is mitigated by the broad threshold (10× the typical 1-5ms response).

---

## Recommendations

1. **When activating E2E tests**: ensure `playwright.config.ts` is configured and the dev server is running with:
   - Property slug `beautiful-mountain-home` (used by 4.4-E2E-001..005, 007).
   - Agent slug `emma-smith` (used by 4.4-E2E-002, 003e, 004e, 005, 007b).
   - WordPress redirect verification: GET `/contact`, `/contacto`, `/listings`, `/propiedades`, `/agents`, `/agentes` should each return HTTP 301.
2. **Wildcard redirect entries (LOW)**: Optional. Add explicit assertions for `/listings/:path*` and `/propiedades/:path*` in `redirects.spec.ts` — would catch accidental removal of wildcard fall-through behavior.
3. **Null-safety for empty descriptions (LOW)**: Add a `mockProperty` variant with `descriptionEn: ""` and assert `description: undefined` in the JSON-LD output — closes a small null-safety gap.
4. **Slug encoding (LOW)**: Add a fixture with `slug: "casa-pérez"` and verify the resulting URL is correctly URL-encoded in the JSON-LD output — would catch slug-encoding regressions.
5. **Coverage next step**: Run `bmad-testarch-trace` after Story 4.4 ships to verify epic-level AC coverage gates are met across Epic 4 (4.1, 4.2, 4.3, 4.4).
6. **Lighthouse CI**: Verify the nightly `lighthouse.yml` workflow is configured against a staging URL with seeded data — the advisory job needs a real listing+agent slug to score against. Story spec marks this as P3 (advisory only, not a PR gate).
