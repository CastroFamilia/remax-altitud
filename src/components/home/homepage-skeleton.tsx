import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Section heading + description */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 md:h-10 md:w-64" />
        <Skeleton className="h-4 w-72 md:w-96" />
      </div>

      {/* 3 card placeholders in responsive grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function HomepageSkeleton() {
  return (
    <div className="container space-y-12 py-12 md:space-y-16 md:py-16" aria-busy="true">
      {/* Hero shimmer */}
      <Skeleton className="h-[50vh] w-full rounded-xl md:h-[60vh]" />

      {/* 3 sections: New Listings, Featured Communities, Area Highlights */}
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </div>
  );
}
