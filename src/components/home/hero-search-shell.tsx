"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Globe,
  MapPin,
  Home,
  Tag,
  DollarSign,
  Bed,
  Ruler,
  X,
  Waves,
  Mountain,
  TreePine,
  Droplets,
  Clock,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter, Link } from "@/i18n/navigation";
import { getAvailableAreas } from "@/app/actions/search-actions";
import { useSearchHistory } from "@/hooks/use-search-history";
import { AreaSearchCombobox } from "@/components/search/area-search-combobox";

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

// Reverse lookup: slug → display label
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
  // PZ sub-location labels (used in smart search chips)
  // Aligned with ALTITUD HUB locations.js — 12 districts
  "san-isidro": "San Isidro de El General",
  "el-general": "El General",
  "daniel-flores": "Daniel Flores",
  rivas: "Rivas",
  "san-pedro": "San Pedro",
  platanares: "Platanares",
  pejibaye: "Pejibaye",
  cajon: "Cajón",
  baru: "Barú",
  "rio-nuevo": "Río Nuevo",
  paramo: "Páramo",
  "la-amistad": "La Amistad",
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

// Feature keywords that get passed as 'q' search terms
const FEATURE_KEYWORDS: Record<string, { q: string; label: { en: string; es: string } }> = {
  pool: { q: "pool piscina", label: { en: "Pool", es: "Piscina" } },
  piscina: { q: "pool piscina", label: { en: "Pool", es: "Piscina" } },
  furnished: { q: "furnished amueblado", label: { en: "Furnished", es: "Amueblado" } },
  amueblado: { q: "furnished amueblado", label: { en: "Furnished", es: "Amueblado" } },
  amueblada: { q: "furnished amueblado", label: { en: "Furnished", es: "Amueblado" } },
  garage: { q: "garage garaje cochera", label: { en: "Garage", es: "Garaje" } },
  garaje: { q: "garage garaje cochera", label: { en: "Garage", es: "Garaje" } },
  cochera: { q: "garage garaje cochera", label: { en: "Garage", es: "Garaje" } },
  gated: {
    q: "gated community comunidad cerrada",
    label: { en: "Gated Community", es: "Comunidad Cerrada" },
  },
  cerrada: {
    q: "gated community comunidad cerrada",
    label: { en: "Gated Community", es: "Comunidad Cerrada" },
  },
  new: {
    q: "new construction nueva construcción nuevo",
    label: { en: "New Construction", es: "Construcción Nueva" },
  },
  nueva: {
    q: "new construction nueva construcción nuevo",
    label: { en: "New Construction", es: "Construcción Nueva" },
  },
  nuevo: {
    q: "new construction nueva construcción nuevo",
    label: { en: "New Construction", es: "Construcción Nueva" },
  },
  "pre-construction": {
    q: "pre-construction pre-venta preventa",
    label: { en: "Pre-Construction", es: "Pre-venta" },
  },
  preventa: {
    q: "pre-construction pre-venta preventa",
    label: { en: "Pre-Construction", es: "Pre-venta" },
  },
  "pre-venta": {
    q: "pre-construction pre-venta preventa",
    label: { en: "Pre-Construction", es: "Pre-venta" },
  },
  garden: { q: "garden jardín jardin", label: { en: "Garden", es: "Jardín" } },
  jardín: { q: "garden jardín jardin", label: { en: "Garden", es: "Jardín" } },
  jardin: { q: "garden jardín jardin", label: { en: "Garden", es: "Jardín" } },
};

const PROPERTY_TYPES = ["Casa", "Apartamento", "Lote", "Terreno", "Comercial", "Finca"];

// Sub-location keyword → slug mapping for smart search
// Aligned with ALTITUD HUB locations.js — 12 districts of Pérez Zeledón
const SUB_LOCATION_KEYWORDS: Record<string, string> = {
  "san isidro": "san-isidro",
  "san isidro de el general": "san-isidro",
  cajón: "cajon",
  cajon: "cajon",
  rivas: "rivas",
  "daniel flores": "daniel-flores",
  pejibaye: "pejibaye",
  "el general": "el-general",
  "general viejo": "el-general",
  "san pedro": "san-pedro",
  platanares: "platanares",
  barú: "baru",
  baru: "baru",
  tinamaste: "baru",
  "río nuevo": "rio-nuevo",
  "rio nuevo": "rio-nuevo",
  páramo: "paramo",
  paramo: "paramo",
  chirripó: "paramo",
  "la amistad": "la-amistad",
  "san gerardo": "rivas",
  "san gerardo de rivas": "rivas",
};

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

/** PZ sub-locations for the grouped dropdown fallback — aligned with ALTITUD HUB */
const FALLBACK_PZ_SUB_LOCATIONS = [
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

/** Grouping definitions for the area dropdown */
interface AreaGrouping {
  labelEn: string;
  labelEs: string;
  slugs: string[];
}

const AREA_GROUPS: AreaGrouping[] = [
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
  {
    labelEn: "Central Valley",
    labelEs: "Valle Central",
    slugs: ["san-jose", "escazu", "santa-ana", "heredia", "alajuela", "cartago"],
  },
  {
    labelEn: "Guanacaste",
    labelEs: "Guanacaste",
    slugs: ["liberia"],
  },
];

// Cycling placeholder examples
const PLACEHOLDER_EXAMPLES_EN = [
  "Casa in Uvita with ocean view",
  "Lote 5000m2 in Pérez Zeledón",
  "House under $200K near beach",
  "Finca 2 hectares Dominical",
  "3 bedroom home with pool",
  "Farm with river in mountains",
  "Apartment in Manuel Antonio",
  "Land 1 acre Ojochal",
];

const PLACEHOLDER_EXAMPLES_ES = [
  "Casa en Uvita con vista al mar",
  "Lote 5000m2 en Pérez Zeledón",
  "Casa menos de $200K cerca de la playa",
  "Finca 2 hectáreas Dominical",
  "Casa 3 habitaciones con piscina",
  "Finca con río en las montañas",
  "Apartamento en Manuel Antonio",
  "Terreno 1 acre Ojochal",
];

// ---------- Parsed result type ----------
interface ParsedSearch {
  params: Record<string, string>;
  detected: DetectedItem[];
}

interface DetectedItem {
  type: "area" | "propertyType" | "tag" | "price" | "beds" | "baths" | "size" | "feature";
  label: string;
  icon:
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
  value: string;
}

// ---------- Suggestion type ----------
interface Suggestion {
  category: "area" | "type" | "tag" | "feature";
  label: string;
  value: string;
  icon: "pin" | "home" | "tag" | "sparkle";
}

function parseQuery(queryText: string, locale: string = "en"): ParsedSearch {
  const params: Record<string, string> = {};
  const detected: DetectedItem[] = [];
  const normalized = queryText.toLowerCase().trim();
  if (!normalized) return { params, detected };

  let remainingText = normalized;

  // 1. Match Area (check sub-locations first for more specific match)
  let matchedAreaKey = "";
  // Try sub-location keywords first (more specific)
  for (const [key, subSlug] of Object.entries(SUB_LOCATION_KEYWORDS)) {
    if (normalized.includes(key)) {
      params.area = "perez-zeledon"; // Sub-locations are all in PZ
      params.sub_location = subSlug;
      matchedAreaKey = key;
      detected.push({
        type: "area",
        label: AREA_LABELS[subSlug] || subSlug,
        icon: "pin",
        value: subSlug,
      });
      break;
    }
  }
  // If no sub-location matched, try main area keywords
  if (!matchedAreaKey) {
    for (const [key, slug] of Object.entries(AREA_KEYWORDS)) {
      if (normalized.includes(key)) {
        params.area = slug;
        matchedAreaKey = key;
        detected.push({
          type: "area",
          label: AREA_LABELS[slug] || slug,
          icon: "pin",
          value: slug,
        });
        break;
      }
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
      const typeLabel = TYPE_LABELS[type];
      detected.push({
        type: "propertyType",
        label: typeLabel ? (locale === "es" ? typeLabel.es : typeLabel.en) : type,
        icon: "home",
        value: type,
      });
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
    detected.push({
      type: "tag",
      label: locale === "es" ? "Vista al mar" : "Ocean View",
      icon: "waves",
      value: "Con vista al mar",
    });
    remainingText = remainingText.replace(oceanViewRegex, " ");
  }

  // Mountain View
  const mountainViewRegex =
    /mountain\s*view|vista\s*a\s*la\s*montaña|vista\s*de\s*montaña|vistas\s*a\s*las\s*montañas|mountain-view/gi;
  if (mountainViewRegex.test(normalized)) {
    tags.push("Con vista a la montaña");
    detected.push({
      type: "tag",
      label: locale === "es" ? "Vista a la montaña" : "Mountain View",
      icon: "mountain",
      value: "Con vista a la montaña",
    });
    remainingText = remainingText.replace(mountainViewRegex, " ");
  }

  // River
  const riverRegex = /\b(?:river|rio|río|quebrada|creek|stream)\b/gi;
  if (riverRegex.test(normalized)) {
    tags.push("Con río");
    detected.push({
      type: "tag",
      label: locale === "es" ? "Con río" : "River",
      icon: "droplets",
      value: "Con río",
    });
    remainingText = remainingText.replace(riverRegex, " ");
  }

  // Waterfall
  const waterfallRegex = /\b(?:waterfall|cascada|catarata|waterfalls)\b/gi;
  if (waterfallRegex.test(normalized)) {
    tags.push("Con cascada");
    detected.push({
      type: "tag",
      label: locale === "es" ? "Con cascada" : "Waterfall",
      icon: "droplets",
      value: "Con cascada",
    });
    remainingText = remainingText.replace(waterfallRegex, " ");
  }

  // Legacy LIFESTYLE_KEYWORDS matching fallback
  for (const [key, tag] of Object.entries(LIFESTYLE_KEYWORDS)) {
    if (normalized.includes(key)) {
      if (!tags.includes(tag)) {
        tags.push(tag);
        detected.push({
          type: "tag",
          label: tag,
          icon: "tag",
          value: tag,
        });
      }
      remainingText = remainingText.replace(key, " ");
    }
  }

  if (tags.length > 0) {
    params.tags = tags.join(",");
  }

  // 3b. Match Feature Keywords (pool, furnished, etc.)
  const featureQTerms: string[] = [];
  for (const [key, feature] of Object.entries(FEATURE_KEYWORDS)) {
    const featureRegex = new RegExp(`\\b${key}\\b`, "gi");
    if (featureRegex.test(normalized)) {
      // Avoid duplicating the same feature
      if (!featureQTerms.includes(feature.q)) {
        featureQTerms.push(feature.q);
        detected.push({
          type: "feature",
          label: locale === "es" ? feature.label.es : feature.label.en,
          icon: "sparkle",
          value: feature.q,
        });
      }
      remainingText = remainingText.replace(featureRegex, " ");
    }
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
    params.lot_min = String(Math.round(m2Value * 0.8));
    params.lot_max = String(Math.round(m2Value * 1.2));

    detected.push({
      type: "size",
      label: `~${acresValue} ${acresValue === 1 ? "acre" : "acres"}`,
      icon: "ruler",
      value: `${m2Value}m²`,
    });

    remainingText = remainingText.replace(acreRegex, " ");
  }

  // 4b. Hectares parsing
  const hectareRegex =
    /\b(\d+(?:\.\d+)?|una|dos|tres|cinco)\s*(?:hectareas?|hectáreas?|hecatreas?|hetareas?|hecteras?|ha)\b/gi;
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

    const m2Value = hectaresValue * 10000;
    params.lot_min = String(Math.round(m2Value * 0.8));
    params.lot_max = String(Math.round(m2Value * 1.2));

    detected.push({
      type: "size",
      label: `~${hectaresValue} ha`,
      icon: "ruler",
      value: `${m2Value}m²`,
    });

    remainingText = remainingText.replace(hectareRegex, " ");
  }

  // 4c. Square meters parsing
  const m2Regex = /\b(\d+(?:\s*\d+)?)\s*(?:m2|m²|sq\s*mt|sqm|metros\s*cuadrados|mt2|mts2)\b/gi;
  const m2Match = normalized.match(m2Regex);
  if (m2Match) {
    const matchedStr = m2Match[0].toLowerCase();
    const numStr = matchedStr.replace(/[^\d]/g, "");
    const m2Value = parseInt(numStr, 10);
    if (Number.isFinite(m2Value) && m2Value > 0) {
      params.lot_min = String(Math.round(m2Value * 0.8));
      params.lot_max = String(Math.round(m2Value * 1.2));

      detected.push({
        type: "size",
        label: `~${m2Value.toLocaleString()} m²`,
        icon: "ruler",
        value: `${m2Value}m²`,
      });
    }
    remainingText = remainingText.replace(m2Regex, " ");
  }

  // 5. Match Bedrooms / Bathrooms count
  const bedMatch = normalized.match(
    /(\d+)\s*(?:bed|bedroom|bedrooms|hab|habitacion|habitaciones|dormitorio|dormitorios|cuarto|cuartos)/,
  );
  if (bedMatch && bedMatch[1]) {
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
    remainingText = remainingText.replace(bedMatch[0], " ");
  }

  const bathMatch = normalized.match(/(\d+)\s*(?:bath|bathroom|bathrooms|baño|baños|bañ)/);
  if (bathMatch && bathMatch[1]) {
    const baths = parseInt(bathMatch[1], 10);
    if (baths >= 1 && baths <= 4) {
      params.bathrooms = String(baths);
      detected.push({
        type: "baths",
        label: `${baths}+ ${locale === "es" ? "baños" : "bath"}`,
        icon: "bed",
        value: String(baths),
      });
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
        label:
          locale === "es"
            ? `Hasta $${(priceValues[0] / 1000).toFixed(0)}K`
            : `Under $${(priceValues[0] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `max:${priceValues[0]}`,
      });
    } else if (isMin) {
      params.price_min = String(priceValues[0]);
      detected.push({
        type: "price",
        label:
          locale === "es"
            ? `Desde $${(priceValues[0] / 1000).toFixed(0)}K`
            : `Over $${(priceValues[0] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `min:${priceValues[0]}`,
      });
    } else {
      params.price_max = String(priceValues[0]);
      detected.push({
        type: "price",
        label:
          locale === "es"
            ? `Hasta $${(priceValues[0] / 1000).toFixed(0)}K`
            : `Under $${(priceValues[0] / 1000).toFixed(0)}K`,
        icon: "dollar",
        value: `max:${priceValues[0]}`,
      });
    }
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
    "near",
    "cerca",
    "the",
  ]);

  const words = remainingText.split(/[\s,.\-/?!|;:]+/);
  const filteredWords = words.filter((w) => w.length > 0 && !STOP_WORDS.has(w));

  // Combine remaining words with feature q terms
  const allQTerms = [...filteredWords, ...featureQTerms];
  if (allQTerms.length > 0) {
    params.q = allQTerms.join(" ");
  }

  return { params, detected };
}

