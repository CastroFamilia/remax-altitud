"use client";

import { useState } from "react";
import { Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";

type Variant = "desktop-overlay" | "mobile-inline";

// Keyword matching dictionaries for query parsing in both English and Spanish
const AREA_KEYWORDS: Record<string, string> = {
  "perez zeledon": "perez-zeledon",
  "perez zeledón": "perez-zeledon",
  "pérez zeledón": "perez-zeledon",
  "pz": "perez-zeledon",
  "uvita": "uvita",
  "dominical": "dominical",
  "ojochal": "ojochal",
  "quepos": "quepos",
  "manuel antonio": "manuel-antonio",
  "jaco": "jaco",
  "jacó": "jaco",
  "tamarindo": "tamarindo",
  "nosara": "nosara",
  "samara": "samara",
  "sámara": "samara",
  "santa teresa": "santa-teresa",
  "playa hermosa": "playa-hermosa",
  "liberia": "liberia",
  "san jose": "san-jose",
  "san josé": "san-jose",
  "escazu": "escazu",
  "escazú": "escazu",
  "santa ana": "santa-ana",
  "heredia": "heredia",
  "alajuela": "alajuela",
  "cartago": "cartago",
};

const TYPE_KEYWORDS: Record<string, string> = {
  "casa": "Casa",
  "house": "Casa",
  "home": "Casa",
  "apartamento": "Apartamento",
  "apartment": "Apartamento",
  "condo": "Apartamento",
  "condominio": "Apartamento",
  "lote": "Lote",
  "lot": "Lote",
  "terreno": "Terreno",
  "land": "Terreno",
  "comercial": "Comercial",
  "commercial": "Comercial",
  "finca": "Finca",
  "farm": "Finca",
  "ranch": "Finca",
};

const LIFESTYLE_KEYWORDS: Record<string, string> = {
  "retire": "Retire",
  "retiro": "Retire",
  "jubilacion": "Retire",
  "jubilación": "Retire",
  "investment": "Investment Property",
  "inversión": "Investment Property",
  "inversion": "Investment Property",
  "rental": "Rental Potential",
  "renta": "Rental Potential",
  "alquiler": "Rental Potential",
  "vacation": "Vacation Home",
  "vacaciones": "Vacation Home",
  "vacacional": "Vacation Home",
  "negocio": "Commercial",
  "comercio": "Commercial",
  "business": "Commercial",
};

function parseQuery(queryText: string): Record<string, string> {
  const params: Record<string, string> = {};
  const normalized = queryText.toLowerCase().trim();
  if (!normalized) return params;

  // 1. Match Area
  for (const [key, slug] of Object.entries(AREA_KEYWORDS)) {
    if (normalized.includes(key)) {
      params.area = slug;
      break;
    }
  }

  // 2. Match Property Type
  for (const [key, type] of Object.entries(TYPE_KEYWORDS)) {
    const regex = new RegExp(`\\b${key}\\b|${key}`);
    if (regex.test(normalized)) {
      params.type = type;
      break;
    }
  }

  // 3. Match Lifestyle Tags
  const tags: string[] = [];
  for (const [key, tag] of Object.entries(LIFESTYLE_KEYWORDS)) {
    if (normalized.includes(key)) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  if (tags.length > 0) {
    params.tags = tags.join(",");
  }

  // 4. Match Bedrooms / Bathrooms count
  const bedMatch = normalized.match(/(\d+)\s*(?:bed|bedroom|hab|dormitorio)/);
  if (bedMatch && bedMatch[1]) {
    const beds = parseInt(bedMatch[1], 10);
    if (beds >= 1 && beds <= 5) {
      params.bedrooms = String(beds);
    }
  }

  const bathMatch = normalized.match(/(\d+)\s*(?:bath|bathroom|baño|bañ)/);
  if (bathMatch && bathMatch[1]) {
    const baths = parseInt(bathMatch[1], 10);
    if (baths >= 1 && baths <= 4) {
      params.bathrooms = String(baths);
    }
  }

  // 5. Match Price limits
  const cleanedForPrice = normalized
    .replace(/\$/g, "")
    .replace(/(\d+)[.,](\d{3})\b/g, "$1$2"); 
  
  const numbers = cleanedForPrice.match(/\b\d+\b/g);
  const kNumbers = cleanedForPrice.match(/\b(\d+)\s*k\b/g);
  
  let priceValues: number[] = [];
  if (numbers) {
    priceValues = priceValues.concat(numbers.map(num => parseInt(num, 10)));
  }
  if (kNumbers) {
    priceValues = priceValues.concat(kNumbers.map(kNum => {
      const val = parseInt(kNum.replace(/\s*k/g, ""), 10);
      return val * 1000;
    }));
  }

  priceValues = Array.from(new Set(priceValues)).filter(val => val > 5000);

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
  }

  return params;
}

export function HeroSearchShell({ variant }: { variant: Variant }) {
  const t = useTranslations("HomePage.hero");
  const router = useRouter();

  const [searchMode, setSearchMode] = useState<"smart" | "traditional">("smart");
  const [query, setQuery] = useState("");

  const containerClass =
    variant === "desktop-overlay"
      ? "pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6"
      : "px-4 py-3 md:hidden";

  const shellClass =
    variant === "desktop-overlay"
      ? "pointer-events-auto mx-auto w-full max-w-[720px] rounded-xl glass-strong p-3 shadow-[var(--shadow-glass)]"
      : "rounded-xl glass-strong p-3 shadow-[var(--shadow-glass)]";

  const handleSearch = () => {
    const params = parseQuery(query);
    
    // Add view=split to ensure consistent split layout
    params.view = "split";
    
    const qString = new URLSearchParams(params).toString();
    const searchUrl = qString ? `/search?${qString}` : "/search";
    router.push(searchUrl);
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
          <div className="mb-2.5 flex gap-2 text-xs font-semibold" aria-label="Search mode selector">
            <button
              type="button"
              onClick={() => setSearchMode("smart")}
              className={cn(
                "flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold",
                searchMode === "smart"
                  ? "bg-white/15 text-brand-gold ring-1 ring-brand-gold/30 shadow-sm"
                  : "text-white/60 hover:text-white/90 hover:bg-white/5"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t("smartToggle")}
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("traditional")}
              className={cn(
                "flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold",
                searchMode === "traditional"
                  ? "bg-white/15 text-brand-gold ring-1 ring-brand-gold/30 shadow-sm"
                  : "text-white/60 hover:text-white/90 hover:bg-white/5"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              {t("traditionalToggle")}
            </button>
          </div>

          {/* Interactive Input and Submit Button */}
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className={cn(
                "min-h-11 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/70",
              )}
            />
            <button
              type="button"
              onClick={handleSearch}
              aria-label={t("searchSubmit")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-navy text-white shadow-[var(--shadow-cta)] hover:bg-brand-navy-dark hover:scale-105 active:scale-95 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:ring-brand-gold"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

