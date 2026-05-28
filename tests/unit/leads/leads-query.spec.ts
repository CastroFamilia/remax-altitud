/**
 * Story 7.4: Smart Agent Routing from Shortlist — Database Query Helper Unit Tests
 * Module: src/lib/db/queries/leads.ts
 *
 * Covers:
 *   - Task 6: Grouping Query Helper for Admin View Support.
 *   - AC #6: backend query groups properties by those belonging to the assigned coordinator agent and other agents.
 *
 * DB queries are mocked using vi.mock.
 * Marked with describe.skip for the TDD RED phase.
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// Hoisted mocks for Drizzle client select/where chains
const { mockWhere, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  return { mockWhere, mockFrom, mockSelect };
});

vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock("@/lib/utils/encryption", () => ({
  decryptField: vi.fn((val: string) => val),
}));

import { getShortlistLeadDetails } from "@/lib/db/queries/leads";

describe.skip("Story 7.4: getShortlistLeadDetails — Grouping Query Helper (RED PHASE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("[P0] 7.4-UNIT-010: retrieves shortlist lead details, grouping properties by listing agent", async () => {
    const mockLead = {
      id: "lead-routing-123",
      name: "Juan Perez",
      phone: "+50688888888",
      email: "juan@example.com",
      assignedAgentId: "agent-emma",
      shortlistPropertyIds: ["prop-1", "prop-2", "prop-3"],
      source: "whatsapp_click",
      intent: "buy",
    };

    const mockPropertiesWithAgents = [
      {
        properties: { id: "prop-1", titleEn: "Emma's House 1", apiId: "REF-123", agentId: "agent-emma" },
        agents: { id: "agent-emma", name: "Emma" },
      },
      {
        properties: { id: "prop-2", titleEn: "Emma's House 2", apiId: "REF-456", agentId: "agent-emma" },
        agents: { id: "agent-emma", name: "Emma" },
      },
      {
        properties: { id: "prop-3", titleEn: "Gustavo's Cabin", apiId: "REF-321", agentId: "agent-gustavo" },
        agents: { id: "agent-gustavo", name: "Gustavo" },
      },
    ];

    // Mock first query (leads query) and second query (properties query)
    mockWhere
      .mockResolvedValueOnce([mockLead])
      .mockResolvedValueOnce(mockPropertiesWithAgents);

    const result = await getShortlistLeadDetails("lead-routing-123");

    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(result.assignedAgentId).toBe("agent-emma");
    expect(result.groupedDetails).toBeDefined();

    // Verify grouping structure
    expect(result.groupedDetails.assignedAgentListings).toHaveLength(2);
    expect(result.groupedDetails.assignedAgentListings[0].id).toBe("prop-1");
    expect(result.groupedDetails.otherAgentListings).toHaveLength(1);
    expect(result.groupedDetails.otherAgentListings[0].id).toBe("prop-3");
    expect(result.groupedDetails.otherAgentListings[0].agentName).toBe("Gustavo");
  });
});
