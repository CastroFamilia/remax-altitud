# Story 1.2: Design System & Token Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitor**,
I want consistent, premium visual styling across the entire platform,
So that the site feels trustworthy and professionally designed on any device.

## Acceptance Criteria

1. **Given** `globals.css` is configured **When** the app loads **Then** all CSS custom properties are defined (colors, typography, spacing, radii, shadows, transitions per UX-DR2).

2. **Given** the color system **When** rendering on light surfaces **Then** dark primary variants are used (navy `#000E35`, burgundy `#660000`) with gold `#C2A661` accents (UX-DR3).

3. **Given** region themes **When** mountain content is displayed **Then** forest green `#233428` + gold palette applies; coastal content uses ocean blue `#183C5A` + sand (UX-DR4).

4. **Given** Montserrat is loaded via `next/font` **When** any page renders **Then** 4 weights (400, 600, 700, 800) are available with 16px body minimum (UX-DR5).

5. **Given** the spacing system **When** components are built **Then** they use 4px-base grid tokens (`--space-1` through `--space-24`).

6. **Given** touch target requirements **When** interactive elements render on mobile **Then** all are ≥ 44×44px with 8px spacing (UX-DR7).

7. **Given** transitions are defined **When** animations play **Then** they use explicit property targeting (never `all`) and respect `prefers-reduced-motion` (UX-DR18).

8. **And** glassmorphism tokens (`glass-bg`, `glass-border`, `glass-blur`) are defined and documented (UX-DR16).

9. **And** the shadow system has all 6 levels defined (`sm` through `cta`) (UX-DR17).

10. **And** shadcn/ui is initialized with `components.json` configured for CSS variables, Tailwind v4, and the project alias structure.

11. **And** a `cn()` utility merging `clsx` + `tailwind-merge` exists at `src/lib/utils.ts`.

12. **And** `npm run build` passes with zero type errors and zero lint errors.

## Tasks / Subtasks

