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
storyId: '2.6'
storyKey: 2-6-lifestyle-tag-auto-tagging
storyFile: _bmad-output/implementation-artifacts/2-6-lifestyle-tag-auto-tagging.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-2-6-lifestyle-tag-auto-tagging.md
generatedTestFiles:
  - tests/unit/sync/lifestyle-tagger.spec.ts
  - tests/unit/db/properties.spec.ts (extended with Story 2.6 scaffolds)
  - tests/unit/sync/pipeline-happy-path.spec.ts (mock stubs added)
  - tests/unit/sync/pipeline-error-handling.spec.ts (mock stubs added)
  - tests/unit/sync/pipeline-image-integration.spec.ts (mock stubs added)
  - tests/unit/sync/sync-route.spec.ts (mock stubs added)
inputDocuments:
  - _bmad-output/implementation-artifacts/2-6-lifestyle-tag-auto-tagging.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/test-artifacts/test-design-epic-2.md
  - _bmad/tea/config.yaml
---

# ATDD Checklist: Story 2.6 — Lifestyle Tag Auto-Tagging

## TDD Red Phase (Current)

All scaffolded tests use `it.skip()`. The dev agent removes `it.skip()` task-by-task during implementation.

- **Unit Tests (lifestyle-tagger.spec.ts):** 20 tests (all skipped)
- **DB Query Tests (properties.spec.ts extension):** 12 tests (all skipped)
- **Pipeline Mock Stubs:** 4 files updated (mock additions, not new tests)

## Acceptance Criteria Coverage

| AC | Description | Test Location | Priority |
|----|-------------|---------------|----------|
| AC #1 | Lifestyle tags auto-assigned from LIFESTYLE_TAG_RULES | lifestyle-tagger.spec.ts | P1 |
| AC #2 | Condo → "Rental Potential" | lifestyle-tagger.spec.ts | P1 |
| AC #3 | Lot/Land ≥ 5000m² → "Investment Property" | lifestyle-tagger.spec.ts | P1 |
| AC #4 | "retirement" in description → "Retire" | lifestyle-tagger.spec.ts | P1 |
| AC #5 | Multiple matching rules → all tags, deduplicated | lifestyle-tagger.spec.ts | P1 |
| AC #6 | Rule-driven architecture (LIFESTYLE_TAG_RULES contract) | lifestyle-tagger.spec.ts | P1 |
| AC #7 | Manual overrides preserved (Risk R-006) | lifestyle-tagger.spec.ts (P0), properties.spec.ts | P0 |
| AC #8 | UNCHANGED listings: zero DB writes (NFR15) | pipeline mocks — dev agent implements in pipeline tests | P1 |
| AC #9 | tagsQueued count in sync_log | pipeline tests — dev agent adds after pipeline integration | P1 |
| AC #10 | All CI checks pass | CI verification — dev agent runs in Task 7 | P0 |

## Risk Coverage

| Risk | Description | Test | Priority |
|------|-------------|------|----------|
| R-006 | Lifestyle tag manual overrides reset on re-sync | "manual override preservation" describe block (4 tests) | P0 |

## Test Scenarios Generated

### lifestyle-tagger.spec.ts (20 tests, all it.skip)

**AC #2 — Condo → "Rental Potential" (3 tests)**
- [P1] `propertyTypeEn='Condo'` → contains "Rental Potential"
- [P1] `propertyTypeEn='Luxury Condo'` (substring match) → contains "Rental Potential"
- [P1] `propertyTypeEn='House'` → does NOT contain "Rental Potential"

**AC #3 — Large lot → "Investment Property" (6 tests)**
- [P1] `Lot/Land` + `lotSizeM2=5000` (at threshold) → contains "Investment Property"
- [P1] `Lot/Land` + `lotSizeM2=14757` → contains "Investment Property"
- [P1] `Lot/Land` + `lotSizeM2=4999` (below threshold) → does NOT contain
- [P1] `House` + `lotSizeM2=10000` (wrong type) → does NOT contain
- [P1] `Land` (variant) + `lotSizeM2=6000` → contains "Investment Property"
- [P1] `Lot/Land` + `lotSizeM2=null` → does NOT throw, does NOT contain

**AC #4 — "retirement" keyword → "Retire" (4 tests)**
- [P1] `publicRemarksEn` contains "retirement" → contains "Retire"
- [P1] `publicRemarksEn` contains "RETIREMENT" (uppercase) → contains "Retire"
- [P1] `publicRemarksEn` without keyword → does NOT contain "Retire"
- [P1] `publicRemarksEn=null` → no throw, does NOT contain "Retire"

