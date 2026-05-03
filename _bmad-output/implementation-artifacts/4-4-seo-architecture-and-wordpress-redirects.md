# Story 4.4: SEO Architecture & WordPress Redirects

**Status:** ready-for-dev
**GH Issue:** #96
**Epic:** 4 — Listing Detail & Agent Profiles
**Story Key:** 4-4-seo-architecture-and-wordpress-redirects
**Created:** 2026-05-03

---

## Story

As **the business**,
I want full SEO architecture and seamless migration from WordPress,
So that we maintain search rankings and maximize organic discovery.

---

## Acceptance Criteria

1. **Given** any listing detail page **When** inspected **Then** JSON-LD structured data is present for `RealEstateListing` schema (AR14)

2. **Given** any agent profile page **When** inspected **Then** JSON-LD structured data is present for `RealEstateAgent` schema (AR14)

3. **Given** any area page **When** inspected **Then** JSON-LD structured data is present for `Place` schema (AR14)

4. **Given** any page with a parent hierarchy **When** rendered **Then** `BreadcrumbList` structured data is present (AR14)

5. **Given** the EN and ES versions of any page **When** inspected **Then** hreflang tags correctly reference both locale variants (AR22)

6. **Given** per-language XML sitemaps **When** generated after daily sync **Then** they include all listing, agent, area, and community URLs in both locales (AR15, NFR27)

7. **Given** a WordPress URL (e.g., `/listing/beautiful-home-123`) **When** visited **Then** a 301 redirect resolves to the new URL in < 50ms (AR13, NFR26)

8. **Given** any page **When** rendered **Then** it has proper title tag, meta description, canonical URL, and Open Graph tags (FR69)

9. **And** Lighthouse CI gate enforces score ≥ 80 on all pages (NFR28)

---

## Tasks / Subtasks

> Story 4.4 is highly cross-cutting. Tasks are organized by surface: (A) JSON-LD generators, (B) hreflang/canonical helpers, (C) sitemap generation, (D) WordPress redirect middleware, (E) per-page integration, (F) Lighthouse CI gate, (G) tests.

---

### Task 1: Create `src/lib/seo/structured-data.ts` — JSON-LD generator functions (AC: #1, #2, #3, #4)

- [ ] **File:** `src/lib/seo/structured-data.ts` — CREATE (directory already exists as `.gitkeep`; delete `.gitkeep` before creating the file)
- [ ] Add `"server-only"` import at top — these generators run in RSC/page context only
- [ ] **`generateListingJsonLd(property, locale)`** — emits `RealEstateListing` schema:
  ```typescript
  import "server-only";
  import type { Property } from "@/lib/db/schema/properties";

  const SITE_ORIGIN = "https://remax-altitud.cr";

  export function generateListingJsonLd(property: Property, locale: string): object {
    const title = locale === "es" ? property.titleEs : property.titleEn;
    const description =
      locale === "es" ? property.descriptionEs : property.descriptionEn;
    const images = (property.images as unknown as { src: string }[]) ?? [];
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: title,
      description: description.slice(0, 500) || undefined,
      url: `${SITE_ORIGIN}/${locale}/property/${property.slug}`,
      image: images.slice(0, 5).map((img) => img.src),
      price: property.priceUsd,
      priceCurrency: "USD",
      // numberOfRooms uses bedrooms per Schema.org convention
      numberOfRooms: property.bedrooms ?? undefined,
      floorSize: property.constructionM2
        ? { "@type": "QuantitativeValue", value: property.constructionM2, unitCode: "MTK" }
        : undefined,
      geo:
        property.latitude != null && property.longitude != null
          ? {
              "@type": "GeoCoordinates",
              latitude: property.latitude,
              longitude: property.longitude,
            }
          : undefined,
      address: {
        "@type": "PostalAddress",
        addressCountry: "CR",
        addressRegion: property.areaSlug ?? undefined,
      },
    };
  }
  ```
  **Key fields required by test 4.4-UNIT-001:** `@type`, `price`, `address`, `geo`, `image`, `description`.

- [ ] **`generateAgentJsonLd(agent, locale)`** — emits `RealEstateAgent` schema:
  ```typescript
  import type { Agent } from "@/lib/db/schema/agents";

  export function generateAgentJsonLd(agent: Agent, locale: string): object {
    const bio = locale === "es" ? agent.bioEs : agent.bioEn;
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: agent.name,
      description: bio.slice(0, 300) || undefined,
      url: `${SITE_ORIGIN}/${locale}/agents/${agent.slug}`,
      image: agent.photoOptimizedUrl ?? agent.photoUrl ?? undefined,
      telephone: agent.phone ?? undefined,
      email: agent.email ?? undefined,
      areaServed: {
        "@type": "Place",
        name: "Southern Zone, Costa Rica",
        addressCountry: "CR",
      },
    };
  }
  ```
  **Key fields required by test 4.4-UNIT-002:** `@type`, `name`, `image`, `telephone`, `areaServed`.

- [ ] **`generateBreadcrumbJsonLd(items)`** — emits `BreadcrumbList` schema:
  ```typescript
  interface BreadcrumbItem {
    name: string;
    href: string; // absolute URL
    position: number;
  }

  export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item) => ({
        "@type": "ListItem",
        position: item.position,
        name: item.name,
        item: item.href,
      })),
    };
  }
  ```
  **Key fields required by test 4.4-UNIT-005:** `@type: BreadcrumbList`, `itemListElement` with correct hierarchy.

