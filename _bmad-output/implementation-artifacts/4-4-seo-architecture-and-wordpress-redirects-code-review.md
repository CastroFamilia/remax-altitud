# Code Review: Story 4.4 — SEO Architecture & WordPress Redirects

**Reviewer:** BMad Code Review (Step 5)
**Story Key:** 4-4-seo-architecture-and-wordpress-redirects
**Branch HEAD reviewed:** f41aaec (post test-review)
**Review Date:** 2026-05-03
**Final Score:** 92/100 (Approve — proceed to PR)

---

## Executive Summary

Story 4.4 ships a complete SEO foundation: JSON-LD generators (RealEstateListing, RealEstateAgent, BreadcrumbList, Place), hreflang/canonical helpers, dynamic XML sitemap, robots.txt, WordPress static-redirect map, WordPress URL pattern detection helpers, and an advisory Lighthouse CI workflow. 91 new unit tests pass; full suite 768 passed | 3 skipped in 2.0 s. Build succeeds (sitemap.xml + robots.txt confirmed as static routes).

Two i18n issues were found and fixed during this review. Score moves from a baseline of 88 to 92 after fixes.

---

## Adversarial Review Layers

### Layer 1 — Blind Hunter (correctness, structure, types)

| Concern | Verdict |
|---|---|
| `generateMetadata` async params pattern | Pass — `await params` used in both pages (Next.js 15 convention) |
| `dangerouslySetInnerHTML` on JSON-LD scripts | Pass — only `JSON.stringify` of typed DB objects, no user input |
| ISR / SSG compatibility | Pass — `revalidate = 86400`, `generateStaticParams` wrapped in try/catch |
| Type safety (no `any`) | Pass — only `as unknown as { src: string }[]` cast for the `images` JSONB column (justified — same pattern as Story 4.1) |
| Drizzle types | Pass — `Property`, `Agent`, `Area` imported as `type` |
| `Metadata.alternates` shape | Pass — matches Next.js 15 typing exactly |
| `MetadataRoute.Sitemap` type | Pass — flat array, `lastModified`/`changeFrequency`/`priority` typed correctly |
| `next.config.ts` import path | Pass — uses relative `./src/lib/seo/redirects` (no `@/` alias, per Next.js docs) |

### Layer 2 — Edge Case Hunter

| Edge Case | Coverage |
|---|---|
| Property with null lat/long | Handled — `geo` omitted (UNIT-001i) |
| Property with empty `images` | Handled — `?? []` defaults; empty array passed to `<script>` is valid JSON-LD |
| Agent with null `photoOptimizedUrl` | Handled — falls back to `photoUrl` (UNIT-002g) |
| Agent with both photo URLs null | Handled — emits `image: undefined` which `JSON.stringify` drops |
| Description / bio that is empty string `""` | Handled — `slice(0, N) \|\| undefined` → field omitted |
| Description / bio that is `null` | NOT possible — schema has `notNull().default("")` for both `descriptionEn`/`descriptionEs` and `bioEn`/`bioEs` |
| WordPress URL `/property/123/` (trailing slash) | Handled — regex `\/?$` (UNIT-006h) |
| WordPress URL `/en/property/slug` | Handled — regex requires no leading locale (UNIT-006c) |
| Sitemap DB outage | Handled — try/catch returns `[]`; build continues |
| Lighthouse CI without staging slugs | Acceptable — advisory job, not a PR gate; flagged as INFO |

### Layer 3 — Acceptance Auditor

| AC | Implementation | Status |
|---|---|---|
| #1 RealEstateListing JSON-LD on listing page | `src/app/[locale]/property/[slug]/page.tsx` script tag with `data-testid="listing-jsonld"` | Pass |
| #2 RealEstateAgent JSON-LD on agent page | `src/app/[locale]/agents/[slug]/page.tsx` script tag with `data-testid="agent-jsonld"` | Pass |
| #3 Place JSON-LD on area page | Generator created (`generatePlaceJsonLd`); page wiring deferred to Epic 6 per story scope | Pass (deferred wiring documented) |
| #4 BreadcrumbList JSON-LD on hierarchical pages | Both listing + agent pages emit it; localized after fix | Pass |
| #5 hreflang EN+ES on every page | `buildAlternatesMetadata()` spread into `Metadata.alternates.languages` on both pages | Pass |
| #6 Per-language XML sitemaps | `src/app/sitemap.ts` flat-array entry per locale per route | Pass |
| #7 WordPress 301 < 50ms | `next.config.ts` static redirects (edge-level, < 10ms); pattern detectors for future middleware | Pass |
| #8 Title, meta description, canonical, OG tags | Both pages emit all 4 in `generateMetadata` | Pass |
| #9 Lighthouse CI ≥ 80 advisory | `.lighthouserc.js` + `.github/workflows/lighthouse.yml` (nightly, advisory) | Pass |

---

## Issues Found and Fixes Applied

### MEDIUM (1) — Hardcoded English breadcrumb labels in JSON-LD (FIXED)

