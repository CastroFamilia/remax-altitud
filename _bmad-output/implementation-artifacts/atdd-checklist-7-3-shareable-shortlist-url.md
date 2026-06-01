---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-28'
storyId: '7.3'
storyKey: 7-3-shareable-shortlist-url
storyFile: _bmad-output/implementation-artifacts/7-3-shareable-shortlist-url.md
atddChecklistPath: _bmad-output/implementation-artifacts/atdd-checklist-7-3-shareable-shortlist-url.md
generatedTestFiles:
  - tests/unit/actions/shortlist-shares.spec.ts
  - tests/unit/shortlist/shared-shortlist-page.spec.tsx
  - tests/e2e/shortlist-sharing.spec.ts
---

# ATDD Checklist: Story 7.3 — Shareable Shortlist URL

## TDD Red Phase (Current)

All test scaffolds generated with `describe.skip()` or `test.skip()` — RED PHASE.

- **Unit/Action Tests**: 4 tests (all skipped)
  - `tests/unit/actions/shortlist-shares.spec.ts`: covers querying database properties, validating existing and visible properties, generating short unique share IDs, and expired status calculation.
- **Component Unit Tests**: 3 tests (all skipped)
  - `tests/unit/shortlist/shared-shortlist-page.spec.tsx`: covers loading dynamic shared layouts, rendering read-only property cards, syncing coordinates to MapView, showing information banner, and handling friendly expiration states.
- **E2E Tests**: 5 tests (all skipped)
  - `tests/e2e/shortlist-sharing.spec.ts`: full integration user journeys covering the "Share my shortlist" action, clipboard copying with toast confirmation, loading dynamic read-only listings and Mapbox GL pins, localized Spanish translations, and meta robots noindex crawler blocking.

## Acceptance Criteria Coverage

| AC | Description | Test Level & File | Test/Assert IDs Covered |
|----|-------------|-------------------|--------------------------|
| AC #1 | "Share my shortlist" button POSTs to `/api/shortlist` and returns unique share URL | E2E: `shortlist-sharing.spec.ts` | E2E: "Tapping 'Share my shortlist' calls POST /api/shortlist..." |
| AC #2 | Share URL loads read-only page with properties, specs, and mini-map | Unit: `shared-shortlist-page.spec.tsx`<br>E2E: `shortlist-sharing.spec.ts` | Unit: "should render properties in read-only mode..."<br>E2E: "Dynamic shared URL loads read-only page..." |
| AC #3 | `shortlist_shares` table stores: `share_id`, `property_ids`, `locale`, `created_at`, `expires_at` | Unit: `shortlist-shares.spec.ts` | Unit: "should successfully create a shortlist share..." |
| AC #4 | Friendly expiration message displays after 30 days | Unit: `shortlist-shares.spec.ts`<br>Unit: `shared-shortlist-page.spec.tsx`<br>E2E: `shortlist-sharing.spec.ts` | Unit: "should return isExpired true..."<br>Unit: "should render the expired state message..."<br>E2E: "Expired shared URL renders friendly message..." |
| AC #5 | Share URL loads using the current viewer's browser locale | E2E: `shortlist-sharing.spec.ts` | E2E: "Opening shared URL in Spanish loads interface..." |
| AC #6 | Automatically copy URL to clipboard with "Link copied! Share it with anyone." toast | E2E: `shortlist-sharing.spec.ts` | E2E: "Tapping 'Share my shortlist' calls POST /api/shortlist..." |
| AC #7 | Endpoint validates all property IDs exist and are currently visible | Unit: `shortlist-shares.spec.ts` | Unit: "should fail to create a share if any property ID does not exist..." |

## Test Strategy

### Stack Detected
`fullstack` — Next.js with Vitest (unit/component) + Playwright (E2E)

### Execution Mode
`sequential` (Step 2 ATDD orchestration)

### Test Levels Used

