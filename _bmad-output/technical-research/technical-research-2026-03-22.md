---
type: technical-research
session_date: '2026-03-22'
domain: 'RE/MAX Altitud Website'
focus_areas: ['framework selection', 'rendering strategy', 'internationalization', 'map search', 'AI translation', 'database', 'deployment', 'image optimization']
related_brainstorming: '_bmad-output/brainstorming/brainstorming-session-2026-03-20-0905.md'
related_market_research: '_bmad-output/market-research/market-research-2026-03-22.md'
related_domain_research: '_bmad-output/domain-research/domain-research-2026-03-22.md'
---

# Technical Research — RE/MAX Altitud

**Date:** 2026-03-22
**Purpose:** Architecture and technology feasibility analysis for the RE/MAX Altitud website rebuild

---

## 1. Current State Assessment

### Existing Codebase

| Aspect | Current State |
|--------|--------------|
| **Architecture** | Static HTML/CSS/JS — no framework, no build system |
| **Pages** | `index.html`, `contact.html`, `services.html`, `join-team.html` |
| **Styling** | Vanilla CSS (`index.css`, 23KB) with CSS variables, Montserrat font, FontAwesome |
| **JS** | Single `main.js` (15KB) — AI chat simulator, search toggle, area unit toggles |
| **Assets** | 2 hero images (PNG), icons via FontAwesome CDN |
| **i18n** | Hardcoded EN/ES toggle in nav — not functional |
| **API integration** | None — placeholder data only |
| **SEO** | Basic meta tags, no structured data, no sitemap |
| **Hosting** | Not deployed |

### Assessment

The current site is a **visual prototype** — useful for validating design direction but requires a complete rebuild for production. No code will be directly reusable beyond design patterns and CSS variables.

---

## 2. Framework Selection: Next.js 15 (App Router)

### Why Next.js

| Requirement | How Next.js 15 Addresses It |
|------------|----------------------------|
| **SEO-first architecture** | SSG + ISR = pre-rendered HTML, fast TTI, excellent indexability |
| **6-language support** | App Router with `[locale]` routing + `next-intl` |
| **Daily data refresh** | ISR with on-demand revalidation triggered by Vercel Cron |
| **Map-first search** | Client components for interactive map, server components for listing data |
| **Mobile-first** | React 19 + Server Components = minimal client JS bundle |
| **Performance** | Turbopack (stable), automatic code splitting, image optimization |

### Rendering Strategy (Hybrid)

```
┌─────────────────────────────────────────────────────────┐
│                    RENDERING STRATEGY                    │
├──────────────────┬──────────────────────────────────────┤
│ SSG (Build Time) │ About, Contact, Join Team, Services  │
│                  │ Area guides, Visa guides, Blog posts │
├──────────────────┼──────────────────────────────────────┤
│ ISR (Revalidate) │ Property listing pages               │
│                  │ Agent profiles                       │
│                  │ Search results / category pages      │
│                  │ Revalidation: on-demand after sync   │
├──────────────────┼──────────────────────────────────────┤
│ SSR (Per-request)│ Saved searches (authenticated)       │
│                  │ User dashboard (future)              │
├──────────────────┼──────────────────────────────────────┤
│ CSR (Client-side)│ Interactive map search               │
│                  │ Property comparison tool              │
│                  │ AI chatbot widget                    │
│                  │ Search filters / real-time UI        │
└──────────────────┴──────────────────────────────────────┘
```

### Key Next.js 15 Features

- **React 19 Server Components** — reduced client bundle, faster loads
- **Revised caching** — explicit opt-in gives granular control over data freshness
- **Turbopack** — 10x faster dev server startup
- **Parallel static generation** — fast builds even with thousands of pages
- **`generateStaticParams`** — pre-render pages per locale × listings at build time
- **Metadata API** — dynamic `<title>`, `<meta>`, `hreflang`, OpenGraph per page

### Verdict: ✅ Next.js 15 with App Router

Best-in-class for SEO-first, multilingual, hybrid-rendered real estate site.

---

## 3. Internationalization: `next-intl`

### Library Comparison

