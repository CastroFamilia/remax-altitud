import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";

export function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
