/**
 * Story 3.2: Interactive Map with Property Pins
 * Module: src/lib/map/geo-utils.ts
 *
 * TDD RED PHASE — all tests use it() and will FAIL until geo-utils is implemented.
 *
 * Covers:
 *   AC #1  — formatPriceAbbrev used in MapPricePin price display
 *   AC #4  — formatPriceAbbrev used in MapPropertyPopup (abbreviated price)
 *   AC #5  — boundsFromMapboxEvent used to extract bounds from map move event
 *
 * Environment: node (pure function tests — no jsdom needed)
 *
 * Functions under test:
 *   formatPriceAbbrev(price: number): string
 *     - ≥1,000,000 → "$1.2M"
 *     - ≥1,000     → "$250K"
 *     - <1,000     → "$500"
 *
 *   boundsFromMapboxEvent(event: ViewStateChangeEvent): MapBounds
 *     - Extracts north/south/east/west from event.target.getBounds()
 */

import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module under test — imported AFTER mocks (none needed for pure functions)
// ---------------------------------------------------------------------------

import { formatPriceAbbrev, boundsFromMapboxEvent } from "@/lib/map/geo-utils"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Tests: formatPriceAbbrev
// ---------------------------------------------------------------------------

describe("formatPriceAbbrev — price abbreviation utility (AC #1, AC #4)", () => {
  // -------------------------------------------------------------------------
  // Millions threshold (≥ 1,000,000)
  // -------------------------------------------------------------------------

  it(
    "[P0] returns '$1.2M' for price 1_200_000 (AC #1, #4 — story example)",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(1_200_000)).toBe("$1.2M");
    },
  );

  it(
    "[P0] returns '$1.0M' for exactly 1_000_000",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(1_000_000)).toBe("$1.0M");
    },
  );

  it(
    "[P0] returns '$2.5M' for price 2_500_000",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(2_500_000)).toBe("$2.5M");
    },
  );

  // -------------------------------------------------------------------------
  // Thousands threshold (≥ 1,000 and < 1,000,000)
  // -------------------------------------------------------------------------

  it(
    "[P0] returns '$250K' for price 250_000 (AC #1, #4 — story example)",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(250_000)).toBe("$250K");
    },
  );

  it(
    "[P0] returns '$1K' for exactly 1_000",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(1_000)).toBe("$1K");
    },
  );

  it(
    "[P0] returns '$999K' for 999_000",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(999_000)).toBe("$999K");
    },
  );

  // -------------------------------------------------------------------------
  // Sub-thousand (< 1,000) — full dollar amount
  // -------------------------------------------------------------------------

  it(
    "[P0] returns '$500' for price 500 (AC #1, #4 — story example)",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(500)).toBe("$500");
    },
  );

  it(
    "[P0] returns '$0' for price 0",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(0)).toBe("$0");
    },
  );

  it(
    "[P0] returns '$999' for price 999",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      expect(formatPriceAbbrev(999)).toBe("$999");
    },
  );
});

// ---------------------------------------------------------------------------
// Tests: boundsFromMapboxEvent
// ---------------------------------------------------------------------------

describe("boundsFromMapboxEvent — extract MapBounds from ViewStateChangeEvent (AC #5)", () => {
  /**
   * Creates a minimal mock ViewStateChangeEvent with getBounds() implementation.
   * This mirrors the react-map-gl v7 onMove event shape:
   *   event.target.getBounds().getNorth() / getSouth() / getEast() / getWest()
   */
  const makeMockMapEvent = (north: number, south: number, east: number, west: number) => ({
    viewState: {
      longitude: (east + west) / 2,
      latitude: (north + south) / 2,
      zoom: 10,
    },
    target: {
      getBounds: () => ({
        getNorth: () => north,
        getSouth: () => south,
        getEast: () => east,
        getWest: () => west,
      }),
    },
  });

  it(
    "[P0] extracts north, south, east, west from the map event's getBounds() (AC #5)",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      const event = makeMockMapEvent(11, 7, -81, -86);
      const bounds = boundsFromMapboxEvent(event as any);

      expect(bounds).toEqual({
        north: 11,
        south: 7,
        east: -81,
        west: -86,
      });
    },
  );

  it(
    "[P0] returns a MapBounds object with all four cardinal direction keys (AC #5)",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      const event = makeMockMapEvent(9.5, 9.0, -83.5, -84.0);
      const bounds = boundsFromMapboxEvent(event as any);

      expect(bounds).toHaveProperty("north");
      expect(bounds).toHaveProperty("south");
      expect(bounds).toHaveProperty("east");
      expect(bounds).toHaveProperty("west");
    },
  );

  it(
    "[P0] returns correct values for a tight local viewport (zoomed in near Uvita)",
    () => {
      // THIS TEST WILL FAIL — geo-utils.ts not yet implemented
      const event = makeMockMapEvent(9.16, 9.13, -83.73, -83.77);
      const bounds = boundsFromMapboxEvent(event as any);

      expect(bounds.north).toBeCloseTo(9.16, 5);
      expect(bounds.south).toBeCloseTo(9.13, 5);
      expect(bounds.east).toBeCloseTo(-83.73, 5);
      expect(bounds.west).toBeCloseTo(-83.77, 5);
    },
  );
});
