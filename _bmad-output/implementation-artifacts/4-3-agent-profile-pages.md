# Story 4.3: Agent Profile Pages

**Status:** in-progress
**GH Issue:** #95
**Epic:** 4 — Listing Detail & Agent Profiles
**Story Key:** 4-3-agent-profile-pages
**Created:** 2026-05-02

---

## Story

As a **visitor**,
I want to view an agent's profile with their listings, languages, and contact info,
so that I can find an agent who speaks my language and see their expertise.

---

## Acceptance Criteria

1. **Given** an agent profile page (e.g., `/en/agents/emma-smith`) **When** loaded **Then** it displays: photo, name, bio (bilingual), languages spoken, office (Altitud or Altitud Cero), listing count, WhatsApp + Email CTAs (FR37)

2. **Given** the agent profile **When** scrolling below the bio **Then** all listings for that agent are displayed in a property grid (FR39)

3. **Given** the agent listing filter **When** visitors view the page **Then** agents can be filtered by office (Altitud / Altitud Cero) and language spoken on an agents index page (FR38)

4. **Given** the agents index page (`/en/agents`) **When** loaded **Then** it shows all active agents with photo, name, languages, office, and listing count

5. **Given** agent profile URLs **When** shared **Then** they load as shareable, standalone pages with full context

6. **And** agent pages are SSG/ISR (NFR25)

7. **And** agent data is sourced from the synced database (Epic 2)

---

## Tasks / Subtasks

### Task 1: Add DB query functions to `src/lib/db/queries/agents.ts` (AC: #1, #2, #4, #6, #7)

- [ ] **File:** `src/lib/db/queries/agents.ts` — ADD functions (file already has `upsertAgent`, `getAgentById`, `updateAgentListingCounts`; do NOT modify existing functions)
- [ ] **Add `getAllAgents` function** (for agents index SSG + runtime):
  ```typescript
  /**
   * Fetches all active agents ordered by listing count descending.
   * Used by the agents index page (AC #4) and generateStaticParams.
   */
  export async function getAllAgents() {
    return db
      .select()
      .from(agents)
      .where(eq(agents.isActive, true))
      .orderBy(desc(agents.listingCount));
  }
  ```
  Import `desc` from `drizzle-orm` (it is already imported via `eq, sql`; add `desc` to the import).
- [ ] **Add `getAgentBySlug` function** (for agent profile page lookup):
  ```typescript
  /**
   * Fetches a single agent by their URL slug.
   * Used by the agent profile page. Returns null if not found or inactive.
   * Does NOT filter by isActive so soft-deletes show a proper "no longer available" page.
   */
  export async function getAgentBySlug(slug: string) {
    const rows = await db.select().from(agents).where(eq(agents.slug, slug)).limit(1);
    return rows[0] ?? null;
  }
  ```
- [ ] **Add `getAllAgentSlugs` function** (for `generateStaticParams` at build time):
  ```typescript
  /**
   * Fetches all active agent slugs for SSG build-time generation.
   * Used by generateStaticParams in the agent profile page (AC #6, NFR25).
   */
  export async function getAllAgentSlugs(): Promise<string[]> {
    const rows = await db
      .select({ slug: agents.slug })
      .from(agents)
      .where(eq(agents.isActive, true));
    return rows.map((r) => r.slug);
  }
  ```
