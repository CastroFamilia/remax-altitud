"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useLocaleUnits } from "@/hooks/use-locale-units";

interface UnitToggleProps {
  locale: string;
  className?: string;
}

const DEFAULT_TOGGLE_CLASS =
  "inline-flex h-8 min-w-[3.5rem] items-center justify-center rounded-md " +
  "border border-border bg-background px-3 text-xs font-medium " +
  "text-foreground transition-colors hover:bg-muted " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * UnitToggle — Client Component (uses localStorage + React state).
 *
 * Renders a switch-style toggle button that switches area units between
 * m² (metric) and ft² (imperial). Preference is persisted in localStorage.
 *
 * Architecture §8: UnitToggle is a Client Component.
 * Story 3.7 — AC #3, #4
 */
export function UnitToggle({ locale, className }: UnitToggleProps) {
  const t = useTranslations("UnitToggle");
  const { unitSystem, toggleUnits } = useLocaleUnits(locale);

  const isMetric = unitSystem === "metric";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isMetric}
      aria-label={t("label")}
      onClick={toggleUnits}
      data-testid="unit-toggle"
      className={cn(DEFAULT_TOGGLE_CLASS, className)}
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        <span className={cn("transition-opacity", isMetric ? "font-semibold" : "opacity-50")}>
          m²
        </span>
        <span className="opacity-40">/</span>
        <span className={cn("transition-opacity", !isMetric ? "font-semibold" : "opacity-50")}>
          ft²
        </span>
      </span>
    </button>
  );
}
