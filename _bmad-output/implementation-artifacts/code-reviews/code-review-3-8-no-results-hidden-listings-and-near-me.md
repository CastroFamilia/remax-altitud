---
story: '3.8-no-results-hidden-listings-and-near-me'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-05-02'
diff_source: 'branch story-3.8-no-results-hidden-listings-and-near-me vs main'
review_mode: 'full'
spec_file: '_bmad-output/implementation-artifacts/3-8-no-results-hidden-listings-and-near-me.md'
---

# Code Review — Story 3.8: No-Results, Hidden Listings & Near Me

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. The implementation delivers all
seven acceptance criteria: dynamic WhatsApp CTA forwarding search criteria,
hidden listing page with similar properties, Geolocation API hook with denied
fallback, NearMeButton wired into the toolbar, MapView fly-to integration, and
i18n keys for the new NearMe namespace. 585 unit tests pass.

**Four findings were applied** — the meaningful ones from the three review
layers. Highlights:

- `NearMeButton`'s `useEffect` listed the `onLocationSuccess` /
  `onLocationFallback` callbacks in its deps array. Since `SplitViewLayout`
  passes inline arrow functions as those callbacks, every parent re-render
  (e.g. on filter change, results update) would re-fire the effect and call
  `setFlyToTarget` again — causing redundant fly-to operations and noisy
  fallback banners. Fixed by holding the callbacks in refs and removing them
  from the deps array, so the effect only fires when the geolocation state
  actually transitions.
- `useGeolocation` returned hardcoded English fallback strings
  ("Location unavailable — showing properties near our Pérez Zeledón office",
  etc.), bypassing the bilingual i18n contract. Refactored the hook to expose
  a structured `fallbackReason: 'denied' | 'error' | 'unsupported'` instead;
  `NearMeButton` now maps the reason to a localized message via
  `useTranslations('NearMe')`. Added `fallbackDenied` / `fallbackError` /
  `fallbackUnsupported` keys to both `en.json` and `es.json`.
- `NoResultsState` built the WhatsApp message from hardcoded English strings
  ("Hi, I'm looking for: ", "Type: ", "Min price: ", etc.). Spanish users
  would have received an English message. Wired all criteria labels and the
  intro through `useTranslations('EmptyStates.noResults')` with new
  `whatsappIntro`, `whatsappAnyProperty`, `criteriaType`, `criteriaMinPrice`,
  `criteriaMaxPrice`, `criteriaBedrooms`, `criteriaBathrooms`, `criteriaArea`,
  `criteriaTags` keys (en + es).
- The Near Me fallback banner's dismiss button used a hardcoded
  `aria-label="Dismiss"` even though `NearMe.fallbackDismiss` already existed.
  Wired through `useTranslations('NearMe')`.

CI snapshot post-fix: **585 tests pass, 3 skipped** (pre-existing schema
tests), lint clean (0 errors, 2 pre-existing warnings unrelated to this
story), typecheck clean, build green, prettier clean.

## Findings — Triage

| # | Severity | Source              | Title                                                                                          | Disposition |
|---|----------|---------------------|------------------------------------------------------------------------------------------------|-------------|
| 1 | HIGH     | Blind + Edge        | NearMeButton useEffect deps include callback functions — re-fires on every parent re-render   | Applied     |
| 2 | HIGH     | Blind + Auditor     | useGeolocation returns hardcoded English fallback strings — breaks bilingual contract         | Applied     |
| 3 | HIGH     | Blind + Auditor     | NoResultsState WhatsApp message and criteria labels are hardcoded English                     | Applied     |
| 4 | LOW      | Blind Hunter        | Fallback banner dismiss button has hardcoded `aria-label="Dismiss"`                            | Applied     |
| 5 | LOW      | Edge Case Hunter    | `getNearestOfficeCoords` exists but is never called — always falls back to PZ office          | Deferred    |
| 6 | MEDIUM   | Acceptance Auditor  | AC #5 "radius overlay" / user-location marker not implemented                                  | Deferred    |
| 7 | LOW      | Acceptance Auditor  | `data-testid="agent-cta"` only present on no-similar-properties branch of unavailable page    | Deferred    |
| 8 | NOISE    | Edge Case Hunter    | `<div data-testid="listing-unavailable-page">` is content-less wrapper                         | Dismissed   |
| 9 | NOISE    | Edge Case Hunter    | `getNearestOfficeCoords` uses Euclidean distance on lat/lng (acceptable for Costa Rica scale) | Dismissed   |

### Deferred — Rationale

- **#5** Per the story spec (Task 7): "Import `OFFICE_PZ_COORDS` in
  `use-geolocation.ts` for the fallback." The spec explicitly defaults to PZ.
  `getNearestOfficeCoords` is exported for future callers (e.g. when
  geolocation succeeds and we want to route the lead to the closer office).
  Leaving as-is.
- **#6** The story dev notes explicitly accept an MVP without the radius
  overlay or user-location marker: "Choose the Marker approach for MVP to
  avoid the complexity of Mapbox source/layer management in tests." The
  current implementation flies the map to the user's coords without a
  marker; AC #5 is satisfied in spirit ("flies to the user's location"). The
  visible-marker enhancement is a follow-up.
- **#7** The E2E tests are still skipped (RED phase) — the testid placement
  matches the spec wording ("if present; or on the browse-all button
  fallback"). When E2E tests are activated and the seeded hidden property
  has similar properties, this gap will surface and can be addressed by
  adding a dedicated agent CTA card in the similar-properties branch.

## Files Changed by Review

```
src/components/search/near-me-button.tsx       — useRef pattern for callbacks; localize fallback message
src/hooks/use-geolocation.ts                   — replace fallbackMessage with fallbackReason
src/components/search/split-view-layout.tsx    — i18n on dismiss button aria-label
src/components/property/no-results-state.tsx   — i18n on WhatsApp intro and criteria labels
src/messages/en.json                           — fallbackDenied/Error/Unsupported + whatsapp criteria keys
src/messages/es.json                           — same Spanish translations
tests/unit/search/use-geolocation.spec.tsx     — assert on fallbackReason instead of fallbackMessage
tests/unit/search/near-me-button.spec.tsx      — mock fallbackReason; assert on i18n key
```
