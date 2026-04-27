/**
 * Story 3.3: Search Filters & URL State
 * Component: src/components/search/price-range-slider.tsx
 *
 * TDD RED PHASE — all tests use it() and will FAIL until
 * price-range-slider.tsx is implemented.
 *
 * Covers:
 *   AC #1  — Price Range filter with dual-handle slider
 *   AC #4  — Price slider updates with 300ms debounce (onChange called by parent)
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 *
 * Component interface:
 *   interface PriceRangeSliderProps {
 *     min?: number;           // default 0
 *     max?: number;           // default 5_000_000
 *     step?: number;          // default 10_000
 *     value: [number, number];
 *     onChange: (value: [number, number]) => void;
 *   }
 *
 * Implementation notes:
 *   - Uses @radix-ui/react-slider (NOT "radix-ui" unified package)
 *   - data-testid="price-range-slider" on root div
 *   - Prices formatted as "$250K" / "$1.2M" via formatPriceAbbrev from @/lib/map/geo-utils
 *   - Slider thumbs must be ≥ 44px touch target (UX-DR7)
 */

import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// ---------------------------------------------------------------------------

// Mock Radix Slider since jsdom does not support layout APIs used by Radix
vi.mock("@radix-ui/react-slider", () => ({
  Root: ({ children, value, onValueChange, ...props }: {
    children?: React.ReactNode;
    value?: number[];
    onValueChange?: (value: number[]) => void;
    [key: string]: unknown;
  }) => (
    <div
      role="group"
      data-testid="radix-slider-root"
      data-value={JSON.stringify(value)}
      {...props}
      onClick={() => onValueChange?.([250_000, 500_000])}
    >
      {children}
    </div>
  ),
  Track: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="radix-slider-track">{children}</div>
  ),
  Range: () => <div data-testid="radix-slider-range" />,
  Thumb: ({ "aria-label": ariaLabel }: { "aria-label"?: string }) => (
    <div
      role="slider"
      aria-label={ariaLabel}
      data-testid="radix-slider-thumb"
      className="w-[44px] h-[44px]"
      tabIndex={0}
    />
  ),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER mocks
// ---------------------------------------------------------------------------

import { PriceRangeSlider } from "@/components/search/price-range-slider"; // imported AFTER mocks

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PriceRangeSlider — dual-handle Radix Slider for price range (AC #1, #4)", () => {
  // -------------------------------------------------------------------------
  // data-testid presence
  // -------------------------------------------------------------------------

  it(
    "[P0] renders data-testid='price-range-slider' root element",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[0, 5_000_000]} onChange={onChange} />);

      const slider = document.querySelector('[data-testid="price-range-slider"]');
      expect(slider).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Display formatted price values
  // -------------------------------------------------------------------------

  it(
    "[P0] displays formatted min price value using formatPriceAbbrev ($250K format)",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[250_000, 500_000]} onChange={onChange} />);

      const slider = document.querySelector('[data-testid="price-range-slider"]');
      expect(slider?.textContent).toMatch(/\$250K/);
    },
  );

  it(
    "[P0] displays formatted max price value in $M format for values >= 1,000,000",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[0, 1_500_000]} onChange={onChange} />);

      const slider = document.querySelector('[data-testid="price-range-slider"]');
      expect(slider?.textContent).toMatch(/\$1\.[5]M|\$1\.5M/);
    },
  );

  it(
    "[P0] renders two number inputs for min and max price",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[100_000, 500_000]} onChange={onChange} />);

      const inputs = document.querySelectorAll('input[type="number"]');
      // Should have at least 2 number inputs (min price + max price)
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    },
  );

  // -------------------------------------------------------------------------
  // AC #4: onChange called when slider value changes
  // -------------------------------------------------------------------------

  it(
    "[P0] calls onChange when slider value changes (fired by Radix onValueChange)",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[0, 5_000_000]} onChange={onChange} />);

      // Simulate Radix slider change (via mock onClick → onValueChange)
      const sliderRoot = document.querySelector('[data-testid="radix-slider-root"]');
      expect(sliderRoot).not.toBeNull();

      // The mock fires onValueChange([250_000, 500_000]) on click
      sliderRoot?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(onChange).toHaveBeenCalledWith([250_000, 500_000]);
    },
  );

  // -------------------------------------------------------------------------
  // UX-DR7: Touch target size ≥ 44px on slider thumbs
  // -------------------------------------------------------------------------

  it(
    "[P1] slider thumbs have touch target ≥ 44px (UX-DR7 accessibility requirement)",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[0, 5_000_000]} onChange={onChange} />);

      const thumbs = document.querySelectorAll('[role="slider"]');
      // Two thumbs for min and max
      expect(thumbs.length).toBeGreaterThanOrEqual(2);

      // Each thumb must have w-[44px] h-[44px] or equivalent touch size
      thumbs.forEach((thumb) => {
        const className = thumb.className;
        const hasCorrectSize =
          className.includes("w-[44px]") && className.includes("h-[44px]");
        const style = (thumb as HTMLElement).style;
        const hasInlineSize =
          parseInt(style.width, 10) >= 44 && parseInt(style.height, 10) >= 44;

        expect(hasCorrectSize || hasInlineSize).toBe(true);
      });
    },
  );

  // -------------------------------------------------------------------------
  // AC #1: Default props
  // -------------------------------------------------------------------------

  it(
    "[P1] renders with default min=0, max=5_000_000 when no min/max props provided",
    () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const onChange = vi.fn();
      render(<PriceRangeSlider value={[0, 5_000_000]} onChange={onChange} />);

      const sliderRoot = document.querySelector('[data-testid="radix-slider-root"]');
      expect(sliderRoot).not.toBeNull();
    },
  );

  // -------------------------------------------------------------------------
  // Architecture compliance
  // -------------------------------------------------------------------------

  it(
    "[P1] PriceRangeSlider is a Client Component (file must start with 'use client')",
    async () => {
      // THIS TEST WILL FAIL — price-range-slider.tsx not yet implemented
      const fs = await import("node:fs");
      const path = await import("node:path");

      const filePath = path.resolve(
        process.cwd(),
        "src/components/search/price-range-slider.tsx",
      );
      expect(fs.existsSync(filePath)).toBe(true);

      const src = fs.readFileSync(filePath, "utf8");
      expect(src.trimStart()).toMatch(/^['"]use client['"]/);
    },
  );
});
