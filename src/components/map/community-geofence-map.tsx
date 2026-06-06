"use client";

import { useState } from "react";
import { Map as MapboxMap, Source, Layer, Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, MAP_STYLE } from "@/lib/map/config";

interface CommunityGeoFenceMapProps {
  polygonPoints: [number, number][];
  onChange: (points: [number, number][]) => void;
  centerLat?: number | null;
  centerLng?: number | null;
}

export function CommunityGeoFenceMap({
  polygonPoints,
  onChange,
  centerLat,
  centerLng,
}: CommunityGeoFenceMapProps) {
  const [viewport, setViewport] = useState({
    latitude: centerLat ?? DEFAULT_MAP_CENTER.lat,
    longitude: centerLng ?? DEFAULT_MAP_CENTER.lng,
    zoom: centerLat && centerLng ? 13 : DEFAULT_MAP_ZOOM,
  });
  const [mapStyle, setMapStyle] = useState<string>(MAP_STYLE);

  const handleMapClick = (evt: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = evt.lngLat;
    onChange([...polygonPoints, [lng, lat]]);
  };

  const geojson = {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        polygonPoints.length > 2 ? [...polygonPoints, polygonPoints[0]] : polygonPoints,
      ],
    },
    properties: {},
  };

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <MapboxMap
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Render markers for each point */}
        {polygonPoints.map((pt, idx) => (
          <Marker key={idx} longitude={pt[0]} latitude={pt[1]}>
            <div className="w-3 h-3 bg-red-600 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg cursor-pointer" />
          </Marker>
        ))}

        {/* Render polygon overlay */}
        {polygonPoints.length > 0 && (
          <Source id="polygon-source" type="geojson" data={geojson}>
            <Layer
              id="polygon-layer"
              type="fill"
              paint={{
                "fill-color": "#ef4444",
                "fill-opacity": 0.2,
              }}
            />
            <Layer
              id="polygon-outline"
              type="line"
              paint={{
                "line-color": "#ef4444",
                "line-width": 2,
              }}
            />
          </Source>
        )}
      </MapboxMap>

      {/* Control overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 font-semibold shadow-lg">
          Click on map to add boundary points
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapStyle((prev) =>
              prev === MAP_STYLE ? "mapbox://styles/mapbox/satellite-streets-v12" : MAP_STYLE,
            );
          }}
          className="bg-slate-900/90 border border-slate-800 hover:bg-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 hover:text-white font-semibold shadow-lg transition-colors self-start cursor-pointer"
        >
          {mapStyle === MAP_STYLE ? "Switch to Satellite" : "Switch to Default"}
        </button>
      </div>
    </div>
  );
}
