---
stepsCompleted:
  - 'step-01-preflight-and-context'
  - 'step-02-generation-mode'
  - 'step-03-test-strategy'
  - 'step-04-generate-tests'
  - 'step-05-validate-and-complete'
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-05-28T10:45:00-06:00'
workflowType: 'testarch-atdd'
storyId: '8.5'
storyKey: '8-5-community-administration'
storyFile: '_bmad-output/implementation-artifacts/8-5-community-administration.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-8-5-community-administration.md'
generatedTestFiles:
  - 'tests/unit/admin/communities.test.ts'
  - 'tests/e2e/admin/communities.spec.ts'
inputDocuments:
  - '_bmad-output/implementation-artifacts/8-5-community-administration.md'
---

# ATDD Checklist - Epic 8, Story 5: Community Administration

**Date:** 2026-05-28
**Author:** Sebicas
**Primary Test Level:** Unit & E2E

---

## Story Summary

Enable administrators to manage (create, edit, and delete) communities with rich localized metadata, geo-fence polygons, quick facts, and site map images. Also allows administrators to manually assign or override a property's community boundary match, which is preserved and never overwritten by auto-tagging during sync pipelines.

**As an** admin
**I want** to create and manage communities with rich metadata and geo-fence polygons
**So that** I can curate premium development pages and control which properties are tagged to them.

---

## Acceptance Criteria

1. **Given** the admin community management interface
   **When** the admin creates a new community
   **Then** the admin can set: name, slug, tagline (EN/ES), description (EN/ES), hero image URL, quick facts (elevation, amenities, developer, established year, airport distance, infrastructure), and site map image URL (FR61)

2. **Given** the community creation/edit interface
   **When** the admin needs to define a geo-fence
   **Then** a map interface allows the admin to draw a polygon on an interactive Mapbox map that defines the community's geographic boundary (FR61)

3. **Given** the admin community assignment view
   **When** accessed for a specific listing
   **Then** the admin can see the auto-populated community assignment (from geo-fence match) and manually override it to a different community or remove the assignment (FR60)

4. **Given** an admin manually assigns a community to a listing
   **When** the next sync pipeline runs
   **Then** the manual override is preserved and NOT reset by auto-tagging (FR60)

5. **Given** the admin edits a community's geo-fence polygon
   **When** saved
   **Then** the next sync run re-evaluates property-community assignments based on the new polygon boundary

6. **And** community data (name, description, quick facts) is stored in the `communities` table per Architecture schema

7. **And** the geo-fence polygon is stored as a PostGIS geography `Polygon 4326` type

---

## Story Integration Metadata

- **Story ID:** `8.5`
- **Story Key:** `8-5-community-administration`
- **Story File:** `_bmad-output/implementation-artifacts/8-5-community-administration.md`
- **Checklist Path:** `_bmad-output/test-artifacts/atdd-checklist-8-5-community-administration.md`
- **Generated Test Files:** `tests/unit/admin/communities.test.ts`, `tests/e2e/admin/communities.spec.ts`

---

## Red-Phase Test Scaffolds Created

### E2E Tests (4 tests)

**File:** `tests/e2e/admin/communities.spec.ts`

- ✅ **Test:** `displays all active communities in management page`
  - **Status:** RED - Skipped (`test.describe.skip`) until implementation page is created.
  - **Verifies:** The `/admin/communities` path exists, displays communities in a searchable table, and contains the Create New Community CTA (AC1).
- ✅ **Test:** `creates a new community with drawn geo-fence and centroid calculations`
  - **Status:** RED - Skipped (`test.describe.skip`) until new community page and Mapbox drawing canvas are implemented.
  - **Verifies:** Saving the form registers community metadata, geo-fence coordinates, and quick facts correctly (AC1, AC2).
- ✅ **Test:** `edits an existing community's geo-fence polygon`
  - **Status:** RED - Skipped (`test.describe.skip`) until editing geo-fence polygon page is completed.
  - **Verifies:** Updating a community's polygon successfully stores the new geography bounds and re-evaluates auto-tag assignments (AC2, AC5).
- ✅ **Test:** `overrides a property community assignment manually and syncs`
  - **Status:** RED - Skipped (`test.describe.skip`) until manual overrides selector and preservation rules are verified.
  - **Verifies:** Manual overrides of community ID are not reset by auto-tagging sync (AC3, AC4).

### Unit Tests (6 tests)

**File:** `tests/unit/admin/communities.test.ts`

- ✅ **Test:** `createCommunityAction server action fails for unauthenticated users`
  - **Status:** RED - Skipped (`describe.skip`) until action is implemented and protected with auth guard.
  - **Verifies:** Security boundaries are enforced via `verifyAdminAuth()` check.
