# Story 2.6: Lifestyle Tag Auto-Tagging

Status: ready-for-dev

## Story

As a **visitor**,
I want properties tagged with relevant lifestyle categories,
so that I can filter for exactly the type of property I'm looking for.

## Acceptance Criteria

1. **Given** configurable tagging rules exist in `src/lib/constants/lifestyle-tags.ts` **When** the sync pipeline processes a listing **Then** lifestyle tags are auto-assigned to `properties.lifestyle_tags` based on attribute matching (FR49).

2. **Given** a condo (`propertyType` contains "Condo") in a tourist zone (`areaSlug` or description contains tourist-zone keywords) **When** rule matching evaluates **Then** the listing receives the `"Rental Potential"` tag.

3. **Given** a large lot (`propertyType` contains "Lot/Land" AND `lotSizeM2 >= 5000`) **When** rule matching evaluates **Then** the listing receives the `"Investment Property"` tag.

4. **Given** a property description contains the word `"retirement"` (case-insensitive) **When** rule matching evaluates **Then** the listing receives the `"Retire"` tag (per architecture §5 example: `"House with 'retirement' in description → 'Retire'"`).

5. **Given** a single property matches multiple rules **When** tag assignment runs **Then** all matching tags are applied and stored deduplicated in the `lifestyle_tags` array (no duplicates).

6. **Given** new rule configurations are added to `src/lib/constants/lifestyle-tags.ts` **When** the next sync runs **Then** new listings are tagged according to the updated rules — without any other code change.

7. **Given** an admin has manually set tags on a listing (i.e., the property row already has non-empty `lifestyle_tags`) **When** the sync pipeline runs again **Then** manual overrides are preserved and NOT reset by auto-tagging — auto-tagging only ADDS tags, never removes them (FR49).

8. **Given** a property classified as `UNCHANGED` by the differ **When** the tagging step runs **Then** the property is skipped entirely — zero DB writes for unchanged listings (NFR15 incremental processing).

9. **Given** lifestyle tagging runs for a batch **When** the sync completes **Then** `sync_logs.tags_queued` is updated with the count of listings for which tagging was attempted.

10. **Given** the complete implementation **When** running `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test` **Then** all pass with zero new errors. The `lifestyle-tagger.ts` module must import `"server-only"` and must NOT be importable by any Client Component.

## Tasks / Subtasks

