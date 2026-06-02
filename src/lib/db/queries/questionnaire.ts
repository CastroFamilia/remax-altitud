import "server-only";
import { and, eq, inArray, isNull, not, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema/properties";
import { propertySearchColumns, mapPropertyRowToSearchItem } from "@/lib/db/queries/properties";
import type { PropertySearchItem } from "@/types/search";

export type QuestionnaireProperties = {
  A: PropertySearchItem[];
  B: PropertySearchItem[];
  C: PropertySearchItem[];
};

/**
 * Fetches 3 active recommended properties for each of the three lifestyle questionnaire profiles.
 */
export async function getQuestionnaireRecommendationProperties(): Promise<QuestionnaireProperties> {
  try {
    // 1. Fetch Mostly A's: Coastal Surf & High-Energy Hub (Dominical, Dominicalito, Bahía Ballena)
    // Matches area_slug = 'dominical' OR sub_location = 'bahia-ballena'
    const rowsA = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(
        and(
          eq(properties.isVisible, true),
          or(eq(properties.areaSlug, "dominical"), eq(properties.subLocation, "bahia-ballena")),
        ),
      )
      .orderBy(properties.isFeatured ? properties.syncedAt : properties.syncedAt)
      .limit(3);

    // 2. Fetch Mostly B's: Coastal Jungle Ridge & Eco-Luxury (Uvita, Platanillo, Barú)
    // Matches area_slug = 'uvita' OR area_slug = 'tinamastes-platanillo' OR sub_location = 'baru'
    const rowsB = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(
        and(
          eq(properties.isVisible, true),
          or(
            eq(properties.areaSlug, "uvita"),
            eq(properties.areaSlug, "tinamastes-platanillo"),
            eq(properties.subLocation, "baru"),
          ),
        ),
      )
      .limit(3);

    // 3. Fetch Mostly C's: Authentic Mountain Valley & High-Convenience (Pérez Zeledón)
    // Matches area_slug = 'perez-zeledon' (excluding sub_location = 'baru' to keep it inland/valley)
    const rowsC = await db
      .select(propertySearchColumns)
      .from(properties)
      .where(
        and(
          eq(properties.isVisible, true),
          eq(properties.areaSlug, "perez-zeledon"),
          or(not(eq(properties.subLocation, "baru")), isNull(properties.subLocation)),
        ),
      )
      .limit(3);

    // Map rows using standard mapper
    const mappedA = rowsA.map(mapPropertyRowToSearchItem);
    const mappedB = rowsB.map(mapPropertyRowToSearchItem);
    const mappedC = rowsC.map(mapPropertyRowToSearchItem);

    // Fallback logic if any region has less than 3 properties, populate from featured/active properties
    const getFallbacks = async (needed: number, excludeIds: string[]) => {
      const fallbackRows = await db
        .select(propertySearchColumns)
        .from(properties)
        .where(
          and(
            eq(properties.isVisible, true),
            excludeIds.length > 0 ? not(inArray(properties.id, excludeIds)) : undefined,
          ),
        )
        .limit(needed);
      return fallbackRows.map(mapPropertyRowToSearchItem);
    };

    if (mappedA.length < 3) {
      const fallbacks = await getFallbacks(
        3 - mappedA.length,
        mappedA.map((p) => p.id),
      );
      mappedA.push(...fallbacks);
    }
    if (mappedB.length < 3) {
      const fallbacks = await getFallbacks(
        3 - mappedB.length,
        mappedB.map((p) => p.id),
      );
      mappedB.push(...fallbacks);
    }
    if (mappedC.length < 3) {
      const fallbacks = await getFallbacks(
        3 - mappedC.length,
        mappedC.map((p) => p.id),
      );
      mappedC.push(...fallbacks);
    }

    return {
      A: mappedA,
      B: mappedB,
      C: mappedC,
    };
  } catch (error) {
    console.error("getQuestionnaireRecommendationProperties: Failed to fetch properties", error);
    return { A: [], B: [], C: [] };
  }
}
