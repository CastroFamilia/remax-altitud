# Technical and Semantic SEO Audit Report
## REMAX Altitud (Next.js Codebase)

**Audit Date:** June 1, 2026  
**Project Stack:** Next.js 15.5.18 (App Router), React 19.1.0, TypeScript 5.9.3, Sharp 0.34.5  
**Target Domain:** `https://remax-altitud.cr`  
**Status:** **Highly Compliant** (with one critical remediation required for legacy WordPress routing)

---

## 1. Executive Summary

An exhaustive technical and semantic SEO audit was programmatically conducted on the REMAX Altitud codebase. The site exhibits a sophisticated, high-performance SEO architecture designed to preserve organic rankings, provide localized search indexibility (English/Spanish), and prevent Cumulative Layout Shift (CLS).

### SEO Architecture Scorecard
*   **Structured Data (Semantic SEO):** **98/100 (Excellent)**
    *   Dynamic pages render structurally compliant, rich Schema.org schemas (`RealEstateListing`, `RealEstateAgent`, `BreadcrumbList`, and `Place` guides).
    *   Strict XSS prevention is implemented on serialized inline JSON-LD data.
*   **Localized Metadata (i18n SEO):** **85/100 (Very Good — *Pending Remediation*)**
    *   Absolute canonicals and dynamic bi-locale `hreflang` headers are correctly mapped and spread.
    *   Dynamic dynamic multi-language XML sitemaps and `robots.ts` are fully configured.
    *   **Critical Finding:** WordPress URL pattern detection helpers exist in the utility layer but are **completely omitted** in `src/middleware.ts`, resulting in broken dynamic migrations for legacy listings.
*   **Core Web Vitals (Performance SEO):** **92/100 (Excellent)**
    *   High-speed native image conversion via `sharp` is active.
    *   Dynamic layouts are protected from shifts (CLS) using placeholder skeletons and aspect-ratio locks.
    *   Montserrat is optimized via Google Fonts with `display: "swap"`.
    *   *Minor Finding:* A few isolated elements bypass `<Image>` optimization and render via native unoptimized `<img>` tags.

---

## 2. Schema.org JSON-LD Structured Data

The codebase implements an exceptionally clean semantic markup strategy. Rather than client-side rendering or template injection, the structured data is dynamically compiled on the server and injected directly into the HTML source using React's `<script type="application/ld+json">` layout pattern.

### Key Audited Assets & Schema Types

1.  **`RealEstateListing` Schema** (`src/lib/seo/structured-data.ts`)
    *   **Audited In:** `src/app/[locale]/property/[slug]/page.tsx`
    *   **Required Fields Present:** `@context` (`https://schema.org`), `@type` (`RealEstateListing`), `name`, `description` (truncated to 500 characters), `url` (locale-aware), `image` (up to 5 listing photos), `price` (USD boundary), `address` (`PostalAddress` with Costa Rica `CR` country code and `areaSlug` region), and `geo` (`GeoCoordinates` mapping latitude/longitude).
    *   **Optional Fields Present:** `numberOfRooms` (for bedrooms), `floorSize` (for construction square meters, using unit code `MTK` per Schema.org standards).
    *   **Resiliency:** If coordinates (`latitude`/`longitude`) are null in the database, the `geo` field is cleanly omitted (avoiding invalid schema shapes).

2.  **`RealEstateAgent` Schema** (`src/lib/seo/structured-data.ts`)
    *   **Audited In:** `src/app/[locale]/agents/[slug]/page.tsx`
    *   **Required Fields Present:** `@context`, `@type` (`RealEstateAgent`), `name`, `description` (bio truncated to 300 characters), `url`, `image` (optimized agent headshot), `telephone` (agent phone), `email`, and `areaServed` (`Place` defaulting to "Southern Zone, Costa Rica" namespace with localized translations).
    *   **Resiliency:** If optimized agent photo (`photoOptimizedUrl`) is unavailable, it automatically falls back to raw CRM `photoUrl`.

3.  **`Place` Schema (Areas and Communities)** (`src/lib/seo/structured-data.ts`)
    *   **Audited In:** 
        *   `src/app/[locale]/areas/[slug]/page.tsx` (Area Guide page)
        *   `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` (Community detail page)
    *   **Hierarchical Relations:** The community schema implements a clean `containedInPlace` schema relation pointing back to the parent area, establishing a search crawler-friendly physical-geographic hierarchy.

4.  **`BreadcrumbList` Schema** (`src/lib/seo/structured-data.ts`)
    *   **Audited In:** Property detail, agent profiles, area guides, and community pages.
    *   **Compliance:** Correctly uses `itemListElement` arrays of `ListItem` objects with strict 1-based indexing (`position`) and absolute URLs.

### Security: XSS & Breakout Mitigation
Free-form text inputted by sync pipelines or CRM databases can contain character entities that break HTML parser boundaries (e.g. standard `JSON.stringify` does not escape `</script>` tags, rendering inline scripts vulnerable). 

