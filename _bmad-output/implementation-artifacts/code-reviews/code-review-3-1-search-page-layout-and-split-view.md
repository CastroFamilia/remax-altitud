---
story: '3.1-search-page-layout-and-split-view'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-04-25'
diff_source: 'branch story-3.1-search-page-layout-split-view vs main'
review_mode: 'full'
spec_file: '_bmad-output/implementation-artifacts/3-1-search-page-layout-and-split-view.md'
---

# Code Review — Story 3.1: Search Page Layout & Split-View

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. The implementation matches
the story spec well: Server Component shell with `setRequestLocale`, CSR
client tree under Suspense, URL-as-state for `viewMode`, sticky filter bar,
mobile pull-up handle stub, and full responsive split-view layout. The 21
new component tests under `tests/unit/search/` all pass and config wiring
(`vitest` jsdom env, `esbuild.jsx`, alias) is clean.

**Four findings were applied** — the meaningful ones from the three review
layers. Highlights:

- The new sticky filter bar collided with the existing sticky `<Header>`
  (both pinned to `top-0`), so it would render *behind* the header and
  obscure the placeholder. Fixed by pinning the filter bar to
  `top-[var(--header-height)]`, reusing the CSS variable already added in
  this story.
- The mobile pull-up handle was hardcoded as the literal string
  `"24 properties"`, which broke i18n for Spanish users despite the
  `SearchPage.pullUpHandle.propertiesCount` key being in the messages
  bundle. Wired through `useTranslations`, and upgraded both `en.json` and
  `es.json` to ICU plural form so 1 vs N renders correctly in both locales.
- Mobile `h-screen` on the map panel overflowed by the height of the
  filter bar (h-12), exposing the page background through the bottom edge.
  Switched to `h-[calc(100vh-var(--header-height)-3rem)]` on mobile and
  kept the desktop `h-[calc(100vh-...-3.5rem)]` formula unchanged.
- `generateMetadata` declared the `robots: { index: false, follow: false }`
  rule but ignored the `SearchPage.title` and `SearchPage.description`
  i18n keys that this story added. Wired them through `getTranslations`.

CI snapshot post-fix: **265 tests pass, 3 skipped** (pre-existing schema
tests), lint clean, typecheck clean, build green, prettier clean for all
new/modified files (the pre-existing `src/app/api/sync/route.ts` warning is
unrelated and called out in the story dev notes).

## Findings — Triage

| # | Severity | Source              | Title                                                                                          | Disposition |
|---|----------|---------------------|------------------------------------------------------------------------------------------------|-------------|
| 1 | HIGH     | Blind + Edge        | Sticky filter bar `top-0` collides with sticky `<Header>` (both pinned to viewport top)        | Applied     |
| 2 | HIGH     | Edge Case Hunter    | Mobile pull-up handle renders hardcoded `"24 properties"` — bypasses i18n bundle               | Applied     |
| 3 | MEDIUM   | Edge Case Hunter    | Mobile map `h-screen` overflows by filter bar height (no offset for h-12)                      | Applied     |
| 4 | LOW      | Acceptance Auditor  | `generateMetadata` doesn't use `SearchPage.title` / `SearchPage.description` i18n keys         | Applied     |
| 5 | NOISE    | Blind Hunter        | `onViewModeChange` callback in `search-page-client.tsx` is a no-op                             | Dismissed   |
| 6 | NOISE    | Edge Case Hunter    | Tablet side-panel toggle button has no explicit `:focus-visible` style                         | Dismissed   |
| 7 | LOW      | Blind Hunter        | Tablet base view shows map full-width until toggle is clicked (not 60/40 by default)           | Deferred    |
| 8 | NOISE    | Blind Hunter        | `useState` for tablet `sidePanelOpen` not lifted into URL params                               | Dismissed   |

### #1 — Sticky filter bar collides with sticky `<Header>` (Applied)

**Location:** `src/components/search/search-filter-bar.tsx`.

`<Header>` (`src/components/layout/header.tsx`) is `sticky top-0` with
`zIndex: var(--z-sticky-nav)` (= 30). The new `SearchFilterBar` was also
`sticky top-0` with `z-10`. Both want to pin to the viewport edge, but the
header has a higher z-index, so on scroll the filter bar slides up *behind*
the header and disappears — failing AC #6 ("filter bar remains fixed at
the top of the grid panel").

The story already adds `--header-height: 64px` to `:root` for exactly this
kind of offset. Fix is to pin the filter bar to that variable:

```diff
- className="sticky top-0 z-10 h-12 md:h-14 ..."
+ className="sticky top-[var(--header-height)] z-10 h-12 md:h-14 ..."
```

Test updated to assert the new `top-[var(--header-height)]` class instead
of `top-0`.

### #2 — Mobile pull-up handle hardcodes "24 properties" (Applied)

**Location:** `src/components/search/split-view-layout.tsx` line 99 (pre-fix).

The component renders the literal string `"24 properties"` even though
`src/messages/en.json` and `src/messages/es.json` both contain
`SearchPage.pullUpHandle.propertiesCount` for this exact text. Spanish
users see "24 properties" instead of "24 propiedades", breaking the i18n
contract (UX-DR21 / Story 1.3 i18n setup).

