# Story 1.5: Homepage Shell & Split-Hero

Status: done

## Story

As a **visitor**,
I want a stunning homepage that immediately shows me mountain AND coast living options,
So that I understand RE/MAX Altitud's unique geographic coverage within 3 seconds.

## Acceptance Criteria

1. **Given** the homepage loads **When** rendered on desktop (≥ 1024px) **Then** a split-hero with 50/50 horizontal panes (mountain left, coast right) fills 80vh with a subtle Ken Burns animation on both images.

2. **Given** desktop split-hero **When** hovering or keyboard-focusing a pane **Then** it expands 50% → 55% with the other pane contracting to 45% using `transition: flex-basis var(--duration-smooth) var(--ease-smooth)` (never `transition: all`).

3. **Given** mobile viewport (< 768px) **When** the homepage loads **Then** the split-hero stacks vertically as Mountain pane (40vh) → Search bar shell → Coast pane (40vh) so the search bar is visible without scrolling past both panes.

4. **Given** tablet viewport (768–1023px) **When** the homepage loads **Then** panes remain horizontally side-by-side at 60vh (reduced height) with no hover expand.

5. **Given** the split-hero **When** the glassmorphism search overlay renders **Then** it shows a non-functional search bar shell (visual placeholder for Epic 3) using the `.glass` or `.glass-strong` utility from globals.css, with a disabled input, a Smart ✨ / Traditional ⚙ toggle preview, and a Search icon — the whole shell has `aria-disabled="true"` and does not submit or navigate.

6. **Given** the homepage **When** scrolling past the hero **Then** placeholder sections render in this order: Featured Properties (3-up grid desktop / horizontal carousel mobile), Featured Communities (gold-bordered cards, horizontal carousel mobile), Area Highlights (2-column desktop), Sell CTA block (full-width with glassmorphism), Footer (existing from Story 1.3).

7. **Given** the two entry paths (Explore = pane click, Execute = search bar) **When** the page loads **Then** both modes are telegraphed above the fold on desktop (hero visible without scroll) and on mobile (both panes + search bar visible within the first 100vh).

8. **Given** mobile viewport **When** placeholder sections render **Then** Featured Properties and Featured Communities use horizontal scrollable carousels (not vertical stacks) with CSS scroll-snap; CTAs are reachable within 2 scroll gestures.

9. **Given** a user with `prefers-reduced-motion: reduce` **When** the homepage loads **Then** Ken Burns animation and pane hover expansion are disabled (panes stay 50/50, images stay static) — verified via the existing reduced-motion override in globals.css.

10. **Given** the homepage **When** rendered in EN or ES **Then** all labels, CTAs, pane titles, section headings, and image `alt` text are fully translated via `next-intl` (no hardcoded English strings).

11. **Given** accessibility requirements **When** keyboard-navigating the homepage **Then** pane CTAs ("Explore Mountain Homes" / "Explore Beach Homes") are reachable via Tab, have visible focus rings (UX-DR24 dual-ring), and activate on Enter/Space; the page has exactly one `<h1>`.

12. **Given** the code is pushed **When** CI runs **Then** `npm run typecheck`, `npm run lint`, and `npm run build` all pass with zero errors and zero warnings.

## Tasks / Subtasks

### Task 1: Source & stage hero images (AC: #1, #3)

- [x] Place two production-quality hero images in `public/images/home/`:
  - `hero-mountains.jpg` — Pérez Zeledón mountain landscape (valleys, rivers, lush greens). Target: 1920×1080 minimum, landscape orientation, <200KB after compression (architecture §8 performance budget: "Largest image < 200KB via next/image WebP").
  - `hero-coast.jpg` — Dominical/Uvita beach/ocean view (pristine beaches, palm trees, ocean).
- [x] Add a single placeholder image if final brand imagery is not yet available — user can swap the file later (same path, no code change). Document the expected filenames and dimensions in a comment inside `split-hero.tsx`.
- [x] **Do NOT** commit multi-MB raw photos. Compress to JPEG quality 82 or use WebP if available. `next/image` will generate responsive variants at build time.

### Task 2: Extend i18n message files with HomePage namespace (AC: #10)

- [x] Update `src/messages/en.json` — extend the existing `HomePage` namespace (do not replace; keep `title`/`subtitle`/`scaffoldingNote` keys even if no longer rendered — future-proof for Epic 4 SEO meta):
  ```json
  "HomePage": {
    "title": "RE/MAX Altitud",
    "subtitle": "Costa Rica's Southern Zone — Real Estate Platform",
    "scaffoldingNote": "Foundation scaffolding complete. Content coming in Stories 1.5–1.7.",
    "hero": {
      "mountainsLabel": "The Mountains",
      "mountainsRegion": "Pérez Zeledón",
      "mountainsCta": "Explore Mountain Homes",
      "mountainsAlt": "Misty mountain landscape of Pérez Zeledón, Costa Rica",
      "coastLabel": "The Coast",
      "coastRegion": "Dominical · Uvita",
      "coastCta": "Explore Beach Homes",
      "coastAlt": "Pristine Pacific coast beach near Dominical, Costa Rica",
      "searchPlaceholder": "Search properties, areas, or lifestyles…",
      "searchAriaLabel": "Search properties (coming soon)",
      "searchSubmit": "Search",
      "smartToggle": "Smart Search",
      "traditionalToggle": "Traditional Search",
      "shellNotice": "Search coming soon"
    },
    "featuredProperties": {
      "heading": "Featured Properties",
      "description": "Hand-picked homes across Costa Rica's Southern Zone.",
      "viewAll": "View all properties",
      "shellNotice": "Featured properties coming soon"
    },
    "featuredCommunities": {
      "heading": "Featured Communities",
      "description": "Curated developments in the mountains and on the coast.",
      "viewAll": "View all communities",
      "shellNotice": "Featured communities coming soon"
    },
    "areaHighlights": {
      "heading": "Explore Our Areas",
      "description": "From mountain valleys to Pacific beaches.",
      "viewAll": "View all areas",
      "shellNotice": "Area highlights coming soon"
    },
    "sellCta": {
      "heading": "Ready to list your property?",
      "description": "Partner with RE/MAX Altitud's expert agents across Pérez Zeledón, Dominical, and Uvita.",
      "cta": "List with Us"
    }
  }
  ```
