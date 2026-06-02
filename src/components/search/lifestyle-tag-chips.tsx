"use client";

/**
 * Story 3.4: Lifestyle Tags & Smart Presets
 * Component: LifestyleTagChips
 *
 * Renders a horizontal scrollable row of lifestyle tag chips.
 * Each chip toggles an active state and calls onToggle with the tag value.
 *
 * Architecture:
 * - Imports LIFESTYLE_TAGS from @/lib/constants/lifestyle-tags (single source of truth)
 * - Uses TAG_DISPLAY_LABELS to map stored values to display labels
 *   ("Retire" → "Retirement Paradise")
 * - Active chip: bg-brand-blue text-white
 * - Inactive chip: border border-border bg-background text-foreground hover:bg-accent
 * - Each chip: data-testid={`lifestyle-tag-chip-${tag.toLowerCase().replace(/\s+/g, '-')}`}
 * - Container: data-testid="lifestyle-tag-chips"
 * - Min-height 44px (UX-DR7 touch targets)
 */

import { useTranslations } from "next-intl";
import { LIFESTYLE_TAGS, tagDisplayLabel } from "@/lib/constants/lifestyle-tags";

/**
 * Property-type tags that should set the `type` filter (propertyType column)
 * instead of the `tags` filter (lifestyleTags array column).
 */
const PROPERTY_TYPE_TAGS = new Set(["Casa", "Lote", "Finca"]);

interface LifestyleTagChipsProps {
  activeTags: string[];
  onToggle: (tag: string) => void;
  /** Current active property type filter (from the type dropdown) */
  activeType?: string;
  /** Callback to toggle a property-type chip (sets the `type` filter) */
  onTypeToggle?: (type: string) => void;
}

export function LifestyleTagChips({
  activeTags,
  onToggle,
  activeType,
  onTypeToggle,
}: LifestyleTagChipsProps) {
  const t = useTranslations("SearchPage");

  /**
   * Resolve the visible label for a tag.
   * Try the locale-specific i18n key first; fall back to `tagDisplayLabel`
   * (which maps "Retire" → "Retirement Paradise") when the translation is
   * missing — i.e. when `t()` returns the key unchanged.
   */
  const chipLabel = (tag: string): string => {
    const i18nKey = `lifestyleTags.chips.${tag}`;
    const translated = t(i18nKey);
    const isMissing = translated === i18nKey || translated === `SearchPage.${i18nKey}`;
    return isMissing ? tagDisplayLabel(tag) : translated;
  };

  return (
    <div
      data-testid="lifestyle-tag-chips"
      className="flex gap-2 flex-wrap md:flex-nowrap overflow-x-auto"
    >
      {LIFESTYLE_TAGS.map((tag) => {
        const isPropertyType = PROPERTY_TYPE_TAGS.has(tag);
        const isActive = isPropertyType ? activeType === tag : activeTags.includes(tag);
        const slug = tag.toLowerCase().replace(/\s+/g, "-");

        const handleClick = () => {
          if (isPropertyType && onTypeToggle) {
            onTypeToggle(tag);
          } else {
            onToggle(tag);
          }
        };

        return (
          <button
            key={tag}
            type="button"
            data-testid={`lifestyle-tag-chip-${slug}`}
            onClick={handleClick}
            aria-pressed={isActive}
            className={[
              "h-8 px-3.5 rounded-full text-xs font-medium transition-all duration-200 border",
              isActive
                ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                : "border-border bg-background text-brand-navy/70 hover:bg-brand-gold/10 hover:border-brand-gold/40 hover:text-brand-navy",
            ].join(" ")}
          >
            {chipLabel(tag)}
          </button>
        );
      })}
    </div>
  );
}