| Feature | next-intl | i18next + react-i18next |
|---------|-----------|------------------------|
| **App Router native** | ✅ Built for it | ❌ Requires manual setup + `next-i18n-router` |
| **Server Components** | ✅ First-class | ⚠️ Possible but complex |
| **Type safety** | ✅ Autocompletion + compile-time checks | ❌ No built-in |
| **Bundle size** | ✅ Loads translations per route on server | ⚠️ Risk of loading all translations |
| **hreflang support** | ✅ Via Metadata API + sitemap integration | ✅ Manual via Metadata API |
| **Date/Number formatting** | ✅ Built-in | ⚠️ Requires extra config |
| **Learning curve** | ✅ Minimal, intuitive API | ⚠️ More complex setup |
| **Maturity** | Growing rapidly | Very mature ecosystem |

### Implementation Approach

```
/app
  /[locale]           ← EN, ES, IT, DE, FR, PT
    /page.tsx          ← Homepage per locale
    /properties
      /[slug]/page.tsx ← Listing detail per locale
    /agents
      /[id]/page.tsx   ← Agent profile per locale
    /areas
      /[area]/page.tsx ← Area guide per locale
/messages
  /en.json             ← UI strings
  /es.json
  /it.json
  /de.json
  /fr.json
  /pt.json
```

### SEO for 6 Languages

- **URL structure**: Subdirectory (`/en/properties/`, `/es/propiedades/`)
- **hreflang tags**: Auto-generated via `generateMetadata` per page
- **Localized sitemaps**: One sitemap with `hreflang` annotations for all languages
- **Canonical tags**: Self-referencing canonical per locale page
- **Localized slugs**: Translated URL paths (`/properties/` → `/propiedades/`)

### Verdict: ✅ `next-intl`

Best choice for Next.js App Router — native integration, type-safe, performant, excellent SEO support.

---

## 4. Map Search: Mapbox GL JS

### Platform Comparison

| Feature | Google Maps JS API | Mapbox GL JS |
|---------|-------------------|--------------|
| **Free tier (2025)** | 10K map loads/mo (Essentials) | 50K map loads/mo |
| **Cost after free** | $7/1K loads | $5/1K loads |
| **Customization** | Limited styling | Full custom styles, 3D terrain |
| **Performance** | Good | Excellent (WebGL-based) |
| **Draw on map** | Via Drawing Library | Built-in draw controls |
| **Clustering** | Supported | Superior clustering engine |
| **3D terrain** | Limited | Native 3D terrain + buildings |
| **Offline/self-host** | ❌ | ❌ (v2+ proprietary) |
| **Brand familiarity** | Very high | Medium |
| **Pin preview cards** | Via InfoWindow | Custom popups (full control) |

### Why Mapbox for RE/MAX Altitud

1. **5x more free map loads** — critical for a new site with growing traffic
2. **Full design control** — custom map styles matching RE/MAX branding
3. **Superior clustering** — handles hundreds of property pins gracefully
4. **3D terrain** — show mountain/valley topography for Pérez Zeledón
5. **Custom popups** — property preview cards with photo, price, stats
6. **Draw-on-map search** — user draws an area to search within
7. **React integration** — `react-map-gl` provides excellent React bindings

### Map Search Architecture

```
┌─────────────────────────────────────────────┐
│              MAP SEARCH PAGE                 │
├──────────────────┬──────────────────────────┤
│   Map Panel      │   Results Panel          │
│   (Mapbox GL JS) │   (Server Component)     │
│                  │                          │
│   • Pin clusters │   • Property cards       │
│   • Draw region  │   • Filters sidebar      │
│   • Pin previews │   • Sort options          │
│   • Terrain view │   • Infinite scroll       │
│                  │   • Lifestyle tags        │
└──────────────────┴──────────────────────────┘
```

### Verdict: ✅ Mapbox GL JS

Better pricing, superior customization, and 3D terrain support for mountain/coast property visualization.

---

## 5. AI Translation Pipeline

### Strategy: Hybrid (DeepL API + GPT-4 Post-Processing)

| Content Type | Translation Method | Why |
|-------------|-------------------|-----|
| **Listing descriptions** | DeepL API Pro | Highest accuracy for formal real estate copy; glossary support for CR-specific terms |
| **UI strings** | DeepL API Pro | Consistent, high-quality UI text across 6 languages |
| **Legal content** (visa, buying guides) | DeepL + human review | Legal content requires professional accuracy |
| **Marketing copy** (area guides, blog) | GPT-4 with custom prompts | Better creative adaptation, tone matching per locale |
| **SEO metadata** (title, description) | GPT-4 with locale-specific prompts | Can optimize for search intent per language market |

### DeepL API Pricing (Pro)

| Tier | Cost |
|------|------|
| Starter | €5.49/mo + €25/1M chars |
| Advanced | €27.49/mo + €25/1M chars |
| Ultimate | €54.99/mo + €25/1M chars |

