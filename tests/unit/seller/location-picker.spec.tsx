/**
 * Story 5.1: Seller Landing Page & "List With Us" Form — Unit/Component Tests
 * Component: src/components/seller/location-picker.tsx
 *
 * TDD Phase: GREEN — tests active after LocationPicker implementation.
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
  MapViewLoader: vi.fn(
    ({
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
    ),
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { resolve as pathResolve } from "node:path";
import { render, fireEvent, cleanup, act } from "@testing-library/react";

// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render LocationPicker
// ---------------------------------------------------------------------------

async function renderLocationPicker(
  value = { text: "", lat: null as number | null, lng: null as number | null },
  onChange = vi.fn(),
  locale = "en",
) {
  // Dynamic import after mocks are established (ESM-compatible; require() doesn't resolve @/ aliases)
  const { LocationPicker } = await import("@/components/seller/location-picker");
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
  it("[P0] 5.1-COMP-001: clicking the map triggers onChange with lat and lng captured (R-004)", async () => {
    // The map is shown only after 2s delay in real implementation,
    // but the mock renders immediately via vi.useFakeTimers or by direct render.
    // Since the component uses setTimeout(2000), we need to advance timers.
    vi.useFakeTimers();

    const onChange = vi.fn();
    await renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

    // Advance timers to trigger the 2s map load delay
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // Map container renders (mocked immediately after timers advance)
    const mapContainer = document.querySelector('[data-testid="location-map"]');
    expect(mapContainer).not.toBeNull();

    // Simulate map click (our mock calls onMapClick with { lng: -83.7, lat: 9.37 })
    await act(async () => {
      fireEvent.click(mapContainer as Element);
    });

    vi.useRealTimers();

    // onChange must have been called with lat/lng values (R-004 mitigation)
    expect(onChange).toHaveBeenCalledTimes(1);
    const callArg = onChange.mock.calls[0][0] as {
      text: string;
      lat: number | null;
      lng: number | null;
    };
    expect(callArg.lat).toBe(9.37);
    expect(callArg.lng).toBe(-83.7);
  });

  it("[P0] 5.1-COMP-001b: lat/lng captured from map pin-drop are non-null after click (R-004)", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    await renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    // The MapViewLoader mock renders immediately once the timer fires; map must be present.
    const mapContainer = document.querySelector('[data-testid="location-map"]');
    expect(mapContainer).not.toBeNull();

    await act(async () => {
      fireEvent.click(mapContainer as Element);
    });

    vi.useRealTimers();

    expect(onChange).toHaveBeenCalled();
    const result = onChange.mock.calls[0][0] as { lat: number | null; lng: number | null };
    // Coordinates must be non-null (not silently dropped — R-004)
    expect(result.lat).not.toBeNull();
    expect(result.lng).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Text field rendering and behavior
// ---------------------------------------------------------------------------

describe("LocationPicker — text field", () => {
  it("[P1] text input is rendered with data-testid='location-text-input'", async () => {
    await renderLocationPicker();

    const textInput = document.querySelector('[data-testid="location-text-input"]');
    expect(textInput).not.toBeNull();
  });

  it("[P1] typing into the text field triggers onChange with updated text value", async () => {
    const onChange = vi.fn();
    await renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

    const textInput = document.querySelector(
      '[data-testid="location-text-input"]',
    ) as HTMLInputElement | null;
    expect(textInput).not.toBeNull();

    // Use fireEvent.change for controlled inputs — sets full value at once
    fireEvent.change(textInput!, { target: { value: "Platanillo" } });

    // onChange must be called with the new text
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.text).toContain("Platanillo");
  });

  it("[P1] text field renders with correct placeholder text", async () => {
    await renderLocationPicker();

    const textInput = document.querySelector(
      '[data-testid="location-text-input"]',
    ) as HTMLInputElement | null;
    expect(textInput).not.toBeNull();
    expect(textInput?.placeholder).toMatch(/address|landmark/i);
  });

  it("[P1] location-picker.tsx is a 'use client' component (file content check)", () => {
    const filePath = pathResolve(process.cwd(), "src/components/seller/location-picker.tsx");
    const src = readFileSync(filePath, "utf8");
    expect(src.trimStart()).toMatch(/^['"]use client['"]/);
  });
});

// ---------------------------------------------------------------------------
// Map container rendering
// ---------------------------------------------------------------------------

describe("LocationPicker — map container", () => {
  it("[P1] map container has data-testid='location-map' after timer fires", async () => {
    vi.useFakeTimers();
    await renderLocationPicker();

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    vi.useRealTimers();

    // Map container renders (possibly after short delay in real implementation)
    // In this test the MapViewLoader mock renders immediately
    const mapContainer = document.querySelector('[data-testid="location-map"]');
    expect(mapContainer).not.toBeNull();
  });

  it("[P2] text field is visible immediately (before map loads) — progressive load contract", async () => {
    // Before any timers fire, the text field must be present
    await renderLocationPicker();

    const textInput = document.querySelector('[data-testid="location-text-input"]');
    expect(textInput).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Fallback: map fails to load
// ---------------------------------------------------------------------------

describe("LocationPicker — map failure fallback", () => {
  it("[P1] text field remains functional when in initial text-only mode (fallback)", async () => {
    // Before timers fire (map not loaded yet), component is in text-only mode
    const onChange = vi.fn();
    await renderLocationPicker({ text: "", lat: null, lng: null }, onChange);

    // Text input must still be present
    const textInput = document.querySelector('[data-testid="location-text-input"]');
    expect(textInput).not.toBeNull();

    // Text input must be usable
    fireEvent.change(textInput as HTMLElement, { target: { value: "San Gerardo" } });
    expect(onChange).toHaveBeenCalled();
  });
});
