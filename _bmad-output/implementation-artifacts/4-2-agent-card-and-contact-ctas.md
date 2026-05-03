# Story 4.2: Agent Card & Contact CTAs

**Status:** ready-for-dev
**GH Issue:** #94
**Epic:** 4 — Listing Detail & Agent Profiles
**Story Key:** 4-2-agent-card-and-contact-ctas
**Created:** 2026-05-02

---

## Story

As a **visitor**,
I want to easily contact the listing agent via WhatsApp or email,
so that I can ask questions or schedule a viewing with one tap.

---

## Acceptance Criteria

1. **Given** the listing detail page **When** the agent card renders (right sidebar on desktop, below content on mobile) **Then** it shows: agent photo, name, languages spoken, office affiliation, and WhatsApp + Email buttons (FR37 partial)

2. **Given** the WhatsApp CTA **When** clicked **Then** WhatsApp opens with a pre-populated message in the user's language referencing the property title and ref number (FR34)

3. **Given** a Spanish-speaking visitor **When** clicking WhatsApp **Then** the pre-populated message is in Spanish: "Hola [Agent], me interesa la propiedad [Title]..." (FR34)

4. **Given** the email CTA **When** clicked **Then** a contact form opens (or mailto link) with property context pre-filled (FR35)

5. **Given** the site **When** the agent card renders **Then** a transparency note displays about agent languages and WhatsApp's built-in translation (FR36)

6. **Given** mobile viewport **When** scrolling the listing detail **Then** a sticky bottom bar (56px) with WhatsApp + Email buttons appears and persists (UX-DR9)

7. **Given** the sticky mobile CTA **When** the agent card scrolls into viewport **Then** the sticky bar hides (IntersectionObserver) to avoid duplication (UX-DR9)

8. **And** WhatsApp clicks are tracked as lead events with UTM/source data (FR54 support)

9. **And** the agent card uses `role="article"` with appropriate ARIA labels (UX-DR25)

---

## Tasks / Subtasks

### Task 1: Create `src/lib/utils/whatsapp.ts` — WhatsApp message builder utility (AC: #2, #3)

