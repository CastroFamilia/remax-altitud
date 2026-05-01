"use client";

/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Component: SmartPresetBar
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 6 of Story 3.4 will replace this stub with the full implementation.
 *
 * Renders a horizontal scrollable row of smart preset buttons.
 * Each button navigates to /[locale]/search with the preset's filters as URL params.
 *
 * Architecture:
 * - Imports SEARCH_PRESETS from @/lib/constants/search-presets
 * - Uses router.push (full navigation) for preset clicks
 * - Reuses buildSearchUrl from use-search-filters for URL serialization
 * - data-testid="smart-preset-bar" on root container
 * - data-testid={`preset-${preset.id}`} on each preset button
 */

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { SEARCH_PRESETS } from "@/lib/constants/search-presets";
import type { SearchPreset } from "@/lib/constants/search-presets";
import { buildSearchUrl } from "@/hooks/use-search-filters";

interface SmartPresetBarProps {
  presets?: SearchPreset[];
}

export function SmartPresetBar({ presets = SEARCH_PRESETS }: SmartPresetBarProps) {
  const router = useRouter();
  const locale = useLocale();

  const handlePresetClick = (preset: SearchPreset) => {
    const url = buildSearchUrl(`/${locale}/search`, preset.filters);
    router.push(url);
  };

  return (
    <div
      data-testid="smart-preset-bar"
      className="flex gap-2 flex-nowrap overflow-x-auto"
    >
      {presets.map((preset) => (
        <button
          key={preset.id}
          data-testid={`preset-${preset.id}`}
          onClick={() => handlePresetClick(preset)}
          className="flex items-center gap-1 px-4 py-2 rounded-full border border-border bg-background text-foreground text-sm font-medium whitespace-nowrap hover:bg-accent transition-colors"
        >
          {preset.icon && <span>{preset.icon}</span>}
          <span>{preset.labelKey}</span>
        </button>
      ))}
    </div>
  );
}
