/**
 * Story 7.4: Smart Agent Routing from Shortlist — Leads API Routing & Zod Schema Tests
 * Module: src/app/api/leads/route.ts
 *
 * Covers:
 *   - Task 2: Modifying POST /api/leads and extending Zod Schema validation.
 *   - AC #5: Validating input schema accepts optional assignedAgentId (UUID) and shortlistPropertyIds (array of UUIDs).
 *   - AC #5: Skips geographical coordinate matching when assignedAgentId is provided directly.
 *   - AC #5: Maps shortlistPropertyIds directly into createLead persistence parameters.
 *   - AC #6: Leads query grouping logic helper (getShortlistLeadDetails) test scaffold in tests/unit/leads/leads-query.spec.ts.
 *
 * DB and routing utilities are mocked — no live DB connection.
 * Marked with describe.skip for the TDD RED phase.
 */

import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  withScope: vi.fn((cb) => cb({ setExtra: vi.fn() })),
}));

// Mock encryption
vi.mock("@/lib/utils/encryption", () => ({
  encryptField: vi.fn((val: string) => `encrypted:${val}`),
  decryptField: vi.fn((val: string) => val.replace("encrypted:", "")),
}));

// Mock agent routing coordinator
const mockMatchAgentByCoordinates = vi.fn();
vi.mock("@/lib/leads/route-agent", () => ({
  matchAgentByCoordinates: mockMatchAgentByCoordinates,
}));

// Mock lead queries
const mockCreateLead = vi.fn();
const mockFindRecentDuplicate = vi.fn();
vi.mock("@/lib/db/queries/leads", () => ({
  createLead: mockCreateLead,
  findRecentDuplicate: mockFindRecentDuplicate,
}));

// Mock DB client
vi.mock("@/lib/db/client", () => ({
  db: {},
}));

function createMockRequest(body: unknown) {
  return new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Story 7.4: POST /api/leads — Smart Agent Routing Integration (RED PHASE)", () => {
  beforeAll(() => {
    process.env.LEAD_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchAgentByCoordinates.mockResolvedValue("agent-coordinates-fallback");
    mockFindRecentDuplicate.mockResolvedValue(null);
    mockCreateLead.mockResolvedValue({ id: "lead-routing-123", assignedAgentId: "agent-emma" });
  });

  it("[P0] 7.4-UNIT-008: accepts assignedAgentId and shortlistPropertyIds, and bypasses coordinates matching (AC #5)", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = {
      name: "Juan Perez",
      phone: "+50688888888",
      email: "juan@example.com",
      source: "whatsapp_click",
      intent: "buy",
      preferredLanguage: "es",
      assignedAgentId: "88888888-8888-8888-8888-888888888888",
      shortlistPropertyIds: [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222"
      ],
      utm_source: "shortlist_page",
      referrer: "https://altitud.remax",
    };

    const request = createMockRequest(payload);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.leadId).toBe("lead-routing-123");

    // Coordinates routing MUST be bypassed because assignedAgentId was specified directly
    expect(mockMatchAgentByCoordinates).not.toHaveBeenCalled();

    // createLead must be called with all custom smart routing parameters
    expect(mockCreateLead).toHaveBeenCalledOnce();
    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.assignedAgentId).toBe("88888888-8888-8888-8888-888888888888");
    expect(createArgs.shortlistPropertyIds).toEqual([
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ]);
  });

  it("[P1] 7.4-UNIT-009: rejects invalid UUID format for assignedAgentId and shortlistPropertyIds (AC #5)", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = {
      name: "Juan Perez",
      phone: "+50688888888",
      email: "juan@example.com",
      source: "whatsapp_click",
      intent: "buy",
      preferredLanguage: "es",
      assignedAgentId: "invalid-uuid-format",
      shortlistPropertyIds: ["not-a-uuid"],
    };

    const request = createMockRequest(payload);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/validation/i);
    expect(mockCreateLead).not.toHaveBeenCalled();
  });
});
