---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/product-brief/product-brief-2026-03-22.md'
  - 'docs/remax-cca-api-docs.md'
---

# RE/MAX Altitud - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the RE/MAX Altitud multilingual real estate platform, decomposing the requirements from the PRD, Architecture, UX Design Specification, Product Brief, and API documentation into implementable stories.

**Project Context:** Brownfield migration from WordPress (remax-altitud.cr) to Next.js 15 — unifying RE/MAX Altitud (Pérez Zeledón) and RE/MAX Altitud Cero (Dominical/Uvita) under one platform. The platform serves buyers, sellers, and investors in up to 6 languages.

**Project Vision:** Convert curiosity into trust and trust into qualified leads for agents — across buyers, sellers, and investors, in 6 languages.

## Requirements Inventory

### Functional Requirements

> **Source:** PRD — 68 functional requirements (FR1–FR68), sequentially numbered across all sections.

#### Property Discovery (Search & Browse) — FR1–FR16

| ID | Requirement |
|----|------------|
| FR1 | Visitors can search properties on an interactive map with pins, clustering, and 3D terrain |
| FR2 | Visitors can search in split-view layout (map + grid, Zillow-style) as default, with full map/full grid toggles |
| FR3 | Visitors can filter by type, price range, bedrooms, bathrooms, lot size, location — context-sensitive (lots hide beds/baths) |
| FR4 | Visitors can filter by lifestyle tags ("Investment Property," "Rental Potential," "Vacation Home") |
| FR5 | Visitors can browse by location hierarchy (Provincia → Cantón → Distrito) |
| FR6 | Visitors can sort by price, date listed, lot size |
| FR7 | Visitors can paginate or progressively load search results |
| FR8 | Listing detail page with photo gallery, YouTube video embeds, description, specs, area context |
| FR9 | View property area/size in locale-appropriate units (m², acres, hectares) |
| FR10 | View price in USD with approximate EUR conversion for non-US locales |
| FR11 | ZMT/ownership status on each listing (Titled / Concession / ZMT Restricted) |
| FR12 | No-results state with alternative suggestions + CTA to contact agent with forwarded search criteria |
| FR13 | Shareable listing URLs that load as standalone landing pages |
| FR14 | Hidden/removed listings show "No longer available" + similar properties |
| FR15 | Smart search presets combining pre-configured filter + lifestyle tag combinations |
| FR16 | "Near me" button using Geolocation API; graceful fallback if denied |

#### Community Pages — FR17–FR21

| ID | Requirement |
|----|------------|
| FR17 | Dedicated community landing pages with hero, description, quick facts, filtered properties |
| FR18 | Community index page showing all communities |
| FR19 | "Featured Communities" on homepage with 2-3 spotlight cards |
| FR20 | Community mini-map showing location within broader area |
| FR21 | Lot/property availability with status indicators (Available, Sold, Reserved) |

#### Shortlist & Agent Representation — FR22–FR28

| ID | Requirement |
|----|------------|
| FR22 | ♡ save/shortlist via icon on PropertyCard/Listing Detail; localStorage persistence; 20 property cap; accessible toggle |
| FR23 | Shortlist view from nav icon with count + simple comparison page (photos, prices, mini-map) |
| FR24 | "Share my shortlist" button generating unique shareable URL |
| FR25 | Second ♡ save tooltip: "Save more — your agent will show you all of them" |
| FR26 | "Ask about these" CTA with smart agent routing (single agent / majority / selection screen) |
| FR27 | Pre-populated WhatsApp with ALL shortlisted property references in single message |
| FR28 | Chosen agent receives full shortlist context for cross-agent coordination |

#### Multilingual Experience — FR29–FR33

| ID | Requirement |
|----|------------|
| FR29 | Auto-detect visitor browser language and load appropriate locale (EN/ES for MVP) |
| FR30 | Manual language switching between available languages |
| FR31 | All listing content displays in selected language |
| FR32 | All UI elements, navigation, forms, CTAs display in selected language |
| FR33 | Legal/property terms translate consistently via enforced glossary |

#### Lead Generation — Buyers — FR34–FR39

| ID | Requirement |
|----|------------|
| FR34 | WhatsApp CTA with pre-populated message referencing property (EN/ES) |
| FR35 | Contact form or email as alternative to WhatsApp |
| FR36 | Transparency note about agent languages and WhatsApp translation |
| FR37 | Agent profiles with photo, languages, listing count, office affiliation |
| FR38 | Filter agents by office and language spoken |
| FR39 | View all listings for a specific agent from their profile |

#### Lead Generation — Sellers — FR40–FR43

| ID | Requirement |
|----|------------|
| FR40 | "List with us" / "Vende tu propiedad" seller inquiry form |
| FR41 | "Request a Free CMA" form |
| FR42 | Seller forms: name (req), phone/WhatsApp (req), email (opt), type, location, size, comment (opt) |
| FR43 | Seller submissions stored and routed to assigned agent |

#### Lead Generation — Investors — FR44–FR45

| ID | Requirement |
|----|------------|
| FR44 | Investment discovery through lifestyle tags |
| FR45 | Area appreciation and rental yield context (admin-curated, with disclaimer) |

#### Data Pipeline & Content Management — FR46–FR55

| ID | Requirement |
|----|------------|
| FR46 | Daily sync from RE/MAX API (two office GUIDs: Altitud + Altitud Cero) |
| FR47 | Image optimization (WebP, responsive sizes) during sync |
| FR48 | Translation of new listing content to available languages during sync |
| FR49 | Auto-tagging with lifestyle tags based on configurable attribute rules + manual override |
| FR50 | Auto-tagging with community ID via PostGIS geo-fence matching + manual override |
| FR51 | Automated alert to admin on sync failure |
| FR52 | Site continues serving existing listings when API sync fails (resilience) |
| FR53 | Graceful handling of removed listings (hide from search, preserve URL for SEO) |
| FR54 | Lead source capture (UTM parameters + referrer) on every form/WhatsApp click |
| FR55 | Sync pipeline validates incoming data, rejects bad records, alerts admin |

#### Administration & Operations — FR56–FR63, FR67–FR68

| ID | Requirement |
|----|------------|
| FR56 | View sync status logs (success/failure, counts, errors) |
| FR57 | View/manage leads with full context (source, property, language, agent, UTMs, cross-agent shortlist) |
| FR58 | Reassign leads to different agents |
| FR59 | Add/edit/remove lifestyle tags on listings |
| FR60 | Add/edit/remove community assignments (auto + manual override) |
| FR61 | Create/manage communities (name, slug, facts, hero, geo-fence polygon) |
| FR62 | Hide/unhide listings from website |
| FR63 | Monitor SEO performance via integrated analytics |
| FR67 | Per-agent lead history: all leads (buyer/seller/investor) with date, name, email, phone, type, property ref, source. Filterable by agent and type. Business continuity for agent departures |
| FR68 | Bulk-reassign leads from one agent to another with logging (old agent, new agent, date). CSV export of agent's client contacts (name, email, phone) for manual outreach |

#### Static Content & Site Pages — FR64–FR66

| ID | Requirement |
|----|------------|
| FR64 | Homepage with featured listings and value proposition |
| FR65 | About/Offices, Services, Contact, Join Our Team pages |
| FR66 | Full SEO architecture (structured data, sitemaps, meta tags, hreflang, 301 redirects) |

---

### Non-Functional Requirements

> **Source:** PRD — 30 non-functional requirements (NFR1–NFR30)

#### Performance (NFR1–NFR6)

| ID | Requirement |
|----|------------|
| NFR1 | LCP < 2.5s on 4G mobile |
| NFR2 | CLS < 0.1 |
| NFR3 | FID < 100ms |
| NFR4 | Map renders with pins and clustering within 3s on 4G mobile |
| NFR5 | Search filter changes reflect within 500ms (client-side) |
| NFR6 | Image gallery: first 3 images < 1s; rest lazy-loaded |

#### Security & Privacy (NFR7–NFR12)

