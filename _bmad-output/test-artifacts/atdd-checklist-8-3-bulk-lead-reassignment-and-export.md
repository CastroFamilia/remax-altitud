---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-04c-aggregate']
lastStep: 'step-04c-aggregate'
lastSaved: '2026-05-28'
storyId: '8.3'
storyKey: '8-3-bulk-lead-reassignment-and-export'
storyFile: '/Users/alejandracastro/Desktop/remax-altitud/_bmad-output/implementation-artifacts/8-3-bulk-lead-reassignment-and-export.md'
atddChecklistPath: '/Users/alejandracastro/Desktop/remax-altitud/_bmad-output/test-artifacts/atdd-checklist-8-3-bulk-lead-reassignment-and-export.md'
generatedTestFiles:
  - 'tests/unit/admin/bulk-reassign.test.ts'
  - 'tests/e2e/admin/bulk-reassign.spec.ts'
inputDocuments:
  - '/Users/alejandracastro/Desktop/remax-altitud/_bmad-output/implementation-artifacts/8-3-bulk-lead-reassignment-and-export.md'
---

### Step 2: Generation Mode Selection

**Mode Chosen**: AI Generation

**Reason**: The stack is fullstack, but the acceptance criteria are clear CRUD/dashboard features (bulk reassign, modal selections, confirmation dialog, CSV export) rather than complex drag/drop or rich multi-step UI states that require live browser recording. We will generate the Playwright E2E and Vitest unit test scaffolds directly using AI based on the provided story acceptance criteria.

### Step 3: Test Strategy

**Test Strategy & Scenarios**:

1. **E2E Tests (`tests/e2e/admin/bulk-reassign.spec.ts`)**:
   - [P0] 8.3-E2E-001: Admin can open the bulk reassignment modal and see the correct lead count for the selected source agent before confirmation.
   - [P0] 8.3-E2E-002: Admin can perform bulk lead reassignment to a single target agent with explicit confirmation ("Are you sure? This will reassign X leads...").
   - [P0] 8.3-E2E-003: Admin can perform bulk lead reassignment with distribution (round-robin) across multiple selected target agents.
   - [P0] 8.3-E2E-004: Admin can export decrypted contact list as CSV containing Name, Email, and Phone.
   - [P0] 8.3-E2E-005: Admin receives a validation error when attempting to reassign leads for a source agent with zero active leads.

2. **Unit Tests (`tests/unit/admin/bulk-reassign.test.ts`)**:
   - [P0] 8.3-UNIT-001: Query `bulkReassignLeads` updates all leads from a source agent to a single target agent.
   - [P0] 8.3-UNIT-002: Query `bulkReassignLeads` round-robin distributes leads across multiple target agents evenly.
   - [P0] 8.3-UNIT-003: Query `bulkReassignLeads` returns error/fails if the source agent has zero leads.
   - [P0] 8.3-UNIT-004: Reassignment logs an immutable entry in `leadAssignmentLogs` for each reassignment.
   - [P0] 8.3-UNIT-005: CSV generation queries leads for selected agent, decrypts PII using encryption helper, and generates compliant CSV output string.

### Step 4C: Aggregate

**ATDD Test Generation Complete (TDD RED PHASE)**

- **E2E Tests (`tests/e2e/admin/bulk-reassign.spec.ts`)**: 5 tests (all skipped)
- **Unit Tests (`tests/unit/admin/bulk-reassign.test.ts`)**: 5 tests (all skipped)

**Acceptance Criteria Coverage**:
- AC1: Admin selects a source agent and a target agent and reassigns leads (Covered by E2E + Unit)
- AC2: Automatic immutable log entry recorded with previous_agent_id, new_agent_id, and reassignment_date (Covered by E2E + Unit)
- AC3: Distribute leads round-robin or evenly among multiple target agents (Covered by E2E + Unit)
- AC4: Decrypted CSV download containing name, email, phone (Covered by E2E + Unit)
- AC5: Message "No leads to reassign for [Agent Name]" appears if source has zero leads (Covered by E2E + Unit)
- AC6: Requires explicit confirmation prompt (Covered by E2E)
- AC7: Reassignment logs are immutable (Covered by Unit)

**Next Steps (Task-by-Task Activation)**:
1. Link ATDD artifacts into the story file.
2. Implement the feature.
3. Remove `test.skip()` / `describe.skip()` / `it.skip()` from the tests.
4. Verify tests pass (Green Phase).
5. Commit.
