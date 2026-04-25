/**
 * Story 2.5: Translation Pipeline — Unit Tests
 * Module: src/lib/sync/translator.ts
 *
 * Covers:
 *   AC #1 — new listing (empty titleEs/descriptionEs) → DeepL called for both fields
 *   AC #2 — listing with API-provided titleEs → title NOT overwritten (DeepL not called for title)
 *   AC #3 — listing with API-provided descriptionEs → description NOT overwritten
 *   AC #5 — exponential backoff on HTTP 429 (TooManyRequestsError) and transient
 *           ConnectionError: 3 attempts, delays 2s/4s/8s. QuotaExceededError
 *           (billing-period exhaustion) is intentionally NOT retried.
 *   AC #6 — non-transient DeepL error → listing skipped, error returned, no crash
 *   AC #7 — glossary applied (via `options.glossary` — the deepl-node SDK key)
 *           when DEEPL_GLOSSARY_ID is set; omitted when not set
 *   AC #8/batch — translateBatch processes all inputs and returns results + errors arrays
 *   Idempotency — property with non-empty titleEs AND descriptionEs → translated:false, no DeepL call
 *
 * translateBatch contract: ALL input items appear in result.results (including errored ones
 * with translated:false). Callers must filter by translated:true to get successful-only entries.
 * Errors also appear in result.errors with apiId and message fields.
 *
 * All external I/O is mocked — no real DeepL API calls.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock primitives — vi.hoisted() ensures availability when vi.mock()
// factory runs (hoisted to top of compiled output).
// ---------------------------------------------------------------------------

const {
  mockTranslateText,
  MockTranslator,
  MockTooManyRequestsError,
  MockQuotaExceededError,
  MockConnectionError,
} = vi.hoisted(() => {
  const mockTranslateText = vi.fn();

  class MockDeepLError extends Error {
    error?: Error;
  }

  class MockTooManyRequestsError extends MockDeepLError {
    constructor(message = "Too many requests") {
      super(message);
      this.name = "TooManyRequestsError";
    }
  }

  class MockQuotaExceededError extends MockDeepLError {
    constructor(message = "Quota exceeded") {
      super(message);
      this.name = "QuotaExceededError";
    }
  }

  class MockConnectionError extends MockDeepLError {
    shouldRetry: boolean;
    constructor(message = "Connection error", shouldRetry = true) {
      super(message);
      this.name = "ConnectionError";
      this.shouldRetry = shouldRetry;
    }
  }

  class MockTranslator {
    translateText = mockTranslateText;
  }

  return {
    mockTranslateText,
    MockTranslator,
    MockTooManyRequestsError,
    MockQuotaExceededError,
    MockConnectionError,
  };
});

// ---------------------------------------------------------------------------
// Mock deepl-node before any module under test is imported
// ---------------------------------------------------------------------------

vi.mock("deepl-node", () => ({
  Translator: MockTranslator,
  TooManyRequestsError: MockTooManyRequestsError,
  QuotaExceededError: MockQuotaExceededError,
  ConnectionError: MockConnectionError,
}));

// ---------------------------------------------------------------------------
// Imports — resolved after mocks are hoisted
// ---------------------------------------------------------------------------

import { translateProperty, translateBatch } from "@/lib/sync/translator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default mock return value for a successful DeepL translation call. */
function makeDeepLResult(text: string) {
  return { text };
}

// ---------------------------------------------------------------------------
// Env setup / teardown
// ---------------------------------------------------------------------------

