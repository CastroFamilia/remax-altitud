"use client";

/**
 * LocationPicker — Story 5.1 (AC #3, #4)
 *
 * Text field renders immediately (SSR-safe).
 * Map loads progressively after mount via useEffect (2s delay).
 * If map fails to load, component remains functional text-only.
 *
 * Shared with Story 5.2 (CMA request form).
 *
 * data-testid="location-text-input" — text input (AC #4 contract)
 * data-testid="location-map" — map container (AC #4 contract)
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { MapViewLoader } from "@/components/map/map-view-loader";

export interface LocationValue {
  text: string;
  lat: number | null;
  lng: number | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  locale: string;
  placeholder?: string;
  /** Optional id forwarded to the text input — allows parent to attach a `<label htmlFor>`. */
  inputId?: string;
  /** Optional aria-describedby id for error messaging. */
  describedBy?: string;
  /** When true, sets aria-invalid on the text input. */
  invalid?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  locale: _locale, // eslint-disable-line @typescript-eslint/no-unused-vars
  placeholder,
  inputId,
  describedBy,
  invalid,
}: LocationPickerProps) {
  const t = useTranslations("SellerPage");
  const [showMap, setShowMap] = useState(false);

  // Progressive map load — delay 2s after mount (UX-DR12 pattern)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, text: e.target.value });
    },
    [value, onChange],
  );

  const handleMapClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      onChange({ ...value, lat: coords.lat, lng: coords.lng });
    },
    [value, onChange],
  );

  const resolvedPlaceholder = placeholder ?? t("form.step1.locationPlaceholder");

  return (
    <div className="space-y-3">
      {/* Text input — renders immediately, SSR-safe */}
      <input
        id={inputId}
        type="text"
        data-testid="location-text-input"
        value={value.text}
        onChange={handleTextChange}
        placeholder={resolvedPlaceholder}
        aria-label={t("form.step1.locationAriaLabel")}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
      />

      {/* Progressive map — loads after 2s */}
      {showMap && MapViewLoader ? (
        <MapViewLoader
          lat={value.lat}
          lng={value.lng}
          onMapClick={handleMapClick}
          data-testid="location-map"
          className="h-64 w-full rounded-lg overflow-hidden"
        />
      ) : (
        /* Map loading skeleton / fallback */
        <div
          data-testid="location-map"
          className="h-64 w-full rounded-lg bg-gray-100 flex items-center justify-center text-xs text-text-muted"
          aria-label={t("form.step1.locationMapAriaLabel")}
        >
          {!showMap ? (
            <span className="animate-pulse">{t("form.step1.locationMapFallbackNote")}</span>
          ) : (
            <span>{t("form.step1.locationMapFallbackNote")}</span>
          )}
        </div>
      )}
    </div>
  );
}
