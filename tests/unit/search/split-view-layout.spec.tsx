/**
 * Story 3.1: Search Page Layout & Split-View
 * Component: src/components/search/split-view-layout.tsx
 *
 * ATDD Red-Phase Scaffolds — TDD RED PHASE
 * All tests use it.skip() and will FAIL until the component is implemented.
 *
 * Covers:
 *   AC #1 — Desktop split-view: map 60% left, scrollable grid 40% right (≥1024px)
 *   AC #2 — Full-map toggle: map 100%, grid hidden
 *   AC #3 — Full-grid toggle: grid 100%, map hidden
 *   AC #4 — Tablet 60/40 split with side-panel toggle (768–1023px)
 *   AC #5 — Mobile: map fullscreen + pull-up handle stub at bottom (<768px)
 *   AC #1 — Map placeholder (data-testid="map-placeholder") renders when map visible
 *
 * Activation: When implementing Task 3 (SplitViewLayout), remove it.skip() from
 *             each test and run `npm test tests/unit/search/split-view-layout.spec.tsx`
 *             to verify RED → GREEN transition.
 */

import { describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports of the module under test
// ---------------------------------------------------------------------------

// Next.js navigation hooks (not available outside Next.js runtime)
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
}));

// SearchResultsSkeleton exists (Story 1.7) — mock to keep unit test isolated
vi.mock("@/components/search/search-results-skeleton", () => ({
  SearchResultsSkeleton: () => <div data-testid="search-results-skeleton" />,
}));

// ViewModeToggle — tested separately; mock here to isolate SplitViewLayout
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

// SplitViewLayout does not exist yet (TDD red phase); import will fail until Task 3.
// When implementing: create src/components/search/split-view-layout.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SplitViewLayout: any;
try {
  // Dynamic require so the test file itself can be parsed even before implementation
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SplitViewLayout = require("@/components/search/split-view-layout").SplitViewLayout;
} catch {
  // Expected — component not implemented yet (TDD red phase)
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type ViewMode = "split" | "map" | "grid";

const noop = () => {};

/**
 * Utility: render SplitViewLayout with given viewMode.
 * When @testing-library/react is added, replace with render().
 * For now we use lightweight snapshot/class checks via rendered HTML if available.
 */
function renderLayout(viewMode: ViewMode): Document | null {
  if (!SplitViewLayout) return null; // Red phase — component not implemented
  // Placeholder render: swap for @testing-library/react when available
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SplitViewLayout", () => {
  // -------------------------------------------------------------------------
  // AC #1: Desktop split-view (default — viewMode="split")
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] renders map panel with w-[60%] and grid panel with w-[40%] when viewMode='split'",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: SplitViewLayout renders two sibling panels in a flex row.
      //   - Map panel:  className includes "w-[60%]" and data-testid="map-panel"
      //   - Grid panel: className includes "w-[40%]" and data-testid="grid-panel"
      //
      // Implementation reference:
      //   src/components/search/split-view-layout.tsx → Task 3, desktop split section

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

  it.skip(
    "[P0] renders data-testid='map-placeholder' inside map panel when map is visible",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: <div data-testid="map-placeholder" className="h-full w-full bg-muted" />
      //   rendered inside the map panel when viewMode is "split" or "map".
      //
      // Implementation reference: Task 3, map placeholder div

      const mapPlaceholder = document.querySelector(
        '[data-testid="map-placeholder"]',
      );

      expect(mapPlaceholder).not.toBeNull();
      expect(mapPlaceholder?.className).toContain("bg-muted");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Full-map toggle
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] hides grid panel (adds 'hidden' class) when viewMode='map'",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: When viewMode="map",
      //   - Map panel:  w-full (expands)
      //   - Grid panel: has "hidden" class (invisible)
      //
      // Implementation reference: Task 3, desktop full-map mode

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

  it.skip(
    "[P0] hides map panel (adds 'hidden' class) when viewMode='grid'",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: When viewMode="grid",
      //   - Grid panel: w-full (expands)
      //   - Map panel:  has "hidden" class (invisible)
      //
      // Implementation reference: Task 3, desktop full-grid mode

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

  it.skip(
    "[P0] renders data-testid='pull-up-handle' element at mobile viewport",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: A 40px tall handle bar with data-testid="pull-up-handle"
      //   at bottom-0 position, containing a drag indicator and property count.
      //   Must be rendered at <768px viewport (mobile breakpoint).
      //
      // The handle is a non-interactive STUB — Story 3.6 activates it.
      //
      // Implementation reference: Task 3, mobile pull-up handle section

      const pullUpHandle = document.querySelector(
        '[data-testid="pull-up-handle"]',
      );

      expect(pullUpHandle).not.toBeNull();

      // Stub must not have an onClick handler (non-interactive per story scope)
      expect(
        (pullUpHandle as HTMLElement | null)?.onclick,
      ).toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: Tablet 60/40 split with side-panel toggle
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] renders side-panel toggle button with aria-expanded on tablet viewport",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: At 768–1023px viewport (md: breakpoint),
      //   - Same 60/40 split as desktop
      //   - A toggle button with aria-expanded attribute to reveal/hide the grid panel
      //
      // Implementation reference: Task 3, tablet section

      const toggleButton = document.querySelector(
        '[aria-expanded]',
      );

      expect(toggleButton).not.toBeNull();
      // aria-expanded should be a boolean-coercible value
      expect(
        (toggleButton as HTMLElement | null)?.getAttribute("aria-expanded"),
      ).toBeDefined();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Split-view map panel height accounts for header + filter bar
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] map panel height uses calc(100vh - var(--header-height) - 3.5rem) on desktop",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: The map panel uses inline style or Tailwind arbitrary value
      //   h-[calc(100vh-var(--header-height)-3.5rem)] so it fills the viewport
      //   minus header and filter bar.
      //
      // Implementation reference: Task 3, desktop map panel height + Dev Notes

      const mapPanel = document.querySelector('[data-testid="map-panel"]');

      expect(mapPanel).not.toBeNull();
      // Either class-based or inline style approach is acceptable
      const hasCalcHeight =
        mapPanel?.className.includes("calc(100vh") ||
        (mapPanel as HTMLElement | null)?.style.height.includes("calc(100vh");

      expect(hasCalcHeight).toBe(true);
    },
  );

  // -------------------------------------------------------------------------
  // ViewModeToggle rendered (desktop/tablet only)
  // -------------------------------------------------------------------------

  it.skip(
    "[P2] renders ViewModeToggle above split panels on desktop",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: <ViewModeToggle> is rendered with correct viewMode prop,
      //   positioned above the split panels (desktop/tablet only, hidden on mobile).

      const toggle = document.querySelector('[data-testid="view-mode-toggle"]');
      expect(toggle).not.toBeNull();
      expect(toggle?.getAttribute("data-active-mode")).toBe("split");
    },
  );

  // -------------------------------------------------------------------------
  // SearchResultsSkeleton used as grid placeholder
  // -------------------------------------------------------------------------

  it.skip(
    "[P2] renders SearchResultsSkeleton inside grid panel as placeholder",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: <SearchResultsSkeleton /> (Story 1.7) renders inside the grid panel
      //   as a placeholder until Story 3.5 provides <PropertyGrid>.

      const skeleton = document.querySelector(
        '[data-testid="search-results-skeleton"]',
      );
      expect(skeleton).not.toBeNull();
    },
  );
});
