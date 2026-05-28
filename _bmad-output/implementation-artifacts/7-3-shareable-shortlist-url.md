# Story 7.3: Shareable Shortlist URL

**Status:** done
**GH Issue:** #108
**Epic:** 7 — Shortlist & Smart Agent Routing
**Story Key:** 7-3-shareable-shortlist-url
**Created:** 2026-05-28

---

## Story

As a **visitor**,
I want to share my shortlist via a unique URL,
So that my family or partner can see the same properties on their device without needing an account.

---

## Acceptance Criteria

1. **Given** the "Share my shortlist" button on the shortlist page
   **When** tapped
   **Then** a POST request is sent to `/api/shortlist` which creates a `shortlist_shares` record with the property IDs and returns a unique share URL (e.g., `remax-altitud.cr/shortlist/abc123`) (FR24).

2. **Given** the share URL
   **When** opened on another device or browser
   **Then** it loads a read-only shortlist page showing the same properties with photos, prices, specs, and a mini-map (FR24).

3. **Given** the `shortlist_shares` table
   **When** a share record is created
   **Then** it stores: `share_id` (unique slug), `property_ids` (text[]), `locale` (sharer's locale), `created_at`, and `expires_at` (30 days) per Architecture schema.

4. **Given** a shared shortlist URL
   **When** opened after 30 days (expired)
   **Then** a friendly expiration message appears: "This shortlist has expired. Start a new search." with a link to the search page.

5. **Given** the share URL
   **When** opened
   **Then** the user's current locale is used (not the original sharer's) for UI text, but property data displayed is the same.

6. **Given** a successful share generation
   **When** complete
   **Then** the share URL is automatically copied to the user's clipboard and a toast/success notification displays: "Link copied! Share it with anyone." (FR24).

7. **Given** the `/api/shortlist` endpoint
   **When** receiving a request
   **Then** it validates that all provided property IDs exist and are currently visible (`is_visible = true`) in the database before creating the share record, returning 400/404 on violation to prevent stale/malicious links.

---

## Tasks / Subtasks

