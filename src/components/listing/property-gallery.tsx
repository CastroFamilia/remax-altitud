"use client";

/**
 * PropertyGallery — Client Component
 *
 * Hero gallery with thumbnail strip, photo count overlay, lightbox (Radix UI Dialog),
 * arrow key navigation, swipe navigation (@use-gesture/react), and optional YouTube embed.
 *
 * Story 4.1, Task 2
 * AC #1, #2, #3, #4, #5
 */

import { useState, useEffect } from "react";
import { PropertyImage } from "@/components/property/property-image";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { useDrag } from "@use-gesture/react";
import type { OptimizedImage } from "@/types/images";

interface PropertyGalleryProps {
  images: OptimizedImage[];
  youtubeUrl?: string | null;
  propertyTitle: string;
}

/**
 * Extracts the YouTube video ID from a YouTube URL.
 * Supports youtube.com/watch?v=... and youtu.be/... formats.
 */
function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function PropertyGallery({ images, youtubeUrl, propertyTitle }: PropertyGalleryProps) {
  const t = useTranslations("PropertyGallery");
  // Single index used for both the hero gallery and the lightbox navigation.
  // This ensures `gallery-photo-count` (in the hero) always reflects the current photo,
  // whether the user is navigating thumbnails or using the lightbox.
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = images?.length ?? 0;

  // Arrow key navigation in lightbox (desktop, R-008)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setActiveIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(i - 1, 0));
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, total]);

  // Touch/swipe navigation in lightbox (mobile, R-008)
  const bind = useDrag(({ swipe: [swipeX] }) => {
    if (swipeX === 1) setActiveIndex((i) => Math.max(i - 1, 0));
    if (swipeX === -1) setActiveIndex((i) => Math.min(i + 1, total - 1));
  });

  // YouTube embed
  const videoId = youtubeUrl ? extractYoutubeVideoId(youtubeUrl) : null;

  if (!images || images.length === 0) {
    return (
      <div
        data-testid="gallery-hero"
        className="relative w-full aspect-[4/3] bg-gray-200 flex items-center justify-center"
        aria-label={propertyTitle}
      >
        <span className="text-gray-500">{t("noPhotos")}</span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="w-full">
      <div
        data-testid="gallery-hero"
        className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100"
      >
        <PropertyImage
          src={activeImage.src}
          alt={activeImage.alt || propertyTitle}
          fallbackSrc={activeImage.fallbackSrc || "/property-placeholder.svg"}
          fill
          sizes="100vw"
          priority={activeIndex === 0}
          {...(activeImage.blurDataUrl
            ? { placeholder: "blur" as const, blurDataURL: activeImage.blurDataUrl }
            : {})}
          className="object-cover"
        />

        {/* Photo count overlay — single source of truth for gallery navigation */}
        <div
          data-testid="gallery-photo-count"
          className="absolute bottom-4 right-4 bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-full"
          aria-live="polite"
        >
          {t("photoCount", { current: activeIndex + 1, total })}
        </div>

        {/* Fullscreen / open lightbox button */}
        <button
          type="button"
          aria-label={t("openLightbox")}
          onClick={() => setLightboxOpen(true)}
          className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-black/80 transition-colors"
        >
<<<<<<< Updated upstream
          {t("openLightbox")}
=======
          {/* Mobile Text */}
          <span className="md:hidden">{t("openLightbox")}</span>

          {/* Desktop Content */}
          <span className="hidden md:inline-flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            <span>
              {t("openLightbox")} ({total})
            </span>
          </span>
>>>>>>> Stashed changes
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        data-testid="gallery-thumbnail-strip"
        className="flex gap-2 overflow-x-auto py-2 px-1"
        role="list"
        aria-label={t("thumbnailStripLabel", { title: propertyTitle })}
      >
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            role="listitem"
            onClick={() => setActiveIndex(index)}
            className={`relative flex-shrink-0 w-20 aspect-[4/3] overflow-hidden rounded border-2 transition-all ${
              index === activeIndex
                ? "border-brand-navy ring-2 ring-brand-navy ring-offset-1"
                : "border-transparent hover:border-gray-400"
            }`}
            aria-label={t("photoCount", { current: index + 1, total })}
            aria-current={index === activeIndex ? "true" : undefined}
          >
            <PropertyImage
              src={image.src}
              alt={image.alt || propertyTitle}
              fallbackSrc={image.fallbackSrc || "/property-placeholder.svg"}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* YouTube video embed (AC #5) */}
      {videoId && (
        <div data-testid="gallery-video-embed" className="aspect-video w-full mt-4">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={t("videoTitle")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
      )}

      {/* Lightbox (Radix UI Dialog) */}
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex items-center justify-center"
            aria-label={t("photoCount", { current: activeIndex + 1, total })}
          >
            <div className="relative w-full h-full flex items-center justify-center" {...bind()}>
              {/* Lightbox image */}
              <div className="relative w-full max-w-5xl h-[80vh]">
                <PropertyImage
                  src={activeImage.src}
                  alt={activeImage.alt || propertyTitle}
                  fallbackSrc={activeImage.fallbackSrc || "/property-placeholder.svg"}
                  fill
                  sizes="100vw"
                  {...(activeImage.blurDataUrl
                    ? { placeholder: "blur" as const, blurDataURL: activeImage.blurDataUrl }
                    : {})}
                  className="object-contain"
                />
              </div>

              {/* Prev button */}
              {activeIndex > 0 && (
                <button
                  type="button"
                  aria-label={t("prevPhoto")}
                  onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors text-xl"
                >
                  ‹
                </button>
              )}

              {/* Next button */}
              {activeIndex < images.length - 1 && (
                <button
                  type="button"
                  aria-label={t("nextPhoto")}
                  onClick={() => setActiveIndex((i) => Math.min(i + 1, images.length - 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors text-xl"
                >
                  ›
                </button>
              )}

              {/* Close button */}
              <Dialog.Close
                aria-label={t("closeLightbox")}
                className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
              >
                ✕
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default PropertyGallery;
