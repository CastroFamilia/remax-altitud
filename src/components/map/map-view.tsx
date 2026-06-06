"use client";

/**
 * Story 3.2: MapView — Mapbox interactive map component.
 *
 * Renders a Mapbox GL map with 3D terrain, property pins, and clustering.
 * Lazy-loaded via MapViewLoader (next/dynamic, ssr: false) — do NOT import directly.
 *
 * @see _bmad-output/implementation-artifacts/3-2-interactive-map-with-property-pins.md Task 6
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Map as MapboxMap, Marker, NavigationControl } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import Supercluster from "supercluster";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAPBOX_TOKEN, MAP_STYLE, MAX_BOUNDS } from "@/lib/map/config";
import { boundsFromMapboxEvent } from "@/lib/map/geo-utils";
import { useMapStore } from "@/store/map-store";
import { MapClusterPin } from "@/components/map/map-cluster-pin";
import { MapPricePin } from "@/components/map/map-price-pin";
import { MapPropertyPopup } from "@/components/map/map-property-popup";
import type { OptimizedImage } from "@/types/images";
import type { UnitSystem } from "@/lib/utils/units";

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
  constructionM2?: number | null;
  zmtStatus: string;
  propertyType?: string;
  listingType?: string;
  currency?: string | null;
  apiRaw?: unknown;
  images: OptimizedImage[];
  latitude: number;
  longitude: number;
};

interface MapViewProps {
  properties: MapProperty[];
  locale: string;
  onBoundsChange?: (bounds: MapBounds) => void;
  /** Story 3.8: When set, map flies to these coordinates with given zoom */
  flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
  /** When set, map fits exactly to this bounding box [[west, south], [east, north]] */
  fitBoundsTarget?: [[number, number], [number, number]] | null;
  /** Unit system preference for area display in popups */
  unitSystem?: UnitSystem;
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

export function MapView({
  properties,
  locale,
  onBoundsChange,
  flyToTarget,
  fitBoundsTarget,
  unitSystem,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const { center, zoom, setCenter, setZoom, setBounds } = useMapStore();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentBounds, setCurrentBounds] =
    useState<[number, number, number, number]>(INITIAL_BBOX);

  // Convert properties to GeoJSON points for Supercluster
  const points = useMemo<GeoJSON.Feature<GeoJSON.Point, { cluster: false; propertyId: string }>[]>(
    () =>
      properties
        .filter(
          (p) =>
            typeof p.latitude === "number" &&
            typeof p.longitude === "number" &&
            !Number.isNaN(p.latitude) &&
            !Number.isNaN(p.longitude),
        )
        .map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.longitude as number, p.latitude as number] },
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
    (event: { target: import("mapbox-gl").Map }) => {
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

  // Story 3.8: Fly to target when flyToTarget prop changes (Near Me feature)
  useEffect(() => {
    if (flyToTarget && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyToTarget.lng, flyToTarget.lat],
        zoom: flyToTarget.zoom ?? 13,
        duration: 800, // 800ms per UX spec §Animation (Map fly-to = 800ms ease-in-out)
      });
    }
  }, [flyToTarget]);

  // Fit bounds when fitBoundsTarget changes (Auto-pan to search results)
  useEffect(() => {
    if (fitBoundsTarget && mapRef.current) {
      mapRef.current.fitBounds(fitBoundsTarget, { padding: 50, duration: 800 });
    }
  }, [fitBoundsTarget]);

  // Resize the Mapbox canvas when the container element changes size
  // (e.g. switching between split 35% and full-map 100% views).
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    // ResizeObserver is available in all modern browsers but not in jsdom (test env)
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      // Defer resize to next frame so Mapbox reads the final container size
      requestAnimationFrame(() => {
        mapRef.current?.resize();
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 rounded-xl shadow-inner">
        <div className="text-center p-6 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 text-slate-400 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-700">Map Disabled</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Please configure{" "}
            <code className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-xs">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            in your environment variables to enable the interactive map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
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
        maxBounds={MAX_BOUNDS as [[number, number], [number, number]]}
        terrain={{ source: "mapbox-dem", exaggeration: 1.2 }}
        onLoad={handleMapLoad}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={(e) => {
          // Only close the popup when clicking on the map background,
          // not when clicking on a marker (pin) or the popup card itself.
          const target = e.originalEvent?.target as HTMLElement | null;
          if (target?.closest?.(".mapboxgl-marker, .mapboxgl-popup")) return;
          setSelectedPropertyId(null);
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

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
            unitSystem={unitSystem}
          />
        )}
      </MapboxMap>
    </div>
  );
}
