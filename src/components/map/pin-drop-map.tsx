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
import { Map as MapboxMap, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAPBOX_TOKEN, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_STYLE } from "@/lib/map/config";

interface PinDropMapProps {
  /** Current pin position — null if not yet placed */
  lat: number | null;
  lng: number | null;
  /** Called when user drops a pin */
  onMapClick: (coords: { lat: number; lng: number }) => void;
  "data-testid"?: string;
  className?: string;
}

export function PinDropMap({
  lat,
  lng,
  onMapClick,
  "data-testid": testId = "location-map",
  className = "h-64 w-full rounded-lg",
}: PinDropMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleClick = useCallback(
    (evt: { lngLat: { lat: number; lng: number } }) => {
      onMapClick({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
    },
    [onMapClick],
  );

  return (
    <div data-testid={testId} className={className}>
      <MapboxMap
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: lat ?? DEFAULT_MAP_CENTER.lat,
          longitude: lng ?? DEFAULT_MAP_CENTER.lng,
          zoom: DEFAULT_MAP_ZOOM,
        }}
        mapStyle={MAP_STYLE}
        onClick={handleClick}
        onLoad={() => setMapLoaded(true)}
        style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
        cursor="crosshair"
      >
        {mapLoaded && lat !== null && lng !== null && <Marker latitude={lat} longitude={lng} />}
      </MapboxMap>
    </div>
  );
}
