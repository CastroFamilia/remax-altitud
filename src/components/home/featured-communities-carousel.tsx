"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CommunityCard } from "@/components/area/community-card";
import { sortCommunitiesCustom } from "@/lib/db/queries/communities";

interface AreaInfo {
  slug: string;
  nameEn: string;
  nameEs: string;
}

interface CommunityRow {
  slug: string;
  name: string;
  taglineEn: string | null;
  taglineEs: string | null;
  heroImageUrl: string | null;
  priceMinUsd: number | null;
  priceMaxUsd: number | null;
  listingCount: number;
  areaId: string;
  propertyTypesEn?: string | null;
  propertyTypesEs?: string | null;
  sizeMinM2?: number | null;
  sizeMaxM2?: number | null;
  quickFacts?: unknown;
}

interface FeaturedCommunitiesCarouselProps {
  communities: CommunityRow[];
  areaInfoMap: Record<string, AreaInfo>;
  locale: string;
}

export function FeaturedCommunitiesCarousel({
  communities,
  areaInfoMap,
  locale,
}: FeaturedCommunitiesCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Update arrow visibility and active index on scroll
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Show left arrow if we have scrolled
    setShowLeftArrow(scrollLeft > 10);

    // Show right arrow if there is still room to scroll
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);

    // Calculate active slide index
    const slideWidth = scrollWidth / communities.length;
    const index = Math.round(scrollLeft / slideWidth);
    setActiveIndex(index);
  };

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Run once initially to set correct state
      handleScroll();
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communities.length]);

  // Scroll function
  const scroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const { clientWidth } = container;
    const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/carousel w-full">
      {/* Navigation Arrow Left */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-[40%] -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 text-brand-navy dark:text-white shadow-lg backdrop-blur-md border border-slate-200/50 hover:bg-brand-navy hover:text-white transition-all duration-300 scale-95 hover:scale-100 active:scale-90"
          aria-label="Previous communities"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Navigation Arrow Right */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-[40%] -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/90 dark:bg-slate-900/90 text-brand-navy dark:text-white shadow-lg backdrop-blur-md border border-slate-200/50 hover:bg-brand-navy hover:text-white transition-all duration-300 scale-95 hover:scale-100 active:scale-90"
          aria-label="Next communities"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sortCommunitiesCustom(communities).map((community) => {
          const tagline = locale === "es" ? community.taglineEs : community.taglineEn;
          
          // Resolve area info from areaInfoMap
          const areaInfo = areaInfoMap[community.areaId];
          const areaSlug = areaInfo?.slug || "perez-zeledon";
          const location = locale === "es" ? areaInfo?.nameEs : areaInfo?.nameEn;

          // Parse fallbacks from quickFacts
          const qf = (community.quickFacts || {}) as Record<string, unknown>;

          const propertyTypes = (locale === "es"
            ? (community.propertyTypesEs || qf.propertyTypesEs || qf.propertyTypes || "")
            : (community.propertyTypesEn || qf.propertyTypesEn || qf.propertyTypes || "")) as string;

          const sizeMin = community.sizeMinM2 ?? (typeof qf.sizeMinM2 === "number" ? qf.sizeMinM2 : null);
          const sizeMax = community.sizeMaxM2 ?? (typeof qf.sizeMaxM2 === "number" ? qf.sizeMaxM2 : null);

          return (
            <div
              key={community.slug}
              className="w-[85%] sm:w-[48%] md:w-[31.5%] shrink-0 snap-start transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-full rounded-2xl overflow-hidden border border-slate-100/80 shadow-md hover:shadow-xl transition-shadow duration-300 bg-white">
                <CommunityCard
                  name={community.name}
                  tagline={tagline || undefined}
                  heroImageUrl={community.heroImageUrl}
                  href={`/${locale}/areas/${areaSlug}/communities/${community.slug}`}
                  locale={locale}
                  priceMin={community.priceMinUsd}
                  priceMax={community.priceMaxUsd}
                  listingCount={community.listingCount}
                  location={location}
                  propertyTypes={propertyTypes}
                  sizeMin={sizeMin}
                  sizeMax={sizeMax}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Indicators/Dots */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {Array.from({ length: Math.ceil(communities.length / 2) }).map((_, idx) => {
          const isActive = Math.floor(activeIndex / 2) === idx;
          return (
            <button
              key={idx}
              onClick={() => {
                const container = containerRef.current;
                if (!container) return;
                const scrollWidth = container.scrollWidth;
                const step = scrollWidth / Math.ceil(communities.length / 2);
                container.scrollTo({
                  left: step * idx,
                  behavior: "smooth",
                });
              }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-8 bg-brand-navy dark:bg-white"
                  : "w-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
              }`}
              aria-label={`Go to slide group ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
