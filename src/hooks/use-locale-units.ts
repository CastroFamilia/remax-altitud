"use client";

import { useEffect } from "react";
import { useUnitStore } from "@/store/unit-store";
import { convertArea } from "@/lib/utils/units";

/**
 * Hook for locale-aware unit preference backed by a shared Zustand store.
 *
 * All components that call this hook share the same reactive state, so
 * toggling in one place (e.g. UnitToggle in SearchFilterBar) instantly
 * re-renders all consumers (PropertyCard, MapPopup, StickySpecsBar, etc.).
 *
 * Hydration safety:
 *   - The store initialises to `null`.  On first client render the
 *     `useEffect` calls `initFromLocale`, which reads localStorage and
 *     sets the correct value.  Until then, consumers see "metric" via
 *     the `?? "metric"` fallback, matching the server-rendered HTML.
 *
 * Story 3.7 — AC #3, #4
 */
export function useLocaleUnits(locale: string) {
  const unitSystemRaw = useUnitStore((s) => s.unitSystem);
  const initFromLocale = useUnitStore((s) => s.initFromLocale);
  const toggleUnits = useUnitStore((s) => s.toggleUnits);

  // Reconcile with localStorage after mount (hydration-safe).
  useEffect(() => {
    initFromLocale(locale);
  }, [initFromLocale, locale]);

  // Before init, fall back to "metric" so SSR HTML matches first paint.
  const unitSystem = unitSystemRaw ?? "metric";

  return { unitSystem, toggleUnits, convertArea } as const;
}
