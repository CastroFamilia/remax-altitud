---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-27'
storyId: '6.5'
storyKey: 6-5-community-geo-fence-auto-tagging
storyFile: _bmad-output/implementation-artifacts/6-5-community-geo-fence-auto-tagging.md
atddChecklistPath: _bmad-output/implementation-artifacts/atdd-checklist-6-5-community-geo-fence-auto-tagging.md
generatedTestFiles:
  - tests/unit/sync/geo-tagger.spec.ts
---

# ATDD Checklist: Story 6.5 — Community Geo-Fence Auto-Tagging

## TDD Red Phase (Current)

All test scaffolds generated with `it.skip()` — RED PHASE.

- Unit Tests: 4 tests (all skipped)
  - `geo-tagger.spec.ts`: 4 tests — bulk tagging, manual override preservation, relocation/movement

## Acceptance Criteria Coverage

| AC | Description | Test File | Test IDs |
|----|-------------|-----------|----------|
| AC #1 | Unassigned properties with coordinates inside community polygon assigned matching `community_id` | `geo-tagger.spec.ts` | 6.5-UNIT-001 |
| AC #2 | Coordinates change during sync to inside a different community updates `community_id` | `geo-tagger.spec.ts` | 6.5-UNIT-003 |
| AC #3 | Coordinates change during sync to outside all communities resets `community_id` to NULL | `geo-tagger.spec.ts` | 6.5-UNIT-004 |
| AC #4 | Preserves manual override (admin community assignment) when coordinates do not change | `geo-tagger.spec.ts` | 6.5-UNIT-002 |
| AC #5 | Drawing and saving a new community geo-fence populates community on next sync run | Covered by bulk tagging loop | 6.5-UNIT-001 |
| AC #6 | Uses PostGIS `ST_Within` for spatial query efficiency | `geo-tagger.spec.ts` | 6.5-UNIT-001 |
| AC #7 | Extends Epic 2 property update sync stage | Covered by sync pipeline integration | - |

## Test Strategy

### Stack Detected
`fullstack` — Next.js with Drizzle ORM and PostgreSQL (PostGIS)

### Execution Mode
`sequential` (single-agent workflow)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit / Integration | Vitest (node environment) | `tests/unit/sync/geo-tagger.spec.ts` | Bulk tagging and atomic CASE update logic |

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1 & 2: PostGIS Custom Types and Drizzle Schema Column
- Add the `GeoPolygon` TypeScript type and implementation in `src/lib/db/types/postgis.ts`.
- Uncomment/enable the `geoFence` column inside `src/lib/db/schema/communities.ts`.

### Task 3: Drizzle Migration
- Run `npm run db:generate` to generate the schema migration.
- Manually check the SQL file to remove outer quotes around `geography(Polygon, 4326)` if they exist.
- Run `npm run db:migrate` to update the local database.

### Task 4 & 5: Coordinate-Difference and Geo-Tagger Utility
1. Create `src/lib/sync/geo-tagger.ts` and define `autoTagCommunities` returning tagged count.
2. Remove `it.skip()` from `tests/unit/sync/geo-tagger.spec.ts`.
3. Run tests using: `npx vitest run tests/unit/sync/geo-tagger.spec.ts`.
4. Verify tests pass successfully.

### Task 6: Sync Pipeline Integration
- Add `autoTagCommunities` into `runSyncPipeline` (Stage 7d: Community geo-tagging).

## Implementation Guidance

### Files to Create / Modify
```
src/
  lib/
    db/
      types/
        postgis.ts                     ← MODIFY (define geographyPolygon custom type)
      schema/
        communities.ts                 ← MODIFY (enable geoFence geographyPolygon column)
      queries/
        properties.ts                  ← MODIFY (add atomic CASE coordinate change condition to upsertProperty)
    sync/
      geo-tagger.ts                    ← NEW (autoTagCommunities spatial query runner)
      pipeline.ts                      ← MODIFY (integrate autoTagCommunities in Step 7d)
tests/
  fixtures/
    community-factories.ts             ← MODIFY (add matching geography / geoFence values)
  unit/
    sync/
      geo-tagger.spec.ts               ← NEW (red-phase Vitest unit test)
```

### Critical Patterns
- CAST geometries: Postgres `ST_Within` performs best when casting geography elements explicitly, e.g., `ST_Within(p.geo::geometry, c.geo_fence::geometry)`.
- Use Drizzle `sql` helper with CASE statement to avoid pre-fetching data and to guarantee atomicity of override preservation.

## ATDD Artifacts

- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-6-5-community-geo-fence-auto-tagging.md`
- Unit tests: `tests/unit/sync/geo-tagger.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/6-5-community-geo-fence-auto-tagging.md`
