---
story: '5.1-seller-landing-page-and-list-with-us-form'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-05-04'
diff_source: 'branch story-5-1-seller-landing-page-and-list-with-us-form vs main'
review_mode: 'full'
spec_file: '_bmad-output/implementation-artifacts/5-1-seller-landing-page-and-list-with-us-form.md'
score: 'A- (88/100)'
---

# Code Review — Story 5.1: Seller Landing Page & "List With Us" Form

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. The implementation is clean,
matches the spec closely, and all 29 unit tests pass. The diff is large
(~4150 lines, 17 production / test files) but well-structured: page module
follows the SSG pattern from `about/page.tsx`, the form is correctly
lazy-loaded via `next/dynamic({ ssr: false })`, the LocationPicker text field
is always functional with progressive map enhancement, i18n parity is exact
(92/92 keys EN/ES, only 3 acceptable identical values), and the data-testid
contract is honoured.

Five findings were applied:

1. **CRITICAL** — Lint failures (7 errors, 8 warnings) blocked CI.
2. **HIGH** — Form fields missing `aria-describedby` / `aria-invalid` for
   error messages (focus-area requirement; Epic 4 retro action item).
3. **HIGH** — Hardcoded English `"(Optional)"` string in the `Field` helper
   (Epic 4 retro anti-pattern; spec listed the i18n keys but they were
   never wired).
4. **MEDIUM** — Beds/Baths data leak: payload included `bedrooms`/`bathrooms`
   for `Lote/Terreno` if the user filled them then changed property type
   (R-012 defense-in-depth).
5. **MEDIUM** — `LocationPicker` text input had no `id`, so the parent's
   `<label>` was not programmatically associated with the input.

Score deductions: −5 lint failures, −4 a11y gaps (aria-describedby missing),
−2 hardcoded i18n string, −1 R-012 defense-in-depth. All addressed in the
review commit.

## Findings — Triage

| # | Severity | Source           | Title                                                                                          | Disposition |
|---|----------|------------------|-----------------------------------------------------------------------------------------------|-------------|
| 1 | CRITICAL | Blind / Lint     | `pnpm lint` fails with 7 errors (require-imports, no-assign-module-variable) and 8 warnings   | Applied |
| 2 | HIGH     | Acceptance / a11y| Form fields lack `aria-describedby`/`aria-invalid` linking to error messages                  | Applied |
| 3 | HIGH     | Acceptance / i18n| Hardcoded English `(Optional)` in `Field` helper despite `priceOptionalLabel` i18n key existing | Applied |
| 4 | MEDIUM   | Edge             | Beds/Baths data leak: payload includes them after a `Casa → Lote/Terreno` switch              | Applied (R-012 defense-in-depth in `buildLeadPayload`) |
| 5 | MEDIUM   | Acceptance / a11y| `LocationPicker` text input has no `id`; parent `<label>` is decorative-only                  | Applied (added `inputId`/`describedBy`/`invalid` props) |
| 6 | MEDIUM   | Edge             | `validateStep1` does not validate `size`, but `sizeRequired` i18n key is reserved             | Deferred (orphan key reserved for Story 5.3 strict validation; harmless) |
| 7 | MEDIUM   | Edge             | `LocationPicker` lacks 5s timeout / `onerror` fallback for failed Mapbox load                 | Deferred (text input is always functional; submit path is unaffected — UX-DR12 satisfied) |
| 8 | MEDIUM   | Edge             | Photo file size not validated client-side; photos dropped from `buildLeadPayload`              | Deferred (Story 5.3 owns API + photo upload) |
| 9 | LOW      | Edge             | Validation errors persist on Back-then-Next without revalidation                              | Deferred (minor UX; fields show errors, user must successfully advance to clear) |
| 10| LOW      | Blind            | `console.log("[5.1 stub] ...)` ships in production builds                                     | Deferred (intentional per spec; Story 5.3 replaces with real `/api/leads` call) |
| 11| LOW      | Blind            | Hardcoded `text-red-500` for required-asterisk; rest of error path uses `--color-error`       | Deferred (cosmetic; brand semantics unaffected) |
| 12| NOISE    | Blind            | `MapViewLoader` import-time falsy check (`showMap && MapViewLoader`) is dead code             | Dismissed (defensive coding; harmless) |
| 13| NOISE    | Blind            | `getAllAgents()` runs at SSG build time → DB-required at build                                | Dismissed (matches existing pattern across `about/`, `agents/` pages) |

## Layer 1 — Blind Hunter (defects independent of the spec)

- **Lint errors block CI** (`require()`-style imports, `no-assign-module-variable`,
  unused vars). Applied: rewrote tests to use ESM imports for `node:fs` /
  `node:path` and renamed `module` → `sellerFormModule`.
- **Console log in production**: kept as-is per spec stub contract.
- **Map import-time guard is dead code**: `showMap && MapViewLoader ?` —
  `MapViewLoader` is a static named export, never falsy. Harmless; left as-is.

