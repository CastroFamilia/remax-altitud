"use client";

/**
 * StickySpecsBar — Client Component
 *
 * Sticky price + specs bar shown below the gallery. Becomes sticky on scroll
 * (CSS sticky top-0). Shows price, beds/baths, lot + built area (with unit toggle),
 * and ZMT status badge.
 *
 * Story 4.1, Task 5
 * AC #6
 */

import { useTranslations } from "next-intl";
import { useLocaleUnits } from "@/hooks/use-locale-units";
import { formatUSD } from "@/lib/utils/currency";
import { UnitToggle } from "@/components/layout/unit-toggle";

interface StickySpecsBarProps {
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  constructionM2: number | null;
  zmtStatus: string;
  locale: string;
  currency?: string;
  originalPriceColones?: number | null;
}

// ZMT badge visual config
const ZMT_VISUAL: Record<string, { classes: string; icon: string }> = {
  titled: {
    classes: "bg-green-100 text-green-800",
    icon: "✓",
  },
  concession: {
    classes: "bg-amber-100 text-amber-800",
    icon: "◑",
  },
  zmt_restricted: {
    classes: "bg-red-100 text-red-800",
    icon: "⚠",
  },
};

export function StickySpecsBar({
  priceUsd,
  bedrooms,
  bathrooms,
  lotSizeM2,
  constructionM2,
  zmtStatus,
  locale,
  currency,
  originalPriceColones,
}: StickySpecsBarProps) {
  const t = useTranslations("StickySpecsBar");
  const { unitSystem, convertArea } = useLocaleUnits(locale);
  const zmtVisual = ZMT_VISUAL[zmtStatus];

  return (
    <div
      data-testid="sticky-specs-bar"
      className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-4">
        {/* Price */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-gray-500 uppercase tracking-wide">{t("price")}</span>
          <span className="text-xl font-bold text-brand-navy">
            {formatUSD(priceUsd, locale)}
            {currency === "CRC" && originalPriceColones != null && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                (₡{originalPriceColones.toLocaleString("es-CR")})
              </span>
            )}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-gray-200" aria-hidden="true" />

        {/* Beds */}
        {bedrooms !== null && (
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <span>🛏</span>
            <span>{t("beds", { count: bedrooms })}</span>
          </div>
        )}

        {/* Baths */}
        {bathrooms !== null && (
          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
            <span>🚿</span>
            <span>{t("baths", { count: bathrooms })}</span>
          </div>
        )}

        {/* Lot size */}
        {lotSizeM2 !== null && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-500 uppercase tracking-wide">{t("lot")}</span>
            <span className="text-sm font-medium text-gray-700">
              {convertArea(lotSizeM2, unitSystem, locale, true)}
            </span>
          </div>
        )}

        {/* Built area */}
        {constructionM2 !== null && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-500 uppercase tracking-wide">{t("built")}</span>
            <span className="text-sm font-medium text-gray-700">
              {convertArea(constructionM2, unitSystem, locale, false)}
            </span>
          </div>
        )}

        {/* Unit toggle */}
        <UnitToggle locale={locale} aria-label={t("toggleUnits")} />

        {/* ZMT status badge */}
        {zmtVisual && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${zmtVisual.classes}`}
          >
            <span aria-hidden="true">{zmtVisual.icon}</span>
            {t(`zmtStatus.${zmtStatus}` as Parameters<typeof t>[0])}
          </span>
        )}
      </div>
    </div>
  );
}

export default StickySpecsBar;