- [ ] Create the file at EXACTLY `src/lib/utils/whatsapp.ts` (architecture §3 specifies this location)
- [ ] **CRITICAL:** This utility must NOT be a Client Component — it is a pure function library. No `'use client'`. It can be called from both Server and Client Components.
- [ ] **Function: `buildWhatsAppMessage`:**
  ```typescript
  interface WhatsAppMessageOptions {
    agentName: string;
    propertyTitle: string;
    propertyRef: string; // e.g. "ALT-12345"
    locale: string;      // "en" | "es"
  }

  export function buildWhatsAppMessage(opts: WhatsAppMessageOptions): string {
    if (opts.locale === "es") {
      return `Hola ${opts.agentName}, me interesa la propiedad "${opts.propertyTitle}" (Ref: ${opts.propertyRef}).`;
    }
    return `Hi ${opts.agentName}, I'm interested in "${opts.propertyTitle}" (Ref: ${opts.propertyRef}).`;
  }
  ```
- [ ] **Function: `buildWhatsAppUrl`:**
  ```typescript
  export function buildWhatsAppUrl(whatsapp: string, message: string): string {
    // whatsapp is E.164 digits only (e.g. "50627710000")
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  }
  ```
- [ ] **IMPORTANT:** `src/lib/constants/offices.ts` already has a `buildWhatsAppUrl` function for office-level contact. The NEW utility in `src/lib/utils/whatsapp.ts` is for property-specific agent contact with message builder logic. Do NOT delete or modify the one in `offices.ts` — it serves a different purpose (office fallback).
- [ ] Export both functions as named exports.

### Task 2: Create `src/lib/utils/utm.ts` — UTM parameter extractor (AC: #8)

- [ ] Create the file at EXACTLY `src/lib/utils/utm.ts` (architecture §3 specifies this location)
- [ ] **CRITICAL:** This is a browser-side utility — do NOT add `import "server-only"`. UTM extraction runs in the browser when tracking WhatsApp clicks.
- [ ] **Function: `extractUtmParams`:**
  ```typescript
  export interface UtmParams {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  }

  export function extractUtmParams(searchParams?: URLSearchParams | string): UtmParams {
    const params = typeof searchParams === "string"
      ? new URLSearchParams(searchParams)
      : (searchParams ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()));
    return {
      source: params.get("utm_source") ?? undefined,
      medium: params.get("utm_medium") ?? undefined,
      campaign: params.get("utm_campaign") ?? undefined,
      content: params.get("utm_content") ?? undefined,
      term: params.get("utm_term") ?? undefined,
    };
  }
  ```
- [ ] Export as named export.

### Task 3: Create `src/components/agent/agent-card.tsx` — Agent identity + contact display (AC: #1, #2, #3, #4, #5, #9)

- [ ] Create directory `src/components/agent/` if it does not exist
- [ ] Create the file at EXACTLY `src/components/agent/agent-card.tsx`
- [ ] **This is a Client Component** — add `'use client'` as first line. It builds WhatsApp URLs with browser-side message context and tracks clicks.
- [ ] **Props interface:**
  ```typescript
  import type { Agent } from "@/lib/db/schema/agents";

  interface AgentCardProps {
    agent: Agent;
    propertyTitle: string;
    propertyRef: string; // property's apiId — used in WhatsApp message, e.g. "ALT-12345"
    locale: string;
    variant?: "default" | "compact"; // default = listing detail sidebar; compact = future use
  }
  ```
- [ ] **Layout (default variant — UX spec §AgentCard anatomy):**
  ```
  <article role="article" aria-label="{t('agentCardLabel', { name: agent.name })}">
    <img src={photoUrl} alt={t('agentPhotoAlt', { name: agent.name })} />
    <div>
      <h3>{agent.name}</h3>
      <p>{languages list with flag icons (text only — no emoji in code)}</p>
      <p>{office affiliation}</p>
      <p>{agent.listingCount} {t('listings')}</p>
    </div>
    {transparency note (FR36)}
    <div class="ctaButtons">
      <WhatsApp button>
      <Email button>
    </div>
  </article>
  ```
- [ ] **Photo:** Use `next/image` with `src={agent.photoOptimizedUrl ?? agent.photoUrl ?? '/images/agent-placeholder.jpg'}`. If photo is null/undefined, use a placeholder image at `/images/agent-placeholder.jpg` (create a simple SVG fallback — see Task 6). Sizes: `"80px"` (sidebar). Add `data-testid="agent-photo"`.
- [ ] **Languages display:** Map `agent.languages` array to human-readable labels using `t('language.{lang}')` keys (add in Task 7). Example: `['en', 'es']` → "English, Spanish". Add `data-testid="agent-languages"`.
- [ ] **Office affiliation:** Resolve office name by `agent.officeId`. Since `AgentCard` is passed an `Agent` object (which has `officeId` UUID), you need a way to resolve the name. **Use a lookup constants approach** — pass `officeName` as a prop OR derive it from `OFFICE_IDS` constants:
  ```typescript
  // Add officeName to props (recommended — simpler, resolved server-side in listing-detail-layout.tsx):
  interface AgentCardProps {
    // ... existing props ...
    officeName: string; // passed from parent after resolving via offices.ts query or constants
  }
  ```
  **Alternate:** The `offices.ts` constants file (`src/lib/constants/offices.ts`) has the two offices. The `officeId` UUID on `Agent` comes from the database. To avoid a second DB query, the parent (`ListingDetailLayout`) should pass `officeName` directly. See Task 5 for how `ListingDetailLayout` provides this.
- [ ] **WhatsApp button (AC: #2, #3):**
  - Import `buildWhatsAppMessage` and `buildWhatsAppUrl` from `@/lib/utils/whatsapp`
  - Build message: `buildWhatsAppMessage({ agentName: agent.name, propertyTitle, propertyRef, locale })`
  - Build URL: `buildWhatsAppUrl(agent.whatsapp!, message)` — guard: if `agent.whatsapp` is null/empty, hide button or disable it
  - `href={whatsappUrl}` on an `<a>` tag (opens native app; NOT a `<button>`)
  - `target="_blank"` + `rel="noopener noreferrer"`
  - Apply WhatsApp brand color via Tailwind: `bg-brand-whatsapp` (Tailwind utility mapped from `--color-brand-whatsapp: var(--brand-whatsapp)` in `globals.css`; value: `#128c7e`) — WCAG AA verified per UX spec
  - Icon: WhatsApp icon (inline SVG or use a simple phone icon — do NOT install a new icon library)
  - `data-testid="agent-whatsapp-cta"`
  - On click, fire lead tracking (see Task 4)
