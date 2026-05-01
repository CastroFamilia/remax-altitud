# Story 3.4: Lifestyle Tags & Smart Presets

**GH Issue:** #88

Status: done

## Story

As a **visitor**,
I want to browse by lifestyle category or use preset searches,
so that I can quickly find properties that match my goals without configuring every filter.

## Acceptance Criteria

1. **Given** the filter bar **When** lifestyle tag chips are displayed **Then** options include: "Investment Property," "Rental Potential," "Vacation Home," "Retirement Paradise," "Commercial" (FR4).

2. **Given** a lifestyle tag chip **When** tapped **Then** it toggles active state (highlighted with `--color-blue-bright` / `bg-brand-blue`) and filters results immediately (FR4).

3. **Given** multiple lifestyle tags **When** selected simultaneously **Then** results match ANY of the selected tags (OR logic).

4. **Given** smart search presets **When** displayed (e.g., homepage or search page) **Then** they combine pre-configured filter + lifestyle tag combinations (FR15).

5. **Given** a smart preset like "Mountain Retirement Homes" **When** clicked **Then** it applies: region=mountain, type=house, lifestyle_tag=Retirement Paradise, and navigates to search with those URL params.

6. **And** active lifestyle tags appear as chips in the active filter display.

7. **And** presets are configurable without code changes (JSON config or DB — use a `constants/` file, not DB, for MVP).

## Tasks / Subtasks

