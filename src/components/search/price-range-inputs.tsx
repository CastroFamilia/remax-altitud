"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocaleCurrency } from "@/hooks/use-locale-currency";
import { getCrcToUsdRate, EUR_RATE } from "@/lib/utils/currency";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "radix-ui";

interface PriceRangeInputsProps {
  value: [number | undefined, number | undefined];
  onChange: (value: [number | undefined, number | undefined]) => void;
}

const USD_OPTIONS = [
  0, 50_000, 100_000, 250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000,
  5_000_000, 10_000_000,
];
const CRC_OPTIONS = [
  0, 25_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000, 750_000_000, 1_000_000_000,
  2_000_000_000, 5_000_000_000,
];

// Pseudo-random data for the histogram to make it look realistic (Zillow style)
const HISTOGRAM_BARS = [
  5, 10, 15, 25, 45, 80, 120, 150, 180, 220, 300, 380, 450, 390, 320, 260, 200, 150, 120, 90, 70,
  50, 40, 30, 25, 20, 18, 15, 12, 10, 9, 8, 7, 5, 4, 3, 2, 2, 1, 1,
];

export function PriceRangeInputs({ value, onChange }: PriceRangeInputsProps) {
  const t = useTranslations("SearchPage.filters");
  const { currency, formatPrice } = useLocaleCurrency();
  const [minValUsd, maxValUsd] = value;

  // Convert USD values to active currency for display
  const toLocalCurrency = useCallback(
    (usdVal: number | undefined): number | undefined => {
      if (usdVal === undefined || usdVal === null) return undefined;
      if (currency === "CRC") return Math.round(usdVal * getCrcToUsdRate());
      if (currency === "EUR") return Math.round(usdVal * EUR_RATE);
      return usdVal;
    },
    [currency],
  );

  const toUsd = useCallback(
    (localVal: number | undefined): number | undefined => {
      if (localVal === undefined || localVal === null) return undefined;
      if (currency === "CRC") return Math.round(localVal / getCrcToUsdRate());
      if (currency === "EUR") return Math.round(localVal / EUR_RATE);
      return localVal;
    },
    [currency],
  );

  // -- Slider Mapping Logic (Non-Linear) --
  // 0% - 50% slider maps to $0 - $1,000,000
  // 50% - 100% slider maps to $1,000,000 - $10,000,000
  const usdToSliderPercent = (usd: number | undefined): number => {
    if (usd === undefined) return 100; // max maps to right edge
    if (usd <= 0) return 0;
    if (usd <= 1_000_000) {
      return (usd / 1_000_000) * 50;
    }
    const percent = 50 + ((usd - 1_000_000) / 9_000_000) * 50;
    return Math.min(percent, 100);
  };

  const sliderPercentToUsd = (percent: number): number => {
    if (percent <= 0) return 0;
    if (percent >= 100) return 10_000_000;
    if (percent <= 50) {
      // 0-50% = 0-1M
      // Round to nearest 10k
      const raw = (percent / 50) * 1_000_000;
      return Math.round(raw / 10_000) * 10_000;
    } else {
      // 50-100% = 1M-10M
      // Round to nearest 50k
      const raw = 1_000_000 + ((percent - 50) / 50) * 9_000_000;
      return Math.round(raw / 50_000) * 50_000;
    }
  };

  // Slider local state (0-100 bounds)
  const [sliderVals, setSliderVals] = useState<[number, number]>([
    usdToSliderPercent(minValUsd ?? 0),
    usdToSliderPercent(maxValUsd),
  ]);

  // Sync slider state if external value changes (e.g. user cleared filters)
  useEffect(() => {
    setSliderVals([usdToSliderPercent(minValUsd ?? 0), usdToSliderPercent(maxValUsd)]);
  }, [minValUsd, maxValUsd]);

  // Text Inputs
  const [minInput, setMinInput] = useState<string>("");
  const [maxInput, setMaxInput] = useState<string>("");

  useEffect(() => {
    setMinInput(minValUsd !== undefined ? formatPrice(minValUsd).replace(/\.00$/, "") : "");
  }, [minValUsd, formatPrice]);

  useEffect(() => {
    setMaxInput(maxValUsd !== undefined ? formatPrice(maxValUsd).replace(/\.00$/, "") : "");
  }, [maxValUsd, formatPrice]);

  const options = useMemo(() => {
    return currency === "CRC" ? CRC_OPTIONS : USD_OPTIONS;
  }, [currency]);

  // Handlers for Slider
  const handleSliderValueChange = (newVals: number[]) => {
    setSliderVals([newVals[0], newVals[1]]);

    const draggingMinUsd = newVals[0] === 0 ? undefined : sliderPercentToUsd(newVals[0]);
    const draggingMaxUsd = newVals[1] >= 100 ? undefined : sliderPercentToUsd(newVals[1]);

    setMinInput(
      draggingMinUsd !== undefined ? formatPrice(draggingMinUsd).replace(/\.00$/, "") : "",
    );
    setMaxInput(
      draggingMaxUsd !== undefined ? formatPrice(draggingMaxUsd).replace(/\.00$/, "") : "",
    );
  };

  const handleSliderCommit = (newVals: number[]) => {
    const newMinUsd = newVals[0] === 0 ? undefined : sliderPercentToUsd(newVals[0]);
    const newMaxUsd = newVals[1] >= 100 ? undefined : sliderPercentToUsd(newVals[1]);

    // We only call onChange to update the URL/search when the user releases the slider
    onChange([newMinUsd, newMaxUsd]);
  };

  // Handlers for Text Inputs
  const handleMinBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const parsedLocal = raw ? parseInt(raw, 10) : undefined;

    let parsedUsd = toUsd(parsedLocal);

    if (parsedUsd !== undefined && maxValUsd !== undefined && parsedUsd > maxValUsd) {
      parsedUsd = maxValUsd;
    }

    if (parsedUsd !== minValUsd) {
      onChange([parsedUsd, maxValUsd]);
    } else {
      setMinInput(minValUsd !== undefined ? formatPrice(minValUsd).replace(/\.00$/, "") : "");
    }
  };

  const handleMaxBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const parsedLocal = raw ? parseInt(raw, 10) : undefined;

    let parsedUsd = toUsd(parsedLocal);

    if (parsedUsd !== undefined && minValUsd !== undefined && parsedUsd < minValUsd) {
      parsedUsd = minValUsd;
    }

    if (parsedUsd !== maxValUsd) {
      onChange([minValUsd, parsedUsd]);
    } else {
      setMaxInput(maxValUsd !== undefined ? formatPrice(maxValUsd).replace(/\.00$/, "") : "");
    }
  };

  const formatOptionLabel = (opt: number, isMin: boolean) => {
    if (opt === 0) return isMin ? t("noMin") : t("noMax");
    return formatPrice(toUsd(opt) || 0).replace(/\.00$/, "");
  };

  const selectMinOption = (val: number) => {
    const usd = val === 0 ? undefined : toUsd(val);
    let finalUsd = usd;
    if (usd !== undefined && maxValUsd !== undefined && usd > maxValUsd) {
      finalUsd = maxValUsd;
    }
    onChange([finalUsd, maxValUsd]);
    setMinDropdownOpen(false);
  };

  const selectMaxOption = (val: number) => {
    const usd = val === 0 ? undefined : toUsd(val);
    let finalUsd = usd;
    if (usd !== undefined && minValUsd !== undefined && usd < minValUsd) {
      finalUsd = minValUsd;
    }
    onChange([minValUsd, finalUsd]);
    setMaxDropdownOpen(false);
  };

  const [minDropdownOpen, setMinDropdownOpen] = useState(false);
  const [maxDropdownOpen, setMaxDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setMinDropdownOpen(false);
        setMaxDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col w-full gap-4 pt-4 pb-2" ref={wrapperRef}>
      {/* Histogram & Slider area */}
      <div className="w-full px-2 relative h-[80px]">
        {/* Histogram Bars */}
        <div className="absolute top-0 left-2 right-2 bottom-4 flex items-end justify-between gap-[2px] pointer-events-none">
          {HISTOGRAM_BARS.map((height, i) => {
            const barPercent = (i / (HISTOGRAM_BARS.length - 1)) * 100;
            const inRange = barPercent >= sliderVals[0] && barPercent <= sliderVals[1];

            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t-[1px] transition-colors duration-200",
                  inRange ? "bg-brand-blue/50" : "bg-muted/60",
                )}
                style={{ height: `${Math.max(2, (height / 450) * 100)}%` }}
              />
            );
          })}
        </div>

        {/* Radix Slider Overlay */}
        <Slider.Root
          className="absolute bottom-1.5 left-2 right-2 flex items-center select-none touch-none h-5"
          value={sliderVals}
          max={100}
          step={1}
          minStepsBetweenThumbs={0}
          onValueChange={handleSliderValueChange}
          onValueCommit={handleSliderCommit}
        >
          {/* We hide the visual track so the histogram sits naturally behind it */}
          <Slider.Track className="relative bg-transparent h-[2px] grow rounded-full">
            <Slider.Range className="absolute bg-brand-blue rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="relative block w-6 h-6 bg-brand-blue border-2 border-white shadow-md rounded-full focus:outline-none focus:ring-4 focus:ring-brand-blue/20 transition-shadow cursor-grab active:cursor-grabbing group"
            aria-label="Minimum price"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-navy text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {sliderVals[0] === 0
                ? t("noMin")
                : formatPrice(sliderPercentToUsd(sliderVals[0])).replace(/\.00$/, "")}
            </div>
          </Slider.Thumb>
          <Slider.Thumb
            className="relative block w-6 h-6 bg-brand-blue border-2 border-white shadow-md rounded-full focus:outline-none focus:ring-4 focus:ring-brand-blue/20 transition-shadow cursor-grab active:cursor-grabbing group"
            aria-label="Maximum price"
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-navy text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {sliderVals[1] >= 100
                ? t("noMax")
                : formatPrice(sliderPercentToUsd(sliderVals[1])).replace(/\.00$/, "")}
            </div>
          </Slider.Thumb>
        </Slider.Root>
      </div>

      {/* Text Inputs */}
      <div className="flex items-start gap-3 w-full px-1">
        {/* MIN COLUMN */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-xs font-medium text-muted-foreground">{t("minPrice")}</label>
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              value={minInput}
              onChange={(e) => {
                setMinInput(e.target.value);
              }}
              onFocus={() => {
                setMinDropdownOpen(true);
                setMaxDropdownOpen(false);
              }}
              onBlur={(e) => setTimeout(() => handleMinBlur(e), 150)}
              placeholder={t("noMin")}
              aria-label="Minimum price input"
            />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
          </div>

          {minDropdownOpen && (
            <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
              {options.map((opt) => (
                <button
                  key={`min-${opt}`}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                    toLocalCurrency(minValUsd) === opt &&
                      "bg-brand-blue/5 text-brand-navy font-medium",
                  )}
                  onClick={() => selectMinOption(opt)}
                  type="button"
                >
                  <span>{formatOptionLabel(opt, true)}</span>
                  {toLocalCurrency(minValUsd) === opt && (
                    <Check className="h-3 w-3 text-brand-blue" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-muted-foreground mt-7">–</div>

        {/* MAX COLUMN */}
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-xs font-medium text-muted-foreground">{t("maxPrice")}</label>
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              value={maxInput}
              onChange={(e) => {
                setMaxInput(e.target.value);
              }}
              onFocus={() => {
                setMaxDropdownOpen(true);
                setMinDropdownOpen(false);
              }}
              onBlur={(e) => setTimeout(() => handleMaxBlur(e), 150)}
              placeholder={t("noMax")}
              aria-label="Maximum price input"
            />
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
          </div>

          {maxDropdownOpen && (
            <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
              {options.map((opt) => (
                <button
                  key={`max-${opt}`}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors flex items-center justify-between",
                    toLocalCurrency(maxValUsd) === opt &&
                      "bg-brand-blue/5 text-brand-navy font-medium",
                  )}
                  onClick={() => selectMaxOption(opt)}
                  type="button"
                >
                  <span>{formatOptionLabel(opt, false)}</span>
                  {toLocalCurrency(maxValUsd) === opt && (
                    <Check className="h-3 w-3 text-brand-blue" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
