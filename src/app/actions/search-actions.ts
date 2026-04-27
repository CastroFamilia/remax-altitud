"use server";

/**
 * Story 3.3: Search Filters & URL State
 * Server Actions: searchProperties, getAvailableAreas
 *
 * ATDD STUB — This file satisfies module resolution for red-phase test scaffolds.
 * Task 3 of Story 3.3 will replace this stub with the full implementation.
 *
 * Architecture mandate (ADR-5): Server Actions over REST API for Search.
 * This module MUST NOT be modified without Story 3.3 task ownership.
 *
 * Note: map-actions.ts (Story 3.2) is FROZEN — do NOT import or modify it here.
 */

import type { SearchFilters, SearchResult } from "@/types/search";

/**
 * ATDD STUB — Not yet implemented. Story 3.3 Task 3 will implement this.
 *
 * Implementation requirements:
 * - Use Drizzle from: import { db } from "@/lib/db/client"
 * - Always filter: eq(properties.isVisible, true)
 * - Sanitize all numeric inputs with Number.isFinite()
 * - Apply sort: price_asc, price_desc, or default desc(createdAt)
 * - Apply limit(50).offset(0) for MVP
 * - Return facets: byType, byBedrooms, byBathrooms aggregations
 */
export async function searchProperties(_filters: SearchFilters): Promise<SearchResult> {
  throw new Error("searchProperties: not yet implemented — Story 3.3 Task 3");
}

/**
 * ATDD STUB — Not yet implemented. Story 3.3 Task 9 will implement this.
 *
 * Implementation requirements:
 * - SELECT DISTINCT area_slug FROM properties WHERE is_visible=true AND area_slug IS NOT NULL
 * - Return as { slug: string; label: string }[] with capitalized labels
 */
export async function getAvailableAreas(): Promise<{ slug: string; label: string }[]> {
  throw new Error("getAvailableAreas: not yet implemented — Story 3.3 Task 9");
}
