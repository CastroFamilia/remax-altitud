# Story 4.1: Listing Detail Page & Photo Gallery

**Status:** review
**GH Issue:** #93
**Epic:** 4 — Listing Detail & Agent Profiles
**Story Key:** 4-1-listing-detail-page-and-photo-gallery
**Created:** 2026-05-02

---

## Story

As a **visitor**,
I want a beautiful, gallery-first property page with all the details I need to evaluate a listing,
so that I can decide if this property is worth contacting an agent about.

---

## Acceptance Criteria

1. **Given** a listing detail page loads **When** rendered **Then** a hero gallery fills full-width at 60vh with a thumbnail strip and photo count overlay (FR8, UX-DR11)

2. **Given** the gallery **When** the fullscreen button is clicked **Then** a lightbox opens with swipe navigation (mobile) or arrow keys (desktop) (FR8)

3. **Given** gallery images **When** loading **Then** first 3 images load within 1s; remaining are lazy-loaded (NFR6)

4. **Given** gallery images **When** rendered **Then** they use LQIP blur placeholders that transition to sharp images (UX-DR19)

5. **Given** a listing with a YouTube video **When** the detail page renders **Then** the video is embedded and playable within the gallery or below it (FR8)

6. **Given** the price + specs bar below the gallery **When** scrolling on desktop **Then** it becomes sticky showing: price, beds/baths, lot + built area (with unit toggle), ZMT badge (UX-DR11)

7. **Given** listing content **When** displayed in the user's selected language **Then** title, description, and specs render in that language (FR31)

8. **Given** legal/property terms **When** displayed in Spanish **Then** they use the enforced translation glossary ("Propiedad Titulada," "Concesión") (FR33)

9. **Given** the listing URL (e.g., `/en/property/beautiful-mountain-home`) **When** shared as a standalone link **Then** it loads as a complete landing page with full context (FR13)

10. **And** the page is SSG/ISR for performance (NFR25)

11. **And** all images use next/image with sizes and WebP (UX-DR27)

---

## Task 0: Configure `images.remotePatterns` in `next.config.ts` (PREREQUISITE — gates gallery)

**CRITICAL:** This must be done BEFORE implementing the gallery. Story 3.2 left `unoptimized` as a workaround (see deferred-work.md). Without `remotePatterns`, `next/image` will throw an error for any external image URL. The gallery hero with LQIP/priority cannot function without this fix.