- [ ] **Add `getPropertiesByAgentId` function** (for agent profile listing grid, AC #2):
  ```typescript
  /**
   * Fetches all visible properties for a given agent, ordered by syncedAt DESC.
   * Returns fields matching the PropertySearchItem interface shape
   * (src/types/search.ts) so results can be passed to PropertyCard.
   * Used by the agent profile page (AC #2, FR39).
   *
   * @param agentId - The agent's UUID (not apiId or slug)
   */
  export async function getPropertiesByAgentId(agentId: string) {
    const { properties } = await import("@/lib/db/schema/properties");
    return db
      .select({
        id: properties.id,
        slug: properties.slug,
        titleEn: properties.titleEn,
        titleEs: properties.titleEs,
        priceUsd: properties.priceUsd,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        lotSizeM2: properties.lotSizeM2,
        constructionM2: properties.constructionM2,
        zmtStatus: properties.zmtStatus,
        propertyType: properties.propertyType,
        areaSlug: properties.areaSlug,
        images: properties.images,
        latitude: properties.latitude,
        longitude: properties.longitude,
      })
      .from(properties)
      .where(and(eq(properties.agentId, agentId), eq(properties.isVisible, true)))
      .orderBy(desc(properties.syncedAt));
  }
  ```
  **CRITICAL type note:** The `PropertySearchItem` interface (in `src/types/search.ts`) has these exact field names: `id`, `slug`, `titleEn`, `titleEs`, `priceUsd`, `bedrooms`, `bathrooms`, `lotSizeM2`, `constructionM2`, `zmtStatus`, `propertyType`, `areaSlug`, `images`, `latitude`, `longitude`. Do NOT use aliases like `bedroomsTotal`, `builtAreaSqm` — those do NOT exist in the schema or interface.

  **CRITICAL `images` field:** The DB `images` column is `jsonb` typed, but `PropertySearchItem.images` expects `{ url: string; alt?: string }[]`. The DB stores `OptimizedImage[]` objects. Cast: `images: properties.images as unknown as { url: string; alt?: string }[]`.

  Import `and` from `drizzle-orm` in this file (add to existing import).

  **CRITICAL circular import check:** `agents.ts` currently imports only from `drizzle-orm`, `@/lib/db/client`, `@/lib/db/schema/agents`, and `@/lib/sync/utils/slugify`. If you add `import { properties } from "@/lib/db/schema/properties"` at the top, verify `properties.ts` schema does not import from `agents.ts` schema — it should not, but check. If circular: use the dynamic import pattern (`const { properties } = await import("@/lib/db/schema/properties")`), which is already the established pattern in `fetchAgentIdMap` and `fetchOfficeIdMap` in `properties.ts`. The `properties.ts` schema DOES import `agents` at line 14 (`import { agents } from "./agents"`), so there IS a circular dependency risk. **Use the dynamic import pattern** to avoid it.

### Task 2: Create `src/components/agent/agent-profile-hero.tsx` — Agent bio + contact header (AC: #1, #5)

- [ ] Create the file at EXACTLY `src/components/agent/agent-profile-hero.tsx`
- [ ] **This is a Server Component** — NO `'use client'`. Agent profile hero renders static data (photo, name, bio, languages, office, listing count) from the DB. Contact CTAs are passed as children or separate Client Component.
  - Architecture §8 explicitly lists: "AgentCard (static data) → Server Component"
  - The existing `AgentCard` in Story 4.2 was implemented as a Client Component because it builds WhatsApp URLs with message context (propertyTitle, propertyRef) at runtime. The agent profile hero has a different CTA pattern — no property context in the message.
- [ ] **Props interface:**
  ```typescript
  import type { Agent } from "@/lib/db/schema/agents";

  interface AgentProfileHeroProps {
    agent: Agent;
    officeName: string;
    locale: string;
  }
  ```
- [ ] **Layout (per UX spec FR37 — agent profile content):**
  ```
  <section aria-labelledby="agent-name-heading" data-testid="agent-profile-hero">
    <img agent photo (next/image, 160px, rounded-full) />
    <div>
      <h1 id="agent-name-heading">{agent.name}</h1>
      <p>{office name}</p>
      <p>{languages list}</p>
      <p>{agent.listingCount} listings</p>
    </div>
    <p>{bio in locale (bioEn or bioEs)}</p>
    <div>{WhatsApp + Email CTAs via AgentProfileCTAs (Task 3)}</div>
  </section>
  ```
- [ ] **Photo:** `next/image` with `src={photoSrc}` fallback chain: `photoOptimizedUrl → photoUrl → '/images/agent-placeholder.svg'` (same fallback SVG created in Story 4.2 Task 8 at `public/images/agent-placeholder.svg`). Width: 160, Height: 160, `className="rounded-full object-cover"`. Add `data-testid="agent-profile-photo"`.
- [ ] **Bio:** Display `locale === "es" ? agent.bioEs : agent.bioEn`. If bio is empty string (`""`), do NOT render the bio paragraph (the schema defaults both bio fields to `""`). Use `{bio && <p>{bio}</p>}`.
- [ ] **Languages:** Same `KNOWN_LANGUAGES` pattern from `AgentCard` — map language codes to human-readable labels via i18n. Use `getTranslations('AgentProfile')` (Task 5 adds this namespace). `data-testid="agent-profile-languages"`.
- [ ] **Listing count:** `{agent.listingCount} {t('listings')}`. `data-testid="agent-profile-listing-count"`.
- [ ] **CTAs (WhatsApp + Email):** Import `AgentProfileCTAs` (Client Component, Task 3). Pass `agent.whatsapp`, `agent.email`, `agent.name`, `locale`.
- [ ] **i18n:** `getTranslations('AgentProfile')` (server-side pattern from Story 4.1/4.2 — use `import { getTranslations } from "next-intl/server"`).
- [ ] **ARIA:** Root `<section>` with `aria-labelledby="agent-name-heading"`. `<h1>` for agent name (this is the page's primary heading).

### Task 3: Create `src/components/agent/agent-profile-ctas.tsx` — Contact CTAs for agent profile (AC: #1)

- [ ] Create the file at EXACTLY `src/components/agent/agent-profile-ctas.tsx`
- [ ] Add `'use client'` — builds WhatsApp URLs at runtime (locale-aware message, no property context).
- [ ] **Props interface:**
  ```typescript
  interface AgentProfileCTAsProps {
    agentWhatsapp: string | null;
    agentEmail: string | null;
    agentName: string;
    locale: string;
    agentId: string; // for lead tracking
  }
  ```
- [ ] **WhatsApp message for agent profile (different from listing-detail context):** No property reference available. Use a general inquiry message:
  ```typescript
  const agentProfileMessage = locale === "es"
    ? `Hola ${agentName}, me gustaría obtener más información sobre sus propiedades.`
    : `Hi ${agentName}, I'd like to learn more about your properties.`;
  ```
  Do NOT use `buildWhatsAppMessage` from `@/lib/utils/whatsapp` — that function requires `propertyTitle` and `propertyRef` which don't exist on the agent profile. Build the message inline or add a new overload (simpler: build inline).
- [ ] **WhatsApp button:** Same pattern as `AgentCard` — `buildWhatsAppUrl` from `@/lib/utils/whatsapp` for URL building. `data-testid="agent-profile-whatsapp-cta"`.
- [ ] **Email button:** `mailto:{agentEmail}` link. `data-testid="agent-profile-email-cta"`.
- [ ] **Lead tracking:** `trackWhatsAppClick` from `@/components/lead/whatsapp-cta` with `source: "agent_profile"`.
- [ ] **`cn` utility:** `import { cn } from "@/lib/utils"`.
- [ ] **i18n:** `useTranslations('AgentProfile')`.
- [ ] **Color tokens:** `bg-brand-whatsapp` for WhatsApp button (same as `AgentCard`), `bg-brand-navy` for Email button.

### Task 4: Create `src/components/agent/agent-listings-grid.tsx` — Agent's property grid (AC: #2)

- [ ] Create the file at EXACTLY `src/components/agent/agent-listings-grid.tsx`
- [ ] **This is a Server Component** — no `'use client'`. It renders a static grid of property cards.
- [ ] **Props interface:**
  ```typescript
  import type { PropertySearchItem } from "@/types/search";

  interface AgentListingsGridProps {
    properties: PropertySearchItem[]; // cast in page.tsx before passing: agentProperties as unknown as PropertySearchItem[]
    locale: string;
    agentName: string;
  }
  ```
- [ ] **CRITICAL — Use `PropertyCard` from Story 3.5 (DO NOT reinvent):** `import { PropertyCard } from "@/components/property/property-card"`. This is a Server Component and accepts `PropertySearchItem` type + `locale` + optional `unitSystem`.
- [ ] **Type mapping:** `getPropertiesByAgentId` (Task 1) selects exactly the fields that match `PropertySearchItem`. Cast the result: `agentProperties as unknown as PropertySearchItem[]`. The `images` JSONB field is already in the correct shape (`{ url: string; alt?: string }[]`) once cast. No mapper function is required.
- [ ] **Empty state:** If `properties.length === 0`, render a localized empty message: `{t('noListings', { name: agentName })}`. `data-testid="agent-no-listings"`.
- [ ] **Grid layout:** `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` (same as `PropertyGrid` in Story 3.5 which uses `grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6`). Add `data-testid="agent-listings-grid"`.
- [ ] **Heading:** `<h2>{t('listingsHeading', { name: agentName })}</h2>` above the grid. `data-testid="agent-listings-heading"`.
- [ ] **i18n:** `getTranslations('AgentProfile')` (server-side).

### Task 5: Create `src/app/[locale]/agents/[slug]/page.tsx` — Agent profile page (AC: #1, #2, #5, #6)

- [ ] Create directory `src/app/[locale]/agents/[slug]/` — verify it does NOT already exist (`ls src/app/[locale]/agents/` before creating).
- [ ] Create the file at EXACTLY `src/app/[locale]/agents/[slug]/page.tsx`
- [ ] **ISR pattern (same as `src/app/[locale]/property/[slug]/page.tsx` established in Story 4.1):**
  ```typescript
  export const revalidate = 86400; // 24 hours; on-demand revalidation via revalidateTag('agents')
  ```
- [ ] **`generateStaticParams`:**
  ```typescript
  export async function generateStaticParams() {
    try {
      const slugs = await getAllAgentSlugs(); // from Task 1
      return slugs.map((slug) => ({ slug }));
    } catch {
      return []; // Build continues; pages generated on-demand via ISR
    }
  }
  ```
- [ ] **`generateMetadata`:**
  ```typescript
  export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const { slug, locale } = await params;
    const agent = await getAgentBySlug(slug);
    if (!agent) return {};
    const t = await getTranslations({ locale, namespace: "AgentProfile" });
    const bio = locale === "es" ? agent.bioEs : agent.bioEn;
    return {
      title: `${agent.name} | RE/MAX Altitud`,
      description: bio.slice(0, 160) || t("defaultMetaDescription", { name: agent.name }),
      openGraph: {
        title: `${agent.name} | RE/MAX Altitud`,
        description: bio.slice(0, 160) || t("defaultMetaDescription", { name: agent.name }),
        images: agent.photoOptimizedUrl ? [{ url: agent.photoOptimizedUrl }] : [],
      },
    };
  }
  ```
- [ ] **Page component:**
  - `setRequestLocale(locale)` (required for next-intl static rendering support — same as property detail page)
  - `const agent = await getAgentBySlug(slug)` — if null: `notFound()`
  - If `!agent.isActive`: render an "agent no longer active" page (NOT a 404) similar to the "no longer available" pattern in property detail page — show agent name, a message, and a link back to `/agents`.
  - Fetch office: `const office = await getOfficeById(agent.officeId)` — use existing `getOfficeById` from `src/lib/db/queries/offices.ts`
  - Fetch properties: `const agentProperties = await getPropertiesByAgentId(agent.id)` — from Task 1
  - Render: `<AgentProfileHero>` + `<AgentListingsGrid>`
  - **Page layout wrapper:** Use `SimplePageLayout` OR no wrapper (check how other pages are structured). The listing detail uses `ListingDetailLayout` directly. For agent profile, use `SimplePageLayout` from `src/components/layout/simple-page-layout.tsx` for the page wrapper (keeps consistent padding/max-width), OR build a minimal wrapper. Recommend `SimplePageLayout` with `pageTitle={agent.name}`.
- [ ] **Imports:**
  ```typescript
  import type { Metadata } from "next";
  import { notFound } from "next/navigation";
  import { getTranslations, setRequestLocale } from "next-intl/server";
  import { getAgentBySlug, getAllAgentSlugs, getPropertiesByAgentId } from "@/lib/db/queries/agents";
  import { getOfficeById } from "@/lib/db/queries/offices";
  import { AgentProfileHero } from "@/components/agent/agent-profile-hero";
  import { AgentListingsGrid } from "@/components/agent/agent-listings-grid";
  import { SimplePageLayout } from "@/components/layout/simple-page-layout";
  ```

### Task 6: Create `src/app/[locale]/agents/page.tsx` — Agents index page (AC: #3, #4)

- [ ] Create the file at EXACTLY `src/app/[locale]/agents/page.tsx`
- [ ] **This is an ISR page** (agent list changes with daily sync):
  ```typescript
  export const revalidate = 86400;
  ```
- [ ] **SSG with `generateStaticParams`:** For the index page, no dynamic params needed — it uses the locale from the `[locale]` parent segment. Do NOT add `generateStaticParams` here.
- [ ] **Page component:**
  - `setRequestLocale(locale)` at top
  - Fetch: `const allAgents = await getAllAgents()` (from Task 1)
  - Render `AgentIndexFilters` (Client Component for filter state, Task 7) + agent card list
  - Pass `allAgents` to `AgentIndexFilters` as initial data
- [ ] **`generateMetadata`:**
  ```typescript
  export async function generateMetadata({ params }: ...) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "AgentProfile" });
    return {
      title: `${t("indexPageTitle")} | RE/MAX Altitud`,
      description: t("indexPageDescription"),
    };
  }
  ```
- [ ] **CRITICAL: Filter behavior (AC #3):** The filter (by office and language) runs CLIENT-SIDE on the pre-fetched agent list. Do NOT add a search API route for this. The list is small (max ~20 agents) — filter in memory. Pass the full agent list to a Client Component that manages filter state and renders filtered results.

### Task 7: Create `src/components/agent/agent-index-filters.tsx` — Agents index filter UI (AC: #3, #4)

- [ ] Create the file at EXACTLY `src/components/agent/agent-index-filters.tsx`
- [ ] Add `'use client'` — manages filter state in the browser.
- [ ] **Props interface:**
  ```typescript
  import type { Agent } from "@/lib/db/schema/agents";

  interface AgentIndexFiltersProps {
    agents: Agent[];
    locale: string;
    officeMap: Record<string, string>; // officeId → officeName, pre-resolved server-side
  }
  ```
  The `officeMap` is resolved server-side in the index page (using `getOfficeById` for each unique officeId, or a new `getAllOffices` query — see Task 6b) and passed as a prop. This avoids DB queries in the Client Component.
- [ ] **Filter state:**
  ```typescript
  const [selectedOffice, setSelectedOffice] = useState<string>("all"); // "all" | officeId
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all"); // "all" | "en" | "es" | etc.
  ```
- [ ] **Filtering logic:**
  ```typescript
  const filteredAgents = agents.filter((agent) => {
    const officeMatch = selectedOffice === "all" || agent.officeId === selectedOffice;
    const langMatch = selectedLanguage === "all" || agent.languages.includes(selectedLanguage);
    return officeMatch && langMatch;
  });
  ```
- [ ] **Filter UI:** Two `<select>` dropdowns (or a group of filter chips — chips are preferred per the design system, but `<select>` is acceptable for MVP). Add `data-testid="agent-office-filter"` and `data-testid="agent-language-filter"`.
- [ ] **Agent card list:** Render a `AgentIndexCard` (Task 8) for each `filteredAgents` item. Wrap in `<ul>` with `data-testid="agent-index-list"`.
- [ ] **Empty state:** If `filteredAgents.length === 0`, show `{t('noAgentsMatch')}` with a "Clear filters" button. `data-testid="agent-no-match"`.
- [ ] **i18n:** `useTranslations('AgentProfile')`.

### Task 6b: Add `getAllOffices` query to `src/lib/db/queries/offices.ts` (dependency for Task 6/7)

- [ ] **File:** `src/lib/db/queries/offices.ts` — ADD function (existing file has only `getOfficeById`)
- [ ] **Add `getAllOffices` function:**
  ```typescript
  /**
   * Fetches all offices. Used to build the officeId → officeName map for the agents index page.
   * There are only 2 offices — no pagination needed.
   */
  export async function getAllOffices() {
    return db.select().from(offices);
  }
  ```
- [ ] **Use in agents index page (Task 6):** After fetching `allAgents`, build the officeMap:
  ```typescript
  const allOffices = await getAllOffices();
  const officeMap = Object.fromEntries(allOffices.map((o) => [o.id, o.name]));
  ```
  Pass `officeMap` to `AgentIndexFilters`.

### Task 8: Create `src/components/agent/agent-index-card.tsx` — Agent card for index listing (AC: #4)

- [ ] Create the file at EXACTLY `src/components/agent/agent-index-card.tsx`
- [ ] **This is a pure display component** — no `'use client'` needed unless it has interactive elements. Start as a Server Component. If called from `AgentIndexFilters` (a Client Component), it will automatically be a Client Component due to the tree.
  - **CORRECTION:** Since `AgentIndexCard` is rendered inside `AgentIndexFilters` which is a Client Component, `AgentIndexCard` runs on the client too. Add `'use client'` explicitly to avoid confusion.
- [ ] **Props interface:**
  ```typescript
  import type { Agent } from "@/lib/db/schema/agents";

  interface AgentIndexCardProps {
    agent: Agent;
    officeName: string;
    locale: string;
  }
  ```
- [ ] **Layout (AC #4 — show photo, name, languages, office, listing count):**
  ```tsx
  <li key is set by parent>
    <Link href={`/agents/${agent.slug}`} locale={locale}>  // use Link from @/i18n/navigation
      <article data-testid="agent-index-card" aria-label={agent.name}>
        <img photo (next/image, 80px, rounded-full) />
        <div>
          <h2>{agent.name}</h2>
          <p>{officeName}</p>
          <p data-testid="agent-index-languages">{languages}</p>
          <p data-testid="agent-index-listing-count">{agent.listingCount} {t('listings')}</p>
        </div>
      </article>
    </Link>
  </li>
  ```
- [ ] **Link:** Use `import { Link } from "@/i18n/navigation"` (locale-aware navigation helper from Story 1.4 — this is the standard internal link pattern, NOT `next/link`).
- [ ] **Photo fallback:** Same pattern as `AgentCard` — `photoOptimizedUrl → photoUrl → '/images/agent-placeholder.svg'`. `data-testid="agent-index-photo"`.
- [ ] **Languages:** Same `KNOWN_LANGUAGES` pattern. `useTranslations('AgentProfile')`.
- [ ] **Hover effect:** `hover:bg-gray-50 transition-colors rounded-lg border border-gray-200 p-4` (consistent with listing unavailable page link pattern from `property/[slug]/page.tsx`).

### Task 9: Add i18n keys for new components (AC: all)

- [ ] **File:** `src/messages/en.json` — add new `AgentProfile` namespace (DO NOT re-add existing namespaces):
  ```json
  "AgentProfile": {
    "listings": "listings",
    "whatsapp": "WhatsApp",
    "email": "Email",
    "generalInquiryEn": "Hi {name}, I'd like to learn more about your properties.",
    "noListings": "{name} has no active listings at this time.",
    "listingsHeading": "{name}'s Listings",
    "noAgentsMatch": "No agents match your filters.",
    "clearFilters": "Clear filters",
    "indexPageTitle": "Meet Our Agents",
    "indexPageDescription": "Browse RE/MAX Altitud agents — find an agent who speaks your language and knows your area.",
    "filterByOffice": "Filter by office",
    "filterByLanguage": "Filter by language",
    "allOffices": "All offices",
    "allLanguages": "All languages",
    "defaultMetaDescription": "View {name}'s listings and contact information at RE/MAX Altitud.",
    "agentNoLongerActive": "This agent is no longer active.",
    "backToAgents": "Browse all agents",
    "language": {
      "en": "English",
      "es": "Spanish",
      "de": "German",
      "fr": "French",
      "it": "Italian",
      "pt": "Portuguese"
    }
  }
  ```
  **NOTE:** The `"language"` sub-keys are identical to those already in `"AgentCard"`. DO NOT remove from `AgentCard`. The `AgentProfile` namespace is separate and needs its own copy for namespace isolation.
- [ ] **File:** `src/messages/es.json` — add equivalent Spanish:
  ```json
  "AgentProfile": {
    "listings": "propiedades",
    "whatsapp": "WhatsApp",
    "email": "Correo",
    "generalInquiryEn": "Hola {name}, me gustaría obtener más información sobre sus propiedades.",
    "noListings": "{name} no tiene propiedades activas en este momento.",
    "listingsHeading": "Propiedades de {name}",
    "noAgentsMatch": "Ningún agente coincide con tus filtros.",
    "clearFilters": "Limpiar filtros",
    "indexPageTitle": "Conoce a Nuestros Agentes",
    "indexPageDescription": "Explora los agentes de RE/MAX Altitud — encuentra uno que hable tu idioma y conozca tu área.",
    "filterByOffice": "Filtrar por oficina",
    "filterByLanguage": "Filtrar por idioma",
    "allOffices": "Todas las oficinas",
    "allLanguages": "Todos los idiomas",
    "defaultMetaDescription": "Ver las propiedades e información de contacto de {name} en RE/MAX Altitud.",
    "agentNoLongerActive": "Este agente ya no está activo.",
    "backToAgents": "Ver todos los agentes",
    "language": {
      "en": "Inglés",
      "es": "Español",
      "de": "Alemán",
      "fr": "Francés",
      "it": "Italiano",
      "pt": "Portugués"
    }
  }
  ```
- [ ] **DO NOT modify** existing namespaces: `AgentCard`, `StickyMobileCTA`, `ListingDetail`, `PropertyCard`, `Navigation`, etc.

### Task 10: Unit tests for `agent-profile-hero.tsx` (AC: #1)

- [ ] Create `tests/unit/listing/agent-profile-hero.spec.tsx`
- [ ] **Environment:** jsdom — covered by `tests/unit/listing/**/*.spec.tsx` glob in `vitest.config.mts` (already configured in Story 4.1 Task 9 — no changes needed to vitest config).
- [ ] **CRITICAL — vi.mock hoisting pattern** (hard rule from Epic 3 + 4): ALL `vi.mock()` calls MUST appear BEFORE any `import` statements. Add `// imported AFTER mocks` comment.
- [ ] **Required mocks (hoisted before imports):**
  ```typescript
  vi.mock("next/image", () => ({
    default: ({ src, alt, "data-testid": testId, ...props }: { src: string; alt: string; "data-testid"?: string; [key: string]: unknown }) =>
      <img src={src} alt={alt} data-testid={testId} {...props} />,
  }));

  vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(() => Promise.resolve(
      (key: string, values?: Record<string, unknown>) =>
        values ? `${key}(${JSON.stringify(values)})` : key
    )),
  }));

  vi.mock("@/components/agent/agent-profile-ctas", () => ({
    AgentProfileCTAs: vi.fn(({ agentName }: { agentName: string }) =>
      <div data-testid="agent-profile-ctas-mock">{agentName}</div>
    ),
  }));
  ```
  // imported AFTER mocks
  ```typescript
  import { render, screen } from "@testing-library/react";
  import { AgentProfileHero } from "@/components/agent/agent-profile-hero";
  ```
