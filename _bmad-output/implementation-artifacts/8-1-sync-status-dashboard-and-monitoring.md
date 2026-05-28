# Story 8.1: Sync Status Dashboard & Monitoring

Status: ready-for-dev

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

- [ ] **Task 1: Add Localized UI Translations** (AC: #1, #2, #4)
  - [ ] 1.1 Add dashboard translations to `src/messages/en.json` under an `AdminSync` namespace:
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
  - [ ] 1.2 Add corresponding translations to `src/messages/es.json`:
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

- [ ] **Task 2: Define Database Query Helpers** (AC: #1, #3, #4)
  - [ ] 2.1 Open `src/lib/db/queries/sync-log.ts`.
  - [ ] 2.2 Implement `getSyncLogs(filters: { status?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number })`:
    - Build filter conditions using Drizzle:
      - If `filters.status` is provided and !== `'all'`, append `eq(syncLogs.status, filters.status)`.
      - If `filters.startDate` is provided, append `gte(syncLogs.startedAt, filters.startDate)`.
      - If `filters.endDate` is provided, append `lte(syncLogs.startedAt, filters.endDate)`.
    - Order results by `desc(syncLogs.startedAt)`.
    - Support pagination via `limit` (default 20) and `offset` (default 0).
  - [ ] 2.3 Implement `getSyncDashboardStats()`:
    - Query the properties count: `select({ count: sql<number>`count(*)` }).from(properties).where(eq(properties.isVisible, true))` to fetch active listings.
    - Query the latest successful sync: `select().from(syncLogs).where(eq(syncLogs.status, 'success')).orderBy(desc(syncLogs.completedAt)).limit(1)` to fetch the most recent timestamp.
    - Return an object containing both parameters.

- [ ] **Task 3: Implement Server Action for Dashboard Data Fetching** (AC: #1, #3, #4)
  - [ ] 3.1 Create `src/app/actions/admin-sync-actions.ts`:
    - Set `'use server'` directive.
    - Implement `fetchAdminSyncDashboardData(params: { status?: string; startDateStr?: string; endDateStr?: string; page?: number })`:
      - Safely parse dates (`startDateStr` and `endDateStr`) using date validators or fallback.
      - Calculate SQL offset from `page` parameter (default 1).
      - Call `getSyncLogs` and `getSyncDashboardStats` from `src/lib/db/queries/sync-log.ts`.
      - Return structured results.

- [ ] **Task 4: Build Localized Admin Dashboard Navigation Shell** (AC: #1)
  - [ ] 4.1 Create `src/app/[locale]/admin/layout.tsx`:
    - Setup an admin shell layout with Sidebar navigation.
    - Add navigation links for the other upcoming Epic 8 admin views for Nico (disabled or styled as placeholders/stubs for now, but ready for placement):
      - **Sync Logs** (Story 8.1 - active)
      - **Leads** (Story 8.2)
      - **Lifestyle Tags** (Story 8.4)
      - **Communities** (Story 8.5)
      - **Listings Visibility** (Story 8.6)
    - Verify that next-intl is correctly loaded and wrapped in server layout.

- [ ] **Task 5: Implement Sync status dashboard Page** (AC: #1, #2, #3, #4, #5)
  - [ ] 5.1 Create `src/app/[locale]/admin/page.tsx` (the root admin page that displays the dashboard):
    - Ensure it is a Server Component or calls Server Actions to query DB.
    - Renders top-level stat summary cards:
      - **Active Listings Count**: Card displaying total count.
      - **Pipeline Health / Last Sync**: Card displaying last completed sync status and timestamp.
    - **Filters Component**:
      - Status dropdown selector (All, Success, Failure, Partial, Running).
      - Date Pickers (Start Date, End Date).
      - Trigger Server Action refetching on filter changes (using search params in Next.js router or React transitions).
    - **Chronological Logs Table / Accordion Grid**:
      - Render chronological runs.
      - Use conditional Tailwind styling for log statuses:
        - `success` -> green badge/text.
        - `failure` -> red badge/text (log container gets red outline).
        - `partial` -> amber/orange badge/text.
        - `running` -> blue pulse badge.
      - Render exact run summary metrics: startedAt, completedAt, duration (completedAt - startedAt), count values.
      - **Expandable Errors and Diagnostics Drawer / Accordion Section**:
        - Tap to expand.
        - If `errors` array exists and contains records, display them in an interactive format (collapsible nested list or clean JSON viewer block) to assist Nico in debugging.
        - Render `errorMessage` if non-null in high-contrast text.

- [ ] **Task 6: Setup Unit and E2E Tests** (AC: #1, #2, #3, #4)
  - [ ] 6.1 Create `tests/unit/admin/sync-queries.spec.ts` using Vitest to assert:
    - `getSyncLogs` correctly applies status and date filters.
    - `getSyncDashboardStats` returns accurate counts and successful sync timestamps.
  - [ ] 6.2 Create `tests/e2e/admin/sync-dashboard.spec.ts` using Playwright:
    - Verify navigating to `/[locale]/admin` loads the dashboard with statistics.
    - Verify applying date range and status filters updates URL search parameters or triggers re-rendering of filtered log cards.
    - Verify expanding a failed log displays diagnostic error text from the database column.

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
