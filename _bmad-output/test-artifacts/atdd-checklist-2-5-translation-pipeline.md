---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-04-25'
storyId: '2.5'
storyKey: 2-5-translation-pipeline
storyFile: _bmad-output/implementation-artifacts/2-5-translation-pipeline.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-2-5-translation-pipeline.md
generatedTestFiles:
  - tests/unit/sync/translator.spec.ts
  - tests/unit/sync/pipeline-happy-path.spec.ts
  - tests/unit/sync/pipeline-error-handling.spec.ts
  - tests/unit/db/properties.spec.ts
inputDocuments:
  - _bmad-output/implementation-artifacts/2-5-translation-pipeline.md
  - _bmad/tea/config.yaml
  - tests/unit/sync/factories.ts
  - tests/unit/sync/pipeline-happy-path.spec.ts
  - tests/unit/sync/pipeline-error-handling.spec.ts
  - tests/unit/db/properties.spec.ts
  - tests/unit/sync/image-optimizer.spec.ts
---

# ATDD Checklist: Story 2.5 — Translation Pipeline

## TDD Red Phase (Current)

Red-phase test scaffolds generated. All new tests use `it.skip()` and assert expected behavior.

- Unit Tests (translator): 18 tests (all skipped)
- Unit Tests (pipeline integration): 5 new tests added (all skipped)
- Unit Tests (DB helper): 7 new tests added (all skipped)

## Stack Detection

- Detected stack: `fullstack` (Next.js + Node.js backend)
- Test framework: Vitest (unit tests only — no E2E browser tests for this story)
- Generation mode: AI generation (backend/unit tests, no browser recording needed)

## Test Strategy

### AC → Test Level Mapping

| AC | Description | Level | File | Priority |
|----|-------------|-------|------|----------|
| #1 | New listing → DeepL called for both title + description | Unit | translator.spec.ts | P0 |
| #2 | API-provided titleEs → NOT overwritten | Unit | translator.spec.ts | P0 |
| #3 | API-provided descriptionEs → NOT overwritten | Unit | translator.spec.ts | P0 |
| #4 | UNCHANGED → zero DeepL calls | Unit (pipeline) | pipeline-happy-path.spec.ts | P0 |
| #5 | 429 → exponential backoff (2s/4s/8s, 3 retries) | Unit | translator.spec.ts | P0 |
| #6 | Non-429 error → listing skipped, pipeline continues | Unit | translator.spec.ts | P0 |
| #7 | Glossary applied when DEEPL_GLOSSARY_ID set | Unit | translator.spec.ts | P0 |
| #8 | Translated values written to properties table via DB helper | Unit | properties.spec.ts | P0 |
| #9 | translations_queued updated in sync log | Unit (pipeline) | pipeline-happy-path.spec.ts | P0 |
| Idempotency | Both fields non-empty → translated:false, no DeepL | Unit | translator.spec.ts | P0 |

## Acceptance Criteria Coverage

- [x] AC #1: `translateProperty` with empty fields → DeepL called for both fields
- [x] AC #2: `translateProperty` with non-empty titleEs → title preserved, not overwritten
- [x] AC #3: `translateProperty` with non-empty publicRemarksEs → description preserved
- [x] AC #4: Pipeline with UNCHANGED properties → `translateBatch` not called
- [x] AC #5: `QuotaExceededException` → retry 3 times; success on 3rd returns result
- [x] AC #6: Non-429 error → error returned, no crash, no re-throw
- [x] AC #7: `DEEPL_GLOSSARY_ID` set → `glossaryId` option passed to `translateText`; not set → omitted
- [x] AC #8: `updatePropertyTranslations` → `db.update().set({ titleEs, descriptionEs, syncedAt, updatedAt }).where(...)` called
- [x] AC #9: 2 new properties → `translationsQueued: 2` in `updateSyncLog` call
- [x] AC #10: (CI verification — not an ATDD test, handled by CI)

## Generated Test Files

### NEW: `tests/unit/sync/translator.spec.ts`

Red-phase scaffolds for the `translateProperty` and `translateBatch` functions.

