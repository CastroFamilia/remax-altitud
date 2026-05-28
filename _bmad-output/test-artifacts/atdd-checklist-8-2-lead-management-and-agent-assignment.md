---
stepsCompleted: ['step-01-preflight-and-context']
lastStep: 'step-01-preflight-and-context'
lastSaved: '2026-05-28'
storyId: '8.2'
storyKey: '8-2-lead-management-and-agent-assignment'
storyFile: '/Users/alejandracastro/Desktop/remax-altitud/.worktrees/story-8.2-agent-lead-management-panel/_bmad-output/implementation-artifacts/8-2-lead-management-and-agent-assignment.md'
atddChecklistPath: '/Users/alejandracastro/Desktop/remax-altitud/.worktrees/story-8.2-agent-lead-management-panel/_bmad-output/test-artifacts/atdd-checklist-8-2-lead-management-and-agent-assignment.md'
generatedTestFiles: []
inputDocuments: ['/Users/alejandracastro/Desktop/remax-altitud/.worktrees/story-8.2-agent-lead-management-panel/_bmad-output/implementation-artifacts/8-2-lead-management-and-agent-assignment.md']
---

### Step 2: Generation Mode Selection

**Mode Chosen**: AI Generation

**Reason**: The stack is fullstack, but the acceptance criteria are clear CRUD/dashboard features (view, filter, manage leads) rather than complex drag/drop or rich multi-step UI states that require live browser recording. We will generate the Playwright E2E test scaffolds directly using AI based on the provided story acceptance criteria.

### Step 3: Test Strategy

**Test Strategy & Scenarios**:

1. **E2E Tests (`tests/e2e/admin/leads.spec.ts`)**:
   - [P0] Admin can view the lead management table with all required fields (name, email, phone, source, intent, property ref, language, assigned agent, UTMs, status, created_at).
   - [P0] Shortlist leads display property refs correctly grouped by assigned agent vs other agents.
   - [P0] Admin can reassign a lead to a new agent and see the assignment updated.
   - [P0] Admin can filter the lead list by agent, source, intent, status, and date range.
   - [P0] Admin can navigate to a per-agent lead history view and see filtered leads for that agent.
   - [P1] Unauthenticated users are redirected when trying to access the admin leads view, protecting PII.

2. **Unit Tests (Server Logic/Actions)** (To be implemented by dev during implementation, but conceptually noted here):
   - [P0] `reassignLead` action correctly creates a `lead_assignment_logs` entry.
   - [P0] Shortlist grouping logic correctly categorizes properties based on `assignedAgentId`.
   - [P0] Encryption utility correctly decrypts email and phone before passing to the UI.

### Step 4C: Aggregate

**ATDD Test Generation Complete (TDD RED PHASE)**

- **E2E Tests (`tests/e2e/admin/leads.spec.ts`)**: 6 tests (all skipped)
- **Unit Tests (`tests/unit/admin/leads.test.ts`)**: 3 tests (all skipped)

**Acceptance Criteria Coverage**:
- AC1: Admin lead management view displays all leads with required fields (Covered by E2E)
- AC2: Shortlist leads show property refs grouped by agent (Covered by E2E + Unit)
- AC3: Lead reassignment updates agent id and logs entry (Covered by E2E + Unit)
- AC4: Lead list can be filtered (Covered by E2E)
- AC5: Per-agent lead history view (Covered by E2E)
- AC6: Lead PII protected from unauthenticated users (Covered by E2E)

**Next Steps (Task-by-Task Activation)**:
1. Link ATDD artifacts into the story file.
2. Implement the feature.
3. Remove `test.skip()` / `it.skip()` from the tests.
4. Verify tests pass (Green Phase).
5. Commit.
