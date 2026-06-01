---
stepsCompleted:
  - 'step-01-preflight-and-context'
  - 'step-02-generation-mode'
  - 'step-03-test-strategy'
  - 'step-04-generate-tests'
  - 'step-05-validate-and-complete'
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-05-28T09:56:53-06:00'
workflowType: 'testarch-atdd'
storyId: '8.4'
storyKey: '8-4-lifestyle-tag-administration'
storyFile: '_bmad-output/implementation-artifacts/8-4-lifestyle-tag-administration.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-8-4-lifestyle-tag-administration.md'
generatedTestFiles:
  - 'tests/unit/admin/lifestyle-tags.test.ts'
  - 'tests/e2e/admin/lifestyle-tags.spec.ts'
inputDocuments:
  - '_bmad-output/implementation-artifacts/8-4-lifestyle-tag-administration.md'
---

# ATDD Checklist - Epic 8, Story 4: Lifestyle Tag Administration

**Date:** 2026-05-28
**Author:** Sebicas
**Primary Test Level:** Unit & E2E

---

## Story Summary

Enable administrators to manage (add, edit, and remove) lifestyle discovery tags associated with active property listings. This facilitates the curation of discoverable lifestyle categories via a dedicated dashboard view within the admin dashboard while maintaining priority rules that prevent sync pipeline overwrites.

**As an** admin
**I want** to add, edit, and remove lifestyle tags on listings
**So that** I can curate which properties appear under specific discovery categories.

---

## Acceptance Criteria

1. **Given** the admin listing tag view **When** accessed for a specific listing **Then** the admin can see all current lifestyle tags assigned to that listing (FR59)
2. **Given** the admin tag management UI **When** the admin adds a tag (e.g., "Investment Property") to a listing **Then** the tag is appended to the listing's `lifestyle_tags` array and the listing appears in filtered search results for that tag after next ISR revalidation (FR59)
3. **Given** the admin tag management UI **When** the admin removes a tag from a listing **Then** the tag is removed from the `lifestyle_tags` array and the listing no longer appears in filtered results for that tag (FR59)
4. **Given** auto-tagging from the sync pipeline (Epic 2) **When** an admin manually overrides a tag on a listing **Then** the manual override takes precedence — the sync pipeline does not reset admin-set tags (FR49)
5. **Given** the lifestyle tag definitions **When** the admin needs to create a new tag category **Then** it can be added via the `constants/lifestyle-tags.ts` configuration (with auto-tag rules if applicable)
6. **And** tag changes are reflected on ISR-cached pages after next revalidation
7. **And** the tag administration operates through admin dashboard for MVP (FR59)

---

## Story Integration Metadata

- **Story ID:** `8.4`
- **Story Key:** `8-4-lifestyle-tag-administration`
- **Story File:** `_bmad-output/implementation-artifacts/8-4-lifestyle-tag-administration.md`
- **Checklist Path:** `_bmad-output/test-artifacts/atdd-checklist-8-4-lifestyle-tag-administration.md`
- **Generated Test Files:** `tests/unit/admin/lifestyle-tags.test.ts`, `tests/e2e/admin/lifestyle-tags.spec.ts`

---

## Red-Phase Test Scaffolds Created

### E2E Tests (4 tests)

**File:** `tests/e2e/admin/lifestyle-tags.spec.ts`

- ✅ **Test:** `displays all active property listings in tag management page`
  - **Status:** RED - Skipped (`test.describe.skip`) until implementation page is created.
  - **Verifies:** The `/admin/tags` path exists, displays listings, search filters, and lists active tags (AC1, AC7).
- ✅ **Test:** `adds a tag to a listing and revalidates`
  - **Status:** RED - Skipped (`test.describe.skip`) until tags management drawer modal is implemented.
  - **Verifies:** Adding tag "Investment Property" updates listing row and triggers server action (AC2, AC6).
- ✅ **Test:** `removes a tag from a listing`
  - **Status:** RED - Skipped (`test.describe.skip`) until unchecking tag in modal updates UI and database.
  - **Verifies:** Removing a tag updates database and listing row tags display (AC3).
- ✅ **Test:** `overrides auto-tagging from sync pipeline`
  - **Status:** RED - Skipped (`test.describe.skip`) until manual overrides are verified to take precedence.
  - **Verifies:** Sync pipeline merging preserves manually added tags (AC4).