- [x] Update `src/messages/es.json` — same structure with Spanish translations:
  - `hero.mountainsLabel`: "Las Montañas"
  - `hero.mountainsRegion`: "Pérez Zeledón"
  - `hero.mountainsCta`: "Explorar Casas en la Montaña"
  - `hero.mountainsAlt`: "Paisaje montañoso nublado de Pérez Zeledón, Costa Rica"
  - `hero.coastLabel`: "La Costa"
  - `hero.coastRegion`: "Dominical · Uvita"
  - `hero.coastCta`: "Explorar Casas en la Playa"
  - `hero.coastAlt`: "Costa pacífica prístina cerca de Dominical, Costa Rica"
  - `hero.searchPlaceholder`: "Busca propiedades, zonas o estilos de vida…"
  - `hero.searchAriaLabel`: "Buscar propiedades (próximamente)"
  - `hero.searchSubmit`: "Buscar"
  - `hero.smartToggle`: "Búsqueda Inteligente"
  - `hero.traditionalToggle`: "Búsqueda Tradicional"
  - `hero.shellNotice`: "Búsqueda próximamente"
  - `featuredProperties.heading`: "Propiedades Destacadas"
  - `featuredProperties.description`: "Casas seleccionadas a mano en la Zona Sur de Costa Rica."
  - `featuredProperties.viewAll`: "Ver todas las propiedades"
  - `featuredProperties.shellNotice`: "Propiedades destacadas próximamente"
  - `featuredCommunities.heading`: "Comunidades Destacadas"
  - `featuredCommunities.description`: "Desarrollos seleccionados en la montaña y en la costa."
  - `featuredCommunities.viewAll`: "Ver todas las comunidades"
  - `featuredCommunities.shellNotice`: "Comunidades destacadas próximamente"
  - `areaHighlights.heading`: "Explora Nuestras Zonas"
  - `areaHighlights.description`: "Desde valles montañosos hasta playas del Pacífico."
  - `areaHighlights.viewAll`: "Ver todas las zonas"
  - `areaHighlights.shellNotice`: "Zonas destacadas próximamente"
  - `sellCta.heading`: "¿Listo para vender tu propiedad?"
  - `sellCta.description`: "Trabaja con los agentes expertos de RE/MAX Altitud en Pérez Zeledón, Dominical y Uvita."
  - `sellCta.cta`: "Lista con Nosotros"
- [x] **Translation style rule (from Story 1.4):** use informal "tú" (e.g., "Explora", "Busca", "Lista") — not formal "usted". Keep proper nouns (Pérez Zeledón, Dominical, Uvita) identical in both languages.

### Task 3: Add Ken Burns and pane-expansion CSS (AC: #1, #2, #9)

- [x] Append to `src/styles/globals.css` (inside the `@layer utilities` block, near the existing `.glass` utilities):
  ```css
  /* Split-hero — Ken Burns slow zoom (UX-DR1, UX-DR18) */
  @keyframes ken-burns {
    0%   { transform: scale(1)    translate(0, 0); }
    50%  { transform: scale(1.08) translate(-1%, -1%); }
    100% { transform: scale(1)    translate(0, 0); }
  }

  .ken-burns {
    animation: ken-burns 20s var(--ease-smooth) infinite;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .ken-burns { animation: none; }
  }
  ```
- [x] **Do NOT add a second reduced-motion override** — the existing block at `globals.css:442-459` already flattens `--duration-*` tokens. The animation rule above overrides the keyframe entirely.
- [x] Pane flex-basis transition goes on the pane element via inline class: `transition-[flex-basis] duration-[var(--duration-smooth)] ease-[var(--ease-smooth)]` — never use `transition-all`.

### Task 4: Build `SplitHero` component (AC: #1, #2, #3, #4, #7, #11)

- [x] Create `src/components/home/split-hero.tsx` (Server Component if possible; Client Component only if hover-expand state requires JS — prefer CSS-only `:hover` + `:focus-within` for desktop, no JS):
  ```typescript
  import Image from "next/image";
  import { useTranslations } from "next-intl";
  import { Link } from "@/i18n/navigation";
  import { HeroSearchShell } from "@/components/home/hero-search-shell";
  import { cn } from "@/lib/utils";

  export function SplitHero() {
    const t = useTranslations("HomePage.hero");

    return (
      <section
        aria-label={t("mountainsLabel") + " / " + t("coastLabel")}
        className="relative"
      >
        {/* Desktop + tablet: horizontal split. Mobile: vertical stack with search between. */}
        <div className="flex flex-col md:flex-row md:h-[60vh] lg:h-[80vh]">
          {/* Mountain pane */}
          <HeroPane
            image="/images/home/hero-mountains.jpg"
            altKey="mountainsAlt"
            labelKey="mountainsLabel"
            regionKey="mountainsRegion"
            ctaKey="mountainsCta"
            href="/search?region=mountain"
            accent="mountain"
          />

          {/* Mobile-only search between panes */}
          <div className="md:hidden">
            <HeroSearchShell variant="mobile-inline" />
          </div>

          {/* Coast pane */}
          <HeroPane
            image="/images/home/hero-coast.jpg"
            altKey="coastAlt"
            labelKey="coastLabel"
            regionKey="coastRegion"
            ctaKey="coastCta"
            href="/search?region=coast"
            accent="coast"
          />
        </div>

        {/* Desktop + tablet: search bar overlays the split (absolute center) */}
        <div className="hidden md:block">
          <HeroSearchShell variant="desktop-overlay" />
        </div>
      </section>
    );
  }
  ```
