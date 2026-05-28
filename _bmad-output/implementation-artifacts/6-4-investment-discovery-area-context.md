# Story 6.4: Investment Discovery & Area Context

**Status:** ready-for-dev
**GH Issue:** #104
**Epic:** 6 — Community Pages & Area Guides
**Story Key:** 6-4-investment-discovery-area-context
**Created:** 2026-05-28

---

## Story

As an **investor**,
I want to discover investment-relevant properties and see area appreciation data,
So that I can make informed decisions about where to invest.

---

## Acceptance Criteria

1. **Given** the search page **When** a visitor selects lifestyle tags "Investment Property," "Rental Potential," or "Commercial" **Then** properties tagged with those categories are filtered and displayed (FR44). **This already works** — Story 3.4 implemented lifestyle tag filtering with GIN-indexed overlap queries. This story **validates** the existing filter works for investment tags specifically, but does NOT re-implement it.

2. **Given** an area guide or community page **When** investment context data is available (admin-curated) **Then** it displays: area appreciation trends and rental yield estimates with a disclaimer: "Based on market estimates — consult an agent for current data" (FR45). `data-testid="investment-context"` on the section, `data-testid="investment-disclaimer"` on the disclaimer.

3. **Given** investment context data **When** not available for an area **Then** the section is gracefully hidden (not an empty section) — component returns `null` (UX-DR20).

4. **Given** a listing detail page for an "Investment Property" tagged listing **When** the area section renders **Then** it includes any available investment context from the listing's area (FR45).

5. **And** investment data is admin-curated static content per area (not API-sourced) — stored in the `areas.metadata` JSONB field (FR45).

6. **And** the disclaimer is always displayed alongside investment data and cannot be removed independently — it's rendered as part of the same component, not a separate togglable element.

---

## Tasks / Subtasks

