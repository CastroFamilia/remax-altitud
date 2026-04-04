# RE/MAX Altitud Website

> A multilingual relocation gateway to Costa Rica — powered by the RE/MAX brand, SEO-friendly search, and interactive maps.

## Project Vision

A complete real estate website for **RE/MAX Altitud** (2 offices in Costa Rica) featuring:

- 🔍 **Effortless property search** — lifestyle tags, map-first browsing, smart presets
- 🌐 **6 languages** — EN, ES, IT, DE, FR, PT via AI translation
- 📍 **Pérez Zeledón & Dominical/Uvita** focus with global buyer reach
- 🌴 **"Move to Costa Rica" relocation hub** — visa guides, cost calculators, area info
- 📈 **SEO-first architecture** — daily-regenerated static pages from API data
- 👤 **Agent profiles** — multilingual mini-sites with WhatsApp integration
- 🔄 **Background sync** — daily import from RE/MAX CCA API → AI translate → optimize → DB

## BMAD Method Progress

The project follows the **[BMad Method](https://github.com/bmadcode/BMAD-METHOD)** for structured product development.

### Phase 1: Analysis ✅

| Step | Status | Description |
|------|--------|-------------|
| Brainstorm Project<br>`/bmad-brainstorming` | ✅ Done | 51+ feature ideas generated across 8 themes |
| Market Research<br>`/bmad-bmm-market-research` | ✅ Done | Competitive analysis and market landscape |
| Domain Research<br>`/bmad-bmm-domain-research` | ✅ Done | Real estate industry deep dive |
| Technical Research<br>`/bmad-bmm-technical-research` | ✅ Done | Architecture and technology feasibility |
| Create Brief<br>`/bmad-bmm-create-product-brief` | ✅ Done | Product brief synthesizing all research phases |

### Phase 2: Planning ✅

| Step | Status | Description |
|------|--------|-------------|
| Create PRD<br>`/bmad-bmm-create-prd` | ✅ Done | 50 FRs, 30 NFRs, 8 user journeys |
| Validate PRD<br>`/bmad-bmm-validate-prd` | ✅ Done | 12-step validation — 5/5 Excellent, 0 warnings |
| Create UX<br>`/bmad-bmm-create-ux-design` | ✅ Done | 14/14 steps — ~2,590 lines. Personas, journeys, component specs, patterns, responsive strategy, accessibility audit |

### Phase 3: Solutioning

| Step | Status | Description |
|------|--------|-------------|
| Create Architecture<br>`/bmad-bmm-create-architecture` | ⬜ **Next** | Technical architecture decisions |
| Create Epics & Stories<br>`/bmad-bmm-create-epics-and-stories` | ⬜ Required | Breakdown into epics and user stories |
| Check Readiness<br>`/bmad-bmm-check-implementation-readiness` | ⬜ Required | Implementation readiness validation |

### Phase 4: Implementation

| Step | Status | Description |
|------|--------|-------------|
| Sprint Planning<br>`/bmad-bmm-sprint-planning` | ⬜ Required | Sprint plan for development |
| Create Story<br>`/bmad-bmm-create-story` | ⬜ Required | Individual story preparation |
| Dev Story<br>`/bmad-bmm-dev-story` | ⬜ Required | Story implementation |
| Code Review<br>`/bmad-bmm-code-review` | ⬜ Optional | Code quality review |

## UX Design Highlights

The completed UX specification covers:

- **5 personas** — Maria (international buyer), Carlos (seller), Hans (investor), Andrés (local buyer), Community Discovery
- **5 user journeys** with smart agent routing and ♡ shortlist system
- **18 shadcn/ui primitives** + **18 custom components** with full specs
- **Split-hero gateway** — dual-pane mountain/coast entry point
- **Map-first search** — Mapbox GL with 3D terrain, price-bubble pins, pull-up sheet
- **WhatsApp-first contact** — pre-populated messages, zero typing
- **Smart agent routing** — auto-assigns agent based on shortlist, educates buyers
- **WCAG 2.1 AA** — contrast audit, keyboard nav, screen reader ARIA, reduced motion
- **$150 Android target** — < 2.5s LCP, < 150KB app JS, CSS scroll-snap

## Data Sources

| Endpoint | Description |
|----------|-------------|
| `AgentsPerOffice/{GUID}` | Agent profiles (name, photo, phone, email, language) |
| `PropertiesPerOffice/{GUID}` | Listings (bilingual, GPS, amenities, images, pricing) |

API docs: [`docs/`](docs/)

## Tech Stack (Planned)

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **UI Primitives**: shadcn/ui (Radix-based, copy-pasted, fully owned)
- **Styling**: Tailwind CSS v4 (design tokens via CSS custom properties)
- **i18n**: next-intl (EN/ES MVP, per-route locale loading)
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Maps**: Mapbox GL JS (3D terrain, clustering, interactive price-bubble pins)
- **Translation**: DeepL API with domain-specific glossary
- **Images**: Vercel Image Optimization via `next/image` (WebP, LQIP)
- **Analytics**: Vercel Analytics (cookieless) + GA4 consent mode
- **Hosting**: Vercel (edge CDN, ISR, serverless functions)
- **CI/CD**: Vercel auto-deploy + Lighthouse CI (score ≥ 90 gate)
- **Data sync**: Vercel Cron → RE/MAX CCA API → validate → translate → optimize → Supabase → ISR revalidation

## Key Documents

| Document | Location |
|----------|----------|
| **BMAD Progress Tracker** | [`_bmad-output/bmad-progress.md`](_bmad-output/bmad-progress.md) |
| **Product Requirements Document** | [`_bmad-output/planning-artifacts/prd.md`](_bmad-output/planning-artifacts/prd.md) |
| **PRD Validation Report** | [`_bmad-output/planning-artifacts/prd-validation-report.md`](_bmad-output/planning-artifacts/prd-validation-report.md) |
| **UX Design Specification** | [`_bmad-output/planning-artifacts/ux-design-specification.md`](_bmad-output/planning-artifacts/ux-design-specification.md) |
| **Product Brief** | [`_bmad-output/product-brief/`](_bmad-output/product-brief/) |
| Brainstorming Session | [`_bmad-output/brainstorming/`](_bmad-output/brainstorming/) |
| Domain Research | [`_bmad-output/domain-research/`](_bmad-output/domain-research/) |
| Market Research | [`_bmad-output/market-research/`](_bmad-output/market-research/) |
| Technical Research | [`_bmad-output/technical-research/`](_bmad-output/technical-research/) |
| API Documentation | [`docs/`](docs/) |

## Next Step

→ **Create Architecture** via `/bmad-bmm-create-architecture` — database schema, API design, Supabase/PostGIS setup, Next.js route structure, and deployment strategy.
