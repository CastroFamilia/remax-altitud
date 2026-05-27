# Story 6.1: Area Guide Pages

**Status:** ready-for-dev
**GH Issue:** #101
**Epic:** 6 — Community Pages & Area Guides
**Story Key:** 6-1-area-guide-pages
**Created:** 2026-05-26

---

## Story

As a **visitor**,
I want to explore area guides with lifestyle narratives, climate info, and filtered properties,
So that I can understand what living in a specific area feels like before browsing listings.

---

## Acceptance Criteria

1. **Given** an area guide page (e.g., `/{locale}/areas/perez-zeledon`) **When** loaded **Then** it renders: hero image with area name (h1), lifestyle narrative description (always visible — not behind a tab), climate/altitude data, and nearest services (FR17, UX-DR13). `data-testid="area-guide-hero"` on the hero section, `data-testid="area-guide-description"` on the description section.

2. **Given** the area guide description section **When** rendered **Then** it is always visible (not tabbed) to ensure full SEO indexing of the content (UX-DR13). The description MUST be in the initial SSG HTML output, not client-rendered.

3. **Given** the area guide page **When** scrolling below the description **Then** tabbed sections appear: "Properties" (filtered property grid for this area), "Agents" (AgentCards for agents covering this area), and "Similar Areas" (SimilarAreasSlider with nearby area cards). `data-testid="area-guide-tabs"` on the tab container.

4. **Given** the Properties tab **When** selected **Then** it shows a property grid filtered to this area, using the existing `PropertyCard` component from Epic 3. `data-testid="area-guide-properties-tab"` on the tab panel.

5. **Given** the Agents tab **When** selected **Then** it shows `AgentCard` components for agents covering this area. `data-testid="area-guide-agents-tab"` on the tab panel.

