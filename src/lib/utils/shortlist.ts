/**
 * Story 7.1: Save & Shortlist Properties
 * Pure utilities for localStorage/sessionStorage management
 */

const LOCAL_STORAGE_KEY = "remax-altitud-shortlist";
const SESSION_STORAGE_KEY = "remax-altitud-shortlist-tooltip-shown";
const SHORTLIST_LIMIT = 20;

export function getShortlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
}

export function addToShortlist(id: string): { success: boolean; error?: "limit" | "unknown" } {
  if (typeof window === "undefined") {
    return { success: false, error: "unknown" };
  }
  try {
    const current = getShortlist();
    if (current.includes(id)) {
      return { success: true };
    }
    if (current.length >= SHORTLIST_LIMIT) {
      return { success: false, error: "limit" };
    }
    const updated = [...current, id];
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (e) {
    return { success: false, error: "unknown" };
  }
}

export function removeFromShortlist(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const current = getShortlist();
    if (!current.includes(id)) {
      return;
    }
    const updated = current.filter((item) => item !== id);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Fail silently
  }
}

export function hasShownTooltipThisSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
  } catch (e) {
    return false;
  }
}

export function markTooltipShownThisSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
  } catch (e) {
    // Fail silently
  }
}