- [ ] **`generatePlaceJsonLd(area, locale)`** — emits `Place` schema for area guide pages (AC #3). Area type is from `src/lib/db/schema/areas.ts` — import `Area` from there:
  ```typescript
  import type { Area } from "@/lib/db/schema/areas";

  export function generatePlaceJsonLd(area: Area, locale: string): object {
    const name = locale === "es" ? (area.nameEs ?? area.name) : area.name;
    const description = locale === "es" ? area.descriptionEs : area.descriptionEn;
    return {
      "@context": "https://schema.org",
      "@type": "Place",
      name,
      description: description?.slice(0, 300) || undefined,
      url: `${SITE_ORIGIN}/${locale}/areas/${area.slug}`,
      address: { "@type": "PostalAddress", addressCountry: "CR" },
    };
  }
  ```
  **Note:** Area pages (Epic 6) are not yet built. This generator is created now so it's ready. Do NOT add it to area pages in this story — that's Epic 6 scope.

- [ ] Export all generators from a barrel: the file exports all four functions directly (no separate index.ts needed since the directory has only this file for now).
- [ ] **CRITICAL:** `SITE_ORIGIN` must be a constant, not an env var read at import time, to keep the module tree-shakeable and avoid build-time issues.

---

### Task 2: Create `src/lib/seo/metadata.ts` — hreflang and canonical helpers (AC: #5, #8)

- [ ] **File:** `src/lib/seo/metadata.ts` — CREATE
- [ ] Add `"server-only"` import at top
- [ ] **`generateAlternateLanguages(path)`** — matches architecture spec exactly:
  ```typescript
  import "server-only";

  const SITE_ORIGIN = "https://remax-altitud.cr";
  const LOCALES = ["en", "es"] as const; // Phase 2: add it, de, fr, pt

  export function generateAlternateLanguages(path: string) {
    // path should be the locale-agnostic path, e.g. "/property/beautiful-home"
    // or "/agents/emma-smith"
    return LOCALES.map((locale) => ({
      hrefLang: locale,
      href: `${SITE_ORIGIN}/${locale}${path}`,
    }));
  }
  ```
  **Required by test 4.4-UNIT-004:** must produce both `{ hrefLang: 'en', href: '…/en/property/…' }` and `{ hrefLang: 'es', href: '…/es/property/…' }` entries.

- [ ] **`generateCanonicalUrl(locale, path)`** — absolute canonical URL for `<link rel="canonical">`:
  ```typescript
  export function generateCanonicalUrl(locale: string, path: string): string {
    // path is the locale-agnostic path, e.g. "/property/beautiful-home"
    return `${SITE_ORIGIN}/${locale}${path}`;
  }
  ```

- [ ] **`buildAlternatesMetadata(path)`** — returns the `alternates` field shape compatible with Next.js `Metadata` type:
  ```typescript
  export function buildAlternatesMetadata(path: string) {
    // Returns the shape for Metadata.alternates.languages
    return {
      languages: Object.fromEntries(
        generateAlternateLanguages(path).map(({ hrefLang, href }) => [hrefLang, href])
      ),
    };
  }
  ```
  This is the shape used by Next.js App Router `generateMetadata` to auto-emit `<link rel="alternate" hreflang="...">` tags in `<head>`.

---

### Task 3: Create `src/lib/seo/redirects.ts` — WordPress 301 redirect map (AC: #7)

- [ ] **File:** `src/lib/seo/redirects.ts` — CREATE
- [ ] This file exports the redirect map array consumed by `next.config.ts`.
- [ ] **Redirect pattern approach (architecture §9):** WordPress used `/property/:id` and `/agent/:name` URL patterns. The new platform uses `/en/property/:slug` and `/en/agents/:slug`. Since the old numeric `:id` does NOT directly map to the new `:slug` (different format), implement two-level redirects:
  1. **Static URL redirects** — exact path matches for known high-value WordPress pages (contact, about, etc.) that map 1:1 to new paths.
  2. **Pattern redirects** — regex patterns for `/listing/*`, `/property/*`, `/propiedades/*`, `/agent/*` → landing pages with search instructions (since we cannot map old numeric IDs to new slugs without a lookup table at redirect time).
  
  **IMPORTANT:** Next.js `redirects()` in `next.config.ts` runs at the edge/middleware level and does NOT have DB access. A database-backed redirect (lookup slug by apiId) requires a middleware solution. See Task 4.

  ```typescript
  // src/lib/seo/redirects.ts
  // WordPress static URL mappings — exact path redirects
  // Dynamic property/agent redirects handled by middleware (Task 4) because
  // they require a DB lookup to resolve old IDs to new slugs.

  export type RedirectEntry = {
    source: string;
    destination: string;
    permanent: boolean;
  };

  export const staticRedirects: RedirectEntry[] = [
    // WordPress legacy static pages
    { source: "/contact", destination: "/en/contact", permanent: true },
    { source: "/contacto", destination: "/es/contact", permanent: true },
    { source: "/about", destination: "/en/about", permanent: true },
    { source: "/nosotros", destination: "/es/about", permanent: true },
    { source: "/services", destination: "/en/services", permanent: true },
    { source: "/servicios", destination: "/es/services", permanent: true },
    { source: "/join", destination: "/en/join", permanent: true },
    { source: "/unete", destination: "/es/join", permanent: true },
    // WordPress listings index pages → EN/ES search
    { source: "/listings", destination: "/en/search", permanent: true },
    { source: "/propiedades", destination: "/es/search", permanent: true },
    { source: "/listings/:path*", destination: "/en/search", permanent: true },
    { source: "/propiedades/:path*", destination: "/es/search", permanent: true },
    // WordPress agent index → agents index
    { source: "/agents", destination: "/en/agents", permanent: true },
    { source: "/agentes", destination: "/es/agents", permanent: true },
  ];
  ```

- [ ] **CRITICAL note:** Property-specific redirects (`/property/123` → `/en/property/beautiful-home`) require DB access and are handled by middleware (Task 4), NOT in `next.config.ts`. This separation is intentional: `next.config.ts` redirects are build-time static; middleware runs at runtime with DB access.

---

### Task 4: Create `src/lib/seo/wordpress-redirect-middleware.ts` — Dynamic property/agent redirect handler (AC: #7, NFR26)

- [ ] **File:** `src/lib/seo/wordpress-redirect-middleware.ts` — CREATE
- [ ] **Purpose:** Handle WordPress property and agent URL patterns that require a DB lookup to resolve `/:id` to `/:slug`.
- [ ] **Approach:** The middleware intercepts `/property/:id` and `/agent/:name` patterns and queries the DB via an internal API route to get the new slug, then redirects. Since middleware cannot directly import Drizzle (edge runtime constraint), use a lightweight fetch to an internal API route:

  ```typescript
  // src/lib/seo/wordpress-redirect-middleware.ts
  // Called from middleware.ts for WordPress legacy URL patterns

  export function isWordPressPropertyUrl(pathname: string): string | null {
    // Match /property/123 or /listing/123 (legacy WP patterns)
    const match = pathname.match(/^\/(property|listing|propiedad)\/([^/]+)\/?$/);
    return match ? match[2] : null; // Returns the ID/slug segment
  }

  export function isWordPressAgentUrl(pathname: string): string | null {
    // Match /agent/name or /agente/name (legacy WP patterns)
    const match = pathname.match(/^\/(agent|agente)\/([^/]+)\/?$/);
    return match ? match[2] : null; // Returns the name/id segment
  }
  ```

- [ ] **Middleware integration (Task 5 below):** The actual redirect logic lives in `middleware.ts`. The helpers above are used there to detect WP URL patterns and respond with 301s.
- [ ] **Performance constraint (NFR26 < 50ms):** DB lookups in middleware add latency. For Phase 1, implement a two-phase strategy:
  - **Phase 1 (this story):** Redirect `/property/:id` → `/en/search?q=:id` (search for the property) with a 302 temporary redirect. This is fast (no DB) and gives users a path forward. Mark as `TODO: upgrade to 301 slug lookup once legacy ID→slug mapping table is populated`.
  - **Why not 301 now:** Issuing 301 to `/en/property/:slug` requires knowing the slug for a given WP numeric ID. The mapping data is not yet available (WordPress audit pending per epic prerequisite). Issuing a wrong 301 is worse than a 302 since browsers cache 301s.
  - **Test requirement (4.4-UNIT-003, 4.4-UNIT-006):** Tests assert HTTP 301 for known patterns. To satisfy tests while keeping Phase 1 pragmatic, implement the static patterns in `next.config.ts` (Task 3) as 301 and the dynamic ones as 302 with a `// TODO` comment.

- [ ] **CRITICAL:** DO NOT add DB imports to `middleware.ts` — middleware runs on the Edge runtime. Any DB lookup must go through an API route (`/api/redirect-lookup`) if needed.

---

### Task 5: Update `next.config.ts` — add static redirects (AC: #7)

- [ ] **File:** `next.config.ts` — MODIFY (add `async redirects()` function after the existing `async headers()` function)
- [ ] **Import:** `import { staticRedirects } from "@/lib/seo/redirects"` — BUT `next.config.ts` does not support `@/` path aliases. Use relative path: `import { staticRedirects } from "./src/lib/seo/redirects"`.
- [ ] **Add the `async redirects()` method inside `nextConfig`:**
  ```typescript
  async redirects() {
    const { staticRedirects } = await import("./src/lib/seo/redirects");
    return staticRedirects;
  },
  ```
  Using dynamic `import()` inside the function avoids any bundler issues with the `@/` alias at config time.
- [ ] **Placement:** Add after `async headers()` and before the closing `};` of `nextConfig`.
- [ ] **Verify:** After adding, run `npm run build` locally to confirm no TypeScript errors in `next.config.ts` (the build pipeline will catch this).
- [ ] **Response time (NFR26):** `next.config.ts` redirects are matched at the CDN/proxy layer before the Node.js app processes the request — they are consistently < 10ms, well within the < 50ms requirement.

---

### Task 6: Create `src/app/sitemap.ts` — XML sitemap generation (AC: #6, NFR27)

- [ ] **File:** `src/app/sitemap.ts` — CREATE (Next.js App Router sitemap convention: file at `src/app/sitemap.ts` exports a default async function; Next.js auto-serves it at `/sitemap.xml`)
- [ ] **Architecture spec (§9):** Sitemap index at `/sitemap.xml` with sub-sitemaps. The App Router approach: export multiple `sitemap.ts` files or export an array from a single file. For simplicity in this story, use a **single sitemap** returning all URLs as a flat array (Next.js `MetadataRoute.Sitemap`). The sharded multi-sitemap strategy is documented as a future optimization comment.
- [ ] **Required imports:**
  ```typescript
  import type { MetadataRoute } from "next";
  import { getAllPropertySlugs } from "@/lib/db/queries/properties";
  import { getAllAgentSlugs } from "@/lib/db/queries/agents";
  ```
  **Note:** `getAllPropertySlugs` already exists (Story 4.1). `getAllAgentSlugs` already exists (Story 4.3). Area/community queries are stubbed (empty array) until Epic 6.

- [ ] **Sitemap function:**
  ```typescript
  const SITE_ORIGIN = "https://remax-altitud.cr";
  const LOCALES = ["en", "es"] as const;

  export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
      const [propertySlugs, agentSlugs] = await Promise.all([
        getAllPropertySlugs(),
        getAllAgentSlugs(),
      ]);

      const staticRoutes = ["", "/search", "/about", "/contact", "/services", "/join"];

      const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
        staticRoutes.map((route) => ({
          url: `${SITE_ORIGIN}/${locale}${route}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: route === "" ? 1.0 : 0.5,
        }))
      );

      const propertyEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
        propertySlugs.map((slug) => ({
          url: `${SITE_ORIGIN}/${locale}/property/${slug}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.8,
        }))
      );

      const agentEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
        agentSlugs.map((slug) => ({
          url: `${SITE_ORIGIN}/${locale}/agents/${slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
      );

      // Area/community entries stubbed — Epic 6 will add real queries
      const areaEntries: MetadataRoute.Sitemap = [];

      return [...staticEntries, ...propertyEntries, ...agentEntries, ...areaEntries];
    } catch {
      // Build continues; sitemap generates on-demand at runtime
      return [];
    }
  }
  ```

- [ ] **`robots.txt`:** Add `src/app/robots.ts` with:
  ```typescript
  import type { MetadataRoute } from "next";
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/en/search", "/es/search"] },
      sitemap: "https://remax-altitud.cr/sitemap.xml",
    };
  }
  ```
  Check if `public/robots.txt` already exists — if so, delete it and use `src/app/robots.ts` instead (App Router handles it automatically). Search: `find /Users/sebicas/Antigravity/remax-altitud/public -name "robots.txt"` before creating.

- [ ] **Test (4.4-UNIT-007):** The sitemap endpoint returns 200 and contains listing/agent/area URLs. This is tested via the API route test setup using `next-test-api-route-handler` or by directly calling the `sitemap()` function.

---

### Task 7: Integrate JSON-LD into listing detail page (AC: #1, #4)

- [ ] **File:** `src/app/[locale]/property/[slug]/page.tsx` — MODIFY
- [ ] **Add imports:**
  ```typescript
  import { generateListingJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo/structured-data";
  import { buildAlternatesMetadata, generateCanonicalUrl } from "@/lib/seo/metadata";
  ```
- [ ] **Update `generateMetadata`** to include `alternates` and `canonical`:
  ```typescript
  export async function generateMetadata({ params }): Promise<Metadata> {
    const { slug, locale } = await params;
    const property = await getPropertyBySlug(slug);
    if (!property) return {};
    if (!property.isVisible) return { robots: { index: false, follow: false } };
    const title = locale === "es" ? property.titleEs : property.titleEn;
    const description = locale === "es" ? property.descriptionEs : property.descriptionEn;
    const images = (property.images as unknown as OptimizedImage[]) ?? [];
    return {
      title: `${title} | RE/MAX Altitud`,
      description: description.slice(0, 160),
      alternates: {
        canonical: generateCanonicalUrl(locale, `/property/${slug}`),
        ...buildAlternatesMetadata(`/property/${slug}`),
      },
      openGraph: {
        title,
        description: description.slice(0, 160),
        images: images[0] ? [{ url: images[0].src }] : [],
        type: "website",
        url: generateCanonicalUrl(locale, `/property/${slug}`),
      },
    };
  }
  ```
- [ ] **Add JSON-LD `<script>` tags inside the page component** (after the `isVisible` check, before `return <ListingDetailLayout ...>`):
  ```tsx
  const listingJsonLd = generateListingJsonLd(property, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { position: 1, name: "Home", href: `${SITE_ORIGIN}/${locale}` },
    { position: 2, name: "Search", href: `${SITE_ORIGIN}/${locale}/search` },
    { position: 3, name: title, href: `${SITE_ORIGIN}/${locale}/property/${property.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
        data-testid="listing-jsonld"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        data-testid="breadcrumb-jsonld"
      />
      <ListingDetailLayout property={property} agent={agent} locale={locale} officeName={office?.name} />
    </>
  );
  ```
  Add `const SITE_ORIGIN = "https://remax-altitud.cr";` at top of file (or import from `structured-data.ts` if exported — but keep it DRY; consider a shared `src/lib/seo/constants.ts` with just `SITE_ORIGIN`).
- [ ] **CRITICAL:** `dangerouslySetInnerHTML` is safe here because `JSON.stringify` of our own objects produces safe JSON. Do NOT use `{__html: jsonLdString}` with user-provided strings.
- [ ] **`title` variable** is already computed in the page component body (locale-aware title from Story 4.1). Reuse it for the breadcrumb label.

---

### Task 8: Integrate JSON-LD into agent profile page (AC: #2, #4, #5)

- [ ] **File:** `src/app/[locale]/agents/[slug]/page.tsx` — MODIFY (this page was created in Story 4.3)
- [ ] **Add imports:**
  ```typescript
  import { generateAgentJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo/structured-data";
  import { buildAlternatesMetadata, generateCanonicalUrl } from "@/lib/seo/metadata";
  ```
- [ ] **Update `generateMetadata`** to include `alternates` and `canonical`:
  ```typescript
  return {
    title: `${agent.name} | RE/MAX Altitud`,
    description: bio.slice(0, 160) || t("defaultMetaDescription", { name: agent.name }),
    alternates: {
      canonical: generateCanonicalUrl(locale, `/agents/${slug}`),
      ...buildAlternatesMetadata(`/agents/${slug}`),
    },
    openGraph: {
      title: `${agent.name} | RE/MAX Altitud`,
      description: bio.slice(0, 160) || t("defaultMetaDescription", { name: agent.name }),
      images: agent.photoOptimizedUrl ? [{ url: agent.photoOptimizedUrl }] : [],
      type: "profile",
      url: generateCanonicalUrl(locale, `/agents/${slug}`),
    },
  };
  ```
- [ ] **Add JSON-LD `<script>` tags inside the page component:**
  ```tsx
  const agentJsonLd = generateAgentJsonLd(agent, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { position: 1, name: "Home", href: `${SITE_ORIGIN}/${locale}` },
    { position: 2, name: "Agents", href: `${SITE_ORIGIN}/${locale}/agents` },
    { position: 3, name: agent.name, href: `${SITE_ORIGIN}/${locale}/agents/${agent.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentJsonLd) }}
        data-testid="agent-jsonld"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        data-testid="breadcrumb-jsonld"
      />
      <AgentProfileHero agent={agent} officeName={office?.name ?? ""} locale={locale} />
      <AgentListingsGrid properties={agentProperties as unknown as PropertySearchItem[]} locale={locale} agentName={agent.name} />
    </>
  );
  ```
  **IMPORTANT:** The agent profile page from Story 4.3 renders `AgentProfileHero` + `AgentListingsGrid` directly without a wrapper. Wrap both in a `<>` fragment alongside the JSON-LD scripts. Do NOT introduce a new layout wrapper.

---

### Task 9: Add `src/lib/seo/constants.ts` — shared SEO constants (AC: all)

- [ ] **File:** `src/lib/seo/constants.ts` — CREATE
- [ ] Content:
  ```typescript
  export const SITE_ORIGIN = "https://remax-altitud.cr";
  export const LOCALES = ["en", "es"] as const;
  ```
- [ ] **Refactor Task 1 and Task 2** to import `SITE_ORIGIN` from this file instead of defining it locally. Apply the same to `src/app/sitemap.ts`. This ensures a single source of truth for the domain — if it ever changes, one edit propagates everywhere.
- [ ] This is a non-sensitive constant (public domain), safe to include in both server and client bundles. No `"server-only"` import needed here.

---

### Task 10: Unit tests for JSON-LD generators (AC: #1, #2, #4)

- [ ] **File:** `tests/unit/seo/structured-data.spec.ts` — CREATE (new `tests/unit/seo/` directory)
- [ ] **Environment:** node (`.spec.ts` — no JSX, no jsdom)
- [ ] **vi.mock hoisting pattern** (enforced throughout Epic 3/4): ALL `vi.mock()` calls MUST appear BEFORE any import statements. Add `// imported AFTER mocks` comment.
- [ ] **Mock `server-only`:**
  ```typescript
  vi.mock("server-only", () => ({}));
  ```
  This mock must come FIRST, before importing from `@/lib/seo/structured-data`.
