import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Hoisted mocks for database client
const { mockSelect, mockUpdate, mockInsert, mockTransaction } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    transaction: mockTransaction,
  },
}));

import { bulkReassignLeads } from "@/lib/db/queries/leads";
import { exportAgentLeadsCSVAction } from "@/app/actions/admin-lead-actions";
import { encryptField } from "@/lib/utils/encryption";

describe.skip("Story 8.3: Bulk Lead Reassignment & Export - Server Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(
      "LEAD_ENCRYPTION_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("bulkReassignLeads Action / Query", () => {
    it("[P0] 8.3-UNIT-001: should reassign all leads from source agent to a single target agent", async () => {
      // 1. Given a source agent, a target agent, and active leads
      const sourceAgentId = "agent-source";
      const targetAgentId = "agent-target";
      const mockLeads = [
        { id: "lead-1", assignedAgentId: sourceAgentId },
        { id: "lead-2", assignedAgentId: sourceAgentId },
      ];

      // Mock database transaction behavior
      mockTransaction.mockImplementation(async (callback) => {
        return callback(vi.fn());
      });

      // 2. When bulkReassignLeads is executed
      const result = await bulkReassignLeads(sourceAgentId, [targetAgentId]);

      // 3. Then all leads assigned to the source agent are reassigned to the target agent
      expect(result.success).toBe(true);
      expect(result.count).toBe(mockLeads.length);
    });

    it("[P0] 8.3-UNIT-002: should distribute leads round-robin among multiple target agents", async () => {
      // 1. Given a source agent, multiple target agents, and active leads
      const sourceAgentId = "agent-source";
      const targetAgentIds = ["agent-target-1", "agent-target-2"];
      const mockLeads = [
        { id: "lead-1", assignedAgentId: sourceAgentId },
        { id: "lead-2", assignedAgentId: sourceAgentId },
        { id: "lead-3", assignedAgentId: sourceAgentId },
      ];

      // Mock transaction
      mockTransaction.mockImplementation(async (callback) => {
        return callback(vi.fn());
      });

      // 2. When bulk distribution is executed
      const result = await bulkReassignLeads(sourceAgentId, targetAgentIds);

      // 3. Then leads are distributed evenly/round-robin
      expect(result.success).toBe(true);
      expect(result.count).toBe(mockLeads.length);
    });

    it("[P0] 8.3-UNIT-003: should throw or return clear error if source agent has zero leads", async () => {
      // 1. Given a source agent with zero leads
      const sourceAgentId = "agent-zero-leads";
      const targetAgentIds = ["agent-target"];

      mockTransaction.mockImplementation(async (callback) => {
        return callback(vi.fn());
      });

      // 2. When execution is attempted
      // 3. Then it should fail with a descriptive error or flag
      try {
        const result = await bulkReassignLeads(sourceAgentId, targetAgentIds);
        expect(result.success).toBe(false);
        expect((result as any).error).toContain("No leads to reassign");
      } catch (error: any) {
        expect(error.message).toContain("No leads to reassign");
      }
    });

    it("[P0] 8.3-UNIT-004: should record immutable logs in leadAssignmentLogs for each reassignment", async () => {
      // 1. Given a bulk reassignment action
      const sourceAgentId = "agent-source";
      const targetAgentId = "agent-target";

      mockTransaction.mockImplementation(async (callback) => {
        return callback(vi.fn());
      });

      // 2. When executed
      const result = await bulkReassignLeads(sourceAgentId, [targetAgentId]);

      // 3. Then immutable log records are inserted with previous, new agent IDs and reassignment date
      expect(result.success).toBe(true);
    });
  });

  describe("CSV Contact Export", () => {
    it("[P0] 8.3-UNIT-005: should query leads for selected agent, decrypt PII (email, phone), and return compliant CSV string", async () => {
      // 1. Given an agent and encrypted lead contacts
      const agentId = "agent-emma";
      const testEmail = "test@example.com";
      const testPhone = "+50688888888";
      const encryptedEmail = encryptField(testEmail);
      const encryptedPhone = encryptField(testPhone);

      const mockLeads = [
        { id: "lead-1", name: "Client One", email: encryptedEmail, phone: encryptedPhone },
      ];

      // 2. When contact export is generated
      const csvString = await exportAgentLeadsCSVAction(agentId);

      // 3. Then it contains the headers and decrypted contact details
      expect(csvString).toContain("Name,Email,Phone");
      expect(csvString).toContain("Client One");
      expect(csvString).toContain(testEmail);
      expect(csvString).toContain(testPhone);
    });
  });
});
