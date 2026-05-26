import Image from "next/image";
import type { Area } from "@/lib/db/schema/areas";

interface AreaIndexCardProps {
  area: Area;
  locale: string;
}

/**
 * AreaIndexCard — Server Component (AC #7)
 *
 * Card for the area index page showing:
 * - Hero image (or gradient fallback)
 * - Area name
 * - Region badge
 * - Property count
 * - Description snippet
 */
export function AreaIndexCard({ area, locale }: AreaIndexCardProps) {
  const areaName = locale === "es" ? area.nameEs : area.nameEn;
  const description = locale === "es" ? area.descriptionEs : area.descriptionEn;

  const regionBadgeClass =
    area.region === "Mountain"
      ? "bg-[var(--mountain-primary,#233428)]"
      : "bg-[var(--beach-primary,#183C5A)]";

  return (
    <a
      href={`/${locale}/areas/${area.slug}`}
      data-testid="area-index-card"
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg,12px)] bg-[var(--color-bg-white,#fff)] shadow-[var(--shadow-sm)] transition-all duration-200 ease-out hover:translate-y-[-4px] hover:shadow-[var(--shadow-lg)]"
    >
      {/* Hero image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {area.heroImageUrl ? (
          <Image
            src={area.heroImageUrl}
            alt={areaName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-cream, #FFF8F0) 100%)",
            }}
          />
        )}

        {/* Region badge */}
        <span
          data-testid="region-badge"
          className={`absolute left-3 top-3 rounded px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white ${regionBadgeClass}`}
        >
          {area.region}
        </span>

        {/* Property count overlay */}
        <span
          data-testid="area-property-count"
          className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
        >
          {area.propertyCount} properties
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-bold text-brand-navy group-hover:underline">{areaName}</h2>
        <p data-testid="area-description-snippet" className="mt-2 text-sm text-text-muted line-clamp-3">{description}</p>
      </div>
    </a>
  );
}
