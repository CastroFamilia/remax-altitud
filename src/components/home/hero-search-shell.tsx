"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, SlidersHorizontal, ChevronDown, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter, Link } from "@/i18n/navigation";
import { getAvailableAreas } from "@/app/actions/search-actions";

type Variant = "desktop-overlay" | "mobile-inline";

// Keyword matching dictionaries for query parsing in both English and Spanish
const AREA_KEYWORDS: Record<string, string> = {
  "perez zeledon": "perez-zeledon",
  "perez zeledón": "perez-zeledon",
  "pérez zeledón": "perez-zeledon",
  pz: "perez-zeledon",
  uvita: "uvita",
  dominical: "dominical",
  ojochal: "ojochal",
  quepos: "quepos",
  "manuel antonio": "manuel-antonio",
  jaco: "jaco",
  jacó: "jaco",
  tamarindo: "tamarindo",
  nosara: "nosara",
  samara: "samara",
  sámara: "samara",
  "santa teresa": "santa-teresa",
  "playa hermosa": "playa-hermosa",
  liberia: "liberia",
  "san jose": "san-jose",
  "san josé": "san-jose",
  escazu: "escazu",
  escazú: "escazu",
  "santa ana": "santa-ana",
  heredia: "heredia",
  alajuela: "alajuela",
  cartago: "cartago",
};

const TYPE_KEYWORDS: Record<string, string> = {
  casa: "Casa",
  house: "Casa",
  home: "Casa",
  apartamento: "Apartamento",
  apartment: "Apartamento",
  condo: "Apartamento",
  condominio: "Apartamento",
  lote: "Lote",
  lot: "Lote",
  terreno: "Terreno",
  land: "Terreno",
  comercial: "Comercial",
  commercial: "Comercial",
  finca: "Finca",
  farm: "Finca",
  ranch: "Finca",
};

const LIFESTYLE_KEYWORDS: Record<string, string> = {
  retire: "Retire",
  retiro: "Retire",
  jubilacion: "Retire",
  jubilación: "Retire",
  investment: "Investment Property",
  inversión: "Investment Property",
  inversion: "Investment Property",
  rental: "Rental Potential",
  renta: "Rental Potential",
  alquiler: "Rental Potential",
  vacation: "Vacation Home",
  vacaciones: "Vacation Home",
  vacacional: "Vacation Home",
  negocio: "Commercial",
  comercio: "Commercial",
  business: "Commercial",
};

const PROPERTY_TYPES = ["Casa", "Apartamento", "Lote", "Terreno", "Comercial", "Finca"];

const FALLBACK_AREAS = [
  { slug: "perez-zeledon", label: "Pérez Zeledón" },
  { slug: "dominical", label: "Dominical" },
  { slug: "uvita", label: "Uvita" },
  { slug: "ojochal", label: "Ojochal" },
  { slug: "tinamastes-platanillo", label: "Tinamastes, Platanillo & Barú" },
  { slug: "quepos", label: "Quepos" },
  { slug: "manuel-antonio", label: "Manuel Antonio" },
  { slug: "jaco", label: "Jacó" },
];

