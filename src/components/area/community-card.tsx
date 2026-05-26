interface CommunityCardProps {
  name: string;
  tagline?: string;
  heroImageUrl?: string | null;
  href?: string;
  locale: string;
}

/**
 * CommunityCard — Server Component (AC #6)
 *
 * Gold-bordered card linking to community page.
 * Communities table does not exist yet (Story 6.2).
 * This component renders the visual structure with gold border.
 */
export function CommunityCard({ name, tagline, heroImageUrl, href, locale }: CommunityCardProps) {
  const linkHref = href ?? `/${locale}/communities`;

  return (
    <a
      href={linkHref}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg,12px)] border-2 border-[var(--color-gold,#C2A661)] bg-[var(--color-bg-white,#fff)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-lg)]"
      data-testid="community-card"
    >
      {/* Hero image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-gold, #C2A661) 100%)",
            }}
          >
            <span className="text-2xl font-bold text-white">{name[0]}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-bold text-brand-navy">{name}</h3>
        {tagline && <p className="mt-1 text-sm text-text-muted line-clamp-2">{tagline}</p>}
      </div>
    </a>
  );
}
