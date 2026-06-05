"use client";

/**
 * PinDropMap — Story 5.1: LocationPicker map component.
 *
 * A lightweight Mapbox pin-drop map for the seller form location field.
 * Shares the same Mapbox GL JS bundle as MapView (already lazy-loaded).
 *
 * NOT for direct import — always use MapViewLoader from map-view-loader.tsx.
 */

import { useState, useCallback } from "react";
import { Map as MapboxMap, Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAPBOX_TOKEN, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_STYLE } from "@/lib/map/config";

interface PinDropMapProps {
  /** Current pin position — null if not yet placed */
  lat: number | null;
  lng: number | null;
  /** Called when user drops a pin */
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  "data-testid"?: string;
  className?: string;
  readOnly?: boolean;
}

export function PinDropMap({
  lat,
  lng,
  onMapClick,
  "data-testid": testId = "location-map",
  className = "h-64 w-full rounded-lg",
  readOnly = false,
}: PinDropMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleClick = useCallback(
    (evt: { lngLat: { lat: number; lng: number } }) => {
      if (readOnly) return;
      onMapClick?.({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
    },
    [onMapClick, readOnly],
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div
        data-testid={testId}
        className={`${className} bg-slate-100 flex items-center justify-center border border-dashed border-slate-300`}
      >
        <div className="text-center p-4">
          <p className="text-sm font-semibold text-slate-500 mb-1">Interactive Map Disabled</p>
          <p className="text-xs text-slate-400">Mapbox access token is required.</p>
        </div>
      </div>
    );
  }

  const validLat = typeof lat === "number" && !Number.isNaN(lat) ? lat : DEFAULT_MAP_CENTER.lat;
  const validLng = typeof lng === "number" && !Number.isNaN(lng) ? lng : DEFAULT_MAP_CENTER.lng;

  return (
    <div data-testid={testId} className={className}>
      <MapboxMap
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: validLat,
          longitude: validLng,
          zoom: DEFAULT_MAP_ZOOM,
        }}
        mapStyle={MAP_STYLE}
        onClick={readOnly ? undefined : handleClick}
        onLoad={() => setMapLoaded(true)}
        style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
        cursor={readOnly ? "grab" : "crosshair"}
      >
        <NavigationControl position="bottom-right" showCompass={false} />
        {mapLoaded && lat !== null && lng !== null && <Marker latitude={lat} longitude={lng} />}
      </MapboxMap>
    </div>
  );
}
