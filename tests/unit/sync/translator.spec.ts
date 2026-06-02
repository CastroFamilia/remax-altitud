/**
 * Story 2.5: Translation Pipeline — Unit Tests
 * Module: src/lib/sync/translator.ts
 *
 * Covers:
 *   AC #1 — new listing (empty titleEs/descriptionEs) → Google Translate called for both fields
 *   AC #2 — listing with API-provided titleEs → title NOT overwritten
 *   AC #3 — listing with API-provided descriptionEs → description NOT overwritten
 *   AC #5 — exponential backoff on HTTP 429 and transient errors:
 *           3 attempts, delays 2s/4s/8s. Non-transient errors are NOT retried.
 *   AC #6 — non-transient error → listing skipped, error returned, no crash
 *   AC #7 — glossary applied via post-processing (applyGlossary) for key terms
 *   AC #8/batch — translateBatch processes all inputs and returns results + errors arrays
 *   Idempotency — property with non-empty titleEs AND descriptionEs → translated:false, no API call
 *
 * translateBatch contract: ALL input items appear in result.results (including errored ones
 * with translated:false). Callers must filter by translated:true to get successful-only entries.
 * Errors also appear in result.errors with apiId and message fields.
 *
 * The translator now uses the Google Translate free API via fetch() instead of deepl-node.
 * All external I/O is mocked via globalThis.fetch — no real API calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock fetch — the translator uses fetch() to call Google Translate
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are set up
// ---------------------------------------------------------------------------

import { translateProperty, translateBatch } from "@/lib/sync/translator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a mock Response simulating Google Translate API success. */
function makeGoogleTranslateResponse(translatedText: string): Response {
  // Google Translate returns: [[[translatedText, sourceText, ...]]]
  const body = JSON.stringify([[[translatedText, "source text"]]]);
  return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
}

/** Creates a mock Response with a given HTTP status (for error simulation). */
function makeErrorResponse(status: number, statusText = "Error"): Response {
  return new Response(null, { status, statusText });
}

/** Track how many times fetch was called (for retry assertions). */
function fetchCallCount(): number {
  return mockFetch.mock.calls.length;
}

