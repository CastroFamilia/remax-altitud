---
type: product-brief
session_date: '2026-03-22'
input_documents:
  - '_bmad-output/brainstorming/brainstorming-session-2026-03-20-0905.md'
  - '_bmad-output/market-research/market-research-2026-03-22.md'
  - '_bmad-output/domain-research/domain-research-2026-03-22.md'
  - '_bmad-output/technical-research/technical-research-2026-03-22.md'
---

# Product Brief — RE/MAX Altitud Website

> **Version:** 1.0
> **Date:** 2026-03-22
> **Author:** BMAD Method (Analysis Phase)
> **Status:** Draft — Ready for Review

---

## 1. Product Vision

**RE/MAX Altitud is building a multilingual relocation gateway to Costa Rica's Southern Zone** — not just a property listings website, but an integrated ecosystem that connects property search, area guides, visa information, and cost-of-living tools with bilingual agents who speak the buyer's language.

### Why Now

- Costa Rica real estate shifting to a **buyer's market in 2026** — more inventory, more negotiation power, increased buyer interest
- **~40% of all CR transactions** involve international buyers — US, Canada, Europe, Brazil
- **No competitor** in the Costa Rica real estate space offers more than 2 languages, map-first search, or integrated relocation tools
- Costa Rica has **no centralized MLS** — an SEO-optimized, daily-refreshed website can become the authoritative source for listings in the Southern Zone
- The existing site is a static HTML prototype with placeholder data — a complete rebuild is required

### One-Line Pitch

> **The first 6-language, map-first real estate platform for Costa Rica's Southern Zone — where property search meets relocation guidance.**

---

## 2. Target Users

### Primary Personas

| Persona | Description | Primary Need | Language |
|---------|-------------|-------------|----------|
| 🇺🇸 **Maria** | American retiree, iPad, no Spanish | English UX, map search, area guides, relocation tools, WhatsApp | EN |
| 🇨🇷 **Carlos** | Local Costa Rican seller | Full Spanish UX, "Sell Your Property" CTA, agent trust, phone/WhatsApp | ES |
| 🇨🇷 **Andrés** | Costa Rican buyer, searching locally | Spanish UX, colón/USD pricing, local area knowledge, familiar neighborhoods | ES |
| 🇩🇪 **Hans** | German investor, analytical | Native language UX, investment filters, price/m², legal guides, property comparison | DE |
| 👩‍💼 **Sofia** | Agent considering joining RE/MAX | Professional agent profiles, visible SEO traffic, "Join Our Team" benefits | EN/ES |
| 🏢 **Laura** | Current RE/MAX Altitud agent | Her own professional profile page, her listings showcased, lead routing, WhatsApp integration | ES/EN |

### Additional Segments

- **European buyers** (IT, FR) — native language UX, metric units, EUR pricing
- **Brazilian/Portuguese buyers** — growing segment, investment-focused
- **Digital nomads** — area guides, cost calculator, lifestyle matching
- **Canadian snowbirds** — vacation rental potential, property management info

> **Note:** Costa Rican buyers (like Andrés) and current RE/MAX agents (like Laura) are core users — not secondary. The site must work equally well for the local market as for internationals, and must serve as a professional platform agents are proud to share with their clients.

---

## 3. Success Metrics

> These are **measurable targets**, not guarantees. Each metric is tied to specific product features and strategies that drive it. We track progress monthly and adjust tactics based on data.

| Metric | Target (6 mo.) | What Drives It | How Measured |
|--------|----------------|----------------|-------------|
| **Organic traffic** | 5,000+ sessions/mo | SEO-first architecture (ISR pages, hreflang, structured data, area content) | Google Analytics / PostHog |
| **Lead generation** | 50+ qualified leads/mo | WhatsApp CTAs on every listing/agent, contact forms, "Sell Your Property" CTA | Supabase leads table |
| **Search rankings** | Top 5 for "Pérez Zeledón real estate" + 10 area keywords | Daily-refreshed listing pages, canonical area URLs, localized content | Google Search Console |
| **Non-EN/ES traffic** | 15%+ of sessions | 6-language AI translation, localized SEO with hreflang, locale-specific meta tags | Analytics locale data |
| **Mobile performance** | LCP <2.5s, CLS <0.1 | Next.js Server Components, image optimization, Tailwind utility CSS | Vercel Analytics |
| **Agent inquiries** | 50% of leads via WhatsApp | One-click WhatsApp with pre-populated message on every listing and agent page | UTM tracking |
| **Page views / session** | 3+ average | Lifestyle tags, area guides, "similar properties" links, cross-linking between listings and areas | Analytics |

