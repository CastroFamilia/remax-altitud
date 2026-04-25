# Story 2.3: Sync Pipeline Core

Status: ready-for-dev

## Story

As an **admin**,
I want property and agent data to sync automatically every day,
So that the website always shows current listings without manual intervention.

## Acceptance Criteria

1. **Given** the sync pipeline is triggered (via POST `/api/sync` with a valid `CRON_SECRET` header) **When** processing begins **Then** a `sync_logs` record is created with `status = "running"` and `started_at = now()` before any fetch is issued.

2. **Given** the sync pipeline runs **When** all API data is fetched for both offices (PZ + Cero, properties + agents) **Then** the pipeline computes a SHA-256 hash of each property's key fields and classifies each record as `NEW | UPDATED | UNCHANGED | REMOVED` by comparing against the stored `api_hash` in the `properties` table (AR5, Step 3 DIFF).

3. **Given** new properties are identified by the diff **When** upserting to the database **Then** they are inserted into the `properties` table with all parsed and validated fields from `RawProperty` (including `priceUsd` rounded to integer, `geo` composed from `latitude`/`longitude` as `geography(Point, 4326)`, `api_raw` populated from `apiRaw`, and `api_hash` from the freshly-computed hash).

4. **Given** existing properties have changed (classified as `UPDATED`) **When** the diff detects updates **Then** only changed columns are written; unchanged records produce zero DB writes (incremental processing — NFR15).

5. **Given** a property's `ExpirationDate` is in the past (flagged `isExpired: true` by the Story 2.2 parser) **When** detected during diff **Then** it is treated the same as a `REMOVED` record: `is_visible` is set to `false`.

6. **Given** listings present in the DB but absent from the current API response (classified as `REMOVED`) **When** detected during diff **Then** `is_visible` is set to `false` on those rows — the slug and URL are preserved for SEO (FR53, AR3). No hard deletes.

7. **Given** a property that was previously soft-deleted (`is_visible = false`) **When** it re-appears in the API response **Then** `is_visible` is restored to `true` and all fields are updated.

8. **Given** agent data **When** syncing **Then** agents from both offices' `AgentsPerOffice` endpoints are upserted into the `agents` table; the `listing_count` denormalized field on each agent is updated to reflect their current active property count after the property upsert.

9. **Given** the sync completes successfully **When** finishing **Then** the `sync_logs` record is updated with `status = "success"`, `completed_at = now()`, and accurate counts: `properties_fetched`, `properties_created`, `properties_updated`, `properties_removed`, `agents_synced`.

10. **Given** the sync fails with an unrecoverable error (uncaught exception) **When** failing **Then** the `sync_logs` record is updated with `status = "failure"` and `error_message` set to the error's message string before the handler re-throws or returns a 500 response.

11. **Given** individual records fail Zod validation during the parse phase **When** encountered **Then** they are skipped, and a structured entry `{ apiId, scope, message, raw }` is appended to the `sync_logs.errors` JSONB array. Pipeline continues for the remaining records (FR55). The final `sync_logs.status` is `"partial"` if any parse errors occurred but the overall run succeeded; `"success"` if zero parse errors.

12. **Given** a property with `lotSizeUnitWarning: true` set by the Story 2.2 parser **When** stored **Then** the warning is recorded as an entry in `sync_logs.errors` (type `"lot_size_warning"`) alongside any Zod parse errors — it does NOT block the upsert.

13. **Given** the `/api/sync` route **When** a request arrives without the `CRON_SECRET` header matching `process.env.CRON_SECRET` **Then** a `401 Unauthorized` response is returned immediately; no sync work begins.

14. **Given** the sync pipeline completes successfully **When** finishing **Then** it calls the internal `/api/revalidate` endpoint (passing `process.env.API_SECRET`) to trigger ISR revalidation for `properties` and `agents` tags (AR6).

15. **Given** the pipeline runs against both offices **When** the Altitud Cero office returns `[]` for properties **Then** the pipeline logs an info breadcrumb and treats it as zero new/updated/removed for that office; the run still completes successfully (API8).

16. **Given** the complete implementation **When** running `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test` **Then** all pass with zero new errors. The `/api/sync` route must not be reachable client-side; the `server-only` directive in all sync modules enforces this at build time.

## Tasks / Subtasks

