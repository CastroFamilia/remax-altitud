"use client";

import { useState, useCallback } from "react";
import { detectDefaultUnitSystem, convertArea, type UnitSystem } from "@/lib/utils/units";

const STORAGE_KEY = "unit-preference";

/**
 * Hook for locale-aware unit preference with localStorage persistence.
 *
 * - Reads stored preference synchronously in useState initializer (FOUC prevention — R-011)
 * - Falls back to detectDefaultUnitSystem(locale) when no stored preference exists
 * - SSR-safe: returns defaultSystem on server render (typeof window === 'undefined')
 *
 * Story 3.7 — AC #3, #4
 */
export function useLocaleUnits(locale: string) {
  const defaultSystem = detectDefaultUnitSystem(locale);

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    // SSR-safe: only read localStorage in client
    if (typeof window === "undefined") return defaultSystem;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "metric" || stored === "imperial" ? stored : defaultSystem;
  });

  const toggleUnits = useCallback(() => {
    setUnitSystem((prev) => {
      const next = prev === "metric" ? "imperial" : "metric";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { unitSystem, toggleUnits, convertArea } as const;
}