- [ ] **Email button (AC: #4):**
  - If `agent.email` is set: render as `<a href="mailto:{agent.email}?subject=...&body=...">`. Pre-fill subject: `t('emailSubject', { title: propertyTitle, ref: propertyRef })`. Pre-fill body: same template as WhatsApp but formatted for email.
  - If `agent.email` is null: render disabled button (dimmed, `aria-disabled="true"`)
  - `data-testid="agent-email-cta"`
  - Apply `bg-brand-navy` (existing design token)
- [ ] **Transparency note (AC: #5, FR36):** Below the agent info, before the CTA buttons, add:
  ```tsx
  <p className="text-sm text-text-muted" data-testid="agent-transparency-note">
    {t('transparencyNote')}
  </p>
  ```
  Translation key: "This agent may use WhatsApp's built-in translation for multilingual conversations." / "Este agente puede usar la traducción integrada de WhatsApp para conversaciones multilingües."
- [ ] **ARIA (AC: #9):** Root element is `<article role="article" aria-label={t('agentCardLabel', { name: agent.name })}>`. Agent name heading is `<h3>` (the listing detail `<article>` uses `<h1>` for title, `<h2>` for sections — agent card is a sub-section using `<h3>`).
- [ ] **i18n:** Use `useTranslations('AgentCard')` — add namespace in Task 7.
- [ ] **Lead tracking on WhatsApp click:** Call `trackWhatsAppClick` from Task 4 in an `onClick` handler.

### Task 4: Create `src/components/lead/whatsapp-cta.tsx` — Lead tracking for WhatsApp (AC: #8)

- [ ] Create the file at EXACTLY `src/components/lead/whatsapp-cta.tsx`
- [ ] Add `'use client'` — this module contains a function that accesses `window` and dispatches browser events. While it exports a plain function (not a React component), marking it `'use client'` ensures Next.js does not attempt to run it on the server, where `window` is undefined.
- [ ] **Purpose:** Thin wrapper that fires a lead tracking event when WhatsApp is clicked. This is the "FR54 support" referenced in AC #8 — records click source + UTM data.
- [ ] **IMPORTANT:** Story 4.2 does NOT implement `POST /api/leads` (that is Epic 5 / Story 5.3 scope). The tracking in this story is **client-side only** — use `console.log` or `window.dispatchEvent` as a placeholder that Epic 5 will replace with the real API call.
- [ ] **Export a `trackWhatsAppClick` function:**
  ```typescript
  interface WhatsAppClickEvent {
    agentId: string;
    propertyRef: string;
    locale: string;
    source: string; // "listing_detail"
    utmParams: UtmParams; // from extractUtmParams
  }

  export function trackWhatsAppClick(event: WhatsAppClickEvent): void {
    // TODO Story 5.3: Replace with POST /api/leads
    // For now, emit a custom event for future analytics integration
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("whatsapp_click", { detail: event }));
    }
  }
  ```
- [ ] Import `extractUtmParams` and `UtmParams` from `@/lib/utils/utm`.
- [ ] In `AgentCard` (Task 3), call `trackWhatsAppClick` in the WhatsApp `<a>` tag's `onClick` handler:
  ```typescript
  onClick={() => {
    trackWhatsAppClick({
      agentId: agent.id,
      propertyRef,
      locale,
      source: "listing_detail",
      utmParams: extractUtmParams(),
    });
  }}
  ```

### Task 5: Update `src/components/listing/listing-detail-layout.tsx` — Wire in `AgentCard` (AC: #1, #6, #7)

- [ ] **File:** `src/components/listing/listing-detail-layout.tsx` (MODIFY — exists from Story 4.1)
- [ ] **CRITICAL:** Remove the `void agent;` suppression (line 43-44 in current implementation) and the TODO comment on line 195-196.
- [ ] **Add `AgentCard` import** (lazy-load it — it's a Client Component in a Server Component context, same pattern as `PropertyGallery`):
  ```typescript
  import dynamic from "next/dynamic";
  const AgentCard = dynamic(() => import("@/components/agent/agent-card").then(m => ({ default: m.AgentCard })), { ssr: false });
  ```
  **Actually:** Since `AgentCard` does NOT need SSR disabled (it renders fine server-side for initial HTML), use static import instead:
  ```typescript
  import { AgentCard } from "@/components/agent/agent-card";
  ```
  `AgentCard` is a Client Component but can be imported directly in a Server Component — Next.js handles the boundary automatically. Only use `next/dynamic` with `ssr: false` for browser-only APIs (like Mapbox). AgentCard uses no browser-only APIs in its initial render.
- [ ] **Resolve office name:** Query the office for the agent — use `getOfficeById` from `src/lib/db/queries/offices.ts` if it exists, OR derive from `src/lib/constants/offices.ts`. The simplest approach:
  ```typescript
  // In ListingDetailLayoutProps or in the component body:
  // agents.officeId is a UUID. Look it up against the hardcoded office constants
  // OR add a getOfficeById query. Recommendation: pass officeName as a prop derived in page.tsx
  ```
  **Recommended:** In `src/app/[locale]/property/[slug]/page.tsx`, after fetching `agent`, resolve the office name with a new query `getOfficeById`. See Task 5b below.
- [ ] **Replace the TODO comment** with actual AgentCard usage:
  ```tsx
  {agent && (
    <AgentCard
      agent={agent}
      propertyTitle={title}
      propertyRef={property.apiId ?? property.id}
      locale={locale}
      officeName={officeName ?? t('unknownOffice')}
    />
  )}
  {!agent && (
    <p className="text-sm text-text-muted">{t('noAgentAssigned')}</p>
  )}
  {/* Note: t() here is from getTranslations({ namespace: "ListingDetail" }) — so both 'unknownOffice' and 'noAgentAssigned' are in the ListingDetail namespace */}
  ```
- [ ] **Also add `StickyMobileCTA`** (imported from Task 6 below):
  ```tsx
  {agent && (
    <StickyMobileCTA
      agentWhatsapp={agent.whatsapp ?? null}
      agentEmail={agent.email ?? null}
      agentName={agent.name}
      propertyTitle={title}
      propertyRef={property.apiId ?? property.id}
      locale={locale}
    />
  )}
  ```
  Note: `StickyMobileCTA` renders outside the main flow as a fixed overlay — put it after the closing `</article>` or at the end of the component return, NOT inside the article.

### Task 5b: Add `getOfficeById` query (dependency for Task 5)

- [ ] **File:** `src/lib/db/queries/offices.ts` (check if file exists first — if it does, ADD to it; if not, CREATE it)
- [ ] **Check:** Does `src/lib/db/queries/offices.ts` exist? Look at the current file listing.
- [ ] **Add function:**
  ```typescript
  import "server-only";
  import { eq } from "drizzle-orm";
  import { db } from "@/lib/db/client";
  import { offices } from "@/lib/db/schema/offices";

  export async function getOfficeById(id: string) {
    const rows = await db.select().from(offices).where(eq(offices.id, id)).limit(1);
    return rows[0] ?? null;
  }
  ```
- [ ] **Update `src/app/[locale]/property/[slug]/page.tsx`:** After fetching agent, also fetch office:
  ```typescript
  const office = agent?.officeId ? await getOfficeById(agent.officeId) : null;
  // Then pass officeName to ListingDetailLayout:
  ```
  Add `officeName?: string` to `ListingDetailLayoutProps` and pass `office?.name ?? undefined`.

### Task 6: Create `src/components/lead/sticky-mobile-cta.tsx` — Persistent mobile contact bar (AC: #6, #7)

- [ ] Create the file at EXACTLY `src/components/lead/sticky-mobile-cta.tsx`
- [ ] Add `'use client'` — uses `useRef`, `useEffect`, `useState` for IntersectionObserver
- [ ] **Props interface:**
  ```typescript
  interface StickyMobileCTAProps {
    agentWhatsapp: string | null;
    agentEmail: string | null;
    agentName: string;
    propertyTitle: string;
    propertyRef: string;
    locale: string;
  }
  ```
- [ ] **IntersectionObserver logic (AC: #7 — hide when AgentCard visible):**
  ```typescript
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Find the AgentCard element by data-testid to observe it
    const agentCard = document.querySelector('[data-testid="agent-card"]');
    if (!agentCard) {
      // If no agent card, always show sticky CTA
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hide sticky bar when agent card is visible; show when scrolled away
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(agentCard);
    return () => observer.disconnect();
  }, []);
  ```
- [ ] **Layout (UX spec §StickyMobileCTA — 56px fixed bottom bar):**
  ```tsx
  <div
    className={cn(
      "fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-center gap-2 border-t border-brand-warm bg-brand-warm px-4 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out md:hidden",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}
    data-testid="sticky-mobile-cta"
    aria-label={t('stickyCtaLabel')}
  >
    {agentWhatsapp && <WhatsApp button ... />}
    {agentEmail && <Email button ... />}
  </div>
  ```
  - Height: `h-14` (56px per UX spec)
  - Hidden on desktop: `md:hidden` (mobile only per UX spec)
  - iOS safe area: `pb-[env(safe-area-inset-bottom)]`
  - Slide-up entrance animation: `transition-transform duration-200 ease-out` + `translate-y-0` / `translate-y-full` (UX spec: "200ms ease-out")
  - Background: `bg-brand-warm` (design system warm cream token `#efece4`; UX spec refers to "cream" but the actual Tailwind token is `bg-brand-warm`)
  - WhatsApp color: `bg-brand-whatsapp` (Tailwind utility; mapped from `--color-brand-whatsapp: #128c7e`; WCAG AA verified per UX spec)
- [ ] **`cn` utility:** Import as `import { cn } from "@/lib/utils"` — this is `src/lib/utils.ts` (a barrel export combining `clsx` + `tailwind-merge`). This is the universal pattern used by all Client Components in this project.
- [ ] **WhatsApp button in sticky bar:** Same `buildWhatsAppMessage` + `buildWhatsAppUrl` + `trackWhatsAppClick` pattern as AgentCard. Source: `"sticky_mobile_cta"`.
- [ ] **Email button in sticky bar:** `mailto:` link same as AgentCard.
- [ ] `data-testid="sticky-mobile-cta"` on the container div.
- [ ] **i18n:** Use `useTranslations('StickyMobileCTA')` — add namespace in Task 7.
- [ ] **IMPORTANT:** Add `data-testid="agent-card"` to the root `<article>` element in `AgentCard` (Task 3) so the IntersectionObserver can find it.

### Task 7: Add i18n keys for new components (AC: all)

- [ ] **File:** `src/messages/en.json` — add new namespaces (DO NOT re-add existing keys):
  ```json
  "AgentCard": {
    "agentCardLabel": "Listing agent: {name}",
    "agentPhotoAlt": "Photo of {name}",
    "listings": "listings",
    "contactAgent": "Contact Agent",
    "whatsapp": "WhatsApp",
    "email": "Email",
    "emailSubject": "Inquiry: {title} — Ref {ref}",
    "emailBody": "Hello, I'm interested in {title} (Ref: {ref}).",
    "transparencyNote": "This agent may use WhatsApp's built-in translation for multilingual conversations.",
    "noWhatsApp": "WhatsApp not available",
    "language": {
      "en": "English",
      "es": "Spanish",
      "de": "German",
      "fr": "French",
      "it": "Italian",
      "pt": "Portuguese"
    }
  },
  "StickyMobileCTA": {
    "stickyCtaLabel": "Contact agent",
    "whatsapp": "WhatsApp",
    "email": "Email"
  }
  ```
- [ ] **File:** `src/messages/es.json` — add equivalent Spanish translations:
  ```json
  "AgentCard": {
    "agentCardLabel": "Agente a cargo: {name}",
    "agentPhotoAlt": "Foto de {name}",
    "listings": "propiedades",
    "contactAgent": "Contactar Agente",
    "whatsapp": "WhatsApp",
    "email": "Correo",
    "emailSubject": "Consulta: {title} — Ref {ref}",
    "emailBody": "Hola, me interesa la propiedad {title} (Ref: {ref}).",
    "transparencyNote": "Este agente puede usar la traducción integrada de WhatsApp para conversaciones multilingües.",
    "noWhatsApp": "WhatsApp no disponible",
    "language": {
      "en": "Inglés",
      "es": "Español",
      "de": "Alemán",
      "fr": "Francés",
      "it": "Italiano",
      "pt": "Portugués"
    }
  },
  "StickyMobileCTA": {
    "stickyCtaLabel": "Contactar agente",
    "whatsapp": "WhatsApp",
    "email": "Correo"
  }
  ```
- [ ] **ALSO update `ListingDetail` namespace** to add `unknownOffice` key (the existing `noAgentAssigned` key is already there from Story 4.1 — do NOT re-add it):
  - English: `"unknownOffice": "RE/MAX Altitud"`
  - Spanish: `"unknownOffice": "RE/MAX Altitud"`
- [ ] **DO NOT re-add** existing keys (`PropertyCard.*`, `PropertyUnavailable.*`, `UnitToggle.*`, `PropertyGallery.*`, `StickySpecsBar.*`, `Navigation.*`, and the full existing `ListingDetail.*` namespace — only ADD `unknownOffice` to it)

### Task 8: Create agent placeholder image (AC: #1)

- [ ] Create or verify `public/images/agent-placeholder.jpg` (or `.svg`) exists.
- [ ] **Check:** Does `public/images/` directory exist? If not, create it.
- [ ] Create a minimal SVG placeholder at `public/images/agent-placeholder.svg`:
  ```svg
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="40" fill="#E8E4DA"/>
    <circle cx="40" cy="32" r="14" fill="#B0A898"/>
    <ellipse cx="40" cy="70" rx="24" ry="18" fill="#B0A898"/>
  </svg>
  ```
  Use brand-warm tones that fit the design system.
- [ ] Reference as `'/images/agent-placeholder.svg'` in `AgentCard` photo fallback.

### Task 9: Unit tests for `AgentCard` (AC: #1, #2, #3, #4, #5, #9)

- [ ] Create `tests/unit/listing/agent-card.spec.tsx` (jsdom applies from Story 4.1's vitest.config.mts update — `tests/unit/listing/**/*.spec.tsx` glob is already configured)
- [ ] **CRITICAL — vi.mock hoisting pattern** (established in Epic 3 and all Epic 4 stories): ALL `vi.mock()` calls MUST appear BEFORE the component import. Add `// imported AFTER mocks` comment.
- [ ] **Required mocks (hoisted before imports):**
  ```typescript
  vi.mock("next/image", () => ({
    default: ({ src, alt, "data-testid": testId, ...props }: {
      src: string; alt: string; "data-testid"?: string; [key: string]: unknown;
    }) => <img src={src} alt={alt} data-testid={testId} {...props} />,
  }));

  vi.mock("next-intl", () => ({
    useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key
    ),
  }));

  vi.mock("@/lib/utils/whatsapp", () => ({
    buildWhatsAppMessage: vi.fn(() => "Test WhatsApp message"),
    buildWhatsAppUrl: vi.fn((phone: string, msg: string) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`),
  }));

  vi.mock("@/components/lead/whatsapp-cta", () => ({
    trackWhatsAppClick: vi.fn(),
  }));
  ```
  // imported AFTER mocks
  ```typescript
  import { render, screen, fireEvent } from "@testing-library/react";
  import { AgentCard } from "@/components/agent/agent-card";
  ```
- [ ] **Test fixture:**
  ```typescript
  const mockAgent = {
    id: "agent-uuid-1",
    apiId: "api-agent-1",
    officeId: "office-uuid-1",
    slug: "emma-smith",
    name: "Emma Smith",
    email: "emma@remax-altitud.cr",
    phone: "+506 8800-0000",
    whatsapp: "50688000000",
    photoUrl: "https://cdn.example.com/emma.jpg",
    photoOptimizedUrl: "/agent-photos/emma-400w.webp",
    languages: ["en", "es"],
    specializations: [],
    bioEn: "Mountain specialist.",
    bioEs: "Especialista en montaña.",
    listingCount: 12,
    isActive: true,
    syncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  ```
- [ ] **Tests to write:**
  - `[P0]` renders `data-testid="agent-card"` element
  - `[P0]` renders agent name
  - `[P0]` renders `data-testid="agent-photo"` with correct src (photoOptimizedUrl preferred)
  - `[P0]` renders `data-testid="agent-languages"` with language list
  - `[P0]` renders `data-testid="agent-whatsapp-cta"` link when agent.whatsapp is set
  - `[P0]` renders `data-testid="agent-email-cta"` link when agent.email is set
  - `[P0]` renders `data-testid="agent-transparency-note"`
  - `[P1]` WhatsApp link has correct href (wa.me URL)
  - `[P1]` Email link has correct href (mailto URL with subject)
  - `[P1]` clicking WhatsApp link calls trackWhatsAppClick
  - `[P1]` hides WhatsApp button when agent.whatsapp is null
  - `[P2]` uses placeholder image when photoOptimizedUrl and photoUrl are null
  - `[P2]` renders article with role="article"

### Task 10: Unit tests for `StickyMobileCTA` (AC: #6, #7)

- [ ] Create `tests/unit/listing/sticky-mobile-cta.spec.tsx`
- [ ] **Required mocks (hoisted):**
  ```typescript
  vi.mock("next-intl", () => ({
    useTranslations: vi.fn(() => (key: string) => key),
  }));

  vi.mock("@/lib/utils/whatsapp", () => ({
    buildWhatsAppMessage: vi.fn(() => "Test message"),
    buildWhatsAppUrl: vi.fn((phone: string) => `https://wa.me/${phone}`),
  }));

  vi.mock("@/components/lead/whatsapp-cta", () => ({
    trackWhatsAppClick: vi.fn(),
  }));

  // Mock IntersectionObserver (not available in jsdom)
  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", vi.fn(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
  })));
  ```
- [ ] **Tests to write:**
  - `[P0]` renders `data-testid="sticky-mobile-cta"` element
  - `[P0]` initially not visible (translate-y-full class) before IntersectionObserver fires
  - `[P1]` shows WhatsApp button when agentWhatsapp is provided
  - `[P1]` shows Email button when agentEmail is provided
  - `[P1]` hides WhatsApp button when agentWhatsapp is null
  - `[P1]` hides Email button when agentEmail is null
  - `[P2]` calls IntersectionObserver.observe on mount
  - `[P2]` calls IntersectionObserver.disconnect on unmount

### Task 11: Unit tests for whatsapp.ts utility (AC: #2, #3)

- [ ] Create `tests/unit/listing/whatsapp-utils.spec.ts` (`.ts`, no JSX — pure function tests)
- [ ] **Tests to write:**
  - `[P0]` English message format: "Hi [name], I'm interested in..."
  - `[P0]` Spanish message format: "Hola [name], me interesa la propiedad..."
  - `[P0]` buildWhatsAppUrl returns correct wa.me URL with encoded message
  - `[P1]` special characters in property title are URL-encoded
  - `[P1]` handles agent name with special characters

### Task 12: CI verification (AC: all)

- [ ] `npm run typecheck` → 0 new errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm run format:check` → pass
- [ ] `npm run build` → pass
- [ ] `npm test` → all existing tests pass (614+ baseline from Story 4.1) + new agent card / sticky CTA / whatsapp utils tests pass

