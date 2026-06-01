# Story 8.5: Community Administration

Status: done

## Story

As an **admin**,
I want to create and manage communities with rich metadata and geo-fence polygons,
So that I can curate premium development pages and control which properties are tagged to them.

## Acceptance Criteria

1. **Given** the admin community management interface
   **When** the admin creates a new community
   **Then** the admin can set: name, slug, tagline (EN/ES), description (EN/ES), hero image URL, quick facts (elevation, amenities, developer, established year, airport distance, infrastructure), and site map image URL (FR61)

2. **Given** the community creation/edit interface
   **When** the admin needs to define a geo-fence
   **Then** a map interface allows the admin to draw a polygon on an interactive Mapbox map that defines the community's geographic boundary (FR61)

3. **Given** the admin community assignment view
   **When** accessed for a specific listing
   **Then** the admin can see the auto-populated community assignment (from geo-fence match) and manually override it to a different community or remove the assignment (FR60)

4. **Given** an admin manually assigns a community to a listing
   **When** the next sync pipeline runs
   **Then** the manual override is preserved and NOT reset by auto-tagging (FR60)

5. **Given** the admin edits a community's geo-fence polygon
   **When** saved
   **Then** the next sync run re-evaluates property-community assignments based on the new polygon boundary

6. **And** community data (name, description, quick facts) is stored in the `communities` table per Architecture schema

7. **And** the geo-fence polygon is stored as a PostGIS geography `Polygon 4326` type

## Tasks / Subtasks

- [x] 1. Expose database queries `createCommunity`, `updateCommunity`, and `deleteCommunity` in `src/lib/db/queries/communities.ts`. (AC: 1, 6, 7)
  - Ensure `createCommunity` and `updateCommunity` accept `geoFence` coordinates (`[number, number][]` representing `[longitude, latitude]`) and pass them to the Drizzle custom type helper `geographyPolygon`.
  - In `deleteCommunity`, because `properties.communityId` has no formal foreign key constraint, first set `communityId = null` for all associated properties before deleting the community to prevent orphan community references.
- [x] 2. Expose `updatePropertyCommunity` query in `src/lib/db/queries/properties.ts` allowing a listing's `communityId` to be manually updated or cleared (set to NULL). (AC: 3, 4)
- [x] 3. Create server actions in a new file `src/app/actions/admin-community-actions.ts` protected by `verifyAdminAuth()`:
  - `fetchAdminCommunitiesData(params: { search?: string; page?: number })`: returns a paginated list of communities with total count, reusing the pagination structure from `admin-tag-actions.ts`.
  - `createCommunityAction(data: NewCommunity)`: inserts a new community, then triggers path revalidation.
  - `updateCommunityAction(id: string, data: Partial<Community>)`: updates an existing community, then triggers path revalidation.
  - `deleteCommunityAction(id: string)`: deletes a community, then triggers path revalidation.
  - `updatePropertyCommunityAction(propertyId: string, communityId: string | null)`: manually overrides a property's community ID.
- [x] 4. Replace the placeholder communities sidebar item in `src/app/[locale]/admin/layout.tsx` with an active next-intl link to `/${locale}/admin/communities`. (AC: 1)
- [x] 5. Create communities list admin page `src/app/[locale]/admin/communities/page.tsx` displaying all communities in a paginated, searchable table with edit actions and a "Create New Community" CTA. (AC: 1)
- [x] 6. Create community form component/page `src/app/[locale]/admin/communities/[id]/page.tsx` (and a matching `/new` route) displaying input fields for EN/ES name, taglines, descriptions, hero/site map URLs, quick facts, and an interactive Mapbox polygon drawing canvas. (AC: 1, 2)
  - Reuse the `getAllAreas()` query from `src/lib/db/queries/areas.ts` to populate the Area selector.
  - Re-use the existing Mapbox GL `react-map-gl` and token configs. Implement a clean custom click listener to draw the polygon on the map instead of installing external libraries like `@mapbox/mapbox-gl-draw`.
