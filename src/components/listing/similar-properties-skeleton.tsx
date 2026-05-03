/**
 * SimilarPropertiesSkeleton — Server Component
 *
 * Loading skeleton for the SimilarProperties carousel.
 * Shown as fallback while SimilarPropertiesData fetches from the DB.
 *
 * Story 4.5, Task 4 | AC #8
 */

export function SimilarPropertiesSkeleton() {
  return (
    <section aria-label="Loading similar properties" data-testid="similar-properties-skeleton">
      <div className="mb-4 h-7 w-48 animate-pulse rounded bg-gray-200" /> {/* heading skeleton */}
      <div className="flex gap-4 overflow-x-hidden pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-72 md:w-80 rounded-xl overflow-hidden border border-border"
          >
            <div className="h-44 animate-pulse bg-gray-200" /> {/* image */}
            <div className="p-4 space-y-2">
              <div className="h-4 animate-pulse bg-gray-200 rounded w-3/4" />
              <div className="h-4 animate-pulse bg-gray-200 rounded w-1/2" />
              <div className="h-4 animate-pulse bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