---

## Dev Notes

### Architecture Context

**File structure (architecture §3):**
```
src/
  components/
    agent/
      agent-card.tsx                   ← NEW (Client Component — 'use client')
    lead/
      whatsapp-cta.tsx                 ← NEW (lead event tracking utility)
      sticky-mobile-cta.tsx            ← NEW (Client Component — 'use client')
    listing/
      listing-detail-layout.tsx        ← MODIFY (wire in AgentCard + StickyMobileCTA)
  lib/
    db/queries/
      offices.ts                       ← CREATE or MODIFY (add getOfficeById)
    utils/
      whatsapp.ts                      ← NEW (message builder — pure functions)
      utm.ts                           ← NEW (UTM extractor — browser-safe)
  messages/
    en.json                            ← MODIFY (add AgentCard, StickyMobileCTA namespaces)
    es.json                            ← MODIFY (add AgentCard, StickyMobileCTA namespaces)
  app/[locale]/property/[slug]/
    page.tsx                           ← MODIFY (add officeName resolution)
  public/images/
    agent-placeholder.svg              ← NEW (fallback photo)
tests/
  unit/listing/
    agent-card.spec.tsx                ← NEW
    sticky-mobile-cta.spec.tsx         ← NEW
    whatsapp-utils.spec.ts             ← NEW
```

