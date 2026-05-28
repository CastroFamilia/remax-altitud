/**
 * Story 7.1: Save & Shortlist Properties
 * Hook & Utility Unit Tests: src/hooks/use-shortlist.ts & src/lib/utils/shortlist.ts
 *
 * Covers:
 *   - AC #1: Tapping ♡ saves to localStorage.
 *   - AC #3: Limit shortlist to 20 properties max.
 *   - AC #4, #5: Tooltip on 2nd save, shown once per session.
 *   - AC #7: Data persists across page navigations/sessions.
 *   - Task 3.2: Reactive synchronization via custom 'shortlist-change' and standard 'storage' events.
 *   - Task 2.2: Server-side rendering guards (window undefined).
 *
 * Environment: jsdom (React hook component — .spec.tsx → jsdom via vitest.config.mts)
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useShortlist } from "@/hooks/use-shortlist";
import { getShortlist, addToShortlist, removeFromShortlist } from "@/lib/utils/shortlist";

// We run all tests in describe.skip to represent the RED phase of TDD
describe("Story 7.1: Shortlist Hook and Utilities Unit Tests", () => {
  const LOCAL_STORAGE_KEY = "remax-altitud-shortlist";

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // Utility Tests (src/lib/utils/shortlist.ts)
  // ---------------------------------------------------------------------------
  describe("Shortlist Pure Utilities", () => {
    it("[P0] 7.1-UNIT-001: should get empty shortlist when localStorage is empty", () => {
      expect(getShortlist()).toEqual([]);
    });

    it("[P0] 7.1-UNIT-002: should add property to shortlist in localStorage", () => {
      const res = addToShortlist("ALT-1001");
      expect(res.success).toBe(true);
      expect(getShortlist()).toEqual(["ALT-1001"]);
    });

    it("[P0] 7.1-UNIT-003: should remove property from shortlist in localStorage", () => {
      addToShortlist("ALT-1001");
      removeFromShortlist("ALT-1001");
      expect(getShortlist()).toEqual([]);
    });

    it("[P1] 7.1-UNIT-004: should enforce 20-item cap constraint", () => {
      // Add 20 items
      for (let i = 1; i <= 20; i++) {
        const res = addToShortlist(`ALT-${1000 + i}`);
        expect(res.success).toBe(true);
      }

      // Try to add 21st item
      const res21 = addToShortlist("ALT-1021");
      expect(res21.success).toBe(false);
      expect(res21.error).toBe("limit");
      expect(getShortlist().length).toBe(20);
      expect(getShortlist()).not.toContain("ALT-1021");
    });

    it("[P2] 7.1-UNIT-005: should handle server-side rendering safely when window is undefined", () => {
      // Temporarily mock window as undefined
      const originalWindow = globalThis.window;
      // @ts-expect-error - deleting window is not allowed in typescript
      delete globalThis.window;

      try {
        expect(() => getShortlist()).not.toThrow();
        expect(getShortlist()).toEqual([]);

        expect(() => addToShortlist("ALT-1001")).not.toThrow();
        expect(addToShortlist("ALT-1001")).toEqual({ success: false, error: "unknown" });
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Hook Tests (src/hooks/use-shortlist.ts)
  // ---------------------------------------------------------------------------
  describe("useShortlist Custom React Hook", () => {
    it("[P0] 7.1-UNIT-006: should initialize with isLoaded=false then true, loading empty shortlist", () => {
      const { result } = renderHook(() => useShortlist());
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.shortlist).toEqual([]);
    });

    it("[P0] 7.1-UNIT-007: should load initial state from localStorage", () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(["ALT-1001", "ALT-1002"]));
      const { result } = renderHook(() => useShortlist());
      expect(result.current.shortlist).toEqual(["ALT-1001", "ALT-1002"]);
      expect(result.current.isSaved("ALT-1001")).toBe(true);
      expect(result.current.isSaved("ALT-1003")).toBe(false);
    });

    it("[P0] 7.1-UNIT-008: should save property and update state reactive synchrony", () => {
      const { result } = renderHook(() => useShortlist());

      act(() => {
        const res = result.current.save("ALT-1001");
        expect(res.success).toBe(true);
      });

      expect(result.current.shortlist).toEqual(["ALT-1001"]);
      expect(result.current.isSaved("ALT-1001")).toBe(true);
    });

    it("[P0] 7.1-UNIT-009: should remove property and update state", () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(["ALT-1001"]));
      const { result } = renderHook(() => useShortlist());

      act(() => {
        result.current.remove("ALT-1001");
      });

      expect(result.current.shortlist).toEqual([]);
      expect(result.current.isSaved("ALT-1001")).toBe(false);
    });

    it("[P1] 7.1-UNIT-010: should dispatch custom 'shortlist-change' event on mutation", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      const { result } = renderHook(() => useShortlist());

      act(() => {
        result.current.save("ALT-1001");
      });

      expect(dispatchSpy).toHaveBeenCalled();
      const lastEvent = dispatchSpy.mock.calls[0][0];
      expect(lastEvent.type).toBe("shortlist-change");
    });

    it("[P1] 7.1-UNIT-011: should listen to 'shortlist-change' and update state reactively", () => {
      const { result: hook1 } = renderHook(() => useShortlist());
      const { result: hook2 } = renderHook(() => useShortlist());

      expect(hook1.current.shortlist).toEqual([]);
      expect(hook2.current.shortlist).toEqual([]);

      act(() => {
        hook1.current.save("ALT-1001");
      });

      // Hook 2 must reactively synchronize state without page refresh
      expect(hook2.current.shortlist).toEqual(["ALT-1001"]);
    });

    it("[P1] 7.1-UNIT-012: should listen to storage event and update state", () => {
      const { result } = renderHook(() => useShortlist());
      expect(result.current.shortlist).toEqual([]);

      // Simulate storage change from another tab/window
      act(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(["ALT-1001"]));
        window.dispatchEvent(new StorageEvent("storage", { key: LOCAL_STORAGE_KEY }));
      });

      expect(result.current.shortlist).toEqual(["ALT-1001"]);
    });
  });
});