- [x] 7. Integrate a community selector dropdown in the listing administration view (either `/admin/tags` or a listing detail edit panel) to show the property's current community and let admins manually select a community override or clear it. (AC: 3, 4)
- [x] 8. Localize all form labels, validations, page titles, and toast messages in `src/messages/en.json` and `src/messages/es.json` under an `AdminCommunities` namespace. (AC: 1, 3)
- [x] 9. Add unit tests in `tests/unit/admin/communities.test.ts` verifying the DB queries, community CRUD operations, server actions authentication, and revalidation calls. (AC: 1, 4, 5)
- [x] 10. Add E2E tests in `tests/e2e/admin/communities.spec.ts` using Playwright verifying log in, navigating to "/admin/communities", creating a community with a drawn geo-fence, and manually overriding a property's community assignment. (AC: 1, 2, 3, 4)

## Dev Notes

### Architecture & Technical Requirements

- **Database CRUD & Table Layout**:
  - Direct community CRUD queries should be added to `src/lib/db/queries/communities.ts`.
  - The `communities` table is defined in `src/lib/db/schema/communities.ts`.
  - The `geoFence` column is of custom type `geographyPolygon` mapping to PostGIS `geography(Polygon, 4326)`. When passing a polygon boundary from the frontend to the backend, it should be an array of coordinate pairs: `[number, number][]` (representing `[longitude, latitude]`).
  - To prevent spatial coordinate parsing issues on the client-side, the database also maintains `geoFenceCoords` as `jsonb`. The server actions should save the polygon in both formats:
    1. Pass `geoFence` coordinates (`[number, number][]`) to `geographyPolygon` for PostGIS GIS operations.
    2. Pass the GeoJSON structure `{ type: "Polygon", coordinates: [[[lng, lat], ...]] }` to the `geoFenceCoords` JSONB column so the client-side Mapbox component can easily load and display it on the frontend.
  - Query patterns for CRUD in `src/lib/db/queries/communities.ts`:
    ```typescript
    import { db } from "@/lib/db/client";
    import { communities } from "@/lib/db/schema/communities";
    import { properties } from "@/lib/db/schema/properties";
    import { eq } from "drizzle-orm";
    import type { NewCommunity, Community } from "@/lib/db/schema/communities";

    export async function createCommunity(data: NewCommunity) {
      const rows = await db.insert(communities).values(data).returning();
      return rows[0];
    }

    export async function updateCommunity(id: string, data: Partial<Community>) {
      const rows = await db.update(communities)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(communities.id, id))
        .returning();
      return rows[0];
    }

    export async function deleteCommunity(id: string) {
      // Clear associated properties first due to missing database foreign key constraint
      await db.update(properties)
        .set({ communityId: null })
        .where(eq(properties.communityId, id));

      return db.delete(communities).where(eq(communities.id, id));
    }
    ```

- **Coordinates & Spatial Representation**:
  - Quick facts structure is stored as JSONB: `{ elevation: string, airportDistance: string, amenities: string[], developer: string, establishedYear: string, infrastructure: string }`.

- **Preservation of Manual Community Overrides**:
  - During property sync, when the geo-tagger runs (`autoTagCommunities` in `src/lib/sync/geo-tagger.ts`), it must ONLY tag properties whose `community_id` is currently NULL: `AND p.community_id IS NULL`.
  - In `upsertProperty` query (`src/lib/db/queries/properties.ts`), if the listing is updated but the coordinates have NOT changed, the query preserves the existing community ID:
    ```typescript
    communityId: sql`CASE 
      WHEN ${properties.latitude} IS DISTINCT FROM ${values.latitude} 
        OR ${properties.longitude} IS DISTINCT FROM ${values.longitude} 
      THEN NULL 
      ELSE ${properties.communityId} 
    END`,
    ```
  - This guarantees that an admin manual override of `communityId` is never reset by auto-tagging.

- **ISR Revalidation**:
  - After any community or override changes, server actions must trigger immediate on-demand ISR path revalidation:
    ```typescript
    revalidatePath("/[locale]/communities");
    revalidatePath("/[locale]/areas/[slug]/communities/[communitySlug]");
    revalidatePath("/[locale]/areas/[slug]");
    revalidatePath("/[locale]/search");
    revalidatePath("/[locale]/properties/[slug]");
    ```

