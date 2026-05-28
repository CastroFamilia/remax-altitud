# Story 8.1: Sync Status Dashboard & Monitoring

Status: review

## Story

As an **admin**,
I want to view sync status logs with timestamps, counts, and error details,
so that I can monitor data freshness and quickly diagnose sync failures.

## Acceptance Criteria

1. **Given** the admin sync log view (accessible at `/[locale]/admin` or `/[locale]/admin/sync`)
   **When** accessed by an admin
   **Then** it displays a chronological list of `sync_logs` records showing:
   - `startedAt` (as start timestamp)
   - `completedAt` (as completion timestamp)
   - `status` (represented as standard UI badges: `success`, `failure`, `partial`, `running`)
   - properties added (`propertiesCreated`)
   - properties updated (`propertiesUpdated`)
   - properties removed (`propertiesRemoved`)
   - agents synced (`agentsSynced`)
   - translations queued (`translationsQueued`)
   - images optimized (`imagesOptimized`)
   - error message (`errorMessage`) (FR56)

2. **Given** a sync failure
   **When** the sync completes with status = `"failure"`
   **Then** the UI highlights the log record with `--color-error` (red border/background), displays the detailed error message, and provides an expandable drill-down section to inspect the `errors` JSONB array for failure diagnostics (FR56, FR51).

3. **Given** the sync status dashboard
   **When** selecting a start date and an end date in the date picker/filters
   **Then** the list filters the sync logs within that date range chronologically, showing only logs matching the selected period.

4. **Given** the sync status dashboard
   **When** loaded
   **Then** a top-level statistics summary displays:
   - **Last Successful Sync**: the `completedAt` timestamp and relative time (e.g. "2 hours ago") of the latest sync where `status = 'success'`.
   - **Active Listings**: the total count of properties currently active on the site (`isVisible = true`).

5. **And** sync logs are stored in the database's `sync_logs` table (complying with Drizzle schemas in `src/lib/db/schema/sync-logs.ts`).
6. **And** this story reads from existing tables and logs populated by Epic 2's daily sync pipeline — no duplicate pipeline logic is introduced.

---

## Tasks / Subtasks