### Translation Pipeline Architecture

```
Daily Sync Job
  │
  ├── 1. Pull API data (EN + ES from RE/MAX CCA)
  │
  ├── 2. Detect changes (diff against stored data)
  │
  ├── 3. Translate changed content → IT, DE, FR, PT
  │   ├── Listings: DeepL API with RE/MAX glossary
  │   └── Area guides: GPT-4 with locale prompts
  │
  ├── 4. Store translations in DB
  │
  └── 5. Trigger ISR revalidation for affected pages
```

### Real Estate Glossary (DeepL Custom)

Pre-configured terminology to ensure translation consistency:

| English | Spanish | Note |
|---------|---------|------|
| Listing | Anuncio | Not "listado" |
| Closing costs | Costos de cierre | CR-specific |
| Down payment | Prima / Enganche | Regional variation |
| Concession (ZMT) | Concesión | Legal term |
| Titled property | Propiedad titulada | vs. concession |

### Verdict: ✅ DeepL API Pro (primary) + GPT-4 (creative/SEO content)

DeepL for accuracy + glossary; GPT-4 for creative adaptation and SEO metadata.

---

## 6. Database: Supabase (PostgreSQL)

### Platform Comparison

| Feature | Supabase | PlanetScale | Turso |
|---------|----------|-------------|-------|
| **Engine** | PostgreSQL | MySQL (Vitess) | SQLite (libSQL) |
| **Geo-spatial** | ✅ PostGIS extension | ❌ Limited | ❌ Limited |
| **Real-time** | ✅ Built-in subscriptions | ❌ | ❌ |
| **Auth** | ✅ Built-in | ❌ Separate service | ❌ Separate service |
| **Storage** | ✅ Object storage for images | ❌ | ❌ |
| **Edge functions** | ✅ Deno-based | ❌ | ❌ |
| **Free tier** | 500MB DB, 1GB storage | 5GB | 9GB |
| **Full-text search** | ✅ via `tsvector` | ✅ | ⚠️ Limited |
| **JSON support** | ✅ JSONB | ✅ JSON | ⚠️ |
| **REST/GraphQL API** | ✅ Auto-generated | ❌ | ❌ |

### Why Supabase for RE/MAX Altitud

1. **PostGIS** — geospatial queries for map search (distance, bounding box, polygon)
2. **Built-in auth** — agent portal, saved searches, user preferences
3. **Object storage** — property images with CDN (supplement Azure CDN from API)
4. **Real-time** — future live updates for new listings matching saved searches
5. **Auto-generated REST API** — rapid development for CRUD operations
6. **Full-text search** — multi-language property search via `tsvector`
7. **Edge functions** — background processing, webhooks
8. **Open source** — no vendor lock-in, self-hostable if needed

### Database Schema (Core)

```sql
-- Properties (synced from RE/MAX CCA API)
properties (id, api_id, office_id, type, status, price, currency,
            bedrooms, bathrooms, lot_size_m2, construction_m2,
            latitude, longitude, geo GEOGRAPHY(Point, 4326),
            amenities JSONB, images JSONB,
            title_en, title_es, description_en, description_es,
            -- AI-translated fields
            title_it, title_de, title_fr, title_pt,
            description_it, description_de, description_fr, description_pt,
            lifestyle_tags TEXT[], area_slug, zmt_status,
            synced_at, created_at, updated_at)

-- Agents (synced from RE/MAX CCA API)
agents (id, api_id, office_id, name, photo_url, email, phone,
        whatsapp, languages TEXT[], specializations TEXT[],
        bio_en, bio_es, bio_it, bio_de, bio_fr, bio_pt,
        synced_at, created_at, updated_at)

-- Offices
offices (id, api_guid, name, area, phone, email, address,
         latitude, longitude)

-- Leads (captured from chatbot, forms, WhatsApp CTAs)
leads (id, name, email, phone, source, intent, language,
       assigned_agent_id, property_id, notes, created_at)
```

### Verdict: ✅ Supabase

Best "batteries-included" choice — PostGIS for map search, auth, storage, real-time, and open-source.

---

## 7. Daily Sync Pipeline (Vercel Cron + API)

### Architecture

