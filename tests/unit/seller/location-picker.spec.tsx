/**
 * Story 5.1: Seller Landing Page & "List With Us" Form — ATDD Red-Phase Unit/Component Scaffold
 * Component: src/components/seller/location-picker.tsx
 *
 * TDD Phase: RED — all tests use it.skip() until LocationPicker is implemented.
 * Remove it.skip() per test when implementing to verify green phase.
 *
 * Covers (from test-design-epic-5.md):
 *   5.1-COMP-001 — Map pin-drop event captures lat/lng into form state (P0, R-004)
 *
 * data-testid contract (CANNOT rename once established):
 *   data-testid="location-text-input"  — Text address input
 *   data-testid="location-map"         — Map container
 *
 * Architecture notes:
 *   - LocationPicker is a 'use client' component
 *   - Text field renders immediately (SSR-safe)
 *   - Map loads progressively after 2s via setTimeout/useEffect
 *   - If map fails (onerror / 5s timeout), component stays text-only
 *   - Map pin drop: listen to Mapbox onClick; store [lng, lat] in state
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

// Mock MapViewLoader to avoid Mapbox GL JS in jsdom
vi.mock("@/components/map/map-view-loader", () => ({
  MapViewLoader: vi.fn(({
    onMapClick,
    "data-testid": testId,
  }: {
    onMapClick?: (coords: { lng: number; lat: number }) => void;
    "data-testid"?: string;
  }) => (
    <div
      data-testid={testId ?? "location-map"}
      onClick={() => onMapClick?.({ lng: -83.7, lat: 9.37 })}
    >
      Map Mock
    </div>
  )),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render LocationPicker
// ---------------------------------------------------------------------------

function renderLocationPicker(
  value = { text: "", lat: null as number | null, lng: null as number | null },
  onChange = vi.fn(),
  locale = "en",
) {
  // Dynamic require after mocks are established
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { LocationPicker } = require("@/components/seller/location-picker");
  return render(
    <LocationPicker
      value={value}
      onChange={onChange}
      locale={locale}
      placeholder="Type address or nearest landmark"
    />,
  );
}

// ---------------------------------------------------------------------------
// 5.1-COMP-001: Map pin-drop captures lat/lng (P0, R-004)
// ---------------------------------------------------------------------------

describe("LocationPicker — map pin-drop (5.1-COMP-001)", () => {
  it.skip(
    "[P0] 5.1-COMP-001: clicking the map triggers onChange with lat and lng captured (R-004)",
    async () => {
      // THIS TEST WILL FAIL — LocationPicker not yet implemented
      const onChange = vi.fn();
      renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

      // Wait for map to be present (progressive load — mocked immediately)
      const mapContainer = await screen.findByTestId("location-map");
      expect(mapContainer).toBeInTheDocument();

      // Simulate map click (our mock calls onMapClick with { lng: -83.7, lat: 9.37 })
      await act(async () => {
        fireEvent.click(mapContainer);
      });

      // onChange must have been called with lat/lng values (R-004 mitigation)
      expect(onChange).toHaveBeenCalledTimes(1);
      const callArg = onChange.mock.calls[0][0] as { text: string; lat: number | null; lng: number | null };
      expect(callArg.lat).toBe(9.37);
      expect(callArg.lng).toBe(-83.7);
    },
  );

  it.skip(
    "[P0] 5.1-COMP-001b: lat/lng captured from map pin-drop are non-null after click (R-004)",
    async () => {
      // THIS TEST WILL FAIL — LocationPicker not yet implemented
      const onChange = vi.fn();
      renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

      const mapContainer = await screen.findByTestId("location-map");
      await act(async () => {
        fireEvent.click(mapContainer);
      });

      expect(onChange).toHaveBeenCalled();
      const result = onChange.mock.calls[0][0] as { lat: number | null; lng: number | null };
      // Coordinates must be non-null (not silently dropped — R-004)
      expect(result.lat).not.toBeNull();
      expect(result.lng).not.toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// Text field rendering and behavior
// ---------------------------------------------------------------------------

describe("LocationPicker — text field", () => {
  it.skip(
    "[P1] text input is rendered with data-testid='location-text-input'",
    () => {
      // THIS TEST WILL FAIL — LocationPicker not yet implemented
      renderLocationPicker();

      const textInput = document.querySelector('[data-testid="location-text-input"]');
      expect(textInput).not.toBeNull();
    },
  );

  it.skip(
    "[P1] typing into the text field triggers onChange with updated text value",
    async () => {
      // THIS TEST WILL FAIL — LocationPicker not yet implemented
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

      const textInput = document.querySelector('[data-testid="location-text-input"]') as HTMLInputElement | null;
      expect(textInput).not.toBeNull();

      await user.type(textInput!, "Platanillo");

      // onChange must be called with the new text
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.text).toContain("Platanillo");
    },
  );

  it.skip(
    "[P1] text field renders with correct placeholder text",
    () => {
      // THIS TEST WILL FAIL — LocationPicker not yet implemented
      renderLocationPicker();

      const textInput = document.querySelector('[data-testid="location-text-input"]') as HTMLInputElement | null;
      expect(textInput).not.toBeNull();
      expect(textInput?.placeholder).toMatch(/address|landmark/i);
    },
  );

  it.skip(
    "[P1] location-picker.tsx is a 'use client' component (file content check)",
    () => {
      // THIS TEST WILL FAIL — location-picker.tsx not yet created
      const { readFileSync } = require("fs");
      const path = require("path");
      const filePath = path.resolve(
        process.cwd(),
        "src/components/seller/location-picker.tsx",
      );
      const src = readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});

// ---------------------------------------------------------------------------
// Map container rendering
// ---------------------------------------------------------------------------

describe("LocationPicker — map container", () => {
  it.skip(
    "[P1] map container has data-testid='location-map'",
    async () => {
      // THIS TEST WILL FAIL — LocationPicker map integration not yet implemented
      renderLocationPicker();

      // Map container renders (possibly after short delay in real implementation)
      // In this test the MapViewLoader mock renders immediately
      const mapContainer = document.querySelector('[data-testid="location-map"]');
      expect(mapContainer).not.toBeNull();
    },
  );

  it.skip(
    "[P2] text field is visible immediately (before map loads) — progressive load contract",
    () => {
      // THIS TEST WILL FAIL — LocationPicker not yet implemented
      // Before any timers fire, the text field must be present
      renderLocationPicker();

      const textInput = document.querySelector('[data-testid="location-text-input"]');
      expect(textInput).not.toBeNull();
    },
  );
});

// ---------------------------------------------------------------------------
// Fallback: map fails to load
// ---------------------------------------------------------------------------

describe("LocationPicker — map failure fallback", () => {
  it.skip(
    "[P1] text field remains functional when map loader is not available (fallback mode, AC #4)",
    () => {
      // THIS TEST WILL FAIL — LocationPicker fallback not yet implemented
      // Override mock to simulate map load failure
      vi.mock("@/components/map/map-view-loader", () => ({
        MapViewLoader: null, // map not available
      }));

      const onChange = vi.fn();
      renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

      // Text input must still be present
      const textInput = document.querySelector('[data-testid="location-text-input"]');
      expect(textInput).not.toBeNull();

      // Text input must be usable
      fireEvent.change(textInput as HTMLElement, { target: { value: "San Gerardo" } });
      expect(onChange).toHaveBeenCalled();
    },
  );
});
