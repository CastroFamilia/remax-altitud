"use client";

/**
 * useSearchHistory — Manages recent search history in localStorage.
 *
 * Stores up to MAX_HISTORY_SIZE recent searches with their raw query text,
 * the URL params generated, and a timestamp. This data structure is designed
 * to be easily exportable to the ALTITUD HUB via API integration.
 *
 * Storage key: "remax-altitud-search-history"
 * Storage format: SearchHistoryEntry[] (JSON serialized)
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "remax-altitud-search-history";
const MAX_HISTORY_SIZE = 8;

export interface SearchHistoryEntry {
  /** The raw query text the user typed */
  query: string;
  /** The parsed URL params (for replay) */
  params: Record<string, string>;
  /** ISO timestamp of when the search was performed */
  timestamp: string;
  /** Search mode used: "smart" or "traditional" */
  mode: "smart" | "traditional";
}

function loadHistory(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY_SIZE);
  } catch {
    return [];
  }
}

function saveHistory(entries: SearchHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_SIZE)));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);

  // Load history on mount (client-side only)
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addEntry = useCallback((entry: Omit<SearchHistoryEntry, "timestamp">) => {
    const newEntry: SearchHistoryEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => {
      // Remove any duplicate with the same query text (case-insensitive)
      const filtered = prev.filter(
        (h) => h.query.toLowerCase().trim() !== newEntry.query.toLowerCase().trim(),
      );
      // Prepend new entry, cap at MAX_HISTORY_SIZE
      const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_SIZE);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const removeEntry = useCallback((index: number) => {
    setHistory((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
  };
}

/**
 * =============================================================================
 * ALTITUD HUB INTEGRATION
 * =============================================================================
 *
 * The search history is stored in localStorage under the key:
 *   "remax-altitud-search-history"
 *
 * Format: JSON array of SearchHistoryEntry objects:
 *   [{
 *     query: "casa en uvita ocean view",
 *     params: { type: "Casa", area: "uvita", tags: "Con vista al mar", view: "split" },
 *     timestamp: "2026-05-31T17:00:00.000Z",
 *     mode: "smart"
 *   }, ...]
 *
 * --- Option A: Read directly from localStorage (same domain) ---
 *
 *   const raw = localStorage.getItem("remax-altitud-search-history");
 *   const history = raw ? JSON.parse(raw) : [];
 *
 * --- Option B: Expose via API endpoint (cross-domain / server-side) ---
 *
 *   Create an API route in the REMAX project that reads the history
 *   for an authenticated user and returns it:
 *
 *   // src/app/api/search-history/route.ts
 *   export async function GET(request: Request) {
 *     // Authenticate user via session/cookie
 *     // Return search history from DB (synced from client)
 *   }
 *
 * --- Option C: Sync to HUB via postMessage (if using iframe) ---
 *
 *   // In remax-altitud (this project):
 *   window.parent.postMessage({
 *     type: "REMAX_SEARCH_HISTORY",
 *     payload: loadHistory()
 *   }, "https://hub.altitud.cr");
 *
 *   // In ALTITUD HUB:
 *   window.addEventListener("message", (event) => {
 *     if (event.origin !== "https://remax-altitud.cr") return;
 *     if (event.data.type === "REMAX_SEARCH_HISTORY") {
 *       // Display event.data.payload in the HUB dashboard
 *     }
 *   });
 *
 * --- Option D: Sync to HUB API on each search (recommended) ---
 *
 *   After each search, POST the entry to the HUB API:
 *
 *   // In hero-search-shell.tsx, after addEntry():
 *   fetch("https://hub.altitud.cr/api/search-analytics", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       source: "remax-altitud",
 *       query: entry.query,
 *       params: entry.params,
 *       mode: entry.mode,
 *       timestamp: new Date().toISOString(),
 *       // Optional: user fingerprint or session ID
 *     }),
 *   }).catch(() => {}); // fire-and-forget
 *
 *   // HUB API endpoint:
 *   // POST /api/search-analytics
 *   // Body: { source, query, params, mode, timestamp }
 *   // Store in DB → Display in dashboard analytics
 *
 * =============================================================================
 */
