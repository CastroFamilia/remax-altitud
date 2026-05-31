"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useCurrencyStore, type CurrencyCode } from "@/store/currency-store";
import { formatUSD, formatEUR, formatCRC, getCrcToUsdRate } from "@/lib/utils/currency";

export function useLocaleCurrency() {
  const locale = useLocale();
  const { currency, setCurrency, isHydrated, setHydrated } = useCurrencyStore();

  useEffect(() => {
    if (!isHydrated) {
      try {
        const stored = window.localStorage.getItem("currency-preference") as CurrencyCode | null;
        if (stored === "USD" || stored === "EUR" || stored === "CRC") {
          setCurrency(stored);
        }
      } catch {
        // ignore storage availability errors
      }
      setHydrated(true);
    }
  }, [isHydrated, setCurrency, setHydrated]);

  // If not hydrated yet, default to USD to avoid hydration mismatches
  const activeCurrency = isHydrated ? currency : "USD";

  const formatPrice = (priceUsd: number, originalPriceColones?: number | null): string => {
    if (activeCurrency === "EUR") {
      return formatEUR(priceUsd, locale);
    }
    if (activeCurrency === "CRC") {
      if (originalPriceColones != null && originalPriceColones > 0) {
        return formatCRC(originalPriceColones, locale);
      }
      const crcPrice = Math.round(priceUsd * getCrcToUsdRate());
      return formatCRC(crcPrice, locale);
    }
    // Default USD
    return formatUSD(priceUsd, locale);
  };

  return {
    currency: activeCurrency,
    setCurrency,
    formatPrice,
    locale,
  } as const;
}