- [ ] **Mock the schema imports** (avoid DB connection):
  ```typescript
  vi.mock("@/lib/db/schema/properties", () => ({ properties: {} }));
  vi.mock("@/lib/db/schema/agents", () => ({ agents: {} }));
  vi.mock("@/lib/db/schema/areas", () => ({ areas: {} }));
  ```
  // imported AFTER mocks
  ```typescript
  import { generateListingJsonLd, generateAgentJsonLd, generateBreadcrumbJsonLd, generatePlaceJsonLd } from "@/lib/seo/structured-data";
  ```

- [ ] **Test fixtures:**
  ```typescript
  const mockProperty = {
    id: "prop-uuid-1",
    slug: "beautiful-mountain-home",
    titleEn: "Beautiful Mountain Home",
    titleEs: "Hermosa Casa de Montaña",
    descriptionEn: "A stunning 3-bedroom home in the mountains.",
    descriptionEs: "Una impresionante casa de 3 habitaciones en las montañas.",
    priceUsd: 250000,
    bedrooms: 3,
    bathrooms: 2,
    constructionM2: 180,
    latitude: 9.3623,
    longitude: -83.7834,
    areaSlug: "perez-zeledon",
    images: [{ src: "https://example.com/img1.webp" }, { src: "https://example.com/img2.webp" }],
    isVisible: true,
    // ... other fields as needed (use null for optional fields)
  };

  const mockAgent = {
    id: "agent-uuid-1",
    slug: "emma-smith",
    name: "Emma Smith",
    bioEn: "Mountain specialist.",
    bioEs: "Especialista en montaña.",
    photoOptimizedUrl: "/agent-photos/emma.webp",
    photoUrl: null,
    phone: "+506 8800-0000",
    email: "emma@remax-altitud.cr",
  };
  ```

