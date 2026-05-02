"use client";

import { useTranslations } from "next-intl";
import { useLocaleUnits } from "@/hooks/use-locale-units";

interface UnitToggleProps {
  locale: string;
  className?: string;
}

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
      className={className}
    >
      <span aria-hidden="true">{isMetric ? "m²" : "ft²"}</span>
    </button>
  );
}
