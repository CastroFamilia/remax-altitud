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

### Phase 1: Analysis

| Step | Status | Description |
|------|--------|-------------|
| Brainstorm Project | ✅ Done | 51+ feature ideas generated across 8 themes |
| Market Research | ⬜ Optional | Competitive analysis and market landscape |
| Domain Research | ⬜ Optional | Real estate industry deep dive |
| Technical Research | ⬜ Optional | Architecture and technology feasibility |
| Create Brief | ⬜ Pending | Product brief from brainstorming results |

### Phase 2: Planning

| Step | Status | Description |
|------|--------|-------------|
| Create PRD | ⬜ Required | Product Requirements Document |
| Validate PRD | ⬜ Optional | PRD quality validation |
| Create UX | ⬜ Optional | UX design specifications |

### Phase 3: Solutioning

| Step | Status | Description |
|------|--------|-------------|
| Create Architecture | ⬜ Required | Technical architecture decisions |
| Create Epics & Stories | ⬜ Required | Breakdown into epics and user stories |
| Check Readiness | ⬜ Required | Implementation readiness validation |

### Phase 4: Implementation

| Step | Status | Description |
|------|--------|-------------|
| Sprint Planning | ⬜ Required | Sprint plan for development |
| Create Story | ⬜ Required | Individual story preparation |
| Dev Story | ⬜ Required | Story implementation |
| Code Review | ⬜ Optional | Code quality review |

## Data Sources

| Endpoint | Description |
|----------|-------------|
| `AgentsPerOffice/{GUID}` | Agent profiles (name, photo, phone, email, language) |
| `PropertiesPerOffice/{GUID}` | Listings (bilingual, GPS, amenities, images, pricing) |

API docs: [`docs/`](docs/)

## Tech Stack

- **Data sync**: Background job pulling from RE/MAX CCA JSON API
- **Translation**: AI-powered translation to 6 languages
- **SEO**: Static page generation, daily regeneration after sync
- **Frontend**: Mobile-first responsive design

## Key Documents

| Document | Location |
|----------|----------|
| Brainstorming Session | [`_bmad-output/brainstorming/`](_bmad-output/brainstorming/) |
| API Documentation | [`docs/`](docs/) |

## Next Step

→ Create **Product Brief** via `bmad-bmm-create-product-brief`
