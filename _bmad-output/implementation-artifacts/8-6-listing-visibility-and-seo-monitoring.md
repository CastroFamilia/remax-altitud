# Story 8.6: Listing Visibility & SEO Monitoring

Status: done

## Story

As an **admin**,
I want to hide/unhide listings and monitor SEO performance,
So that I can control what appears on the website and track search engine performance.

## Acceptance Criteria

1. **Given** the admin listing management view
   **When** the admin toggles a listing's visibility to "hidden"
   **Then** the listing's `is_visible` field is set to `false` and it is excluded from all search results, map pins, and property grids — without affecting the underlying API data (FR62)

2. **Given** a hidden listing
   **When** its URL is accessed directly
   **Then** it shows "No longer available" with links to similar properties and an agent CTA — converting dead links into leads (AR12)

3. **Given** the admin re-enables visibility
   **When** the listing's `is_visible` field is set back to `true`
   **Then** the listing reappears in search results, map pins, and property grids after next ISR revalidation

4. **Given** the SEO monitoring requirement
   **When** the admin accesses analytics
   **Then** Google Analytics 4 and Google Search Console are integrated and accessible, providing: organic traffic trends, top-performing pages, keyword rankings, and indexing status (FR63)
1. **Hide Listing**: Admin can toggle a listing as hidden (`isVisible: false`) from the Admin Dashboard.
2. **Graceful Unavailable Page**: Visiting a hidden listing's URL directly serves a polite "No longer available" message, along with a high-converting Agent CTA, rather than a harsh 404.
3. **Exclusion from Search/Index**: Hidden listings are excluded from all active search pages, search indexing, and recommendations, but remain queryable for active clients who have them bookmarked or in shortlists.
4. **SEO Monitoring Widgets**: Integrated Google Search Console (GSC) widget showing organic traffic trends, keyword clicks, and indexing status.
5. **Cookieless Analytics**: GA4 cookieless/consent-mode default configuration that is compliant with international tracking laws.
6. **Path Revalidation**: Hiding or reactivating a property must immediately trigger path revalidation for search page, listing details, and home page.
7. **Reactivation**: Hidden properties can be made visible again, restoring search index status.

## Tasks / Subtasks

