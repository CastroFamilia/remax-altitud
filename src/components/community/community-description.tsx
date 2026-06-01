import type { Community } from "@/lib/db/schema/communities";

interface CommunityDescriptionProps {
  community: Community;
  locale: string;
}

/**
 * CommunityDescription — Server Component (AC #3)
 *
 * SEO description text rendered directly in server HTML.
 * MUST NOT use 'use client' — content must be in initial SSG output.
 * Follows AreaGuideDescription pattern from Story 6.1.
 */
export function CommunityDescription({ community, locale }: CommunityDescriptionProps) {
  const description = locale === "es" ? community.descriptionEs : community.descriptionEn;

  if (!description) return null;

  return (
    <section
      data-testid="community-description"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="prose prose-lg max-w-none text-text-body">
        {description.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
