# Story 2.2: API Integration & Data Fetching

Status: done

## Story

As a **system**,
I want a typed, resilient client for the RE/MAX CCA API that fetches properties and agents for both Altitud offices and parses the raw payloads into validated, normalized in-memory shapes,
So that downstream sync stories (2.3 diff/upsert, 2.4 images, 2.5 translation, 2.6 lifestyle tags) can build on a single trustworthy ingestion layer instead of redoing parsing or guessing at field semantics.

## Acceptance Criteria

1. **Given** env vars `REMAX_API_BASE_URL`, `PZ_OFFICE_GUID`, `DOM_OFFICE_GUID` are set **When** any client function is called **Then** they are read once at module load via a typed `getRemaxConfig()` helper that throws a descriptive error listing the missing vars (no fallback to hardcoded GUIDs in source).

2. **Given** the API client **When** `fetchPropertiesForOffice(officeGuid)` is invoked **Then** it issues `GET ${REMAX_API_BASE_URL}/PropertiesPerOffice/{officeGuid}` and returns a list of validated `RawProperty` objects (AR4).

3. **Given** the API client **When** `fetchAgentsForOffice(officeGuid)` is invoked **Then** it issues `GET ${REMAX_API_BASE_URL}/AgentsPerOffice/{officeGuid}` and returns a list of validated `RawAgent` objects.

4. **Given** any HTTP fetch in the client **When** the response is non-2xx OR the body is not valid JSON OR the JSON is not an array **Then** the call retries with exponential backoff `2s → 4s → 8s` (3 attempts total), and only after the third failure does it throw a `RemaxApiError` with HTTP status, endpoint, and last error message (NFR17).

5. **Given** an empty array response (Altitud Cero returns `[]` today) **When** parsed **Then** the function returns `[]` and logs a single info-level breadcrumb (NOT an error) — empty offices are a valid steady state (API8).

6. **Given** a Zod schema for the raw RE/MAX property payload **When** a property record is parsed **Then** the schema accepts the field set documented in `docs/remax-properties-per-office-feed.md`, normalizes the inconsistent `publicRemarks_es` → `publicRemarksEs` key (API1), parses `Latitude`/`Longitude` from string to number with a `z.coerce.number()` step (API2), splits `Images` on `|` and URL-encodes filename segments (API3), falls back `ListingTitle_es` to `ListingTitle_en` when empty (API4), and prefers `ConstructionSize` over `ConstructionSizeLiving` since the latter is `0.00` for nearly all listings (API5).

7. **Given** `LotSizeArea` is present and `LotSizeUnits === "Sq Mt"` but the value is implausibly small for a property whose description mentions "hectare(s)" or "manzana(s)" (case-insensitive) **When** parsed **Then** the parser flags the listing with `lotSizeUnitWarning: true` in the returned object (downstream Story 2.3 will record it in `sync_logs.errors` as a warning) — values are NOT silently rewritten (API6).

8. **Given** a listing whose `ExpirationDate` parses to a date earlier than `now()` **When** processed **Then** the parser sets `isExpired: true` on the returned object so Story 2.3 can soft-delete it (API7). The current story only flags; it does not modify the database.

9. **Given** a Zod schema for the raw RE/MAX agent payload **When** an agent record is parsed **Then** it captures all public fields, **NEVER** exposes `Birthday` (the field is `.transform(() => undefined)` or `.omit()`-stripped from the output type so it cannot leak even via JSON.stringify — API9), and produces a normalized E.164 `whatsapp` field by trimming the `"506 XXXXXXXX"` `DirectPhone` value into `+50688887777` form (API10). When `DirectPhone` is empty/invalid, `whatsapp` is `null`.

10. **Given** the parser **When** a record fails Zod validation **Then** it is excluded from the returned array, an entry is appended to a per-call `parseErrors` collector (`{ apiId, scope: 'property' | 'agent', message, raw }`), and the function returns `{ records, parseErrors }`. Bad records do NOT crash the whole fetch (FR55).

11. **Given** API keys and office GUIDs **When** auditing the bundle **Then** they are referenced ONLY from server-only modules (`src/lib/sync/**`); a `import "server-only"` directive at the top of `src/lib/sync/api-client.ts` enforces this at build time. Grep confirms no `NEXT_PUBLIC_` variant exists for any of these vars (NFR11).

12. **Given** request/response shapes **When** consumers import them **Then** TypeScript types `RawProperty`, `RawAgent`, `RemaxConfig`, `ParseError`, and `FetchResult<T>` export cleanly from `src/types/remax-api.ts` (re-exporting Zod-derived types via `z.infer<>`). Consumers never import from `zod` directly to get these types — one canonical path.

13. **Given** the dev workflow **When** running `npm run typecheck && npm run lint && npm run format:check && npm run build` **Then** all pass with zero new errors. Vitest tests for the parser pass against fixtures in `tests/fixtures/remax-api/`.

14. **Given** the test suite **When** `npm test` runs **Then** these scenarios pass without any live network call (use `vi.spyOn(global, 'fetch')` or `msw`):
    - PZ office happy path: 2 well-formed listings + 1 invalid listing → returns 2 records + 1 parseError; `Latitude`/`Longitude` round-trip as numbers; `images` is a string array; `publicRemarksEs` is populated from the lowercase API key.
    - Empty array (Altitud Cero) → returns `{ records: [], parseErrors: [] }` with no thrown error.
    - 500 error on first 2 attempts, 200 on third → succeeds; 500 on all 3 → throws `RemaxApiError`.
    - Agent parse: `Birthday` is absent from the returned object's keys (`Object.keys()` assertion); `DirectPhone: "506 88887777"` → `whatsapp: "+50688887777"`; `DirectPhone: ""` → `whatsapp: null`.
    - Lot size warning: a `Lot/Land` listing with `LotSizeArea: 31` and description containing "31 hectares" → `lotSizeUnitWarning: true`.
    - Expired listing: `ExpirationDate: "2020-01-01T00:00:00"` → `isExpired: true`.

