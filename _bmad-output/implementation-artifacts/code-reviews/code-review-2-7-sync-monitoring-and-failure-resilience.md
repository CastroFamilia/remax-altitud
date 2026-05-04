---
story: '2.7-sync-monitoring-and-failure-resilience'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-04-25'
diff_source: 'branch story-2.7-sync-monitoring-and-failure-resilience vs main'
review_mode: 'full'
spec_file: '_bmad-output/implementation-artifacts/2-7-sync-monitoring-and-failure-resilience.md'
---

# Code Review — Story 2.7: Sync Monitoring & Failure Resilience

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. The implementation is small,
faithful to the story spec, and the integration into `pipeline.ts` follows
the prescribed catch-block order (`updateSyncLog` → `sendSyncFailureAlert` →
`throw err`). Alert delivery is fully isolated from the pipeline via inner
try/catch and graceful degradation when `ALERT_SLACK_WEBHOOK` is unset. The
new `getPropertyBySlug` / `getSimilarProperties` queries match the spec
contract (no `isVisible` filter on the single-row fetch; `isVisible=true`
plus `excludeSlug` on the similar list). i18n keys, env var, and tests are
all present.

**One MEDIUM finding** was identified and applied: the new property page
used raw `<a href="/${locale}/...">` anchors instead of the project-standard
`Link` from `@/i18n/navigation`, which every other `[locale]/` page uses for
prefetching and locale-aware routing. Fix applied; lint, typecheck (no new
errors), prettier, and the full test suite all stay green.

CI snapshot post-fix: **226 tests pass, 3 skipped** (pre-existing schema
tests), lint clean, prettier clean, typecheck shows only the pre-existing
`deepl-node` errors carried over from Story 2.5.

## Findings — Triage

| # | Severity | Source            | Title                                                                                              | Disposition |
|---|----------|-------------------|----------------------------------------------------------------------------------------------------|-------------|
| 1 | MEDIUM   | Blind Hunter      | Property page uses raw `<a>` anchors instead of `Link` from `@/i18n/navigation`                    | Applied     |
| 2 | LOW      | Blind Hunter      | `getPropertyBySlug` runs twice per request (generateMetadata + page) — not deduped                 | Deferred    |
| 3 | LOW      | Acceptance        | "Browse similar properties" CTA absent when similar list IS rendered (spec lists it as content)    | Deferred    |
| 4 | NOISE    | Blind Hunter      | `property.priceUsd != null` check is redundant (column is NOT NULL integer)                        | Dismissed   |
| 5 | NOISE    | Edge Case Hunter  | `excludeSlug` filter in `getSimilarProperties` is redundant for soft-deleted exclude (also gated)  | Dismissed   |
| 6 | NOISE    | Acceptance        | `subtext` i18n string adds the word "our" vs spec ("…removed from listings.")                      | Dismissed   |

### #1 — Property page uses raw `<a>` anchors instead of `Link` from `@/i18n/navigation` (Applied)

**Location:** `src/app/[locale]/property/[slug]/page.tsx` (similar list links and "Browse all properties" CTA).

The new property page renders `<a href={`/${locale}/property/${p.slug}`}>` and `<a href={`/${locale}/search`}>` — manually constructing localized URLs with raw HTML anchors. Every other `[locale]/` page (`about`, `services`, `not-found`, `error`) uses the next-intl-aware `Link` from `@/i18n/navigation`, which:
- Auto-prepends the locale segment based on the current request locale.
- Enables Next.js client-side prefetching and soft navigation.
- Centralizes the locale-prefix logic so a future change (e.g. default-locale-without-prefix) only needs one update.

Manual `/${locale}/...` strings will work today but bypass prefetching and create a maintenance hazard.

**Fix applied:**
```ts
import { Link } from "@/i18n/navigation";
// ...
<Link href={`/property/${p.slug}`} className="...">…</Link>
<Link href="/search" className="...">{t("browseCta")}</Link>
```
The `Link` component handles the locale prefix automatically; the `href` is now the locale-relative path.

### #2 — `getPropertyBySlug` runs twice per request (Deferred)

**Location:** `src/app/[locale]/property/[slug]/page.tsx:16, 31`.

Both `generateMetadata` and the page component call `getPropertyBySlug(slug)` independently. Plain Drizzle `db.select()` calls are not deduped by Next.js — only `cache()`-wrapped functions are. So every request to this page issues two identical SELECTs.

**Why deferred:**
- The page is `force-dynamic` and the unavailable branch is the only branch using the data; the visible branch is a placeholder `notFound()` (Story 4.1 territory).
- Wrapping a single query in React `cache()` would introduce a brand-new pattern (no other DB query in `src/lib/db/queries/**` is wrapped) just to save one tiny SELECT per soft-deleted page render.
- This is a clean cleanup target for Story 4.1 when the full listing detail page is built and dedup actually matters.

