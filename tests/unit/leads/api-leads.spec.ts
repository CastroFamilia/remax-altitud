/**
 * Story 5.3: Seller Lead Storage, Routing & Source Tracking — API Route Tests
 *
 * TDD Phase: RED — all tests will fail until /api/leads route is implemented.
 *
 * Covers (from test-design-epic-5.md):
 *   5.3-API-001 — POST /api/leads stores all seller form fields
 *   5.3-API-002 — Duplicate submission within 60s returns 409
 *   5.3-API-003 — POST /api/leads with DB error → Sentry captures, 500 returned
 *   5.3-API-004 — Zod schema rejects missing required fields with clear error
 *   5.3-API-005 — UTM parameters captured and stored on lead record
 *   5.3-API-006 — HTTP referrer captured and stored on lead record
 *   5.3-API-007 — Seller form lead stores source = "seller_form", intent = "sell"
 *   5.3-API-008 — Zod sanitizes SQL injection in utm_source
 *   5.3-API-009 — POST creates lead with all 14+ schema fields
 *   5.3-API-010 — POST responds within 500ms
 *
 * Also covers:
 *   5.2-API-001 — CMA form submission stores source = "cma_form", intent = "sell"
 *
 * AC #1-4, #7-10 (all backend acceptance criteria)
 * Risks: R-001 (PII), R-002 (silent drop), R-003 (dedup), R-005 (routing), R-010 (injection)
 *
 * Implementation target: src/app/api/leads/route.ts (POST handler)
 *
 * Environment: node (.spec.ts → node project via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock Sentry to track captureException calls (AC #10, R-002)
const mockCaptureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
  withScope: vi.fn((cb) => cb({ setExtra: vi.fn() })),
}));

// Mock encryption utilities
vi.mock("@/lib/utils/encryption", () => ({
  encryptField: vi.fn((val: string) => `encrypted:${val}`),
  decryptField: vi.fn((val: string) => val.replace("encrypted:", "")),
}));

// Mock agent routing
const mockMatchAgent = vi.fn();
vi.mock("@/lib/leads/route-agent", () => ({
  matchAgentByCoordinates: mockMatchAgent,
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

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

// We'll dynamically import the route handler in each test
// Target: src/app/api/leads/route.ts → export { POST }

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function buildSellerLeadPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Carlos Vendedor",
    phone: "+50688881234",
    email: "carlos@example.com",
    source: "seller_form",
    intent: "sell",
    propertyType: "Casa",
    location: { text: "Pérez Zeledón", lat: 9.3725, lng: -83.7011 },
    size: "500",
    sizeUnit: "sqm",
    priceExpectation: "250000",
    needsPricingHelp: false,
    description: "Beautiful 3BR house with mountain views",
    bedrooms: "3",
    bathrooms: "2",
    preferredLanguage: "es",
    notes: "",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    referrer: null,
    ...overrides,
  };
}

function buildCmaLeadPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ana Vendedora",
    phone: "+50677772222",
    email: "ana@example.com",
    source: "cma_form",
    intent: "sell",
    propertyType: "Finca",
    location: { text: "Dominical", lat: 9.257, lng: -83.885 },
    size: "1000",
    sizeUnit: "sqm",
    priceExpectation: "",
    needsPricingHelp: true,
    description: "",
    bedrooms: "",
    bathrooms: "",
    preferredLanguage: "en",
    notes: "CMA request — needs pricing consultation",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    referrer: null,
    ...overrides,
  };
}

/**
 * Helper to create a mock Next.js Request object
 */
