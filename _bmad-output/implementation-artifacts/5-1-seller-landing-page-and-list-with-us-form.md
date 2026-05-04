# Story 5.1: Seller Landing Page & "List With Us" Form

**Status:** ready-for-dev
**GH Issue:** #98
**Epic:** 5 — Seller Lead Capture
**Story Key:** 5-1-seller-landing-page-and-list-with-us-form
**Created:** 2026-05-04

---

## Story

As a **seller**,
I want to submit my property for listing through a simple, progressive form on a dedicated seller page,
So that I can connect with an area-specific RE/MAX agent without needing an account or technical knowledge.

---

## Acceptance Criteria

1. **Given** the seller page (`/{locale}/sell`) **When** loaded **Then** an SEO content hero renders above the form: value proposition (h1/h2), benefits, process explanation, and testimonials — 200–300 words of indexable content (UX-DR12). `data-testid="seller-hero"` on the hero section.

2. **Given** the SEO landing section **When** a visitor scrolls or taps "Comenzar" / "Get Started" **Then** the 3-step form begins with a segmented progress bar showing step labels and time estimates (60s / 90s / 30s). `data-testid="progress-bar"` on the bar.

3. **Given** Step 1 (Basics — 60s target) **When** rendered **Then** it shows: Property Type (radio group: Casa, Lote/Terreno, Finca, Condominio, Comercial), Location (text field loads first with "Type address or nearest landmark"; interactive map pin-drop loads progressively after 2s), and Size (with m²/acres/ft² toggle). `data-testid="form-step-1"` on the step container.

4. **Given** the map in Step 1 **When** the map fails to load or the device is too slow **Then** the text field remains functional and geocodes the entered address/landmark to coordinates (UX-DR12). `data-testid="location-text-input"` on the text input; `data-testid="location-map"` on the map container.

5. **Given** Step 2 (Details — 90s target) **When** rendered **Then** it shows: Price Expectation (currency input), "I need help with pricing" checkbox, Description (optional textarea), Photos (optional upload), and Bedrooms/Bathrooms (dropdowns, hidden for Lote/Terreno type). `data-testid="form-step-2"` on the step container; `data-testid="pricing-help-checkbox"` on the checkbox.

6. **Given** the "I need help with pricing" checkbox **When** checked **Then** the price field becomes optional and a note is attached to the lead record indicating the seller needs a pricing consultation (UX-DR12, R-008).

7. **Given** Step 3 (Contact — 30s target) **When** rendered **Then** it shows: Name (required), Phone/WhatsApp (required), Email (optional, clearly labelled as optional), and Preferred Language (auto-detected from locale, selectable). `data-testid="form-step-3"` on the step container.

8. **Given** all 3 steps **When** navigating between them **Then** "Back" and "Next" buttons are available; previously entered data is preserved; the progress bar updates to reflect the current step (UX-DR12).

9. **Given** the form completes on a $150 Android phone on 4G **When** timed end-to-end **Then** it is completable in under 3 minutes total (UX-DR12).

10. **Given** form validation errors **When** a required field is empty and "Next" is tapped **Then** inline error messages appear below the field in the user's locale with the field highlighted in `--color-error`.

11. **Given** a successful form submission **When** the submit request completes **Then** a `seller-confirmation` screen appears with `data-testid="seller-confirmation"` and an agent match card using the existing `AgentCard` component (from Story 4.2).

12. **And** the seller page (`/{locale}/sell`) is SSG — statically generated at build time for maximum performance. The page shell (hero + form container) renders at the edge; only the `SellerForm` hydrates client-side after load.

13. **And** all form labels, placeholders, buttons, error messages, and confirmation text display in the selected locale (EN/ES) (FR32).

14. **And** the `SellerForm` component is lazy-loaded via `next/dynamic` (~15KB, not in main bundle) — verified by build assertion (R-006).

---

## Developer Context

### New Files to Create

| File | Purpose |
|------|---------|
| `src/app/[locale]/sell/page.tsx` | Seller landing page — SSG, SEO metadata, hero + lazy-loaded form |
| `src/components/seller/seller-form.tsx` | Client Component — 3-step progressive form with map pin-drop |
| `src/components/seller/seller-form-skeleton.tsx` | Server/Client Component — skeleton shown while `SellerForm` lazy-loads |
| `src/components/seller/seller-hero.tsx` | Server Component — SEO landing content above form |
| `src/components/seller/location-picker.tsx` | Client Component — text + progressive map pin-drop (shared with Story 5.2) |
| `src/components/seller/seller-confirmation.tsx` | Client Component — success screen with agent match |