- [ ] **Test fixture** (same shape as Story 4.2 `mockAgent`):
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
    bioEn: "Mountain specialist with 10 years experience.",
    bioEs: "Especialista en montaña con 10 años de experiencia.",
    listingCount: 12,
    isActive: true,
    syncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  ```
- [ ] **Tests to write:**
  - `[P0]` renders `data-testid="agent-profile-hero"` element
  - `[P0]` renders agent name as `h1`
  - `[P0]` renders `data-testid="agent-profile-photo"` with photoOptimizedUrl
  - `[P0]` renders `data-testid="agent-profile-languages"` with language list
  - `[P0]` renders `data-testid="agent-profile-listing-count"` with count
  - `[P1]` renders English bio when locale is "en"
  - `[P1]` renders Spanish bio when locale is "es"
  - `[P1]` does NOT render bio paragraph when bioEn is empty string
  - `[P2]` uses placeholder image when both photoOptimizedUrl and photoUrl are null

### Task 11: Unit tests for `agent-index-filters.tsx` (AC: #3, #4)

- [ ] Create `tests/unit/listing/agent-index-filters.spec.tsx`
- [ ] **Required mocks (hoisted):**
  ```typescript
  vi.mock("next-intl", () => ({
    useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key
    ),
  }));

  vi.mock("next/image", () => ({
    default: ({ src, alt, "data-testid": testId, ...props }: { src: string; alt: string; "data-testid"?: string; [key: string]: unknown }) =>
      <img src={src} alt={alt} data-testid={testId} {...props} />,
  }));

  vi.mock("@/i18n/navigation", () => ({
    Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
      <a href={href}>{children}</a>,
  }));
  ```
- [ ] **Test fixture:**
  ```typescript
  const mockAgents = [
    {
      id: "a1", apiId: "api-1", officeId: "office-pz", slug: "emma-smith",
      name: "Emma Smith", email: null, phone: null, whatsapp: "50688000000",
      photoUrl: null, photoOptimizedUrl: null,
      languages: ["en", "es"], specializations: [], bioEn: "", bioEs: "",
      listingCount: 5, isActive: true,
      syncedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: "a2", apiId: "api-2", officeId: "office-dom", slug: "gustavo-valverde",
      name: "Gustavo Valverde", email: null, phone: null, whatsapp: null,
      photoUrl: null, photoOptimizedUrl: null,
      languages: ["es"], specializations: [], bioEn: "", bioEs: "",
      listingCount: 3, isActive: true,
      syncedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    },
  ];
  const mockOfficeMap = { "office-pz": "RE/MAX Altitud", "office-dom": "RE/MAX Altitud Cero" };
  ```
- [ ] **Tests to write:**
  - `[P0]` renders `data-testid="agent-index-list"` element
  - `[P0]` renders all agents by default (no filter applied)
  - `[P0]` renders `data-testid="agent-office-filter"` and `data-testid="agent-language-filter"`
  - `[P1]` filters to one agent when office filter is selected
  - `[P1]` filters to English-speaking agents when language filter "en" selected
  - `[P1]` shows `data-testid="agent-no-match"` when no agents match combined filters
  - `[P1]` clearing filters restores full list
  - `[P2]` renders `data-testid="agent-index-card"` for each filtered agent

### Task 12: Unit tests for new DB query functions (AC: #6, #7)

- [ ] Create `tests/unit/db/agents-profile-queries.spec.ts` (`.ts`, not `.tsx` — pure function tests, node environment)
- [ ] **Mock Drizzle db** (pattern from existing DB query tests in `tests/unit/db/`):
  - Mock `@/lib/db/client` to return a mock `db` object
  - Use `vi.fn()` for `db.select`, `db.insert`, etc.
- [ ] **Tests to write:**
  - `[P0]` `getAgentBySlug` calls `db.select` with correct `where(eq(agents.slug, slug))`
  - `[P0]` `getAgentBySlug` returns null when no row found
  - `[P0]` `getAllAgentSlugs` returns only active agent slugs
  - `[P1]` `getAllAgents` returns agents ordered by listingCount desc
  - `[P1]` `getPropertiesByAgentId` filters by `agentId` and `isVisible = true`

### Task 13: CI verification (AC: all)

- [ ] `npm run typecheck` → 0 new errors
- [ ] `npm run lint` → 0 errors (note: `no-img-element` lint rule — all agent photos must use `next/image`, never `<img>`)
- [ ] `npm run format:check` → pass
- [ ] `npm run build` → pass (agent profile and agents index pages included in SSG build)
- [ ] `npm test` → all existing tests pass (641 baseline from Story 4.2) + new tests pass

---

## Dev Notes

### Architecture Context

**File structure (architecture §3 + Story 4.3 additions):**
```
src/
  app/[locale]/
    agents/
      page.tsx                              ← NEW (agents index, ISR)
      [slug]/
        page.tsx                            ← NEW (agent profile, SSG+ISR)
  components/
    agent/
      agent-card.tsx                        ← EXISTS (Story 4.2 — do NOT modify)
      agent-profile-hero.tsx                ← NEW (Server Component)
      agent-profile-ctas.tsx                ← NEW (Client Component — 'use client')
      agent-listings-grid.tsx               ← NEW (Server Component)
      agent-index-card.tsx                  ← NEW (Client Component — inside AgentIndexFilters)
      agent-index-filters.tsx               ← NEW (Client Component — 'use client')
  lib/
    db/queries/
      agents.ts                             ← MODIFY (add getAllAgents, getAgentBySlug, getAllAgentSlugs, getPropertiesByAgentId)
      offices.ts                            ← MODIFY (add getAllOffices)
  messages/
    en.json                                 ← MODIFY (add AgentProfile namespace)
    es.json                                 ← MODIFY (add AgentProfile namespace)