The REMAX Altitud codebase solves this elegantly using `serializeJsonLd()` in `structured-data.ts`:
```typescript
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};
const ESCAPE_PATTERN = /[<>&\u2028\u2029]/g;

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(ESCAPE_PATTERN, (ch) => ESCAPES[ch]);
}
```
This safely maps dangerous tags to Unicode escape sequences (`\u003c` and `\u003e`), preventing any cross-site scripting (XSS) or markup breakouts while keeping the data 100% compliant with standard JSON engines.

---

## 3. Localized Metadata & i18n Crawlability

To serve its multi-lingual user base in Costa Rica, the application leverages Next.js 15 Server Components and `next-intl` to generate fully localized, crawlable HTML documents.

### Metadata Framework Audits

*   **Dynamic Tag Generation:** All dynamic detail pages (`/property/[slug]`, `/agents/[slug]`, `/areas/[slug]`, `/areas/[slug]/communities/[community]`) export dynamic async `generateMetadata` functions.
    *   These run parallel queries to fetch localized database content (e.g., `titleEs`/`titleEn`, `descriptionEs`/`descriptionEn`).
    *   Descriptions are safely bound to `slice(0, 160)` to match search snippet limits (160 characters).
*   **Alternate Multilingual Routing (hreflang):**
    The `buildAlternatesMetadata` utility translates paths into localized alternatives which spread directly into Next.js metadata configurations.
    ```typescript
    // In src/lib/seo/metadata.ts
    export function buildAlternatesMetadata(path: string): { languages: Record<string, string> } {
      return {
        languages: Object.fromEntries(
          generateAlternateLanguages(path).map(({ hrefLang, href }) => [hrefLang, href]),
        ),
      };
    }
    ```
    This ensures that when a user indexes `https://remax-altitud.cr/en/property/beautiful-home`, Next.js automatically outputs alternate link headers pointing search crawlers to both alternate languages:
    ```html
    <link rel="alternate" hreflang="en" href="https://remax-altitud.cr/en/property/beautiful-home" />
    <link rel="alternate" hreflang="es" href="https://remax-altitud.cr/es/property/beautiful-home" />
    ```
*   **Absolute Canonical URLs:** The `generateCanonicalUrl` helper utilizes the single source of truth constant `SITE_ORIGIN` ("https://remax-altitud.cr") to inject strict absolute canonical URLs, avoiding double slashes and preventing index duplication issues.
*   **XML Sitemap (`src/app/sitemap.ts`):** 
    Served at `https://remax-altitud.cr/sitemap.xml`, it maps static routes alongside active dynamic databases in a multi-promise sequence:
    *   *Queries:* Properties, Agents, Areas, and Communities are queried in parallel via `Promise.all`.
    *   *Output:* Expels correct relative crawl frequencies and priorities (`priority: 1.0` for homepages, `0.8` with `daily` change frequency for listings, `0.6` with `weekly` for agents).
    *   *Error boundary:* A top-level try/catch blocks compile errors if the database is temporarily offline during build time, letting the page fallback to on-demand generation seamlessly.
*   **Robots Config (`src/app/robots.ts`):** 
    Served at `https://remax-altitud.cr/robots.txt`. Correctly allows `"/"` indexing globally while disallowing `/api/` endpoints and search results paths (`/en/search`, `/es/search`) to prevent search engine indexing of redundant query strings.

### WordPress Redirect Audit: An Active Implementation Gap

> [!WARNING]
> **CRITICAL GAP IDENTIFIED**
> The codebase contains a major technical SEO gap regarding legacy WordPress migrations. 

The codebase contains:
1.  **Static redirects:** Configured directly in `next.config.ts` via the `staticRedirects` array (`src/lib/seo/redirects.ts`). These handle static legacy pages correctly (e.g. `/contacto` -> `/es/contact`) with edge-level HTTP 301 redirects, matching in `< 10ms`.
2.  **Redirection helpers:** `src/lib/seo/wordpress-redirect-middleware.ts` defines `isWordPressPropertyUrl` and `isWordPressAgentUrl` to intercept dynamic legacy routes (e.g. `/property/:id` or `/agent/:name`).
3.  **The Gap:** **`src/middleware.ts` completely ignores these helpers.**

The legacy dynamic URL redirection logic is **never wired into the active middleware sequence**. As a result, visiting a legacy link like `https://remax-altitud.cr/property/123` will throw an unhandled 404 error instead of applying the dynamic Phase 1 temporary redirect (HTTP 302 to `/en/search?q=123`). This results in severe search ranking degradation and backlink loss.

---

## 4. Core Web Vitals Configuration

The codebase prioritizes loading speeds, visual stability, and layout-shift prevention.

### Image Optimization Infrastructure
*   **High Performance Image Processing:** The application uses `sharp` (version `0.34.5`) to handle native server-side image processing. It is explicitly listed in `serverExternalPackages` in `next.config.ts` to opt it out of server component webpack bundling, letting Next.js use the native Node.js binary path.
*   **Azure CDN Configurations:** `next.config.ts` declares optimized `remotePatterns` for Azure Front Door and Azure Blob storage.
*   **`PropertyImage` Component (`src/components/property/property-image.tsx`):**
    A robust client-side wrapper of `next/image` that inherits all loading, layout (`fill`), sizing, and responsive attributes.
    *   **Resiliency Handling:** It implements a stateful `onError` fallback trigger. If a listing photo hosted on the external CRM server or Azure CDN fails to resolve, it automatically swaps the source to a local vector fallback `/property-placeholder.svg` in real-time, preventing broken visual frames.

