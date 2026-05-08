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

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript, Turbopack)
- **UI Primitives**: shadcn/ui (Radix-based, copy-pasted, fully owned)
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme` directives)
- **i18n**: next-intl (EN/ES MVP, per-route locale loading)
- **Database**: PostgreSQL + PostGIS (self-hosted via Coolify)
- **ORM**: Drizzle ORM (type-safe SQL, PostGIS support, git-based migrations)
- **Maps**: Mapbox GL JS + react-map-gl (3D terrain, clustering via Supercluster, interactive price-bubble pins)
- **State**: Zustand (lightweight client-side state for search filters, shortlists)
- **Validation**: Zod (API schemas, form validation, type-safe parsing)
- **Translation**: DeepL API with domain-specific glossary + GPT-4 for creative/SEO
- **Images**: Sharp (server-side optimization) + Next.js `next/image` (WebP, LQIP)
- **Error Monitoring**: Sentry (client, server, edge)
- **Analytics**: GA4 consent mode
- **Hosting**: Coolify (Docker, self-hosted)
- **CI/CD**: GitHub Actions + Coolify auto-deploy + Lighthouse CI (score ≥ 90 gate)
- **Testing**: Vitest + Testing Library (component & integration tests)
- **Data sync**: Docker Cron → RE/MAX CCA API → validate → translate → optimize → PostgreSQL → ISR revalidation

## Getting Started (Local Development)

Follow these steps to run the project on your machine. No prior experience with Next.js is required — just follow along.

### Prerequisites

Make sure you have the following installed before continuing:

| Tool | Minimum Version | How to install |
|------|-----------------|----------------|
| **Node.js** | v20+ | [nodejs.org](https://nodejs.org/) or via [nvm](https://github.com/nvm-sh/nvm) |
| **npm** | v10+ | Comes bundled with Node.js |
| **Git** | any recent | [git-scm.com](https://git-scm.com/) |
| **Docker** | any recent | [docker.com/get-started](https://www.docker.com/get-started/) (needed for the local database) |

> [!TIP]
> On macOS you can install Node.js with [Homebrew](https://brew.sh/): `brew install node`

### Step 1 — Clone the repository

```bash
git clone https://github.com/CastroFamilia/remax-altitud.git
cd remax-altitud
```

### Step 2 — Install dependencies

```bash
npm install
```

This reads `package.json` and downloads all required libraries into the `node_modules/` folder. It may take a minute or two the first time.

### Step 3 — Create your environment file

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and fill in **at minimum** the database connection string:

```dotenv
# Local database (matches docker-compose.dev.yml defaults)
DATABASE_URL=postgresql://remax:remax@localhost:5432/remax_altitud
```

The other variables (API keys, Mapbox token, Sentry, etc.) are optional for basic local development — features that depend on them will gracefully degrade.

### Step 4 — Start the local database

The project uses **PostgreSQL + PostGIS**. A ready-made Docker Compose file is included:

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts a PostgreSQL 16 container with PostGIS on port `5432`. You can verify it's running with:

```bash
docker ps
```

You should see a container named `remax-altitud-postgres` with status **healthy**.

> [!NOTE]
> If port 5432 is already in use by another Postgres instance, stop that service first or change the port mapping in `docker-compose.dev.yml`.

### Step 5 — Run database migrations

Push the schema to your fresh database:

```bash
npm run db:push
```

This uses Drizzle ORM to synchronize the database schema with the TypeScript definitions in the project.

### Step 6 — Start the development server

```bash
npm run dev
```

The app will start on **http://localhost:3000** with Turbopack for fast hot-reload. Open that URL in your browser — you should see the RE/MAX Altitud site.

> [!TIP]
> The dev server watches for file changes. Edit any file in `src/` and the browser will update automatically.

### Quick Reference — All Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migration files |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run sync` | Run the RE/MAX data sync pipeline |
| `npm run sync:dry-run` | Preview sync without writing to DB |

### Troubleshooting

<details>
<summary><strong>npm install fails with permission errors</strong></summary>

Don't use `sudo npm install`. Instead, fix your npm permissions or use [nvm](https://github.com/nvm-sh/nvm) to manage Node.js installations.
</details>

<details>
<summary><strong>Port 3000 is already in use</strong></summary>

Another app is using port 3000. Either stop that app, or start the dev server on a different port:

```bash
npm run dev -- --port 3001
```
</details>

<details>
<summary><strong>Docker Compose fails to start</strong></summary>

- Make sure Docker Desktop is running.
- Check if port 5432 is already used: `lsof -i :5432`.
- If another Postgres is running, stop it first: `brew services stop postgresql` (Homebrew) or stop it via Docker Desktop.
</details>

<details>
<summary><strong>Database connection errors</strong></summary>

- Verify your `.env.local` has the correct `DATABASE_URL`.
- Ensure the Docker container is running: `docker ps`.
- Test the connection: `docker exec -it remax-altitud-postgres psql -U remax -d remax_altitud -c '\dt'`.
</details>

---

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

→ **Implementation in progress** — Epics 1–4 complete, Epic 5 underway _(sprint snapshot: 2026-05-07)_

| Epic | Stories | FRs | Progress | Status |
|------|---------|-----|----------|--------|
| 1. Project Foundation & Design System | 7 | FR29–FR32, FR67, FR68 | 7 / 7 | ✅ Complete |
| 2. Data Pipeline & Property Database | 7 | FR46–FR55 | 7 / 7 | ✅ Complete |
| 3. Property Discovery & Search | 8 | FR1–FR16 | 8 / 8 | ✅ Complete |
| 4. Listing Detail & Agent Profiles | 5 | FR8, FR13, FR31, FR33–FR39, FR69 | 5 / 5 | ✅ Complete |
| 5. Seller Lead Capture | 3 | FR40–FR43, FR54 | 1 / 3 | 🚧 In progress |
| 6. Community Pages & Area Guides | 5 | FR17–FR21, FR44–FR45, FR50 | 0 / 5 | ⚪ Backlog |
| 7. Shortlist & Smart Agent Routing | 4 | FR22–FR28 | 0 / 4 | ⚪ Backlog |
| 8. Administration & Operations | 7 | FR56–FR66 | 0 / 7 | ⚪ Backlog |

**Implementation:** 28 / 46 stories done (61%) · **Planning:** 69/69 FRs (100%) with BDD acceptance criteria.

**Latest shipped:** Story 5.1 — Seller Landing Page & List With Us Form (seller lead capture page with form submission, image normalization, and gallery improvements).
**Next up:** Story 5.2 — CMA Request Form.

_Source of truth for day-to-day status lives in [`_bmad-output/implementation-artifacts/sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml)._
