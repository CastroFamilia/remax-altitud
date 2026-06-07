/**
 * Lifestyle tag definitions and auto-tagging rules.
 * Used by src/lib/sync/lifestyle-tagger.ts and Client Components for filter UI.
 */

import type { RawProperty } from "@/types/remax-api";

/**
 * All valid lifestyle tag names.
 */
export const LIFESTYLE_TAGS = [
  "Casa",
  "Lote",
  "Finca",
  "Con río",
  "Con cascada",
  "Con vista al mar",
  "Con vista a la montaña",
  "Para inversión",
  "Retiro",
] as const;

/** Union type of all valid lifestyle tag strings. */
export type LifestyleTag = (typeof LIFESTYLE_TAGS)[number];

/**
 * A single auto-tagging rule.
 */
export interface LifestyleTagRule {
  tag: LifestyleTag;
  match: (raw: RawProperty) => boolean;
}

/**
 * Display label overrides for lifestyle tags.
 * Maps stored tag values to human-readable display labels.
 * Kept for architectural signature; no overrides needed now.
 */
export const TAG_DISPLAY_LABELS: Record<string, string> = {};

/**
 * Returns the display label for a lifestyle tag.
 * Falls back to the raw tag value if no override exists.
 */
export function tagDisplayLabel(tag: string): string {
  return TAG_DISPLAY_LABELS[tag] ?? tag;
}

export const LIFESTYLE_TAG_RULES: LifestyleTagRule[] = [
  {
    tag: "Casa",
    match: (raw) =>
      raw.propertyTypeEn.toLowerCase().includes("house") ||
      raw.propertyTypeEs.toLowerCase().includes("casa"),
  },
  {
    tag: "Lote",
    match: (raw) =>
      raw.propertyTypeEn.toLowerCase().includes("lot") ||
      raw.propertyTypeEn.toLowerCase().includes("land") ||
      raw.propertyTypeEs.toLowerCase().includes("lote") ||
      raw.propertyTypeEs.toLowerCase().includes("terreno"),
  },
  {
    tag: "Finca",
    match: (raw) =>
      raw.propertyTypeEn.toLowerCase().includes("farm") ||
      raw.propertyTypeEn.toLowerCase().includes("ranch") ||
      raw.propertyTypeEs.toLowerCase().includes("finca"),
  },
  {
    tag: "Con río",
    match: (raw) => {
      const desc = `${raw.publicRemarksEn ?? ""} ${raw.publicRemarksEs ?? ""}`.toLowerCase();
      return (
        desc.includes("river") ||
        desc.includes("río") ||
        desc.includes("rio") ||
        desc.includes("creek") ||
        desc.includes("quebrada") ||
        desc.includes("stream") ||
        desc.includes("brook")
      );
    },
  },
  {
    tag: "Con cascada",
    match: (raw) => {
      const desc = `${raw.publicRemarksEn ?? ""} ${raw.publicRemarksEs ?? ""}`.toLowerCase();
      return (
        desc.includes("waterfall") ||
        desc.includes("cascada") ||
        desc.includes("catarata") ||
        desc.includes("cascade") ||
        desc.includes("cataratas")
      );
    },
  },
  {
    tag: "Con vista al mar",
    match: (raw) => {
      const desc = `${raw.publicRemarksEn ?? ""} ${raw.publicRemarksEs ?? ""}`.toLowerCase();
      return (
        desc.includes("ocean view") ||
        desc.includes("vista al mar") ||
        desc.includes("vista del mar") ||
        desc.includes("sea view") ||
        desc.includes("ocean-view")
      );
    },
  },
  {
    tag: "Con vista a la montaña",
    match: (raw) => {
      const desc = `${raw.publicRemarksEn ?? ""} ${raw.publicRemarksEs ?? ""}`.toLowerCase();
      return (
        desc.includes("mountain view") ||
        desc.includes("vista a la montaña") ||
        desc.includes("vista de la montaña") ||
        desc.includes("vista de montaña") ||
        desc.includes("vistas a las montañas") ||
        desc.includes("mountain-view")
      );
    },
  },
  {
    tag: "Para inversión",
    match: (raw) => {
      const text =
        `${raw.titleEn ?? ""} ${raw.titleEs ?? ""} ${raw.publicRemarksEn ?? ""} ${raw.publicRemarksEs ?? ""}`.toLowerCase();
      return (
        text.includes("investment") ||
        text.includes("inversión") ||
        text.includes("inversion") ||
        text.includes("income producing") ||
        text.includes("rentabilidad") ||
        text.includes("rental income") ||
        text.includes("roi") ||
        text.includes("commercial")
      );
    },
  },
  {
    tag: "Retiro",
    match: (raw) => {
      const text = `${raw.publicRemarksEn ?? ""} ${raw.publicRemarksEs ?? ""}`.toLowerCase();
      return text.includes("retire") || text.includes("retiro");
    },
  },
];
