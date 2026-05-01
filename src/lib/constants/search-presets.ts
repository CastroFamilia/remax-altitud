/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Smart preset definitions — configurable without code changes (AC #7).
 *
 * Architecture: neutral constants file — no client directive, no restricted imports.
 * Adding a new preset = appending one object to SEARCH_PRESETS, zero other changes.
 */

import type { SearchFilters } from "@/types/search";

export interface SearchPreset {
  id: string; // unique slug, used in URL and as React key
  labelKey: string; // i18n key under "SearchPage.presets"
  filters: SearchFilters; // the filter set applied on click
  icon?: string; // optional emoji or icon name
}

export const SEARCH_PRESETS: SearchPreset[] = [
  {
    id: "mountain-retirement",
    labelKey: "mountainRetirement",
    icon: "🏔️",
    filters: {
      areaSlug: "perez-zeledon",
      type: "Casa",
      tags: ["Retire"],
    },
  },
  {
    id: "beach-investment",
    labelKey: "beachInvestment",
    icon: "🌊",
    filters: {
      areaSlug: "uvita",
      tags: ["Investment Property"],
    },
  },
  {
    id: "rental-potential",
    labelKey: "rentalPotential",
    icon: "💰",
    filters: {
      tags: ["Rental Potential"],
    },
  },
  {
    id: "vacation-home",
    labelKey: "vacationHome",
    icon: "🏖️",
    filters: {
      tags: ["Vacation Home"],
    },
  },
];
