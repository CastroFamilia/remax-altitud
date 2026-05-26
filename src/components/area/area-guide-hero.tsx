import Image from "next/image";
import type { Area } from "@/lib/db/schema/areas";

interface AreaGuideHeroProps {
  area: Area;
  locale: string;
}

/**
 * AreaGuideHero — Server Component (AC #1, #12)
 *
 * Renders hero section with area name (h1), region badge, and climate/altitude data.
 * Falls back to a navy-to-cream gradient when heroImageUrl is null (AC #12).
 */
export function AreaGuideHero({ area, locale }: AreaGuideHeroProps) {
  const areaName = locale === "es" ? area.nameEs : area.nameEn;
  const metadata = area.metadata as Record<string, string> | null;
  const hasHeroImage = !!area.heroImageUrl;

  const regionBadgeClass =
    area.region === "Mountain"
      ? "bg-[var(--mountain-primary,#233428)]"
      : "bg-[var(--beach-primary,#183C5A)]";

  const regionLabel = area.region === "Mountain" ? "Mountain" : "Coast";

  return (
    <section
      data-testid="area-guide-hero"
      className="relative flex min-h-[50vh] items-end overflow-hidden md:min-h-[60vh]"
    >
      {/* Background: image or gradient fallback */}
      {hasHeroImage ? (
        <Image
          src={area.heroImageUrl!}
          alt={areaName}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-cream, #FFF8F0) 100%)",
          }}
          aria-hidden="true"
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Region badge */}
          <span
            className={`inline-flex items-center rounded px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ${regionBadgeClass}`}
          >
            {regionLabel}
          </span>

          {/* Area name */}
          <h1 className="mt-3 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
            {areaName}
          </h1>

          {/* Climate / altitude metadata */}
          {metadata && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90">
              {metadata.elevation && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🏔</span>
                  {metadata.elevation}
                </span>
              )}
              {metadata.climate && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🌡</span>
                  {metadata.climate}
                </span>
              )}
              {metadata.nearestBeach && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🏖</span>
                  {metadata.nearestBeach}
                </span>
              )}
              {metadata.nearestHospital && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🏥</span>
                  {metadata.nearestHospital}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