---

## 4. Core Value Propositions

### For Buyers (International)

1. **Search in your language** — 6-language UI with localized units (acres/m², °F/°C, USD/EUR)
2. **Find properties visually** — map-first search with interactive pins, draw-on-map, 3D terrain
3. **Understand the area** — lifestyle-based discovery, area comparison tools, climate and distance info
4. **Navigate the process** — buying guides, due diligence checklists, visa pathways, cost calculators
5. **Connect instantly** — WhatsApp one-click to an agent who speaks your language

### For Sellers (Local)

1. **Full Spanish experience** — complete UX in native language
2. **Credible brand** — RE/MAX global recognition + agent expertise signals
3. **Easy contact** — "Sell Your Property" CTA, phone, WhatsApp

### For RE/MAX (Business)

1. **Lead machine** — every interaction captures leads with agent auto-assignment
2. **SEO dominance** — daily-regenerated static pages filling the no-MLS vacuum
3. **Recruitment** — professional "Join Our Team" portal showcasing technology and brand
4. **Competitive moat** — first mover in 6-language, relocation-focused real estate in CR

---

## 5. Feature Scope — MVP (Phase 1)

### 5.1 Search & Discovery

| Feature | Description | Priority |
|---------|-------------|----------|
| **Map-first search** | Interactive Mapbox map with property pins, clustering, 3D terrain | Must-have |
| **Pin preview cards** | Click pin → photo + price + beds/baths + area | Must-have |
| **Lifestyle search tags** | "Beach Life", "Mountain Views", "Investment Property", "Retirement Paradise" | Must-have |
| **Smart presets** | "Beach homes under $300K", "Land in Pérez Zeledón" | Must-have |
| **Filters** | Price, type, beds, baths, area, lot size + lifestyle tags | Must-have |
| **Area-first hierarchy** | Browse by area (PZ, Dominical, Uvita) → then filter | Must-have |
| **Infinite scroll** | No pagination — "load more" or continuous scroll | Must-have |

### 5.2 Listing Experience

| Feature | Description | Priority |
|---------|-------------|----------|
| **Gallery-first layout** | Hero-size images, swipeable photo gallery | Must-have |
| **Unified media gallery** | Photos + video + drone footage in one carousel | Must-have |
| **Listing + area context** | Each listing includes a mini-guide about the neighborhood | Must-have |
| **Contextual sizing** | "14,757 m² (about 3.6 acres)" — localized to user's units | Must-have |
| **ZMT status indicator** | Clear labeling: "Titled Property" vs "ZMT Concession" | Must-have |
| **Lifestyle match labels** | "Great for: retirees, remote workers, families" | Should-have |

### 5.3 Internationalization

| Feature | Description | Priority |
|---------|-------------|----------|
| **6 languages** | EN, ES (from API) + AI-translated IT, DE, FR, PT | Must-have (EN/ES MVP, 4 more Phase 1.5) |
| **Auto-detect language** | Browser locale detection with manual override | Must-have |
| **Multi-currency display** | USD default + EUR, GBP, CAD, BRL based on locale | Must-have |
| **Localized units** | Acres/sqft (US) vs m²/hectares (metric) | Must-have |
| **Localized SEO** | hreflang tags, translated meta tags, language-specific sitemaps | Must-have |

### 5.4 Agent Profiles

| Feature | Description | Priority |
|---------|-------------|----------|
| **Unified agent page** | Profile + listings + contact on one page | Must-have |
| **Agent language filter** | Filter agents by language spoken | Must-have |
| **Specialization badges** | "Beach Expert", "Land Specialist", "Speaks 3 Languages" | Should-have |
| **WhatsApp integration** | One-click WhatsApp with pre-populated message | Must-have |

### 5.5 Lead Capture

