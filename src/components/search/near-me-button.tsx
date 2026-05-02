"use client";

import { useEffect } from "react";
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
  const { status, coords, fallbackCoords, fallbackMessage, requestLocation } = useGeolocation();

  useEffect(() => {
    if (status === "success" && coords) {
      onLocationSuccess(coords);
    } else if ((status === "denied" || status === "error") && fallbackCoords) {
      onLocationFallback(fallbackCoords, fallbackMessage ?? "Location unavailable");
    }
  }, [status, coords, fallbackCoords, fallbackMessage, onLocationSuccess, onLocationFallback]);

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