tests/
  unit/listing/
    agent-profile-hero.spec.tsx             ← NEW
    agent-index-filters.spec.tsx            ← NEW
  unit/db/
    agents-profile-queries.spec.ts          ← NEW
```

**Server/Client boundary (architecture §8):**
- `AgentProfileHero` = Server Component (static data from DB, `getTranslations` from `next-intl/server`)
- `AgentProfileCTAs` = Client Component (`'use client'`) — builds WhatsApp URLs at runtime
- `AgentListingsGrid` = Server Component (renders `PropertyCard` Server Components)
- `AgentIndexFilters` = Client Component (`'use client'`) — manages filter state
- `AgentIndexCard` = Client Component (child of `AgentIndexFilters` tree)
- Agent profile `page.tsx` = Server Component (data fetching at request time)
- Agents index `page.tsx` = Server Component (data fetching at request time)

**IMPORTANT: `AgentCard` from Story 4.2 is unchanged.** It lives at `src/components/agent/agent-card.tsx` and is used only on the listing detail page sidebar. Do NOT use it for the agent profile page or agents index — different layout/context.

### Critical Patterns from Previous Stories

**vi.mock hoisting (enforced since Story 3.1, verified in 4.1 and 4.2):** ALL `vi.mock()` calls MUST appear BEFORE any `import` statements. This is a hard rule — violations cause test failures. Add `// imported AFTER mocks` comment after the last mock before imports.