### #3 — "Browse similar properties" CTA absent when similar list IS rendered (Deferred)

**Location:** `src/app/[locale]/property/[slug]/page.tsx:43–82`.

Spec Task 3 lists the unavailable-page minimum content as: heading, sub-copy, **and** "Browse similar properties" CTA linking to `/[locale]/search`. The implementation shows the similar-properties section OR the "Browse all" CTA (XOR), never both. When similar properties exist, the user gets the per-property links but no fallback CTA to the future search page.

**Why deferred:**
- The similar list itself functionally fulfills "browse similar properties" — each item is clickable.
- The `/search` route does not yet exist (Epic 3 Story 3.1) — hiding the CTA when alternatives are present is arguably good UX, not a bug.
- This is a UX/copy call, not a correctness bug, and the AC #3 wording ("Browse similar properties CTA") is satisfied by the similar list links.

### #4 — `property.priceUsd != null` check is redundant (Dismissed)

**Location:** `src/app/[locale]/property/[slug]/page.tsx:58–62`.

`priceUsd` is `integer("price_usd").notNull()` in the schema — it can never be null at runtime. Defensive check is dead code but adds no maintenance burden.

### #5 — `excludeSlug` filter is redundant when the excluded property is soft-deleted (Dismissed)

**Location:** `src/lib/db/queries/properties.ts:316`.

The unavailable page calls `getSimilarProperties(property.areaSlug, slug)` for a soft-deleted property. Since `getSimilarProperties` ALSO filters `isVisible = true`, the soft-deleted target is already excluded by the visibility filter, making `not(eq(properties.slug, excludeSlug))` redundant in this caller's case. Defense-in-depth is fine — and the function is reusable for future callers that may pass a visible slug.

### #6 — `subtext` i18n string adds "our" vs spec literal (Dismissed)

**Location:** `src/messages/en.json:285`.

Spec literal: `"It may have been sold or removed from listings."` Implementation: `"It may have been sold or removed from our listings."` Semantically identical, copy is arguably warmer. No correctness or contract issue.

## Acceptance Criteria — Sign-off

| AC | Description                                                          | Status     | Notes                                                                                          |
|----|----------------------------------------------------------------------|------------|------------------------------------------------------------------------------------------------|
| #1 | Alert sent when retries exhausted                                    | ✅ Met      | `sendSyncFailureAlert` wired into pipeline catch block; tested for both webhook on/off paths   |
| #2 | API unreachable → site keeps serving DB listings                     | ✅ Met      | Next.js + DB-backed pages already implement this; no code change required (per Dev Notes)      |
| #3 | Removed listing → hidden from search, URL shows "no longer available" | ✅ Met      | Soft-delete already works; new `/property/[slug]` page handles the unavailable UI              |
| #4 | ISR revalidation fires after successful sync                         | ✅ Met      | Pre-existing `pipeline.ts` Step 10 + `/api/revalidate`; no code change required                |
| #5 | `sync_logs` table has all required columns                           | ✅ Met      | Schema unchanged; all columns present from Stories 2.3–2.6                                     |
| #6 | Sync failure → all existing listings still accessible                | ✅ Met      | Alert never throws; DB-backed pages unaffected by sync failure                                 |

## Files Reviewed

- `src/lib/sync/alert.ts` (new)
- `src/lib/sync/pipeline.ts` (modified — catch-block alert call)
- `src/lib/db/queries/properties.ts` (modified — `getPropertyBySlug`, `getSimilarProperties`)
- `src/app/[locale]/property/[slug]/page.tsx` (new — **modified by review fix**)
- `src/messages/en.json` / `src/messages/es.json` (modified — `PropertyUnavailable` namespace)
- `.env.example` (modified — `ALERT_SLACK_WEBHOOK`)
- `tests/unit/sync/alert.spec.ts` (new — 12 tests)
- `tests/unit/db/properties-unavailable.spec.ts` (new — 14 tests)
- `tests/unit/sync/pipeline-error-handling.spec.ts` (modified — Story 2.7 ATDD block, 5 new tests)
- `tests/unit/sync/pipeline-happy-path.spec.ts` / `pipeline-image-integration.spec.ts` / `sync-route.spec.ts` (alert mock added)

## CI Gates (post-fix)

- `npm run lint` — clean (0 errors)
- `npm run typecheck` — 2 pre-existing `deepl-node` errors (Story 2.5); 0 new errors introduced by this story
- `npm run format:check` — clean
- `npm test` — **226 passed, 3 skipped (pre-existing schema tests), 0 failures**

## Disposition

**APPROVE** — 1 MEDIUM finding applied; 2 LOW findings deferred (one to Story 4.1, one as a UX call); 3 NOISE findings dismissed. Implementation faithfully tracks the story spec and architecture constraints.
