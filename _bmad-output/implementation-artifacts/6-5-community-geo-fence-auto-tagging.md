# Story 6.5: Community Geo-Fence Auto-Tagging

**Status:** ready-for-dev
**GH Issue:** #105
**Epic:** 6 — Community Pages & Area Guides
**Story Key:** 6-5-community-geo-fence-auto-tagging
**Created:** 2026-05-28

---

## Story

As an **admin**,
I want properties automatically tagged to communities based on their geographic coordinates,
So that community pages always show current available properties without manual assignment for each listing.

---

## Acceptance Criteria

1. **Given** a community has a geo-fence polygon stored in the database
   **When** the daily sync pipeline runs (Step 6: GEO-TAG)
   **Then** properties with coordinates inside the polygon are automatically assigned `community_id` matching that community (FR50, AR2)

2. **Given** a property moves (coordinates change) during sync
   **When** it falls inside a different community polygon
   **Then** its `community_id` is updated to the new community

3. **Given** a property that falls outside all community polygons
   **When** processed during sync
   **Then** its `community_id` remains null (not tagged to any community)

4. **Given** an admin has manually assigned a community to a listing
   **When** the sync pipeline's geo-tagging step runs
   **Then** the manual override is preserved and NOT reset by auto-tagging (FR50)

5. **Given** a new community is created by an admin
   **When** the geo-fence polygon is drawn and saved
   **Then** the next sync run auto-populates the community with matching properties

6. **And** geo-fence matching uses PostGIS `ST_Within` for efficient spatial queries (AR2)
7. **And** this story extends the sync pipeline from Epic 2 (Step 6) — no new pipeline is created

---

## Tasks / Subtasks

