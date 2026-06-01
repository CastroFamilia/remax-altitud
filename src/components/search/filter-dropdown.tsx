"use client";

/**
 * FilterDropdown — Custom styled dropdown replacing native <select>.
 *
 * Uses Radix Popover to render a trigger button + floating option panel.
 * Design: Rounded pill button with chevron, gold-tinted border.
 * When a value is selected, the button shows the value label.
 * When no value is selected, the button shows the placeholder.
 *
 * Features:
 * - Self-descriptive: placeholder text serves as the label (no external <label> needed)
 * - Active indicator: subtle visual cue when a filter is active
 * - Consistent styling across all filter controls
 * - Keyboard accessible via Radix primitives
 */

import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  /** Placeholder shown when no value is selected (acts as label) */
  placeholder: string;
  /** Currently selected value (empty string or undefined = nothing selected) */
  value: string | undefined;
  /** Options to show in the dropdown panel */
  options: FilterOption[];
  /** Called when user selects an option */
  onChange: (value: string | undefined) => void;
  /** data-testid for the trigger button */
  testId?: string;
  /** Optional extra CSS classes for the trigger */
  className?: string;
  /** Format for the selected label — e.g. "3+ Beds" instead of just "3+" */
  formatSelected?: (option: FilterOption) => string;
}

export function FilterDropdown({
  placeholder,
  value,
  options,
  onChange,
  testId,
  className,
  formatSelected,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);
  const hasValue = !!value && !!selectedOption;

  // Determine the display label for the button
  const displayLabel = hasValue
    ? formatSelected
      ? formatSelected(selectedOption!)
      : selectedOption!.label
    : placeholder;

  function handleSelect(optionValue: string) {
    // If selecting the same value, deselect (toggle)
    if (optionValue === value) {
      onChange(undefined);
    } else {
      onChange(optionValue || undefined);
    }
    setOpen(false);
  }

  // Handle keyboard navigation within the options panel
  function handleKeyDown(e: React.KeyboardEvent, optionValue: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(optionValue);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-testid={testId}
          className={cn(
            // Base
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium",
            "transition-all duration-200 cursor-pointer whitespace-nowrap",
            // Focus
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:border-brand-blue",
            // States
            hasValue
              ? "border-brand-navy/30 bg-brand-navy/5 text-brand-navy shadow-sm"
              : "border-brand-gold/30 bg-background text-brand-navy/70 hover:border-brand-gold/60 hover:bg-brand-gold/5",
            // Open state
            open && "border-brand-navy/40 bg-brand-navy/5 shadow-sm",
            className,
          )}
        >
          <span className="truncate max-w-[160px]">{displayLabel}</span>
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
            "z-50 min-w-[180px] max-h-[320px] overflow-y-auto",
            "rounded-lg border border-brand-gold/20 bg-white shadow-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="py-1">
            {/* "All / Any" option to clear the filter */}
            <button
              type="button"
              role="option"
              aria-selected={!hasValue}
              onClick={() => handleSelect("")}
              onKeyDown={(e) => handleKeyDown(e, "")}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                "transition-colors duration-150",
                !hasValue
                  ? "bg-brand-navy/5 text-brand-navy font-medium"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {!hasValue && <Check className="h-3.5 w-3.5 text-brand-navy" />}
              {!hasValue ? (
                <span>{placeholder}</span>
              ) : (
                <span className="ml-[22px]">{placeholder}</span>
              )}
            </button>

            {/* Separator */}
            <div className="mx-2 my-1 h-px bg-border/60" />

            {/* Options */}
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                    "transition-colors duration-150",
                    isSelected
                      ? "bg-brand-navy/5 text-brand-navy font-medium"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-brand-navy" />}
                  <span className={isSelected ? "" : "ml-[22px]"}>
                    {option.label}
                    {option.count !== undefined && (
                      <span className="ml-1 text-muted-foreground">({option.count})</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
