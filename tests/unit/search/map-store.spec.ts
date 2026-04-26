/**
 * Story 3.2: Interactive Map with Property Pins
 * Module: src/store/map-store.ts
 *
 * TDD RED PHASE — all tests use it() and will FAIL until map-store is implemented.
 *
 * Covers:
 *   AC #8 — Map state (center, zoom, bounds) managed via Zustand store (AR10)
 *
 * Environment: node (no jsdom needed — Zustand stores are plain TypeScript modules)
 *
 * Architecture note from story:
 *   - map-store.ts MUST NOT have 'use client' directive
 *   - Default center: { lng: -83.70, lat: 9.38 } (midpoint Pérez Zeledón / Dominical)
 *   - Default zoom: 10
 *   - Store shape: useMapStore hook with setCenter, setZoom, setBounds actions
 */

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Module under test — imported AFTER any mocks (none needed for pure store)
// ---------------------------------------------------------------------------

import { useMapStore } from "@/store/map-store"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMapStore — Zustand map state store (AC #8)", () => {
  // -------------------------------------------------------------------------
  // Default state
  // -------------------------------------------------------------------------

  it(
    "[P0] initial state has center at lng: -83.70, lat: 9.38 (southern Costa Rica midpoint)",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const state = useMapStore.getState();

      expect(state.center).toEqual({ lng: -83.7, lat: 9.38 });
    },
  );

  it(
    "[P0] initial state has zoom: 10",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const state = useMapStore.getState();

      expect(state.zoom).toBe(10);
    },
  );

  it(
    "[P0] initial state has bounds: null",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const state = useMapStore.getState();

      expect(state.bounds).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // setCenter action
  // -------------------------------------------------------------------------

  it(
    "[P0] setCenter updates center to new lng/lat values",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const newCenter = { lng: -83.9, lat: 9.5 };

      useMapStore.getState().setCenter(newCenter);

      const state = useMapStore.getState();
      expect(state.center).toEqual(newCenter);
    },
  );

  it(
    "[P0] setCenter does not change zoom or bounds",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const originalState = useMapStore.getState();
      const originalZoom = originalState.zoom;
      const originalBounds = originalState.bounds;

      useMapStore.getState().setCenter({ lng: -84.0, lat: 9.0 });

      const state = useMapStore.getState();
      expect(state.zoom).toBe(originalZoom);
      expect(state.bounds).toBe(originalBounds);
    },
  );

  // -------------------------------------------------------------------------
  // setZoom action
  // -------------------------------------------------------------------------

  it(
    "[P0] setZoom updates zoom to new value",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      useMapStore.getState().setZoom(14);

      const state = useMapStore.getState();
      expect(state.zoom).toBe(14);
    },
  );

  it(
    "[P0] setZoom does not change center or bounds",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const originalCenter = useMapStore.getState().center;

      useMapStore.getState().setZoom(8);

      const state = useMapStore.getState();
      expect(state.center).toEqual(originalCenter);
    },
  );

  // -------------------------------------------------------------------------
  // setBounds action
  // -------------------------------------------------------------------------

  it(
    "[P0] setBounds updates bounds to the provided MapBounds object",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const newBounds = { north: 11, south: 7, east: -81, west: -86 };

      useMapStore.getState().setBounds(newBounds);

      const state = useMapStore.getState();
      expect(state.bounds).toEqual(newBounds);
    },
  );

  it(
    "[P0] setBounds does not change center or zoom",
    () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const originalCenter = useMapStore.getState().center;
      const originalZoom = useMapStore.getState().zoom;

      useMapStore.getState().setBounds({ north: 10, south: 8, east: -82, west: -85 });

      const state = useMapStore.getState();
      expect(state.center).toEqual(originalCenter);
      expect(state.zoom).toBe(originalZoom);
    },
  );

  // -------------------------------------------------------------------------
  // Store architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] store exports 'useMapStore' named hook (not default export)",
    async () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const storeModule = await import("@/store/map-store");

      expect(storeModule.useMapStore).toBeDefined();
      expect(typeof storeModule.useMapStore).toBe("function");
    },
  );

  it(
    "[P1] store file does NOT contain 'use client' directive (AR10: stores are plain modules)",
    async () => {
      // THIS TEST WILL FAIL — map-store.ts not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const storePath = path.resolve(process.cwd(), "src/store/map-store.ts");

      expect(fs.existsSync(storePath)).toBe(true);

      const content = fs.readFileSync(storePath, "utf8");
      expect(content).not.toContain("'use client'");
      expect(content).not.toContain('"use client"');
    },
  );
});
