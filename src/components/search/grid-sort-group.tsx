"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchFilters } from "@/hooks/use-search-filters";
import { cn } from "@/lib/utils";

export function GridSortGroup() {
  const t = useTranslations("SearchPage");
  const { filters, setFilter } = useSearchFilters();
  const [moreOpen, setMoreOpen] = useState(false);

  // Default to relevance if not set
  const currentSort = filters.sort ?? "relevance";

  const handleSort = (val: "relevance" | "price_asc" | "newest" | "price_desc") => {
    setFilter("sort", val);
    setMoreOpen(false);
  };

  const isMoreSelected = currentSort === "price_desc";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm mb-4 lg:px-0">
      <span className="text-muted-foreground font-medium">{t("filters.sort") || "Ordenar"}:</span>

      <div className="flex flex-wrap items-center border border-brand-gold/30 rounded-md bg-background overflow-hidden shadow-sm">
        <button
          type="button"
          className={cn(
            "px-4 py-2 font-medium transition-colors border-r border-brand-gold/30 focus:outline-none",
            currentSort === "relevance"
              ? "bg-brand-navy/5 text-brand-burgundy font-bold shadow-inner"
              : "text-brand-navy hover:bg-brand-gold/5",
          )}
          onClick={() => handleSort("relevance")}
        >
          {t("filters.sortRelevance")}
        </button>
        <button
          type="button"
          className={cn(
            "px-4 py-2 font-medium transition-colors border-r border-brand-gold/30 focus:outline-none",
            currentSort === "price_asc"
              ? "bg-brand-navy/5 text-brand-burgundy font-bold shadow-inner"
              : "text-brand-navy hover:bg-brand-gold/5",
          )}
          onClick={() => handleSort("price_asc")}
        >
          {t("filters.sortPriceAsc")}
        </button>
        <button
          type="button"
          className={cn(
            "px-4 py-2 font-medium transition-colors border-r border-brand-gold/30 focus:outline-none",
            currentSort === "newest"
              ? "bg-brand-navy/5 text-brand-burgundy font-bold shadow-inner"
              : "text-brand-navy hover:bg-brand-gold/5",
          )}
          onClick={() => handleSort("newest")}
        >
          {t("filters.sortNewest")}
        </button>

        <Popover.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={cn(
                "px-4 py-2 font-medium flex items-center gap-1.5 transition-colors focus:outline-none",
                isMoreSelected
                  ? "bg-brand-navy/5 text-brand-burgundy font-bold shadow-inner"
                  : "text-brand-navy hover:bg-brand-gold/5",
                moreOpen && "bg-brand-navy/5",
              )}
            >
              {isMoreSelected ? t("filters.sortPriceDesc") : t("filters.more")}
              <ChevronDown
                className={cn(
                  "h-4 w-4 opacity-70 transition-transform duration-200",
                  moreOpen && "rotate-180",
                )}
              />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              side="bottom"
              align="end"
              sideOffset={4}
              className={cn(
                "z-50 min-w-[160px] p-1",
                "rounded-md border border-brand-gold/20 bg-white shadow-lg",
                "animate-in fade-in-0 zoom-in-95",
              )}
            >
              <button
                type="button"
                role="option"
                aria-selected={currentSort === "price_desc"}
                onClick={() => handleSort("price_desc")}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer",
                  "transition-colors duration-150",
                  currentSort === "price_desc"
                    ? "bg-brand-navy/5 text-brand-navy font-medium"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {currentSort === "price_desc" && <Check className="h-3.5 w-3.5 text-brand-navy" />}
                <span className={currentSort === "price_desc" ? "" : "ml-[22px]"}>
                  {t("filters.sortPriceDesc")}
                </span>
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