### Existing Files to Modify

| File | Change | Reason |
|------|--------|--------|
| `src/messages/en.json` | Add `SellerPage` namespace | All seller UI strings |
| `src/messages/es.json` | Add `SellerPage` namespace | Spanish translations |

### Do NOT Modify

- `src/components/agent/agent-card.tsx` — reuse as-is for the confirmation screen. It expects `agent`, `propertyTitle`, `propertyRef`, `locale`, `officeName` props. For seller confirmation, pass `propertyTitle` and `propertyRef` as empty strings (or a generic "Seller inquiry" label).
- Any existing `data-testid` values from Epics 3–4 — cannot be renamed or removed.
- `src/components/layout/unit-toggle.tsx` — do NOT duplicate its unit logic. The size field's unit toggle must use the same `useLocaleUnits` hook from `src/hooks/use-locale-units.ts` to stay in sync with user preference.

---

## Technical Requirements

### Page Setup (`src/app/[locale]/sell/page.tsx`)

**Follow the exact pattern of `src/app/[locale]/about/page.tsx`** — that is the canonical SSG page pattern for this project. No `export const dynamic = 'force-static'` is needed — SSG is the default because the parent `[locale]/layout.tsx` already calls `generateStaticParams()` for all locales.

```typescript
// src/app/[locale]/sell/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { generateAlternateLanguages } from '@/lib/seo/metadata';
import { SellerHero } from '@/components/seller/seller-hero';
import { SellerFormSkeleton } from '@/components/seller/seller-form-skeleton';
import { getAllAgents } from '@/lib/db/queries/agents';

const SellerForm = dynamic(
  () => import('@/components/seller/seller-form').then((m) => m.SellerForm),
  { ssr: false, loading: () => <SellerFormSkeleton /> }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SellerPage' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { languages: generateAlternateLanguages('/sell') },
    openGraph: { title: t('meta.ogTitle'), description: t('meta.ogDescription') },
  };
}

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Stub agent for confirmation screen — Story 5.3 replaces with routing logic
  const agents = await getAllAgents();
  const fallbackAgent = agents[0] ?? null;

  return (
    <main>
      <SellerHero locale={locale} />
      <SellerForm locale={locale} fallbackAgent={fallbackAgent} />
    </main>
  );
}
```

**Route:** `src/app/[locale]/sell/page.tsx`

The architecture doc (§9 URL Strategy) lists the seller route as `/{locale}/sell` (same slug in EN and ES). No locale-specific slug needed. No `generateStaticParams` needed on this file — inherited from the layout.

### SellerForm Lazy Loading (Critical — R-006)

```typescript
// In src/app/[locale]/sell/page.tsx
import dynamic from 'next/dynamic';

const SellerForm = dynamic(
  () => import('@/components/seller/seller-form').then(m => m.SellerForm),
  { ssr: false, loading: () => <SellerFormSkeleton /> }
);
```

`SellerFormSkeleton` is a simple loading placeholder shown while `SellerForm` lazy-loads:
```typescript
// src/components/seller/seller-form-skeleton.tsx
export function SellerFormSkeleton() {
  return (
    <div data-testid="seller-form-skeleton" className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" /> {/* progress bar placeholder */}
      <div className="h-12 bg-gray-200 rounded" />      {/* field placeholder */}
      <div className="h-12 bg-gray-200 rounded" />
      <div className="h-12 bg-gray-200 rounded w-2/3" />
      <div className="h-11 bg-gray-300 rounded w-full" /> {/* button placeholder */}
    </div>
  );
}
```

This mirrors the `PropertyGallery` lazy-load pattern from Story 4.1:
```typescript
// src/components/listing/property-gallery-loader.tsx (existing reference)
const PropertyGallery = dynamic(() => import('./property-gallery'), { ssr: false });
```

**~15KB budget.** The SellerForm must not pull in Mapbox GL JS (230KB). Mapbox is already lazy-loaded via `map-view-loader.tsx` — reuse that same loader inside `LocationPicker`.

### SellerForm State Management

