# Story 5.2: CMA Request Form

**Status:** ready-for-dev
**GH Issue:** #99
**Epic:** 5 — Seller Lead Capture
**Story Key:** 5-2-cma-request-form
**Created:** 2026-05-11

---

## Story

As a **seller**,
I want to request a free Comparative Market Analysis through a dedicated form,
So that I can learn my property's market value before deciding to list.

---

## Acceptance Criteria

1. **Given** the CMA form entry point **When** accessed from the seller landing page or a direct CTA **Then** a "Request a Free CMA" form loads with a value proposition explaining what a CMA is and why it's free (FR41). `data-testid="cma-form"` on the form wrapper.

2. **Given** the CMA form **When** rendered **Then** it collects: Name (required), Phone/WhatsApp (required), Email (optional), Property Type (dropdown), Location (address text or map pin, reusing the `LocationPicker` component from Story 5.1), Approximate Size (with unit toggle), and Comment/Message (optional) (FR42). `data-testid="cma-form-fields"` on the fields container.

3. **Given** a completed CMA form **When** submitted **Then** the lead is stored with source = "cma_form" and intent = "sell" (distinguishable from seller listing leads). `data-testid="cma-confirmation"` on the confirmation screen.

4. **Given** the CMA form **When** submitted successfully **Then** a confirmation screen displays with the matched agent card (photo, name, languages, WhatsApp + Email CTAs) and message: "Your CMA request has been received. [Agent] will contact you within 24 hours." (FR43). Uses the existing `SellerConfirmation` component (with `source` variant prop for different heading text).

5. **Given** the CMA form **When** a user is on the seller page **Then** it is accessible as a secondary CTA ("Just need a valuation? Request a Free CMA") without navigating away from the seller page context.

6. **And** all form labels, validation messages, and confirmation text display in the selected locale (EN/ES).

7. **And** the CMA form shares form field components (location picker, input styling, validation patterns) with the seller listing form for consistency.

---

## Developer Context

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/seller/cma-form.tsx` | Client Component — single-page CMA request form |
| `src/components/seller/cma-hero.tsx` | Client Component — CMA value proposition section embedded in the seller page |

### Existing Files to Modify

| File | Change | Reason |
|------|--------|--------|
| `src/app/[locale]/sell/page.tsx` | Add CMA form section below the seller form | CMA form is accessible from seller page (AC #5) |
| `src/components/seller/seller-confirmation.tsx` | Add `source` variant prop ("seller" \| "cma") for different confirmation text | CMA confirmation needs different heading/subheading |
| `src/messages/en.json` | Add `CmaForm` namespace | All CMA UI strings |
| `src/messages/es.json` | Add `CmaForm` namespace | Spanish translations |

### Do NOT Modify

- `src/components/seller/seller-form.tsx` — reuse patterns from it but do NOT modify the existing seller form.
- `src/components/seller/location-picker.tsx` — reuse as-is. It was designed to be shared with Story 5.2.
- `src/components/agent/agent-card.tsx` — reuse as-is.
- Any existing `data-testid` values from Stories 5.1 and Epics 3–4 — cannot be renamed or removed.
- `src/components/layout/unit-toggle.tsx` — do NOT duplicate its unit logic.

---

## Technical Requirements

### CMA Form Architecture

The CMA form is a **simpler, single-page form** compared to the 3-step seller form. It is embedded directly in the seller landing page as a secondary CTA section.

**Design Decision:** The CMA form is NOT a separate page. It lives on the existing `/{locale}/sell` page as a collapsible section below the seller form. This follows AC #5: "accessible as a secondary CTA without navigating away from the seller page context."

### Implementation Approach

#### Option: Inline Accordion/Section on Sell Page

The CMA form appears as a visually distinct section on the sell page:
1. A CTA banner: "Just need a valuation? Request a Free CMA" with an expand/collapse toggle.
2. When expanded, the CMA form renders inline with all fields visible at once (no multi-step).
3. On successful submission, the same confirmation pattern as the seller form is shown.

### CmaForm Component (`src/components/seller/cma-form.tsx`)

```typescript
'use client';

import { useState, useId, type FormEvent, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleUnits } from '@/hooks/use-locale-units';
import { LocationPicker, type LocationValue } from '@/components/seller/location-picker';
import { SellerConfirmation } from '@/components/seller/seller-confirmation';
import type { Agent } from '@/lib/db/schema/agents';

