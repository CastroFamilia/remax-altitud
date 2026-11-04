"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

interface VerticalVideoPlayerProps {
  title: string;
  subtitle?: string;
  badge?: string;
  aspectRatio?: "9/16" | "16/9";
  /** URL embebible (YouTube/Vimeo/etc). Si no se define, se muestra la leyenda COMING SOON. */
  videoUrl?: string;
}

export function VerticalVideoPlayer({
  title,
  subtitle,
  badge = "Video",
  aspectRatio = "9/16",
  videoUrl,
}: VerticalVideoPlayerProps) {
  const locale = useLocale();
  const [isPlaying, setIsPlaying] = useState(false);
  const isComingSoon = !videoUrl;
  const comingSoonLabel = locale === "es" ? "Próximamente" : "Coming soon";

  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[340px]">
      <div className="relative overflow-hidden rounded-3xl border-4 border-white/20 bg-gradient-to-b from-brand-navy via-slate-900 to-black shadow-2xl transition-all duration-300 hover:border-brand-gold/50 hover:shadow-brand-gold/10">
        <div
          className={`relative w-full ${aspectRatio === "9/16" ? "aspect-[9/16]" : "aspect-video"}`}
        >
          {isPlaying && videoUrl ? (
            <iframe
              src={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0&playsinline=1`}
              title={title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative flex h-full w-full flex-col justify-between p-6 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-brand-navy/60 to-black/80" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-semibold text-brand-gold backdrop-blur-md">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-brand-gold" />
                  {badge}
                </span>
                <span className="text-[11px] font-medium tracking-wider text-white/60 uppercase">
                  REMAX Altitud
                </span>
              </div>

              <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  disabled={isComingSoon}
                  aria-label={
                    isComingSoon ? `${title} — ${comingSoonLabel}` : `Reproducir ${title}`
                  }
                  className={`group relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-lg shadow-brand-gold/30 transition-transform duration-300 ${
                    isComingSoon
                      ? "cursor-default opacity-60"
                      : "cursor-pointer hover:scale-110 active:scale-95"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="ml-1 h-9 w-9"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {!isComingSoon && (
                    <span className="absolute -inset-2 animate-ping rounded-full border-2 border-brand-gold/40 opacity-75" />
                  )}
                </button>
                {isComingSoon ? (
                  <p className="mt-4 rounded-full border border-brand-gold/60 bg-brand-gold/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-gold">
                    {comingSoonLabel}
                  </p>
                ) : (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-gold">
                    {locale === "es" ? "Toca para reproducir" : "Tap to play"}
                  </p>
                )}
              </div>

              <div className="relative z-10 rounded-2xl bg-black/40 p-4 backdrop-blur-md">
                <h3 className="text-base font-bold leading-snug text-white drop-shadow-sm">
                  {title}
                </h3>
                {subtitle && <p className="mt-1 line-clamp-2 text-xs text-white/80">{subtitle}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
