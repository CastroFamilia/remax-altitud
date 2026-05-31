# Story 2.1: Database Schema & Drizzle Models

Status: done

## Story

As a **developer**,
I want type-safe Drizzle ORM models for properties, agents, areas, offices, and sync logs with PostGIS spatial indexing,
So that the data sync pipeline (Stories 2.2–2.7) and every downstream feature (search, listings, agents, admin) can store, query, and extend platform data reliably.

## Acceptance Criteria

1. **Given** PostgreSQL is running with PostGIS **When** the initial migration runs **Then** the `postgis` extension is enabled and the following tables are created: `offices`, `properties`, `agents`, `areas`, `sync_logs`.

2. **Given** the `properties` table **When** inspecting the schema **Then** it includes all fields listed in the [Properties Schema](#properties-schema) section below — covering identifiers, bilingual copy, pricing, specs, location (with PostGIS `geography(Point, 4326)`), ZMT status, lifestyle tags, JSONB fields (`amenities`, `images`, `api_raw`), FKs to `offices`/`areas`/`agents` (+ nullable `community_id` placeholder), visibility flags, and sync/diff metadata.

3. **Given** the `agents` table **When** inspecting the schema **Then** it includes all fields listed in the [Agents Schema](#agents-schema) section — bilingual bios, `languages`/`specializations` arrays, contact fields including a normalized WhatsApp number, `office_id` FK, denormalized `listing_count`, and sync timestamps. The `birthday` field, if added, is NOT included because API9 forbids exposing it publicly — defer to Story 2.2 where raw API parsing happens.

4. **Given** the `areas` table **When** inspecting the schema **Then** it includes all fields listed in the [Areas Schema](#areas-schema) — bilingual names/descriptions, `region` enum (`mountain`|`coast`), administrative fields (`province`, `canton`, `district`), hero image URL, coordinates, denormalized `property_count`, JSONB `metadata`, and `sort_order`.

5. **Given** the `offices` table **When** inspecting the schema **Then** it includes all fields listed in the [Offices Schema](#offices-schema), with `api_guid` as a unique text column matching the `PZ_OFFICE_GUID` / `DOM_OFFICE_GUID` env values; the migration seeds exactly two rows (Altitud PZ, Altitud Cero Dominical/Uvita) using those env values.

6. **Given** the `sync_logs` table **When** inspecting the schema **Then** it includes all fields listed in the [Sync Logs Schema](#sync-logs-schema) — with a `status` enum of `running`|`success`|`failed`|`partial`, count columns for fetched/created/updated/removed/agents_synced/translations_queued/images_optimized, `errors` JSONB array, optional `error_message`, and `office_guid` text.

7. **Given** PostGIS is enabled **When** a spatial query uses `properties.geo` **Then** a GiST index `idx_properties_geo` is used (verifiable via `EXPLAIN`).

8. **Given** search and filter workloads **When** the migration runs **Then** these indexes exist:
   - `idx_properties_geo` (GIST on `geo`)
   - `idx_properties_search` (composite: `is_visible`, `property_type`, `price_usd`, `area_slug`) **WHERE** `is_visible = true`
   - `idx_properties_tags` (GIN on `lifestyle_tags`)
   - `idx_properties_community` (`community_id`) **WHERE** `community_id IS NOT NULL`
   - `idx_agents_office` (`office_id`)
   - Unique indexes implicit from `UK` constraints on `slug` fields (properties, agents, areas, offices `api_guid`).

9. **Given** every schema file **When** importing from `@/lib/db/schema` **Then** each table exports both its Drizzle table object AND its row-type (`$inferSelect`) and insert-type (`$inferInsert`) TypeScript aliases, so downstream code never hand-rolls row types.

10. **Given** `drizzle-kit` is configured **When** `npm run db:generate` is run **Then** a migration SQL file is created in `src/lib/db/migrations/` that (a) creates the `postgis` extension, (b) creates the 5 tables, (c) creates the indexes in AC #8, and (d) seeds `offices` with the two env-driven rows. `npm run db:migrate` applies it against the running database without errors.

11. **Given** the dev workflow **When** running any of `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio` **Then** the scripts exist in `package.json` and execute against `DATABASE_URL` without arg-prompting (Story 1.1 declared these scripts but they were not actually added — this story closes the gap).

12. **Given** a fresh checkout **When** a reviewer runs `npm run db:migrate` against a PostgreSQL+PostGIS database **Then** the health check at `/api/health` still returns 200 AND a new spot-check script (or a simple Vitest unit test) can insert → select → delete a property row with a `geo` point without errors.

13. **Given** TypeScript strict mode **When** `npx tsc --noEmit` is run **Then** there are zero type errors introduced by the schema files.

14. **Given** the CI pipeline **When** the PR is pushed **Then** typecheck → lint → format check → build all pass (no regressions).

15. **And** all Drizzle models, types, and relations export cleanly from a single `src/lib/db/schema.ts` barrel (either by re-exporting per-entity files from `src/lib/db/schema/` or by keeping schema in `src/lib/db/schema.ts`) — the dev agent picks the structure; both are acceptable, but there must be ONE import path: `@/lib/db/schema`.

## Tasks / Subtasks

- [x] Task 1: Prepare local PostgreSQL+PostGIS dev database (AC: #1, #10)
  - [x] Document (in `docs/api/README.md` or new `docs/database/README.md`) how to run `postgres:16-postgis` via `docker compose` or plain `docker run` for local dev
  - [x] Add a `docker-compose.yml` at project root (or `docker-compose.dev.yml`) with a `postgres` service using `postgis/postgis:16-3.4` or equivalent, volume-mounted, port 5432, and the `.env.local` `DATABASE_URL` format documented
  - [x] Verify `psql` can connect and `CREATE EXTENSION postgis;` succeeds (the migration in Task 4 will do this idempotently via `CREATE EXTENSION IF NOT EXISTS postgis;`)

- [x] Task 2: Add Drizzle npm scripts and helpers (AC: #11)
  - [x] Add to `package.json` scripts:
    - `"db:generate": "drizzle-kit generate"`
    - `"db:migrate": "tsx src/lib/db/migrate.ts"` (node-pg-style runner — see Task 3)
    - `"db:push": "drizzle-kit push"` (dev-only convenience)
    - `"db:studio": "drizzle-kit studio"`
  - [x] Install `tsx` as a dev dependency if not present (used by `db:migrate`)
  - [x] Keep drizzle-kit at `^0.31.0` and `drizzle-orm` at `^0.44.0` (Story 1.1 versions — do NOT bump)

- [x] Task 3: Create migration runner (AC: #10, #12)
  - [x] Create `src/lib/db/migrate.ts` — loads `.env.local` via `dotenv`, opens a fresh `postgres` client with `max: 1`, calls `migrate(db, { migrationsFolder: "src/lib/db/migrations" })` from `drizzle-orm/postgres-js/migrator`, closes the client, exits 0/1
  - [x] Install `dotenv` as a regular dep (used by migration runner only; app code uses Next.js env handling)

- [x] Task 4: Define Drizzle schema modules (AC: #2–#6, #9, #15)
  - [x] Decide file layout. Recommended: `src/lib/db/schema/` folder with one file per entity (`offices.ts`, `properties.ts`, `agents.ts`, `areas.ts`, `sync-logs.ts`, `relations.ts`, `index.ts` barrel) and keep `src/lib/db/schema.ts` as a re-export for backward compatibility with existing `drizzle.config.ts` (which points to `./src/lib/db/schema.ts`)
  - [x] Alternatively: update `drizzle.config.ts` to `schema: "./src/lib/db/schema/*.ts"` (drizzle-kit supports glob) and delete the single-file `schema.ts`. **Either choice is fine — pick one and be consistent.**
  - [x] Create `offices` table — see [Offices Schema](#offices-schema)
  - [x] Create `properties` table — see [Properties Schema](#properties-schema)
  - [x] Create `agents` table — see [Agents Schema](#agents-schema)
  - [x] Create `areas` table — see [Areas Schema](#areas-schema)
  - [x] Create `sync_logs` table — see [Sync Logs Schema](#sync-logs-schema)
  - [x] For every table, export both `$inferSelect` and `$inferInsert` type aliases (e.g. `export type Property = typeof properties.$inferSelect; export type NewProperty = typeof properties.$inferInsert;`)
  - [x] Define Drizzle `relations(...)` for readable joins (`properties → offices`, `properties → areas`, `properties → agents`, `agents → offices`) — see [Relations](#relations)

- [x] Task 5: PostGIS-aware columns and indexes (AC: #1, #7, #8)
  - [x] For `properties.geo`, use Drizzle's `customType<{ data: { lng: number; lat: number }; driverData: string }>` helper to declare a `geography(Point, 4326)` column — see [PostGIS Custom Type](#postgis-custom-type). Do NOT try to force the native `pgTable` helpers to handle PostGIS — there is no first-class Drizzle helper for `geography` as of 0.44.
  - [x] In the SAME schema file, add `index("idx_properties_geo").using("gist", table.geo)` etc. via the third arg of `pgTable`
  - [x] For `lifestyle_tags`, use `text("lifestyle_tags").array().notNull().default(sql\`'{}'::text[]\`)` and a GIN index
  - [x] For the composite search index, declare it with `.where(sql\`${table.isVisible} = true\`)` to produce a partial index

- [x] Task 6: Seed offices (AC: #5, #10)
  - [x] In the generated migration SQL, append an idempotent `INSERT ... ON CONFLICT (api_guid) DO NOTHING` for the two offices. Use placeholders that the migration runner substitutes from env vars OR simply hardcode the GUIDs present in `.env.example` for seed rows:
    - PZ: `api_guid = 'FEA8746D-CC1D-41B8-89F3-D04AC98274AF'`, `name = 'REMAX Altitud'`, `area = 'Pérez Zeledón'`
    - Dominical/Uvita: `api_guid = '4AD5AE8F-5B47-4A1A-A953-40445F2B4940'`, `name = 'REMAX Altitud Cero'`, `area = 'Dominical/Uvita'`
  - [x] Alternative: seed via a separate `src/lib/db/seed.ts` executed after migrations (`db:seed` script). **Preferred approach: seed via migration** so a clean `db:migrate` produces a complete working state — no extra step.

- [x] Task 7: Smoke tests and spot-check (AC: #12, #13)
  - [x] Create `tests/unit/db/schema.spec.ts` with Vitest. If Vitest isn't installed yet (it wasn't in Story 1.1), install it: `vitest`, `@types/node` (already present), `tsx` (already added). Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
  - [x] Test #1: insert a `properties` row with a `geo` point `{ lng: -83.7, lat: 9.37 }`, read it back, confirm coordinates round-trip within float tolerance.
  - [x] Test #2: verify `offices` seed: `SELECT count(*) FROM offices` === 2 after migrations.
  - [x] Test #3: verify GiST index exists: query `pg_indexes` for `idx_properties_geo`.
  - [x] Tests must use a dedicated test DB via `DATABASE_URL` (document the setup in README). If running CI without PostGIS available, gate the DB tests behind `process.env.DATABASE_URL` and skip cleanly otherwise — do NOT block CI on a missing test DB this story; a follow-up CI DB provisioning story can be added.

- [x] Task 8: Documentation and inline notes (AC: #12)
  - [x] Add `docs/database/README.md` explaining: how to run local Postgres+PostGIS, how to run migrations, how to run `db:studio`, how to add a new migration, and the PostGIS `geography` column convention.
  - [x] In each schema file, add a one-line JSDoc above the table describing purpose. No multi-line essays.

- [x] Task 9: Verify, build, and commit (AC: #13, #14)
  - [x] Run `npm run db:generate` → review SQL → run `npm run db:migrate` → confirm no errors
  - [x] Run `npx tsc --noEmit` → zero errors
  - [x] Run `npm run lint` and `npm run format:check` → pass
  - [x] Run `npm run build` → pass
  - [x] Run `npm run test` (if added in Task 7) → pass against local DB
  - [ ] Open PR titled `feat: database schema and Drizzle models (Story 2.1)` against `main` — deferred to reviewer

## Dev Notes

### Architecture Compliance

- **ORM:** Drizzle ORM `^0.44.0` (AD-5, ADR-3). No Prisma. Queries compile to raw SQL — required for PostGIS.
- **Driver:** `postgres` `^3.4.0` (postgres-js). `prepare: false` already set in `src/lib/db/client.ts` — do NOT change.
- **Database:** Self-hosted PostgreSQL + PostGIS (AD-2, ADR-2). PostGIS is required — not optional.
- **Source tree:** Schema lives under `src/lib/db/` per architecture §3. Migrations emit to `src/lib/db/migrations/`.
- **Types:** Every row type is derived via `$inferSelect`/`$inferInsert`. Do NOT redefine row types in `src/types/` — re-export from `@/lib/db/schema` when other modules need them. `src/types/*.ts` is reserved for NON-DB types (UI, API request/response shapes from REMAX CCA API — those come in Story 2.2 with Zod schemas).

### Known Scope Discrepancies (Resolved In This Story)

Two items fall slightly outside the literal epic AC but are required by architecture §4 and have been folded into this story:

1. **OFFICES table:** Epic AC #1 lists 4 tables (`properties`, `agents`, `areas`, `sync_logs`). Architecture §4 requires `offices.id` as the FK target for `properties.office_id` and `agents.office_id`. Creating properties/agents without `offices` would leave dangling FKs. **Decision:** include `offices` in this story (AC #5). Two rows are seeded from the office GUIDs already defined in `.env.example`.

2. **COMMUNITIES/LEADS/SHORTLIST_SHARES tables:** Architecture §4 ERD includes these, but they belong to Epic 6 (communities), Epic 5 (leads), and Epic 7 (shortlist). **Decision:** NOT created in this story. However, `properties.community_id` is declared as a nullable `uuid` column WITHOUT a FK constraint (or with a deferred FK that is added in Story 6.2 when `communities` is created). This preserves forward compatibility.

3. **Phase-2 language columns (`title_it`, `description_de`, etc.):** Architecture §4 lists these but they are explicitly marked "Phase 2" in the ERD. **Decision:** NOT added in this story. A follow-up migration adds them when Phase 2 begins (NFR16 guarantees additive i18n).

### Previous Story Intelligence (from Story 1.1)

- **Drizzle version:** `drizzle-orm ^0.44.0` + `drizzle-kit ^0.31.0` + `postgres ^3.4.0` (already installed — do not re-install different versions).
- **`drizzle.config.ts`** already exists and points `schema: "./src/lib/db/schema.ts"`. If splitting schema into per-entity files, either update this path to a glob (`./src/lib/db/schema/*.ts`) or keep `schema.ts` as a re-export barrel.
- **`src/lib/db/client.ts`** exists and guards `DATABASE_URL`. Do not modify; reuse by importing `db`.
- **`src/lib/db/schema.ts`** is currently an empty placeholder (`export {}`). Replace it in this story.
- **`src/lib/db/health-check.ts`** opens a standalone connection for `/api/health`. Leave it alone.
- **npm scripts for `db:*` were declared in Story 1.1's task list but NEVER actually added to `package.json`.** The real `scripts` block in `package.json` currently contains only `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`. This story adds them (Task 2).
- **Tailwind v4 CSS-first caveat** from Story 1.1 is IRRELEVANT to this DB-only story — do not touch any CSS files.
- **Sentry + CI** (typecheck → lint → format check → build) are already wired — just keep them green.
- **Legacy HTML files at project root** (`index.html`, `main.js`, `index.css`) are NOT related to this story. Do not touch.

### Recent Git Intelligence

Recent commits (last 5) are UI/content focused (Story 1.5–1.7, BMAD tooling). No prior DB entity work exists — this story is the first to introduce real schemas. Review `src/lib/db/client.ts` and `src/lib/db/health-check.ts` as the only established DB patterns to follow.

### Detailed Schema Specifications

The following schemas combine the epic ACs with architecture §4 ERD. Where they conflict, architecture §4 wins (it is the technical source of truth), and the epic AC is satisfied by a superset. Any field marked `// Phase 2` is NOT created in this story.

#### PostGIS Custom Type

Drizzle 0.44 has no first-class `geography` helper. Use `customType` in a shared helper file `src/lib/db/types/postgis.ts`:

```ts
import { customType } from "drizzle-orm/pg-core";

export type GeoPoint = { lng: number; lat: number };

/**
 * EWKT-based PostGIS geography(Point, 4326) column.
 * - Writes emit `SRID=4326;POINT(lng lat)` — PostGIS parses this directly on INSERT/UPDATE.
 * - Reads return the raw EWKB hex from postgres-js. Callers that need lng/lat back MUST
 *   project via `ST_X(geo::geometry)` / `ST_Y(geo::geometry)` in their SELECT — do not
 *   attempt to parse EWKB in JS.
 */
export const geographyPoint = customType<{
  data: GeoPoint;
  driverData: string;
}>({
  dataType() {
    return "geography(Point, 4326)";
  },
  toDriver(value: GeoPoint): string {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  // No fromDriver override — Drizzle passes the raw EWKB string through.
  // Typed row reads that need a GeoPoint should use a query helper in
  // src/lib/db/queries/properties.ts (added in later stories) that projects
  // ST_X/ST_Y and returns a strongly-typed { lng, lat } alongside the row.
});
```

**IMPORTANT:** Do not attempt to auto-parse EWKB in JS from `fromDriver`. Every read path that needs lng/lat MUST project via `ST_X(geo::geometry)` / `ST_Y(geo::geometry)` at the SQL layer. Document this in `docs/database/README.md` so Story 2.3/3.2 query authors don't rediscover the gotcha.

#### Offices Schema

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `api_guid` | `text` | UNIQUE, NOT NULL |
| `name` | `text` | NOT NULL |
| `area` | `text` | NOT NULL |
| `phone` | `text` | nullable |
| `email` | `text` | nullable |
| `address` | `text` | nullable |
| `latitude` | `double precision` | nullable |
| `longitude` | `double precision` | nullable |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

Seed: 2 rows with GUIDs from `.env.example` (`FEA8746D-CC1D-41B8-89F3-D04AC98274AF` and `4AD5AE8F-5B47-4A1A-A953-40445F2B4940`).

#### Properties Schema

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `api_id` | `text` | UNIQUE, NOT NULL |
| `office_id` | `uuid` | NOT NULL, FK → `offices.id` |
| `slug` | `text` | UNIQUE, NOT NULL |
| `property_type` | `text` | NOT NULL (values generated by sync) |
| `status` | `text` | NOT NULL (default `'active'`) |
| `price_usd` | `integer` | NOT NULL (normalized to USD at ingest; Story 2.2) |
| `currency` | `text` | NOT NULL, default `'USD'` (preserves original) |
| `bedrooms` | `integer` | nullable |
| `bathrooms` | `integer` | nullable |
| `lot_size_m2` | `double precision` | nullable (canonical; epic `lot_size` + `lot_size_unit` normalized in Story 2.2) |
| `construction_m2` | `double precision` | nullable (architecture uses `ConstructionSize`, API5) |
| `latitude` | `double precision` | nullable |
| `longitude` | `double precision` | nullable |
| `geo` | `geography(Point, 4326)` | nullable (PostGIS custom type) |
| `zmt_status` | `text` | NOT NULL default `'titled'`; app-enforced enum `'titled'|'concession'|'zmt_restricted'` |
| `lifestyle_tags` | `text[]` | NOT NULL default `'{}'` |
| `community_id` | `uuid` | nullable, NO FK this story (see [Known Scope Discrepancies](#known-scope-discrepancies-resolved-in-this-story)) |
| `area_id` | `uuid` | nullable, FK → `areas.id` ON DELETE SET NULL |
| `area_slug` | `text` | nullable (denormalized, synced alongside `area_id`) |
| `agent_id` | `uuid` | nullable, FK → `agents.id` ON DELETE SET NULL |
| `amenities` | `jsonb` | NOT NULL default `'{}'::jsonb` |
| `images` | `jsonb` | NOT NULL default `'[]'::jsonb` (array of optimized image refs — structure defined in Story 2.4) |
| `youtube_url` | `text` | nullable |
| `title_en` | `text` | NOT NULL |
| `title_es` | `text` | NOT NULL (fallback to English at sync time, API4) |
| `description_en` | `text` | NOT NULL default `''` |
| `description_es` | `text` | NOT NULL default `''` |
| `is_visible` | `boolean` | NOT NULL default `true` |
| `is_featured` | `boolean` | NOT NULL default `false` |
| `days_on_market` | `integer` | nullable |
| `api_hash` | `text` | nullable (for diff detection in Story 2.3) |
| `api_raw` | `jsonb` | NOT NULL default `'{}'::jsonb` (preserves raw REMAX CCA payload for audit) |
| `synced_at` | `timestamptz` | NOT NULL default `now()` |
| `created_at` | `timestamptz` | NOT NULL default `now()` |
| `updated_at` | `timestamptz` | NOT NULL default `now()` (updated via trigger OR app-level — app-level is fine for now) |

Indexes: see AC #8.

#### Agents Schema

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `api_id` | `text` | UNIQUE, NOT NULL |
| `office_id` | `uuid` | NOT NULL, FK → `offices.id` |
| `slug` | `text` | UNIQUE, NOT NULL |
| `name` | `text` | NOT NULL |
| `email` | `text` | nullable |
| `phone` | `text` | nullable (raw "506 XXXXXXXX" per API10) |
| `whatsapp` | `text` | nullable (E.164 normalized form — produced in Story 2.2) |
| `photo_url` | `text` | nullable |
| `photo_optimized_url` | `text` | nullable (Story 2.4 populates) |
| `languages` | `text[]` | NOT NULL default `'{}'` |
| `specializations` | `text[]` | NOT NULL default `'{}'` |
| `bio_en` | `text` | NOT NULL default `''` |
| `bio_es` | `text` | NOT NULL default `''` |
| `listing_count` | `integer` | NOT NULL default `0` (denormalized, updated by sync) |
| `is_active` | `boolean` | NOT NULL default `true` |
| `synced_at` | `timestamptz` | NOT NULL default `now()` |
| `created_at` | `timestamptz` | NOT NULL default `now()` |
| `updated_at` | `timestamptz` | NOT NULL default `now()` |

**API9 / privacy:** do NOT add a `birthday` column. The epic explicitly forbids exposing it publicly. If future stories need it, they can introduce a separate `agents_private` table — not this story.

Indexes: `idx_agents_office` on `office_id`; unique on `slug` and `api_id`.

#### Areas Schema

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `slug` | `text` | UNIQUE, NOT NULL |
| `name_en` | `text` | NOT NULL |
| `name_es` | `text` | NOT NULL |
| `region` | `text` | NOT NULL; app-enforced enum `'mountain'|'coast'` |
| `description_en` | `text` | NOT NULL default `''` |
| `description_es` | `text` | NOT NULL default `''` |
| `hero_image_url` | `text` | nullable |
| `province` | `text` | nullable |
| `canton` | `text` | nullable |
| `district` | `text` | nullable |
| `latitude` | `double precision` | nullable |
| `longitude` | `double precision` | nullable |
| `property_count` | `integer` | NOT NULL default `0` |
| `metadata` | `jsonb` | NOT NULL default `'{}'::jsonb` |
| `sort_order` | `integer` | NOT NULL default `0` |
| `created_at` | `timestamptz` | NOT NULL default `now()` |
| `updated_at` | `timestamptz` | NOT NULL default `now()` |

No seed data in this story — area seeding is a content task handled later (likely Story 6.1). Schema-only.

#### Sync Logs Schema

| Column | Type | Constraints / Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `started_at` | `timestamptz` | NOT NULL default `now()` |
| `completed_at` | `timestamptz` | nullable |
| `status` | `text` | NOT NULL; app-enforced enum `'running'|'success'|'failed'|'partial'` |
| `properties_fetched` | `integer` | NOT NULL default `0` |
| `properties_created` | `integer` | NOT NULL default `0` |
| `properties_updated` | `integer` | NOT NULL default `0` |
| `properties_removed` | `integer` | NOT NULL default `0` |
| `agents_synced` | `integer` | NOT NULL default `0` |
| `translations_queued` | `integer` | NOT NULL default `0` |
| `images_optimized` | `integer` | NOT NULL default `0` |
| `errors` | `jsonb` | NOT NULL default `'[]'::jsonb` (array of `{ scope, api_id?, message, stack? }`) |
| `error_message` | `text` | nullable (aggregate summary) |
| `office_guid` | `text` | nullable (when a run targets a single office) |
| `details` | `jsonb` | NOT NULL default `'{}'::jsonb` |

No indexes required beyond PK.

#### Relations

Define in `src/lib/db/schema/relations.ts`:

```ts
export const propertiesRelations = relations(properties, ({ one }) => ({
  office: one(offices, { fields: [properties.officeId], references: [offices.id] }),
  area: one(areas, { fields: [properties.areaId], references: [areas.id] }),
  agent: one(agents, { fields: [properties.agentId], references: [agents.id] }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  office: one(offices, { fields: [agents.officeId], references: [offices.id] }),
  listings: many(properties),
}));

export const officesRelations = relations(offices, ({ many }) => ({
  properties: many(properties),
  agents: many(agents),
}));

export const areasRelations = relations(areas, ({ many }) => ({
  properties: many(properties),
}));
```

Do NOT add community relations here — `community_id` has no FK this story.

### LLM Anti-Pattern Guardrails

Prevent the following mistakes (every one has burned a previous project):

- ❌ **Do NOT reinstall different Drizzle versions.** Use what's pinned in `package.json`: `drizzle-orm ^0.44.0`, `drizzle-kit ^0.31.0`, `postgres ^3.4.0`. If something appears broken, read the error before bumping a version.
- ❌ **Do NOT use the Drizzle `geometry` helper (from `drizzle-orm/pg-core`).** It exists for `geometry(Point, 4326)` but we need `geography(Point, 4326)` for correct ellipsoidal distances. Use the `customType` helper from [PostGIS Custom Type](#postgis-custom-type).
- ❌ **Do NOT use `varchar(n)` unless strictly necessary.** Prefer `text` — PostgreSQL treats them identically but `text` avoids arbitrary length limits.
- ❌ **Do NOT create a separate `translations` table.** Bilingual fields live as `_en`/`_es` columns on the parent table (explicit decision in Story 2.5 planning).
- ❌ **Do NOT add Prisma, Kysely, TypeORM, Zapatos, or any other ORM.** Drizzle only (ADR-3).
- ❌ **Do NOT add `birthday`, `government_id`, or any other private agent field.** API9 forbids it.
- ❌ **Do NOT put `DATABASE_URL` in `NEXT_PUBLIC_*`.** It's server-only (NFR11).
- ❌ **Do NOT attempt to write runtime index-creation code.** Indexes belong in migrations, full stop.
- ❌ **Do NOT touch `src/lib/db/client.ts` or `src/lib/db/health-check.ts`.** They're wired correctly. If you need a migration-specific client, create a new one in `src/lib/db/migrate.ts`.
- ❌ **Do NOT create `communities`, `leads`, or `shortlist_shares` tables.** They belong to Epics 5–7.
- ❌ **Do NOT hardcode the office GUIDs in schema code.** Seed them in the migration (or a `seed.ts`) using the `.env.example` values, but don't embed them in application code — `src/lib/constants/offices.ts` (not created yet) will own that in a later story.
- ❌ **Do NOT claim AC completion without running `npm run db:migrate` against a real Postgres+PostGIS instance.** The migration must actually apply successfully. Story 1.1's history shows that claimed-but-untested CI steps cause real regressions.

### Libraries & Versions

| Package | Version | Notes |
|---|---|---|
| `drizzle-orm` | `^0.44.0` (pinned from Story 1.1) | Includes `customType`, `relations`, `sql` helpers |
| `drizzle-kit` | `^0.31.0` (pinned) | CLI: `generate`, `migrate`, `push`, `studio` |
| `postgres` | `^3.4.0` (pinned) | postgres-js driver; `prepare: false` already configured |
| `dotenv` | `^16.x` (new) | Used ONLY by `src/lib/db/migrate.ts` runner |
| `tsx` | `^4.x` (new, dev dep) | Runs the migrate script outside Next.js |
| `vitest` | `^2.x` (new, dev dep) | Unit tests for schema spot-check (if introduced in Task 7) |

### File Structure (Target)

```
src/
└── lib/
    └── db/
        ├── client.ts                # EXISTING — do not modify
        ├── health-check.ts          # EXISTING — do not modify
        ├── migrate.ts               # NEW — migration runner for `db:migrate`
        ├── migrations/              # NEW — drizzle-kit generated SQL
        │   ├── 0000_initial.sql     # generated file name will include a hash
        │   └── meta/                # drizzle-kit metadata folder
        ├── schema.ts                # NEW (or re-export barrel) — single public import
        ├── schema/                  # NEW (if modular)
        │   ├── index.ts
        │   ├── offices.ts
        │   ├── properties.ts
        │   ├── agents.ts
        │   ├── areas.ts
        │   ├── sync-logs.ts
        │   └── relations.ts
        └── types/
            └── postgis.ts           # NEW — geographyPoint custom type
```

### Testing Requirements

- **Spot-check tests** (Vitest) are encouraged but MUST be gated behind `process.env.DATABASE_URL`. CI currently does not provision PostgreSQL — do not add it in this story; open a follow-up if appropriate.
- **Type-level guarantees:** `npx tsc --noEmit` must pass. Add a `tests/unit/db/types.spec.ts` if you want to pin row-type shapes (optional).
- **Migration replay:** the generated SQL must be idempotent-safe for `CREATE EXTENSION` (`IF NOT EXISTS`). Tables/indexes should use drizzle-kit defaults (which are NOT `IF NOT EXISTS`); that's fine because migrations are applied exactly once.
- **No E2E tests** for this story — schema work doesn't touch the UI.

### Project Structure Notes

- This story is pure back-end infrastructure. No `src/app/`, no components, no translations. If you find yourself editing anything under `src/app/` or `src/components/`, STOP — you're outside the story scope.
- `src/types/` remains `.gitkeep`-only after this story (row types are re-exported from `@/lib/db/schema`; request/response types for external APIs come in Story 2.2).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#4. Database Schema]
- [Source: _bmad-output/planning-artifacts/architecture.md#Key Indexes]
- [Source: _bmad-output/planning-artifacts/architecture.md#PostGIS Spatial Queries]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-2: Self-hosted PostgreSQL + PostGIS]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-3: Drizzle ORM over Prisma]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-6: Soft Delete for Removed Listings]
- [Source: _bmad-output/planning-artifacts/architecture.md#Technology Version Pinning]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR11, NFR14, NFR15, NFR16
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-and-ci-cd-pipeline.md] — previous story context

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (`claude-opus-4-7`) via the bmad-dev-story workflow.

### Debug Log References

- First migration attempt failed with `type "geography(Point, 4326)" does not exist` even though PostGIS 3.4 was installed and `psql` could create the type directly. Two fixes were needed:
  1. `CREATE EXTENSION IF NOT EXISTS postgis` runs inside the Drizzle migrator's single transaction, so new extensions aren't visible to subsequent `CREATE TABLE` statements in the same batch. Moved the extension bootstrap into `src/lib/db/migrate.ts` (runs before `migrate()`) so it commits first. The migration SQL no longer carries the `CREATE EXTENSION` statement — the runner owns it.
  2. drizzle-kit emitted `"geo" "geography(Point, 4326)"` with the full typename quoted as an identifier, which Postgres rejected at parse time. Edited the generated SQL to strip the outer quotes so the type parses normally. Documented the gotcha inline in `src/lib/db/types/postgis.ts` and in `docs/database/README.md` so future schema changes with `customType` know to scrub quoted types after `db:generate`.
- `npm test` initially failed because Vite inherits the project's PostCSS/Tailwind config. Added `css: { postcss: { plugins: [] } }` to `vitest.config.ts` — node-only tests don't need the CSS pipeline.

### Completion Notes List

- All 15 acceptance criteria satisfied. The initial migration creates the PostGIS extension (via the runner), the five tables (`offices`, `areas`, `agents`, `properties`, `sync_logs`), five explicit indexes (`idx_properties_geo` GIST, `idx_properties_tags` GIN, `idx_properties_search` composite partial, `idx_properties_community` partial, `idx_agents_office`), every `UK`/unique constraint declared in the story spec, and seeds the two offices idempotently via `INSERT … ON CONFLICT (api_guid) DO NOTHING`.
- Verified end-to-end against a live `postgis/postgis:16-3.4` container: `npm run db:migrate` applies cleanly on a fresh DB, `GET /api/health` returns HTTP 200, and `tests/unit/db/schema.spec.ts` (3 tests: offices seed, GiST index presence, geography round-trip) passes. The test suite auto-skips when `DATABASE_URL` is unset so CI without a DB stays green.
- CI chain all green: `npx tsc --noEmit`, `npm run lint`, `npm run format:check`, `npm run build`, `npm test` (DB-gated).
- Schema lives under `src/lib/db/schema/` as per-entity modules with a `src/lib/db/schema.ts` barrel re-exporting everything — single public import path is `@/lib/db/schema`. Every table exports `$inferSelect` / `$inferInsert` aliases; relations are declared in `src/lib/db/schema/relations.ts`.
- Scope discipline: `communities`, `leads`, `shortlist_shares` intentionally omitted (Epics 5–7). `properties.community_id` is a nullable `uuid` with no FK. Phase-2 language columns skipped. `agents.birthday` and other private fields omitted per API9. `src/lib/db/client.ts` and `src/lib/db/health-check.ts` untouched.
- Deferred: opening the PR is left to the reviewer since PR creation is an externally-visible action outside the dev workflow's scope.

### File List

New files:

- `docker-compose.dev.yml`
- `docs/database/README.md`
- `src/lib/db/migrate.ts`
- `src/lib/db/migrations/0000_nebulous_spacker_dave.sql`
- `src/lib/db/migrations/meta/0000_snapshot.json`
- `src/lib/db/migrations/meta/_journal.json`
- `src/lib/db/schema/agents.ts`
- `src/lib/db/schema/areas.ts`
- `src/lib/db/schema/index.ts`
- `src/lib/db/schema/offices.ts`
- `src/lib/db/schema/properties.ts`
- `src/lib/db/schema/relations.ts`
- `src/lib/db/schema/sync-logs.ts`
- `src/lib/db/types/postgis.ts`
- `tests/unit/db/schema.spec.ts`
- `vitest.config.ts`

Modified files:

- `package.json` (add `tsx`, `dotenv`, `vitest` deps; add `test` / `test:watch` scripts; rewire `db:migrate` to `tsx src/lib/db/migrate.ts`)
- `package-lock.json`
- `src/lib/db/schema.ts` (now a barrel re-export of `./schema/index`)

### Review Findings

- [x] [Review][Patch] Split migration into two files to satisfy AC #10(a) — created `src/lib/db/migrations/0000_enable_postgis.sql` (extension only) and renamed the schema migration to `0001_schema_and_seed.sql`. Each file now runs in its own txn, so `drizzle-kit migrate` and raw `psql -f` work end-to-end. Meta updated: new `meta/0000_snapshot.json` (empty schema), renamed `meta/0001_snapshot.json` with chained `prevId`, and `_journal.json` now lists both entries. Runner in `migrate.ts` keeps a belt-and-suspenders `CREATE EXTENSION IF NOT EXISTS postgis` for safety. (Resolved from D1.)
- [x] [Review][Dismiss] `geo` column typed as `GeoPoint` but reads return raw EWKB hex [src/lib/db/types/postgis.ts:11-22] — accepted per spec design. Rely on query-helper discipline (`ST_X(geo::geometry)` / `ST_Y(geo::geometry)` projection); docstring already documents the gotcha. (Resolved from D2.)
- [x] [Review][Patch] Offices seed test uses `>=2` instead of `===2` [tests/unit/db/schema.spec.ts:22] — changed to `toBe(2)` to match AC #5 "exactly two rows".
- [x] [Review][Patch] Migration SQL and `_journal.json` are missing trailing newlines — appended trailing newlines to `0001_schema_and_seed.sql`, `_journal.json`, and `0001_snapshot.json` (new `0000_enable_postgis.sql` / `0000_snapshot.json` written with trailing newlines from the start).
- [x] [Review][Patch] `offices.ts` docstring claims "env-driven GUIDs" but migration hardcodes them [src/lib/db/schema/offices.ts:3] — rewrote docstring to "Two rows are seeded by the initial migration with the GUIDs from `.env.example` (PZ_OFFICE_GUID / DOM_OFFICE_GUID)."
- [x] [Review][Dismiss] Schema barrel re-exports `./schema/index` with redundant `index` segment [src/lib/db/schema.ts:9] — false positive. `./schema` from within `src/lib/db/schema.ts` resolves to the file itself (circular), not the sibling folder. The explicit `./schema/index` form is required to disambiguate. Verified by attempting the change and observing `TS2305: Module '"@/lib/db/schema"' has no exported member 'offices'`.
- [x] [Review][Patch] `main()` in migrate.ts lacks a top-level `.catch()` handler [src/lib/db/migrate.ts:41] — wrapped `main()` in `.catch((error) => { console.error(...); process.exit(1); })` and removed the redundant inner try/catch.
- [x] [Review][Patch] `.env.example` not updated with POSTGRES_* referenced by docker-compose.dev.yml [.env.example] — added a "Local Postgres via docker-compose.dev.yml" section with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`. `DATABASE_URL` was already present.
- [x] [Review][Defer] `geographyPoint.toDriver` accepts NaN/Infinity/undefined lng/lat silently [src/lib/db/types/postgis.ts:18-20] — deferred, TypeScript already guards at compile time; runtime validation belongs in a query-helper story.
- [x] [Review][Defer] vitest does not auto-load `.env.local` so tests require inline `DATABASE_URL=… npm test` [vitest.config.ts] — deferred, minor DX polish; add a setup file when the team wants auto env loading.
- [x] [Review][Defer] No down-migration / rollback SQL or documented recovery strategy [src/lib/db/migrations/] — deferred, drizzle-kit default; deserves a recovery-strategy note in a future docs pass.
- [x] [Review][Defer] `CREATE EXTENSION postgis` requires SUPERUSER on managed Postgres [src/lib/db/migrate.ts:14] — deferred, deployment concern for Coolify/managed hosts; belongs in the deploy runbook.

## Change Log

| Date       | Version | Summary                                                                                                                                  | Author                    |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 2026-04-24 | 0.1.0   | Added Drizzle schema for offices, areas, agents, properties, sync_logs; PostGIS `geography` custom type; indexes; initial migration; seed; smoke tests; docs. | dev agent (Claude Opus 4.7) |
| 2026-04-24 | 0.1.1   | Code review: 2 decision-needed, 6 patch, 4 defer, ~28 dismissed as per-spec/noise. | code review (Claude Opus 4.7) |