export interface CmaFormData {
  name: string;
  phone: string;
  email: string;
  propertyType: 'Casa' | 'Lote/Terreno' | 'Finca' | 'Condominio' | 'Comercial' | '';
  location: LocationValue;
  approximateSize: string;
  sizeUnit: 'sqm' | 'sqft' | 'acres';
  comment: string;
}

interface CmaFormProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

export function CmaForm({ locale, fallbackAgent, officeName = 'REMAX Altitud' }: CmaFormProps) {
  // Implementation follows seller-form.tsx patterns
}
```

**Key differences from SellerForm:**
- Single-page (no steps, no progress bar)
- No photo upload field
- No "I need help with pricing" checkbox
- No price expectation field
- Has a Comment/Message textarea instead of Description
- `source = "cma_form"` in lead payload (vs "seller_form")
- Simpler validation (fewer required fields)

### Field Reuse Strategy

| Field | Source | Notes |
|-------|--------|-------|
| Name | Same pattern as seller form Step 3 | Required |
| Phone/WhatsApp | Same pattern as seller form Step 3 | Required, same validation |
| Email | Same pattern as seller form Step 3 | Optional, same validation |
| Property Type | Same pattern as seller form Step 1 | Dropdown (select) instead of radio group |
| Location | `LocationPicker` from Story 5.1 | Reuse directly |
| Approximate Size | Same pattern as seller form Step 1 | With unit toggle via `useLocaleUnits` |
| Comment | New textarea | Optional, no character limit |

### SellerConfirmation Enhancement

Add a `source` prop to differentiate confirmation messages:

```typescript
// src/components/seller/seller-confirmation.tsx
interface SellerConfirmationProps {
  agent: Agent;
  officeName: string;
  locale: string;
  source?: 'seller' | 'cma'; // NEW — defaults to 'seller'
}

export function SellerConfirmation({ agent, officeName, locale, source = 'seller' }: SellerConfirmationProps) {
  const t = useTranslations(source === 'cma' ? 'CmaForm' : 'SellerPage');
  // Use t('confirmation.heading'), t('confirmation.subheading') etc.
  // CmaForm namespace has its own confirmation keys
}
```

### Sell Page Modification

```typescript
// src/app/[locale]/sell/page.tsx
// Add CmaFormLoader below SellerFormLoader
import { CmaFormLoader } from '@/components/seller/cma-form-loader';

// In the JSX:
<main>
  <SellerHero locale={locale} />
  <SellerFormLoader locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />
  
  {/* CMA section — secondary CTA */}
  <section id="cma" className="mx-auto max-w-2xl px-4 py-12">
    <CmaHero locale={locale} />
    <CmaFormLoader locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />
  </section>
</main>
```

**Lazy-loading:** Follow the same `next/dynamic` pattern as SellerFormLoader. Create `src/components/seller/cma-form-loader.tsx`:

```typescript
'use client';

import dynamic from 'next/dynamic';
import { SellerFormSkeleton } from '@/components/seller/seller-form-skeleton';
import type { Agent } from '@/lib/db/schema/agents';

const CmaForm = dynamic(
  () => import('@/components/seller/cma-form').then((m) => m.CmaForm),
  { ssr: false, loading: () => <SellerFormSkeleton /> }
);

interface CmaFormLoaderProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName: string;
}

export function CmaFormLoader({ locale, fallbackAgent, officeName }: CmaFormLoaderProps) {
  return <CmaForm locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />;
}
```

### CMA Lead Payload

```typescript
export interface CmaLeadPayload {
  source: 'cma_form';
  intent: 'sell';
  name: string;
  phone: string;
  email: string;
  propertyType: string;
  location: LocationValue;
  approximateSize: string;
  sizeUnit: string;
  comment: string;
}