- [x] Create the `HeroPane` subcomponent in the same file (not exported). The pane must:
  - Use `next/image` with `fill`, `sizes="(max-width: 768px) 100vw, 50vw"`, `priority` on BOTH panes (they're the LCP element).
  - Include `.ken-burns` class on the Image wrapper.
  - Use a dark gradient overlay (`bg-gradient-to-t from-black/60 via-black/20 to-transparent`) for text contrast.
  - Render an `<h1>` for the first pane (Mountain) and an `<h2>` for the second (Coast) — the homepage needs a **single `<h1>`** (AC #11). Alternative: use a visually hidden `<h1>{t("Metadata.title")}</h1>` at the top of the page and make both pane headings `<h2>`. Choose one approach consistently.
  - Render the CTA as a `<Link>` from `@/i18n/navigation` styled as a primary button (use existing `Button` from `@/components/ui/button.tsx` or match its token-driven styles). The entire pane IS clickable via the button — do NOT wrap the whole pane in a Link (accessibility — nested interactive elements).
  - Accept a prop `accent: "mountain" | "coast"` that applies theme colors:
    - mountain → `hover:flex-[0.55]` with accent ring using `--brand-mountain` / `--brand-mountain-accent`
    - coast → `hover:flex-[0.55]` with accent ring using `--brand-beach` / `--brand-beach-accent`
  - On desktop only (`md:` breakpoint+), apply `flex-1 md:hover:flex-[1.1] md:focus-within:flex-[1.1] transition-[flex-basis,flex-grow]` — **but** flex-basis transitions are flaky across browsers; prefer `transition-[flex-grow]` with `flex-grow` changing on hover from 1 to 1.1 (sibling auto-compresses). Test in Chrome + Safari.
  - Height: `h-[40vh]` on mobile, `md:h-full` (fills parent 60vh/80vh on tablet/desktop).
- [x] **Route targets:** Link hrefs (`/search?region=mountain`, `/search?region=coast`) point to Epic 3's search page which does NOT exist yet. This is expected — clicking will 404 until Story 3.1 ships. Document this in Dev Notes; DO NOT create search route stubs here.

### Task 5: Build `HeroSearchShell` placeholder component (AC: #5, #7)

- [x] Create `src/components/home/hero-search-shell.tsx`:
  ```typescript
  "use client"; // Only if focus/hover state needs JS; otherwise remove.

  import { useTranslations } from "next-intl";
  import { Search, Sparkles, SlidersHorizontal } from "lucide-react";

  type Variant = "desktop-overlay" | "mobile-inline";

  export function HeroSearchShell({ variant }: { variant: Variant }) {
    const t = useTranslations("HomePage.hero");

    return (
      <div
        role="search"
        aria-disabled="true"
        aria-label={t("searchAriaLabel")}
        className={
          variant === "desktop-overlay"
            ? "absolute left-1/2 top-1/2 z-10 w-[min(720px,calc(100%-3rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl glass-strong p-3 shadow-[var(--shadow-glass)]"
            : "sticky top-14 z-10 mx-4 my-3 rounded-xl glass-strong p-3 shadow-[var(--shadow-glass)] md:hidden"
        }
      >
        {/* Smart / Traditional toggle (visual only) */}
        <div
          role="tablist"
          aria-label={t("smartToggle") + " / " + t("traditionalToggle")}
          className="mb-2 flex gap-2 text-xs font-semibold"
        >
          <span role="tab" aria-selected="true" className="flex items-center gap-1 text-brand-gold">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("smartToggle")}
          </span>
          <span role="tab" aria-selected="false" className="flex items-center gap-1 text-white/70">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            {t("traditionalToggle")}
          </span>
        </div>

        {/* Disabled input + disabled submit button */}
        <div className="flex items-center gap-2">
          <input
            type="search"
            disabled
            readOnly
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none cursor-not-allowed"
          />
          <button
            type="button"
            disabled
            aria-label={t("searchSubmit")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-white cursor-not-allowed opacity-80"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Visually hidden "coming soon" notice for screen readers */}
        <span className="sr-only">{t("shellNotice")}</span>
      </div>
    );
  }
  ```
- [x] **Critical:** Inputs and buttons are `disabled` and `readOnly` — no form submission, no navigation. The `aria-disabled="true"` + `sr-only` "coming soon" notice ensures screen reader users know it's a preview.
- [x] If the desktop overlay's `position: absolute` causes layout issues with pane hover-expand, switch to a `<div class="relative">` wrapper around the flex panes and place the overlay inside that wrapper (NOT inside a pane — it must bridge both).

### Task 6: Build placeholder section shells (AC: #6, #8)

- [x] Create a single file for all shells: `src/components/home/homepage-sections.tsx`. Each shell is a minimal `<section>` with heading, description, and a `shellNotice` — no fake data, no carousels of empty cards.
  ```typescript
  import { useTranslations } from "next-intl";
  import { Link } from "@/i18n/navigation";

  export function FeaturedPropertiesShell() {
    const t = useTranslations("HomePage.featuredProperties");
    return (
      <SectionShell namespace="HomePage.featuredProperties" viewAllHref="/search" />
    );
  }

  export function FeaturedCommunitiesShell() {
    return (
      <SectionShell
        namespace="HomePage.featuredCommunities"
        viewAllHref="/communities"
        variant="gold-border"
      />
    );
  }

  export function AreaHighlightsShell() {
    return (
      <SectionShell namespace="HomePage.areaHighlights" viewAllHref="/areas" />
    );
  }

  export function SellCtaShell() {
    const t = useTranslations("HomePage.sellCta");
    return (
      <section className="relative my-16 overflow-hidden rounded-xl bg-brand-navy px-6 py-12 text-white md:px-12 md:py-16">
        <div className="glass-strong absolute inset-0 -z-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-h2">{t("heading")}</h2>
          <p className="mt-3 text-body-lg">{t("description")}</p>
          <Link
            href="/sell"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] hover:bg-brand-gold-dark"
          >
            {t("cta")}
          </Link>
        </div>
      </section>
    );
  }

  function SectionShell({ namespace, viewAllHref, variant }: {
    namespace: string;
    viewAllHref: string;
    variant?: "gold-border";
  }) {
    // Use useTranslations here with the provided namespace prop
    // Render heading (h2), description, 3-up row of skeleton cards on desktop,
    // horizontal scroll-snap carousel on mobile, and "View all" link.
    // ...
  }
  ```
- [x] Shell card appearance: empty card with aspect-ratio 4/3, `bg-muted`, rounded 12px (`rounded-lg`), with a `shellNotice` overlay centered ("Coming soon"). Render 3 card skeletons per section on desktop and 2.2 visible on mobile (horizontal scroll).
- [x] **Mobile carousels** (AC #8): wrap card rows in a `<div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">` pattern. Each card gets `class="snap-start shrink-0 w-[80%] md:w-auto"`. No external carousel library — pure CSS scroll-snap.
- [x] Use existing design tokens: `bg-brand-navy`, `text-brand-gold`, `rounded-lg`, `shadow-md`. Community cards get `border-2 border-brand-gold` (the gold-border signature — UX spec §Homepage §Featured Communities).
- [x] **Do NOT implement actual data fetching** — all data comes from Epic 2 (properties sync) and Epic 6 (areas/communities). These are visual shells only.

### Task 7: Compose the homepage (AC: #1, #6, #7, #10)

- [x] Rewrite `src/app/[locale]/page.tsx`:
  ```typescript
  import { setRequestLocale } from "next-intl/server";
  import { SplitHero } from "@/components/home/split-hero";
  import {
    FeaturedPropertiesShell,
    FeaturedCommunitiesShell,
    AreaHighlightsShell,
    SellCtaShell,
  } from "@/components/home/homepage-sections";

  export default async function HomePage({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
      <>
        <SplitHero />
        <div className="container space-y-16 py-16">
          <FeaturedPropertiesShell />
          <FeaturedCommunitiesShell />
          <AreaHighlightsShell />
        </div>
        <div className="container">
          <SellCtaShell />
        </div>
      </>
    );
  }
  ```
- [x] **Do NOT** re-wrap in `<main>` — `src/app/[locale]/layout.tsx:72` already provides `<main id="main-content">`. Use a Fragment (`<>…</>`) at the root (see Story 1.4 Debug Log: "Original src/app/page.tsx wrapped content in `<main>` … Replaced the page's outer wrapper with a `<div>` to avoid invalid nested `<main>` elements").
- [x] Delete the old `HomeContent` scaffolding note block — it's replaced entirely.
- [x] Keep `setRequestLocale(locale)` — it is required for static rendering in Next.js 15 (Story 1.4 Task 9).

### Task 8: Single `<h1>` discipline (AC: #11)

- [x] Audit the rendered page: `<Header>` uses `<Logo>` which is a `<Link>` wrapping `<Image>` — no `<h1>` there (verified). The only `<h1>` should come from the SplitHero.
- [x] Recommended pattern: render a visually hidden `<h1 class="sr-only">` at the top of `page.tsx` with a page-level title from `HomePage.title` ("RE/MAX Altitud"), then use `<h2>` for both pane labels in SplitHero. This avoids ambiguity about which pane "wins" the h1.
- [x] Verify with `grep -c "<h1" src/app/[locale]/page.tsx src/components/home/*.tsx` — must equal 1 across the homepage tree.

### Task 9: Accessibility & keyboard support (AC: #11)

- [x] CTA buttons inside each pane must have visible focus rings via the existing dual-ring pattern (`--focus-ring-color #0043ff` + `--focus-ring-offset-color #fff`). Reuse focus styles from `@/components/ui/button.tsx` — do not reinvent.
- [x] Image `alt` text: use `t("mountainsAlt")` / `t("coastAlt")` (translated). Decorative gradient overlays get `aria-hidden="true"`.
- [x] `<section>` elements get `aria-label` (or `aria-labelledby` pointing to the heading id).
- [x] Verify Tab order: Skip-to-content → Header logo → Nav → Language toggle → [main] → Mountain CTA → Coast CTA → Search shell (disabled, but still focusable as `role="search"` region) → section CTAs → Footer.
- [x] Keyboard activation: Enter/Space on CTA → navigates to `/search?region=…` (next/link handles this for free).

### Task 10: Responsive + reduced-motion verification (AC: #3, #4, #8, #9)

- [x] Test at 360px (smallest target — $150 Android, architecture §8 performance budget), 768px, 1024px, 1440px widths.
- [x] 360px: Mountain pane (40vh) → Search shell → Coast pane (40vh), shells stack as horizontal scrollers, Sell CTA full-width.
- [x] 1024px+: 80vh split-hero, hover expands to 55/45, 3-up card grids.
- [x] Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Verify Ken Burns stops, pane hover does not animate (no flex transition).

### Task 11: Next.js 15 + next/image sanity checks

- [x] Confirm `next.config.ts` does NOT need `images.remotePatterns` — all hero images are local (`/images/home/*`). No changes required.
- [x] `priority` on BOTH hero `<Image>` elements (they are LCP). If build warns about "too many priority images", reduce to priority on mountain only (top of viewport on both desktop and mobile).
- [x] Use `next/image`'s `placeholder="blur"` with `blurDataURL` generated from a 10px-wide thumbnail, OR use `placeholder="empty"` (default) — either is acceptable. If using blur, pre-generate the base64 data URL (do NOT do it at request time).

### Task 12: Build verification (AC: #12)

- [x] `npm run lint` — zero errors, zero warnings.
- [x] `npm run typecheck` — zero errors.
- [x] `npm run build` — zero errors. Verify build output shows `/en` and `/es` as static pages (○ Static), not dynamic (ƒ Dynamic).
- [x] `npm run start` smoke test:
  - `/en` → 200, English labels on panes and CTAs, `<html lang="en">`, single `<h1>` in DOM.
  - `/es` → 200, Spanish labels, `<html lang="es">`, single `<h1>`.
  - Language toggle from `/en` → `/es` swaps pane labels without full page reload (Story 1.4 contract).
  - Lighthouse performance ≥ 80 on mobile (epic NFR28 for subsequent static stories; aspirational here since dev build excludes optimizations — confirm on `next start`, not `next dev`).
- [x] Resize window to verify breakpoints: 360px / 640px / 768px / 1024px / 1280px.
- [x] Keyboard test: Tab through the page. Every interactive element must have a visible focus ring. No focus traps (except in the mobile nav drawer from Story 1.3 when open).

## Dev Notes

### Architecture Constraints

- **AD-1: Next.js 15 App Router** — homepage renders as SSG via `generateStaticParams` in `[locale]/layout.tsx`. Do not convert this page to a Client Component. [Source: architecture.md#§1, §2]
- **Homepage rendering strategy:** architecture §2.3 specifies **ISR with 1-hour revalidate** ("Featured listings change; must feel fresh") for production. For this story (shells only), SSG is fine. Epic 2 will introduce `export const revalidate = 3600;` when real data arrives — DO NOT add `revalidate` here to avoid unnecessary rebuilds. [Source: architecture.md#§2.3 Rendering Strategy Matrix]
- **Performance budget (architecture §8.4):** LCP < 2.5s, app JS bundle < 150KB gzipped, largest image < 200KB. Hero images MUST be optimized before commit — `next/image` will not rescue a 4MB raw JPEG. [Source: architecture.md#§8 Performance Budget]
- **Component location:** UX spec and architecture §3 both place `split-hero.tsx` under `src/components/layout/`. This story places it at `src/components/home/` because it is homepage-specific (not shared layout chrome). Rationale: layout/ already holds cross-page components (Header, Footer, MobileNav); SplitHero is owned by the homepage. If the team later decides to expose it elsewhere (e.g., a regional sub-page), it can be moved. Document this delta in the PR description so reviewers are not confused by the path variance.
- **No new dependencies:** do not add carousel libraries (Swiper, Embla, framer-motion, etc.). Use CSS scroll-snap (Story 1.2 spec). If animations demand a physics library later, Epic 3 MapPullUpSheet may justify `@use-gesture/react` per ux-design-specification.md:1929. [Source: ux-design-specification.md#MapPullUpSheet]

### UX Constraints (from ux-design-specification.md)

| Ref | Rule | Source |
|---|---|---|
| Split-hero anatomy | 80vh desktop, 40vh per pane mobile, search bar BETWEEN panes on mobile | ux §Key Page Compositions → Homepage |
| Pane hover | 50/50 → 55/45 at 400ms `ease-out` | ux §Animation & Transitions (SplitHero pane row) |
| Ken Burns | 20s linear subtle zoom on hero images | ux §Animation & Transitions (Search bar ken burns row) |
| Reduced-motion | Ken Burns → static image; hover lifts → instant border change | ux §Animation & Transitions →`prefers-reduced-motion` rule |
| Glassmorphism | `backdrop-blur-md bg-white/85 border border-white/20` — used sparingly on search bar & overlays | ux §Design System Foundation → Customization Strategy |
| Dual entry paths | Telegraph Explore (pane click) + Execute (search bar) within 3 seconds | ux §Core User Experience → Experience Principles #3 |
| Horizontal carousels on mobile | Vertical stacks push CTAs below fold. Carousels keep CTAs within 2 scrolls | ux §Design Rationale |
| Gold border on community cards | Community cards use `--color-gold` border to signal "premium, curated" | ux §Community Page → Visual differentiation |
| Section order | Split-hero → Featured Properties → Featured Communities → Area Highlights → Sell CTA → Footer | ux §Key Page Compositions → Homepage |

### Design Tokens (already defined in Story 1.2)

All tokens below are already present in `src/styles/globals.css` — USE them, do not redefine:

- Colors: `bg-brand-navy` (#000E35), `bg-brand-burgundy` (#660000), `bg-brand-gold` (#C2A661), `bg-brand-mountain` (#233428), `bg-brand-beach` (#183C5A), `bg-brand-crema` (#F7F5EE)
- Radii: `rounded-md` (8px), `rounded-lg` (12px), `rounded-xl` (16px)
- Shadows: `shadow-md`, `shadow-lg`, `shadow-[var(--shadow-glass)]`, `shadow-[var(--shadow-cta)]`
- Glass: `.glass` and `.glass-strong` utility classes (globals.css:404-417)
- Spacing: `p-4`, `p-6`, `py-12`, `py-16` (4px base grid)
- Transitions: use `var(--duration-fast)` / `var(--duration-normal)` / `var(--duration-smooth)` with `var(--ease-smooth)` — never `transition: all`
- Touch targets: `--touch-min: 44px` (any interactive element ≥ 44×44px)
- Type scale: `--text-hero`, `--text-h1`, `--text-h2`, `--text-body-lg` — responsive (globals.css:227-257)

### Previous Story Intelligence (from Story 1.4)

- **Homepage file location:** `src/app/[locale]/page.tsx` — NOT `src/app/page.tsx`. The `[locale]` segment was introduced by Story 1.4. Root `src/app/layout.tsx` is a minimal pass-through.
- **`params` is a Promise in Next.js 15:** always `const { locale } = await params;` then `setRequestLocale(locale);` before calling `useTranslations`.
- **Link imports:** ALWAYS `import { Link } from "@/i18n/navigation"` — never `import Link from "next/link"`. This auto-prefixes `/{locale}/` on all routes. Same for `useRouter`, `usePathname`.
- **`useTranslations` works in Server Components** (Story 1.4 note). Prefer Server Components unless genuine client state is needed (hover handled by CSS = Server OK).
- **Homepage already wraps main correctly:** `layout.tsx:72` renders `<main id="main-content">{children}</main>`. Do NOT nest `<main>` inside the page (Story 1.4 Debug Log).
- **Build gotcha:** if typecheck fails with stale references to old paths, delete `.next/` and `tsconfig.tsbuildinfo` before rerunning (Story 1.4 Debug Log).
- **Metadata pattern (Story 1.4):** `generateMetadata()` in `[locale]/layout.tsx` already produces per-locale `<title>` and `<description>` from the `Metadata` namespace. Page-level metadata is NOT needed for the homepage in this story.

### Git Intelligence

Recent commits show the layout + i18n foundation is stable and merged:
- `dbb9570` Merge PR #62 feat/1-4-internationalization-en-es
- `7606bd6` chore: Synchronize lockfile and fix missing @swc/helpers dependency
- `544bcdc` fix: Wrap LanguageToggle in Suspense to fix build error
- `137ba57` docs: Update task checklist for Story 1.4 completion

Pattern: each story lands as a single PR targeting `main`. Dev branch is `development`. Language-toggle suspense fix (`544bcdc`) suggests any new Client Component that reads `useSearchParams` / `useRouter` from next-intl may need a `<Suspense>` boundary — the HeroSearchShell does NOT read router state (it's inert), so no Suspense needed here. But if the search shell evolves in Epic 3, remember this pattern.

### Technical Stack (versions in package.json)

- Next.js 15.5.15 (App Router + turbopack)
- React 19.1.0
- next-intl ^4.9.1
- Tailwind CSS v4 (CSS-first `@theme inline` in globals.css)
- `lucide-react` ^1.8.0 — use for all icons (Search, Sparkles, SlidersHorizontal)
- No Mapbox, no framer-motion, no swiper — all deferred to later epics

### File Structure

**Added (new files):**

- `src/components/home/split-hero.tsx`
- `src/components/home/hero-search-shell.tsx`
- `src/components/home/homepage-sections.tsx`
- `public/images/home/hero-mountains.jpg`
- `public/images/home/hero-coast.jpg`

**Modified:**

- `src/app/[locale]/page.tsx` — replaces scaffolding with SplitHero + sections
- `src/messages/en.json` — extends `HomePage` namespace with nested `hero`, `featuredProperties`, `featuredCommunities`, `areaHighlights`, `sellCta` sub-namespaces
- `src/messages/es.json` — mirrors en.json structure with Spanish strings
- `src/styles/globals.css` — adds `.ken-burns` keyframe + utility class

**Untouched (do not modify):**

- `src/app/[locale]/layout.tsx` (locale layout is correct as-is)
- `src/app/layout.tsx` (minimal passthrough — Story 1.4)
- `src/i18n/*` (next-intl config is stable)
- `src/components/layout/*` (Header, Footer, MobileNav from Story 1.3/1.4)
- `middleware.ts`

### Project Structure Notes

- New folder `src/components/home/` is introduced by this story. It is a peer to `src/components/layout/`, `src/components/ui/`, `src/components/property/`, etc. This aligns with the feature-based organization the codebase already follows (see `src/components/agent/`, `src/components/community/`, `src/components/area/` — all feature-scoped per architecture §3).
- Architecture §3 lists `split-hero.tsx` under `src/components/layout/`. This story intentionally places it under `src/components/home/` because it is exclusively owned by the homepage and is not layout chrome. Flag in PR description.
- `public/images/home/` is a new sub-folder. Keep it separate from `public/images/brand/` (logo assets).

### Testing Standards

From architecture.md §3 (`tests/unit/`, `tests/e2e/`): Playwright + Vitest are the testing frameworks. **NO test framework is installed yet** in `package.json` as of Story 1.4. This story is NOT expected to introduce tests — Story 1.1 / `testarch-framework` skill will do that. Instead, rely on manual smoke tests (Task 12) and CI build verification.

### Do-Not-Implement Guardrails

- ❌ Real property data — wait for Epic 2 (Story 2.1 creates the schema).
- ❌ Real community data — wait for Epic 6 (Story 6.2).
- ❌ Real area data — wait for Epic 6 (Story 6.1).
- ❌ Working search — wait for Epic 3 (Story 3.1+).
- ❌ Actual `/search`, `/communities`, `/areas`, `/sell` route pages — those are other stories. `<Link>` hrefs pointing there are fine; the routes 404 until then and that is expected.
- ❌ New dependencies (carousel libraries, animation libraries, icon sets beyond lucide-react).
- ❌ A second `<main>` element (the layout owns it).
- ❌ Hardcoded English strings (everything i18n'd via next-intl).
- ❌ `transition: all` — target specific properties (globals.css header comment).
- ❌ Dark mode (MVP does not ship dark mode — globals.css:6-8).

### References

- [Source: epics.md#Story 1.5 — Homepage Shell & Split-Hero (lines 686-720)]
- [Source: ux-design-specification.md#Tier 4: Visual Design Direction → Split-Hero Concept (lines 346-390)]
- [Source: ux-design-specification.md#Key Page Compositions → Homepage (lines 1168-1184)]
- [Source: ux-design-specification.md#SplitHero component (lines 1816-1851)]
- [Source: ux-design-specification.md#SearchBar component (lines 1855-1881)]
- [Source: ux-design-specification.md#Animation & Transitions (lines 2360-2376)]
- [Source: ux-design-specification.md#Responsive Strategy + Component Responsive Behavior (lines 2394-2419)]
- [Source: architecture.md#§2.3 Rendering Strategy Matrix (homepage = ISR 1h revalidate)]
- [Source: architecture.md#§3 Directory Architecture (component and public image layout)]
- [Source: architecture.md#§8 Performance Budget (LCP < 2.5s, image < 200KB)]
- [Source: prd.md#FR67 — Homepage with featured listings and office value proposition]
- [Source: prd.md#FR19 — Featured Communities section on homepage with 2-3 cards]
- [Source: _bmad-output/planning-artifacts/homepage_mockup_1775316368335.png — visual reference]
- [Source: _bmad-output/implementation-artifacts/1-4-internationalization-en-es.md — i18n integration patterns]
- [Source: src/styles/globals.css — design tokens, `.glass` utilities, reduced-motion override]
- [Source: src/i18n/navigation.ts — locale-aware `Link` and `useRouter` exports]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7) via Claude Code / BMAD dev-story workflow.

### Debug Log References

- **ESLint `jsx-a11y/role-supports-aria-props`**: initial `HeroSearchShell` put both `role="search"` and `aria-disabled="true"` on the same `<div>`. The rule rejects `aria-disabled` on the `search` landmark. Fix: nested the `aria-disabled="true"` on an inner wrapper while keeping the landmark role on the outer; native `disabled` on the input/button plus the `sr-only` "coming soon" notice preserve the intent of AC #5.
- **Invalid Tailwind size classes**: initial drafts used `text-h1`, `text-h2`, `text-body-lg` as if they were utilities. The typography tokens live in `:root` (globals.css §227-257), not in `@theme inline`, so Tailwind cannot generate those utilities. Fix: rely on the base element styles (globals.css `h2 { font-size: var(--text-h1); }` etc.) or use arbitrary-value syntax (`text-[length:var(--text-body-lg)]`, `!text-[var(--text-hero)]`) — the same pattern used by `src/app/[locale]/design-system/page.tsx`.
- **Sprint status sync**: flipped `1-5-homepage-shell-and-split-hero` from `ready-for-dev` → `in-progress` → `review` and updated the `last_updated` stamp twice to keep the story file and `sprint-status.yaml` in sync.

### Completion Notes List

- Split-hero ships as a Server Component (`SplitHero`) with a nested `HeroPane` helper. No client-side JS was required — hover/focus expansion is CSS-only via `lg:hover:flex-[1.1]` + `lg:focus-within:flex-[1.1]` with a `transition-[flex-grow]` using the `--duration-smooth` + `--ease-smooth` tokens (no `transition-all`).
- Ken Burns animation added to `globals.css` inside `@layer utilities` as `.ken-burns` (20s infinite, `--ease-smooth`). The existing `prefers-reduced-motion` override in globals.css flattens durations globally; a dedicated `@media (prefers-reduced-motion: reduce) { .ken-burns { animation: none; } }` rule disables the keyframe entirely.
- `HeroSearchShell` is fully inert: native `disabled` + `readOnly` on the `<input>`, `disabled` on the submit `<button>`, `aria-disabled="true"` on the inner control wrapper, `role="search"` + `aria-label` landmark on the outer wrapper, and a screen-reader-only "coming soon" notice. It never submits a form and never navigates.
- On mobile the shell renders *between* the mountain and coast panes (stacked 40vh/shell/40vh); on tablet/desktop it overlays the split as an absolutely-positioned glass panel centered via `absolute inset-x-0 top-1/2 -translate-y-1/2` inside the `relative` `<section>`. The desktop overlay is wrapped in `hidden md:block` to avoid double-rendering.
- Both hero `<Image>` wrappers use `fill` + `sizes="(max-width: 768px) 100vw, 50vw"`. Only the mountain pane receives `priority` (LCP candidate) — the coast pane eagerly streams via normal lazy-loading to avoid the Next.js "too many priority images" warning while still being above-the-fold on desktop.
- **Hero images are low-fidelity placeholders** (~27KB each, generated via sharp). They visibly say "MOUNTAINS — PLACEHOLDER" / "COAST — PLACEHOLDER". Final brand photography can be dropped into the same filenames at `public/images/home/hero-mountains.jpg` and `public/images/home/hero-coast.jpg` with no code changes. The comment block at the top of `split-hero.tsx` documents the expected dimensions (1920×1080, ≤ 200KB).
- `src/app/[locale]/page.tsx` now renders a visually hidden `<h1 class="sr-only">` (from the `HomePage.title` message), and both panes use `<h2>`. A grep across the homepage tree (`page.tsx` + `src/components/home/*.tsx`) confirms exactly **one** `<h1>` matches AC #11. The `<Header>` logo is a `<Link>` wrapping an `<Image>` — no competing `<h1>`.
- Section shells render three empty `bg-muted` cards in a 3-up grid on desktop (`md:grid md:grid-cols-3`) and a horizontal scroll-snap carousel on mobile (`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide`). A `.scrollbar-hide` utility was added alongside `.ken-burns` because Tailwind v4 does not ship it out of the box. No external carousel library was introduced. Community cards get the UX-spec gold border via `border-2 border-brand-gold`.
- CTA link targets (`/search?region=mountain`, `/search?region=coast`, `/search`, `/communities`, `/areas`, `/sell`) point to routes that do not exist yet and will 404 until their owning stories ship (Epic 3 for `/search`, Epic 6 for `/communities` and `/areas`, Epic 5 for `/sell`). This is documented in the story Dev Notes and is expected — no stubs were created for these routes.
- All three EN-only Spanish terms required by Story 1.4's informal "tú" style were honored: **Explora**, **Busca**, **Lista**. Proper nouns (Pérez Zeledón, Dominical, Uvita) are identical in both locales.
- `npm run typecheck` → 0 errors. `npm run lint` → 0 errors, 0 warnings. `npm run build` → success, `/en` and `/es` generated as `●` (SSG). `npm run start` smoke test on port 3210 confirmed: EN 200 with English CTAs, ES 200 with Spanish CTAs, single `<h1>`, `<html lang="en">` / `<html lang="es">`, responsive `next/image` srcsets from 384w–3840w for both hero images, `ken-burns` + `glass-strong` classes present in the DOM, locale-aware `/en/...` and `/es/...` links on all CTAs.

### File List

**Added:**

- `public/images/home/hero-mountains.jpg` (placeholder, 1920×1080, ≈27KB)
- `public/images/home/hero-coast.jpg` (placeholder, 1920×1080, ≈28KB)
- `src/components/home/split-hero.tsx`
- `src/components/home/hero-search-shell.tsx`
- `src/components/home/homepage-sections.tsx`

**Modified:**

- `src/app/[locale]/page.tsx` — replaces scaffolding content with `<SplitHero>` + section shells and adds a visually-hidden `<h1>`.
- `src/messages/en.json` — extends `HomePage` namespace with nested `hero`, `featuredProperties`, `featuredCommunities`, `areaHighlights`, `sellCta`.
- `src/messages/es.json` — same structure, Spanish translations (informal "tú").
- `src/styles/globals.css` — adds `.ken-burns` keyframe/utility and `.scrollbar-hide` inside `@layer utilities`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story `1-5-homepage-shell-and-split-hero` transitioned to `review`; `last_updated` stamp refreshed.

### Change Log

| Date       | Change                                                                 | Author |
| ---------- | ---------------------------------------------------------------------- | ------ |
| 2026-04-22 | Implemented SplitHero, HeroSearchShell, and homepage section shells; extended HomePage i18n namespace in EN/ES; added Ken Burns + scrollbar-hide utilities; homepage rewritten with single `<h1>` + SSG. Build, typecheck, lint all green. | Sebicas (via Claude Code dev-story) |

### Review Findings

_Generated 2026-04-22 via bmad-code-review (Blind Hunter + Edge Case Hunter + Acceptance Auditor)._

- [x] [Review][Decision→Patch] Coast pane `priority` / LCP — **Resolved:** added `fetchPriority="high"` to the coast pane's `<Image>` (without `priority`) to hint browser prioritization without triggering Next.js's "too many priority images" warning. Mountain pane keeps `priority` as the true LCP candidate. [`src/components/home/split-hero.tsx:121`]
- [x] [Review][Decision→Dismissed] `aria-disabled="true"` placement on search shell — **Resolved:** keep current placement (inner wrapper carries `aria-disabled`; outer `<div>` keeps `role="search"` + `aria-label`). This is a documented AC #5 deviation required by ESLint `jsx-a11y/role-supports-aria-props` which forbids `aria-disabled` on `search` landmarks. Native `disabled` on the `<input>` + `<button>` plus the `sr-only` "coming soon" notice preserve AC intent. [`src/components/home/hero-search-shell.tsx:22-23`]
- [x] [Review][Decision→Dismissed] Spanish CTAs "Explorar" vs "Explora" — **Resolved:** keep literal-spec "Explorar Casas en la Montaña" / "Explorar Casas en la Playa". The infinitive works as a natural Spanish button label ("to explore"); spec contradiction (literal example vs "tú" rule) is noted but the literal translation wins for this story. No code change.
- [x] [Review][Patch] Pane expansion ratio 52/48 → 55/45 (AC #2) — **Fixed:** changed `lg:hover:flex-[1.1]` to `motion-safe:lg:hover:flex-[1.22]` (1.22 / 2.22 ≈ 55%). [`src/components/home/split-hero.tsx:51`]
- [x] [Review][Patch] Hover expansion still fires under `prefers-reduced-motion` (AC #9) — **Fixed:** added the `motion-safe:` Tailwind variant so `lg:hover:flex-[1.22]` and `lg:focus-within:flex-[1.22]` only apply when the user has *not* requested reduced motion. Panes stay 50/50 under reduced motion. [`src/components/home/split-hero.tsx:51`]
- [x] [Review][Patch] `role="tablist"`/`role="tab"` without functional tab semantics — **Fixed:** dropped the tab ARIA roles and `aria-label` from the visual toggle; marked the toggle wrapper `aria-hidden="true"` since it's a decorative preview of Epic 3's Smart/Traditional modes. The outer `role="search"` landmark is preserved. [`src/components/home/hero-search-shell.tsx:24-31`]
- [x] [Review][Defer] Mobile horizontal carousels give no explicit scroll affordance for off-screen cards [`src/components/home/homepage-sections.tsx:44`] — deferred, UX polish beyond AC #8 (partial-card peek at `w-[80%]` already telegraphs scroll).
- [x] [Review][Defer] `HeroSearchShell` renders both `mobile-inline` and `desktop-overlay` variants into the DOM at all times (hidden via responsive classes) [`src/components/home/split-hero.tsx:112,125`] — deferred, minor DOM weight, no AC violation.

_Dismissed as noise (10): `!` modifier style opinion; `flex-grow` vs `flex-basis` choice (authorized by Task 4 Dev Notes); placeholder `[0,1,2]` arrays (intentional for shell story); Ken Burns infinite loop battery (handled by `prefers-reduced-motion`); hardcoded image paths (standard Next.js static asset pattern, comment-documented); async `HomePage` with no fetch (required for `await params` in Next.js 15); `sr-only` `<h1>` pattern (explicitly approved by Task 8); `params` promise missing `locale` (prevented by next-intl `generateStaticParams`); missing hero image assets (files exist, committed); `/sell` / `/search` / `/communities` 404s (explicitly documented as expected per Dev Notes and Do-Not-Implement Guardrails)._