## Layer 2 — Edge Case Hunter (boundary conditions)

- **Beds/Baths data leak (R-012)**: User fills bedrooms=3 for Casa, then
  switches to Lote/Terreno → fields hide, but state persists, and the
  payload would carry the stale bedrooms value. **Applied:** `buildLeadPayload`
  now nulls `bedrooms`/`bathrooms` whenever `propertyType === "Lote/Terreno"`
  (defense-in-depth — UI also hides the fields). This makes the unit-test
  contract `payload.bedrooms === null` verifiable downstream by Story 5.3.
- **Map failure detection**: spec mentions a "5s timeout / `onerror` fallback".
  Implementation uses a 2s progressive-show timer, but no failure detection.
  Deferred — text field is always present and submittable, so the form path
  is robust without explicit failure detection. Mapbox failures inside
  `next/dynamic` would surface as the loading skeleton lingering, which is
  acceptable for this story. Recommend a follow-up to add a 5s timeout that
  swaps in a "Map unavailable — describe location below" notice.
- **Photo size validation**: no client-side enforcement of "10MB each / 5
  files". Deferred — photos aren't currently in the payload; Story 5.3 owns
  validation when wiring `/api/leads`.

## Layer 3 — Acceptance Auditor (spec compliance)

- **Translatable Surfaces (Epic 4 retro)**: spec lists `priceOptionalLabel` /
  `emailOptionalBadge` i18n keys. The `Field` helper hardcoded `"(Optional)"`
  in English. **Applied:** `Field` now accepts an `optionalLabel` prop and the
  price field passes `t("form.step2.priceOptionalLabel")`. Email already
  uses `emailOptionalBadge` correctly.
- **Accessibility — aria-describedby / aria-invalid**: focus area requirement.
  Form fields with errors only used `role="alert"` on the error span. Inputs
  were not programmatically tied to their errors, so screen readers couldn't
  announce the error when focusing the field. **Applied:** `Field` helper now
  passes `{ id, describedBy, invalid }` to its children, and all inputs
  (price, name, phone, email, location, property-type radiogroup) now expose
  `aria-describedby` and `aria-invalid` when an error is present.
- **i18n parity (focus area)**: 92 EN keys, 92 ES keys, all matched. Only 3
  identical values: `phonePlaceholder` (`+506 8888-8888`), `languageEn`
  (`English`), `languageEs` (`Español`) — all acceptable.
- **SellerForm lazy-load contract (R-006, AC #14)**: verified — `seller-form`
  is dynamically imported with `{ ssr: false }`, and the `5.1-E2E-002`
  named-export contract test passes.
- **SSG correctness (AC #12)**: verified — `sell/page.tsx` follows the
  `about/page.tsx` pattern, no `force-dynamic`, no `revalidate`, inherits
  `generateStaticParams` from `[locale]/layout.tsx`.
- **Server / Client boundaries**: `seller-hero.tsx` is a Server Component
  (no `'use client'`, file-content test enforces this). `seller-form.tsx`,
  `location-picker.tsx`, `seller-confirmation.tsx` are correctly marked
  `'use client'`.
- **Map pin-drop progressive enhancement (R-004)**: text input is always
  rendered immediately and is fully functional independently of the map.
  Map loads progressively after 2s. Pin-drop wires `onMapClick → onChange({
  lat, lng })` correctly; `5.1-COMP-001` test confirms.

## Verification

- `pnpm lint` — 0 errors / 5 warnings (all pre-existing in unrelated files).
- `pnpm typecheck` — clean.
- `pnpm test --run tests/unit/seller/` — 29 / 29 passing (3 files).
- `pnpm test --run` (full suite) — 826 / 826 passing, 3 skipped, 1 file
  skipped (unchanged).
- `pnpm format:check` — all matched files use Prettier code style.

## Files Changed (review commit)

- `src/components/seller/seller-form.tsx` — `Field` helper now accepts
  `optionalLabel` and yields `{ id, describedBy, invalid }`; all inputs wire
  `aria-describedby`/`aria-invalid`; `buildLeadPayload` zeroes out beds/baths
  for `Lote/Terreno` (R-012 defense-in-depth).
- `src/components/seller/location-picker.tsx` — accepts `inputId`,
  `describedBy`, `invalid` so the parent's label is programmatically tied to
  the input.
- `tests/unit/seller/seller-form.spec.tsx` — ESM-only imports
  (no `require()`), renamed `module` to satisfy Next.js lint rule.
- `tests/unit/seller/location-picker.spec.tsx` — same.
- `tests/unit/seller/seller-hero.spec.tsx` — same.

## Score

**A- (88/100).** The code is well-structured, the spec was followed faithfully,
i18n parity is exact, the lazy-load contract is honoured, and the SSG /
Server-Client boundaries are correct. Score deductions for lint failures
(blocking CI) and the a11y gaps in error announcement, all corrected in the
review commit.
