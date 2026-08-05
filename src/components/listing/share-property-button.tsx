/**
 * SharePropertyButton — Client Component
 *
 * A dropdown share button for the property detail page. Allows sharing via
 * WhatsApp, Facebook, and Instagram (copy-to-clipboard since IG has no web
 * share API). Visually matches the adjacent PrintButton pill style.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { FacebookIcon } from "@/components/icons/facebook-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";

interface SharePropertyButtonProps {
  slug: string;
  title: string;
  locale: string;
}

const TOAST_DISMISS_MS = 3000;

export function SharePropertyButton({ slug, title, locale }: SharePropertyButtonProps) {
  const t = useTranslations("ShareProperty");
  const [open, setOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build the canonical property URL
  const getPropertyUrl = useCallback(
    () => `${window.location.origin}/${locale}/property/${slug}`,
    [locale, slug],
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return;
    const id = window.setTimeout(() => setShowToast(false), TOAST_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [showToast]);

  function handleWhatsApp() {
    const url = getPropertyUrl();
    const text = `${title} — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function handleFacebook() {
    const url = getPropertyUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }

  async function handleInstagram() {
    const url = getPropertyUrl();
    try {
      await navigator.clipboard.writeText(url);
      setShowToast(true);
    } catch {
      // Clipboard write failed — silent failure
    }
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative inline-flex">
      {/* Trigger button — matches PrintButton pill style */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm border border-brand-warm hover:bg-brand-navy hover:text-white transition-colors"
        aria-label={t("trigger")}
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="share-property-trigger"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">{t("trigger")}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-brand-warm bg-white shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="p-1.5 space-y-0.5">
            {/* WhatsApp */}
            <button
              type="button"
              role="menuitem"
              onClick={handleWhatsApp}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
              data-testid="share-whatsapp"
            >
              <WhatsAppIcon className="h-5 w-5 text-green-500" />
              {t("whatsapp")}
            </button>

            {/* Facebook */}
            <button
              type="button"
              role="menuitem"
              onClick={handleFacebook}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              data-testid="share-facebook"
            >
              <FacebookIcon className="h-5 w-5 text-blue-600" />
              {t("facebook")}
            </button>

            {/* Instagram (copy link) */}
            <button
              type="button"
              role="menuitem"
              onClick={handleInstagram}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-pink-50 hover:text-pink-700 transition-colors"
              data-testid="share-instagram"
            >
              <InstagramIcon className="h-5 w-5 text-pink-500" />
              {t("instagram")}
            </button>
          </div>
        </div>
      )}

      {/* Toast for Instagram copy confirmation */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
        >
          {t("linkCopied")}
        </div>
      )}
    </div>
  );
}