**Server/Client boundary:**
- `ListingDetailLayout` = Server Component (existing from Story 4.1)
- `AgentCard` = Client Component (`'use client'`) — imported directly (no `next/dynamic` needed; no browser-only init)
- `StickyMobileCTA` = Client Component (`'use client'`) — uses `IntersectionObserver`, `useState`, `useEffect`
- `whatsapp.ts` utility = pure functions, no runtime guard needed
- `utm.ts` utility = browser-safe (guards with `typeof window !== "undefined"`)

**IMPORTANT: Why NOT lazy-load AgentCard with `next/dynamic`:**
Story 4.1 uses `next/dynamic({ ssr: false })` for `PropertyGallery` because it uses `@use-gesture/react` which has browser-only initialization. `AgentCard` has no such constraint — it can render on the server. Import it directly. The Turbopack workaround (`PropertyGalleryLoader`) was specific to the gallery's browser-only gesture library.

### Critical Patterns from Previous Stories

**vi.mock hoisting (learned Story 3.1, held through all Epic 3 + 4.1 stories):** All `vi.mock()` calls MUST appear before `import` statements. Add `// imported AFTER mocks` comment after the last mock. This is a hard rule — violations cause test failures.

**i18n — NO hardcoded strings (repeated failure in Epic 3):** Every user-visible string, aria-label, and alt text MUST use `useTranslations` or `getTranslations`. Do NOT hardcode English. The code review adversarial pipeline will catch it.