- ✅ **Test:** `createCommunityAction server action inserts community and triggers revalidations`
  - **Status:** RED - Skipped (`describe.skip`) until database insert logic and Next.js path revalidations are set up.
  - **Verifies:** Community insertion triggers ISR revalidations for communities, area, and search paths (AC1, AC6).
- ✅ **Test:** `updateCommunityAction server action updates community and triggers revalidations`
  - **Status:** RED - Skipped (`describe.skip`) until update community server action is operational.
  - **Verifies:** Updating a community triggers ISR revalidations for the community's detail pages, search, and index pages (AC1).
- ✅ **Test:** `deleteCommunityAction server action deletes community and triggers revalidations`
  - **Status:** RED - Skipped (`describe.skip`) until delete action is active.
  - **Verifies:** Deleting a community cleans up associations and revalidates relevant routes (AC1).
- ✅ **Test:** `updatePropertyCommunityAction server action updates property community override`
  - **Status:** RED - Skipped (`describe.skip`) until action to override community is established.
  - **Verifies:** Saving community override updates property record and revalidates property detail route (AC3).
- ✅ **Test:** `database query CRUD and updatePropertyCommunity compile correct queries`
  - **Status:** RED - Skipped (`describe.skip`) until custom drizzle queries are added to repositories.
  - **Verifies:** Direct drizzle update query formats coordinates and columns perfectly (AC6, AC7).

---

## Data Factories Created

No new factories are required. Existing property factories located at `tests/fixtures/` and drizzle schema factories will be used to populate mocked properties and communities.

---

## Fixtures Created

No new custom Playwright fixtures are required. Standard browser cookies injection for `admin_session` is configured inside E2E `beforeEach` to simulate admin role.

---

## Mock Requirements

No external mock endpoints are required. Database operations and revalidation paths will be verified through mocked drizzle database adapters and Next.js standard caching modules.

---

## Required data-testid Attributes

For E2E test robustness and stability:
- `communities-table` - The communities list table element in admin page
- `search-communities-input` - Input field to search communities by name/slug
- `create-community-btn` - The CTA button to navigate to create community form
- `community-name-input` - Input field for community name
- `community-slug-input` - Input field for community URL slug
- `community-area-select` - Area selector dropdown menu
- `community-tagline-en-input` - Tagline EN text field
- `community-tagline-es-input` - Tagline ES text field
- `community-desc-en-input` - Description EN text area
- `community-desc-es-input` - Description ES text area
- `quickfact-elevation` - Quick fact input for elevation
- `quickfact-airportDistance` - Quick fact input for airport distance
- `quickfact-internet` - Quick fact input for internet speed/provider
- `quickfact-amenities` - Quick fact input for amenities
- `quickfact-developer` - Quick fact input for developer
- `quickfact-established` - Quick fact input for established year
- `community-geofence-input` - Coordinates textarea representing drawing canvas backup
- `save-community-btn` - Save buttons inside community creation/edit form
- `property-community-override-select` - Dropdown selector in listing details page to override community

---

## Implementation Checklist

### Test: `createCommunityAction server action fails for unauthenticated users`
**File:** `tests/unit/admin/communities.test.ts`
- [ ] Implement `verifyAdminAuth` guard at the top of the action.
- [ ] Raise unauthorized error if check fails.
- [ ] Run test: `npx vitest run tests/unit/admin/communities.test.ts`

### Test: `createCommunityAction server action inserts community and triggers revalidations`
**File:** `tests/unit/admin/communities.test.ts`
- [ ] Call `createCommunity` query from the action.
- [ ] Call `revalidatePath` for communities index, search, and area page.
- [ ] Run test: `npx vitest run tests/unit/admin/communities.test.ts`

### Test: `database queries CRUD compile drizzle queries`
**File:** `tests/unit/admin/communities.test.ts`
- [ ] Expose `createCommunity`, `updateCommunity`, `deleteCommunity` inside `src/lib/db/queries/communities.ts`.
- [ ] Expose `updatePropertyCommunity` inside `src/lib/db/queries/properties.ts`.
- [ ] Run test: `npx vitest run tests/unit/admin/communities.test.ts`

---

## Running Tests

```bash
# Run all vitest unit tests
npm run test

# Run communities unit tests specifically
npx vitest run tests/unit/admin/communities.test.ts

# Run Playwright E2E tests specifically (after removing describe.skip)
npx playwright test tests/e2e/admin/communities.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written as red-phase scaffolds with `describe.skip` and `test.describe.skip`
- ✅ Fixtures and factories configured
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./resources/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-28
