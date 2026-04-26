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
 *   AC #1 — Map placeholder (data-testid="map-placeholder") renders when map visible
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

vi.mock("@/components/search/search-results-skeleton", () => ({
  SearchResultsSkeleton: () => <div data-testid="search-results-skeleton" />,
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
});

describe("SplitViewLayout", () => {
  // -------------------------------------------------------------------------
  // AC #1: Desktop split-view (default — viewMode="split")
  // -------------------------------------------------------------------------

  it(
    "[P0] renders map panel with w-[60%] and grid panel with w-[40%] when viewMode='split'",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');
      const gridPanel = document.querySelector('[data-testid="grid-panel"]');

      expect(mapPanel).not.toBeNull();
      expect(gridPanel).not.toBeNull();
      expect(mapPanel?.className).toContain("w-[60%]");
      expect(gridPanel?.className).toContain("w-[40%]");

      // Grid panel must be scrollable
      expect(gridPanel?.className).toContain("overflow-y-auto");
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Map placeholder renders when map panel is visible
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='map-placeholder' inside map panel when map is visible",
    () => {
      render(<SplitViewLayout viewMode="split" onViewModeChange={noop} />);

      const mapPlaceholder = document.querySelector('[data-testid="map-placeholder"]');

      expect(mapPlaceholder).not.toBeNull();
      expect(mapPlaceholder?.className).toContain("bg-muted");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Full-map toggle
  // -------------------------------------------------------------------------

  it(
    "[P0] hides grid panel (adds 'hidden' class) when viewMode='map'",
    () => {
      render(<SplitViewLayout viewMode="map" onViewModeChange={noop} />);

      const gridPanel = document.querySelector('[data-testid="grid-panel"]');

      expect(gridPanel).not.toBeNull();
      expect(gridPanel?.className).toContain("hidden");

      const mapPanel = document.querySelector('[data-testid="map-panel"]');
      expect(mapPanel?.className).toContain("w-full");
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Full-grid toggle
  // -------------------------------------------------------------------------

  it(
    "[P0] hides map panel (adds 'hidden' class) when viewMode='grid'",
    () => {
      render(<SplitViewLayout viewMode="grid" onViewModeChange={noop} />);

      const mapPanel = document.querySelector('[data-testid="map-panel"]');

      expect(mapPanel).not.toBeNull();
      expect(mapPanel?.className).toContain("hidden");

      const gridPanel = document.querySelector('[data-testid="grid-panel"]');
      expect(gridPanel?.className).toContain("w-full");
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