**`data-testid` contract (Story 4.2 — CANNOT rename these):**
- `data-testid="agent-card"` — root `<article>` in `AgentCard` (also used by IntersectionObserver in `StickyMobileCTA`)
- `data-testid="agent-photo"` — agent photo image
- `data-testid="agent-languages"` — languages display element
- `data-testid="agent-whatsapp-cta"` — WhatsApp CTA link
- `data-testid="agent-email-cta"` — Email CTA link
- `data-testid="agent-transparency-note"` — FR36 transparency note
- `data-testid="sticky-mobile-cta"` — sticky bottom bar container

**WhatsApp color tokens (from globals.css, confirmed in UX spec):**
- `--brand-whatsapp: #128c7e` → Tailwind utility: `bg-brand-whatsapp` (WCAG AA for text bg at all sizes)
- `--brand-whatsapp-icon: #25d366` → Tailwind: `text-brand-whatsapp-icon` or inline style for icon glyph ONLY — NOT for text backgrounds
- Mapped via `--color-brand-whatsapp` / `--color-brand-whatsapp-icon` in `globals.css` `@theme` block
- Use `bg-brand-whatsapp` for button backgrounds. Use `text-white` for text on WhatsApp buttons.
- **NEVER use `#25d366` as a button background** — fails WCAG AA contrast.
- **ALSO**: `bg-brand-warm` is the correct Tailwind class for the warm cream background (`#efece4`). There is NO `bg-brand-cream` token.

