"use client";

/**
 * AreaSearchCombobox — Searchable location selector for area filtering.
 *
 * Features:
 * - Type-to-filter with fuzzy matching
 * - Grouped results by region (Coast, Mountain, Valley)
 * - Sub-locations nested under parent areas with visual indent
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Selected value displayed as chip
 * - Works in both dark (hero) and light (filter bar) themes
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_DISTRICTS } from "@/lib/locations";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AreaOption {
  slug: string;
  label: string;
  parentSlug?: string;
  isSubLocation?: boolean;
}

interface AreaGroup {
  labelEn: string;
  labelEs: string;
  slugs: string[];
}

interface AreaSearchComboboxProps {
  /** All area options (main + sub-locations) */
  areas: AreaOption[];
  /** Currently selected area slug */
  selectedArea: string;
  /** Currently selected sub-location slug */
  selectedSubLocation: string;
  /** Called when an area is selected */
  onAreaChange: (areaSlug: string, subLocationSlug: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Locale for display labels */
  locale?: string;
  /** Visual variant */
  variant?: "dark" | "light";
  /** Allow typing and selecting custom area values not in the list */
  allowCustom?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const AREA_GROUPS: AreaGroup[] = [
  {
    labelEn: "Pacific Coast",
    labelEs: "Costa Pacífica",
    slugs: [
      "dominical",
      "uvita",
      "ojochal",
      "quepos",
      "manuel-antonio",
      "jaco",
      "tamarindo",
      "nosara",
      "samara",
      "santa-teresa",
      "playa-hermosa",
    ],
  },
  {
    labelEn: "Mountain & Valley",
    labelEs: "Montaña y Valle",
    slugs: ["perez-zeledon", "tinamastes-platanillo"],
  },
];

/**
 * PZ sub-locations fallback — aligned with ALTITUD HUB's locations.js
 * Hierarchy: Cantón → Distrito (12 districts of Pérez Zeledón)
 */
const FALLBACK_PZ_SUB_LOCATIONS: AreaOption[] = [
  {
    slug: "san-isidro",
    label: "San Isidro de El General",
    parentSlug: "perez-zeledon",
    isSubLocation: true,
  },
  { slug: "el-general", label: "El General", parentSlug: "perez-zeledon", isSubLocation: true },
  {
    slug: "daniel-flores",
    label: "Daniel Flores",
    parentSlug: "perez-zeledon",
    isSubLocation: true,
  },
  { slug: "rivas", label: "Rivas", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "san-pedro", label: "San Pedro", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "platanares", label: "Platanares", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "pejibaye", label: "Pejibaye", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "cajon", label: "Cajón", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "baru", label: "Barú", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "rio-nuevo", label: "Río Nuevo", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "paramo", label: "Páramo", parentSlug: "perez-zeledon", isSubLocation: true },
  { slug: "la-amistad", label: "La Amistad", parentSlug: "perez-zeledon", isSubLocation: true },
];

// ─── Static Areas Fallback ───────────────────────────────────────────────────

const STATIC_MAIN_AREAS: AreaOption[] = [
  { slug: "dominical", label: "Dominical" },
  { slug: "uvita", label: "Uvita" },
  { slug: "ojochal", label: "Ojochal" },
  { slug: "quepos", label: "Quepos" },
  { slug: "manuel-antonio", label: "Manuel Antonio" },
  { slug: "jaco", label: "Jacó" },
  { slug: "tamarindo", label: "Tamarindo" },
  { slug: "nosara", label: "Nosara" },
  { slug: "samara", label: "Sámara" },
  { slug: "santa-teresa", label: "Santa Teresa" },
  { slug: "playa-hermosa", label: "Playa Hermosa" },
  { slug: "perez-zeledon", label: "Pérez Zeledón" },
  { slug: "tinamastes-platanillo", label: "Tinamastes, Platanillo & Barú" },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function AreaSearchCombobox({
  areas,
  selectedArea,
  selectedSubLocation,
  onAreaChange,
  placeholder = "Search location...",
  locale = "en",
  variant = "dark",
  allowCustom = false,
}: AreaSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build the full list: main areas + sub-locations
  const mainAreas = useMemo(() => {
    const dynamicMains = areas.filter((a) => !a.isSubLocation);
    const map = new Map<string, AreaOption>();
    STATIC_MAIN_AREAS.forEach((a) => map.set(a.slug, a));
    dynamicMains.forEach((a) => map.set(a.slug, a));
    return Array.from(map.values());
  }, [areas]);

  const subLocations = useMemo(() => {
    const dynamicSubs = areas.filter((a) => a.isSubLocation);
    const staticSubs: AreaOption[] = ALL_DISTRICTS.map((d) => ({
      slug: d.slug,
      label: d.label,
      parentSlug: d.parentSlug,
      isSubLocation: true,
    }));
    const map = new Map<string, AreaOption>();
    staticSubs.forEach((s) => map.set(s.slug, s));
    dynamicSubs.forEach((s) => map.set(s.slug, s));
    return Array.from(map.values());
  }, [areas]);

  // Build flat list of all selectable items for keyboard nav
  interface FlatItem {
    type: "area" | "sub";
    option: AreaOption;
    groupLabel?: string;
  }

  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];

    for (const group of AREA_GROUPS) {
      const groupAreas = mainAreas.filter((a) => group.slugs.includes(a.slug));
      if (groupAreas.length === 0) continue;

      for (const area of groupAreas) {
        items.push({ type: "area", option: area });
        // Add sub-locations under this area
        const areaSubs = subLocations.filter((s) => s.parentSlug === area.slug);
        for (const sub of areaSubs) {
          items.push({ type: "sub", option: sub });
        }
      }
    }

    return items;
  }, [mainAreas, subLocations]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return flatItems;

    const q = query.toLowerCase().trim();
    return flatItems.filter((item) => {
      const label = item.option.label.toLowerCase();
      const slug = item.option.slug.toLowerCase();
      return label.includes(q) || slug.includes(q);
    });
  }, [flatItems, query]);

  // Find the current selected label
  const selectedLabel = useMemo(() => {
    if (selectedSubLocation) {
      const sub = subLocations.find((s) => s.slug === selectedSubLocation);
      if (sub) {
        const parent = mainAreas.find((a) => a.slug === selectedArea);
        return `${sub.label}, ${parent?.label ?? ""}`;
      }
    }
    if (selectedArea) {
      const area = mainAreas.find((a) => a.slug === selectedArea);
      return area?.label ?? selectedArea;
    }
    return "";
  }, [selectedArea, selectedSubLocation, mainAreas, subLocations]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync query with selectedLabel when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedLabel);
    }
  }, [isOpen, selectedLabel]);

  // Reset highlight when filtered items change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredItems.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-combobox-item]");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleSelect = useCallback(
    (item: FlatItem | string) => {
      if (typeof item === "string") {
        onAreaChange(item, "");
      } else if (item.type === "sub") {
        onAreaChange(item.option.parentSlug ?? "perez-zeledon", item.option.slug);
      } else {
        onAreaChange(item.option.slug, "");
      }
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onAreaChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAreaChange("", "");
      setQuery("");
      setIsOpen(false);
    },
    [onAreaChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
            handleSelect(filteredItems[highlightedIndex]);
          } else if (filteredItems.length > 0) {
            handleSelect(filteredItems[0]);
          } else if (allowCustom && query.trim()) {
            handleSelect(query.trim());
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, filteredItems, highlightedIndex, handleSelect, allowCustom, query],
  );

  // Build grouped display for the dropdown
  const groupedDisplay = useMemo(() => {
    if (!query.trim()) {
      // Show full grouped layout
      return AREA_GROUPS.map((group) => {
        const groupAreas = mainAreas.filter((a) => group.slugs.includes(a.slug));
        if (groupAreas.length === 0) return null;

        const groupLabel = locale === "es" ? group.labelEs : group.labelEn;

        // Collect items and their indices in filteredItems
        const groupItems: { item: FlatItem; globalIndex: number }[] = [];
        for (const area of groupAreas) {
          const areaIndex = filteredItems.findIndex(
            (fi) => fi.type === "area" && fi.option.slug === area.slug,
          );
          if (areaIndex >= 0)
            groupItems.push({ item: filteredItems[areaIndex], globalIndex: areaIndex });

          // Sub-locations under this area
          const areaSubs = subLocations.filter((s) => s.parentSlug === area.slug);
          for (const sub of areaSubs) {
            const subIndex = filteredItems.findIndex(
              (fi) => fi.type === "sub" && fi.option.slug === sub.slug,
            );
            if (subIndex >= 0)
              groupItems.push({ item: filteredItems[subIndex], globalIndex: subIndex });
          }
        }

        if (groupItems.length === 0) return null;

        return { groupLabel, items: groupItems };
      }).filter(Boolean) as {
        groupLabel: string;
        items: { item: FlatItem; globalIndex: number }[];
      }[];
    }

    // Filtered: show flat results
    return [
      {
        groupLabel: locale === "es" ? "Resultados" : "Results",
        items: filteredItems.map((item, index) => ({ item, globalIndex: index })),
      },
    ];
  }, [query, mainAreas, subLocations, filteredItems, locale]);

  const isDark = variant === "dark";

  const hasSelection = selectedArea || selectedSubLocation;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger / Input */}
      <div
        className={cn(
          "relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-200",
          isDark
            ? "bg-black/40 border border-white/20 focus-within:border-brand-gold/70 focus-within:ring-1 focus-within:ring-brand-gold/30"
            : "bg-background border border-border focus-within:border-brand-blue/50 focus-within:ring-1 focus-within:ring-brand-blue/20",
        )}
      >
        <MapPin
          className={cn(
            "h-3.5 w-3.5 shrink-0 mr-2",
            isDark ? "text-brand-gold/70" : "text-muted-foreground",
          )}
        />

        {/* Show input (acts as autocomplete) */}
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : selectedLabel || query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-sm outline-none min-w-0",
            isDark
              ? "text-white placeholder:text-white/40"
              : "text-foreground placeholder:text-muted-foreground",
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="area-combobox-list"
          aria-haspopup="listbox"
          autoComplete="off"
        />

        {/* Clear / Chevron */}
        {hasSelection ? (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer",
              isDark
                ? "text-white/40 hover:text-white/70 hover:bg-white/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            aria-label="Clear location"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          id="area-combobox-list"
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-xl overflow-hidden",
            "animate-in fade-in-0 slide-in-from-top-2 duration-150",
            isDark
              ? "bg-brand-navy/95 backdrop-blur-xl border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
              : "bg-popover border-border shadow-lg",
          )}
        >
          {/* Search hint */}
          {!query && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-b",
                isDark ? "border-white/10" : "border-border",
              )}
            >
              <Search
                className={cn(
                  "h-3 w-3 shrink-0",
                  isDark ? "text-white/30" : "text-muted-foreground",
                )}
              />
              <span
                className={cn("text-[11px]", isDark ? "text-white/35" : "text-muted-foreground")}
              >
                {locale === "es" ? "Escribe para filtrar..." : "Type to filter..."}
              </span>
            </div>
          )}

          {/* Items */}
          <div className="max-h-[280px] overflow-y-auto overscroll-contain">
            {groupedDisplay.length === 0 || filteredItems.length === 0 ? (
              <div
                className={cn(
                  "px-4 py-6 text-center text-sm",
                  isDark ? "text-white/40" : "text-muted-foreground",
                )}
              >
                {locale === "es" ? "No se encontraron zonas" : "No areas found"}
              </div>
            ) : (
              groupedDisplay.map((group) => (
                <div key={group.groupLabel}>
                  {/* Group header */}
                  <div
                    className={cn(
                      "px-3 pt-2.5 pb-1 sticky top-0",
                      isDark ? "bg-brand-navy/95 backdrop-blur-sm" : "bg-popover",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-[0.15em]",
                        isDark ? "text-white/40" : "text-muted-foreground",
                      )}
                    >
                      {group.groupLabel}
                    </span>
                  </div>

                  {/* Options */}
                  {group.items.map(({ item, globalIndex }) => {
                    const isHighlighted = globalIndex === highlightedIndex;
                    const isSelected =
                      item.type === "sub"
                        ? selectedSubLocation === item.option.slug
                        : selectedArea === item.option.slug && !selectedSubLocation;

                    return (
                      <button
                        key={`${item.type}-${item.option.slug}`}
                        type="button"
                        role="option"
                        data-combobox-item
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setHighlightedIndex(globalIndex)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer",
                          item.type === "sub" && "pl-7",
                          isHighlighted && (isDark ? "bg-brand-gold/15" : "bg-accent"),
                          isSelected && (isDark ? "bg-brand-gold/10" : "bg-accent/60"),
                          !isHighlighted &&
                            !isSelected &&
                            (isDark ? "hover:bg-white/5" : "hover:bg-accent/40"),
                          isDark ? "text-white/80" : "text-foreground",
                        )}
                      >
                        {item.type === "sub" ? (
                          <span
                            className={cn(
                              "text-[10px] shrink-0",
                              isDark ? "text-white/25" : "text-muted-foreground/50",
                            )}
                          >
                            ↳
                          </span>
                        ) : (
                          <MapPin
                            className={cn(
                              "h-3 w-3 shrink-0",
                              isDark ? "text-emerald-400/60" : "text-brand-blue/50",
                            )}
                          />
                        )}
                        <span className={cn("font-medium truncate", isSelected && "font-semibold")}>
                          {item.option.label}
                        </span>
                        {isSelected && (
                          <span
                            className={cn(
                              "ml-auto text-[10px] font-bold shrink-0",
                              isDark ? "text-brand-gold" : "text-brand-blue",
                            )}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