// Generate suggestions based on partial query input
function getSuggestions(query: string, locale: string): Suggestion[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized || normalized.length < 2) return [];

  const suggestions: Suggestion[] = [];
  const maxPerCategory = 3;

  // Match areas
  let areaCount = 0;
  for (const [keyword, slug] of Object.entries(AREA_KEYWORDS)) {
    if (areaCount >= maxPerCategory) break;
    if (keyword.includes(normalized) || normalized.includes(keyword)) {
      // Skip duplicates (same slug)
      if (suggestions.some((s) => s.category === "area" && s.value === slug)) continue;
      suggestions.push({
        category: "area",
        label: AREA_LABELS[slug] || slug,
        value: slug,
        icon: "pin",
      });
      areaCount++;
    }
  }

  // Match property types
  let typeCount = 0;
  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    if (typeCount >= maxPerCategory) break;
    if (keyword.includes(normalized) || normalized.includes(keyword)) {
      if (suggestions.some((s) => s.category === "type" && s.value === type)) continue;
      const typeLabel = TYPE_LABELS[type];
      suggestions.push({
        category: "type",
        label: typeLabel ? (locale === "es" ? typeLabel.es : typeLabel.en) : type,
        value: type,
        icon: "home",
      });
      typeCount++;
    }
  }

  // Match lifestyle tags
  const tagMatches = [
    {
      pattern: /ocean|mar|sea|vista/,
      label: locale === "es" ? "Vista al mar" : "Ocean View",
      value: "ocean view",
    },
    {
      pattern: /mountain|montaña/,
      label: locale === "es" ? "Vista a la montaña" : "Mountain View",
      value: "mountain view",
    },
    {
      pattern: /river|río|rio|quebrada/,
      label: locale === "es" ? "Con río" : "River",
      value: "river",
    },
    {
      pattern: /waterfall|cascada|catarata/,
      label: locale === "es" ? "Con cascada" : "Waterfall",
      value: "waterfall",
    },
    {
      pattern: /retire|jubil|retir/,
      label: locale === "es" ? "Retiro" : "Retirement",
      value: "retire",
    },
    {
      pattern: /invest|invers/,
      label: locale === "es" ? "Inversión" : "Investment",
      value: "investment",
    },
    {
      pattern: /rental|renta|alquil/,
      label: locale === "es" ? "Potencial de renta" : "Rental Potential",
      value: "rental",
    },
    {
      pattern: /vacation|vacacion/,
      label: locale === "es" ? "Vacacional" : "Vacation Home",
      value: "vacation",
    },
  ];

  let tagCount = 0;
  for (const tag of tagMatches) {
    if (tagCount >= maxPerCategory) break;
    if (tag.pattern.test(normalized)) {
      suggestions.push({
        category: "tag",
        label: tag.label,
        value: tag.value,
        icon: "tag",
      });
      tagCount++;
    }
  }

  // Match feature keywords
  let featureCount = 0;
  for (const [keyword, feature] of Object.entries(FEATURE_KEYWORDS)) {
    if (featureCount >= maxPerCategory) break;
    if (keyword.includes(normalized) || normalized.includes(keyword)) {
      const label = locale === "es" ? feature.label.es : feature.label.en;
      if (suggestions.some((s) => s.category === "feature" && s.label === label)) continue;
      suggestions.push({
        category: "feature",
        label,
        value: keyword,
        icon: "sparkle",
      });
      featureCount++;
    }
  }

  return suggestions;
}