### Unit Tests (3 tests)

**File:** `tests/unit/admin/lifestyle-tags.test.ts`

- ✅ **Test:** `updatePropertyTagsAction server action fails for unauthenticated users`
  - **Status:** RED - Skipped (`describe.skip`) until action is implemented and protected with auth guard.
  - **Verifies:** Security boundaries are enforced via `verifyAdminAuth()` check.
- ✅ **Test:** `updatePropertyTagsAction server action saves property tags and triggers revalidations`
  - **Status:** RED - Skipped (`describe.skip`) until database update logic and Next.js revalidatePath is implemented.
  - **Verifies:** revalidatePath is fired for properties detail route, search route, and main page (AC2, AC6).
- ✅ **Test:** `database query updatePropertyTags compiles drizzle update query`
  - **Status:** RED - Skipped (`describe.skip`) until drizzle update query function is created in queries file.
  - **Verifies:** Direct property `lifestyleTags` column update compiles and works correctly.

---

## Data Factories Created

No new factories are required. Existing property factories located at `tests/fixtures/` and drizzle schema factories will be used to populate mocked properties.

---

## Fixtures Created

No new custom Playwright fixtures are required. Standard browser cookies injection for `admin_session` is configured inside E2E `beforeEach` to simulate admin role.

---

## Mock Requirements

No external mock endpoints are required since the tag administration operations are executed via database mutations on local postgres schema and Next.js server actions.

---

## Required data-testid Attributes

For E2E test robustness and stability:
- `listings-tags-table` - The listings tags table element in admin page
- `search-listings-input` - Input field to search property listings by title/ref
- `listing-tags-row` - Property row representation
- `listing-ref-code` - Property reference code cell/element
- `listing-tags-chips` - active tags chips container
- `manage-tags-btn` - Row button triggering the tags editing modal/drawer
- `manage-tags-modal` - Modal drawer for editing tags
- `save-tags-btn` - Save buttons inside modal/drawer

---

## Implementation Checklist

### Test: `updatePropertyTagsAction server action fails for unauthenticated users`
**File:** `tests/unit/admin/lifestyle-tags.test.ts`
- [ ] Implement `verifyAdminAuth` guard at the top of the action.
- [ ] Raise unauthorized error if check fails.
- [ ] Run test: `npx vitest run tests/unit/admin/lifestyle-tags.test.ts`

### Test: `updatePropertyTagsAction server action saves property tags and triggers revalidations`
**File:** `tests/unit/admin/lifestyle-tags.test.ts`
- [ ] Call `updatePropertyTags` query from the action.
- [ ] Call `revalidatePath` for listing detail, search, and homepage.
- [ ] Run test: `npx vitest run tests/unit/admin/lifestyle-tags.test.ts`

### Test: `database query updatePropertyTags compiles drizzle update query`
**File:** `tests/unit/admin/lifestyle-tags.test.ts`
- [ ] Expose `updatePropertyTags` inside `src/lib/db/queries/properties.ts`.
- [ ] Build drizzle `.set({ lifestyleTags: newTags, updatedAt: new Date() })` query.
- [ ] Run test: `npx vitest run tests/unit/admin/lifestyle-tags.test.ts`

---

## Running Tests

```bash
# Run all vitest unit tests
npm run test

# Run lifestyle tag unit tests specifically
npx vitest run tests/unit/admin/lifestyle-tags.test.ts

# Run Playwright E2E tests specifically (after removing describe.skip)
npx playwright test tests/e2e/admin/lifestyle-tags.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- All tests generated as red-phase scaffolds with `test.describe.skip` and `describe.skip`.
- data-testid requirements documented.
- Implementation checklist created.

---

## Next Steps

1. **Move to DEV stage** to implement database queries, server actions, localized keys, and admin UI views.
2. **Remove skip markers** one by one as they are implemented, ensuring test transitions from red to green successfully.

---

## Knowledge Base References Applied

- **test-levels-framework.md**: Mapped AC to E2E (UI/Workflow verification) and Unit (query compilation, action rules and revalidations).
- **test-quality.md**: Applied Given-When-Then structures.
- **fixture-architecture.md**: Admin session mock structure.
