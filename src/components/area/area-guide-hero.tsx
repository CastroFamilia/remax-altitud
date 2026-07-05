import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Area } from "@/lib/db/schema/areas";
import { getAreaHeroImage } from "@/lib/utils";

interface AreaMetadata {
  h1Es?: string;
  h1En?: string;
  elevation?: string | number;
  climate?: string;
  nearestBeach?: string;
  nearestHospital?: string;
  [key: string]: unknown;
}

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
export async function AreaGuideHero({ area, locale }: AreaGuideHeroProps) {
  const areaName = locale === "es" ? area.nameEs : area.nameEn;
  const metadata = area.metadata as AreaMetadata | null;
  const h1Key = locale === "es" ? "h1Es" : "h1En";
  const displayTitle = (metadata?.[h1Key] as string | undefined) || areaName;

  const hasHeroImage = !!area.heroImageUrl;
  const heroImageUrl = getAreaHeroImage(area.heroImageUrl, area.region);
  const t = await getTranslations({ locale, namespace: "AreaGuide" });

  const regionBadgeClass =
    area.region === "Mountain"
      ? "bg-[var(--mountain-primary,#233428)]"
      : "bg-[var(--beach-primary,#183C5A)]";

  const regionLabel = t(`region.${area.region === "Mountain" ? "Mountain" : "Coast"}`);

  const getLocalizedValue = (value?: string | number) => {
    if (typeof value !== "string") return value;
    const parts = value.split(" / ");
    if (parts.length === 2) {
      return locale === "es" ? parts[1] : parts[0];
    }
    return value;
  };

  const elevation = getLocalizedValue(metadata?.elevation as string | number);
  const climate = getLocalizedValue(metadata?.climate as string);
  const nearestBeach = getLocalizedValue(metadata?.nearestBeach as string);
  const nearestHospital = getLocalizedValue(metadata?.nearestHospital as string);

  return (
    <section
      data-testid="area-guide-hero"
      className="relative flex min-h-[50vh] items-end overflow-hidden md:min-h-[60vh]"
    >
      {/* Background: image or gradient fallback */}
      {hasHeroImage ? (
        <Image
          src={heroImageUrl}
          alt={areaName}
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
              "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-cream, #FFF8F0) 100%)",
          }}
          aria-hidden="true"
          data-testid="gradient-fallback"
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
            {displayTitle}
          </h1>

          {/* Climate / altitude metadata */}
          {metadata && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/90">
              {elevation && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🏔</span>
                  {elevation}
                </span>
              )}
              {climate && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🌡</span>
                  {climate}
                </span>
              )}
              {nearestBeach && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🏖</span>
                  {nearestBeach}
                </span>
              )}
              {nearestHospital && (
                <span className="flex items-center gap-1.5">
                  <span aria-hidden="true">🏥</span>
                  {nearestHospital}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
