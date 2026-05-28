---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-28'
storyId: '8.1'
storyKey: 8-1-sync-status-dashboard-and-monitoring
storyFile: _bmad-output/implementation-artifacts/8-1-sync-status-dashboard-and-monitoring.md
atddChecklistPath: _bmad-output/implementation-artifacts/atdd-checklist-8-1-sync-status-dashboard-and-monitoring.md
generatedTestFiles:
  - tests/unit/admin/sync-queries.spec.ts
  - tests/unit/actions/admin-sync-actions.spec.ts
  - tests/e2e/admin/sync-dashboard.spec.ts
---

# ATDD Checklist: Story 8.1 — Sync Status Dashboard & Monitoring

## TDD Red Phase (Current)

All test scaffolds generated with `describe.skip()` or `test.skip()` — RED PHASE.

- **DB Queries Unit Tests**: 3 tests (all skipped)
  - `tests/unit/admin/sync-queries.spec.ts`: covers chronological sync log fetching, status filtering, date range filtering, pagination limits/offsets, and duration formatting helpers.
- **Server Action Tests**: 2 tests (all skipped)
  - `tests/unit/actions/admin-sync-actions.spec.ts`: covers fetchAdminSyncDashboardData query delegations, dates parsing, pagination offset calculation, and error/missing param fallbacks.
- **E2E Integration Tests**: 4 tests (all skipped)
  - `tests/e2e/admin/sync-dashboard.spec.ts`: covers full admin dashboard journey, including sync logs chronological badge listings, date/status filtering and applying URL queries, failed log accordion row diagnostic view, and top-level summary metrics.

## Acceptance Criteria Coverage

| AC | Description | Test Level & File | Test/Assert IDs Covered |
|----|-------------|-------------------|--------------------------|
| AC #1 | Chronological list of sync logs with start/completion, status badge, counts, and error | DB Queries: `sync-queries.spec.ts`<br>E2E: `sync-dashboard.spec.ts` | Unit: "fetches chronological sync logs successfully"<br>E2E: "loads the dashboard and displays sync logs chronological list..." |
| AC #2 | Highlight failure log with `--color-error` and provide expandable drill-down diagnostics | E2E: `sync-dashboard.spec.ts` | E2E: "expanding a failed log displays diagnostic error text" |
| AC #3 | Date range filtering filters sync logs chronologically | DB Queries: `sync-queries.spec.ts`<br>E2E: `sync-dashboard.spec.ts` | Unit: "filters by date range correctly..."<br>E2E: "applying date range and status filters updates filtered logs..." |
| AC #4 | Top-level stats loaded (Last Successful Sync relative time + Active listings count) | DB Queries: `sync-queries.spec.ts`<br>E2E: `sync-dashboard.spec.ts` | Unit: "retrieves active listings count and last successful sync"<br>E2E: "loads and displays active listings count and last success..." |
| AC #5 | Sync logs stored in the database's `sync_logs` table schema | DB Queries: `sync-queries.spec.ts` | Unit: "fetches chronological sync logs successfully" |
| AC #6 | Reads from existing tables and logs populated by Epic 2's sync pipeline | DB Queries: `sync-queries.spec.ts` | Unit: "fetches chronological sync logs successfully" |

## Test Strategy

### Stack Detected
`fullstack` — Next.js with Vitest (unit/component) + Playwright (E2E)

### Execution Mode
`sequential` (Step 2 ATDD orchestration)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit (Queries) | Vitest | `tests/unit/admin/sync-queries.spec.ts` | Verifies Drizzle database query parameters, filters, orders, and duration helpers. |
| Unit (Actions) | Vitest | `tests/unit/actions/admin-sync-actions.spec.ts` | Verifies Next.js Server Action parameters parsing, date transformations, and pagination offsets. |
| E2E | Playwright | `tests/e2e/admin/sync-dashboard.spec.ts` | Validates full end-to-end admin flows, layout, filters, accordion toggles, and metadata visual rendering. |

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1: Add Localized UI Translations
- Implement localized strings in `src/messages/en.json` and `src/messages/es.json` under `AdminSync` namespace.

### Task 2: Define Database Query Helpers
1. Open `tests/unit/admin/sync-queries.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate unit tests.
3. Run `npm test -- tests/unit/admin/sync-queries.spec.ts`.
4. Confirm tests FAIL.
5. Implement `getSyncLogs` and `getSyncDashboardStats` in `src/lib/db/queries/sync-log.ts`.
6. Verify unit tests now PASS!

### Task 3: Implement Server Action for Dashboard Data Fetching
1. Open `tests/unit/actions/admin-sync-actions.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate action tests.
3. Run `npm test -- tests/unit/actions/admin-sync-actions.spec.ts` → confirm failures.
4. Implement `fetchAdminSyncDashboardData` in `src/app/actions/admin-sync-actions.ts`.
5. Verify unit tests PASS!

### Task 4 & 5: Build Layout Navigation Shell and Sync Dashboard Page
1. Implement the sidebar navigation shell in `src/app/[locale]/admin/layout.tsx`.
2. Implement `src/app/[locale]/admin/page.tsx` rendering top-level statistics summary cards, date filters, status selector, and the chronological runs accordion grid.
3. Ensure unauthenticated block/Basic Authentication redirect checking is added to protect `/admin` routes.

### E2E Validation
1. Open `tests/e2e/admin/sync-dashboard.spec.ts`.
2. Remove `test.skip` progressively from E2E scenarios.
3. Run: `npx playwright test tests/e2e/admin/sync-dashboard.spec.ts` to verify full feature integration!

## Implementation Guidance

### New Files to Create or Modify
```
src/
  messages/
    en.json                               ← MODIFY (Add AdminSync localization)
    es.json                               ← MODIFY (Add AdminSync localization)
  app/
    actions/
      admin-sync-actions.ts               ← NEW (Server action fetchAdminSyncDashboardData)
  lib/
    db/
      queries/
        sync-log.ts                       ← MODIFY (Add getSyncLogs, getSyncDashboardStats, formatSyncDuration)
  app/
    [locale]/
      admin/
        layout.tsx                        ← NEW (Admin navigation shell layout)
        page.tsx                          ← NEW (Sync Status Dashboard Page)
tests/
  unit/
    admin/
      sync-queries.spec.ts                ← NEW (Vitest DB Queries and Helpers tests)
    actions/
      admin-sync-actions.spec.ts          ← NEW (Vitest Server Actions tests)
  e2e/
    admin/
      sync-dashboard.spec.ts              ← NEW (Playwright E2E tests)
  fixtures/
    sync-log-factories.ts                 ← NEW (Mock sync log factories)
```

### data-testid Contract (immutable)
- `sync-log-row` — Accordion row list item element representing each log record
- `sync-status-badge` — Badge text representing status (success, failure, partial, running)
- `error-diagnostic-details` — Expandable failure details JSON or message block
- `active-listings-card` — Metric box showing total active properties count
- `last-success-card` — Metric box showing relative timestamp of last successful sync

## ATDD Artifacts
- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-8-1-sync-status-dashboard-and-monitoring.md`
- Unit tests: `tests/unit/admin/sync-queries.spec.ts`, `tests/unit/actions/admin-sync-actions.spec.ts`
- E2E tests: `tests/e2e/admin/sync-dashboard.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/8-1-sync-status-dashboard-and-monitoring.md`
