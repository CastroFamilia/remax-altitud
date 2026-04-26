"use client";

import { useSearchParams } from "next/navigation";
import { SplitViewLayout } from "@/components/search/split-view-layout";
import { SearchFilterBar } from "@/components/search/search-filter-bar";

type ViewMode = "split" | "map" | "grid";

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const rawView = searchParams.get("view");
  const viewMode: ViewMode = rawView === "map" || rawView === "grid" ? rawView : "split";

  return (
    <div className="flex flex-col">
      <SearchFilterBar />
      <SplitViewLayout
        viewMode={viewMode}
        onViewModeChange={() => {
          // View mode changes are handled inside SplitViewLayout via ViewModeToggle
        }}
      />
    </div>
  );
}
