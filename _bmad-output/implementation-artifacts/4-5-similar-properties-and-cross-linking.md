# Story 4.5: Similar Properties & Cross-Linking

**Status:** ready-for-dev
**GH Issue:** #97
**Epic:** 4 — Listing Detail & Agent Profiles
**Story Key:** 4-5-similar-properties-and-cross-linking
**Created:** 2026-05-03

---

## Story

As a **visitor**,
I want to see similar properties when viewing a listing,
So that I can compare options and discover alternatives without going back to search.

---

## Acceptance Criteria

1. **Given** a listing detail page **When** scrolling below the agent card **Then** a "Similar Properties" section appears with a horizontal carousel of PropertyCards (UX-DR31)

2. **Given** similar properties **When** generated **Then** they are selected based on: same area + similar price range (±20%) + similar type (prioritized in that order) (R-011)

3. **Given** a listing in a specific area **When** the detail page renders **Then** area context is shown: area name with link to area guide, nearby listings count

4. **Given** any page with navigation hierarchy **When** rendered **Then** breadcrumbs show the path (e.g., Home > Search > [Title]) using the `Breadcrumbs` namespace already present from Story 4.4 (AR14)

5. **Given** mobile viewport **When** similar properties render **Then** they display as a horizontal swipe carousel (overflow-x-auto, CSS snap) (UX-DR31)

6. **And** similar properties carousel uses the same `PropertyCard` component from Epic 3 with `variant="compact"` (no layout regressions)

7. **Given** fewer than 3 similar properties found **When** the carousel renders **Then** it gracefully shows available cards (1–2) or a "Browse all properties" CTA if none found

8. **Given** the listing detail page **When** rendered **Then** the `SimilarProperties` section does NOT block LCP — it must be lazy-loaded (use React Suspense with a skeleton fallback)

---

## Tasks / Subtasks

### Task 1: Enhance `getSimilarProperties` in `src/lib/db/queries/properties.ts` — Improve similarity ranking (AC: #2)

- [ ] **File:** `src/lib/db/queries/properties.ts` — MODIFY (exists; `getSimilarProperties` is already defined at line ~318)
- [ ] **CRITICAL:** The existing `getSimilarProperties(areaSlug, excludeSlug, limit)` only filters by area and is used by the unavailable-property page. This story adds a NEW, richer overload for use on the listing detail page. Do NOT break the existing signature — the `PropertyUnavailable` page on `page.tsx` calls it with the 3-arg form.
- [ ] **Add a new function** `getSimilarPropertiesRanked` with the following signature:
  ```typescript
  /**
   * Returns similar properties ranked by: same area (priority 1) →
   * similar price range ±20% (priority 2) → same property type (priority 3).
   * Excludes the current property. Returns up to `limit` results.
   * Used by SimilarProperties carousel on the listing detail page (Story 4.5).
   */
  export async function getSimilarPropertiesRanked(opts: {
    excludeSlug: string;
    areaSlug: string | null;
    priceUsd: number;
    propertyType: string;
    limit?: number;
  }): Promise<PropertySearchItem[]>
  ```
- [ ] **Similarity ranking pseudocode (implement exactly):**
  ```
  STEP 1 — Same area, same type, similar price (±20%):
    WHERE isVisible = true
      AND slug != excludeSlug
      AND areaSlug = opts.areaSlug          (skip if areaSlug is null)
      AND propertyType = opts.propertyType
      AND priceUsd BETWEEN opts.priceUsd*0.8 AND opts.priceUsd*1.2
    ORDER BY ABS(priceUsd - opts.priceUsd) ASC
    LIMIT limit

  STEP 2 — If count < limit: same area, similar price (type relaxed):
    WHERE isVisible = true
      AND slug != excludeSlug
      AND slug NOT IN (step1 slugs)
      AND areaSlug = opts.areaSlug
      AND priceUsd BETWEEN opts.priceUsd*0.8 AND opts.priceUsd*1.2
    ORDER BY ABS(priceUsd - opts.priceUsd) ASC
    LIMIT (limit - step1.length)

  STEP 3 — If count < limit: any visible in same area (price relaxed):
    WHERE isVisible = true
      AND slug != excludeSlug
      AND slug NOT IN (step1+step2 slugs)
      AND areaSlug = opts.areaSlug
    ORDER BY syncedAt DESC
    LIMIT (limit - step1.length - step2.length)

  STEP 4 — If count < limit: any visible (fallback, area relaxed):
    WHERE isVisible = true
      AND slug != excludeSlug
      AND slug NOT IN (step1+step2+step3 slugs)
    ORDER BY syncedAt DESC
    LIMIT (limit - accumulated count)

  RETURN step1 + step2 + step3 + step4 (concatenated, deduplicated)
  ```
