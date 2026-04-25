# Story 1.7: Loading States, Empty States & Error Handling

Status: done

## Story

As a **visitor**,
I want smooth loading indicators and helpful error messages,
So that I never feel lost or stuck when something takes time or goes wrong.

## Acceptance Criteria

1. **Given** any page takes >300ms to load **When** rendering **Then** skeleton shimmer placeholders matching the final layout appear (UX-DR19).

2. **Given** a skeleton component **When** `prefers-reduced-motion` is active **Then** the shimmer animation is replaced with static gray — the `skeleton-pulse` keyframe already stops under reduced-motion in `globals.css` (UX-DR18).

3. **Given** a 404 error **When** visiting a non-existent URL **Then** a branded error page displays with:
   - RE/MAX balloon illustration or icon
   - Localized heading and description
   - Navigation links to homepage **and** search
   - Works in both EN and ES

4. **Given** a 500 error **When** a server error occurs **Then** a branded error page shows:
   - "Something went wrong" heading with RE/MAX balloon icon
   - "Try again" button + homepage link
   - Works in both EN and ES
   - Sentry captures the error with context (AR19)

5. **Given** any empty state **When** no content is available **Then** a forward path is always provided — no dead ends (UX-DR20). Every empty-state component includes at least one CTA linking to search, homepage, or WhatsApp.

6. **Given** error pages and empty states **When** rendered **Then** all text is served through `next-intl` message files in both EN and ES — zero hardcoded strings.

7. **Given** the project **When** `npm run lint`, `npm run typecheck`, and `npm run build` execute **Then** all three succeed with zero errors and zero warnings.

## Tasks / Subtasks

### Task 1: Create shadcn/ui Skeleton primitive (AC: #1, #2)

- [ ] Install skeleton primitive via `npx shadcn@latest add skeleton` into `src/components/ui/skeleton.tsx`
- [ ] Verify it applies the `skeleton-pulse` animation already defined in `globals.css` (lines 302-310)
- [ ] Confirm `prefers-reduced-motion` behavior: animation stops → static gray (globals.css lines 478-502)
- [ ] Skeleton wrapper containers should use `aria-busy="true"` to signal loading to screen readers (switch to `false` when content arrives in future stories)
- [ ] **DO NOT** create a custom skeleton from scratch — reuse the shadcn primitive

### Task 2: Build domain skeleton components (AC: #1)

These are **placeholder-only** components — no data fetching logic yet. They will be consumed by future Epic 3/4 stories.

- [ ] `src/components/property/property-card-skeleton.tsx` — matches PropertyCard layout: image rect (aspect-4/3) + title line + specs line + price line. Use `Skeleton` primitive.
- [ ] `src/components/search/search-results-skeleton.tsx` — 6× `PropertyCardSkeleton` in responsive grid (1 col mobile, 2 tablet, 3 desktop). Matches search results grid layout.
- [ ] `src/components/home/homepage-skeleton.tsx` — skeleton for each homepage section (hero shimmer + 3 card placeholders × 3 sections). Matches `homepage-sections.tsx` structure.

File location pattern: place each skeleton adjacent to its content component (e.g., `property-card-skeleton.tsx` beside `property-card.tsx` which will be created in Epic 3).

### Task 3: Upgrade the 404 page (AC: #3, #6)

The existing `src/app/[locale]/not-found.tsx` is functional but minimal. Upgrade it to a branded experience.

- [ ] Update `src/app/[locale]/not-found.tsx`:
  - Import and use `BalloonIcon` component (see Task 3b below)
  - Show `404` as large decorative text (`aria-hidden="true"` — purely visual)
  - Centered layout with heading + description + two CTAs: "Back to home" + "Browse properties"
  - "Browse properties" links to `/` (homepage) for now — `/search` does not exist until Epic 3. Add code comment: `// TODO: change to /search when Epic 3 is implemented`
  - Use `Link` from `@/i18n/navigation` for locale-aware links
  - Use `getTranslations("NotFound")` for all text
  - **IMPORTANT**: Add `setRequestLocale(locale)` call — the existing file is missing it. Obtain locale from the nearest layout's params or use `useLocale()` from `next-intl`. Since `not-found.tsx` is a Server Component, use `import { getLocale } from "next-intl/server"` → `const locale = await getLocale(); setRequestLocale(locale);`

