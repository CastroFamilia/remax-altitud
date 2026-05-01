/**
 * Story 3.3: Search Filters & URL State
 * Canonical types for search filters, results, and facets.
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 1 of Story 3.3 will replace this stub with the full implementation.
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
}

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
  areaSlug: string | null;
  images: { url: string; alt?: string }[];
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
