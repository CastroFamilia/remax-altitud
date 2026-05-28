/**
 * Story 3.3: Search Filters & URL State
 * Canonical types for search filters, results, and facets.
 *
 * Architecture mandate (AR10): Search filters MUST live in URL query params.
 * Do NOT store SearchFilters in Zustand or React state.
 */

export type SortOption = "newest" | "price_asc" | "price_desc" | "relevance";

export interface SearchFilters {
  type?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  lotSizeMin?: number;
  lotSizeMax?: number;
  areaSlug?: string;
  sort?: SortOption;
  view?: "split" | "map" | "grid";
  // Story 3.4: Lifestyle tags — comma-separated in URL (?tags=Investment+Property,Rental+Potential)
  tags?: string[];
  q?: string; // Free-text keyword search
}

import type { OptimizedImage } from "./images";

export interface PropertySearchItem {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  priceUsd: number;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSizeM2: number | null;
  constructionM2: number | null;
  zmtStatus: string;
  propertyType: string;
  status: string;
  areaSlug: string | null;
  images: OptimizedImage[];
  latitude: number | null;
  longitude: number | null;
}

export interface FilterFacets {
  byType: { value: string; count: number }[];
  byBedrooms: { value: number; count: number }[];
  byBathrooms: { value: number; count: number }[];
}

export interface SearchResult {
  properties: PropertySearchItem[];
  total: number;
  facets: FilterFacets;
}
