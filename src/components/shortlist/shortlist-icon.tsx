"use client";

import { Link } from "@/i18n/navigation";
import { Heart } from "lucide-react";
import { useShortlist } from "@/hooks/use-shortlist";
import { useTranslations } from "next-intl";

export function ShortlistIcon() {
  const { shortlist, isLoaded } = useShortlist();
  const t = useTranslations("Shortlist");

  const count = shortlist.length;

  return (
    <Link
      href="/shortlist"
      aria-label={t("linkLabel")}
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
    >
      <Heart className="h-5 w-5" strokeWidth={2} />

      {isLoaded && count > 0 && (
        <span
          data-testid="header-shortlist-count"
          className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-brand-gold text-white text-[10px] font-bold flex items-center justify-center shadow-xs select-none animate-in scale-in duration-200"
        >
          {count}
        </span>
      )}

      {!isLoaded && (
        <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] rounded-full bg-transparent" />
      )}
    </Link>
  );
}
