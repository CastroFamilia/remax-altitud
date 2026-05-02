# Deferred Work

## Deferred from: code review of story-1.1 (2026-04-17)

- **Missing CSP header** — No `Content-Security-Policy` header configured. `X-XSS-Protection` is deprecated. CSP should be designed with allowed sources for scripts, styles, images, and fonts once the design system and third-party integrations (Mapbox, GA4, Sentry) are in place.
- **Missing HSTS header** — `Strict-Transport-Security` header should be added for defense-in-depth once Coolify/Caddy TLS deployment is finalized and confirmed working.
- **No HEALTHCHECK in Dockerfile** — The `/api/health` endpoint exists but the Dockerfile lacks a `HEALTHCHECK` instruction. Add `HEALTHCHECK CMD wget -q --spider http://localhost:3000/api/health || exit 1` when Coolify deployment is finalized.

## Deferred from: code review of 1-4-internationalization-en-es.md (2026-04-22)
- Inconsistent design token usage in layout [src/app/[locale]/layout.tsx]. Typography (Montserrat) and some styles use direct imports instead of theme-wrapped tokens.

## Deferred from: code review of 1-5-homepage-shell-and-split-hero.md (2026-04-22)
- Mobile horizontal carousels (Featured Properties / Featured Communities / Area Highlights) lack an explicit scroll affordance for off-screen cards [src/components/home/homepage-sections.tsx:44]. Partial-card peek at `w-[80%]` implies scrollability but a fade-right gradient, peek-indicator chevron, or scroll dots would improve discovery. Not an AC #8 regression.
- `HeroSearchShell` ships both `mobile-inline` and `desktop-overlay` variants in the DOM at all times; only one is visible per breakpoint via `md:hidden` / `hidden md:block` [src/components/home/split-hero.tsx:112,125]. Minor DOM weight duplication; consider conditional rendering when the shell becomes functional in Epic 3.

## Deferred from: code review of 1-6-static-content-pages.md (2026-04-23)
- Email regex permissive vs SMTP reality [src/components/lead/contact-form.tsx:1037] — matches spec Task 4 rule verbatim; revisit when `react-hook-form` + `zod` land in Epic 5 Story 5-3.
- Phone validation is digit-count only, no country-code check [src/components/lead/contact-form.tsx:1325] — matches spec Task 4 rule verbatim; Epic 5 owns stricter E.164 validation.
- `buildWhatsAppUrl` fallback returns `tel:` despite the function name [src/lib/constants/offices.ts:56-62] — matches spec Task 2 prescribed behavior. Consider renaming to `buildContactUrl` in a later pass.
- Hardcoded `alternates.languages` duplicated across 4 pages [src/app/[locale]/{about,services,contact,join}/page.tsx] — Epic 4 Story 4-4 (SEO architecture) owns the hreflang helper module.
- `!important` Tailwind modifiers in SimplePageLayout typography [src/components/layout/simple-page-layout.tsx:806,810] — documented Tailwind v4 workaround from Story 1.5 Debug Log #2; revisit if `@theme inline` migration happens.
- `CONTACT_INBOX` / `RECRUIT_INBOX` hardcoded [src/components/lead/contact-form.tsx:938-939] — Epic 5 Story 5-3 swap point (replaces `mailto:` with `POST /api/leads`).
- Recruitment form permits submit with zero languages selected [src/components/lead/contact-form.tsx:1301-1303] — spec Task 4 validation rules do not list `languages` as required; if client wants ≥ 1 language, add in a follow-up ticket.
- OfficeCard hardcodes `AboutPage.office` namespace, limiting cross-page reuse [src/components/layout/office-card.tsx:831] — promote to a shared `Office.*` namespace when a second consumer needs divergent labels.
- Placeholder office emails + derived WhatsApp numbers reach production [src/lib/constants/offices.ts:17-31, src/messages/en.json:163] — already flagged with top-of-file TODO per spec Task 2; client to confirm before launch.

## Deferred from: code review of 1-7-loading-states-empty-states-and-error-handling (2026-04-23)
- Both 404 page CTAs ("Back to home" and "Browse properties") point to the same URL (`/`) [src/app/[locale]/not-found.tsx:34,38] — spec-compliant with TODO comment; will resolve in Epic 3 when `/search` route exists.

## Deferred from: code review of 2-1-database-schema-and-drizzle-models (2026-04-24)
- `geographyPoint.toDriver` accepts NaN/Infinity/undefined lng/lat silently [src/lib/db/types/postgis.ts:18-20] — TypeScript already guards at compile time; runtime validation belongs in a query-helper story.
- vitest does not auto-load `.env.local`, so tests require inline `DATABASE_URL=… npm test` [vitest.config.ts] — minor DX polish; add a setup file when the team wants auto env loading.
- No down-migration / rollback SQL or documented recovery strategy [src/lib/db/migrations/] — drizzle-kit default; deserves a recovery-strategy note in a future docs pass.
- `CREATE EXTENSION postgis` requires SUPERUSER on managed Postgres [src/lib/db/migrate.ts:14] — deployment concern for Coolify/managed hosts; belongs in the deploy runbook.