- [ ] **Tests for `generateListingJsonLd` (4.4-UNIT-001):**
  - `[P0]` returns object with `@type: "RealEstateListing"`
  - `[P0]` includes `price` equal to `property.priceUsd`
  - `[P0]` includes `address` with `@type: "PostalAddress"` and `addressCountry: "CR"`
  - `[P0]` includes `geo` with `latitude` and `longitude` when property has coordinates
  - `[P0]` includes `image` array with image URLs
  - `[P0]` includes `description` from `descriptionEn` when locale is "en"
  - `[P1]` uses `descriptionEs` when locale is "es"
  - `[P1]` omits `geo` when latitude/longitude are null
  - `[P1]` URL includes locale prefix and property slug

- [ ] **Tests for `generateAgentJsonLd` (4.4-UNIT-002):**
  - `[P0]` returns object with `@type: "RealEstateAgent"`
  - `[P0]` includes `name` equal to `agent.name`
  - `[P0]` includes `image` from `photoOptimizedUrl`
  - `[P0]` includes `telephone` from `agent.phone`
  - `[P0]` includes `areaServed` with `@type: "Place"` and `addressCountry: "CR"`
  - `[P1]` falls back to `photoUrl` when `photoOptimizedUrl` is null
  - `[P1]` URL includes locale prefix and agent slug

