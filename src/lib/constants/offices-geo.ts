/** Pérez Zeledón office — REMAX Altitud main office, San Isidro de El General */
export const OFFICE_PZ_COORDS = { lat: 9.3725, lng: -83.7011 };

/** Dominical / Uvita office — REMAX Altitud Cero */
export const OFFICE_DOMINICAL_COORDS = { lat: 9.257, lng: -83.885 };

/**
 * Returns the nearest office coordinates based on user coords.
 * If no user coords provided, defaults to PZ (primary office).
 */
export function getNearestOfficeCoords(
  userLat?: number,
  userLng?: number,
): { lat: number; lng: number } {
  if (userLat === undefined || userLng === undefined) return OFFICE_PZ_COORDS;
  const distPZ = Math.hypot(userLat - OFFICE_PZ_COORDS.lat, userLng - OFFICE_PZ_COORDS.lng);
  const distDOM = Math.hypot(
    userLat - OFFICE_DOMINICAL_COORDS.lat,
    userLng - OFFICE_DOMINICAL_COORDS.lng,
  );
  return distPZ <= distDOM ? OFFICE_PZ_COORDS : OFFICE_DOMINICAL_COORDS;
}