**`cn` utility:** `import { cn } from "@/lib/utils"` — maps to `src/lib/utils.ts` which exports `cn` built with `clsx` + `tailwind-merge`. This is the universal import used by all Client Components (confirmed in unit-toggle.tsx, split-hero.tsx, navigation-menu.tsx, etc.).

**`next/image` for agent photos:**
- Agent photos are in `photoOptimizedUrl` (local WebP, relative path) or `photoUrl` (CDN, may need `remotePatterns`)
- Story 4.1 Task 0 already added Azure CDN `remotePatterns` to `next.config.ts` — check `next.config.ts` to confirm Azure CDN pattern covers agent photo CDN URLs too
- `photoOptimizedUrl` paths are local (`/agent-photos/...`) — no `remotePatterns` needed
- If `photoOptimizedUrl` is null but `photoUrl` is set (Azure CDN), it will work with Story 4.1's `remotePatterns`

**`property.apiId` for property reference:** The property `apiId` field (from the RE/MAX CCA API sync) is the human-readable reference like "ALT-12345". Use `property.apiId` as `propertyRef` in the WhatsApp message. Check the `properties` schema: `apiId` is `text("api_id").notNull().unique()` — it's always set.

**`getOfficeById` — check if offices.ts queries already exist:** Run `ls src/lib/db/queries/` to see if `offices.ts` already exists. If it does, add `getOfficeById` to it rather than creating from scratch. Preserve any existing `import "server-only"` at the top.

