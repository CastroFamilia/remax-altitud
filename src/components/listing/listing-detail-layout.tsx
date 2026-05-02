/**
 * ListingDetailLayout — RED PHASE STUB
 *
 * This is a scaffold stub for Story 4.1 ATDD.
 * Server Component — no 'use client' directive.
 *
 * All tests are currently in it.skip() (TDD red phase).
 *
 * Implementation task: Story 4.1, Task 4
 * See: _bmad-output/implementation-artifacts/4-1-listing-detail-page-and-photo-gallery.md
 */

// TODO Story 4.1 Task 4: Implement ListingDetailLayout
// - Server Component (no 'use client')
// - Composition: PropertyGallery (lazy), StickySpecsBar, Description, Features
// - Uses getTranslations('ListingDetail') — server-side async
// - Renders bilingual title/description based on locale
// - ZMT badge with getRegionFromAreaSlug pattern from property-card.tsx
// - TODO comments for AgentCard (4.2), SimilarProperties (4.5), Location Map

import type { Property } from '@/lib/db/schema/properties';
import type { Agent } from '@/lib/db/schema/agents';

interface ListingDetailLayoutProps {
  property: Property;
  agent: Agent | null;
  locale: string;
}

export function ListingDetailLayout(_props: ListingDetailLayoutProps) {
  // STUB — replace with full implementation for Story 4.1
  return null;
}

export default ListingDetailLayout;
