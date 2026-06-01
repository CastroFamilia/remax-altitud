/**
 * Zustand store for area-unit preference (m² / ft²).
 *
 * Replaces the per-component useState approach in useLocaleUnits so that
 * every consumer (UnitToggle, SplitViewLayout, PropertyCard, MapPopup, …)
 * shares a single reactive value.  Toggling in one component instantly
 * re-renders all others.
 *
 * Persistence: localStorage key "unit-preference".
 *
 * Hydration safety: the store initialises with a `null` sentinel.
 * `initFromLocale(locale)` must be called once (client-side) to reconcile
 * with localStorage.  Until that call, consumers fall back to "metric".
 *
 * IMPORTANT: This file MUST NOT have a "use client" directive.
 * Zustand stores are plain TypeScript modules.
 */

import { create } from "zustand";
import { detectDefaultUnitSystem, type UnitSystem } from "@/lib/utils/units";

const STORAGE_KEY = "unit-preference";

function readStoredPreference(): UnitSystem | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "metric" || stored === "imperial" ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredPreference(value: UnitSystem): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* noop — storage unavailable */
  }
}

export interface UnitStore {
  /** Current unit system. `null` means "not yet initialised". */
  unitSystem: UnitSystem | null;
  /** Initialise from locale default + localStorage override. Idempotent. */
  initFromLocale: (locale: string) => void;
  /** Toggle between metric ↔ imperial, persist to localStorage. */
  toggleUnits: () => void;
}

export const useUnitStore = create<UnitStore>()((set, get) => ({
  unitSystem: null,

  initFromLocale: (locale: string) => {
    // Only initialise once — subsequent calls are no-ops.
    if (get().unitSystem !== null) return;
    const stored = readStoredPreference();
    set({ unitSystem: stored ?? detectDefaultUnitSystem(locale) });
  },

  toggleUnits: () => {
    const current = get().unitSystem ?? "metric";
    const next: UnitSystem = current === "metric" ? "imperial" : "metric";
    writeStoredPreference(next);
    set({ unitSystem: next });
  },
}));