- [x] **Task 1: Add Localized UI Translations** (AC: #1, #2, #4)
  - [x] 1.1 Add dashboard translations to `src/messages/en.json` under an `AdminSync` namespace:
    ```json
    "AdminSync": {
      "dashboardTitle": "Sync Status & Monitoring",
      "subtitle": "Monitor data freshness, run logs, and diagnostic history",
      "activeListings": "Active Listings",
      "lastSuccess": "Last Successful Sync",
      "lastSuccessNever": "Never",
      "filterTitle": "Filters",
      "startDate": "Start Date",
      "endDate": "End Date",
      "status": "Status",
      "allStatuses": "All Statuses",
      "filterButton": "Apply Filters",
      "clearFilters": "Clear",
      "startedAt": "Started At",
      "completedAt": "Completed At",
      "duration": "Duration",
      "propertiesAdded": "Added",
      "propertiesUpdated": "Updated",
      "propertiesRemoved": "Removed",
      "agentsSynced": "Agents",
      "translations": "Translations",
      "images": "Images Optimized",
      "noLogs": "No sync logs found for the selected criteria.",
      "errorTitle": "Diagnostic Logs & Errors",
      "details": "Pipeline Details",
      "running": "Running",
      "success": "Success",
      "failure": "Failure",
      "partial": "Partial Success"
    }
    ```
  - [x] 1.2 Add corresponding translations to `src/messages/es.json`:
    ```json
    "AdminSync": {
      "dashboardTitle": "Estado de Sincronización",
      "subtitle": "Monitoreo de frescura de datos, bitácoras y diagnóstico",
      "activeListings": "Propiedades Activas",
      "lastSuccess": "Último Éxito",
      "lastSuccessNever": "Nunca",
      "filterTitle": "Filtros",
      "startDate": "Fecha Inicio",
      "endDate": "Fecha Fin",
      "status": "Estado",
      "allStatuses": "Todos los Estados",
      "filterButton": "Filtrar",
      "clearFilters": "Limpiar",
      "startedAt": "Iniciado",
      "completedAt": "Terminado",
      "duration": "Duración",
      "propertiesAdded": "Agregadas",
      "propertiesUpdated": "Actualizadas",
      "propertiesRemoved": "Eliminadas",
      "agentsSynced": "Agentes",
      "translations": "Traducciones",
      "images": "Imágenes Optimizadas",
      "noLogs": "No se encontraron bitácoras para los criterios seleccionados.",
      "errorTitle": "Diagnóstico de Errores",
      "details": "Detalles del Pipeline",
      "running": "En ejecución",
      "success": "Éxito",
      "failure": "Fallo",
      "partial": "Éxito Parcial"
    }
    ```

- [x] **Task 2: Define Database Query Helpers** (AC: #1, #3, #4)
  - [x] 2.1 Open `src/lib/db/queries/sync-log.ts`.
  - [x] 2.2 Implement `getSyncLogs(filters: { status?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number })`
  - [x] 2.3 Implement `getSyncDashboardStats()`

- [x] **Task 3: Implement Server Action for Dashboard Data Fetching** (AC: #1, #3, #4)
  - [x] 3.1 Create `src/app/actions/admin-sync-actions.ts`

- [x] **Task 4: Build Localized Admin Dashboard Navigation Shell** (AC: #1)
  - [x] 4.1 Create `src/app/[locale]/admin/layout.tsx`

- [x] **Task 5: Implement Sync status dashboard Page** (AC: #1, #2, #3, #4, #5)
  - [x] 5.1 Create `src/app/[locale]/admin/page.tsx`

- [x] **Task 6: Setup Unit and E2E Tests** (AC: #1, #2, #3, #4)
  - [x] 6.1 Create `tests/unit/admin/sync-queries.spec.ts` using Vitest
  - [x] 6.2 Create `tests/e2e/admin/sync-dashboard.spec.ts` using Playwright

---

## Dev Notes

### Key Architecture Guidelines & Constraints

1. **Locale prefix requirement**:
   - To align with internationalization middleware, the admin page must be placed in `src/app/[locale]/admin/page.tsx` and layout in `src/app/[locale]/admin/layout.tsx`. Do NOT create `/admin/page.tsx` directly at `src/app/` level as this would break the `next-intl` configuration and routing constraints.
2. **Column Naming Alignments**:
   - **CRITICAL MISTAKE PREVENTION**: The database schema uses **`propertiesCreated`** and **`propertiesUpdated`** inside `syncLogs`. Do NOT try to read or write columns called `properties_added` or query them directly, as it will crash! Map `propertiesCreated` to "Properties Added" and `propertiesUpdated` to "Properties Updated" in UI text.
3. **No Bundle Bloat**:
   - Avoid importing heavy JSON formatting libraries. For error logging, utilize standard Tailwind-styled `pre` tags with custom scrollbar limits for the JSON output.
4. **Server Components vs Client Components**:
   - The outer page and data-fetching should be implemented inside a Next.js Server Component (fetching from Drizzle). Filters and expanding accordion rows should use client-side interactive state where appropriate (or search params routing state).
5. **Secure Admin Authentication (NFR8)**:
   - **CRITICAL SECURITY REQUIREMENT**: The `/admin` routes must be protected from unauthorized public access. The developer should implement a middleware check or a simple server-side environment-variable password protection (e.g. cookie session or standard basic authentication check) to ensure only authenticated administrators can access the page.
6. **next-intl Server Component Usage**:
   - For retrieving translated strings within Next.js Server Components, use `getTranslations({ locale, namespace: 'AdminSync' })` from `next-intl/server` to fetch localization values, maintaining strict type-safety and performance budgets.


### Project Structure Notes

- **Translations**: `src/messages/en.json`, `src/messages/es.json`.
- **Database Schema**: `src/lib/db/schema/sync-logs.ts`, `src/lib/db/schema/properties.ts`.
- **Queries**: `src/lib/db/queries/sync-log.ts`.
- **Pages**: `src/app/[locale]/admin/page.tsx`, `src/app/[locale]/admin/layout.tsx`.
- **Actions**: `src/app/actions/admin-sync-actions.ts`.

### ATDD Artifacts

- **Checklist**: `_bmad-output/implementation-artifacts/atdd-checklist-8-1-sync-status-dashboard-and-monitoring.md`
- **Unit Queries Test**: `tests/unit/admin/sync-queries.spec.ts`
- **Unit Actions Test**: `tests/unit/actions/admin-sync-actions.spec.ts`
- **E2E Test**: `tests/e2e/admin/sync-dashboard.spec.ts`
- **Test Fixture**: `tests/fixtures/sync-log-factories.ts`

---

## References

- **Epic 8 Requirements**: [planning-artifacts/epics.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L2055-L2083) (FR56, FR51).
- **Drizzle Schema**: [sync-logs.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/schema/sync-logs.ts).
- **Existing Queries**: [sync-log.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/db/queries/sync-log.ts).

---

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Completion Notes List

- Designed and generated the complete Story 8.1 specification detailing the Sync Status Dashboard & Monitoring requirements.
- Configured translation keys, DB queries, UI design guidelines, routing patterns, and Playwright verification test scripts.
- Implemented robust `getSyncLogs` and `getSyncDashboardStats` queries with Drizzle ORM to support paginated chronological sync logging.
- Created `fetchAdminSyncDashboardData` server action with secure parameter validation and date fallback parsing.
- Built a localized sidebar admin navigation layout shell with stubs for future Epic 8 views.
- Created the main Admin Sync Status Dashboard utilizing server actions, relative time calculations, search params integration, and accordion log displays.
- Integrated a secure environment-based session lock protecting all `/admin` sub-routes from public access.
- Expanded the unit and E2E test specs (unskipping all unit/integration tests) and successfully verified all tests pass cleanly in green status.