**AC #5 — Multiple rules, deduplication (2 tests)**
- [P1] Condo + "retirement" in description → contains both "Rental Potential" AND "Retire"
- [P1] Property triggering same tag from two rules → tag appears only once

**AC #6 — Rule-driven architecture (1 test)**
- [P1] LIFESTYLE_TAG_RULES array: each rule has `tag` string and `match` function

**AC #7 — Manual override preservation / Risk R-006 (5 tests, 4 are P0)**
- [P0] existingTags=['Vacation Home'] → "Vacation Home" preserved in result
- [P0] existingTags=['Vacation Home'] + condo → both "Vacation Home" AND "Rental Potential"
- [P0] existingTags=['Rental Potential'] + condo → deduplication: appears only once
- [P0] existingTags=['Vacation Home'] + no rule match → returns ['Vacation Home'] unchanged
- [P1] existingTags=[] + no rule match → returns []

**tagBatch contract (7 tests)**
- [P0] empty input → empty array
- [P0] 2 properties → 2 TaggingResults with correct apiIds
- [P0] condo → `tagged=true`, tags includes "Rental Potential"
- [P0] house (no rule match) → `tagged=false`
- [P1] mixed batch → `tagged` flags reflect each item independently
- [P1] existing tags only, no new match → `tagged=false`, existing tag preserved
- [P1] condo + existing tag → `tagged=true`, both tags in result
- [P1] synchronous return (not a Promise)

**TaggingResult shape (1 test)**
- [P1] result has `apiId` (string), `tags` (array), `tagged` (boolean)

### properties.spec.ts (12 new it.skip tests appended)

**fetchPropertyLifestyleTags (5 tests, AC #7)**
- [P0] db.select called for non-empty apiIds
- [P0] returns Map with correct apiId key and tags value
- [P0] empty apiIds → returns empty Map without DB query
- [P1] DB returns no rows → empty Map
- [P1] DB returns 2 rows → Map has 2 entries

**updatePropertyLifestyleTags (7 tests, AC #7)**
- [P0] db.update called
- [P0] set() payload includes `lifestyleTags` array
- [P0] where() scopes to apiId
- [P1] set() payload includes `syncedAt` as Date
- [P1] set() payload includes `updatedAt` as Date
- [P1] empty tags array → `lifestyleTags: []`
- [P2] returns void (undefined)

### Pipeline Mock Additions (not new tests)

All four pipeline test files updated with Story 2.6 mock stubs:
- `@/lib/sync/lifestyle-tagger`: `tagBatch: vi.fn().mockReturnValue([])`
- `@/lib/db/queries/properties` extended with:
  - `fetchPropertyLifestyleTags: vi.fn().mockResolvedValue(new Map())`
  - `updatePropertyLifestyleTags: vi.fn().mockResolvedValue(undefined)`

## Next Steps (Task-by-Task Activation)

During implementation of each task, the dev agent:

1. **Task 1** (`src/lib/constants/lifestyle-tags.ts`): Un-skip AC #6 rule-architecture test
2. **Task 2** (`src/lib/sync/lifestyle-tagger.ts`): Un-skip ALL `applyLifestyleTags` and `tagBatch` tests in `lifestyle-tagger.spec.ts`
3. **Task 3** (`src/lib/db/queries/properties.ts`): Un-skip ALL `fetchPropertyLifestyleTags` and `updatePropertyLifestyleTags` tests in `properties.spec.ts`
4. **Task 4** (sync-log schema + migration): No new ATDD tests — CI verification
5. **Task 5** (pipeline integration): Remove `tagBatch: vi.fn()` mocks from pipeline specs, replace with meaningful assertions about `tagsQueued`
6. **Task 6** (test completion): Confirm all tests pass
7. **Task 7** (CI): `npm run typecheck && npm run lint && npm run format:check && npm run build && npm test`

## Key Assumptions & Notes

- `lifestyle-tagger.ts` is **synchronous** (no async/await) — `tagBatch` returns `T[]` not `Promise<T[]>`
- `applyLifestyleTags` accepts `(raw: RawProperty, existingTags: string[]): string[]` — pure function
- `tagBatch` accepts `Array<{ raw: RawProperty; existingTags: string[] }>`: `TaggingResult[]`
- `TaggingResult` shape: `{ apiId: string; tags: string[]; tagged: boolean }`
- `fetchPropertyLifestyleTags` is async; returns `Promise<Map<string, string[]>>`
- The `LIFESTYLE_TAG_RULES` constant lives in `src/lib/constants/lifestyle-tags.ts` (separate from tagger)
- No E2E tests needed — this is pure server-side pipeline logic with no UI surface in this story
- `makeRawProperty()` from `tests/unit/sync/factories.ts` is used throughout — not redefined
