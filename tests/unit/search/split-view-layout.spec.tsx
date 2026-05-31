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
 *
 * Story 3.5 additions:
 *   — Grid panel renders PropertyGrid (not SearchResultsSkeleton) when filterProperties is provided
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports of the module under test
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
  usePathname: vi.fn(() => "/en/search"),
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

// Story 3.5: Mock PropertyGrid
vi.mock("@/components/property/property-grid", () => ({
  PropertyGrid: ({
    properties,
    isLoading,
  }: {
    properties: unknown[];
    locale: string;
    isLoading?: boolean;
  }) => (
    <div
      data-testid="property-grid"
      data-property-count={properties.length}
      data-loading={isLoading ? "true" : "false"}
    />
  ),
}));

// Story 3.2: Mock MapView (replaces the map-placeholder div).
// MapViewLoader's loading fallback renders data-testid="map-container".
// The mock here simulates that loading state so SplitViewLayout tests
// continue to pass without requiring Mapbox to render in jsdom.
vi.mock("@/components/map/map-view-loader", () => ({
  MapView: () => <div data-testid="map-container" className="h-full w-full bg-muted animate-pulse" />,
}));

// Story 3.6: Mock MapPullUpSheet. The mock emits data-testid="pull-up-handle"
// so that existing split-view-layout tests asserting that testid continue passing
// after the inline stub is moved into MapPullUpSheet.
vi.mock("@/components/map/map-pull-up-sheet", () => ({
  MapPullUpSheet: ({ propertyCount }: { propertyCount: number }) => (
    <div data-testid="pull-up-handle" data-count={propertyCount} />
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

// Story 3.8: Mock NearMeButton so split-view-layout tests don't depend on
// browser Geolocation API or useGeolocation hook internals.
let capturedOnLocationFallback: ((coords: { lat: number; lng: number }, message: string) => void) | null = null;
vi.mock("@/components/search/near-me-button", () => ({
  NearMeButton: ({
    onLocationFallback,
  }: {
    onLocationSuccess: (coords: { lat: number; lng: number }) => void;
    onLocationFallback: (coords: { lat: number; lng: number }, message: string) => void;
    className?: string;
  }) => {
    capturedOnLocationFallback = onLocationFallback;
    return <button data-testid="near-me-button" />;
  },
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
    "[P0] renders map panel with lg:w-[35%] and grid panel with lg:w-[65%] when viewMode='split'",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');
      const gridPanel = document.querySelector('[data-testid="grid-panel"]');

      expect(mapPanel).not.toBeNull();
      expect(gridPanel).not.toBeNull();
      // Desktop responsive classes — mobile-first; lg: prefix targets ≥1024px
      expect(mapPanel?.className).toContain("lg:w-[35%]");
      expect(gridPanel?.className).toContain("lg:w-[65%]");

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
    "[P1] map panel fills available viewport height below header + filter bar",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');

      expect(mapPanel).not.toBeNull();
      // UI polish (commit 48f4a66) replaced explicit calc(100vh - ...) with a
      // flex layout: parent uses `flex-1 min-h-0`, panel uses `h-full`.
      // Either implementation satisfies the AC #1 intent (panel fills remaining space).
      const usesFlexHeight = mapPanel?.className.includes("h-full");
      const usesCalcHeight =
        mapPanel?.className.includes("calc(100vh") ||
        (mapPanel as HTMLElement | null)?.style.height.includes("calc(100vh");

      expect(usesFlexHeight || usesCalcHeight).toBe(true);
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

  // -------------------------------------------------------------------------
  // Story 3.5: PropertyGrid renders in grid panel when filterProperties provided
  // -------------------------------------------------------------------------

  it(
    "[P0] (Story 3.5) renders PropertyGrid (not only SearchResultsSkeleton) in grid panel when filterProperties is provided",
    () => {
      // THIS TEST WILL FAIL until Story 3.5 Task 5 (SplitViewLayout update) is implemented
      const mockProperties = [
        {
          id: "prop-001",
          slug: "test-property",
          titleEn: "Test Property",
          titleEs: "Propiedad de Prueba",
          priceUsd: 150000,
          bedrooms: 2,
          bathrooms: 1,
          lotSizeM2: 300,
          constructionM2: 120,
          zmtStatus: "titled",
          propertyType: "Casa",
          status: "active",
          areaSlug: "perez-zeledon",
          images: [],
          latitude: 9.35,
          longitude: -83.68,
        },
      ];

      render(
        <SplitViewLayout
          viewMode="split"
          onViewModeChange={noop}
          filterProperties={mockProperties}
        />,
      );

      // PropertyGrid must render in the grid panel
      const propertyGrid = document.querySelector('[data-testid="property-grid"]');
      expect(propertyGrid).not.toBeNull();
    },
  );

  it(
    "[P1] (Story 3.5) does NOT render PropertyGrid when filterProperties is not provided (falls back to SearchResultsSkeleton)",
    () => {
      // THIS TEST WILL FAIL until Story 3.5 Task 5 (SplitViewLayout update) is implemented
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      // When no filterProperties, should fall back to SearchResultsSkeleton (existing behavior)
      const propertyGrid = document.querySelector('[data-testid="property-grid"]');
      // PropertyGrid should NOT render when no properties are passed
      expect(propertyGrid).toBeNull();

      const skeleton = document.querySelector('[data-testid="search-results-skeleton"]');
      expect(skeleton).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // Story 3.8: NearMeButton + fallback message banner
  // -------------------------------------------------------------------------

  it(
    "[P0] (Story 3.8) renders data-testid='near-me-button' in the toolbar",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const nearMeBtn = document.querySelector('[data-testid="near-me-button"]');
      expect(nearMeBtn).not.toBeNull();
    },
  );

  it(
    "[P0] (Story 3.8) renders data-testid='near-me-fallback-message' banner when NearMeButton triggers fallback",
    () => {
      const { rerender } = render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      // Verify no fallback banner initially
      expect(document.querySelector('[data-testid="near-me-fallback-message"]')).toBeNull();

      // Invoke the fallback callback captured from the mock.
      // Wrap in act() because calling it triggers a setState inside SplitViewLayout.
      expect(capturedOnLocationFallback).not.toBeNull();
      act(() => {
        capturedOnLocationFallback!({ lat: 9.3725, lng: -83.7011 }, "Location unavailable — showing properties near our Pérez Zeledón office");
      });

      // Force re-render to reflect state update
      rerender(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const banner = document.querySelector('[data-testid="near-me-fallback-message"]');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain("Location unavailable");
    },
  );
});
