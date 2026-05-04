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
storyId: '2.4'
storyKey: 2-4-image-optimization-pipeline
storyFile: _bmad-output/implementation-artifacts/2-4-image-optimization-pipeline.md
atddChecklistPath: _bmad-output/test-artifacts/atdd-checklist-2-4-image-optimization-pipeline.md
generatedTestFiles:
  - tests/unit/sync/image-optimizer.spec.ts
  - tests/unit/sync/pipeline-image-integration.spec.ts
  - tests/unit/db/properties.spec.ts
---

# ATDD Checklist: Story 2.4 — Image Optimization Pipeline

## TDD Red Phase (Current)

All red-phase test scaffolds generated and written to disk. All tests use `it.skip()`.

- **Unit Tests (image-optimizer):** 17 tests (all skipped) — `tests/unit/sync/image-optimizer.spec.ts`
- **Unit Tests (pipeline integration):** 10 tests (all skipped) — `tests/unit/sync/pipeline-image-integration.spec.ts`
- **Unit Tests (DB helper):** 7 tests (all skipped) — `tests/unit/db/properties.spec.ts`
- **Total:** 34 red-phase test scaffolds

## Stack Detection

- **Detected stack:** `fullstack` (Next.js 15, Vitest for unit tests)
- **Test framework:** Vitest (unit tests) + Playwright (E2E, not relevant for this backend pipeline story)
- **Generation mode:** AI generation (backend pipeline — no browser recording needed)

## Acceptance Criteria Coverage

| AC  | Description                                           | Test File(s)                                | Priority |
| --- | ----------------------------------------------------- | ------------------------------------------- | -------- |
| #1  | Download source URLs with fetch, convert to WebP      | image-optimizer.spec.ts                     | P0       |
| #2  | 3 sizes: 400w, 800w, 1600w — WebP, fit:inside, q≤85  | image-optimizer.spec.ts                     | P0       |
| #3  | Write to public/property-images/{apiId}/{base}-{w}w.webp | image-optimizer.spec.ts                 | P0/P1    |
| #4  | Overwrite properties.images JSONB with OptimizedImage[] | properties.spec.ts                       | P0       |
| #5  | OptimizedImage shape: src, srcset, blurDataUrl, width:400, height, alt | image-optimizer.spec.ts | P0       |
| #6  | Use pre-encoded URLs (splitAndEncodeImages already called by parser) | image-optimizer.spec.ts | P1       |
| #7  | Non-2xx / throw → log error, continue, no crash       | image-optimizer.spec.ts                     | P0       |
| #8  | UNCHANGED properties: skip image optimization entirely | pipeline-image-integration.spec.ts         | P0       |
| #9  | UPDATED properties: re-process ALL images             | pipeline-image-integration.spec.ts          | P0       |
| #10 | Empty images[]: return {optimized:[], errors:[]}, no fetch | image-optimizer.spec.ts               | P0       |
| #11 | sync_logs.images_optimized = total variants written   | pipeline-image-integration.spec.ts          | P0       |
| #12 | typecheck/lint/build/test pass (CI verification)      | (verified at CI step, no ATDD scaffold)     | —        |

## Test Strategy

**Approach:** Unit tests for all backend logic. No E2E tests for this story (pipeline runs server-side, no UI).

**Test levels chosen:**
- **Unit:** `image-optimizer.ts` (pure function with mocked sharp/fetch/fs) — verifies all transformation logic
- **Unit:** `pipeline.ts` integration (with mocked image-optimizer) — verifies routing, counting, and sync_log update
- **Unit:** `updatePropertyImages()` (with mocked Drizzle db) — verifies correct JSONB write shape

**Risk rationale:**
- P0: download, 3-variant generation, shape correctness, error continue, empty-array short-circuit, UNCHANGED skip, imagesOptimized counter, JSONB write
- P1: output path pattern, fit:inside options, toFile call count, srcset format, pre-encoded URL passthrough, updatePropertyImages with timestamps
- P2: return type (void)

## Next Steps (Task-by-Task Activation)

During implementation of each task:

1. Remove `it.skip(` → `it(` for the tests covering the current task
2. Run tests: `npm test`
3. Verify the activated tests **fail** first (red), then **pass** after implementation (green)
4. If any activated tests fail unexpectedly after implementation, fix the implementation (feature bug) or fix the test (test bug)
5. Commit passing tests

### Task Activation Guide

| Task | Tests to activate |
| --- | --- |
| Task 2: Create OptimizedImage type | (type-only — no test scaffold needed; shape verified by image-optimizer tests) |
| Task 3: Create `image-optimizer.ts` | All tests in `image-optimizer.spec.ts` |
| Task 4: Integrate into `pipeline.ts` | All tests in `pipeline-image-integration.spec.ts` |
| Task 5: Create `updatePropertyImages` | All tests in `properties.spec.ts` |

## ATDD Artifacts

- Checklist: `_bmad-output/test-artifacts/atdd-checklist-2-4-image-optimization-pipeline.md`
- Unit tests (optimizer): `tests/unit/sync/image-optimizer.spec.ts`
- Unit tests (pipeline): `tests/unit/sync/pipeline-image-integration.spec.ts`
- Unit tests (DB): `tests/unit/db/properties.spec.ts`