**Files:** `src/app/[locale]/property/[slug]/page.tsx`, `src/app/[locale]/agents/[slug]/page.tsx`

The breadcrumb JSON-LD passed hardcoded English strings (`"Home"`, `"Search"`, `"Agents"`) regardless of locale. Spanish-locale pages (`/es/property/...`) emitted English breadcrumb names in their structured data, which Google treats as a hreflang/i18n inconsistency signal and harms the very SEO equity this story is meant to protect.

**Fix:**
- Added `Breadcrumbs` namespace to `src/messages/en.json` and `src/messages/es.json` with `home`, `search`, `agents` keys.
- Both pages now `await getTranslations({ locale, namespace: "Breadcrumbs" })` and use `tBreadcrumbs("home" / "search" / "agents")` when building `breadcrumbJsonLd`.

### LOW (1) — Hardcoded "Southern Zone, Costa Rica" in agent areaServed (FIXED)

**File:** `src/lib/seo/structured-data.ts`

`generateAgentJsonLd` hardcoded `areaServed.name = "Southern Zone, Costa Rica"`. Spanish-locale agent pages emitted the English region label in JSON-LD instead of "Zona Sur, Costa Rica".

**Fix:**
- `generateAgentJsonLd` now accepts an optional `areaServedName` parameter (defaults to the EN label for backwards-compatibility).
- Added `AgentAreaServed` namespace to both message files (`name`: "Southern Zone, Costa Rica" / "Zona Sur, Costa Rica").
- Agent profile page passes `tAreaServed("name")` into the generator.

### LOW (no fix required) — Lighthouse seed slugs

`.lighthouserc.js` references `test-property-slug` / `test-agent-slug`. These won't exist in staging, but the workflow is advisory-only and runs on schedule, not on PRs. Story explicitly marks Lighthouse as advisory; parametrization can land with the staging environment setup. Documented as INFO.

### INFO — Static redirect linear scan

`next.config.ts` `redirects()` returns a 14-entry array; Next.js matches linearly. With < 50 entries this is sub-millisecond — no action needed. If the static map grows past ~100 entries, consider segmenting by prefix.

### INFO — Description-empty-string null safety

`description.slice(0, 500) || undefined` handles empty strings correctly (falsy → undefined). The DB schema has `.notNull().default("")` for all description/bio columns, so `null` cannot reach the generators. No defensive null-guard needed but worth documenting.

---

## Verification After Fixes

```
npm run typecheck → 0 errors
npm run lint      → 0 errors, 5 baseline warnings (unchanged)
npm run format:check → all files pass
npx vitest run tests/unit/seo/ → 91/91 passed in 178 ms
npx vitest run                 → 768 passed | 3 skipped in 2.03 s
npm run build → succeeds (sitemap.xml + robots.txt confirmed as ○ Static routes)
```

---

## Strengths Worth Calling Out

- **Single source of truth for SEO constants.** `src/lib/seo/constants.ts` exports `SITE_ORIGIN` and `LOCALES`; every other SEO module imports from there. Domain change = one edit.
- **Strict server/client boundary.** `structured-data.ts` and `metadata.ts` import `"server-only"` at the top, blocking accidental client-bundle leakage.
- **JSON-LD safe-by-construction.** `JSON.stringify` of typed DB objects (no template-literal interpolation) makes XSS structurally impossible.
- **Pattern detectors are pure functions.** `isWordPressPropertyUrl` / `isWordPressAgentUrl` have no DB access, no side effects — Edge-runtime safe and trivially testable.
- **Sitemap performance.** `Promise.all` parallelizes DB queries; try/catch fallback prevents build breaks.
- **Lighthouse CI is correctly scoped as advisory.** Runs on schedule, uploads artifacts, doesn't block PR merges. NFR28 is treated as a target, not a hard gate.
- **`vi.mock` hoisting discipline maintained.** All four new spec files declare mocks before imports, consistent with the Story 3.1+ codebase convention.

---

## Score Breakdown

| Dimension | Score | Notes |
|---|---|---|
| AC coverage | 95 | All 9 ACs satisfied; AC #3 generator-only by design (Epic 6 wires page) |
| Code quality | 90 | Clean separation; constants centralized; no dead code |
| i18n | 85 | Two issues found and fixed during this review |
| Next.js 15 patterns | 95 | Async params, metadata API, App Router conventions all correct |
| Security | 95 | No XSS surface; redirect map is static data; no open-redirect risk |
| Performance | 92 | Edge-level redirects; parallel DB queries in sitemap; advisory Lighthouse |
| SEO correctness | 90 | Absolute canonicals; both hreflang variants; schema.org compliant |
| Type safety | 95 | One justified `as unknown as` cast for JSONB column; no `any` |
| **Overall** | **92** | **Approve** |

---

## Decision

**APPROVE** — score 92/100, above the 85 threshold. Two i18n fixes applied directly during the review. Proceed to PR (Step 6).
