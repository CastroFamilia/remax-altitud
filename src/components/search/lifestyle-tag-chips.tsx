"use client";

/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Component: LifestyleTagChips
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 4 of Story 3.4 will replace this stub with the full implementation.
 *
 * Renders a horizontal scrollable row of lifestyle tag chips.
 * Each chip toggles an active state and calls onToggle with the tag value.
 *
 * Architecture:
 * - Imports LIFESTYLE_TAGS from @/lib/constants/lifestyle-tags (single source of truth)
 * - Uses TAG_DISPLAY_LABELS to map stored values to display labels
 *   ("Retire" → "Retirement Paradise")
 * - Active chip: bg-brand-blue text-white
 * - Inactive chip: border border-border bg-background text-foreground hover:bg-accent
 * - Each chip: data-testid={`lifestyle-tag-chip-${tag.toLowerCase().replace(/\s+/g, '-')}`}
 * - Container: data-testid="lifestyle-tag-chips"
 * - Min-height 44px (UX-DR7 touch targets)
 */

import { LIFESTYLE_TAGS, tagDisplayLabel } from "@/lib/constants/lifestyle-tags";

interface LifestyleTagChipsProps {
  activeTags: string[];
  onToggle: (tag: string) => void;
}

export function LifestyleTagChips({ activeTags, onToggle }: LifestyleTagChipsProps) {
  return (
    <div
      data-testid="lifestyle-tag-chips"
      className="flex gap-2 flex-wrap md:flex-nowrap overflow-x-auto"
    >
      {LIFESTYLE_TAGS.map((tag) => {
        const isActive = activeTags.includes(tag);
        const slug = tag.toLowerCase().replace(/\s+/g, "-");
        return (
          <button
            key={tag}
            data-testid={`lifestyle-tag-chip-${slug}`}
            onClick={() => onToggle(tag)}
            className={[
              "min-h-[44px] px-3 py-1 rounded-full text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-blue text-white"
                : "border border-border bg-background text-foreground hover:bg-accent",
            ].join(" ")}
          >
            {tagDisplayLabel(tag)}
          </button>
        );
      })}
    </div>
  );
}