| Feature | Description | Priority |
|---------|-------------|----------|
| **WhatsApp CTAs** | Per-listing and per-agent WhatsApp buttons | Must-have |
| **Contact forms** | Property inquiry + general contact forms | Must-have |
| **"Sell Your Property" form** | Seller lead capture CTA | Must-have |
| **Lead storage** | All leads captured in Supabase with source tracking | Must-have |

### 5.6 SEO Architecture

| Feature | Description | Priority |
|---------|-------------|----------|
| **SSG + ISR pages** | Pre-rendered, daily-refreshed listing and area pages | Must-have |
| **Canonical area pages** | `/en/properties/perez-zeledon/`, `/en/properties/uvita/` | Must-have |
| **Structured data** | JSON-LD for RealEstateListing, LocalBusiness, BreadcrumbList | Must-have |
| **OpenGraph + social cards** | Optimized sharing for WhatsApp, Facebook, Instagram | Must-have |
| **Localized sitemaps** | XML sitemaps with hreflang for all 6 languages | Must-have |

### 5.7 Static Pages

| Page | Description | Priority |
|------|-------------|----------|
| **Homepage** | Hero, featured listings, area showcase, CTA | Must-have |
| **About / Offices** | 2 offices, team, RE/MAX brand story | Must-have |
| **Services** | Buying, selling, relocation services overview | Must-have |
| **Contact** | General contact + office-specific contact | Must-have |
| **Join Our Team** | Agent recruitment portal with benefits showcase | Must-have |
| **Area Guides** | Pérez Zeledón, Dominical, Uvita — lifestyle, climate, amenities | Must-have |

---

## 6. Feature Scope — Phase 2

| Feature | Description |
|---------|-------------|
| **Additional 4 languages** | IT, DE, FR, PT fully rolled out with SEO | 
| **Smart unit localization** | Full auto-conversion for measurements, currency, temperature |
| **Relocation Hub** | "Move to Costa Rica" — visa guides, cost calculator, area comparison |
| **Property comparison** | Side-by-side 2-3 listings with key metrics |
| **Blog/CMS** | "Costa Rica Living" content hub for SEO + buyer education |
| **Saved searches + alerts** | Email/WhatsApp notifications for matching new listings |
| **Agent recruitment portal** | Full "Join Our Team" with benefits, training, tools breakdown |
| **Investment landing page** | Dedicated investor experience with ROI data and rental yields |

---

## 7. Feature Scope — Phase 3+

| Feature | Description |
|---------|-------------|
| **Questionnaire matching** | "Tell us your dream → We match you" guided experience |
| **Seller portal** | "What's my property worth?" valuation lead gen |
| **Social sharing cards** | Deep-linked, visually rich cards for WhatsApp/Facebook/Instagram |
| **"Similar Properties"** | Recommendation engine based on current listing |
| **AI Concierge chatbot** | Multilingual property matching + relocation Q&A (north star) |
| **Draw-on-map search** | User draws a polygon to define search area |

---

## 8. Technical Architecture Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 15 (App Router, React 19) | SSG + ISR for SEO, Server Components for performance |
| **Language** | TypeScript | Type safety, developer experience |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first, accessible components, full customization |
| **i18n** | next-intl | App Router native, type-safe, server component support |
| **Database** | Supabase (PostgreSQL + PostGIS) | Geospatial queries, auth, storage, real-time |
| **ORM** | Drizzle ORM | Type-safe, lightweight, PostGIS support |
| **Maps** | Mapbox GL JS (react-map-gl) | 5x free tier vs Google, custom styles, 3D terrain, draw controls |
| **Translation** | DeepL API Pro + GPT-4 | DeepL for accuracy, GPT-4 for creative/SEO content |
| **Hosting** | Vercel (Pro plan) | Native Next.js deployment, Edge CDN, ISR, Cron Jobs |
| **Monitoring** | Sentry + Vercel Analytics + PostHog | Errors, performance, user behavior |
| **Communication** | WhatsApp Business API links | Primary contact channel in Costa Rica |

### Data Pipeline

```
RE/MAX CCA API  →  Vercel Cron (6 AM daily)  →  Parse + Diff  →  Translate (DeepL/GPT)  →  Supabase  →  ISR Revalidation
```

### Rendering Strategy