- [ ] **Task 1: Define `geographyPolygon` custom type in `src/lib/db/types/postgis.ts`** (AC: #1, AR2)
  - [ ] 1.1 Add and export TypeScript type `GeoPolygon = [number, number][]` (array of `[longitude, latitude]` pairs matching GeoJSON Ring coordinate representation).
  - [ ] 1.2 Implement Drizzle custom type `geographyPolygon` compiling to PostGIS `geography(Polygon, 4326)`:
    ```typescript
    export const geographyPolygon = customType<{
      data: GeoPolygon;
      driverData: string;
    }>({
      dataType() {
        return "geography(Polygon, 4326)";
      },
      toDriver(value: GeoPolygon): string {
        if (value.length < 3) {
          throw new Error("Polygon must have at least 3 points");
        }
        // Ensure the polygon ring is closed (first and last coordinate MUST be identical)
        const coords = [...value];
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          coords.push(first);
        }
        const ringStr = coords.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
        return `SRID=4326;POLYGON((${ringStr}))`;
      },
    });
    ```
    *Note:* Reads return raw EWKB hex strings from the driver, but because we only query spatial relations inside the database (`ST_Within`) and use `geoFenceCoords` (JSONB) for display/read cases, we do NOT need to implement `fromDriver` parsing.

- [ ] **Task 2: Enable `geoFence` column in `src/lib/db/schema/communities.ts`** (AC: #1)
  - [ ] 2.1 Import `geographyPolygon` from `../types/postgis`.
  - [ ] 2.2 Uncomment and define the `geoFence` column inside `communities`:
    ```typescript
    geoFence: geographyPolygon("geo_fence"),
    ```

- [ ] **Task 3: Generate and Run Database Migration** (AC: #1)
  - [ ] 3.1 Run `npm run db:generate` to generate Drizzle schema migration.
  - [ ] 3.2 **CRITICAL MISTAKE PREVENTION:** Inspect the newly emitted `.sql` migration file in `src/lib/db/migrations/`. Check if `drizzle-kit` quoted the column type like `"geography(Polygon, 4326)"`. Postgres rejects quoted type identifiers. Strip any outer quotes from the type declaration in the SQL statement to ensure it reads simply: `geography(Polygon, 4326)`.
  - [ ] 3.3 Run `npm run db:migrate` to apply the migration to the PostgreSQL database.

- [ ] **Task 4: Implement Coordinate-Difference Detection in `src/lib/db/queries/properties.ts`** (AC: #2, #3, #4)
  - [ ] 4.1 Update `upsertProperty` query's `mutableSet` to prevent unconditional community resets.
  - [ ] 4.2 Replace `communityId: null` on line 92 with an atomic SQL conditional CASE expression. If the latitude or longitude coordinates have changed (are `IS DISTINCT FROM` the new values), clear `community_id` to `NULL` to force geo-fence re-evaluation. Otherwise, preserve the existing `community_id`:
    ```typescript
    communityId: sql`CASE 
      WHEN ${properties.latitude} IS DISTINCT FROM ${values.latitude} 
        OR ${properties.longitude} IS DISTINCT FROM ${values.longitude} 
      THEN NULL 
      ELSE ${properties.communityId} 
    END`,
    ```
    This elegant database-native solution preserves manual overrides (admin assignments) whenever a property is updated without coordinate changes, while automatically clearing and re-tagging relocated listings.

- [ ] **Task 5: Implement Community Geo-Tagger Module `src/lib/sync/geo-tagger.ts`** (AC: #1, #6)
  - [ ] 5.1 Create a new pure-utility file `src/lib/sync/geo-tagger.ts` exporting an asynchronous function:
    ```typescript
    import "server-only";
    import { db } from "@/lib/db/client";
    import { sql } from "drizzle-orm";

    export async function autoTagCommunities(): Promise<number> {
      const result = await db.execute(sql`
        UPDATE properties p
        SET community_id = c.id
        FROM communities c
        WHERE ST_Within(p.geo::geometry, c.geo_fence::geometry)
          AND p.community_id IS NULL
          AND p.geo IS NOT NULL
      `);
      return result.count ?? 0;
    }
    ```
    *Why cast to geometry?* Postgres `ST_Within` on geography coordinates sometimes requires explicit geometry casts to optimize boundary checking against polygons. Cast `p.geo::geometry` and `c.geo_fence::geometry` to ensure high performance and seamless evaluation.

- [ ] **Task 6: Integrate Geo-Tagging Step in `src/lib/sync/pipeline.ts`** (AC: #1, #7)
  - [ ] 6.1 Import `autoTagCommunities` from `@/lib/sync/geo-tagger`.
  - [ ] 6.2 Navigate to the end of the property updates stage in `runSyncPipeline` (right after lifestyle tagging loop).
  - [ ] 6.3 Insert `Step 7d: Community geo-tagging`:
    ```typescript
    // Step 7d: Community geo-tagging (Story 6.5, AC #1, FR50)
    info("Running community geo-fence auto-tagging...");
    const autoTaggedCount = await autoTagCommunities();
    info(`Community geo-fence auto-tagging complete: ${autoTaggedCount} properties tagged.`);
    ```

- [ ] **Task 7: Populate Initial Geo-Fences in Seed and Test Fixtures** (AC: #1, #5)
  - [ ] 7.1 Create a new database migration `src/lib/db/migrations/xxxx_seed_geo_fences.sql` or add coordinates to seed scripts to copy coordinates from `geo_fence_coords` JSONB column into the `geo_fence` geography polygon column for existing seeded communities.
    ```sql
    UPDATE communities
    SET geo_fence = ST_GeographyFromText('SRID=4326;POLYGON((' || 
      (SELECT string_agg(coords->>0 || ' ' || coords->>1, ', ') 
       FROM jsonb_array_elements(geo_fence_coords) coords) || 
      ', ' || 
      (SELECT (geo_fence_coords->0->>0) || ' ' || (geo_fence_coords->0->>1)) || 
      '))')
    WHERE geo_fence_coords IS NOT NULL AND jsonb_array_length(geo_fence_coords) >= 3;
    ```
    This script dynamically populates `geo_fence` from existing display-only `geo_fence_coords`!
  - [ ] 7.2 Update test factories in `tests/fixtures/community-factories.ts` to include matching `geoFence` coordinates values.

- [ ] **Task 8: Write Unit & Integration Tests** (AC: #1, #2, #3, #4)
  - [ ] 8.1 Create `tests/unit/sync/geo-tagger.spec.ts` using `vitest` to verify:
    - **Bulk Tagging:** Unassigned properties with coordinates inside a community polygon are assigned to that community.
    - **Manual Override Preservation:** Properties that already have a `communityId` assigned and whose coordinates did NOT change are unaffected by the auto-tagging.
    - **Relocation / Movement:** Properties whose coordinates change to a new community get updated. Properties moving outside all communities get reset to `NULL`.
  - [ ] 8.2 Verify that tests pass successfully by running `npm run test`.

---

## Dev Notes

### Disaster Prevention & Learnings

- **Known Drizzle-Kit Migration Quoting Bug:** The custom type `geography(Polygon, 4326)` contains parentheses and spaces. Drizzle-Kit might wrap this declaration in double quotes in the generated SQL (e.g. `"geography(Polygon, 4326)"`). Postgres expects standard unquoted data types. The developer **MUST** inspect the generated SQL migration file and manually remove outer quotes from around the data type if they exist.
- **Atomic updates on coordinates change:** We intentionally use SQL `CASE WHEN ... IS DISTINCT FROM` within the conflict update statement. This handles the preservation of manual overrides efficiently without requiring pre-fetching property records or writing complex state comparison logic in JS.

### Project Structure Alignment

All code additions and files align perfectly with the established modular architecture:
- Custom PostGIS geography types are declared in `src/lib/db/types/postgis.ts`.
- Schema modifications reside in `src/lib/db/schema/communities.ts`.
- The geo-fence evaluation logic resides inside a dedicated `src/lib/sync/geo-tagger.ts` utility file.

---

## References

- **Community Schema definition:** [communities.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/communities.ts#L26-L34)
- **Upsert properties query logic:** [properties.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/properties.ts#L72-L98)
- **Existing sync pipeline lifecycle:** [pipeline.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/sync/pipeline.ts#L253-L274)
- **Epic 6 requirements list:** [epics.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L1865-L1897)

---

## Dev Agent Record

### Agent Model Used

*To be populated by developer agent*

### Debug Log References

*To be populated by developer agent*

### Completion Notes List

*To be populated by developer agent*

### File List

*To be populated by developer agent*
