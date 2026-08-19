import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("POST /api/recruiting", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.ALTITUD_HUB_URL = "http://mock-hub.local";
    process.env.ALTITUD_HUB_API_SECRET = "mock-secret";
  });

  it("returns 400 if required fields are missing", async () => {
    const { POST } = await import("@/app/api/recruiting/route");
    const request = new Request("http://localhost/api/recruiting", {
      method: "POST",
      body: JSON.stringify({ name: "Carlos" }), // missing email, phone
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("forwards recruitment form payload to Hub and returns 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, candidateId: "mock-uuid" }),
    });

    const { POST } = await import("@/app/api/recruiting/route");
    const payload = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+50688888888",
      languages: "English, Spanish",
      area: "pz",
      car: "yes",
      time: "Full-time",
      financial: "Stable",
      experience: "5 years",
      commission: "Yes",
      message: "Hello",
    };

    const request = new Request("http://localhost/api/recruiting", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-hub.local/api/v1/recruiting/candidates",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-secret",
        },
        body: JSON.stringify(payload),
      })
    );
  });
});
