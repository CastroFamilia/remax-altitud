"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Component: PriceRangeSlider — dual-handle Radix Slider for price range.
 *
 * Uses @radix-ui/react-slider (NOT "radix-ui" unified package — its dist/ does not
 * re-export subpackages). Touch targets: ≥44px (UX-DR7).
 *
 * formatPriceAbbrev imported from @/lib/map/geo-utils (Story 3.2, do NOT reimplement).
 */

import { useEffect, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { formatPriceAbbrev } from "@/lib/map/geo-utils";

interface PriceRangeSliderProps {
  min?: number; // default 0
  max?: number; // default 5_000_000
  step?: number; // default 10_000
  value: [number, number];
  onChange: (value: [number, number]) => void; // called with debounce from parent
}

export function PriceRangeSlider({
  min = 0,
  max = 5_000_000,
  step = 10_000,
  value,
  onChange,
}: PriceRangeSliderProps) {
  const [minVal, maxVal] = value;

  // Local input strings so the user can type freely (e.g. partial digits)
  // without each keystroke reformatting. They re-sync whenever the controlled
  // `value` changes — for example when the URL updates via back/forward
  // navigation or when another control clamps the range.
  const [minInput, setMinInput] = useState<string>(String(minVal));
  const [maxInput, setMaxInput] = useState<string>(String(maxVal));

  useEffect(() => {
    setMinInput(String(minVal));
  }, [minVal]);

  useEffect(() => {
    setMaxInput(String(maxVal));
  }, [maxVal]);

  function handleSliderChange(newValue: number[]) {
    if (newValue.length >= 2) {
      onChange([newValue[0], newValue[1]]);
    }
  }

  function handleMinInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    const parsed = parseInt(e.target.value, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(parsed, maxVal));
      onChange([clamped, maxVal]);
    } else {
      // Reset to current valid value if user typed garbage
      setMinInput(String(minVal));
    }
  }

  function handleMaxInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    const parsed = parseInt(e.target.value, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(minVal, Math.min(parsed, max));
      onChange([minVal, clamped]);
    } else {
      setMaxInput(String(maxVal));
    }
  }

  return (
    <div data-testid="price-range-slider" className="flex flex-col gap-2 w-full">
      {/* Price display */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{formatPriceAbbrev(minVal)}</span>
        <span>{formatPriceAbbrev(maxVal)}</span>
      </div>

      {/* Radix dual-handle slider */}
      <Slider.Root
        className="relative flex w-full touch-none select-none items-center"
        value={[minVal, maxVal]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
      >
        <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
          <Slider.Range className="absolute h-full bg-primary" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-[44px] h-[44px] rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          aria-label="Minimum price"
        />
        <Slider.Thumb
          className="block w-[44px] h-[44px] rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          aria-label="Maximum price"
        />
      </Slider.Root>

      {/* Number inputs for precise entry */}
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={minInput}
          onChange={(e) => setMinInput(e.target.value)}
          min={min}
          max={maxVal}
          step={step}
          aria-label="Minimum price input"
          onBlur={handleMinInputBlur}
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="number"
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
          value={maxInput}
          onChange={(e) => setMaxInput(e.target.value)}
          min={minVal}
          max={max}
          step={step}
          aria-label="Maximum price input"
          onBlur={handleMaxInputBlur}
        />
      </div>
    </div>
  );
}
