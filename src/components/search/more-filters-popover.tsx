"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { SearchFilters } from "@/types/search";
import { LifestyleTagChips } from "@/components/search/lifestyle-tag-chips";

interface MoreFiltersPopoverProps {
  filters: SearchFilters;
  setFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K] | undefined) => void;
  toggleTag: (tag: string) => void;
}

export function MoreFiltersPopover({ filters, setFilter, toggleTag }: MoreFiltersPopoverProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("SearchPage");

  // Calculate how many filters inside this popover are active
  const moreFiltersCount = (filters.listingType ? 1 : 0) + (filters.tags?.length || 0);

  const hasValue = moreFiltersCount > 0;

  const listingTypes = [
    { value: "Sale", label: t("filters.listingTypeSale") || "For Sale" },
    { value: "Lease", label: t("filters.listingTypeLease") || "For Rent" },
  ];

  // Helper for single-select fields disguised as checkboxes
  const handleSingleCheckbox = (key: keyof SearchFilters, value: string) => {
    if (filters[key] === value) {
      setFilter(key, undefined);
    } else {
      setFilter(key, value as SearchFilters[typeof key]);
    }
  };

  function CheckboxItem({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
  }) {
    return (
      <label className="flex items-center gap-2 cursor-pointer group" onClick={onChange}>
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded border transition-colors",
            checked
              ? "bg-brand-navy border-brand-navy text-white"
              : "border-input bg-background text-transparent group-hover:border-brand-navy/50",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm text-foreground group-hover:text-brand-navy transition-colors">
          {label}
        </span>
      </label>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-testid="more-filters-trigger"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
            "transition-all duration-200 cursor-pointer whitespace-nowrap",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:border-brand-blue",
            hasValue
              ? "border-brand-navy/30 bg-brand-navy/5 text-brand-navy shadow-sm"
              : "border-brand-gold/30 bg-background text-brand-navy/70 hover:border-brand-gold/60 hover:bg-brand-gold/5",
            open && "border-brand-navy/40 bg-brand-navy/5 shadow-sm",
          )}
        >
          <span>{t("filters.tags") || "Filters"}</span>
          {moreFiltersCount > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-navy text-[10px] font-bold text-white shadow-sm">
              {moreFiltersCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[320px] md:w-[380px] max-h-[85vh] overflow-y-auto no-scrollbar",
            "rounded-lg border border-brand-gold/20 bg-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="p-5 space-y-6">
            {/* Listing Type */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-brand-navy">
                {t("filters.listingType") || "Listing Type"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {listingTypes.map((lt) => (
                  <CheckboxItem
                    key={lt.value}
                    checked={filters.listingType === lt.value}
                    onChange={() => handleSingleCheckbox("listingType", lt.value)}
                    label={lt.label}
                  />
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-border/60" />

            {/* Tags / Characteristics */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-brand-navy">
                {t("filters.tags") || "Tags & Characteristics"}
              </h4>
              <div className="flex flex-wrap gap-2">
                <LifestyleTagChips
                  activeTags={filters.tags ?? []}
                  onToggle={toggleTag}
                  activeType={filters.type}
                  onTypeToggle={(type) => handleSingleCheckbox("type", type)}
                />
              </div>
            </div>

            {hasValue && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("listingType", undefined);
                    setFilter("tags", undefined);
                  }}
                  className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {t("filterBar.clearAll") || "Clear all these filters"}
                </button>
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