- [ ] Task 1: Create `/api/sync` route with auth guard (AC: #1, #13)
  - [ ] Create `src/app/api/sync/route.ts` — POST handler only.
  - [ ] Extract `CRON_SECRET` from `process.env`; compare against the `Authorization: Bearer <secret>` header OR a custom `x-cron-secret: <secret>` header (pick one convention and document it in `.env.example`). Return `401` if missing or mismatched.
  - [ ] On auth success, call `runSyncPipeline()` (Task 4) inside a `try/catch`. Return `200` with a summary JSON on success; `500` with `{ error: message }` on failure.
  - [ ] The route file must NOT be a Client Component (`"use client"` is forbidden). Add `import "server-only"` is NOT needed on route files (they run server-only by default in App Router), but MUST be present on all `src/lib/sync/**` files.

- [ ] Task 2: Create sync-log DB helpers (AC: #1, #9, #10, #11)
  - [ ] Create `src/lib/db/queries/sync-log.ts` (architecture §3 pre-declares this path).
  - [ ] Export `createSyncLog(): Promise<SyncLog>` — inserts a row with `status = "running"`, `startedAt = new Date()`, all count fields = 0, `errors = []`. Returns the created row (need the `id` for subsequent updates).
  - [ ] Export `updateSyncLog(id: string, patch: Partial<NewSyncLog>): Promise<void>` — Drizzle `update(syncLogs).set(patch).where(eq(syncLogs.id, id))`.
  - [ ] Types `SyncLog` and `NewSyncLog` are already exported from `src/lib/db/schema/sync-logs.ts` — import them there; do NOT redefine.

- [ ] Task 3: Create differ module (AC: #2, #4, #5, #6, #7)
  - [ ] Create `src/lib/sync/differ.ts` (architecture §3 pre-declares this file).
  - [ ] Add `import "server-only"` at the top.
  - [ ] Implement `computePropertyHash(raw: RawProperty): string` using Node's built-in `crypto.createHash('sha256')`. Hash a deterministic JSON string of the key mutable fields: `priceUsd`, `titleEn`, `titleEs`, `publicRemarksEn` (= `description_en` in DB), `latitude`, `longitude`, `bedrooms`, `bathrooms`, `lotSizeM2`, `constructionM2`, `images` (sorted for stability), `amenities`, `apiStatus`. Do NOT include `apiRaw` in the hash (it would always change on minor API field additions). Use `JSON.stringify` with a fixed key order (as shown in the Differ Hash Design section) for determinism.
  - [ ] Implement `diffProperties(apiRecords: RawProperty[], dbRecords: { apiId: string; apiHash: string | null; isVisible: boolean }[]): DiffResult`. `DiffResult = { new: RawProperty[]; updated: RawProperty[]; unchanged: RawProperty[]; removed: string[] /* apiIds */ }`. A record is `REMOVED` if its `apiId` is in `dbRecords` but not in `apiRecords`. A record is `UPDATED` if hashes differ OR `is_visible` was `false` (reactivation). A record is `UNCHANGED` if hashes match AND `is_visible` is already `true`.
  - [ ] Export `DiffResult` type from this file.
  - [ ] Expired listings (`RawProperty.isExpired === true`) are appended to the `removed` list even if they appear in the API response (AC #5).

- [ ] Task 4: Create pipeline orchestrator (AC: #1–#15)
  - [ ] Create `src/lib/sync/pipeline.ts` (architecture §3 pre-declares this file).
  - [ ] Add `import "server-only"` at the top.
  - [ ] Export `runSyncPipeline(): Promise<SyncPipelineResult>`. The function:
    1. Creates a sync_log row (`status: "running"`) via Task 2's `createSyncLog()`.
    2. Fetches all 4 endpoints in parallel: `Promise.all([fetchPropertiesForOffice(pzGuid), fetchPropertiesForOffice(domGuid), fetchAgentsForOffice(pzGuid), fetchAgentsForOffice(domGuid)])`. Collects all `parseErrors` from the four `FetchResult<T>` returns.
    3. Loads current DB property records needed for diff: `SELECT api_id, api_hash, is_visible FROM properties` (only these columns — do not load full rows for 300+ listings).
    4. Runs `diffProperties(allRawProps, dbSnapshot)` from Task 3.
    5. Upserts `new` and `updated` properties (Task 5). Soft-deletes `removed` apiIds (Task 5).
    6. Upserts agents (Task 6).
    7. Appends `lotSizeUnitWarning` entries to errors array for any `new/updated` property with `raw.lotSizeUnitWarning === true`.
    8. Updates the sync_log to `status: "success"` (or `"partial"` if any errors) with all counts and the errors JSONB.
    9. Calls `/api/revalidate` (Task 7).
    10. Returns `SyncPipelineResult` (counts + errors summary).
  - [ ] Wrap the body in a top-level `try/catch`. On uncaught error: call `updateSyncLog(id, { status: "failure", errorMessage: err.message, completedAt: new Date() })` then re-throw.
  - [ ] Export `SyncPipelineResult` type (counts + error summary).

- [ ] Task 5: Implement property upsert and soft-delete (AC: #3, #4, #6, #7)
  - [ ] Create `src/lib/db/queries/properties.ts` (architecture §3 pre-declares this path).
  - [ ] Add `import "server-only"` at the top.
  - [ ] Export `upsertProperty(raw: RawProperty, officeId: string): Promise<void>`:
    - Map `RawProperty` → `NewProperty` (Drizzle insert type from `src/lib/db/schema/properties.ts`).
    - `priceUsd`: `Math.round(raw.priceUsd)` — the DB column is `integer`.
    - `geo`: use a raw SQL expression: `` sql`ST_SetSRID(ST_MakePoint(${raw.longitude}, ${raw.latitude}), 4326)::geography` `` (Drizzle `sql` tagged template). Use `null` if either coordinate is `null`.
    - `slug`: generate from `titleEn` using a `slugify` helper (implement inline: lowercase, replace non-alphanumeric with `-`, collapse multiples, trim). Must be unique — if slug conflicts, append `-${apiId}` suffix.
    - `apiHash`: pass the newly computed hash (computed by the differ before calling this).
    - `apiRaw`: `raw.apiRaw`.
    - `isVisible`: `true` (always — reactivation is handled here too).
    - `syncedAt`: `new Date()`.
    - `zmtStatus`: default `"titled"` for now (ZMT parsing deferred; Story 2.3 spec does not cover ZMT detection).
    - `titleEs`: `raw.titleEs` (already falls back to `titleEn` per Story 2.2 parser AC #4 / API4).
    - `areaId`: `null` — geo-tagging (assigning community/area) is Story 2.6. Do NOT attempt to resolve area from coordinates here.
    - `areaSlug`: `null` — same reason.
    - `communityId`: `null` — Story 2.6 (geo-fence matching).
    - `lifestyleTags`: `[]` (empty array) — auto-tagging is Story 2.6.
    - Use Drizzle's `insert(properties).values(mapped).onConflictDoUpdate({ target: properties.apiId, set: { ...updatedFields, updatedAt: new Date() } })`.
    - Only include mutable fields in `set` (not `id`, `createdAt`, `officeId`, `slug`).
  - [ ] Export `softDeleteProperties(apiIds: string[]): Promise<number>` — `UPDATE properties SET is_visible = false, updated_at = now() WHERE api_id = ANY($1) AND is_visible = true`. Return count of affected rows for the sync_log `properties_removed` count. Use `sql` raw expression or Drizzle's `inArray`.

- [ ] Task 6: Implement agent upsert (AC: #8)
  - [ ] Create `src/lib/db/queries/agents.ts` (architecture §3 pre-declares this path).
  - [ ] Add `import "server-only"` at the top.
  - [ ] Export `upsertAgent(raw: RawAgent, officeId: string): Promise<void>`:
    - Map `RawAgent` → `NewAgent`.
    - `slug`: same slugify helper as properties; append `-${raw.apiId}` on conflict.
    - `languages`: `raw.primaryLang ? [raw.primaryLang] : []` — single-element array or empty if null; full multi-language is deferred.
    - `syncedAt`: `new Date()`.
    - `isActive`: `true` — Story 2.3 always activates synced agents.
    - `specializations`: `[]` — deferred to a future story.
    - Note: `RawAgent.role` (`"owner" | "associate"`) has NO matching column in `agents` schema (Story 2.1 did not add it). Do NOT fail if role cannot be stored; do NOT attempt to store it — just skip it silently. Do NOT add a `role` column — that requires a schema migration which is out of scope.
    - Note: The `agents` table does NOT have an `api_raw` column (unlike `properties`). Do NOT attempt to store `raw.apiRaw` on agent records — simply omit it.
    - Use `insert(agents).values(mapped).onConflictDoUpdate({ target: agents.apiId, set: {...} })`.
  - [ ] Export `updateAgentListingCounts(): Promise<void>` — runs a single SQL update: `UPDATE agents SET listing_count = (SELECT count(*) FROM properties WHERE properties.agent_id = agents.id AND properties.is_visible = true)`. The `properties.agent_id` column is the uuid FK referencing `agents.id` (not `api_id`). Execute this after all property upserts complete.

- [ ] Task 7: ISR revalidation call (AC: #14)
  - [ ] In `src/lib/sync/pipeline.ts`, after a successful sync, call the internal revalidate endpoint.
  - [ ] Use `fetch(new URL('/api/revalidate', process.env.NEXTAUTH_URL ?? 'http://localhost:3000').href, { method: 'POST', headers: { 'x-api-secret': process.env.API_SECRET ?? '' }, body: JSON.stringify({ tags: ['properties', 'agents'] }), cache: 'no-store' })`.
  - [ ] If the revalidate call fails (non-2xx or throws), log a `console.warn` but do NOT fail the overall sync — the data is already persisted (AR6: revalidation is best-effort).
  - [ ] Create `src/app/api/revalidate/route.ts` — POST handler that validates `x-api-secret` header against `process.env.API_SECRET`, then calls `revalidateTag('properties')` and `revalidateTag('agents')` from `'next/cache'`. Returns `200` with `{ revalidated: true }`.

- [ ] Task 8: Tests (AC: #16)
  - [ ] Add `tests/unit/sync/differ.spec.ts`:
    - `computePropertyHash` returns same hash for identical inputs; different hash when `priceUsd` changes.
    - `diffProperties`: new record → `new[]`; changed hash → `updated[]`; same hash + visible → `unchanged[]`; DB-only apiId → `removed[]`; `is_visible: false` + same hash → `updated[]` (reactivation); `isExpired: true` → `removed[]`.
  - [ ] Add `tests/unit/sync/pipeline.spec.ts` (integration-style, all DB calls mocked):
    - Happy path: mock fetch (2 properties, 1 agent per office) → assert `createSyncLog` called, `updateSyncLog` called with `status: "success"`, counts match.
    - Parse error path: one Zod-invalid record → `status: "partial"`, error in errors array.
    - Uncaught throw → `updateSyncLog` called with `status: "failure"`.
    - Empty Altitud Cero → sync completes without error.
    - ISR revalidation call verified (spy on `fetch` for revalidate URL).
  - [ ] Add `tests/unit/db/sync-log.spec.ts` — unit tests for `createSyncLog` and `updateSyncLog` using `vi.mock('@/lib/db/client')`.
  - [ ] All new tests must run WITHOUT a live database (mock `db` via `vi.mock`). No `process.env.DATABASE_URL` gate needed — these are pure unit tests.
  - [ ] Retry-path tests (if any): use the existing `__setSleepFnForTests` hook from Story 2.2's `api-client.ts`.

- [ ] Task 9: Slug helper (AC: #3)
  - [ ] Add `slugify(text: string, suffix?: string): string` in `src/lib/sync/utils/slugify.ts`. Use the Unicode property-escape algorithm from the Slug Generation section below (NFD decomposition + `\p{M}` strip). Export `slugify` only — no default export.
  - [ ] Add `tests/unit/sync/slugify.spec.ts` covering: accented characters (`"Finca Bonita"` → `"finca-bonita"`, `"Árbol"` → `"arbol"`), trailing/leading dashes (`"--hello--"` → `"hello"`), special characters (`"lot (1) A"` → `"lot-1-a"`), suffix appending (`slugify("Test", "456")` → `"test-456"`), empty string → `""`.

- [ ] Task 10: Env vars + wiring (AC: #13, #14, #16)
  - [ ] Add to `.env.example`: `CRON_SECRET=` (for `/api/sync` auth), `API_SECRET=` (for `/api/revalidate` auth), `NEXTAUTH_URL=http://localhost:3000` (for self-referencing revalidate call in pipeline).
  - [ ] Verify all existing `.env.example` entries are preserved (Story 2.2 already added `REMAX_API_BASE_URL`, `PZ_OFFICE_GUID`, `DOM_OFFICE_GUID`, `DATABASE_URL`).

- [ ] Task 11: CI verification (AC: #16)
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run format:check` → pass.
  - [ ] `npm run build` → pass.
  - [ ] `npm test` → all green (all previously passing 31 sync tests + all new tests pass).

## Dev Notes

### Architecture Compliance

- **Source tree (Architecture §3):** This story creates `src/lib/sync/pipeline.ts` and `src/lib/sync/differ.ts` — both are pre-declared in the architecture. It also creates `src/lib/db/queries/properties.ts`, `src/lib/db/queries/agents.ts`, and `src/lib/db/queries/sync-log.ts` (all pre-declared). It creates `src/app/api/sync/route.ts` and `src/app/api/revalidate/route.ts` (both pre-declared in Architecture §6 Internal API Routes table).
- **Do NOT create** `src/lib/sync/translator.ts`, `image-optimizer.ts`, `geo-tagger.ts`, `lifestyle-tagger.ts`, `alert.ts` — those belong to Stories 2.4–2.7. Do NOT pre-stub them.
- **server-only (AR16/NFR11):** `import "server-only"` must be at the top of every file under `src/lib/sync/**` and `src/lib/db/queries/**`. API route files (`src/app/api/*/route.ts`) do NOT need it — they are server-only by Next.js App Router convention.
- **Retry policy (NFR17):** Story 2.2's `fetchWithRetry` already handles the 3-attempt retry. Story 2.3 does not re-implement retry; it just calls `fetchPropertiesForOffice` / `fetchAgentsForOffice` directly.
- **PostGIS (AR2):** `geo` column uses `geography(Point, 4326)` — already defined in Story 2.1 schema via `geographyPoint("geo")` custom type in `src/lib/db/types/postgis.ts`. When inserting, use `` sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography` `` (longitude first — PostGIS MakePoint is `(X, Y)` = `(lon, lat)`).
- **Drizzle `onConflictDoUpdate` pattern:** The `properties.apiId` column has a `.unique()` constraint (Story 2.1). Use `onConflictDoUpdate({ target: properties.apiId, set: { field: value, ... } })`. The `set` object must list every mutable field — omitting a field means it won't update on conflict. Do NOT set `id`, `createdAt`, `officeId`, `slug` in `set`.
- **Parallel fetches:** `Promise.all([...])` for the 4 endpoints is explicitly required by Architecture §5 Step 1 (all 4 fetches happen concurrently). Do NOT sequential-await.
- **ISR revalidation (AR6):** `revalidateTag` from `'next/cache'` is the standard Next.js 15 pattern. It only works inside a Server Action or Route Handler — it IS callable from the `/api/revalidate` route. The pipeline itself cannot call `revalidateTag` directly (it runs as a library module, not as a route handler context). This is why the pipeline calls the `/api/revalidate` HTTP endpoint instead of importing `revalidateTag` directly.
- **CRON_SECRET auth pattern (AR16):** Architecture §10 defines `CRON_SECRET` as the auth mechanism for `/api/sync`. The standard pattern for Vercel/Coolify cron triggers is a `Authorization: Bearer ${CRON_SECRET}` header. Implement that pattern.
- **Incremental processing (NFR15):** Only `new` and `updated` records hit the DB upsert. `unchanged` records produce ZERO DB writes. This is critical for NFR15 (sync within 2 hours). Verify via test: mock 300 `UNCHANGED` records → assert `upsertProperty` is never called for them.

### DB Schema Reference (Story 2.1 Output)

The following columns exist on `properties` (from `src/lib/db/schema/properties.ts`). Map `RawProperty` fields accordingly:

| `RawProperty` field | `properties` column | Notes |
|---|---|---|
| `apiId` | `api_id` (text, unique) | Direct mapping |
| `apiRaw` | `api_raw` (jsonb) | Store `raw.apiRaw` verbatim |
| `(computed hash)` | `api_hash` (text) | `computePropertyHash(raw)` from differ.ts |
| `priceUsd` | `price_usd` (integer) | `Math.round(raw.priceUsd)` |
| `propertyTypeEn` | `property_type` (text) | Use English type for canonical column |
| `titleEn` | `title_en` (text) | NOT NULL |
| `titleEs` | `title_es` (text) | Falls back to `titleEn` (already done by parser) |
| `publicRemarksEn` | `description_en` (text) | Full text block |
| `publicRemarksEs` | `description_es` (text) | From parser's `publicRemarksEs` field |
| `latitude` | `latitude` (double precision) | Nullable |
| `longitude` | `longitude` (double precision) | Nullable |
| `(lat+lon combined)` | `geo` (geography Point 4326) | PostGIS expression — null if either coord null |
| `bedrooms` | `bedrooms` (integer) | Nullable |
| `bathrooms` | `bathrooms` (integer) | Nullable |
| `lotSizeM2` | `lot_size_m2` (double precision) | Nullable |
| `constructionM2` | `construction_m2` (double precision) | Nullable |
| `amenities` | `amenities` (jsonb) | Store the whole amenities object |
| `images` | `images` (jsonb) | Array of image URL strings (Story 2.4 will replace with optimized refs) |
| `videoUrl` | `youtube_url` (text) | Nullable |
| `agentApiId` | `agent_id` (uuid FK) | Requires a join from `api_id` → `id` on agents table; or set to `null` and let Story 2.3 wire in a follow-up sub-step after agent upsert |
| `officeApiId` | (resolved to `office_id` uuid via offices table lookup) | Query `offices` by `api_guid` to get the uuid; cache this lookup (only 2 offices) |
| (not in RawProperty) | `area_id` | Set to `null` — geo-tagging is Story 2.6 |
| (not in RawProperty) | `area_slug` | Set to `null` — Story 2.6 |
| (not in RawProperty) | `community_id` | Set to `null` — Story 2.6 |
| (not in RawProperty) | `lifestyle_tags` | Set to `[]` — auto-tagging is Story 2.6 |

**Important:** `agentId` FK on `properties` references `agents.id` (uuid). The agent upsert must happen BEFORE property upsert to allow FK resolution. Recommended approach: upsert all agents first (Step 6 in pipeline), then query `SELECT id, api_id FROM agents` to build `Map<agentApiId, agentUuid>`, then pass that map into `upsertProperty` to resolve `agentId`. Alternatively, leave `agent_id = null` during property upsert and do a single sweep after: `UPDATE properties p SET agent_id = a.id FROM agents a WHERE CAST(a.api_id AS text) = p.api_id` — but this requires a property-level `agent_api_id` column which does NOT exist in the schema. The `Map<>` approach is cleaner.

**Office ID resolution:** The `offices` table has 2 rows seeded in Story 2.1. Fetch them once at pipeline start and build `Map<apiGuid, uuid>`. Keys are `PZ_OFFICE_GUID` and `DOM_OFFICE_GUID`.

### Differ Hash Design

The SHA-256 hash is computed over a deterministic JSON string of these `RawProperty` fields only:

```ts
const hashPayload = JSON.stringify({
  priceUsd: Math.round(raw.priceUsd),
  titleEn: raw.titleEn,
  titleEs: raw.titleEs,
  descriptionEn: raw.publicRemarksEn,
  latitude: raw.latitude,
  longitude: raw.longitude,
  bedrooms: raw.bedrooms,
  bathrooms: raw.bathrooms,
  lotSizeM2: raw.lotSizeM2,
  constructionM2: raw.constructionM2,
  images: [...raw.images].sort(),  // sorted for stability
  amenities: raw.amenities,
  apiStatus: raw.apiStatus,
});
const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');
```

Do NOT include `apiRaw` (too large, always "changes" on minor API field additions). Do NOT include `agentApiId` or `officeApiId` (structural, not content). Do NOT include `expirationDate` in the hash — expiry drives `isExpired`, which is handled as `REMOVED`, not `UPDATED`.

Node's `crypto` module is built-in — no install needed. Import as `import { createHash } from "node:crypto"`.

### Slug Generation

Slugs must be URL-safe and unique. Algorithm:
```ts
function slugify(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')                      // decompose accented chars (á → a + combining)
    .replace(/\p{M}/gu, '')               // strip all combining marks (Unicode property)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return suffix ? `${base}-${suffix}` : base;
}
```

On upsert conflict for the slug (two listings with same English title), append the `apiId` as suffix: `slugify(raw.titleEn, raw.apiId)`. The `onConflictDoUpdate` for `api_id` means slug conflicts only happen at INSERT time (a new listing whose title duplicates an existing different listing). Detect by catching Postgres unique constraint error on `slug` and retrying with suffix.

### `/api/sync` Route Pattern

```ts
// src/app/api/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runSyncPipeline } from "@/lib/sync/pipeline";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSyncPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### LLM Anti-Pattern Guardrails

- **DO NOT** import `revalidateTag` from `'next/cache'` inside `pipeline.ts`. It will throw at runtime — `revalidateTag` only works in Route Handler / Server Action context. Instead, call the `/api/revalidate` HTTP endpoint.
- **DO NOT** install `slugify`, `uuid`, `crypto-js`, or any slug/hash library. Use native `node:crypto` for hashing and implement slugify inline per the spec above.
- **DO NOT** `SELECT *` from `properties` for the diff snapshot. Only select `api_id`, `api_hash`, `is_visible` — loading full JSONB `api_raw` for 300 rows wastes memory and slows the sync.
- **DO NOT** upsert `UNCHANGED` records. The explicit purpose of the diff is to avoid unnecessary writes. Test explicitly that zero DB calls are made for unchanged records.
- **DO NOT** create a separate `addresses` table, `property_types` lookup table, or any schema not defined in Story 2.1. This story writes to existing tables only.
- **DO NOT** add `"use client"` to any new file. Everything in this story is server-side only.
- **DO NOT** modify `src/lib/sync/api-client.ts`, `parser.ts`, `config.ts`, `schemas/`, or `utils/` — those are Story 2.2's territory and should not be touched by this story.
- **DO NOT** implement translation, image optimization, geo-tagging, or lifestyle-tagging in this story — those are Stories 2.4–2.7. The pipeline's Step 4 (translate) and Step 5 (optimize) are explicitly deferred.
- **DO NOT** add Sentry calls — Story 2.7 owns sync monitoring. Use `console.warn` / `console.error` only.
- **DO NOT** implement the admin UI for sync logs — Story 8.1 owns that. This story only writes to the `sync_logs` table.
- **DO NOT** hardcode the self-referencing revalidate URL. Use `process.env.NEXTAUTH_URL ?? 'http://localhost:3000'` as the base for the internal HTTP call.
- **DO NOT** hand-roll a duplicate `slugify` when it is already specified — implement it once in `src/lib/sync/utils/slugify.ts` and import from there in both property and agent upsert functions.
- **DO NOT** assume agents have the same `officeId` as properties. Both share the same offices lookup, but agents can be assigned to either office.
- **DO NOT** try to resolve `area_id`, `area_slug`, or `community_id` during property upsert — these require geo-fence PostGIS queries which belong to Story 2.6. Set them all to `null`.
- **DO NOT** attempt to add lifestyle tags to newly inserted properties — auto-tagging is Story 2.6. Always insert with `lifestyle_tags = []`.
- **DO NOT** add a `role` column to the `agents` table schema — it does not exist in Story 2.1 and adding it here would require a migration outside this story's scope. The `RawAgent.role` value should be silently dropped.
- **DO NOT** attempt to store `api_raw` on the `agents` table — the `agents` schema (Story 2.1) does NOT include an `api_raw` column (unlike `properties` which does). Attempting to set it will cause a TypeScript type error.

### Libraries & Versions

| Package | Version | Notes |
|---|---|---|
| `drizzle-orm` | `^0.44.0` (existing) | Use `insert(...).onConflictDoUpdate(...)` for upserts |
| `zod` | `^3.25.76` (existing) | Already in use from Story 2.2; no changes needed |
| `next` | `15.5.15` (existing) | `revalidateTag` from `'next/cache'`; Route Handlers in App Router |
| `vitest` | `^2.1.9` (existing) | Test runner; use `vi.mock` for DB mocking |
| `node:crypto` | (built-in) | For SHA-256 hashing in differ.ts |

No new npm dependencies required for this story.

### File Structure (Target)

```
src/
├── app/
│   └── api/
│       ├── sync/
│       │   └── route.ts              # NEW — POST /api/sync (cron trigger with CRON_SECRET auth)
│       └── revalidate/
│           └── route.ts              # NEW — POST /api/revalidate (ISR trigger with API_SECRET auth)
├── lib/
│   ├── db/
│   │   └── queries/
│   │       ├── properties.ts         # NEW — upsertProperty, softDeleteProperties
│   │       ├── agents.ts             # NEW — upsertAgent, updateAgentListingCounts
│   │       └── sync-log.ts           # NEW — createSyncLog, updateSyncLog
│   └── sync/
│       ├── pipeline.ts               # NEW — runSyncPipeline orchestrator (import "server-only")
│       ├── differ.ts                 # NEW — computePropertyHash, diffProperties, DiffResult (import "server-only")
│       └── utils/
│           └── slugify.ts            # NEW — slugify(text, suffix?) helper

tests/
└── unit/
    ├── db/
    │   └── sync-log.spec.ts          # NEW — createSyncLog / updateSyncLog unit tests (db mocked)
    └── sync/
        ├── differ.spec.ts            # NEW — hash + diff classification tests (pure functions, no mocks)
        ├── pipeline.spec.ts          # NEW — orchestrator tests (all DB + fetch calls mocked)
        └── slugify.spec.ts           # NEW — slugify edge cases (accents, special chars, suffix)
```

**Files NOT touched by this story:**
- `src/lib/sync/api-client.ts` — Story 2.2 (complete)
- `src/lib/sync/parser.ts` — Story 2.2 (complete)
- `src/lib/sync/config.ts` — Story 2.2 (complete)
- `src/lib/db/schema/**` — Story 2.1 (complete); no schema changes in this story
- `src/lib/db/client.ts` — Story 2.1 (complete)
- Any file under `src/app/` other than the two new route files

### Testing Requirements

- **Pure unit + integration-style tests.** No live database. Mock `@/lib/db/client` via `vi.mock('@/lib/db/client', () => ({ db: { insert: vi.fn(), update: vi.fn(), select: vi.fn(), ... } }))`. Use chained mock returns (`mockReturnValue({ values: vi.fn().mockReturnThis(), ... })`).
- **Differ tests are pure functions** — no mocking needed for `computePropertyHash` or `diffProperties`. Test with in-memory `RawProperty` stubs.
- **Pipeline test must verify** `UNCHANGED` records produce zero upsert calls (this is the NFR15 incremental processing guarantee).
- **ISR revalidation test:** spy on `global.fetch` to capture the `/api/revalidate` call; assert it is called after a successful sync; assert it is NOT awaited-to-throw (failure is swallowed with a warn).
- **All sync tests must pass** WITHOUT `process.env.DATABASE_URL`. If mocking is done correctly, the DB client is never instantiated.
- **`server-only` shim:** The `vitest.config.ts` already has a `server-only` alias from Story 2.2's setup. New files adding `import "server-only"` will work automatically.

### Previous Story Intelligence (Story 2.2)

Key learnings that directly impact Story 2.3:

1. **Double-safeParse anti-pattern:** Story 2.2's code review caught parsing records twice. Story 2.3 trusts `FetchResult<RawProperty>.records` — they are already Zod-validated. Do NOT re-parse them in the pipeline or differ.
2. **`server-only` alias in Vitest:** Already configured in `vitest.config.ts` with `resolve.alias` mapping `server-only` to an empty shim. New `src/lib/sync/*.ts` files with `import "server-only"` will work in tests without modification.
3. **`fetch` cache:** Story 2.2's `api-client.ts` already passes `{ cache: "no-store" }`. Story 2.3's pipeline-internal `fetch` to `/api/revalidate` must also pass `{ cache: "no-store" }`.
4. **`__setSleepFnForTests` hook:** `api-client.ts` exports this for test control over retry delays. Story 2.3's pipeline tests that exercise retry logic should use this hook — don't re-implement.
5. **`RawProperty.publicRemarksEn` vs `descriptionEn`:** The Story 2.2 parser outputs `publicRemarksEn` (not `descriptionEn`). Map `raw.publicRemarksEn → properties.description_en` in the upsert function.
6. **`priceUsd` is `number` from parser, `integer` in DB:** Story 2.2's field mapping table notes "keep as `number`; rounding is Story 2.3's job." Apply `Math.round()` in `upsertProperty`.
7. **`images` is `string[]` from parser:** Story 2.4 will replace with optimized image objects. For now, store the `string[]` directly into the `images` JSONB column as a JSON array of URL strings.
8. **Review-detected pattern — test assertion precision:** Story 2.2's review noted `>=2` should be `===2`. Apply the same rigor: use `.toBe(exactCount)` not `.toBeGreaterThanOrEqual()`.
9. **`officeApiId` is a `number`:** The parser returns `raw.officeApiId` as a number (`218` or `235`). The `offices` table stores `api_guid` as the text GUID string. The pipeline must look up `offices` by matching `PZ_OFFICE_GUID`/`DOM_OFFICE_GUID` env vars to the `offices.api_guid` column — NOT by the numeric `OfficeID`. The GUIDs are the canonical identifiers.

### Recent Git Intelligence

Recent commits relevant to this story:
- `df18bd2 chore: Phase 0 — add GH issue references and dependency graph` — Sprint tooling; irrelevant to implementation.
- Story 2.2 PR (#79) established the pattern for sync code organization: one file per concern, `server-only` at the top, JSDoc one-liners above exports, precise test assertions.
- Story 2.1 established Drizzle upsert patterns: see `src/lib/db/schema/properties.ts` for the existing schema structure; it uses `pgTable` with `uuid().primaryKey().defaultRandom()` for PKs and `text().notNull().unique()` for `api_id`.

### Project Structure Notes

- This story is pure back-end infrastructure. No `src/app/` pages other than the two new API routes, no components, no `messages/*.json`, no Tailwind, no UI.
- `src/lib/db/queries/` directory will be non-empty for the first time after this story. Architecture pre-declares `sync-log.ts`, `properties.ts`, `agents.ts`, `communities.ts`, `leads.ts` at this path — create only the first three; leave the others for later stories.
- The `src/app/api/revalidate/` route may conflict if a future story also needs to create it — this story owns it and should implement it here.
- Do NOT create `src/lib/db/queries/communities.ts` or `src/lib/db/queries/leads.ts` in this story.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: Sync Pipeline Core] — GH Issue #80, story requirements and ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#5. Data Sync Pipeline] — 8-step pipeline architecture, sync execution constraints
- [Source: _bmad-output/planning-artifacts/architecture.md#3. Project Structure] — source tree, pre-declared file paths
- [Source: _bmad-output/planning-artifacts/architecture.md#6. API Design] — `/api/sync` and `/api/revalidate` route specs
- [Source: _bmad-output/planning-artifacts/architecture.md#10. Security Architecture] — CRON_SECRET, API_SECRET patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#4. Database Schema] — properties, agents, sync_logs, offices table definitions
- [Source: _bmad-output/planning-artifacts/epics.md#Additional Requirements (Architecture)] — AR3, AR5, AR6, AR16, NFR15, NFR17, FR53, FR55, API7, API8
- [Source: _bmad-output/implementation-artifacts/2-1-database-schema-and-drizzle-models.md] — actual schema column names, `geographyPoint` custom type, office seeding
- [Source: _bmad-output/implementation-artifacts/2-2-api-integration-and-data-fetching.md] — `RawProperty`/`RawAgent` shapes, field mapping table, previous story learnings, review findings
- [Source: src/lib/db/schema/properties.ts] — verified column names and types
- [Source: src/lib/db/schema/agents.ts] — verified agent column names
- [Source: src/lib/db/schema/sync-logs.ts] — `SyncLog`, `NewSyncLog` types, column names
- [Source: src/lib/db/schema/offices.ts] — offices table, `api_guid` column
- [Source: src/lib/sync/api-client.ts] — `fetchPropertiesForOffice`, `fetchAgentsForOffice`, `RemaxApiError`, `__setSleepFnForTests`
- [Source: src/types/remax-api.ts] — `RawProperty`, `RawAgent`, `FetchResult`, `ParseError` canonical import path
- [Source: _bmad-output/test-artifacts/test-design-epic-2.md] — risk matrix, test coverage requirements for Story 2.3

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (Claude Code CLI, create-story workflow)

### Debug Log References

### Completion Notes List

### File List