- [x] **File:** `next.config.ts` (MODIFY — exists)
- [x] **Current state:** No `images` key exists in `nextConfig`. Story 3.2 used `unoptimized` prop on `<Image>` components as a workaround.
- [x] **Action:** Add `images.remotePatterns` to `nextConfig`. Property image sources come from two places:
  - The Azure CDN used by the RE/MAX CCA API (original photo source)
  - The local Docker volume (`/property-images/...`) served at `/property-images/` by Next.js from `public/` or by direct serving — note that **locally-served optimized images** at `/property-images/...` are relative paths and do NOT need `remotePatterns` (they're same-origin static files)
  - If the API photos use Azure CDN, the CDN hostname must be added. Check `src/lib/sync/image-optimizer.ts` to confirm the source URLs used.
- [x] **Minimum viable config** (adjust hostnames based on actual CDN discovery):
  ```typescript
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.azurefd.net",  // Azure Front Door CDN — RE/MAX CCA API photos
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",  // Azure Blob Storage fallback
      },
    ],
  },
  ```
- [x] **IMPORTANT:** Check `src/lib/sync/image-optimizer.ts` — specifically the `downloadImage` function — to identify the actual source URL pattern. Adjust `remotePatterns` to match exactly.
- [x] **IMPORTANT:** If property images are stored locally as WebP files at relative paths (e.g., `/property-images/...`), no `remotePatterns` entry is needed for those — only for external CDN URLs.
- [x] **Remove** any `unoptimized` props from components that will use `next/image` properly with this fix (the gallery hero images are the primary target).
- [x] **Test:** `npm run build` must pass after adding `remotePatterns`.

---

## Tasks / Subtasks

### Task 1: Update `src/app/[locale]/property/[slug]/page.tsx` for full listing detail (AC: #7, #8, #9, #10)

- [x] **File:** `src/app/[locale]/property/[slug]/page.tsx` (MODIFY — exists; currently has `notFound()` placeholder for visible properties at line 93)
- [x] **CRITICAL:** The file currently has `export const dynamic = "force-dynamic"` which defeats ISR/SSG. **Remove this** and replace with ISR revalidation:
  ```typescript
  export const revalidate = 86400; // 24 hours — daily sync revalidation (NFR25, 4.1-UNIT-002)
  ```
- [x] **CRITICAL:** Also add `generateStaticParams` for SSG build-time generation:
  ```typescript
  export async function generateStaticParams() {
    const slugs = await getAllPropertySlugs(); // NEW query — see Task 3
    return slugs.map((slug) => ({ slug }));
  }
  ```
- [x] **Update `generateMetadata`:** The current implementation only handles soft-deleted properties. Add full metadata for visible listings:
  ```typescript
  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string; slug: string }>;
  }): Promise<Metadata> {
    const { slug, locale } = await params;
    const property = await getPropertyBySlug(slug);
    if (!property) return {};
    if (!property.isVisible) return { robots: { index: false, follow: false } };
    const title = locale === "es" ? property.titleEs : property.titleEn;
    const description = locale === "es" ? property.descriptionEs : property.descriptionEn;
    return {
      title: `${title} | RE/MAX Altitud`,
      description: description.slice(0, 160),
      openGraph: {
        title,
        description: description.slice(0, 160),
        images: (property.images as OptimizedImage[])[0]
          ? [{ url: (property.images as OptimizedImage[])[0].src }]
          : [],
      },
    };
  }
  ```
- [x] **Replace the `notFound()` placeholder** (line 93: `// TODO Story 4.1: Full listing detail page`) with the full `ListingDetailLayout` component (Task 4).
- [x] Import `OptimizedImage` from `@/types/images`
- [x] Import `Agent` from `@/lib/db/schema/agents`
- [x] Fetch associated agent for the property (if `property.agentId` is set): `const agent = property.agentId ? await getAgentById(property.agentId) : null;` — see Task 3 for new query
- [x] Pass `property`, `agent`, and `locale` to `<ListingDetailLayout>`

### Task 2: Create `src/components/listing/property-gallery.tsx` — Hero gallery with lightbox (AC: #1, #2, #3, #4, #5)

- [x] Create directory `src/components/listing/` if it does not exist
- [x] Create the file at EXACTLY `src/components/listing/property-gallery.tsx`
- [x] Add `'use client'` as first line — **PropertyGallery is a Client Component** (gesture/keyboard interaction, lightbox state, fullscreen toggle). This is specified in the architecture's Client/Server split table.
- [x] **CRITICAL — Lazy-Loading (R-002):** `PropertyGallery` must be lazy-loaded via `next/dynamic` from `src/app/[locale]/property/[slug]/page.tsx` or from `ListingDetailLayout`. Do NOT import it statically:
  ```typescript
  // In the parent (page.tsx or listing-detail-layout.tsx):
  const PropertyGallery = dynamic(
    () => import("@/components/listing/property-gallery"),
    { ssr: false }
  );
  ```
  This keeps the ~25KB gallery chunk OUT of the initial SSG page bundle (Architecture performance budget, R-002, 4.1-UNIT-001).
- [x] **Props interface:**
  ```typescript
  interface PropertyGalleryProps {
    images: OptimizedImage[];
    youtubeUrl?: string | null;
    propertyTitle: string; // for ARIA labels
  }
  ```
- [x] **Hero image (first image):** Full-width, 60vh height, using `next/image` with:
  - `priority` prop on the FIRST image only (LCP optimization, R-005, 4.1-E2E-002)
  - `sizes="100vw"` for hero
  - `blurDataURL={image.blurDataUrl}` + `placeholder="blur"` for LQIP (4.1-COMP-002, R-005)
  - `data-testid="gallery-hero"` on the hero container div
- [x] **Thumbnail strip** below the hero: horizontal row of thumbnail images:
  - `data-testid="gallery-thumbnail-strip"` on the strip container
  - Clicking a thumbnail changes the active hero image (local `useState` for `activeIndex`)
  - Active thumbnail gets a visible border/ring styling
  - Lazy-load thumbnails (no `priority` prop, standard lazy)
- [x] **Photo count overlay:** absolute-positioned overlay on the hero showing "1 / {total}":
  - `data-testid="gallery-photo-count"` on this overlay
  - Updates as active image changes
- [x] **Fullscreen button:** button that opens the lightbox:
  - `aria-label={t("openLightbox")}`
  - On click: sets `lightboxOpen = true`, shows `data-testid="gallery-lightbox"` overlay
- [x] **Lightbox implementation:**
  - `data-testid="gallery-lightbox"` on the lightbox overlay (full-screen Dialog or div)
  - Use Radix UI `<Dialog>` from `@radix-ui/react-dialog` — confirmed available at `node_modules/@radix-ui/react-dialog`. Import: `import * as Dialog from '@radix-ui/react-dialog'`. Use `<Dialog.Root>`, `<Dialog.Portal>`, `<Dialog.Overlay>`, `<Dialog.Content>` for accessibility (focus trap, Escape close).
  - Show current image full-screen with navigation arrows
  - Photo count overlay inside lightbox
  - **Arrow key navigation (desktop, R-008):** `useEffect` with `keydown` listener → ArrowRight/ArrowLeft advance/retreat index:
    ```typescript
    useEffect(() => {
      if (!lightboxOpen) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') setLightboxIndex(i => Math.min(i + 1, images.length - 1));
        if (e.key === 'ArrowLeft') setLightboxIndex(i => Math.max(i - 1, 0));
        if (e.key === 'Escape') setLightboxOpen(false);
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxOpen, images.length]);
    ```
  - **Touch/swipe navigation (mobile, R-008):** Use `@use-gesture/react` (`useSwipeable` pattern with `useDrag` — already installed from Story 3.6). Do NOT install a new swipe library.
  - **Focus trap:** Radix Dialog handles this natively.
  - Close button with `aria-label={t("closeLightbox")}`
- [x] **YouTube video embed (AC: #5):** If `youtubeUrl` is provided:
  - Extract the video ID from the URL (regex: `/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/`)
  - Render `<iframe>` with `src="https://www.youtube.com/embed/{videoId}"` after the thumbnail strip
  - Required attributes: `title={t("videoTitle")}`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`, `allowFullScreen`
  - Wrap in a `aspect-video` div (Tailwind class)
  - `data-testid="gallery-video-embed"` on the iframe wrapper
- [x] **i18n:** Use `useTranslations('PropertyGallery')` — add new namespace (see Task 8)
- [x] **DO NOT use** a third-party lightbox library (e.g., `react-image-lightbox`, `yet-another-react-lightbox`). Use Radix Dialog + manual arrow/swipe navigation as described.

### Task 3: Add `getAllPropertySlugs` and `getAgentById` queries (AC: #10, ISR prereq)

- [x] **File:** `src/lib/db/queries/properties.ts` (MODIFY — exists)
- [x] Add `getAllPropertySlugs` for SSG `generateStaticParams`:
  ```typescript
  export async function getAllPropertySlugs(): Promise<string[]> {
    const rows = await db
      .select({ slug: properties.slug })
      .from(properties)
      .where(eq(properties.isVisible, true));
    return rows.map(r => r.slug);
  }
  ```
- [x] **File:** `src/lib/db/queries/agents.ts` (MODIFY — exists)
- [x] Add `getAgentById`:
  ```typescript
  export async function getAgentById(id: string) {
    const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    return rows[0] ?? null;
  }
  ```
  Note: `import "server-only"` is already at the top of agents.ts (per established pattern). Import `eq` from `drizzle-orm` — **agents.ts currently only imports `sql` from drizzle-orm; you must add `eq` to that import**.

### Task 4: Create `src/components/listing/listing-detail-layout.tsx` — Full page layout (AC: #1, #6, #7, #8, #9)

- [x] Create the file at EXACTLY `src/components/listing/listing-detail-layout.tsx`
- [x] This is a **Server Component** — no `'use client'` directive. Layout, description, specs display are all static data.
- [x] **IMPORTANT:** `PropertyGallery` is a Client Component imported via `next/dynamic` — see Task 2. This is how a Server Component renders a lazy-loaded Client Component.
- [x] **Props interface:**
  ```typescript
  interface ListingDetailLayoutProps {
    property: Property; // from @/lib/db/schema/properties (Drizzle inferred type)
    agent: Agent | null; // from @/lib/db/schema/agents
    locale: string;
  }
  ```
- [x] **Page composition** (from UX spec §3 listing detail):
  ```
  <article>
    1. PropertyGallery (lazy-loaded client component)
    2. StickySpecsBar (sticky below gallery on scroll)
    3. <section> Description (title + bilingual description)
    4. <section> Features/Amenities list
    5. <!-- Agent Card: Story 4.2 adds this; leave TODO comment -->
    6. <!-- Location Map: post-4.1 (Mapbox is Epic 3 only); leave TODO comment -->
    7. <!-- Similar Properties: Story 4.5 adds this; leave TODO comment -->
  </article>
  ```
- [x] **Title:** Use `locale === 'es' ? property.titleEs : property.titleEn`
- [x] **Description:** Use `locale === 'es' ? property.descriptionEs : property.descriptionEn`
- [x] **ZMT badge:** Reuse the `ZMT_VISUAL` pattern from `property-card.tsx` — import `getRegionFromAreaSlug` from there. The ZMT display in listing detail should be more prominent than in cards.
- [x] **i18n:** Use `getTranslations('ListingDetail')` (server component — use the async `getTranslations` not `useTranslations`). Add new namespace (see Task 8).
- [x] **Unit system:** The listing detail page respects `unitSystem` for area display. Since this is a Server Component, it cannot use `useLocaleUnits` directly. Options:
  - Default to `'metric'` for SSG (consistent pre-render)
  - The unit toggle in the sticky bar is a Client Component that hydrates and switches units client-side
  - Import `convertArea` from `@/lib/utils/units` and pass `'metric'` as default
- [x] **`data-testid` values (from Epic 4 test design contract — DO NOT rename these):**
  - `data-testid="sticky-specs-bar"` on the sticky specs bar container

### Task 5: Create `src/components/listing/sticky-specs-bar.tsx` — Sticky price/specs on scroll (AC: #6)

- [x] Create the file at EXACTLY `src/components/listing/sticky-specs-bar.tsx`
- [x] Add `'use client'` — this component uses `useLocaleUnits` for unit toggle state
- [x] **Props interface:**
  ```typescript
  interface StickySpecsBarProps {
    priceUsd: number;
    bedrooms: number | null;
    bathrooms: number | null;
    lotSizeM2: number | null;
    constructionM2: number | null;
    zmtStatus: string;
    locale: string;
  }
  ```
- [x] **Sticky behavior:** Use `position: sticky; top: 0` (CSS, via Tailwind `sticky top-0`). This requires the parent to have a defined height flow — it will "stick" below the gallery as user scrolls.
- [x] **Content:** price (`formatUSD(priceUsd, locale)`), beds/baths (if available), lot + built area using `convertArea` from `useLocaleUnits`, ZMT badge
- [x] Import `useLocaleUnits` from `@/hooks/use-locale-units` for unit toggle
- [x] Import `formatUSD` from `@/lib/utils/currency`
- [x] Import `convertArea` from `@/lib/utils/units` (or use the one from `useLocaleUnits` return)
- [x] Import `UnitToggle` from `@/components/layout/unit-toggle` — render it inline in the bar so user can toggle m²/ft² while reading the listing
- [x] `data-testid="sticky-specs-bar"` on root element
- [x] **i18n:** Use `useTranslations('StickySpecsBar')` — add namespace in Task 8
- [x] **SSR safety:** `StickySpecsBar` uses `useLocaleUnits` which reads `localStorage`. Follow the established pattern: initialize with `defaultSystem`, reconcile in `useEffect` (code review patch from Story 3.7).

### Task 6: Update `getSimilarProperties` query to support full gallery cards (AC: dependency for future Task, no-op in 4.1 scope)

**Note:** `getSimilarProperties` in `properties.ts` was created for Story 2.7 and used in Story 3.8's "no longer available" page. Story 4.1 does NOT need to expand this — the full similar-properties carousel is Story 4.5 scope. Leave it as-is. **No changes needed in this task.** (Listed here to explicitly prevent scope creep.)

### Task 7: Add `getPropertyBySlug` full-data query enrichment (AC: #7)

- [x] **File:** `src/lib/db/queries/properties.ts` (MODIFY)
- [x] The existing `getPropertyBySlug` returns `properties.*` which includes all fields. **No schema change needed.**
- [x] **VERIFY** that `getPropertyBySlug` returns `agentId` (it does — `properties.agentId` is in the select). If it does, Task 1 can use `property.agentId` directly.
- [x] Add a new `getListingDetailProperty` query that does a JOIN to also return agent data (optional — only if the dev finds it cleaner than two separate queries):
  ```typescript
  // OPTIONAL: single query with agent join
  // If you prefer two queries (getPropertyBySlug + getAgentById), that is also acceptable.
  ```

### Task 8: Add i18n keys for new components (AC: #7, #8)

- [x] **File:** `src/messages/en.json` — add new namespaces:
  ```json
  "PropertyGallery": {
    "openLightbox": "View all photos",
    "closeLightbox": "Close photo viewer",
    "photoCount": "Photo {current} of {total}",
    "nextPhoto": "Next photo",
    "prevPhoto": "Previous photo",
    "videoTitle": "Property video tour"
  },
  "ListingDetail": {
    "description": "Description",
    "features": "Features & Amenities",
    "specs": {
      "price": "Asking Price",
      "bedrooms": "{count} bed",
      "bathrooms": "{count} bath",
      "lotSize": "Lot",
      "builtArea": "Built",
      "zmtStatus": "Ownership"
    },
    "zmtStatus": {
      "titled": "Titled Property",
      "concession": "Concession",
      "zmt_restricted": "ZMT Restricted"
    },
    "noAgentAssigned": "Contact RE/MAX Altitud",
    "agentSection": "Listing Agent"
  },
  "StickySpecsBar": {
    "price": "Asking Price",
    "beds": "{count} bed",
    "baths": "{count} bath",
    "lot": "Lot",
    "built": "Built",
    "toggleUnits": "Toggle area units"
  }
  ```
- [x] **File:** `src/messages/es.json` — add equivalent Spanish translations:
  ```json
  "PropertyGallery": {
    "openLightbox": "Ver todas las fotos",
    "closeLightbox": "Cerrar visor de fotos",
    "photoCount": "Foto {current} de {total}",
    "nextPhoto": "Foto siguiente",
    "prevPhoto": "Foto anterior",
    "videoTitle": "Video tour de la propiedad"
  },
  "ListingDetail": {
    "description": "Descripción",
    "features": "Características y Amenidades",
    "specs": {
      "price": "Precio",
      "bedrooms": "{count} hab.",
      "bathrooms": "{count} baños",
      "lotSize": "Terreno",
      "builtArea": "Construcción",
      "zmtStatus": "Tenencia"
    },
    "zmtStatus": {
      "titled": "Propiedad Titulada",
      "concession": "Concesión",
      "zmt_restricted": "Zona Marítimo Terrestre Restringida"
    },
    "noAgentAssigned": "Contactar RE/MAX Altitud",
    "agentSection": "Agente a cargo"
  },
  "StickySpecsBar": {
    "price": "Precio",
    "beds": "{count} hab.",
    "baths": "{count} baños",
    "lot": "Terreno",
    "built": "Construido",
    "toggleUnits": "Cambiar unidades de área"
  }
  ```
- [x] **IMPORTANT re: legal terms (AC: #8):** The glossary (`src/lib/constants/glossary.ts`) defines `"Titled Property" → "Propiedad Titulada"` and `"Concession" → "Concesión"`. The ZMT status i18n keys above already use these exact translations. **No additional glossary wiring is needed** — the translations ARE the glossary values. This satisfies FR33.
- [x] **DO NOT re-add** existing keys (`PropertyCard.*`, `PropertyUnavailable.*`, `UnitToggle.*`) — they already exist.

### Task 9: Unit tests for `PropertyGallery` (AC: #1, #2, #4)

- [x] **FIRST:** Update `vitest.config.mts` to add jsdom for the new listing tests directory. The current `environmentMatchGlobs` only covers `tests/unit/search/**/*.spec.tsx`. Add:
  ```typescript
  ["tests/unit/listing/**/*.spec.tsx", "jsdom"],
  ["tests/unit/listing/**/*.test.tsx", "jsdom"],
  ```
  **Without this, `PropertyGallery` and `StickySpecsBar` component tests will run in the wrong (node) environment and fail on DOM APIs.**
- [x] Create `tests/unit/listing/property-gallery.spec.tsx` (Vitest + jsdom — after adding the glob above)
- [x] **CRITICAL — vi.mock hoisting pattern** (learned in Epic 3): ALL `vi.mock()` calls MUST appear BEFORE the component import. Add the comment `// imported AFTER mocks` after mock declarations.
- [x] **Required mocks:**
  ```typescript
  vi.mock('next/dynamic', () => ({
    default: (fn: () => Promise<{ default: React.ComponentType }>) => {
      // For testing, we need the actual gallery component without dynamic import
      // Use a simple passthrough that renders null (gallery is unit-tested directly)
      const Component = () => null;
      return Component;
    },
  }));

  vi.mock('next-intl', () => ({
    useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key
    ),
  }));

  vi.mock('@use-gesture/react', () => ({
    useDrag: vi.fn(() => () => ({})),
  }));

  vi.mock('next/image', () => ({
    default: ({ src, alt, 'data-testid': testId, ...props }: {
      src: string; alt: string; 'data-testid'?: string; [key: string]: unknown
    }) => <img src={src} alt={alt} data-testid={testId} {...props} />,
  }));

  vi.mock('@radix-ui/react-dialog', () => ({
    Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
      open ? <div data-testid="gallery-lightbox">{children}</div> : null,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: () => null,
    Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Close: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
    Trigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  }));
  ```
  // imported AFTER mocks
  ```typescript
  import { render, screen, fireEvent } from '@testing-library/react';
  import { PropertyGallery } from '@/components/listing/property-gallery';
  ```
- [x] **Test fixture:**
  ```typescript
  const mockImages: OptimizedImage[] = [
    {
      src: '/property-images/img1-400w.webp',
      srcset: '/property-images/img1-400w.webp 400w',
      blurDataUrl: 'data:image/webp;base64,abc123',
      width: 400,
      height: 267,
      alt: 'Photo 1 of 3 — House in Pérez Zeledón',
    },
    {
      src: '/property-images/img2-400w.webp',
      srcset: '/property-images/img2-400w.webp 400w',
      blurDataUrl: 'data:image/webp;base64,def456',
      width: 400,
      height: 267,
      alt: 'Photo 2 of 3 — House in Pérez Zeledón',
    },
    {
      src: '/property-images/img3-400w.webp',
      srcset: '/property-images/img3-400w.webp 400w',
      blurDataUrl: 'data:image/webp;base64,ghi789',
      width: 400,
      height: 267,
      alt: 'Photo 3 of 3 — House in Pérez Zeledón',
    },
  ];
  ```
- [x] **Tests to write:**
  - `[P0]` renders `data-testid="gallery-hero"` element
  - `[P0]` renders `data-testid="gallery-thumbnail-strip"` element
  - `[P0]` renders `data-testid="gallery-photo-count"` with "1 / 3" (or equivalent photoCount key)
  - `[P0]` renders first image with `priority` prop (check rendered `<img>` attributes or component props)
  - `[P2]` renders blur placeholder class before image resolves (test that `blurDataUrl` is passed via `placeholder="blur"` to `next/image`)
  - `[P2]` clicking a thumbnail changes the active index (click thumbnail 2, assert photo count shows "2 / 3")
  - `[P0]` lightbox is NOT visible initially (`data-testid="gallery-lightbox"` not in DOM or has hidden state)
  - `[P1]` clicking fullscreen button opens lightbox (`data-testid="gallery-lightbox"` visible after click)
  - `[P1]` pressing ArrowRight in lightbox advances image index
  - `[P1]` pressing ArrowLeft in lightbox retreats image index
  - `[P1]` YouTube embed renders `data-testid="gallery-video-embed"` when `youtubeUrl` is provided
  - `[P1]` no video embed when `youtubeUrl` is null
  - `[P2]` renders active thumbnail indicator (border/ring) on current image

### Task 10: Unit tests for `StickySpecsBar` (AC: #6)

- [x] Create `tests/unit/listing/sticky-specs-bar.spec.tsx` (jsdom applies after the vitest.config.mts update in Task 9)
- [x] **Required mocks (hoisted before imports):**
  ```typescript
  vi.mock('next-intl', () => ({
    useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key
    ),
  }));

  vi.mock('@/hooks/use-locale-units', () => ({
    useLocaleUnits: vi.fn(() => ({
      unitSystem: 'metric' as const,
      toggleUnits: vi.fn(),
      convertArea: vi.fn((m2: number) => `${m2} m²`),
    })),
  }));

  vi.mock('@/lib/utils/currency', () => ({
    formatUSD: vi.fn((price: number) => `$${price.toLocaleString()}`),
    formatEUR: vi.fn((price: number) => `€${Math.round(price * 0.92).toLocaleString()}`),
    isNonUSLocale: vi.fn(() => false),
  }));

  vi.mock('@/components/layout/unit-toggle', () => ({
    UnitToggle: () => <div data-testid="unit-toggle" />,
  }));
  ```
- [x] **Tests to write:**
  - `[P0]` renders `data-testid="sticky-specs-bar"` element
  - `[P0]` displays price (USD formatted)
  - `[P0]` displays bedroom count when provided
  - `[P0]` displays bathroom count when provided
  - `[P0]` renders ZMT status text
  - `[P1]` renders lot size using convertArea when lotSizeM2 is provided
  - `[P1]` renders built area using convertArea when constructionM2 is provided
  - `[P1]` renders UnitToggle component
  - `[P2]` does not render bedroom/bathroom when null

### Task 11: Unit tests for listing detail page query (AC: #10 ISR revalidation — 4.1-UNIT-002)

- [x] Create `tests/unit/listing/listing-detail-page.spec.ts` (`.ts`, not `.tsx` — tests the revalidation constant, no JSX)
- [x] **Tests to write:**
  - `[P2]` `revalidate` export equals `86400` (4.1-UNIT-002): import the page module and assert `revalidate === 86400`
  - `[P2]` `getAllPropertySlugs` returns an array of strings (mock the db)

### Task 12: CI verification (AC: all)

- [x] `npm run typecheck` → 0 new errors
- [x] `npm run lint` → 0 errors
- [x] `npm run format:check` → pass
- [x] `npm run build` → pass (SSG generation with `getAllPropertySlugs` runs at build time — if DB is not available, use empty array fallback or `try/catch`)
- [x] `npm test` → all existing tests pass (583+ baseline) + new listing tests pass

---

## Dev Notes

### Architecture Context

**Rendering strategy:** `src/app/[locale]/property/[slug]/page.tsx` must be SSG + ISR (not `force-dynamic`). The current `export const dynamic = "force-dynamic"` was a temporary placeholder. Replace with `export const revalidate = 86400`. The `revalidateTag('properties')` call in the sync pipeline (Step 8) will trigger on-demand revalidation after each daily sync.

**File structure (architecture §3):**
```
src/
  app/[locale]/property/[slug]/page.tsx   ← listing detail page (MODIFY)
  components/
    listing/                               ← NEW directory for this story
      property-gallery.tsx                 ← NEW (Client Component, lazy-loaded)
      listing-detail-layout.tsx            ← NEW (Server Component)
      sticky-specs-bar.tsx                 ← NEW (Client Component)
  lib/db/queries/
    properties.ts                          ← MODIFY (add getAllPropertySlugs)
    agents.ts                              ← MODIFY (add getAgentById)
  messages/
    en.json                                ← MODIFY (add 3 new namespaces)
    es.json                                ← MODIFY (add 3 new namespaces)
  next.config.ts                           ← MODIFY (add images.remotePatterns)
```

**Server/Client boundary:**
- `ListingDetailLayout` = Server Component (reads `locale` param, calls async `getTranslations`, renders RSC subtree)
- `PropertyGallery` = Client Component (`'use client'`) — lazy-loaded via `next/dynamic({ ssr: false })`
- `StickySpecsBar` = Client Component (`'use client'`) — uses `useLocaleUnits` hook
- `page.tsx` = Server Component (async data fetching)

**DO NOT** make `ListingDetailLayout` a client component. The pattern is: Server Component page → lazy-loaded Client Component gallery (via `next/dynamic`). This is identical to how `MapView` is lazy-loaded in the search page.

### Critical Patterns from Previous Stories

**useLocaleUnits / localStorage SSR pattern (learned Story 3.7):** `StickySpecsBar` uses `useLocaleUnits`. The hook must NOT synchronously read localStorage in the `useState` initializer — it must initialize with `defaultSystem` and reconcile in `useEffect`. This pattern is already correctly implemented in `src/hooks/use-locale-units.ts` (patched in Story 3.7 code review). DO NOT revert this pattern.

**vi.mock hoisting (learned Story 3.1, held all 8 Epic 3 stories):** All `vi.mock()` declarations MUST appear before `import` statements for the component under test. Add comment `// imported AFTER mocks` immediately after the last `vi.mock()` call.

**i18n wiring (Epic 3 repeated failure):** Every user-visible string MUST use `useTranslations` or `getTranslations`. Do NOT hardcode English strings in JSX — not in component output, not in aria-labels, not in alt text. The code review adversarial pipeline will catch this, but prevention is better.

**`data-testid` contract (DO NOT rename):** The following testids are part of the Epic 4 contract established in the test design. They MUST be present exactly as specified:
- `data-testid="gallery-hero"` — hero image container in `PropertyGallery`
- `data-testid="gallery-thumbnail-strip"` — thumbnail row in `PropertyGallery`
- `data-testid="gallery-lightbox"` — lightbox overlay in `PropertyGallery`
- `data-testid="gallery-photo-count"` — photo count overlay in `PropertyGallery`
- `data-testid="sticky-specs-bar"` — sticky specs bar container in `StickySpecsBar`

**useEffect with keyboard handlers (learned Story 3.8 — NearMeButton pattern):** The keyboard handler for lightbox navigation MUST return a cleanup function to remove the listener. Use the `useRef` pattern for callbacks passed to `useEffect` if the callback depends on state (to prevent identity-change re-fires). In this case, the handler directly calls `setLightboxIndex` which is stable — no `useRef` needed for the setter.

**`@use-gesture/react` already installed** (from Story 3.6 `@use-gesture/react@10.3.1`). Use `useDrag` for swipe detection in the lightbox. The `useDrag` return is a bind function: `const bind = useDrag(({ swipe: [swipeX] }) => { if (swipeX === 1) prev(); if (swipeX === -1) next(); })`. Spread `{...bind()}` on the lightbox image wrapper.

**`next/dynamic` pattern (established in Story 3.2 for Mapbox):**
```typescript
const PropertyGallery = dynamic(
  () => import('@/components/listing/property-gallery'),
  { ssr: false }
);
```
This is the same pattern used for `MapView`. The SSR disabled approach means the gallery renders null on the server and mounts on the client. This is correct behavior for an interactive gallery.

**OptimizedImage type** — stored in `properties.images` as JSONB. Cast when reading: `const images = property.images as unknown as OptimizedImage[]`. The `OptimizedImage` interface is at `src/types/images.ts` — already includes `blurDataUrl` (base64 LQIP), `srcset`, `width`, `height`, `alt`.

**Agent query** — `src/lib/db/schema/agents.ts` has `Agent` type. `src/lib/db/queries/agents.ts` needs `getAgentById`. Import `agents` table from schema, `eq` from `drizzle-orm`. File already has `import "server-only"` at the top — preserve it.

**Build-time SSG failsafe:** `getAllPropertySlugs()` is called at build time in `generateStaticParams`. If the database is unavailable during build (e.g., local dev without DB), it will throw. Wrap in try/catch:
```typescript
export async function generateStaticParams() {
  try {
    const slugs = await getAllPropertySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return []; // Build continues; pages generated on-demand via ISR
  }
}
```

### Deferred Work Context

From `deferred-work.md` (Story 3.2): `next.config.ts` lacks `images.remotePatterns` for property image hosts — popup uses `unoptimized` as a forward-compatible workaround. **This is addressed by Task 0 in this story.**

Property image URLs: The sync pipeline (`src/lib/sync/image-optimizer.ts`) downloads from the Azure CDN source and stores optimized WebP files locally at `public/property-images/...`. The stored `OptimizedImage.src` values are relative paths (`/property-images/...`), NOT Azure CDN URLs. This means `next/image` serving these relative paths does NOT need `remotePatterns` — they are served from the same origin. However, if original (non-optimized) photos are still referenced anywhere via Azure CDN URLs, those do need `remotePatterns`.

**Action for Task 0:** Check `src/lib/sync/image-optimizer.ts` carefully to confirm whether final `OptimizedImage.src` values are:
- Local relative paths → no `remotePatterns` needed for gallery
- Azure CDN URLs → add Azure CDN hostname to `remotePatterns`

If local, Task 0 may be a no-op for the gallery itself, but still add `remotePatterns` for the Azure CDN to avoid issues if any component (e.g., map popups from Story 3.2) still references CDN URLs directly.

### Performance Notes

- **LCP target:** First gallery image must have `priority={true}` to trigger pre-load. This is the page's LCP element on mobile. Without `priority`, Next.js lazy-loads it and LCP exceeds 2.5s on 4G (R-005).
- **Bundle size:** `PropertyGallery` must not appear in the initial JS chunk. Verify with `npm run build` output that `property-gallery` appears as a separate chunk.
- **CLS prevention:** Hero gallery needs a fixed height (`h-[60vh]`) and `aspect-ratio` on the container so the page doesn't shift when the image loads. Use `fill` mode or fixed dimensions.

### Test Infrastructure Notes

- Test directory: `tests/unit/listing/` (NEW — create it)
- **CRITICAL:** `vitest.config.mts` `environmentMatchGlobs` currently only covers `tests/unit/search/**/*.spec.tsx`. Must add `["tests/unit/listing/**/*.spec.tsx", "jsdom"]` and `["tests/unit/listing/**/*.test.tsx", "jsdom"]` to the array before component tests will work in jsdom environment.
- Current `environmentMatchGlobs` array is at lines 20-23 in `vitest.config.mts` — add the listing globs alongside the search globs.
- Component mock for `PropertyGallery` in other tests: `vi.mock('@/components/listing/property-gallery', () => ({ PropertyGallery: () => <div data-testid="gallery-hero" /> }))`
- E2E tests (4.1-E2E-001 through 4.1-E2E-010): scaffold as `test.skip` — Playwright framework not yet configured; same pattern as Epic 3 E2E scaffolds in `tests/e2e/`

---

## Story Context

**Epic 4 objective:** Convert property discovery (Epic 3) into leads. Story 4.1 builds the listing detail page that visitors arrive at after clicking a property card. Stories 4.2 (Agent Card) and 4.5 (Similar Properties) add to this page in later iterations. Story 4.1 focuses on gallery + specs + description + ISR routing.

**Dependencies on Epic 3:**
- `PropertyCard` component (`src/components/property/property-card.tsx`) — reused in similar properties (Story 4.5, not in this story's scope)
- `useLocaleUnits` hook (`src/hooks/use-locale-units.ts`) — reused in `StickySpecsBar`
- `convertArea`, `formatUSD`, `formatEUR` from `@/lib/utils/units` and `@/lib/utils/currency` — reused directly
- `UnitToggle` component (`src/components/layout/unit-toggle.tsx`) — reused in `StickySpecsBar`
- `@use-gesture/react@10.3.1` — already installed; used for lightbox swipe

**Dependencies on Epic 2:**
- `OptimizedImage` type and LQIP `blurDataUrl` from the image optimization pipeline (Story 2.4)
- `titleEn`, `titleEs`, `descriptionEn`, `descriptionEs` bilingual content from the translation pipeline (Story 2.5)
- `agentId` FK on properties table (Story 2.1 schema)
- `getPropertyBySlug`, `getSimilarProperties` already exist in `src/lib/db/queries/properties.ts`

**What Story 4.2 adds (NOT in this story):**
- `AgentCard` component with WhatsApp + Email CTAs
- `StickyMobileCTA` floating bottom bar (IntersectionObserver)
- Leave TODO comments in `ListingDetailLayout` where agent card will go

**What Story 4.5 adds (NOT in this story):**
- `SimilarProperties` carousel
- `Breadcrumbs` component
- Leave TODO comments in `ListingDetailLayout` where these will go

---

## Dev Notes

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-4-1-listing-detail-page-and-photo-gallery.md`
- E2E tests: `tests/e2e/listing-detail-page-and-photo-gallery.spec.ts`
- Unit tests (PropertyGallery): `tests/unit/listing/property-gallery.spec.tsx`
- Unit tests (StickySpecsBar): `tests/unit/listing/sticky-specs-bar.spec.tsx`
- Unit tests (Page/Queries): `tests/unit/listing/listing-detail-page.spec.ts`

---

## Dev Agent Record

### Implementation Plan

Implemented Story 4.1 in the following order:
1. Task 0: Added `images.remotePatterns` to `next.config.ts` for Azure CDN
2. Task 3: Added `getAllPropertySlugs` to `properties.ts` and `getAgentById` to `agents.ts`
3. Task 8: Added `PropertyGallery`, `ListingDetail`, and `StickySpecsBar` i18n namespaces
4. Task 2: Implemented `PropertyGallery` client component with hero, thumbnails, lightbox, swipe/keyboard nav, and YouTube embed
5. Task 5: Implemented `StickySpecsBar` client component with sticky positioning, unit toggle
6. Task 4: Implemented `ListingDetailLayout` server component; created `PropertyGalleryLoader` to handle `next/dynamic ssr:false` from Client Component context (Turbopack constraint)
7. Task 1: Updated `page.tsx` with ISR (revalidate=86400), generateStaticParams, full generateMetadata, and ListingDetailLayout
8. Tasks 9-12: Activated ATDD tests (removed stubs and it.skip), fixed mock paths (db/client vs db), added navigation mocks

**Key technical decision:** Turbopack (used in `next build --turbopack`) does not allow `next/dynamic` with `ssr: false` in Server Components. Created `PropertyGalleryLoader` as a thin Client Component wrapper (pattern mirrors `MapViewLoader` from Story 3.2).

### Completion Notes

- All 11 Acceptance Criteria satisfied
- 614 unit tests pass, 3 E2E scaffolds remain skipped (Playwright not installed — by design)
- Build passes with property page correctly generated as SSG (●) with generateStaticParams
- typecheck: 0 errors; lint: 0 errors (4 warnings, all pre-existing or in test files); format: clean
- `data-testid` contract honored: gallery-hero, gallery-thumbnail-strip, gallery-lightbox, gallery-photo-count, sticky-specs-bar

### File List

- `next.config.ts` — MODIFIED: Added images.remotePatterns for Azure CDN
- `src/app/[locale]/property/[slug]/page.tsx` — MODIFIED: ISR, generateStaticParams, generateMetadata, ListingDetailLayout
- `src/components/listing/property-gallery.tsx` — MODIFIED (stub→impl): Full gallery with hero, thumbnails, lightbox, swipe, keyboard, YouTube
- `src/components/listing/property-gallery-loader.tsx` — CREATED: Client Component wrapper for lazy-loading PropertyGallery
- `src/components/listing/listing-detail-layout.tsx` — MODIFIED (stub→impl): Server Component page composition
- `src/components/listing/sticky-specs-bar.tsx` — MODIFIED (stub→impl): Client Component with sticky, price, area, ZMT, unit toggle
- `src/lib/db/queries/properties.ts` — MODIFIED: Added getAllPropertySlugs
- `src/lib/db/queries/agents.ts` — MODIFIED: Added getAgentById, added eq import
- `src/messages/en.json` — MODIFIED: Added PropertyGallery, ListingDetail, StickySpecsBar namespaces
- `src/messages/es.json` — MODIFIED: Added PropertyGallery, ListingDetail, StickySpecsBar namespaces (Spanish)
- `tests/unit/listing/property-gallery.spec.tsx` — MODIFIED: Removed red-phase stub, activated tests
- `tests/unit/listing/sticky-specs-bar.spec.tsx` — MODIFIED: Removed red-phase stub, activated tests
- `tests/unit/listing/listing-detail-page.spec.ts` — MODIFIED: Fixed db mock path, added navigation mocks, activated tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Status updated to review

### Change Log

- 2026-05-02: Story 4.1 implementation complete — listing detail page with hero gallery, lightbox, sticky specs bar, ISR/SSG routing, i18n (Date: 2026-05-02)

---

## Review Findings

_To be filled in during code review step._
