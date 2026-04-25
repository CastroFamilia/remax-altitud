# Story 2.5: Translation Pipeline

Status: ready-for-dev

## Story

As a **visitor**,
I want listing content available in my language,
so that I can understand property details without needing a translator.

## Acceptance Criteria

1. **Given** a new listing is synced with English content only (empty `title_es` / `description_es` from the API) **When** the translation step runs **Then** `title_es` and `description_es` are populated by DeepL translation of `titleEn` and `publicRemarksEn` (FR48).

2. **Given** a listing already has Spanish content from the API (`title_es` non-empty) **When** the translation step runs **Then** the API-provided Spanish content is preserved (NOT overwritten) — DeepL is NOT called for that field.

3. **Given** a listing already has a non-empty `description_es` from the API **When** the translation step runs **Then** the description is preserved (NOT overwritten) even if the English description differs.

4. **Given** a property classified as `UNCHANGED` by the diff **When** the translation step runs **Then** the property is skipped entirely — zero DeepL API calls for unchanged listings (NFR15 incremental processing).

5. **Given** DeepL API returns HTTP 429 (rate limit) **When** processing a batch of listings **Then** the translator applies exponential backoff (2s, 4s, 8s retries up to 3 attempts) and resumes without data loss (NFR19).

6. **Given** DeepL API throws a non-429 error for a specific listing **When** translating **Then** that listing's translation is skipped and logged as a structured error entry, but the pipeline continues with remaining listings (isolation, no full-pipeline crash).

7. **Given** a listing with the text "Titled Property," "Concession," or "ZMT Restricted" **When** translating **Then** the DeepL glossary is applied, producing consistent translations for these legal/property terms (FR33 support).

8. **Given** translations are computed **When** persisting **Then** translated values are written to `properties.title_es` and `properties.description_es` columns directly (NOT to a separate translations table) via a DB helper function.

9. **Given** the translation step processes a batch **When** the sync run completes **Then** `sync_logs.translations_queued` is updated with the count of listings for which translation was attempted.

10. **Given** the complete implementation **When** running `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test` **Then** all pass with zero new errors. The `translator.ts` module must import `"server-only"` and must NOT be importable by any Client Component.

## Tasks / Subtasks

