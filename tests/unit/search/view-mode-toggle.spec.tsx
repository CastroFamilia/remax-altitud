/**
 * Story 3.1: Search Page Layout & Split-View
 * Component: src/components/search/view-mode-toggle.tsx
 *
 * Covers:
 *   AC #2 — "Full Map" toggle button updates URL param view=map and calls onViewModeChange("map")
 *   AC #3 — "Full Grid" toggle button updates URL param view=grid and calls onViewModeChange("grid")
 *   AC #1 — "Split View" is the default active state (view=split or no param)
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock next/navigation BEFORE any import of the component under test
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
const mockSearchParamsToString = vi.fn(() => "");

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    replace: mockReplace,
  })),
  useSearchParams: vi.fn(() => ({
    toString: mockSearchParamsToString,
    get: vi.fn(() => null as string | null),
  })),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (_key: string) => {
    const map: Record<string, string> = {
      split: "Split View",
      map: "Full Map",
      grid: "Full Grid",
    };
    return map[_key] ?? _key;
  }),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { ViewModeToggle } from "@/components/search/view-mode-toggle";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ViewModeToggle", () => {
  beforeEach(() => {
    mockSearchParamsToString.mockReturnValue("");
  });

  // -------------------------------------------------------------------------
  // AC #1 / #2 / #3: Default active state — "Split View" is active
  // -------------------------------------------------------------------------

  it(
    "[P0] 'Split View' button has active class (bg-brand-navy text-white) when viewMode='split'",
    () => {
      render(<ViewModeToggle viewMode="split" onViewModeChange={vi.fn()} />);

      const splitButton = document.querySelector('[data-testid="toggle-split"]');

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

  it(
    "[P0] clicking 'Full Map' button calls router.replace with view=map param and calls onViewModeChange('map')",
    () => {
      const onViewModeChange = vi.fn();
      render(<ViewModeToggle viewMode="split" onViewModeChange={onViewModeChange} />);

      const mapButton = document.querySelector('[data-testid="toggle-map"]');
      expect(mapButton).not.toBeNull();
      fireEvent.click(mapButton!);

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

  it(
    "[P0] clicking 'Full Grid' button calls router.replace with view=grid param and calls onViewModeChange('grid')",
    () => {
      const onViewModeChange = vi.fn();
      render(<ViewModeToggle viewMode="split" onViewModeChange={onViewModeChange} />);

      const gridButton = document.querySelector('[data-testid="toggle-grid"]');
      expect(gridButton).not.toBeNull();
      fireEvent.click(gridButton!);

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

  it(
    "[P0] preserves existing URL params (e.g. locale, filter) when changing view mode",
    () => {
      mockSearchParamsToString.mockReturnValue("type=house&bedrooms=3");

      render(<ViewModeToggle viewMode="split" onViewModeChange={vi.fn()} />);

      const mapButton = document.querySelector('[data-testid="toggle-map"]');
      expect(mapButton).not.toBeNull();
      fireEvent.click(mapButton!);

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

  it(
    "[P1] toggle container has 'hidden lg:flex' classes (hidden on mobile, flex on desktop)",
    () => {
      render(<ViewModeToggle viewMode="split" onViewModeChange={vi.fn()} />);

      const toggleContainer = document.querySelector('[data-testid="view-mode-toggle-container"]');

      expect(toggleContainer).not.toBeNull();
      expect(toggleContainer?.className).toContain("hidden");
      expect(toggleContainer?.className).toContain("lg:flex");
    },
  );

  // -------------------------------------------------------------------------
  // Three buttons present with correct labels
  // -------------------------------------------------------------------------

  it(
    "[P1] renders three segmented buttons: 'Split View', 'Full Map', 'Full Grid'",
    () => {
      render(<ViewModeToggle viewMode="split" onViewModeChange={vi.fn()} />);

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