### Task 3b: Create BalloonIcon inline SVG component (AC: #3, #4)

- [ ] Create `src/components/ui/balloon-icon.tsx` — a simple inline SVG of the RE/MAX hot-air balloon mark:
  - Uses brand tokens: `fill` colors from `--brand-balloon-red` (#cc0000), `--brand-balloon-blue` (#003da5), `--brand-balloon-white` (#ffffff)
  - Props: `className?: string`, `size?: number` (default 64)
  - Inline SVG (not an `<img>` tag) — ensures it renders even when public assets/CDN are unreachable (critical for error pages)
  - Keep the SVG simple: a stylized balloon silhouette with the three RE/MAX colors
  - Export as named export: `export function BalloonIcon`

- [ ] Expand `NotFound` namespace in both message files:

  **en.json** — update existing `NotFound` object:
  ```json
  "NotFound": {
    "title": "Page not found",
    "code": "404",
    "description": "The page you're looking for doesn't exist or has been moved.",
    "backHome": "Back to home",
    "browseProperties": "Browse properties"
  }
  ```

  **es.json** — update existing `NotFound` object:
  ```json
  "NotFound": {
    "title": "Página no encontrada",
    "code": "404",
    "description": "La página que buscas no existe o ha sido movida.",
    "backHome": "Volver al inicio",
    "browseProperties": "Buscar propiedades"
  }
  ```

### Task 4: Create global error boundary — `error.tsx` (AC: #4, #6)

Next.js App Router uses `error.tsx` as the error boundary for runtime errors.

- [ ] Create `src/app/[locale]/error.tsx` — **must be a Client Component** (`'use client'`):
  - Receives `{ error: Error & { digest?: string }; reset: () => void }` props from Next.js
  - Shows branded error UI: `BalloonIcon` component + "Something went wrong" heading + description
  - "Try again" button calls `reset()`
  - "Go home" link navigates to `/` (use `Link` from `@/i18n/navigation` — NOT `useRouter`)
  - Reports error to Sentry in a `useEffect`: `Sentry.captureException(error)` — import `* as Sentry from "@sentry/nextjs"`
  - **IMPORTANT**: This is a Client Component — cannot use `getTranslations()`. Use `useTranslations("ErrorPage")` from `next-intl` instead.

- [ ] Create `src/app/global-error.tsx` — catches errors in root layout itself:
  - **LOCATION**: `src/app/global-error.tsx` — at the app root, NOT inside `[locale]/`. This is a Next.js App Router requirement.
  - **Must be a Client Component** (`'use client'`) and **must render its own `<html>` and `<body>` tags** (Next.js requirement — root layout is completely unmounted when this fires)
  - Include **inline `<style>` tag** for minimal styling — Tailwind CSS may not load when the root layout errors. Use plain CSS: centered flexbox, system font stack, brand colors as hex literals.
  - Reports to Sentry via `useEffect`: `Sentry.captureException(error)`
  - Shows minimal "Something went wrong" with "Try again" button calling `reset()`
  - Hardcoded EN-only is acceptable here (root layout unavailable = no i18n provider, no theme)
  - **DO NOT** import any project components (Button, Link, etc.) — they may depend on providers that are unavailable

- [ ] Add `ErrorPage` namespace to both message files:

  **en.json**:
  ```json
  "ErrorPage": {
    "title": "Something went wrong",
    "description": "We're sorry — an unexpected error occurred. Please try again or return to the homepage.",
    "tryAgain": "Try again",
    "goHome": "Go to homepage"
  }
  ```

  **es.json**:
  ```json
  "ErrorPage": {
    "title": "Algo salió mal",
    "description": "Lo sentimos — ocurrió un error inesperado. Inténtalo de nuevo o regresa al inicio.",
    "tryAgain": "Intentar de nuevo",
    "goHome": "Ir al inicio"
  }
  ```

### Task 5: Build reusable EmptyState component (AC: #5, #6)

- [ ] Create `src/components/ui/empty-state.tsx`:
  - Props: `icon` (ReactNode), `title` (string), `description` (string), `primaryAction` (object: `{ label: string; href: string }`), `secondaryAction?` (same shape)
  - Centered layout with icon → title → description → CTA buttons
  - Primary CTA uses `Button` from `src/components/ui/button.tsx` with `Link` from `@/i18n/navigation`
  - Secondary CTA (optional) uses ghost/outline variant
  - **Forward-path rule**: `primaryAction` is required — every empty state MUST have at least one forward path
  - Semantic: wrapped in `<section role="status" aria-live="polite" aria-label={title}>` — `aria-live="polite"` ensures dynamically-rendered empty states (e.g., search returning zero results) are announced to screen readers without interrupting them

### Task 6: Create domain-specific empty state wrappers (AC: #5, #6)

These will be used by future stories but should be buildable and testable now.

- [ ] `src/components/property/no-results-state.tsx` — "No properties match your filters in this area" + "Adjust filters" + "Tell an agent" (WhatsApp CTA with `buildWhatsAppUrl` from `src/lib/constants/offices.ts`)
- [ ] `src/components/property/listing-removed-state.tsx` — "This property is no longer available" + "Browse similar" + "Contact an agent"
- [ ] Add `EmptyStates` namespace to both message files:

  **en.json**:
  ```json
  "EmptyStates": {
    "noResults": {
      "title": "No properties found",
      "description": "No properties match your filters in this area. Try adjusting your search or tell an agent what you're looking for.",
      "adjustFilters": "Adjust filters",
      "tellAgent": "Tell an agent"
    },
    "listingRemoved": {
      "title": "This property is no longer available",
      "description": "It may have been sold or taken off the market. Browse similar properties or contact an agent.",
      "browseSimilar": "Browse similar",
      "contactAgent": "Contact an agent"
    }
  }
  ```

  **es.json**:
  ```json
  "EmptyStates": {
    "noResults": {
      "title": "No se encontraron propiedades",
      "description": "No hay propiedades que coincidan con tus filtros en esta zona. Intenta ajustar tu búsqueda o cuéntale a un agente lo que buscas.",
      "adjustFilters": "Ajustar filtros",
      "tellAgent": "Habla con un agente"
    },
    "listingRemoved": {
      "title": "Esta propiedad ya no está disponible",
      "description": "Es posible que se haya vendido o retirado del mercado. Busca propiedades similares o contacta a un agente.",
      "browseSimilar": "Buscar similares",
      "contactAgent": "Contactar agente"
    }
  }
  ```

### Task 7: Verify Sentry integration (AC: #4)

- [ ] Confirm `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` exist at project root — they already do.
- [ ] Confirm `@sentry/nextjs` is in `package.json` dependencies — it is (`^10.48.0`).
- [ ] In `error.tsx`, import `* as Sentry from "@sentry/nextjs"` and call `Sentry.captureException(error)` inside `useEffect`.
- [ ] In `global-error.tsx`, do the same.
- [ ] **DO NOT** install a new Sentry package or modify existing Sentry configs — they are production-ready from Story 1.1.

### Task 8: Final verification (AC: #7)

- [ ] Run `npm run lint` — zero errors, zero warnings
- [ ] Run `npm run typecheck` — zero errors
- [ ] Run `npm run build` — zero errors; all existing static routes remain static (`○` or `●`)
- [ ] Verify `not-found.tsx` renders correctly at `/en/nonexistent` and `/es/nonexistent`
- [ ] Smoke-test `error.tsx`:
  1. Create temporary file `src/app/[locale]/test-error/page.tsx` containing: `export default function TestError() { throw new Error("Test error boundary"); }`
  2. Navigate to `/en/test-error` — confirm branded error UI renders with "Try again" and "Go to homepage" CTAs
  3. Open browser DevTools console — confirm Sentry `captureException` fires (or check Sentry dashboard if DSN is configured)
  4. Click "Try again" — confirm page attempts to re-render
  5. **Delete** `src/app/[locale]/test-error/` directory after verification — do NOT ship test-error page

## Dev Notes

### Architecture & Technology Constraints

- **Next.js 15 App Router** — use `error.tsx` (Client Component) and `not-found.tsx` (Server Component) file conventions. See [Source: architecture.md §File Structure].
- **Tailwind v4 + shadcn/ui** — all UI primitives come from shadcn. The `Skeleton` primitive is the only new shadcn component needed. Install via CLI.
- **next-intl** — all user-facing text must go through message files. Server Components use `getTranslations()`, Client Components use `useTranslations()`. [Source: 1-4-internationalization-en-es.md]
- **Sentry (@sentry/nextjs ^10.48.0)** — already configured in three config files at project root. DO NOT reconfigure. Just import and use `Sentry.captureException()` in error boundaries.
- **npm** — package manager. No yarn, no pnpm.

### Existing Codebase Patterns to Follow

| Pattern | Example | Location |
|---------|---------|----------|
| Server Component page | `page.tsx` with `getTranslations` | `src/app/[locale]/about/page.tsx` |
| Client Component | `'use client'` + `useTranslations` | `src/components/lead/contact-form.tsx` |
| Locale-aware links | `import { Link } from "@/i18n/navigation"` | All page components |
| Button component | `import { Button } from "@/components/ui/button"` | Contact/Join pages |
| Design tokens | `text-brand-navy`, `bg-brand-crema`, `text-muted-foreground` | All components |
| Container class | `className="container"` (max-w 1400px) | All page layouts |
| Reduced motion | Already handled globally in `globals.css` lines 478-502 | N/A — just ensure new animations use CSS vars |

### Skeleton Animation — Already Set Up

The `skeleton-pulse` keyframe is already defined in `globals.css` (line 302-310) with a `--duration-skeleton: 2s` token. The reduced-motion override (lines 496-501) collapses it to a single static frame. The shadcn `Skeleton` component should consume this animation. Verify after installation.

### Forward-Path Rule (UX-DR20)

Every empty state and error state **must** offer at least one actionable CTA. The UX spec table (line 2309-2320) defines these:

| State | Primary CTA | Secondary CTA |
|-------|-------------|---------------|
| Empty search | "Adjust filters" | "Tell an agent" (WhatsApp) |
| Listing removed | "Browse similar" | "Contact an agent" |
| 404 | "Back to home" | "Search properties" |
| 500 / error | "Try again" | "Go to homepage" |

### Critical `error.tsx` / `global-error.tsx` Rules (Next.js 15)

1. `error.tsx` **must** be a Client Component (`'use client'`).
2. `error.tsx` receives `{ error: Error & { digest?: string }; reset: () => void }`.
3. `global-error.tsx` **must** render `<html>` and `<body>` (root layout is unmounted).
4. `global-error.tsx` does NOT have access to providers (no i18n, no theme) — hardcode EN strings.
5. The `reset()` function re-renders the segment — do not navigate away unless the user clicks "Go home".

### File Structure

```
src/
├── app/
│   ├── global-error.tsx              # NEW — root-level error boundary (MUST be here, NOT inside [locale]/)
│   ├── [locale]/
│   │   ├── error.tsx                 # NEW — locale-level error boundary
│   │   └── not-found.tsx             # MODIFY — upgrade to branded 404
│   │
├── components/
│   ├── ui/
│   │   ├── skeleton.tsx              # NEW — shadcn primitive (via CLI)
│   │   ├── empty-state.tsx           # NEW — reusable empty-state shell
│   │   └── balloon-icon.tsx          # NEW — inline SVG balloon mark for error pages
│   ├── property/
│   │   ├── property-card-skeleton.tsx # NEW — property card loading shape
│   │   ├── no-results-state.tsx      # NEW — search empty state
│   │   └── listing-removed-state.tsx # NEW — removed listing state
│   ├── search/
│   │   └── search-results-skeleton.tsx # NEW — grid of skeleton cards
│   └── home/
│       └── homepage-skeleton.tsx      # NEW — homepage section skeletons
│
├── messages/
│   ├── en.json                       # MODIFY — add ErrorPage + EmptyStates + expand NotFound
│   └── es.json                       # MODIFY — add ErrorPage + EmptyStates + expand NotFound
```

### What This Story Does NOT Do

- **No `loading.tsx` files** — Next.js `loading.tsx` triggers React Suspense boundaries. Currently all pages are SSG/static and load instantly. `loading.tsx` files will be added in Epic 3 when CSR search pages are introduced.
- **No data fetching** — Skeleton and empty-state components are UI-only. They will be wired to real data in Epic 2/3.
- **No toast component** — Toast already exists conceptually in the contact form. A shadcn Toast primitive may be added in a future story if needed.
- **No Sentry configuration changes** — Config files are production-ready from Story 1.1.

### Previous Story Intelligence (Story 1.6)

Key learnings to carry forward:
- **Named exports** — project convention is named exports, not default exports (despite some spec wording). Exception: Next.js page/layout/error files which require default exports.
- **`!important` Tailwind modifiers** — acceptable workaround in Tailwind v4 when specificity conflicts arise (documented in Story 1.5 Debug Log #2).
- **`Link` from `@/i18n/navigation`** — always use this, never `next/link` directly. Ensures locale prefix is preserved.
- **`setRequestLocale(locale)`** — required in all Server Component pages that use `getTranslations`. Not needed in Client Components.
- **Button styling** — use the `Button` component from `src/components/ui/button.tsx`. Variants: `default` (primary), `outline`, `ghost`.
- **`buildWhatsAppUrl`** — helper exists in `src/lib/constants/offices.ts` for constructing WhatsApp deep links with pre-populated messages.

### References

- [Source: epics.md#Story 1.7 — lines 760-790]
- [Source: architecture.md#File Structure — lines 195-240]
- [Source: architecture.md#Sentry — line 1014]
- [Source: ux-design-specification.md#Empty States & Error States — lines 2309-2320]
- [Source: ux-design-specification.md#Loading States — lines 2322-2335]
- [Source: ux-design-specification.md#Animation & Transition Timing — skeleton-pulse — line 2366]
- [Source: ux-design-specification.md#prefers-reduced-motion — lines 2370-2376]
- [Source: globals.css#skeleton-pulse — lines 301-310]
- [Source: globals.css#reduced-motion — lines 477-502]
- [Source: 1-6-static-content-pages.md#Change Log — lessons learned]

### Review Findings

- [x] [Review][Patch] Skeleton animation uses `animate-pulse` instead of custom `skeleton-pulse` keyframe — violates AC #1/#2 [skeleton.tsx:7]
- [x] [Review][Patch] Hardcoded English `aria-label="Loading search results"` — violates AC #6 [search-results-skeleton.tsx:8]
- [x] [Review][Patch] 🔴 External WhatsApp URLs broken by locale-aware `Link` wrapping — broken CTA [empty-state.tsx:53-54]
- [x] [Review][Patch] Hardcoded English WhatsApp messages in empty state wrappers — violates AC #6 [listing-removed-state.tsx:13, no-results-state.tsx:14]
- [x] [Review][Patch] Missing "Go to homepage" link in `global-error.tsx` — incomplete forward-path [global-error.tsx:116]
- [x] [Review][Defer] Both 404 CTAs point to same URL (`/`) — deferred, will resolve in Epic 3 when `/search` exists

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking) — via Antigravity

### Debug Log References

### Completion Notes List

### Change Log

### File List