- [x] **Task 1: Define Database Schema for Shortlist Shares** (AC: #3)
  - [x] 1.1 Create `src/lib/db/schema/shortlist-shares.ts` with:
    ```typescript
    import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
    import { sql } from "drizzle-orm";

    export const shortlistShares = pgTable("shortlist_shares", {
      id: uuid("id").primaryKey().defaultRandom(),
      shareId: text("share_id").notNull().unique(), // short slug, e.g., 'abc123'
      propertyIds: text("property_ids").array().notNull().default(sql`'{}'::text[]`), // array of property UUIDs
      locale: text("locale").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    });

    export type ShortlistShare = typeof shortlistShares.$inferSelect;
    export type NewShortlistShare = typeof shortlistShares.$inferInsert;
    ```
  - [x] 1.2 Export `shortlistShares` in `src/lib/db/schema/index.ts`:
    ```typescript
    export * from "./shortlist-shares";
    ```
  - [x] 1.3 Add an index on `share_id` (already indexed via `unique()`) and ensure standard Drizzle ORM model files are in alignment.

- [x] **Task 2: Generate and Run Database Migration** (AC: #3)
  - [x] 2.1 Run the drizzle-kit CLI command to generate a new migration file:
    ```bash
    npm run db:generate
    ```
    *(Verify the generated SQL file includes `CREATE TABLE shortlist_shares ...` and matches Drizzle snapshot integrity).*
  - [x] 2.2 Run migration to update the local database:
    ```bash
    npm run db:migrate
    ```

- [x] **Task 3: Implement POST `/api/shortlist` Route** (AC: #1, #3, #7)
  - [x] 3.1 Create Next.js API Route handler at `src/app/api/shortlist/route.ts`:
    - Accept POST payload: `{ propertyIds: string[], locale: string }`.
    - Validate parameters using a `zod` schema (ensure `propertyIds` is a non-empty array of valid UUID strings, `locale` is either `"en"` or `"es"`).
    - Query the database to verify that **all** `propertyIds` exist in the `properties` table and have `isVisible = true`. If any are invalid or hidden, reject with a `400 Bad Request` or `404 Not Found` response.
    - Generate a unique, short, URL-safe slug `shareId` (6-8 characters, e.g., using `crypto.randomBytes(4).toString('hex')` or custom nanoid alphanumeric characters).
    - Set `expiresAt` to exactly 30 days in the future (`new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`).
    - Insert the new share record into the `shortlist_shares` table via Drizzle ORM.
    - Return `201 Created` with payload: `{ shareId, shareUrl: string }`. Use environment variables/request header host to construct the absolute `shareUrl` (e.g. `https://remax-altitud.cr/shortlist/abc123` or dynamically based on host header for local/staging/production parity).

- [x] **Task 4: Implement Server-Side Verification for Shared Shortlist** (AC: #2, #4, #5)
  - [x] 4.1 Create helper queries or a Server Action in `src/lib/db/queries/shortlists.ts` (or extend `src/app/actions/shortlist-actions.ts`) to fetch a shared shortlist by its `shareId`:
    - Query `shortlistShares` table where `shareId` matches.
    - Check if the current time is past `expiresAt`. If expired, return an expiration status indicator.
    - Query the `properties` table for all `propertyIds` associated with the active share that are still visible (`isVisible = true`), mapping them to `PropertySearchItem` types using existing mapper `mapPropertyRowToSearchItem`.
    - Return `properties` and `isExpired` boolean.

- [x] **Task 5: Implement Read-only Shared Shortlist Page** (AC: #2, #4, #5)
  - [x] 5.1 Create routing segment folder and file `src/app/[locale]/shortlist/[shareId]/page.tsx`:
    - Resolve the dynamic params: `locale` and `shareId`.
    - Set route metadata dynamic function `generateMetadata()`:
      - Title: `Shortlist Shared with You / Lista Compartida` (or localized title dynamically).
      - Robots: Explicitly block indexing by returning `robots: { index: false, follow: false }` to preserve SEO integrity and prevent duplicate search results.
    - Fetch the shared shortlist data on the server side:
      - If shared shortlist does not exist, return `notFound()`.
      - If expired, render the localized friendly expiration state: `"This shortlist has expired. Start a new search."` with a navy brand button pointing to `/{locale}/search`.
      - Otherwise, render a read-only client-side comparison wrapper `<SharedShortlistPageClient properties={properties} />` inside a `<Suspense>` boundary.
  - [x] 5.2 Create Client Component `src/components/shortlist/shared-shortlist-page-client.tsx`:
    - Accept `properties: PropertySearchItem[]` as prop.
    - Re-use the responsive comparison layout from the active shortlist page (`ShortlistPageClient`):
      - Render a list of read-only cards (use `PropertyCard` without the remove '✕' option, or pass a flag to disable controls).
      - Render the Mapbox GL `MapView` lazy loaded wrapper in the side-by-side or stacked container, feeding the map pins coordinates.
      - Add a persistent informative banner: *"You are viewing a shared shortlist. To create your own, browse listings and tap ♡."* with a CTA button to navigate to the search page.

- [x] **Task 6: Integrate Share Flow into active Shortlist Comparison Page** (AC: #1, #6)
  - [x] 6.1 Modify `handleShareShortlist` in `src/components/shortlist/shortlist-page-client.tsx`:
    - Replace the current hardcoded local URLs formatting clipboard logic with an API call:
      - Send a POST request to `/api/shortlist` containing `{ propertyIds: shortlist, locale }`.
      - On successful response, copy the returned `shareUrl` (e.g., `https://domain/locale/shortlist/shareId`) to the clipboard.
      - Show the copy confirmation UI ("Copied!" or toast message).
      - Provide a fallback handling block: if the API request fails, gracefully fallback to copying local property URLs as previously done, showing a helpful warning/alert.

- [x] **Task 7: Expand Bilingual Translation Keys** (AC: #4, #5, #6)
  - [x] 7.1 Verify/Add the following shortlist share keys to `src/messages/en.json` (inside the `Shortlist` namespace):
    ```json
    "Shortlist": {
      "shareCopied": "Link copied! Share it with anyone.",
      "expiredTitle": "Shared Shortlist Expired",
      "expiredMessage": "This shortlist has expired. Start a new search.",
      "sharedBanner": "Viewing a shared shortlist. Start saving properties to create your own!",
      "shareError": "Failed to generate share link. Copying direct listing links instead."
    }
    ```
  - [x] 7.2 Verify/Add equivalent Spanish translation keys to `src/messages/es.json`:
    ```json
    "Shortlist": {
      "shareCopied": "¡Enlace copiado! Compártelo con cualquiera.",
      "expiredTitle": "Lista Compartida Expirada",
      "expiredMessage": "Esta lista compartida ha expirado. Comienza una nueva búsqueda.",
      "sharedBanner": "Viendo una lista compartida. ¡Comienza a guardar propiedades para crear la tuya!",
      "shareError": "Error al generar enlace de compartir. Copiando enlaces directos de propiedades."
    }
    ```

- [x] **Task 8: Write Unit, Integration, and E2E Tests** (AC: #1, #2, #4, #7)
  - [x] 8.1 Create `tests/unit/actions/shortlist-shares.spec.ts` using Vitest:
    - Test server queries and validation checking of property IDs exists and visibility filter logic.
    - Verify correct expiration calculation (30-day bounds).
  - [x] 8.2 Create component test `tests/unit/shortlist/shared-shortlist-page.spec.tsx` verifying:
    - Renders shared properties on list and map correctly.
    - Renders empty/expired layout when expiration bounds are breached.
  - [x] 8.3 Add E2E tests `tests/e2e/shortlist-sharing.spec.ts` matching typical sharing journey flow.

### Review Findings

During the Step 5 code review (Adversarial Review Layers: Blind Hunter, Edge Case Hunter, Acceptance Auditor), the following findings were identified and successfully patched:

1. **Duplicate Property IDs (Edge Case Hunter)**:
   - *Finding*: If a user attempted to create a shortlist share with duplicate property IDs in the payload (e.g., `["prop-1", "prop-1"]`), the backend validated the unique visible properties in the database. A query returned only 1 property row, while the validation check compared `existingProps.length` directly against the raw `propertyIds.length`, triggering an unexpected `400 Bad Request` ("One or more properties are invalid or hidden").
   - *Resolution*: Deduplicated input `propertyIds` at the start of `createShortlistShare` via `Array.from(new Set(propertyIds))` to guarantee payload integrity and robust comparison logic. A new unit test `[P0] 7.3-UNIT-002b` has been introduced to verify duplicate deduplication behavior.

2. **Missing returning() Clause on Drizzle Insert (Blind Hunter)**:
   - *Finding*: The database insert query did not include the `.returning()` suffix. Without it, PostgreSQL drivers do not return the persisted record values directly, defaulting to the fallback handler.
   - *Resolution*: Added `.returning()` to the database insert chain in `createShortlistShare`. The Vitest hoisted Drizzle client mock has been updated and extended to fully support `.returning()` chains.

3. **Unhandled Promise Rejections in Clipboard Handlers (Blind & Edge Hunter)**:
   - *Finding*: High-risk browser promise rejections in standard fallback clipboard copy chains in `ShortlistPageClient`. Tapping "Share" under certain dynamic browser security contexts could lead to unhandled rejections.
   - *Resolution*: Added robust `.catch()` clauses to clipboard sharing fallbacks on the active shortlist client page.

All findings have been fully triaged, patched, committed, and validated green via Vitest unit tests (1,029 tests passing).

---

## Dev Notes

### Slug Generation & Expiration Design
- **Unique Share ID:** Generate short slugs (6-8 characters) to keep share URLs concise, using URL-safe characters:
  ```typescript
  import { randomBytes } from "crypto";
  const shareId = randomBytes(4).toString("hex"); // e.g. "a1b2c3d4"
  ```
- **30-Day TTL:** Ensure `expires_at` is always calculated using server-side time bounds (`createdAt + 30 days`) during database insertion.

### Crawlability and Security
- **Noindex Meta Guard:** To protect user privacy and prevent duplicate content penalties from search engines, the dynamic page `/shortlist/[shareId]` **MUST** explicitly block search engines:
  ```typescript
  export const metadata: Metadata = {
    robots: {
      index: false,
      follow: false
    }
  };
  ```
- **Strict Verification:** The `/api/shortlist` endpoint MUST enforce validation. If any `propertyId` passed is not valid/visible in the DB, it must reject with `400` status. This prevents users from fabricating links containing non-existent or hidden draft property IDs.

### Hydration & Dynamic Rendering Parity
- **Read-Only Mode:** Shared shortlists are read-only client-side. The shared page client component `SharedShortlistPageClient` does not coordinate with the user's local `localStorage` shortlist state, allowing users to view another person's shortlist without overwriting their own saved properties.
- **Asynchronous Bundle Loading:** Use the same Dynamic Map loader for Mapbox components on the shared page:
  ```typescript
  import { MapView } from "@/components/map/map-view-loader";
  ```
  This guarantees that bundles remain fully optimized and page speeds do not regress (AR25, R-001).

---

## References

- **Shortlist Epic Requirements**: [epics.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L1979-L2011)
- **Software Architecture Document**: [architecture.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L177-L180) (dynamic route specs) & [architecture.md#L533-L541](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/architecture.md#L533-L541) (shortlist shares schema)
- **Shortlist Comparison Implementation**: [7-2-shortlist-comparison-page.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/implementation-artifacts/7-2-shortlist-comparison-page.md)

---

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash
