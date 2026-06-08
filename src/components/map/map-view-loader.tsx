"use client";

import { useState, useEffect, useRef, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import { MapView as MapViewOriginalComponent } from "./map-view";
import { PinDropMap as PinDropMapOriginalComponent } from "./pin-drop-map";

type MapViewProps = ComponentProps<typeof MapViewOriginalComponent>;
type PinDropMapProps = ComponentProps<typeof PinDropMapOriginalComponent>;

// Base dynamic components (loaded client-side only)
const MapViewBase = dynamic(() => import("./map-view").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div data-testid="map-container" className="h-full w-full bg-muted animate-pulse" />
  ),
});

const PinDropMapBase = dynamic(
  () => import("./pin-drop-map").then((m) => ({ default: m.PinDropMap })),
  {
    ssr: false,
    loading: () => (
      <div data-testid="location-map" className="h-64 w-full bg-muted rounded-lg animate-pulse" />
    ),
  },
);

// Lazy loaded MapView using IntersectionObserver
export function MapView(props: MapViewProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // Load 200px before entering viewport
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      {inView ? (
        <MapViewBase {...props} />
      ) : (
        <div data-testid="map-container" className="h-full w-full bg-muted animate-pulse" />
      )}
    </div>
  );
}

// Lazy loaded MapViewLoader (PinDropMap) using IntersectionObserver
export function MapViewLoader(props: PinDropMapProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      {inView ? (
        <PinDropMapBase {...props} />
      ) : (
        <div data-testid="location-map" className="h-64 w-full bg-muted rounded-lg animate-pulse" />
      )}
    </div>
  );
}