- [ ] Task 1: Install DeepL SDK (AC: #1, #5, #7)
  - [ ] Run `npm install deepl-node`.
  - [ ] Verify `deepl-node` is in `package.json` `dependencies` (runtime dep — needed in Docker image).
  - [ ] **DO NOT** install `@deepl/translate`, `google-cloud/translate`, `openai` for this story — `deepl-node` is the architecture-mandated choice (AD-8).
  - [ ] Check `package.json` to confirm `deepl-node` is not already installed before running install.

- [ ] Task 2: Create glossary constants (AC: #7)
  - [ ] Create `src/lib/constants/glossary.ts` (architecture §3 source tree lists this file).
  - [ ] This file must NOT have `"use client"` or `import "server-only"` — it is a shared constants file.
  - [ ] Export `TRANSLATION_GLOSSARY: Record<string, string>` mapping EN → ES for legal/property terms:
    ```ts
    export const TRANSLATION_GLOSSARY: Record<string, string> = {
      "Titled Property": "Propiedad Titulada",
      "Concession": "Concesión",
      "ZMT Restricted": "Zona Marítimo Terrestre Restringida",
      "Fee Simple": "Pleno Dominio",
      "Maritime Zone": "Zona Marítimo Terrestre",
    };
    ```
  - [ ] Note: DeepL glossary creation is async and per-language-pair. For launch (EN→ES only), create one glossary. The glossary ID must be managed via env var `DEEPL_GLOSSARY_ID` — do NOT hardcode it.

- [ ] Task 3: Create `src/lib/sync/translator.ts` (AC: #1–#9)
  - [ ] Add `import "server-only"` at the very top.
  - [ ] Import `Translator` from `deepl-node` (named import: `import { Translator } from 'deepl-node'`).
  - [ ] Initialize translator: `const translator = new Translator(process.env.DEEPL_API_KEY ?? '')`.
  - [ ] **Preserve-existing check**: Before calling DeepL, check if the field already has content. Only translate if the target field is empty/blank.
  - [ ] **Glossary**: Pass `{ glossaryId: process.env.DEEPL_GLOSSARY_ID }` to translation calls when the env var is set (omit glossary option if undefined — do NOT pass undefined as glossaryId).
  - [ ] Export `interface TranslationResult { apiId: string; titleEs: string | null; descriptionEs: string | null; translated: boolean }`.
  - [ ] Export `interface TranslationError { apiId: string; message: string }`.
  - [ ] Export `async function translateProperty(raw: { apiId: string; titleEn: string; titleEs: string; publicRemarksEn: string | null; publicRemarksEs: string | null }): Promise<{ result: TranslationResult; error: TranslationError | null }>`.
    - If `titleEs` is non-empty (after trim), do NOT translate title → `titleEs = titleEs` (preserve).
    - If `titleEs` is empty, translate `titleEn` → ES via DeepL. On error, log and return `error`.
    - If `publicRemarksEs` is non-empty (after trim), do NOT translate description.
    - If `publicRemarksEs` is empty AND `publicRemarksEn` is non-empty, translate → ES.
    - If `publicRemarksEs` is empty AND `publicRemarksEn` is null/empty, skip description translation (nothing to translate) — set `descriptionEs` to `''`.
    - Return `{ result: { apiId, titleEs, descriptionEs, translated: true/false }, error: null }`.
    - On any DeepL error: return `{ result: { apiId, titleEs: null, descriptionEs: null, translated: false }, error: { apiId, message: err.message } }`.
  - [ ] **Exponential backoff for 429**: Wrap the DeepL call in a retry loop: 3 attempts, delays 2000ms, 4000ms, 8000ms. Check for `429` status in DeepL error (the `deepl-node` SDK throws `QuotaExceededException` for 429 — catch by name or check `err instanceof deepl.QuotaExceededException`). Re-throw on non-429 errors after first attempt.
  - [ ] Export `async function translateBatch(raws: Array<{ apiId: string; titleEn: string; titleEs: string; publicRemarksEn: string | null; publicRemarksEs: string | null }>): Promise<{ results: TranslationResult[]; errors: TranslationError[] }>`.
    - Iterate sequentially (not `Promise.all`) to avoid rate-limit burst.
    - Collect results and errors separately.
    - Return `{ results, errors }`.

- [ ] Task 4: Create `updatePropertyTranslations` DB helper (AC: #8)
  - [ ] In `src/lib/db/queries/properties.ts`, export `async function updatePropertyTranslations(apiId: string, titleEs: string, descriptionEs: string): Promise<void>`.
  - [ ] Implementation: `await db.update(properties).set({ titleEs, descriptionEs, syncedAt: new Date(), updatedAt: new Date() }).where(eq(properties.apiId, apiId))`.
  - [ ] Import `"server-only"` is already at top of this file — DO NOT add again.
  - [ ] Follow same Drizzle update pattern as `updatePropertyImages` already in this file.

- [ ] Task 5: Integrate translator into `src/lib/sync/pipeline.ts` (AC: #4, #9)
  - [ ] Import `translateBatch` from `./translator`.
  - [ ] Add translation step AFTER property upserts but BEFORE image optimization (Architecture §5: STEP 4 is translate, STEP 5 is images). Insert between Step 6b (property upserts) and Step 7b (image optimization).
  - [ ] Build the batch input: filter `[...diff.new, ...diff.updated]` to extract `{ apiId, titleEn, titleEs, publicRemarksEn, publicRemarksEs }`.
  - [ ] Call `translateBatch(batchInput)`.
  - [ ] For each result where `result.translated === true`, call `updatePropertyTranslations(result.apiId, result.titleEs!, result.descriptionEs ?? '')`.
  - [ ] Map translation errors to `ParseError` shape: `{ apiId: err.apiId, scope: 'translation_error', message: err.message, raw: {} }` and push to `allErrors`.
  - [ ] Add `"translation_error"` to the `ParseError.scope` union in `src/types/remax-api.ts`.
  - [ ] Update `updateSyncLog` call to include `translationsQueued: batchInput.length` (count of listings translation was attempted for).
  - [ ] Update `SyncPipelineResult` interface to add `translationsQueued: number`.
  - [ ] **Pipeline ordering constraint**: Translation MUST run after property upserts (rows must exist in DB for FK sanity) and BEFORE image optimization (Architecture §5 Step 4 before Step 5). Do NOT move image optimization before translation.

- [ ] Task 6: Tests (AC: #10)
  - [ ] Create `tests/unit/sync/translator.spec.ts`:
    - Mock `deepl-node` with `vi.mock('deepl-node', ...)` returning a mock `Translator` class with a `.translateText()` method.
    - **AC #1 test**: Given `titleEs = ''` and `publicRemarksEs = ''`, when `translateProperty` called, then `Translator.translateText` called for title AND description.
    - **AC #2 test**: Given `titleEs = 'Casa en la montaña'` (non-empty), when called, then `translateText` NOT called for title (only description if empty).
    - **AC #3 test**: Given `publicRemarksEs = 'Descripción existente.'` (non-empty), when called, then `translateText` NOT called for description.
    - **AC #4 skipping (pipeline level)**: Covered in pipeline integration test (see pipeline-happy-path update).
    - **AC #5 test**: Mock `translateText` to return `QuotaExceededException` on first 2 calls, succeed on 3rd; assert `translateProperty` resolves successfully and `translateText` called 3 times.
    - **AC #6 test**: Mock `translateText` to throw a non-429 error; assert `translateProperty` returns `{ error: { ... } }` with no crash.
    - **AC #7 test**: Assert `translateText` is called with `{ glossaryId: 'test-glossary-id' }` option when `DEEPL_GLOSSARY_ID` env var is set; assert glossary option is omitted when env var is not set.
    - **AC #8/batch test**: `translateBatch` with 2 properties — assert 2 `translateText` calls, result array has 2 entries.
    - **Idempotency test**: Property with both `titleEs` and `publicRemarksEs` non-empty → `translated: false`, no `translateText` call.
  - [ ] Update `tests/unit/sync/pipeline-happy-path.spec.ts`:
    - Add mock: `vi.mock('@/lib/sync/translator', () => ({ translateBatch: vi.fn().mockResolvedValue({ results: [], errors: [] }) }))`.
    - Assert `translationsQueued: 0` in the `updateSyncLog` call for the happy-path test (0 new/updated = no translations attempted).
    - Add test variant: 2 new properties → assert `translationsQueued: 2` in sync log.
  - [ ] Update `tests/unit/sync/pipeline-error-handling.spec.ts`:
    - Add mock for `translateBatch` same as above to prevent real calls in error-handling tests.
  - [ ] Update `tests/unit/db/properties.spec.ts`:
    - Add test for `updatePropertyTranslations('apiId', 'Título ES', 'Descripción ES')` → assert `db.update` called with correct `set` payload including `titleEs`, `descriptionEs`, `syncedAt`, `updatedAt`.

- [ ] Task 7: Add `DEEPL_API_KEY` and `DEEPL_GLOSSARY_ID` env var references
  - [ ] Check `.env.example` or `.env.local.example` if present and add `DEEPL_API_KEY=` and `DEEPL_GLOSSARY_ID=` placeholder lines (do NOT add real keys).
  - [ ] If no `.env.example` exists, add a comment in `translator.ts` documenting required env vars.
  - [ ] Verify `DEEPL_API_KEY` is NOT committed to git (check `.gitignore` for `.env*`).

- [ ] Task 8: CI verification (AC: #10)
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run format:check` → pass.
  - [ ] `npm run build` → pass.
  - [ ] `npm test` → all green (all previously passing tests + new translator tests).

## Dev Notes

### Architecture Compliance

- **Pre-declared file (Architecture §3):** `src/lib/sync/translator.ts` is explicitly listed in the architecture source tree as `# DeepL + GPT-4 translation`. Create it at exactly this path — do NOT create `src/lib/sync/translation.ts`, `src/lib/sync/translate.ts`, or any variant.
- **Pre-declared file (Architecture §3):** `src/lib/constants/glossary.ts` is explicitly listed as `# Translation glossary terms`. Create it at exactly this path.
- **server-only (AR16/NFR11):** `import "server-only"` MUST be at the top of `src/lib/sync/translator.ts`. This prevents accidental import from Client Components.
- **Translation step position (Architecture §5):** Translation is STEP 4 in the pipeline, image optimization is STEP 5. The current pipeline runs image optimization after property upserts (Step 7b). Insert translation BEFORE image optimization. The correct order in `pipeline.ts` is: upsert properties → translate → optimize images.
- **Launch scope (EN→ES only):** Phase 2 adds IT, DE, FR, PT. This story implements EN→ES only. The architecture is designed for multi-language expansion via config — do NOT hardcode language pairs in non-config code. Use `'en' as deepl.SourceLanguageCode` and `'es' as deepl.TargetLanguageCode`.
- **DeepL rate limit (Architecture §5):** 500K chars/month on Starter plan. Translate ONLY `diff.new` and `diff.updated` where the target field is empty. Zero DeepL calls for `diff.unchanged` (NFR15).

### DeepL SDK Quick Reference (`deepl-node` v1.x — current stable 2026)

```ts
import { Translator, QuotaExceededException } from 'deepl-node';

const translator = new Translator(process.env.DEEPL_API_KEY ?? '');

// Basic translation
const result = await translator.translateText(
  'Titled Property for sale',   // source text
  'en',                          // source language
  'es',                          // target language
  {
    glossaryId: process.env.DEEPL_GLOSSARY_ID,  // optional — omit if undefined
  }
);
console.log(result.text); // → 'Propiedad Titulada en venta'

// Error type for rate limit
try {
  await translator.translateText(text, 'en', 'es');
} catch (err) {
  if (err instanceof QuotaExceededException) {
    // 429 — apply backoff and retry
  }
}

// Create glossary (one-time setup, store ID in env)
const glossary = await translator.createGlossary(
  'remax-altitud-en-es',
  'en', 'es',
  new deepl.GlossaryEntries({ entries: TRANSLATION_GLOSSARY })
);
// Store glossary.glossaryId in DEEPL_GLOSSARY_ID env var
```

Key notes:
- `translateText` accepts a single string or string array. Use single string per field to simplify error isolation.
- The SDK is callback-free — always `await`.
- `deepl-node` is the Node.js SDK. Do NOT use `@deepl/translator` (browser SDK).

### DB Column Reference

Story 2.1 schema (`src/lib/db/schema/properties.ts`):
```ts
titleEs: text("title_es").notNull(),          // NOT NULL — fallback to titleEn on upsert
descriptionEs: text("description_es").notNull().default(""),  // defaults to empty string
```

In `upsertProperty` (Story 2.3), `titleEs` is already populated from `raw.titleEs` (which is `titleEn` if the API provides no Spanish title — see parser in `src/lib/sync/schemas/property.ts` lines 109-110). So after upsert, `title_es` is always non-empty (it falls back to `title_en`). The translation step must check the ORIGINAL API value (before fallback) to determine if translation is needed.

**Critical implication**: Use `raw.titleEs` (the original API value before parser fallback) for the "has Spanish" check in the pipeline, NOT the value stored in the DB after upsert. The pipeline already has access to `raw` objects — use them. The parser's `titleEs` field is the output after fallback (i.e., equals `titleEn` if API had no ES title). This means you need to check the parser output: if `raw.titleEs === raw.titleEn`, the API provided no Spanish title, so translate.

**Alternative approach** (recommended): In `translateProperty`, check `raw.titleEs !== raw.titleEn` (or check if the API-original `ListingTitle_es` was non-empty). Since the pipeline builds the batch from `raw` objects where `raw.titleEs` may equal `raw.titleEn` (parser fallback), the preserve-check should be: `if titleEs is non-empty AND titleEs !== titleEn, skip translation`. This correctly detects API-provided Spanish.

### `sync_logs.translations_queued` Column

The column exists in the Drizzle schema (`src/lib/db/schema/sync-logs.ts` line 15): `translationsQueued: integer("translations_queued").notNull().default(0)`. It is also in the DB migration (`0001_schema_and_seed.sql`). No new migration required.

The `updateSyncLog` function in `src/lib/db/queries/sync-log.ts` accepts `Partial<NewSyncLog>`, so passing `{ translationsQueued: N }` works automatically.

### `ParseError` Scope Extension

Add `"translation_error"` to the union in `src/types/remax-api.ts`:
```ts
scope: "property" | "agent" | "lot_size_warning" | "image_error" | "translation_error";
```

### Anti-Pattern Guardrails (DO NOT)

1. **DO NOT** use `google-cloud/translate`, `openai`, or any translation library other than `deepl-node`.
2. **DO NOT** overwrite `titleEs` or `descriptionEs` when the API already provides Spanish content.
3. **DO NOT** translate `diff.unchanged` properties — zero DeepL calls for unchanged (NFR15).
4. **DO NOT** use `Promise.all` for DeepL calls — sequential processing avoids rate-limit bursts.
5. **DO NOT** store translations in a separate `translations` table — use `properties.title_es` and `properties.description_es` columns directly.
6. **DO NOT** hardcode glossary entries as plain string replacements — use DeepL's glossary API feature (glossaryId).
7. **DO NOT** move translation step after image optimization — translation is Architecture Step 4, images are Step 5.
8. **DO NOT** call `translateBatch` before property upserts — the rows must exist for `updatePropertyTranslations` to succeed.
9. **DO NOT** add `"server-only"` to `src/lib/constants/glossary.ts` — it is a shared constants file (same pattern as other files in `src/lib/constants/`).
10. **DO NOT** commit `.env` files or real API keys.

### Pipeline Integration Pattern (from Stories 2.3 and 2.4)

Follow the EXACT same pattern established in Story 2.4 for image optimization. Insert translation step between Step 6b (property upserts) and Step 7b (image optimization) in `pipeline.ts`:

```ts
// Step 6c-translation: Translate only new/updated listings (Architecture §5 Step 4)
let translationsQueued = 0;
const translationErrors: ParseError[] = [];

if (diff.new.length + diff.updated.length > 0) {
  const batchInput = [...diff.new, ...diff.updated].map((raw) => ({
    apiId: raw.apiId,
    titleEn: raw.titleEn,
    titleEs: raw.titleEs,
    publicRemarksEn: raw.publicRemarksEn,
    publicRemarksEs: raw.publicRemarksEs,
  }));
  translationsQueued = batchInput.length;

  const { results, errors } = await translateBatch(batchInput);

  for (const result of results) {
    if (result.translated && result.titleEs) {
      await updatePropertyTranslations(result.apiId, result.titleEs, result.descriptionEs ?? '');
    }
  }
  for (const err of errors) {
    translationErrors.push({ apiId: err.apiId, scope: 'translation_error', message: err.message, raw: {} });
  }
}
```

Then include `translationErrors` in `allErrors` and `translationsQueued` in the `updateSyncLog` call.

### File Structure Target

```
src/
├── lib/
│   ├── sync/
│   │   └── translator.ts          ← NEW (Task 3)
│   ├── constants/
│   │   └── glossary.ts            ← NEW (Task 2)
│   └── db/queries/
│       └── properties.ts          ← EDIT: add updatePropertyTranslations()
├── types/
│   └── remax-api.ts               ← EDIT: add "translation_error" scope

src/lib/sync/pipeline.ts           ← EDIT: add translation step, translationsQueued

tests/unit/sync/
└── translator.spec.ts             ← NEW (Task 6)
```

### Previous Story Intelligence (2.4)

- **Pipeline extension pattern:** Follow Story 2.4's step-insertion pattern exactly. Story 2.4 shows how to add a new pipeline step: import the module, add the step after property upserts, accumulate errors into `ParseError[]`, add count to `updateSyncLog`. Translation follows the same pattern.
- **`vi.hoisted()` for mock primitives:** Story 2.4's image-optimizer tests used `vi.hoisted()` to fix Vitest hoisting bugs with `vi.mock()` factories that reference variables. Use the same pattern in `translator.spec.ts` if your mock `Translator` class needs pre-declared mock functions.
- **`server-only` boundary:** Every file under `src/lib/sync/**` uses `import "server-only"` as first line. `translator.ts` is under `src/lib/sync/` — the rule applies.
- **Test factories:** `tests/unit/sync/factories.ts` exports `makeRawProperty()`. Use it in translator tests for building test inputs — do NOT redefine the factory.
- **Drizzle update pattern:** Follow `updatePropertyImages()` in `src/lib/db/queries/properties.ts` as the exact pattern for `updatePropertyTranslations()`.
- **`ParseError` type:** Already extended with `"image_error"` in Story 2.4. Add `"translation_error"` to the same union in `src/types/remax-api.ts`.
- **Existing mock pattern in pipeline tests:** `pipeline-happy-path.spec.ts` already mocks `optimizePropertyImages` and `updatePropertyImages`. Add `translateBatch` mock in the same block to prevent test failures.
- **`SyncLogShape` in `factories.ts`:** The factory's `SyncLogShape` interface does NOT currently include `translationsQueued`. After adding it to `SyncPipelineResult`, you may need to add it to the factory's shape if tests reference it. Check `makeSyncLog()` in `factories.ts`.

### References

- Architecture §3 Source Tree: `src/lib/sync/translator.ts` and `src/lib/constants/glossary.ts` [Source: `_bmad-output/planning-artifacts/architecture.md` lines 296, 328]
- Architecture §5 Sync Pipeline Step 4: DeepL translation with glossary, EN→ES, Phase 2: IT/DE/FR/PT, exponential backoff on 429 [Source: `_bmad-output/planning-artifacts/architecture.md` lines 636–641]
- Architecture §5 Sync Execution Constraints: `DeepL rate limit | 500K chars/mo (Starter) | Translate only changed content; cache translations` [Source: `_bmad-output/planning-artifacts/architecture.md` line 695]
- PRD FR48: Translation during sync [Source: `_bmad-output/planning-artifacts/prd.md`]
- PRD FR33: Legal/property terms translate consistently via enforced glossary [Source: `_bmad-output/planning-artifacts/prd.md`]
- PRD NFR19: Translation API rate limits respected; exponential backoff [Source: `_bmad-output/planning-artifacts/prd.md`]
- Epics Story 2.5 acceptance criteria [Source: `_bmad-output/planning-artifacts/epics.md` lines 967–994]
- Story 2.1 DB schema: `properties.title_es`, `properties.description_es` (text, notNull) [Source: `src/lib/db/schema/properties.ts`]
- Story 2.1 DB schema: `sync_logs.translations_queued` (integer, default 0) [Source: `src/lib/db/schema/sync-logs.ts`]
- Story 2.3/2.4 Pipeline: `src/lib/sync/pipeline.ts` — integration point [Source: codebase]
- Property parser: `src/lib/sync/schemas/property.ts` lines 109–110 — titleEs fallback to titleEn [Source: codebase]
- Test design: Story 2.5 P0/P1/P2 test scenarios [Source: `_bmad-output/test-artifacts/test-design-epic-2.md`]
- Risk R-003: Translation must not overwrite API-provided ES content [Source: `_bmad-output/test-artifacts/test-design-epic-2.md`]

### ATDD Artifacts

- Test design: `_bmad-output/test-artifacts/test-design-epic-2.md` (Story 2.5 sections)
- Unit tests (translator): `tests/unit/sync/translator.spec.ts` (new)
- Unit tests (pipeline integration): `tests/unit/sync/pipeline-happy-path.spec.ts` (update)
- Unit tests (pipeline error handling): `tests/unit/sync/pipeline-error-handling.spec.ts` (update)
- Unit tests (DB helper): `tests/unit/db/properties.spec.ts` (update)

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

_to be filled by dev agent_

### Completion Notes List

_to be filled by dev agent_

### File List

_to be filled by dev agent_

### Review Findings

_to be filled by code review agent_