function createMockRequest(
  body: unknown,
  options: { headers?: Record<string, string> } = {},
) {
  return new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const TEST_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("LEAD_ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
  // Default mock behaviors
  mockMatchAgent.mockResolvedValue("agent-pz-001");
  mockFindRecentDuplicate.mockResolvedValue(null); // no duplicate
  mockCreateLead.mockResolvedValue({
    id: "lead-test-001",
    assignedAgentId: "agent-pz-001",
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// 5.3-API-001: POST /api/leads stores all seller form fields
// ---------------------------------------------------------------------------

describe("POST /api/leads — Seller form (5.3-API-001)", () => {
  it("[P0] 5.3-API-001: stores all seller form fields and returns 201 with leadId + assignedAgentId", async () => {
    mockCreateLead.mockResolvedValue({
      id: "lead-test-001",
      assignedAgentId: null,
    });

    // R-002: lead must be persisted, not silently dropped
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);
    const body = await response.json();

    // Must return 201 Created
    expect(response.status).toBe(201);

    // Response must include leadId and assignedAgentId with correct values
    expect(body.leadId).toBe("lead-test-001");
    expect(body.assignedAgentId).toBeNull();

    // createLead must have been called with all critical fields
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.name).toBe("Carlos Vendedor");
    expect(createArgs.phone).toBe("+50688881234");
    expect(createArgs.email).toBe("carlos@example.com");
    expect(createArgs.source).toBe("seller_form");
    expect(createArgs.intent).toBe("sell");
    expect(createArgs.language).toBe("es");
    expect(createArgs.assignedAgentId).toBeNull();
    expect(createArgs.status).toBe("new");
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-002: Duplicate submission within 60s → 409
// ---------------------------------------------------------------------------

describe("POST /api/leads — Deduplication (5.3-API-002)", () => {
  it("[P0] 5.3-API-002: duplicate submission within 60s (same phone+source) returns 409", async () => {
    // R-003: idempotency — duplicate within 60s must be rejected
    const { POST } = await import("@/app/api/leads/route");

    // Mock: a recent duplicate exists
    mockFindRecentDuplicate.mockResolvedValue({
      id: "lead-existing-001",
      phone: "+50688881234",
      source: "seller_form",
    });

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);
    const body = await response.json();

    // Must return 409 Conflict
    expect(response.status).toBe(409);

    // Must include an "already submitted" error
    expect(body.error).toMatch(/already submitted/i);

    // Must NOT create a new lead
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("[P0] 5.3-API-002b: non-duplicate (no recent match) proceeds to create the lead", async () => {
    const { POST } = await import("@/app/api/leads/route");

    // Mock: no duplicate found
    mockFindRecentDuplicate.mockResolvedValue(null);

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-003: DB error → Sentry captures, 500 returned (not silent 200)
// ---------------------------------------------------------------------------

describe("POST /api/leads — Error handling (5.3-API-003)", () => {
  it("[P0] 5.3-API-003: DB error triggers Sentry.captureException and returns 500 (not silent 200)", async () => {
    // R-002: silent lead drop is revenue loss — must capture error in Sentry
    const { POST } = await import("@/app/api/leads/route");

    // Mock: createLead throws a DB error
    const dbError = new Error("connection refused");
    mockCreateLead.mockRejectedValue(dbError);

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);
    const body = await response.json();

    // Must return 500 (NOT 200 — silent success is a critical bug)
    expect(response.status).toBe(500);

    // Must include a clear error message
    expect(body.error).toBeDefined();
    expect(body.error).toMatch(/failed|error/i);

    // Sentry must capture the exception (AR19)
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(dbError);
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-004: Zod schema rejects missing required fields
// ---------------------------------------------------------------------------

describe("POST /api/leads — Validation (5.3-API-004)", () => {
  it("[P1] 5.3-API-004a: missing phone field returns 400 with field-specific error", async () => {
    // AR18: Zod validation — all input validated, clear 400 on failure
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({ phone: undefined });
    // @ts-expect-error — intentionally removing required field
    delete payload.phone;

    const request = createMockRequest(payload);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/validation/i);
    // Must include field-specific issues
    expect(body.issues).toBeDefined();
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it("[P1] 5.3-API-004b: missing name field returns 400", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({ name: undefined });
    // @ts-expect-error — intentionally removing required field
    delete payload.name;

    const request = createMockRequest(payload);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("[P1] 5.3-API-004c: invalid source enum value returns 400", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({ source: "invalid_source" });
    const request = createMockRequest(payload);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("[P1] 5.3-API-004d: invalid intent enum value returns 400", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({ intent: "invalid_intent" });
    const request = createMockRequest(payload);
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-005: UTM parameters captured and stored
// ---------------------------------------------------------------------------

describe("POST /api/leads — UTM tracking (5.3-API-005)", () => {
  it("[P1] 5.3-API-005: UTM parameters (utm_source, utm_medium, utm_campaign) stored on lead record", async () => {
    // FR54: UTM source tracking
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      utm_source: "facebook",
      utm_medium: "ad",
      utm_campaign: "sellers_pz",
    });
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    // createLead must have been called with UTM fields (camelCase per createLead interface)
    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.utmSource).toBe("facebook");
    expect(createArgs.utmMedium).toBe("ad");
    expect(createArgs.utmCampaign).toBe("sellers_pz");
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-006: HTTP referrer captured and stored
// ---------------------------------------------------------------------------

describe("POST /api/leads — Referrer tracking (5.3-API-006)", () => {
  it("[P1] 5.3-API-006: HTTP Referer header is captured and stored on lead record", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      referrer: "https://www.google.com/search?q=vender+casa+costa+rica",
    });
    const request = createMockRequest(payload, {
      headers: {
        Referer:
          "https://www.google.com/search?q=vender+casa+costa+rica",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    // Referrer must be stored
    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.referrer).toMatch(/google\.com/);
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-007: Seller form lead stores correct source and intent
// ---------------------------------------------------------------------------

describe("POST /api/leads — Source tracking (5.3-API-007)", () => {
  it("[P1] 5.3-API-007: seller form lead stores source='seller_form' and intent='sell'", async () => {
    // R-009: correct source/intent tagging
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.source).toBe("seller_form");
    expect(createArgs.intent).toBe("sell");
  });
});

// ---------------------------------------------------------------------------
// 5.2-API-001: CMA form submission stores source = "cma_form", intent = "sell"
// ---------------------------------------------------------------------------

describe("POST /api/leads — CMA form (5.2-API-001)", () => {
  it("[P0] 5.2-API-001: CMA form submission stores source='cma_form' and intent='sell'", async () => {
    // R-009: CMA must have distinct source from seller_form
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildCmaLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.source).toBe("cma_form");
    expect(createArgs.intent).toBe("sell");
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-008: Zod sanitizes SQL injection in UTM params
// ---------------------------------------------------------------------------

describe("POST /api/leads — Input sanitization (5.3-API-008)", () => {
  it("[P1] 5.3-API-008: SQL injection in utm_source is rejected by Zod regex", async () => {
    // R-010: UTM params validated by Zod regex /^[a-zA-Z0-9_\-./ ]*$/
    // SQL injection chars ('; --) are NOT allowed by the regex → 400
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      utm_source: "'; DROP TABLE leads; --",
    });
    const request = createMockRequest(payload);

    const response = await POST(request);
    const body = await response.json();

    // Zod must reject — the regex explicitly disallows semicolons and quotes
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/validation/i);
    expect(body.issues).toBeDefined();
    // Lead must NOT be created
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("[P1] 5.3-API-008b: valid utm_source characters are accepted", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      utm_source: "facebook_organic-2026",
      utm_medium: "social",
      utm_campaign: "spring/sellers.launch",
    });
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.utmSource).toBe("facebook_organic-2026");
  });

  it("[P1] 5.3-API-008c: utm_source exceeding 200 chars is rejected", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      utm_source: "a".repeat(201),
    });
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-009: Full schema field verification
// ---------------------------------------------------------------------------

describe("POST /api/leads — Full schema (5.3-API-009)", () => {
  it("[P2] 5.3-API-009: lead record contains all 14+ schema fields per AC #3", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      source: "contact_form",
      intent: "buy",
      utm_source: "facebook",
      utm_medium: "ad",
      utm_campaign: "sellers_pz",
      referrer: "https://facebook.com",
    });
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    // Verify createLead was called with all required schema fields per AC #3
    const createArgs = mockCreateLead.mock.calls[0][0];

    // Required identity fields
    expect(createArgs.name).toBe("Carlos Vendedor");
    expect(createArgs.phone).toBe("+50688881234");
    expect(createArgs.email).toBe("carlos@example.com");

    // Source tracking fields
    expect(createArgs.source).toBe("contact_form");
    expect(createArgs.intent).toBe("buy");
    expect(createArgs.language).toBe("es");

    // Agent assignment
    expect(createArgs.assignedAgentId).toBe("agent-pz-001");

    // UTM fields
    expect(createArgs.utmSource).toBe("facebook");
    expect(createArgs.utmMedium).toBe("ad");
    expect(createArgs.utmCampaign).toBe("sellers_pz");

    // Referrer
    expect(createArgs.referrer).toBe("https://facebook.com");

    // Status must be "new" for fresh leads
    expect(createArgs.status).toBe("new");

    // Notes must contain property details
    expect(createArgs.notes).toBeDefined();
    expect(createArgs.notes).toMatch(/Property: Casa/);
  });
});

// ---------------------------------------------------------------------------
// 5.3-API-010: Response time (P3)
// ---------------------------------------------------------------------------

describe("POST /api/leads — Performance (5.3-API-010)", () => {
  it("[P3] 5.3-API-010: POST responds within 500ms under normal load", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const start = performance.now();
    const response = await POST(request);
    const elapsed = performance.now() - start;

    expect(response.status).toBe(201);
    // With mocked DB, this should be well under 500ms
    // In integration, this validates no N+1 or slow queries
    expect(elapsed).toBeLessThan(500);
  });
});

// ---------------------------------------------------------------------------
// Edge cases: invalid JSON body, email-optional
// ---------------------------------------------------------------------------

describe("POST /api/leads — Edge cases", () => {
  it("[P1] returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const request = new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid json/i);
    expect(mockCreateLead).not.toHaveBeenCalled();
  });

  it("[P1] accepts submission without email (email is optional per AC)", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({ email: "" });
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    const createArgs = mockCreateLead.mock.calls[0][0];
    // email should be null (empty string converted to null)
    expect(createArgs.email).toBeNull();
  });

  it("[P1] passes agent routing coordinates from location field", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const payload = buildSellerLeadPayload({
      source: "contact_form",
      location: { text: "Dominical", lat: 9.257, lng: -83.885 },
    });
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    // matchAgentByCoordinates must have been called with the correct coords
    expect(mockMatchAgent).toHaveBeenCalledWith(9.257, -83.885);
  });

  it("[P0] creates lead even when agent routing returns null (AC: assigned_agent_id can be null)", async () => {
    const { POST } = await import("@/app/api/leads/route");

    // Agent routing fails
    mockMatchAgent.mockResolvedValue(null);

    const payload = buildSellerLeadPayload();
    const request = createMockRequest(payload);

    const response = await POST(request);
    expect(response.status).toBe(201);

    // Lead must still be created
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
    const createArgs = mockCreateLead.mock.calls[0][0];
    expect(createArgs.assignedAgentId).toBeNull();
  });
});
