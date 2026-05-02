"use client";

import { useCallback, useEffect, useState } from "react";
import { detectDefaultUnitSystem, convertArea, type UnitSystem } from "@/lib/utils/units";

const STORAGE_KEY = "unit-preference";

/**
 * Safely read the stored unit preference. Returns null if localStorage is
 * unavailable (Safari private mode, sandboxed iframes, disabled storage).
 */
function readStoredPreference(): UnitSystem | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "metric" || stored === "imperial" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Safely persist the unit preference. Silently swallows quota / disabled
 * storage errors — UI state remains in sync even if persistence fails.
 */
function writeStoredPreference(value: UnitSystem): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* noop — storage unavailable */
  }
}

/**
 * Hook for locale-aware unit preference with localStorage persistence.
 *
 * Hydration safety:
 *   - Initial state always uses `detectDefaultUnitSystem(locale)` so the
 *     server-rendered HTML and the first client render match exactly.
 *   - After mount, a useEffect reads localStorage and reconciles the state
 *     to the user's stored preference. This avoids React hydration warnings
 *     at the cost of a one-paint flash for users with a non-default stored
 *     preference. (FOUC mitigation R-011 — accepted trade-off; hydration
 *     correctness is preferred over zero-flash.)
 *
 * Story 3.7 — AC #3, #4
 */
export function useLocaleUnits(locale: string) {
  const defaultSystem = detectDefaultUnitSystem(locale);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(defaultSystem);

  // Reconcile with localStorage after mount (avoids SSR/CSR hydration mismatch).
  useEffect(() => {
    const stored = readStoredPreference();
    if (stored && stored !== unitSystem) {
      setUnitSystem(stored);
    }
    // Intentionally only runs once per mount — locale changes do not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleUnits = useCallback(() => {
    setUnitSystem((prev) => {
      const next: UnitSystem = prev === "metric" ? "imperial" : "metric";
      writeStoredPreference(next);
      return next;
    });
  }, []);

  return { unitSystem, toggleUnits, convertArea } as const;
}
