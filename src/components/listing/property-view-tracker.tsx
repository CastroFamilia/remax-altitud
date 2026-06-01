"use client";

import { useEffect, useRef } from "react";

interface PropertyViewTrackerProps {
  propertyId: string;
  slug: string;
  locale: "en" | "es";
}

export function PropertyViewTracker({ propertyId, slug, locale }: PropertyViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Trigger non-blocking fetch call to local tracking view API
    fetch("/api/tracking/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        propertyId,
        slug,
        locale,
      }),
    }).catch((err) => {
      console.error("Failed to trigger local view tracking:", err);
    });
  }, [propertyId, slug, locale]);

  return null;
}