export function buildCmaLeadPayload(data: CmaFormData): CmaLeadPayload {
  return {
    source: 'cma_form',
    intent: 'sell',
    name: data.name,
    phone: data.phone,
    email: data.email,
    propertyType: data.propertyType,
    location: data.location,
    approximateSize: data.approximateSize,
    sizeUnit: data.sizeUnit,
    comment: data.comment,
  };
}
```

**Stub submission (same pattern as Story 5.1):**
```typescript
// 5.2 stub — Story 5.3 replaces with real API call.
const payload = buildCmaLeadPayload(formData);
if (process.env.NODE_ENV !== 'production') {
  console.log('[5.2 stub] CMA form payload:', payload);
}
await new Promise((resolve) => setTimeout(resolve, 500));
```

### Unit Toggle in Size Field

Same pattern as Story 5.1:
```typescript
import { useLocaleUnits } from '@/hooks/use-locale-units';
const { unitSystem, toggleUnits } = useLocaleUnits(locale);
```

### Validation

Same patterns as Story 5.1:
- Name: required, non-empty
- Phone: required, same regex (`/^\+?[\d\s\-()]+$/`, ≥7 digits)
- Email: optional, same regex (`/^[^@\s]+@[^@\s]+\.[^@\s]+$/`)
- Property Type: optional (dropdown, not required for CMA)
- Location: optional (text + map, nice to have for CMA)
- Size: optional
- Comment: optional

---

## File Structure Requirements

```
src/
├── app/
│   └── [locale]/
│       └── sell/
│           └── page.tsx                  ← MODIFY (add CMA section)
│
├── components/
│   └── seller/
│       ├── cma-form.tsx                  ← CREATE (Client Component, lazy-loaded)
│       ├── cma-form-loader.tsx           ← CREATE (Client Component, next/dynamic wrapper)
│       ├── cma-hero.tsx                  ← CREATE (Client Component, CMA value proposition)
│       ├── seller-confirmation.tsx       ← MODIFY (add source variant prop)
│       ├── seller-form.tsx              (no changes)
│       ├── seller-form-loader.tsx       (no changes)
│       ├── seller-form-skeleton.tsx     (no changes — reused for CMA loading)
│       ├── seller-hero.tsx              (no changes)
│       └── location-picker.tsx          (no changes — shared as designed)
│
├── messages/
│   ├── en.json                           ← MODIFY (add CmaForm namespace)
│   └── es.json                           ← MODIFY (add CmaForm namespace)
```

---

## Translatable Surfaces

**CRITICAL — Epic 4 retrospective action item:** Every translatable surface must be listed here.

### `CmaForm` namespace (`src/messages/en.json` / `es.json`)

```json
{
  "CmaForm": {
    "hero": {
      "heading": "Request a Free CMA",
      "subheading": "Just need a valuation? Request a Free CMA",
      "description": "A Comparative Market Analysis (CMA) is a professional assessment of your property's current market value. Our agents analyze recent sales, active listings, and market trends in your area to provide an accurate price estimate — completely free.",
      "ctaButton": "Request a Free CMA",
      "ctaButtonAriaLabel": "Open the CMA request form"
    },
    "form": {
      "heading": "Request Your Free CMA",
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
      "propertyTypeLabel": "Property Type",
      "propertyTypeAriaLabel": "Select property type (optional)",
      "propertyTypePlaceholder": "Select type...",
      "typeCasa": "House / Casa",
      "typeLote": "Lot / Lote",
      "typeFinca": "Farm / Finca",
      "typeCondominio": "Condo / Condominio",
      "typeCommercial": "Commercial / Comercial",
      "locationLabel": "Property Location",
      "locationPlaceholder": "Type address or nearest landmark",
      "locationAriaLabel": "Enter property location",
      "sizeLabel": "Approximate Size",
      "sizePlaceholder": "e.g. 5000",
      "sizeAriaLabel": "Enter approximate property size",
      "sizeUnitAriaLabel": "Toggle size unit between square meters, square feet, and acres",
      "commentLabel": "Comments or Questions (optional)",
      "commentPlaceholder": "Tell us anything else about your property or what you'd like to know...",
      "commentAriaLabel": "Additional comments or questions (optional)",
      "submitButton": "Request My Free CMA",
      "submitButtonAriaLabel": "Submit your CMA request",
      "submittingButton": "Submitting...",
      "validation": {
        "nameRequired": "Please enter your name",
        "phoneRequired": "Please enter your phone number",
        "phoneInvalid": "Please enter a valid phone number",
        "emailInvalid": "Please enter a valid email address"
      }
    },
    "confirmation": {
      "heading": "CMA Request Received!",
      "subheading": "Your agent will prepare your Comparative Market Analysis and contact you within 24 hours.",
      "agentMatchHeading": "Your Agent Match",
      "browseWhileWaiting": "While you wait, explore what's selling in your area"
    }
  }
}
```

**Spanish keys follow the same structure** — all keys translated in `es.json`.

```json
{
  "CmaForm": {
    "hero": {
      "heading": "Solicita un Avalúo Gratuito",
      "subheading": "¿Solo necesitas una valoración? Solicita un CMA gratuito",
      "description": "Un Análisis Comparativo de Mercado (CMA) es una evaluación profesional del valor actual de tu propiedad. Nuestros agentes analizan ventas recientes, listados activos y tendencias del mercado en tu zona para darte un precio estimado preciso — completamente gratis.",
      "ctaButton": "Solicitar CMA Gratuito",
      "ctaButtonAriaLabel": "Abrir el formulario de solicitud de CMA"
    },
    "form": {
      "heading": "Solicita tu CMA Gratuito",
      "nameLabel": "Nombre Completo",
      "namePlaceholder": "Tu nombre",
      "nameAriaLabel": "Ingresa tu nombre completo",
      "phoneLabel": "Teléfono / WhatsApp",
      "phonePlaceholder": "+506 8888-8888",
      "phoneAriaLabel": "Ingresa tu número de teléfono o WhatsApp",
      "phoneDescription": "WhatsApp preferido — tu agente te contactará aquí",
      "emailLabel": "Correo Electrónico (opcional)",
      "emailPlaceholder": "tu@correo.com",
      "emailAriaLabel": "Ingresa tu correo electrónico (opcional)",
      "emailOptionalBadge": "Opcional",
      "propertyTypeLabel": "Tipo de Propiedad",
      "propertyTypeAriaLabel": "Selecciona el tipo de propiedad (opcional)",
      "propertyTypePlaceholder": "Seleccionar tipo...",
      "typeCasa": "Casa",
      "typeLote": "Lote / Terreno",
      "typeFinca": "Finca",
      "typeCondominio": "Condominio",
      "typeCommercial": "Comercial",
      "locationLabel": "Ubicación de la Propiedad",
      "locationPlaceholder": "Escribe la dirección o punto de referencia más cercano",
      "locationAriaLabel": "Ingresa la ubicación de la propiedad",
      "sizeLabel": "Tamaño Aproximado",
      "sizePlaceholder": "ej. 5000",
      "sizeAriaLabel": "Ingresa el tamaño aproximado de la propiedad",
      "sizeUnitAriaLabel": "Alternar unidad de medida entre metros cuadrados, pies cuadrados y acres",
      "commentLabel": "Comentarios o Preguntas (opcional)",
      "commentPlaceholder": "Cuéntanos algo más sobre tu propiedad o qué te gustaría saber...",
      "commentAriaLabel": "Comentarios o preguntas adicionales (opcional)",
      "submitButton": "Solicitar Mi CMA Gratuito",
      "submitButtonAriaLabel": "Enviar tu solicitud de CMA",
      "submittingButton": "Enviando...",
      "validation": {
        "nameRequired": "Por favor ingresa tu nombre",
        "phoneRequired": "Por favor ingresa tu número de teléfono",
        "phoneInvalid": "Por favor ingresa un número de teléfono válido",
        "emailInvalid": "Por favor ingresa un correo electrónico válido"
      }
    },
    "confirmation": {
      "heading": "¡Solicitud de CMA Recibida!",
      "subheading": "Tu agente preparará tu Análisis Comparativo de Mercado y te contactará dentro de 24 horas.",
      "agentMatchHeading": "Tu Agente Asignado",
      "browseWhileWaiting": "Mientras esperas, explora lo que se vende en tu zona"
    }
  }
}
```

---

## dangerouslySetInnerHTML Audit

**Epic 4 retrospective requirement:** Any use of `dangerouslySetInnerHTML` must enumerate escape requirements at the output sink.

This story does NOT use `dangerouslySetInnerHTML`. All content is developer-authored static text rendered via i18n keys.

---

## Test Requirements

### Unit Tests (`tests/unit/seller/`)

Per the Epic 5 test design, the following tests cover Story 5.2:

| Test ID | What to test | File |
|---------|-------------|------|
| 5.2-COMP-001 | CMA form renders all fields (name, phone, email, type, location, size, comment) | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-COMP-002 | CMA form validation — name and phone required, email optional | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-COMP-003 | CMA form builds payload with source="cma_form" and intent="sell" | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-COMP-004 | CMA confirmation screen shows different heading than seller confirmation | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-COMP-005 | LocationPicker reused (not duplicated) for CMA location field | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-COMP-006 | CMA form strings in Spanish locale | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-COMP-007 | Size unit toggle uses useLocaleUnits hook | `tests/unit/seller/cma-form.spec.tsx` |
| 5.2-E2E-001 | CMA form accessible from seller page secondary CTA | `tests/unit/seller/cma-form.spec.tsx` |

**Client Component tests use standard RTL `render()`.**

**Mock for `CmaForm` in page-level tests:**
```typescript
vi.mock('@/components/seller/cma-form', () => ({
  CmaForm: () => <div data-testid="cma-form-mock" />,
}));
```

### data-testid Contract (CANNOT be renamed)

| `data-testid` | Component | Defined in Story |
|--------------|-----------|-----------------|
| `cma-form` | `CmaForm` wrapper | 5.2 |
| `cma-form-fields` | Form fields container | 5.2 |
| `cma-confirmation` | CMA confirmation screen | 5.2 |
| `cma-hero` | CMA value proposition section | 5.2 |
| `cma-submit-button` | Submit button | 5.2 |

---

## Architecture Compliance Checklist

- [ ] `CmaForm` uses `next/dynamic` with `{ ssr: false }` via `CmaFormLoader` (lazy-load)
- [ ] `CmaForm` is a Client Component (`'use client'`)
- [ ] `CmaHero` is a Client Component (uses useTranslations hook for i18n)
- [ ] `LocationPicker` imported from `@/components/seller/location-picker` — NOT duplicated
- [ ] `useLocaleUnits` used for size unit toggle (not custom state)
- [ ] `AgentCard` imported from `@/components/agent/agent-card` via `SellerConfirmation` — NOT duplicated
- [ ] All translatable strings in `CmaForm` i18n namespace — zero hardcoded EN/ES strings
- [ ] All aria-labels use i18n keys
- [ ] `data-testid` contracts applied exactly
- [ ] Same validation patterns as Story 5.1 (phone regex, email regex)
- [ ] Lead payload includes `source: "cma_form"` and `intent: "sell"` (R-009 mitigation)
- [ ] No `dangerouslySetInnerHTML` in new files
- [ ] `SellerConfirmation` enhanced with `source` prop (backward compatible, defaults to "seller")
- [ ] `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test` all pass green

---

## Previous Story Intelligence

### From Story 5.1 (critical patterns to follow)

**1. i18n — every string must be in a namespace.**
CMA form uses a separate `CmaForm` namespace (not `SellerPage`). This keeps the i18n tree clean and allows separate loading.

**2. Validation patterns — reuse, don't reinvent.**
Phone: `PHONE_RE = /^\+?[\d\s\-()]+$/` + `≥7 digits`
Email: `EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/`
These are the project standard (same as contact-form.tsx). Story 5.3 will replace with Zod schemas.

**3. Lazy-loading via `next/dynamic`.**
Follow the `SellerFormLoader` pattern — a thin `'use client'` wrapper that calls `dynamic()`. Required by Turbopack.

**4. `AgentCard` prop contract.**
Pass through `SellerConfirmation` — `agent`, `propertyTitle=""`, `propertyRef=""`, `locale`, `officeName`.

**5. Stub submission.**
CMA form does NOT call `/api/leads`. That's Story 5.3. Use `console.log` + 500ms delay + confirmation screen.

**6. `Link` import pattern.**
Use `Link` from `@/i18n/navigation` for all internal links.

---

## Risk Mitigation

From `test-design-epic-5.md`:

- **R-009 (BUS, score 3):** CMA source/intent tagging. Mitigated by: `buildCmaLeadPayload()` always sets `source: "cma_form"` + `intent: "sell"`. Test 5.2-COMP-003 verifies this.
- **R-011 (BUS, score 3):** Form validation errors in wrong locale. Mitigated by: all validation messages via CmaForm i18n namespace. Test 5.2-COMP-006 verifies Spanish locale.

---

## References

- `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.2 (§ "Story 5.2: CMA Request Form")
- `_bmad-output/planning-artifacts/prd.md` — FR41, FR42, FR43
- `_bmad-output/implementation-artifacts/5-1-seller-landing-page-and-list-with-us-form.md` — Patterns to reuse
- `_bmad-output/test-artifacts/test-design-epic-5.md` — Risk register, test scenarios for Story 5.2
- `_bmad-output/implementation-artifacts/epic-4-retro-2026-05-03.md` — Action items
- `src/components/seller/seller-form.tsx` — Reference implementation for form patterns
- `src/components/seller/location-picker.tsx` — Shared component to reuse
- `src/components/seller/seller-confirmation.tsx` — Confirmation component to enhance

---

*Story context engine analysis completed — comprehensive developer guide created.*