- [ ] Task 1: Install shadcn/ui and configure `components.json` (AC: #10, #11)
  - [ ] Run `npx shadcn@latest init` — select: style `new-york`, base color `neutral`, CSS variables `yes`, `src/styles/globals.css` as CSS path
  - [ ] Verify `components.json` is created with correct aliases (`@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks`)
  - [ ] Set `rsc: true` in `components.json` — this is an App Router project using React Server Components
  - [ ] Verify `src/lib/utils.ts` exists with `cn()` helper using `clsx` + `tailwind-merge`
  - [ ] Verify `class-variance-authority` is in `package.json` dependencies (shadcn installs it — needed for component variant APIs in later stories)
  - [ ] Confirm `tailwind.config` field is empty string (Tailwind v4 CSS-first — no config file)
  - [ ] Install `tw-animate-css` if not added automatically (shadcn uses it for animation)
  - [ ] Verify build passes after shadcn init — resolve any conflicts with existing `globals.css`

- [ ] Task 2: Configure Montserrat via `next/font` (AC: #4)
  - [ ] Import Montserrat from `next/font/google` in `src/app/layout.tsx`
  - [ ] Load exactly 4 weights: `400, 600, 700, 800` (no 300 — poor readability on low-end Android)
  - [ ] Load `latin` and `latin-ext` subsets (accents: é, ñ, ü for Spanish)
  - [ ] Apply the font CSS variable (`--font-montserrat`) to `<html>` element via `className`
  - [ ] Set font `display: 'swap'` for performance
  - [ ] Define CSS custom properties in `globals.css`:
    ```css
    :root {
      --font-display: var(--font-montserrat), system-ui, sans-serif;
      --font-body: var(--font-montserrat), system-ui, sans-serif;
      --font-ui: var(--font-montserrat), system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    ```
  - [ ] Ensure `body` uses `font-family: var(--font-body)` in the CSS base layer

- [ ] Task 3: Define the complete color system in `globals.css` (AC: #1, #2, #3, #8)
  - [ ] Define all brand primaries, brand brights, gold accents, surfaces, glassmorphism, text, region themes, and semantic colors as CSS custom properties in `:root`
  - [ ] Map CSS custom properties to Tailwind theme via `@theme inline` block — every token must be usable as `bg-primary`, `text-accent`, etc.
  - [ ] Define shadcn/ui semantic slots (`--background`, `--foreground`, `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--muted`, `--muted-foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--destructive`, `--border`, `--input`, `--ring`) mapped to RE/MAX brand values
  - [ ] Remove the `@media (prefers-color-scheme: dark)` block — dark mode is NOT for MVP per UX-DR spec
  - [ ] Verify these color application rules:
    - Page canvas: `--color-bg` (#F7F5EE crema)
    - Cards: `--color-bg-white` (#FFFFFF)
    - Primary CTA: `--color-accent` (#660000 burgundy)
    - WhatsApp CTA: `--color-whatsapp` (#128C7E darker teal, WCAG AA at all sizes)
    - Footer: `--color-bg-dark` (#0D0D0D)
  - [ ] **Exact color values** (copy from UX-DR, do NOT invent):
    ```
    --color-primary:        #000E35   (Azul Oscuro — nav, headings)
    --color-primary-light:  #0B1E43   (hover states, cards)
    --color-accent:         #660000   (Rojo Oscuro — premium CTA)
    --color-accent-light:   #931F2E   (hover on dark-red)
    --color-red-bright:     #FF1200   (badges, sale indicators — sparingly)
    --color-blue-bright:    #0043FF   (links, active filters — sparingly)
    --color-gold:           #C2A661   (glass borders, premium labels)
    --color-gold-dark:      #9B8347   (gold on light backgrounds)
    --color-gold-light:     #D9C39B   (soft sand)
    --color-gold-muted:     rgba(194, 166, 97, 0.4)
    --color-bg:             #F7F5EE   (Crema — page background)
    --color-bg-warm:        #EFECE4   (section dividers)
    --color-bg-white:       #FFFFFF   (cards, modals)
    --color-bg-dark:        #0D0D0D   (footer, dark sections)
    --glass-bg:             rgba(255, 255, 255, 0.10)
    --glass-bg-strong:      rgba(255, 255, 255, 0.25)
    --glass-border:         rgba(194, 166, 97, 0.4)
    --glass-blur:           15px
    --color-text-primary:   #202020
    --color-text-secondary: #666666
    --color-text-muted:     #888888
    --color-text-on-dark:   #F8F8F8
    --color-text-on-accent: #FFFFFF
    --mountain-primary:     #233428
    --mountain-accent:      #C2A661
    --beach-primary:        #183C5A
    --beach-accent:         #D9C39B
    --color-success:        #16A34A
    --color-warning:        #D97706
    --color-error:          #DC2626
    --color-info:           #2563EB
    --color-whatsapp:       #128C7E
    --color-whatsapp-icon:  #25D366
    ```

- [ ] Task 4: Define type scale tokens (AC: #1, #4)
  - [ ] Add responsive type scale as CSS custom properties:
    ```
    --text-hero:     2.5rem mobile / 4rem desktop,     weight 600, line-height 1.1
    --text-h1:       2rem mobile / 2.8rem desktop,     weight 600, line-height 1.2
    --text-h2:       1.5rem mobile / 2rem desktop,     weight 600, line-height 1.25
    --text-h3:       1.25rem mobile / 1.5rem desktop,  weight 600, line-height 1.3
    --text-h4:       1.1rem mobile / 1.2rem desktop,   weight 600, line-height 1.35
    --text-body:     1rem (both),                      weight 400, line-height 1.6
    --text-body-lg:  1.1rem mobile / 1.15rem desktop,  weight 400, line-height 1.6
    --text-sm:       0.875rem (both),                  weight 400, line-height 1.5
    --text-xs:       0.75rem (both),                   weight 600, line-height 1.4
    --text-price:    1.5rem mobile / 1.8rem desktop,   weight 800, line-height 1.1
    ```
  - [ ] Headings use `--color-primary` (#000E35) on light backgrounds, white on dark. Letter-spacing: `-0.5px` for display sizes
  - [ ] Body text: 16px minimum — never smaller for content text
  - [ ] Labels/badges: 12px, uppercase, `letter-spacing: 1px`
  - [ ] Prices: `--color-accent` (#660000), always the most prominent text on a card

- [ ] Task 5: Define spacing, radius, shadow, and transition tokens (AC: #5, #7, #8, #9)
  - [ ] **Spacing** (4px base grid):
    ```
    --space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
    --space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
    --space-12: 48px  --space-16: 64px  --space-24: 96px
    ```
  - [ ] **Border radius**:
    ```
    --radius-sm: 4px    --radius-md: 8px    --radius-lg: 12px
    --radius-xl: 16px   --radius-2xl: 20px  --radius-full: 9999px
    ```
  - [ ] **Shadows** (6 levels):
    ```
    --shadow-sm:    0 1px 3px rgba(0,0,0,0.06)
    --shadow-md:    0 4px 12px rgba(0,0,0,0.08)
    --shadow-lg:    0 10px 30px rgba(0,0,0,0.10)
    --shadow-xl:    0 15px 40px rgba(0,0,0,0.12)
    --shadow-glass: 0 8px 32px rgba(0,0,0,0.15)
    --shadow-cta:   0 5px 15px rgba(102,0,0,0.3)
    ```
  - [ ] **Transitions** — NEVER use `transition: all`:
    ```
    --ease-smooth:     cubic-bezier(0.25, 1, 0.5, 1)
    --ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1)
    --duration-fast:   0.2s   (hover, active states)
    --duration-normal: 0.3s   (dropdowns, toggles)
    --duration-smooth: 0.6s   (hero, page transitions)
    --duration-slow:   0.8s   (map camera)
    --duration-skeleton: 2s   (loading shimmer pulse)
    ```
  - [ ] **Z-index scale** (from UX spec overlay hierarchy — prevents stacking bugs across stories):
    ```
    --z-content:     1
    --z-sticky-cta:  20
    --z-sticky-nav:  30
    --z-modal:       40
    --z-toast:       50
    --z-skip-link:   60
    ```
  - [ ] **Focus indicator tokens** (dual-ring pattern per UX-DR24):
    ```
    --focus-ring-color:        #0043FF
    --focus-ring-width:        2px
    --focus-ring-offset:       2px
    --focus-ring-offset-color: #FFFFFF
    ```
  - [ ] **Skeleton shimmer keyframes**:
    ```css
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    ```
    Register as a reusable animation. Story 1.7 (Loading States) will consume this.
  - [ ] Register all spacing/radius/shadow/z-index tokens in the `@theme inline` block so they work as Tailwind utilities
  - [ ] Add `@media (prefers-reduced-motion: reduce)` rule that sets all durations to `0.01s` and disables skeleton shimmer animation

- [ ] Task 6: Configure layout foundation (AC: #1, #6)
  - [ ] Use Tailwind v4 default breakpoints — do NOT redefine them (they match the UX spec exactly):
    ```
    sm: 640px   (large phones landscape)
    md: 768px   (tablets portrait)
    lg: 1024px  (tablets landscape / small laptops)
    xl: 1280px  (desktop — full layout)
    2xl: 1536px (large desktop — generous whitespace)
    ```
  - [ ] Add a `.container` base style with `max-width: 1280px` and `margin: 0 auto` with responsive padding (16px mobile, 24px tablet, 32px desktop) — per UX spec: "Content never stretches beyond 1280px"
  - [ ] Add a `.content-text` max-width constraint at `720px` for readability
  - [ ] Ensure touch targets: create a CSS utility or add a note in the tokens that all interactive elements must be ≥ 44×44px

- [ ] Task 7: Create a visual token preview page (AC: all)
  - [ ] Create `src/app/design-system/page.tsx` — a dev-only page showing all tokens in action
  - [ ] Sections: Color palette swatches, Typography scale samples, Spacing visualization, Shadow samples, Glassmorphism demo, Button variants, Region theme demos (mountain/coast)
  - [ ] This page is for development validation only — it will be removed or gated before production launch
  - [ ] Verify all tokens render correctly, contrast ratios are met, and the visual feel matches the "Premium Dual-Geography" design direction

- [ ] Task 8: Update `src/app/layout.tsx` (AC: #4)
  - [ ] Import Montserrat font and apply CSS variable class to `<html>`
  - [ ] Set `<body>` background to use `--color-bg` (crema #F7F5EE)
  - [ ] Ensure the `lang` attribute remains on `<html>` (will be dynamic in Story 1.4)

- [ ] Task 9: Final validation (AC: #12)
  - [ ] `npm run build` — zero type errors
  - [ ] `npm run lint` — zero lint errors
  - [ ] Visual check: preview page shows correct colors, fonts, spacing
  - [ ] Verify Tailwind utility classes work: `bg-primary`, `text-accent`, `shadow-lg`, `rounded-lg`, etc.
  - [ ] Verify shadcn/ui `cn()` utility works in a test import

## Dev Notes

### Architecture Compliance

- **CSS:** Tailwind CSS v4 (AD-6). CSS-first configuration — NO `tailwind.config.js/ts`. All design tokens defined via `@theme inline` and CSS custom properties in `src/styles/globals.css`
- **Components:** shadcn/ui (AD-6). Initialize with `npx shadcn@latest init`. Components will be added individually in later stories (1.3, 1.5, etc.)
- **Font loading:** `next/font/google` with Montserrat. Do NOT use `<link>` tags or external CDN — `next/font` handles self-hosting and optimization automatically

### Critical: Tailwind v4 `@theme inline` Pattern

Tailwind v4 replaces `tailwind.config.js` with CSS-first configuration. Design tokens must be registered in the `@theme inline` block to become Tailwind utilities:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /*
   * NAMING CONVENTION: shadcn requires bare names (--primary, --accent, etc.)
   * which are defined in :root. The @theme inline block maps them to Tailwind
   * utility prefixes (--color-primary, --color-accent, etc.) so both
   * `bg-primary` (Tailwind) and `var(--primary)` (CSS) work. Both are needed.
   */

  /* Colors — maps CSS vars to Tailwind utilities */
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  /* ... all shadcn semantic slots ... */

  /* Project-specific tokens */
  --color-gold: var(--gold);
  --color-mountain-primary: var(--mountain-primary);
  --color-beach-primary: var(--beach-primary);
  --color-whatsapp: var(--whatsapp);

  /* Radius */
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);

  /* Shadows — register as Tailwind utilities */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 10px 30px rgba(0,0,0,0.10);
  --shadow-xl: 0 15px 40px rgba(0,0,0,0.12);
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.15);
  --shadow-cta: 0 5px 15px rgba(102,0,0,0.3);
}

:root {
  /* Base radius for shadcn calculations */
  --radius: 0.75rem; /* 12px — maps to --radius-lg */

  /* shadcn semantic slots mapped to RE/MAX brand */
  --background: #F7F5EE;       /* Crema canvas */
  --foreground: #202020;       /* Text primary */
  --primary: #000E35;          /* Azul Oscuro */
  --primary-foreground: #F8F8F8;
  --accent: #660000;           /* Rojo Oscuro */
  --accent-foreground: #FFFFFF;
  --muted: #EFECE4;            /* Warm neutral */
  --muted-foreground: #666666;
  --card: #FFFFFF;
  --card-foreground: #202020;
  --popover: #FFFFFF;
  --popover-foreground: #202020;
  --secondary: #F7F5EE;
  --secondary-foreground: #000E35;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --border: #EFECE4;
  --input: #EFECE4;
  --ring: #0043FF;

  /* Full RE/MAX token set (used directly, not via shadcn) */
  --color-primary: #000E35;
  --color-primary-light: #0B1E43;
  /* ... all tokens from Task 3 ... */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**IMPORTANT:** The shadcn `init` command will modify `globals.css`. It will inject its own `:root` variables (in oklch color space) and `@theme inline` block. You MUST replace the shadcn defaults with RE/MAX brand values. Do NOT leave the generic neutral palette — the entire point of this story is the custom brand theme.

### Critical: shadcn/ui Initialization

```bash
npx shadcn@latest init
```

Expected prompts and answers:
- Style: `new-york` (or `default` — the latest version uses `radix-nova`)
- Base color: `neutral`
- CSS variables: `Yes`
- CSS file: `src/styles/globals.css`
- Tailwind config: `` (empty — v4 has no config file)
- Components: `@/components`
- UI: `@/components/ui`
- Utils: `@/lib/utils`
- Hooks: `@/hooks`

This creates:
- `components.json` at project root
- `src/lib/utils.ts` with `cn()` utility (`clsx` + `tailwind-merge`)
- Adds `clsx`, `tailwind-merge`, `tw-animate-css`, `class-variance-authority` to `package.json`

**Post-init:** Verify `components.json` has `"rsc": true`. Some shadcn versions default to `false`. This project uses App Router with React Server Components — `rsc: true` ensures components render on the server when possible, reducing client bundle size.

**Do NOT install any specific shadcn/ui components in this story** (no Button, Sheet, Dialog, etc.) — those are added per-story as needed starting in Story 1.3.

### Accessibility Contract (WCAG 2.1 AA)

These contrast ratios are pre-validated — do NOT change the color values:

| Combination | Ratio | Pass |
|------------|-------|------|
| `#202020` on `#F7F5EE` (text on canvas) | 12.5:1 | ✅ AAA |
| `#F8F8F8` on `#000E35` (text on navy) | 16.2:1 | ✅ AAA |
| `#FFFFFF` on `#660000` (text on burgundy) | 9.4:1 | ✅ AAA |
| `#FFFFFF` on `#128C7E` (text on WhatsApp) | 4.6:1 | ✅ AA |
| `#666666` on `#F7F5EE` (secondary text) | 5.6:1 | ✅ AA |
| `#C2A661` on `#0D0D0D` (gold on dark) | 7.8:1 | ✅ AAA |
| `#9B8347` on `#F7F5EE` (gold on cream) | 3.8:1 | ✅ AA Large |

**Rules:**
- Gold on light backgrounds: use `--color-gold-dark` (#9B8347), NOT `--color-gold` (#C2A661)
- WhatsApp button background: `--color-whatsapp` (#128C7E), NOT the icon green (#25D366)
- Focus indicators: 2px solid `#0043FF` outline + 2px white offset (dual-ring pattern)

### Performance Budget

- Montserrat 4 weights: ~80KB total (self-hosted via `next/font`, preloaded)
- CSS output (Tailwind tree-shaking): target <30KB gzipped
- No JavaScript runtime overhead from design tokens (pure CSS)

### What This Story Does NOT Include

- ❌ Any shadcn/ui component installation (Button, Sheet, Dialog, etc.) — Story 1.3+
- ❌ Layout components (Header, Footer) — Story 1.3
- ❌ i18n / next-intl — Story 1.4
- ❌ Split-hero or any page content — Story 1.5
- ❌ Dark mode — explicitly NOT for MVP per UX-DR
- ❌ RTL support — NOT for MVP. Use logical properties (`ms-`, `me-`, `ps-`, `pe-`) from day one as preparation

### From Story 1.1 — What Already Exists

- `src/styles/globals.css` — has `@import "tailwindcss"` and placeholder `@theme inline` block
- `src/app/layout.tsx` — root layout with metadata, currently using system-ui font
- `postcss.config.mjs` — configured with `@tailwindcss/postcss`
- `src/components/ui/.gitkeep` — directory scaffolded for shadcn/ui
- `src/lib/utils/.gitkeep` — directory exists (shadcn will create `src/lib/utils.ts` at parent level)
- `package.json` — Next.js 15.5.15, React 19.1.0, Tailwind CSS v4, `@tailwindcss/postcss`
- **No `tailwind.config.js/ts`** — Tailwind v4 is CSS-first. Do NOT create one

### Deferred Work From Story 1.1 Code Review

These items remain open and are NOT in scope for Story 1.2:
- Missing CSP header (requires design decisions on allowed sources — revisit after third-party integrations)
- Missing HSTS header (add when Coolify deployment is finalized)
- No HEALTHCHECK in Dockerfile (add when Coolify deployment is finalized)

### Git Branch

Branch name: `1-2-design-system-and-token-foundation`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation — §Color System, §Typography, §Spacing, §Shadows, §Transitions, §Accessibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#AD-6 — shadcn/ui + Tailwind CSS v4]
- [Source: _bmad-output/planning-artifacts/architecture.md#§8 — Frontend Architecture, Performance Budget]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-and-ci-cd-pipeline.md — existing file state]
