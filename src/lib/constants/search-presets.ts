/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Smart preset definitions — configurable without code changes.
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
    id: "fincas-con-rio",
    labelKey: "fincasConRio",
    icon: "🏞️",
    filters: {
      type: "Finca",
      tags: ["Con río"],
    },
  },
  {
    id: "lotes-vista-mar",
    labelKey: "lotesVistaMar",
    icon: "🌊",
    filters: {
      type: "Lote",
      tags: ["Con vista al mar"],
    },
  },
  {
    id: "casas-vista-mar",
    labelKey: "casasVistaMar",
    icon: "🏡",
    filters: {
      type: "Casa",
      tags: ["Con vista al mar"],
    },
  },
  {
    id: "casas-vista-montana",
    labelKey: "casasVistaMontana",
    icon: "🏔️",
    filters: {
      type: "Casa",
      tags: ["Con vista a la montaña"],
    },
  },
  {
    id: "lotes-vista-montana",
    labelKey: "lotesVistaMontana",
    icon: "⛰️",
    filters: {
      type: "Lote",
      tags: ["Con vista a la montaña"],
    },
  },
  {
    id: "lotes-con-cascada",
    labelKey: "lotesConCascada",
    icon: "💦",
    filters: {
      type: "Lote",
      tags: ["Con cascada"],
    },
  },
];