function parseQuery(queryText: string): Record<string, string> {
  const params: Record<string, string> = {};
  const normalized = queryText.toLowerCase().trim();
  if (!normalized) return params;

  let remainingText = normalized;

  // 1. Match Area
  let matchedAreaKey = "";
  for (const [key, slug] of Object.entries(AREA_KEYWORDS)) {
    if (normalized.includes(key)) {
      params.area = slug;
      matchedAreaKey = key;
      break;
    }
  }
  if (matchedAreaKey) {
    remainingText = remainingText.replace(matchedAreaKey, " ");
  }

  // 2. Match Property Type
  let matchedTypeKey = "";
  for (const [key, type] of Object.entries(TYPE_KEYWORDS)) {
    const regex = new RegExp(`\\b${key}\\b|${key}`);
    if (regex.test(normalized)) {
      params.type = type;
      matchedTypeKey = key;
      break;
    }
  }
  if (matchedTypeKey) {
    remainingText = remainingText.replace(matchedTypeKey, " ");
  }

  // 3. Match DB Lifestyle Tags
  const tags: string[] = [];

  // Ocean View
  const oceanViewRegex = /ocean\s*view|vista\s*al\s*mar|vista\s*del\s*mar|sea\s*view|ocean-view/gi;
  if (oceanViewRegex.test(normalized)) {
    tags.push("Con vista al mar");
    remainingText = remainingText.replace(oceanViewRegex, " ");
  }

  // Mountain View
  const mountainViewRegex =
    /mountain\s*view|vista\s*a\s*la\s*montaña|vista\s*de\s*montaña|vistas\s*a\s*las\s*montañas|mountain-view/gi;
  if (mountainViewRegex.test(normalized)) {
    tags.push("Con vista a la montaña");
    remainingText = remainingText.replace(mountainViewRegex, " ");
  }

  // River
  const riverRegex = /\b(?:river|rio|río|quebrada|creek|stream)\b/gi;
  if (riverRegex.test(normalized)) {
    tags.push("Con río");
    remainingText = remainingText.replace(riverRegex, " ");
  }

  // Waterfall
  const waterfallRegex = /\b(?:waterfall|cascada|catarata|waterfalls)\b/gi;
  if (waterfallRegex.test(normalized)) {
    tags.push("Con cascada");
    remainingText = remainingText.replace(waterfallRegex, " ");
  }

  // Legacy LIFESTYLE_KEYWORDS matching fallback
  for (const [key, tag] of Object.entries(LIFESTYLE_KEYWORDS)) {
    if (normalized.includes(key)) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
      remainingText = remainingText.replace(key, " ");
    }
  }

  if (tags.length > 0) {
    params.tags = tags.join(",");
  }

  // 4. Parse Hectares / Acres / Size

  // 4a. Acres parsing (e.g. "1 acre", "2 acres", "half acre", "0.5 acres", "medio acre", "1.5 acres")
  const acreRegex = /\b(\d+(?:\.\d+)?|half|quarter|medio|media|un|uno|dos|tres|cinco)\s*acres?\b/gi;
  const acreMatch = normalized.match(acreRegex);
  if (acreMatch) {
    const matchedStr = acreMatch[0].toLowerCase();
    let acresValue = 1;
    if (
      matchedStr.includes("half") ||
      matchedStr.includes("medio") ||
      matchedStr.includes("media") ||
      matchedStr.includes("0.5")
    ) {
      acresValue = 0.5;
    } else if (matchedStr.includes("quarter") || matchedStr.includes("0.25")) {
      acresValue = 0.25;
    } else {
      const numMatch = matchedStr.match(/\d+(?:\.\d+)?/);
      if (numMatch) {
        acresValue = parseFloat(numMatch[0]);
      } else if (matchedStr.includes("dos")) {
        acresValue = 2;
      } else if (matchedStr.includes("tres")) {
        acresValue = 3;
      } else if (matchedStr.includes("cinco")) {
        acresValue = 5;
      }
    }

    // 1 acre = 4047 m2
    const m2Value = acresValue * 4047;
    // Set min and max with ±20% range for flexible matching
    params.lot_min = String(Math.round(m2Value * 0.8));
    params.lot_max = String(Math.round(m2Value * 1.2));

    remainingText = remainingText.replace(acreRegex, " ");
  }

  // 4b. Hectares parsing (e.g. "1 hectare", "2 hectares", "5 ha", "una hectarea")
  const hectareRegex = /\b(\d+(?:\.\d+)?|una|dos|tres|cinco)\s*(?:hectareas?|hectáreas?|hecatreas?|hetareas?|hecteras?|ha)\b/gi;
  const hectareMatch = normalized.match(hectareRegex);
  if (hectareMatch) {
    const matchedStr = hectareMatch[0].toLowerCase();
    let hectaresValue = 1;
    const numMatch = matchedStr.match(/\d+(?:\.\d+)?/);
    if (numMatch) {
      hectaresValue = parseFloat(numMatch[0]);
    } else if (matchedStr.includes("dos")) {
      hectaresValue = 2;
    } else if (matchedStr.includes("tres")) {
      hectaresValue = 3;
    } else if (matchedStr.includes("cinco")) {
      hectaresValue = 5;
    }

    // 1 hectare = 10000 m2
    const m2Value = hectaresValue * 10000;
    params.lot_min = String(Math.round(m2Value * 0.8));
    params.lot_max = String(Math.round(m2Value * 1.2));

    remainingText = remainingText.replace(hectareRegex, " ");
  }

  // 4c. Square meters parsing (e.g. "5000 m2", "1000m2", "500 metros cuadrados", "1000 mt2")
  const m2Regex = /\b(\d+(?:\s*\d+)?)\s*(?:m2|m²|sq\s*mt|sqm|metros\s*cuadrados|mt2|mts2)\b/gi;
  const m2Match = normalized.match(m2Regex);
  if (m2Match) {
    const matchedStr = m2Match[0].toLowerCase();
    const numStr = matchedStr.replace(/[^\d]/g, "");
    const m2Value = parseInt(numStr, 10);
    if (Number.isFinite(m2Value) && m2Value > 0) {
      params.lot_min = String(Math.round(m2Value * 0.8));
      params.lot_max = String(Math.round(m2Value * 1.2));
    }
    remainingText = remainingText.replace(m2Regex, " ");
  }

  // 5. Match Bedrooms / Bathrooms count
  const bedMatch = normalized.match(/(\d+)\s*(?:bed|bedroom|hab|dormitorio)/);
  if (bedMatch && bedMatch[1]) {
    const beds = parseInt(bedMatch[1], 10);
    if (beds >= 1 && beds <= 5) {
      params.bedrooms = String(beds);
    }
    remainingText = remainingText.replace(bedMatch[0], " ");
  }

  const bathMatch = normalized.match(/(\d+)\s*(?:bath|bathroom|baño|bañ)/);
  if (bathMatch && bathMatch[1]) {
    const baths = parseInt(bathMatch[1], 10);
    if (baths >= 1 && baths <= 4) {
      params.bathrooms = String(baths);
    }
    remainingText = remainingText.replace(bathMatch[0], " ");
  }

  // 6. Match Price limits
  const cleanedForPrice = normalized.replace(/\$/g, "").replace(/(\d+)[.,](\d{3})\b/g, "$1$2");

  const numbers = cleanedForPrice.match(/\b\d+\b/g);
  const kNumbers = cleanedForPrice.match(/\b(\d+)\s*k\b/g);

  let priceValues: number[] = [];
  if (numbers) {
    priceValues = priceValues.concat(numbers.map((num) => parseInt(num, 10)));
  }
  if (kNumbers) {
    priceValues = priceValues.concat(
      kNumbers.map((kNum) => {
        const val = parseInt(kNum.replace(/\s*k/g, ""), 10);
        return val * 1000;
      }),
    );
  }

  priceValues = Array.from(new Set(priceValues)).filter((val) => val > 5000);

  if (priceValues.length > 0) {
    const isMax = /(?:under|max|less|below|hasta|menos|<)\s*\$?/i.test(normalized);
    const isMin = /(?:over|above|min|more|desde|mas|más|>)\s*\$?/i.test(normalized);

    if (priceValues.length >= 2) {
      const sorted = priceValues.sort((a, b) => a - b);
      params.price_min = String(sorted[0]);
      params.price_max = String(sorted[1]);
    } else if (isMax) {
      params.price_max = String(priceValues[0]);
    } else if (isMin) {
      params.price_min = String(priceValues[0]);
    } else {
      params.price_max = String(priceValues[0]);
    }
    // Remove price numbers and symbols from remainingText
    remainingText = remainingText.replace(/\b\d+\s*k\b/gi, " ");
    remainingText = remainingText.replace(/\b\d+\b/gi, " ");
    remainingText = remainingText.replace(/\$/g, " ");
    remainingText = remainingText.replace(
      /(?:under|max|less|below|hasta|menos|over|above|min|more|desde|mas|más|[<>])/gi,
      " ",
    );
  }

  // Filter stop words and pull out keyword query q
  const STOP_WORDS = new Set([
    "con",
    "de",
    "in",
    "with",
    "and",
    "a",
    "en",
    "la",
    "el",
    "un",
    "una",
    "for",
    "para",
    "los",
    "las",
    "del",
    "y",
    "o",
    "or",
    "to",
    "at",
    "by",
    "of",
  ]);

  const words = remainingText.split(/[\s,.\-/?!|;:]+/);
  const filteredWords = words.filter((w) => w.length > 0 && !STOP_WORDS.has(w));
  if (filteredWords.length > 0) {
    params.q = filteredWords.join(" ");
  }

  return params;
}

