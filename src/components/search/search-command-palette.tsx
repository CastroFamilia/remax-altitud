"use client";

/**
 * SearchCommandPalette — Global search overlay accessible from the nav header.
 *
 * Opens as a modal overlay with the same smart search capabilities as the
 * hero search. Supports keyboard shortcut (Cmd/Ctrl + K) to open.
 *
 * Features:
 * - Smart query parsing with live preview chips
 * - Autocomplete suggestions
 * - Recent search history
 * - Cycling placeholder examples
 * - Full keyboard navigation
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  X,
  Clock,
  Trash2,
  MapPin,
  Home,
  Tag,
  DollarSign,
  Bed,
  Ruler,
  Waves,
  Mountain,
  TreePine,
  Droplets,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useSearchHistory, type SearchHistoryEntry } from "@/hooks/use-search-history";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ParsedSearch {
  params: Record<string, string>;
  detected: DetectedItem[];
}

interface DetectedItem {
  type: "area" | "propertyType" | "tag" | "price" | "beds" | "baths" | "size" | "feature";
  label: string;
  icon: IconName;
  value: string;
}

interface Suggestion {
  category: "area" | "type" | "tag" | "feature";
  label: string;
  value: string;
  icon: IconName;
}

type IconName =
  | "pin"
  | "home"
  | "tag"
  | "dollar"
  | "bed"
  | "ruler"
  | "waves"
  | "mountain"
  | "tree"
  | "droplets"
  | "sparkle";

// ─── Dictionaries (shared with hero-search-shell) ──────────────────────────

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
  tinamastes: "tinamastes-platanillo",
  platanillo: "tinamastes-platanillo",
  barú: "tinamastes-platanillo",
  baru: "tinamastes-platanillo",
  // PZ sub-locations
  "san isidro": "perez-zeledon",
  "san isidro de el general": "perez-zeledon",
  cajón: "perez-zeledon",
  cajon: "perez-zeledon",
  rivas: "perez-zeledon",
  "daniel flores": "perez-zeledon",
  pejibaye: "perez-zeledon",
  "general viejo": "perez-zeledon",
  "san gerardo": "perez-zeledon",
  "san gerardo de rivas": "perez-zeledon",
  platanares: "perez-zeledon",
};

// Sub-location keyword → slug mapping for command palette smart search
const SUB_LOCATION_KEYWORDS: Record<string, string> = {
  "san isidro": "san-isidro",
  "san isidro de el general": "san-isidro",
  cajón: "cajon",
  cajon: "cajon",
  rivas: "rivas",
  "daniel flores": "daniel-flores",
  pejibaye: "pejibaye",
  "general viejo": "general-viejo",
  "san gerardo": "san-gerardo-de-rivas",
  "san gerardo de rivas": "san-gerardo-de-rivas",
  platanares: "platanares",
};

const AREA_LABELS: Record<string, string> = {
  "perez-zeledon": "Pérez Zeledón",
  uvita: "Uvita",
  dominical: "Dominical",
  ojochal: "Ojochal",
  quepos: "Quepos",
  "manuel-antonio": "Manuel Antonio",
  jaco: "Jacó",
  tamarindo: "Tamarindo",
  nosara: "Nosara",
  samara: "Sámara",
  "santa-teresa": "Santa Teresa",
  "playa-hermosa": "Playa Hermosa",
  liberia: "Liberia",
  "san-jose": "San José",
  escazu: "Escazú",
  "santa-ana": "Santa Ana",
  heredia: "Heredia",
  alajuela: "Alajuela",
  cartago: "Cartago",
  "tinamastes-platanillo": "Tinamastes & Platanillo",
  // PZ sub-location labels
  "san-isidro": "San Isidro",
  cajon: "Cajón",
  rivas: "Rivas",
  "daniel-flores": "Daniel Flores",
  pejibaye: "Pejibaye",
  "general-viejo": "General Viejo",
  "san-gerardo-de-rivas": "San Gerardo de Rivas",
  platanares: "Platanares",
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

const TYPE_LABELS: Record<string, { en: string; es: string }> = {
  Casa: { en: "House", es: "Casa" },
  Apartamento: { en: "Apartment", es: "Apartamento" },
  Lote: { en: "Lot", es: "Lote" },
  Terreno: { en: "Land", es: "Terreno" },
  Comercial: { en: "Commercial", es: "Comercial" },
  Finca: { en: "Farm", es: "Finca" },
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

const FEATURE_KEYWORDS: Record<string, { q: string; label: { en: string; es: string } }> = {
  pool: { q: "pool piscina", label: { en: "Pool", es: "Piscina" } },
  piscina: { q: "pool piscina", label: { en: "Pool", es: "Piscina" } },
  furnished: { q: "furnished amueblado", label: { en: "Furnished", es: "Amueblado" } },
  amueblado: { q: "furnished amueblado", label: { en: "Furnished", es: "Amueblado" } },
  amueblada: { q: "furnished amueblado", label: { en: "Furnished", es: "Amueblado" } },
  garage: { q: "garage garaje cochera", label: { en: "Garage", es: "Garaje" } },
  garaje: { q: "garage garaje cochera", label: { en: "Garage", es: "Garaje" } },
  gated: {
    q: "gated community comunidad cerrada",
    label: { en: "Gated Community", es: "Comunidad Cerrada" },
  },
  cerrada: {
    q: "gated community comunidad cerrada",
    label: { en: "Gated Community", es: "Comunidad Cerrada" },
  },
  garden: { q: "garden jardín jardin", label: { en: "Garden", es: "Jardín" } },
  jardín: { q: "garden jardín jardin", label: { en: "Garden", es: "Jardín" } },
};

const PLACEHOLDER_EXAMPLES_EN = [
  "Casa in Uvita with ocean view",
  "Lote 5000m2 in Pérez Zeledón",
  "House under $200K near beach",
  "Finca 2 hectares Dominical",
  "3 bedroom home with pool",
];

const PLACEHOLDER_EXAMPLES_ES = [
  "Casa en Uvita con vista al mar",
  "Lote 5000m2 en Pérez Zeledón",
  "Casa menos de $200K cerca de la playa",
  "Finca 2 hectáreas Dominical",
  "Casa 3 habitaciones con piscina",
];

// ─── Parse + Suggest (compact version) ──────────────────────────────────────

function parseQueryCompact(queryText: string, locale: string): ParsedSearch {
  const params: Record<string, string> = {};
  const detected: DetectedItem[] = [];
  const normalized = queryText.toLowerCase().trim();
  if (!normalized) return { params, detected };

  let remainingText = normalized;

  // Area — check sub-locations first for more specific match
  let matchedSubLocation = false;
  for (const [key, subSlug] of Object.entries(SUB_LOCATION_KEYWORDS)) {
    if (normalized.includes(key)) {
      params.area = "perez-zeledon";
      params.sub_location = subSlug;
      detected.push({ type: "area", label: AREA_LABELS[subSlug] || subSlug, icon: "pin", value: subSlug });
      remainingText = remainingText.replace(key, " ");
      matchedSubLocation = true;
      break;
    }
  }
  // If no sub-location matched, try main area keywords
  if (!matchedSubLocation) {
    for (const [key, slug] of Object.entries(AREA_KEYWORDS)) {
      if (normalized.includes(key)) {
        params.area = slug;
        detected.push({ type: "area", label: AREA_LABELS[slug] || slug, icon: "pin", value: slug });
        remainingText = remainingText.replace(key, " ");
        break;
      }
    }
  }

  // Type
  for (const [key, type] of Object.entries(TYPE_KEYWORDS)) {
    if (new RegExp(`\\b${key}\\b|${key}`).test(normalized)) {
      params.type = type;
      const tl = TYPE_LABELS[type];
      detected.push({
        type: "propertyType",
        label: tl ? (locale === "es" ? tl.es : tl.en) : type,
        icon: "home",
        value: type,
      });
      remainingText = remainingText.replace(key, " ");
      break;
    }
  }

  // Tags
  const tags: string[] = [];
  const tagPatterns: [RegExp, string, string, string, IconName][] = [
    [
      /ocean\s*view|vista\s*al\s*mar|vista\s*del\s*mar|sea\s*view/gi,
      "Con vista al mar",
      "Ocean View",
      "Vista al mar",
      "waves",
    ],
    [
      /mountain\s*view|vista\s*a\s*la\s*montaña|vista\s*de\s*montaña/gi,
      "Con vista a la montaña",
      "Mountain View",
      "Vista a la montaña",
      "mountain",
    ],
    [/\b(?:river|rio|río|quebrada)\b/gi, "Con río", "River", "Con río", "droplets"],
    [/\b(?:waterfall|cascada|catarata)\b/gi, "Con cascada", "Waterfall", "Con cascada", "droplets"],
  ];
  for (const [regex, tag, enLabel, esLabel, icon] of tagPatterns) {
    if (regex.test(normalized)) {
      tags.push(tag);
      detected.push({ type: "tag", label: locale === "es" ? esLabel : enLabel, icon, value: tag });
      remainingText = remainingText.replace(regex, " ");
    }
  }
  for (const [key, tag] of Object.entries(LIFESTYLE_KEYWORDS)) {
    if (normalized.includes(key) && !tags.includes(tag)) {
      tags.push(tag);
      detected.push({ type: "tag", label: tag, icon: "tag", value: tag });
      remainingText = remainingText.replace(key, " ");
    }
  }
  if (tags.length > 0) params.tags = tags.join(",");

  // Features
  const featureQTerms: string[] = [];
  for (const [key, feature] of Object.entries(FEATURE_KEYWORDS)) {
    if (new RegExp(`\\b${key}\\b`, "gi").test(normalized) && !featureQTerms.includes(feature.q)) {
      featureQTerms.push(feature.q);
      detected.push({
        type: "feature",
        label: locale === "es" ? feature.label.es : feature.label.en,
        icon: "sparkle",
        value: feature.q,
      });
      remainingText = remainingText.replace(new RegExp(`\\b${key}\\b`, "gi"), " ");
    }
  }

  // Price
  const cleanedForPrice = normalized.replace(/\$/g, "").replace(/(\d+)[.,](\d{3})\b/g, "$1$2");
  const kNumbers = cleanedForPrice.match(/\b(\d+)\s*k\b/g);
  let priceValues: number[] = [];
  const numbers = cleanedForPrice.match(/\b\d+\b/g);
  if (numbers) priceValues = priceValues.concat(numbers.map((n) => parseInt(n, 10)));
  if (kNumbers)
    priceValues = priceValues.concat(
      kNumbers.map((k) => parseInt(k.replace(/\s*k/g, ""), 10) * 1000),
    );
  priceValues = Array.from(new Set(priceValues)).filter((v) => v > 5000);
  if (priceValues.length > 0) {
    const isMax = /(?:under|max|less|below|hasta|menos|<)/i.test(normalized);
    const isMin = /(?:over|above|min|more|desde|mas|más|>)/i.test(normalized);
    if (priceValues.length >= 2) {
      const sorted = priceValues.sort((a, b) => a - b);
      params.price_min = String(sorted[0]);
      params.price_max = String(sorted[1]);
      detected.push({
        type: "price",
        label: `$${(sorted[0] / 1000).toFixed(0)}K – $${(sorted[1] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `${sorted[0]}-${sorted[1]}`,
      });
    } else if (isMax) {
      params.price_max = String(priceValues[0]);
      detected.push({
        type: "price",
        label: `${locale === "es" ? "Hasta" : "Under"} $${(priceValues[0] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `max:${priceValues[0]}`,
      });
    } else if (isMin) {
      params.price_min = String(priceValues[0]);
      detected.push({
        type: "price",
        label: `${locale === "es" ? "Desde" : "Over"} $${(priceValues[0] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `min:${priceValues[0]}`,
      });
    } else {
      params.price_max = String(priceValues[0]);
      detected.push({
        type: "price",
        label: `${locale === "es" ? "Hasta" : "Under"} $${(priceValues[0] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `max:${priceValues[0]}`,
      });
    }
  }

  // Beds
  const bedMatch = normalized.match(/(\d+)\s*(?:bed|bedroom|bedrooms|hab|habitacion|dormitorio)/);
  if (bedMatch?.[1]) {
    const beds = parseInt(bedMatch[1], 10);
    if (beds >= 1 && beds <= 5) {
      params.bedrooms = String(beds);
      detected.push({
        type: "beds",
        label: `${beds}+ ${locale === "es" ? "hab" : "bed"}`,
        icon: "bed",
        value: String(beds),
      });
    }
  }

  // Stop words + remaining q
  const STOP = new Set([
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
    "near",
    "cerca",
    "the",
  ]);
  const words = remainingText.split(/[\s,.\-/?!|;:]+/).filter((w) => w.length > 0 && !STOP.has(w));
  const allQ = [...words, ...featureQTerms];
  if (allQ.length > 0) params.q = allQ.join(" ");

  return { params, detected };
}

function getSuggestionsCompact(query: string, locale: string): Suggestion[] {
  const n = query.toLowerCase().trim();
  if (!n || n.length < 2) return [];
  const suggestions: Suggestion[] = [];

  for (const [kw, slug] of Object.entries(AREA_KEYWORDS)) {
    if (suggestions.filter((s) => s.category === "area").length >= 3) break;
    if (kw.includes(n) || n.includes(kw)) {
      if (!suggestions.some((s) => s.value === slug)) {
        suggestions.push({
          category: "area",
          label: AREA_LABELS[slug] || slug,
          value: slug,
          icon: "pin",
        });
      }
    }
  }
  for (const [kw, type] of Object.entries(TYPE_KEYWORDS)) {
    if (suggestions.filter((s) => s.category === "type").length >= 3) break;
    if (kw.includes(n) || n.includes(kw)) {
      if (!suggestions.some((s) => s.value === type)) {
        const tl = TYPE_LABELS[type];
        suggestions.push({
          category: "type",
          label: tl ? (locale === "es" ? tl.es : tl.en) : type,
          value: type,
          icon: "home",
        });
      }
    }
  }
  for (const [kw, feat] of Object.entries(FEATURE_KEYWORDS)) {
    if (suggestions.filter((s) => s.category === "feature").length >= 3) break;
    if (kw.includes(n) || n.includes(kw)) {
      const label = locale === "es" ? feat.label.es : feat.label.en;
      if (!suggestions.some((s) => s.label === label)) {
        suggestions.push({ category: "feature", label, value: kw, icon: "sparkle" });
      }
    }
  }

  return suggestions;
}

// ─── Icon component ─────────────────────────────────────────────────────────

function DetectedIcon({ icon, className }: { icon: IconName; className?: string }) {
  const cls = cn("h-3 w-3", className);
  switch (icon) {
    case "pin":
      return <MapPin className={cls} />;
    case "home":
      return <Home className={cls} />;
    case "tag":
      return <Tag className={cls} />;
    case "dollar":
      return <DollarSign className={cls} />;
    case "bed":
      return <Bed className={cls} />;
    case "ruler":
      return <Ruler className={cls} />;
    case "waves":
      return <Waves className={cls} />;
    case "mountain":
      return <Mountain className={cls} />;
    case "tree":
      return <TreePine className={cls} />;
    case "droplets":
      return <Droplets className={cls} />;
    case "sparkle":
      return <Sparkles className={cls} />;
    default:
      return <Tag className={cls} />;
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface SearchCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function SearchCommandPalette({ open, onClose }: SearchCommandPaletteProps) {
  const locale = useLocale();
  const router = useRouter();
  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const placeholders = locale === "es" ? PLACEHOLDER_EXAMPLES_ES : PLACEHOLDER_EXAMPLES_EN;

  // Labels
  const recentLabel = locale === "es" ? "Recientes" : "Recent";
  const suggestionsLabel = locale === "es" ? "Sugerencias" : "Suggestions";
  const clearAllLabel = locale === "es" ? "Borrar todo" : "Clear all";
  const searchBtnLabel = locale === "es" ? "Buscar" : "Search";
  const searchPropertyLabel = locale === "es" ? "Buscar propiedades..." : "Search properties...";
  const tryTypingLabel =
    locale === "es" ? "Intenta escribir algo como:" : "Try typing something like:";
  const pressEnterLabel = locale === "es" ? "Enter para buscar" : "Enter to search";
  const escLabel = locale === "es" ? "Esc para cerrar" : "Esc to close";

  // Auto-focus on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(-1);
      // Small delay to allow animation to start
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Cycling placeholder
  useEffect(() => {
    if (!open || query.length > 0) return;
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setPlaceholderVisible(true);
      }, 250);
    }, 3000);
    return () => clearInterval(interval);
  }, [open, query, placeholders.length]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const parsed = useMemo(() => parseQueryCompact(query, locale), [query, locale]);
  const suggestions = useMemo(() => getSuggestionsCompact(query, locale), [query, locale]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    const { params } = parseQueryCompact(query, locale);
    params.view = "split";

    // Save to history
    addEntry({ query: query.trim(), params, mode: "smart" });

    const qString = new URLSearchParams(params).toString();
    router.push(`/search?${qString}`);
    onClose();
  }, [query, locale, router, onClose, addEntry]);

  const handleHistoryClick = useCallback(
    (entry: SearchHistoryEntry) => {
      const qString = new URLSearchParams(entry.params).toString();
      router.push(`/search?${qString}`);
      onClose();
    },
    [router, onClose],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      const newQuery = query.trim() ? `${query.trim()} ${suggestion.value}` : suggestion.value;
      setQuery(newQuery);
      inputRef.current?.focus();
    },
    [query],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => prev + 1);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(-1, prev - 1));
    }
  };

  if (!open) return null;

  const showHistory = query.length === 0 && history.length > 0;
  const showSuggestions = query.length >= 2 && suggestions.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={searchPropertyLabel}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex items-start justify-center pt-[15vh] px-4">
        <div
          ref={overlayRef}
          className="w-full max-w-[620px] rounded-2xl bg-brand-navy/95 backdrop-blur-xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.6),_0_0_40px_rgba(194,166,97,0.1)] overflow-hidden animate-in fade-in-0 slide-in-from-top-4 zoom-in-95 duration-300"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Search className="h-5 w-5 text-brand-gold shrink-0" />
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
                autoComplete="off"
              />
              {query.length === 0 && (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 flex items-center text-base text-white/35 transition-opacity duration-250",
                    placeholderVisible ? "opacity-100" : "opacity-0",
                  )}
                >
                  <span className="truncate">{placeholders[placeholderIndex]}</span>
                </div>
              )}
            </div>
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-bold text-white/30 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 hover:text-white/50 hover:bg-white/10 transition-all cursor-pointer"
            >
              ESC
            </button>
          </div>

          {/* Parsed Preview Chips */}
          {parsed.detected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pt-3 pb-1">
              {parsed.detected.map((item, i) => (
                <span
                  key={`${item.type}-${item.value}-${i}`}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border",
                    item.type === "area" &&
                      "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
                    item.type === "propertyType" &&
                      "bg-blue-500/15 text-blue-300 border-blue-400/30",
                    item.type === "tag" && "bg-purple-500/15 text-purple-300 border-purple-400/30",
                    item.type === "price" && "bg-amber-500/15 text-amber-300 border-amber-400/30",
                    item.type === "beds" && "bg-rose-500/15 text-rose-300 border-rose-400/30",
                    item.type === "baths" && "bg-rose-500/15 text-rose-300 border-rose-400/30",
                    item.type === "size" && "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
                    item.type === "feature" &&
                      "bg-violet-500/15 text-violet-300 border-violet-400/30",
                  )}
                >
                  <DetectedIcon icon={item.icon} className="h-2.5 w-2.5" />
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {/* Content area */}
          <div className="max-h-[50vh] overflow-y-auto">
            {/* Recent History */}
            {showHistory && (
              <div className="py-2">
                <div className="flex items-center justify-between px-5 py-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
                    {recentLabel}
                  </span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    {clearAllLabel}
                  </button>
                </div>
                {history.map((entry, i) => (
                  <div key={`${entry.timestamp}-${i}`} className="group flex items-center">
                    <button
                      type="button"
                      onClick={() => handleHistoryClick(entry)}
                      className="flex flex-1 items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-white/30 shrink-0" />
                      <span className="truncate">{entry.query}</span>
                      <ArrowRight className="h-3 w-3 text-white/20 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEntry(i);
                      }}
                      className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/20 hover:text-white/60 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && (
              <div className="py-2">
                <div className="px-5 py-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
                    {suggestionsLabel}
                  </span>
                </div>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={`${suggestion.category}-${suggestion.value}-${i}`}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer",
                      i === selectedIndex && "bg-brand-gold/10 text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        suggestion.category === "area" && "bg-emerald-500/20 text-emerald-400",
                        suggestion.category === "type" && "bg-blue-500/20 text-blue-400",
                        suggestion.category === "tag" && "bg-purple-500/20 text-purple-400",
                        suggestion.category === "feature" && "bg-violet-500/20 text-violet-400",
                      )}
                    >
                      <DetectedIcon icon={suggestion.icon} className="h-3 w-3" />
                    </span>
                    <span className="font-medium">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state: show examples */}
            {query.length === 0 && history.length === 0 && (
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-white/40 mb-3">{tryTypingLabel}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {placeholders.slice(0, 4).map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setQuery(example)}
                      className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white/80 transition-all cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-4 text-[10px] text-white/30">
              <span className="flex items-center gap-1">
                <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono text-[9px]">
                  ↵
                </kbd>
                {pressEnterLabel}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono text-[9px]">
                  esc
                </kbd>
                {escLabel}
              </span>
            </div>
            {query.trim() && (
              <button
                type="button"
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-gold text-brand-navy text-xs font-bold hover:bg-brand-gold-light hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                <Search className="h-3 w-3" />
                {searchBtnLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