## Deferred from: code review of 2-2-api-integration-and-data-fetching (2026-04-24)
- Required Y/N fields (`Furnishedyn`, `Garage`, `MaidRoom`, `Cooling`, `PoolPrivate`, `Viewyn`, `GatedCommunity`) are non-nullish; a single null upstream drops the entire record [src/lib/sync/schemas/property.ts] — data-quality hardening belongs with Story 2.3 ingestion.
- `officeGuid` is not URL-encoded before interpolation into the request path [src/lib/sync/api-client.ts:83, 97] — GUID comes from env and is controlled; defense-in-depth can ride along with a later pass.
- `Latitude` / `Longitude` are not range-validated to `[-90,90]` / `[-180,180]` [src/lib/sync/schemas/property.ts:86-93] — swapped-lat/lng detection belongs with Story 2.3 geospatial ingestion.
- `normalizeCostaRicaPhone` accepts `"50600000000"` and other length-valid but prefix-invalid CR numbers [src/lib/sync/utils/phone.ts:13-14] — prefix validation is out of spec scope; revisit in a data-quality pass.
- `Lang` / `Title` fields are case-sensitive (only literal `"English"`/`"Spanish"`/`"Owner"` recognized) [src/lib/sync/schemas/agent.ts:64-68] — matches the spec's literal mapping, revisit if upstream drifts.
- `Garage === true` with `GarageSpaces: null` coerces to `garageSpaces: 0`, creating a contradiction [src/lib/sync/schemas/property.ts:205-210] — downstream UI should reconcile.
- `lastStatus` retains the previous attempt's value when `fetch` rejects before producing a response [src/lib/sync/api-client.ts:33, 38-39] — diagnostic nit only.
- `response.text()` + `JSON.parse` double-buffers the whole body in memory [src/lib/sync/api-client.ts:45-51] — property feeds are well under any OOM threshold at current scale.
- `isExpired` parser test depends on the real clock with no `vi.useFakeTimers` [tests/unit/sync/parser.spec.ts] — fixture date is sufficiently in the past to be robust through any CI clock.
- `extractApiId` mixes property (`ListingId`) and agent (`AssociateID`/`AssociateId`) candidates in one helper [src/lib/sync/parser.ts:97-105] — tight scoping is cleanup, not a correctness issue.

## Deferred from: code review of 2-6-lifestyle-tag-auto-tagging (2026-04-25)
- AC #2 references "Condo in tourist zone" but the shipped rule fires on any condo (no area/keyword check) [src/lib/constants/lifestyle-tags.ts:42-48] — spec narrative explicitly approves this scope ("Extend in future: add tourist-zone area check once area data is linked"); area data wiring lands in Epic 6 Story 6.5.
- `fetchPropertyLifestyleTags` queries the DB for just-inserted `diff.new` rows that always return empty tags [src/lib/sync/pipeline.ts:225] — matches the spec's prescribed pseudocode exactly; cost is one indexed `inArray` query per sync; revisit only if profiling identifies the sync as latency-bound.

## Deferred from: code review of 3-2-interactive-map-with-property-pins (2026-04-26)
- Duplicate `MapBounds` / `MapProperty` type definitions across 6 files (`src/store/map-store.ts`, `src/lib/map/geo-utils.ts`, `src/components/map/map-view.tsx`, `src/components/search/split-view-layout.tsx`, `src/components/search/search-page-client.tsx`, `src/app/actions/map-actions.ts`) — types are currently consistent; consolidate into a single shared types module in a follow-up.
- `MapPropertyPopup` uses hardcoded English strings ("View Details", "Close property preview", "Titled", "Concession", "ZMT Restricted", "{n} bed/bath/m²") instead of `useTranslations` even though i18n keys for these were added to `messages/{en,es}.json` in Task 10 — UX polish, low risk; AC #4 doesn't mandate i18n for these labels.
- `next.config.ts` lacks `images.remotePatterns` for property image hosts — popup uses `unoptimized` as a forward-compatible workaround; revisit when CMS/CDN host(s) for property photos are decided in a later epic.

## Deferred from: code review of 3-4-lifestyle-tags-and-smart-presets (2026-05-01)
- `LifestyleTagChips` container lacks `role="group"` / `aria-label` for the tag row — minor a11y polish; AC #1 only requires the chips to render, not a labelled group.
- `latestParamsRef.current` is reassigned during render in `useSearchFilters` — pre-existing pattern from Story 3.3, works in practice; revisit if/when concurrent rendering surfaces issues.

## Deferred from: code review of story-3.5 (2026-05-01)
- `SaveButton.propertyTitle` prop is declared but unused — kept for forward compatibility (toast personalization in Story 7.1) [src/components/property/save-button.tsx:8].
- `ShareButton` is silent when neither `navigator.share` nor `navigator.clipboard` is available — older browsers (and most desktop Firefox without MDN flags) get no feedback after clicking the share icon [src/components/property/share-button.tsx:25-45].
- Empty-string image URL is not explicitly guarded — `property.images[0]?.url ?? "/property-placeholder.svg"` only catches `null`/`undefined`. An empty string slips through to `next/image` and would throw [src/components/property/property-card.tsx:81]; data integrity belongs upstream in the sync pipeline.

## Deferred from: code review of story-3.7 (2026-05-02)
- Cross-tab localStorage sync — `useLocaleUnits` does not register a `storage` event listener, so toggling units in tab A leaves tab B stale until reload [src/hooks/use-locale-units.ts]. Nice-to-have; not in AC #4.
- PropertyCard `aria-label` hardcodes the English "Property:" prefix instead of pulling from i18n [src/components/property/property-card.tsx:90]. Pre-existing from Story 3.5.
- PropertyCard `aria-label` includes only the USD price; non-US-locale screen-reader users miss the EUR equivalent line [src/components/property/property-card.tsx:90, 130-134]. Minor a11y polish.
- E2E tests `tests/e2e/unit-conversion-and-price-display.spec.ts` are scaffolds (`test.skip`) — activation depends on Playwright framework configuration, which lands in a later epic.
- `EUR_RATE = 0.92` in `src/lib/utils/currency.ts` has no auto-update mechanism; spec accepts "approximate" but a future task should refresh the constant or wire a build-time fetch.
