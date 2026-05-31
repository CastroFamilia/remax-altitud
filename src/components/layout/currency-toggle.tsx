"use client";

import { useLocaleCurrency } from "@/hooks/use-locale-currency";
import type { CurrencyCode } from "@/store/currency-store";

interface CurrencyToggleProps {
  variant?: "light" | "dark" | "header";
}

export function CurrencyToggle({ variant = "header" }: CurrencyToggleProps) {
  const { currency, setCurrency } = useLocaleCurrency();

  const baseClasses =
    variant === "dark"
      ? "text-text-on-dark"
      : variant === "header"
        ? "text-text-on-dark"
        : "text-text-primary";

  const currencies: CurrencyCode[] = ["USD", "EUR", "CRC"];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs md:text-sm ${baseClasses}`}
      role="group"
      aria-label="Select currency"
    >
      {currencies.map((code, index) => {
        const isActive = code === currency;
        return (
          <span key={code} className="flex items-center gap-1.5">
            <button
              type="button"
              className={
                isActive
                  ? "font-bold text-brand-gold underline"
                  : "opacity-70 transition-opacity duration-[var(--duration-fast)] hover:opacity-100 hover:text-white"
              }
              aria-current={isActive ? "true" : undefined}
              aria-label={code}
              onClick={() => setCurrency(code)}
            >
              {code}
            </button>
            {index < currencies.length - 1 && (
              <span aria-hidden="true" className="opacity-30">
                |
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
