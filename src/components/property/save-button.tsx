"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface SaveButtonProps {
  propertyId: string;
  propertyTitle: string;
}

const SHORTLIST_KEY = "shortlist";
const MAX_SHORTLIST = 20;
const TOAST_DISMISS_MS = 2000;

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
}

export function SaveButton({ propertyId }: SaveButtonProps) {
  const t = useTranslations("PropertyCard");
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const shortlist = getShortlist();
    setIsSaved(shortlist.includes(propertyId));
  }, [propertyId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return;
    const id = window.setTimeout(() => setShowToast(false), TOAST_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [showToast]);

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
    }
  }

  return (
    <>
      <button
        type="button"
        data-testid="save-button"
        aria-label={isSaved ? t("removeFromSaved") : t("saveProperty")}
        onClick={handleClick}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isSaved ? "text-[--color-accent]" : "text-muted-foreground hover:text-[--color-accent]"
        }`}
      >
        {isSaved ? "♥" : "♡"}
      </button>
      {showToast && (
        <div role="status" className="sr-only">
          {t("shortlistFull")}
        </div>
      )}
    </>
  );
}
