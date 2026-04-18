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

## Project Tracking & Progress

This project is actively in the Implementation Phase. To see the live, day-to-day progress of development, check the sprint status files:
- 📊 **[Live Sprint Status](_bmad-output/implementation-artifacts/sprint-status.yaml)** (Source of truth for what is done, in-progress, and next)
- 📝 **[Epics & Stories](_bmad-output/planning-artifacts/epics.md)** (The complete feature backlog)

*Tip: To view a beautiful, human-readable summary of progress at any time, ask the AI to run the `@[/bmad-sprint-status]` workflow!*

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
| Create PRD<br>`/bmad-bmm-create-prd` | ✅ Done | 69 FRs, 30 NFRs, 8 user journeys |
| Validate PRD<br>`/bmad-bmm-validate-prd` | ✅ Done | 12-step validation — 5/5 Excellent, 0 warnings |
| Create UX<br>`/bmad-bmm-create-ux-design` | ✅ Done | 14/14 steps — ~2,590 lines. Personas, journeys, component specs, patterns, responsive strategy, accessibility audit |

### Phase 3: Solutioning ✅

| Step | Status | Description |
|------|--------|-------------|
| Create Architecture<br>`/bmad-bmm-create-architecture` | ✅ Done | 16 sections — system architecture, DB schema, sync pipeline, API design, i18n, frontend, SEO, security, ADRs |
| Create Epics & Stories<br>`/bmad-bmm-create-epics-and-stories` | ✅ Done | 8 epics, 38 stories, 69/69 FRs covered (100%) |
| Check Readiness<br>`/bmad-bmm-check-implementation-readiness` | ✅ Done | 6-step assessment passed — all 3 minor findings remediated |

### Phase 4: Implementation 🚀

| Step | Status | Description |
|------|--------|-------------|
| Sprint Planning<br>`/bmad-sprint-planning` | ✅ Done | Sprint plan generated & tracking active |
| Create Story<br>`/bmad-create-story` | 🔁 Ongoing | Individual story preparation |
| Dev Story<br>`/bmad-dev-story` | 🔁 Ongoing | Story implementation |
| Code Review<br>`/bmad-code-review` | 🔁 Ongoing | Code quality & security review |

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
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme` directives)
- **i18n**: next-intl (EN/ES MVP, per-route locale loading)
- **Database**: PostgreSQL + PostGIS (self-hosted via Coolify)
- **ORM**: Drizzle ORM (type-safe SQL, PostGIS support, git-based migrations)
- **Maps**: Mapbox GL JS (3D terrain, clustering, interactive price-bubble pins)
- **Translation**: DeepL API with domain-specific glossary + GPT-4 for creative/SEO
- **Images**: Next.js Image Optimization via `next/image` (WebP, LQIP)
- **Analytics**: GA4 consent mode
- **Hosting**: Coolify (Docker, self-hosted)
- **CI/CD**: GitHub Actions + Coolify auto-deploy + Lighthouse CI (score ≥ 90 gate)
- **Data sync**: Docker Cron → RE/MAX CCA API → validate → translate → optimize → PostgreSQL → ISR revalidation

## Key Documents

| Document | Location |
|----------|----------|
| **Product Requirements Document** | [`_bmad-output/planning-artifacts/prd.md`](_bmad-output/planning-artifacts/prd.md) |
| **PRD Validation Report** | [`_bmad-output/planning-artifacts/prd-validation-report.md`](_bmad-output/planning-artifacts/prd-validation-report.md) |
| **UX Design Specification** | [`_bmad-output/planning-artifacts/ux-design-specification.md`](_bmad-output/planning-artifacts/ux-design-specification.md) |
| **Architecture Document** | [`_bmad-output/planning-artifacts/architecture.md`](_bmad-output/planning-artifacts/architecture.md) |
| **Epics & Stories** | [`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md) |
| **Implementation Readiness Report** | [`_bmad-output/planning-artifacts/implementation-readiness-report.md`](_bmad-output/planning-artifacts/implementation-readiness-report.md) |
| Product Brief | [`_bmad-output/product-brief/`](_bmad-output/product-brief/) |
| Brainstorming Session | [`_bmad-output/brainstorming/`](_bmad-output/brainstorming/) |
| Domain Research | [`_bmad-output/domain-research/`](_bmad-output/domain-research/) |
| Market Research | [`_bmad-output/market-research/`](_bmad-output/market-research/) |
| Technical Research | [`_bmad-output/technical-research/`](_bmad-output/technical-research/) |
| API Documentation | [`docs/`](docs/) |

## Current Status

→ **Planning complete — ready for sprint planning & implementation**

| Epic | Stories | FRs | Status |
|------|---------|-----|--------|
| 1. Project Foundation & Design System | 7 stories | FR29–FR32, FR67, FR68 | ✅ Complete |
| 2. Data Pipeline & Property Database | 7 stories | FR46–FR55 | ✅ Complete |
| 3. Property Discovery & Search | 8 stories | FR1–FR16 | ✅ Complete |
| 4. Listing Detail & Agent Profiles | 5 stories | FR8, FR13, FR31, FR33–FR39, FR69 | ✅ Complete |
| 5. Seller Lead Capture | 3 stories | FR40–FR43, FR54 | ✅ Complete |
| 6. Community Pages & Area Guides | 3 stories | FR17–FR21, FR44–FR45, FR50 | ✅ Complete |
| 7. Shortlist & Smart Agent Routing | 2 stories | FR22–FR28 | ✅ Complete |
| 8. Administration & Operations | 7 stories | FR56–FR66 | ✅ Complete |

**Total: 38 stories** covering **69/69 FRs (100%)** with BDD acceptance criteria.
