"use client";

/**
 * PropertySpecsSummary — Client Component
 *
 * Displays the property specs summary grid (price, beds, baths, lot size, built area)
 * with unit-system-aware area conversion. Extracted from the Server Component
 * ListingDetailLayout so it can read the user's localStorage unit preference
 * via the useLocaleUnits hook.
 */

import { useTranslations } from "next-intl";
import { useLocaleUnits } from "@/hooks/use-locale-units";

interface PropertySpecsSummaryProps {
  priceUsd: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  constructionM2: number | null;
  locale: string;
  currency?: string;
  originalPriceColones?: number | null;
}

export function PropertySpecsSummary({
  priceUsd,
  bedrooms,
  bathrooms,
  lotSizeM2,
  constructionM2,
  locale,
  currency,
  originalPriceColones,
}: PropertySpecsSummaryProps) {
  const t = useTranslations("ListingDetail");
  const { unitSystem, convertArea } = useLocaleUnits(locale);

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border p-6 md:grid-cols-4">
      {priceUsd != null && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("specs.price")}
          </p>
          <p className="mt-1 text-lg font-bold text-brand-navy">
            ${priceUsd.toLocaleString("en-US")}
            {currency === "CRC" && originalPriceColones != null && (
              <span className="ml-2 text-sm font-medium text-text-muted">
                (₡{originalPriceColones.toLocaleString("es-CR")})
              </span>
            )}
          </p>
        </div>
      )}
      {bedrooms != null && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("specs.bedrooms", { count: bedrooms })}
          </p>
          <p className="mt-1 text-lg font-bold text-brand-navy">{bedrooms}</p>
        </div>
      )}
      {bathrooms != null && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("specs.bathrooms", { count: bathrooms })}
          </p>
          <p className="mt-1 text-lg font-bold text-brand-navy">{bathrooms}</p>
        </div>
      )}
      {lotSizeM2 != null && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("specs.lotSize")}
          </p>
          <p className="mt-1 text-lg font-bold text-brand-navy">
            {convertArea(lotSizeM2, unitSystem, locale, true)}
          </p>
        </div>
      )}
      {constructionM2 != null && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("specs.builtArea")}
          </p>
          <p className="mt-1 text-lg font-bold text-brand-navy">
            {convertArea(constructionM2, unitSystem, locale, false)}
          </p>
        </div>
      )}
    </div>
  );
}