export function HeroSearchShell({ variant }: { variant: Variant }) {
  const t = useTranslations("HomePage.hero");
  const tSearch = useTranslations("SearchPage");
  const tEmpty = useTranslations("EmptyStates.noResults");
  const router = useRouter();

  const [searchMode, setSearchMode] = useState<"smart" | "traditional">("smart");
  const [query, setQuery] = useState("");

  // Traditional Search filter states
  const [selectedType, setSelectedType] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  const [areas, setAreas] = useState<{ slug: string; label: string }[]>([]);

  useEffect(() => {
    let active = true;
    getAvailableAreas()
      .then((data) => {
        if (active && data && data.length > 0) {
          setAreas(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load areas in HeroSearchShell", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const containerClass =
    variant === "desktop-overlay"
      ? "pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6"
      : "px-4 py-3 md:hidden";

  const shellClass =
    variant === "desktop-overlay"
      ? "pointer-events-auto mx-auto w-full max-w-[720px] rounded-2xl bg-brand-navy/75 backdrop-blur-xl border border-brand-gold/30 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4),_0_0_30px_rgba(194,166,97,0.15)] hover:border-brand-gold/50 transition-all duration-300"
      : "rounded-2xl bg-brand-navy/90 backdrop-blur-lg border border-brand-gold/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]";

  const handleSearch = () => {
    if (searchMode === "smart") {
      const params = parseQuery(query);

      // Add view=split to ensure consistent split layout
      params.view = "split";

      const qString = new URLSearchParams(params).toString();
      const searchUrl = qString ? `/search?${qString}` : "/search";
      router.push(searchUrl);
    } else {
      const params: Record<string, string> = {
        view: "split",
      };
      if (selectedType) {
        params.type = selectedType;
      }
      if (selectedArea) {
        params.area = selectedArea;
      }
      if (priceMin !== undefined && priceMin !== null && !isNaN(priceMin)) {
        params.price_min = String(priceMin);
      }
      if (priceMax !== undefined && priceMax !== null && !isNaN(priceMax)) {
        params.price_max = String(priceMax);
      }

      const qString = new URLSearchParams(params).toString();
      const searchUrl = qString ? `/search?${qString}` : "/search";
      router.push(searchUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className={containerClass}>
      <div role="search" aria-label={t("searchAriaLabel")} className={shellClass}>
        <div>
          {/* Interactive Search Mode Toggles */}
          <div
            className="mb-3 flex gap-2.5 text-xs font-semibold"
            aria-label="Search mode selector"
          >
            <button
              type="button"
              onClick={() => setSearchMode("smart")}
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold",
                searchMode === "smart"
                  ? "bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/55 shadow-[0_0_12px_rgba(194,166,97,0.25)]"
                  : "text-white/70 hover:text-white hover:bg-white/10",
              )}
            >
              <Sparkles
                className={cn(
                  "h-3.5 w-3.5 transition-all duration-300",
                  searchMode === "smart" ? "animate-pulse text-brand-gold" : "text-white/70",
                )}
                aria-hidden="true"
              />
              {t("smartToggle")}
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("traditional")}
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold",
                searchMode === "traditional"
                  ? "bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/55 shadow-[0_0_12px_rgba(194,166,97,0.25)]"
                  : "text-white/70 hover:text-white hover:bg-white/10",
              )}
            >
              <SlidersHorizontal
                className={cn(
                  "h-3.5 w-3.5 transition-all duration-300",
                  searchMode === "traditional" ? "text-brand-gold" : "text-white/70",
                )}
                aria-hidden="true"
              />
              {t("traditionalToggle")}
            </button>
          </div>

          {searchMode === "smart" ? (
            /* Smart Search mode: Simple, premium text query input */
            <div className="flex items-center gap-2 bg-black/30 border border-white/15 rounded-xl pl-3 pr-1.5 py-1 focus-within:border-brand-gold/60 focus-within:ring-1 focus-within:ring-brand-gold/30 transition-all duration-200">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className={cn(
                  "min-h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45",
                )}
              />
              <button
                type="button"
                onClick={handleSearch}
                aria-label={t("searchSubmit")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-md hover:bg-brand-gold-light hover:scale-105 active:scale-95 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:ring-brand-gold"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            /* Traditional Search mode: Premium, advanced filters grid */
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                {/* Property Type Filter */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                    {tSearch("filters.type")}
                  </label>
                  <div className="relative flex items-center bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 focus-within:border-brand-gold/70 focus-within:ring-1 focus-within:ring-brand-gold/30 transition-all duration-200">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none cursor-pointer appearance-none pr-8 select-none"
                    >
                      <option value="" className="bg-brand-navy text-white">
                        {tSearch("filters.typeAll")}
                      </option>
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-brand-navy text-white">
                          {tSearch(`filters.propertyTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 h-4 w-4 text-white/50 pointer-events-none" />
                  </div>
                </div>

                {/* Area / Location Filter */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                    {tSearch("filters.location")}
                  </label>
                  <div className="relative flex items-center bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 focus-within:border-brand-gold/70 focus-within:ring-1 focus-within:ring-brand-gold/30 transition-all duration-200">
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none cursor-pointer appearance-none pr-8 select-none"
                    >
                      <option value="" className="bg-brand-navy text-white">
                        {tSearch("filters.locationAll")}
                      </option>
                      {(areas.length > 0 ? areas : FALLBACK_AREAS).map((area) => (
                        <option
                          key={area.slug}
                          value={area.slug}
                          className="bg-brand-navy text-white"
                        >
                          {area.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 h-4 w-4 text-white/50 pointer-events-none" />
                  </div>
                </div>

                {/* Minimum Price Filter */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                    {tEmpty("criteriaMinPrice")}
                  </label>
                  <div className="flex items-center bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 focus-within:border-brand-gold/70 focus-within:ring-1 focus-within:ring-brand-gold/30 transition-all duration-200">
                    <span className="text-white/40 text-sm select-none mr-1">$</span>
                    <input
                      type="number"
                      min="0"
                      value={priceMin ?? ""}
                      onChange={(e) =>
                        setPriceMin(
                          e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : undefined,
                        )
                      }
                      placeholder="Min"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Maximum Price Filter */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                    {tEmpty("criteriaMaxPrice")}
                  </label>
                  <div className="flex items-center bg-black/40 border border-white/20 rounded-xl px-3 py-2.5 focus-within:border-brand-gold/70 focus-within:ring-1 focus-within:ring-brand-gold/30 transition-all duration-200">
                    <span className="text-white/40 text-sm select-none mr-1">$</span>
                    <input
                      type="number"
                      min="0"
                      value={priceMax ?? ""}
                      onChange={(e) =>
                        setPriceMax(
                          e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : undefined,
                        )
                      }
                      placeholder="Max"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Search Button Row */}
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-brand-gold text-brand-navy font-bold hover:bg-brand-gold-light hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:ring-brand-gold"
                >
                  <Search className="h-4 w-4" />
                  <span>{t("searchSubmit")}</span>
                </button>
              </div>
            </div>
          )}

          {/* VIP Buyer Section Link */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-white/70">
            <Globe className="h-3.5 w-3.5 text-brand-gold/80 shrink-0" aria-hidden="true" />
            <span>
              {t("vipPrompt")}{" "}
              <Link
                href="/find-your-dream-property"
                className="text-brand-gold hover:text-brand-gold-light hover:underline font-bold transition-colors inline-flex items-center gap-0.5"
              >
                {t("vipCta")}
                <span className="no-underline">→</span>
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