**i18n — NO hardcoded strings (repeated failure in Epic 3, still enforced):** Every user-visible string, aria-label, and alt text MUST use `useTranslations` (client) or `getTranslations` (server). Do NOT hardcode English. Code review adversarial pipeline catches it.

**Server-side i18n pattern (Story 4.1/4.2):** Use `import { getTranslations } from "next-intl/server"` for Server Components/pages. Use `import { useTranslations } from "next-intl"` for Client Components. The mock in tests for server components uses `vi.mock("next-intl/server", ...)` and for client components uses `vi.mock("next-intl", ...)`.

**`setRequestLocale(locale)`** must be called at the top of every page component for next-intl static rendering support. This pattern is established in `property/[slug]/page.tsx` (Story 4.1) and all other locale-routed pages. Not needed in components — only in `page.tsx` files.

**ISR pattern (Story 4.1):** Export `export const revalidate = 86400;` at page level. The sync pipeline calls `revalidateTag('agents')` (see architecture §5 pipeline step). This triggers on-demand revalidation for agent pages after each daily sync. Agent pages don't need `revalidateTag` calls in THIS story — that's already wired in the sync pipeline from Epic 2.

**`generateStaticParams` try/catch pattern (Story 4.1):** Always wrap in `try { ... } catch { return []; }` so builds succeed even if DB is unavailable. Pages are then generated on-demand via ISR.