All tests use `it.skip()`. To activate: remove `it.skip` → `it` after implementing `src/lib/sync/translator.ts`.

**Test suites:**
- `translateProperty — new listing (AC #1)`: 3 tests (P0/P1)
- `translateProperty — preserve API-provided titleEs (AC #2)`: 2 tests (P0)
- `translateProperty — preserve API-provided publicRemarksEs (AC #3)`: 2 tests (P0)
- `translateProperty — exponential backoff on HTTP 429 (AC #5)`: 2 tests (P0)
- `translateProperty — non-429 DeepL error isolation (AC #6)`: 2 tests (P0/P1)
- `translateProperty — DeepL glossary integration (AC #7)`: 3 tests (P0/P1)
- `translateBatch — batch processing (AC #8)`: 4 tests (P0/P1)
- `translateProperty — idempotency`: 1 test (P0)
- `translateProperty — result shape`: 2 tests (P1)

### UPDATED: `tests/unit/sync/pipeline-happy-path.spec.ts`

- Added `vi.mock("@/lib/sync/translator", ...)` — prevents real DeepL calls in existing tests
- Added `vi.mocked(translateBatch).mockResolvedValue(...)` reset in `beforeEach`
- Added 5 new red-phase tests under `runSyncPipeline — translation step (Story 2.5, ATDD red phase)`

### UPDATED: `tests/unit/sync/pipeline-error-handling.spec.ts`

- Added `vi.mock("@/lib/sync/translator", ...)` — prevents real DeepL calls in error-handling tests
- Added `vi.mocked(translateBatch).mockResolvedValue(...)` reset in `beforeEach`

### UPDATED: `tests/unit/db/properties.spec.ts`

- Added `updatePropertyTranslations` to imports
- Added 7 new red-phase tests under `updatePropertyTranslations — DB update for translated fields (AC #8)`

## Priority Coverage

- P0: 22 tests
- P1: 8 tests
- P2: 1 test
- Total: 31 new/updated test assertions (all `it.skip()`)

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `it.skip()` → `it` from the relevant test file or suite
2. Run tests: `npm test`
3. Verify the activated test **fails first** (red phase confirmed), then **passes after implementation** (green phase)
4. If any activated tests still fail unexpectedly:
   - Either fix implementation (feature bug)
   - Or fix test (test bug)
5. Commit passing tests

### Activation Order (follows story tasks)

1. **Task 3** (`src/lib/sync/translator.ts`): Activate `tests/unit/sync/translator.spec.ts`
2. **Task 4** (`updatePropertyTranslations`): Activate `tests/unit/db/properties.spec.ts` → `updatePropertyTranslations` describe block
3. **Task 5** (pipeline integration): Activate `tests/unit/sync/pipeline-happy-path.spec.ts` → Story 2.5 describe block

## Key Risks and Assumptions

- **R-003**: Tests explicitly verify that API-provided Spanish content is never overwritten by DeepL (AC #2, #3)
- **Backoff timing**: Tests do NOT assert sleep durations (would make tests slow/flaky). They verify call count and success/failure after N attempts.
- **Sequential processing**: AC #5 backoff test verifies 3 `translateText` calls. The actual delay is mocked in the module (real implementation uses `setTimeout`/`sleep`).
- **`vi.hoisted()`**: Used in `translator.spec.ts` to ensure `MockTranslator` and `MockQuotaExceededException` are available when the `vi.mock()` factory runs (same pattern as `image-optimizer.spec.ts`).
- **`server-only` shim**: The vitest config already aliases `server-only` to a shim — `translator.ts` can be imported in tests safely.

## Implementation Guidance

Files to create/edit (Story 2.5 tasks):

- `src/lib/constants/glossary.ts` (new — Task 2)
- `src/lib/sync/translator.ts` (new — Task 3)
- `src/lib/db/queries/properties.ts` (edit — add `updatePropertyTranslations`, Task 4)
- `src/types/remax-api.ts` (edit — add `"translation_error"` to `ParseError.scope`, Task 5)
- `src/lib/sync/pipeline.ts` (edit — add translation step, Task 5)
