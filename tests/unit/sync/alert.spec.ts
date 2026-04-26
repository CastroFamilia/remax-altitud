/**
 * Unit tests — Story 2.7: Sync Monitoring & Failure Resilience
 * Module: src/lib/sync/alert.ts
 *
 * Covers AC #1 — automated alert is sent to admin when all 3 retries are exhausted.
 * Covers AC #6 — alert failure must NEVER throw and NEVER crash the sync pipeline.
 *
 * global.fetch is assigned at module level (before the module under test is
 * imported) so that alert.ts captures the mock at import time.
 * vi.clearAllMocks() in beforeEach resets call state between tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock global fetch before importing the module under test
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { sendSyncFailureAlert } from "@/lib/sync/alert";

// ---------------------------------------------------------------------------
// Env setup / teardown
// ---------------------------------------------------------------------------

const WEBHOOK_KEY = "ALERT_SLACK_WEBHOOK";
let savedWebhook: string | undefined;

beforeEach(() => {
  savedWebhook = process.env[WEBHOOK_KEY];
  vi.clearAllMocks();
});

afterEach(() => {
  if (savedWebhook === undefined) {
    delete process.env[WEBHOOK_KEY];
  } else {
    process.env[WEBHOOK_KEY] = savedWebhook;
  }
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #1 — webhook configured: alert is sent
// ---------------------------------------------------------------------------

describe("sendSyncFailureAlert — webhook configured (AC #1)", () => {
  it(
    "[P0] given ALERT_SLACK_WEBHOOK is set when sendSyncFailureAlert is called then fetch is called once",
    async () => {
      // AC #1: When all retries are exhausted, an alert must be dispatched
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await sendSyncFailureAlert("Network timeout after 3 retries");

      expect(mockFetch).toHaveBeenCalledOnce();
    },
  );

  it(
    "[P0] given ALERT_SLACK_WEBHOOK='https://hooks.slack.com/services/test/webhook' when sendSyncFailureAlert('Network timeout') called then fetch is called with that URL",
    async () => {
      // AC #1: The webhook URL from env must be the fetch target
      const webhookUrl = "https://hooks.slack.com/services/test/webhook";
      process.env[WEBHOOK_KEY] = webhookUrl;
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await sendSyncFailureAlert("Network timeout");

      expect(mockFetch).toHaveBeenCalledWith(
        webhookUrl,
        expect.objectContaining({ method: "POST" }),
      );
    },
  );

  it(
    "[P0] given ALERT_SLACK_WEBHOOK is set when sendSyncFailureAlert('API unreachable') called then fetch body contains the error message",
    async () => {
      // AC #1: The alert body must include the error message for admin diagnosis
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await sendSyncFailureAlert("API unreachable");

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.text).toContain("API unreachable");
    },
  );

  it(
    "[P0] given ALERT_SLACK_WEBHOOK is set when sendSyncFailureAlert called then fetch body is JSON with 'remax-altitud' identifier",
    async () => {
      // AC #1: Alert body must identify the source system for admin triage
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await sendSyncFailureAlert("Sync failure: timeout");

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.text).toContain("remax-altitud");
    },
  );

  it(
    "[P1] given ALERT_SLACK_WEBHOOK is set when sendSyncFailureAlert called then fetch is called with Content-Type application/json header",
    async () => {
      // Slack webhook requires JSON content-type
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await sendSyncFailureAlert("Sync error");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    },
  );

  it(
    "[P2] given ALERT_SLACK_WEBHOOK is set when sendSyncFailureAlert resolves then the function returns void (undefined)",
    async () => {
      // Alert function must return void — no result needed by pipeline catch block
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      const result = await sendSyncFailureAlert("error");

      expect(result).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — webhook NOT configured: graceful degradation
// ---------------------------------------------------------------------------

describe("sendSyncFailureAlert — webhook not configured (AC #6)", () => {
  it(
    "[P0] given ALERT_SLACK_WEBHOOK is not set when sendSyncFailureAlert is called then fetch is NOT called",
    async () => {
      // AC #6: No webhook = graceful degradation; must not call fetch (undefined URL)
      delete process.env[WEBHOOK_KEY];

      await sendSyncFailureAlert("Sync pipeline crashed");

      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  it(
    "[P0] given ALERT_SLACK_WEBHOOK is not set when sendSyncFailureAlert is called then it does NOT throw",
    async () => {
      // AC #6: Alert failure must NEVER crash the sync pipeline
      delete process.env[WEBHOOK_KEY];

      await expect(sendSyncFailureAlert("Sync pipeline crashed")).resolves.not.toThrow();
    },
  );

  it(
    "[P1] given ALERT_SLACK_WEBHOOK is not set when sendSyncFailureAlert is called then it returns void (undefined)",
    async () => {
      delete process.env[WEBHOOK_KEY];

      const result = await sendSyncFailureAlert("error");

      expect(result).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — fetch fails: error is swallowed, pipeline never crashes
// ---------------------------------------------------------------------------

describe("sendSyncFailureAlert — fetch throws (AC #6 resilience)", () => {
  it(
    "[P0] given ALERT_SLACK_WEBHOOK is set and fetch rejects when sendSyncFailureAlert is called then it does NOT throw",
    async () => {
      // AC #6: Alert delivery failure must NEVER propagate — site resilience takes priority
      // Architecture: swallow alerting errors, log them only
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(sendSyncFailureAlert("Sync failure")).resolves.not.toThrow();
    },
  );

  it(
    "[P0] given fetch rejects when sendSyncFailureAlert is called then it returns void (undefined)",
    async () => {
      // Swallowed error still returns void — pipeline catch block must not be disrupted
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await sendSyncFailureAlert("error");

      expect(result).toBeUndefined();
    },
  );

  it(
    "[P1] given fetch returns non-2xx status when sendSyncFailureAlert is called then it does NOT throw",
    async () => {
      // Even a failed Slack response (e.g. 429 rate limit) must not propagate
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: false, status: 429 } as Response);

      await expect(sendSyncFailureAlert("Sync failure")).resolves.not.toThrow();
    },
  );

  it(
    "[P1] given fetch returns non-2xx status when sendSyncFailureAlert is called then console.warn is called with the status",
    async () => {
      // Non-2xx Slack responses must be logged — consistent with api-client.ts, pipeline.ts, image-optimizer.ts
      process.env[WEBHOOK_KEY] = "https://hooks.slack.com/services/test/webhook";
      mockFetch.mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" } as Response);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await sendSyncFailureAlert("Sync failure");

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[sync/alert]"),
        expect.anything(),
        expect.anything(),
      );
    },
  );
});
