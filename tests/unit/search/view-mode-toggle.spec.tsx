/**
 * Story 3.1: Search Page Layout & Split-View
 * Component: src/components/search/view-mode-toggle.tsx
 *
 * ATDD Red-Phase Scaffolds — TDD RED PHASE
 * All tests use it.skip() and will FAIL until the component is implemented.
 *
 * Covers:
 *   AC #2 — "Full Map" toggle button updates URL param view=map and calls onViewModeChange("map")
 *   AC #3 — "Full Grid" toggle button updates URL param view=grid and calls onViewModeChange("grid")
 *   AC #1 — "Split View" is the default active state (view=split or no param)
 *
 * Activation: When implementing Task 4 (ViewModeToggle), remove it.skip() from
 *             each test and run `npm test tests/unit/search/view-mode-toggle.spec.tsx`
 *             to verify RED → GREEN transition.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock next/navigation BEFORE any import of the component under test
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockSearchParams = {
  toString: vi.fn(() => ""),
  get: vi.fn((key: string) => null as string | null),
};

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace: mockReplace,
  })),
  useSearchParams: vi.fn(() => mockSearchParams),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

// ViewModeToggle does not exist yet (TDD red phase).
// When implementing: create src/components/search/view-mode-toggle.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ViewModeToggle: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ViewModeToggle = require("@/components/search/view-mode-toggle").ViewModeToggle;
} catch {
  // Expected — component not implemented yet (TDD red phase)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ViewModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.toString.mockReturnValue("");
    mockSearchParams.get.mockReturnValue(null);
  });

  // -------------------------------------------------------------------------
  // AC #1 / #2 / #3: Default active state — "Split View" is active
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] 'Split View' button has active class (bg-brand-navy text-white) when viewMode='split'",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: The "Split View" segmented button has the active style class
      //   (bg-brand-navy text-white) applied when viewMode prop is "split".
      //   Inactive buttons use bg-transparent.
      //
      // Implementation reference: Task 4, active state styling

      // When @testing-library/react is added:
      //   const { getByRole } = render(
      //     <ViewModeToggle viewMode="split" onViewModeChange={vi.fn()} />
      //   );
      //   const splitBtn = getByRole("button", { name: /split view/i });
      //   expect(splitBtn.className).toContain("bg-brand-navy");

      const splitButton = document.querySelector(
        '[data-testid="toggle-split"]',
      );

      expect(splitButton).not.toBeNull();
      expect(splitButton?.className).toContain("bg-brand-navy");
      expect(splitButton?.className).toContain("text-white");

      // Inactive buttons must NOT have active class
      const mapButton = document.querySelector('[data-testid="toggle-map"]');
      const gridButton = document.querySelector('[data-testid="toggle-grid"]');
      expect(mapButton?.className).not.toContain("bg-brand-navy");
      expect(gridButton?.className).not.toContain("bg-brand-navy");
    },
  );

  // -------------------------------------------------------------------------
  // AC #2: Clicking "Full Map" updates URL param AND calls onViewModeChange
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] clicking 'Full Map' button calls router.replace with view=map param and calls onViewModeChange('map')",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected behaviour when "Full Map" is clicked:
      //   1. router.replace is called with `?view=map` (preserving other params)
      //   2. onViewModeChange("map") callback is called
      //   3. router.replace uses { scroll: false } option
      //
      // Pattern from story Task 4:
      //   const params = new URLSearchParams(searchParams.toString());
      //   params.set("view", newMode);
      //   router.replace(`?${params.toString()}`, { scroll: false });
      //
      // Implementation reference: Task 4, URL param update pattern

      const onViewModeChange = vi.fn();

      // When @testing-library/react is added:
      //   const { getByRole } = render(
      //     <ViewModeToggle viewMode="split" onViewModeChange={onViewModeChange} />
      //   );
      //   await userEvent.click(getByRole("button", { name: /full map/i }));

      // Simulate click on the "Full Map" button (placeholder check)
      const mapButton = document.querySelector('[data-testid="toggle-map"]');
      expect(mapButton).not.toBeNull();
      (mapButton as HTMLElement | null)?.click();

      // router.replace must be called with view=map
      expect(mockReplace).toHaveBeenCalledTimes(1);
      const [url, options] = mockReplace.mock.calls[0];
      expect(url).toContain("view=map");
      expect(options).toEqual({ scroll: false });

      // onViewModeChange callback must be called
      expect(onViewModeChange).toHaveBeenCalledWith("map");
    },
  );

  // -------------------------------------------------------------------------
  // AC #3: Clicking "Full Grid" updates URL param AND calls onViewModeChange
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] clicking 'Full Grid' button calls router.replace with view=grid param and calls onViewModeChange('grid')",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: Same pattern as "Full Map" but for view=grid.

      const onViewModeChange = vi.fn();

      const gridButton = document.querySelector('[data-testid="toggle-grid"]');
      expect(gridButton).not.toBeNull();
      (gridButton as HTMLElement | null)?.click();

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const [url, options] = mockReplace.mock.calls[0];
      expect(url).toContain("view=grid");
      expect(options).toEqual({ scroll: false });

      expect(onViewModeChange).toHaveBeenCalledWith("grid");
    },
  );

  // -------------------------------------------------------------------------
  // Preserving existing URL params when view mode changes
  // -------------------------------------------------------------------------

  it.skip(
    "[P0] preserves existing URL params (e.g. locale, filter) when changing view mode",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: If the URL already contains other params (e.g. ?type=house&bedrooms=3),
      //   clicking "Full Map" produces ?type=house&bedrooms=3&view=map
      //   NOT just ?view=map (which would drop other params).
      //
      // This is the core requirement of the URLSearchParams pattern in Task 4.
      //
      // Implementation reference:
      //   const params = new URLSearchParams(searchParams.toString());
      //   params.set("view", newMode);   // only adds/updates "view", keeps rest

      mockSearchParams.toString.mockReturnValue("type=house&bedrooms=3");

      const mapButton = document.querySelector('[data-testid="toggle-map"]');
      expect(mapButton).not.toBeNull();
      (mapButton as HTMLElement | null)?.click();

      expect(mockReplace).toHaveBeenCalledTimes(1);
      const [url] = mockReplace.mock.calls[0];
      // Must contain the existing params AND the new view param
      expect(url).toContain("type=house");
      expect(url).toContain("bedrooms=3");
      expect(url).toContain("view=map");
    },
  );

  // -------------------------------------------------------------------------
  // Hidden on mobile
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] toggle container has 'hidden lg:flex' classes (hidden on mobile, flex on desktop)",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: The toggle container is `hidden` at mobile breakpoints
      //   and `lg:flex` at ≥1024px (desktop).
      //
      // Implementation reference: Task 4, "Hidden on mobile (`hidden lg:flex`)"

      const toggleContainer = document.querySelector(
        '[data-testid="view-mode-toggle-container"]',
      );

      expect(toggleContainer).not.toBeNull();
      expect(toggleContainer?.className).toContain("hidden");
      expect(toggleContainer?.className).toContain("lg:flex");
    },
  );

  // -------------------------------------------------------------------------
  // Three buttons present with correct labels
  // -------------------------------------------------------------------------

  it.skip(
    "[P1] renders three segmented buttons: 'Split View', 'Full Map', 'Full Grid'",
    () => {
      // THIS TEST WILL FAIL — Component not implemented yet
      //
      // Expected: Three accessible button elements corresponding to the three
      //   view modes. Labels come from i18n keys:
      //   - SearchPage.viewToggle.split ("Split View" / "Vista dividida")
      //   - SearchPage.viewToggle.map   ("Full Map" / "Solo mapa")
      //   - SearchPage.viewToggle.grid  ("Full Grid" / "Solo lista")

      const splitButton = document.querySelector('[data-testid="toggle-split"]');
      const mapButton = document.querySelector('[data-testid="toggle-map"]');
      const gridButton = document.querySelector('[data-testid="toggle-grid"]');

      expect(splitButton).not.toBeNull();
      expect(mapButton).not.toBeNull();
      expect(gridButton).not.toBeNull();

      // All must be button elements
      expect(splitButton?.tagName.toLowerCase()).toBe("button");
      expect(mapButton?.tagName.toLowerCase()).toBe("button");
      expect(gridButton?.tagName.toLowerCase()).toBe("button");
    },
  );
});