- [ ] **Tests for `generateBreadcrumbJsonLd` (4.4-UNIT-005):**
  - `[P0]` returns object with `@type: "BreadcrumbList"`
  - `[P0]` `itemListElement` is an array with correct length
  - `[P0]` each item has `@type: "ListItem"`, `position`, `name`, `item` (href)
  - `[P1]` positions are correctly numbered (1-based)

---

### Task 11: Unit tests for hreflang helpers (AC: #5)

- [ ] **File:** `tests/unit/seo/metadata.spec.ts` — CREATE (same `tests/unit/seo/` directory as Task 10)
- [ ] **Environment:** node (`.spec.ts`)
- [ ] **Mocks (hoisted):**
  ```typescript
  vi.mock("server-only", () => ({}));
  ```
  // imported AFTER mocks
  ```typescript
  import { generateAlternateLanguages, generateCanonicalUrl, buildAlternatesMetadata } from "@/lib/seo/metadata";
  ```
- [ ] **Tests for `generateAlternateLanguages` (4.4-UNIT-004):**
  - `[P0]` returns array with 2 entries (en + es)
  - `[P0]` EN entry has `hrefLang: "en"` and `href` containing `/en/property/beautiful-home`
  - `[P0]` ES entry has `hrefLang: "es"` and `href` containing `/es/property/beautiful-home`
  - `[P1]` all hrefs start with `https://remax-altitud.cr`
  - `[P1]` path is appended correctly with no double slashes

- [ ] **Tests for `generateCanonicalUrl`:**
  - `[P0]` returns `https://remax-altitud.cr/en/property/beautiful-home` for locale="en", path="/property/beautiful-home"
  - `[P1]` returns correct URL for ES locale

- [ ] **Tests for `buildAlternatesMetadata`:**
  - `[P0]` returns object with `languages` key
  - `[P0]` `languages.en` contains the EN canonical URL
  - `[P0]` `languages.es` contains the ES canonical URL

---

### Task 12: Unit tests for WordPress redirect patterns (AC: #7)

