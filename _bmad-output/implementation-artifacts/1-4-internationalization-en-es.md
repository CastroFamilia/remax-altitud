# Story 1.4: Internationalization (EN/ES)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitor**,
I want the site to automatically display in my language and let me switch easily,
So that I can browse comfortably whether I speak English or Spanish.

## Acceptance Criteria

1. **Given** a visitor with browser language set to Spanish **When** they first visit the site **Then** the site loads in Spanish automatically (FR29).

2. **Given** any page **When** the language toggle is clicked **Then** the page switches to the other language without a full reload (<150ms per UX spec) (FR30).

3. **Given** the language switches **When** the page re-renders **Then** all UI elements, navigation, forms, and CTAs display in the selected language (FR32).

4. **Given** `next-intl` routing **When** visiting `/en/about` vs `/es/about` **Then** both resolve correctly with locale-appropriate content (AR7, AR8).

5. **Given** the html element **When** language switches **Then** the `lang` attribute updates dynamically (UX-DR26).

6. **Given** a non-EN/non-ES browser **When** the visitor arrives **Then** the site defaults to English with no error.

7. **And** only the current page's locale strings are loaded (not all translations at once) (AR8).

8. **And** URL structure uses `/{locale}/` prefix for all routes (AR12).

9. **And** `npm run build` passes with zero type errors and zero lint errors.

10. **And** the language toggle in both header and footer is fully functional (replaces Story 1.3 placeholder).

## Tasks / Subtasks

### Task 0: Install `next-intl` and configure Next.js plugin (AC: #4, #7, #8)

- [ ] Run `npm install next-intl`
- [ ] Update `next.config.ts` — wrap existing config with `createNextIntlPlugin`:
  ```typescript
  import createNextIntlPlugin from 'next-intl/plugin';

  const withNextIntl = createNextIntlPlugin();

  // Wrap the existing Sentry-wrapped config:
  // export default withNextIntl(withSentryConfig(nextConfig, sentryOptions));
  ```
  **Critical:** `withNextIntl` must wrap the outermost config. Order: `withNextIntl(withSentryConfig(nextConfig, ...))`.
- [ ] Verify `npm run build` passes after installation

### Task 1: Create routing configuration (AC: #4, #8)