**`Link` from `@/i18n/navigation` — NOT `next/link`:** All internal navigation links use `import { Link } from "@/i18n/navigation"` — this is the locale-aware link helper set up in Story 1.4. Using `next/link` directly breaks locale prefixing.

**`cn` utility:** `import { cn } from "@/lib/utils"` — maps to `src/lib/utils.ts` (clsx + tailwind-merge). Required for all conditional className expressions.

**`data-testid` contract (CANNOT rename once established):**
- `data-testid="agent-profile-hero"` — root `<section>` in `AgentProfileHero`
- `data-testid="agent-profile-photo"` — agent photo in profile hero
- `data-testid="agent-profile-languages"` — languages in profile hero
- `data-testid="agent-profile-listing-count"` — listing count in profile hero
- `data-testid="agent-profile-whatsapp-cta"` — WhatsApp CTA in profile CTAs
- `data-testid="agent-profile-email-cta"` — Email CTA in profile CTAs
- `data-testid="agent-listings-grid"` — listings grid container
- `data-testid="agent-listings-heading"` — listings section heading
- `data-testid="agent-no-listings"` — empty state for listings
- `data-testid="agent-index-list"` — agent index `<ul>` in `AgentIndexFilters`
- `data-testid="agent-office-filter"` — office filter select/chips
- `data-testid="agent-language-filter"` — language filter select/chips
- `data-testid="agent-index-card"` — each agent card in the index
- `data-testid="agent-index-photo"` — agent photo in index card
- `data-testid="agent-index-languages"` — languages in index card
- `data-testid="agent-index-listing-count"` — listing count in index card
- `data-testid="agent-no-match"` — empty state when filters match nothing