- **UI & Mapbox GL Drawing Integration**:
  - **DO NOT** install or import `@mapbox/mapbox-gl-draw` (it is not in package.json and would trigger dependency check failures).
  - Instead, implement a lightweight interactive click drawer using the native `react-map-gl` `onClick` handler:
    - Listen for map clicks, append coordinate pairs `[lng, lat]` to a state array.
    - Render a clean polygon overlay on the map by passing the coordinate array as a GeoJSON Feature to a `<Source>` and `<Layer>` component:
      ```typescript
      const geojson = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [polygonPoints.length > 2 ? [...polygonPoints, polygonPoints[0]] : polygonPoints],
        },
      };
      ```
  - Use `getAllAreas()` from `src/lib/db/queries/areas.ts` as the single source of truth for populated areas in the selection dropdown.
  - Active the "Communities" navigation Link under `/admin/layout.tsx` targeting `/${locale}/admin/communities` with a REMAX red border active badge.

### Previous Story Learning & Continuity

- Follow the styling patterns established in lead management and tag management, maintaining high-contrast slate colors (`bg-slate-900`, `text-slate-100`) and gold accents (`border-gold-500` / `--color-gold`) specified in Epic 6 for curated communities.
- Re-use structural patterns established in `admin-tag-actions.ts` for handling searchable, paginated listing grids and server actions.

### References

- **Community Schema definition:** [src/lib/db/schema/communities.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/communities.ts)
- **Properties Schema definition:** [src/lib/db/schema/properties.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/properties.ts)
- **Community Queries:** [src/lib/db/queries/communities.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/communities.ts)
- **Property Queries:** [src/lib/db/queries/properties.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/properties.ts)
- **Area Queries:** [src/lib/db/queries/areas.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/areas.ts)
- **Geo-Tagger Sync utility:** [src/lib/sync/geo-tagger.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/sync/geo-tagger.ts)
- **Admin layout layout navigation:** [src/app/[locale]/admin/layout.tsx](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/[locale]/admin/layout.tsx)
- **Lifestyle tags server actions:** [src/app/actions/admin-tag-actions.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/actions/admin-tag-actions.ts)

### Localization Namespaces

Add the `AdminCommunities` namespace to both `src/messages/en.json` and `src/messages/es.json`:

#### `src/messages/en.json`
```json
  "AdminCommunities": {
    "title": "Community Administration",
    "subtitle": "Create and manage curated community developments with geo-fences",
    "searchPlaceholder": "Search communities by name...",
    "btnCreateCommunity": "Create New Community",
    "btnEdit": "Edit",
    "btnDelete": "Delete",
    "confirmDelete": "Are you sure you want to delete {name}? This will clear community references from all properties.",
    "tableHeadName": "Name",
    "tableHeadArea": "Area",
    "tableHeadListings": "Active Listings",
    "tableHeadActions": "Actions",
    "formLabelName": "Community Name",
    "formLabelSlug": "Slug",
    "formLabelArea": "Area",
    "formLabelTaglineEn": "Tagline (EN)",
    "formLabelTaglineEs": "Tagline (ES)",
    "formLabelDescriptionEn": "Description (EN)",
    "formLabelDescriptionEs": "Description (ES)",
    "formLabelHeroImage": "Hero Image URL",
    "formLabelSiteMap": "Site Map Image URL",
    "formLabelLatitude": "Center Latitude",
    "formLabelLongitude": "Center Longitude",
    "formLabelQuickFacts": "Quick Facts",
    "formLabelElevation": "Elevation",
    "formLabelAirport": "Airport Distance",
    "formLabelAmenities": "Amenities (comma separated)",
    "formLabelDeveloper": "Developer Name",
    "formLabelEstablished": "Established Year",
    "formLabelInfrastructure": "Infrastructure Details",
    "btnDrawGeoFence": "Draw Geo-Fence",
    "btnClearGeoFence": "Clear Geo-Fence",
    "geoFenceNote": "Click on the map to define the boundary. Close the shape by clicking the first point again.",
    "btnSave": "Save Community",
    "btnCancel": "Cancel",
    "successCreated": "Successfully created community {name}",
    "successUpdated": "Successfully updated community {name}",
    "successDeleted": "Successfully deleted community",
    "errorSaveFailed": "Failed to save community. Please try again."
  }
```

