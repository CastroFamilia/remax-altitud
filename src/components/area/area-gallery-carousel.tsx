"use client";

/**
 * AreaGalleryCarousel — Client Component
 *
 * Horizontal visual image carousel with CSS snap scrolling, localized captions,
 * and high-converting micro-interactions.
 */

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryImage {
  url: string;
  captionEn?: string;
  captionEs?: string;
}

interface AreaGalleryCarouselProps {
  metadata: {
    galleryImages?: GalleryImage[];
    [key: string]: any;
  } | null;
  locale: string;
}

export function AreaGalleryCarousel({ metadata, locale }: AreaGalleryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!metadata || !metadata.galleryImages || metadata.galleryImages.length === 0) {
    return null;
  }

  const images = metadata.galleryImages;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const isEs = locale === "es";

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 border-t border-border mt-12">
      <h2 className="text-3xl font-extrabold text-brand-navy mb-2">
        {isEs ? "Galería de Fotos del Área" : "Area Photo Gallery"}
      </h2>
      <p className="text-text-muted text-[17px] mb-8 max-w-2xl leading-relaxed">
        {isEs
          ? "Explore la belleza escénica, el estilo de vida vibrante y los hermosos paisajes que hacen de Pérez Zeledón un lugar tan especial."
          : "Explore the scenic beauty, vibrant lifestyle, and stunning landscapes that make Pérez Zeledón such a special place."}
      </p>

      <div className="relative group/carousel">
        {/* Scroll buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-brand-navy shadow-md hover:bg-white transition-all hover:scale-105 active:scale-95 border border-border/40 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
              aria-label="Scroll gallery left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-brand-navy shadow-md hover:bg-white transition-all hover:scale-105 active:scale-95 border border-border/40 opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
              aria-label="Scroll gallery right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((img, idx) => {
            const caption = isEs ? img.captionEs || img.captionEn : img.captionEn || img.captionEs;
            return (
              <div
                key={idx}
                className="snap-start snap-always min-w-[280px] sm:min-w-[420px] md:min-w-[580px] flex-shrink-0 flex flex-col rounded-2xl overflow-hidden bg-background border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Visual Area */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/10">
                  <Image
                    src={img.url}
                    alt={caption || `Gallery image ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-103"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 420px, 580px"
                    priority={idx === 0}
                  />
                </div>
                {/* Localized Caption */}
                {caption && (
                  <div className="p-4 border-t border-border/30 bg-gradient-to-r from-background to-secondary/5">
                    <p className="text-sm font-semibold text-brand-navy tracking-wide">
                      {caption}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
