/**
 * SellerFormSkeleton — Story 5.1
 *
 * Loading placeholder shown while SellerForm lazy-loads via next/dynamic.
 * Mirrors the PropertyGallery skeleton pattern from Story 4.1.
 *
 * Not a 'use client' component — safe to render server-side as a fallback.
 */

export function SellerFormSkeleton() {
  return (
    <div data-testid="seller-form-skeleton" className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-12 bg-gray-200 rounded" />
      <div className="h-12 bg-gray-200 rounded" />
      <div className="h-12 bg-gray-200 rounded w-2/3" />
      <div className="h-11 bg-gray-300 rounded w-full" />
    </div>
  );
}