- Use `react-hook-form` for all form state — it's the project standard (confirmed in `deferred-work.md` for Epic 5 Story 5.3: "swap when `react-hook-form` + `zod` land in Epic 5 Story 5-3").
- Multi-step state: maintain a single `useForm()` instance across all 3 steps. Do NOT reset state when navigating between steps — this is R-007 mitigation.
- Step navigation: use a local `step` React state (`useState(1)`) alongside `react-hook-form`.

```typescript
// Multi-step form pattern
const form = useForm<SellerFormData>({
  defaultValues: { propertyType: undefined, location: { text: '', lat: null, lng: null }, /* ... */ }
});
const [step, setStep] = useState<1 | 2 | 3>(1);
```

### LocationPicker Component

**Architecture:** Text field renders immediately (SSR-safe). Map loads progressively via `setTimeout(2000)` or `useEffect` after hydration. If map fails (`onerror` / 5s timeout), the component stays text-only.

```typescript
// src/components/seller/location-picker.tsx
'use client';

interface LocationPickerProps {
  value: { text: string; lat: number | null; lng: number | null };
  onChange: (value: { text: string; lat: number | null; lng: number | null }) => void;
  locale: string;
  placeholder?: string; // i18n key passed as prop
}
```

- `data-testid="location-text-input"` on the `<input>` element.
- `data-testid="location-map"` on the map container `<div>`.
- For the map, import `MapViewLoader` from the existing `@/components/map/map-view-loader.tsx` **only** after checking if Mapbox components are available — do not duplicate map setup logic.
- Map pin drop: listen to Mapbox `onClick` event on the map; store `[lng, lat]` in component state and call `onChange`. Display a marker at the clicked position.
- Geocoding text → coordinates: use the Mapbox Geocoding API (`fetch` call to `api.mapbox.com/geocoding/v5/mapbox.places/{text}.json?access_token=...`). This is a client-side fetch using `NEXT_PUBLIC_MAPBOX_TOKEN`. Fire geocoding `onBlur` of the text field when lat/lng are not yet set.

### AgentCard Reuse for Confirmation

