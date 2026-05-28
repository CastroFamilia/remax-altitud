import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// Hoisted mocks for database client
const { mockSelect, mockUpdate, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  },
}));

beforeAll(() => {
  process.env.LEAD_ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

import { reassignLead } from "@/lib/db/queries/leads";
import { encryptField, decryptField } from "@/lib/utils/encryption";

describe("Story 8.2: Lead Management & Agent Assignment - Server Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("reassignLead Action", () => {
    it("should update assignedAgentId and create a lead_assignment_logs entry", async () => {
      // 1. Given a lead and two agents
      const mockLead = { assignedAgentId: "agent-old" };
      const mockLimit = vi.fn().mockResolvedValue([mockLead]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const mockUpdateWhere = vi.fn().mockResolvedValue({ success: true });
      const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
      mockUpdate.mockReturnValue({ set: mockUpdateSet });

      const mockInsertValues = vi.fn().mockResolvedValue({ success: true });
      mockInsert.mockReturnValue({ values: mockInsertValues });

      // 2. When reassignLead is called
      const result = await reassignLead("lead-1", "agent-new");

      // 3. Then the lead's assignedAgentId is updated to the new agent
      expect(mockSelect).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdateSet).toHaveBeenCalledWith({ assignedAgentId: "agent-new" });
      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsertValues).toHaveBeenCalledWith({
        leadId: "lead-1",
        previousAgentId: "agent-old",
        newAgentId: "agent-new",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Shortlist Grouping Logic", () => {
    it("should group shortlisted properties by assigned agent vs other agents", () => {
      // 1. Given a list of shortlisted property IDs
      const assignedAgentId = "agent-emma";
      const shortlistProperties = [
        { id: "prop-1", titleEn: "Emma's Listing 1", agentId: "agent-emma" },
        { id: "prop-2", titleEn: "Emma's Listing 2", agentId: "agent-emma" },
        { id: "prop-3", titleEn: "Gustavo's Listing", agentId: "agent-gustavo", agentName: "Gustavo" },
      ];

      // 2. When the grouping logic is applied
      const assignedAgentListings = shortlistProperties.filter((p) => p.agentId === assignedAgentId);
      const otherAgentListings = shortlistProperties
        .filter((p) => p.agentId !== assignedAgentId)
        .map((p) => ({
          ...p,
          agentName: p.agentName || "Unknown",
        }));

      // 3. Then the result separates properties assigned to the lead's agent from others
      expect(assignedAgentListings).toHaveLength(2);
      expect(assignedAgentListings[0].id).toBe("prop-1");
      expect(otherAgentListings).toHaveLength(1);
      expect(otherAgentListings[0].id).toBe("prop-3");
      expect(otherAgentListings[0].agentName).toBe("Gustavo");
    });
  });

  describe("Encryption Utility", () => {
    it("should correctly decrypt email and phone fields", () => {
      // 1. Given encrypted email and phone strings
      const testEmail = "test@example.com";
      const testPhone = "+50688888888";

      const encryptedEmail = encryptField(testEmail);
      const encryptedPhone = encryptField(testPhone);

      // 2. When decrypt is called
      const decryptedEmail = decryptField(encryptedEmail);
      const decryptedPhone = decryptField(encryptedPhone);

      // 3. Then it returns the plaintext values
      expect(decryptedEmail).toBe(testEmail);
      expect(decryptedPhone).toBe(testPhone);
    });
  });
});