- [ ] **Return type:** `PropertySearchItem[]` — same shape as what `PropertyCard` consumes.
- [ ] **CRITICAL — PropertySearchItem shape check:** The `PropertySearchItem` type in `src/types/search.ts` has `images: { url: string; alt?: string }[]`. However, the DB stores images as `OptimizedImage[]` (`{ src: string; ... }`). You must map `src → url` when converting DB rows to `PropertySearchItem`. Look at how search queries handle this mapping (Epic 3, Story 3.1/3.5).
- [ ] **Drizzle tip for ABS ordering:** Drizzle ORM v0.30+ supports `sql\`ABS(${properties.priceUsd} - ${opts.priceUsd})\`` as an order expression via the `sql` template tag from `drizzle-orm`. Import: `import { sql } from "drizzle-orm"`.
- [ ] **No more than 4 DB queries total** (steps 1–4 above). Each step short-circuits if count is already at `limit` — use `if (results.length >= limit) return results`.
- [ ] **Default limit:** 4 cards (visible in carousel without scrolling on desktop 1280px).
- [ ] Export as named export `getSimilarPropertiesRanked`.

### Task 2: Create `src/components/listing/similar-properties.tsx` — Carousel section (AC: #1, #5, #6, #7)

- [ ] Create the file at EXACTLY `src/components/listing/similar-properties.tsx`
- [ ] **This is a Server Component** — NO `'use client'`. It receives pre-fetched data via props (data fetched in parent `ListingDetailLayout`). The carousel interactivity (horizontal scroll) is handled entirely via CSS — no JS needed.
- [ ] **Props interface:**
  ```typescript
  import type { PropertySearchItem } from "@/types/search";

  interface SimilarPropertiesProps {
    properties: PropertySearchItem[];
    locale: string;
    currentPropertySlug: string; // for deduplication safety
  }
  ```