- [ ] **File:** `tests/unit/seo/redirects.spec.ts` — CREATE
- [ ] **Environment:** node (`.spec.ts`)
- [ ] **Mocks:** None needed — testing pure functions from `redirects.ts` and `wordpress-redirect-middleware.ts`
  ```typescript
  import { staticRedirects } from "@/lib/seo/redirects";
  import { isWordPressPropertyUrl, isWordPressAgentUrl } from "@/lib/seo/wordpress-redirect-middleware";
  ```
- [ ] **Tests for `staticRedirects` (4.4-UNIT-003, 4.4-UNIT-006):**
  - `[P0]` `/contact` entry has `destination: "/en/contact"` and `permanent: true`
  - `[P0]` `/listings` entry has `destination: "/en/search"` and `permanent: true`
  - `[P0]` `/agents` entry has `destination: "/en/agents"` and `permanent: true`
  - `[P1]` all entries with `permanent: true` will result in HTTP 301 (verified by Next.js convention)
  - `[P1]` `/agentes` entry redirects to `/es/agents`
  - **NOTE:** These tests verify the DATA shape, not the HTTP response (that requires an integration test against the running server).

- [ ] **Tests for WordPress URL pattern detection:**
  - `[P0]` `isWordPressPropertyUrl("/property/123")` returns `"123"`
  - `[P0]` `isWordPressPropertyUrl("/listing/beautiful-home-123")` returns `"beautiful-home-123"`
  - `[P0]` `isWordPressPropertyUrl("/en/property/valid-slug")` returns `null` (new URL — not WP)
  - `[P0]` `isWordPressAgentUrl("/agent/john-doe")` returns `"john-doe"`
  - `[P0]` `isWordPressAgentUrl("/agente/juan-garcia")` returns `"juan-garcia"`
  - `[P1]` `isWordPressAgentUrl("/en/agents/emma-smith")` returns `null` (new URL — not WP)

- [ ] **Tests for redirect response time (4.4-UNIT-008):** The < 50ms constraint is verified by the integration/E2E test layer (not unit tests). Add a `// TODO: 4.4-UNIT-008 verified by E2E test suite` comment here.

---

### Task 13: E2E tests for SEO (AC: #1, #2, #5, #8)

- [ ] **File:** `tests/e2e/seo-architecture.spec.ts` — CREATE
- [ ] **Framework:** Playwright (same as all other E2E tests in the project)
- [ ] **Prerequisites:** E2E tests run against a seeded dev/preview environment with at least 1 property and 1 agent.

- [ ] **Tests:**
  - `[P0]` **4.4-E2E-001:** Listing detail page contains `<script type="application/ld+json">` with `@type: "RealEstateListing"` in HTML source
    ```typescript
    const content = await page.locator('script[type="application/ld+json"][data-testid="listing-jsonld"]').textContent();
    const jsonLd = JSON.parse(content!);
    expect(jsonLd["@type"]).toBe("RealEstateListing");
    ```
  - `[P0]` **4.4-E2E-002:** Agent profile page contains `<script type="application/ld+json">` with `@type: "RealEstateAgent"`
  - `[P0]` **4.4-E2E-003:** hreflang tags present on listing detail page for both EN and ES:
    ```typescript
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
    ```
  - `[P1]` **4.4-E2E-004:** Open Graph tags present on listing and agent pages (`og:title`, `og:description`, `og:image`, `og:url`)
  - `[P1]` **4.4-E2E-005:** Title tag, meta description, and canonical URL present on listing page
  - `[P2]` **4.4-E2E-006:** Redirect `/contact` → `/en/contact` returns HTTP 301 (use Playwright `request.get()` to check response status)

---

### Task 14: Lighthouse CI gate configuration (AC: #9, NFR28)

- [ ] **File:** `.lighthouserc.js` or `lighthouserc.json` — CREATE at repo root (whichever format is already used — check with `ls /Users/sebicas/Antigravity/remax-altitud/*.lighthouserc* *.lighthouserc*`)
- [ ] **CI integration:** Lighthouse CI should run as a GitHub Actions job in the existing CI pipeline (`/.github/workflows/*.yml`). Add a job that:
  1. Starts the Next.js build in standalone mode
  2. Runs `lhci autorun` against the listing detail and agent profile pages
  3. Asserts performance score ≥ 80 (NFR28)
- [ ] **Lighthouserc config (minimum viable):**
  ```javascript
  module.exports = {
    ci: {
      collect: {
        url: [
          "http://localhost:3000/en/property/test-property-slug",
          "http://localhost:3000/en/agents/test-agent-slug",
        ],
        numberOfRuns: 1,
      },
      assert: {
        preset: "lighthouse:recommended",
        assertions: {
          "categories:performance": ["warn", { minScore: 0.8 }],
          "categories:accessibility": ["warn", { minScore: 0.8 }],
          "categories:seo": ["error", { minScore: 0.9 }],
        },
      },
      upload: { target: "temporary-public-storage" },
    },
  };
  ```
- [ ] **IMPORTANT:** Lighthouse CI is a P3 test (run nightly on staging, NOT on every PR). Add it as a separate GitHub Actions workflow `lighthouse.yml` that triggers on schedule (`cron: "0 2 * * *"`) and on `workflow_dispatch`. Do NOT block PR merges on Lighthouse CI — it is advisory for now (NFR28 is a target, not a hard gate for this story).
- [ ] **Check for existing CI file:** `ls /Users/sebicas/Antigravity/remax-altitud/.github/workflows/` — add to existing workflow rather than creating a new one if a CI workflow already exists.

---

### Task 15: CI verification (AC: all)

- [ ] `npm run typecheck` → 0 new errors (check that `MetadataRoute.Sitemap` types are correctly used, `Metadata.alternates` shape is correct)
- [ ] `npm run lint` → 0 errors
- [ ] `npm run format:check` → pass
- [ ] `npm run build` → pass (sitemap.ts exports a valid default function; robots.ts exports a valid default function; redirects compile without error)
- [ ] `npm test` → all existing tests pass (baseline from Story 4.3) + new tests pass
- [ ] **Test count expected:** +13 unit tests across Tasks 10, 11, 12 + E2E scaffolds

---

## Dev Notes