```
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│ Vercel Cron  │───▶│ /api/sync      │───▶│ RE/MAX CCA   │
│ (0 6 * * *)  │    │ (Background)   │    │ API (JSON)   │
└──────────────┘    └───────┬────────┘    └──────────────┘
                            │
                    ┌───────▼────────┐
                    │ Process Data   │
                    ├────────────────┤
                    │ 1. Parse JSON  │
                    │ 2. Diff changes│
                    │ 3. Optimize    │
                    │    images      │
                    │ 4. Translate   │
                    │    (DeepL/GPT) │
                    │ 5. Upsert DB   │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │ Revalidate ISR │
                    │ revalidateTag  │
                    │ ('properties') │
                    │ ('agents')     │
                    └────────────────┘
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Sync Logic

1. **Fetch** — Pull `AgentsPerOffice/{GUID}` and `PropertiesPerOffice/{GUID}` for both offices
2. **Diff** — Compare API data against DB to identify new, updated, and removed listings
3. **Translate** — Send only changed content to DeepL/GPT for 4 additional languages
4. **Optimize** — Download new images from Azure CDN, optimize via Next.js Image, store references
5. **Upsert** — Insert/update records in Supabase
6. **Revalidate** — Call `revalidateTag('properties')` and `revalidateTag('agents')` to invalidate cached pages
7. **Log** — Record sync results (added, updated, removed counts)

### Execution Time Considerations

- Vercel Hobby: 10s function timeout (may be insufficient)
- Vercel Pro: 300s function timeout ✅
- Alternative: Use Inngest for durable background functions if sync exceeds limits
- Fallback: Run sync on external service (GitHub Actions, Railway) and hit revalidation webhook

### Verdict: ✅ Vercel Cron + ISR Revalidation

Clean integration with Next.js deployment. Requires **Vercel Pro** plan for extended function timeouts.

---

## 8. Image Optimization Strategy

### Pipeline

```
Azure CDN (API source) → Download → Sharp (resize/compress) → Supabase Storage → Next.js <Image>
```

### Next.js Image Component Benefits

- **Automatic format** — WebP/AVIF based on browser support
- **Responsive sizes** — `srcSet` for mobile/tablet/desktop
- **Lazy loading** — native lazy loading with blur placeholder
- **CDN delivery** — Vercel Edge Network caches optimized images

### Image Sizes for Real Estate

| Context | Sizes | Format |
|---------|-------|--------|
| **Hero/Gallery** | 1200×800, 800×533, 600×400 | WebP + AVIF fallback |
| **Card thumbnail** | 400×267 | WebP |
| **Map pin preview** | 200×133 | WebP |
| **Agent photo** | 300×300, 150×150 | WebP |
| **OG/Social card** | 1200×630 | JPEG (universal) |

### Blur Placeholder Strategy

Generate low-quality image placeholders (LQIP) during sync for instant skeleton loading via `blurDataURL`.

---

## 9. Deployment & Hosting: Vercel

### Why Vercel

| Feature | Benefit |
|---------|---------|
| **Next.js native** | Built by the same team — zero-config deployment |
| **Edge Network** | Global CDN for static assets and ISR pages |
| **ISR support** | First-class on-demand revalidation |
| **Cron Jobs** | Built-in scheduled functions |
| **Analytics** | Real User Monitoring, Web Vitals tracking |
| **Preview deployments** | Every PR gets a preview URL |
| **Environment variables** | Secure secret management |

### Vercel Pro Plan ($20/month)

Required for:
- 300s function execution timeout (sync job)
- Custom domains
- Advanced analytics
- Firewall & DDoS protection

### Domain Strategy

```
remaxaltitud.com          → Main site (all locales)
remaxaltitud.com/en/      → English
remaxaltitud.com/es/      → Spanish
remaxaltitud.com/de/      → German
remaxaltitud.com/it/      → Italian
remaxaltitud.com/fr/      → French
remaxaltitud.com/pt/      → Portuguese
```

---

## 10. Additional Technology Decisions

### ORM: Drizzle ORM

| Criteria | Decision |
|----------|----------|
| **Type safety** | ✅ Full TypeScript inference |
| **Performance** | Lightweight, minimal overhead |
| **Supabase compat** | ✅ PostgreSQL-native |
| **Migrations** | Git-based migration workflow |
| **PostGIS** | ✅ Supports spatial types |

### UI Component Library: shadcn/ui

| Criteria | Decision |
|----------|----------|
| **Approach** | Copy-paste components (not npm dependency) |
| **Styling** | Tailwind CSS + Radix primitives |
| **Customizable** | Full ownership of component code |
| **Accessible** | WAI-ARIA compliant via Radix |
| **Bundle** | Only ship what you use |

> **Note**: This means adopting Tailwind CSS for the new build, which provides utility-first styling consistent with shadcn/ui. The original vanilla CSS design tokens can inform the Tailwind config.

### Analytics & Monitoring

| Tool | Purpose |
|------|---------|
| **Vercel Analytics** | Core Web Vitals, page performance |
| **Google Search Console** | SEO indexing, search performance per locale |
| **PostHog** (or Plausible) | Privacy-friendly user analytics |
| **Sentry** | Error tracking, performance monitoring |

### WhatsApp Integration

- **WhatsApp Business API** — direct `wa.me/{number}` links per agent
- **Click-to-chat** — pre-populated message with property details + language
- **UTM tracking** — track WhatsApp conversions per listing/agent

---

## 11. Technology Stack Summary

```
┌──────────────────────────────────────────────────────────┐
│                    TECH STACK OVERVIEW                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Framework:    Next.js 15 (App Router, React 19)         │
│  Language:     TypeScript                                │
│  Styling:      Tailwind CSS + shadcn/ui                  │
│  i18n:         next-intl (6 languages)                   │
│  Database:     Supabase (PostgreSQL + PostGIS)           │
│  ORM:          Drizzle ORM                               │
│  Maps:         Mapbox GL JS (react-map-gl)               │
│  Translation:  DeepL API Pro + GPT-4                     │
│  Images:       Next.js Image + Supabase Storage          │
│  Deployment:   Vercel (Pro plan)                         │
│  Cron / Sync:  Vercel Cron Jobs                          │
│  Auth:         Supabase Auth                             │
│  Analytics:    Vercel + Google Search Console + PostHog   │
│  Monitoring:   Sentry                                    │
│  Communication: WhatsApp Business API                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 12. Cost Estimates (Monthly)

