import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-card" aria-busy="true">
      {/* Image placeholder — aspect-4/3 */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <div className="space-y-3 p-4">
        {/* Title line */}
        <Skeleton className="h-5 w-3/4" />

        {/* Specs line (beds, baths, area) */}
        <Skeleton className="h-4 w-1/2" />

        {/* Price line */}
        <Skeleton className="h-6 w-2/5" />
      </div>
    </div>
  );
}
