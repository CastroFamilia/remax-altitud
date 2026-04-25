import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __setSleepFnForTests,
  fetchAgentsForOffice,
  fetchPropertiesForOffice,
  fetchWithRetry,
  RemaxApiError,
} from "@/lib/sync/api-client";

const OFFICE_GUID = "FEA8746D-CC1D-41B8-89F3-D04AC98274AF";
const ENV_KEYS = ["REMAX_API_BASE_URL", "PZ_OFFICE_GUID", "DOM_OFFICE_GUID"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.REMAX_API_BASE_URL = "https://api.remax-cca.example/api";
  process.env.PZ_OFFICE_GUID = OFFICE_GUID;
  process.env.DOM_OFFICE_GUID = "4AD5AE8F-5B47-4A1A-A953-40445F2B4940";
  __setSleepFnForTests(() => Promise.resolve());
});

afterEach(() => {
  vi.restoreAllMocks();
  __setSleepFnForTests(null);
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchWithRetry", () => {
  it("returns the JSON body on a 200 response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse([{ a: 1 }]));
    const result = await fetchWithRetry("https://example.com/ok");
    expect(result).toEqual([{ a: 1 }]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries after two 500 failures and succeeds on the third attempt", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("boom", { status: 500 }))
      .mockResolvedValueOnce(new Response("boom again", { status: 500 }))
      .mockResolvedValueOnce(jsonResponse([{ ok: true }]));

    const result = await fetchWithRetry("https://example.com/retry-ok");
    expect(result).toEqual([{ ok: true }]);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("throws RemaxApiError after all three attempts fail", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("boom", { status: 500 }));

    const url = "https://example.com/exhaust";
    await expect(fetchWithRetry(url)).rejects.toMatchObject({
      name: "RemaxApiError",
      endpoint: url,
      status: 500,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("treats a non-array JSON root as a failure and retries", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ not: "an array" }))
      .mockResolvedValueOnce(jsonResponse({ still: "not an array" }))
      .mockResolvedValueOnce(jsonResponse({ nope: true }));

    const url = "https://example.com/non-array";
    let caught: unknown;
    try {
      await fetchWithRetry(url);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(RemaxApiError);
    const asApi = caught as RemaxApiError;
    expect(asApi.endpoint).toBe(url);
    expect(asApi.status).toBe(200);
    expect((asApi.cause as Error).message).toMatch(/not a JSON array/);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("treats invalid JSON as a failure", async () => {
    const badJson = () =>
      new Response("not json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => badJson());

    await expect(fetchWithRetry("https://example.com/bad-json")).rejects.toBeInstanceOf(
      RemaxApiError,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});

describe("fetchPropertiesForOffice", () => {
  it("returns an empty result for an empty array response (Altitud Cero steady state)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const result = await fetchPropertiesForOffice(OFFICE_GUID);
    expect(result.records).toEqual([]);
    expect(result.parseErrors).toEqual([]);
  });

  it("issues GET against PropertiesPerOffice/{guid}", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    await fetchPropertiesForOffice(OFFICE_GUID);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe(
      `https://api.remax-cca.example/api/PropertiesPerOffice/${OFFICE_GUID}`,
    );
  });
});

describe("fetchAgentsForOffice", () => {
  it("issues GET against AgentsPerOffice/{guid} and parses the response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));
    const result = await fetchAgentsForOffice(OFFICE_GUID);
    expect(result.records).toEqual([]);
    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe(
      `https://api.remax-cca.example/api/AgentsPerOffice/${OFFICE_GUID}`,
    );
  });
});
