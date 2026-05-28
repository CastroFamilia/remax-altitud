# Story 8.3: Bulk Lead Reassignment & Export

Status: ready-for-dev

## Story

As an **admin**,
I want to bulk-reassign leads from one agent to another and export client contacts,
So that I can maintain business continuity when an agent departs the organization.

## Acceptance Criteria

1. **Given** the admin bulk reassignment tool
   **When** the admin selects a source agent and a target agent (or multiple target agents for distribution)
   **Then** all leads currently assigned to the source agent are reassigned to the target agent(s) (FR65)

2. **Given** a bulk reassignment action
   **When** executed
   **Then** every reassigned lead has an automatic log entry recording: previous_agent_id, new_agent_id, and reassignment_date (FR65)

3. **Given** the admin selects "distribute" across multiple agents
   **When** the distribution is executed
   **Then** leads are distributed round-robin or evenly among the selected target agents

4. **Given** the admin CSV export action
   **When** the admin selects an agent and exports
   **Then** a CSV file is generated containing: name, email, phone for all client contacts (leads) associated with that agent. This enables manual outreach/notification purposes when an agent departs (FR65)

5. **Given** the bulk reassignment
   **When** there are zero leads for the source agent
   **Then** a clear message appears: "No leads to reassign for [Agent Name]"

6. **And** bulk reassignment requires explicit confirmation ("Are you sure? This will reassign X leads from [Source] to [Target].")
7. **And** reassignment logs are immutable — they cannot be edited or deleted

## Developer Context

### Architecture & Technical Requirements

- **Database Queries & Transaction**:
  - Implement bulk lead reassignment in `src/lib/db/queries/leads.ts` inside a database transaction (`db.transaction`).
  - Perform validation: check if the source agent has active leads. If zero leads exist, return a descriptive error or clear flag so the UI can display: `"No leads to reassign for [Agent Name]"`.
  - For target agent round-robin distribution:
    - Retrieve all leads for the source agent: `db.select().from(leads).where(eq(leads.assignedAgentId, sourceAgentId))`.
    - If multiple target agents are provided, distribute the leads round-robin (e.g., `targetAgentIds[index % targetAgentIds.length]`).
    - For each lead, execute an update query and insert a log record into the pre-existing `leadAssignmentLogs` table.
  - **Reinvention Prevention**: The `leadAssignmentLogs` table already exists in `src/lib/db/schema/lead-assignment-logs.ts` (established in Story 8.2). **DO NOT** create a new table or generate new database migrations for assignment logging. Reuse the existing `leadAssignmentLogs` model.
  - Ensure reassignment logs are immutable — no edit or delete queries should ever be exposed or implemented for `leadAssignmentLogs`.

- **CSV Export & Security**:
  - Implement contact export in `src/lib/db/queries/leads.ts` or in a server action.
  - Query all leads assigned to the selected agent: `db.select().from(leads).where(eq(leads.assignedAgentId, agentId))`.
  - Decrypt the personal identifiable information (PII) using `decryptField(lead.phone)` and `decryptField(lead.email)` from `src/lib/utils/encryption.ts`.
  - **No External Libraries for CSV**: Do not install or import external CSV formatting libraries (like `papaparse` or `csv-writer`). Construct the CSV string manually in JavaScript. Ensure it is RFC 4180 compliant: headers `Name, Email, Phone`, and escape quotes by doubling them (`value.replace(/"/g, '""')`) and enclosing any field with a comma or quote in double quotes.
  - Secure the CSV export: ensure only authenticated admins can download this data by enforcing the session/authentication guard (`verifyAdminAuth()` in the server action).

- **CSV Download Protocol**:
  - **Next.js Server Action Warning**: Next.js Server Actions cannot set download headers directly to trigger browser file saves. Instead, the server action `exportAgentLeadsCSVAction` must return the generated CSV file content as a plain string, and the client-side component must create a local `Blob` (type `text/csv`) and trigger a browser download programmatically using a temporary `<a>` element with a `download` attribute.

- **UI & Modal Component**:
  - Create a new Client Component `src/components/admin/admin-bulk-reassign-modal.tsx` or integrate into the leads dashboard view `src/app/[locale]/admin/leads/page.tsx`.
  - Design a visually rich UI matching the existing Tailwind/CSS design token foundation (reds, dark slate slate-900 border slate-800) containing:
    - **Export Contacts Button**: Allows selecting an agent and downloading their contacts as a CSV file.
    - **Bulk Reassign Button**: Opens a modal where the admin selects:
      - Source Agent.
      - Operation Type: Single Target Agent OR Distribute (allowing checking multiple target agents).
      - Displays dynamic validation: shows how many leads are assigned to the selected source agent before confirming.
    - **Confirmation prompt**: If the admin proceeds, require typing a confirmation or clicking a red primary CTA button with clear messaging: `"Are you sure? This will reassign X leads from [Source] to [Target]."`
  - Translate all UI strings using `next-intl` by updating `src/messages/en.json` and `src/messages/es.json`.

### Previous Story Intelligence

- Build upon `src/app/actions/admin-lead-actions.ts` and `src/lib/db/queries/leads.ts` from Story 8.2.
- Leverage the existing `leadAssignmentLogs` table schema established in Story 8.2.
- Reuse the `verifyAdminAuth()` helper in new server actions to guarantee security rules.

### Testing Requirements

- **Unit Tests**:
  - Add comprehensive unit tests in `tests/unit/admin/bulk-reassign.test.ts` using Vitest.
  - Verify round-robin distribution calculation.
  - Verify database transaction correctly updates `leads` and logs history in `leadAssignmentLogs`.
  - Verify CSV generation correctly decrypts `phone` and `email`.
- **End-to-End Tests**:
  - Add E2E test suite in `tests/e2e/admin/bulk-reassign.spec.ts` using Playwright.
  - Test opening the bulk reassign modal, selecting agents, confirming reassignment, and checking that the leads list updates and logs are recorded.

### Story Completion Status

Ultimate context engine analysis completed - comprehensive developer guide created.

### ATDD Artifacts

- None yet (Step 1 creation completed)

## Tasks/Subtasks

- [ ] 1. Implement database query `bulkReassignLeads` with transactions and round-robin logic in `src/lib/db/queries/leads.ts`.
- [ ] 2. Create server action `bulkReassignLeadsAction` in `src/app/actions/admin-lead-actions.ts` with session authentication check.
- [ ] 3. Create server action `exportAgentLeadsCSVAction` that queries, decrypts PII, formats CSV, and returns it securely as a string.
- [ ] 4. Build `AdminBulkReassignModal` component (`src/components/admin/admin-bulk-reassign-modal.tsx`) with confirmation prompts and validations, triggering the CSV download on the client side.
- [ ] 5. Add triggers for Bulk Reassign and CSV Export to the admin leads panel.
- [ ] 6. Localize all newly added labels and modal strings in `src/messages/en.json` and `src/messages/es.json`.
- [ ] 7. Add unit tests for bulk reassignment and round-robin/CSV logic.
- [ ] 8. Add E2E tests in Playwright verifying the happy path and validation errors.

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

### Completion Notes List

### File List