#### `src/messages/es.json`
```json
  "AdminCommunities": {
    "title": "Administración de Comunidades",
    "subtitle": "Cree y gestione desarrollos de comunidades curadas con delimitaciones geográficas",
    "searchPlaceholder": "Buscar comunidades por nombre...",
    "btnCreateCommunity": "Crear Nueva Comunidad",
    "btnEdit": "Editar",
    "btnDelete": "Eliminar",
    "confirmDelete": "¿Está seguro de que desea eliminar {name}? Esto borrará las referencias de la comunidad de todas las propiedades.",
    "tableHeadName": "Nombre",
    "tableHeadArea": "Área",
    "tableHeadListings": "Propiedades Activas",
    "tableHeadActions": "Acciones",
    "formLabelName": "Nombre de la Comunidad",
    "formLabelSlug": "Slug (URL)",
    "formLabelArea": "Área",
    "formLabelTaglineEn": "Lema (EN)",
    "formLabelTaglineEs": "Lema (ES)",
    "formLabelDescriptionEn": "Descripción (EN)",
    "formLabelDescriptionEs": "Descripción (ES)",
    "formLabelHeroImage": "URL de Imagen Principal",
    "formLabelSiteMap": "URL del Mapa del Sitio",
    "formLabelLatitude": "Latitud Central",
    "formLabelLongitude": "Longitud Central",
    "formLabelQuickFacts": "Datos Rápidos",
    "formLabelElevation": "Elevación",
    "formLabelAirport": "Distancia al Aeropuerto",
    "formLabelAmenities": "Amenidades (separadas por comas)",
    "formLabelDeveloper": "Nombre del Desarrollador",
    "formLabelEstablished": "Año de Establecimiento",
    "formLabelInfrastructure": "Detalles de Infraestructura",
    "btnDrawGeoFence": "Dibujar Delimitación",
    "btnClearGeoFence": "Limpiar Delimitación",
    "geoFenceNote": "Haga clic en el mapa para definir el límite. Cierre la figura haciendo clic en el primer punto nuevamente.",
    "btnSave": "Guardar Comunidad",
    "btnCancel": "Cancelar",
    "successCreated": "Comunidad {name} creada con éxito",
    "successUpdated": "Comunidad {name} actualizada con éxito",
    "successDeleted": "Comunidad eliminada con éxito",
    "errorSaveFailed": "Error al guardar la comunidad. Por favor, inténtelo de nuevo."
  }
```

### Testing Requirements

- **Unit Tests**:
  - Add comprehensive unit tests in `tests/unit/admin/communities.test.ts` using Vitest.
  - Implement hoisted mocks for database client and next/cache:
    ```typescript
    import { vi, describe, it, expect, beforeEach } from "vitest";

    const { mockInsert, mockUpdate, mockDelete, mockDb, mockRevalidatePath } = vi.hoisted(() => {
      const mockInsert = vi.fn();
      const mockUpdate = vi.fn();
      const mockDelete = vi.fn();
      const mockDb = {
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      };
      const mockRevalidatePath = vi.fn();
      return { mockInsert, mockUpdate, mockDelete, mockDb, mockRevalidatePath };
    });

    vi.mock("@/lib/db/client", () => ({ db: mockDb }));
    vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
    ```
  - Verify that `createCommunityAction`, `updateCommunityAction`, and `deleteCommunityAction` fail if user is not authenticated (`verifyAdminAuth` rejection).
  - Verify that successful CRUD operations compile correct SQL structures and trigger paths revalidation on target routes.
- **End-to-End Tests**:
  - Add Playwright E2E suite in `tests/e2e/admin/communities.spec.ts`.
  - Simulate logging in as admin, visiting "/admin/communities", creating a community, drawing a polygon mock, saving, and verifying properties are manually overridden or automatically tagged.

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

### Completion Notes List

### Review Findings

1. **`patch`** findings (fixed):
   - `- [x] [Review][Patch] Community index page component test support — Add data-testid="community-index-card" wrapper on community index page cards in src/app/[locale]/communities/page.tsx to support component unit testing.`

### File List
