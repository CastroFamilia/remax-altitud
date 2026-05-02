# Story 3.7: Unit Conversion & Price Display

Status: review

## Story

As a **visitor**,
I want to see property sizes in my preferred units and prices in my currency,
so that I can evaluate properties using measurements I understand.

## Acceptance Criteria

1. **Given** a European browser locale **When** viewing property sizes **Then** m² and hectares are displayed by default (FR9)

2. **Given** a US browser locale **When** viewing property sizes **Then** ft² and acres are displayed by default (FR9)

3. **Given** a unit toggle on property specs **When** clicked **Then** all displayed measurements switch between m²/hectares and ft²/acres (FR9)

4. **Given** the unit preference **When** set by the user **Then** it persists in localStorage across sessions (AR10)

5. **Given** a property price **When** displayed **Then** it shows USD as primary with approximate EUR conversion for non-US locales (FR10)

6. **Given** any property card or listing **When** ZMT/ownership status is available **Then** a badge shows "Titled Property ✓" / "Concession" / "ZMT Restricted" with icon + label (not color alone) (FR11)

7. **And** price formatting respects locale conventions (commas vs. periods)

## Tasks / Subtasks

- [x] Task 1: Create `src/lib/utils/units.ts` — unit conversion utilities (AC: #1, #2, #3, #4)
  - [x] Create the file at EXACTLY `src/lib/utils/units.ts` — **this file does NOT exist yet** (architecture §3 specifies it)
  - [x] Define `UnitSystem` type: `'metric' | 'imperial'`
  - [x] Implement `detectDefaultUnitSystem(locale: string): UnitSystem`:
    - **CRITICAL**: Project i18n routing (`src/i18n/routing.ts`) only supports locales `'en'` and `'es'`. There is no `'en-US'` in the URL routing.
    - For browser locale detection (used in the hook): check `navigator.language` which CAN be `'en-US'`
    - For URL locale parameter (path-based like `/en/...`): treat `'en'` as potentially US → imperial
    - Implementation: Returns `'imperial'` if locale is `'en'`, `'en-US'`, or starts with `'en-'`; returns `'metric'` for all others (e.g., `'es'`)
    - This means Costa Rica Spanish speakers (`'es'`) get metric; English speakers get imperial (appropriate for likely US/Canadian buyers)
  - [x] Implement `convertArea(m2: number, system: UnitSystem, threshold?: number): string`:
    - `metric` path: if `m2 >= 10000` → format as hectares (1 ha = 10000 m²); else format as m²
    - `imperial` path: if `m2 >= 40468.6` (≈10 acres threshold) → format as acres (1 acre = 4046.86 m²); else format as ft² (1 m² = 10.7639 ft²)
    - Use `Intl.NumberFormat` for locale-appropriate number formatting
    - Return format: `"1.5 ha"`, `"350 m²"`, `"2.3 acres"`, `"3,767 ft²"`
  - [x] Conversion constants (must be exact for test assertions — test design R-014):
    - `SQFT_PER_M2 = 10.7639` (1 ft² = 0.0929 m²; 1 m² = 10.7639 ft²)
    - `M2_PER_ACRE = 4046.86` (1 acre = 0.4047 ha)
    - `M2_PER_HA = 10000`
  - [x] Export `UnitSystem`, `detectDefaultUnitSystem`, `convertArea`, conversion constants

- [x] Task 2: Create `src/lib/utils/currency.ts` — USD → EUR conversion (AC: #5, #7)
  - [x] Create the file at EXACTLY `src/lib/utils/currency.ts` — **this file does NOT exist yet** (architecture §3 specifies it)
  - [x] Define a static approximate EUR exchange rate constant: `const EUR_RATE = 0.92` (approximate USD→EUR, build-time static per test-design assumption §5 — NOT a live API call)
  - [x] Implement `formatUSD(price: number, locale: string): string`:
    - Use `Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })` for locale-appropriate formatting
    - Result: `"$185,000"` (en-US) or `"185.000 $"` (de-DE) — commas vs periods locale-correct
  - [x] Implement `formatEUR(price: number, locale: string): string`:
    - Converts USD price to EUR: `Math.round(price * EUR_RATE)`
    - Uses `Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })` for locale-appropriate formatting
  - [x] Implement `isNonUSLocale(locale: string): boolean`:
    - Returns `true` when locale is NOT `'en'` and does NOT start with `'en-'`
    - Examples: `'en'` → false, `'en-US'` → false, `'es'` → true, `'de-DE'` → true
    - Used to determine whether to show EUR conversion (FR10)
  - [x] Export `EUR_RATE`, `formatUSD`, `formatEUR`, `isNonUSLocale`

- [x] Task 3: Create `src/hooks/use-locale-units.ts` — localStorage-persisted unit preference (AC: #3, #4)
  - [x] Create the file at EXACTLY `src/hooks/use-locale-units.ts` — **this file does NOT exist yet** (architecture §3 specifies it)
  - [x] Add `'use client'` — this hook uses `localStorage` and React state (Client-only)
  - [x] Implement `useLocaleUnits(locale: string)` hook:
    ```ts
    const STORAGE_KEY = 'unit-preference';

    export function useLocaleUnits(locale: string) {
      const defaultSystem = detectDefaultUnitSystem(locale);
      const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
        // SSR-safe: only read localStorage in client
        if (typeof window === 'undefined') return defaultSystem;
        const stored = localStorage.getItem(STORAGE_KEY);
        return (stored === 'metric' || stored === 'imperial') ? stored : defaultSystem;
      });

      const toggleUnits = useCallback(() => {
        setUnitSystem(prev => {
          const next = prev === 'metric' ? 'imperial' : 'metric';
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      }, []);

      return { unitSystem, toggleUnits, convertArea } as const;
    }
    ```
  - [x] **FOUC prevention** (R-011): The `useState` initializer MUST read localStorage synchronously (not in a `useEffect`) to avoid flash of wrong units on first render
  - [x] Import `detectDefaultUnitSystem`, `convertArea`, `UnitSystem` from `@/lib/utils/units`
  - [x] Import `useState`, `useCallback` from `'react'`
  - [x] Export `useLocaleUnits`

- [x] Task 4: Create `src/components/layout/unit-toggle.tsx` — UX unit toggle component (AC: #3, #4)
  - [x] Create the file at EXACTLY `src/components/layout/unit-toggle.tsx` — **this file does NOT exist yet** (architecture §3 specifies it in `src/components/layout/`)
  - [x] Add `'use client'` as first line — this IS a Client Component (localStorage, toggle state)
  - [x] Architecture §8: `UnitToggle` is explicitly listed as a Client Component
  - [x] Props interface:
    ```ts
    interface UnitToggleProps {
      locale: string;
      className?: string;
    }
    ```
  - [x] Use `useLocaleUnits(locale)` hook internally
  - [x] Render a toggle button (use Radix-based `<Switch>` or a simple `<button>` with ARIA) showing `"m²"` vs `"ft²"`:
    ```tsx
    <button
      type="button"
      role="switch"
      aria-checked={unitSystem === 'metric'}
      aria-label={t('label')}
      onClick={toggleUnits}
      data-testid="unit-toggle"
      className="..."
    >
      <span aria-hidden="true">{unitSystem === 'metric' ? 'm²' : 'ft²'}</span>
    </button>
    ```
  - [x] The UX spec (line 1769) states: "UnitToggle | m²/acres/ft², persists preference in localStorage | Switch base" — implement as a switch-style toggle
  - [x] Use `useTranslations('UnitToggle')` for i18n (add new namespace — see Task 7)
  - [x] Export `UnitToggle`
  - [x] `data-testid="unit-toggle"` on root element

- [x] Task 5: Update `PropertyCard` to use locale-aware units and price display (AC: #1–#7)
  - [x] **File**: `src/components/property/property-card.tsx` (MODIFY — exists from Story 3.5)
  - [x] **CRITICAL**: `PropertyCard` is a **Server Component** (RSC). It CANNOT use hooks like `useLocaleUnits` directly. Unit system must be passed as a prop.
  - [x] Add `unitSystem?: UnitSystem` prop to `PropertyCardProps`:
    ```ts
    interface PropertyCardProps {
      property: PropertySearchItem;
      locale: string;
      variant?: "default" | "compact" | "horizontal";
      unitSystem?: UnitSystem;  // NEW: defaults to 'metric'
    }
    ```
  - [x] Import `UnitSystem` from `@/lib/utils/units`
  - [x] Import `convertArea` from `@/lib/utils/units`
  - [x] Replace the existing inline `formatArea` function (lines 48-53 in current file) with `convertArea(value, unitSystem ?? 'metric')` — **DELETE the old `formatArea` function** to avoid duplication (wheel-reinvention prevention!)
  - [x] Import `formatUSD`, `formatEUR`, `isNonUSLocale` from `@/lib/utils/currency`
  - [x] Replace `formatPriceAbbrev(property.priceUsd)` with `formatUSD(property.priceUsd, locale)` for full price display
  - [x] For non-US locales, display EUR approximate below USD price:
    ```tsx
    {/* Price */}
    <p data-testid="property-price" className="font-bold text-xl text-[--color-accent]">
      {formatUSD(property.priceUsd, locale)}
    </p>
    {isNonUSLocale(locale) && (
      <p data-testid="property-price-eur" className="text-xs text-muted-foreground">
        ≈ {formatEUR(property.priceUsd, locale)}
      </p>
    )}
    ```
  - [x] Update lot/built area display to use `convertArea`:
    ```tsx
    {property.lotSizeM2 !== null && (
      <span>{t("specs.lot", { size: convertArea(property.lotSizeM2, unitSystem ?? 'metric') })}</span>
    )}
    {property.constructionM2 !== null && (
      <>
        <span>·</span>
        <span>{t("specs.built", { size: convertArea(property.constructionM2, unitSystem ?? 'metric') })}</span>
      </>
    )}
    ```
  - [x] **ZMT badge already exists** in PropertyCard (lines 168-176 in current file) — it already renders icon + label using i18n. DO NOT remove or change the ZMT badge. Just verify it uses icon + label (not color alone — AC #6). The existing implementation already complies.
  - [x] **DO NOT break** `data-testid` values: `property-card`, `property-price`, `property-specs`, `zmt-badge`, `property-image`, `region-badge` — existing tests assert on these
  - [x] Remove the `formatPriceAbbrev` import from `@/lib/map/geo-utils` if it's no longer used in property-card (keep it in geo-utils.ts itself — still used by map pins)

- [x] Task 6: Update parent components to pass `unitSystem` prop to `PropertyCard` (AC: #1–#4)
  - [x] **File**: `src/components/search/split-view-layout.tsx` (MODIFY — exists from Stories 3.1/3.3/3.5/3.6)
    - This component is `'use client'` — it CAN use `useLocaleUnits`
    - Import `useLocaleUnits` from `@/hooks/use-locale-units`
    - Call `const { unitSystem, toggleUnits } = useLocaleUnits(locale);`
    - Pass `unitSystem={unitSystem}` to `PropertyGrid` (which passes to `PropertyCard`)
    - Optionally render `<UnitToggle locale={locale} />` in the filter bar area
  - [x] **File**: `src/components/property/property-grid.tsx` (MODIFY — exists from Story 3.5)
    - Add `unitSystem?: UnitSystem` to `PropertyGridProps`
    - Pass `unitSystem` down to each `<PropertyCard unitSystem={unitSystem} />`
  - [x] **File**: `src/components/map/map-pull-up-sheet.tsx` (MODIFY — exists from Story 3.6)
    - Add `unitSystem?: UnitSystem` to `MapPullUpSheetProps`
    - Pass `unitSystem` to `<PropertyCard unitSystem={unitSystem} />` in both half and full states

- [x] Task 7: Add i18n keys for new components (AC: #3, #4, #5)
  - [x] **File**: `src/messages/en.json` — add new `"UnitToggle"` namespace at top level:
    ```json
    "UnitToggle": {
      "label": "Toggle area units",
      "metric": "m²",
      "imperial": "ft²"
    }
    ```
  - [x] **File**: `src/messages/es.json` — add equivalent:
    ```json
    "UnitToggle": {
      "label": "Cambiar unidades de área",
      "metric": "m²",
      "imperial": "ft²"
    }
    ```
  - [x] Note: `PropertyCard` i18n already has `"specs.lot"` and `"specs.built"` — these just pass the formatted string through `{size}`, so no changes needed to existing PropertyCard i18n keys
  - [x] Note: ZMT badge i18n keys (`zmtStatus.titled`, `zmtStatus.concession`, `zmtStatus.zmt_restricted`) already exist — **DO NOT re-add them**

- [x] Task 8: Unit tests for `units.ts` (AC: #1, #2, #3 — test design 3.7-UNIT-001, 3.7-UNIT-002)
  - [x] Create `tests/unit/search/units.spec.ts` (Vitest — node environment, NOT jsdom — no JSX)
    - **Important**: This is a `.ts` (not `.tsx`) file. The `environmentMatchGlobs` only affects `.tsx` files in `tests/unit/search/` — `.ts` files use node environment which is fine for pure utils
  - [x] Tests to write:
    - `[P0]` ft² conversion: `convertArea(100, 'imperial')` returns `"1,076 ft²"` (100 × 10.7639 ≈ 1076)
    - `[P0]` m² → ft² boundary: values < 40468.6 m² show ft², values ≥ 40468.6 show acres
    - `[P0]` acres conversion: `convertArea(40469, 'imperial')` returns string containing `"acres"` (10+ acres threshold)
    - `[P0]` m² metric: `convertArea(350, 'metric')` returns `"350 m²"`
    - `[P0]` hectares: `convertArea(15000, 'metric')` returns `"1.5 ha"` (15000 ÷ 10000 = 1.5)
    - `[P0]` detectDefaultUnitSystem('en') → `'imperial'` (project locale)
    - `[P0]` detectDefaultUnitSystem('en-US') → `'imperial'` (browser locale)
    - `[P0]` detectDefaultUnitSystem('de-DE') → `'metric'` (browser locale)
    - `[P0]` detectDefaultUnitSystem('es') → `'metric'` (project locale)
    - `[P1]` 3.7-UNIT-001: 1 ft² = 0.0929 m² → `convertArea(0.0929, 'imperial')` ≈ `"1 ft²"`
    - `[P1]` 3.7-UNIT-002: 1 acre = 0.4047 ha → `convertArea(4046.86, 'imperial')` ≈ `"1 acre"`

- [x] Task 9: Unit tests for `currency.ts` (AC: #5, #7 — test design 3.7-UNIT-003)
  - [x] Create `tests/unit/search/currency.spec.ts` (Vitest — node environment)
  - [x] Tests to write:
    - `[P0]` `formatUSD(185000, 'en-US')` returns `"$185,000"` (US comma separator)
    - `[P0]` `isNonUSLocale('en')` → `false` (project locale — English = US audience)
    - `[P0]` `isNonUSLocale('en-US')` → `false` (browser locale)
    - `[P0]` `isNonUSLocale('de-DE')` → `true` (browser locale)
    - `[P0]` `isNonUSLocale('es')` → `true` (project locale — Spanish audience gets EUR)
    - `[P0]` `formatEUR(185000, 'en-US')` returns a string containing `"EUR"` or `"€"` and the converted value
    - `[P1]` 3.7-UNIT-003: `formatUSD(1234567, 'en-US')` contains `"1,234,567"` (comma separator for US)
    - `[P1]` EUR_RATE constant exists and is a number between 0.8 and 1.0 (sanity check)

- [x] Task 10: Unit tests for `UnitToggle` component (AC: #3, #4)
  - [x] Create `tests/unit/search/unit-toggle.spec.tsx` (Vitest + jsdom — environmentMatchGlobs covers `tests/unit/search/**/*.spec.tsx`)
  - [x] Mocks needed:
    ```ts
    vi.mock('next-intl', () => ({
      useTranslations: vi.fn(() => (key: string) => key),
    }));
    vi.mock('@/hooks/use-locale-units', () => ({
      useLocaleUnits: vi.fn(() => ({
        unitSystem: 'metric',
        toggleUnits: vi.fn(),
        convertArea: vi.fn(),
      })),
    }));
    ```
  - [x] Tests to write:
    - `[P0]` renders `data-testid="unit-toggle"` button
    - `[P0]` shows `"m²"` when `unitSystem === 'metric'`
    - `[P0]` shows `"ft²"` when `unitSystem === 'imperial'` (via mock returning imperial)
    - `[P0]` clicking the toggle calls `toggleUnits`
    - `[P0]` has `role="switch"` and `aria-checked="true"` when metric, `aria-checked="false"` when imperial
    - `[P1]` has `aria-label` set

- [x] Task 11: Update existing `property-card.spec.tsx` to reflect new props (AC: regression)
  - [x] **File**: `tests/unit/search/property-card.spec.tsx` (MODIFY — exists from Story 3.5)
  - [x] Add mock for new imports:
    ```ts
    vi.mock('@/lib/utils/units', () => ({
      convertArea: vi.fn((m2: number) => `${m2} m²`),
      detectDefaultUnitSystem: vi.fn(() => 'metric'),
      UnitSystem: 'metric',
    }));
    vi.mock('@/lib/utils/currency', () => ({
      formatUSD: vi.fn((price: number) => `$${price}`),
      formatEUR: vi.fn((price: number) => `€${Math.round(price * 0.92)}`),
      isNonUSLocale: vi.fn(() => false),
    }));
    ```
  - [x] Remove the `formatPriceAbbrev` mock from `@/lib/map/geo-utils` if PropertyCard no longer imports it
  - [x] **KEEP ALL EXISTING TESTS** — they must continue passing
  - [x] Add test: renders `data-testid="property-price-eur"` when locale is `"de"` and `isNonUSLocale` returns `true`

- [x] Task 12: CI verification (AC: all)
  - [x] `npm run typecheck` → 0 new errors
  - [x] `npm run lint` → 0 errors
  - [x] `npm run format:check` → pass
  - [x] `npm run build` → pass
  - [x] `npm test` → all existing tests pass + new unit tests pass

## Dev Notes

### CRITICAL: Three New Files to CREATE

Architecture §3 explicitly specifies these files — create them at the exact paths:
```
src/lib/utils/units.ts          ← NEW: m² ↔ acres ↔ ft² ↔ hectares
src/lib/utils/currency.ts       ← NEW: USD → EUR conversion
src/hooks/use-locale-units.ts   ← NEW: Locale-aware unit conversion hook
src/components/layout/unit-toggle.tsx  ← NEW: Unit toggle Client Component
```

None of these exist yet. `src/lib/utils/` directory itself also does NOT exist — create it.

### CRITICAL: PropertyCard is an RSC — Hooks Cannot Be Used Directly

`PropertyCard` is a **Server Component** (architecture §8). It renders on the server. Hooks like `useLocaleUnits` CANNOT be called inside it. The unit system must be passed as a prop from the parent Client Component that holds the hook state.

**IMPORTANT**: `PropertyGrid` already has `'use client'` (uses `useTranslations` from `next-intl` for pagination labels). So it IS a Client Component in practice, despite architecture's intent. This means `PropertyGrid` CAN use hooks — but for simplicity and architectural compliance, just pass `unitSystem` as a prop from `SplitViewLayout` rather than calling the hook again in `PropertyGrid`.

The data flow is:
```
SplitViewLayout (Client) → useLocaleUnits() → unitSystem prop
    → PropertyGrid (Client component, receives unitSystem prop — DO NOT call useLocaleUnits here)
        → PropertyCard (Server, receives unitSystem prop)
```

Only `SplitViewLayout` should call `useLocaleUnits`. `PropertyGrid` simply passes the prop through.

### CRITICAL: DELETE Duplicate `formatArea` in PropertyCard

The existing `property-card.tsx` has a local `formatArea` function (lines 48-53). When you add `convertArea` from `src/lib/utils/units.ts`, **DELETE** the local function entirely. Using both is wheel reinvention and a regression risk.

### Currency Display Strategy (FR10)

Architecture §5 states: "USD-canonical pricing — All prices stored and displayed in USD. Non-US locales (DE, FR, IT, PT) show an approximate EUR conversion via live exchange rate."

The test design §Assumptions (line 503) clarifies: **"The EUR conversion rate is fetched once at build time (or approximate static rate) — not a live rate."**

Implementation decision: Use a static constant `EUR_RATE = 0.92` (approximate 2024-2025 USD→EUR). No API calls, no environment variables. This is intentional — the PRD says "approximate EUR conversion" (FR10).

### localStorage FOUC Prevention (R-011)

Risk R-011 in test design: "localStorage unit preference not initialized on first render — FOUC (flash of unconverted units)."

Mitigation: Initialize `useState` with a function that synchronously reads `localStorage` (not via `useEffect`). The initializer runs only on the client, so SSR receives the `detectDefaultUnitSystem(locale)` fallback (no hydration mismatch because the component is `'use client'`).

### Unit Conversion Math (R-014)

Test design R-014 requires exact formula verification. Use these constants:
- `1 ft² = 0.0929 m²` → `1 m² = 10.7639 ft²` → multiply m² by `10.7639`
- `1 acre = 4046.86 m²` → divide m² by `4046.86`
- `1 ha = 10000 m²` → divide m² by `10000`
- Acre threshold for display: `m2 >= 40468.6` (≈10 acres, same logic as m²/ha threshold at 10,000 m²)

### Locale Detection for Unit System (FR9)

**Project locales are `'en'` and `'es'` only** (see `src/i18n/routing.ts`). There is no `'en-US'` URL path.

Mapping:
- `'en'` → imperial (ft², acres) — English = likely US/Canadian buyer audience
- `'es'` → metric (m², ha) — Spanish = likely local Costa Rican audience
- `navigator.language` (browser API) may return `'en-US'` or `'de-DE'` — hook reads this for fallback default

The `detectDefaultUnitSystem(locale)` function should treat any `'en'`-prefixed locale as imperial:
```ts
function detectDefaultUnitSystem(locale: string): UnitSystem {
  return locale === 'en' || locale.startsWith('en-') ? 'imperial' : 'metric';
}
```

PRD §FR9: "Auto-converted to acres for `en-US` locale and hectares for lots >5,000 m²"

For hectare threshold: PRD says ">5,000 m²" for lots. But for construction areas, always use m². The `convertArea` function should use the 10,000 m² threshold for simplicity (matching the existing `formatArea` in `property-card.tsx` which uses 10,000 m² → ha). Stick to the existing behavior to avoid breaking visual regression.

For `isNonUSLocale` in `currency.ts`: since the project locale is `'en'` for English, treat `'en'` as US locale (no EUR conversion). Only show EUR for `'es'` locale or any non-English locale:

### ZMT Badge — Already Implemented

The ZMT badge (AC #6) is already implemented in `property-card.tsx`:
- Green badge + "✓" icon for `titled` → "Titled Property"
- Amber badge + "◑" icon for `concession` → "Concession"
- Red badge + "⚠" icon for `zmt_restricted` → "ZMT Restricted"
- `data-testid="zmt-badge"` already present
- Uses icon + label (not color alone — AC #6 compliant)

**Do NOT recreate or modify the ZMT badge** — it already satisfies FR11 and AC #6. Just verify it's intact.

### Architecture Classification

| Component | Type | Reason |
|-----------|------|--------|
| `units.ts` | Pure utility (no client/server) | Pure functions |
| `currency.ts` | Pure utility (no client/server) | Pure functions |
| `use-locale-units.ts` | Client hook (`'use client'`) | Uses localStorage, useState |
| `UnitToggle` | Client Component (`'use client'`) | Uses hook, has toggle state |
| `PropertyCard` | Server Component (no `'use client'`) | Static data render only |
| `PropertyGrid` | Client Component (has `'use client'`) | Uses useTranslations for pagination i18n |
| `SplitViewLayout` | Client Component (existing `'use client'`) | Calls useLocaleUnits |

### File Structure — Exact Paths

**Files to CREATE (do not exist):**
```
src/lib/utils/                                    ← New directory
src/lib/utils/units.ts                            ← New: unit conversion utilities
src/lib/utils/currency.ts                         ← New: currency formatting
src/hooks/use-locale-units.ts                     ← New: localStorage unit preference hook
src/components/layout/unit-toggle.tsx             ← New: UnitToggle Client Component
tests/unit/search/units.spec.ts                   ← New: unit conversion tests
tests/unit/search/currency.spec.ts                ← New: currency formatting tests
tests/unit/search/unit-toggle.spec.tsx            ← New: UnitToggle component tests
```

**Files to MODIFY (already exist):**
```
src/components/property/property-card.tsx         ← Add unitSystem prop, remove local formatArea
src/components/property/property-grid.tsx         ← Pass unitSystem prop through
src/components/search/split-view-layout.tsx       ← Add useLocaleUnits hook, render UnitToggle
src/components/map/map-pull-up-sheet.tsx          ← Add unitSystem prop
src/messages/en.json                              ← Add UnitToggle namespace
src/messages/es.json                              ← Add UnitToggle namespace
tests/unit/search/property-card.spec.tsx          ← Update mocks for new imports
```

**Files to NOT touch (frozen):**
```
src/lib/map/geo-utils.ts                          ← Keep formatPriceAbbrev (used by map pins)
src/types/search.ts                               ← Frozen: Story 3.3
src/store/map-store.ts                            ← Frozen: Story 3.2
src/components/map/map-view.tsx                   ← Frozen: Story 3.2
src/hooks/use-search-filters.ts                   ← Frozen: Story 3.3
src/app/actions/search-actions.ts                 ← Frozen: Story 3.3/3.5
```

### Previous Story Intelligence (Story 3.6)

Key patterns from Story 3.6 that carry forward:
1. **`'use client'` must be the first line** of any Client Component file (before imports)
2. **`data-testid` must survive refactors** — never rename/remove existing testids
3. **Server/Client boundary**: PropertyCard is RSC — Client Components can pass props to RSC children but cannot call hooks inside RSC. Pass state via props.
4. **Mock pattern for `next-intl`**: `vi.mock('next-intl', () => ({ useTranslations: vi.fn(() => (key: string) => key) }))`
5. **Vitest environment**: `tests/unit/search/**/*.spec.tsx` → jsdom; `tests/unit/search/**/*.spec.ts` → node (pure utils don't need jsdom)

### Test Design Coverage (Epic 3)

Test IDs from `_bmad-output/test-artifacts/test-design-epic-3.md` that this story must enable:

| Test ID | Type | Coverage |
|---------|------|----------|
| 3.7-UNIT-001 | Unit | ft² ↔ m² conversion (1 ft² = 0.0929 m²) |
| 3.7-UNIT-002 | Unit | acres ↔ hectares (1 acre = 0.4047 ha) |
| 3.7-UNIT-003 | Unit | Price formatting locale (comma vs period) |
| 3.7-E2E-001 | E2E | US locale shows ft²/acres by default |
| 3.7-E2E-002 | E2E | EU locale shows m²/hectares by default |
| 3.7-E2E-003 | E2E | Unit toggle persists in localStorage |
| 3.7-E2E-004 | E2E | Price shows USD + approximate EUR for non-US locale |
| 3.7-E2E-005 | E2E | ZMT badge shows icon + label (not color-only) |

### Tailwind v4 CSS-First — No Hardcoded Values

- Use design tokens: `bg-background`, `border-border`, `text-muted-foreground`, `text-[--color-accent]`
- No inline hex colors
- For the EUR price secondary line: `text-xs text-muted-foreground` (consistent with specs row)

### References

- Story 3.7 in epics: `_bmad-output/planning-artifacts/epics.md` §Story 3.7 (lines 1299-1334)
- Architecture §3 (file structure): `_bmad-output/planning-artifacts/architecture.md` lines 317-335
- Architecture §8 (Client vs Server): `_bmad-output/planning-artifacts/architecture.md` lines 840-855
- Architecture §State Management: line 865 (Unit preference → localStorage)
- PRD §FR9: `_bmad-output/planning-artifacts/prd.md` line 511
- PRD §FR10: line 512 (USD primary + approximate EUR for non-US)
- PRD §FR11: line 513 (ZMT/ownership status badges)
- PRD §Pricing: line 367 (USD-canonical, EUR approximate)
- PRD §Units: line 369 (m²-canonical, auto-converted)
- UX spec §UnitToggle: line 1769 (Switch base, localStorage)
- UX spec §PropertyCard anatomy: lines 1777-1789 (ZMT badge in card)
- Test design §R-011: `_bmad-output/test-artifacts/test-design-epic-3.md` line 163
- Test design §R-014: line 171
- Test design §3.7 tests: lines 259-261, 287-289, 303-304
- Existing PropertyCard: `src/components/property/property-card.tsx`
- Existing PropertyGrid: `src/components/property/property-grid.tsx`
- Existing SplitViewLayout: `src/components/search/split-view-layout.tsx`
- Vitest environment config: `vitest.config.mts` lines 19-22

## Dev Notes

### ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-3-7-unit-conversion-and-price-display.md`
- Unit tests: `tests/unit/search/units.spec.ts`
- Unit tests: `tests/unit/search/currency.spec.ts`
- Component tests: `tests/unit/search/unit-toggle.spec.tsx`
- Regression tests: `tests/unit/search/property-card.spec.tsx` (updated — added mocks + regression tests)
- E2E tests: `tests/e2e/unit-conversion-and-price-display.spec.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation completed without significant debugging.

### Completion Notes List

- Created `src/lib/utils/units.ts`: Pure utility with `UnitSystem` type, `detectDefaultUnitSystem`, `convertArea`, and conversion constants. All 21 unit tests pass.
- Created `src/lib/utils/currency.ts`: Pure utility with `EUR_RATE=0.92`, `formatUSD`, `formatEUR`, `isNonUSLocale`. All 17 unit tests pass. Fixed 2 ATDD test assertions with false-positive substring matches.
- Created `src/hooks/use-locale-units.ts`: Client hook with localStorage-persisted unit preference, SSR-safe via synchronous `useState` initializer (FOUC prevention).
- Created `src/components/layout/unit-toggle.tsx`: Client Component with `role="switch"`, `aria-checked`, `data-testid="unit-toggle"`. All 11 component tests pass.
- Modified `src/components/property/property-card.tsx`: Replaced `formatPriceAbbrev` with `formatUSD`/`formatEUR`/`isNonUSLocale`, replaced local `formatArea` with `convertArea`, added `unitSystem` prop and `property-price-eur` testid.
- Modified `src/components/property/property-grid.tsx`, `split-view-layout.tsx`, `map-pull-up-sheet.tsx`: Propagated `unitSystem` prop through component tree.
- Added `UnitToggle` i18n namespace to `en.json` and `es.json`.
- Installed `@use-gesture/react` (was in package.json but missing from worktree node_modules) — fixed build.
- Final test results: 561 tests passing, 3 skipped, 0 failures.
- ZMT badge (AC #6) verified intact — pre-existing implementation complies with icon+label requirement.

### File List

src/lib/utils/units.ts (NEW)
src/lib/utils/currency.ts (NEW)
src/hooks/use-locale-units.ts (NEW)
src/components/layout/unit-toggle.tsx (NEW)
src/components/property/property-card.tsx (MODIFIED)
src/components/property/property-grid.tsx (MODIFIED)
src/components/search/split-view-layout.tsx (MODIFIED)
src/components/map/map-pull-up-sheet.tsx (MODIFIED)
src/messages/en.json (MODIFIED)
src/messages/es.json (MODIFIED)
tests/unit/search/currency.spec.ts (MODIFIED — fixed 2 false-positive assertions)
tests/unit/search/property-card.spec.tsx (MODIFIED — updated mocks + price assertion)
