---
story: '2.5-translation-pipeline'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-04-25'
diff_source: 'branch story-2.5-translation-pipeline vs main'
review_mode: 'full'
spec_file: '_bmad-output/planning-artifacts/epics.md (Story 2.5 section)'
---

# Code Review — Story 2.5: Translation Pipeline (DeepL EN→ES)

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. **Two HIGH-severity correctness
bugs** were identified in the DeepL integration that would silently break
production behaviour and pass all existing tests:

1. **Wrong DeepL option key** for the glossary (silently disables FR33).
2. **Wrong DeepL error class** retried on rate-limit (silently disables NFR19
   exponential-backoff behaviour, retries on a permanent error instead).

Both were applied. Tests updated accordingly. Two new tests added to lock in
the corrected retry semantics.

## Findings — Triage

| # | Severity | Source           | Title                                                                | Disposition |
|---|----------|------------------|----------------------------------------------------------------------|-------------|
| 1 | HIGH     | Acceptance/Edge  | DeepL glossary option key `glossaryId` is wrong; SDK reads `glossary` | Applied     |
| 2 | HIGH     | Acceptance       | Backoff retries on `QuotaExceededError` (permanent) instead of `TooManyRequestsError` (transient) | Applied |
| 3 | MEDIUM   | Edge             | Lazy-init translator caches a Translator built from empty API key — no recovery | Applied |
| 4 | LOW      | Edge             | `translateProperty` calls DeepL with `titleEn=""` if titleEs is empty too | Applied (guard added) |
| 5 | LOW      | Edge             | Dead `else if` branch in description handling                        | Applied (cleaned up)  |
| 6 | LOW      | Blind            | No source-language detection for mistagged input                     | Deferred    |
| 7 | LOW      | Blind            | No max-length / cost guard on outbound text                          | Deferred    |
| 8 | LOW      | Blind            | `translationsQueued` counts queued (not actually translated) — minor | Deferred (matches existing test contract) |
| 9 | LOW      | Edge             | Sequential batch has no concurrency cap                              | Deferred (Architecture §5 explicitly mandates sequential) |
| 10| NOISE    | Blind            | Translation pipeline writes back unchanged Spanish description on title-only translation | Dismissed (cosmetic — value identical) |

**Counts:** 1 decision-needed (resolved), 5 patches applied, 4 deferred, 1 dismissed.

## Applied Fixes

### 1. Glossary option key (HIGH, AC #7 / FR33)

**Before:**
```ts
const options: Record<string, string> = {};
if (glossaryId) {
  options.glossaryId = glossaryId;  // SDK ignores this key
}
```

**After:**
```ts
const options: { glossary?: string } = {};
if (glossaryId) {
  options.glossary = glossaryId;    // SDK consumes this key
}
```

The deepl-node SDK reads `options.glossary` (a `GlossaryId` string), not
`options.glossaryId`. The wrong key was silently dropped — DeepL would
translate without applying the legal-term glossary, breaking FR33.

**Tests updated:**
- `tests/unit/sync/translator.spec.ts` — AC #7 tests now assert
  `expect.objectContaining({ glossary: ... })` and explicitly assert that
  `glossaryId` is NOT present.

### 2. Retry error class (HIGH, AC #5 / NFR19)

**Before:** retry loop catches `QuotaExceededError` (permanent — billing
period exhausted) and applies 2s/4s/8s backoff. Real 429 rate-limit errors
(`TooManyRequestsError`) were thrown immediately as "non-429" errors.

**After:** introduced `isTransientDeepLError()` helper that retries on
`TooManyRequestsError` (HTTP 429 rate limit) and `ConnectionError` with
`shouldRetry=true`. `QuotaExceededError` is intentionally NOT retried because
retrying within a single sync run cannot resolve a billing-period exhaustion;
it is treated as a non-transient error and isolates per-listing per AC #6.

**Tests updated:**
- AC #5 tests rewritten to use `MockTooManyRequestsError`.
- New test: `[P1] given QuotaExceededError when called then translateProperty does NOT retry` — locks in the correct semantics.
- New test: `[P1] given ConnectionError with shouldRetry=true when called then translateProperty retries with backoff`.

### 3. Lazy-init key recovery (MEDIUM)

**Before:** `_translator` was set on first call regardless of whether the
API key was empty. Once cached, env-var fixes at runtime had no effect.

**After:** the cached Translator is keyed on the API-key value; if the env
var changes, the next call constructs a fresh Translator. Empty key still
constructs a Translator (the SDK validates the key per request), but is
not "stuck" if the key becomes available later.

### 4. Empty `titleEn` guard (LOW)

**Before:** `needsTitleTranslation = !titleEs.trim()` — translates if the
Spanish title is empty regardless of whether the English title has content.

**After:** `needsTitleTranslation = !titleEs.trim() && Boolean(titleEn.trim())`
— skips translation when both source and target are empty.

### 5. Description branch cleanup (LOW)

Removed dead `else if` branch that re-assigned `finalDescriptionEs = ""`
when it was already initialised to the same value. Functional behaviour
unchanged; control flow simpler and easier to reason about.

## Deferred Items

These were judged below the threshold for blocking the story or are
explicitly part of the architecture specification:

- **Source-language detection**: Architecture says all input is EN, no
  signal that the API mis-tags content; revisit if observed in monitoring.
- **Max-length / cost guard**: Sync runs against a known dataset of ~hundreds
  of listings; not a runaway risk for MVP. Revisit when DeepL bill is observed.
- **`translationsQueued` semantics**: matches the existing pipeline test
  contract; renaming would touch sync log schema.
- **Concurrency cap**: Architecture §5 explicitly mandates sequential
  processing to avoid rate-limit bursts.

## Verification

- `npm test` → **153 pass, 3 skipped (156 total)** in 480ms
  (baseline before fixes: 151 pass, 3 skipped, 154 total — 2 new tests added)
- `npx tsc --noEmit` → clean (no errors)
- `npx eslint src/lib/sync/translator.ts tests/unit/sync/translator.spec.ts`
  → clean

## Status

Story status remains `review` per BAD Step 5 protocol. Step 6 (PR + CI)
will create the PR; Step 7 marks the story `done` after merge.