- [x] Task 1: Extend `SearchFilters` type with `tags` field (AC: #1, #2, #3)
  - [x] Modify `src/types/search.ts` — add `tags?: string[]` field to `SearchFilters`:
    ```ts
    export interface SearchFilters {
      // ... existing fields ...
      tags?: string[];  // URL param: "tags" (comma-separated values)
    }
    ```
  - [x] The `tags` URL param uses comma-separated values: `?tags=Investment+Property,Rental+Potential`
  - [x] `tags` MUST count toward `activeFilterCount` — per AC #6, active lifestyle tags appear as chips in the active filter display
  - [x] **`activeFilterCount` for tags**: count each selected tag individually (2 selected tags = +2 to count, not just +1). Do NOT add `tags` to `FILTER_KEYS` (the existing per-key check counts 1 per key). Instead, replace the `activeFilterCount` `useMemo` in `use-search-filters.ts` with:
    ```ts
    const activeFilterCount = useMemo(() => {
      const scalarCount = FILTER_KEYS.filter(key => {
        const value = filters[key];
        return value !== undefined && value !== null;
      }).length;
      const tagsCount = filters.tags?.length ?? 0;
      return scalarCount + tagsCount;
    }, [filters]);
    ```
    (Keep `FILTER_KEYS` as the existing 8 scalar keys — do NOT add `tags` to that array)

- [x] Task 2: Extend `useSearchFilters` hook for tags URL state (AC: #2, #3, #6)
  - [x] Modify `src/hooks/use-search-filters.ts`
  - [x] Add `tags` to `PARAM_MAP`: `tags: "tags"`
  - [x] Do NOT add `tags` to `FILTER_KEYS` — instead extend the `activeFilterCount` useMemo as specified in Task 1 (counts each tag individually)
  - [x] Add `tags` parsing in `parseFilters()`:
    ```ts
    const tagsParam = params.get("tags");
    if (tagsParam) {
      const parsed = tagsParam.split(",").map(t => decodeURIComponent(t.trim())).filter(Boolean);
      if (parsed.length > 0) filters.tags = parsed;
    }
    ```
  - [x] Add `tags` serialization in `serializeValue()`: join array with comma (`tags.join(",")`)
  - [x] `tags` is NOT a debounced key (instant update when chip is toggled)
  - [x] The `setFilter('tags', ...)` call expects `string[] | undefined` — toggling a single tag requires reading the current array, adding/removing the tag, and calling `setFilter('tags', newArray)`. Implement a new helper: `toggleTag(tag: string): void` on the hook return:
    ```ts
    toggleTag: (tag: string) => void;
    ```
    Implementation — use `latestParamsRef.current` (NOT `filters.tags`) to avoid stale closure on rapid clicks:
    ```ts
    const toggleTag = useCallback((tag: string) => {
      // Read from latestParamsRef to get freshest state (avoids stale closure race)
      const currentTagsParam = latestParamsRef.current.get("tags");
      const current = currentTagsParam
        ? currentTagsParam.split(",").map(t => decodeURIComponent(t.trim())).filter(Boolean)
        : [];
      const next = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      setFilter('tags', next.length > 0 ? next : undefined);
    }, [setFilter]);
    ```
    Note: `latestParamsRef` is already maintained in the hook — this is the same pattern used by `performUpdate` for debounced numeric filters.
  - [x] Update `UseSearchFiltersReturn` interface to include `toggleTag`

- [x] Task 3: Extend `searchProperties` Server Action to filter by lifestyle tags (AC: #3, #1)
  - [x] Modify `src/app/actions/search-actions.ts`
  - [x] Add `tags` to `dimConditions` map — use the architecture §6 pattern:
    ```ts
    tags: filters.tags?.length
      ? sql`${properties.lifestyleTags} && ${filters.tags}`
      : undefined,
    ```
  - [x] In Drizzle ORM 0.44 (the project version), passing a JS `string[]` as a parameter in `sql` template literals serializes it as a PostgreSQL text array. This is the pattern the architecture §6 specifies explicitly.
  - [x] The `&&` (overlap) operator on `text[]` implements OR logic (any tag matches) — this uses the `idx_properties_tags` GIN index (already exists on the schema)
  - [x] **DB schema**: `properties.lifestyleTags` = `text("lifestyle_tags").array().$type<string[]>()` (confirmed in `src/lib/db/schema/properties.ts` line ~40)
  - [x] **GIN index** `idx_properties_tags` already created in schema — no migration needed

- [x] Task 4: Create `LifestyleTagChips` component (AC: #1, #2, #3, #6)
  - [x] Create `src/components/search/lifestyle-tag-chips.tsx` with `'use client'` directive
  - [x] Import tag definitions from `@/lib/constants/lifestyle-tags` — use `LIFESTYLE_TAGS` constant (do NOT hardcode tag names):
    ```ts
    import { LIFESTYLE_TAGS } from "@/lib/constants/lifestyle-tags";
    ```
  - [x] **CRITICAL**: The existing `LIFESTYLE_TAGS` array in `src/lib/constants/lifestyle-tags.ts` contains: `["Rental Potential", "Investment Property", "Vacation Home", "Retire", "Commercial"]`
  - [x] **DISCREPANCY**: The epic (AC #1) specifies "Retirement Paradise" but the constant uses "Retire". Story 3.4 must use "Retirement Paradise" as the display label while the stored tag value stays "Retire" (to avoid breaking Story 2.6 auto-tagging rules). Implement a display label map:
    ```ts
    const TAG_DISPLAY_LABELS: Record<string, string> = {
      "Retire": "Retirement Paradise",
    };
    function tagDisplayLabel(tag: string): string {
      return TAG_DISPLAY_LABELS[tag] ?? tag;
    }
    ```
  - [x] Props:
    ```ts
    interface LifestyleTagChipsProps {
      activeTags: string[];    // currently selected tags from URL state
      onToggle: (tag: string) => void;  // toggleTag from useSearchFilters
    }
    ```
  - [x] Render a horizontal scrollable row of chips (one per tag in `LIFESTYLE_TAGS`)
  - [x] Active chip style: `bg-brand-blue text-white` (same token as FilterChips in Story 3.3)
  - [x] Inactive chip style: `border border-border bg-background text-foreground hover:bg-accent`
  - [x] Chip min-height 44px (UX-DR7 touch targets)
  - [x] Each chip: `data-testid={`lifestyle-tag-chip-${tag.toLowerCase().replace(/\s+/g, '-')}`}`
  - [x] Container: `data-testid="lifestyle-tag-chips"` on root div
  - [x] No `× dismiss` button on individual chips (use `FilterChips` for that — see Task 6)
  - [x] Touch-friendly: chips should be `gap-2 flex-wrap md:flex-nowrap overflow-x-auto`

- [x] Task 5: Create smart presets config (AC: #4, #5, #7)
  - [x] Create `src/lib/constants/search-presets.ts`
  - [x] Define `SearchPreset` type and `SEARCH_PRESETS` constant:
    ```ts
    import type { SearchFilters } from "@/types/search";

    export interface SearchPreset {
      id: string;           // unique slug, used in URL and as key
      labelKey: string;     // i18n key under "SearchPage.presets"
      filters: SearchFilters; // the filter set to apply on click
      icon?: string;        // optional emoji or icon name
    }

    export const SEARCH_PRESETS: SearchPreset[] = [
      {
        id: "mountain-retirement",
        labelKey: "mountainRetirement",
        icon: "🏔️",
        filters: {
          areaSlug: "perez-zeledon",
          type: "Casa",
          tags: ["Retire"],
        },
      },
      {
        id: "beach-investment",
        labelKey: "beachInvestment",
        icon: "🌊",
        filters: {
          areaSlug: "uvita",
          tags: ["Investment Property"],
        },
      },
      {
        id: "rental-potential",
        labelKey: "rentalPotential",
        icon: "💰",
        filters: {
          tags: ["Rental Potential"],
        },
      },
      {
        id: "vacation-home",
        labelKey: "vacationHome",
        icon: "🏖️",
        filters: {
          tags: ["Vacation Home"],
        },
      },
    ];
    ```
  - [x] Presets are pure constants — adding a new preset = adding one object here, zero other code changes (AC #7)
  - [x] **NOTE**: The epic specifies "Mountain Retirement Homes" applies `region=mountain, type=house, lifestyle_tag=Retirement Paradise`. The `region` filter doesn't exist in the current `SearchFilters` — use `areaSlug` as the closest equivalent (Pérez Zeledón = mountain region). Do NOT add a `region` field to `SearchFilters` (out of scope for this story).

- [x] Task 6: Create `SmartPresetBar` component (AC: #4, #5)
  - [x] Create `src/components/search/smart-preset-bar.tsx` with `'use client'` directive
  - [x] Props:
    ```ts
    interface SmartPresetBarProps {
      presets?: SearchPreset[];  // defaults to SEARCH_PRESETS from constants
    }
    ```
  - [x] Import `SEARCH_PRESETS` from `@/lib/constants/search-presets`
  - [x] Import `useRouter` from `next/navigation` and `useLocale` from `next-intl`
  - [x] On preset click: build URL `/[locale]/search?` + serialize the preset's `filters` into URL params, then `router.push(url)`
  - [x] URL serialization for preset filters: reuse the same param naming from `useSearchFilters`:
    - `type` → `type`
    - `areaSlug` → `area`
    - `tags` → `tags` (comma-separated)
    - `priceMin` → `price_min`, `priceMax` → `price_max`
  - [x] **IMPORTANT**: Do NOT duplicate the serialization logic — export a helper from `use-search-filters.ts`:
    ```ts
    export function buildSearchUrl(pathname: string, filters: SearchFilters): string
    ```
    This prevents divergence between preset URL generation and filter bar URL writing.
  - [x] `data-testid="smart-preset-bar"` on root div
  - [x] `data-testid={`preset-${preset.id}`}` on each preset button
  - [x] Horizontal scrollable row, same as lifestyle tag chips layout
  - [x] Desktop: visible in filter bar area or as a sub-row below the main filter bar
  - [x] Presets are displayed as pill-shaped buttons with icon + label

- [x] Task 7: Integrate `LifestyleTagChips` into `SearchFilterBar` (AC: #1, #2, #3)
  - [x] Modify `src/components/search/search-filter-bar.tsx`
  - [x] Import `LifestyleTagChips` from `@/components/search/lifestyle-tag-chips`
  - [x] Import `toggleTag` from the updated `useSearchFilters` hook return
  - [x] Add lifestyle tag chips row to the filter controls:
    - Desktop: add as a section within `filterControls` (horizontal chips row)
    - Mobile Sheet: include in the Sheet content alongside other filters
  - [x] Pass `activeTags={filters.tags ?? []}` and `onToggle={toggleTag}` to `LifestyleTagChips`
  - [x] **DO NOT break** any existing test assertions on `SearchFilterBar` (see preserved contracts below)

- [x] Task 8: Extend `FilterChips` to display active lifestyle tags (AC: #6)
  - [x] Modify `src/components/search/filter-chips.tsx`
  - [x] The `FilterChips` component currently renders one chip per active `SearchFilters` key
  - [x] Add handling for `tags` array: render one chip per tag in `filters.tags`:
    - Chip format: `"Lifestyle: Retirement Paradise ×"` — use a `TAG_DISPLAY_LABELS` map
    - **IMPORTANT**: Place `TAG_DISPLAY_LABELS` in `src/lib/constants/lifestyle-tags.ts` (already imported by both `LifestyleTagChips` and `FilterChips`). Add to that file:
      ```ts
      export const TAG_DISPLAY_LABELS: Record<string, string> = {
        "Retire": "Retirement Paradise",
      };
      export function tagDisplayLabel(tag: string): string {
        return TAG_DISPLAY_LABELS[tag] ?? tag;
      }
      ```
    - On dismiss (× click): each tag chip calls `onClearFilter('tags')` which removes ALL tags — the tag chips in `LifestyleTagChips` are the per-tag deselection affordance (re-tap to deselect). This is the MVP approach.
    - **Per-tag chip in FilterChips**: iterate `filters.tags` and render a chip per tag:
      ```ts
      // In FilterChips, after areaSlug chip:
      (filters.tags ?? []).forEach(tag => {
        chips.push({
          key: "tags",  // all tag chips use the same key
          label: t("lifestyleTags.label"),
          value: tagDisplayLabel(tag),
        });
      });
      ```
      Note: clicking × on any tag chip calls `onClearFilter('tags')` which clears ALL tags (MVP). The tag chip row provides per-tag toggle.
    - **React key for tag chips**: Since multiple tags share `key: "tags"`, use `tag` value as the React key instead: change the chip `.map()` key from `chip.key` to a unique value. For tag chips, use key=`tag-${tag}`. The `ChipInfo` type should include optional `reactKey?: string`; or simply push objects with `key: \`tags-${tag}\`` as a workaround (TypeScript: use type assertion or widen the `key` type). **Simplest fix**: add a `reactKey` field to `ChipInfo`:
      ```ts
      interface ChipInfo {
        key: keyof SearchFilters;
        reactKey: string;  // unique key for React rendering
        label: string;
        value: string;
      }
      // For all existing chips, set reactKey = key
      // For tag chips, set reactKey = `tags-${tag}`
      ```
  - [x] **`activeFilterCount` in `FilterChips`**: The component has its own local `activeFilterCount` (line ~100) that drives "Clear all" visibility. Update it to also count tags:
    ```ts
    const activeFilterCount = CHIP_KEYS.filter(key => {
      const val = filters[key];
      return val !== undefined && val !== null;
    }).length + (filters.tags?.length ?? 0);
    ```
  - [x] Do NOT break existing test: `data-testid="filter-chips"`, `data-testid="clear-all-filters"`

- [x] Task 9: Add i18n keys (AC: #1, #4, #5)
  - [x] Modify `src/messages/en.json` — add under `"SearchPage"`:
    ```json
    "lifestyleTags": {
      "label": "Lifestyle",
      "chips": {
        "Rental Potential": "Rental Potential",
        "Investment Property": "Investment Property",
        "Vacation Home": "Vacation Home",
        "Retire": "Retirement Paradise",
        "Commercial": "Commercial"
      }
    },
    "presets": {
      "label": "Quick Searches",
      "mountainRetirement": "Mountain Retirement Homes",
      "beachInvestment": "Beach Investment Land",
      "rentalPotential": "Rental Income Properties",
      "vacationHome": "Vacation Homes"
    }
    ```
  - [x] Modify `src/messages/es.json` — add equivalent Spanish keys:
    ```json
    "lifestyleTags": {
      "label": "Estilo de vida",
      "chips": {
        "Rental Potential": "Potencial de renta",
        "Investment Property": "Propiedad de inversión",
        "Vacation Home": "Casa vacacional",
        "Retire": "Paraíso de retiro",
        "Commercial": "Comercial"
      }
    },
    "presets": {
      "label": "Búsquedas rápidas",
      "mountainRetirement": "Casas de retiro en la montaña",
      "beachInvestment": "Terrenos de inversión en la playa",
      "rentalPotential": "Propiedades para renta",
      "vacationHome": "Casas vacacionales"
    }
    ```

- [x] Task 10: Tests (AC: all)
  - [x] Create `tests/unit/search/lifestyle-tag-chips.spec.tsx` (Vitest + jsdom)
    - Mock `next/navigation`, `next-intl`
    - Mock `@/lib/constants/lifestyle-tags` to return `["Rental Potential", "Investment Property", "Vacation Home", "Retire", "Commercial"]`
    - Test: renders `data-testid="lifestyle-tag-chips"`
    - Test: renders one chip per tag (5 chips total)
    - Test: "Retire" tag renders with display label "Retirement Paradise"
    - Test: active tag chip has `bg-brand-blue` class
    - Test: clicking a chip calls `onToggle` with the correct tag value
    - Test: inactive chip does NOT have `bg-brand-blue`
  - [x] Create `tests/unit/search/smart-preset-bar.spec.tsx` (Vitest + jsdom)
    - Mock `next/navigation` (useRouter)
    - Mock `next-intl` (useTranslations, useLocale)
    - Mock `@/lib/constants/search-presets`
    - Test: renders `data-testid="smart-preset-bar"`
    - Test: renders one button per preset with `data-testid="preset-{id}"`
    - Test: clicking a preset calls `router.push` with correct URL containing expected params (`type=Casa`, `area=perez-zeledon`, `tags=Retire` for mountain-retirement)
  - [x] Update `tests/unit/search/use-search-filters.spec.tsx`
    - Add test: `toggleTag` adds a tag when not present
    - Add test: `toggleTag` removes a tag when already present
    - Add test: `filters.tags` parsed correctly from URL `?tags=Investment+Property,Rental+Potential`
    - Add test: `activeFilterCount` includes tags count
  - [x] Update `tests/unit/search/search-filter-bar.spec.tsx`
    - Add `LifestyleTagChips` mock in the vi.mock section (same hoisting pattern as existing mocks)
    - Test: lifestyle tag chips section renders
  - [x] Update `tests/unit/search/filter-chips.spec.tsx`
    - Test: renders chips for active tags in `filters.tags`
    - Test: "Retire" tag chip shows "Retirement Paradise" display label

- [x] Task 11: CI verification (AC: all)
  - [x] `npm run typecheck` → 0 new errors
  - [x] `npm run lint` → 0 errors
  - [x] `npm run format:check` → pass
  - [x] `npm run build` → pass
  - [x] `npm test` → all existing tests pass + new lifestyle tag tests pass

## Dev Notes

### Critical Architecture Decisions — DO NOT VIOLATE

**Tags filter MUST live in URL query params (AR10):**

Consistent with all other search filters. URL param name is `tags`, value is comma-separated string:
```
/en/search?tags=Investment+Property,Rental+Potential
```
Do NOT store tags in Zustand or component state.

**`LIFESTYLE_TAGS` constant is the single source of truth for tag names:**

File: `src/lib/constants/lifestyle-tags.ts` (do NOT modify tag names — Story 2.6 auto-tagger depends on them).
Current tags: `["Rental Potential", "Investment Property", "Vacation Home", "Retire", "Commercial"]`.
The display label "Retirement Paradise" maps to the stored value "Retire" — use `tagDisplayLabel()` function.

**GIN index `idx_properties_tags` already exists — use `&&` (overlap) operator:**

Architecture §5 and DB schema: `idx_properties_tags` is `GIN` on `lifestyle_tags text[]`. The `&&` operator uses this index. For OR logic (any selected tag matches), `&&` is correct.

**`search-actions.ts` must be extended (NOT replaced):**

It is owned by Story 3.3. This story adds `tags` to the existing `dimConditions` map. Do NOT rewrite the entire file.

**`LIFESTYLE_TAGS` file must remain without `"server-only"` or `"use client"`:**

It is imported by both `lifestyle-tagger.ts` (server sync pipeline) and the new `LifestyleTagChips` (Client Component). Keep it as a neutral constants file.

**Smart presets use client-side navigation (`router.push`), not URL manipulation:**

Presets navigate to a fresh search URL. They do NOT modify the current filter state in-place. This is intentional — presets are discoverable entry points, not incremental filter changes.

### Component File Map

**New files to create:**
```
src/lib/constants/search-presets.ts             ← Smart preset definitions (configurable)
src/components/search/lifestyle-tag-chips.tsx   ← Tag chip row component ('use client')
src/components/search/smart-preset-bar.tsx      ← Smart preset buttons ('use client')
```

**Files to modify:**
```
src/types/search.ts                             ← Add tags?: string[] to SearchFilters
src/hooks/use-search-filters.ts                 ← Add tags param + toggleTag helper
src/app/actions/search-actions.ts               ← Add tags to dimConditions (&&  operator)
src/components/search/search-filter-bar.tsx     ← Integrate LifestyleTagChips
src/components/search/filter-chips.tsx          ← Handle tags array rendering
src/messages/en.json                            ← Add lifestyleTags + presets keys
src/messages/es.json                            ← Add Spanish equivalents
```

**Files to NOT touch (frozen):**
```
src/lib/constants/lifestyle-tags.ts             ← Story 2.6, tag names frozen (tagger depends on them)
src/lib/sync/lifestyle-tagger.ts                ← Story 2.6, frozen
src/app/actions/map-actions.ts                  ← Story 3.2, frozen
src/store/map-store.ts                          ← Story 3.2, frozen
src/lib/map/geo-utils.ts                        ← Story 3.2, frozen
src/components/map/map-view.tsx                 ← Story 3.2, frozen
src/lib/db/schema/properties.ts                 ← Epic 2, frozen
src/lib/db/queries/properties.ts               ← Epic 2, frozen
```

### URL State Schema for Story 3.4

New param:
```
/en/search?tags=Investment+Property,Rental+Potential&type=Casa&area=perez-zeledon
```

**Parsing rules for `tags`:**
- Split by comma: `params.get("tags")?.split(",")`
- Trim each value
- Filter out empty strings
- Decode URI components (spaces encoded as `+` or `%20`)
- Result: `string[]` or `undefined` if empty

**Serialization for `tags`:**
- `tags.join(",")` — commas, no spaces (URL-encoded if needed by `URLSearchParams`)
- `URLSearchParams.set("tags", tags.join(","))` handles encoding

### DB Schema — Lifestyle Tags Column

From `src/lib/db/schema/properties.ts`:
```ts
lifestyleTags: text("lifestyle_tags")
  .array()
  .$type<string[]>()
  .default(sql`ARRAY[]::text[]`)
  .notNull(),
```

PostgreSQL array column with GIN index. The `&&` (overlap) operator returns rows where the column array and the filter array share at least one element (OR logic).

Architecture §6 query pattern (Drizzle 0.44 — JS array serialized as PostgreSQL text array):
```ts
filters.tags?.length
  ? sql`${properties.lifestyleTags} && ${filters.tags}`
  : undefined
```

### Existing Architecture — Do NOT Reinvent

**`formatPriceAbbrev`**: Already in `src/lib/map/geo-utils.ts` — import if needed for preset price display.

**`FilterChips`**: Already at `src/components/search/filter-chips.tsx` — EXTEND it to handle `tags`, do NOT create a separate tags chip component.

**`Sheet`**: Already at `src/components/ui/sheet.tsx` — used by mobile filter bar. No new modal needed.

**`LIFESTYLE_TAGS` constant**: Already in `src/lib/constants/lifestyle-tags.ts` — import from there. Current values:
```ts
export const LIFESTYLE_TAGS = [
  "Rental Potential",
  "Investment Property",
  "Vacation Home",
  "Retire",         // displayed as "Retirement Paradise"
  "Commercial",
] as const;
```

### Architecture Compliance Checklist

- [x] `tags` field added to `SearchFilters` in `src/types/search.ts` — import from there, never redefine
- [x] `tags` URL param uses comma-separated string: `?tags=Retire,Investment+Property`
- [x] `LifestyleTagChips` is `'use client'` (interactive DOM)
- [x] `SmartPresetBar` is `'use client'` (uses `useRouter`)
- [x] `search-presets.ts` has NO `"use client"` or `"server-only"` (neutral constants)
- [x] `lifestyle-tags.ts` NOT modified (frozen — Story 2.6 tagger depends on it)
- [x] `searchProperties` Server Action uses `&&` operator with GIN index
- [x] `toggleTag` helper exported from `useSearchFilters` hook
- [x] `buildSearchUrl` helper exported from `use-search-filters.ts` for preset URL generation

### Test Patterns — Mandatory (from Stories 3.1–3.3 Learnings)

1. **`vi.mock` hoisting**: Declare ALL mocks BEFORE component imports. Use `vi.hoisted()` when mock factory references a variable declared outside it (established in Story 3.3 `search-actions.spec.ts`).

2. **jsdom env**: Files in `tests/unit/search/**/*.spec.tsx` automatically get jsdom (vitest.config.ts `environmentMatchGlobs`). Do NOT change the glob.

3. **`.spec.ts` vs `.spec.tsx`**: Pure TS tests (utilities) use `.spec.ts` (Node env). React component/hook tests use `.spec.tsx` (jsdom env). The `toggleTag` hook test must be `.spec.tsx` (it uses React hooks).

4. **Mock `next/navigation`**: Any component using `useRouter`, `useSearchParams`, or `usePathname` MUST mock `next/navigation`.

5. **Mock `next-intl`**: Any component using `useTranslations` or `useLocale` MUST mock `next-intl`.

6. **Mock `@/lib/constants/lifestyle-tags`**: Tests for `LifestyleTagChips` should mock this import to control the tag list in tests.

7. **Existing test contracts that MUST be preserved** (do NOT break):
   - `search-filter-bar.spec.tsx`: `data-testid="search-filter-bar"`, sticky/z-10/h-12/h-14 CSS classes, `data-testid="mobile-filters-button"`, `'use client'` directive
   - `filter-chips.spec.tsx`: `data-testid="filter-chips"`, `data-testid="clear-all-filters"`
   - `use-search-filters.spec.tsx`: existing `setFilter`, `clearAll`, `activeFilterCount` tests

8. **`vi.mock` pattern for `LifestyleTagChips` in `search-filter-bar.spec.tsx`**:
   ```ts
   // At top, before any imports:
   vi.mock("@/components/search/lifestyle-tag-chips", () => ({
     LifestyleTagChips: () => <div data-testid="lifestyle-tag-chips" />,
   }));
   // Then import component under test:
   import { SearchFilterBar } from "@/components/search/search-filter-bar"; // imported AFTER mocks
   ```

### Data Flow Diagram (Story 3.4 additions to Story 3.3 flow)

```
[page.tsx (Server RSC)]
  └─► [SearchPageClient (Client, 'use client')]
        ├─► useSearchFilters() ← reads URL params (now including "tags")
        │     └─► filters: SearchFilters (from URL)
        │           └─► filters.tags?: string[]  ← NEW
        │
        ├─► searchProperties(filters) [Server Action, search-actions.ts]
        │     └─► PostgreSQL + idx_properties_tags (GIN)
        │           └─► lifestyleTags && ARRAY[...tags]  ← NEW OR logic
        │
        ├─► [SearchFilterBar] ← receives filters, facets, setFilter, clearAll, toggleTag (NEW)
        │     ├─► Type dropdown, Price slider, Beds/Baths dropdowns, Lot range, Area
        │     ├─► [LifestyleTagChips] ← NEW: tag chip row (OR logic selection)
        │     ├─► [FilterChips] ← extended to show active tags as chips
        │     └─► Mobile: Sheet includes LifestyleTagChips
        │
        └─► [SplitViewLayout]
              └─► Grid + Map (unchanged from Story 3.3)
```

### Story Scope Boundaries

**This story DOES implement:**
- `tags?: string[]` field in `SearchFilters`
- `toggleTag` helper in `useSearchFilters` hook
- `tags` URL param (comma-separated) encode/decode
- `searchProperties` Server Action — add `tags` filter using `&&` operator and GIN index
- `LifestyleTagChips` component (multi-select chip row)
- `SmartPresetBar` component with configurable presets
- `SEARCH_PRESETS` constant in `src/lib/constants/search-presets.ts`
- Display label mapping ("Retire" → "Retirement Paradise")
- `FilterChips` extension to show active tag chips
- i18n keys for tag labels and preset names
- Unit tests for all new components and updated hook

**This story does NOT implement:**
- Full Province → Cantón → Distrito drill-down (Epic 6)
- Real property cards in grid view (Story 3.5)
- `region` URL parameter (not in current `SearchFilters` — out of scope)
- Admin UI for managing lifestyle tags (Epic 8, Story 8.4)
- PropertyCard display of lifestyle tag badges (Story 3.5)
- "Near Me" button (Story 3.8)
- Playwright E2E tests (ATDD phase, separate step)
- Pagination (Story 3.5)

### Previous Story Intelligence (Story 3.3)

1. **`use-search-filters.ts` pattern**: The hook uses `latestParamsRef` to prevent race conditions when multiple debounced updates fire simultaneously. `toggleTag` does NOT need debouncing (instant) — but it MUST use `latestParamsRef.current` when reading the current tag list to avoid stale closures, similar to the `performUpdate` pattern.

2. **`filter-chips.tsx` chip rendering**: Current chips exclude `view` and `sort`. Add `tags` handling — render one chip per tag in `filters.tags[]`. Use `tagDisplayLabel()` for display.

3. **Mocking `PriceRangeSlider` and `Sheet` in filter bar tests**: Tests mock these to avoid jsdom `ResizeObserver` issues. Add similar mock for `LifestyleTagChips` in `search-filter-bar.spec.tsx`.

4. **`vi.hoisted()` for mock factories**: Used in `search-actions.spec.ts` to fix vi.mock factory hoisting. Apply same pattern if `search-presets.ts` mock needs a variable reference.

5. **`PARAM_MAP` in `use-search-filters.ts`**: Must be extended with `tags: "tags"`. The existing hook's `serializeValue` function returns `String(value)` for non-array values — extend it to handle arrays: `if (Array.isArray(value)) return value.join(",")`.

6. **Story 3.3 completion notes**: 364 tests passing after Story 3.3. This story should not reduce that count. All existing tests must remain green.

### Git Intelligence (Recent Commits)

1. `story-3.3-search-filters-and-url-state - fixes #87 (#125)` — Story 3.3 complete, all filter infrastructure in place
2. `Fix: Map Image Placeholder & Dev Environment Hardening (#124)` — Map placeholder fix
3. `chore(3.3): mark story 3.3 done in sprint-status.yaml` — Sprint status update

**Key patterns from Stories 3.2–3.3:**
- Server Actions: `"use server"` directive, `sanitizeNumber()` pattern for defensive input validation
- Input sanitization: `Number.isFinite()` before DB queries
- Race condition prevention: `requestSeqRef` in `search-page-client.tsx`
- Test pattern: `vi.mock` before imports, `vi.hoisted()` for factory variables
- Tailwind v4 CSS-first: `bg-brand-blue` (not hex `#0043FF`) for active states

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4: Lifestyle Tags & Smart Presets — lines 1186-1217]
- [Source: _bmad-output/planning-artifacts/epics.md#FR4 — Filter by lifestyle tags (OR logic)]
- [Source: _bmad-output/planning-artifacts/epics.md#FR15 — Smart search presets (configurable)]
- [Source: _bmad-output/planning-artifacts/architecture.md#§6 Search Query API — filters.tags && operator]
- [Source: _bmad-output/planning-artifacts/architecture.md#§3 src/lib/constants/lifestyle-tags.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md#§3 src/lib/constants/search-presets.ts (implied)]
- [Source: _bmad-output/planning-artifacts/architecture.md#§5 Step 6 — lifestyle-tagger.ts auto-tagging]
- [Source: _bmad-output/planning-artifacts/architecture.md#Key Indexes — idx_properties_tags GIN index]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management — Search filters = URL query params (AR10)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§Search Page — Filter bar row with Lifestyle chips]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§Journey 1: Maria — Selects lifestyle tag 'Retirement Paradise']
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§Journey 3: Hans — Lifestyle tag 'Investment Property']
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Smart presets — "Beach homes under $300K" is one tap]
- [Source: _bmad-output/planning-artifacts/prd.md#FR15 — Smart search presets]
- [Source: src/lib/constants/lifestyle-tags.ts — LIFESTYLE_TAGS, LifestyleTag type]
- [Source: src/types/search.ts — SearchFilters, SearchResult, FilterFacets types]
- [Source: src/hooks/use-search-filters.ts — PARAM_MAP, FILTER_KEYS, parseFilters, serializeValue]
- [Source: src/app/actions/search-actions.ts — dimConditions pattern, sanitizeNumber]
- [Source: src/components/search/search-filter-bar.tsx — filterControls layout, Sheet mobile pattern]
- [Source: src/components/search/filter-chips.tsx — chip rendering, clear all pattern]
- [Source: src/lib/db/schema/properties.ts — lifestyleTags: text[].array(), idx_properties_tags GIN]
- [Source: _bmad-output/implementation-artifacts/3-3-search-filters-and-url-state.md#Dev Notes]

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-4-lifestyle-tags-and-smart-presets.md`
- Unit tests (new): `tests/unit/search/lifestyle-tag-chips.spec.tsx`
- Unit tests (new): `tests/unit/search/smart-preset-bar.spec.tsx`
- E2E tests (new): `tests/e2e/lifestyle-tags-and-smart-presets.spec.ts`
- Unit tests (updated): `tests/unit/search/use-search-filters.spec.tsx`
- Unit tests (updated): `tests/unit/search/filter-chips.spec.tsx`
- Unit tests (updated): `tests/unit/search/search-filter-bar.spec.tsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 11 tasks implemented and verified with 423 passing tests (59 new tests added)
- Task 1: SearchFilters.tags already in ATDD stub — confirmed correct
- Task 2: Implemented tags parsing, toggleTag helper, updated activeFilterCount, buildSearchUrl fully using PARAM_MAP
- Task 3: Added tags to dimConditions in search-actions.ts using PostgreSQL && operator on GIN-indexed array
- Task 4: Added TAG_DISPLAY_LABELS and tagDisplayLabel to lifestyle-tags.ts; LifestyleTagChips component complete
- Task 5: Created search-presets.ts with SearchPreset type and SEARCH_PRESETS constant (4 presets)
- Task 6: SmartPresetBar complete — uses buildSearchUrl, router.push for full navigation
- Task 7: Integrated LifestyleTagChips into SearchFilterBar filterControls
- Task 8: Extended FilterChips with tag chips, reactKey field for unique React keys, updated activeFilterCount
- Task 9: Added lifestyleTags + presets i18n keys to en.json and es.json
- Task 10: All ATDD tests pass; fixed require() ESM bug in smart-preset-bar.spec.tsx; fixed lint in use-search-filters.spec.tsx
- Task 11: typecheck 0 errors, lint 0 errors, format pass, build pass, 423 tests passing

### File List

- src/types/search.ts
- src/hooks/use-search-filters.ts
- src/app/actions/search-actions.ts
- src/lib/constants/lifestyle-tags.ts
- src/lib/constants/search-presets.ts
- src/components/search/lifestyle-tag-chips.tsx
- src/components/search/smart-preset-bar.tsx
- src/components/search/search-filter-bar.tsx
- src/components/search/filter-chips.tsx
- src/messages/en.json
- src/messages/es.json
- tests/unit/search/lifestyle-tag-chips.spec.tsx
- tests/unit/search/smart-preset-bar.spec.tsx
- tests/unit/search/use-search-filters.spec.tsx
- tests/unit/search/filter-chips.spec.tsx
- tests/unit/search/search-filter-bar.spec.tsx

### Change Log

- 2026-05-01: Story 3.4 created — lifestyle tags & smart presets, status → ready-for-dev
- 2026-05-01: Story 3.4 implemented — all 11 tasks complete, 423 tests passing, status → review
- 2026-05-01: Code review applied — i18n wiring fixes, defensive tag sanitisation, button-type hardening; 426 tests passing, status → done

### Review Findings

- [x] [Review][Patch] SmartPresetBar rendered raw `labelKey` instead of translating it [src/components/search/smart-preset-bar.tsx:51] — fixed: now reads `t("presets.{labelKey}")` with safe fallback
- [x] [Review][Patch] LifestyleTagChips and FilterChips ignored `lifestyleTags.chips.*` i18n keys (Spanish locale showed English labels) [src/components/search/lifestyle-tag-chips.tsx, src/components/search/filter-chips.tsx] — fixed: both now consult `useTranslations("SearchPage")` and fall back to `tagDisplayLabel()`
- [x] [Review][Patch] Tag/preset buttons missing `type="button"` (would submit ancestor forms) [smart-preset-bar.tsx, lifestyle-tag-chips.tsx] — fixed
- [x] [Review][Patch] `searchProperties` Server Action did not sanitize `filters.tags` (publicly callable surface, no length cap) [src/app/actions/search-actions.ts] — fixed: trims, drops empties/non-strings, caps at 20 entries
- [x] [Review][Defer] Add `aria-label` / `role="group"` to LifestyleTagChips container — pre-existing a11y polish, deferred
- [x] [Review][Defer] `latestParamsRef.current` mutation during render in `useSearchFilters` — pre-existing pattern from Story 3.3, deferred