| Level | Tool | Files | Purpose |
|-------|------|-------|---------|
| Unit (Actions) | Vitest | `tests/unit/actions/shortlist-shares.spec.ts` | Verifies DB select/insert queries, expiration bounds, and validation checks. |
| Component (jsdom) | Vitest | `tests/unit/shortlist/shared-shortlist-page.spec.tsx` | Validates read-only component rendering, informational banners, map pin filtering, and expired empty states. |
| E2E | Playwright | `tests/e2e/shortlist-sharing.spec.ts` | Validates end-to-end flow: database persistence, clipboard writing, dynamic pages load, locale formatting, and SEO robots meta blocking. |

## Next Steps (Task-by-Task Activation)

During implementation of each task, follow the TDD red-green-refactor cycle:

### Task 1 & 2: Define Schema & Run Migrations
- Implement schema in `src/lib/db/schema/shortlist-shares.ts` and generate/apply migrations.

### Task 3 & 4: Implement POST `/api/shortlist` & Server Action
1. Open `tests/unit/actions/shortlist-shares.spec.ts`.
2. Change `describe.skip(...)` to `describe(...)` to activate server action unit tests.
3. Run `npm test -- tests/unit/actions/shortlist-shares.spec.ts`.
4. Confirm tests FAIL.
5. Implement `createShortlistShare` and `getSharedShortlist` server actions, ensuring `isVisible = true` validation is fully enforced.
6. Verify unit tests now PASS!

### Task 5: Implement Dynamic Shared Page
1. Open `tests/unit/shortlist/shared-shortlist-page.spec.tsx`.
2. Change `describe.skip(...)` to `describe(...)` to activate component tests.
3. Run `npm test -- tests/unit/shortlist/shared-shortlist-page.spec.tsx` → confirm failures.
4. Implement `src/app/[locale]/shortlist/[shareId]/page.tsx` with robots noindex metadata.
5. Implement Client component `src/components/shortlist/shared-shortlist-page-client.tsx` using lazy loaded Mapbox mini-map wrapper `MapView`.
6. Verify unit tests PASS!

### E2E Validation
1. Open `tests/e2e/shortlist-sharing.spec.ts`.
2. Remove `test.skip` progressively from E2E scenarios.
3. Run: `npx playwright test tests/e2e/shortlist-sharing.spec.ts` to verify full feature integration on chromium, firefox, and webkit!

## Implementation Guidance

### New Files to Create
```
src/
  lib/
    db/
      schema/
        shortlist-shares.ts                  ← NEW (Drizzle DB table schema)
  app/
    api/
      shortlist/
        route.ts                             ← NEW (POST route handler)
    [locale]/
      shortlist/
        [shareId]/
          page.tsx                           ← NEW (Dynamic dynamic route server page)
  components/
    shortlist/
      shared-shortlist-page-client.tsx       ← NEW (Read-only list, banner, map)
tests/
  unit/
    actions/
      shortlist-shares.spec.ts               ← NEW (Vitest Server Action tests)
    shortlist/
      shared-shortlist-page.spec.tsx         ← NEW (Vitest Component tests)
  e2e/
    shortlist-sharing.spec.ts                ← NEW (Playwright E2E tests)
```

### data-testid Contract (immutable)
- `property-card-${id}` — Read-only saved property card root wrapper
- `readonly-badge` — Badge element indicating card is in read-only mode
- `map-view` — Lazy-loaded mini-map component wrapper
- `header-shortlist-count` — Nav bar persistent count badge

### Critical Patterns
- **Next.js Server Page i18n Metadata**: Define `robots: { index: false, follow: false }` directly in the dynamic page `generateMetadata` block to block crawler indexing.
- **Next.js Dynamic Imports**: Lazy load Mapbox coordinates maps using:
  ```typescript
  import { MapView } from "@/components/map/map-view-loader";
  ```
  This guarantees Playwright accessibility metrics, bundles compliance, and prevents Cumulative Layout Shifts.

## ATDD Artifacts
- Checklist: `_bmad-output/implementation-artifacts/atdd-checklist-7-3-shareable-shortlist-url.md`
- Unit tests: `tests/unit/actions/shortlist-shares.spec.ts`, `tests/unit/shortlist/shared-shortlist-page.spec.tsx`
- E2E tests: `tests/e2e/shortlist-sharing.spec.ts`
- Story file: `_bmad-output/implementation-artifacts/7-3-shareable-shortlist-url.md`
