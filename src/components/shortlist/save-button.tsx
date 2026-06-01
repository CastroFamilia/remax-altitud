"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Heart } from "lucide-react";
import { useShortlist } from "@/hooks/use-shortlist";
import { hasShownTooltipThisSession, markTooltipShownThisSession } from "@/lib/utils/shortlist";

interface SaveButtonProps {
  propertyId: string;
  propertyTitle: string;
}

export function SaveButton({ propertyId }: SaveButtonProps) {
  const t = useTranslations("Shortlist");
  const locale = useLocale() as "en" | "es";
  const { shortlist, isSaved, save, remove, isLoaded } = useShortlist();

  const [showToast, setShowToast] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const saved = typeof isSaved === "function" ? isSaved(propertyId) : false;

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Auto-dismiss tooltip after 4 seconds
  useEffect(() => {
    if (!showTooltip) return;
    const timer = setTimeout(() => setShowTooltip(false), 4000);
    return () => clearTimeout(timer);
  }, [showTooltip]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (saved) {
      remove(propertyId);
      fetch("/api/shortlist/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, action: "unsave", locale }),
      }).catch((err) => console.error("Failed to track shortlist event:", err));
    } else {
      const res = save(propertyId);
      if (res.success) {
        fetch("/api/shortlist/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, action: "save", locale }),
        }).catch((err) => console.error("Failed to track shortlist event:", err));

        // Since we saved it, shortlist.length + 1 will reflect the count.
        // If length is now 2, trigger tooltip once per session.
        const currentLength = shortlist.length + 1;
        if (currentLength === 2 && !hasShownTooltipThisSession()) {
          setShowTooltip(true);
          markTooltipShownThisSession();
        }
      } else if (res.error === "limit") {
        setShowToast(true);
      }
    }
  };

  // Safe SSR placeholder for hydration
  if (!isLoaded) {
    return (
      <span
        data-testid="save-property-button"
        className="relative inline-flex items-center justify-center w-11 h-11"
      >
        <button
          type="button"
          disabled
          data-testid="save-button"
          aria-label={t("saveLabel")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs text-[#888] shadow-xs"
        >
          <Heart className="h-5 w-5 stroke-[#888] stroke-current" strokeWidth={2} />
        </button>
      </span>
    );
  }

  return (
    <span
      data-testid="save-property-button"
      className="relative inline-flex items-center justify-center w-11 h-11"
    >
      <button
        type="button"
        data-testid="save-button"
        aria-label={saved ? t("removeLabel") : t("saveLabel")}
        onClick={handleToggle}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs shadow-xs hover:scale-105 transition-transform cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold"
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            saved ? "fill-accent stroke-accent" : "stroke-[#888] stroke-current"
          }`}
          strokeWidth={2}
        />
      </button>

      {/* Toast Limit reached notification */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full right-0 mb-2 z-50 whitespace-nowrap rounded bg-red-800 text-white px-3 py-1.5 text-xs shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t("limitReached")}
        </div>
      )}

      {/* 2nd Save Tooltip */}
      {showTooltip && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded bg-slate-900 text-white px-3 py-2 text-xs shadow-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="relative font-medium">
            {t("agentTooltip")}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      )}
    </span>
  );
}
