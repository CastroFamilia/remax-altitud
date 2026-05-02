"use client";

import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";

interface NearMeButtonProps {
  onLocationSuccess: (coords: { lat: number; lng: number }) => void;
  onLocationFallback: (coords: { lat: number; lng: number }, message: string) => void;
  className?: string;
}

export function NearMeButton({
  onLocationSuccess,
  onLocationFallback,
  className,
}: NearMeButtonProps) {
  const t = useTranslations("NearMe");
  const { status, coords, fallbackCoords, fallbackReason, requestLocation } = useGeolocation();

  // Hold the latest callbacks in refs so the status-watching effect does NOT
  // re-fire on every parent re-render when callers pass inline arrow functions.
  // Without this, every re-render of the parent (e.g. SplitViewLayout when
  // filters change) would re-invoke onLocationSuccess / onLocationFallback,
  // causing redundant flyTo operations and noisy fallback banners.
  const onLocationSuccessRef = useRef(onLocationSuccess);
  const onLocationFallbackRef = useRef(onLocationFallback);
  useEffect(() => {
    onLocationSuccessRef.current = onLocationSuccess;
    onLocationFallbackRef.current = onLocationFallback;
  });

  // Localized fallback message — derive from reason so the user sees the
  // message in their language (the hook itself stays i18n-agnostic).
  const fallbackMessage =
    fallbackReason === "denied"
      ? t("fallbackDenied")
      : fallbackReason === "unsupported"
        ? t("fallbackUnsupported")
        : fallbackReason === "error"
          ? t("fallbackError")
          : null;

  useEffect(() => {
    if (status === "success" && coords) {
      onLocationSuccessRef.current(coords);
    } else if ((status === "denied" || status === "error") && fallbackCoords) {
      onLocationFallbackRef.current(fallbackCoords, fallbackMessage ?? t("fallbackError"));
    }
    // Intentionally exclude callbacks from deps — they're held in refs above.
    // The effect should fire only when the geolocation state transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, coords, fallbackCoords, fallbackMessage]);

  return (
    <button
      type="button"
      data-testid="near-me-button"
      aria-label={t("label")}
      onClick={requestLocation}
      disabled={status === "loading"}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium",
        "hover:bg-muted transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <MapPin className="h-4 w-4" aria-hidden="true" />
      {status === "loading" ? t("loading") : t("label")}
    </button>
  );
}
