"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageCircle, Home } from "lucide-react";

export function StickyMobileCta() {
  const t = useTranslations("Navigation");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-brand-warm/20 bg-brand-navy pb-[env(safe-area-inset-bottom)] md:hidden">
      <Link
        href="/contact"
        className="flex flex-1 items-center justify-center gap-2 border-r border-brand-warm/20 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/5"
      >
        <MessageCircle className="size-4" />
        {t("contact")}
      </Link>
      <Link
        href="/sell"
        className="flex flex-1 items-center justify-center gap-2 bg-brand-burgundy py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-burgundy/90"
      >
        <Home className="size-4" />
        {t("sellYourProperty")}
      </Link>
    </div>
  );
}
