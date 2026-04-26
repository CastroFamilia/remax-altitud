"use client";

/**
 * Story 3.2: MapView — Mapbox interactive map component.
 *
 * Renders a Mapbox GL map with 3D terrain, property pins, and clustering.
 * Lazy-loaded via MapViewLoader (next/dynamic, ssr: false) — do NOT import directly.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 6
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { Map as MapboxMap, Marker } from "react-map-gl";
import Supercluster from "supercluster";
import type { MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAPBOX_TOKEN, MAP_STYLE, MAX_BOUNDS } from "@/lib/map/config";
import { boundsFromMapboxEvent } from "@/lib/map/geo-utils";
import { useMapStore } from "@/store/map-store";
import { MapClusterPin } from "@/components/map/map-cluster-pin";
import { MapPricePin } from "@/components/map/map-price-pin";
import { MapPropertyPopup } from "@/components/map/map-property-popup";

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapProperty = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  zmtStatus: string;
  images: { url: string; alt?: string }[];
  latitude: number;
  longitude: number;
};

interface MapViewProps {
  properties: MapProperty[];
  locale: string;
  onBoundsChange?: (bounds: MapBounds) => void;
}

type ClusterFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: number | string;
  }
>;

type PointFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    cluster: false;
    propertyId: string;
  }
>;

// Stable world bbox for initial cluster rendering before map bounds are known
const INITIAL_BBOX: [number, number, number, number] = [-180, -85, 180, 85];

export function MapView({ properties, locale, onBoundsChange }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const { center, zoom, setCenter, setZoom, setBounds } = useMapStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentBounds, setCurrentBounds] =
    useState<[number, number, number, number]>(INITIAL_BBOX);

  // Convert properties to GeoJSON points for Supercluster
  const points = useMemo<GeoJSON.Feature<GeoJSON.Point, { cluster: false; propertyId: string }>[]>(
    () =>
      properties.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
        properties: { cluster: false, propertyId: p.id },
      })),
    [properties],
  );

  // Build Supercluster index
  const supercluster = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 16 });
    sc.load(points);
    return sc;
  }, [points]);

  // Compute clusters from current bounds + zoom
  const clusters = useMemo(
    () => supercluster.getClusters(currentBounds, Math.floor(currentZoom)),
    [supercluster, currentBounds, currentZoom],
  );

  // Build property lookup map
  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  const selectedProperty = selectedPropertyId
    ? (propertyById.get(selectedPropertyId) ?? null)
    : null;

  const handleMapLoad = useCallback(
    (event: { target: mapboxgl.Map }) => {
      const map = event.target;

      // Add Mapbox DEM terrain source for 3D terrain
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });

      // Extract initial bounds and notify — use a ref-based check to avoid
      // calling setState synchronously in the same render cycle (prevents
      // infinite update loops in jsdom test environment where onLoad fires
      // synchronously during the mocked Map render).
      const bounds = map.getBounds();
      if (bounds) {
        const mapBounds: MapBounds = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        };
        setBounds(mapBounds);
        onBoundsChange?.(mapBounds);
        // Update local bounds for clustering (schedule after paint to avoid
        // synchronous re-render during mount)
        Promise.resolve().then(() => {
          setCurrentBounds([
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ]);
        });
      }
    },
    [setBounds, onBoundsChange],
  );

  // onMove fires continuously during drag/zoom — keep this cheap.
  // Update Zustand viewport state and recompute clusters locally, but DO NOT
  // trigger the property re-fetch here. That work is deferred to onMoveEnd
  // so we don't fire a Server Action on every animation frame.
  const handleMove = useCallback(
    (event: Parameters<typeof boundsFromMapboxEvent>[0]) => {
      const vs = event.viewState;
      setCenter({ lng: vs.longitude, lat: vs.latitude });
      setZoom(vs.zoom);
      setCurrentZoom(vs.zoom);

      try {
        const bounds = boundsFromMapboxEvent(event);
        setCurrentBounds([bounds.west, bounds.south, bounds.east, bounds.north]);
        setBounds(bounds);
      } catch {
        // boundsFromMapboxEvent throws if getBounds() returns null (rare —
        // can happen briefly during initial style load). Swallow silently;
        // the next move event will retry.
      }
    },
    [setCenter, setZoom, setBounds],
  );

  // onMoveEnd fires once after the user stops interacting — this is where we
  // notify the parent (which re-queries the database for the new viewport).
  const handleMoveEnd = useCallback(
    (event: Parameters<typeof boundsFromMapboxEvent>[0]) => {
      try {
        const bounds = boundsFromMapboxEvent(event);
        onBoundsChange?.(bounds);
      } catch {
        // Same rationale as handleMove — bounds may briefly be unavailable.
      }
    },
    [onBoundsChange],
  );

  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 20);
      mapRef.current?.flyTo({ center: [lng, lat], zoom: expansionZoom });
    },
    [supercluster],
  );

  return (
    <div
      data-testid="map-container"
      aria-label="Property locations map"
      className="h-full w-full relative"
    >
      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom,
        }}
        maxBounds={MAX_BOUNDS}
        terrain={{ source: "mapbox-dem", exaggeration: 1.2 }}
        onLoad={handleMapLoad}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
      >
        {/* Render clusters and individual pins */}
        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;

          if ((feature as ClusterFeature).properties.cluster) {
            const clusterFeature = feature as ClusterFeature;
            const { cluster_id, point_count } = clusterFeature.properties;

            return (
              <Marker key={`cluster-${cluster_id}`} longitude={lng} latitude={lat} anchor="center">
                <MapClusterPin
                  count={point_count}
                  onClick={() => handleClusterClick(cluster_id, lng, lat)}
                />
              </Marker>
            );
          }

          const pointFeature = feature as PointFeature;
          const { propertyId } = pointFeature.properties;
          const property = propertyById.get(propertyId);
          if (!property) return null;

          return (
            <Marker key={`pin-${propertyId}`} longitude={lng} latitude={lat} anchor="bottom">
              <MapPricePin
                price={property.priceUsd}
                isSelected={selectedPropertyId === propertyId}
                onClick={() =>
                  setSelectedPropertyId((prev) => (prev === propertyId ? null : propertyId))
                }
              />
            </Marker>
          );
        })}

        {/* Property popup shown on pin click */}
        {selectedProperty && (
          <MapPropertyPopup
            property={selectedProperty}
            locale={locale}
            onClose={() => setSelectedPropertyId(null)}
          />
        )}
      </MapboxMap>
    </div>
  );
}