- [ ] Task 1: Create `src/lib/constants/lifestyle-tags.ts` (AC: #1, #2, #3, #4, #5, #6)
  - [ ] This file must NOT have `"use client"` or `import "server-only"` — it is a shared constants file (same pattern as `glossary.ts`, `offices.ts`).
  - [ ] Export `LIFESTYLE_TAGS` array of string literals for all valid tag names: `"Rental Potential" | "Investment Property" | "Vacation Home" | "Retire" | "Commercial"`.
  - [ ] Export `LifestyleTag` as a TypeScript union type derived from the constants.
  - [ ] Export `interface LifestyleTagRule` describing a single rule: `{ tag: LifestyleTag; match: (raw: RawProperty) => boolean }`.
  - [ ] Export `LIFESTYLE_TAG_RULES: LifestyleTagRule[]` — an array of all auto-tagging rules.
  - [ ] Implement at minimum the 3 architecture-mandated rules:
    - `Condo in tourist zone → "Rental Potential"` (check `propertyTypeEn.toLowerCase().includes("condo")` OR description contains tourist-zone keywords)
    - `Land > 5000m² → "Investment Property"` (check `propertyTypeEn` includes "Land" AND `lotSizeM2 >= 5000`)
    - `"retirement" in description → "Retire"` (case-insensitive match on `publicRemarksEn`)
  - [ ] **DO NOT** hardcode tag names anywhere outside this file — import `LifestyleTag` as the type throughout.

- [ ] Task 2: Create `src/lib/sync/lifestyle-tagger.ts` (AC: #1–#8)
  - [ ] Add `import "server-only"` at the very top (Architecture §3 — all `src/lib/sync/**` modules use this).
  - [ ] Import `LIFESTYLE_TAG_RULES` from `@/lib/constants/lifestyle-tags`.
  - [ ] Import `RawProperty` from `@/types/remax-api`.
  - [ ] Export `function applyLifestyleTags(raw: RawProperty, existingTags: string[]): string[]`.
    - Runs each rule from `LIFESTYLE_TAG_RULES` against `raw`.
    - Collects all matching tag names.
    - **Merges** matching tags with `existingTags` (manual overrides preserved — union, not replace).
    - Returns deduplicated array (use `[...new Set([...existingTags, ...newTags])]`).
    - Returns `existingTags` unchanged if no new rules match (no-op for UNCHANGED — handled by pipeline).
  - [ ] Export `interface TaggingResult { apiId: string; tags: string[]; tagged: boolean }`.
  - [ ] Export `function tagBatch(properties: Array<{ raw: RawProperty; existingTags: string[] }>): TaggingResult[]`.
    - Synchronous (no async — pure rule evaluation, no I/O).
    - Returns one `TaggingResult` per input item.
    - `tagged` = true if `tags.length > existingTags.length` (i.e., new tags were added).

- [ ] Task 3: Create DB helpers in `src/lib/db/queries/properties.ts` (AC: #7, #9)
  - [ ] Export `async function fetchPropertyLifestyleTags(apiIds: string[]): Promise<Map<string, string[]>>`.
    - Batch-fetches `{ apiId, lifestyleTags }` for all given apiIds in a single query using `inArray`.
    - Returns a `Map<apiId, string[]>` for O(1) lookup in the pipeline.
    - Returns empty map if `apiIds` is empty (guard: `if (apiIds.length === 0) return new Map()`).
    - Use `inArray(properties.apiId, apiIds)` — `inArray` is already imported from `drizzle-orm`.
  - [ ] Export `async function updatePropertyLifestyleTags(apiId: string, tags: string[]): Promise<void>`.
    - Follow EXACT same Drizzle update pattern as `updatePropertyImages` and `updatePropertyTranslations` already in this file.
    - Set columns: `lifestyleTags: tags`, `syncedAt: new Date()`, `updatedAt: new Date()`.
  - [ ] **CRITICAL:** Do NOT add direct `db` imports to `pipeline.ts`. ALL DB access goes through `src/lib/db/queries/properties.ts` — this is the established pattern across the entire pipeline.

- [ ] Task 4: Add `tagsQueued` to sync-log schema and result (AC: #9)
  - [ ] In `src/lib/db/schema/sync-logs.ts`, add: `tagsQueued: integer("tags_queued").notNull().default(0)`.
  - [ ] Add the column AFTER `translationsQueued` (line 15), before `imagesOptimized`.
  - [ ] Generate migration: `npm run db:generate` (creates new file in `src/lib/db/migrations/`). Apply to dev DB: `npm run db:migrate`.
  - [ ] In `src/lib/sync/pipeline.ts`, add `tagsQueued: number` to `SyncPipelineResult` interface.
  - [ ] Add `"tagging_error"` to the `ParseError.scope` union in `src/types/remax-api.ts`.

- [ ] Task 5: Integrate lifestyle-tagger into `src/lib/sync/pipeline.ts` (AC: #8, #9, NFR15)
  - [ ] Import `tagBatch` from `./lifestyle-tagger`.
  - [ ] Import `fetchPropertyLifestyleTags` and `updatePropertyLifestyleTags` from `@/lib/db/queries/properties`.
  - [ ] Add lifestyle tagging step AFTER image optimization (Step 7b) and BEFORE the error collection block — this is **Architecture §5 Step 6** ("GEO-TAG + LIFESTYLE-TAG").
  - [ ] **Fetch existing tags** via `fetchPropertyLifestyleTags(apiIds)` — do NOT add direct `db` imports to `pipeline.ts` (all DB access through queries/).
  - [ ] Build the batch input: `[...diff.new, ...diff.updated].map(raw => ({ raw, existingTags: existingTagsMap.get(raw.apiId) ?? [] }))`.
  - [ ] Call `tagBatch(batchInput)` — synchronous call (no `await`).
  - [ ] For each result where `result.tagged === true`, call `await updatePropertyLifestyleTags(result.apiId, result.tags)`.
  - [ ] Set `tagsQueued = batchInput.length` (count of properties processed, not just those tagged).
  - [ ] Add `tagsQueued` to the `updateSyncLog` call and to the returned `SyncPipelineResult`.
  - [ ] **IMPORTANT**: Tagging applies to `diff.new` and `diff.updated` ONLY. Zero writes for `diff.unchanged` (NFR15).

- [ ] Task 6: Tests (AC: #10)
  - [ ] Create `tests/unit/sync/lifestyle-tagger.spec.ts` (new file — ATDD scaffold for story 2.6).
  - [ ] Un-skip all lifestyle-tagger tests (they will be scaffolded as skipped by ATDD agent first — coordinate with Step 2).
  - [ ] Test `applyLifestyleTags`:
    - Condo + tourist-zone description → receives `"Rental Potential"` tag.
    - Large land lot (≥ 5000m²) → receives `"Investment Property"` tag.
    - Property description with "retirement" → receives `"Retire"` tag.
    - Property matching multiple rules → receives all applicable tags (deduped).
    - Property with existing manual tag → existing tag preserved, new tags added.
    - Property with no rule match → returns existing tags unchanged.
  - [ ] Test `tagBatch`:
    - Batch of mixed properties → correct `tagged: true/false` per item.
    - Tag deduplication: same tag from two rules → stored only once.
  - [ ] Update `tests/unit/sync/pipeline-happy-path.spec.ts`: mock `tagBatch` (from `./lifestyle-tagger`), `fetchPropertyLifestyleTags`, and `updatePropertyLifestyleTags` (both from `@/lib/db/queries/properties`) to prevent real rule evaluation and DB calls.
  - [ ] Update `tests/unit/sync/pipeline-error-handling.spec.ts`: add `tagBatch`, `fetchPropertyLifestyleTags`, and `updatePropertyLifestyleTags` mocks.
  - [ ] Update `tests/unit/sync/pipeline-image-integration.spec.ts`: add `tagBatch`, `fetchPropertyLifestyleTags`, and `updatePropertyLifestyleTags` mocks.
  - [ ] Update `tests/unit/sync/sync-route.spec.ts`: add `tagBatch`, `fetchPropertyLifestyleTags`, and `updatePropertyLifestyleTags` mocks.
  - [ ] Update `tests/unit/db/properties.spec.ts`: add `fetchPropertyLifestyleTags` and `updatePropertyLifestyleTags` tests (un-skip if scaffolded by ATDD).
  - [ ] Test factories: `makeRawProperty()` in `tests/unit/sync/factories.ts` is already available — use it. Do NOT redefine it.

- [ ] Task 7: CI verification (AC: #10)
  - [ ] `npm run typecheck` → 0 errors.
  - [ ] `npm run lint` → 0 errors.
  - [ ] `npm run format:check` → pass.
  - [ ] `npm run build` → pass.
  - [ ] `npm test` → all pass, 0 new failures.

## Dev Notes

### Architecture Compliance

- **Pre-declared file (Architecture §3):** `src/lib/sync/lifestyle-tagger.ts` is explicitly listed in the architecture source tree as `# Auto lifestyle tag assignment`. Create at exactly this path — do NOT create `src/lib/sync/tagger.ts`, `src/lib/sync/tag-engine.ts`, or any variant.
- **Pre-declared file (Architecture §3):** `src/lib/constants/lifestyle-tags.ts` is explicitly listed as `# Tag definitions + auto-tag rules`. Create at exactly this path — do NOT create `src/lib/constants/tags.ts` or any variant.
- **server-only (AR16/NFR11):** `import "server-only"` MUST be at the very top of `src/lib/sync/lifestyle-tagger.ts`. ALL files under `src/lib/sync/**` use this boundary.
- **Shared constants file:** `src/lib/constants/lifestyle-tags.ts` must NOT have `"server-only"` or `"use client"` — same pattern as `src/lib/constants/glossary.ts` and `src/lib/constants/offices.ts`.
- **Pipeline step order (Architecture §5):** Lifestyle tagging is STEP 6 ("GEO-TAG + LIFESTYLE-TAG"). Current pipeline: Step 7a = translate, Step 7b = image optimization. Tagging goes AFTER image optimization (Step 7b) but geo-tagging (community assignment, Step 6 in architecture) is deferred to Epic 6 Story 6.5 — implement lifestyle tagging only.
- **Manual override preservation (FR49 + AC #7):** The architecture explicitly states "Preserve manual overrides (admin-set tags/communities)." Auto-tagging must MERGE new tags with existing ones, NEVER overwrite. Use `[...new Set([...existingTags, ...autoTags])]`.
- **Incremental processing (NFR15):** Tag ONLY `diff.new` and `diff.updated`. Zero DB writes for `diff.unchanged`. The pipeline already skips UNCHANGED in other steps — follow the same pattern.
- **Properties column type:** `lifestyleTags` is `text("lifestyle_tags").array().notNull().default(sql\`'{}'::text[]\`)` — it is a PostgreSQL `text[]` array, NOT a JSONB column. Drizzle maps it as `string[]` in TypeScript. Pass `tags: string[]` directly to `.set({ lifestyleTags: tags })`.

### DB Query Pattern for Fetching Existing Tags (Batch)

Add `fetchPropertyLifestyleTags` to `src/lib/db/queries/properties.ts` — the pipeline MUST use this function instead of adding direct `db` access to `pipeline.ts`. This follows the established abstraction pattern (pipeline only imports from `queries/`).

```ts
// In src/lib/db/queries/properties.ts
export async function fetchPropertyLifestyleTags(
  apiIds: string[],
): Promise<Map<string, string[]>> {
  if (apiIds.length === 0) return new Map();
  const rows = await db
    .select({ apiId: properties.apiId, lifestyleTags: properties.lifestyleTags })
    .from(properties)
    .where(inArray(properties.apiId, apiIds));
  return new Map(rows.map((r) => [r.apiId, r.lifestyleTags]));
}
```

For **new** properties (just inserted), rows will return `lifestyleTags = []` (schema default). Safe — union on empty array is a no-op.

In `pipeline.ts`:
```ts
const existingTagsMap = await fetchPropertyLifestyleTags(
  [...diff.new, ...diff.updated].map((r) => r.apiId),
);
```

### DB Update Pattern (follow existing helpers)

```ts
// In src/lib/db/queries/properties.ts — follow updatePropertyImages pattern exactly
export async function updatePropertyLifestyleTags(
  apiId: string,
  tags: string[],
): Promise<void> {
  await db
    .update(properties)
    .set({
      lifestyleTags: tags,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(properties.apiId, apiId));
}
```

### sync-log Schema Addition

The `sync_logs` table needs a new column. Insert after `translationsQueued` (line 15 of schema):

```ts
tagsQueued: integer("tags_queued").notNull().default(0),
```

After editing the schema, run:
```bash
npm run db:generate   # creates new migration file in src/lib/db/migrations/
npm run db:migrate    # applies it via tsx src/lib/db/migrate.ts
```

Check existing migration files in `src/lib/db/migrations/` to ensure no naming collision.

### ParseError Scope Extension

Add `"tagging_error"` to the union in `src/types/remax-api.ts`:

```ts
scope: "property" | "agent" | "lot_size_warning" | "image_error" | "translation_error" | "tagging_error";
```

Even if tagging errors are unlikely (pure synchronous rule evaluation), defining the scope keeps the error system extensible.

### Pipeline Integration Pattern (follow Story 2.5 translator pattern)

Insert tagging step after image optimization (Step 7b). Follow the EXACT same pattern as `translateBatch` integration in pipeline.ts:

```ts
// Step 7c: Lifestyle tagging — ONLY new/updated listings (Architecture §5 Step 6, AC #8, NFR15)
let tagsQueued = 0;

if (diff.new.length + diff.updated.length > 0) {
  const existingTagsMap = await fetchPropertyLifestyleTags(
    [...diff.new, ...diff.updated].map((r) => r.apiId),
  );

  const batchInput = [...diff.new, ...diff.updated].map((raw) => ({
    raw,
    existingTags: existingTagsMap.get(raw.apiId) ?? [],
  }));
  tagsQueued = batchInput.length;

  const taggingResults = tagBatch(batchInput);

  for (const result of taggingResults) {
    if (result.tagged) {
      await updatePropertyLifestyleTags(result.apiId, result.tags);
    }
  }
}
```

Then include `tagsQueued` in `updateSyncLog` call and in `SyncPipelineResult`.

### Lifestyle Tag Constants Structure

```ts
// src/lib/constants/lifestyle-tags.ts
import type { RawProperty } from "@/types/remax-api";

export const LIFESTYLE_TAGS = [
  "Rental Potential",
  "Investment Property",
  "Vacation Home",
  "Retire",
  "Commercial",
] as const;

export type LifestyleTag = (typeof LIFESTYLE_TAGS)[number];

export interface LifestyleTagRule {
  tag: LifestyleTag;
  match: (raw: RawProperty) => boolean;
}

export const LIFESTYLE_TAG_RULES: LifestyleTagRule[] = [
  {
    tag: "Rental Potential",
    match: (raw) => raw.propertyTypeEn.toLowerCase().includes("condo"),
    // Extend in future: add tourist-zone area check once area data is linked
  },
  {
    tag: "Investment Property",
    match: (raw) =>
      (raw.propertyTypeEn.toLowerCase().includes("land") ||
        raw.propertyTypeEn.toLowerCase().includes("lot")) &&
      (raw.lotSizeM2 ?? 0) >= 5000,
  },
  {
    tag: "Retire",
    match: (raw) =>
      (raw.publicRemarksEn ?? "").toLowerCase().includes("retirement"),
  },
];
```

**Rules are data — adding a new rule means adding one object to this array. Zero code changes elsewhere.**

### File Structure Target

```
src/
├── lib/
│   ├── sync/
│   │   └── lifestyle-tagger.ts          ← NEW (Task 2)
│   ├── constants/
│   │   └── lifestyle-tags.ts            ← NEW (Task 1)
│   └── db/
│       ├── queries/
│       │   └── properties.ts            ← EDIT: add fetchPropertyLifestyleTags() + updatePropertyLifestyleTags()
│       └── schema/
│           └── sync-logs.ts             ← EDIT: add tagsQueued column
├── types/
│   └── remax-api.ts                     ← EDIT: add "tagging_error" scope

src/lib/sync/pipeline.ts                 ← EDIT: add tagging step, tagsQueued

tests/unit/sync/
└── lifestyle-tagger.spec.ts             ← NEW (Task 6)
```

### Anti-Pattern Guardrails (DO NOT)

1. **DO NOT** put tagging rules inline in `lifestyle-tagger.ts` — they belong in `src/lib/constants/lifestyle-tags.ts` (configurable, per Architecture §3 and AC #6).
2. **DO NOT** overwrite `lifestyleTags` with only auto-computed tags — always MERGE with existing tags to preserve manual overrides (FR49 AC #7).
3. **DO NOT** use `Promise.all` or async operations in `tagBatch` — it is synchronous pure rule evaluation (no I/O).
4. **DO NOT** translate or tag `diff.unchanged` properties — zero DB writes for unchanged (NFR15).
5. **DO NOT** store tags in a separate `tags` table — use `properties.lifestyle_tags` (text array column, already exists in schema).
6. **DO NOT** create the `lifestyle_tags` column — it already exists in `src/lib/db/schema/properties.ts` (`lifestyleTags: text("lifestyle_tags").array()`). Do NOT add a migration for it.
7. **DO NOT** forget to fetch existing tags before computing new ones — skipping this breaks manual override preservation (AC #7).
8. **DO NOT** add `"server-only"` to `src/lib/constants/lifestyle-tags.ts` — it is a shared constants file (imported by Client Components in Epic 3 for filter UI).
9. **DO NOT** move the tagging step before image optimization — tagging is Step 6 in the architecture, images are Step 5.
10. **DO NOT** hardcode `"Rental Potential"` or other tag strings anywhere outside `src/lib/constants/lifestyle-tags.ts` — always import `LifestyleTag` type.
11. **DO NOT** commit `.env` files or secrets.
12. **DO NOT** call `db.select` from inside `lifestyle-tagger.ts` — it must have NO DB dependency (pure function module). All DB access lives in `pipeline.ts` and `queries/properties.ts`.

### Previous Story Intelligence (Stories 2.4 + 2.5)

- **Pipeline step-insertion pattern:** Follow Story 2.5's `translateBatch` integration exactly. Add new step: import the module, add the step in correct position, accumulate results, write DB, add count to `updateSyncLog`.
- **`vi.hoisted()` for mock primitives:** Stories 2.4 and 2.5 tests used `vi.hoisted()` to fix Vitest hoisting bugs with `vi.mock()` factories. Use the same pattern in `lifestyle-tagger.spec.ts` if mocks need pre-declared variables.
- **`server-only` boundary:** Every file under `src/lib/sync/**` uses `import "server-only"` as first line. `lifestyle-tagger.ts` is under `src/lib/sync/` — the rule applies.
- **Test factories:** `tests/unit/sync/factories.ts` exports `makeRawProperty()`. Use it — do NOT redefine the factory.
- **Pipeline test mocking:** `pipeline-happy-path.spec.ts` already mocks `optimizePropertyImages`, `updatePropertyImages`, `translateBatch`, `updatePropertyTranslations`. Add `tagBatch` mock in the same `vi.mock()` block to prevent real rule evaluation during pipeline tests.
- **`inArray` import:** `inArray` is already imported from `drizzle-orm` in `properties.ts` (confirmed in codebase). No new import needed there. `pipeline.ts` does NOT import `drizzle-orm` directly — keep it that way; use the new `fetchPropertyLifestyleTags` query function.
- **Existing `upsertProperty` sets `lifestyleTags: []`:** This is the INSERT default. On first sync, the tag array is empty. The tagger will add auto-tags on top. On subsequent syncs, existing tags (auto or manual) are fetched from DB and merged.

### Key Differences from Story 2.5 (Translator)

| Aspect | Story 2.5 (Translator) | Story 2.6 (Tagger) |
|--------|----------------------|---------------------|
| External I/O | DeepL HTTP API | None (pure function) |
| Async | Yes (`async/await`) | No (synchronous) |
| Error handling | Per-item try/catch | Rules can't throw (safe) |
| Skip logic | UNCHANGED (NFR15) | UNCHANGED (NFR15) |
| Override | Preserve API-provided ES | Preserve admin-set tags |
| DB write | `updatePropertyTranslations` | `updatePropertyLifestyleTags` |
| New file | `translator.ts` (sync/) | `lifestyle-tagger.ts` (sync/) |
| Constants | `glossary.ts` (constants/) | `lifestyle-tags.ts` (constants/) |

### ATDD Artifacts (from test-design-epic-2.md)

- Test scenario priority: P0 — "Manual lifestyle tag preserved on re-sync (Unit)"
- Test scenario priority: P1 — "Auto-tagging: condo → 'Rental Potential' (Unit)"
- Test scenario priority: P1 — "Rule config: new rule without code change (Integration)"
- Test scenario: "Tag deduplication: same tag from two rules → stored only once" (Unit)
- Test scenario: "Large rule set: 50+ rules → tagging still completes under 30s" (Performance — optional)
- Risk R-006: "Lifestyle tag manual overrides reset on re-sync" — P0, must test
- Fixture: `LifestyleRuleConfig` — JSON fixture with sample tagging rules
- Unit test target: `tests/unit/sync/lifestyle-tagger.spec.ts` (new)

### References

- Architecture §3 Source Tree: `src/lib/sync/lifestyle-tagger.ts` and `src/lib/constants/lifestyle-tags.ts` [Source: `_bmad-output/planning-artifacts/architecture.md` lines 299, 327]
- Architecture §5 Sync Pipeline Step 6: GEO-TAG + LIFESTYLE-TAG with configurable rules from `constants/lifestyle-tags.ts`, preserve manual overrides [Source: `_bmad-output/planning-artifacts/architecture.md` lines 656–664]
- PRD FR49: Auto-tag listings with lifestyle tags based on configurable attribute rules, with manual override capability [Source: `_bmad-output/planning-artifacts/prd.md` line 575]
- PRD NFR15: Incremental processing — only process changed content [Source: `_bmad-output/planning-artifacts/prd.md`]
- Epics Story 2.6 acceptance criteria [Source: `_bmad-output/planning-artifacts/epics.md` lines 997–1025]
- Story 2.1 DB schema: `properties.lifestyle_tags` (text array, default `'{}'`) [Source: `src/lib/db/schema/properties.ts` line 40]
- Story 2.1 DB schema: `idx_properties_tags` GIN index on `lifestyle_tags` [Source: `src/lib/db/schema/properties.ts` line 72]
- Story 2.3/2.4/2.5 Pipeline: `src/lib/sync/pipeline.ts` — integration point [Source: codebase]
- Test design: Story 2.6 P0/P1 test scenarios, Risk R-006 [Source: `_bmad-output/test-artifacts/test-design-epic-2.md`]
- GH Issue: #83

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
