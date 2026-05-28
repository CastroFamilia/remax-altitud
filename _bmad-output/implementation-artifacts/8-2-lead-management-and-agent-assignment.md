# Story 8.2: Lead Management & Agent Assignment

Status: done

## Story

As an **admin**,
I want to view, filter, and manage all leads with full source context,
So that I can ensure leads are routed to the right agents and track conversion performance.

## Acceptance Criteria

1. **Given** the admin lead management view
   **When** accessed
   **Then** it displays all leads with: name, email, phone, source (whatsapp/seller_form/contact_form/cma_form), intent (buy/sell/invest/recruit), property reference, language, assigned agent, UTM source/medium/campaign, status, and created_at (FR57)

2. **Given** a shortlist lead
   **When** viewed in the lead management view
   **Then** it shows all shortlisted property refs, grouped by which belong to the assigned agent and which belong to other agents (e.g., "Hans → Agent: Emma • Emma's: #123, #456 • Gustavo's: #321, #654") (FR57)

3. **Given** a lead assigned to the wrong agent
   **When** the admin uses the reassign action
   **Then** the lead's assigned_agent_id is updated and a log entry records: previous agent, new agent, and reassignment date (FR58)

4. **Given** the lead list
   **When** filtered by agent, source, intent, status, or date range
   **Then** the list updates to show only matching leads

5. **Given** the per-agent lead history view
   **When** the admin selects an agent
   **Then** all leads ever assigned to that agent are displayed (buyer inquiry, seller listing, CMA request, shortlist inquiry) with: date, name, email, phone, lead type, property reference, and source. Filterable by lead type (FR64)

6. **And** lead PII is displayed only to authenticated admin users (NFR8)

7. **And** the lead management interface operates through admin dashboard views/tables for MVP

## Developer Context

### Architecture & Technical Requirements

- **Database Model**: 
  - The `leads` table exists in `src/lib/db/schema/leads.ts`. It includes `id`, `name`, `email` (encrypted), `phone` (encrypted), `source`, `intent`, `language`, `assignedAgentId`, `propertyId`, `shortlistPropertyIds`, `utmSource`, `utmMedium`, `utmCampaign`, `status`, and `createdAt`.
  - **New Table Required**: AC 3 requires logging reassignments. Create a `lead_assignment_logs` table in the Drizzle schema (`src/lib/db/schema/lead-assignment-logs.ts` or add to `leads.ts`) to store `id`, `leadId` (uuid), `previousAgentId` (uuid), `newAgentId` (uuid), and `createdAt`. Add relationships if needed. Export it in `index.ts`. Create a drizzle migration for it (`npm run db:generate`).
  
- **UI & Routing**:
  - Implement under the Next.js App Router admin dashboard route, e.g., `src/app/[locale]/admin/leads/page.tsx`.
  - Provide a table view for leads reusing the existing UI patterns from `src/components/admin/` (refer to `8-1-sync-status-dashboard-and-monitoring.md`).
  - Make sure text strings are translated via `next-intl` (add keys to `src/messages/en.json` and `src/messages/es.json`).

- **PII Decryption & Auth**:
  - The `email` and `phone` fields in the `leads` table are stored as AES-256-GCM ciphertext. Decrypt them for display using `src/lib/utils/encryption.ts` (e.g. `decrypt(lead.email)`). Do not expose ciphertext to the client; decrypt on the server component before sending to the client, or via server action.
  - Admin auth relies on the custom auth with `admin-login` (see `src/components/admin/admin-login-form.tsx` and existing admin routes).

- **Shortlist Logic (AC 2)**:
  - When displaying a shortlist lead, read `shortlistPropertyIds`. Query the `properties` table for these IDs. Group the returned properties by whether their `agentId` (or `associateId` depending on schema) matches the lead's `assignedAgentId`. Format the display string appropriately as per the acceptance criteria.

- **Filtering (AC 4 & 5)**:
  - Implement filters as URL query parameters so the view is shareable and works without client-side state hooks where possible. Extract query params in the Page component and pass to your data fetching logic.
  
### Previous Story Intelligence
- Refer to Story 8.1 for the established pattern of displaying tabular data in the admin dashboard (e.g., `sync_logs`).
- The `leads` table was established in Epic 5 (Story 5.3) for capturing form submissions.

### Testing Requirements
- Unit tests for the new Server Actions (e.g., `reassignLead`).
- Unit tests for the shortlist grouping logic.
- Optionally add E2E tests for the new admin leads dashboard flow using Playwright (`tests/e2e/admin/leads.spec.ts`).

### Story Completion Status
Ultimate context engine analysis completed - comprehensive developer guide created.

### ATDD Artifacts
- **Checklist**: _bmad-output/test-artifacts/atdd-checklist-8-2-lead-management-and-agent-assignment.md
- **E2E tests**: tests/e2e/admin/leads.spec.ts
- **Unit tests**: tests/unit/admin/leads.test.ts

## Tasks/Subtasks

- [x] 1. Create `lead_assignment_logs` table schema in `src/lib/db/schema/leads.ts` or new file, export it, and generate migration.
- [x] 2. Create server actions to fetch leads and reassign lead agent.
- [x] 3. Create the shortlist logic to fetch property details and group them for display.
- [x] 4. Create UI for `src/app/[locale]/admin/leads/page.tsx` displaying the leads table with filters.
- [x] 5. Implement per-agent lead history view UI.
- [x] 6. Ensure PII is decrypted correctly for authorized users.
- [x] 7. Update translations in `src/messages/en.json` and `src/messages/es.json`.
- [x] 8. Add unit tests.

### Review Findings

- [x] [Review][Patch] Missing Authentication Guard on Server Actions [src/app/actions/admin-lead-actions.ts:1]
- [x] [Review][Patch] Missing Authentication Check in Leads and Reassignment Logs Server Pages [src/app/[locale]/admin/leads/page.tsx:1]
- [x] [Review][Patch] Missing Defensive Guard in formatShortlistText [src/components/admin/admin-leads-table.tsx:88]


## Dev Agent Record

### Debug Log
- All initial development completed and integrated successfully.
- Verified and fixed lead assignment logs, lead PII decryption, shortlist grouping, and admin filter integration.
- Standard vitest suite passes fully without any errors.

### Completion Notes
- Fully implemented lead management panel in admin workspace.
- Added `lead_assignment_logs` table and migrated schema safely.
- Created robust server actions in `src/app/actions/admin-lead-actions.ts` to perform all database transactions and caching invalidation.
- Created unit tests verifying all logical components, reassignments, decryption, and shortlist agent grouping.

## File List
- `src/lib/db/schema/lead-assignment-logs.ts`
- `src/lib/db/queries/leads.ts`
- `src/app/actions/admin-lead-actions.ts`
- `src/app/[locale]/admin/leads/page.tsx`
- `src/app/[locale]/admin/leads/reassignment-logs/page.tsx`
- `tests/unit/admin/leads.test.ts`

## Change Log
- 2026-05-28: Mark story 8.2 as completed and ready for review. All tasks checked and verified.

