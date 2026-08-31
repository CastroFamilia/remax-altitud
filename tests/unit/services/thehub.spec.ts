import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendLeadToTheHubJob,
  normalizeIntent,
  type SendLeadToTheHubPayload,
} from "@/lib/services/thehub";
import * as Sentry from "@sentry/nextjs";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("TheHub Integration Service", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("THEHUB_API_URL", "https://hub.remax-altitud.com");
    vi.stubEnv("THEHUB_API_KEY", "thub_live_test_secret_123");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  describe("normalizeIntent", () => {
    it("preserves valid intents ('buy', 'sell', 'rent', 'invest')", () => {
      expect(normalizeIntent("buy")).toEqual({ normalizedIntent: "buy" });
      expect(normalizeIntent("sell")).toEqual({ normalizedIntent: "sell" });
      expect(normalizeIntent("rent")).toEqual({ normalizedIntent: "rent" });
      expect(normalizeIntent("invest")).toEqual({ normalizedIntent: "invest" });
      expect(normalizeIntent("BUY")).toEqual({ normalizedIntent: "buy" });
    });

    it("maps non-standard intents (e.g. 'recruit') to 'invest' with extra note", () => {
      const result = normalizeIntent("recruit");
      expect(result.normalizedIntent).toBe("invest");
      expect(result.extraNote).toBe("Original Intent: recruit");
    });
  });

  describe("sendLeadToTheHubJob", () => {
    it("dispatches POST request to /api/v1/leads with correctly formatted LeadInput payload and headers", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { leadId: "thehub-lead-uuid-123" } }),
      });
      global.fetch = mockFetch;

      const payload: SendLeadToTheHubPayload = {
        id: "local-lead-uuid",
        name: "Maria Rodriguez",
        phone: "+506 8765-4321",
        email: "maria.rodriguez@example.com",
        source: "facebook_ads",
        intent: "buy",
        notes: "Interested in ocean view villas in Dominical.",
        propertyId: "d3b07384-d113-4a18-971b-3f4ee2d4e8b8",
        assignedAgentId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        utmSource: "fb",
        utmMedium: "cpc",
        utmCampaign: "spring_2026",
        referrer: "https://facebook.com/ad",
      };

      await sendLeadToTheHubJob(payload);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe("https://hub.remax-altitud.com/api/v1/leads");
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer thub_live_test_secret_123",
        "X-API-Key": "thub_live_test_secret_123",
      });

      const parsedBody = JSON.parse(options.body);
      expect(parsedBody).toEqual({
        name: "Maria Rodriguez",
        phone: "+506 8765-4321",
        email: "maria.rodriguez@example.com",
        source: "facebook_ads",
        intent: "buy",
        notes: "Interested in ocean view villas in Dominical.",
        propertyId: "d3b07384-d113-4a18-971b-3f4ee2d4e8b8",
        assignedAgentId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        utmData: {
          utm_source: "fb",
          utm_medium: "cpc",
          utm_campaign: "spring_2026",
          referrer: "https://facebook.com/ad",
        },
      });
    });

    it("resolves propertyId from single item shortlistPropertyIds", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const payload: SendLeadToTheHubPayload = {
        name: "Juan Perez",
        phone: "+506 8888-9999",
        source: "contact_form",
        intent: "sell",
        shortlistPropertyIds: ["prop-uuid-999"],
      };

      await sendLeadToTheHubJob(payload);

      const [, options] = mockFetch.mock.calls[0];
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.propertyId).toBe("prop-uuid-999");
    });

    it("falls back to ALTITUD_HUB_URL and ALTITUD_HUB_API_SECRET when THEHUB_ env vars are not set", async () => {
      vi.stubEnv("THEHUB_API_URL", "");
      vi.stubEnv("THEHUB_API_KEY", "");
      vi.stubEnv("ALTITUD_HUB_URL", "http://localhost:3000");
      vi.stubEnv("ALTITUD_HUB_API_SECRET", "altitud_secret_456");

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      await sendLeadToTheHubJob({
        name: "Test Lead",
        phone: "+506 1234-5678",
        source: "seller_form",
        intent: "sell",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("http://localhost:3000/api/v1/leads");
      expect(options.headers.Authorization).toBe("Bearer altitud_secret_456");
    });

    it("handles non-200 HTTP response gracefully without throwing", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: async () => JSON.stringify({ success: false, error: { message: "Validation error" } }),
      });
      global.fetch = mockFetch;

      await expect(
        sendLeadToTheHubJob({
          name: "Test Lead",
          phone: "+506 1234-5678",
          source: "seller_form",
          intent: "sell",
        }),
      ).resolves.not.toThrow();
    });

    it("handles fetch rejection and reports to Sentry without throwing", async () => {
      const networkError = new Error("Network timeout");
      const mockFetch = vi.fn().mockRejectedValue(networkError);
      global.fetch = mockFetch;

      await expect(
        sendLeadToTheHubJob({
          name: "Test Lead",
          phone: "+506 1234-5678",
          source: "seller_form",
          intent: "sell",
        }),
      ).resolves.not.toThrow();

      // Wait a microtask tick for catch handler to execute
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(Sentry.captureException).toHaveBeenCalledWith(networkError);
    });
  });
});
