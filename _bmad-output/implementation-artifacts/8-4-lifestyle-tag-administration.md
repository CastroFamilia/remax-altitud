# Story 8.4: Lifestyle Tag Administration

Status: done

## Story

As an **admin**,
I want to add, edit, and remove lifestyle tags on listings,
so that I can curate which properties appear under specific discovery categories.

## Acceptance Criteria

1. **Given** the admin listing tag view
   **When** accessed for a specific listing
   **Then** the admin can see all current lifestyle tags assigned to that listing (FR59)

2. **Given** the admin tag management UI
   **When** the admin adds a tag (e.g., "Investment Property") to a listing
   **Then** the tag is appended to the listing's `lifestyle_tags` array and the listing appears in filtered search results for that tag after next ISR revalidation (FR59)

3. **Given** the admin tag management UI
   **When** the admin removes a tag from a listing
   **Then** the tag is removed from the `lifestyle_tags` array and the listing no longer appears in filtered results for that tag (FR59)

4. **Given** auto-tagging from the sync pipeline (Epic 2)
   **When** an admin manually overrides a tag on a listing
   **Then** the manual override takes precedence — the sync pipeline does not reset admin-set tags (FR49)

5. **Given** the lifestyle tag definitions
   **When** the admin needs to create a new tag category
   **Then** it can be added via the `constants/lifestyle-tags.ts` configuration (with auto-tag rules if applicable)

6. **And** tag changes are reflected on ISR-cached pages after next revalidation
7. **And** the tag administration operates through admin dashboard for MVP (FR59)

## Tasks / Subtasks

- [ ] 1. Expose database query `updatePropertyTags` in `src/lib/db/queries/properties.ts` to update the lifestyle tags array column. (AC: 1, 2, 3)
- [ ] 2. Create server action `updatePropertyTagsAction` in `src/app/actions/admin-tag-actions.ts` protecting it with admin auth guard and calling path revalidations. (AC: 2, 3, 4, 6)
- [ ] 3. Replace the placeholder lifestyle tags sidebar element in `src/app/[locale]/admin/layout.tsx` with an active next-intl link to `/admin/tags`. (AC: 7)
- [ ] 4. Create tags admin page `src/app/[locale]/admin/tags/page.tsx` displaying all listings in a searchable and paginated table. (AC: 1, 7)
- [ ] 5. Build a custom modal or drawer component allowing toggling checks based on the `LIFESTYLE_TAGS` constant and triggering the server action to save updates. (AC: 1, 2, 3, 5)
- [ ] 6. Translate all new labels, headers, buttons, and alert messages in `src/messages/en.json` and `src/messages/es.json` under an `AdminTags` namespace. (AC: 7)
- [ ] 7. Add comprehensive unit tests in `tests/unit/admin/lifestyle-tags.test.ts` to verify the DB query, server action guards, and path revalidations. (AC: 2, 3, 4)
- [ ] 8. Add E2E tests in `tests/e2e/admin/lifestyle-tags.spec.ts` using Playwright verifying the tag modification flow. (AC: 1, 2, 3, 7)

## Dev Notes

### Architecture & Technical Requirements

- **Database Updates & Logic**:
  - Implement the update query in a new or existing database query file `src/lib/db/queries/properties.ts`.
  - Expose a server action `updatePropertyTagsAction` in a new file `src/app/actions/admin-tag-actions.ts`.
  - Validation: Verify that only authenticated admin users can modify listing tags by enforcing the security guard `verifyAdminAuth()`.
  - Query pattern:
    ```typescript
    // To update tags for a specific property id
    await db.update(properties)
      .set({ 
        lifestyleTags: newTags, // array of strings (LifestyleTag[])
        updatedAt: new Date()
      })
      .where(eq(properties.id, id));
    ```

- **Reinvention Prevention & Single Source of Truth**:
  - **DO NOT** hardcode any lifestyle tag names or string literals in your UI or logic.
  - Always import the `LIFESTYLE_TAGS` constant from `src/lib/constants/lifestyle-tags.ts` as the single source of truth for the valid tags list.
  - **DO NOT** create a new table for tags or associate them using a join table. The `lifestyle_tags` column in the `properties` table is a GIN-indexed Postgres text array (`text[]`), mapping to `string[]` in TypeScript.
  - **Manual Override Precedence**: The sync pipeline's auto-tagging logic (`applyLifestyleTags` in `src/lib/sync/lifestyle-tagger.ts`) already merges newly matched rules with existing tags, ensuring that manually added tags are never overwritten or removed. However, to fully prevent the sync pipeline from overriding manual deletions, ensure that tag editing does not disrupt the existing sync preservation rules.

- **ISR Revalidation**:
  - After updating the tags in the database, the server action must trigger immediate on-demand ISR revalidation so that the changes are visible to visitors without delay.
  - Revalidate paths:
    - Listing detail page: `revalidatePath("/[locale]/properties/[slug]")`
    - Search page: `revalidatePath("/[locale]/search")`
    - Main homepage (which features properties): `revalidatePath("/[locale]")`

- **UI & Integration**:
  - Activate the "Lifestyle Tags" sidebar item in `src/app/[locale]/admin/layout.tsx` by replacing the stub with a proper `Link` to `/${locale}/admin/tags`.
  - Create a new page component `src/app/[locale]/admin/tags/page.tsx` that displays a list of active property listings with:
    - Search bar: search listings by title (English/Spanish) or listing reference code.
    - Pagination: handles large sets of properties gracefully.
    - A listing table showing: Thumbnail, Listing Title, Reference Code, Price, and active Lifestyle Tags (rendered as chips).
    - Manage Action: Clicking "Manage Tags" opens a modal or side drawer allowing the admin to toggle checkable tags from the full `LIFESTYLE_TAGS` list.
    - The active tags in the modal should match those currently stored on the property. Saving the tags fires the `updatePropertyTagsAction` server action.
  - Localize all UI strings in `src/messages/en.json` and `src/messages/es.json` under an `AdminTags` namespace.

### Previous Story Learning & Continuity

- Follow the pattern established in lead management for pagination, filters, and admin authentication guards (`verifyAdminAuth`).
- Ensure all Tailwind classes remain consistent with the dark slate (`slate-950`/`slate-900`) and REMAX red border highlights utilized across the dashboard center.

### References

- Lifestyle tags constants: [Source: src/lib/constants/lifestyle-tags.ts]
- Database schema for properties: [Source: src/lib/db/schema/properties.ts]
- Sync pipeline tagger logic: [Source: src/lib/sync/lifestyle-tagger.ts]
- Admin layout navigation: [Source: src/app/[locale]/admin/layout.tsx]

### Testing Requirements

- **Unit Tests**:
  - Add comprehensive unit tests in `tests/unit/admin/lifestyle-tags.test.ts` using Vitest.
  - Verify that `updatePropertyTagsAction` fails for unauthenticated requests.
  - Verify that `updatePropertyTagsAction` correctly saves the new tags list and triggers `revalidatePath` for listing, search, and homepage.
- **End-to-End Tests**:
  - Add E2E test suite in `tests/e2e/admin/lifestyle-tags.spec.ts` using Playwright.
  - Test logging in as admin, navigating to "/admin/tags", searching for a property, clicking "Manage Tags", toggling a tag, clicking save, and verifying that the updated tag list is displayed correctly.

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

### Completion Notes List

### File List
