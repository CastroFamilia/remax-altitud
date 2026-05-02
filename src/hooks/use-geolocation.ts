"use client";

import { useState, useCallback } from "react";
import { OFFICE_PZ_COORDS } from "@/lib/constants/offices-geo";

export type GeolocationStatus = "idle" | "loading" | "success" | "denied" | "error";

/** Identifies WHY a fallback was triggered so consumers can localize messaging. */
export type GeolocationFallbackReason = "denied" | "error" | "unsupported";

export interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; lng: number } | null;
  /** Set when denied/unsupported/error — nearest office coordinates as fallback */
  fallbackCoords: { lat: number; lng: number } | null;
  /** Reason for fallback — consumers map this to a localized user-facing message */
  fallbackReason: GeolocationFallbackReason | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: "idle",
    coords: null,
    fallbackCoords: null,
    fallbackReason: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Browser doesn't support geolocation — fall back to office
      setState({
        status: "error",
        coords: null,
        fallbackCoords: OFFICE_PZ_COORDS,
        fallbackReason: "unsupported",
      });
      return;
    }

    setState((prev) => ({ ...prev, status: "loading" }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "success",
          coords: { lat: position.coords.latitude, lng: position.coords.longitude },
          fallbackCoords: null,
          fallbackReason: null,
        });
      },
      (error: GeolocationPositionError) => {
        // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=UNAVAILABLE, 3=TIMEOUT
        const isDenied = error.code === 1; // GeolocationPositionError.PERMISSION_DENIED
        setState({
          status: isDenied ? "denied" : "error",
          coords: null,
          fallbackCoords: OFFICE_PZ_COORDS,
          fallbackReason: isDenied ? "denied" : "error",
        });
      },
      {
        enableHighAccuracy: false, // Battery-friendly for mobile
        timeout: 10000,
        maximumAge: 300000, // Accept 5min-old cache
      },
    );
  }, []);

  return { ...state, requestLocation };
}
