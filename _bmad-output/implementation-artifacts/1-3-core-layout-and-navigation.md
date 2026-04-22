# Story 1.3: Core Layout & Navigation

Status: done

<!-- Validated: 2026-04-22. All 4 critical issues (C1-C4) and 6 high-priority items (H1-H6) remediated. See validation report for details. -->

## Story

As a **visitor**,
I want clear, consistent navigation that works beautifully on my phone or desktop,
So that I can find any section of the site within 2 taps.

## Acceptance Criteria

1. **Given** any page **When** it loads **Then** it renders within a consistent app shell (header + content + footer).

2. **Given** desktop viewport (≥1024px) **When** navigation renders **Then** max 5 top-level items display with dropdown menus; "Sell" is visually separated (UX-DR15).

3. **Given** mobile viewport (<768px) **When** the hamburger ☰ is tapped **Then** a full-screen slide-out nav appears with flat list (no nesting), language toggle at bottom (UX-DR15).

4. **Given** any page **When** a keyboard user tabs **Then** a skip-to-content link is the first focusable element (z-index 60) (UX-DR23).

5. **Given** the footer renders **When** viewed on desktop **Then** it displays a 4-column grid on dark bg (#0D0D0D) with links, offices, social, language toggle.

6. **Given** focus indicators **When** any interactive element receives keyboard focus **Then** a 2px solid navy + 2px white offset ring appears (UX-DR24).

7. **Given** the logo component **When** rendered **Then** it supports easy asset swap without code changes (UX-DR32).

8. **And** all interactive nav elements have ARIA labels and keyboard support (NFR22).

9. **And** mobile nav traps focus when open and locks body scroll (UX-DR23).

10. **And** `npm run build` passes with zero type errors and zero lint errors.

## Tasks / Subtasks

- [x] Task 0: Install required shadcn/ui components (AC: #2, #3, #8)
  - [x] Run `npx shadcn@latest add button` — needed for nav CTAs ("Sell Your Property" accent button)
  - [x] Run `npx shadcn@latest add sheet` — Radix Sheet provides the mobile slide-out nav base, with built-in focus trap, scroll lock, and dismiss behavior
  - [x] Run `npx shadcn@latest add navigation-menu` — Radix NavigationMenu provides hover-triggered desktop nav dropdowns (UX spec requires hover with 150ms open / 300ms close delay, NOT click-to-open). Provides `NavigationMenu`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, and `NavigationMenuLink` with built-in viewport positioning and ARIA
  - [x] **Do NOT install `dropdown-menu`** — DropdownMenu opens on click, but the UX spec (§Navigation Patterns) requires hover-triggered dropdowns. NavigationMenu is the correct component
  - [x] Verify all installed components appear in `src/components/ui/` with correct imports
  - [x] Verify `npm run build` still passes after component installation
  - [x] **Do NOT** install Dialog or other components beyond what this story requires — install per-story

- [x] Task 1: Create the `<SkipToContent>` component (AC: #4, #6)
  - [x] Create `src/components/layout/skip-to-content.tsx` — a Server Component
  - [x] Renders an `<a href="#main-content">` link
  - [x] Visually hidden by default using the custom `.skip-to-content` class (Task 9) which uses `transform: translateY(-100%)` to hide off-screen and animates into view on focus. **Do NOT use `sr-only`** — it conflicts with the transform-based slide-in pattern
  - [x] When visible: positioned fixed at top-left, z-index `var(--z-skip-link)` (60), styled with `bg-brand-navy text-white` padding, clear label text ("Skip to content" / i18n-ready)
  - [x] Focus indicator uses the dual-ring pattern already defined in `globals.css` `:focus-visible` rule
  - [x] Must be the **first focusable element** in the DOM — placed before `<Header>` in the layout
  - [x] Touch target minimum met (44px height) via padding

- [x] Task 2: Create the `<Logo>` component (AC: #7)
  - [x] Create `src/components/layout/logo.tsx` — a Server Component
  - [x] Uses `next/image` with `priority` prop (above-fold)
  - [x] Source: `public/images/brand/logo-remax-altitud.png` (18KB, off-white on transparent, designed for dark backgrounds)
  - [x] **Swappable design (UX-DR32):** Logo source path is a constant at the top of the file — changing the image file at the path swaps the logo without code changes. Component accepts optional `variant` prop (`"default" | "dark-bg"`) to support future light-background logo variant
  - [x] Renders within a `<Link href="/">` wrapper for homepage navigation
  - [x] `alt` text: "RE/MAX Altitud — Costa Rica Real Estate"
  - [x] **Sizing:** Desktop: height 40px, auto width. Mobile: height 32px, auto width. Use `next/image` `sizes` prop: `(max-width: 768px) 120px, 160px`
  - [x] **CLS Prevention:** To prevent Cumulative Layout Shift, inspect `logo-remax-altitud.png` to determine its intrinsic aspect ratio. Provide explicit `width` and `height` props to `next/image` that match this ratio at 40px (desktop) and 32px (mobile) heights.
  - [x] Apply `object-contain` to preserve aspect ratio within the computed dimensions

- [x] Task 3: Create the `<DesktopNav>` component (AC: #2, #8)
  - [x] Create `src/components/layout/desktop-nav.tsx` — `'use client'` component (requires `usePathname()` for active route detection)
  - [x] **Navigation items** (max 5 top-level per UX-DR15):
    ```
    1. Properties ▾
       ├─ Mountains (PZ)
       ├─ Coast (Dominical)
       └─ Search All Properties
    2. Areas ▾
       ├─ Pérez Zeledón
       ├─ Dominical
       ├─ Uvita
       ├─ All Areas
       ├──────────
       └─ Communities ▸
          ├─ RISE
          ├─ Santa Elena Hills
          └─ All Communities
    3. Sell Your Property  (accent-styled, no dropdown)
    4. About  (no dropdown)
    5. [Language Toggle]  (EN | ES)
    ```
  - [x] "Sell Your Property" is visually separated — use `<Button variant="outline">` or accent color styling per UX-DR15. It should stand out from regular nav items but NOT use the full burgundy CTA color (that's for primary action buttons). Use `border-brand-burgundy text-brand-burgundy` outline style
  - [x] Dropdown menus use shadcn `<NavigationMenu>` — hover-triggered (UX spec: 150ms open delay, 300ms close delay). Max 4 items per section + "View all" link at bottom of each dropdown
  - [x] **Z-Index Collision Prevention:** Ensure the `NavigationMenuContent` explicitly sets a z-index higher than sticky headers and hero section glassmorphism (e.g., `z-50` or mapped to `var(--z-modal)`) to prevent content from rendering beneath page elements.
  - [x] **Active route detection:** Use `usePathname()` from `next/navigation`. Apply active styling (`border-b-2 border-brand-navy`) and `aria-current="page"` to the top-level nav item. **Critical:** Use prefix matching (`pathname.startsWith(item.activePrefix)`) for dropdown parents so they don't lose active styling on child routes.
  - [x] **Pre-fetching:** Leverage Next.js `<Link>` default prefetching for all top-level routes to ensure instant navigation.
  - [x] Transitions: dropdown open/close uses `var(--duration-normal)` (0.3s) with `var(--ease-smooth)` — explicit `transition-property: opacity, transform` (never `all`)
  - [x] Hidden on mobile (`hidden md:flex`) — uses `md:` breakpoint (768px) to avoid dead zone between 768-1023px where no nav would be visible

- [x] Task 4: Create the `<MobileNav>` component (AC: #3, #8, #9)
  - [x] Create `src/components/layout/mobile-nav.tsx` — `'use client'` component
  - [x] Uses shadcn `<Sheet>` component (wraps Radix Dialog/Sheet) — renders from the right side
  - [x] **Hamburger trigger:** ☰ icon button (use `lucide-react` `Menu` icon), 44×44px minimum, `aria-label="Open navigation menu"`
  - [x] **Close button:** ✕ at top-right of sheet, 44×44px, `aria-label="Close navigation menu"`
  - [x] **Sheet content — flat list, NO nested dropdowns** per UX-DR15:
    ```
    🔍 Search Properties
    🏔 Mountains (PZ)
    🏖 Coast (Dominical)
    📍 All Areas
    🏘 Communities
       RISE · Santa Elena · Serena · All
    ──────────────────
    🏠 Sell Your Property    (visually distinct — bold, accent color, or background highlight)
    👥 Our Team
    📞 Contact
    ──────────────────
    🌐 English | Español    (language toggle at bottom)
    ```
  - [x] Dividers between main nav, seller CTA section, and language toggle — use `<hr>` or `<Separator>` with `border-brand-warm`
  - [x] "Sell Your Property" is visually distinct from other items — use `text-brand-burgundy font-semibold` or a subtle background `bg-brand-burgundy/5`
  - [x] **Focus trap:** Radix Sheet provides this automatically — verify Tab cycles within the sheet and does NOT escape to background content
  - [x] **Scroll lock:** Radix Sheet provides `body { overflow: hidden }` automatically — verify body does not scroll while sheet is open
  - [x] **Dismiss / Route Change Bug Prevention:** Radix Sheet does NOT automatically close on Next.js client-side route changes. The `<Sheet>` MUST be a controlled component (`open`, `onOpenChange`) with a `useEffect` hook listening to `pathname` changes to programmatically close the sheet whenever a navigation link is clicked.
  - [x] **Active route styling:** Use `usePathname()` to highlight the current section with `font-semibold border-l-2 border-brand-navy` (mobile uses left border). **Critical:** Use prefix matching (`pathname.startsWith(item.activePrefix)`) for top-level sections containing children.
  - [x] Visible only on mobile (`md:hidden`) — uses `md:` breakpoint (768px) matching DesktopNav's `md:flex`
  - [x] Animation: sheet slides in from right using `var(--duration-normal)` (0.3s) — respect `prefers-reduced-motion` (Radix handles this if CSS durations are properly flattened, which they are via Story 1.2's reduced-motion rule)
  - [x] **Note:** UX spec requests left-edge swipe-to-dismiss gesture. Radix Sheet does not support this natively. Defer to a future polish pass or evaluate `@use-gesture/react` integration

- [x] Task 5: Create the `<Header>` component (AC: #1, #2, #3)
  - [x] Create `src/components/layout/header.tsx` — Server Component for structure
  - [x] Layout: `<header>` semantic element (implicit `role="banner"` — do NOT add explicit `role` attribute as it is redundant per WAI-ARIA)
  - [x] Background: `var(--background)` (#F7F5EE crema) at 95% opacity + `backdrop-blur` — gives a frosted glass effect when content scrolls behind
    ```css
    background: rgba(247, 245, 238, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    ```
  - [x] Position: `sticky top-0` with `z-index: var(--z-sticky-nav)` (30)
  - [x] Container: uses `.container` class (max-width per globals.css, centered). **Note:** UX spec mandates 1400px max-width — if globals.css still has 1280px from Story 1.2, update it to `max-width: 1400px` as part of Task 9's CSS changes
  - [x] Content: `<Logo>` on left, `<DesktopNav>` in center/right, `<MobileNav>` hamburger on right (mobile only)
  - [x] Height: ~64px desktop, ~56px mobile (set via padding, not fixed height — content determines)
  - [x] Bottom border: subtle `1px solid var(--border)` (#EFECE4) for visual separation
  - [x] Transition for sticky appearance: `transition-property: background-color, box-shadow` with `var(--duration-fast)` (0.2s)

- [x] Task 6: Create the `<Footer>` component (AC: #5)
  - [x] Create `src/components/layout/footer.tsx` — Server Component
  - [x] `<footer>` semantic element (implicit `role="contentinfo"` — do NOT add explicit `role` attribute as it is redundant per WAI-ARIA)
  - [x] Background: `var(--brand-dark)` (#0D0D0D)
  - [x] Text color: `var(--text-on-dark)` (#F8F8F8)
  - [x] **Desktop layout: 4-column grid** (`grid-cols-4` on `md:`, matching nav breakpoint)
    ```
    Column 1: Quick Links
    ├─ Properties
    ├─ Areas
    ├─ About
    ├─ Contact
    └─ Join Our Team

    Column 2: Offices (data sourced from `src/lib/constants/offices.ts` — create this file)
    ├─ RE/MAX Altitud (Pérez Zeledón)
    │  Address, phone (populate from architecture spec or use TODO placeholders with typed shape)
    └─ RE/MAX Altitud Cero (Dominical/Uvita)
       Address, phone

    Column 3: Social & Contact
    ├─ Facebook
    ├─ Instagram
    ├─ WhatsApp
    └─ Email

    Column 4: Legal & Language
    ├─ Privacy Policy
    ├─ Terms of Service
    ├─ Sitemap
    └─ 🌐 EN | ES toggle
    ```
  - [x] Mobile layout: stacked columns (1-column grid), sections collapsible or stacked vertically
  - [x] Gold divider line between content and copyright: `border-brand-gold-muted` or `border-t border-brand-gold/40`
  - [x] Copyright bar at bottom: `© 2026 RE/MAX Altitud. All rights reserved.` — centered, `text-xs text-text-muted`
  - [x] Footer links: `text-text-on-dark` with hover `text-brand-gold` transition using `var(--duration-fast)`
  - [x] All links have appropriate `aria-label` for social icons (e.g., `aria-label="Visit RE/MAX Altitud on Facebook"`)
  - [x] Social icons use `lucide-react` icons or SVG — 24px with 44px touch target area
  - [x] Language toggle placeholder: text-only "EN | ES" for now — Story 1.4 will implement the functional `<LanguageToggle>` component

- [x] Task 7: Create the `<LanguageTogglePlaceholder>` component (AC: #1)
  - [x] Create `src/components/layout/language-toggle.tsx` — Client Component (`'use client'`)
  - [x] Renders "EN | ES" text with the current language visually emphasized (bold or underlined)
  - [x] Default: "EN" is active (bold), "ES" is clickable but non-functional
  - [x] `aria-label="Switch language"` on the wrapper
  - [x] Current language: `aria-current="true"` on the active language
  - [x] Clicking does nothing in this story — logs `console.info('Language toggle: Story 1.4')` as a development breadcrumb
  - [x] Story 1.4 will replace the internals with `next-intl` locale switching

- [x] Task 8: Update `src/app/layout.tsx` — wire up the app shell (AC: #1, #4)
  - [x] Import `<SkipToContent>`, `<Header>`, `<Footer>` from `@/components/layout/`
  - [x] Place `<SkipToContent>` as the **first child** inside `<body>` (before `<Header>`)
  - [x] Place `<Header>` after `<SkipToContent>`
  - [x] Wrap `{children}` in `<main id="main-content">` — this is the skip-to-content target
  - [x] Place `<Footer>` after `</main>`
  - [x] Resulting DOM order:
    ```html
    <body>
      <SkipToContent />
      <Header />
      <main id="main-content">
        {children}
      </main>
      <Footer />
    </body>
    ```
  - [x] Verify the `lang="en"` attribute on `<html>` is still present (Story 1.4 will make it dynamic)
  - [x] Verify Montserrat font variable class is still applied to `<html>`

- [x] Task 9: CSS updates (AC: #4, container fix)
  - [x] **Container max-width fix:** Update `.container` in `globals.css` from `max-width: 1280px` to `max-width: 1400px` to match UX spec's Content Width Constraints (Page container: 1400px). This corrects a Story 1.2 deviation
  - [x] Add skip-to-content utility to `globals.css` in `@layer components`:
    ```css
    .skip-to-content {
      position: fixed;
      top: 0;
      left: 0;
      z-index: var(--z-skip-link);
      transform: translateY(-100%);
      transition: transform var(--duration-fast) var(--ease-smooth);
    }

    .skip-to-content:focus-visible {
      transform: translateY(0);
    }
    ```
  - [x] This pattern makes the skip link slide down from above the viewport when focused — only keyboard users will ever see it

- [x] Task 10: Navigation data structure (AC: #2, #3)
  - [x] Create `src/lib/navigation.ts` — a shared data file defining the navigation structure
  - [x] Export a typed `NavItem[]` array consumed by both `<DesktopNav>` and `<MobileNav>`
  - [x] Type definition:
    ```typescript
    export interface NavItem {
      label: string;         // Display label (i18n key in Story 1.4)
      href: string;          // Route path
      activePrefix?: string; // Path prefix to match for active state (e.g., "/areas")
      children?: NavItem[];  // Dropdown items (desktop only, max 4)
      isCta?: boolean;       // True for "Sell" — triggers accent styling
      icon?: string;         // Emoji or lucide icon name (mobile only)
      isGroup?: boolean;     // True for divider-separated groups (e.g., Communities section)
    }
    ```
  - [x] Data matches the site map from UX spec:
    ```typescript
    export const mainNavItems: NavItem[] = [
      {
        label: "Properties",
        href: "/search",
        activePrefix: "/search",
        children: [
          { label: "Mountains (PZ)", href: "/search?region=mountain" },
          { label: "Coast (Dominical)", href: "/search?region=coast" },
          { label: "Search All Properties", href: "/search" },
        ],
      },
      {
        label: "Areas",
        href: "/areas",
        activePrefix: "/areas",
        children: [
          { label: "Pérez Zeledón", href: "/areas/perez-zeledon" },
          { label: "Dominical", href: "/areas/dominical" },
          { label: "Uvita", href: "/areas/uvita" },
          { label: "All Areas", href: "/areas" },
          // Communities sub-group (rendered after divider in dropdown)
          { label: "Communities", href: "/communities", isGroup: true, children: [
            { label: "RISE", href: "/areas/perez-zeledon/communities/rise" },
            { label: "Santa Elena Hills", href: "/areas/perez-zeledon/communities/santa-elena-hills" },
            { label: "All Communities", href: "/communities" },
          ]},
        ],
      },
      {
        label: "Sell Your Property",
        href: "/sell",
        isCta: true,
      },
      {
        label: "About",
        href: "/about",
      },
    ];
    ```
  - [x] Mobile-specific items (Our Team, Contact) added in the `<MobileNav>` component itself — they are NOT in the desktop nav

- [x] Task 11: Final validation (AC: #10)
  - [x] `npm run build` — passes with zero type errors
  - [x] `npm run lint` — zero lint errors
  - [x] `npm run typecheck` — `tsc --noEmit` passes
  - [x] `npm run format:check` — all files match Prettier style
  - [x] Visual smoke test: dev server at `/` shows header with logo + nav + footer
  - [x] Keyboard test: Tab through page — skip-to-content appears first → header nav → page content → footer
  - [x] Mobile test: resize to <768px — hamburger appears, desktop nav hides, sheet opens on tap, focus is trapped
  - [ ] Screen reader test: nav items announce correctly, mobile sheet announces as dialog

## Dev Notes

### Architecture Compliance

- **Components:** Layout components live in `src/components/layout/` per architecture spec
- **Server Components:** Header and Footer are Server Components (RSC) — the nav structure is rendered on the server for performance. Only interactive elements (`MobileNav` sheet trigger, dropdown triggers) use `'use client'`
- **CSS:** All styling references design tokens via `var(--*)` or Tailwind classes that resolve to tokens. **No raw hex values in component code**
- **Font loading:** Already configured in Story 1.2 — Montserrat via `next/font/google`
- **No tailwind.config.js:** This project uses Tailwind v4 CSS-first. All theme extensions occur in `src/styles/globals.css`

### Critical: shadcn/ui Components

**Sheet (Mobile Nav):** Wraps Radix UI's Dialog primitive. Provides:

1. **Focus trap** — keyboard focus is trapped inside the sheet while open
2. **Scroll lock** — body scroll is locked via `overflow: hidden`
3. **ESC dismiss** — pressing Escape closes the sheet
4. **Overlay dismiss** — clicking the overlay closes the sheet
5. **Animation** — enter/exit transitions via Radix's `data-state` attribute
6. **ARIA** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` automatically applied

**Important:** The sheet's animation timing inherits from CSS. Since Story 1.2 defined `--duration-normal: 0.3s` and the `prefers-reduced-motion` media query flattens all durations to `0.01s`, the sheet animation automatically respects motion preferences without any additional code.

**NavigationMenu (Desktop Nav):** Wraps Radix UI's NavigationMenu primitive. Key behaviors:
- **Hover-triggered** dropdowns (NOT click) — matches UX spec requirement
- Built-in open/close delays configurable via Radix props (`delayDuration={150}`, `skipDelayDuration={300}`)
- Viewport-aware positioning for dropdown content panels
- ARIA: `aria-expanded`, keyboard arrow navigation, and focus management built-in

### Critical: Navigation Color Application Rules

From the UX spec's Color Application Rules table:

| Element | Background | Text | Notes |
|---------|-----------|------|-------|
| Navigation bar | `var(--background)` at 95% opacity + blur | `var(--brand-navy)` | Frosted glass effect when content scrolls behind |
| "Sell" CTA in nav | Transparent + border `var(--brand-burgundy)` | `var(--brand-burgundy)` | Outline style — NOT full burgundy fill |
| Active nav item | — | `var(--brand-navy)` | 2px solid navy bottom border |
| Footer | `var(--brand-dark)` (#0D0D0D) | `var(--text-on-dark)` (#F8F8F8) | Gold dividers between sections |

### Accessibility Contract

These requirements are WCAG 2.1 AA mandatory:

1. **Skip-to-content (WCAG 2.4.1):** First focusable element on every page, z-index 60, visible only on keyboard focus
2. **Focus indicators (WCAG 2.4.13 / UX-DR24):** 2px solid `#0043FF` outline with 2px white offset — already defined in `globals.css` `:focus-visible` rule (Story 1.2). Do NOT override or remove
3. **Touch targets (WCAG 2.5.5 / UX-DR7):** All interactive elements ≥ 44×44px with 8px spacing
4. **Focus trap (UX-DR23):** Mobile nav sheet must trap focus — provided by Radix Sheet automatically
5. **Scroll lock (UX-DR23):** Body scroll locked while mobile nav is open — provided by Radix Sheet
6. **ARIA labels (NFR22):** All nav items, hamburger button, close button, language toggle have descriptive `aria-label` attributes
7. **Keyboard navigation:** All dropdowns navigable via Arrow keys, Enter to select, Escape to close (Radix provides this)
8. **`aria-current="page"`:** Applied to the nav item matching the current route

### Z-Index Hierarchy (from Story 1.2)

```
--z-skip-link: 60   ← Skip-to-content (this story)
--z-toast:     50
--z-modal:     40   ← Mobile nav sheet overlay / Desktop dropdowns
--z-sticky-nav: 30  ← Header (this story)
--z-sticky-cta: 20
--z-content:    1
```

**Note:** The mobile nav sheet (z-index 40 via Radix) correctly sits above the sticky nav (z-index 30) but below the skip-to-content link (z-index 60).

### Performance Budget Impact

| Asset | Size Estimate | Budget |
|-------|--------------|--------|
| shadcn Sheet (Radix Dialog) | ~8KB gzipped | Within 150KB JS budget |
| shadcn DropdownMenu (Radix) | ~5KB gzipped | Within 150KB JS budget |
| shadcn Button | ~2KB gzipped | Within 150KB JS budget |
| Header/Footer RSC (server-rendered) | 0KB client JS | No client bundle impact |
| Navigation data | <1KB | Negligible |
| Skip-to-content CSS | <0.5KB | Within 30KB CSS budget |

### From Story 1.2 — What Already Exists

- `src/styles/globals.css` — full design token system including z-index, focus ring, transition, and container utilities
- `src/app/layout.tsx` — root layout with Montserrat font, metadata, viewport configuration
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `src/components/ui/.gitkeep` — empty placeholder (shadcn components will be added here)
- `src/components/layout/.gitkeep` — empty placeholder (layout components created in this story)
- `components.json` — shadcn config (radix-nova, rsc: true, lucide icons)
- Logo asset at `public/images/brand/logo-remax-altitud.png`
- `prefers-reduced-motion` CSS rule that flattens all animation durations

### What This Story Does NOT Include

- ❌ Functional language switching — Story 1.4 (this story creates the placeholder toggle)
- ❌ i18n / next-intl routing — Story 1.4
- ❌ Split-hero or any page content — Story 1.5
- ❌ Breadcrumbs — Story 1.6+
- ❌ Search bar in header — Epic 3
- ❌ Shortlist icon in header — Epic 7
- ❌ Sticky mobile CTA bar — Epic 4
- ❌ Scroll-aware hide/show nav animation — UX spec describes nav sliding in when hero scrolls out; this story implements baseline `sticky top-0`. The scroll-aware behavior is deferred to Epic 3's search bar integration where the compact nav state is needed
- ❌ Mobile swipe-to-dismiss gesture for nav sheet — deferred to polish pass (requires `@use-gesture/react`)
- ❌ Dark mode — explicitly NOT for MVP

### Files This Story Creates

**New files:**
- `src/components/layout/skip-to-content.tsx` — Skip-to-content link
- `src/components/layout/logo.tsx` — Swappable logo with next/image
- `src/components/layout/header.tsx` — App header (Server Component)
- `src/components/layout/footer.tsx` — App footer (Server Component)
- `src/components/layout/desktop-nav.tsx` — Desktop navigation with dropdowns
- `src/components/layout/mobile-nav.tsx` — Mobile slide-out navigation (Client Component)
- `src/components/layout/language-toggle.tsx` — EN/ES placeholder toggle (Client Component)
- `src/lib/navigation.ts` — Shared navigation data structure

**Modified files:**
- `src/app/layout.tsx` — wire SkipToContent + Header + main#main-content + Footer
- `src/styles/globals.css` — add `.skip-to-content` utility class
- `package.json` / `package-lock.json` — new deps from shadcn component installation

**shadcn/ui components added to `src/components/ui/`:**
- `button.tsx`
- `sheet.tsx`
- `navigation-menu.tsx`

**New data/constants files:**
- `src/lib/constants/offices.ts` — Office address/phone data for footer

**Deleted files:**
- `src/components/layout/.gitkeep` — replaced by actual component files
- `src/components/ui/.gitkeep` — replaced by shadcn component files

### Git Branch

Branch name: `1-3-core-layout-and-navigation`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Architecture — §Desktop Navigation, §Mobile Navigation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation — §Color Application Rules (Navigation, Footer)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility — §Accessibility Strategy, §Keyboard Navigation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Modal & Overlay Patterns — Skip-to-content, Focus trap, Z-index hierarchy]
- [Source: _bmad-output/planning-artifacts/architecture.md#§8 Frontend Architecture — Component Hierarchy, Client vs. Server Component Split]
- [Source: _bmad-output/planning-artifacts/architecture.md#Directory Structure — src/components/layout/]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/implementation-artifacts/1-2-design-system-and-token-foundation.md — existing file state, token definitions]
