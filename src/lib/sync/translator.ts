import "server-only";
import { Translator, TooManyRequestsError, ConnectionError } from "deepl-node";

// ---------------------------------------------------------------------------
// Lazy-initialized translator instance
// Required env vars:
//   DEEPL_API_KEY     - DeepL API key (required for translation calls)
//   DEEPL_GLOSSARY_ID - DeepL glossary ID for EN→ES legal/property terms (optional)
// The instance is keyed on the API key value so a config fix at runtime
// (e.g. the env var being populated after process start) is picked up — we do
// NOT cache a Translator built from an empty key.
// ---------------------------------------------------------------------------

let _translator: Translator | null = null;
let _translatorKey: string | null = null;

function getTranslator(): Translator {
  const apiKey = process.env.DEEPL_API_KEY ?? "";
  if (!_translator || _translatorKey !== apiKey) {
    _translator = new Translator(apiKey);
    _translatorKey = apiKey;
  }
  return _translator;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranslationResult {
  apiId: string;
  titleEs: string | null;
  descriptionEs: string | null;
  translated: boolean;
}

export interface TranslationError {
  apiId: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Retry constants (AC #5 — NFR19: exponential backoff on 429)
// ---------------------------------------------------------------------------

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

/**
 * Returns true when the error indicates a transient failure that should be
 * retried with exponential backoff (AC #5, NFR19).
 *
 * NOTE: DeepL distinguishes:
 *   - `TooManyRequestsError` (HTTP 429 — rate limit, transient)
 *   - `QuotaExceededError`   (billing-period quota exhausted — permanent until next cycle)
 *   - `ConnectionError`      (network/transport — has `shouldRetry` flag)
 *
 * Only the first two transient cases are retried here. `QuotaExceededError`
 * is intentionally NOT retried because retrying cannot resolve a billing-period
 * exhaustion within a single sync run.
 */
function isTransientDeepLError(err: unknown): boolean {
  if (err instanceof TooManyRequestsError) return true;
  if (err instanceof ConnectionError && err.shouldRetry) return true;
  return false;
}

/**
 * Calls `translator.translateText` with exponential backoff on transient
 * DeepL errors (rate-limit / connection). Re-throws non-transient errors
 * immediately so they are caught and isolated at the property level.
 */
async function translateWithRetry(
  text: string,
  options: Record<string, unknown> = {},
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await getTranslator().translateText(text, "en", "es", options);
      return result.text;
    } catch (err: unknown) {
      lastError = err;
      if (isTransientDeepLError(err)) {
        // Transient — apply exponential backoff before the next attempt
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        // Last attempt exhausted — fall through to throw lastError
        break;
      }
      // Non-transient (auth, quota, glossary-not-found, argument, …) —
      // surface immediately (isolated per listing, AC #6)
      throw err;
    }
  }

  // All retry attempts exhausted for transient errors
  throw lastError;
}

// ---------------------------------------------------------------------------
// Core translation function
// ---------------------------------------------------------------------------

/**
 * Translates a single property's title and description from EN → ES via DeepL.
 *
 * Preserve-existing rules (AC #2, #3, Risk R-003):
 *   - If `titleEs` is non-empty (after trim) → preserve, do NOT translate title.
 *   - If `publicRemarksEs` is non-empty (after trim) → preserve, do NOT translate description.
 *
 * Error isolation (AC #6):
 *   - On any DeepL error, returns `{ error: { apiId, message } }` instead of throwing.
 *   - Pipeline can continue with remaining listings.
 *
 * Glossary (AC #7, FR33):
 *   - Passes the `glossary` option (the key the deepl-node SDK expects) when
 *     `DEEPL_GLOSSARY_ID` env var is set.
 *   - Omits the option entirely when the env var is undefined.
 */
export async function translateProperty(raw: {
  apiId: string;
  titleEn: string;
  titleEs: string;
  publicRemarksEn: string | null;
  publicRemarksEs: string | null;
}): Promise<{ result: TranslationResult; error: TranslationError | null }> {
  const { apiId, titleEn, titleEs, publicRemarksEn, publicRemarksEs } = raw;

  // Build glossary options — omit `glossary` when env var is not set (AC #7).
  // The deepl-node SDK reads `options.glossary` (a GlossaryId string), not
  // `options.glossaryId` — using the wrong key silently disables the glossary.
  const glossaryId = process.env.DEEPL_GLOSSARY_ID;
  const options: { glossary?: string } = {};
  if (glossaryId) {
    options.glossary = glossaryId;
  }

  try {
    const needsTitleTranslation = !titleEs.trim() && Boolean(titleEn.trim());
    const needsDescTranslation = !publicRemarksEs?.trim() && Boolean(publicRemarksEn?.trim());

    // Determine final Spanish title
    let finalTitleEs = titleEs;
    if (needsTitleTranslation) {
      finalTitleEs = await translateWithRetry(titleEn, options);
    }

    // Determine final Spanish description.
    // Default: preserve existing API-provided value (or empty string when null).
    let finalDescriptionEs = publicRemarksEs ?? "";
    if (needsDescTranslation) {
      // Guarded by needsDescTranslation requiring non-empty publicRemarksEn.
      finalDescriptionEs = await translateWithRetry(publicRemarksEn as string, options);
    }

    const translated = needsTitleTranslation || needsDescTranslation;

    return {
      result: {
        apiId,
        titleEs: finalTitleEs,
        descriptionEs: finalDescriptionEs,
        translated,
      },
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      result: { apiId, titleEs: null, descriptionEs: null, translated: false },
      error: { apiId, message },
    };
  }
}

// ---------------------------------------------------------------------------
// Batch translation function
// ---------------------------------------------------------------------------

/**
 * Translates a batch of properties sequentially (NOT Promise.all) to avoid
 * DeepL rate-limit burst (Architecture §5, NFR15).
 *
 * Errors are isolated per listing — one failure does not stop the batch.
 */
export async function translateBatch(
  raws: Array<{
    apiId: string;
    titleEn: string;
    titleEs: string;
    publicRemarksEn: string | null;
    publicRemarksEs: string | null;
  }>,
): Promise<{ results: TranslationResult[]; errors: TranslationError[] }> {
  const results: TranslationResult[] = [];
  const errors: TranslationError[] = [];

  for (const raw of raws) {
    const { result, error } = await translateProperty(raw);
    if (error) {
      errors.push(error);
    }
    results.push(result);
  }

  return { results, errors };
}
