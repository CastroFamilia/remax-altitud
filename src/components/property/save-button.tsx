"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { HeartParticles } from "@/components/shortlist/heart-particles";

interface SaveButtonProps {
  propertyId: string;
  propertyTitle: string;
}

const SHORTLIST_KEY = "shortlist";
const MAX_SHORTLIST = 20;
const TOAST_DISMISS_MS = 2000;
// Cross-instance sync event: dispatched whenever ANY SaveButton mutates the
// shortlist. The native `storage` event only fires across tabs/windows, so
// we need a same-window broadcast to keep duplicate SaveButtons (e.g., the
// top-right + footer copies on a PropertyCard) in lockstep.
const SHORTLIST_EVENT = "shortlist-change";

function getShortlist(): string[] {
  try {
    const raw = localStorage.getItem(SHORTLIST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function setShortlist(list: string[]): void {
  try {
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable — silent failure
  }
  // Notify other in-page SaveButton instances
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SHORTLIST_EVENT));
  }
}

export function SaveButton({ propertyId }: SaveButtonProps) {
  const t = useTranslations("PropertyCard");
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // Initialize + subscribe to cross-instance updates (same window) and
  // cross-tab updates (storage event).
  useEffect(() => {
    function sync() {
      const shortlist = getShortlist();
      setIsSaved(shortlist.includes(propertyId));
    }

    sync();

    if (typeof window === "undefined") return;
    window.addEventListener(SHORTLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SHORTLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [propertyId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return;
    const id = window.setTimeout(() => setShowToast(false), TOAST_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [showToast]);

  // Auto-clear particles after animation completes (400ms + buffer)
  useEffect(() => {
    if (!showParticles) return;
    const timer = setTimeout(() => setShowParticles(false), 500);
    return () => clearTimeout(timer);
  }, [showParticles]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    const shortlist = getShortlist();

    if (isSaved) {
      // Remove from shortlist
      const updated = shortlist.filter((id) => id !== propertyId);
      setShortlist(updated);
      setIsSaved(false);
    } else {
      // Check capacity
      if (shortlist.length >= MAX_SHORTLIST) {
        setShowToast(true);
        return;
      }
      const updated = [...shortlist, propertyId];
      setShortlist(updated);
      setIsSaved(true);
      // Trigger particle burst + scale pop animation (UX-DR22)
      setShowParticles(true);
    }
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        data-testid="save-button"
        aria-label={isSaved ? t("removeFromSaved") : t("saveProperty")}
        onClick={handleClick}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isSaved ? "text-[--color-accent]" : "text-muted-foreground hover:text-[--color-accent]"
        } ${showParticles ? "heart-pop" : ""}`}
      >
        {isSaved ? "♥" : "♡"}
      </button>
      {/* Particle burst on save (UX-DR22) */}
      {showParticles && <HeartParticles />}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full right-0 mb-1 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-md"
        >
          {t("shortlistFull")}
        </div>
      )}
    </span>
  );
}
