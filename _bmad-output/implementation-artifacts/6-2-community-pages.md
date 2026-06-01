# Story 6.2: Community Pages

**Status:** ready-for-dev
**GH Issue:** #102
**Epic:** 6 — Community Pages & Area Guides
**Story Key:** 6-2-community-pages
**Created:** 2026-05-27

---

## Story

As a **visitor**,
I want to explore curated community developments with quick facts, availability status, and filtered properties,
So that I can evaluate premium developments and check which lots/homes are available.

---

## Acceptance Criteria

1. **Given** a community page (e.g., `/{locale}/areas/perez-zeledon/communities/rise`) **When** loaded **Then** it renders: hero image with community name + area name (h1), tagline, and price range ("Homes from $180K–$650K") (UX-DR14). `data-testid="community-hero"` on the hero section.

2. **Given** the community quick facts section **When** rendered **Then** an icon grid displays: 📍 Elevation, ✈ Distance to airport, 🌐 Internet/infrastructure, 🏊 Amenities, 🏗 Developer name, 📅 Established year (UX-DR14). `data-testid="community-quick-facts"` on the section.

3. **Given** the community description **When** rendered **Then** 300-500 words of SEO content (developer story, lifestyle, environment) is **always visible** (not tabbed), similar to the area guide description pattern from Story 6.1. The description MUST be in the initial SSG HTML output, not client-rendered. `data-testid="community-description"` on the section.

4. **Given** the "Available Properties" tab **When** selected **Then** a filtered property grid shows only properties tagged to this community via `community_id`. On mobile, it displays as a sortable list with status indicators: ✅ Available, ❌ Sold, 🟡 Reserved (FR21, UX-DR14). `data-testid="community-properties-tab"` on the tab panel. `data-testid="lot-status-available"`, `data-testid="lot-status-sold"`, `data-testid="lot-status-reserved"` on the respective status indicators.

5. **Given** a desktop viewport **When** the "Site Map" tab is visible **Then** it shows a zoomable master plan/site map image. On mobile (< 768px), this tab is hidden — replaced by the sortable lot list in the Properties tab (UX-DR14). `data-testid="community-sitemap-tab"` on the tab panel.

6. **Given** the "Similar Communities" section **When** rendered below the tabs **Then** a SimilarCommunitiesSlider shows nearby community cards (always visible, not tabbed) (UX-DR14). `data-testid="community-similar-slider"` on the slider.

