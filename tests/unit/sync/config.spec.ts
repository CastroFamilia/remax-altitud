import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRemaxConfig } from "@/lib/sync/config";

const ENV_KEYS = ["REMAX_API_BASE_URL", "PZ_OFFICE_GUID", "DOM_OFFICE_GUID"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("getRemaxConfig", () => {
  it("returns a typed config when all vars are present", () => {
    process.env.REMAX_API_BASE_URL = "https://api.example";
    process.env.PZ_OFFICE_GUID = "guid-1";
    process.env.DOM_OFFICE_GUID = "guid-2";
    expect(getRemaxConfig()).toEqual({
      baseUrl: "https://api.example",
      pzOfficeGuid: "guid-1",
      domOfficeGuid: "guid-2",
    });
  });

  it("throws with all missing vars listed at once", () => {
    expect(() => getRemaxConfig()).toThrowError(
      "Missing required RE/MAX env vars: REMAX_API_BASE_URL, PZ_OFFICE_GUID, DOM_OFFICE_GUID",
    );
  });

  it("lists only the missing vars when some are set", () => {
    process.env.REMAX_API_BASE_URL = "https://api.example";
    expect(() => getRemaxConfig()).toThrowError(
      "Missing required RE/MAX env vars: PZ_OFFICE_GUID, DOM_OFFICE_GUID",
    );
  });
});