| ID | Requirement |
|----|------------|
| NFR7 | HTTPS with TLS encryption enforced |
| NFR8 | Admin DB access protected by authentication |
| NFR9 | Lead PII encrypted at rest |
| NFR10 | No visitor data stored unless form submitted |
| NFR11 | API keys as env vars, never client-side |
| NFR12 | Cookieless analytics for MVP |

#### Scalability (NFR13–NFR16)

| ID | Requirement |
|----|------------|
| NFR13 | 1,000 concurrent visitors via edge CDN |
| NFR14 | 1,000 listings without query degradation via spatial indexing |
| NFR15 | Sync pipeline completes within 2 hours; incremental processing |
| NFR16 | Add 4 languages without code changes (i18n config + pipeline only) |

#### Integration Reliability (NFR17–NFR20)

| ID | Requirement |
|----|------------|
| NFR17 | API sync retries 3x before alerting |
| NFR18 | Sync failures don't affect site availability |
| NFR19 | Translation rate limits handled with exponential backoff |
| NFR20 | Map tile CDN caching |

#### Accessibility (NFR21–NFR24)

| ID | Requirement |
|----|------------|
| NFR21 | WCAG 2.1 AA compliance |
| NFR22 | All interactive elements keyboard-navigable |
| NFR23 | Color contrast ≥ 4.5:1 |
| NFR24 | Screen reader compatibility for cards and forms |

#### SEO & Discoverability (NFR25–NFR28)

| ID | Requirement |
|----|------------|
| NFR25 | 100% listing/agent pages are SSG/ISR |
| NFR26 | WordPress 301 redirects < 50ms |
| NFR27 | XML sitemaps auto-regenerate after daily sync |
| NFR28 | Lighthouse CI gate: score ≥ 80 |

#### Backup & Recovery (NFR29–NFR30)

| ID | Requirement |
|----|------------|
| NFR29 | Automated daily backups with 7-day retention |
| NFR30 | PITR available for disaster recovery |

---

### Additional Requirements (Architecture)

> **Source:** Architecture document — 25 requirements (AR1–AR25) + 10 API-specific requirements (API1–API10)

| ID | Requirement | Source |
|----|------------|--------|
| AR1 | Database schema: Properties, Agents, Areas, Communities, Leads, SyncLogs — Drizzle ORM + PostGIS | §3 |
| AR2 | PostGIS spatial indexing (GiST) for geo-queries and geo-fence matching | §3 |
| AR3 | Soft delete for removed listings (is_visible=false, preserve URL) | §3 + ADR-6 |
| AR4 | RE/MAX CCA API integration: two endpoints (PropertiesPerOffice, AgentsPerOffice) | §4 |
| AR5 | 8-step sync pipeline: fetch → validate → diff → translate → optimize → upsert → cleanup → revalidate | §5 |
| AR6 | ISR on-demand revalidation after sync via /api/revalidate | §5 + §7 |
| AR7 | Next.js 15 App Router with [locale] prefix routing | §6 |
| AR8 | next-intl for locale routing + per-route string loading | §6 |
| AR9 | Server Components by default; Client Components only for interactivity | §8 |
| AR10 | State management: URL params (search), zustand (map), localStorage (shortlist/units) | §8 |
| AR11 | Performance budget: JS < 150KB gzipped, Mapbox lazy-loaded, CSS < 30KB | §8 |
| AR12 | Semantic URL routes: /{locale}/property/{slug}, /{locale}/areas/{slug} | §9 |
| AR13 | WordPress 301 redirect mapping | §9 |
| AR14 | Structured data (JSON-LD): RealEstateListing, RealEstateAgent, Place, BreadcrumbList | §9 |
| AR15 | Per-language XML sitemap generation | §9 |
| AR16 | Supabase Auth for admin; CRON_SECRET for sync; API_SECRET for revalidation | §10 |
| AR17 | Lead PII column-level encryption | §10 |
| AR18 | Zod schema validation on all API route inputs | §10 |
| AR19 | Sentry + Vercel Analytics + sync_logs monitoring | §11 |
| AR20 | CI pipeline: TypeScript → ESLint → Vitest → Lighthouse CI → Build | §12 |
| AR21 | Vercel Pro deployment with auto-deploy from main | §12 |
| AR22 | hreflang implementation for all locale variants | §7 |
| AR23 | Server Actions for search (PostGIS via Drizzle, zero client-side DB) | ADR-5 |
| AR24 | Drizzle ORM for type-safe DB with raw PostGIS SQL support | ADR-3 |
| AR25 | Mapbox GL JS lazy-loaded on map pages only | §8 |

#### API-Specific Requirements (from docs/remax-cca-api-docs.md)

| ID | Requirement |
|----|------------|
| API1 | Handle inconsistent field casing (publicRemarks_es lowercase p) |
| API2 | Parse lat/lon from string to float; handle trailing decimals |
| API3 | Split pipe-delimited Images field into array; URL-encode spaces |
| API4 | Handle empty ListingTitle_es; use English title as fallback |
| API5 | Use ConstructionSize, not ConstructionSizeLiving (always 0.00) |
| API6 | Validate LotSizeArea against descriptions (unit inconsistencies) |
| API7 | Handle expired but still-returned listings (ExpirationDate in past) |
| API8 | Handle empty Altitud Cero office (zero listings, 2 agents) gracefully |
| API9 | Birthday field must NOT be displayed publicly (privacy) |
| API10 | Phone format "506 XXXXXXXX" needs parsing/normalization |

---

### UX Design Requirements

> **Source:** UX Design Specification — 35 requirements (UX-DR1–UX-DR35)

