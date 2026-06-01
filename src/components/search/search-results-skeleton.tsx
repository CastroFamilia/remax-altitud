import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { cn } from "@/lib/utils";

interface SearchResultsSkeletonProps {
  className?: string;
}

export function SearchResultsSkeleton({ className }: SearchResultsSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 p-4 lg:gap-6",
        className || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
