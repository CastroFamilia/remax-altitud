"use client";

/**
 * RegionToggle — Segmented pill toggle for the region filter.
 *
 * Renders three options inline: All | 🏔 Mountain | 🏖 Beach
 * Active segment: solid brand-navy background.
 * Inactive: ghost border, brand-navy text.
 *
 * Values match areas.region via ilike: "mountain" | "coast" | undefined (all)
 */

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface RegionToggleProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

const REGION_OPTIONS = [
  { value: undefined, labelKey: "regionAll" as const, icon: null },
  { value: "mountain", labelKey: "regionMountain" as const, icon: "🏔" },
  { value: "coast", labelKey: "regionBeach" as const, icon: "🏖" },
] as const;

export function RegionToggle({ value, onChange }: RegionToggleProps) {
  const t = useTranslations("SearchPage.filters");

  return (
    <div
      data-testid="region-toggle"
      className="inline-flex items-center rounded-lg border border-brand-gold/30 overflow-hidden shrink-0"
    >
      {REGION_OPTIONS.map((option, index) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.labelKey}
            type="button"
            data-testid={`region-toggle-${option.value ?? "all"}`}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium",
              "transition-all duration-200 cursor-pointer whitespace-nowrap",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30",
              // Divider between segments
              index > 0 && "border-l border-brand-gold/30",
              // Active state
              isActive
                ? "bg-brand-navy text-white shadow-sm"
                : "bg-background text-brand-navy/70 hover:bg-brand-gold/5 hover:text-brand-navy",
            )}
          >
            {option.icon && <span aria-hidden="true">{option.icon}</span>}
            <span>{t(option.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