15. **And** no database writes, no schema changes, no API routes, no UI changes, and no changes to `src/lib/db/**` are made by this story. Output is a pure parsing + fetching layer ready to be orchestrated by Story 2.3.

## Tasks / Subtasks

- [x] Task 1: Env config helper (AC: #1, #11)
  - [x] Create `src/lib/sync/config.ts` exporting `getRemaxConfig(): RemaxConfig`.
  - [x] Read `process.env.REMAX_API_BASE_URL`, `process.env.PZ_OFFICE_GUID`, `process.env.DOM_OFFICE_GUID`.
  - [x] Throw `Error("Missing required RE/MAX env vars: …")` listing every missing var (do not throw on the first miss; aggregate so the operator sees the full list).
  - [x] Add `import "server-only"` at the top of every file in `src/lib/sync/` so accidental client imports fail the build.
  - [x] Update `.env.example`: keep existing lines but verify `REMAX_API_BASE_URL=https://api.remax-cca.com/api`, `PZ_OFFICE_GUID=FEA8746D-CC1D-41B8-89F3-D04AC98274AF`, `DOM_OFFICE_GUID=4AD5AE8F-5B47-4A1A-A953-40445F2B4940` are present as documentation defaults (already present per Story 2.1; just confirm).

- [x] Task 2: Define types and Zod schemas (AC: #6, #8, #9, #12)
  - [x] Install `zod` (NEW dep): `npm install zod@^3` — pin to `^3.x` per Architecture Technology Version Pinning. Do NOT bump to v4 even if it exists — the architecture explicitly targets v3.
  - [x] Create `src/types/remax-api.ts` (NEW). It owns the canonical TypeScript types for raw API records and parser results. Re-export `z.infer` types — do NOT hand-roll these interfaces.
  - [x] Create `src/lib/sync/schemas/property.ts`:
    - Define `rawPropertyApiSchema` — a Zod object that accepts the API's literal field set (`ListingId`, `ListingKey`, `PropertyTypeName_en`, …, `publicRemarks_es` lowercase p, …) listed in `docs/remax-properties-per-office-feed.md`.
    - Use `.transform(...)` to produce a `RawProperty` with normalized camelCase keys, parsed coordinates (`z.coerce.number()`), split images, fallbacks, derived `isExpired`, derived `lotSizeUnitWarning`, and a preserved `apiRaw` field that holds the untouched original payload (Story 2.1's `properties.api_raw` JSONB will be populated from this in Story 2.3).
    - For the description in Spanish, accept `publicRemarks_es` (lowercase `p`) — this is API1. Map it to `publicRemarksEs` in the output.
  - [x] Create `src/lib/sync/schemas/agent.ts`:
    - Define `rawAgentApiSchema` mirroring the agent fields in `docs/remax-cca-api-docs.md`.
    - Strip `Birthday` from the output type (use `.omit({ Birthday: true })` on the output transform OR `.transform()` to a new object that simply does not reference `Birthday`). API9 is non-negotiable.
    - Add the WhatsApp normalizer per API10 (see [Phone Normalization](#phone-normalization)).
  - [x] Export Zod-inferred types from `src/types/remax-api.ts` so consumers import from `@/types/remax-api`, not from `@/lib/sync/schemas/*`.

- [x] Task 3: HTTP client with retries (AC: #2, #3, #4, #5)
  - [x] Create `src/lib/sync/api-client.ts` (matches architecture §3 source tree).
  - [x] Implement `fetchWithRetry(url: string): Promise<unknown>`:
    - Use the global `fetch` (Node 20 has it natively — already available, no `node-fetch` install).
    - Attempts: 3. Backoff delays: `2_000`, `4_000`, `8_000` ms (exact NFR17 values).
    - Treat as failure: non-2xx HTTP, `JSON.parse` failure, body root not an array.
    - On retry, log a `console.warn(...)` with attempt number, delay, status; on terminal failure, throw `RemaxApiError`.
    - Define `class RemaxApiError extends Error { readonly endpoint: string; readonly status?: number; readonly cause?: unknown }` co-located in `api-client.ts`.
  - [x] Implement `fetchPropertiesForOffice(officeGuid: string)`:
    - Build URL via `${baseUrl}/PropertiesPerOffice/${officeGuid}`.
    - Call `fetchWithRetry` then call `parsePropertyArray(json)` (Task 4).
    - Return `FetchResult<RawProperty>`.
    - On empty array: log `console.info("[remax-api] No properties for office {officeGuid} (steady-state for new office)")`, return `{ records: [], parseErrors: [] }`.
  - [x] Implement `fetchAgentsForOffice(officeGuid: string)` symmetrically.
  - [x] Add a `sleep(ms)` helper in the same file (private). Do NOT pull in a sleep library.

- [x] Task 4: Parser orchestrator (AC: #6, #7, #8, #9, #10)
  - [x] Create `src/lib/sync/parser.ts` exporting:
    - `parsePropertyArray(json: unknown): FetchResult<RawProperty>`
    - `parseAgentArray(json: unknown): FetchResult<RawAgent>`
  - [x] Each function:
    - Validates the root is an array (already done in `fetchWithRetry`, but defensively re-check).
    - Iterates each element, calls `.safeParse()`, pushes valid records to `records` and bad ones to `parseErrors`.
    - Property-only: after Zod parse, check the description text for `/hectare|hectárea|manzana/i` and toggle `lotSizeUnitWarning` if `LotSizeArea < 1000` despite `LotSizeUnits === "Sq Mt"` (API6 — flag only, do not rewrite).
    - Property-only: if `ExpirationDate` parses to a Date `<` `new Date()`, set `isExpired: true` (API7).
  - [x] Do NOT throw on a single bad record. Throwing here violates AC #10 and FR55.

- [x] Task 5: Phone normalization helper (AC: #9)
  - [x] Add `normalizeCostaRicaPhone(raw: string | null | undefined): string | null` in `src/lib/sync/utils/phone.ts`.
  - [x] Strip all non-digit characters; if the result starts with `506` and has 11 digits total, return `+${digits}`; otherwise if it has exactly 8 digits, prepend `+506` and return; otherwise return `null`. See [Phone Normalization](#phone-normalization) for examples.
  - [x] Unit test in `tests/unit/sync/phone.spec.ts` covering the cases listed in the section below.

- [x] Task 6: Tests with fixtures (AC: #13, #14)
  - [x] Add `tests/fixtures/remax-api/properties-pz-sample.json` — capture a small representative slice (2 valid + 1 invalid record). Pull from the fields in `docs/remax-properties-per-office-feed.md#sample-listing-minimal` and add a deliberately-invalid one (e.g. missing `ListingId`).
  - [x] Add `tests/fixtures/remax-api/properties-pz-empty.json` — `[]`.
  - [x] Add `tests/fixtures/remax-api/agents-pz-sample.json` — 2 valid + 1 with empty `DirectPhone` to assert WhatsApp `null`.
  - [x] Add `tests/unit/sync/api-client.spec.ts` — uses `vi.spyOn(globalThis, 'fetch')` to stub responses; covers the retry matrix (success, retry-then-success, exhaust retries).
  - [x] Add `tests/unit/sync/parser.spec.ts` — covers each AC #14 scenario against the fixtures.
  - [x] All tests must run WITHOUT a database (no Postgres dependency) and WITHOUT live network. Tests are a pure unit suite.

- [x] Task 7: Verify, build, commit (AC: #13)
  - [x] `npm run typecheck` → 0 errors.
  - [x] `npm run lint` → 0 errors.
  - [x] `npm run format:check` → pass.
  - [x] `npm run build` → pass (Next.js build will fail if any client component accidentally imports `src/lib/sync/**` — that's the point of the `server-only` guard).
  - [x] `npm test` → all green.
  - [ ] PR title: `feat: RE/MAX CCA API client, Zod schemas, retry layer (Story 2.2)` — base `main`. Open PR is deferred to the reviewer (Story 2.1 set this precedent).

## Dev Notes

### Architecture Compliance

- **Source tree (Architecture §3):** all sync code lives under `src/lib/sync/`. The architecture pre-declared these files: `api-client.ts`, `pipeline.ts`, `differ.ts`, `translator.ts`, `image-optimizer.ts`, `geo-tagger.ts`, `lifestyle-tagger.ts`, `alert.ts`. **This story creates only `api-client.ts`** plus supporting `config.ts`, `parser.ts`, `schemas/`, and `utils/phone.ts`. It does NOT create the others — they belong to Stories 2.3–2.7.
- **Types (Architecture §3):** non-DB external API types live in `src/types/`. Story 2.1 deferred `src/types/api.ts` to this story (see [previous story Project Structure Notes](#previous-story-intelligence)). Use the exact path `src/types/remax-api.ts` (the architecture's `api.ts` is reserved for internal API request/response shapes — not the upstream RE/MAX CCA payloads).
- **Validation (Architecture §10 Data Security):** all external input must be Zod-validated. This story delivers the first Zod schemas in the codebase.
- **Server-only (Architecture §10 / NFR11):** API GUIDs and base URL are server-only. Use the `server-only` package (zero-dep, ships with Next.js — no install) at the top of every `src/lib/sync/**` file.
- **No HTTP client library:** Use the built-in `fetch`. Architecture does not authorize axios/got/ky. Node 20 (declared in package.json `@types/node ^20`) has fetch natively. The `package.json` already targets Next.js 15 + React 19, both of which require Node 18+; Node 20+ is the production target on Coolify.
- **Retry policy (NFR17):** 3 attempts with `2s/4s/8s` backoff is taken verbatim from architecture §5 (`Retry: 3 attempts with exponential backoff (2s, 4s, 8s)`). Do not invent a different schedule.
- **No database access this story:** Per AC #15, no `import { db } from "@/lib/db/client"` anywhere in the new code. The fetch+parse layer is pure — Story 2.3 will wire it into the orchestrator and write to Postgres.

### Field Mapping Reference

The authoritative field reference is `docs/remax-properties-per-office-feed.md`. Quick map for the parser output type (`RawProperty`):

| API field | Output key | Notes |
|---|---|---|
| `ListingId` (int) | `apiId: string` | Stringify; this becomes `properties.api_id` in Story 2.3 |
| `ListingKey` (string) | `apiKey: string` | Used in image URL pattern |
| `PropertyTypeName_en` | `propertyTypeEn` | Trim trailing whitespace (API quirk: `"Lote/Terreno "`) |
| `PropertyTypeName_es` | `propertyTypeEs` | Trim |
| `ListingTitle_en` | `titleEn` | NOT NULL — guaranteed by API |
| `ListingTitle_es` | `titleEs` | If empty string → fall back to `titleEn` (API4) |
| `PublicRemarks_en` | `publicRemarksEn` | Preserve `\r\n` line breaks; do NOT strip HTML in this story |
| `publicRemarks_es` ⚠️ lowercase p | `publicRemarksEs` | API1: lowercase key on input, camelCase on output |
| `Latitude` (string) | `latitude: number \| null` | `z.coerce.number()`; if NaN → `null` |
| `Longitude` (string) | `longitude: number \| null` | Same |
| `ListPrice` (float) | `priceUsd: number` | Round to integer (Story 2.1 schema is `integer`) — but in this story keep as `number`; rounding is Story 2.3's job |
| `CurrencyId` (int) | `currencyId: number` | `4` = USD; preserve as-is |
| `CurrencyListPrice` | `currencyListPrice: string` | Preserve raw |
| `BedroomsTotal` | `bedrooms: number \| null` | Land has null |
| `BathroomsFull` | `bathrooms: number \| null` | Land has null |
| `LotSizeArea` (float) | `lotSizeM2: number \| null` | API uses `LotSizeUnits === "Sq Mt"` only; if non-Sq Mt encountered, `null` and add to `parseErrors` (defensive) |
| `ConstructionSize` | `constructionM2: number \| null` | API5: prefer this over `ConstructionSizeLiving` (which is always `0.00`) |
| `ConstructionSizeLiving` | (NOT mapped) | Discard — useless per API5 |
| `Images` (pipe-delimited) | `images: string[]` | Split on `\|`, trim each, URL-encode the filename segment after the last `/` (API3) |
| `Videolink` | `videoUrl: string \| null` | YouTube link if present |
| `ExpirationDate` (ISO) | `expirationDate: Date` + derived `isExpired: boolean` | API7 |
| `AssociateId` (int) | `agentApiId: string` | Stringify for join with agents |
| `OfficeID` (int) | `officeApiId: number` | `218` = Altitud, `235` = Altitud Cero |
| `Furnishedyn`, `PoolPrivate`, `Garage`, `Cooling`, `Viewyn`, `GatedCommunity`, `MaidRoom` | `amenities: { furnished, pool, garage, cooling, view, gated, maidRoom }` (boolean) | `"Y"` → `true`; `"N"` → `false` |
| `GarageSpaces` | `amenities.garageSpaces: number` | Preserve as integer |
| `Stories` | `stories: number` | `0` for land |
| `Status` | `apiStatus: string` | Preserve full string; status parsing is Story 2.3's concern |
| `UnparsedAddress` | `unparsedAddress: string` | Preserve raw; address parsing is out of scope |
| `(entire raw object)` | `apiRaw: unknown` | Preserve untouched original — Story 2.1 schema declares `properties.api_raw` JSONB |

`RawAgent` mirror:

| API field | Output key | Notes |
|---|---|---|
| `AssociateID` (int) | `apiId: string` | Stringify |
| `FirstName` + `LastName` | `name: string` | `${first} ${last}` (trim) |
| `RemaxEmail` | `email: string \| null` | Prefer this over `NonRemaxEmail` (per API docs §Agent Data Observations) |
| `NonRemaxEmail` | (preserved in `apiRaw`) | Do not expose |
| `DirectPhone` | `phone: string \| null`, `whatsapp: string \| null` | Raw → `phone`; normalized E.164 → `whatsapp` (API10) |
| `Mobile` | (preserved in `apiRaw`) | Often empty; not used as a primary phone |
| `UrlImg` | `photoUrl: string \| null` | `balloon.remax-cca.com` host; do NOT optimize this story (Story 2.4) |
| `Lang` | `primaryLang: 'en' \| 'es'` | `"English"` → `"en"`, `"Spanish"` → `"es"`, else `null` |
| `OfficeID` (int) | `officeApiId: number` | `218` or `235` |
| `Title` (`"Owner"` \| `"Associate"`) | `role: 'owner' \| 'associate'` | `Owner` → `'owner'`, anything else → `'associate'` |
| `Birthday` | ❌ NOT mapped, NOT in output type | API9 — exclusion is enforced by the schema's transform output |

### Phone Normalization

Costa Rica phone numbers from RE/MAX arrive in three observed shapes:

| Input | Output |
|---|---|
| `"506 88887777"` (canonical from API) | `"+50688887777"` |
| `"50688887777"` (no space) | `"+50688887777"` |
| `"88887777"` (8 digits, no country code) | `"+50688887777"` |
| `"506-8888-7777"` | `"+50688887777"` |
| `""` / `null` / `undefined` | `null` |
| `"123"` (too short) | `null` |
| `"506 1234567"` (7 digits after 506 — invalid) | `null` |

Algorithm:
```ts
const digits = (raw ?? "").replace(/\D/g, "");
if (digits.length === 11 && digits.startsWith("506")) return `+${digits}`;
if (digits.length === 8) return `+506${digits}`;
return null;
```

### Image URL Encoding

The `Images` field contains URLs whose filenames frequently contain spaces, parentheses, and special characters (e.g., `image (1).jpeg`, `MAIN _1_.jpeg`). After splitting on `|`:

```ts
function encodeImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const lastSlash = trimmed.lastIndexOf("/");
  if (lastSlash === -1) return encodeURI(trimmed);
  const base = trimmed.slice(0, lastSlash + 1);
  const filename = trimmed.slice(lastSlash + 1);
  return base + encodeURIComponent(filename);
}
```

Filter out empty strings after splitting (the API sometimes emits trailing `|`). Story 2.4 will download these URLs; this story only normalizes them.

### LLM Anti-Pattern Guardrails

- ❌ **Do NOT install `axios`, `got`, `ky`, `node-fetch`, or any HTTP client library.** Use the global `fetch` only. Node 20+ has it natively.
- ❌ **Do NOT install `zod` v4** even if it shipped — Architecture pins zod to `^3.x`. Use `npm install zod@^3`.
- ❌ **Do NOT write `process.env.X` reads scattered across files.** All env access goes through `getRemaxConfig()` in `src/lib/sync/config.ts`. This makes future env-source swaps (e.g., reading from a secrets manager) trivial and makes tests easy to mock.
- ❌ **Do NOT define a separate hand-rolled `interface RawProperty` in addition to the Zod schema.** Use `z.infer<typeof rawPropertySchema>` as the single source of truth — duplicating types is a known LLM failure mode and they will drift.
- ❌ **Do NOT modify any file under `src/lib/db/**`.** No schema changes, no new queries, no client edits. This story is pre-database.
- ❌ **Do NOT touch `src/lib/db/client.ts`** — Story 2.1 explicitly forbids it and that constraint persists. If sync needs DB access (it will, in Story 2.3), it imports the existing `db` then.
- ❌ **Do NOT add API routes** (`src/app/api/sync/route.ts` etc.). The `/api/sync` orchestrator is Story 2.3.
- ❌ **Do NOT write code that depends on `Birthday` being present in the output type.** The schema strips it. Anyone needing it later must explicitly access `apiRaw.Birthday` and answer to API9 in their code review.
- ❌ **Do NOT log raw agent payloads with `console.log(agent)`.** That payload contains `Birthday`. Log the typed `RawAgent` (post-strip) or specific fields only.
- ❌ **Do NOT silently rewrite suspicious `LotSizeArea` values.** API6 says flag, do not auto-correct. The data team needs visibility on these in `sync_logs.errors` later.
- ❌ **Do NOT batch-throw on a single bad record.** AC #10 + FR55 require per-record skip-and-log. A single malformed listing must not block the other 27.
- ❌ **Do NOT assume the API returns ordered records or stable IDs across runs.** `ListingId` is stable; `Status` text is not. Use `ListingId` (and `OfficeID` for the composite key) for cross-run identity.
- ❌ **Do NOT hardcode `https://api.remax-cca.com/api`** — use `getRemaxConfig().baseUrl` everywhere. The base URL must remain swappable for fixture replay in tests (set env to a `file://` or mock URL is fine).
- ❌ **Do NOT add Sentry calls in this story.** Sync-level Sentry instrumentation is part of Story 2.7. Use `console.warn` / `console.info` only.
- ❌ **Do NOT add `"use client"`** to any new file. Everything in `src/lib/sync/**` is server-only. The `import "server-only"` directive enforces this — if it errors at build time, you've imported a sync module from a client component, which is a regression.

### Libraries & Versions

| Package | Version | Notes |
|---|---|---|
| `zod` | `^3.x` (NEW) | Pinned to v3 by Architecture. `npm install zod` will currently resolve `^3.x`; do NOT use `@latest` if v4 is published. |
| `server-only` | (built-in to Next.js) | No install — `import "server-only";` works out of the box. |
| `vitest` | `^2.x` (existing from Story 2.1) | Test runner. |

### File Structure (Target)

```
src/
├── lib/
│   └── sync/
│       ├── api-client.ts          # NEW — fetchPropertiesForOffice / fetchAgentsForOffice / RemaxApiError
│       ├── config.ts              # NEW — getRemaxConfig() env reader
│       ├── parser.ts              # NEW — parsePropertyArray / parseAgentArray (per-record safeParse loop)
│       ├── schemas/
│       │   ├── property.ts        # NEW — rawPropertyApiSchema + RawProperty inferred type
│       │   └── agent.ts           # NEW — rawAgentApiSchema + RawAgent inferred type (Birthday stripped)
│       └── utils/
│           ├── phone.ts           # NEW — normalizeCostaRicaPhone
│           └── images.ts          # NEW — encodeImageUrl (split-and-encode helper)
└── types/
    └── remax-api.ts               # NEW — single import path for RawProperty / RawAgent / FetchResult / ParseError / RemaxConfig

tests/
├── fixtures/
│   └── remax-api/
│       ├── properties-pz-sample.json    # NEW — 2 valid + 1 invalid
│       ├── properties-pz-empty.json     # NEW — []
│       └── agents-pz-sample.json        # NEW — 2 valid + 1 with empty DirectPhone
└── unit/
    └── sync/
        ├── api-client.spec.ts     # NEW — fetch retry matrix (mocked)
        ├── parser.spec.ts         # NEW — fixture-driven parse tests
        └── phone.spec.ts          # NEW — phone normalization edge cases
```

The architecture pre-declared `src/lib/sync/api-client.ts` at this exact path (Architecture §3 source tree). Use that path verbatim.

### Testing Requirements

- **Pure unit suite.** No database, no live network. Use `vi.spyOn(globalThis, 'fetch')` to stub HTTP. Tests must run in <2s.
- **Fixture-driven.** All API payload tests load real-shaped JSON from `tests/fixtures/remax-api/`. Capture the fixtures from the actual API once (`curl https://api.remax-cca.com/api/PropertiesPerOffice/FEA8746D-CC1D-41B8-89F3-D04AC98274AF | jq '.[0:2]'`) and trim sensitive personal data (agent emails should be left intact since they are public business contacts; `Birthday` from agents may be REDACTED to a fixed dummy date in fixtures since the schema strips it anyway).
- **Retry timing in tests.** When testing the retry path, override the `sleep` helper via dependency injection or a module-level `setTimeout` shim — DO NOT actually wait 14 seconds (`2 + 4 + 8`) per test. Pattern: export `__setSleepFnForTests` or pass an optional `sleep` arg.
- **`server-only` import in unit tests.** Vitest does not run the Next.js build pipeline, so `import "server-only"` is a no-op — it will not throw in tests but WILL throw at Next build time if a client component imports the file. Verify by running `npm run build` after the implementation lands.
- **Coverage gate:** none required by this story. CI does not have a coverage threshold configured.

### Previous Story Intelligence

From Story 2.1 (`2-1-database-schema-and-drizzle-models.md`):

- **`src/types/` is `.gitkeep`-only today** — Story 2.1 deferred non-DB external API types here, naming Story 2.2 explicitly: *"src/types/*.ts is reserved for NON-DB types (UI, API request/response shapes from RE/MAX CCA API — those come in Story 2.2 with Zod schemas)."* That's this story.
- **DB schema mapping target:** Story 2.1 created `properties.api_id` (text, unique), `properties.api_raw` (jsonb), `agents.api_id` (text, unique), `agents.whatsapp` (text, expected E.164), `agents.phone` (text, raw "506 XXXXXXXX"). The parser output shapes in this story map directly to these columns — Story 2.3 will do the actual `INSERT … ON CONFLICT (api_id) DO UPDATE`.
- **PostGIS coordinates:** Story 2.1 created `properties.geo` as `geography(Point, 4326)` plus `properties.latitude` / `properties.longitude` (`double precision`). The parser produces both `latitude` and `longitude` as numbers; Story 2.3 will compose them into a `GeoPoint` for the `geo` column.
- **Office GUIDs:** Story 2.1 seeded the `offices` table with `api_guid = "FEA8746D-…"` (PZ) and `api_guid = "4AD5AE8F-…"` (Cero). The parser does NOT need to look these up — Story 2.3 joins by `api_guid` later. This story just passes the GUID into the fetch call.
- **`src/lib/db/client.ts` and `src/lib/db/health-check.ts` remain untouched.** Story 2.1's guardrail still applies.
- **Migration runner pattern:** Story 2.1 added `dotenv` + `tsx` for `db:migrate`. This story does NOT use them — the sync code runs inside Next.js where env vars are loaded by Next itself. Do NOT import `dotenv` in `src/lib/sync/**`.
- **Vitest is configured.** `vitest.config.ts` already exists with `css: { postcss: { plugins: [] } }`. New unit tests under `tests/unit/sync/` will pick up that config — no changes needed.
- **CI gates:** typecheck → lint → format check → build. Story 2.1 verified all four pass with the new DB code; this story must keep them green. Add `npm test` to your pre-PR checklist (Story 2.1's tests are DB-gated and skip without `DATABASE_URL`; new sync tests have no such gate and MUST always run).

### Recent Git Intelligence

Recent commits (last 5):
- `7ff6d0f Merge pull request #66 from CastroFamilia/2-1-database-schema-and-drizzle-models` — Story 2.1 just landed (this is your foundation).
- `40ba17c chore: gitignore .agent/bad-session-state.json runtime state` — BMAD tooling, irrelevant.
- `06c9517 chore: add BAD module skill files` — BMAD tooling, irrelevant.
- `78ffed8 docs: refresh README current-status table from sprint-status.yaml` — docs, irrelevant.
- `ee3d2f5 Merge pull request #65 from CastroFamilia/feat/bmad-autonomous-development` — BMAD tooling, irrelevant.

Pattern signals from #66 (Story 2.1):
- Schema modules are organized as one-file-per-entity under `src/lib/db/schema/` with a barrel re-export. Mirror this style for `src/lib/sync/schemas/` (one file per Zod schema: `property.ts`, `agent.ts`).
- Story 2.1 added a `vitest.config.ts` and `tests/unit/db/` directory with a Vitest spec that gates on `process.env.DATABASE_URL`. Follow the same Vitest spec layout under `tests/unit/sync/` but with NO env gate — sync tests are pure.
- JSDoc style: one short sentence above each exported symbol. Avoid multi-line essays.
- Story 2.1 review yielded ~12 [Patch] / [Defer] items mostly about migration robustness, trailing newlines, and test precision (`>=2` → `===2`). Apply the lesson: be precise in assertions (use `.toBe()` for exact counts, not `.toBeGreaterThanOrEqual()`).

### Latest Tech Information

- **Node fetch in Node 20:** `globalThis.fetch` is stable since Node 18 LTS and fully production-ready in Node 20 (the deployment target). No `--experimental` flag needed. `Response.json()` returns `Promise<unknown>` — always assert structure (we do, via Zod). On non-2xx, `fetch` does NOT throw — you must check `response.ok`.
- **Zod v3 vs v4:** Zod v4 is in beta as of Q2 2026 with breaking API changes (notably `.transform()` ergonomics). Architecture pins v3. Stay there. If `npm install zod` resolves to v4, downgrade explicitly: `npm install zod@^3.23`.
- **`server-only` package:** Built into Next.js 13+. The directive triggers a Webpack/Turbopack rule that errors the build if any module marked `server-only` is imported by a Client Component. Zero runtime cost.
- **Next.js 15 fetch caching:** By default, `fetch` in a Next.js 15 server context is NOT cached unless you explicitly opt in with `{ next: { revalidate: N } }` or `{ cache: 'force-cache' }`. The sync flow MUST run with NO caching — pass `{ cache: 'no-store' }` to every `fetch` call (or set `next.revalidate = 0`). Stale responses across syncs would defeat the entire diff system in Story 2.3.
- **Costa Rica phone format (E.164):** ITU-T E.164 caps total length at 15 digits including country code. CR (`+506`) + 8 local digits = 12 chars including the `+`, well under the limit. Strip everything else — no spaces, no dashes — when storing in the `agents.whatsapp` column for direct use in `https://wa.me/{digits-no-plus}` URLs (Story 2.1's `agents.whatsapp` doc says "E.164 normalized form").

### Project Structure Notes

- This story is pure back-end infrastructure. No `src/app/`, no components, no `messages/*.json`, no Tailwind, no UI. If you find yourself editing anything under `src/app/` or `src/components/` or `src/messages/` — STOP, you're outside scope.
- `src/types/` becomes non-empty for the first time in this story (`remax-api.ts`). Future stories will add `property.ts`, `agent.ts`, etc. for UI-shaped types — do NOT pre-create those.
- `src/lib/sync/` becomes non-empty for the first time in this story. Future stories add the orchestrator and the other six pre-declared modules.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#5. Data Sync Pipeline] — pipeline architecture, retry policy
- [Source: _bmad-output/planning-artifacts/architecture.md#6. API Design] — RE/MAX CCA API integration table
- [Source: _bmad-output/planning-artifacts/architecture.md#3. Project Structure] — `src/lib/sync/` source tree
- [Source: _bmad-output/planning-artifacts/architecture.md#10. Security Architecture] — env vars, server-only API keys
- [Source: _bmad-output/planning-artifacts/architecture.md#Technology Version Pinning] — zod 3.x pin
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR11, NFR15, NFR17, NFR18
- [Source: _bmad-output/planning-artifacts/epics.md#Additional Requirements (Architecture)] — AR4–AR6, API1–API10
- [Source: docs/remax-cca-api-docs.md] — verified API endpoints, auth, sample data
- [Source: docs/remax-properties-per-office-feed.md] — full property field reference
- [Source: _bmad-output/implementation-artifacts/2-1-database-schema-and-drizzle-models.md] — previous story; DB column names and `src/types/` deferral

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Code CLI, dev-story workflow)

### Debug Log References

- `npm run typecheck` → 0 errors.
- `npm run lint` → 0 errors.
- `npm run format:check` → passes (two files auto-formatted via `npx prettier --write`).
- `npm run build` → passes; `server-only` guard verified at build time.
- `npm test` → 24 new sync tests pass, 3 DB-gated tests correctly skipped without `DATABASE_URL`.
- `grep -r "NEXT_PUBLIC_REMAX\|NEXT_PUBLIC_PZ\|NEXT_PUBLIC_DOM" src/ .env.example` → no matches (AC #11).

### Completion Notes List

- Implemented the full fetch + parse layer per Architecture §3 source tree (`src/lib/sync/api-client.ts`, `config.ts`, `parser.ts`, `schemas/property.ts`, `schemas/agent.ts`, `utils/phone.ts`, `utils/images.ts`) plus the canonical external-API type barrel at `src/types/remax-api.ts`.
- `getRemaxConfig()` aggregates missing vars into one error message so operators see the full list in one pass rather than fix-rebuild-fix.
- `rawPropertyApiSchema` uses `.passthrough()` so newly added upstream fields do not break parsing; the original payload is preserved untouched on `apiRaw` for Story 2.3's JSONB column.
- `rawAgentApiSchema` accepts `Birthday` in the input grammar (so Zod does not reject the record) but the derived `RawAgent` output shape never references it — `Object.keys(agent)` excludes it, honoring API9.
- `normalizeCostaRicaPhone()` only returns E.164 for confidently valid lengths (8 bare digits or `506` + 8). Dashes/spaces are stripped; ambiguous values return `null`.
- `fetchWithRetry` uses the exact NFR17 backoff (2s / 4s / 8s, 3 attempts) and treats non-2xx, non-JSON, and non-array bodies as failures. Terminal failures throw `RemaxApiError` carrying endpoint, status, and cause.
- `fetch` is called with `{ cache: "no-store" }` — Next.js 15 caches server-side `fetch` by default, which would defeat the diff system in Story 2.3.
- Retry-path tests use a `__setSleepFnForTests(fn)` hook so no test actually waits 14 seconds.
- **Deviation from Dev Notes:** the note "`import 'server-only'` is a no-op in Vitest" was inaccurate — the npm `server-only` module always throws, and Next's alias is not active under Vitest. Added a Vitest `resolve.alias` entry (`tests/setup/server-only-shim.ts`) that maps `server-only` to an empty module for unit tests, preserving the Next build-time guard. Also installed `server-only@^0.0.1` as a devDependency so the directive resolves cleanly in non-Next contexts.
- **Out of scope** (deferred, as stated in AC #15): Task 7's final "Open PR" sub-item — the story defers PR creation to the reviewer workflow (Story 2.1 precedent).

### File List

**New:**
- `src/lib/sync/config.ts`
- `src/lib/sync/api-client.ts`
- `src/lib/sync/parser.ts`
- `src/lib/sync/schemas/property.ts`
- `src/lib/sync/schemas/agent.ts`
- `src/lib/sync/utils/phone.ts`
- `src/lib/sync/utils/images.ts`
- `src/types/remax-api.ts`
- `tests/fixtures/remax-api/properties-pz-sample.json`
- `tests/fixtures/remax-api/properties-pz-empty.json`
- `tests/fixtures/remax-api/properties-pz-lot-warning.json`
- `tests/fixtures/remax-api/properties-pz-expired.json`
- `tests/fixtures/remax-api/agents-pz-sample.json`
- `tests/unit/sync/config.spec.ts`
- `tests/unit/sync/phone.spec.ts`
- `tests/unit/sync/parser.spec.ts`
- `tests/unit/sync/api-client.spec.ts`
- `tests/setup/server-only-shim.ts`

**Modified:**
- `.env.example` — filled in documentation defaults for the three RE/MAX vars.
- `package.json` / `package-lock.json` — added `zod@^3.25.76` (dep) and `server-only` (devDependency for Vitest shim compatibility).
- `vitest.config.ts` — added `server-only` alias so unit tests can resolve the directive.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — transitioned `2-2-...` to `in-progress` → `review`.

### Review Findings

- [x] [Review][Decision] Third backoff slot (`8000ms`) is allocated but never awaited — with 3 attempts the loop sleeps only 2s then 4s, and the 8s entry in `DEFAULT_RETRY_DELAYS_MS` is dead code [src/lib/sync/api-client.ts:6, 36-69]. Spec Task 3 says `[2_000, 4_000, 8_000]` verbatim while NFR17 says "3 attempts". Decide: drop the 8s entry, or add a 4th attempt to consume it.
- [x] [Review][Decision] `fetch` has no `AbortSignal` / timeout, so a hung TCP connection stalls the sync forever per attempt [src/lib/sync/api-client.ts:38]. Decide: add a per-attempt timeout (e.g. `AbortSignal.timeout(15_000)`) now, or defer to Story 2.7 (sync monitoring).
- [x] [Review][Patch] Every record is `safeParse`d twice — once in `parsePropertyArray` then again inside `transformProperty`; the transform also discards the already-validated data by passing the raw `element` [src/lib/sync/parser.ts:26, 37; src/lib/sync/schemas/property.ts:163]. Pass `validation.data` into the transform and drop the inner `safeParse`.
- [x] [Review][Patch] Hand-rolled `RawProperty` / `RawPropertyAmenities` interfaces duplicate the Zod schema — violates Task 2 and the "do NOT hand-roll" LLM guardrail [src/lib/sync/schemas/property.ts:105-156]. Refactor to a chained `.transform(...)` on `rawPropertyApiSchema` (AC #6) and export `type RawProperty = z.infer<typeof rawPropertySchema>`.
- [x] [Review][Patch] Hand-rolled `RawAgent` interface duplicates the agent schema — same guardrail violation [src/lib/sync/schemas/agent.ts:40-51]. Chain `.transform(...)` on `rawAgentApiSchema` and derive `RawAgent` via `z.infer`.
- [x] [Review][Patch] `src/types/remax-api.ts` re-exports the hand-rolled interfaces; it must re-export Zod-inferred types per Task 2 [src/types/remax-api.ts:7-8].
- [x] [Review][Patch] `Latitude` / `Longitude` do not use the prescribed `z.coerce.number()` step (API2) [src/lib/sync/schemas/property.ts:86-93]. Replace the `z.union([...]).transform(...)` with a `z.coerce.number().nullable().catch(null)` style per spec.
- [x] [Review][Patch] Non-`"Sq Mt"` `LotSizeArea` is silently nulled without a `parseErrors` entry — Field Mapping Reference explicitly says "null and add to `parseErrors` (defensive)" [src/lib/sync/schemas/property.ts:171]. Emit a warning entry in the per-call `parseErrors` collector.
- [x] [Review][Patch] `baseUrl` is concatenated with `/PropertiesPerOffice/${officeGuid}` unconditionally, so a trailing slash in the env var produces `//PropertiesPerOffice/…` [src/lib/sync/api-client.ts:83, 97; src/lib/sync/config.ts:14-33]. Strip a trailing slash in `getRemaxConfig` before returning `baseUrl`.
- [x] [Review][Patch] `tests/unit/sync/api-client.spec.ts` sets `REMAX_API_BASE_URL` / `PZ_OFFICE_GUID` / `DOM_OFFICE_GUID` in `beforeEach` but never restores them in `afterEach`, leaking test values into later files' `process.env` [tests/unit/sync/api-client.spec.ts:12-22]. Mirror the save/restore pattern already in `config.spec.ts`.
- [x] [Review][Patch] The "throws after three attempts" test only asserts `toBeInstanceOf(RemaxApiError)`; it never verifies `endpoint`, `status`, or `cause` — the load-bearing fields a caller actually reads [tests/unit/sync/api-client.spec.ts:51-58, 60-71]. Add assertions on those fields for both the 500-exhaust and non-array-root cases.
- [x] [Review][Patch] No unit tests exist for `splitAndEncodeImages` / `encodeImageUrl` despite non-trivial behavior (empty filter, trailing pipe, URL-encoding) [src/lib/sync/utils/images.ts]. Add a `tests/unit/sync/images.spec.ts` covering trailing-pipe input, whitespace-only entries, and filenames with spaces and parens.
- [x] [Review][Defer] Required Y/N fields (`Furnishedyn`, `Garage`, `MaidRoom`, `Cooling`, `PoolPrivate`, `Viewyn`, `GatedCommunity`) are non-nullish — a single null drops the whole record [src/lib/sync/schemas/property.ts:47, 57, 61-64, 76] — deferred; data-quality handling should land with Story 2.3's ingestion hardening.
- [x] [Review][Defer] `officeGuid` is not URL-encoded before interpolation [src/lib/sync/api-client.ts:83, 97] — deferred; GUID comes from env and is controlled, but defense-in-depth is trivial.
- [x] [Review][Defer] `Latitude` / `Longitude` are not range-validated (`[-90,90]` / `[-180,180]`) [src/lib/sync/schemas/property.ts:86-93] — deferred; swapped-lat/lng detection belongs with Story 2.3 geospatial ingestion.
- [x] [Review][Defer] `normalizeCostaRicaPhone` accepts `"50600000000"` and other length-valid but prefix-invalid CR numbers [src/lib/sync/utils/phone.ts:13-14] — deferred; prefix validation is out of spec scope and belongs with a future data-quality pass.
- [x] [Review][Defer] `Lang` / `Title` fields are case-sensitive (only literal `"English"`/`"Spanish"`/`"Owner"` recognized) [src/lib/sync/schemas/agent.ts:64-68] — deferred; matches the spec's literal mapping table, but real-world drift should be revisited if upstream data shifts.
- [x] [Review][Defer] `Garage === true` with `GarageSpaces: null` coerces to `garageSpaces: 0`, creating a contradiction [src/lib/sync/schemas/property.ts:205-210] — deferred; data-quality concern, downstream UI should reconcile.
- [x] [Review][Defer] `lastStatus` retains the previous attempt's value when `fetch` rejects before producing a response [src/lib/sync/api-client.ts:33, 38-39] — deferred; diagnostic nit, not operational.
- [x] [Review][Defer] `response.text()` + `JSON.parse` double-buffers the whole body in memory [src/lib/sync/api-client.ts:45-51] — deferred; property feeds are well under any OOM threshold at current scale.
- [x] [Review][Defer] `isExpired` test depends on real clock (no `vi.useFakeTimers`), relying on "now > 2020-01-01" [tests/unit/sync/parser.spec.ts; src/lib/sync/schemas/property.ts:177] — deferred; current fixture date is sufficiently in the past to be robust through any CI clock.
- [x] [Review][Defer] `extractApiId` mixes property (`ListingId`) and agent (`AssociateID`/`AssociateId`) candidates in one helper [src/lib/sync/parser.ts:97-105] — deferred; tight scoping is cleanup, not a correctness issue.

## Change Log

- 2026-04-24 — Initial implementation of Story 2.2: typed RE/MAX CCA fetch + parse layer with Zod schemas, exponential-backoff retries, and fixture-driven unit tests (24 passing).
- 2026-04-24 — Code review: 2 decision-needed, 10 patch, 10 defer, 31 dismissed as spec-conformant or noise.
- 2026-04-24 — Review patches applied: dropped dead-code `8000ms` backoff slot in favor of 3 attempts × `[2s, 4s]` delays; added 15s `AbortSignal.timeout` to every `fetch`; collapsed double-safeParse by chaining `.transform(...)` on both schemas and deriving `RawProperty` / `RawAgent` via `z.infer` (spec guardrail); switched `Latitude` / `Longitude` to `z.coerce.number()` step; parser now emits `parseErrors` entry on non-`"Sq Mt"` `LotSizeUnits`; `getRemaxConfig` strips trailing slash from `baseUrl`; api-client spec save/restores `process.env`; retry test asserts `endpoint` / `status` / `cause`; added `tests/unit/sync/images.spec.ts`. All 31 sync tests pass; typecheck / lint / format / build clean.
