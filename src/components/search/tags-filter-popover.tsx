"use client";

import { useState } from "react";
import { Popover } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { LifestyleTagChips } from "@/components/search/lifestyle-tag-chips";

interface TagsFilterPopoverProps {
  /** Current active tags */
  activeTags: string[];
  /** Callback when a tag is toggled */
  onToggle: (tag: string) => void;
}

export function TagsFilterPopover({ activeTags, onToggle }: TagsFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("SearchPage");

  // Determine if any filters are active in this popover
  const activeCount = activeTags.length;
  const hasValue = activeCount > 0;

  // Placeholder text for the button
  const placeholder = t("filters.tags") || "Tags";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-testid="tags-filter-trigger"
          className={cn(
            // Base
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
            "transition-all duration-200 cursor-pointer whitespace-nowrap",
            // Focus
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 focus-visible:border-brand-blue",
            // States
            hasValue
              ? "border-brand-navy/30 bg-brand-navy/5 text-brand-navy shadow-sm"
              : "border-brand-gold/30 bg-background text-brand-navy/70 hover:border-brand-gold/60 hover:bg-brand-gold/5",
            // Open state
            open && "border-brand-navy/40 bg-brand-navy/5 shadow-sm",
          )}
        >
          <span>{placeholder}</span>
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-navy text-[10px] text-white">
              {activeCount}
            </span>
          )}
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
            "z-50 w-[300px] md:w-[360px]",
            "rounded-lg border border-brand-gold/20 bg-white shadow-lg p-4",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-brand-navy">{placeholder}</h4>
            <div className="flex flex-wrap gap-2">
              <LifestyleTagChips activeTags={activeTags} onToggle={onToggle} />
            </div>
            {hasValue && (
              <button
                type="button"
                onClick={() => {
                  activeTags.forEach((tag) => onToggle(tag));
                }}
                className="mt-4 w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {t("filters.clearTags") || "Clear selections"}
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