6. **Given** the area guide page **When** a community belongs to this area **Then** linked communities are shown as gold-bordered CommunityCards within the area guide. Gold border uses `--color-gold` (#C2A661) token.

7. **Given** an area index page (`/{locale}/areas`) **When** loaded **Then** it lists all available areas with hero cards showing area name, region badge, property count, and description snippet (FR18). `data-testid="area-index-card"` on each card.

8. **And** area guide pages are SSG (static generation) — no ISR revalidation. Content changes require rebuild.
9. **And** all content displays in the selected locale (EN/ES) via `next-intl`.
10. **And** JSON-LD structured data for Place schema is present (AR14) using the existing `generatePlaceJsonLd` function.
11. **Given** an area guide page with zero properties **When** the Properties tab is viewed **Then** a localized empty state message is shown (e.g., "No properties currently listed in this area").
12. **Given** an area without a hero image **When** the page loads **Then** a gradient placeholder (navy-to-cream) is used instead of a broken image.
13. **Given** the area guide tabs **When** navigated via keyboard **Then** tab panels follow WAI-ARIA Tabs pattern: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, and arrow-key navigation between tabs.

---

## Tasks / Subtasks

- [ ] Task 1: Create area DB query functions (AC: #1, #4, #5, #7)
  - [ ] 1.1 Create `src/lib/db/queries/areas.ts` with: `getAllAreas()`, `getAreaBySlug(slug)`, `getAllAreaSlugs()`, `getPropertiesByAreaSlug(areaSlug)`, `getAgentsByAreaSlugs(areaSlugs)`
  - [ ] 1.2 Query `properties` table filtering by `area_slug` and `is_visible = true`; return `PropertySearchItem` shape using existing `mapPropertyRowToSearchItem`
  - [ ] 1.3 Query `agents` table — for MVP, return all active agents (area-specific agent assignment is not yet implemented; all agents serve all areas)
  - [ ] 1.4 Create `getSimilarAreas(region, excludeSlug)` — returns areas with same region, excluding current area, ordered by `sortOrder` ASC

- [ ] Task 2: Create area guide page route (AC: #1, #2, #3, #8, #9, #10)
  - [ ] 2.1 Create `src/app/[locale]/areas/[slug]/page.tsx` — SSG page with `generateStaticParams` and `generateMetadata`
  - [ ] 2.2 Implement `generateStaticParams()` returning all area slugs (no locale dimension needed — inherited from parent layout)
  - [ ] 2.3 Implement `generateMetadata()` with localized title/description, `alternates` using `buildAlternatesMetadata`, and OpenGraph tags
  - [ ] 2.4 Render hero, description (always visible), climate metadata, and tabbed sections
  - [ ] 2.5 Inject JSON-LD `<script>` using `generatePlaceJsonLd` + `serializeJsonLd` from `src/lib/seo/structured-data.ts`

- [ ] Task 3: Create area guide components (AC: #1, #2, #3, #4, #5, #6, #11, #12, #13)
  - [ ] 3.1 Create `src/components/area/area-guide-hero.tsx` — Server Component: hero image (or gradient fallback per AC #12), h1, region badge, climate/altitude data
  - [ ] 3.2 Create `src/components/area/area-guide-description.tsx` — Server Component: lifestyle narrative, nearest services. Must be in initial DOM (not client-rendered)
  - [ ] 3.3 Create `src/components/area/area-guide-tabs.tsx` — Client Component: tab navigation for Properties/Agents/Similar Areas. WAI-ARIA Tabs pattern per AC #13. Empty state per AC #11.
  - [ ] 3.4 Create `src/components/area/community-card.tsx` — Server Component: gold-bordered card linking to community page (placeholder URL until Story 6.2)
  - [ ] 3.5 Create `src/components/area/similar-areas-slider.tsx` — Client Component: horizontal card slider showing nearby areas (same region)

- [ ] Task 4: Create area index page (AC: #7)
  - [ ] 4.1 Create `src/app/[locale]/areas/page.tsx` — SSG index page listing all areas
  - [ ] 4.2 Create `src/components/area/area-index-card.tsx` — card with hero image, name, region badge, property count, description snippet

- [ ] Task 5: Add i18n strings (AC: #9)
  - [ ] 5.1 Add `AreaGuide` namespace to `src/messages/en.json`
  - [ ] 5.2 Add `AreaGuide` namespace to `src/messages/es.json`
  - [ ] 5.3 Keys needed: `meta.title`, `meta.description`, `meta.ogTitle`, `meta.ogDescription`, `tabs.properties`, `tabs.agents`, `tabs.similarAreas`, `hero.regionBadge`, `hero.propertyCount`, `description.heading`, `index.title`, `index.description`, `index.meta.title`, `index.meta.description`, `noProperties`, `noAgents`, `communityCard.viewCommunity`

- [ ] Task 6: Add Breadcrumb structured data (AC: #10)
  - [ ] 6.1 Use existing `generateBreadcrumbJsonLd` for area guide pages: Home → Areas → {Area Name}
  - [ ] 6.2 Use existing `generateBreadcrumbJsonLd` for area index: Home → Areas

---

## Dev Notes

### Rendering Strategy

Area guide pages use **pure SSG** — no ISR. The architecture spec (line 123) defines:
> Area guides (`/areas/[slug]`) | SSG | Build-time (manual) | Edge | Content rarely changes

This means **no `revalidate` export**. SSG is the default rendering strategy when `generateStaticParams` is defined and there is no dynamic data fetching. Follow the exact same pattern as `src/app/[locale]/about/page.tsx`:
- Call `setRequestLocale(locale)` at the top of the page component
- Use `await params` to extract locale and slug
- No `export const dynamic` or `export const revalidate` needed

### Critical: Description Visibility for SEO (R-003)

The area guide description MUST be rendered in the initial server HTML, not behind a tab or client-side rendered. This is the #1 SEO risk for this story (Risk R-003, score 6). The description section uses a Server Component that renders directly in the page — no `use client`, no `useState`, no tab gating.

**Test verification:** Fetch the raw HTML of the area guide page (no JS execution); assert the description text is present in the response body.

### Page Component Pattern

Follow `src/app/[locale]/about/page.tsx` as the canonical SSG pattern:

```typescript
// src/app/[locale]/areas/[slug]/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getAreaBySlug, getAllAreaSlugs, getPropertiesByAreaSlug } from '@/lib/db/queries/areas';
import { getAllAgents } from '@/lib/db/queries/agents';
import { generatePlaceJsonLd, generateBreadcrumbJsonLd, serializeJsonLd } from '@/lib/seo/structured-data';
import { buildAlternatesMetadata } from '@/lib/seo/metadata';
import { AreaGuideHero } from '@/components/area/area-guide-hero';
import { AreaGuideDescription } from '@/components/area/area-guide-description';
import { AreaGuideTabs } from '@/components/area/area-guide-tabs';

export async function generateStaticParams() {
  const slugs = await getAllAreaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const area = await getAreaBySlug(slug);
  if (!area) return {};
  const t = await getTranslations({ locale, namespace: 'AreaGuide' });
  const areaName = locale === 'es' ? area.nameEs : area.nameEn;
  return {
    title: t('meta.title', { area: areaName }),
    description: t('meta.description', { area: areaName }),
    alternates: { ...buildAlternatesMetadata(`/areas/${slug}`) },
    openGraph: { title: t('meta.ogTitle', { area: areaName }), description: t('meta.ogDescription', { area: areaName }) },
  };
}

export default async function AreaGuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const area = await getAreaBySlug(slug);
  if (!area) notFound();
  
  const [areaProperties, agents] = await Promise.all([
    getPropertiesByAreaSlug(slug),
    getAllAgents(),
  ]);

  const placeJsonLd = generatePlaceJsonLd(area, locale);
  const areaName = locale === 'es' ? area.nameEs : area.nameEn;
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', href: `/${locale}`, position: 1 },
    { name: t('index.title'), href: `/${locale}/areas`, position: 2 },
    { name: areaName, href: `/${locale}/areas/${slug}`, position: 3 },
  ]);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(placeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }} />
      <AreaGuideHero area={area} locale={locale} />
      <AreaGuideDescription area={area} locale={locale} />
      <AreaGuideTabs
        properties={areaProperties}
        agents={agents}
        area={area}
        locale={locale}
      />
    </main>
  );
}
```

**NOTE:** The breadcrumb `t` reference above is pseudocode — you must fetch translations with `getTranslations` before using `t(...)`. Fix the scoping during implementation.

### Database Query Pattern

Create `src/lib/db/queries/areas.ts` following the same patterns as `src/lib/db/queries/properties.ts` and `src/lib/db/queries/agents.ts`:

```typescript
// src/lib/db/queries/areas.ts
import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { areas } from '@/lib/db/schema/areas';
import { properties } from '@/lib/db/schema/properties';
import { mapPropertyRowToSearchItem } from './properties';

export async function getAllAreas() {
  return db.select().from(areas).orderBy(asc(areas.sortOrder));
}

export async function getAreaBySlug(slug: string) {
  const rows = await db.select().from(areas).where(eq(areas.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getAllAreaSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: areas.slug }).from(areas);
  return rows.map((r) => r.slug);
}

export async function getPropertiesByAreaSlug(areaSlug: string) {
  // Reuse the exact same column set and mapper as getSimilarPropertiesRanked
  // to produce PropertySearchItem[] compatible with PropertyCard
  const rows = await db
    .select({ /* propertySearchColumns */ })
    .from(properties)
    .where(and(eq(properties.areaSlug, areaSlug), eq(properties.isVisible, true)))
    .orderBy(desc(properties.syncedAt));
  return rows.map(mapPropertyRowToSearchItem);
}
```

**CRITICAL — Reuse `propertySearchColumns`:** The `propertySearchColumns` constant is defined in `src/lib/db/queries/properties.ts` (line 349). You MUST either:
1. Export `propertySearchColumns` from properties.ts and import it in areas.ts, OR
2. Duplicate the exact same column set inline

Option 1 is preferred. Add `export` to the existing `const propertySearchColumns` declaration.

### Existing `generatePlaceJsonLd` — REUSE, DO NOT RECREATE

The `generatePlaceJsonLd` function already exists in `src/lib/seo/structured-data.ts` (line 149). It was created in Story 4.4 specifically for Epic 6 area pages. It accepts `(area: Area, locale: string)` and returns a Place schema object. **Use it directly — do not create a new one.**

Also reuse `serializeJsonLd` from the same file for safe HTML injection.

### Existing Components — REUSE, DO NOT RECREATE

| Component | Location | Usage in 6.1 |
|-----------|----------|-------------|
| `PropertyCard` | `src/components/property/property-card.tsx` | Properties tab grid |
| `AgentCard` | `src/components/agent/agent-card.tsx` | Agents tab |
| `PropertyGrid` | `src/components/property/property-grid.tsx` | Properties tab (optional — it's a Client Component; may be simpler to create a server-rendered grid for SSG) |
| `generatePlaceJsonLd` | `src/lib/seo/structured-data.ts` | JSON-LD Place schema |
| `generateBreadcrumbJsonLd` | `src/lib/seo/structured-data.ts` | Breadcrumb structured data |
| `serializeJsonLd` | `src/lib/seo/structured-data.ts` | Safe JSON-LD serialization |
| `buildAlternatesMetadata` | `src/lib/seo/metadata.ts` | hreflang alternates |
| `mapPropertyRowToSearchItem` | `src/lib/db/queries/properties.ts` | DB row → PropertySearchItem |

### PropertyGrid Consideration

`PropertyGrid` (`src/components/property/property-grid.tsx`) is a **Client Component** (`'use client'`). For the area guide SSG page, you have two options:

1. **Use `PropertyGrid` directly** — the grid will render server-side during build, then hydrate client-side. This works but bundles client JS for pagination and search state.
2. **Create a simpler `AreaPropertyGrid` Server Component** — renders `PropertyCard` components in a static grid without client-side pagination. Properties tab content is static at build time.

**Recommended: Option 2** for SSG. Create a minimal Server Component that maps properties to `PropertyCard`. Keep the component simple — no pagination needed for area-filtered results (typically 5-20 properties).

### Areas Schema

The `areas` table schema is already defined in `src/lib/db/schema/areas.ts`. Key fields:

| Column | Type | Usage |
|--------|------|-------|
| `slug` | text, unique | URL parameter, `generateStaticParams` |
| `nameEn` / `nameEs` | text | Localized area name for h1 |
| `region` | text | Region badge ("Mountain" / "Coast") |
| `descriptionEn` / `descriptionEs` | text | Lifestyle narrative (SEO content) |
| `heroImageUrl` | text, nullable | Hero background image |
| `province` / `canton` / `district` | text, nullable | Administrative subdivisions |
| `latitude` / `longitude` | double, nullable | Geo coordinates for JSON-LD |
| `propertyCount` | integer | Denormalized count for index cards |
| `metadata` | jsonb | Climate, altitude, distances, amenities |
| `sortOrder` | integer | Display ordering |

The `metadata` JSONB field should contain structured data like:
```json
{
  "elevation": "700m",
  "climate": "Tropical humid",
  "nearestAirport": "San José (SJO) — 3.5 hours",
  "nearestHospital": "Hospital Escalante Pradilla — 15 min",
  "nearestBeach": "Dominical — 45 min"
}
```

### CommunityCard — Placeholder for Story 6.2

Story 6.1 renders community cards within the area guide. However, the `communities` table does NOT exist in the schema yet — it will be created in Story 6.2 or 6.5. For Story 6.1:

1. Create the `CommunityCard` component UI with gold border styling
2. Use hardcoded/seeded community data from the `areas.metadata` JSONB field, OR
3. Leave the community section as "Coming soon" with the component structure in place

**Recommended:** Create the `CommunityCard` component with the correct visual design (gold border, hero image, name, tagline) but do NOT query a `communities` table. Either pass community data as props from the area's metadata, or render an empty section with a comment `{/* Communities — populated in Story 6.2 */}`.

### Styling Requirements

Follow the project's design system tokens defined in `_bmad-output/planning-artifacts/ux-design-specification.md`:

- **Font**: Montserrat (via `next/font`) — weights 400, 600, 700, 800
- **Hero overlay**: Dark overlay on photography + white text (`--color-text-on-dark`)
- **Region badge**: `--mountain-primary` (#233428) for mountain, `--beach-primary` (#183C5A) for coast
- **Gold border on community cards**: `--color-gold` (#C2A661) — 2px solid
- **Card styling**: `--color-bg-white`, `--shadow-sm` resting, `--shadow-lg` on hover, `--radius-lg` (12px)
- **Tab styling**: Active tab indicator uses `--color-primary` (#000E35)
- **Spacing**: Follow 4px base grid (`--space-*` tokens)
- **Hero fallback**: When `heroImageUrl` is null, render a CSS gradient from `--color-navy` to `--color-cream` instead of `<Image>`
- **Touch targets**: Minimum 44×44px for all interactive elements (tab triggers, card links)

### Accessibility Requirements

- Tab component MUST follow WAI-ARIA Tabs pattern:
  - `role="tablist"` on the tab container
  - `role="tab"` on each tab trigger, with `aria-selected`, `aria-controls="panel-id"`
  - `role="tabpanel"` on each panel, with `aria-labelledby="tab-id"`
  - Arrow Left/Right to navigate between tabs, Home/End for first/last
- Hero section: `<h1>` is the area name; do NOT nest inside another heading
- Images: All `<Image>` elements have descriptive `alt` text using localized area name
- Skip link: Existing site skip-to-content link covers the area guide page (no new skip link needed)

### Similar Areas Logic

"Similar areas" for the `SimilarAreasSlider` are determined by **same region** (e.g., "Mountain" or "Coast"). Query all areas where `region === area.region` and `slug !== area.slug`, ordered by `sortOrder`. This is a simple filter — no geo-distance calculation needed.

Add a query function:
```typescript
export async function getSimilarAreas(region: string, excludeSlug: string) {
  return db.select().from(areas)
    .where(and(eq(areas.region, region), not(eq(areas.slug, excludeSlug))))
    .orderBy(asc(areas.sortOrder));
}
```

### Testing Strategy

**Required `data-testid` attributes** (from test design `test-design-epic-6.md`):

| Attribute | Component |
|-----------|-----------|
| `data-testid="area-guide-hero"` | AreaGuideHero |
| `data-testid="area-guide-description"` | AreaGuideDescription |
| `data-testid="area-guide-tabs"` | AreaGuideTabs container |
| `data-testid="area-guide-properties-tab"` | Properties tab panel |
| `data-testid="area-guide-agents-tab"` | Agents tab panel |
| `data-testid="area-guide-similar-tab"` | Similar Areas tab panel |
| `data-testid="area-index-card"` | AreaIndexCard |

**Key test scenarios from test design:**
- 6.1-E2E-001: Description visible without clicking any tab
- 6.1-E2E-002: Description text present in raw SSG HTML (no JS execution)
- 6.1-E2E-003: Properties tab shows property grid filtered to this area
- 6.1-COMP-001: JSON-LD Place schema present on area guide page

### Project Structure Notes

New files to create:
```
src/
├── app/[locale]/areas/
│   ├── page.tsx                          # Area index (SSG)
│   └── [slug]/
│       └── page.tsx                      # Area guide (SSG)
├── components/area/
│   ├── area-guide-hero.tsx               # Server Component
│   ├── area-guide-description.tsx        # Server Component
│   ├── area-guide-tabs.tsx               # Client Component (tab state)
│   ├── area-property-grid.tsx            # Server Component (static grid)
│   ├── area-index-card.tsx               # Server Component
│   ├── community-card.tsx                # Server Component (gold border)
│   └── similar-areas-slider.tsx          # Client Component (carousel)
└── lib/db/queries/
    └── areas.ts                          # Area DB queries (includes getSimilarAreas)
```

Files to modify:
```
src/messages/en.json          — Add AreaGuide namespace
src/messages/es.json          — Add AreaGuide namespace
src/lib/db/queries/properties.ts — Export propertySearchColumns
```

### Do NOT Modify

- `src/components/property/property-card.tsx` — reuse as-is
- `src/components/agent/agent-card.tsx` — reuse as-is
- `src/lib/seo/structured-data.ts` — reuse `generatePlaceJsonLd`, `generateBreadcrumbJsonLd`, `serializeJsonLd` as-is
- Any existing `data-testid` values from Epics 1–5

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — Story requirements and acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#L123] — SSG rendering strategy for area guides
- [Source: _bmad-output/planning-artifacts/architecture.md#L162-168] — Directory structure for areas routes
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L1252-1261] — Area guide UX composition and sections
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#L1282] — Gold border community card differentiation
- [Source: src/lib/seo/structured-data.ts#L149-161] — Existing `generatePlaceJsonLd` function
- [Source: src/lib/db/schema/areas.ts] — Areas table schema
- [Source: src/lib/db/queries/properties.ts#L349-365] — `propertySearchColumns` constant to export
- [Source: src/app/[locale]/about/page.tsx] — Canonical SSG page pattern
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L87-97] — Required data-testid contracts
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L206-214] — P0 test scenarios for Story 6.1

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
