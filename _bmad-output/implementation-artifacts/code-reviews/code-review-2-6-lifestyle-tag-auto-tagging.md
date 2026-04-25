---
story: '2.6-lifestyle-tag-auto-tagging'
reviewer: 'BAD Step 5 (yolo mode)'
date: '2026-04-25'
diff_source: 'branch story-2.6-lifestyle-tag-auto-tagging vs main'
review_mode: 'full'
spec_file: '_bmad-output/implementation-artifacts/2-6-lifestyle-tag-auto-tagging.md'
---

# Code Review — Story 2.6: Lifestyle Tag Auto-Tagging

## Summary

Three adversarial review layers (Blind Hunter, Edge Case Hunter, Acceptance
Auditor) run inline against the story branch. The implementation is small,
pure, well-isolated, and faithfully tracks the spec. **No HIGH or MEDIUM
correctness bugs** were identified. One LOW-severity micro-refactor was
applied to remove a duplicate spread of `[...diff.new, ...diff.updated]` in
the pipeline tagging step. Two findings were deferred (one is explicitly
marked as future work in the spec; one is a documented spec pseudocode
trade-off that doesn't merit a deviation here). Three were dismissed as
noise.

CI snapshot post-fix: 195 tests pass, 3 skipped (pre-existing schema tests),
lint clean, prettier clean, typecheck shows only pre-existing `deepl-node`
errors carried over from Story 2.5.

## Findings — Triage

| # | Severity | Source            | Title                                                                                              | Disposition |
|---|----------|-------------------|----------------------------------------------------------------------------------------------------|-------------|
| 1 | LOW      | Edge Case Hunter  | `[...diff.new, ...diff.updated]` rebuilt twice in pipeline tagging step                            | Applied     |
| 2 | LOW      | Acceptance        | AC #2 mentions "tourist zone" but rule only checks `propertyTypeEn` for "condo"                    | Deferred    |
| 3 | LOW      | Edge Case Hunter  | `fetchPropertyLifestyleTags` queries existing tags for just-inserted NEW rows (always empty)       | Deferred    |
| 4 | NOISE    | Edge Case Hunter  | `applyLifestyleTags` returns `existingTags` by reference when no rules match (aliasing)            | Dismissed   |
| 5 | NOISE    | Edge Case Hunter  | `tagged` flag false-negative if `existingTags` contains duplicate strings                          | Dismissed   |
| 6 | NOISE    | Blind Hunter      | `LIFESTYLE_TAGS` exposes `Vacation Home`/`Commercial` without auto-rules                           | Dismissed   |

### #1 — Duplicate spread in pipeline tagging step (Applied)

**Location:** `src/lib/sync/pipeline.ts` Step 7c (lines 221–242).

`[...diff.new, ...diff.updated]` was constructed twice — once for fetching
existing tags by apiId, once for building the tag-batch input. Negligible
cost (≤ a few hundred refs) but easy to factor out and clarifies intent.

**Fix applied:**
```ts
const taggable = [...diff.new, ...diff.updated];
if (taggable.length > 0) {
  const existingTagsMap = await fetchPropertyLifestyleTags(taggable.map((r) => r.apiId));
  const batchInput = taggable.map((raw) => ({
    raw,
    existingTags: existingTagsMap.get(raw.apiId) ?? [],
  }));
  // ...
}
```

### #2 — AC #2 references "tourist zone" but implementation checks only `propertyTypeEn` (Deferred)

**Location:** `src/lib/constants/lifestyle-tags.ts:42–48`.

AC #2 reads "Given a condo (propertyType contains 'Condo') in a tourist zone
(areaSlug or description contains tourist-zone keywords) … Then the listing
receives the 'Rental Potential' tag." The shipped rule fires on *any* condo,
not only tourist-zone condos.

**Why deferred:** The spec narrative for this same rule (Dev Notes §
"Lifestyle Tag Constants Structure") and the inline code comment both
explicitly approve the simpler implementation: "Extend in future: add
tourist-zone area check once area data is linked." Area / community data
wiring is Epic 6 Story 6.5. Tightening the rule now would require fields
(`areaSlug`, area-keyword list) that don't yet exist on `RawProperty` and
would push the rule out of pure-data territory before the data model is
ready.

### #3 — `fetchPropertyLifestyleTags` queries DB for just-inserted NEW rows (Deferred)

**Location:** `src/lib/sync/pipeline.ts:225–227`.

The pipeline calls `upsertProperty` for `diff.new` rows BEFORE the tagging
step runs. Those rows are then included in the
`fetchPropertyLifestyleTags` query, which always returns empty arrays for
them (schema default `'{}'::text[]`). The query is correct but slightly
wasteful — an `inArray` over `diff.new ∪ diff.updated` could be narrowed to
`diff.updated` only.

**Why deferred:** The current shape matches the spec pseudocode exactly
(Dev Notes § "DB Query Pattern for Fetching Existing Tags (Batch)"). The
cost is one indexed `inArray` query per sync, and even at full sprint
scale (~360 listings) the query is sub-millisecond. Worth revisiting only
if profiling identifies the sync as latency-bound, which it isn't.

### Dismissed findings

- **#4 — `applyLifestyleTags` aliasing.** When no rules match, the function
  returns `existingTags` directly (not a copy). No caller in this story
  mutates the result; the tagger is internally pure and the pipeline reads
  `result.tags` only for `updatePropertyLifestyleTags`. Idiomatic for
  immutable-by-convention code.

- **#5 — `tagged` false-negative on duplicate `existingTags`.** `tagged =
  tags.length > existingTags.length` would misreport when input duplicates
  collapse into the deduped Set. The `properties.lifestyle_tags` column
  cannot produce duplicates: the DB default is `'{}'::text[]` and the only
  writer (this same `updatePropertyLifestyleTags`) stores deduplicated
  arrays from `applyLifestyleTags`. No realistic input path produces
  duplicates.

- **#6 — `LIFESTYLE_TAGS` lists `Vacation Home` and `Commercial` without
  rules.** Intentional. FR49 calls for manual override capability; admins
  can assign these tags by hand and the auto-tagger will preserve them on
  re-sync (AC #7). The constants file is the single source of truth for
  Client-Component filter UI in Epic 3, which needs all valid tag names —
  not just auto-emitted ones.

## Acceptance Criteria — Audit

| AC  | Behavior                                                            | Evidence                                                                              | Status |
|-----|---------------------------------------------------------------------|---------------------------------------------------------------------------------------|--------|
| #1  | Configurable rules in `lifestyle-tags.ts`                            | `LIFESTYLE_TAG_RULES` exported; pure data array                                       | Pass   |
| #2  | Condo → "Rental Potential"                                           | `propertyTypeEn.toLowerCase().includes("condo")` rule (tourist-zone deferred — see #2) | Partial (spec-approved) |
| #3  | Lot/Land + ≥ 5000m² → "Investment Property"                          | `propertyTypeEn` matches `land`/`lot` AND `lotSizeM2 ?? 0 >= 5000`                     | Pass   |
| #4  | "retirement" in description → "Retire" (case-insensitive)            | `(publicRemarksEn ?? "").toLowerCase().includes("retirement")`                         | Pass   |
| #5  | Multi-rule properties → all tags, deduplicated                       | `[...new Set([...existingTags, ...newTags])]`                                          | Pass   |
| #6  | Add a rule → no other code change                                    | Rules are pure data; tagger imports `LIFESTYLE_TAG_RULES` and iterates                 | Pass   |
| #7  | Manual tags preserved on re-sync                                     | Union, never replace; covered by 4 P0 unit tests in `lifestyle-tagger.spec.ts`         | Pass   |
| #8  | UNCHANGED listings skipped — zero DB writes                          | Pipeline iterates `[...diff.new, ...diff.updated]` only                                | Pass   |
| #9  | `sync_logs.tags_queued` records attempt count                         | `tagsQueued = batchInput.length` and passed to `updateSyncLog`                          | Pass   |
| #10 | typecheck/lint/format/test pass; `lifestyle-tagger.ts` is server-only | `import "server-only"` is line 1; lint+format clean; 195 tests pass                    | Pass*  |

*AC #10 typecheck note: the only typecheck errors are in `src/lib/sync/translator.ts` (deepl-node module resolution) — pre-existing from Story 2.5, unrelated to this story.

## Notes

- The implementation is faithful to the architecture's "rules-as-data"
  guidance and to Story 2.5's pipeline integration pattern.
- Test coverage for the tagger module is dense (30 unit tests) and
  appropriately P0-weighted on manual-override preservation (Risk R-006).
- `lifestyle-tagger.ts` correctly avoids any DB import — DB access
  exclusively flows through `queries/properties.ts`.
- `lifestyle-tags.ts` correctly omits `"server-only"` so it can be reused
  by Client Components in Epic 3 filter UI.
