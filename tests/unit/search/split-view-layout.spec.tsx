/**
 * Story 3.1: Search Page Layout & Split-View
 * Component: src/components/search/split-view-layout.tsx
 *
 * Covers:
 *   AC #1 — Desktop split-view: map 60% left, scrollable grid 40% right (≥1024px)
 *   AC #2 — Full-map toggle: map 100%, grid hidden
 *   AC #3 — Full-grid toggle: grid 100%, map hidden
 *   AC #4 — Tablet 60/40 split with side-panel toggle (768–1023px)
 *   AC #5 — Mobile: map fullscreen + pull-up handle stub at bottom (<768px)
 *   AC #1 — Map container (data-testid="map-container") renders when map visible
 *
 * Story 3.2 regression fix: data-testid="map-placeholder" is replaced by
 * data-testid="map-container" (on MapViewLoader's loading fallback and MapView wrapper).
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
}));

// next-intl is used by the pull-up handle for the property count label.
// Return a stub that mimics ICU-style plural interpolation.
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string, values?: Record<string, unknown>) => {
    if (key === "propertiesCount" && values && "count" in values) {
      return `${values.count as number} properties`;
    }
    return key;
  }),
}));

vi.mock("@/components/search/search-results-skeleton", () => ({
  SearchResultsSkeleton: () => <div data-testid="search-results-skeleton" />,
}));

// Story 3.2: Mock MapView (replaces the map-placeholder div).
// MapViewLoader's loading fallback renders data-testid="map-container".
// The mock here simulates that loading state so SplitViewLayout tests
// continue to pass without requiring Mapbox to render in jsdom.
vi.mock("@/components/map/map-view-loader", () => ({
  MapView: (_props: Record<string, unknown>) => (
    <div data-testid="map-container" className="h-full w-full bg-muted animate-pulse" />
  ),
}));

vi.mock("@/components/search/view-mode-toggle", () => ({
  ViewModeToggle: ({
    viewMode,
    onViewModeChange,
  }: {
    viewMode: string;
    onViewModeChange: (mode: string) => void;
  }) => (
    <div
      data-testid="view-mode-toggle"
      data-active-mode={viewMode}
      onClick={() => onViewModeChange("map")}
    />
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { SplitViewLayout } from "@/components/search/split-view-layout";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const noop = () => {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SplitViewLayout", () => {
  // -------------------------------------------------------------------------
  // AC #1: Desktop split-view (default — viewMode="split")
  // -------------------------------------------------------------------------

  it(
    "[P0] renders map panel with lg:w-[60%] and grid panel with lg:w-[40%] when viewMode='split'",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');
      const gridPanel = document.querySelector('[data-testid="grid-panel"]');

      expect(mapPanel).not.toBeNull();
      expect(gridPanel).not.toBeNull();
      // Desktop responsive classes — mobile-first; lg: prefix targets ≥1024px
      expect(mapPanel?.className).toContain("lg:w-[60%]");
      expect(gridPanel?.className).toContain("lg:w-[40%]");

      // Grid panel must be scrollable
      expect(gridPanel?.className).toContain("overflow-y-auto");
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Map placeholder renders when map panel is visible
  // -------------------------------------------------------------------------

  // Story 3.2 regression fix: this test is updated from 'map-placeholder' to 'map-container'.
  // It is skipped until Task 9 (wire MapView into SplitViewLayout) is implemented.
  // Task 9 is complete — MapView is now wired into SplitViewLayout.
  it(
    "[P0] renders data-testid='map-container' inside map panel when map is visible (Story 3.2: replaces map-placeholder)",
    () => {
      // THIS TEST WILL FAIL until Task 9 wires MapView into SplitViewLayout
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      // Story 3.2 regression fix: data-testid="map-placeholder" is replaced by
      // data-testid="map-container" on the MapView/MapViewLoader component.
      const mapContainer = document.querySelector('[data-testid="map-container"]');

      expect(mapContainer).not.toBeNull();
      expect(mapContainer?.className).toContain("bg-muted");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Full-map toggle
  // -------------------------------------------------------------------------

  it(
    "[P0] hides grid panel (adds 'lg:hidden' class) and expands map panel to 'lg:w-full' when viewMode='map'",
    () => {
      render(<SplitViewLayout viewMode="map" onViewModeChange={noop} />);

      const gridPanel = document.querySelector('[data-testid="grid-panel"]');

      expect(gridPanel).not.toBeNull();
      // Grid panel is hidden on desktop when full-map mode is active.
      // The base 'hidden' class is always present (mobile-first); 'lg:hidden' is what
      // specifically removes the panel at desktop breakpoint in this mode.
      expect(gridPanel?.className).toContain("lg:hidden");
      // Ensure the lg:block override (present in split/grid mode) is NOT applied
      expect(gridPanel?.className).not.toContain("lg:block");

      const mapPanel = document.querySelector('[data-testid="map-panel"]');
      // Map panel must use lg:w-full (not just the base w-full which is always present)
      expect(mapPanel?.className).toContain("lg:w-full");
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Full-grid toggle
  // -------------------------------------------------------------------------

  it(
    "[P0] hides map panel (adds 'lg:hidden' class) and expands grid panel to 'lg:w-full' when viewMode='grid'",
    () => {
      render(<SplitViewLayout viewMode="grid" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');

      expect(mapPanel).not.toBeNull();
      // Map panel is hidden on desktop in full-grid mode via lg:hidden.
      expect(mapPanel?.className).toContain("lg:hidden");
      // Ensure the desktop-width classes (lg:w-[60%], lg:w-full) are NOT on the map panel
      expect(mapPanel?.className).not.toContain("lg:w-");

      const gridPanel = document.querySelector('[data-testid="grid-panel"]');
      // Grid panel must use lg:w-full (not just a base class)
      expect(gridPanel?.className).toContain("lg:w-full");
    },
  );

  // -------------------------------------------------------------------------
  // AC #5: Mobile pull-up handle stub
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='pull-up-handle' element at mobile viewport",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const pullUpHandle = document.querySelector('[data-testid="pull-up-handle"]');

      expect(pullUpHandle).not.toBeNull();

      // Stub must not have an onClick handler (non-interactive per story scope)
      expect((pullUpHandle as HTMLElement | null)?.onclick).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Tablet 60/40 split with side-panel toggle
  // -------------------------------------------------------------------------

  it(
    "[P1] renders side-panel toggle button with aria-expanded on tablet viewport",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const toggleButton = document.querySelector("[aria-expanded]");

      expect(toggleButton).not.toBeNull();
      expect((toggleButton as HTMLElement | null)?.getAttribute("aria-expanded")).toBeDefined();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Split-view map panel height accounts for header + filter bar
  // -------------------------------------------------------------------------

  it(
    "[P1] map panel height uses calc(100vh - var(--header-height) - 3.5rem) on desktop",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');

      expect(mapPanel).not.toBeNull();
      const hasCalcHeight =
        mapPanel?.className.includes("calc(100vh") ||
        (mapPanel as HTMLElement | null)?.style.height.includes("calc(100vh");

      expect(hasCalcHeight).toBe(true);
    },
  );

  // -------------------------------------------------------------------------
  // ViewModeToggle rendered (desktop/tablet only)
  // -------------------------------------------------------------------------

  it(
    "[P2] renders ViewModeToggle above split panels on desktop",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const toggle = document.querySelector('[data-testid="view-mode-toggle"]');
      expect(toggle).not.toBeNull();
      expect(toggle?.getAttribute("data-active-mode")).toBe("split");
    },
  );

  // -------------------------------------------------------------------------
  // SearchResultsSkeleton used as grid placeholder
  // -------------------------------------------------------------------------

  it(
    "[P2] renders SearchResultsSkeleton inside grid panel as placeholder",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const skeleton = document.querySelector('[data-testid="search-results-skeleton"]');
      expect(skeleton).not.toBeNull();
    },
  );
});
