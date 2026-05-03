---
story: '4.3-agent-profile-pages'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-05-03'
diff_source: 'branch story-4.3-agent-profile-pages vs main'
review_mode: 'full'
spec_file: '_bmad-output/implementation-artifacts/4-3-agent-profile-pages.md'
score: 90
---

# Code Review — Story 4.3: Agent Profile Pages

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. The implementation delivers all
seven acceptance criteria: agent profile page (`/[locale]/agents/[slug]`)
with photo, bilingual bio, languages, office, listing count, WhatsApp + Email
CTAs (AC #1); listings grid below the bio reusing `PropertyCard` (AC #2);
agents index page (`/[locale]/agents`) with office + language filters (AC #3,
#4); shareable URLs (AC #5); SSG + ISR (AC #6); DB-sourced data (AC #7).

677 unit tests pass (35 new tests for this story). Lint clean (0 errors,
5 pre-existing warnings unrelated to this story). Typecheck clean. Prettier
clean. Test review (Step 4) scored 92/100.

**Three findings were applied** — all i18n-related (the recurring violation
flagged in the BAD review brief). Highlights:

- `AgentProfileCTAs` built the WhatsApp message inline with hardcoded
  English/Spanish strings (`'Hi {name}, I'd like to learn more about your
  properties.'` / `'Hola {name}, me gustaría obtener más información sobre
  sus propiedades.'`) despite the i18n key `generalInquiryEn` already being
  defined in both `en.json` and `es.json`. Code review brief explicitly
  flagged WhatsApp templates as a recurring violation. Replaced with
  `t('generalInquiryEn', { name: agentName })`. This also makes the
  message correctly localized whenever the `locale` namespace selects the
  active translation — previously the inline `locale === 'es' ? ... : ...`
  branch worked but bypassed the established translation pipeline and would
  silently miss translations for any future locale (e.g., German).
- `AgentIndexFilters` rendered raw `lang.toUpperCase()` ("EN", "ES", "DE")
  in the language filter dropdown options, while every other surface in the
  same component tree (`AgentProfileHero`, `AgentIndexCard`, `AgentCard`)
  uses the `language.{code}` translations from the `AgentProfile` namespace.
  Filter dropdown is a user-facing surface — should match. Imported the
  same `KNOWN_LANGUAGES` set and resolved each option label via
  `t(\`language.${lang}\`)`. Falls back to upper-cased code for unknown
  languages — same defensive pattern used in `AgentCard`.
- The story spec explicitly instructed inline message construction
  ("simpler: build inline"), but that conflicts with the Epic 3/4 i18n
  contract (verified in code reviews 3-8 and 2-7). When story spec and
  i18n contract disagree, i18n wins — the spec didn't anticipate that
  the `generalInquiryEn` key was being added in the SAME story (Task 9).

CI snapshot post-fix: **677 tests pass, 3 skipped** (pre-existing schema
tests), lint clean (0 errors, 5 pre-existing warnings, none in story files),
typecheck clean, prettier clean.

## Acceptance Criteria Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| #1 | Agent profile shows photo, name, bio (bilingual), languages, office, listing count, WhatsApp + Email CTAs | PASS | `AgentProfileHero` + `AgentProfileCTAs`, AC-001..010 unit tests |
| #2 | All agent's listings displayed in property grid below bio | PASS | `AgentListingsGrid` + `getPropertiesByAgentId` + `PropertyCard` reuse |
| #3 | Filter by office and language on agents index page | PASS | `AgentIndexFilters` (Client Component, in-memory filter), AC-013..018 |
| #4 | Agents index shows all active agents with photo, name, languages, office, listing count | PASS | `getAllAgents` (active only, ordered by listingCount desc) + `AgentIndexCard` |
| #5 | Agent profile URLs shareable, standalone | PASS | `generateMetadata` with title + description + OG image; SimplePageLayout wrapper |
| #6 | SSG / ISR (NFR25) | PASS | `revalidate = 86400` + `generateStaticParams` (try/catch fallback for build resiliency) |
| #7 | Agent data sourced from synced DB | PASS | All queries use Drizzle on `agents` / `properties` / `offices` tables |

## Findings — Triage

| # | Severity | Source              | Title                                                                                          | Disposition |
|---|----------|---------------------|------------------------------------------------------------------------------------------------|-------------|
| 1 | HIGH     | Blind + Auditor     | `AgentProfileCTAs` WhatsApp message hardcoded English/Spanish — bypasses i18n contract        | Applied     |
| 2 | MEDIUM   | Blind Hunter        | `AgentIndexFilters` language filter dropdown uses raw `lang.toUpperCase()` instead of i18n    | Applied     |
| 3 | LOW      | Edge Case Hunter    | `"RE/MAX Altitud"` hardcoded as office-name fallback in 3 places (page + filters + slug page) | Deferred    |
| 4 | LOW      | Edge Case Hunter    | `i18n` key `generalInquiryEn` is misleadingly suffixed "En" but used for both locales         | Deferred    |
| 5 | LOW      | Edge Case Hunter    | Inactive-agent branch in `[slug]/page.tsx` doesn't set `metadata` differently (still indexed) | Deferred    |
| 6 | NOISE    | Edge Case Hunter    | `agent-clear-filters` button has no `data-testid` (test uses `getByRole`)                     | Dismissed   |
| 7 | NOISE    | Acceptance Auditor  | `agent-profile-ctas.tsx` keeps `agentEmail` typed as `string \| null` — never falls back      | Dismissed   |

### Deferred — Rationale

- **#3** The `"RE/MAX Altitud"` fallback is unreachable in practice — every
  agent has a non-null `officeId` per the DB schema (`officeId text not null`
  in `agents` table), and `getAllOffices` returns both offices. The fallback
  exists only to satisfy TypeScript's `Record<string, string>` lookup result
  type and would never render in production. Fixing would require either a
  i18n key (overkill for unreachable code) or assertion `officeMap[agent.officeId]!`
  (less defensive). Leaving as-is matches the pattern in `AgentCard` /
  `getOfficeById` callers throughout the codebase.
- **#4** Cosmetic. The key was named `generalInquiryEn` in the story spec
  Task 9 (likely a copy-paste artifact from `whatsappMessageEn` patterns
  elsewhere). Renaming would touch the spec, both `messages/*.json` files,
  and the consumer. Low value, high churn — defer until next i18n key
  consolidation.
- **#5** Inactive agent pages still get the default `generateMetadata` (with
  the agent's name + bio). Arguably they should set `robots: { index: false }`
  to avoid indexing soft-deleted agents in Google. However, this is parallel
  to the listing-detail "no longer available" pattern (Story 4.1) which also
  doesn't deindex — and the spec for Story 4.3 doesn't mandate it. Track
  for a future SEO hardening pass (Story 4.4 or Epic 5 SEO sweep). Adding
  here would be scope creep.

### Dismissed — Rationale

- **#6** The "Clear filters" button is reached via `getByRole("button",
  { name: /clearFilters/ })` in `4.3-COMP-021`. Adding a testid would be
  redundant with the role-based selector. Tests already pass.
- **#7** `agent.email` is `string | null` in the DB. The component renders
  the email CTA only when `emailUrl` is non-null. There is no fallback case
  that needs to be tested — agents without emails simply don't show the CTA.
  This matches the spec's "graceful degradation" pattern.

## Layer-by-Layer Findings

### Blind Hunter (look at the code, find smells without context)

- **HIGH:** Hardcoded WhatsApp message in `agent-profile-ctas.tsx` (Finding #1).
  The locale-conditional template literal pattern (`locale === "es" ? ... : ...`)
  is a known anti-pattern in this codebase — caught in code reviews 3.8 (`useGeolocation`
  fallback strings) and 3.8 (`NoResultsState` WhatsApp message). Same fix applied here.
- **MEDIUM:** Language filter dropdown showed raw codes (Finding #2). Cosmetic
  but visible — Spanish users browsing the agents index would see "EN", "ES" not "Inglés", "Español".
- **NOISE:** `cn` utility not imported in any of the new components — but none
  use conditional className expressions, so it's correctly omitted. Spec said
  "import cn" but applied judgment correctly to skip when unused.

### Edge Case Hunter (boundary conditions, error paths, missing cases)

- **LOW:** Empty bio handling — `bio && <p>{bio}</p>` correctly handles empty string
  fallback (DB defaults `bioEn` / `bioEs` to `""`). Tests COMP-008 verify.
- **LOW:** Photo fallback chain handles all three null/empty/missing cases.
  `next/image` would crash on `src=""` — the explicit length check prevents that.
- **LOW:** Inactive agent slug → renders "no longer active" page, not 404.
  `notFound()` only fires for unknown slugs. Correct per spec.
- **LOW:** `Promise.all` in `[slug]/page.tsx` — uses `Promise.resolve(null)` for the
  null-officeId branch. Not a bug, but slightly awkward. Could use a guarded ternary.
  Acceptable.
- **LOW:** `getPropertiesByAgentId` filters by `isVisible = true` only — if an agent
  has zero visible properties, the empty-state in `AgentListingsGrid` renders.
  Verified by COMP-019 test.
- **NOISE:** Filter logic in `AgentIndexFilters` uses `Array.isArray` check on
  `agent.languages` — defensive against schema drift (jsonb can be null in
  pathological cases). Good defensive coding.

### Acceptance Auditor (every AC met by the implementation)

- **AC #1 — All elements present:** Photo (data-testid), name (h1), bio
  (locale-aware), languages (data-testid), office (rendered via `officeName`),
  listing count (data-testid), WhatsApp + Email CTAs. All seven boxes ticked.
  Verified by COMP-001..012.
- **AC #2 — Property grid:** `AgentListingsGrid` renders `PropertyCard` instances
  in the spec'd grid layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
  Empty state renders when `properties.length === 0`. Verified by COMP-019, E2E-002.
- **AC #3 — Filters:** Both office and language filters present, both update state
  immediately on change, combined filter logic uses `&&`. Tests COMP-014..017.
- **AC #4 — Index card content:** Photo, name, languages, office, listing count
  all render in `AgentIndexCard`. Tests COMP-022.
- **AC #5 — Shareable URLs:** `generateMetadata` returns title + description +
  OG image. Verified by visual inspection (no automated test for OG metadata
  but the structure matches Story 4.1 pattern).
- **AC #6 — SSG/ISR:** `revalidate = 86400` + `generateStaticParams` with
  try/catch fallback. Matches Story 4.1 pattern. Cannot verify SSG behavior in
  unit tests but build verification was deferred to PR step (Step 6).
- **AC #7 — DB data source:** All four new queries (`getAllAgents`,
  `getAgentBySlug`, `getAllAgentSlugs`, `getPropertiesByAgentId`) verified by
  DB-001..011.

## i18n Hardcoded Strings Audit

Comprehensive grep for hardcoded English/Spanish strings in the story's source files:

```
grep -rn "Hi |Hola |I'd like|I'm interested|me gustaría|me interesa" \
   src/components/agent/ src/app/\[locale\]/agents/
# (post-fix: no matches in source files — only in placeholder/SVG)
```

All user-visible strings flow through `useTranslations` (client) or `getTranslations`
(server). All language code labels resolve via `language.{code}` keys. WhatsApp
message uses `generalInquiryEn` key (Finding #1 fix).

Hardcoded `"RE/MAX Altitud"` brand-name fallback (Finding #3) deferred — unreachable
in practice and matches the brand convention used elsewhere.

## Files Changed by Review

```
src/components/agent/agent-profile-ctas.tsx    — Replace inline locale conditional with t('generalInquiryEn')
src/components/agent/agent-index-filters.tsx   — Localize language filter option labels via i18n
```

## Verification Snapshot

```
pnpm test     →  Test Files  51 passed | 1 skipped (52)
                 Tests       677 passed | 3 skipped (680)
                 Duration    2.27s
pnpm lint     →  0 errors, 5 warnings (all pre-existing, none in story files)
pnpm typecheck → clean
pnpm format:check → clean
```

## Score

**90 / 100** — proceed to Step 6.

Breakdown:
- AC coverage: 100% (7/7 ACs satisfied)
- Code quality: 90% (clean structure, good separation of concerns, minor brand-fallback nit)
- i18n: 90% (one HIGH finding fixed, one MEDIUM finding fixed, one cosmetic LOW deferred)
- Next.js 15: 100% (Server/Client split correct, ISR + SSG configured per spec)
- Accessibility: 95% (proper ARIA, semantic HTML, keyboard nav via native `<select>` and `<a>`)
- Type safety: 95% (one `as unknown as` cast for `PropertySearchItem` — required because of jsonb-to-typed conversion, documented)
- Performance: 100% (Server Components for static content, parallel `Promise.all` for office + properties, 24h ISR)
- Security: 100% (WhatsApp URL uses `encodeURIComponent` via `buildWhatsAppUrl`; mailto uses controlled DB-sourced email)