// ---------------------------------------------------------------------------
// Env setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Replace global fetch with our mock
  globalThis.fetch = mockFetch;
  // Default: successful translation response
  mockFetch.mockResolvedValue(makeGoogleTranslateResponse("Texto traducido"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #1 — New listing: empty titleEs and publicRemarksEs → API called for both
// ---------------------------------------------------------------------------

describe("translateProperty — new listing (AC #1)", () => {
  it(
    "[P0] given titleEs='' and publicRemarksEs='' when translateProperty called then fetch is called for title AND description",
    async () => {
      // AC #1 — brand-new listing with no Spanish content from API
      mockFetch
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Terreno con vista al mar"))
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Un buen terreno de 1 hectárea."));

      const result = await translateProperty({
        apiId: "API-001",
        titleEn: "Mountain View Land",
        titleEs: "",
        publicRemarksEn: "A great land parcel of 1 hectare.",
        publicRemarksEs: "",
      });

      expect(result.error).toBeNull();
      expect(result.result.translated).toBe(true);
      // Both title and description must have been translated
      expect(fetchCallCount()).toBe(2);
      expect(result.result.titleEs).toBe("Terreno con vista al mar");
      expect(result.result.descriptionEs).toBe("Un buen terreno de 1 hectárea.");
    },
  );

  it(
    "[P0] given titleEs='' when called then result.titleEs contains the translated titleEn",
    async () => {
      mockFetch.mockResolvedValueOnce(makeGoogleTranslateResponse("Terreno con vista"));

      const result = await translateProperty({
        apiId: "API-001",
        titleEn: "Mountain View Land",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      expect(result.error).toBeNull();
      expect(result.result.titleEs).toBe("Terreno con vista");
    },
  );

  it(
    "[P1] given publicRemarksEn=null and publicRemarksEs='' when called then fetch NOT called for description and descriptionEs is empty string",
    async () => {
      // Nothing to translate for description — source text is null
      mockFetch.mockResolvedValueOnce(makeGoogleTranslateResponse("Título traducido"));

      const result = await translateProperty({
        apiId: "API-001",
        titleEn: "House",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: "",
      });

      expect(result.error).toBeNull();
      // fetch called only once (for title), not for description
      expect(fetchCallCount()).toBe(1);
      expect(result.result.descriptionEs).toBe("");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #2 — API-provided titleEs: title preserved, NOT overwritten
// ---------------------------------------------------------------------------

describe("translateProperty — preserve API-provided titleEs (AC #2)", () => {
  it(
    "[P0] given titleEs='Casa en la montaña' (non-empty) when translateProperty called then fetch NOT called for title",
    async () => {
      // AC #2 — API already supplied a Spanish title; must not overwrite it
      mockFetch.mockResolvedValueOnce(makeGoogleTranslateResponse("Descripción traducida"));

      const result = await translateProperty({
        apiId: "API-002",
        titleEn: "House in the Mountain",
        titleEs: "Casa en la montaña",
        publicRemarksEn: "Beautiful mountain retreat.",
        publicRemarksEs: "",
      });

      expect(result.error).toBeNull();
      // fetch called only once — for description (title is preserved)
      expect(fetchCallCount()).toBe(1);
      // Title is the original API-provided value
      expect(result.result.titleEs).toBe("Casa en la montaña");
    },
  );

  it(
    "[P0] given titleEs='Casa en la montaña' when called then result.result.titleEs equals the original API value",
    async () => {
      mockFetch.mockResolvedValueOnce(makeGoogleTranslateResponse("Descripción"));

      const result = await translateProperty({
        apiId: "API-002",
        titleEn: "House",
        titleEs: "Casa en la montaña",
        publicRemarksEn: "Nice house.",
        publicRemarksEs: "",
      });

      expect(result.result.titleEs).toBe("Casa en la montaña");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #3 — API-provided publicRemarksEs: description preserved, NOT overwritten
// ---------------------------------------------------------------------------

describe("translateProperty — preserve API-provided publicRemarksEs (AC #3)", () => {
  it(
    "[P0] given publicRemarksEs='Descripción existente.' (non-empty) when translateProperty called then fetch NOT called for description",
    async () => {
      // AC #3 — API already supplied a Spanish description; must not overwrite it
      mockFetch.mockResolvedValueOnce(makeGoogleTranslateResponse("Título traducido"));

      const result = await translateProperty({
        apiId: "API-003",
        titleEn: "Beachfront Lot",
        titleEs: "",
        publicRemarksEn: "Stunning ocean views.",
        publicRemarksEs: "Descripción existente.",
      });

      expect(result.error).toBeNull();
      // fetch called only once — for title (description is preserved)
      expect(fetchCallCount()).toBe(1);
      expect(result.result.descriptionEs).toBe("Descripción existente.");
    },
  );

  it(
    "[P0] given both titleEs and publicRemarksEs non-empty when called then fetch NOT called at all and translated=false",
    async () => {
      // Idempotency: both fields already have API-provided Spanish — zero API calls
      const result = await translateProperty({
        apiId: "API-004",
        titleEn: "Furnished Apartment",
        titleEs: "Apartamento amoblado",
        publicRemarksEn: "Great location.",
        publicRemarksEs: "Excelente ubicación.",
      });

      expect(result.error).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.result.translated).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #5 — Exponential backoff on transient errors (HTTP 429 + connection)
// ---------------------------------------------------------------------------

describe("translateProperty — exponential backoff on HTTP 429 (AC #5)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(
    "[P0] given fetch returns 429 twice then succeeds on 3rd attempt when called then translateProperty resolves successfully",
    async () => {
      // AC #5 — retry 3 times with 2s/4s/8s backoff on 429 rate limits
      mockFetch
        .mockResolvedValueOnce(makeErrorResponse(429, "Too Many Requests")) // attempt 1: 429
        .mockResolvedValueOnce(makeErrorResponse(429, "Too Many Requests")) // attempt 2: 429
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Terreno traducido")); // attempt 3: success

      const promise = translateProperty({
        apiId: "API-005",
        titleEn: "Land for Sale",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      // Advance timers to skip the exponential backoff delays
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result.error).toBeNull();
      expect(result.result.translated).toBe(true);
      expect(result.result.titleEs).toBe("Terreno traducido");
      // fetch must have been called exactly 3 times (2 retries + 1 success)
      expect(fetchCallCount()).toBe(3);
    },
  );

  it(
    "[P0] given fetch returns 429 on all 3 attempts when called then translateProperty returns error without crashing",
    async () => {
      // All 3 attempts exhausted — should return error, not throw
      mockFetch.mockResolvedValue(makeErrorResponse(429, "Too Many Requests"));

      const promise = translateProperty({
        apiId: "API-005",
        titleEn: "Land for Sale",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      // Advance timers to skip the exponential backoff delays
      await vi.runAllTimersAsync();

      const result = await promise;

      // Should return an error, not throw
      expect(result.error).not.toBeNull();
      expect(result.error?.apiId).toBe("API-005");
      expect(result.result.translated).toBe(false);
    },
  );

  it(
    "[P1] given fetch throws a non-retryable error when called then translateProperty does NOT retry",
    async () => {
      // Non-transient errors should fail immediately without retrying
      mockFetch.mockRejectedValue(new Error("Unexpected parsing failure"));

      const promise = translateProperty({
        apiId: "API-005-Q",
        titleEn: "Land",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.error).not.toBeNull();
      expect(result.result.translated).toBe(false);
      // Non-transient error — should throw on first attempt, caught by outer try/catch
      expect(fetchCallCount()).toBe(1);
    },
  );

  it(
    "[P1] given fetch throws a connection error then succeeds when called then translateProperty retries with backoff",
    async () => {
      // Transient connection errors (ECONNREFUSED, etc.) are retried
      mockFetch
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Recuperado"));

      const promise = translateProperty({
        apiId: "API-005-C",
        titleEn: "Land",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.error).toBeNull();
      expect(result.result.titleEs).toBe("Recuperado");
      expect(fetchCallCount()).toBe(2);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — Non-transient error: listing skipped, error returned, pipeline continues
// ---------------------------------------------------------------------------

describe("translateProperty — non-transient error isolation (AC #6)", () => {
  it(
    "[P0] given fetch throws a non-transient Error when called then translateProperty returns error object without throwing",
    async () => {
      // AC #6 — non-transient errors are isolated per listing; pipeline must continue
      const unexpectedErr = new Error("Unexpected JSON parse error");
      mockFetch.mockRejectedValue(unexpectedErr);

      const result = await translateProperty({
        apiId: "API-006",
        titleEn: "Commercial Space",
        titleEs: "",
        publicRemarksEn: "Office for rent.",
        publicRemarksEs: "",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.apiId).toBe("API-006");
      expect(result.error?.message).toContain("Unexpected JSON parse error");
      expect(result.result.translated).toBe(false);
      expect(result.result.titleEs).toBeNull();
      expect(result.result.descriptionEs).toBeNull();
    },
  );

  it(
    "[P1] given fetch throws a non-transient Error when called then the error is NOT re-thrown (no crash)",
    async () => {
      const unexpectedErr = new Error("Unexpected server error");
      mockFetch.mockRejectedValue(unexpectedErr);

      // Must resolve (not reject) so the pipeline continues
      await expect(
        translateProperty({
          apiId: "API-006",
          titleEn: "Shop",
          titleEs: "",
          publicRemarksEn: "Nice shop.",
          publicRemarksEs: "",
        }),
      ).resolves.toBeDefined();
    },
  );
});

// ---------------------------------------------------------------------------
// AC #7 — Glossary applied via post-processing (applyGlossary)
// ---------------------------------------------------------------------------

describe("translateProperty — glossary post-processing (AC #7)", () => {
  it(
    "[P0] given Google Translate returns 'Fee Simple' untranslated when called then applyGlossary converts it to 'Pleno Dominio'",
    async () => {
      // The glossary post-processor catches terms Google Translate may leave untranslated
      mockFetch.mockResolvedValue(
        makeGoogleTranslateResponse("Propiedad Fee Simple en venta"),
      );

      const result = await translateProperty({
        apiId: "API-007",
        titleEn: "Fee Simple Property for sale",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      // applyGlossary should convert "Fee Simple" → "Pleno Dominio"
      expect(result.result.titleEs).toContain("Pleno Dominio");
    },
  );

  it(
    "[P0] given Google Translate returns 'Titled Property' when called then applyGlossary converts it to 'Propiedad Titulada'",
    async () => {
      mockFetch.mockResolvedValue(
        makeGoogleTranslateResponse("Titled Property en la costa"),
      );

      const result = await translateProperty({
        apiId: "API-007",
        titleEn: "Titled Property on the coast",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      expect(result.result.titleEs).toContain("Propiedad Titulada");
    },
  );

  it(
    "[P1] given DEEPL_GLOSSARY_ID set when translating 'Titled Property' then result includes glossary-translated term",
    async () => {
      // Even with the old DEEPL env var set, the Google Translate path still applies glossary
      process.env.DEEPL_GLOSSARY_ID = "test-glossary-id";
      mockFetch.mockResolvedValueOnce(
        makeGoogleTranslateResponse("Titled Property"),
      );

      const result = await translateProperty({
        apiId: "API-007",
        titleEn: "Titled Property",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      expect(result.result.titleEs).toBe("Propiedad Titulada");
      delete process.env.DEEPL_GLOSSARY_ID;
    },
  );
});

// ---------------------------------------------------------------------------
// AC #8/batch — translateBatch processes multiple properties sequentially
// ---------------------------------------------------------------------------

describe("translateBatch — batch processing (AC #8)", () => {
  it(
    "[P0] given 2 properties with empty Spanish fields when translateBatch called then fetch is called for each and results array has 2 entries",
    async () => {
      // AC #8 — batch mode: processes all inputs, returns results and errors
      mockFetch
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Título 1"))
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Descripción 1"))
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Título 2"))
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Descripción 2"));

      const result = await translateBatch([
        {
          apiId: "BATCH-001",
          titleEn: "Title One",
          titleEs: "",
          publicRemarksEn: "Description One",
          publicRemarksEs: "",
        },
        {
          apiId: "BATCH-002",
          titleEn: "Title Two",
          titleEs: "",
          publicRemarksEn: "Description Two",
          publicRemarksEs: "",
        },
      ]);

      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.results[0].apiId).toBe("BATCH-001");
      expect(result.results[1].apiId).toBe("BATCH-002");
    },
  );

  it(
    "[P0] given one property fails and one succeeds when translateBatch called then errors has 1 entry and 1 successful result",
    async () => {
      // AC #6 at batch level — error isolation: one failure must not block others
      mockFetch
        .mockRejectedValueOnce(new Error("Timeout for BATCH-001")) // BATCH-001 title fails
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Título 2")) // BATCH-002 title succeeds
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Descripción 2")); // BATCH-002 description succeeds

      const result = await translateBatch([
        {
          apiId: "BATCH-001",
          titleEn: "First Property",
          titleEs: "",
          publicRemarksEn: "First description.",
          publicRemarksEs: "",
        },
        {
          apiId: "BATCH-002",
          titleEn: "Second Property",
          titleEs: "",
          publicRemarksEn: "Second description.",
          publicRemarksEs: "",
        },
      ]);

      // Both properties appear in results — BATCH-001 with translated:false, BATCH-002 with translated:true
      expect(result.results).toHaveLength(2);
      const successResults = result.results.filter((r) => r.translated);
      const errorResults = result.errors;
      // Only BATCH-002 was successfully translated
      expect(successResults).toHaveLength(1);
      expect(successResults[0].apiId).toBe("BATCH-002");
      // BATCH-001 reported in errors array
      expect(errorResults).toHaveLength(1);
      expect(errorResults[0].apiId).toBe("BATCH-001");
    },
  );

  it(
    "[P1] given empty array when translateBatch called then returns empty results and errors arrays without calling fetch",
    async () => {
      const result = await translateBatch([]);

      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  it(
    "[P1] given 2 properties when translateBatch called then they are processed sequentially (not Promise.all)",
    async () => {
      // NFR: sequential processing avoids rate-limit burst — verify call order
      const callOrder: string[] = [];
      mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
        const body = init?.body?.toString() ?? "";
        // Extract the 'q' parameter value from URL-encoded body
        const params = new URLSearchParams(body);
        const text = params.get("q") ?? "";
        callOrder.push(text);
        return makeGoogleTranslateResponse("Traducción");
      });

      await translateBatch([
        {
          apiId: "SEQ-001",
          titleEn: "First",
          titleEs: "",
          publicRemarksEn: null,
          publicRemarksEs: null,
        },
        {
          apiId: "SEQ-002",
          titleEn: "Second",
          titleEs: "",
          publicRemarksEn: null,
          publicRemarksEs: null,
        },
      ]);

      // Both texts must have been translated (sequential = same order as input)
      expect(callOrder[0]).toBe("First");
      expect(callOrder[1]).toBe("Second");
    },
  );
});

// ---------------------------------------------------------------------------
// Idempotency — property with non-empty titleEs AND publicRemarksEs
// ---------------------------------------------------------------------------

describe("translateProperty — idempotency (both fields already have Spanish)", () => {
  it(
    "[P0] given both titleEs and publicRemarksEs non-empty when translateProperty called then returns translated:false and fetch is never called",
    async () => {
      // Idempotency: if both fields are already populated, zero API calls must happen
      const result = await translateProperty({
        apiId: "API-IDEM",
        titleEn: "Furnished Apartment",
        titleEs: "Apartamento amoblado",
        publicRemarksEn: "Great location.",
        publicRemarksEs: "Excelente ubicación.",
      });

      expect(result.error).toBeNull();
      expect(result.result.translated).toBe(false);
      expect(result.result.titleEs).toBe("Apartamento amoblado");
      expect(result.result.descriptionEs).toBe("Excelente ubicación.");
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// TranslationResult shape validation
// ---------------------------------------------------------------------------

describe("translateProperty — result shape", () => {
  it(
    "[P1] given successful translation when called then result has apiId, titleEs, descriptionEs, and translated fields",
    async () => {
      mockFetch
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Título ES"))
        .mockResolvedValueOnce(makeGoogleTranslateResponse("Descripción ES"));

      const result = await translateProperty({
        apiId: "API-SHAPE",
        titleEn: "Title",
        titleEs: "",
        publicRemarksEn: "Description",
        publicRemarksEs: "",
      });

      expect(result.result).toMatchObject({
        apiId: "API-SHAPE",
        titleEs: expect.any(String),
        descriptionEs: expect.any(String),
        translated: expect.any(Boolean),
      });
      expect(result.error).toBeNull();
    },
  );

  it(
    "[P1] given fetch throws an error when called then error has apiId and message fields",
    async () => {
      mockFetch.mockRejectedValue(new Error("API failure"));

      const result = await translateProperty({
        apiId: "API-ERR",
        titleEn: "Title",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      expect(result.error).toMatchObject({
        apiId: "API-ERR",
        message: expect.any(String),
      });
      expect(result.result).toMatchObject({
        apiId: "API-ERR",
        titleEs: null,
        descriptionEs: null,
        translated: false,
      });
    },
  );
});
