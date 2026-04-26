/**
 * Story 3.1: Search Page Layout & Split-View
 * Component: src/components/search/search-filter-bar.tsx
 *
 * Covers:
 *   AC #6 — Sticky filter bar remains fixed at the top of the grid panel when
 *            the user scrolls the results grid.
 *
 * Note: This component is a layout stub for Story 3.1.
 *       Story 3.3 (Search Filters & URL State) will replace the placeholder
 *       content with real filter controls.
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { readFileSync } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({
    toString: vi.fn(() => ""),
    get: vi.fn(() => null),
  })),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const map: Record<string, string> = {
      label: "Filters",
      loading: "Filter bar loading",
    };
    return map[key] ?? key;
  }),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { SearchFilterBar } from "@/components/search/search-filter-bar";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SearchFilterBar", () => {
  // -------------------------------------------------------------------------
  // AC #6: Sticky positioning — the container must have position: sticky + top: 0
  // -------------------------------------------------------------------------

  it(
    "[P0] filter bar container has position: sticky and top: 0 (stays fixed during scroll)",
    () => {
      render(<SearchFilterBar />);

      const filterBar = document.querySelector('[data-testid="search-filter-bar"]');

      expect(filterBar).not.toBeNull();

      // sticky + top-0 are the critical positioning classes (AC #6)
      expect(filterBar?.className).toContain("sticky");
      expect(filterBar?.className).toContain("top-0");

      // z-index must be above content but below modals (z-10)
      expect(filterBar?.className).toContain("z-10");
    },
  );

  // -------------------------------------------------------------------------
  // AC #6: Height and baseline layout
  // -------------------------------------------------------------------------

  it(
    "[P1] filter bar has h-14 height and correct background/border classes on desktop",
    () => {
      render(<SearchFilterBar />);

      const filterBar = document.querySelector('[data-testid="search-filter-bar"]');

      expect(filterBar).not.toBeNull();
      expect(filterBar?.className).toContain("h-14");
      expect(filterBar?.className).toContain("bg-background");
      expect(filterBar?.className).toContain("border-b");
      expect(filterBar?.className).toContain("border-border");
    },
  );

  // -------------------------------------------------------------------------
  // Loading placeholder — accessible loading state
  // -------------------------------------------------------------------------

  it(
    "[P1] renders a loading placeholder with aria-label='Filter bar loading'",
    () => {
      render(<SearchFilterBar />);

      const placeholder = document.querySelector('[aria-label="Filter bar loading"]');

      expect(placeholder).not.toBeNull();
      expect(placeholder?.className).toContain("bg-muted");
      expect(placeholder?.className).toContain("animate-pulse");
      expect(placeholder?.className).toContain("rounded");
    },
  );

  // -------------------------------------------------------------------------
  // AC #5 (mobile compact bar)
  // -------------------------------------------------------------------------

  it(
    "[P1] renders compact 'Filters' button with SlidersHorizontal icon on mobile (h-12)",
    () => {
      render(<SearchFilterBar />);

      // Look for the Filters button (accessible name)
      const filtersButton = document.querySelector('[data-testid="mobile-filters-button"]');

      expect(filtersButton).not.toBeNull();
      expect(filtersButton?.tagName.toLowerCase()).toBe("button");

      // The SlidersHorizontal icon SVG should be inside the button
      const icon = filtersButton?.querySelector("svg");
      expect(icon).not.toBeNull();

      // Text content must include "Filters" (or translated equivalent)
      expect(filtersButton?.textContent).toMatch(/filter/i);
    },
  );

  // -------------------------------------------------------------------------
  // Mobile bar height
  // -------------------------------------------------------------------------

  it(
    "[P2] filter bar has h-12 class on mobile viewport",
    () => {
      render(<SearchFilterBar />);

      const filterBar = document.querySelector('[data-testid="search-filter-bar"]');

      expect(filterBar).not.toBeNull();
      // Mobile-first: base class h-12, upgraded at md: breakpoint
      expect(filterBar?.className).toContain("h-12");
    },
  );

  // -------------------------------------------------------------------------
  // Client component marker (static file content check)
  // -------------------------------------------------------------------------

  it(
    "[P2] SearchFilterBar is a Client Component (file must start with 'use client')",
    () => {
      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/search-filter-bar.tsx",
      );
      const src = readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});