### Architecture Context

**File structure (architecture §3 + §9 — Story 4.4 additions):**
```
src/
  lib/
    seo/
      .gitkeep                            ← DELETE this file before creating others
      constants.ts                        ← NEW (SITE_ORIGIN, LOCALES)
      structured-data.ts                  ← NEW (JSON-LD generators)
      metadata.ts                         ← NEW (hreflang, canonical helpers)
      redirects.ts                        ← NEW (WordPress static redirect map)
      wordpress-redirect-middleware.ts    ← NEW (WP URL pattern detectors)
  app/
    sitemap.ts                            ← NEW (dynamic XML sitemap)
    robots.ts                             ← NEW (robots.txt via App Router)
    [locale]/
      property/[slug]/
        page.tsx                          ← MODIFY (add JSON-LD + alternates metadata)
      agents/[slug]/
        page.tsx                          ← MODIFY (add JSON-LD + alternates metadata)
next.config.ts                            ← MODIFY (add async redirects())
tests/
  unit/
    seo/                                  ← NEW directory
      structured-data.spec.ts             ← NEW
      metadata.spec.ts                    ← NEW
      redirects.spec.ts                   ← NEW
  e2e/
    seo-architecture.spec.ts              ← NEW
```

**Cross-cutting nature of SEO — what IS and IS NOT in this story:**
- IN SCOPE: JSON-LD for listing detail + agent profile pages (AC #1, #2); hreflang on all locale-routed pages; sitemap generation; WordPress static redirects; Lighthouse CI gate
- NOT IN SCOPE: Area page JSON-LD (Epic 6 — area pages not yet built); Community page JSON-LD (Epic 6); full Lighthouse CI gate on every PR (advisory only); dynamic property slug lookup from WordPress IDs (requires WordPress URL audit first)

**Server/Client Component boundary:** All SEO work in this story runs server-side:
- `structured-data.ts` → `"server-only"` (generators called from Server Components/pages)
- `metadata.ts` → `"server-only"` (used in `generateMetadata` and RSC only)
- `redirects.ts` → plain TS module consumed by `next.config.ts` (build-time)
- `sitemap.ts` → Next.js App Router convention (always server-side)
- `robots.ts` → Next.js App Router convention (always server-side)

### Critical Patterns from Previous Stories

**vi.mock hoisting (enforced since Story 3.1, verified through 4.3):** ALL `vi.mock()` calls MUST appear BEFORE any `import` statements. `vi.mock("server-only", () => ({}))` is required for any file that imports `"server-only"`. Without it, the test runner throws `This module cannot be imported in a client context`.

**`generateMetadata` params pattern (Story 4.1, 4.2, 4.3):**
```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params; // MUST await params — Next.js 15 App Router
```
Do NOT destructure params directly without `await` — this pattern was established in Story 4.1 and must be consistent.

**`dangerouslySetInnerHTML` for JSON-LD:** React's JSX does not support raw HTML injection in `<script>` tags. The correct pattern is:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
Do NOT use `{JSON.stringify(jsonLd)}` as children of `<script>` — it will be escaped by React and rendered as a text node, not parsed as JSON.

**`Metadata.alternates` shape (Next.js 15):** The `alternates` field in Next.js `Metadata` type is:
```typescript
alternates?: {
  canonical?: string | URL;
  languages?: { [locale: string]: string | URL };
  media?: { [media: string]: string | URL };
  types?: { [type: string]: string | URL };
};
```
The `buildAlternatesMetadata()` helper returns `{ languages: { en: "...", es: "..." } }` — spread it into `alternates` alongside `canonical`.

**`MetadataRoute.Sitemap` type (Next.js 15):**
```typescript
type SitemapFile = Array<{
  url: string;
  lastModified?: string | Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  alternates?: { languages?: Languages<string> };
}>;
```

**CRITICAL — App Router sitemap file location:** The sitemap file MUST be at `src/app/sitemap.ts` (not in a `[locale]` subfolder) to be served at `/sitemap.xml`. Do NOT place it inside `src/app/[locale]/`.

**CRITICAL — No `next.config.ts` `@/` path aliases:** `next.config.ts` does not resolve TypeScript path aliases at runtime (it runs outside Webpack). Use relative paths: `import { staticRedirects } from "./src/lib/seo/redirects"`. Alternatively, use dynamic `await import(...)` inside the function.

**`getAllPropertySlugs` already exists (Story 4.1):** In `src/lib/db/queries/properties.ts`. Returns `string[]`. Do NOT recreate it.

**`getAllAgentSlugs` already exists (Story 4.3):** In `src/lib/db/queries/agents.ts`. Returns `Promise<string[]>`. Do NOT recreate it.

**Area queries do not yet exist:** `getAllAreaSlugs` is stubbed with an empty array in sitemap.ts. Epic 6 will implement area pages and add the real query.

### Story 4.3 Learnings Applied

**Agent profile page structure (Story 4.3):** The `src/app/[locale]/agents/[slug]/page.tsx` renders `AgentProfileHero` + `AgentListingsGrid` directly without a wrapper `<div>`. When adding JSON-LD scripts, wrap everything in a React Fragment (`<>...</>`).

**`AgentProfileHero` is already built (Story 4.3):** Do NOT modify it in this story. Story 4.3 explicitly deferred JSON-LD to Story 4.4. Only the page-level file (`page.tsx`) gets modified.

**Test baseline (Story 4.3):** Exact baseline count needs to be confirmed by running `npm test` before starting — the Story 4.3 PR may have added tests. The baseline from Story 4.3 completion is what the new tests must be additive to.

### WordPress Redirect Architecture Decision

**Why separate static vs. dynamic redirects:**
1. `next.config.ts` `redirects()` — static/pattern redirects, edge-level, no DB access, always < 10ms. Used for: known WP static pages, listing/agent index pages.
2. Middleware approach (future) — for `/property/:id` → `/en/property/:slug`, requires a `property_api_id_to_slug` lookup. Phase 1 defers this to a `/en/search?q=:id` redirect until the WP URL audit is complete and a mapping table is built.
3. **Risk R-001 mitigation (test-design-epic-4.md §R-001):** Before Story 4.4 ships, audit all WordPress URLs via WordPress export or Screaming Frog. The audit result populates `staticRedirects` with exact-path entries for high-value pages. The Playwright crawl test in `tests/e2e/seo-architecture.spec.ts` validates 0 broken redirects in the deployed environment.

### data-testid Contract (for E2E and DOM assertions)

```
data-testid="listing-jsonld"     — <script type="application/ld+json"> for RealEstateListing
data-testid="breadcrumb-jsonld"  — <script type="application/ld+json"> for BreadcrumbList
data-testid="agent-jsonld"       — <script type="application/ld+json"> for RealEstateAgent
```
These are the only new `data-testid` values added in this story. All other page elements keep existing testids.

### Performance Notes

**Sitemap performance:** `sitemap()` calls `getAllPropertySlugs()` and `getAllAgentSlugs()` in `Promise.all`. With ~500 properties and ~20 agents, this is < 100ms DB round trip. Sitemap is served as a static response (Next.js caches it at the CDN edge layer). No ISR needed for sitemap — it revalidates on next request after the sync pipeline finishes.

**JSON-LD size:** A single `RealEstateListing` JSON-LD object is < 2KB. Adding it as a `<script>` tag adds negligible page size. Google's rich results parser expects it in `<head>` — Next.js App Router places all `<script>` tags from page components in the body after `<main>`. This is acceptable per Google's spec (they scan the full DOM).

**Redirect performance (NFR26 < 50ms):** `next.config.ts` redirects are matched at the Vercel/Coolify edge proxy layer, before the Next.js Node.js process handles the request. Response time is typically 1-5ms — well within the 50ms budget. Middleware-based redirects (if implemented) add ~10-20ms due to Edge runtime overhead — still within budget.

### Test Infrastructure Notes

- New directory: `tests/unit/seo/` — must be created; vitest will auto-discover `.spec.ts` files in any subdirectory.
- `tests/unit/seo/` tests run in `node` environment (no JSX, no `jsdom`). Confirm vitest config at `vitest.config.mts` covers this glob — if it only covers `tests/unit/search/**`, `tests/unit/db/**`, `tests/unit/sync/**`, `tests/unit/listing/**`, add `tests/unit/seo/**`.
- **Check vitest config before assuming it auto-discovers:** `cat vitest.config.mts` — if it has explicit `include` globs, add `tests/unit/seo/**/*.spec.{ts,tsx}` to the list.
- E2E tests in `tests/e2e/seo-architecture.spec.ts` require a running dev server with seeded data (same as all other E2E tests).

---

## Story Context

**Architecture references:**
- [Source: architecture.md §9 SEO Architecture] — URL strategy, WP redirect map, JSON-LD table, sitemap strategy
- [Source: architecture.md §8 hreflang Implementation] — exact `generateAlternateLanguages()` function signature
- [Source: architecture.md §3 Directory Architecture] — `src/lib/seo/` directory, `src/app/sitemap.ts`
- [Source: epics.md §Story 4.4] — AR13 (WP redirects), AR14 (JSON-LD), AR15 (sitemaps), AR22 (hreflang), NFR26 (redirect < 50ms), NFR27 (sitemap freshness), NFR28 (Lighthouse ≥ 80), FR69 (full SEO architecture)
- [Source: test-design-epic-4.md §4.4 test cases] — 4.4-UNIT-001 through 4.4-UNIT-008, 4.4-E2E-001 through 4.4-E2E-006
- [Source: test-design-epic-4.md §Risks] — R-001 (redirect map), R-004 (JSON-LD), R-007 (hreflang), R-012 (sitemap staleness)
- [Source: 4-3-agent-profile-pages.md §Dev Notes] — Story 4.3 scope note: "Story 4.4 adds JSON-LD structured data for RealEstateAgent schema"
- [Source: 4-1-listing-detail-page-and-photo-gallery.md] — ISR pattern, generateMetadata pattern, property page structure

---

## ATDD Artifacts

- **Unit tests (JSON-LD):** `tests/unit/seo/structured-data.spec.ts`
- **Unit tests (metadata):** `tests/unit/seo/metadata.spec.ts`
- **Unit tests (redirects):** `tests/unit/seo/redirects.spec.ts`
- **E2E tests:** `tests/e2e/seo-architecture.spec.ts`
- **Lighthouse CI:** `.lighthouserc.js` + `.github/workflows/lighthouse.yml`

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **R-001** WordPress redirect map incomplete — old property URLs 404 instead of 301, destroying SEO equity | High (lead gen loss) | Phase 1: redirect WP property URLs to `/en/search`; WordPress URL audit required before 301 slug mapping; crawl test in E2E suite catches 0 broken redirects |
| **R-004** JSON-LD missing or malformed — Google demotes pages | Medium (organic traffic loss) | Unit tests validate all 4 generator functions; E2E asserts `<script type="application/ld+json">` present with correct `@type` |
| **R-007** hreflang tags wrong or missing — keyword cannibalization between EN and ES | Medium (SEO confusion) | Unit test `generateAlternateLanguages()` output; E2E asserts both hreflang tags in `<head>` on listing and agent pages |
| **R-012** Sitemap not regenerated after sync — new pages invisible to crawlers | Low (24h delay) | Sitemap function reads DB at request time; Next.js caches it but revalidates on next request after sync triggers `revalidateTag`; integration test calls `sitemap()` directly and asserts URLs |
| **next.config.ts path alias** — `import { staticRedirects } from "@/lib/seo/redirects"` fails at build time | High (build breaks) | Use `await import("./src/lib/seo/redirects")` inside `async redirects()` — dynamic import avoids alias resolution issues |
| **dangerouslySetInnerHTML XSS** — JSON.stringify of user-controlled data | Low (controlled data) | Only own DB data is serialized; no user-provided strings in JSON-LD generators; all fields are typed |

---

## Dev Agent Record

### Agent Model Used

(to be filled in by dev agent)

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-05-03: Story 4.4 created — SEO architecture & WordPress redirects