**WhatsApp for agent profile (no property context):** The `buildWhatsAppMessage` in `@/lib/utils/whatsapp` requires `propertyTitle` and `propertyRef`. On the agent profile page, these don't exist. Use `buildWhatsAppUrl` directly with an inline general inquiry message. Do NOT add a new overload to `buildWhatsAppMessage` — the existing interface is part of a Story 4.2 contract.

**`PropertyCard` component reuse (Story 3.5):** The agent's listings grid MUST use `PropertyCard` from `@/components/property/property-card`. Do NOT create a new card component. `PropertyCard` accepts `PropertySearchItem` type — ensure `getPropertiesByAgentId` returns compatible data. Check `@/types/search.ts` for the `PropertySearchItem` interface shape.

**`PropertySearchItem` type mapping:** The `getPropertiesByAgentId` query selects specific columns. They map to `PropertySearchItem` fields. The `PropertySearchItem` interface is in `src/types/search.ts` — READ that file before implementing the query to ensure all required fields are selected (don't miss `isActive`, `agentId`, etc. if the interface requires them).

### Story 4.2 Learnings Applied

- **`AgentCard` is Client Component for good reason (Story 4.2):** Story 4.2 made `AgentCard` a Client Component specifically because it builds WhatsApp URLs with property context. In Story 4.3, the profile hero is different — it's static content appropriate for a Server Component, with CTAs split into a separate Client Component (`AgentProfileCTAs`).
- **Lead tracking source tracking (Story 4.2):** `trackWhatsAppClick` now accepts `source: string`. In the agent profile, use `source: "agent_profile"` to distinguish from `"listing_detail"` (Story 4.2) and `"sticky_mobile_cta"` (Story 4.2).
- **`data-testid` from 4.2 must not be reused:** Story 4.2's `data-testid="agent-card"` is used by `StickyMobileCTA`'s IntersectionObserver. Do NOT use `"agent-card"` as a testid on the agent profile page — it would conflict with IntersectionObserver logic if both pages were ever rendered together (they aren't, but it's good hygiene).
- **Office name resolution (Story 4.2):** `getOfficeById` in `src/lib/db/queries/offices.ts` already exists (Story 4.2 Task 5b). Use it for agent profile page. For agents index (multiple agents, 2 distinct offices), `getAllOffices` (Task 6b) is more efficient than multiple `getOfficeById` calls.

### Story Context

**Epic 4 objective:** Convert property discovery (Epic 3) into leads. Story 4.1 built the listing detail page, Story 4.2 added agent contact on the listing page. Story 4.3 adds standalone agent profiles so agents can build a web presence and visitors can find agents by language/office.

**Story 4.4 scope (NOT in this story):** JSON-LD structured data for `RealEstateAgent` schema on agent profile pages. Story 4.3 builds the pages; Story 4.4 adds the structured data and SEO layer. Do NOT add JSON-LD in this story.

**Story 4.5 scope (NOT in this story):** Similar properties carousel. Leave the TODO in `listing-detail-layout.tsx` untouched.

**Dependencies confirmed done:**
- Epic 2: `agents` table schema with `whatsapp`, `email`, `phone`, `photoOptimizedUrl`, `languages`, `listingCount`, `bioEn`, `bioEs`, `isActive` — all populated by sync pipeline (status: done)
- Story 4.1: `SimplePageLayout`, `getOfficeById`, `AllPropertySlugs` pattern — done
- Story 4.2: `AgentCard`, `buildWhatsAppUrl`, `buildWhatsAppMessage`, `trackWhatsAppClick`, `extractUtmParams`, `agent-placeholder.svg` — done

### Performance Notes

- `AgentProfileHero` as a Server Component means the agent's photo, name, bio, and languages are part of the initial HTML — good for LCP and SEO.
- `AgentListingsGrid` renders PropertyCards (also Server Components) — full grid in initial HTML for crawlers (NFR25 / NFR28).
- Agent index page: ~20 agents max. Client-side filtering is appropriate (no need for a search API). The full list loads in the initial HTML.
- Photos: use `next/image` with `sizes="160px"` for profile hero, `sizes="80px"` for index cards. Do NOT forget `width` and `height` props on `next/image` (avoids layout shift, required by linter).

### Test Infrastructure Notes

- Test directory `tests/unit/listing/` already exists (Story 4.1). No vitest config changes needed.
- Test directory `tests/unit/db/` already exists. No vitest config changes needed.
- New spec files follow established naming: `agent-profile-hero.spec.tsx`, `agent-index-filters.spec.tsx`, `agents-profile-queries.spec.ts`.
- Current baseline: 641 tests pass (Story 4.2 completion).
- `AgentProfileHero` is an async Server Component. In tests, render it with `await` and wrap with React's `act` or use the synchronous testing pattern used in other server component tests — check how Story 4.1 tests handle `ListingDetailLayout` (also a Server Component).

---

## Story Context

**Architecture references:**
- [Source: architecture.md §3 Directory Architecture] — `src/app/[locale]/agents/` routes
- [Source: architecture.md §3 Component Hierarchy] — `agent/` component domain
- [Source: architecture.md §8 Client vs Server Component Split] — AgentCard (static data) = Server Component
- [Source: architecture.md §4 Database Schema] — `AGENTS` entity with `bio_en`, `bio_es`, `is_active`, `listing_count`
- [Source: architecture.md §6 URL Strategy] — `/en/agents/{slug}`, `/es/agentes/{slug}`
- [Source: architecture.md §2 Rendering Strategy] — agent profiles = SSG + ISR, on-demand after sync
- [Source: epics.md §Story 4.3] — FR37, FR38, FR39, NFR25
- [Source: prd.md §FR37-39] — Agent profile feature requirements
- [Source: 4-2-agent-card-and-contact-ctas.md §Dev Notes] — WhatsApp patterns, i18n patterns, test patterns

---

## ATDD Artifacts

- **Checklist:** `_bmad-output/test-artifacts/atdd-checklist-4-3-agent-profile-pages.md`
- **Unit test (hero):** `tests/unit/listing/agent-profile-hero.spec.tsx`
- **Unit test (filters):** `tests/unit/listing/agent-index-filters.spec.tsx`
- **DB unit tests:** `tests/unit/db/agents-profile-queries.spec.ts`
- **E2E tests:** `tests/e2e/agent-profile-pages.spec.ts`

---

## Dev Agent Record

### Agent Model Used

(to be filled in by dev agent)

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-05-02: Story 4.3 created — agent profile pages
- 2026-05-02: ATDD red-phase test scaffolds generated (31 tests, all test.skip())
