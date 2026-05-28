import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Hoisted mocks for database client and cookies
const { mockSelect, mockUpdate, mockInsert, mockTransaction, mockCookieGet } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
  mockTransaction: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
    transaction: mockTransaction,
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
  })),
}));

import { bulkReassignLeads } from "@/lib/db/queries/leads";
import { exportAgentLeadsCSVAction } from "@/app/actions/admin-lead-actions";
import { encryptField } from "@/lib/utils/encryption";

describe("Story 8.3: Bulk Lead Reassignment & Export - Server Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(
      "LEAD_ENCRYPTION_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    );
    // Mock the cookies for verifyAdminAuth inside Server Actions
    mockCookieGet.mockReturnValue({
      value: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // SHA-256 of "admin"
    });
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

      // Mock transaction context
      const txMock = {
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      };

      mockTransaction.mockImplementation(async (callback) => {
        return callback(txMock);
      });

      // 1st tx.select - fetch source agent name
      const mockLimit = vi.fn().mockResolvedValue([{ name: "Agent Emma" }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValueOnce({ from: mockFrom });

      // 2nd tx.select - fetch leads assigned to source agent
      const mockLeadsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockLeads),
      });
      mockSelect.mockReturnValueOnce({ from: mockLeadsFrom });

      // tx.update mock
      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      // tx.insert mock
      const mockInsertValues = vi.fn().mockResolvedValue({ success: true });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      // 2. When bulkReassignLeads is executed
      const result = await bulkReassignLeads(sourceAgentId, [targetAgentId]);

      // 3. Then all leads assigned to the source agent are reassigned to the target agent
      expect(result.success).toBe(true);
      expect(result.count).toBe(mockLeads.length);

      expect(mockSelect).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenCalledTimes(2);
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

      // Mock transaction context
      const txMock = {
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      };

      mockTransaction.mockImplementation(async (callback) => {
        return callback(txMock);
      });

      // 1st tx.select - fetch source agent name
      const mockLimit = vi.fn().mockResolvedValue([{ name: "Agent Emma" }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValueOnce({ from: mockFrom });

      // 2nd tx.select - fetch leads assigned to source agent
      const mockLeadsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockLeads),
      });
      mockSelect.mockReturnValueOnce({ from: mockLeadsFrom });

      // tx.update mock
      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      // tx.insert mock
      const mockInsertValues = vi.fn().mockResolvedValue({ success: true });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      // 2. When bulk distribution is executed
      const result = await bulkReassignLeads(sourceAgentId, targetAgentIds);

      // 3. Then leads are distributed evenly/round-robin
      expect(result.success).toBe(true);
      expect(result.count).toBe(mockLeads.length);

      // Verify round-robin mapping
      expect(mockUpdateSet).toHaveBeenNthCalledWith(1, { assignedAgentId: "agent-target-1" });
      expect(mockUpdateSet).toHaveBeenNthCalledWith(2, { assignedAgentId: "agent-target-2" });
      expect(mockUpdateSet).toHaveBeenNthCalledWith(3, { assignedAgentId: "agent-target-1" });
    });

    it("[P0] 8.3-UNIT-003: should throw or return clear error if source agent has zero leads", async () => {
      // 1. Given a source agent with zero leads
      const sourceAgentId = "agent-zero-leads";
      const targetAgentIds = ["agent-target"];

      // Mock transaction context
      const txMock = {
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      };

      mockTransaction.mockImplementation(async (callback) => {
        return callback(txMock);
      });

      // 1st tx.select - fetch source agent name
      const mockLimit = vi.fn().mockResolvedValue([{ name: "Agent ZeroLeads" }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValueOnce({ from: mockFrom });

      // 2nd tx.select - fetch leads (return empty array)
      const mockLeadsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      mockSelect.mockReturnValueOnce({ from: mockLeadsFrom });

      // 2. When execution is attempted
      // 3. Then it should fail with a descriptive error
      await expect(bulkReassignLeads(sourceAgentId, targetAgentIds)).rejects.toThrow(
        "No leads to reassign for Agent ZeroLeads"
      );
    });

    it("[P0] 8.3-UNIT-004: should record immutable logs in leadAssignmentLogs for each reassignment", async () => {
      // 1. Given a bulk reassignment action
      const sourceAgentId = "agent-source";
      const targetAgentId = "agent-target";
      const mockLeads = [{ id: "lead-1", assignedAgentId: sourceAgentId }];

      // Mock transaction context
      const txMock = {
        select: mockSelect,
        update: mockUpdate,
        insert: mockInsert,
      };

      mockTransaction.mockImplementation(async (callback) => {
        return callback(txMock);
      });

      // 1st tx.select - fetch source agent name
      const mockLimit = vi.fn().mockResolvedValue([{ name: "Agent Emma" }]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValueOnce({ from: mockFrom });

      // 2nd tx.select - fetch leads
      const mockLeadsFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(mockLeads),
      });
      mockSelect.mockReturnValueOnce({ from: mockLeadsFrom });

      // tx.update mock
      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      // tx.insert mock
      const mockInsertValues = vi.fn().mockResolvedValue({ success: true });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      // 2. When executed
      const result = await bulkReassignLeads(sourceAgentId, [targetAgentId]);

      // 3. Then immutable log records are inserted with previous, new agent IDs and reassignment date
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsertValues).toHaveBeenCalledWith({
        leadId: "lead-1",
        previousAgentId: "agent-source",
        newAgentId: "agent-target",
      });
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

      // Mock database select query chain for export
      const mockOrderBy = vi.fn().mockResolvedValue(mockLeads);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

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