const ENV_KEYS = ["DEEPL_API_KEY", "DEEPL_GLOSSARY_ID"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.DEEPL_API_KEY = "test-deepl-api-key";
  delete process.env.DEEPL_GLOSSARY_ID; // default: no glossary set

  vi.clearAllMocks();

  // Default: successful translation response
  mockTranslateText.mockResolvedValue(makeDeepLResult("Texto traducido"));
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// AC #1 — New listing: empty titleEs and publicRemarksEs → DeepL called for both
// ---------------------------------------------------------------------------

describe("translateProperty — new listing (AC #1)", () => {
  it(
    "[P0] given titleEs='' and publicRemarksEs='' when translateProperty called then translateText is called for title AND description",
    async () => {
      // AC #1 — brand-new listing with no Spanish content from API
      // Risk R-003: translation must not skip fields that need translation
      mockTranslateText
        .mockResolvedValueOnce(makeDeepLResult("Terreno con vista al mar"))
        .mockResolvedValueOnce(makeDeepLResult("Un buen terreno de 1 hectárea."));

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
      expect(mockTranslateText).toHaveBeenCalledTimes(2);
      expect(result.result.titleEs).toBe("Terreno con vista al mar");
      expect(result.result.descriptionEs).toBe("Un buen terreno de 1 hectárea.");
    },
  );

  it(
    "[P0] given titleEs='' when called then result.titleEs contains the DeepL translation of titleEn",
    async () => {
      mockTranslateText.mockResolvedValueOnce(makeDeepLResult("Terreno con vista"));

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
    "[P1] given publicRemarksEn=null and publicRemarksEs='' when called then translateText NOT called for description and descriptionEs is empty string",
    async () => {
      // Nothing to translate for description — source text is null
      mockTranslateText.mockResolvedValueOnce(makeDeepLResult("Título traducido"));

      const result = await translateProperty({
        apiId: "API-001",
        titleEn: "House",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: "",
      });

      expect(result.error).toBeNull();
      // translateText called only once (for title), not for description
      expect(mockTranslateText).toHaveBeenCalledTimes(1);
      expect(result.result.descriptionEs).toBe("");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #2 — API-provided titleEs: title preserved, NOT overwritten
// ---------------------------------------------------------------------------

describe("translateProperty — preserve API-provided titleEs (AC #2)", () => {
  it(
    "[P0] given titleEs='Casa en la montaña' (non-empty) when translateProperty called then translateText NOT called for title",
    async () => {
      // AC #2 — API already supplied a Spanish title; DeepL must not overwrite it
      // Risk R-003: preserve API-provided Spanish content
      mockTranslateText.mockResolvedValueOnce(makeDeepLResult("Descripción traducida"));

      const result = await translateProperty({
        apiId: "API-002",
        titleEn: "House in the Mountain",
        titleEs: "Casa en la montaña",
        publicRemarksEn: "Beautiful mountain retreat.",
        publicRemarksEs: "",
      });

      expect(result.error).toBeNull();
      // translateText called only once — for description (title is preserved)
      expect(mockTranslateText).toHaveBeenCalledTimes(1);
      // Title is the original API-provided value
      expect(result.result.titleEs).toBe("Casa en la montaña");
    },
  );

  it(
    "[P0] given titleEs='Casa en la montaña' when called then result.result.titleEs equals the original API value",
    async () => {
      mockTranslateText.mockResolvedValueOnce(makeDeepLResult("Descripción"));

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
    "[P0] given publicRemarksEs='Descripción existente.' (non-empty) when translateProperty called then translateText NOT called for description",
    async () => {
      // AC #3 — API already supplied a Spanish description; DeepL must not overwrite it
      // Risk R-003: preserve API-provided Spanish content even if EN differs
      mockTranslateText.mockResolvedValueOnce(makeDeepLResult("Título traducido"));

      const result = await translateProperty({
        apiId: "API-003",
        titleEn: "Beachfront Lot",
        titleEs: "",
        publicRemarksEn: "Stunning ocean views.",
        publicRemarksEs: "Descripción existente.",
      });

      expect(result.error).toBeNull();
      // translateText called only once — for title (description is preserved)
      expect(mockTranslateText).toHaveBeenCalledTimes(1);
      expect(result.result.descriptionEs).toBe("Descripción existente.");
    },
  );

  it(
    "[P0] given both titleEs and publicRemarksEs non-empty when called then translateText NOT called at all and translated=false",
    async () => {
      // Idempotency: both fields already have API-provided Spanish — zero DeepL calls
      const result = await translateProperty({
        apiId: "API-004",
        titleEn: "Furnished Apartment",
        titleEs: "Apartamento amoblado",
        publicRemarksEn: "Great location.",
        publicRemarksEs: "Excelente ubicación.",
      });

      expect(result.error).toBeNull();
      expect(mockTranslateText).not.toHaveBeenCalled();
      expect(result.result.translated).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #5 — Exponential backoff on transient errors (HTTP 429 rate limit + connection)
//
// NOTE: DeepL distinguishes `TooManyRequestsError` (HTTP 429 — rate limit, transient,
// retried) from `QuotaExceededError` (billing-period quota exhausted, NOT retried).
// Earlier ATDD tests retried on QuotaExceededError; that was the wrong error class.
// ---------------------------------------------------------------------------

describe("translateProperty — exponential backoff on HTTP 429 (AC #5)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(
    "[P0] given translateText throws TooManyRequestsError twice then succeeds on 3rd attempt when called then translateProperty resolves successfully",
    async () => {
      // AC #5 — NFR19: retry 3 times with 2s/4s/8s backoff on 429 rate limits
      const rateErr = new MockTooManyRequestsError();
      mockTranslateText
        .mockRejectedValueOnce(rateErr) // attempt 1: 429
        .mockRejectedValueOnce(rateErr) // attempt 2: 429
        .mockResolvedValueOnce(makeDeepLResult("Terreno traducido")); // attempt 3: success

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
      // translateText must have been called exactly 3 times (2 retries + 1 success)
      expect(mockTranslateText).toHaveBeenCalledTimes(3);
    },
  );

  it(
    "[P0] given translateText throws TooManyRequestsError on all 3 attempts when called then translateProperty returns error without crashing",
    async () => {
      // All 3 attempts exhausted — should return error, not throw
      const rateErr = new MockTooManyRequestsError("Rate limited after 3 attempts");
      mockTranslateText.mockRejectedValue(rateErr);

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
    "[P1] given translateText throws QuotaExceededError when called then translateProperty does NOT retry (billing-period quota is permanent within a sync run)",
    async () => {
      // QuotaExceededError indicates the monthly billing quota has been exhausted —
      // retrying within the same sync run cannot resolve it. Only one attempt is made.
      const quotaErr = new MockQuotaExceededError();
      mockTranslateText.mockRejectedValue(quotaErr);

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
      // No retries — single attempt only
      expect(mockTranslateText).toHaveBeenCalledTimes(1);
    },
  );

  it(
    "[P1] given translateText throws ConnectionError with shouldRetry=true when called then translateProperty retries with backoff",
    async () => {
      // Transient connection errors are retried per the deepl-node SDK's shouldRetry flag.
      const connErr = new MockConnectionError("ECONNRESET", true);
      mockTranslateText
        .mockRejectedValueOnce(connErr)
        .mockResolvedValueOnce(makeDeepLResult("Recuperado"));

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
      expect(mockTranslateText).toHaveBeenCalledTimes(2);
    },
  );
});

// ---------------------------------------------------------------------------
// AC #6 — Non-429 error: listing skipped, error returned, pipeline continues
// ---------------------------------------------------------------------------

describe("translateProperty — non-429 DeepL error isolation (AC #6)", () => {
  it(
    "[P0] given translateText throws a non-429 Error when called then translateProperty returns error object without throwing",
    async () => {
      // AC #6 — non-429 errors are isolated per listing; pipeline must continue
      const networkErr = new Error("ECONNREFUSED — DeepL unreachable");
      mockTranslateText.mockRejectedValue(networkErr);

      const result = await translateProperty({
        apiId: "API-006",
        titleEn: "Commercial Space",
        titleEs: "",
        publicRemarksEn: "Office for rent.",
        publicRemarksEs: "",
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.apiId).toBe("API-006");
      expect(result.error?.message).toContain("ECONNREFUSED");
      expect(result.result.translated).toBe(false);
      expect(result.result.titleEs).toBeNull();
      expect(result.result.descriptionEs).toBeNull();
    },
  );

  it(
    "[P1] given translateText throws a non-429 Error when called then the error is NOT re-thrown (no crash)",
    async () => {
      const unexpectedErr = new Error("Unexpected DeepL server error");
      mockTranslateText.mockRejectedValue(unexpectedErr);

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
// AC #7 — Glossary applied when DEEPL_GLOSSARY_ID env var is set
// ---------------------------------------------------------------------------

describe("translateProperty — DeepL glossary integration (AC #7)", () => {
  it(
    "[P0] given DEEPL_GLOSSARY_ID='test-glossary-id' when translateProperty called then translateText receives the `glossary` option (the key the deepl-node SDK consumes)",
    async () => {
      // AC #7 — FR33: legal/property terms must use the glossary for consistency.
      // The deepl-node SDK reads `options.glossary` (not `options.glossaryId`);
      // using the wrong key silently disables the glossary in production.
      process.env.DEEPL_GLOSSARY_ID = "test-glossary-id";
      mockTranslateText.mockResolvedValue(makeDeepLResult("Propiedad Titulada en venta"));

      await translateProperty({
        apiId: "API-007",
        titleEn: "Titled Property for sale",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      expect(mockTranslateText).toHaveBeenCalledWith(
        expect.any(String), // source text
        "en",               // source language
        "es",               // target language
        expect.objectContaining({ glossary: "test-glossary-id" }),
      );
      // Defensive — ensure we are not also passing the legacy/wrong key
      const callArgs = mockTranslateText.mock.calls[0];
      expect(callArgs[3]).not.toHaveProperty("glossaryId");
    },
  );

  it(
    "[P0] given DEEPL_GLOSSARY_ID is NOT set when translateProperty called then translateText is called WITHOUT a glossary option",
    async () => {
      // No glossary env var — `glossary` must be omitted (not passed as undefined)
      delete process.env.DEEPL_GLOSSARY_ID;
      mockTranslateText.mockResolvedValue(makeDeepLResult("Terreno en venta"));

      await translateProperty({
        apiId: "API-007",
        titleEn: "Land for Sale",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      const callArgs = mockTranslateText.mock.calls[0];
      // The options object (4th arg) must not contain a glossary key if env var is unset
      if (callArgs[3]) {
        expect(callArgs[3]).not.toHaveProperty("glossary");
        expect(callArgs[3]).not.toHaveProperty("glossaryId");
      }
    },
  );

  it(
    "[P1] given DEEPL_GLOSSARY_ID set when translating 'Titled Property' then result includes glossary-translated term",
    async () => {
      process.env.DEEPL_GLOSSARY_ID = "test-glossary-id";
      // Simulate DeepL returning the glossary-enforced translation
      mockTranslateText.mockResolvedValueOnce(makeDeepLResult("Propiedad Titulada"));

      const result = await translateProperty({
        apiId: "API-007",
        titleEn: "Titled Property",
        titleEs: "",
        publicRemarksEn: null,
        publicRemarksEs: null,
      });

      expect(result.result.titleEs).toBe("Propiedad Titulada");
    },
  );
});

// ---------------------------------------------------------------------------
// AC #8/batch — translateBatch processes multiple properties sequentially
// ---------------------------------------------------------------------------

describe("translateBatch — batch processing (AC #8)", () => {
  it(
    "[P0] given 2 properties with empty Spanish fields when translateBatch called then translateText is called for each and results array has 2 entries",
    async () => {
      // AC #8 — batch mode: processes all inputs, returns results and errors
      mockTranslateText
        .mockResolvedValueOnce(makeDeepLResult("Título 1"))
        .mockResolvedValueOnce(makeDeepLResult("Descripción 1"))
        .mockResolvedValueOnce(makeDeepLResult("Título 2"))
        .mockResolvedValueOnce(makeDeepLResult("Descripción 2"));

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
      // AC #6 at batch level — error isolation: one failure must not block others.
      // Design note: translateBatch always returns ALL processed items in results (both
      // successful and errored, with translated:false for errors). Callers must filter
      // result.results by translated:true to get successful-only entries.
      const networkErr = new Error("DeepL timeout for BATCH-001");
      mockTranslateText
        .mockRejectedValueOnce(networkErr) // BATCH-001 title fails
        .mockResolvedValueOnce(makeDeepLResult("Título 2")) // BATCH-002 title succeeds
        .mockResolvedValueOnce(makeDeepLResult("Descripción 2")); // BATCH-002 description succeeds

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
    "[P1] given empty array when translateBatch called then returns empty results and errors arrays without calling translateText",
    async () => {
      const result = await translateBatch([]);

      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(mockTranslateText).not.toHaveBeenCalled();
    },
  );

  it(
    "[P1] given 2 properties when translateBatch called then they are processed sequentially (not Promise.all)",
    async () => {
      // NFR: sequential processing avoids rate-limit burst — verify call order
      const callOrder: string[] = [];
      mockTranslateText.mockImplementation(async (text: string) => {
        callOrder.push(text as string);
        return makeDeepLResult("Traducción");
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
    "[P0] given both titleEs and publicRemarksEs non-empty when translateProperty called then returns translated:false and translateText is never called",
    async () => {
      // Idempotency: if both fields are already populated, zero DeepL calls must happen
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
      expect(mockTranslateText).not.toHaveBeenCalled();
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
      mockTranslateText
        .mockResolvedValueOnce(makeDeepLResult("Título ES"))
        .mockResolvedValueOnce(makeDeepLResult("Descripción ES"));

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
    "[P1] given translateText throws an error when called then error has apiId and message fields",
    async () => {
      mockTranslateText.mockRejectedValue(new Error("API failure"));

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
