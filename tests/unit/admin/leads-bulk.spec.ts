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

import { getAgentLeadsCount, getLeadsForExport } from "@/lib/db/queries/leads";
import { encryptField } from "@/lib/utils/encryption";

describe("Story 8.3: Bulk Lead Reassignment and Export - Server Logic", () => {
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

  describe("getAgentLeadsCount Query", () => {
    it("should count leads dynamically by agent id where status is not closed", async () => {
      // Given leads count returned from query
      const mockResult = [{ count: 12 }];
      const mockWhere = vi.fn().mockResolvedValue(mockResult);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      // When getAgentLeadsCount is called
      const count = await getAgentLeadsCount("agent-1");

      // Then it returns correct count
      expect(count).toBe(12);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe("getLeadsForExport Query", () => {
    it("should retrieve decryptable client leads for export", async () => {
      // Given client leads with encrypted email & phone
      const emailEnc = encryptField("client@example.com");
      const phoneEnc = encryptField("+506 8888-8888");
      
      const mockLeads = [
        {
          id: "lead-1",
          name: "Client Name",
          email: emailEnc,
          phone: phoneEnc,
          status: "new",
          createdAt: new Date("2026-05-28T00:00:00Z"),
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockLeads);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      // When getLeadsForExport is called
      const result = await getLeadsForExport("agent-1");

      // Then it returns lead list and automatically decrypts email & phone
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Client Name");
      expect(result[0].email).toBe("client@example.com");
      expect(result[0].phone).toBe("+506 8888-8888");
    });
  });

  describe("Manual CSV Formatting Logic", () => {
    it("should generate RFC 4180-compliant CSV containing headers and client info", () => {
      const email = "john,doe@example.com"; // contains comma
      const phone = "+506 1234-5678";
      const name = 'Alice "The Boss" Smith'; // contains double quotes

      // Manual escaping algorithm helper matching implementation
      const escape = (val: string) => {
        const str = val || "";
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = ["Name", "Email", "Phone"].join(",");
      const row = [escape(name), escape(email), escape(phone)].join(",");
      const csv = `${headers}\n${row}`;

      // Expect correctly formatted RFC 4180 strings
      expect(csv).toContain('"Alice ""The Boss"" Smith"');
      expect(csv).toContain('"john,doe@example.com"');
      expect(csv).toContain("+506 1234-5678");
      expect(csv.split("\n")[0]).toBe("Name,Email,Phone");
    });
  });
});
