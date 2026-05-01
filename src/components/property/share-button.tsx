"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ShareButtonProps {
  slug: string;
  title: string;
  locale: string;
}

const TOAST_DISMISS_MS = 2000;

export function ShareButton({ slug, title, locale }: ShareButtonProps) {
  const t = useTranslations("PropertyCard");
  const [showToast, setShowToast] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return;
    const id = window.setTimeout(() => setShowToast(false), TOAST_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [showToast]);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    const url = `${window.location.origin}/${locale}/property/${slug}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch {
        // User dismissed share sheet — not an error
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setShowToast(true);
      } catch {
        // Clipboard write failed — silent failure
      }
    }
  }

  return (
    <>
      <button
        type="button"
        data-testid="share-button"
        aria-label={t("share")}
        onClick={handleClick}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        ↗
      </button>
      {showToast && (
        <div role="status" className="sr-only">
          Link copied!
        </div>
      )}
    </>
  );
}