7. **Given** a community card on any page (homepage, area guide) **When** rendered **Then** it uses a gold border (`--color-gold` #C2A661) to visually differentiate curated communities from standard area cards (UX-DR33). `data-testid="community-card"` on the card. **NOTE:** The `CommunityCard` component already exists in `src/components/area/community-card.tsx` with gold border styling — extend it to link to `/{locale}/areas/{area}/communities/{slug}` with real DB data.

8. **Given** the "Featured Communities" section on the homepage **When** rendered **Then** 2-3 community hero-scale cards appear with gold borders, each showing: hero photo, name, tagline, price range, listing count, and link to the community page (FR19). `data-testid="featured-communities"` on the section. **NOTE:** Replace the existing `FeaturedCommunitiesShell` in `src/components/home/homepage-sections.tsx` with real data from the `communities` table.

9. **And** community pages use **SSG + ISR** (revalidated on-demand after sync) since property availability changes daily. Architecture spec line 124: `SSG + ISR | On-demand (after sync) | Edge`.

10. **And** a community index page (`/{locale}/communities`) lists all communities with hero cards. `data-testid="community-index-card"` on each card.

11. **And** all content displays in the selected locale (EN/ES) via `next-intl`.

12. **And** JSON-LD structured data for Place schema is present using the existing `generatePlaceJsonLd` pattern — create a `generateCommunityJsonLd` function that returns a Place schema with the community's geo coordinates and area context.

13. **And** Breadcrumb structured data follows the hierarchy: Home → Areas → {Area Name} → {Community Name}

14. **Given** a community page with zero properties **When** the Properties tab is viewed **Then** a localized empty state message is shown (e.g., "No properties currently listed in this community").

15. **Given** a community without a hero image **When** the page loads **Then** a gradient placeholder (navy-to-gold) is used instead of a broken image — same pattern as Story 6.1's AreaGuideHero but using `--color-gold` instead of `--color-cream`.

16. **Given** the community page tabs **When** navigated via keyboard **Then** tab panels follow WAI-ARIA Tabs pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, and arrow-key navigation between tabs. Follow the exact same pattern as `AreaGuideTabs` from Story 6.1.

---

## Tasks / Subtasks

- [ ] Task 1: Create communities DB schema and migration (AC: #1–#10)
  - [ ] 1.1 Create `src/lib/db/schema/communities.ts` with columns matching architecture spec §4 COMMUNITIES entity: `id`, `slug`, `area_id` (FK → areas), `name`, `tagline_en`, `tagline_es`, `description_en`, `description_es`, `hero_image_url`, `geo_fence` (geography Polygon 4326 — placeholder, Story 6.5 implements matching), `price_min_usd`, `price_max_usd`, `listing_count`, `quick_facts` (jsonb), `site_map_image_url` (nullable), `created_at`, `updated_at`
  - [ ] 1.2 Export the `communities` table and types (`Community`, `NewCommunity`) from the schema file
  - [ ] 1.3 Add `export * from "./communities";` to `src/lib/db/schema/index.ts`
  - [ ] 1.4 Add communities relation to `src/lib/db/schema/relations.ts`: `communitiesRelations` with `one(areas)` and `many(properties)`, plus update `areasRelations` to include `many(communities)` and `propertiesRelations` to include `one(communities)`
  - [ ] 1.5 Add FK reference for `properties.communityId` → `communities.id` in properties schema (currently a bare `uuid` column with no reference)
  - [ ] 1.6 Create Drizzle migration: `npx drizzle-kit generate` → verify SQL, then `npx drizzle-kit push` (or migration script)
  - [ ] 1.7 Create seed data: At least 3 communities (e.g., RISE, Santa Elena Hills, Serena del Mar) with complete `quick_facts` JSONB, taglines, and descriptions in EN/ES

- [ ] Task 2: Create community query functions (AC: #1, #4, #6, #8, #10)
  - [ ] 2.1 Create `src/lib/db/queries/communities.ts` with `import "server-only"` guard
  - [ ] 2.2 `getAllCommunities()` — returns all communities ordered by name, used by community index page and `generateStaticParams`
  - [ ] 2.3 `getCommunityBySlugAndArea(communitySlug: string, areaSlug: string)` — joins communities with areas to validate area-community relationship; returns null if not found
  - [ ] 2.4 `getAllCommunityParams()` — returns `{ slug: string; community: string }[]` for `generateStaticParams` on the community page route
  - [ ] 2.5 `getPropertiesByCommunityId(communityId: string)` — filters `properties` table by `community_id` + `is_visible = true`; returns `PropertySearchItem[]` using `propertySearchColumns` and `mapPropertyRowToSearchItem` (same pattern as `getPropertiesByAreaSlug` in `areas.ts`)
  - [ ] 2.6 `getSimilarCommunities(areaId: string, excludeSlug: string)` — returns communities in the same area, excluding current community, ordered by name
  - [ ] 2.7 `getFeaturedCommunities(limit?: number)` — returns communities with `listing_count > 0`, ordered by listing count DESC, limited to 3 for homepage
  - [ ] 2.8 `getCommunitiesByAreaId(areaId: string)` — returns communities belonging to an area, used by area guide page to populate community cards with real data

- [ ] Task 3: Create community page route (AC: #1, #2, #3, #9, #11, #12, #13)
  - [ ] 3.1 Create `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` — SSG + ISR page
  - [ ] 3.2 Implement `generateStaticParams()` returning all `{ slug, community }` pairs from `getAllCommunityParams()`. Wrap in try/catch like the area guide page.
  - [ ] 3.3 Implement `generateMetadata()` with localized title/description, `alternates` using `buildAlternatesMetadata`, and OpenGraph tags. Title format: `"{Community} — {Area} | REMAX Altitud"`
  - [ ] 3.4 Set ISR revalidation: `export const revalidate = 3600` (1 hour fallback, but primarily relies on on-demand revalidation via `revalidateTag('communities')` from sync pipeline)
  - [ ] 3.5 Render hero, quick facts, description (always visible — Server Component), tabbed sections (Properties, Site Map), and SimilarCommunitiesSlider
  - [ ] 3.6 Inject JSON-LD `<script>` using new `generateCommunityJsonLd` + `serializeJsonLd` from `src/lib/seo/structured-data.ts`
  - [ ] 3.7 Inject Breadcrumb JSON-LD: Home → Areas → {Area Name} → {Community Name}

- [ ] Task 4: Create community page components (AC: #1, #2, #3, #4, #5, #6, #14, #15, #16)
  - [ ] 4.1 Create `src/components/community/community-hero.tsx` — **Server Component**: hero image (or gradient fallback per AC #15), h1 with community + area name, tagline, price range badge. Follow `AreaGuideHero` pattern. Gradient fallback uses `--color-navy` to `--color-gold`.
  - [ ] 4.2 Create `src/components/community/community-quick-facts.tsx` — **Server Component**: icon grid with 6 facts from `quick_facts` JSONB. Each fact has emoji icon + label + value. Handle missing fields gracefully (render only facts with data).
  - [ ] 4.3 Create `src/components/community/community-description.tsx` — **Server Component**: SEO description text (always visible, not tabbed). Must be in initial DOM. Follow `AreaGuideDescription` pattern exactly.
  - [ ] 4.4 Create `src/components/community/community-tabs.tsx` — **Client Component**: tab navigation for Properties and Site Map (desktop only). Follow `AreaGuideTabs` WAI-ARIA pattern. Properties tab renders `PropertyCard` grid filtered to community. Site Map tab renders zoomable image or empty state.
  - [ ] 4.5 Create `src/components/community/lot-status-indicator.tsx` — **Server Component**: renders ✅/❌/🟡 status icon + label based on property status field. Used in mobile lot list view.
  - [ ] 4.6 Create `src/components/community/community-lot-list.tsx` — **Client Component**: sortable list of properties with status indicators. Visible on mobile (< 768px) as alternative to Site Map tab. Sort options: status, price ASC/DESC.
  - [ ] 4.7 Create `src/components/community/similar-communities-slider.tsx` — **Client Component**: horizontal card slider showing nearby community cards. Follow `SimilarAreasSlider` pattern from Story 6.1. Uses `CommunityCard` from `src/components/area/community-card.tsx`.

- [ ] Task 5: Update existing CommunityCard for real data (AC: #7, #8)
  - [ ] 5.1 Update `src/components/area/community-card.tsx` props to accept full `Community` type data: add `priceMin`, `priceMax`, `listingCount` props alongside existing `name`, `tagline`, `heroImageUrl`, `href`
  - [ ] 5.2 Render price range ("Homes from $X–$Y") and listing count ("N homes available") on the card
  - [ ] 5.3 Ensure `href` links to `/{locale}/areas/{area-slug}/communities/{community-slug}` using real area slug from community's area relation

- [ ] Task 6: Create community index page (AC: #10)
  - [ ] 6.1 Create `src/app/[locale]/communities/page.tsx` — SSG + ISR page listing all communities
  - [ ] 6.2 Implement `generateMetadata()` with localized title/description
  - [ ] 6.3 Render community cards in a responsive grid (3 col desktop, 2 col tablet, 1 col mobile)
  - [ ] 6.4 Each card uses `CommunityCard` with `data-testid="community-index-card"`

- [ ] Task 7: Update homepage Featured Communities section (AC: #8)
  - [ ] 7.1 Create `src/components/home/featured-communities.tsx` — **Server Component** replacing the shell `FeaturedCommunitiesShell`
  - [ ] 7.2 Query `getFeaturedCommunities(3)` and render real `CommunityCard` components with gold borders
  - [ ] 7.3 Update `src/app/[locale]/page.tsx` (homepage) to import and render `FeaturedCommunities` instead of `FeaturedCommunitiesShell`
  - [ ] 7.4 Add `data-testid="featured-communities"` on the section wrapper

- [ ] Task 8: Update area guide page to show real community data (AC: #7)
  - [ ] 8.1 Update `src/app/[locale]/areas/[slug]/page.tsx` to query `getCommunitiesByAreaId(area.id)` and pass community data to the page
  - [ ] 8.2 Replace the `{/* Communities — populated in Story 6.2 */}` comment (line 106) with actual `CommunityCard` components linked to community pages

- [ ] Task 9: Add JSON-LD structured data (AC: #12, #13)
  - [ ] 9.1 Add `generateCommunityJsonLd(community, area, locale)` function to `src/lib/seo/structured-data.ts` — returns Place schema with community name, description, geo coordinates, and containedInPlace (area)
  - [ ] 9.2 Use existing `generateBreadcrumbJsonLd` for community pages: Home → Areas → {Area Name} → {Community Name}

- [ ] Task 10: Add i18n strings (AC: #11)
  - [ ] 10.1 Add `CommunityPage` namespace to `src/messages/en.json`
  - [ ] 10.2 Add `CommunityPage` namespace to `src/messages/es.json`
  - [ ] 10.3 Keys needed: `meta.title`, `meta.description`, `meta.ogTitle`, `meta.ogDescription`, `tabs.properties`, `tabs.siteMap`, `hero.priceRange`, `hero.homesFrom`, `quickFacts.heading`, `quickFacts.elevation`, `quickFacts.airport`, `quickFacts.internet`, `quickFacts.amenities`, `quickFacts.developer`, `quickFacts.established`, `description.heading`, `noProperties`, `lotStatus.available`, `lotStatus.sold`, `lotStatus.reserved`, `similarCommunities.heading`, `index.title`, `index.description`, `index.meta.title`, `index.meta.description`

- [ ] Task 11: Update sitemap generation (AC: #9)
  - [ ] 11.1 Update `src/app/sitemap.ts` to include community page URLs — replace the stubbed comment (line 56) with real queries to `getAllCommunityParams()`

---

## Dev Notes

### Rendering Strategy

Community pages use **SSG + ISR** — unlike area guides which are pure SSG. The architecture spec (line 124) defines:
> Community pages (`/areas/[area]/communities/[slug]`) | SSG + ISR | On-demand (after sync) | Edge | Property availability changes daily

This means you MUST export a `revalidate` constant:
```typescript
// src/app/[locale]/areas/[slug]/communities/[community]/page.tsx
export const revalidate = 3600; // 1 hour fallback; on-demand via revalidateTag('communities')
```

The sync pipeline already calls `revalidateTag('communities')` in Step 8 (architecture §5, line 683). ISR on-demand revalidation is the primary mechanism; the 3600s fallback is a safety net.

### Critical: Description Visibility for SEO

Like Story 6.1 (Risk R-003), the community description MUST be rendered in the initial server HTML, not behind a tab. This is the same pattern: use a **Server Component** that renders directly in the page — no `use client`, no `useState`, no tab gating.

**Test verification:** Fetch the raw HTML of the community page (no JS execution); assert the description text is present in the response body.

### Page Component Pattern

Follow `src/app/[locale]/areas/[slug]/page.tsx` (Story 6.1) as the template:

```typescript
// src/app/[locale]/areas/[slug]/communities/[community]/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getCommunityBySlugAndArea, getAllCommunityParams, getPropertiesByCommunityId, getSimilarCommunities } from '@/lib/db/queries/communities';
import { getAreaBySlug } from '@/lib/db/queries/areas';
import { generateCommunityJsonLd, generateBreadcrumbJsonLd, serializeJsonLd } from '@/lib/seo/structured-data';
import { buildAlternatesMetadata } from '@/lib/seo/metadata';
import { CommunityHero } from '@/components/community/community-hero';
import { CommunityQuickFacts } from '@/components/community/community-quick-facts';
import { CommunityDescription } from '@/components/community/community-description';
import { CommunityTabs } from '@/components/community/community-tabs';
import { SimilarCommunitiesSlider } from '@/components/community/similar-communities-slider';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return await getAllCommunityParams();
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string; community: string }> }): Promise<Metadata> {
  const { locale, slug, community: communitySlug } = await params;
  const community = await getCommunityBySlugAndArea(communitySlug, slug);
  if (!community) return {};
  const t = await getTranslations({ locale, namespace: 'CommunityPage' });
  return {
    title: t('meta.title', { community: community.name }),
    description: t('meta.description', { community: community.name }),
    alternates: { ...buildAlternatesMetadata(`/areas/${slug}/communities/${communitySlug}`) },
    openGraph: {
      title: t('meta.ogTitle', { community: community.name }),
      description: t('meta.ogDescription', { community: community.name }),
    },
  };
}

export default async function CommunityPage({ params }: { params: Promise<{ locale: string; slug: string; community: string }> }) {
  const { locale, slug, community: communitySlug } = await params;
  setRequestLocale(locale);

  const [area, community] = await Promise.all([
    getAreaBySlug(slug),
    getCommunityBySlugAndArea(communitySlug, slug),
  ]);
  if (!area || !community) notFound();

  const t = await getTranslations({ locale, namespace: 'CommunityPage' });

  const [communityProperties, similarCommunities] = await Promise.all([
    getPropertiesByCommunityId(community.id),
    getSimilarCommunities(community.areaId, communitySlug),
  ]);

  const areaName = locale === 'es' ? area.nameEs : area.nameEn;
  const communityJsonLd = generateCommunityJsonLd(community, area, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: locale === 'es' ? 'Inicio' : 'Home', href: `/${locale}`, position: 1 },
    { name: locale === 'es' ? 'Áreas' : 'Areas', href: `/${locale}/areas`, position: 2 },
    { name: areaName, href: `/${locale}/areas/${slug}`, position: 3 },
    { name: community.name, href: `/${locale}/areas/${slug}/communities/${communitySlug}`, position: 4 },
  ]);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(communityJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }} />
      <CommunityHero community={community} areaName={areaName} locale={locale} />
      <CommunityQuickFacts community={community} locale={locale} />
      <CommunityDescription community={community} locale={locale} />
      <CommunityTabs
        properties={communityProperties}
        community={community}
        locale={locale}
      />
      <SimilarCommunitiesSlider
        communities={similarCommunities}
        locale={locale}
        areaSlug={slug}
      />
    </main>
  );
}
```

### Communities Schema

Create `src/lib/db/schema/communities.ts` mirroring the architecture spec §4 COMMUNITIES entity and following the exact patterns from `src/lib/db/schema/areas.ts`:

```typescript
import { sql } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { areas } from "./areas";

/** Curated community developments (RISE, Santa Elena Hills, etc.) */
export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  areaId: uuid("area_id")
    .notNull()
    .references(() => areas.id),
  name: text("name").notNull(),
  taglineEn: text("tagline_en").notNull().default(""),
  taglineEs: text("tagline_es").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionEs: text("description_es").notNull().default(""),
  heroImageUrl: text("hero_image_url"),
  // geo_fence — Polygon 4326 for geo-fence matching (Story 6.5)
  // Placeholder: null until geo-fence data is populated
  // geoFence: geography("geo_fence", { type: "Polygon", srid: 4326 }),
  priceMinUsd: integer("price_min_usd"),
  priceMaxUsd: integer("price_max_usd"),
  listingCount: integer("listing_count").notNull().default(0),
  quickFacts: jsonb("quick_facts")
    .notNull()
    .default(sql`'{}'::jsonb`),
  siteMapImageUrl: text("site_map_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Community = typeof communities.$inferSelect;
export type NewCommunity = typeof communities.$inferInsert;
```

**NOTE on `geo_fence`:** The PostGIS geography column for the geo-fence polygon is deferred to Story 6.5 (Community Geo-Fence Auto-Tagging). For Story 6.2, the community table does NOT include the `geo_fence` column — properties are manually tagged with `community_id` via seed data. The column can be added via a Drizzle migration in Story 6.5.

### `quick_facts` JSONB Structure

The `quick_facts` JSONB column should follow this shape:

```typescript
interface CommunityQuickFacts {
  elevation?: string;       // e.g., "1,200m"
  airportDistance?: string;  // e.g., "2.5 hours to SJO"
  internet?: string;        // e.g., "Fiber optic available"
  amenities?: string;       // e.g., "Pool, Gym, Trails"
  developer?: string;       // e.g., "EcoVillas CR"
  established?: string;     // e.g., "2023"
}
```

### Database Query Pattern

Create `src/lib/db/queries/communities.ts` following the same patterns as `src/lib/db/queries/areas.ts`:

```typescript
import "server-only";
import { and, asc, desc, eq, gt, not } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { communities } from "@/lib/db/schema/communities";
import { areas } from "@/lib/db/schema/areas";
import { properties } from "@/lib/db/schema/properties";
import { propertySearchColumns, mapPropertyRowToSearchItem } from "./properties";
import type { PropertySearchItem } from "@/types/search";

export async function getAllCommunities() {
  return db.select().from(communities).orderBy(asc(communities.name));
}

export async function getCommunityBySlugAndArea(communitySlug: string, areaSlug: string) {
  const rows = await db
    .select()
    .from(communities)
    .innerJoin(areas, eq(communities.areaId, areas.id))
    .where(and(eq(communities.slug, communitySlug), eq(areas.slug, areaSlug)))
    .limit(1);
  return rows[0]?.communities ?? null;
}

export async function getAllCommunityParams() {
  const rows = await db
    .select({ community: communities.slug, slug: areas.slug })
    .from(communities)
    .innerJoin(areas, eq(communities.areaId, areas.id));
  return rows;
}

export async function getPropertiesByCommunityId(communityId: string): Promise<PropertySearchItem[]> {
  const rows = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(and(eq(properties.communityId, communityId), eq(properties.isVisible, true)))
    .orderBy(desc(properties.syncedAt));
  return rows.map(mapPropertyRowToSearchItem);
}

export async function getSimilarCommunities(areaId: string, excludeSlug: string) {
  return db
    .select()
    .from(communities)
    .where(and(eq(communities.areaId, areaId), not(eq(communities.slug, excludeSlug))))
    .orderBy(asc(communities.name));
}

export async function getFeaturedCommunities(limit = 3) {
  return db
    .select()
    .from(communities)
    .where(gt(communities.listingCount, 0))
    .orderBy(desc(communities.listingCount))
    .limit(limit);
}

export async function getCommunitiesByAreaId(areaId: string) {
  return db
    .select()
    .from(communities)
    .where(eq(communities.areaId, areaId))
    .orderBy(asc(communities.name));
}
```

### Existing Components — REUSE, DO NOT RECREATE

| Component | Location | Usage in 6.2 |
|-----------|----------|-------------|
| `PropertyCard` | `src/components/property/property-card.tsx` | Properties tab grid |
| `CommunityCard` | `src/components/area/community-card.tsx` | Community index, similar slider, area guide, homepage featured |
| `generateBreadcrumbJsonLd` | `src/lib/seo/structured-data.ts` | Breadcrumb structured data |
| `serializeJsonLd` | `src/lib/seo/structured-data.ts` | Safe JSON-LD serialization |
| `buildAlternatesMetadata` | `src/lib/seo/metadata.ts` | hreflang alternates |
| `mapPropertyRowToSearchItem` | `src/lib/db/queries/properties.ts` | DB row → PropertySearchItem |
| `propertySearchColumns` | `src/lib/db/queries/properties.ts` | Standard search column set |

### Lot Status Indicator Logic

The property `status` field determines the lot status indicator:

| Status Value | Icon | Label (EN) | Label (ES) | `data-testid` |
|-------------|------|-----------|-----------|--------------|
| `"active"` | ✅ | Available | Disponible | `lot-status-available` |
| `"sold"` | ❌ | Sold | Vendido | `lot-status-sold` |
| `"reserved"` | 🟡 | Reserved | Reservado | `lot-status-reserved` |

If a property's `isVisible` is `false`, it should be treated as "Sold" for display purposes.

### Site Map Tab — Desktop Only

The Site Map tab renders a zoomable master plan image from `community.siteMapImageUrl`. On mobile (< 768px), the tab is completely hidden using CSS `hidden md:block` or equivalent Tailwind classes. The mobile lot list in the Properties tab serves the same purpose.

If `siteMapImageUrl` is null, show an empty state: "Site map coming soon" / "Mapa del sitio próximamente".

### Styling Requirements

Follow the same design system tokens from Story 6.1:

- **Font**: Montserrat (via `next/font`) — weights 400, 600, 700, 800
- **Hero overlay**: Dark overlay on photography + white text (`--color-text-on-dark`)
- **Hero gradient fallback**: `--color-navy` (#000E35) → `--color-gold` (#C2A661) when `heroImageUrl` is null
- **Gold border on community cards**: `--color-gold` (#C2A661) — 2px solid (already implemented in `community-card.tsx`)
- **Card styling**: `--color-bg-white`, `--shadow-sm` resting, `--shadow-lg` on hover, `--radius-lg` (12px)
- **Tab styling**: Active tab indicator uses `--color-primary` (#000E35)
- **Quick facts icons**: Use emoji icons (📍, ✈, 🌐, 🏊, 🏗, 📅) — no external icon library needed
- **Spacing**: Follow 4px base grid (`--space-*` tokens)
- **Touch targets**: Minimum 44×44px for all interactive elements
- **Price range badge**: Display as `"Homes from $180K–$650K"` using formatted `priceMinUsd`/`priceMaxUsd`

### Accessibility Requirements

- Tab component MUST follow WAI-ARIA Tabs pattern (same as Story 6.1 `AreaGuideTabs`)
- Hero section: `<h1>` is the community name — do NOT nest inside another heading
- Images: All `<Image>` elements have descriptive `alt` text using community name
- Lot status indicators: Use emoji + text label (color is NOT the sole indicator)
- Skip link: Existing site skip-to-content link covers the community page

### Relations Update

Update `src/lib/db/schema/relations.ts` to include communities:

```typescript
import { communities } from "./communities";

// Add to existing file:
export const communitiesRelations = relations(communities, ({ one, many }) => ({
  area: one(areas, { fields: [communities.areaId], references: [areas.id] }),
  properties: many(properties),
}));

// Update areasRelations:
export const areasRelations = relations(areas, ({ many }) => ({
  properties: many(properties),
  communities: many(communities),
}));

// Update propertiesRelations to include community:
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  office: one(offices, { fields: [properties.officeId], references: [offices.id] }),
  area: one(areas, { fields: [properties.areaId], references: [areas.id] }),
  agent: one(agents, { fields: [agents.officeId], references: [agents.id] }),
  community: one(communities, { fields: [properties.communityId], references: [communities.id] }),
  leads: many(leads),
}));
```

### Properties Schema Update

The `properties.communityId` column exists (line 44 of `properties.ts`) but currently has NO FK reference to the communities table. Once the communities schema exists, add the reference:

```typescript
communityId: uuid("community_id").references(() => communities.id, { onDelete: "set null" }),
```

**IMPORTANT:** This creates a circular import risk. The `communities.ts` imports `areas` (for FK), and `properties.ts` would import `communities`. To avoid this, keep the FK reference as a plain `uuid("community_id")` (as it is now) and manage the relationship solely through the `relations.ts` file. The Drizzle query builder does not require the FK reference to perform joins.

### Testing Strategy

**Required `data-testid` attributes** (from test design `test-design-epic-6.md`):

| Attribute | Component |
|-----------|-----------|
| `data-testid="community-hero"` | CommunityHero |
| `data-testid="community-quick-facts"` | CommunityQuickFacts |
| `data-testid="community-description"` | CommunityDescription |
| `data-testid="community-properties-tab"` | Properties tab panel |
| `data-testid="community-sitemap-tab"` | Site Map tab panel |
| `data-testid="community-similar-slider"` | SimilarCommunitiesSlider |
| `data-testid="community-card"` | CommunityCard (already present) |
| `data-testid="featured-communities"` | FeaturedCommunities (homepage) |
| `data-testid="community-index-card"` | Community index page cards |
| `data-testid="lot-status-available"` | LotStatusIndicator (available) |
| `data-testid="lot-status-sold"` | LotStatusIndicator (sold) |
| `data-testid="lot-status-reserved"` | LotStatusIndicator (reserved) |

**Key test scenarios from test design (Story 6.2):**

| Test ID | Priority | Description |
|---------|----------|-------------|
| 6.2-E2E-001 | P0 | Community page renders filtered property grid with correct property count |
| 6.2-E2E-002 | P0 | Community page renders hero, tagline, price range, quick facts, and description |
| 6.2-INT-001 | P0 | `generateStaticParams()` returns all community slugs for SSG path generation |
| 6.2-E2E-003 | P0 | Community page returns 200 (not 404) on cold cache access |
| 6.2-E2E-004 | P0 | Featured Communities on homepage renders 2-3 gold-bordered cards |
| 6.2-COMP-001 | P1 | Quick facts icon grid renders all required fields |
| 6.2-COMP-002 | P1 | Lot status indicators render correct icons and labels |
| 6.2-E2E-005 | P1 | Community description always visible (not tabbed) for SEO |
| 6.2-E2E-006 | P1 | Community index page lists all communities |
| 6.2-E2E-007 | P1 | Desktop: Site Map tab visible and shows image |
| 6.2-E2E-008 | P1 | Mobile: Site Map tab hidden; sortable lot list visible |
| 6.2-COMP-003 | P1 | SimilarCommunitiesSlider renders nearby community cards |

### Project Structure Notes

New files to create:
```
src/
├── app/[locale]/
│   ├── areas/[slug]/communities/[community]/
│   │   └── page.tsx                              # Community page (SSG + ISR)
│   └── communities/
│       └── page.tsx                              # Community index (SSG + ISR)
├── components/community/
│   ├── community-hero.tsx                        # Server Component
│   ├── community-quick-facts.tsx                 # Server Component
│   ├── community-description.tsx                 # Server Component
│   ├── community-tabs.tsx                        # Client Component (tab state)
│   ├── lot-status-indicator.tsx                  # Server Component
│   ├── community-lot-list.tsx                    # Client Component (sort state)
│   └── similar-communities-slider.tsx            # Client Component (carousel)
├── components/home/
│   └── featured-communities.tsx                  # Server Component (replaces shell)
└── lib/db/
    ├── schema/
    │   └── communities.ts                        # Drizzle schema
    └── queries/
        └── communities.ts                        # Query functions
```

Files to modify:
```
src/lib/db/schema/index.ts              — Add communities export
src/lib/db/schema/relations.ts          — Add communities relations
src/lib/seo/structured-data.ts          — Add generateCommunityJsonLd
src/app/[locale]/areas/[slug]/page.tsx  — Add community cards with real data
src/app/[locale]/page.tsx               — Replace FeaturedCommunitiesShell
src/app/sitemap.ts                      — Add community URLs
src/components/area/community-card.tsx  — Extend props for price/count
src/messages/en.json                    — Add CommunityPage namespace
src/messages/es.json                    — Add CommunityPage namespace
```

### Do NOT Modify

- `src/components/property/property-card.tsx` — reuse as-is
- `src/lib/seo/metadata.ts` — reuse `buildAlternatesMetadata` as-is
- `src/lib/db/queries/properties.ts` — reuse `propertySearchColumns` and `mapPropertyRowToSearchItem` as-is (already exported by Story 6.1)
- Any existing `data-testid` values from Epics 1–5 and Story 6.1

### References

- [Source: _bmad-output/planning-artifacts/epics.md#L1763-1807](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L1763-L1807) — Story 6.2 requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#L124](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L124) — SSG + ISR rendering strategy for community pages
- [Source: _bmad-output/planning-artifacts/architecture.md#L166-168](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L166-L168) — Directory structure for community routes
- [Source: _bmad-output/planning-artifacts/architecture.md#L262-265](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L262-L265) — Community component directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#L478-496](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L478-L496) — COMMUNITIES entity definition
- [Source: _bmad-output/planning-artifacts/architecture.md#L558](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L558) — Community property index
- [Source: _bmad-output/planning-artifacts/architecture.md#L683](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L683) — revalidateTag('communities') in sync pipeline
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L1263-1282](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/ux-design-specification.md#L1263-L1282) — Community page UX composition "Curated Development"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L1176](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/ux-design-specification.md#L1176) — Featured communities homepage section
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L1584-1624](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/ux-design-specification.md#L1584-L1624) — Journey 5: Community Discovery Flow
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L2421](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/ux-design-specification.md#L2421) — Community page responsive breakpoints
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L87-114](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L87-L114) — Required data-testid contracts for Story 6.2
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L128-129](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L128-L129) — Risks R-004 (empty community) and R-005 (SSG paths)
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L208-214](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L208-L214) — P0 test scenarios for Story 6.2
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L232-238](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L232-L238) — P1 test scenarios for Story 6.2
- [Source: _bmad-output/implementation-artifacts/6-1-area-guide-pages.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/implementation-artifacts/6-1-area-guide-pages.md) — Story 6.1 patterns (SSG page, hero, description, tabs, similar slider)
- [Source: src/app/[locale]/areas/[slug]/page.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/%5Blocale%5D/areas/%5Bslug%5D/page.tsx) — Implemented area guide page to follow
- [Source: src/components/area/community-card.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/components/area/community-card.tsx) — Existing CommunityCard component to extend
- [Source: src/components/home/homepage-sections.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/components/home/homepage-sections.tsx) — FeaturedCommunitiesShell to replace
- [Source: src/lib/db/schema/properties.ts#L44](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/properties.ts#L44) — Existing `communityId` column
- [Source: src/lib/db/schema/areas.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/areas.ts) — Areas schema pattern to follow
- [Source: src/lib/db/schema/relations.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/relations.ts) — Relations file to update
- [Source: src/lib/db/queries/areas.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/areas.ts) — Query pattern to follow
- [Source: src/lib/db/queries/properties.ts#L348-365](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/properties.ts#L348-L365) — `propertySearchColumns` to reuse
- [Source: src/lib/seo/structured-data.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/seo/structured-data.ts) — JSON-LD generators to extend
- [Source: src/lib/navigation.ts#L46-59](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/navigation.ts#L46-L59) — Community navigation entries

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
