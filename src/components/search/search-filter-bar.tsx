"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

export function SearchFilterBar() {
  const t = useTranslations("SearchPage.filterBar");

  return (
    <div
      data-testid="search-filter-bar"
      className="sticky top-0 z-10 h-12 md:h-14 bg-background border-b border-border flex items-center px-4 gap-3"
    >
      {/* Mobile compact bar — visible below md breakpoint */}
      <button
        type="button"
        data-testid="mobile-filters-button"
        className="flex md:hidden items-center gap-2 text-sm font-medium"
        aria-label={t("label")}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>{t("label")}</span>
      </button>

      {/* Desktop/tablet loading placeholder — Story 3.3 replaces with real controls */}
      <div
        className="hidden md:block w-full h-8 bg-muted rounded animate-pulse"
        aria-label={t("loading")}
      />
    </div>
  );
}
