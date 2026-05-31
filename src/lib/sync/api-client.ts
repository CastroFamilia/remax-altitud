import "server-only";
import type { FetchResult, RawAgent, RawProperty } from "@/types/remax-api";
import { getRemaxConfig } from "./config";
import { parseAgentArray, parsePropertyArray } from "./parser";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2_000, 4_000] as const;
const FETCH_TIMEOUT_MS = 15_000;

type SleepFn = (ms: number) => Promise<void>;

let sleepImpl: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Error thrown by the REMAX API client after exhausting the retry budget. */
export class RemaxApiError extends Error {
  readonly endpoint: string;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(message: string, opts: { endpoint: string; status?: number; cause?: unknown }) {
    super(message);
    this.name = "RemaxApiError";
    this.endpoint = opts.endpoint;
    this.status = opts.status;
    this.cause = opts.cause;
  }
}

/**
 * Issue a GET against the REMAX CCA API with exponential-backoff retries
 * (`2s → 4s` between attempts, 3 attempts total per NFR17). Treats non-2xx,
 * non-JSON, and non-array bodies as failures. Each attempt is bounded by a
 * `FETCH_TIMEOUT_MS` AbortSignal so a hung connection cannot stall the sync.
 * Throws `RemaxApiError` after the final attempt.
 */
export async function fetchWithRetry(url: string): Promise<unknown> {
  let lastStatus: number | undefined;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    lastStatus = undefined;
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      lastStatus = response.status;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Response body is not valid JSON: ${(parseError as Error).message}`);
      }

      if (!Array.isArray(json)) {
        throw new Error("Response body is not a JSON array");
      }

      return json;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[attempt - 1];
        console.warn(
          `[remax-api] Attempt ${attempt} failed for ${url} (status=${lastStatus ?? "n/a"}); retrying in ${delay}ms`,
          error,
        );
        await sleepImpl(delay);
        continue;
      }
    }
  }

  throw new RemaxApiError(
    `REMAX API request failed after ${MAX_ATTEMPTS} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    { endpoint: url, status: lastStatus, cause: lastError },
  );
}

/** Fetch and parse properties for a single office GUID. */
export async function fetchPropertiesForOffice(
  officeGuid: string,
): Promise<FetchResult<RawProperty>> {
  const { baseUrl } = getRemaxConfig();
  const url = `${baseUrl}/PropertiesPerOffice/${officeGuid}`;
  const json = await fetchWithRetry(url);
  const result = parsePropertyArray(json);
  if (result.records.length === 0 && result.parseErrors.length === 0) {
    console.info(
      `[remax-api] No properties for office ${officeGuid} (steady-state for new office)`,
    );
  }
  return result;
}

/** Fetch and parse agents for a single office GUID. */
export async function fetchAgentsForOffice(officeGuid: string): Promise<FetchResult<RawAgent>> {
  const { baseUrl } = getRemaxConfig();
  const url = `${baseUrl}/AgentsPerOffice/${officeGuid}`;
  const json = await fetchWithRetry(url);
  const result = parseAgentArray(json);
  if (result.records.length === 0 && result.parseErrors.length === 0) {
    console.info(`[remax-api] No agents for office ${officeGuid} (steady-state for new office)`);
  }
  return result;
}

/**
 * Test-only hook to override the sleep implementation so retry-path specs
 * don't actually wait 14 seconds per run. Pass `null` to restore the default.
 */
export function __setSleepFnForTests(fn: SleepFn | null): void {
  sleepImpl = fn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
}
