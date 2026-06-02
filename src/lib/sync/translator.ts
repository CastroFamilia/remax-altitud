import "server-only";
import { TRANSLATION_GLOSSARY } from "../constants/glossary";

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
// Retry constants (exponential backoff on transient errors like 429)
// ---------------------------------------------------------------------------

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

/**
 * Ensures key glossary terms are translated exactly as required,
 * post-processing Google Translate output.
 */
function applyGlossary(translatedText: string): string {
  let result = translatedText;

  // 1. Direct case-insensitive replacements for original English terms in case Google Translate left them untranslated
  for (const [englishTerm, spanishTerm] of Object.entries(TRANSLATION_GLOSSARY)) {
    const escapedEnglish = englishTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedEnglish}\\b`, "gi");
    result = result.replace(regex, spanishTerm);
  }

  // 2. Replacements for common slightly mis-translated variants by Google Translate
  const variantReplacements: Record<string, string> = {
    "dominio pleno": "Pleno Dominio",
    "zona marítima": "Zona Marítimo Terrestre",
    "zona maritimo terrestre": "Zona Marítimo Terrestre",
    "áreas restringidas zmt": "Zona Marítimo Terrestre Restringida",
    "área restringida zmt": "Zona Marítimo Terrestre Restringida",
    concesión: "Concesión",
    "propiedad titulada": "Propiedad Titulada",
    "tarifa simple": "Pleno Dominio",
    "cuota simple": "Pleno Dominio",
  };

  for (const [variant, spanishTerm] of Object.entries(variantReplacements)) {
    const escapedVariant = variant.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedVariant}\\b`, "gi");
    result = result.replace(regex, spanishTerm);
  }

  return result;
}

/**
 * Calls the public, unofficial Google Translate single translation API
 * with exponential backoff on transient errors (rate-limit / connection).
 */
async function translateWithRetry(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t`;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ q: text }).toString(),
      });

      if (res.status === 429) {
        throw new Error("RateLimitError: 429 Too Many Requests");
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as unknown as [string, string, ...unknown[]][][];
      if (!data || !data[0] || !Array.isArray(data[0])) {
        throw new Error("Invalid response structure from Google Translate API");
      }

      const translatedText = data[0].map((item) => item[0]).join("");
      return applyGlossary(translatedText);
    } catch (err: unknown) {
      lastError = err;
      const isRateLimit = err instanceof Error && err.message.includes("429");
      const isConnection =
        err instanceof Error &&
        (err.message.includes("fetch") ||
          err.message.includes("network") ||
          err.message.includes("timeout") ||
          err.message.includes("ENOTFOUND") ||
          err.message.includes("ECONNREFUSED"));

      if (isRateLimit || isConnection) {
        // Transient — apply exponential backoff before the next attempt
        if (attempt < MAX_RETRY_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          continue;
        }
        break;
      }
      // Non-transient errors — throw immediately
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
 * Translates a single property's title and description from EN → ES via Google Translate.
 *
 * Preserve-existing rules:
 *   - If `titleEs` is non-empty (after trim) → preserve, do NOT translate title.
 *   - If `publicRemarksEs` is non-empty (after trim) → preserve, do NOT translate description.
 *
 * Error isolation:
 *   - On any translation error, returns `{ error: { apiId, message } }` instead of throwing.
 *   - Pipeline can continue with remaining listings.
 */
export async function translateProperty(raw: {
  apiId: string;
  titleEn: string;
  titleEs: string;
  publicRemarksEn: string | null;
  publicRemarksEs: string | null;
}): Promise<{ result: TranslationResult; error: TranslationError | null }> {
  const { apiId, titleEn, titleEs, publicRemarksEn, publicRemarksEs } = raw;

  try {
    const needsTitleTranslation = !titleEs.trim() && Boolean(titleEn.trim());
    const needsDescTranslation = !publicRemarksEs?.trim() && Boolean(publicRemarksEn?.trim());

    // Determine final Spanish title
    let finalTitleEs = titleEs;
    if (needsTitleTranslation) {
      finalTitleEs = await translateWithRetry(titleEn);
    }

    // Determine final Spanish description.
    // Default: preserve existing API-provided value (or empty string when null).
    let finalDescriptionEs = publicRemarksEs ?? "";
    if (needsDescTranslation) {
      // Guarded by needsDescTranslation requiring non-empty publicRemarksEn.
      finalDescriptionEs = await translateWithRetry(publicRemarksEn as string);
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
 * rate-limit bursts.
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
