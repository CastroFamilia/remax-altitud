/**
 * Utility functions for property identifiers.
 *
 * In the REMAX ecosystem, properties carry:
 * 1. An official 12-digit MLS/REMAX ListingKey (e.g. 400374736001, 400344703015),
 *    which clients and agents use as the definitive reference number.
 * 2. An internal feed ListingId / apiId (e.g. 165758, 400344703015).
 * 3. An internal database UUID id.
 *
 * `getPropertyDisplayId` resolves the most authoritative public identifier,
 * prioritizing the 12-digit official ListingKey.
 */

export function getPropertyDisplayId(
  property?: {
    apiRaw?: unknown;
    apiId?: string | null;
    id?: string;
  } | null,
): string {
  if (!property) return "";
  const raw = property.apiRaw as Record<string, unknown> | null | undefined;
  if (raw) {
    const key = raw.ListingKey ?? raw.listingKey;
    if (typeof key === "string" && key.trim()) {
      return key.trim();
    }
  }
  if (property.apiId && typeof property.apiId === "string" && property.apiId.trim()) {
    return property.apiId.trim();
  }
  if (raw) {
    const id = raw.ListingId ?? raw.listingId;
    if (id != null && String(id).trim()) {
      return String(id).trim();
    }
  }
  return property.id ?? "";
}