**Fix applied:** wired through `useTranslations("SearchPage.pullUpHandle")`
and called `t("propertiesCount", { count: stubPropertyCount })`. The stub
count of 24 is preserved (it's a stub the spec calls out — Story 3.5 wires
real results), but the rendering is now locale-aware.

Also upgraded both locale files to ICU plural form so 1 property and N
properties render with correct grammar in both English and Spanish:

```json
"propertiesCount": "{count, plural, one {# property} other {# properties}}"
"propertiesCount": "{count, plural, one {# propiedad} other {# propiedades}}"
```

Test (`split-view-layout.spec.tsx`) gained a `next-intl` mock that mimics
the ICU shape so the existing assertions still hold.

### #3 — Mobile map `h-screen` overflows by filter bar height (Applied)

**Location:** `src/components/search/split-view-layout.tsx` (map panel className).

On mobile, the map panel was sized `h-screen` (= 100vh) while the layout
flow placed it directly below the sticky filter bar (`h-12` = 3rem) and
the global header. The map therefore extends past the viewport bottom by
(header + filter bar). The bottom edge — including the pull-up-handle
strip — is pushed below the fold.

**Fix applied:** subtract both the header and the mobile filter bar from
the map height, mirroring the desktop formula:

```diff
- "h-screen",
- "lg:h-[calc(100vh-var(--header-height)-3.5rem)]",
+ "h-[calc(100vh-var(--header-height)-3rem)]",
+ "lg:h-[calc(100vh-var(--header-height)-3.5rem)]",
```

The desktop test (`P1: map panel height uses calc(100vh - ...)`) only
checks for the `calc(100vh` token, so it stays green.

### #4 — `generateMetadata` ignores `SearchPage.title` / `description` (Applied)

**Location:** `src/app/[locale]/search/page.tsx`.

The story added `SearchPage.title` ("Search Properties" / "Buscar
Propiedades") and `SearchPage.description` to both message bundles, but
`generateMetadata` only set `robots`. The browser tab title therefore fell
back to the root `<title>` from `[locale]/layout.tsx` (likely the site
name) — usable but not what the messages encode and a small SEO miss even
for non-indexed pages (the title still shows in tabs and shared links).

**Fix applied:** await `params`, call `getTranslations({ locale, namespace:
"SearchPage" })`, and return `title` + `description` alongside the existing
`robots`. The `robots` rule (no index, no follow) is preserved per the
Architecture URL Strategy.

### #5 — `onViewModeChange` is a no-op (Dismissed)

`SearchPageClient` passes a no-op `onViewModeChange` to `SplitViewLayout`,
which in turn passes it to `ViewModeToggle`. `ViewModeToggle` updates the
URL via `router.replace()`, and the URL change re-renders
`SearchPageClient`, which re-reads `useSearchParams().get("view")`. The
prop is intentional decoupling — child components don't depend on parent
state, only on URL — and the prop interface keeps the component reusable
in contexts where a parent *does* care (e.g. analytics). Not a bug.

### #6 — Tablet toggle button missing explicit `:focus-visible` (Dismissed)

`globals.css` has a global `:focus-visible` rule (UX-DR24, dual-ring) that
applies to every focusable element. The button doesn't override that, so
the dual-ring still renders. No fix needed.

### #7 — Tablet defaults to map-full until toggle clicked (Deferred)

AC #4 says tablet shows the map and grid 60/40 with a side-panel toggle.
Task 3 of the story describes the implementation as "grid panel hidden
behind side-panel toggle button" — i.e., grid hidden by default, toggle
reveals it. The current code matches the task description verbatim (grid
is `md:hidden` until `sidePanelOpen` flips it to `md:block md:w-[40%]`).
The AC is ambiguous between "always 60/40 with toggle that just slides
the grid" and "60/40 reveals on toggle"; the current behaviour matches the
story task and the existing tests pass for it. Deferred as a UX
clarification rather than a code bug — re-evaluate in retro or Story 3.6
if the visual reference disagrees.

### #8 — Tablet `sidePanelOpen` is in `useState`, not URL (Dismissed)

The story explicitly scopes URL-as-state to `viewMode`, filters, and sort
(AR10 / UX-DR21). The tablet toggle is a transient UI state — closing the
panel shouldn't be shareable, and re-opening on every page load would be
wrong. `useState` is correct here.

## CI Snapshot Post-Fix

```
typecheck: 0 errors
lint:      0 errors / 0 warnings
build:     pass (Suspense boundary + dynamic rendering for /[locale]/search)
test:      265 pass | 3 skipped | 0 fail
format:    clean for all new/modified files (pre-existing api/sync warning unchanged)
```

## Files Touched by Code Review (post-dev fixes)

- `src/components/search/search-filter-bar.tsx` — pin to `top-[var(--header-height)]`
- `src/components/search/split-view-layout.tsx` — i18n pull-up label, mobile map calc-height
- `src/app/[locale]/search/page.tsx` — wire i18n title/description into `generateMetadata`
- `src/messages/en.json` — ICU plural for `propertiesCount`
- `src/messages/es.json` — ICU plural for `propertiesCount`
- `tests/unit/search/search-filter-bar.spec.tsx` — assertion now matches new sticky offset
- `tests/unit/search/split-view-layout.spec.tsx` — added `next-intl` mock for the pull-up handle
