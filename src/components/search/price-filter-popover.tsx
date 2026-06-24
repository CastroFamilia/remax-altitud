"use client";

/**
 * PriceFilterPopover — Wraps the PriceRangeInputs in a Popover trigger button.
 *
 * Instead of showing the inputs inline, this shows a compact button
 * like "Price ▾" or "$100K–$2M ▾" that opens a floating panel with the full interface.
 */

import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceRangeInputs } from "@/components/search/price-range-inputs";
import { formatPriceAbbrev } from "@/lib/map/geo-utils";

interface PriceFilterPopoverProps {
  /** Placeholder shown when no price range is active */
  placeholder: string;
  /** Current price range [min, max] */
  value: [number | undefined, number | undefined];
  /** Called when range changes */
  onChange: (value: [number | undefined, number | undefined]) => void;
}

export function PriceFilterPopover({ placeholder, value, onChange }: PriceFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [minVal, maxVal] = value;

  // Determine if a custom range is active
  const hasRange = minVal !== undefined || maxVal !== undefined;

  // Format the button label
  const displayLabel = hasRange
    ? `${minVal !== undefined ? formatPriceAbbrev(minVal) : "$0"}–${maxVal !== undefined ? formatPriceAbbrev(maxVal) : "Any"}`
    : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-testid="price-filter-trigger"
          className={cn(
            // Base
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
            "transition-all duration-200 cursor-pointer whitespace-nowrap",
            // Focus
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:border-brand-blue",
            // States
            hasRange
              ? "border-brand-navy/30 bg-brand-navy/5 text-brand-navy shadow-sm"
              : "border-brand-gold/30 bg-background text-brand-navy/70 hover:border-brand-gold/60 hover:bg-brand-gold/5",
            // Open state
            open && "border-brand-navy/40 bg-brand-navy/5 shadow-sm",
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[320px]",
            "rounded-lg border border-brand-gold/20 bg-white shadow-lg p-4",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <PriceRangeInputs value={value} onChange={onChange} />

          {/* Quick reset button when range is active */}
          {hasRange && (
            <button
              type="button"
              onClick={() => onChange([undefined, undefined])}
              className="mt-4 w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Reset price range
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
