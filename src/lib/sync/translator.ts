import "server-only";
import { Translator, QuotaExceededError } from "deepl-node";

// ---------------------------------------------------------------------------
// Lazy-initialized translator instance
// Required env vars:
//   DEEPL_API_KEY     - DeepL API key (required for translation calls)
//   DEEPL_GLOSSARY_ID - DeepL glossary ID for EN→ES legal/property terms (optional)
// ---------------------------------------------------------------------------

let _translator: Translator | null = null;

function getTranslator(): Translator {
  if (!_translator) {
    _translator = new Translator(process.env.DEEPL_API_KEY ?? "");
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
 * Calls `translator.translateText` with exponential backoff on 429 (QuotaExceededException).
 * Re-throws non-429 errors immediately so they are caught and isolated at the property level.
 */
async function translateWithRetry(
  text: string,
  options: Record<string, string> = {},
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await getTranslator().translateText(text, "en", "es", options);
      return result.text;
    } catch (err: unknown) {
      lastError = err;
      if (err instanceof QuotaExceededError) {
        // 429 — apply exponential backoff before next attempt
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
        }
        // On last attempt, fall through to throw
        continue;
      }
      // Non-429 error — surface immediately (isolated per listing, AC #6)
      throw err;
    }
  }

  // All retry attempts exhausted for 429
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
 *   - Passes `glossaryId` option when `DEEPL_GLOSSARY_ID` env var is set.
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

  // Build glossary options — omit glossaryId when env var is not set (AC #7)
  const glossaryId = process.env.DEEPL_GLOSSARY_ID;
  const options: Record<string, string> = {};
  if (glossaryId) {
    options.glossaryId = glossaryId;
  }

  try {
    const needsTitleTranslation = !titleEs.trim();
    const needsDescTranslation = !publicRemarksEs?.trim() && Boolean(publicRemarksEn?.trim());

    // Determine final Spanish title
    let finalTitleEs = titleEs;
    if (needsTitleTranslation) {
      finalTitleEs = await translateWithRetry(titleEn, options);
    }

    // Determine final Spanish description
    let finalDescriptionEs = publicRemarksEs ?? "";
    if (needsDescTranslation && publicRemarksEn) {
      finalDescriptionEs = await translateWithRetry(publicRemarksEn, options);
    } else if (!needsDescTranslation && !publicRemarksEs?.trim()) {
      // publicRemarksEn is null/empty and publicRemarksEs is also empty → no translation
      finalDescriptionEs = "";
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
