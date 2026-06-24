import { db } from "@/lib/db/client";
import { properties } from "@/lib/db/schema";
import { or, ilike, eq, and, desc } from "drizzle-orm";
import { PropertyCard } from "@/components/property/property-card";
import { mapPropertyRowToSearchItem, propertySearchColumns } from "@/lib/db/queries/properties";

interface Props {
  location: string;
  locale: string;
}

export async function FeaturedPropertiesWidget({ location, locale }: Props) {
  const locationNormalized = location.toLowerCase().replace(/ /g, "-");

  const results = await db
    .select(propertySearchColumns)
    .from(properties)
    .where(
      and(
        eq(properties.isVisible, true),
        or(
          ilike(properties.areaSlug, `%${locationNormalized}%`),
          ilike(properties.subLocation, `%${location}%`),
          ilike(properties.titleEn, `%${location}%`),
          ilike(properties.titleEs, `%${location}%`),
        ),
      ),
    )
    .orderBy(desc(properties.syncedAt))
    .limit(3);

  if (results.length === 0) return null;
  const searchItems = results.map(mapPropertyRowToSearchItem);

  return (
    <div className="mt-12 pt-8 border-t border-gray-200" data-testid="featured-properties-widget">
      <h3 className="text-2xl font-bold mb-6 text-primary">Featured Properties in {location}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {searchItems.map((p) => (
          <PropertyCard key={p.id} property={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
