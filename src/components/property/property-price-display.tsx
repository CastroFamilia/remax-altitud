"use client";

import { useLocaleCurrency } from "@/hooks/use-locale-currency";
import { formatUSD, formatEUR, isNonUSLocale } from "@/lib/utils/currency";

interface PropertyPriceDisplayProps {
  priceUsd: number;
  originalCurrency?: string | null;
  originalPriceColones?: number | null;
  locale: string;
  variant?: "card" | "detail" | "simple";
  className?: string;
}

export function PropertyPriceDisplay({
  priceUsd,
  originalCurrency,
  originalPriceColones,
  locale,
  variant = "card",
  className,
}: PropertyPriceDisplayProps) {
  const { currency, formatPrice } = useLocaleCurrency(locale);

  const primaryPrice = formatPrice(priceUsd, originalPriceColones);
  const isCrcOriginal =
    originalCurrency === "CRC" && originalPriceColones != null && originalPriceColones > 0;

  // Render simple variant
  if (variant === "simple") {
    return <span className={className}>{primaryPrice}</span>;
  }

  // Render detail page variant
  if (variant === "detail") {
    return (
      <div className={className}>
        <p className="mt-1 text-lg md:text-xl font-bold text-brand-navy flex flex-wrap items-baseline gap-1.5">
          <span>{primaryPrice}</span>

          {/* If the active currency is CRC, show approximate USD conversion */}
          {currency === "CRC" && (
            <span className="text-xs font-semibold text-text-muted">
              (≈ {formatUSD(priceUsd, locale)})
            </span>
          )}

          {/* If the active currency is EUR, show approximate USD conversion */}
          {currency === "EUR" && (
            <span className="text-xs font-semibold text-text-muted">
              (≈ {formatUSD(priceUsd, locale)})
            </span>
          )}

          {/* If the active currency is USD, show original Colones if CRC original */}
          {currency === "USD" && isCrcOriginal && (
            <span className="text-xs font-semibold text-text-muted">
              (₡{originalPriceColones!.toLocaleString("es-CR")})
            </span>
          )}
        </p>

        {/* Auxiliary EUR conversion if active is USD and locale is non-US */}
        {currency === "USD" && isNonUSLocale(locale) && (
          <p data-testid="property-price-eur" className="text-xs text-text-muted mt-0.5">
            ≈ {formatEUR(priceUsd, locale)}
          </p>
        )}
      </div>
    );
  }

  // Render card variant (default)
  return (
    <div className={className}>
      <p
        data-testid="property-price"
        className="font-bold text-xl text-[--color-accent] flex flex-wrap items-baseline gap-1.5"
      >
        <span>{primaryPrice}</span>

        {/* If the active currency is CRC, show approximate USD conversion */}
        {currency === "CRC" && (
          <span className="text-xs font-semibold text-muted-foreground">
            (≈ {formatUSD(priceUsd, locale)})
          </span>
        )}

        {/* If the active currency is EUR, show approximate USD conversion */}
        {currency === "EUR" && (
          <span className="text-xs font-semibold text-muted-foreground">
            (≈ {formatUSD(priceUsd, locale)})
          </span>
        )}

        {/* If the active currency is USD and property is originally in CRC, show Colones */}
        {currency === "USD" && isCrcOriginal && (
          <span className="text-xs font-semibold text-muted-foreground">
            (₡{originalPriceColones!.toLocaleString("es-CR")})
          </span>
        )}
      </p>

      {/* Auxiliary EUR conversion if active is USD and locale is non-US */}
      {currency === "USD" && isNonUSLocale(locale) && (
        <p data-testid="property-price-eur" className="text-xs text-muted-foreground">
          ≈ {formatEUR(priceUsd, locale)}
        </p>
      )}
    </div>
  );
}
