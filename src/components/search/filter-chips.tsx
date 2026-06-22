"use client";

/**
 * Story 3.3: Search Filters & URL State
 * Component: FilterChips — active filter chips row with dismiss and clear all.
 *
 * Architecture: src/components/search/filter-chips.tsx (§3 directory listing)
 * Design token: bg-brand-blue text-white for chips (--brand-blue: #0043FF)
 * Tailwind v4 CSS-first: use bg-brand-blue, NOT hex values.
 */

import { useTranslations } from "next-intl";
import { formatPriceAbbrev } from "@/lib/map/geo-utils";
import { tagDisplayLabel } from "@/lib/constants/lifestyle-tags";
import type { SearchFilters } from "@/types/search";

interface FilterChipsProps {
  filters: SearchFilters;
  onClearFilter: (key: keyof SearchFilters) => void;
  onClearAll: () => void;
}

/** Filter keys that generate chips (exclude 'view' and 'sort') */
const CHIP_KEYS: Array<keyof SearchFilters> = [
  "region",
  "type",
  "listingType",
  "priceMin",
  "priceMax",
  "bedrooms",
  "bathrooms",
  "lotSizeMin",
  "lotSizeMax",
  "areaSlug",
  "subLocation",
  "q",
];

interface ChipInfo {
  key: keyof SearchFilters;
  reactKey: string; // unique key for React rendering (tag chips share key: "tags")
  label: string;
  value: string;
}

export function FilterChips({ filters, onClearFilter, onClearAll }: FilterChipsProps) {
  const t = useTranslations("SearchPage");

  // Build the list of active chips
  const chips: ChipInfo[] = [];

  if (filters.region) {
    const regionLabel =
      filters.region === "mountain"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t("filters.regionMountain" as any)
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          t("filters.regionBeach" as any);
    chips.push({
      key: "region",
      reactKey: "region",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      label: t("filters.region" as any),
      value: regionLabel,
    });
  }

  if (filters.type) {
    chips.push({
      key: "type",
      reactKey: "type",
      label: t("filters.type"),
      value:
        filters.type === "Lote"
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            `${t("filters.propertyTypes.Lote" as any)} / ${t("filters.propertyTypes.Terreno" as any)}`
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t(`filters.propertyTypes.${filters.type}` as any) || filters.type,
    });
  }

  if (filters.listingType) {
    chips.push({
      key: "listingType",
      reactKey: "listingType",
      label: t("filters.listingType"),
      value: t(`filters.listingType${filters.listingType}`),
    });
  }

  // Price chip — combine min and max into one chip if either is set
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const minStr = filters.priceMin !== undefined ? formatPriceAbbrev(filters.priceMin) : "$0";
    const maxStr = filters.priceMax !== undefined ? formatPriceAbbrev(filters.priceMax) : "Any";
    chips.push({
      key: "priceMin",
      reactKey: "priceMin",
      label: t("filters.price"),
      value: `${minStr}–${maxStr}`,
    });
  }

  if (filters.bedrooms !== undefined) {
    chips.push({
      key: "bedrooms",
      reactKey: "bedrooms",
      label: t("filters.bedrooms"),
      value: `${filters.bedrooms}+`,
    });
  }

  if (filters.bathrooms !== undefined) {
    chips.push({
      key: "bathrooms",
      reactKey: "bathrooms",
      label: t("filters.bathrooms"),
      value: `${filters.bathrooms}+`,
    });
  }

  if (filters.lotSizeMin !== undefined || filters.lotSizeMax !== undefined) {
    const minStr = filters.lotSizeMin !== undefined ? `${filters.lotSizeMin}m²` : "0";
    const maxStr = filters.lotSizeMax !== undefined ? `${filters.lotSizeMax}m²` : "Any";
    chips.push({
      key: "lotSizeMin",
      reactKey: "lotSizeMin",
      label: t("filters.lotSize"),
      value: `${minStr}–${maxStr}`,
    });
  }

  if (filters.areaSlug) {
    chips.push({
      key: "areaSlug",
      reactKey: "areaSlug",
      label: t("filters.location"),
      value: filters.areaSlug,
    });
  }

  if (filters.subLocation) {
    chips.push({
      key: "subLocation",
      reactKey: "subLocation",
      label: t("filters.location"),
      value: filters.subLocation,
    });
  }

  if (filters.q) {
    chips.push({
      key: "q",
      reactKey: "q",
      label: t("filters.search"),
      value: `"${filters.q}"`,
    });
  }

  // Story 3.4: render one chip per active lifestyle tag (AC #6)
  // Try localized chip label first; fall back to tagDisplayLabel when the key
  // is missing — keeps display consistent across locales without breaking
  // tests that mock `t` with an identity function.
  const chipValueForTag = (tag: string): string => {
    const i18nKey = `lifestyleTags.chips.${tag}`;
    const translated = t(i18nKey);
    const isMissing = translated === i18nKey || translated === `SearchPage.${i18nKey}`;
    return isMissing ? tagDisplayLabel(tag) : translated;
  };
  (filters.tags ?? []).forEach((tag) => {
    chips.push({
      key: "tags",
      reactKey: `tags-${tag}`,
      label: t("lifestyleTags.label"),
      value: chipValueForTag(tag),
    });
  });

  // Count active filters: scalar keys + individual tag count (Story 3.4)
  const activeFilterCount =
    CHIP_KEYS.filter((key) => {
      const val = filters[key];
      return val !== undefined && val !== null;
    }).length + (filters.tags?.length ?? 0);

  if (chips.length === 0) {
    return null;
  }

  function handleDismiss(key: keyof SearchFilters) {
    // If dismissing a price chip, clear both priceMin and priceMax
    if (key === "priceMin") {
      onClearFilter("priceMin");
      onClearFilter("priceMax");
    } else if (key === "lotSizeMin") {
      onClearFilter("lotSizeMin");
      onClearFilter("lotSizeMax");
    } else if (key === "areaSlug") {
      onClearFilter("areaSlug");
      onClearFilter("subLocation");
    } else {
      onClearFilter(key);
    }
  }

  return (
    <div
      data-testid="filter-chips"
      className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide md:flex-wrap"
    >
      {chips.map((chip) => (
        <span
          key={chip.reactKey}
          data-testid="filter-chip"
          className="inline-flex items-center gap-1 rounded-full bg-brand-blue border border-brand-blue px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-semibold text-white shrink-0 min-h-[2.25rem] md:min-h-[2.75rem] shadow-sm transition-all duration-200"
        >
          <span className="whitespace-nowrap">
            {chip.label}: {chip.value}
          </span>
          <button
            type="button"
            data-testid="chip-dismiss"
            className="ml-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full hover:bg-white/20"
            aria-label={t("filters.dismiss", { label: chip.label })}
            onClick={() => handleDismiss(chip.key)}
          >
            ×
          </button>
        </span>
      ))}

      {/* "Clear all" appears when 2+ active filters */}
      {activeFilterCount >= 2 && (
        <button
          type="button"
          data-testid="clear-all-filters"
          className="shrink-0 text-sm text-muted-foreground underline hover:text-foreground whitespace-nowrap"
          onClick={onClearAll}
        >
          {t("filters.clearAll")}
        </button>
      )}
    </div>
  );
}