- [ ] **Empty state (AC: #7):** If `properties.length === 0`, render a "Browse all properties" CTA:
  ```tsx
  if (properties.length === 0) {
    return (
      <section aria-labelledby="similar-heading" data-testid="similar-properties-empty">
        <h2 id="similar-heading" className="...">{t('heading')}</h2>
        <Link href={`/${locale}/search`} data-testid="similar-browse-cta" className="...">
          {t('browseCta')}
        </Link>
      </section>
    );
  }
  ```
- [ ] **Carousel layout — CSS snap (no JS carousel library) (AC: #5):**
  ```tsx
  <section
    aria-labelledby="similar-heading"
    data-testid="similar-properties-carousel"
  >
    <h2 id="similar-heading" className="mb-4 text-xl font-bold text-brand-navy md:text-2xl">
      {t('heading')}
    </h2>
    <div
      role="list"
      className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
      style={{ scrollbarWidth: 'none' }}
      aria-label={t('carouselAriaLabel')}
    >
      {properties.map((property) => (
        <div
          key={property.slug}
          role="listitem"
          className="snap-start shrink-0 w-72 md:w-80"
        >
          <PropertyCard property={property} locale={locale} variant="compact" />
        </div>
      ))}
    </div>
    {/* Keyboard navigation hint — screen-reader-only */}
    <p className="sr-only">{t('keyboardHint')}</p>
  </section>
  ```
- [ ] **Import `PropertyCard`** from `@/components/property/property-card` — static import (Server Component calling Client Component is fine per Next.js App Router pattern).
- [ ] **Import `Link`** from `@/i18n/navigation` — this is the intl-aware Link used throughout the project (confirmed in other components).
- [ ] **i18n:** Use `getTranslations({ locale, namespace: 'SimilarProperties' })` — this is a Server Component so use `getTranslations` (not `useTranslations`). Add namespace in Task 5.
- [ ] **`data-testid` contracts (CANNOT be renamed):**
  - `data-testid="similar-properties-carousel"` — the section container when properties are present
  - `data-testid="similar-properties-empty"` — the section container when no properties found
  - `data-testid="similar-browse-cta"` — the fallback CTA link
- [ ] **NO Radix UI Carousel** — the simple CSS-snap approach is sufficient and adds zero JS bundle weight. Radix Carousel would add ~8KB to the listing page bundle — skip it.
- [ ] **Performance (AC: #8):** This component is a Server Component with no lazy-loading needed internally. The Suspense boundary is added in the parent (Task 3). Do NOT add `'use client'` or dynamic imports here.

### Task 3: Create `src/components/listing/similar-properties-loader.tsx` — Suspense wrapper for LCP isolation (AC: #8)

- [ ] Create the file at EXACTLY `src/components/listing/similar-properties-loader.tsx`
- [ ] **This is a Server Component** — NO `'use client'`.
- [ ] **Purpose:** Wraps the data fetch + `SimilarProperties` render in a React `<Suspense>` boundary so LCP (the gallery hero) resolves before similar properties data is fetched. The carousel is below the fold — it must NOT block the critical rendering path.
- [ ] **Pattern (same as `PropertyGalleryLoader` pattern established in Story 4.1 — but for Server Components using Suspense async data fetching):**
  ```tsx
  import { Suspense } from "react";
  import { SimilarProperties } from "./similar-properties";
  import { SimilarPropertiesSkeleton } from "./similar-properties-skeleton";
  import { getSimilarPropertiesRanked } from "@/lib/db/queries/properties";
  import type { PropertySearchItem } from "@/types/search";

  interface SimilarPropertiesLoaderProps {
    currentSlug: string;
    areaSlug: string | null;
    priceUsd: number;
    propertyType: string;
    locale: string;
  }

  async function SimilarPropertiesData({
    currentSlug, areaSlug, priceUsd, propertyType, locale
  }: SimilarPropertiesLoaderProps) {
    const properties = await getSimilarPropertiesRanked({
      excludeSlug: currentSlug,
      areaSlug,
      priceUsd,
      propertyType,
      limit: 4,
    });
    return (
      <SimilarProperties
        properties={properties}
        locale={locale}
        currentPropertySlug={currentSlug}
      />
    );
  }

  export function SimilarPropertiesLoader(props: SimilarPropertiesLoaderProps) {
    return (
      <Suspense fallback={<SimilarPropertiesSkeleton />}>
        <SimilarPropertiesData {...props} />
      </Suspense>
    );
  }
  ```
- [ ] **Why this pattern:** In Next.js App Router, wrapping an async Server Component in `<Suspense>` defers its rendering until the async work resolves, without blocking parent page streaming. This keeps TTFB and LCP fast for the gallery + specs (above the fold) while the similar properties fetch happens in parallel.

### Task 4: Create `src/components/listing/similar-properties-skeleton.tsx` — Loading skeleton (AC: #8)

- [ ] Create the file at EXACTLY `src/components/listing/similar-properties-skeleton.tsx`
- [ ] **This is a Server Component** — NO `'use client'`.
- [ ] **Skeleton matches carousel layout:** 4 skeleton cards in a horizontal scroll container, matching the `w-72` / `w-80` card widths.
  ```tsx
  export function SimilarPropertiesSkeleton() {
    return (
      <section aria-label="Loading similar properties" data-testid="similar-properties-skeleton">
        <div className="mb-4 h-7 w-48 animate-pulse rounded bg-gray-200" /> {/* heading skeleton */}
        <div className="flex gap-4 overflow-x-hidden pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-72 md:w-80 rounded-xl overflow-hidden border border-border">
              <div className="h-44 animate-pulse bg-gray-200" /> {/* image */}
              <div className="p-4 space-y-2">
                <div className="h-4 animate-pulse bg-gray-200 rounded w-3/4" />
                <div className="h-4 animate-pulse bg-gray-200 rounded w-1/2" />
                <div className="h-4 animate-pulse bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  ```
- [ ] `data-testid="similar-properties-skeleton"` on the root element.
- [ ] **NO i18n needed** — skeleton has no visible text (aria-label is static English; acceptable for loading state).

### Task 5: Update `src/components/listing/listing-detail-layout.tsx` — Wire in `SimilarPropertiesLoader` + Breadcrumbs (AC: #1, #4)

- [ ] **File:** `src/components/listing/listing-detail-layout.tsx` — MODIFY (exists from Stories 4.1/4.2)
- [ ] **Import `SimilarPropertiesLoader`:**
  ```typescript
  import { SimilarPropertiesLoader } from "@/components/listing/similar-properties-loader";
  ```
- [ ] **Replace the TODO comment** at line 221:
  ```tsx
  {/* TODO Story 4.5: SimilarProperties carousel goes here */}
  {/* <SimilarProperties propertySlug={property.slug} areaSlug={property.areaSlug} locale={locale} /> */}
  ```
  With:
  ```tsx
  <SimilarPropertiesLoader
    currentSlug={property.slug}
    areaSlug={property.areaSlug}
    priceUsd={property.priceUsd}
    propertyType={property.propertyType}
    locale={locale}
  />
  ```
- [ ] **Add `Breadcrumbs` component** near the top of the article (above the gallery, below the article root, in a `<nav>` element). The `Breadcrumbs` component is a new component created in Task 6. Add import:
  ```typescript
  import { Breadcrumbs } from "@/components/layout/breadcrumbs";
  ```
  Add to JSX (before `PropertyGalleryLoader`):
  ```tsx
  <Breadcrumbs
    items={[
      { label: t('breadcrumbHome'), href: `/${locale}` },
      { label: t('breadcrumbSearch'), href: `/${locale}/search` },
      { label: title },
    ]}
    locale={locale}
  />
  ```
- [ ] **Add `breadcrumbHome` and `breadcrumbSearch` keys** to the `ListingDetail` i18n namespace (Task 8). The existing `Breadcrumbs` namespace (from Story 4.4, `src/messages/en.json` line 526–531) has `home`, `search`, `agents` — but `ListingDetailLayout` uses `getTranslations({ namespace: "ListingDetail" })`. Add shorthand keys to `ListingDetail` namespace OR pass translations from the `Breadcrumbs` namespace. **Preferred approach:** Pass the translated strings directly from `ListingDetailLayout` using the existing `Breadcrumbs` namespace:
  ```typescript
  const tBreadcrumbs = await getTranslations({ locale, namespace: "Breadcrumbs" });
  // ...
  <Breadcrumbs
    items={[
      { label: tBreadcrumbs('home'), href: `/${locale}` },
      { label: tBreadcrumbs('search'), href: `/${locale}/search` },
      { label: title },
    ]}
    locale={locale}
  />
  ```
  This avoids adding duplicate keys to `ListingDetail` namespace. `tBreadcrumbs` uses the existing `Breadcrumbs.home` and `Breadcrumbs.search` keys from Story 4.4 — do NOT add them again.
- [ ] **Note on `ListingDetailLayoutProps`:** No new props needed. `property.priceUsd`, `property.propertyType`, `property.areaSlug` are already on the `Property` type.

### Task 6: Create `src/components/layout/breadcrumbs.tsx` — Reusable breadcrumbs component (AC: #4)

- [ ] Create the file at EXACTLY `src/components/layout/breadcrumbs.tsx`
- [ ] **This is a Server Component** — NO `'use client'`. Breadcrumbs are static HTML — no interactivity needed.
- [ ] **Props interface:**
  ```typescript
  interface BreadcrumbItem {
    label: string;
    href?: string; // last item (current page) has no href
  }

  interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    locale: string; // reserved for future i18n use — not actively used in component body
  }
  ```
- [ ] **Layout (semantic nav + schema.org microdata as backup to JSON-LD):**
  ```tsx
  <nav
    aria-label="Breadcrumb"
    data-testid="breadcrumbs"
    className="px-4 py-2 md:px-0"
  >
    <ol className="flex flex-wrap items-center gap-1 text-sm text-text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span aria-hidden="true" className="text-text-muted/60">
                /
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-brand-navy transition-colors truncate max-w-[12rem]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "text-brand-navy font-medium truncate max-w-[20rem]" : ""}
              >
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
  ```
- [ ] **Import `Link`** from `@/i18n/navigation` (intl-aware Link, used throughout project).
- [ ] **`data-testid="breadcrumbs"`** on the root `<nav>` element — this is the contract from `test-design-epic-4.md` line 98. CANNOT be renamed.
- [ ] **No i18n inside component** — labels are passed as pre-translated strings from the parent. The component is a pure layout/display component.
- [ ] **Accessibility:** `aria-label="Breadcrumb"` on `<nav>`. `aria-current="page"` on last item. Separator is `aria-hidden="true"`.
- [ ] **Truncation:** Long property titles are truncated with `max-w-[20rem] truncate` to prevent breadcrumb overflow on mobile.

### Task 7: Update `src/lib/db/queries/properties.ts` — Export `getSimilarPropertiesRanked` (AC: #2)

*(This task is logically part of Task 1 — split here for clarity.)*

- [ ] Verify that `getSimilarPropertiesRanked` is exported as a named export.
- [ ] Verify that the existing `getSimilarProperties` function is NOT modified — it is still used by `page.tsx` for the unavailable-property use case.
- [ ] **Import additions needed at top of file:**
  - `sql` from `"drizzle-orm"` (for ABS ordering expression)
  - `gte`, `lte` from `"drizzle-orm"` (for price range filtering)
  - Ensure `not`, `inArray` are already imported (they are — line 2 of the file).
- [ ] **Return type mapping:** The DB query returns columns with `src` in images (from `OptimizedImage` stored in JSONB). `PropertySearchItem.images` expects `{ url: string; alt?: string }[]`. Map as:
  ```typescript
  // After query, map images:
  return rows.map(row => ({
    ...row,
    images: ((row.images as unknown as { src: string; alt?: string }[]) ?? []).map(img => ({
      url: img.src,
      alt: img.alt,
    })),
  }));
  ```
  Check how `src/lib/db/queries/search.ts` (or equivalent) handles this mapping in Epic 3 to stay consistent.

### Task 8: Add i18n keys for new components (AC: #1, #7)

- [ ] **File:** `src/messages/en.json` — ADD new namespace (DO NOT modify existing keys):
  ```json
  "SimilarProperties": {
    "heading": "Similar Properties",
    "browseCta": "Browse all properties",
    "carouselAriaLabel": "Similar properties carousel",
    "keyboardHint": "Use arrow keys or swipe to browse similar properties"
  }
  ```
- [ ] **File:** `src/messages/es.json` — ADD equivalent Spanish translations:
  ```json
  "SimilarProperties": {
    "heading": "Propiedades Similares",
    "browseCta": "Ver todas las propiedades",
    "carouselAriaLabel": "Carrusel de propiedades similares",
    "keyboardHint": "Usa las teclas de flecha o desliza para explorar propiedades similares"
  }
  ```
- [ ] **DO NOT re-add** `Breadcrumbs.*` keys — they already exist in both `en.json` and `es.json` from Story 4.4 (`home`, `search`, `agents`).
- [ ] **DO NOT re-add** any existing namespace keys. Only add `SimilarProperties` namespace.
- [ ] **Verify:** `"Breadcrumbs": { "home": "Home", "search": "Search", "agents": "Agents" }` is already present. The `Breadcrumbs` component in Task 6 uses pre-translated strings passed as props — no new Breadcrumbs keys needed.

### Task 9: Unit tests for `getSimilarPropertiesRanked` — Similarity algorithm (AC: #2)

- [ ] Create `tests/unit/listing/similar-properties-query.spec.ts` (`.ts` — no JSX, node environment, no jsdom)
- [ ] **Mock the DB** using `vi.mock('@/lib/db/client')` — mock the `db` object with chainable query builder.
- [ ] **Tests to write (from test-design-epic-4.md scenarios 4.5-UNIT-001, 4.5-UNIT-002):**
  - `[P0]` (4.5-UNIT-001) returns listings from same area first when mixed area input
  - `[P0]` (4.5-UNIT-002) filters by similar price range ±20%: seed at $200k + $190k (in range) + $300k (out of range) → only $200k and $190k returned
  - `[P1]` excludes the current property slug from results
  - `[P1]` falls back to any visible if no same-area results exist
  - `[P1]` returns at most `limit` results (default 4)
  - `[P2]` maps DB images `{ src }` to PropertySearchItem `{ url }` correctly

### Task 10: Unit tests for `SimilarProperties` component (AC: #1, #6, #7)

- [ ] Create `tests/unit/listing/similar-properties.spec.tsx` (`.tsx` — jsdom environment)
- [ ] **CRITICAL — vi.mock hoisting pattern** (established and held across all Epic 3 + 4 stories): ALL `vi.mock()` calls MUST appear BEFORE import statements. Add `// imported AFTER mocks` comment.
- [ ] **Required mocks (hoisted before imports):**
  ```typescript
  vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(() => Promise.resolve((key: string) => key)),
  }));

  vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
      <a href={href} {...props}>{children}</a>,
  }));

  vi.mock("@/components/property/property-card", () => ({
    PropertyCard: ({ property }: { property: { slug: string } }) =>
      <div data-testid="property-card">{property.slug}</div>,
  }));
  ```
  // imported AFTER mocks
- [ ] **Test fixture:**
  ```typescript
  const mockProperties: PropertySearchItem[] = [
    {
      id: "prop-1", slug: "casa-verde", titleEn: "Casa Verde", titleEs: "Casa Verde",
      priceUsd: 250000, bedrooms: 3, bathrooms: 2, lotSizeM2: 500, constructionM2: 120,
      zmtStatus: "titled", propertyType: "Casa", areaSlug: "perez-zeledon",
      images: [{ url: "/img/casa-verde.jpg" }], latitude: 9.37, longitude: -83.69,
    },
  ];
  ```
- [ ] **Tests to write:**
  - `[P0]` (4.5-E2E-001 unit analog) renders `data-testid="similar-properties-carousel"` when properties provided
  - `[P0]` renders the correct number of `data-testid="property-card"` elements
  - `[P0]` renders `data-testid="similar-properties-empty"` when properties array is empty
  - `[P0]` renders `data-testid="similar-browse-cta"` link in empty state
  - `[P1]` heading text matches i18n key `heading`
  - `[P2]` carousel container has `overflow-x-auto` and `snap-x` classes (horizontal scroll)
  - `[P2]` `aria-labelledby` on section matches `id` on heading

### Task 11: Unit tests for `Breadcrumbs` component (AC: #4)

- [ ] Create `tests/unit/listing/breadcrumbs.spec.tsx` (`.tsx` — jsdom)
- [ ] **Required mocks (hoisted):**
  ```typescript
  vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
      <a href={href} {...props}>{children}</a>,
  }));
  ```
  // imported AFTER mocks
- [ ] **Tests to write (from test-design-epic-4.md scenario 4.5-E2E-002 unit analog):**
  - `[P0]` (4.5-E2E-002) renders `data-testid="breadcrumbs"` element
  - `[P0]` renders all breadcrumb items
  - `[P0]` last item has `aria-current="page"` attribute
  - `[P0]` intermediate items render as `<a>` links with correct `href`
  - `[P1]` last item does NOT render as a link (no href)
  - `[P1]` nav has `aria-label="Breadcrumb"`
  - `[P2]` separator character is present between items and is `aria-hidden="true"`

### Task 12: CI verification (AC: all)

- [ ] `npm run typecheck` → 0 new errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run format:check` → pass
- [ ] `npm run build` → pass (including ISR static params generation)
- [ ] `npm test` → all existing tests pass (641+ baseline from Story 4.2 completion) + new similar-properties-query + similar-properties + breadcrumbs tests pass

---

## Dev Notes

### Architecture Context

**File structure:**
```
src/
  components/
    layout/
      breadcrumbs.tsx                       ← NEW (Server Component)
    listing/
      similar-properties.tsx                ← NEW (Server Component)
      similar-properties-loader.tsx         ← NEW (Suspense boundary wrapper)
      similar-properties-skeleton.tsx       ← NEW (Server Component)
      listing-detail-layout.tsx             ← MODIFY (wire in carousel + breadcrumbs)
  lib/
    db/queries/
      properties.ts                         ← MODIFY (add getSimilarPropertiesRanked)
  messages/
    en.json                                 ← MODIFY (add SimilarProperties namespace)
    es.json                                 ← MODIFY (add SimilarProperties namespace)
tests/
  unit/listing/
    similar-properties-query.spec.ts        ← NEW (node env)
    similar-properties.spec.tsx             ← NEW (jsdom)
    breadcrumbs.spec.tsx                    ← NEW (jsdom)
```

**Server/Client boundary:**
- `SimilarProperties` = Server Component — receives pre-fetched data via props, renders static carousel HTML
- `SimilarPropertiesLoader` = Server Component — async data-fetching component wrapped in Suspense
- `SimilarPropertiesSkeleton` = Server Component — pure HTML skeleton, no client JS
- `Breadcrumbs` = Server Component — pure layout, no interactivity
- `PropertyCard` = Client Component (from Epic 3) — imported into `SimilarProperties` (Server → Client boundary, handled by Next.js)

**IMPORTANT — No new client components in this story.** The carousel uses CSS-only horizontal scroll with `overflow-x-auto snap-x`. This adds 0 bytes to the client JS bundle for the carousel behavior.

**IMPORTANT — Suspense pattern explained:** In Next.js App Router, an async Server Component inside `<Suspense>` streams separately from the page shell. `ListingDetailLayout` renders synchronously (fast). `SimilarPropertiesLoader` wraps a child async Server Component (`SimilarPropertiesData`) in Suspense — the skeleton renders immediately while the DB query resolves. This is the correct pattern for below-fold async data that must not block LCP.

**IMPORTANT — Do NOT use `next/dynamic` here.** `next/dynamic` is for Client Components with `ssr: false`. The Suspense + async Server Component pattern is the correct App Router equivalent for Server Components.

### Critical Patterns from Previous Stories

**vi.mock hoisting (learned Story 3.1, held through all Epic 3 + Epic 4 stories):** ALL `vi.mock()` calls MUST appear before `import` statements. Add `// imported AFTER mocks` comment after the last mock. Violations cause silent test failures. This is a hard requirement.

**i18n — NO hardcoded strings:** Every user-visible string must use `getTranslations` (Server Component) or `useTranslations` (Client Component). `SimilarProperties` and `Breadcrumbs` are Server Components — use `getTranslations`. The `SimilarPropertiesSkeleton` has only an `aria-label` in static English — acceptable for loading states.

**`data-testid` contract (Story 4.5 — CANNOT rename these):**
- `data-testid="similar-properties-carousel"` — section container when properties present (from test-design-epic-4.md line 97)
- `data-testid="similar-properties-empty"` — section container when no properties found
- `data-testid="similar-browse-cta"` — "Browse all properties" fallback CTA link
- `data-testid="similar-properties-skeleton"` — loading skeleton container
- `data-testid="breadcrumbs"` — root `<nav>` element of Breadcrumbs (from test-design-epic-4.md line 98)

**`@/i18n/navigation` Link:** All locale-aware links use `import { Link } from "@/i18n/navigation"` — NOT `next/link` directly. This is confirmed across all components in the project (confirmed in agent-card.tsx, property-card.tsx, listing-removed-state.tsx).

**`cn` utility:** If conditional classes are needed, use `import { cn } from "@/lib/utils"` — but `SimilarProperties` and `Breadcrumbs` are Server Components that do not need `cn` for their primary rendering. Avoid adding `cn` unless truly needed.

**Existing `getSimilarProperties` signature must not change:** It is called in `src/app/[locale]/property/[slug]/page.tsx` on the invisible-property branch (`const similar = await getSimilarProperties(property.areaSlug, slug)`). Any signature change breaks the unavailable-property page. Add `getSimilarPropertiesRanked` as a new function alongside it.

**`PropertyCard` variant="compact":** The `PropertyCard` component from Epic 3 accepts `variant?: "default" | "compact" | "horizontal"`. Use `"compact"` for the carousel — it renders a smaller card without the full description text. Verify `variant="compact"` rendering in `src/components/property/property-card.tsx` before implementation (compact variant is used in search results grid on mobile).

**Image mapping in queries:** When the DB stores `OptimizedImage[]` (`{ src: string; lqip?: string; width?: number; height?: number }`) and the component expects `PropertySearchItem.images` (`{ url: string; alt?: string }[]`), you MUST map `src → url`. Search queries in Epic 3 (e.g., `src/lib/db/queries/search.ts`) do this mapping — replicate the exact same approach for consistency.

**Drizzle `sql` template tag:** For ABS(price difference) ordering, use:
```typescript
import { sql } from "drizzle-orm";
// ...
.orderBy(sql`ABS(${properties.priceUsd} - ${opts.priceUsd})`)
```
This is valid Drizzle ORM syntax for raw SQL fragments in type-safe queries.

**Price range filtering with Drizzle:**
```typescript
import { gte, lte } from "drizzle-orm";
const priceLow = Math.round(opts.priceUsd * 0.8);
const priceHigh = Math.round(opts.priceUsd * 1.2);
// in WHERE clause:
gte(properties.priceUsd, priceLow),
lte(properties.priceUsd, priceHigh),
```

**`inArray` for exclusion in steps 2–4:** Exclude already-collected slugs using:
```typescript
import { notInArray } from "drizzle-orm"; // or use NOT + inArray
// Check if notInArray is available in current drizzle-orm version — if not, use NOT(inArray(...))
not(inArray(properties.slug, collectedSlugs))
```
Guard against empty array: `if (collectedSlugs.length > 0) { /* add not-in clause */ }` — Drizzle's `inArray` with empty array causes SQL error.

### Story 4.4 Learnings Applied

- **`generateBreadcrumbJsonLd`** is already implemented in `src/lib/seo/structured-data.ts` (Story 4.4 Task 1). The listing `page.tsx` already calls it for JSON-LD structured data. The new `Breadcrumbs` component in this story adds the VISUAL breadcrumb nav — separate concern from the JSON-LD (which remains in `page.tsx`). Both are needed: JSON-LD for SEO crawlers, visual nav for users.
- **`Breadcrumbs` i18n namespace** already exists in `en.json` and `es.json` with keys `home`, `search`, `agents` (from Story 4.4). Do NOT re-add. Use the existing keys.
- **`SITE_ORIGIN`** constant is in `src/lib/seo/constants.ts` — import from there if needed.

### Performance Budget

- **Similar properties carousel must NOT block LCP** (AC: #8): The gallery hero + specs bar are the LCP elements. The `SimilarPropertiesLoader` uses React Suspense to defer the carousel DB query below-fold. LCP measurement: Lighthouse CI gate (from Story 4.4, NFR28) must still pass ≥80 on listing pages after this story.
- **Zero additional client JS for carousel:** CSS snap scroll adds 0 client bytes. Verify in bundle analysis (`npm run build` output) that the listing page route bundle does NOT grow by more than 2KB for this story.
- **`PropertyCard` bundle:** `PropertyCard` is already in the listing page bundle (it's a Client Component used by the search grid). No new bundle cost for reusing it here.
- **DB query budget:** Max 4 DB round-trips for `getSimilarPropertiesRanked` (steps 1–4, each short-circuits). In practice, Step 1 or Step 1+2 typically fills `limit=4`. The queries run in parallel with `SimilarPropertiesData` awaiting all of them inside a single Suspense boundary.

### Similarity Ranking Algorithm Summary

The ranking prioritizes properties in this order:
1. **Same area + same type + similar price (±20%)** — best matches
2. **Same area + similar price (type relaxed)** — good matches
3. **Same area (price relaxed)** — area-relevant alternatives
4. **Any visible (area relaxed)** — final fallback, ensures carousel is never empty

This is implemented as sequential DB queries with short-circuit on `limit` fulfillment. The algorithm ensures a property in "Dominical" never shows "Pérez Zeledón" properties until all Dominical options are exhausted.

### Deferred Work Context

- **Area context display** (AC #3 from epics.md: "area name with link to area guide, nearby listings count"): This is partially deferred. The `Breadcrumbs` component shows the area name implicitly via the navigation hierarchy. The "nearby listings count" feature is NOT in scope for Story 4.5 — it requires an area-level query and the area guide pages (Epic 6). Add a TODO comment in `listing-detail-layout.tsx` for the area context block: `{/* TODO Epic 6: Area context block (area name link + nearby count) goes here */}`.
- **Area guide link in breadcrumbs:** Story 4.5 breadcrumbs show `Home > Search > [Property Title]`. The epic description mentions "Home > Pérez Zeledón > Properties > [Title]" — but area guide pages are Epic 6 scope. The `Breadcrumbs` namespace keys (`home`, `search`) from Story 4.4 are the correct breadcrumb labels for now. The area-level crumb is deferred to Epic 6.

### Test Infrastructure Notes

- **Test directory:** `tests/unit/listing/` (created by Story 4.1)
- **`vitest.config.mts` `environmentMatchGlobs`** already covers `tests/unit/listing/**/*.spec.tsx` (added in Story 4.1) — no vitest config changes needed for `.tsx` tests
- **`similar-properties-query.spec.ts`** uses `.ts` extension (no JSX) — runs in default `node` environment (no jsdom needed). Same pattern as `whatsapp-utils.spec.ts` from Story 4.2.
- **Current baseline:** 641 tests pass (Story 4.2 completion notes). New tests in this story: ~15 unit tests (3 test files).
- **Server Component testing:** `SimilarProperties` and `Breadcrumbs` are Server Components. In Vitest with jsdom, test them by importing and rendering via `@testing-library/react` — Next.js Server Components render as standard async functions in test context (no RSC streaming). Mock `getTranslations` from `"next-intl/server"` as shown in Task 10 mocks.

---

## Story Context

**Epic 4 objective:** Convert property discovery (Epic 3) into leads. Story 4.5 is the final story in Epic 4 — it adds the cross-linking layer that keeps visitors engaged on the platform after viewing a listing.

**What previous Epic 4 stories built:**
- Story 4.1: `ListingDetailLayout`, `PropertyGallery`, `StickySpecsBar` — gallery + specs
- Story 4.2: `AgentCard`, `StickyMobileCTA` — WhatsApp lead conversion
- Story 4.3: Agent profile pages — `/en/agents/[slug]`
- Story 4.4: JSON-LD structured data, hreflang, sitemaps, WordPress redirects — SEO layer

**What this story adds:**
- `SimilarProperties` carousel with ranked similarity algorithm — keeps visitors in the funnel
- `Breadcrumbs` visual nav component — improves UX + supports AR14 BreadcrumbList (JSON-LD already added in Story 4.4)
- Deferred: Area context block (Epic 6), area-level breadcrumb crumbs (Epic 6)

**Dependencies (all done):**
- Story 4.1: `listing-detail-layout.tsx` with TODO placeholder at line 221 — fulfills this story
- Story 4.4: `Breadcrumbs` i18n namespace (`home`, `search`, `agents`) — reused directly
- Story 3.5: `PropertyCard` component — reused in carousel with `variant="compact"`
- Epic 2: `properties` table with `areaSlug`, `priceUsd`, `propertyType` fields — all populated

**GitHub issue:** #97

---

## Dev Agent Record

### Change Log

- 2026-05-03: Story 4.5 created — similar properties and cross-linking (Status: ready-for-dev)