| Service | Plan | Est. Cost |
|---------|------|-----------|
| **Vercel** | Pro | $20/mo |
| **Supabase** | Pro | $25/mo |
| **Mapbox** | Free tier (50K loads) | $0 (initially) |
| **DeepL API** | Starter | ~€5.49/mo + usage |
| **OpenAI API** | Pay-as-you-go | ~$5–15/mo (translation volume) |
| **Domain** | remaxaltitud.com | ~$12/yr |
| **Sentry** | Free tier | $0 |
| **PostHog** | Free tier (1M events) | $0 |
| | **Total (MVP)** | **~$55–70/mo** |

---

## 13. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RE/MAX CCA API downtime | No new data sync | Graceful degradation — serve cached ISR pages; retry logic in sync job |
| Vercel function timeout | Sync fails for large updates | Batch processing; consider Inngest for durable background functions |
| Translation quality for legal terms | Misinformation risk | Curated glossary + human review for legal content (visa, ZMT, buying process) |
| Mapbox cost at scale | Budget overrun | Monitor usage; cache map tiles; consider Google Maps if Mapbox costs spike |
| 6-language SEO complexity | Indexing issues | Strict hreflang implementation; automated sitemap generation; regular Search Console audits |
| DeepL language support gaps | Missing language pairs | DeepL supports all 6 target languages (EN, ES, IT, DE, FR, PT) ✅ |
| Supabase PostGIS complexity | Slow geo queries | Proper spatial indexing (GiST); pagination; bounding box pre-filter |

---

## 14. Feasibility Conclusions

### ✅ All MVP features are technically feasible

| Feature | Feasibility | Confidence |
|---------|-------------|------------|
| Map-first search with pin previews | ✅ Proven pattern with Mapbox | High |
| 6-language AI translation | ✅ DeepL + GPT pipeline validated | High |
| SEO-first static pages (daily regen) | ✅ Next.js ISR + Vercel Cron | High |
| Lifestyle search tags | ✅ Tag-based filtering in PostgreSQL | High |
| Agent profiles with multilingual bios | ✅ Translation pipeline covers this | High |
| WhatsApp integration | ✅ Simple URL-based, no API needed for MVP | High |
| Lead capture | ✅ Supabase for storage, forms for capture | High |
| Mobile-first responsive design | ✅ Tailwind + Next.js Image optimization | High |
| Smart unit localization | ✅ Client-side conversion based on locale | High |
| Area comparison tool | ✅ Side-by-side component with DB data | Medium |
| AI chatbot (future) | ⚠️ Requires GPT integration + training data | Medium |

---

## Recommended Next Step

→ Create **Product Brief** via `/bmad-bmm-create-product-brief`, incorporating this technical feasibility analysis with the brainstorming, market research, and domain research results.