- **SSG**: About, Contact, Join Team, Services, Area Guides
- **ISR**: Property listings, Agent profiles, Search results (on-demand revalidation after sync)
- **CSR**: Interactive map, filters, comparison tool, chatbot (future)

### Estimated Cost: ~$55–70/month (MVP)

---

## 9. Key Competitive Differentiators

| # | Differentiator | Competitor Status |
|---|---------------|-------------------|
| 1 | **6-language AI translation** | No CR competitor offers >2 languages |
| 2 | **Map-first search with 3D terrain** | Most use basic list/grid views |
| 3 | **Integrated relocation tools** | No competitor combines property search + visa + cost-of-living |
| 4 | **Lifestyle-based discovery** | All competitors use traditional filter dropdowns |
| 5 | **Smart locale detection** | No auto-detection for currency, units, or language |
| 6 | **SEO-first daily regeneration** | No competitor has API-synced ISR pages |
| 7 | **Dual-market positioning** | Mountain (PZ) + Coast (Dominical/Uvita) in one brand |
| 8 | **Agent-language matching** | No competitor enables filtering agents by language spoken |
| 9 | **ZMT/land classification clarity** | Competitors rarely surface legal property status |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **RE/MAX CCA API dependency** | No data sync if API is down | Graceful degradation: serve cached ISR pages; retry logic; accepted risk |
| **AI translation quality** | Misinformation for legal/financial content | Curated glossary (DeepL); human review for legal content; disclaimers |
| **6-language SEO complexity** | Indexing issues, duplicate content | Strict hreflang; automated sitemaps; Search Console monitoring |
| **Regional competitors** | Deeper local SEO presence | Long-tail keyword strategy; area-specific content; daily refresh advantage |
| **Vercel function timeouts** | Sync job failure | Vercel Pro (300s); batch processing; Inngest fallback for large syncs |
| **Mapbox cost at scale** | Budget overrun beyond 50K loads | Monitor usage; tile caching; Google Maps fallback option |
| **Multi-currency accuracy** | Incorrect pricing display | Reliable exchange rate API; "approximate" disclaimers; USD as source of truth |

---

## 11. Constraints & Assumptions

### Constraints

- **2 offices only** — both use the RE/MAX CCA API with separate GUIDs
- **API is the single data source** — no manual listing entry for MVP
- **No existing user accounts** — lead capture only, no buyer login for MVP
- **RE/MAX branding guidelines** — must adhere to global brand standards (balloon logo, colors)
- **Budget target** — ~$55–70/month operational costs
- **Vercel Pro required** — for 300s function timeout (sync pipeline)

### Assumptions

- RE/MAX CCA API will remain stable and accessible with current endpoints
- API data includes GPS coordinates for all listings (required for map search)
- Azure CDN property images can be downloaded and re-optimized
- DeepL API quality is sufficient for real estate listing translations
- The 6 target languages (EN, ES, IT, DE, FR, PT) cover the majority of the international buyer market
- Daily sync frequency is sufficient (no real-time listing needs)

---

## 12. Out of Scope (MVP)

- ❌ User registration / buyer accounts
- ❌ Mortgage calculator
- ❌ 3D virtual property tours
- ❌ CRM integration (HubSpot, Salesforce)
- ❌ Native mobile app
- ❌ AI chatbot
- ❌ Payment processing
- ❌ Manual listing entry / admin panel
- ❌ Property alerts / saved searches
- ❌ Blog/CMS

---

## 13. Recommended Next Steps

| Step | Command | Priority |
|------|---------|----------|
| 1. Review & approve this product brief | — | **Now** |
| 2. Create full PRD (detailed specs per feature) | `/bmad-bmm-create-prd` | Next |
| 3. Create UX design (wireframes, user flows) | `/bmad-bmm-create-ux-design` | Optional |
| 4. Create architecture document | `/bmad-bmm-create-architecture` | Required |
| 5. Create epics & stories for development | `/bmad-bmm-create-epics-and-stories` | Required |

---

> **This product brief synthesizes 4 research phases: brainstorming (51+ features), market research (competitive gaps), domain research (CR real estate specifics), and technical research (feasibility analysis). It defines the product scope, target users, differentiation, and constraints to guide the PRD and subsequent development phases.**