The `AgentCard` component (`src/components/agent/agent-card.tsx`) is a `'use client'` component. For the seller confirmation screen, use it to display the matched agent. Since this story does not implement the actual agent-matching API (that's Story 5.3), the confirmation screen in 5.1 should:

1. Accept an `agent` prop (type: `Agent` from `@/lib/db/schema/agents`).
2. For this story, stub the agent match by querying the first available agent from the DB **server-side** in the page using `getAllAgents()` from `@/lib/db/queries/agents`, then pass `agents[0]` down. The full routing logic ships in Story 5.3.
3. `SellerConfirmation` receives `agent: Agent` and `locale: string` as props.

```typescript
// src/components/seller/seller-confirmation.tsx
'use client';
import { AgentCard } from '@/components/agent/agent-card';

interface SellerConfirmationProps {
  agent: Agent;
  locale: string;
}

export function SellerConfirmation({ agent, locale }: SellerConfirmationProps) {
  return (
    <div data-testid="seller-confirmation">
      {/* success message, then: */}
      <AgentCard
        agent={agent}
        propertyTitle="" // not applicable for seller context
        propertyRef=""
        locale={locale}
        officeName={/* resolve from offices constants */}
      />
    </div>
  );
}
```

**Agent data flow:** In `src/app/[locale]/sell/page.tsx` (SSG), fetch a fallback agent server-side:
```typescript
import { getAllAgents } from '@/lib/db/queries/agents';
const agents = await getAllAgents();
const fallbackAgent = agents[0] ?? null; // first active agent as placeholder
```
Pass `fallbackAgent` to the `SellerConfirmation` component. The full agent routing logic (geo → nearest office → agent assignment) ships in Story 5.3.

### "I Need Help With Pricing" Checkbox (R-008 mitigation)

When the checkbox is checked:
1. The price field's `required` validation rule is removed (`unregister` or set `rules: {}`).
2. A hidden field `needsPricingHelp: true` is set in form state.
3. When building the form payload for Story 5.3's `/api/leads`, include `notes: 'Seller needs pricing consultation'` when `needsPricingHelp === true`.

For Story 5.1 scope, the form submission is a **stub** — it does not call `/api/leads` (that's Story 5.3). Instead, on "Submit" in Step 3:
- Show a loading state (disable button + spinner).
- After 500ms artificial delay (simulating API call), show the `SellerConfirmation` screen.
- Log the form data to the console with `console.log('[5.1 stub] seller form payload:', data)` — Story 5.3 will replace this with the real API call.

### Beds/Baths Conditional Visibility (R-012 mitigation)

```typescript
// In SellerForm Step 2
const propertyType = form.watch('propertyType');
const showBedsBaths = propertyType !== 'Lote/Terreno';

// Render conditionally:
{showBedsBaths && (
  <div data-testid="beds-baths-fields">
    {/* Bedrooms + Bathrooms dropdowns */}
  </div>
)}
```

### SEO Metadata

The `generateMetadata` pattern is included in the Page Setup section above. Key points:
- Use `getTranslations({ locale, namespace: 'SellerPage' })` — same as `about/page.tsx` uses `AboutPage` namespace.
- Use `generateAlternateLanguages('/sell')` from `src/lib/seo/metadata.ts` (established in Story 4.4) for hreflang.
- The `alternates.languages` object should use the helper, not hardcoded `{ en: '/en/sell', es: '/es/sell' }` (same pattern inconsistency noted in deferred-work.md for Story 1.6 pages — new code should use the helper).

### Unit Toggle in Size Field

The size field MUST use `useLocaleUnits` from `src/hooks/use-locale-units.ts` — not a custom toggle. This keeps size units in sync with the user's existing preference set by the `UnitToggle` in the nav/footer.

```typescript
import { useLocaleUnits } from '@/hooks/use-locale-units';
const { unitSystem, toggleUnits } = useLocaleUnits(locale);
// Display: unitSystem === 'metric' ? 'm²' : 'ft²'
// Toggle button reuses the same behavior as UnitToggle
```

### Form State Type

```typescript
// Define in src/components/seller/seller-form.tsx
export interface SellerFormData {
  // Step 1
  propertyType: 'Casa' | 'Lote/Terreno' | 'Finca' | 'Condominio' | 'Comercial';
  location: { text: string; lat: number | null; lng: number | null };
  size: number | null;
  sizeUnit: 'sqm' | 'sqft' | 'acres';
  // Step 2
  priceExpectation: number | null;
  needsPricingHelp: boolean;
  description: string;
  photos: File[];
  bedrooms: number | null;
  bathrooms: number | null;
  // Step 3
  name: string;
  phone: string;
  email: string;
  preferredLanguage: 'en' | 'es';
}
```

---

## File Structure Requirements

```
src/
├── app/
│   └── [locale]/
│       └── sell/
│           └── page.tsx                  ← CREATE (SSG page)
│
├── components/
│   └── seller/                           ← CREATE directory
│       ├── seller-form.tsx               ← CREATE (Client Component, lazy-loaded)
│       ├── seller-form-skeleton.tsx      ← CREATE (skeleton shown during lazy-load)
│       ├── seller-hero.tsx               ← CREATE (Server Component)
│       ├── location-picker.tsx           ← CREATE (Client Component, shared with 5.2)
│       └── seller-confirmation.tsx       ← CREATE (Client Component)
│
├── messages/
│   ├── en.json                           ← MODIFY (add SellerPage namespace)
│   └── es.json                           ← MODIFY (add SellerPage namespace)
```

**Architecture directory reference** (from `architecture.md §3`):
- Lead domain components go in `src/components/lead/` per the architecture directory spec.
- However, `seller-form.tsx` is already listed in that spec at `src/components/lead/seller-form.tsx`.
- **DECISION:** Architecture doc lists it under `src/components/lead/`, but for cohesion with Story 5.2 which will create a `cma-form.tsx` alongside it, use `src/components/seller/` as a domain-specific directory (same pattern as `src/components/agent/`, `src/components/property/`, etc.). The architecture directory is illustrative — the existing project uses domain directories (confirmed in the codebase: `src/components/agent/`, `src/components/property/`, `src/components/listing/`).

---

## Translatable Surfaces

**CRITICAL — Epic 4 retrospective action item:** Every translatable surface must be listed here. Include visible text, aria-labels, placeholders, and any string a screen reader or search engine sees.

### `SellerPage` namespace (`src/messages/en.json` / `es.json`)

```json
{
  "SellerPage": {
    "meta": {
      "title": "List Your Property | RE/MAX Altitud",
      "description": "List your Costa Rica property with RE/MAX Altitud — Southern Zone's #1 real estate team. Fill our simple 3-step form to connect with an area expert.",
      "ogTitle": "Sell Your Property with RE/MAX Altitud",
      "ogDescription": "Connect with a local RE/MAX agent in 3 minutes. No account needed."
    },
    "hero": {
      "heading": "List Your Property with the Southern Zone's #1 Team",
      "subheading": "From Pérez Zeledón to Dominical — our agents know every hectare.",
      "benefit1": "Global RE/MAX network exposure",
      "benefit2": "Local market expertise since 2008",
      "benefit3": "No upfront fees — commission only",
      "process": "How it works: Fill our 3-step form → Get matched with an area agent → Schedule a property visit",
      "testimonial1": "\"RE/MAX Altitud sold our finca in 3 months at asking price.\" — Carlos, Rivas",
      "startButton": "Get Started",
      "startButtonAriaLabel": "Start the property listing form"
    },
    "form": {
      "progressAriaLabel": "Form progress: step {current} of {total}",
      "step1Label": "Basics",
      "step2Label": "Details",
      "step3Label": "Contact",
      "step1TimeEstimate": "About 60 seconds",
      "step2TimeEstimate": "About 90 seconds",
      "step3TimeEstimate": "About 30 seconds",
      "nextButton": "Next",
      "nextButtonAriaLabel": "Continue to next step",
      "backButton": "Back",
      "backButtonAriaLabel": "Return to previous step",
      "submitButton": "Submit My Property",
      "submitButtonAriaLabel": "Submit your property listing request",
      "submittingButton": "Submitting...",
      "step1": {
        "heading": "Tell us about your property",
        "propertyTypeLabel": "Property Type",
        "propertyTypeAriaLabel": "Select property type",
        "typeCasa": "House / Casa",
        "typeLote": "Lot / Lote",
        "typeFinca": "Farm / Finca",
        "typeCondominio": "Condo / Condominio",
        "typeComericial": "Commercial / Comercial",
        "locationLabel": "Location",
        "locationPlaceholder": "Type address or nearest landmark",
        "locationAriaLabel": "Enter property location",
        "locationMapAriaLabel": "Interactive map — click to drop a pin on your property location",
        "locationMapFallbackNote": "Map unavailable — please describe location in the text field",
        "sizeLabel": "Approximate Size",
        "sizePlaceholder": "e.g. 5000",
        "sizeAriaLabel": "Enter property size",
        "sizeUnitAriaLabel": "Toggle size unit between square meters, square feet, and acres"
      },
      "step2": {
        "heading": "More about your property",
        "priceLabel": "Price Expectation (USD)",
        "pricePlaceholder": "e.g. 250000",
        "priceAriaLabel": "Enter your price expectation in US dollars",
        "priceOptionalLabel": "(Optional)",
        "pricingHelpLabel": "I need help with pricing",
        "pricingHelpDescription": "Our agent will provide a free Comparative Market Analysis (CMA)",
        "descriptionLabel": "Description (optional)",
        "descriptionPlaceholder": "Describe your property — features, condition, why you are selling...",
        "descriptionAriaLabel": "Describe your property (optional)",
        "photosLabel": "Photos (optional)",
        "photosDescription": "Add up to 5 photos (JPG, PNG — max 10MB each)",
        "photosAriaLabel": "Upload property photos (optional)",
        "photosButton": "Choose Photos",
        "bedroomsLabel": "Bedrooms",
        "bedroomsAriaLabel": "Number of bedrooms",
        "bathroomsLabel": "Bathrooms",
        "bathroomsAriaLabel": "Number of bathrooms"
      },
      "step3": {
        "heading": "How can we reach you?",
        "nameLabel": "Full Name",
        "namePlaceholder": "Your name",
        "nameAriaLabel": "Enter your full name",
        "phoneLabel": "Phone / WhatsApp",
        "phonePlaceholder": "+506 8888-8888",
        "phoneAriaLabel": "Enter your phone or WhatsApp number",
        "phoneDescription": "WhatsApp preferred — your agent will contact you here",
        "emailLabel": "Email Address (optional)",
        "emailPlaceholder": "your@email.com",
        "emailAriaLabel": "Enter your email address (optional)",
        "emailOptionalBadge": "Optional",
        "languageLabel": "Preferred Language",
        "languageAriaLabel": "Select your preferred contact language",
        "languageEn": "English",
        "languageEs": "Español"
      },
      "validation": {
        "propertyTypeRequired": "Please select a property type",
        "locationRequired": "Please enter your property location",
        "sizeRequired": "Please enter an approximate size",
        "nameRequired": "Please enter your name",
        "phoneRequired": "Please enter your phone number",
        "phoneInvalid": "Please enter a valid phone number",
        "emailInvalid": "Please enter a valid email address",
        "priceInvalid": "Please enter a valid price (numbers only)"
      }
    },
    "confirmation": {
      "heading": "Property Submitted Successfully!",
      "subheading": "Your dedicated agent will contact you within 24 hours.",
      "agentMatchHeading": "Your Agent Match",
      "whatsappButtonAriaLabel": "Contact {agentName} via WhatsApp",
      "emailButtonAriaLabel": "Contact {agentName} via email",
      "browseWhileWaiting": "While you wait, explore what's selling in your area"
    }
  }
}
```

**Spanish keys follow the same structure** — all keys translated in `es.json`.

---

## dangerouslySetInnerHTML Audit

**Epic 4 retrospective requirement:** Any use of `dangerouslySetInnerHTML` must enumerate escape requirements at the output sink.

This story does NOT use `dangerouslySetInnerHTML`. All hero content is developer-authored static text rendered via i18n keys — no user-supplied or DB-originated HTML. If the hero section ever sources content from a CMS or DB field, apply `serializeJsonLd()`-style escaping before rendering (reference: `src/lib/seo/structured-data.ts` from Story 4.4).

---

## Test Requirements

### Unit Tests (`tests/unit/seller/`)

Per the Epic 5 test design, the following P0/P1/P2 tests cover Story 5.1:

| Test ID | What to test | File |
|---------|-------------|------|
| 5.1-COMP-001 | Map pin-drop event captures lat/lng into form state | `tests/unit/seller/location-picker.spec.tsx` |
| 5.1-COMP-002 | "I need help with pricing" makes price optional + attaches note | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-COMP-003 | Inline validation errors appear in correct locale | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-COMP-004 | Beds/Baths hidden when "Lote/Terreno" selected | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-COMP-005 | Property Type radio shows 5 options | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-COMP-006 | Size field has m²/acres/ft² toggle | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-COMP-007 | Step 2 renders all fields for Casa type | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-COMP-008 | Step 3 renders all fields with optional email label | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-UNIT-001 | All form strings in Spanish locale | `tests/unit/seller/seller-form.spec.tsx` |
| 5.1-E2E-002 | SellerForm absent from initial JS bundle | `tests/unit/seller/seller-form.spec.tsx` |

**Critical test pattern — async Server Component testing (Epic 4 standard):**
For `SellerHero` (async Server Component):
```typescript
// tests/unit/seller/seller-hero.spec.tsx
import { SellerHero } from '@/components/seller/seller-hero';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

describe('SellerHero', () => {
  it('renders hero section', async () => {
    const element = await SellerHero({ locale: 'en' });
    const { getByTestId } = render(element);
    expect(getByTestId('seller-hero')).toBeInTheDocument();
  });
});
```

**Client Component tests use standard RTL `render()`.**

**SellerForm lazy-load unit test (5.1-E2E-002):**
```typescript
// tests/unit/seller/seller-form.spec.tsx
it('SellerForm is exported from seller-form.tsx (lazy-load contract)', () => {
  // The lazy load in page.tsx uses next/dynamic. Assert the component file exists
  // and has a named export SellerForm. Build assertion is a separate CI check.
  const { SellerForm } = require('@/components/seller/seller-form');
  expect(typeof SellerForm).toBe('function');
});
```

**Mock for `SellerForm` in page-level tests** (same pattern as `PropertyGallery`):
```typescript
vi.mock('@/components/seller/seller-form', () => ({
  SellerForm: () => <div data-testid="seller-form-mock" />,
}));
```

### data-testid Contract (CANNOT be renamed)

Per `test-design-epic-5.md §New data-testid Contract for Epic 5`:

| `data-testid` | Component | Defined in Story |
|--------------|-----------|-----------------|
| `seller-hero` | `SellerHero` | 5.1 |
| `seller-form` | `SellerForm` wrapper | 5.1 |
| `form-step-1` | Step 1 container | 5.1 |
| `form-step-2` | Step 2 container | 5.1 |
| `form-step-3` | Step 3 container | 5.1 |
| `progress-bar` | Progress indicator | 5.1 |
| `pricing-help-checkbox` | Pricing help checkbox | 5.1 |
| `location-map` | Map container | 5.1 |
| `location-text-input` | Text address input | 5.1 |
| `seller-confirmation` | Confirmation screen | 5.1 |

---

## Architecture Compliance Checklist

- [ ] `sell/page.tsx` follows the `about/page.tsx` SSG pattern (no `force-static` directive needed — inherited from layout `generateStaticParams`)
- [ ] `SellerForm` uses `next/dynamic` with `{ ssr: false }` (lazy-load)
- [ ] `SellerForm` is a Client Component (`'use client'`)
- [ ] `SellerHero` is a Server Component (no `'use client'`)
- [ ] `LocationPicker` is a Client Component (uses map + state)
- [ ] `react-hook-form` used for all form state (not raw `useState` per field)
- [ ] `useLocaleUnits` used for size unit toggle (not custom state)
- [ ] `AgentCard` imported from `@/components/agent/agent-card` — NOT duplicated
- [ ] `generateAlternateLanguages` from `@/lib/seo/metadata.ts` used for hreflang
- [ ] All translatable strings in `SellerPage` i18n namespace — zero hardcoded EN/ES strings in component files
- [ ] All aria-labels use i18n keys (Epic 4 lesson: aria-labels are translatable surfaces)
- [ ] `data-testid` contracts from the table above applied exactly
- [ ] Beds/Baths fields hidden when `propertyType === 'Lote/Terreno'`
- [ ] Price field `required` validation removed when `needsPricingHelp === true`
- [ ] No `dangerouslySetInnerHTML` in new files (hero content comes from i18n, not DB/user input)
- [ ] `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test` all pass green

---

## Previous Story Intelligence

### From Epic 4 retrospective (critical patterns to follow)

**1. i18n hardcoded strings — the recurrent anti-pattern.**
Every Epic 4 story had at least one hardcoded string caught at code review. This story has a large UI surface (3 form steps + hero + confirmation). The "Translatable Surfaces" section above lists every string. When in doubt, check the section — if a string is visible to a human or screen reader, it must be in the `SellerPage` namespace.
- Aria-labels on form inputs: ALL must use i18n keys.
- Validation error messages: ALL must use i18n keys.
- Button labels: ALL must use i18n keys.
- The confirmation screen agent match heading: i18n key.

**2. Async Server Component testing pattern (project standard).**
`SellerHero` is an async Server Component. Tests MUST use:
```typescript
const element = await SellerHero({ locale: 'en' });
render(element);
```
See Story 4.3 for the pattern (`AgentProfileHero` tests).

**3. `next/dynamic` pattern for lazy-loading.**
`SellerForm` must use the exact same pattern as `PropertyGallery` from Story 4.1:
```typescript
const SellerForm = dynamic(
  () => import('@/components/seller/seller-form').then(m => m.SellerForm),
  { ssr: false }
);
```
Tests that mock `SellerForm` must use `vi.mock('@/components/seller/seller-form')`.

**4. `Link` import pattern.**
Use `Link` from `@/i18n/navigation` for all internal links on this page — not from `next/link`. This is the locale-aware Link used throughout the project. (Note: there is an inconsistency in the codebase where some components use `/${locale}/...` manual prefix — do NOT use that pattern in new code.)

**5. `AgentCard` prop contract.**
`AgentCard` requires: `agent`, `propertyTitle`, `propertyRef`, `locale`, `officeName`. All 5 are required. For seller confirmation, pass `propertyTitle=""` and `propertyRef=""` (empty strings, not `undefined`). `officeName` should be resolved from `src/lib/constants/offices.ts` using the agent's `officeId`.

**6. Suspense + skeleton for non-LCP content.**
If adding any data-fetching below the fold (e.g., "Browse while you wait" nearby listings on confirmation page — optional), wrap in `<Suspense fallback={<skeleton />}>` per the pattern from Story 4.5. This is not required for the seller form itself (form is CSR, not data-fetching).

---

## Git Context

Recent commits show the project pattern:
- `story-4.5-similar-properties-and-cross-linking` — Story 4.5 established the `SimilarProperties` Server Component + Suspense loader pattern.
- `chore: epic-5 test design + Phase 0 reconcile` — Epic 5 test design was added to the worktree.
- `story-4.4-seo-architecture-and-wordpress-redirects` — `serializeJsonLd()` XSS-safe helper, hreflang helpers, `generateAlternateLanguages` all established here.
- `story-4.3-agent-profile-pages` — async Server Component testing pattern (`await Component({...})`), `AgentCard` props.
- `story-4.2-agent-card-and-contact-ctas` — `AgentCard` implementation + `buildWhatsAppMessage` / `buildWhatsAppUrl` utilities.

---

## Deferred Work Notes

From `deferred-work.md` items relevant to Epic 5:

- **Email + phone validation (Story 1.6 deferral):** Story 5.3 owns stricter Zod + E.164 validation. In Story 5.1, use basic client-side validation: phone must be non-empty (≥ 7 digits), email must match `/^[^@]+@[^@]+\.[^@]+$/` (same permissive pattern as `contact-form.tsx`). Story 5.3 will replace with proper Zod schemas when the API is wired.
- **CSP headers:** Not in scope for Story 5.1 — deferred from Story 1.1. The seller form uses NEXT_PUBLIC_MAPBOX_TOKEN on the client; confirm the existing CSP deferred item is noted.
- **Duplicate MapBounds/MapProperty types:** Pre-existing issue; Story 5.1 should not create new type duplicates. Reuse `src/lib/map/geo-utils.ts` types for any geo-coordinate work.

---

## Epic 5 Test Design Reference

The `_bmad-output/test-artifacts/test-design-epic-5.md` governs the full test strategy for Stories 5.1–5.3.

**Risks that Story 5.1 must mitigate before shipping:**

- **R-004 (BUS, score 6):** Map pin-drop silently fails to capture coordinates. Mitigated by: `5.1-COMP-001` test (simulate map click → assert lat/lng in form state) + LocationPicker implementation that stores coordinates in form state via `onChange` callback.
- **R-006 (PERF, score 6):** SellerForm not lazy-loaded. Mitigated by: `next/dynamic` with `{ ssr: false }` + build assertion in `5.1-E2E-002` test.
- **R-007 (TECH, score 4):** Multi-step data loss on Back navigation. Mitigated by: single `useForm()` instance across all steps + `5.1-E2E-005` test (enter data → advance → back → assert data preserved).
- **R-008 (BUS, score 4):** "I need help with pricing" checkbox doesn't attach note. Mitigated by: `buildLeadPayload()` function that includes `notes: 'Seller needs pricing consultation'` + `5.1-COMP-002` test.
- **R-011 (BUS, score 3):** Form validation errors in wrong locale. Mitigated by: all validation messages in i18n namespace + `5.1-COMP-003` test.
- **R-012 (BUS, score 2):** Beds/Baths visible for Lote/Terreno. Mitigated by: conditional rendering based on `propertyType` + `5.1-COMP-004` test.

**Story 5.1 is NOT responsible for:**
- R-001, R-002, R-003 — PII encryption, silent drop, deduplication: these are Story 5.3 concerns.
- R-005 — agent routing: Story 5.3.
- R-009 — CMA source/intent: Story 5.2.
- R-010 — UTM sanitization: Story 5.3.

**Stub `/api/leads` call in 5.1:** The form submission in this story does NOT call `/api/leads`. That endpoint is implemented in Story 5.3. The stub approach (console.log + confirmation screen after 500ms) is intentional — it allows the UX to be validated and tested independently of the backend.

---

## References

- `_bmad-output/planning-artifacts/epics.md` — Epic 5, Stories 5.1–5.3 (§ "Epic 5: Seller Lead Capture")
- `_bmad-output/planning-artifacts/ux-design-specification.md` — Journey 2 (Carlos), SellerForm component spec (§2114), Seller Flow diagram (§676)
- `_bmad-output/planning-artifacts/architecture.md` — §3 Project Structure, §6 API Design (`/api/leads`), §7 i18n, §8 Performance Budget, §10 Security
- `_bmad-output/planning-artifacts/prd.md` — FR40, FR41, FR42, FR43, FR54
- `_bmad-output/test-artifacts/test-design-epic-5.md` — Risk register, P0–P2 test scenarios for Story 5.1
- `_bmad-output/implementation-artifacts/epic-4-retro-2026-05-03.md` — Action items (Translatable Surfaces, dangerouslySetInnerHTML audit, i18n surfaces)
- `_bmad-output/implementation-artifacts/deferred-work.md` — Email/phone validation deferral, CSP header

---

*Story context engine analysis completed — comprehensive developer guide created.*
