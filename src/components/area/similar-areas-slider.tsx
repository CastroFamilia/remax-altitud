"use client";

/**
 * SimilarAreasSlider — Client Component (AC #3)
 *
 * Horizontal card slider showing nearby areas (same region).
 * Uses native scroll for simplicity — no external carousel library needed.
 */

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Area } from "@/lib/db/schema/areas";
import { getAreaHeroImage } from "@/lib/utils";

interface SimilarAreasSliderProps {
  areas: Area[];
  locale: string;
}

export function SimilarAreasSlider({ areas, locale }: SimilarAreasSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("AreaGuide");

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {areas.length > 2 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-opacity hover:bg-gray-50"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-opacity hover:bg-gray-50"
            aria-label="Scroll right"
          >
            →
          </button>
        </>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {areas.map((area) => {
          const areaName = locale === "es" ? area.nameEs : area.nameEn;
          const description = locale === "es" ? area.descriptionEs : area.descriptionEn;
          const regionLabel = t(`region.${area.region === "Mountain" ? "Mountain" : "Coast"}`);
          const heroImageUrl = getAreaHeroImage(area.heroImageUrl, area.region);

          return (
            <a
              key={area.slug}
              href={`/${locale}/areas/${area.slug}`}
              className="group min-w-[280px] flex-shrink-0 overflow-hidden rounded-[var(--radius-lg,12px)] bg-[var(--color-bg-white,#fff)] shadow-[var(--shadow-sm)] transition-all hover:shadow-[var(--shadow-lg)]"
            >
              {/* Area hero image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                {heroImageUrl ? (
                  <Image
                    src={heroImageUrl}
                    alt={areaName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="280px"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-navy, #000E35) 0%, var(--color-cream, #FFF8F0) 100%)",
                    }}
                  />
                )}
                {/* Region badge */}
                <span
                  className={`absolute left-2 top-2 rounded px-2 py-0.5 text-xs font-semibold text-white ${
                    area.region === "Mountain"
                      ? "bg-[var(--mountain-primary,#233428)]"
                      : "bg-[var(--beach-primary,#183C5A)]"
                  }`}
                >
                  {regionLabel}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-brand-navy group-hover:underline">{areaName}</h3>
                <p className="mt-1 text-xs text-text-muted">
                  {t("propertyCount", { count: area.propertyCount })}
                </p>
                <p className="mt-2 text-sm text-text-muted line-clamp-2">{description}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