// Icon resolver component
function DetectedIcon({
  icon,
  className,
}: {
  icon: DetectedItem["icon"] | Suggestion["icon"];
  className?: string;
}) {
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

export function HeroSearchShell({ variant }: { variant: Variant }) {
  const t = useTranslations("HomePage.hero");
  const tSearch = useTranslations("SearchPage");
  const tEmpty = useTranslations("EmptyStates.noResults");
  const router = useRouter();
  const locale = useLocale();
  const { history, addEntry, removeEntry, clearHistory } = useSearchHistory();

  const [searchMode, setSearchMode] = useState<"smart" | "traditional">("smart");
  const [selectedListingType, setSelectedListingType] = useState<"Sale" | "Lease">("Sale");
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  // Traditional Search filter states
  const [selectedType, setSelectedType] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedSubLocation, setSelectedSubLocation] = useState("");
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  const [areas, setAreas] = useState<
    { slug: string; label: string; parentSlug?: string; isSubLocation?: boolean }[]
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cycling placeholders
  const placeholders = locale === "es" ? PLACEHOLDER_EXAMPLES_ES : PLACEHOLDER_EXAMPLES_EN;

  useEffect(() => {
    if (query.length > 0) return; // Don't cycle when user is typing

    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, [query, placeholders.length]);

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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live parse result
  const parsed = useMemo(() => parseQuery(query, locale), [query, locale]);
  const suggestions = useMemo(() => getSuggestions(query, locale), [query, locale]);

  const containerClass =
    variant === "desktop-overlay"
      ? "pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6"
      : "px-4 py-3 md:hidden";

  const shellClass =
    variant === "desktop-overlay"
      ? "pointer-events-auto mx-auto w-full max-w-[720px] rounded-2xl bg-brand-navy/75 backdrop-blur-xl border border-brand-gold/30 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4),_0_0_30px_rgba(194,166,97,0.15)] hover:border-brand-gold/50 transition-all duration-300"
      : "rounded-2xl bg-brand-navy/90 backdrop-blur-lg border border-brand-gold/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]";

  const handleSearch = useCallback(() => {
    if (searchMode === "smart") {
      const { params } = parseQuery(query, locale);
      params.view = "split";
      params.listing_type = selectedListingType;

      // Save to search history
      if (query.trim()) {
        addEntry({ query: query.trim(), params, mode: "smart" });
      }

      const qString = new URLSearchParams(params).toString();
      const searchUrl = qString ? `/search?${qString}` : "/search";
      router.push(searchUrl);
    } else {
      const params: Record<string, string> = {
        view: "split",
        listing_type: selectedListingType,
      };
      if (selectedType) {
        params.type = selectedType;
      }
      if (selectedArea) {
        params.area = selectedArea;
      }
      if (selectedSubLocation) {
        params.sub_location = selectedSubLocation;
      }
      if (priceMin !== undefined && priceMin !== null && !isNaN(priceMin)) {
        params.price_min = String(priceMin);
      }
      if (priceMax !== undefined && priceMax !== null && !isNaN(priceMax)) {
        params.price_max = String(priceMax);
      }

      // Save to search history (traditional mode)
      const desc =
        [
          selectedListingType === "Lease" ? "Rent" : "Buy",
          selectedType,
          selectedArea ? AREA_LABELS[selectedArea] || selectedArea : "",
          priceMin ? `$${priceMin}+` : "",
          priceMax ? `Under $${priceMax}` : "",
        ]
          .filter(Boolean)
          .join(", ") || "All properties";
      addEntry({ query: desc, params, mode: "traditional" });

      const qString = new URLSearchParams(params).toString();
      const searchUrl = qString ? `/search?${qString}` : "/search";
      router.push(searchUrl);
    }
  }, [
    searchMode,
    query,
    locale,
    router,
    selectedType,
    selectedArea,
    selectedSubLocation,
    priceMin,
    priceMax,
    addEntry,
    selectedListingType,
  ]);

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      // Append the suggestion value to the query
      const newQuery = query.trim() ? `${query.trim()} ${suggestion.value}` : suggestion.value;
      setQuery(newQuery);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [query],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      setShowSuggestions(false);
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedSuggestionIndex(-1);
    setShowHistory(false);
    if (e.target.value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={containerClass}>
      <div role="search" aria-label={t("searchAriaLabel")} className={shellClass}>
        <div>
          {/* Transaction Type (Buy/Rent) and Search Mode Toggles Row */}
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            {/* Transaction Type (Buy / Rent) Toggles */}
            <div className="flex gap-1 p-0.5 rounded-lg bg-black/20 border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedListingType("Sale")}
                className={cn(
                  "py-1 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none",
                  selectedListingType === "Sale"
                    ? "bg-brand-gold text-brand-navy shadow-sm font-extrabold"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                )}
              >
                {t("buyOption")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedListingType("Lease")}
                className={cn(
                  "py-1 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none",
                  selectedListingType === "Lease"
                    ? "bg-brand-gold text-brand-navy shadow-sm font-extrabold"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                )}
              >
                {t("rentOption")}
              </button>
            </div>

            {/* Interactive Search Mode Toggles */}
            <div className="flex gap-2 text-xs font-semibold" aria-label="Search mode selector">
              <button
                type="button"
                onClick={() => setSearchMode("smart")}
                className={cn(
                  "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none",
                  searchMode === "smart"
                    ? "bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/45 shadow-[0_0_8px_rgba(194,166,97,0.15)]"
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
                  "flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none",
                  searchMode === "traditional"
                    ? "bg-brand-gold/20 text-brand-gold ring-1 ring-brand-gold/45 shadow-[0_0_8px_rgba(194,166,97,0.15)]"
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
          </div>

          {searchMode === "smart" ? (
            /* Smart Search mode: Enhanced with autocomplete and live preview */
            <div className="relative">
              {/* Search Input */}
              <div className="flex items-center gap-2 bg-black/30 border border-white/15 rounded-xl pl-3 pr-1.5 py-1 focus-within:border-brand-gold/60 focus-within:ring-1 focus-within:ring-brand-gold/30 transition-all duration-200">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="search"
                    role="combobox"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (query.length >= 2) setShowSuggestions(true);
                      else if (query.length === 0 && history.length > 0) setShowHistory(true);
                    }}
                    placeholder=""
                    aria-label={t("searchPlaceholder")}
                    aria-expanded={showSuggestions}
                    aria-controls="hero-search-suggestions"
                    aria-haspopup="listbox"
                    aria-autocomplete="list"
                    className={cn(
                      "min-h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45",
                    )}
                  />
                  {/* Cycling Placeholder Overlay */}
                  {query.length === 0 && (
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0 flex items-center text-sm text-white/40 transition-opacity duration-300",
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
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-all duration-150 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    handleSearch();
                  }}
                  aria-label={t("searchSubmit")}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy shadow-md hover:bg-brand-gold-light hover:scale-105 active:scale-95 transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:ring-brand-gold"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Parsed Query Preview Chips */}
              {parsed.detected.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  {parsed.detected.map((item, i) => (
                    <span
                      key={`${item.type}-${item.value}-${i}`}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border transition-all duration-200",
                        item.type === "area" &&
                          "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
                        item.type === "propertyType" &&
                          "bg-blue-500/15 text-blue-300 border-blue-400/30",
                        item.type === "tag" &&
                          "bg-purple-500/15 text-purple-300 border-purple-400/30",
                        item.type === "price" &&
                          "bg-amber-500/15 text-amber-300 border-amber-400/30",
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

              {/* Recent Search History Dropdown */}
              {showHistory && query.length === 0 && history.length > 0 && !showSuggestions && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-brand-navy/95 backdrop-blur-xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
                      {locale === "es" ? "Recientes" : "Recent"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearHistory();
                        setShowHistory(false);
                      }}
                      className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      {locale === "es" ? "Borrar" : "Clear"}
                    </button>
                  </div>
                  {history.map((entry, i) => (
                    <div key={`${entry.timestamp}-${i}`} className="group flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const qString = new URLSearchParams(entry.params).toString();
                          router.push(`/search?${qString}`);
                          setShowHistory(false);
                        }}
                        className="flex flex-1 items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
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
                        className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/20 hover:text-white/60 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        aria-label="Remove"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  role="listbox"
                  id="hero-search-suggestions"
                  className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-brand-navy/95 backdrop-blur-xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
                >
                  {/* Group suggestions by category */}
                  {(["area", "type", "tag", "feature"] as const).map((cat) => {
                    const catSuggestions = suggestions.filter((s) => s.category === cat);
                    if (catSuggestions.length === 0) return null;

                    const catLabel = {
                      area: locale === "es" ? "Zonas" : "Areas",
                      type: locale === "es" ? "Tipos" : "Types",
                      tag: locale === "es" ? "Estilo de vida" : "Lifestyle",
                      feature: locale === "es" ? "Características" : "Features",
                    }[cat];

                    return (
                      <div key={cat}>
                        <div className="px-3 pt-2.5 pb-1">
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
                            {catLabel}
                          </span>
                        </div>
                        {catSuggestions.map((suggestion) => {
                          const globalIndex = suggestions.indexOf(suggestion);
                          return (
                            <button
                              key={`${suggestion.category}-${suggestion.value}`}
                              type="button"
                              role="option"
                              aria-selected={globalIndex === selectedSuggestionIndex}
                              onClick={() => handleSuggestionClick(suggestion)}
                              onMouseEnter={() => setSelectedSuggestionIndex(globalIndex)}
                              className={cn(
                                "flex w-full items-center gap-2.5 px-3 py-2 text-sm text-white/80 transition-colors cursor-pointer",
                                globalIndex === selectedSuggestionIndex
                                  ? "bg-brand-gold/15 text-white"
                                  : "hover:bg-white/5",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                                  suggestion.category === "area" &&
                                    "bg-emerald-500/20 text-emerald-400",
                                  suggestion.category === "type" && "bg-blue-500/20 text-blue-400",
                                  suggestion.category === "tag" &&
                                    "bg-purple-500/20 text-purple-400",
                                  suggestion.category === "feature" &&
                                    "bg-violet-500/20 text-violet-400",
                                )}
                              >
                                <DetectedIcon icon={suggestion.icon} className="h-3 w-3" />
                              </span>
                              <span className="font-medium">{suggestion.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
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

                {/* Area / Location Filter — Searchable Combobox */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                    {tSearch("filters.location")}
                  </label>
                  <AreaSearchCombobox
                    areas={areas}
                    selectedArea={selectedArea}
                    selectedSubLocation={selectedSubLocation}
                    onAreaChange={(areaSlug, subSlug) => {
                      setSelectedArea(areaSlug);
                      setSelectedSubLocation(subSlug);
                    }}
                    placeholder={locale === "es" ? "Buscar zona..." : "Search location..."}
                    locale={locale}
                    variant="dark"
                  />
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