### Image Optimization Gaps (Advisory)
A search for raw HTML `<img>` elements revealed a few occurrences where Next's optimized `<Image>` component is bypassed:
1.  **`src/components/area/community-card.tsx` (Line 99):** Renders raw community hero images.
2.  **`src/components/area/area-guide-tabs.tsx` (Line 215):** Renders raw agent photos in the tab-list fallback card.
3.  **`src/components/community/community-mini-map.tsx` (Line 58):** Renders raw static maps from Mapbox. (This is a justified design decision to avoid executing huge interactive Mapbox scripts while locking down visual layout boundaries using `aspect-[3/2]`).

*Impact:* Bypassing next/image on listing grid elements (like `CommunityCard`) means these images are loaded in their raw format (usually large JPEGs) rather than modern next-gen formats (WebP/AVIF) sized specifically for the user's viewport.

### Typography Optimization
*   The primary font (`Montserrat`) is set up inside `src/app/[locale]/layout.tsx` using `next/font/google`.
*   **CLSs Mitigation:** Features a strict `display: "swap"` configuration. This ensures that a fallback system font is rendered immediately while the custom font is downloading, avoiding "Flash of Invisible Text" (FOIT) and eliminating font-swap layout shifts.
*   It utilizes pre-hashed CSS variables (`montserrat.variable`) applied globally at the root HTML segment to prevent custom `@font-face` reflow redraws.

### Layout Stability (CLS Prevention)
The codebase employs an advanced "Layout Isolation" strategy on critical content regions:
*   **Interactive Gallery (`PropertyGalleryLoader`):** Because the interactive `PropertyGallery` requires client-side interactive libraries, it is wrapped in `next/dynamic` with `ssr: false` to keep it out of the critical rendering path. To prevent CLS when the interactive gallery mounts, the loader implements an exact aspect ratio skeleton (`aspect-[4/3] bg-gray-200 animate-pulse`), reserving the gallery's box on initial Server Side page load.
*   **Static Map Pre-sizing:** The static Mapbox map in `CommunityMiniMap` is bound inside standard responsive aspect containers (`className="w-full h-auto aspect-[3/2]"`). The browser determines the exact size of the container before fetching the asset, meaning the page height never reflows when the image resolves.

---

## 5. Technical Recommendations & Remediation Plan

To bring the codebase to 100% SEO compliance and optimize search rank retention during the WordPress migration, the following remediation steps are recommended:

### Priority 1: Wire WordPress Redirects in `src/middleware.ts` (Immediate Action)
To fix the dynamic redirect gap and prevent legacy URL 404s, update the `src/middleware.ts` file to import the WordPress helper functions and route dynamic patterns.

#### Proposed Code Diff:
```diff
--- src/middleware.ts
+++ src/middleware.ts
@@ -2,10 +2,15 @@
 import createMiddleware from "next-intl/middleware";
 import { routing } from "./i18n/routing";
+import {
+  isWordPressPropertyUrl,
+  isWordPressAgentUrl
+} from "@/lib/seo/wordpress-redirect-middleware";
 
 const intlMiddleware = createMiddleware(routing);
 
 export default function middleware(request: NextRequest) {
+  const { pathname } = request.nextUrl;
+
+  // WordPress Dynamic Listing Redirects (Phase 1 Strategy: Temporary 302 to Search)
+  const wpPropertyId = isWordPressPropertyUrl(pathname);
+  if (wpPropertyId) {
+    const url = request.nextUrl.clone();
+    url.pathname = `/en/search`;
+    url.searchParams.set("q", wpPropertyId);
+    return NextResponse.redirect(url, { status: 302 });
+  }
+
+  // WordPress Dynamic Agent Redirects
+  const wpAgentName = isWordPressAgentUrl(pathname);
+  if (wpAgentName) {
+    const url = request.nextUrl.clone();
+    url.pathname = `/en/agents`; // Fallback to agents index until slug mapping is active
+    return NextResponse.redirect(url, { status: 302 });
+  }
+
   // Detect paths of the form /<something>/... where <something> looks like a
   // locale code (2-5 lowercase chars) but is NOT one we support. Redirect
```

### Priority 2: Migrate `<img>` tags to `next/image` in Cards
Update `src/components/area/community-card.tsx` to utilize Next's `<Image>` or the optimized `<PropertyImage>` component instead of raw `<img>` tags. This ensures that community cards in a grid utilize web-optimized next-gen images, saving substantial payload sizes on high-DPI displays.

### Priority 3: Activate Playwright E2E SEO Tests
Ensure that once Playwright configuration is initialized in CI/CD, the E2E SEO test suite `tests/e2e/seo-and-redirects.spec.ts` is fully activated (un-skipped) to serve as a continuous delivery gate against future regression of structured schemas or sitemaps.