**Safari iOS safe area for sticky bar:** The `pb-[env(safe-area-inset-bottom)]` Tailwind class handles the iOS home indicator. This is the same pattern used in the mobile pull-up sheet from Story 3.6 (`map-pull-up-sheet.tsx`). Look at that component for the exact Tailwind approach used.

**IntersectionObserver in tests:** jsdom does not implement `IntersectionObserver`. Mock it globally in the test file with `vi.stubGlobal`. See the mock in Task 10.

**Lead tracking placeholder (AC: #8, FR54):** The `trackWhatsAppClick` function dispatches a custom browser event. This is intentionally a stub — Epic 5 Story 5.3 will replace it with `POST /api/leads`. Do NOT implement the actual API call in this story.

### Story 4.1 Learnings Applied

- **StickySpecsBar zmtStatus keys bug:** In Story 4.1 code review (C1), a missing i18n namespace caused runtime failures. This story pre-emptively adds ALL required i18n keys for both `AgentCard` and `StickyMobileCTA` namespaces.
- **Thumbnail button ARIA:** Story 4.1 review noted `role="listitem"` on `<button>` inside `role="list"` is non-canonical. In `AgentCard` language tags, use proper `<ul><li>` or a simple `<div>` with no conflicting role.
- **Server Component `void agent`:** Story 4.1 used `void agent;` to suppress unused-var. This story REMOVES that suppression since `agent` is now actively used.
- **Turbopack + next/dynamic:** Story 4.1 created `PropertyGalleryLoader` as a workaround for Turbopack + `next/dynamic ssr:false`. `AgentCard` does NOT need this workaround since it doesn't require `ssr:false`.

### Deferred Work Context

From `deferred-work.md`:
- `buildWhatsAppUrl` in `src/lib/constants/offices.ts` — "Consider renaming to `buildContactUrl` in a later pass." This story does NOT rename it. The new `src/lib/utils/whatsapp.ts` is the property-level message builder. Both coexist.
- `CONTACT_INBOX` / `RECRUIT_INBOX` hardcoded placeholder emails — Story 5.3 swap point. Not relevant to Story 4.2.

### Performance Notes

- `AgentCard` is a Client Component but its initial render contains no browser-only APIs. It renders correctly as SSR HTML with the gallery page — agent name, photo, and CTA buttons appear in the initial HTML for crawlers.
- `StickyMobileCTA` with `md:hidden` ensures the 56px bar never appears on desktop — no layout cost for desktop users.
- The `IntersectionObserver` in `StickyMobileCTA` uses a single observer per page load and disconnects on unmount — no memory leak risk.

### Test Infrastructure Notes

- Test directory: `tests/unit/listing/` (already created by Story 4.1)
- `vitest.config.mts` `environmentMatchGlobs` already covers `tests/unit/listing/**/*.spec.tsx` (added in Story 4.1 Task 9) — no changes needed to vitest config
- `whatsapp-utils.spec.ts` uses `.ts` extension (no JSX) — runs in default `node` environment, no jsdom needed
- Current baseline: 614 tests pass (Story 4.1 completion notes)

---

## Story Context

**Epic 4 objective:** Convert property discovery (Epic 3) into leads. Story 4.1 built the listing detail page with gallery and specs. Story 4.2 adds the agent contact layer — the primary lead generation mechanism (WhatsApp-first).

**What Story 4.1 left (TODO comments in `listing-detail-layout.tsx`):**
- Line 195: `{/* TODO Story 4.2: AgentCard component goes here */}` — this story fulfills it
- Line 43-44: `void agent; // suppress unused-vars until Story 4.2 adds AgentCard` — remove this

**What Story 4.3 adds (NOT in this story's scope):**
- Full agent profile pages (`/en/agents/emma-smith`)
- Agent listing grid on profile page
- Agents index page (`/en/agents`)

**What Story 4.5 adds (NOT in this story's scope):**
- Similar properties carousel (line 198 TODO in `listing-detail-layout.tsx` — leave it)
- Breadcrumbs component

**Dependencies:**
- Story 4.1: `ListingDetailLayout`, `getAgentById`, `Agent` type — all done (status: review/done)
- Epic 2: `agents` table schema with `whatsapp`, `email`, `phone`, `photoOptimizedUrl`, `languages`, `listingCount` fields — all populated by sync pipeline

---

## Dev Notes

### ATDD Artifacts

- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-4-2-agent-card-and-contact-ctas.md`
- Unit tests: `tests/unit/listing/agent-card.spec.tsx`
- Unit tests: `tests/unit/listing/sticky-mobile-cta.spec.tsx`
- Unit tests: `tests/unit/listing/whatsapp-utils.spec.ts`
- E2E tests: `tests/e2e/agent-card-and-contact-ctas.spec.ts`

---

## Dev Agent Record

### Change Log

- 2026-05-02: Story 4.2 created — agent card and contact CTAs (Date: 2026-05-02)
- 2026-05-02: ATDD red-phase test scaffolds generated (22 unit + 12 E2E, all test.skip())