- [x] 1. Expose database query `updatePropertyVisibility` in `src/lib/db/queries/properties.ts` to update the `isVisible` field for a property. (AC: 1, 3)
- [x] 2. Create server action `updatePropertyVisibilityAction` in `src/app/actions/admin-visibility-actions.ts` protecting it with admin auth guard and calling path revalidations. (AC: 1, 3, 6)
- [x] 3. Create a query server action `fetchAdminVisibilityData` in `src/app/actions/admin-visibility-actions.ts` to support search, pagination, and a quick filter checkbox for hidden listings (`isVisible = false`). (AC: 1, 7)
- [x] 4. Replace the visibility stub sidebar element in `src/app/[locale]/admin/layout.tsx` with an active Link to `/admin/visibility`. (AC: 1, 7)
- [x] 5. Create visibility admin page `src/app/[locale]/admin/visibility/page.tsx` displaying all listings in a searchable and paginated table with visibility toggles and the hidden-only filter. (AC: 1, 3, 7)
- [x] 6. Build the dynamic SEO and Analytics dashboard section inside `src/app/[locale]/admin/visibility/page.tsx` (or as a separate component/tab) with responsive widgets representing Google Search Console (organic traffic trends, top keywords, indexing status) and GA4 (top performing pages by views/saves). (AC: 4)
- [x] 7. Enhance the `!property.isVisible` block in `src/app/[locale]/property/[slug]/page.tsx` by replacing the plain browse link with a high-converting, personalized Agent CTA (fetching the property's listing agent or displaying general office contact details) that redirects users to WhatsApp/Email with pre-filled inquiry text. (AC: 2)
- [x] 8. Integrate GA4 cookieless/consent-mode tracking globally by adding Google Tag Manager or GA4 scripts in `src/app/[locale]/layout.tsx`, loaded conditionally based on `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable. (AC: 5)
- [x] 9. Add metadata/HTML file routing support in the project structure for Google Search Console ownership verification (e.g. `robots.txt` update or meta tag support). (AC: 4)
- [x] 10. Translate all new labels, headers, buttons, toggles, and metrics in `src/messages/en.json` and `src/messages/es.json` under an `AdminVisibility` namespace, and ensure `PropertyUnavailable` contains the updated agent CTA copy. (AC: 1, 2, 7)
- [x] 11. Add comprehensive unit tests in `tests/unit/admin/visibility.test.ts` to verify the DB query, server actions, path revalidations, and search/visibility query filters. (AC: 1, 3, 6)
- [x] 12. Add E2E tests in `tests/e2e/admin/visibility.spec.ts` using Playwright verifying the listing visibility toggle flow, sitemap exclusion, the unavailable page agent CTA, and SEO analytics widget rendering. (AC: 1, 2, 3, 4, 7)

### Review Findings

- [x] **[Review][Patch]** Fix TypeScript `any` type casting issues in `tests/unit/admin/visibility.test.ts` (0 ESLint errors).
- [x] **[Review][Auditor]** Verify dynamic sitemap exclusion of hidden listings.
- [x] **[Review][Auditor]** Verify cookieless GA4 consent defaults configuration.
- [x] **[Review][Auditor]** Verify agent contact CTA details routing.

## Dev Notes

### ATDD Artifacts

- **Checklist:** [atdd-checklist-8-6-listing-visibility-and-seo-monitoring.md](file:///Users/alejandracastro/Desktop/remax-altitud/.worktrees/story-8.6-listing-visibility-seo-monitoring/_bmad-output/test-artifacts/atdd-checklist-8-6-listing-visibility-and-seo-monitoring.md)
- **Unit Tests:** [visibility.test.ts](file:///Users/alejandracastro/Desktop/remax-altitud/.worktrees/story-8.6-listing-visibility-seo-monitoring/tests/unit/admin/visibility.test.ts)
- **E2E Tests:** [visibility.spec.ts](file:///Users/alejandracastro/Desktop/remax-altitud/.worktrees/story-8.6-listing-visibility-seo-monitoring/tests/e2e/admin/visibility.spec.ts)

### Architecture & Technical Requirements

- **Database Updates & Logic**:
  - Implement a new query in `src/lib/db/queries/properties.ts`:
    ```typescript
    export async function updatePropertyVisibility(id: string, isVisible: boolean): Promise<void> {
      await db
        .update(properties)
        .set({
          isVisible,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, id));
    }
    ```
  - Verify admin session in both `updatePropertyVisibilityAction` and `fetchAdminVisibilityData` by calling `verifyAdminAuth()`.
  
- **Soft Delete and Sitemap Exclusion**:
  - Properties with `isVisible = false` must be excluded from search queries, map actions, and lists. Ensure this is preserved (done via composite search index `idx_properties_search` filtered on `where is_visible = true`).
  - **Sitemap integration**: Check `app/sitemap.ts` to verify it automatically filters out hidden properties (`isVisible = false`) from listing sitemaps. If not, edit the sitemap generator to enforce this.

- **ISR Revalidation**:
  - Toggling visibility must instantly revalidate cached pages on-demand without requiring a full site rebuild.
  - Revalidate paths in `updatePropertyVisibilityAction`:
    ```typescript
    revalidatePath("/[locale]/property/[slug]");
    revalidatePath("/[locale]/search");
    revalidatePath("/[locale]");
    ```

- **Visitor Portal Experience (Dead Link Conversion)**:
  - When visitors directly access a hidden listing, the page `src/app/[locale]/property/[slug]/page.tsx` handles this gracefully (line 89) showing similar properties.
  - Enhance this page block to render a proper **Agent Card CTA** to convert dead links into leads (AR12):
    - Retrieve agent detail (`getAgentById(property.agentId)`) and render the `AgentCard` component.
    - Set the WhatsApp/Email pre-filled body copy to something helpful:
      - *EN:* "Hi, I was looking at [Title] (Ref: [Ref/Slug]), which seems to be no longer available. Could you help me find something similar?"
      - *ES:* "Hola, estaba viendo [Title] (Ref: [Ref/Slug]), que parece que ya no está disponible. ¿Podría ayudarme a encontrar algo similar?"

- **Google Analytics 4 (Cookieless MVP)**:
  - Inject the GA4 tracking code globally in `src/app/[locale]/layout.tsx`.
  - To implement cookieless/consent-mode MVP:
    - Load the script asynchronously.
    - Configure default consent state as denied or restricted:
      ```javascript
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'personalization_storage': 'denied',
        'wait_for_update': 500
      });
      ```
    - Ensure it operates conditionally when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is defined.

- **Google Search Console & Mocked Analytics**:
  - GSC ownership verification must be supported. Ensure Google Search Console Meta tags can be dynamically added to metadata, or place a verification file route in `public/`.
  - For the **Admin SEO & Analytics Dashboard**, since direct live GSC/GA4 API oauth is out of scope for MVP, create a robust, responsive analytics widget panel that displays:
    - Organic traffic trends (mocked timeline chart: impressions, clicks, CTR).
    - Top-performing pages (by shortlist saves/views from DB or mock data).
    - Keyword rankings & Indexing status breakdown (e.g. index cover statistics).
    - This keeps the system standalone and bulletproof for testing, but fully structured as a premium dashboard.

### Previous Story Learning & Continuity

- Coordinate and build on top of patterns established in `AdminTags` (`8-4-lifestyle-tag-administration.md`) and `AdminCommunities` (`8-5-community-administration.md`) for paginated tables, search bars, and design tokens (dark slate dashboard aesthetics, red border indicators).
- Keep component structures modular, reusing standard inputs, tables, and dialog blocks.

### References

- Properties schema: [Source: src/lib/db/schema/properties.ts]
- Existing tags administration: [Source: src/app/[locale]/admin/tags/page.tsx]
- Visitor listing detail page: [Source: src/app/[locale]/property/[slug]/page.tsx]
- Admin layout navigation: [Source: src/app/[locale]/admin/layout.tsx]

### Testing Requirements

- **Unit Tests**:
  - Add unit tests in `tests/unit/admin/visibility.test.ts` verifying `updatePropertyVisibilityAction` saves state and revalidates paths correctly, and `fetchAdminVisibilityData` respects search/filter scopes.
- **End-to-End Tests**:
  - Add E2E Playwright tests in `tests/e2e/admin/visibility.spec.ts`.
  - Verify logging in, navigating to "/admin/visibility", toggling a property to hidden, confirming search excludes it, directly hitting its URL and validating the personalized Agent CTA displays correctly.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