| ID | Requirement | UX Source |
|----|------------|-----------|
| UX-DR1 | Split-hero homepage: dual-pane mountain/coast with glassmorphism search overlay; mobile stacks vertically with search between panes | Design Direction |
| UX-DR2 | Design token system: CSS custom properties for colors, typography, spacing, radii, shadows, transitions | Design System |
| UX-DR3 | RE/MAX brand colors: dark variants as primary (navy #000E35, burgundy #660000); bright accent-only; gold #C2A661 luxury differentiator | Color System |
| UX-DR4 | Region themes: Mountain (forest green #233428 + gold) and Coast (ocean blue #183C5A + sand) | Color System |
| UX-DR5 | Typography: Montserrat 400/600/700/800 via next/font; 16px body min; type scale hero→xs | Typography |
| UX-DR6 | Card-first design: property, area, agent, community — consistent card structure | Principles |
| UX-DR7 | Touch targets ≥ 44px; 8px min spacing between targets | Accessibility |
| UX-DR8 | Mobile pull-up sheet: 3-state (15%/50%/85% vh) with snap physics | Search Page |
| UX-DR9 | Sticky mobile CTA: floating WhatsApp + Email bar; hides when AgentCard visible | Listing Detail |
| UX-DR10 | PropertyCard: hero image + region badge + price + title + desc + specs + ZMT + save/share | Component Spec |
| UX-DR11 | Gallery-first listing: hero 60vh + price/specs sticky + agent sidebar | Listing Detail |
| UX-DR12 | 3-step seller form with progress; "I need help with pricing" checkbox; SEO landing above form | Seller Form |
| UX-DR13 | Area guides: hero + description (always visible for SEO) + tabbed Properties/Agents/Similar | Area Guide |
| UX-DR14 | Community pages: hero + quick facts icons + description + mini-map + tabs + Similar Communities | Community |
| UX-DR15 | Nav: max 5 top-level; "Sell" visually separated; mobile full-screen slide-out flat list | Navigation |
| UX-DR16 | Glassmorphism sparingly: search bar, overlays, hero only | Design System |
| UX-DR17 | Shadow system: 6 levels from sm to cta hover glow | Visual Foundation |
| UX-DR18 | Transitions: explicit property targeting (never "all"); respect prefers-reduced-motion | Transitions |
| UX-DR19 | Loading: skeleton shimmer matching layout; LQIP for images; 300ms threshold | Loading States |
| UX-DR20 | Every empty/error state has a forward path; no dead ends | Empty States |
| UX-DR21 | Search: instant for checkboxes, 300ms debounce for sliders; active filter chips; URL state | Search Patterns |
| UX-DR22 | Animation: ♡ CSS particle burst, Ken Burns hero, pull-up spring physics | Animation |
| UX-DR23 | Skip-to-content on every page (z-60); focus trap on modals; z-index hierarchy | Overlays |
| UX-DR24 | Focus: 2px solid navy + 2px white offset; never removed | Accessibility |
| UX-DR25 | ARIA: labels on cards, save, map, sheet, filters, gallery; aria-live on results count | Screen Reader |
| UX-DR26 | html lang updates dynamically on language switch | Language |
| UX-DR27 | Images: next/image with sizes, auto WebP, blur placeholder above-fold | Assets |
| UX-DR28 | Mobile-first CSS: base targets $150 Android (360px), enhance upward | Responsive |
| UX-DR29 | Responsive behavior: SplitHero stacks, search toggles pull-up sheet, cards 1→2→3 col | Responsive |
| UX-DR30 | Homepage two entry paths: Explore (visual) + Execute (search/filter) — 3 second telegraph | Core UX |
| UX-DR31 | Horizontal carousels on mobile for featured content (keeps CTAs within 2 scrolls) | Layout |
| UX-DR32 | Swappable logo component; easy asset swap without code changes | Design Direction |
| UX-DR33 | Community cards use gold border for premium curated visual differentiation | Community Visual |
| UX-DR34 | Pull-to-refresh disabled on search via overscroll-behavior: none | Search Patterns |
| UX-DR35 | Performance: LCP < 2.5s, CLS < 0.1, JS < 150KB (excl. Mapbox), CSS < 30KB | Performance |

---

### FR Coverage Map

> Maps each FR to its covering Epic and Story. Story column updated as stories are created in Step 3.

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | Map search with pins, clustering, 3D terrain |
| FR2 | Epic 3 | Split-view layout (map + grid) |
| FR3 | Epic 3 | Filter by type, price, beds, baths, lot, location |
| FR4 | Epic 3 | Filter by lifestyle tags |
| FR5 | Epic 3 | Browse by location hierarchy |
| FR6 | Epic 3 | Sort by price, date, lot size |
| FR7 | Epic 3 | Pagination / progressive loading |
| FR8 | Epic 4 | Listing detail page (gallery, video, specs) |
| FR9 | Epic 3 | Locale-appropriate area units |
| FR10 | Epic 3 | USD + approximate EUR conversion |
| FR11 | Epic 3 | ZMT/ownership status display |
| FR12 | Epic 3 | No-results state with suggestions |
| FR13 | Epic 4 | Shareable standalone listing URLs |
| FR14 | Epic 3 | Hidden listing "no longer available" state |
| FR15 | Epic 3 | Smart search presets |
| FR16 | Epic 3 | "Near me" geolocation button |
| FR17 | Epic 6 | Community landing pages |
| FR18 | Epic 6 | Community index page |
| FR19 | Epic 6 | Featured Communities on homepage |
| FR20 | Epic 6 | Community mini-map |
| FR21 | Epic 6 | Lot availability status indicators |
| FR22 | Epic 7 | ♡ save/shortlist |
| FR23 | Epic 7 | Shortlist view with comparison |
| FR24 | Epic 7 | Share shortlist URL |
| FR25 | Epic 7 | Second save tooltip |
| FR26 | Epic 7 | Smart agent routing CTA |
| FR27 | Epic 7 | Pre-populated WhatsApp for shortlist |
| FR28 | Epic 7 | Agent receives full shortlist context |
| FR29 | Epic 1 | Auto-detect browser language |
| FR30 | Epic 1 | Manual language switching |
| FR31 | Epic 4 | Listing content in selected language |
| FR32 | Epic 1 | UI/nav/forms in selected language |
| FR33 | Epic 4 | Glossary-consistent legal term translation |
| FR34 | Epic 4 | WhatsApp CTA with pre-populated message |
| FR35 | Epic 4 | Contact form / email alternative |
| FR36 | Epic 4 | Agent language transparency note |
| FR37 | Epic 4 | Agent profiles (photo, languages, listings) |
| FR38 | Epic 4 | Filter agents by office and language |
| FR39 | Epic 4 | Agent profile → all listings |
| FR40 | Epic 5 | Seller inquiry form |
| FR41 | Epic 5 | Request a Free CMA form |
| FR42 | Epic 5 | Seller form field spec |
| FR43 | Epic 5 | Seller submissions stored + routed |
| FR44 | Epic 6 | Investment discovery via lifestyle tags |
| FR45 | Epic 6 | Area appreciation / rental yield context |
| FR46 | Epic 2 | Daily API sync (two offices) |
| FR47 | Epic 2 | Image optimization during sync |
| FR48 | Epic 2 | Translation during sync |
| FR49 | Epic 2 | Auto-tagging with lifestyle tags |
| FR50 | Epic 6 | Auto-tagging with community geo-fence |
| FR51 | Epic 2 | Sync failure alert |
| FR52 | Epic 2 | Resilience: serve existing on failure |
| FR53 | Epic 2 | Graceful removed listing handling |
| FR54 | Epic 5 | Lead source capture (UTM + referrer) |
| FR55 | Epic 2 | Sync validation, reject bad records |
| FR56 | Epic 8 | Sync status logs |
| FR57 | Epic 8 | Lead management with full context |
| FR58 | Epic 8 | Lead reassignment |
| FR59 | Epic 8 | Lifestyle tag management |
| FR60 | Epic 8 | Community assignment management |
| FR61 | Epic 8 | Community CRUD (geo-fence polygon) |
| FR62 | Epic 8 | Hide/unhide listings |
| FR63 | Epic 8 | SEO performance monitoring |
| FR64 | Epic 1 | Homepage with featured listings |
| FR65 | Epic 1 | Static pages (About, Services, Contact, Join) |
| FR66 | Epic 4 | Full SEO architecture |
| FR67 | Epic 8 | Per-agent lead history (dates, contact info, filterable) |
| FR68 | Epic 8 | Bulk reassignment + CSV export of agent contacts |

**Coverage:** 68/68 FRs mapped (100%)

---

## Epic List

### Epic 1: Project Foundation & Design System

Visitors can access a professionally branded, multilingual-ready platform with consistent visual identity, navigation, and static content pages.

**FRs covered:** FR29, FR30, FR32, FR64, FR65
**Key NFRs:** NFR1-3, NFR7, NFR11, NFR21-24, NFR25, NFR28-30
**Key ARs:** AR7-9, AR11-12, AR16, AR18-21
**Key UX-DRs:** UX-DR1-7, UX-DR15-20, UX-DR23-24, UX-DR26, UX-DR28, UX-DR30, UX-DR32

**User Outcome:** Visitors land on a premium, branded RE/MAX Altitud platform with working navigation, language toggle (EN/ES), static pages (Homepage shell, About, Services, Contact, Join), and the full design system. Works on all devices from $150 Android to desktop.

**Implementation Notes:** Establishes Next.js 15 App Router, Supabase connection, Drizzle ORM schema, CI/CD pipeline, Vercel deployment, design token system, and i18n routing. Everything else builds on this.

---

### Epic 2: Data Pipeline & Property Database

The system automatically syncs, validates, translates, and serves property and agent data from the RE/MAX API — ensuring the platform always has fresh, optimized listing data.

**FRs covered:** FR46, FR47, FR48, FR49, FR51, FR52, FR53, FR55
**Key NFRs:** NFR13-15, NFR17-19
**Key ARs:** AR1-6, AR24, API1-API10

**User Outcome:** Property and agent data flows reliably from RE/MAX CCA API into the database. Images optimized, content translated to EN/ES, lifestyle tags auto-applied, and the site serves data even during API outages. Admin receives alerts on failures.

**Implementation Notes:** 8-step sync pipeline, Zod validation for API quirks, PostGIS spatial indexing, ISR revalidation. No user-facing pages yet — data foundation only.

---

### Epic 3: Property Discovery & Search

Visitors can discover and browse properties through an interactive map with pins, filters, lifestyle tags, and multiple view modes — the core product experience.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR9, FR10, FR11, FR12, FR14, FR15, FR16
**Key NFRs:** NFR4, NFR5
**Key ARs:** AR10, AR23, AR25
**Key UX-DRs:** UX-DR8, UX-DR10, UX-DR21-22, UX-DR27, UX-DR29, UX-DR31, UX-DR34-35

**User Outcome:** Visitors search on an interactive Mapbox map with 3D terrain, filter by type/price/beds/lifestyle tags, switch between split-view/map/grid, sort results, use "Near me" geolocation, and see smart presets. No-results states offer alternatives. Mobile gets pull-up sheet.

**Implementation Notes:** Mapbox GL JS lazy-loaded, zustand for map state, URL params for search state, Server Actions for PostGIS queries. Depends on Epic 2 for data.

---

### Epic 4: Listing Detail & Agent Profiles

Visitors can view complete property listings and agent profiles — evaluating properties and connecting with agents via WhatsApp or email.

**FRs covered:** FR8, FR13, FR31, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR66
**Key NFRs:** NFR6, NFR25-27
**Key ARs:** AR13-15, AR22
**Key UX-DRs:** UX-DR9, UX-DR11, UX-DR25, UX-DR27

**User Outcome:** Gallery-first listing detail pages with specs, ZMT status, area context, YouTube embeds, and WhatsApp/email CTAs. Agent profiles with photo, languages, office, and listings. Full SEO: structured data, sitemaps, hreflang, 301 redirects from WordPress.

**Implementation Notes:** SSG/ISR for all listing/agent pages. Sticky mobile CTA bar. Translation glossary enforcement. WordPress redirect mapping.

---

### Epic 5: Seller Lead Capture

Sellers can submit property listing inquiries and CMA requests through a progressive form, getting matched with an area-specific agent.

**FRs covered:** FR40, FR41, FR42, FR43, FR54
**Key UX-DRs:** UX-DR12

**User Outcome:** Sellers access "Vende tu propiedad" from nav, fill a 3-step form (basics → details → contact) completable in ~3 minutes on a $150 Android, and receive an agent match. "Request a Free CMA" provides a second entry. All leads capture UTM/source data.

**Implementation Notes:** Progressive form with map pin for location. "I need help with pricing" checkbox. Can be built in parallel with Epics 3-4 after Epic 1+2.

---

### Epic 6: Community Pages & Area Guides

Visitors can explore curated communities and area guides — discovering developments, neighborhoods, and lifestyle zones with rich content and filtered properties.

**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR44, FR45, FR50, FR66
**Key ARs:** AR2 (geo-fence)
**Key UX-DRs:** UX-DR13, UX-DR14, UX-DR33

**User Outcome:** Community pages (RISE, Santa Elena Hills, Serena) with hero imagery, quick facts, mini-maps, and filtered properties with status indicators. Area guides with lifestyle narratives, climate data, and related areas. Featured communities on homepage with gold-bordered cards. Investment context where available. PostGIS geo-fence auto-tagging.

**Implementation Notes:** Hybrid geo-fence + admin override for community assignment. Depends on Epics 2-4 for property data and detail pages.

---

### Epic 7: Shortlist & Smart Agent Routing

Visitors can save properties to a shortlist, compare them, share with family, and contact a single coordinating agent for all saved properties.

**FRs covered:** FR22, FR23, FR24, FR25, FR26, FR27, FR28
**Key ARs:** AR10 (localStorage)
**Key UX-DRs:** UX-DR22 (♡ animation)

**User Outcome:** ♡ save (up to 20), shortlist comparison page with mini-map, shareable URL, and "Ask about these" with smart agent routing (single/majority/multi-agent). Pre-populated WhatsApp with all refs. Education about one-agent representation model.

**Implementation Notes:** localStorage for persistence. Smart routing logic. Depends on Epic 4 for listings and agent profiles.

---

### Epic 8: Administration & Operations

Admin can manage leads, sync operations, listing visibility, lifestyle tags, community assignments, agent lead histories, and monitor platform health.

**FRs covered:** FR56, FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR67, FR68
**Key NFRs:** NFR8-10, NFR12
**Key ARs:** AR16, AR17, AR19

**User Outcome:** Admin (Nico) can view sync logs, manage/reassign leads (with cross-agent shortlist visibility), view per-agent lead history (with dates, contact info, filterable), bulk-reassign leads for agent departures with CSV export, manage lifestyle tags and community geo-fences, hide/unhide listings, and monitor SEO metrics. All via authenticated admin interface.

**Implementation Notes:** Supabase Auth for admin access. Lead PII encryption. Reassignment audit logging. CSV export endpoint. Wraps around all Epics 1-7.

---

### Dependency Flow

```
Epic 1 (Foundation) → Epic 2 (Data) → Epic 3 (Search) → Epic 4 (Listings/Agents)
                                    ↗                          ↓
                     Epic 5 (Seller) parallel after E1+E2      Epic 6 (Communities)
                                                               ↓
                                                        Epic 7 (Shortlist)
                                                               ↓
                                                        Epic 8 (Admin)
```

---

## Epic 1: Project Foundation & Design System

Visitors can access a professionally branded, multilingual-ready platform with consistent visual identity, navigation, and static content pages.

### Story 1.1: Project Scaffolding & CI/CD Pipeline

As a **developer**,
I want a production-ready Next.js 15 project with Supabase, Drizzle ORM, and automated CI/CD,
So that all subsequent features can be built on a solid, deployable foundation.

**Acceptance Criteria:**

**Given** a fresh repository
**When** `npm run dev` is executed
**Then** the Next.js 15 App Router app starts successfully on localhost

**Given** the project
**When** environment variables are configured
**Then** Supabase connection is established and verified via a health check

**Given** Drizzle ORM is configured
**When** schema migrations are run
**Then** the database schema is created in Supabase (initial migrations table only — other tables created per-story)

**Given** TypeScript strict mode is enabled
**When** `npm run build` is executed
**Then** the build completes with zero type errors

**Given** ESLint + Prettier are configured
**When** code is pushed
**Then** CI runs TypeScript check → ESLint → build verification (AR20)

**Given** Vercel is connected
**When** code is merged to main
**Then** auto-deployment triggers and the site is live (AR21)

**Given** Sentry is configured
**When** an unhandled error occurs
**Then** it is captured and reported (AR19)

**And** API keys are stored as environment variables, never exposed client-side (NFR11)
**And** HTTPS is enforced on deployed site (NFR7)

---

### Story 1.2: Design System & Token Foundation

As a **visitor**,
I want consistent, premium visual styling across the entire platform,
So that the site feels trustworthy and professionally designed on any device.

**Acceptance Criteria:**

**Given** globals.css is created
**When** the app loads
**Then** all CSS custom properties are defined (colors, typography, spacing, radii, shadows, transitions per UX-DR2)

**Given** the color system
**When** rendering on light surfaces
**Then** dark primary variants are used (navy #000E35, burgundy #660000) with gold #C2A661 accents (UX-DR3)

**Given** region themes
**When** mountain content is displayed
**Then** forest green #233428 + gold palette applies; coastal content uses ocean blue #183C5A + sand (UX-DR4)

**Given** Montserrat is loaded via `next/font`
**When** any page renders
**Then** 4 weights (400, 600, 700, 800) are available with 16px body minimum (UX-DR5)

**Given** the spacing system
**When** components are built
**Then** they use 4px-base grid tokens (--space-1 through --space-24)

**Given** touch target requirements
**When** interactive elements render on mobile
**Then** all are ≥ 44×44px with 8px spacing (UX-DR7)

**Given** transitions are defined
**When** animations play
**Then** they use explicit property targeting (never "all") and respect `prefers-reduced-motion` (UX-DR18)

**And** glassmorphism tokens (glass-bg, glass-border, glass-blur) are defined and documented (UX-DR16)
**And** the shadow system has all 6 levels defined (sm through cta) (UX-DR17)

---

### Story 1.3: Core Layout & Navigation

As a **visitor**,
I want clear, consistent navigation that works beautifully on my phone or desktop,
So that I can find any section of the site within 2 taps.

**Acceptance Criteria:**

**Given** any page
**When** it loads
**Then** it renders within a consistent app shell (header + content + footer)

**Given** desktop viewport (≥1024px)
**When** navigation renders
**Then** max 5 top-level items display with dropdown menus; "Sell" is visually separated (UX-DR15)

**Given** mobile viewport (<768px)
**When** the hamburger ☰ is tapped
**Then** a full-screen slide-out nav appears with flat list (no nesting), language toggle at bottom (UX-DR15)

**Given** any page
**When** a keyboard user tabs
**Then** a skip-to-content link is the first focusable element (z-index 60) (UX-DR23)

**Given** the footer renders
**When** viewed on desktop
**Then** it displays a 4-column grid on dark bg (#0D0D0D) with links, offices, social, language toggle

**Given** focus indicators
**When** any interactive element receives keyboard focus
**Then** a 2px solid navy + 2px white offset ring appears (UX-DR24)

**Given** the logo component
**When** rendered
**Then** it supports easy asset swap without code changes (UX-DR32)

**And** all interactive nav elements have ARIA labels and keyboard support (NFR22)
**And** mobile nav traps focus when open and locks body scroll (UX-DR23)

---

### Story 1.4: Internationalization (EN/ES)

As a **visitor**,
I want the site to automatically display in my language and let me switch easily,
So that I can browse comfortably whether I speak English or Spanish.

**Acceptance Criteria:**

**Given** a visitor with browser language set to Spanish
**When** they first visit the site
**Then** the site loads in Spanish automatically (FR29)

**Given** any page
**When** the language toggle is clicked
**Then** the page switches to the other language without a full reload (FR30, <150ms per UX spec)

**Given** the language switches
**When** the page re-renders
**Then** all UI elements, navigation, forms, and CTAs display in the selected language (FR32)

**Given** `next-intl` routing
**When** visiting `/en/about` vs `/es/about`
**Then** both resolve correctly with locale-appropriate content (AR7, AR8)

**Given** the html element
**When** language switches
**Then** the `lang` attribute updates dynamically (UX-DR26)

**Given** a non-EN/non-ES browser
**When** the visitor arrives
**Then** the site defaults to English with no error

**And** only the current page's locale strings are loaded (not all translations at once) (AR8)
**And** URL structure uses `/{locale}/` prefix for all routes (AR12)

---

### Story 1.5: Homepage Shell & Split-Hero

As a **visitor**,
I want a stunning homepage that immediately shows me mountain AND coast living options,
So that I understand RE/MAX Altitud's unique geographic coverage within 3 seconds.

**Acceptance Criteria:**

**Given** the homepage loads
**When** rendered on desktop
**Then** a split-hero with 50/50 horizontal panes (mountain left, coast right) fills 80vh with Ken Burns animation (UX-DR1)

**Given** desktop split-hero
**When** hovering a pane
**Then** it subtly expands (50% → 55%) with the other contracting (UX-DR1)

**Given** mobile viewport
**When** the homepage loads
**Then** split-hero stacks vertically (40vh each) with search bar placed BETWEEN the panes (UX-DR1, UX-DR29)

**Given** the split-hero
**When** a glassmorphism search overlay renders
**Then** it shows a non-functional search bar shell (placeholder for Epic 3) (UX-DR16)

**Given** the homepage
**When** scrolling past the hero
**Then** placeholder sections appear for: Featured Properties (carousel shell), Featured Communities (shell), Area Highlights (shell), Sell CTA block, Footer (FR64)

**Given** the two entry paths
**When** the page loads
**Then** both Explore (visual/pane click) and Execute (search bar) modes are telegraphed within 3 seconds (UX-DR30)

**And** mobile uses horizontal carousel placeholders (not vertical stacks) to keep CTAs within 2 scrolls (UX-DR31)
**And** `prefers-reduced-motion` disables Ken Burns and pane expansion animations (UX-DR18)

---

### Story 1.6: Static Content Pages

As a **visitor**,
I want to learn about RE/MAX Altitud's team, services, and how to contact them,
So that I can trust the company and reach out through my preferred channel.

**Acceptance Criteria:**

**Given** the About page
**When** rendered
**Then** it displays office information for both Altitud (PZ) and Altitud Cero (Dominical/Uvita) (FR65)

**Given** the Services page
**When** rendered
**Then** it displays Buy/Sell/Invest services with bilingual content (FR65)

**Given** the Contact page
**When** rendered
**Then** it displays office addresses, phone numbers, email, and a contact form (FR65)

**Given** the Join Our Team page
**When** rendered
**Then** it displays recruitment information and an inquiry form (FR65)

**Given** any static page
**When** inspecting the HTML
**Then** proper semantic elements are used (<main>, <article>, <section>), with single <h1>, meta descriptions, and title tags

**Given** each page exists in EN and ES
**When** switching language
**Then** all content updates to the selected locale

**And** all pages are SSG (static generation) for maximum performance (NFR25)
**And** each page scores ≥ 80 on Lighthouse (NFR28)

---

### Story 1.7: Loading States, Empty States & Error Handling

As a **visitor**,
I want smooth loading indicators and helpful error messages,
So that I never feel lost or stuck when something takes time or goes wrong.

**Acceptance Criteria:**

**Given** any page takes >300ms to load
**When** rendering
**Then** skeleton shimmer placeholders matching the final layout appear (UX-DR19)

**Given** a skeleton component
**When** `prefers-reduced-motion` is active
**Then** the shimmer animation is replaced with static gray (UX-DR18)

**Given** a 404 error
**When** visiting a non-existent URL
**Then** a branded error page displays with navigation back to homepage and search

**Given** a 500 error
**When** a server error occurs
**Then** a branded error page shows "Something went wrong" with RE/MAX balloon icon and "Try again" + homepage link (UX-DR20)

**Given** any empty state
**When** no content is available
**Then** a forward path is always provided (no dead ends) (UX-DR20)

**And** error pages work in both EN and ES
**And** Sentry captures all unhandled errors with context (AR19)

---

## Epic 2: Data Pipeline & Property Database

The system automatically syncs, validates, translates, and serves property and agent data from the RE/MAX API — ensuring the platform always has fresh, optimized listing data.

### Story 2.1: Database Schema & Drizzle Models

As a **developer**,
I want type-safe database models for properties, agents, areas, and sync logs with spatial indexing,
So that all platform data can be stored, queried, and extended reliably.

**Acceptance Criteria:**

**Given** Drizzle ORM is configured (from Story 1.1)
**When** migrations are run
**Then** the following tables are created: `properties`, `agents`, `areas`, `sync_logs` (AR1)

**Given** the `properties` table
**When** inspecting the schema
**Then** it includes: id, api_id, slug, title_en, title_es, description_en, description_es, type, price, currency, bedrooms, bathrooms, lot_size, construction_size, lot_size_unit, location (PostGIS point), area_id, agent_id, images (JSONB array), lifestyle_tags (JSONB array), zmt_status, is_visible, api_raw (JSONB), created_at, updated_at, synced_at

**Given** the `agents` table
**When** inspecting the schema
**Then** it includes: id, api_id, slug, name, email, phone, photo_url, languages (JSONB array), office_guid, office_name, bio_en, bio_es, is_active, created_at, updated_at

**Given** the `areas` table
**When** inspecting the schema
**Then** it includes: id, slug, name_en, name_es, description_en, description_es, region (mountain/coast enum), hero_image, province, canton, district, created_at, updated_at

**Given** PostGIS is enabled
**When** a spatial query is executed against `properties.location`
**Then** GiST index is used for efficient geo-queries (AR2)

**Given** the `sync_logs` table
**When** inspecting the schema
**Then** it includes: id, started_at, completed_at, status (enum: running/success/failed), properties_fetched, properties_created, properties_updated, properties_removed, errors (JSONB), office_guid

**And** all Drizzle models export TypeScript types for use across the application (AR24)

---

### Story 2.2: API Integration & Data Fetching

As a **system**,
I want to reliably fetch property and agent data from the RE/MAX CCA API for both offices,
So that the platform always has access to the latest listing and agent information.

**Acceptance Criteria:**

**Given** the RE/MAX CCA API client
**When** fetching properties for Altitud (PZ) office
**Then** data is retrieved from `api.remax-cca.com/api/PropertiesPerOffice/FEA8746D-CC1D-41B8-89F3-D04AC98274AF` (AR4)

**Given** the API client
**When** fetching properties for Altitud Cero (Dominical/Uvita) office
**Then** data is retrieved from `api.remax-cca.com/api/PropertiesPerOffice/4AD5AE8F-5B47-4A1A-A953-40445F2B4940` (AR4)

**Given** the API client
**When** fetching agents for both offices
**Then** data is retrieved from `api.remax-cca.com/api/AgentsPerOffice/{GUID}` using the same GUIDs

**Given** the API response
**When** parsing property data
**Then** Zod schema validates all fields with specific handling for: inconsistent casing (API1), string lat/lon parsed to float (API2), pipe-delimited images split to array (API3), empty Spanish titles fallback to English (API4), ConstructionSize used instead of ConstructionSizeLiving (API5)

**Given** lot size data
**When** LotSizeArea is present
**Then** it is cross-validated against descriptions for unit consistency (API6)

**Given** an expired listing in the API response
**When** ExpirationDate is in the past
**Then** the listing is flagged for removal during sync (API7)

**Given** the Altitud Cero office returns zero listings
**When** syncing
**Then** the sync completes successfully without errors (API8)

**Given** agent data
**When** the Birthday field is present
**Then** it is stored but NEVER exposed publicly (API9)

**Given** agent phone numbers
**When** format is "506 XXXXXXXX"
**Then** they are parsed and normalized for WhatsApp links (API10)

**And** the API client retries 3x with exponential backoff before failing (NFR17)
**And** API keys are env vars, never in client-side code (NFR11)

---

### Story 2.3: Sync Pipeline Core

As an **admin**,
I want property and agent data to sync automatically every day,
So that the website always shows current listings without manual intervention.

**Acceptance Criteria:**

**Given** the sync pipeline runs (triggered by daily cron or manual invoke)
**When** processing begins
**Then** a sync_log record is created with status "running" and started_at timestamp

**Given** API data is fetched for both offices
**When** compared against existing database records
**Then** the pipeline identifies new, updated, and removed listings via diff (AR5)

**Given** new listings are identified
**When** upserting to database
**Then** they are inserted with all parsed and validated fields

**Given** existing listings have changed
**When** the diff detects updates
**Then** only changed fields are updated (incremental processing) (NFR15)

**Given** listings are no longer in the API response
**When** detected during diff
**Then** they are soft-deleted (is_visible=false), preserving their URL for SEO (FR53, AR3)

**Given** the sync completes successfully
**When** finishing
**Then** sync_log is updated with status "success", counts (fetched/created/updated/removed), and completed_at

**Given** invalid records are encountered
**When** Zod validation rejects them
**Then** they are skipped, logged in sync_log errors array, and processing continues for remaining records (FR55)

**Given** the pipeline
**When** processing all records
**Then** it completes within 2 hours (NFR15)

**And** agent data is synced from AgentsPerOffice endpoint alongside properties
**And** ISR revalidation is triggered via /api/revalidate after successful sync (AR6)

---

### Story 2.4: Image Optimization Pipeline

As a **visitor**,
I want property photos to load quickly in high quality,
So that I can evaluate listings without waiting on slow images.

**Acceptance Criteria:**

**Given** new or updated listing images from the API
**When** the sync pipeline processes images
**Then** they are converted to WebP format (FR47)

**Given** each source image
**When** generating responsive variants
**Then** at least 3 sizes are created: 400px (mobile card), 800px (gallery), 1600px (full-screen) (FR47, UX-DR27)

**Given** optimized images
**When** stored
**Then** they are saved with predictable URLs and the images JSONB array on the property record is updated

**Given** the API provides pipe-delimited image URLs with spaces
**When** processing
**Then** spaces are URL-encoded and URLs are normalized (API3)

**And** each optimized image is ≤ 200KB (UX-DR35)
**And** original API image URLs are preserved in api_raw for reference

---

### Story 2.5: Translation Pipeline

As a **visitor**,
I want listing content available in my language,
So that I can understand property details without needing a translator.

**Acceptance Criteria:**

**Given** a new listing is synced with English content only
**When** the translation step runs
**Then** title, description, and key fields are translated to Spanish (FR48)

**Given** a listing already has Spanish content from the API
**When** the translation step runs
**Then** the API-provided Spanish content is preserved (not overwritten)

**Given** translation API rate limits
**When** the limit is approached
**Then** processing uses exponential backoff and resumes without data loss (NFR19)

**Given** a listing with legal/property terms
**When** translating
**Then** terms like "Titled Property," "Concession," and "ZMT Restricted" use the enforced glossary for consistent translation (FR33 support)

**And** translations are stored in dedicated columns (title_es, description_es) not a separate translations table
**And** translation failures for individual listings are logged but don't block the sync pipeline

---

### Story 2.6: Lifestyle Tag Auto-Tagging

As a **visitor**,
I want properties tagged with relevant lifestyle categories,
So that I can filter for exactly the type of property I'm looking for.

**Acceptance Criteria:**

**Given** configurable tagging rules exist (stored as JSON config or DB rows)
**When** the sync pipeline processes a listing
**Then** lifestyle tags are auto-assigned based on attribute matching (FR49)

**Given** a condo in a tourist zone
**When** rule matching evaluates
**Then** it receives "Rental Potential" tag

**Given** a large lot in a rural area
**When** rule matching evaluates
**Then** it receives "Investment Property" tag

**Given** an admin has manually set tags on a listing
**When** the sync pipeline runs again
**Then** manual overrides are preserved and NOT reset by auto-tagging (FR49)

**And** tags are stored as a JSONB array on the property record
**And** new rule configurations can be added without code changes

---

### Story 2.7: Sync Monitoring & Failure Resilience

As an **admin**,
I want to be alerted when sync fails and confident the site still works,
So that data issues never take the website down.

**Acceptance Criteria:**

**Given** the sync pipeline fails
**When** all 3 retries are exhausted
**Then** an automated alert is sent to admin (email or Slack webhook) (FR51, NFR17)

**Given** the API is unreachable
**When** the sync cannot complete
**Then** the site continues serving existing listings from the database with no visitor-facing errors (FR52, NFR18)

**Given** a listing is removed from the API
**When** detected during sync diff
**Then** it is hidden from search results but its URL still resolves to a "No longer available" page with similar properties (FR53)

**Given** the sync completes successfully
**When** new/updated properties exist
**Then** ISR on-demand revalidation fires for affected pages (AR6)

**Given** the sync_log
**When** an admin checks
**Then** they can see timestamps, counts, status, and error details for each sync run

**And** sync failure does not trigger site downtime — the last successful data state is always served (NFR18)

---

## Epic 3: Property Discovery & Search

Visitors can discover and browse properties through an interactive map with pins, filters, lifestyle tags, and multiple view modes — the core product experience.

### Story 3.1: Search Page Layout & Split-View

As a **visitor**,
I want a search page where I can see both a map and property listings at the same time,
So that I can understand where properties are while browsing details.

**Acceptance Criteria:**

**Given** the search page loads on desktop (≥1024px)
**When** rendered
**Then** a split-view appears with map (60% left) and scrollable grid (40% right) (FR2)

**Given** the split-view
**When** the "Full Map" toggle is clicked
**Then** the map expands to 100% width; grid is hidden

**Given** the split-view
**When** the "Full Grid" toggle is clicked
**Then** the grid expands to 100% width; map is hidden

**Given** tablet viewport (768-1023px)
**When** the search page loads
**Then** the map and grid split (60/40) with a side-panel toggle

**Given** mobile viewport (<768px)
**When** the search page loads
**Then** the map is full-screen with pull-up sheet handle visible at bottom (stub for Story 3.6)

**Given** a sticky filter bar
**When** scrolling the results grid
**Then** the filter bar remains fixed at the top of the grid panel

**And** all search states (filters, sort, view mode) are encoded in URL query params and shareable (UX-DR21)
**And** the search page uses Server Components for initial render with Client Components for interactivity (AR9)

---

### Story 3.2: Interactive Map with Property Pins

As a **visitor**,
I want to see property locations on an interactive map with terrain,
So that I can understand the geography and find properties in specific locations.

**Acceptance Criteria:**

**Given** the search page map
**When** rendered
**Then** Mapbox GL JS loads with 3D terrain showing the southern Costa Rica region (FR1)

**Given** properties in the database
**When** the map viewport is visible
**Then** property pins appear at their lat/lon coordinates (FR1)

**Given** many properties in a small area
**When** zoomed out
**Then** pins cluster into numbered cluster markers that expand on zoom (FR1)

**Given** a property pin
**When** clicked/tapped
**Then** a preview card overlay appears showing: photo, price, title, specs, ZMT badge, and "View Details" CTA

**Given** the map
**When** the user pans or zooms
**Then** the grid updates to show only properties visible in the current map bounds

**Given** Mapbox GL JS
**When** loaded on the search page
**Then** it is lazy-loaded as a separate async chunk (not in main JS bundle) (AR25)

**And** the map renders with pins and clustering within 3s on 4G mobile (NFR4)
**And** map state (center, zoom, bounds) is managed via zustand (AR10)

---

### Story 3.3: Search Filters & URL State

As a **visitor**,
I want to filter properties by type, price, size, rooms, and location,
So that I only see properties that match my needs.

**Acceptance Criteria:**

**Given** the filter bar
**When** displayed
**Then** it shows filters for: Type (dropdown), Price Range (dual-handle slider with min/max inputs), Bedrooms (dropdown), Bathrooms (dropdown), Lot Size (range), Location (hierarchy dropdown) (FR3)

**Given** a property type of "Land/Lot" is selected
**When** filters render
**Then** bedrooms and bathrooms filters are hidden (context-sensitive) (FR3)

**Given** any filter is changed
**When** it's a checkbox or dropdown
**Then** results update instantly (UX-DR21)

**Given** the price slider
**When** dragged
**Then** results update with 300ms debounce to prevent request flooding (UX-DR21)

**Given** active filters
**When** displayed above results
**Then** each shows as a dismissible chip with × button; "Clear all" appears if 2+ active (UX-DR21)

**Given** each filter option
**When** rendered
**Then** it shows the matching result count: "Casa (12)" "Lote (8)" (UX-DR21)

**Given** the location hierarchy filter
**When** selecting a Province
**Then** it drills down to available Cantones, then Distritos (FR5)

**Given** all filter states
**When** applied
**Then** they are serialized into URL query params (shareable, bookmarkable) (UX-DR21)

**And** filter queries execute via Server Actions using PostGIS (AR23)
**And** filter changes reflect within 500ms client-side (NFR5)

---

### Story 3.4: Lifestyle Tags & Smart Presets

As a **visitor**,
I want to browse by lifestyle category or use preset searches,
So that I can quickly find properties that match my goals without configuring every filter.

**Acceptance Criteria:**

**Given** the filter bar
**When** lifestyle tag chips are displayed
**Then** options include: "Investment Property," "Rental Potential," "Vacation Home," "Retirement Paradise," "Commercial" (FR4)

**Given** a lifestyle tag chip
**When** tapped
**Then** it toggles active state (highlighted with --color-blue-bright) and filters results immediately (FR4)

**Given** multiple lifestyle tags
**When** selected simultaneously
**Then** results match ANY of the selected tags (OR logic)

**Given** smart search presets
**When** displayed (e.g., homepage or search page)
**Then** they combine pre-configured filter + lifestyle tag combinations (FR15)

**Given** a smart preset like "Mountain Retirement Homes"
**When** clicked
**Then** it applies: region=mountain, type=house, lifestyle_tag=Retirement Paradise, and navigates to search with those URL params

**And** active lifestyle tags appear as chips in the active filter display
**And** presets are configurable without code changes (JSON config or DB)

---

### Story 3.5: Property Cards & Grid View

As a **visitor**,
I want to browse properties in a clean card grid with key details visible at a glance,
So that I can quickly scan and compare listings.

**Acceptance Criteria:**

**Given** the PropertyCard component
**When** rendered
**Then** it displays: hero image with region badge (Mountain/Beach), price (Montserrat 800, --color-accent), title, 1-2 line truncated description, specs row (beds · baths · lot · built area), ZMT badge, and ♡ save + share icons (UX-DR10)

**Given** desktop grid (≥1024px)
**When** displaying results
**Then** cards render in 3-column layout (min-width 350px per card)

**Given** tablet (768-1023px)
**When** displaying results
**Then** cards render in 2-column layout

**Given** mobile (<768px) in grid view
**When** displaying results
**Then** cards render in single-column full-width layout

**Given** the sort dropdown
**When** selecting "Newest," "Price ↑," "Price ↓," or "Relevance"
**Then** results reorder accordingly; sort persists in URL params (FR6)

**Given** many results
**When** scrolling
**Then** results paginate or progressively load with ≤ 20 cards per page (FR7)

**Given** a PropertyCard
**When** hovered on desktop
**Then** a 200ms lift animation plays with shadow-lg (UX-DR22)

**And** cards use aspect-ratio: 3/2 on images to prevent CLS (NFR2)
**And** card images use next/image with sizes prop and WebP (UX-DR27)

---

### Story 3.6: Mobile Pull-Up Sheet

As a **mobile visitor**,
I want a pull-up sheet over the map to browse property cards,
So that I can see the map and listings without switching views.

**Acceptance Criteria:**

**Given** mobile viewport (<768px) on the search page
**When** the map is displayed
**Then** a pull-up sheet handle appears at the bottom of the screen (UX-DR8)

**Given** the pull-up sheet in "peeked" state (15vh)
**When** displayed
**Then** it shows only the handle bar + "24 properties in view" count (UX-DR8)

**Given** the pull-up sheet
**When** dragged up to 50vh
**Then** it snaps to "half" state showing 2-3 card previews in horizontal scroll (UX-DR8)

**Given** the pull-up sheet
**When** dragged up to 85vh
**Then** it snaps to "full" state showing a scrollable list with a close button to return to map (UX-DR8)

**Given** the pull-up sheet drag
**When** released between snap points
**Then** it animates to the nearest snap point with spring physics (300ms, cubic-bezier) (UX-DR22)

**Given** pull-to-refresh
**When** on the search page
**Then** it is explicitly disabled via overscroll-behavior: none (UX-DR34)

**And** the sheet uses `role="region"` with `aria-label="Property list"` and `aria-expanded` for state (UX-DR25)

---

### Story 3.7: Unit Conversion & Price Display

As a **visitor**,
I want to see property sizes in my preferred units and prices in my currency,
So that I can evaluate properties using measurements I understand.

**Acceptance Criteria:**

**Given** a European browser locale
**When** viewing property sizes
**Then** m² and hectares are displayed by default (FR9)

**Given** a US browser locale
**When** viewing property sizes
**Then** ft² and acres are displayed by default (FR9)

**Given** a unit toggle on property specs
**When** clicked
**Then** all displayed measurements switch between m²/hectares and ft²/acres (FR9)

**Given** the unit preference
**When** set by the user
**Then** it persists in localStorage across sessions (AR10)

**Given** a property price
**When** displayed
**Then** it shows USD as primary with approximate EUR conversion for non-US locales (FR10)

**Given** any property card or listing
**When** ZMT/ownership status is available
**Then** a badge shows "Titled Property ✓" / "Concession" / "ZMT Restricted" with icon + label (not color alone) (FR11)

**And** price formatting respects locale conventions (commas vs. periods)

---

### Story 3.8: No-Results, Hidden Listings & Near Me

As a **visitor**,
I want helpful suggestions when no properties match and easy location-based search,
So that I'm never stuck at a dead end and can discover nearby properties.

**Acceptance Criteria:**

**Given** a search with filters that return zero results
**When** the empty state renders
**Then** it shows: "No properties match your filters in this area" + smart suggestions (relaxed filters or alternative areas) + "Tell an agent your dream home" WhatsApp CTA (FR12, UX-DR20)

**Given** the "Tell an agent" CTA in no-results
**When** clicked
**Then** WhatsApp opens with the search criteria forwarded in the message (FR12)

**Given** a previously visible listing that has been removed
**When** its URL is visited
**Then** a "No longer available" page appears with similar properties carousel and agent CTA (FR14, UX-DR20)

**Given** the "Near Me" button
**When** clicked
**Then** the browser Geolocation API is invoked (FR16)

**Given** geolocation is granted
**When** coordinates are received
**Then** the map flies to the user's location with a radius overlay showing nearby properties (FR16)

**Given** geolocation is denied
**When** the permission is blocked
**Then** the map centers on the nearest RE/MAX office location with a friendly message (FR16)

**And** every empty/error state has a forward path — no dead ends (UX-DR20)

---

## Epic 4: Listing Detail & Agent Profiles

Visitors can view complete property listings and agent profiles — evaluating properties and connecting with agents via WhatsApp or email.

### Story 4.1: Listing Detail Page & Photo Gallery

As a **visitor**,
I want a beautiful, gallery-first property page with all the details I need to evaluate a listing,
So that I can decide if this property is worth contacting an agent about.

**Acceptance Criteria:**

**Given** a listing detail page loads
**When** rendered
**Then** a hero gallery fills full-width at 60vh with a thumbnail strip and photo count overlay (FR8, UX-DR11)

**Given** the gallery
**When** the fullscreen button is clicked
**Then** a lightbox opens with swipe navigation (mobile) or arrow keys (desktop) (FR8)

**Given** gallery images
**When** loading
**Then** first 3 images load within 1s; remaining are lazy-loaded (NFR6)

**Given** gallery images
**When** rendered
**Then** they use LQIP blur placeholders that transition to sharp images (UX-DR19)

**Given** a listing with a YouTube video
**When** the detail page renders
**Then** the video is embedded and playable within the gallery or below it (FR8)

**Given** the price + specs bar below the gallery
**When** scrolling on desktop
**Then** it becomes sticky showing: price, beds/baths, lot + built area (with unit toggle), ZMT badge (UX-DR11)

**Given** listing content
**When** displayed in the user's selected language
**Then** title, description, and specs render in that language (FR31)

**Given** legal/property terms
**When** displayed in Spanish
**Then** they use the enforced translation glossary ("Propiedad Titulada," "Concesión") (FR33)

**Given** the listing URL (e.g., `/en/property/beautiful-mountain-home`)
**When** shared as a standalone link
**Then** it loads as a complete landing page with full context (FR13)

**And** the page is SSG/ISR for performance (NFR25)
**And** all images use next/image with sizes and WebP (UX-DR27)

---

### Story 4.2: Agent Card & Contact CTAs

As a **visitor**,
I want to easily contact the listing agent via WhatsApp or email,
So that I can ask questions or schedule a viewing with one tap.

**Acceptance Criteria:**

**Given** the listing detail page
**When** the agent card renders (right sidebar on desktop, below content on mobile)
**Then** it shows: agent photo, name, languages spoken, office affiliation, and WhatsApp + Email buttons (FR37 partial)

**Given** the WhatsApp CTA
**When** clicked
**Then** WhatsApp opens with a pre-populated message in the user's language referencing the property title and ref number (FR34)

**Given** a Spanish-speaking visitor
**When** clicking WhatsApp
**Then** the pre-populated message is in Spanish: "Hola [Agent], me interesa la propiedad [Title]..." (FR34)

**Given** the email CTA
**When** clicked
**Then** a contact form opens (or mailto link) with property context pre-filled (FR35)

**Given** the site
**When** the agent card renders
**Then** a transparency note displays about agent languages and WhatsApp's built-in translation (FR36)

**Given** mobile viewport
**When** scrolling the listing detail
**Then** a sticky bottom bar (56px) with WhatsApp + Email buttons appears and persists (UX-DR9)

**Given** the sticky mobile CTA
**When** the agent card scrolls into viewport
**Then** the sticky bar hides (IntersectionObserver) to avoid duplication (UX-DR9)

**And** WhatsApp clicks are tracked as lead events with UTM/source data (FR54 support)
**And** the agent card uses `role="article"` with appropriate ARIA labels (UX-DR25)

---

### Story 4.3: Agent Profile Pages

As a **visitor**,
I want to view an agent's profile with their listings, languages, and contact info,
So that I can find an agent who speaks my language and see their expertise.

**Acceptance Criteria:**

**Given** an agent profile page (e.g., `/en/agents/emma-smith`)
**When** loaded
**Then** it displays: photo, name, bio (bilingual), languages spoken, office (Altitud or Altitud Cero), listing count, WhatsApp + Email CTAs (FR37)

**Given** the agent profile
**When** scrolling below the bio
**Then** all listings for that agent are displayed in a property grid (FR39)

**Given** the agent listing filter
**When** visitors view the page
**Then** agents can be filtered by office (Altitud / Altitud Cero) and language spoken on an agents index page (FR38)

**Given** the agents index page (`/en/agents`)
**When** loaded
**Then** it shows all active agents with photo, name, languages, office, and listing count

**Given** agent profile URLs
**When** shared
**Then** they load as shareable, standalone pages with full context

**And** agent pages are SSG/ISR (NFR25)
**And** agent data is sourced from the synced database (Epic 2)

---

### Story 4.4: SEO Architecture & WordPress Redirects

As **the business**,
I want full SEO architecture and seamless migration from WordPress,
So that we maintain search rankings and maximize organic discovery.

**Acceptance Criteria:**

**Given** any listing detail page
**When** inspected
**Then** JSON-LD structured data is present for RealEstateListing schema (AR14)

**Given** any agent profile page
**When** inspected
**Then** JSON-LD structured data is present for RealEstateAgent schema (AR14)

**Given** any area page
**When** inspected
**Then** JSON-LD structured data is present for Place schema (AR14)

**Given** any page with a parent hierarchy
**When** rendered
**Then** BreadcrumbList structured data is present (AR14)

**Given** the EN and ES versions of any page
**When** inspected
**Then** hreflang tags correctly reference both locale variants (AR22)

**Given** per-language XML sitemaps
**When** generated after daily sync
**Then** they include all listing, agent, area, and community URLs in both locales (AR15, NFR27)

**Given** a WordPress URL (e.g., `/listing/beautiful-home-123`)
**When** visited
**Then** a 301 redirect resolves to the new URL in < 50ms (AR13, NFR26)

**Given** any page
**When** rendered
**Then** it has proper title tag, meta description, canonical URL, and Open Graph tags (FR66)

**And** Lighthouse CI gate enforces score ≥ 80 on all pages (NFR28)

---

### Story 4.5: Similar Properties & Cross-Linking

As a **visitor**,
I want to see similar properties when viewing a listing,
So that I can compare options and discover alternatives without going back to search.

**Acceptance Criteria:**

**Given** a listing detail page
**When** scrolling below the agent card
**Then** a "Similar Properties" section appears with a horizontal carousel of PropertyCards

**Given** similar properties
**When** generated
**Then** they are selected based on: same area + similar price range + similar type (prioritized in that order)

**Given** a listing in a specific area
**When** the detail page renders
**Then** area context is shown: area name with link to area guide, nearby listings count

**Given** any page with navigation hierarchy
**When** rendered
**Then** breadcrumbs show the path (e.g., Home > Pérez Zeledón > Properties > [Title]) (AR14)

**Given** mobile viewport
**When** similar properties render
**Then** they display as a horizontal swipe carousel (UX-DR31)

**And** similar properties carousel uses the same PropertyCard component from Epic 3