- [ ] Task 1: Define investment context data shape in areas.metadata JSONB (AC: #5)
  - [ ] 1.1 Create `src/types/investment.ts` — TypeScript interface for investment context data stored in `areas.metadata.investmentContext`:
    ```typescript
    export interface InvestmentContext {
      appreciationTrend: string;    // e.g. "5-8% annual appreciation over 5 years"
      rentalYieldEstimate: string;  // e.g. "6-10% annual rental yield for vacation rentals"
      marketHighlights?: string[];  // Optional bullet points, e.g. ["Growing expat community", "New highway access"]
    }
    ```
  - [ ] 1.2 Create `src/lib/utils/investment.ts` — helper to extract typed investment context from area metadata JSONB:
    ```typescript
    export function getInvestmentContext(metadata: Record<string, unknown>): InvestmentContext | null
    ```
    Returns `null` if `metadata.investmentContext` is missing or malformed. Validates required fields (`appreciationTrend`, `rentalYieldEstimate`) exist and are non-empty strings.

- [ ] Task 2: Create InvestmentContext Server Component (AC: #2, #3, #6)
  - [ ] 2.1 Create `src/components/area/investment-context.tsx` — **Server Component** (no `"use client"`)
  - [ ] 2.2 Props: `{ metadata: Record<string, unknown>; locale: string }`
  - [ ] 2.3 Internally call `getInvestmentContext(metadata)` — if returns `null`, return `null` (graceful hiding, AC #3)
  - [ ] 2.4 Render section with `data-testid="investment-context"`:
    - Heading: localized "Investment Context" / "Contexto de Inversión"
    - Appreciation trend line
    - Rental yield estimate line
    - Optional market highlights as a bullet list
    - Disclaimer with `data-testid="investment-disclaimer"`: localized "Based on market estimates — consult an agent for current data"
  - [ ] 2.5 Disclaimer MUST be rendered inside the same conditional block as the data — not a separate component or toggleable element (AC #6)
  - [ ] 2.6 Styling: same section pattern as existing area/community sections (`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8`), use `bg-brand-sand/10` for subtle distinction, `border-l-4 border-brand-gold` for disclaimer

- [ ] Task 3: Integrate InvestmentContext into area guide page (AC: #2)
  - [ ] 3.1 Update `src/app/[locale]/areas/[slug]/page.tsx` — import and render `InvestmentContext` between `AreaGuideDescription` and the communities section
  - [ ] 3.2 Pass `metadata={area.metadata}` and `locale` as props
  - [ ] 3.3 No conditional wrapper needed — the component handles its own null rendering

- [ ] Task 4: Integrate InvestmentContext into community page (AC: #2)
  - [ ] 4.1 Update `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` — import and render `InvestmentContext` after `CommunityMiniMap`
  - [ ] 4.2 The area data is already fetched in the page (`getAreaBySlug(slug)`) — pass `metadata={area.metadata}` and `locale`

- [ ] Task 5: Integrate InvestmentContext into listing detail page for investment-tagged properties (AC: #4)
  - [ ] 5.1 Update `src/app/[locale]/property/[slug]/page.tsx`:
    - Import `getAreaBySlug` from `@/lib/db/queries/areas`
    - Import `InvestmentContext` from `@/components/area/investment-context`
    - After fetching the property, if `property.areaSlug` exists, fetch the area: `const area = property.areaSlug ? await getAreaBySlug(property.areaSlug) : null`
    - **Only render** `InvestmentContext` if the property has an investment-related lifestyle tag: check `property.lifestyleTags` for intersection with `["Investment Property", "Rental Potential", "Commercial"]`
  - [ ] 5.2 Render `InvestmentContext` after `ListingDetailLayout` (inside the fragment), only when both conditions met (investment tag present AND area has metadata)
  - [ ] 5.3 The InvestmentContext component handles graceful null rendering if metadata has no investment data

- [ ] Task 6: Add i18n strings (AC: #2, #6)
  - [ ] 6.1 Add `InvestmentContext` namespace to `src/messages/en.json`:
    ```json
    "InvestmentContext": {
      "heading": "Investment Context",
      "appreciation": "Appreciation Trend",
      "rentalYield": "Rental Yield Estimate",
      "highlights": "Market Highlights",
      "disclaimer": "Based on market estimates — consult an agent for current data"
    }
    ```
  - [ ] 6.2 Add same keys to `src/messages/es.json`:
    ```json
    "InvestmentContext": {
      "heading": "Contexto de Inversión",
      "appreciation": "Tendencia de Apreciación",
      "rentalYield": "Estimación de Rendimiento de Alquiler",
      "highlights": "Puntos Destacados del Mercado",
      "disclaimer": "Basado en estimaciones de mercado — consulte a un agente para datos actuales"
    }
    ```

- [ ] Task 7: Seed investment context data for existing areas (AC: #2, #5)
  - [ ] 7.1 Create a Drizzle seed/migration script or update existing seed data to populate `areas.metadata` with `investmentContext` for at least 2 areas:
    - Pérez Zeledón: `{ investmentContext: { appreciationTrend: "5-8% annual appreciation over 5 years", rentalYieldEstimate: "4-6% for long-term rentals", marketHighlights: ["Growing expat community", "New hospital and university", "Lower entry prices than coastal areas"] } }`
    - Dominical/Uvita: `{ investmentContext: { appreciationTrend: "8-12% annual appreciation over 5 years", rentalYieldEstimate: "6-10% for vacation rentals", marketHighlights: ["Strong tourism demand", "Limited coastal inventory", "International airport access improving"] } }`
  - [ ] 7.2 Do NOT overwrite existing metadata fields — merge `investmentContext` into existing JSONB

- [ ] Task 8: Validate existing lifestyle tag filter works for investment tags (AC: #1)
  - [ ] 8.1 This is a verification task, not implementation. Write a component test or E2E test that confirms:
    - Selecting "Investment Property" tag on the search page filters results correctly
    - The existing `searchProperties` server action handles investment tags via the GIN-indexed `&&` overlap query
  - [ ] 8.2 If any investment-tagged properties don't exist in seed data, add 2-3 test properties with `lifestyleTags: ["Investment Property"]` or `["Rental Potential"]`

---

## Dev Notes

### Investment Data Storage Design

Investment context data lives in the existing `areas.metadata` JSONB column (architecture spec: `jsonb metadata "elevation, climate, distances"`). This is admin-curated static content per area — **NOT sourced from the API** (FR45 explicit requirement).

The JSONB structure allows adding investment data without schema migration:

```typescript
// areas.metadata JSONB shape (existing + new)
{
  // Existing fields (elevation, climate, distances)
  "elevation": "1000m",
  "climate": "Tropical mountain",
  // NEW: Investment context (Story 6.4)
  "investmentContext": {
    "appreciationTrend": "5-8% annual appreciation over 5 years",
    "rentalYieldEstimate": "6-10% for vacation rentals",
    "marketHighlights": ["Strong tourism demand", "Limited inventory"]
  }
}
```

**No schema migration needed** — the `metadata` column is already JSONB with `DEFAULT '{}'::jsonb`.

### Component Architecture

```
InvestmentContext (Server Component — no "use client")
├── Returns null if getInvestmentContext(metadata) === null
└── <section data-testid="investment-context">
    ├── <h2>{t("heading")}</h2>
    ├── <div> Appreciation trend </div>
    ├── <div> Rental yield estimate </div>
    ├── <ul> Market highlights (optional) </ul>
    └── <aside data-testid="investment-disclaimer">
        └── {t("disclaimer")}
    </aside>
```

### Existing Components — REUSE, DO NOT RECREATE

| Component/Utility | Location | Relevance |
|-------------------|----------|-----------|
| Lifestyle tag filter | `src/app/actions/search-actions.ts` L94-99 | GIN-indexed `&&` overlap query — **already works**, do NOT re-implement |
| `LifestyleTagChips` | `src/components/search/lifestyle-tag-chips.tsx` | UI for selecting investment tags — **already works** |
| `LIFESTYLE_TAGS` constant | `src/lib/constants/lifestyle-tags.ts` | "Investment Property", "Rental Potential", "Commercial" already defined |
| `getAreaBySlug` | `src/lib/db/queries/areas.ts` | Fetches area including `metadata` JSONB — use for listing detail page |
| Area guide page | `src/app/[locale]/areas/[slug]/page.tsx` | Insert InvestmentContext component |
| Community page | `src/app/[locale]/areas/[slug]/communities/[community]/page.tsx` | Insert InvestmentContext component (area already fetched) |
| Listing detail page | `src/app/[locale]/property/[slug]/page.tsx` | Insert InvestmentContext for investment-tagged listings |
| `properties.lifestyleTags` | `src/lib/db/schema/properties.ts` L40-43 | `text[]` column with GIN index — check for investment tags |

### DO NOT Modify

- `src/app/actions/search-actions.ts` — lifestyle tag filtering already works
- `src/components/search/lifestyle-tag-chips.tsx` — tag UI already works
- `src/components/search/search-filter-bar.tsx` — filter bar already works
- `src/lib/constants/lifestyle-tags.ts` — tag definitions already correct
- `src/lib/sync/lifestyle-tagger.ts` — auto-tagging rules already work
- Any `data-testid` from prior stories

### Critical: Graceful Hiding (UX-DR20)

When investment data is not available for an area, the `InvestmentContext` component MUST return `null` — rendering **nothing**. Do NOT render an empty `<section>` with a header, an empty container, or a "no data available" message. The component simply doesn't exist in the DOM.

```typescript
// CORRECT — graceful hiding
if (!investmentData) return null;

// WRONG — empty section visible in DOM
if (!investmentData) return <section><h2>Investment Context</h2></section>;
```

### Critical: Disclaimer Co-Rendering (AC #6)

The disclaimer text is rendered inside the same conditional branch as the investment data. If investment data renders, the disclaimer ALWAYS renders. There is no mechanism to show investment data without the disclaimer.

```typescript
// CORRECT — disclaimer inside the data conditional
return (
  <section data-testid="investment-context">
    {/* data display */}
    <aside data-testid="investment-disclaimer">{t("disclaimer")}</aside>
  </section>
);

// WRONG — disclaimer as separate toggleable/conditional
{showDisclaimer && <aside>...</aside>}
```

### Listing Detail Integration Notes

The listing detail page (`src/app/[locale]/property/[slug]/page.tsx`) currently does NOT fetch area data. Story 6.4 adds an area fetch **only when** the property has investment-related lifestyle tags. Use the `INVESTMENT_TAGS` constant array to check:

```typescript
const INVESTMENT_TAGS = ["Investment Property", "Rental Potential", "Commercial"];
const hasInvestmentTag = property.lifestyleTags?.some(tag => INVESTMENT_TAGS.includes(tag));

// Only fetch area if property has investment tags AND has an areaSlug
const area = hasInvestmentTag && property.areaSlug
  ? await getAreaBySlug(property.areaSlug)
  : null;
```

This avoids unnecessary DB queries for non-investment listings.

### Styling

- **Section container**: `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8` (matches existing sections)
- **Inner content**: `rounded-lg bg-brand-sand/10 p-6` (subtle warm background for investment context)
- **Labels**: `text-sm font-semibold uppercase tracking-wide text-brand-navy` for "Appreciation Trend" / "Rental Yield Estimate"
- **Values**: `text-lg text-text-primary`
- **Highlights list**: `list-disc pl-5 space-y-1 text-text-secondary`
- **Disclaimer**: `mt-4 border-l-4 border-brand-gold pl-4 text-sm italic text-text-muted`
- **Heading**: `text-2xl font-bold text-brand-navy mb-6` (matches `AreaGuideDescription` heading style)

### Accessibility

- `<section>` wraps the investment context with `aria-labelledby` pointing to the heading's `id`
- Disclaimer uses `<aside role="note">` to semantically indicate advisory content
- All text content is in semantic HTML elements (headings, paragraphs, lists)
- Localized via `next-intl` `getTranslations` (Server Component pattern, NOT `useTranslations`)

### Testing Strategy

**Required `data-testid` attributes** (from `test-design-epic-6.md`):

| Attribute | Component |
|-----------|-----------|
| `data-testid="investment-context"` | InvestmentContext section |
| `data-testid="investment-disclaimer"` | Disclaimer text |

**Key test scenarios:**

| Test ID | Priority | Description |
|---------|----------|-------------|
| 6.4-COMP-001 | P0 | InvestmentContext returns null when metadata has no investment data |
| 6.4-COMP-002 | P1 | InvestmentContext renders appreciation, rental yield, and disclaimer |
| 6.4-COMP-003 | P2 | Disclaimer always co-renders with investment data |
| 6.4-E2E-001 | P1 | Listing detail for investment-tagged property shows area investment context |
| 6.4-E2E-002 | P2 | Search page filters by "Investment Property" and "Rental Potential" tags |

**Component test pattern:**

```typescript
// tests/unit/area/investment-context.spec.tsx
import { render, screen } from "@testing-library/react";
import { InvestmentContext } from "@/components/area/investment-context";

// Mock next-intl
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));

describe("InvestmentContext", () => {
  it("returns null when no investment data in metadata", () => {
    const { container } = render(
      <InvestmentContext metadata={{}} locale="en" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders appreciation, yield, and disclaimer when data present", () => {
    render(
      <InvestmentContext
        metadata={{
          investmentContext: {
            appreciationTrend: "5-8% annual",
            rentalYieldEstimate: "6-10% yield",
          }
        }}
        locale="en"
      />
    );
    expect(screen.getByTestId("investment-context")).toBeInTheDocument();
    expect(screen.getByTestId("investment-disclaimer")).toBeInTheDocument();
    expect(screen.getByText(/5-8% annual/)).toBeInTheDocument();
    expect(screen.getByText(/6-10% yield/)).toBeInTheDocument();
  });
});
```

### Project Structure Notes

New files to create:
```
src/
├── types/
│   └── investment.ts                   # InvestmentContext interface
├── lib/utils/
│   └── investment.ts                   # getInvestmentContext helper
└── components/area/
    └── investment-context.tsx           # Server Component
```

Files to modify:
```
src/app/[locale]/areas/[slug]/page.tsx                               — Insert InvestmentContext
src/app/[locale]/areas/[slug]/communities/[community]/page.tsx       — Insert InvestmentContext
src/app/[locale]/property/[slug]/page.tsx                            — Add investment context for tagged listings
src/messages/en.json                                                 — Add InvestmentContext i18n
src/messages/es.json                                                 — Add InvestmentContext i18n
```

### Previous Story Learnings (Story 6.3)

- Server Components use `getTranslations` from `next-intl/server` (NOT `useTranslations` from `next-intl`)
- Static `<img>` pattern — community pages are Server Components, follow same pattern
- Community page already fetches area data separately (`getAreaBySlug`) — reuse this pattern
- Gold color token: `--color-gold` (#C2A661) — reuse for disclaimer border
- `data-testid` contracts are additive — only add new ones, never modify existing

### References

- [Source: _bmad-output/planning-artifacts/epics.md#L1835-L1863](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L1835-L1863) — Story 6.4 acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#L567](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/prd.md#L567) — FR44: investment discovery via lifestyle tags
- [Source: _bmad-output/planning-artifacts/prd.md#L568](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/prd.md#L568) — FR45: area appreciation + rental yield context, admin-curated, with disclaimer
- [Source: _bmad-output/planning-artifacts/architecture.md#L472](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L472) — Areas entity: `jsonb metadata "elevation, climate, distances"`
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L109-L110](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L109-L110) — data-testid contracts: investment-context, investment-disclaimer
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L137](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L137) — Risk R-008: empty section instead of graceful hiding
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L213](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L213) — 6.4-COMP-001 (P0): graceful hiding test
- [Source: _bmad-output/test-artifacts/test-design-epic-6.md#L242-L243](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/test-design-epic-6.md#L242-L243) — 6.4-COMP-002 + 6.4-E2E-001 test scenarios
- [Source: src/lib/db/schema/areas.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/areas.ts) — Areas schema with metadata JSONB column
- [Source: src/lib/db/queries/areas.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/areas.ts) — getAreaBySlug query (returns full area including metadata)
- [Source: src/lib/db/schema/properties.ts#L40-L43](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/properties.ts#L40-L43) — lifestyleTags text[] column with GIN index
- [Source: src/app/actions/search-actions.ts#L94-L99](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/actions/search-actions.ts#L94-L99) — Existing lifestyle tag filter with && overlap query
- [Source: src/lib/constants/lifestyle-tags.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/constants/lifestyle-tags.ts) — LIFESTYLE_TAGS constant including "Investment Property", "Rental Potential", "Commercial"
- [Source: src/app/[locale]/property/[slug]/page.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/%5Blocale%5D/property/%5Bslug%5D/page.tsx) — Listing detail page to extend
- [Source: src/app/[locale]/areas/[slug]/page.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/%5Blocale%5D/areas/%5Bslug%5D/page.tsx) — Area guide page to extend
- [Source: src/app/[locale]/areas/[slug]/communities/[community]/page.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/%5Blocale%5D/areas/%5Bslug%5D/communities/%5Bcommunity%5D/page.tsx) — Community page to extend
- [Source: _bmad-output/implementation-artifacts/6-3-community-mini-map-and-geo-fence-display.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/implementation-artifacts/6-3-community-mini-map-and-geo-fence-display.md) — Story 6.3 patterns and learnings

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
