import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Community } from "@/lib/db/schema/communities";
import type { OptimizedImage } from "@/types/images";

interface CommunityHeroProps {
  community: Community;
  areaName: string;
  locale: string;
}

/**
 * CommunityHero — Server Component (AC #1, #15)
 *
 * Renders hero section with community name + area name (h1), tagline, price range.
 * Falls back to navy-to-gold gradient when heroImageUrl is null (AC #15).
 */
export async function CommunityHero({ community, areaName, locale }: CommunityHeroProps) {
  const t = await getTranslations({ locale, namespace: "CommunityPage" });
  const tagline = locale === "es" ? community.taglineEs : community.taglineEn;
  const heroImage = community.heroImage as OptimizedImage | null;

  const priceRange =
    community.priceMinUsd && community.priceMaxUsd
      ? t("hero.homesFrom", {
          min: `$${(community.priceMinUsd / 1000).toFixed(0)}K`,
          max: `$${(community.priceMaxUsd / 1000).toFixed(0)}K`,
        })
      : null;

  return (
    <section
      data-testid="community-hero"
      className="relative flex min-h-[50vh] items-end overflow-hidden md:min-h-[60vh]"
    >
      {/* Background: image or gradient fallback */}
      {heroImage ? (
        <Image
          src={heroImage.src}
          alt={community.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          placeholder={heroImage.blurDataUrl ? "blur" : undefined}
          blurDataURL={heroImage.blurDataUrl || undefined}
          unoptimized
        />
      ) : community.heroImageUrl ? (
        <Image
          src={community.heroImageUrl}
          alt={community.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          unoptimized
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-gold, #C2A661) 100%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Area badge */}
          <span className="inline-flex items-center rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white bg-[var(--color-gold,#C2A661)]">
            {areaName}
          </span>

          {/* Community name */}
          <h1 className="mt-3 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
            {community.name}
          </h1>

          {/* Tagline */}
          {tagline && <p className="mt-2 text-lg text-white/90 md:text-xl">{tagline}</p>}

          {/* Price range */}
          {priceRange && (
            <p className="mt-3 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              {priceRange}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