- [ ] Create `src/i18n/routing.ts`:
  ```typescript
  import { defineRouting } from 'next-intl/routing';

  export const routing = defineRouting({
    locales: ['en', 'es'],
    defaultLocale: 'en',
    localePrefix: 'always',  // All routes use /{locale}/ prefix (AR12)
  });
  ```
  **Design decision:** `localePrefix: 'always'` per AR12 — every URL has `/{locale}/` prefix for SEO clarity and hreflang correctness. No "hidden default" locale.
  [Source: architecture.md#§7 Internationalization Architecture — "URL structure uses `/{locale}/` prefix for all routes"]

- [ ] Export `locales` and `defaultLocale` types for reuse across the codebase

### Task 2: Create locale-aware navigation utilities (AC: #4, #2)

- [ ] Create `src/i18n/navigation.ts`:
  ```typescript
  import { createNavigation } from 'next-intl/navigation';
  import { routing } from './routing';

  export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
  ```
- [ ] This replaces `next/link` and `next/navigation` imports throughout the app for locale-aware routing
- [ ] **Migration rule:** All `<Link>` imports in layout components must switch from `next/link` → `@/i18n/navigation`

### Task 3: Create request configuration for server-side i18n (AC: #7)

- [ ] Create `src/i18n/request.ts`:
  ```typescript
  import { getRequestConfig } from 'next-intl/server';
  import { routing } from './routing';

  export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    // Validate locale against supported list
    if (!locale || !routing.locales.includes(locale as any)) {
      locale = routing.defaultLocale;
    }

    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default,
    };
  });
  ```
  **Critical:** Dynamic import ensures only the current locale's strings are loaded per request (AR8). The messages directory is at `src/messages/` relative to the project root, but the import path from `src/i18n/request.ts` needs `../../messages/`.

  **Wait — verify path:** The architecture spec places messages at `src/messages/en.json`. From `src/i18n/request.ts`, the relative path is `../messages/${locale}.json`. Adjust accordingly.

### Task 4: Create middleware for locale detection + redirects (AC: #1, #6, #8)

- [ ] Create `middleware.ts` at project root (NOT inside `src/`):
  ```typescript
  import createMiddleware from 'next-intl/middleware';
  import { routing } from './src/i18n/routing';

  export default createMiddleware(routing);

  export const config = {
    matcher: [
      // Match all pathnames except:
      // - API routes (/api/...)
      // - Next.js internals (/_next/...)
      // - Static files (favicon.ico, images, etc.)
      '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
  };
  ```
  **Behavior:**
  - Reads `Accept-Language` header → matches against `['en', 'es']`
  - Spanish browser → redirects `/` → `/es/`
  - English browser → redirects `/` → `/en/`
  - Unsupported language (German, French, etc.) → defaults to `/en/` (AC: #6)
  - Sets `x-next-intl-locale` response header for downstream use

  **Import path note:** Since `middleware.ts` is at the project root and routing is in `src/i18n/`, the import path may need adjustment. If TypeScript path aliases don't resolve from root middleware, use a relative path: `'./src/i18n/routing'`. Test during build.

  [Source: architecture.md#§7 — "middleware.ts: Detect browser Accept-Language header, Match against supported locales: ['en', 'es'], Default: 'en'"]

### Task 5: Restructure app directory for `[locale]` segment (AC: #4, #5, #8)

- [ ] Create `src/app/[locale]/` directory
- [ ] Move `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- [ ] Create `src/app/[locale]/layout.tsx` — this becomes the primary layout:
  ```typescript
  import { NextIntlClientProvider } from 'next-intl';
  import { getMessages, setRequestLocale } from 'next-intl/server';
  import { notFound } from 'next/navigation';
  import { routing } from '@/i18n/routing';
  import { Montserrat } from 'next/font/google';
  import '@/styles/globals.css';
  import { cn } from '@/lib/utils';
  import { SkipToContent } from '@/components/layout/skip-to-content';
  import { Header } from '@/components/layout/header';
  import { Footer } from '@/components/layout/footer';

  const montserrat = Montserrat({
    subsets: ['latin', 'latin-ext'],
    weight: ['400', '600', '700', '800'],
    display: 'swap',
    variable: '--font-montserrat',
  });

  // Enable static rendering for all supported locales
  export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
  }

  export default async function LocaleLayout({
    children,
    params,
  }: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;

    // Validate locale
    if (!routing.locales.includes(locale as any)) {
      notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Load messages for this locale
    const messages = await getMessages();

    return (
      <html lang={locale} className={cn('font-sans', montserrat.variable)}>
        <body>
          <NextIntlClientProvider messages={messages}>
            <SkipToContent />
            <Header />
            <main id="main-content">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }
  ```
  **Critical details:**
  - `<html lang={locale}>` — dynamically sets lang attribute (AC: #5, UX-DR26)
  - `NextIntlClientProvider` wraps all children — enables `useTranslations()` in client components
  - `generateStaticParams()` — enables SSG for both locales
  - `setRequestLocale(locale)` — required for static rendering support in Next.js 15
  - `params` is a Promise in Next.js 15 — must be awaited

- [ ] Update `src/app/layout.tsx` — strip it to a minimal shell (fonts, CSS already handled in `[locale]/layout.tsx`). This file should only contain `{children}` passthrough since `[locale]/layout.tsx` now owns `<html>` and `<body>`:
  ```typescript
  // src/app/layout.tsx — minimal root, no <html>/<body> tags
  // The [locale]/layout.tsx handles <html>, <body>, fonts, providers
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return children;
  }
  ```
  **Warning:** You cannot have TWO `<html>` tags. The root `layout.tsx` must NOT render `<html>` or `<body>` — only the `[locale]/layout.tsx` should.

- [ ] Move `metadata` and `viewport` exports to `src/app/[locale]/layout.tsx` (they belong with the layout that renders `<html>`)
- [ ] Move existing `src/app/design-system/page.tsx` → `src/app/[locale]/design-system/page.tsx`
- [ ] Verify the `src/app/api/health/route.ts` stays at `src/app/api/` (NOT inside `[locale]`) — API routes don't need locale prefixing
- [ ] Verify `src/app/favicon.ico` stays at `src/app/` root

### Task 6: Create EN/ES message files (AC: #3, #7)

- [ ] Delete `src/messages/.gitkeep`
- [ ] Create `src/messages/en.json` with all current UI strings:
  ```json
  {
    "Navigation": {
      "properties": "Properties",
      "mountainsPZ": "Mountains (PZ)",
      "coastDominical": "Coast (Dominical)",
      "searchAll": "Search All Properties",
      "areas": "Areas",
      "perezZeledon": "Pérez Zeledón",
      "dominical": "Dominical",
      "uvita": "Uvita",
      "allAreas": "All Areas",
      "communities": "Communities",
      "rise": "RISE",
      "santaElenaHills": "Santa Elena Hills",
      "allCommunities": "All Communities",
      "sellYourProperty": "Sell Your Property",
      "about": "About",
      "ourTeam": "Our Team",
      "contact": "Contact"
    },
    "LanguageToggle": {
      "switchLanguage": "Switch language",
      "currentLanguage": "English"
    },
    "SkipToContent": {
      "label": "Skip to content"
    },
    "Footer": {
      "quickLinks": "Quick Links",
      "offices": "Our Offices",
      "perezZeledonOffice": "RE/MAX Altitud — Pérez Zeledón",
      "dominicalOffice": "RE/MAX Altitud Cero — Dominical",
      "followUs": "Follow Us",
      "allRightsReserved": "All rights reserved",
      "sellWithUs": "Sell with Us",
      "aboutUs": "About Us",
      "ourAgents": "Our Agents",
      "contactUs": "Contact Us"
    },
    "HomePage": {
      "title": "RE/MAX Altitud",
      "subtitle": "Costa Rica's Southern Zone — Real Estate Platform",
      "scaffoldingNote": "Foundation scaffolding complete. Content coming in Stories 1.5–1.7."
    },
    "Metadata": {
      "title": "RE/MAX Altitud — Costa Rica Real Estate",
      "description": "Discover properties in Costa Rica's Southern Zone. Map-first search, multilingual support, and expert agents across Pérez Zeledón and Dominical/Uvita."
    },
    "MobileNav": {
      "openMenu": "Open navigation menu",
      "closeMenu": "Close navigation menu"
    }
  }
  ```
- [ ] Create `src/messages/es.json` with Spanish translations:
  ```json
  {
    "Navigation": {
      "properties": "Propiedades",
      "mountainsPZ": "Montañas (PZ)",
      "coastDominical": "Costa (Dominical)",
      "searchAll": "Buscar Todas las Propiedades",
      "areas": "Zonas",
      "perezZeledon": "Pérez Zeledón",
      "dominical": "Dominical",
      "uvita": "Uvita",
      "allAreas": "Todas las Zonas",
      "communities": "Comunidades",
      "rise": "RISE",
      "santaElenaHills": "Santa Elena Hills",
      "allCommunities": "Todas las Comunidades",
      "sellYourProperty": "Vende tu Propiedad",
      "about": "Nosotros",
      "ourTeam": "Nuestro Equipo",
      "contact": "Contacto"
    },
    "LanguageToggle": {
      "switchLanguage": "Cambiar idioma",
      "currentLanguage": "Español"
    },
    "SkipToContent": {
      "label": "Saltar al contenido"
    },
    "Footer": {
      "quickLinks": "Enlaces Rápidos",
      "offices": "Nuestras Oficinas",
      "perezZeledonOffice": "RE/MAX Altitud — Pérez Zeledón",
      "dominicalOffice": "RE/MAX Altitud Cero — Dominical",
      "followUs": "Síguenos",
      "allRightsReserved": "Todos los derechos reservados",
      "sellWithUs": "Vende con Nosotros",
      "aboutUs": "Sobre Nosotros",
      "ourAgents": "Nuestros Agentes",
      "contactUs": "Contáctanos"
    },
    "HomePage": {
      "title": "RE/MAX Altitud",
      "subtitle": "Zona Sur de Costa Rica — Plataforma de Bienes Raíces",
      "scaffoldingNote": "Estructura base completa. Contenido próximamente en Historias 1.5–1.7."
    },
    "Metadata": {
      "title": "RE/MAX Altitud — Bienes Raíces Costa Rica",
      "description": "Descubre propiedades en la Zona Sur de Costa Rica. Búsqueda por mapa, soporte multilingüe y agentes expertos en Pérez Zeledón y Dominical/Uvita."
    },
    "MobileNav": {
      "openMenu": "Abrir menú de navegación",
      "closeMenu": "Cerrar menú de navegación"
    }
  }
  ```
  **Key translation rules:**
  - "Sell Your Property" → "Vende tu Propiedad" (informal tú, not formal usted — matching UX tone)
  - Area names (Pérez Zeledón, Dominical, Uvita) stay identical in both languages
  - Community names (RISE, Santa Elena Hills) stay identical — they are proper nouns
  - ARIA labels must be translated for screen reader localization

### Task 7: Refactor navigation data to use i18n keys (AC: #3)

- [ ] Update `src/lib/navigation.ts` — replace hardcoded English labels with i18n message keys:
  ```typescript
  export interface NavItem {
    /** i18n message key within "Navigation" namespace */
    labelKey: string;
    href: string;
    activePrefix?: string;
    children?: NavItem[];
    isCta?: boolean;
    icon?: string;
    isGroup?: boolean;
  }
  ```
  Change `label: "Properties"` → `labelKey: "properties"`, etc. for all items.

- [ ] Update `src/components/layout/desktop-nav.tsx`:
  - Import `useTranslations` from `next-intl`
  - Import `Link` from `@/i18n/navigation` (replaces `next/link`)
  - Import `usePathname` from `@/i18n/navigation` (replaces `next/navigation`)
  - Use `const t = useTranslations('Navigation');` and render `t(item.labelKey)`
  - All `<Link>` hrefs remain as-is — the locale-aware `Link` auto-prefixes `/{locale}/`

- [ ] Update `src/components/layout/mobile-nav.tsx`:
  - Same imports as desktop-nav
  - Use `useTranslations('Navigation')` for nav labels
  - Use `useTranslations('MobileNav')` for ARIA labels (open/close menu)
  - Import `Link` from `@/i18n/navigation`

- [ ] Update `src/components/layout/header.tsx`:
  - Import `Link` from `@/i18n/navigation` (for logo link)

- [ ] Update `src/components/layout/footer.tsx`:
  - Import `useTranslations` from `next-intl`
  - Use `const t = useTranslations('Footer');` for all footer strings
  - Import `Link` from `@/i18n/navigation`
  - **Note:** Footer is currently a Server Component. `useTranslations` works in both server and client components with next-intl.

- [ ] Update `src/components/layout/logo.tsx`:
  - Import `Link` from `@/i18n/navigation` (replaces `next/link`)

- [ ] Update `src/components/layout/skip-to-content.tsx`:
  - Use `useTranslations('SkipToContent')` for the link label text

### Task 8: Activate the Language Toggle component (AC: #2, #10)

- [ ] Rewrite `src/components/layout/language-toggle.tsx`:
  - Remains `'use client'` component
  - Import `useRouter, usePathname` from `@/i18n/navigation`
  - Import `useLocale` from `next-intl`
  - Import `useTranslations` from `next-intl`
  - On click: `router.replace(pathname, { locale: targetLocale })` — this triggers a soft navigation that swaps locale without full page reload (AC: #2, <150ms target)
  - Active locale button gets `font-semibold underline` + `aria-current="true"`
  - Inactive locale button gets `opacity-70 hover:opacity-100`
  - `aria-label` uses translated string from `LanguageToggle.switchLanguage`
  - Preserve existing `variant` prop (header/dark/light) styling from Story 1.3

  ```typescript
  'use client';

  import { useLocale, useTranslations } from 'next-intl';
  import { useRouter, usePathname } from '@/i18n/navigation';

  interface LanguageToggleProps {
    variant?: 'light' | 'dark' | 'header';
  }

  export function LanguageToggle({ variant = 'header' }: LanguageToggleProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('LanguageToggle');

    const switchLocale = (target: 'en' | 'es') => {
      if (target !== locale) {
        router.replace(pathname, { locale: target });
      }
    };

    // ... variant styling (preserved from Story 1.3)
    // Render EN | ES buttons with active/inactive states
  }
  ```

### Task 9: Update homepage to use translations (AC: #3)

- [ ] Update `src/app/[locale]/page.tsx`:
  - Import `useTranslations` from `next-intl`
  - Import `setRequestLocale` from `next-intl/server`
  - Use `const t = useTranslations('HomePage');` for all UI strings
  - Call `setRequestLocale(locale)` for static rendering support
  - Accept `params: Promise<{ locale: string }>` and await it

### Task 10: Handle design-system page locale (AC: #4)

- [ ] Update `src/app/[locale]/design-system/page.tsx`:
  - Add `setRequestLocale(locale)` call
  - Accept locale params
  - Minimal changes — this is a dev-only page, but it must work within the `[locale]` segment

### Task 11: Verify not-found and error handling (AC: #6)

- [ ] Create `src/app/[locale]/not-found.tsx` — handles 404 within locale routes
- [ ] Ensure visiting `/fr/` (unsupported locale) redirects to `/en/` via middleware (AC: #6)
- [ ] Ensure visiting `/` (no locale) redirects to `/en/` or `/es/` based on browser language (AC: #1)

### Task 12: Delete i18n placeholder files (AC: cleanup)

- [ ] Delete `src/lib/i18n/.gitkeep` — the `src/i18n/` directory (NOT `src/lib/i18n/`) now owns i18n configuration
  **Architecture note:** The architecture doc specifies `src/lib/i18n/` for config, request, and navigation files. However, `next-intl` convention and its plugin default expect `src/i18n/request.ts`. We follow the `next-intl` convention (`src/i18n/`) since the plugin auto-discovers this path. If the team prefers `src/lib/i18n/`, pass the custom path to `createNextIntlPlugin('./src/lib/i18n/request.ts')`.

### Task 13: Build verification and smoke test (AC: #9)

- [ ] Run `npm run build` — zero type errors, zero lint errors
- [ ] Verify `/en/` renders English homepage with English nav labels
- [ ] Verify `/es/` renders Spanish homepage with Spanish nav labels
- [ ] Verify clicking "ES" in language toggle navigates from `/en/` → `/es/` without full reload
- [ ] Verify `<html lang="es">` is set when on Spanish route
- [ ] Verify `/` redirects to `/en/` (for English browser) or `/es/` (for Spanish browser)
- [ ] Verify `/api/health` still works (not affected by locale routing)
- [ ] Verify design-system page works at `/en/design-system`

## Dev Notes

### Architecture Constraints

- **AD-4:** `next-intl` is the mandated i18n library — App Router native, type-safe, server component support, per-route loading [Source: architecture.md#§1 Key Architectural Decisions]
- **AR8:** Only the current page's locale strings are loaded, not all translations at once [Source: epics.md#Story 1.4]
- **AR12:** URL structure uses `/{locale}/` prefix for all routes [Source: epics.md#Story 1.4]
- **Next.js 15 specifics:** `params` is a Promise that must be awaited. `generateStaticParams()` required for SSG with dynamic segments.

### UX Constraints

- **UX-DR26:** `<html lang>` must update dynamically — critical for VoiceOver Spanish pronunciation [Source: ux-design-specification.md#§Accessibility — Language Declaration]
- **FR29:** Auto-language detection from browser, no popup [Source: epics.md#Story 1.4]
- **FR30:** Language switch <150ms, no full page reload [Source: ux-design-specification.md#§Loading States]
- **Language toggle placement:** Header (desktop) + bottom of mobile nav + footer [Source: ux-design-specification.md#§Mobile Navigation]

### Performance Targets

- Language switch must complete in <150ms (soft navigation via `router.replace`)
- Only current locale JSON loaded per request (dynamic import in `request.ts`)
- No pre-loading of alternate locale strings

### File Migration Map

| Before (Story 1.3) | After (Story 1.4) |
|---|---|
| `src/app/layout.tsx` (full layout) | `src/app/layout.tsx` (minimal passthrough) |
| `src/app/page.tsx` | `src/app/[locale]/page.tsx` |
| `src/app/design-system/page.tsx` | `src/app/[locale]/design-system/page.tsx` |
| — | `src/app/[locale]/layout.tsx` (full layout + providers) |
| — | `middleware.ts` (locale detection) |
| — | `src/i18n/routing.ts` |
| — | `src/i18n/navigation.ts` |
| — | `src/i18n/request.ts` |
| `src/messages/.gitkeep` | `src/messages/en.json` + `src/messages/es.json` |
| `src/lib/i18n/.gitkeep` | (deleted — replaced by `src/i18n/`) |

### Import Migration Rules

| Module | Before | After |
|---|---|---|
| `Link` | `next/link` | `@/i18n/navigation` |
| `usePathname` | `next/navigation` | `@/i18n/navigation` |
| `useRouter` | `next/navigation` | `@/i18n/navigation` |
| Nav labels | Hardcoded strings | `useTranslations('Navigation')` |

### Testing Standards

- Build must pass (`npm run build`)
- Both `/en/` and `/es/` must render correctly
- Language toggle must switch without full page reload
- `<html lang>` must reflect current locale
- API routes (`/api/health`) must remain unaffected by middleware
- ARIA labels must be translated in both locales

### Project Structure Notes

- `src/i18n/` is a NEW top-level directory (peer to `src/lib/`, `src/hooks/`, etc.)
- This deviates slightly from architecture.md which specifies `src/lib/i18n/`. Rationale: `next-intl` plugin auto-discovers `src/i18n/request.ts` by convention. Using `src/lib/i18n/` would require a custom path override in `createNextIntlPlugin()`.
- `middleware.ts` lives at project root per Next.js convention
- Message files stay at `src/messages/` per architecture spec

### References

- [Source: architecture.md#§1 — AD-4: next-intl for i18n]
- [Source: architecture.md#§3 — Directory Architecture: src/lib/i18n/, src/messages/]
- [Source: architecture.md#§7 — Internationalization Architecture: Locale Routing, URL Structure, Translation Architecture]
- [Source: architecture.md#§8 — Component Hierarchy: LocaleProvider (next-intl)]
- [Source: architecture.md#§8 — State Management: Language via URL path]
- [Source: architecture.md#§16 — next-intl: latest stable]
- [Source: epics.md#Story 1.4 — All acceptance criteria]
- [Source: ux-design-specification.md#§Loading States — Language switch <150ms]
- [Source: ux-design-specification.md#§Accessibility — Language Declaration: html lang dynamic update]
- [Source: ux-design-specification.md#§Screen Reader Support — Language toggle aria-label]
- [Source: ux-design-specification.md#§Mobile Navigation — Language toggle at bottom]
- [Source: ux-design-specification.md#§Component Hierarchy — LanguageToggle (EN/ES switcher, no page reload)]
- [Source: prd.md — FR29, FR30, FR32]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
