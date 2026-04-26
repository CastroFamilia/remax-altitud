"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { ViewModeToggle } from "@/components/search/view-mode-toggle";

type ViewMode = "split" | "map" | "grid";

interface SplitViewLayoutProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SplitViewLayout({ viewMode, onViewModeChange }: SplitViewLayoutProps) {
  // Tablet side-panel toggle state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const mapHidden = viewMode === "grid";
  const gridHidden = viewMode === "map";

  return (
    <div className="relative flex flex-col">
      {/* View mode toggle — desktop/tablet only, hidden on mobile */}
      <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

      {/* Split-view container */}
      <div className="relative flex flex-row">
        {/* Map panel */}
        <div
          data-testid="map-panel"
          className={cn(
            // Mobile: full width map (no-prefix = mobile-first)
            "w-full",
            // Desktop split / full-map / full-grid
            mapHidden ? "lg:hidden" : gridHidden ? "lg:w-full" : "lg:w-[60%]",
            // Height: mobile = full screen; desktop = viewport minus header + filter bar
            "h-screen",
            "lg:h-[calc(100vh-var(--header-height)-3.5rem)]",
            "flex-shrink-0",
          )}
        >
          <div data-testid="map-placeholder" className="h-full w-full bg-muted" />
        </div>

        {/* Grid panel — hidden on mobile, shown on desktop */}
        <div
          data-testid="grid-panel"
          className={cn(
            // Mobile: hidden (map is full-screen; pull-up sheet is Story 3.6)
            "hidden",
            // Tablet (md): 40% width, hidden behind side-panel toggle
            sidePanelOpen ? "md:block md:w-[40%]" : "md:hidden",
            // Desktop: show in split/grid mode, hide in full-map mode
            gridHidden ? "lg:hidden" : mapHidden ? "lg:w-full lg:block" : "lg:w-[40%] lg:block",
            "overflow-y-auto",
            "lg:h-[calc(100vh-var(--header-height)-3.5rem)]",
          )}
        >
          <SearchResultsSkeleton />
        </div>

        {/* Tablet side-panel toggle button (md: range) */}
        <button
          type="button"
          aria-expanded={sidePanelOpen}
          aria-label={sidePanelOpen ? "Hide listings" : "Show listings"}
          className="absolute right-2 top-2 z-20 hidden md:flex lg:hidden items-center justify-center h-10 w-10 rounded-full bg-background shadow-md border border-border"
          onClick={() => setSidePanelOpen((prev) => !prev)}
        >
          <span className="sr-only">{sidePanelOpen ? "Hide listings" : "Show listings"}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
      </div>

      {/* Mobile pull-up handle stub — Story 3.6 activates full sheet behaviour */}
      <div
        data-testid="pull-up-handle"
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center justify-center h-10 bg-background border-t border-border rounded-t-2xl shadow-lg lg:hidden"
      >
        {/* Drag indicator */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-1" />
        <span className="text-xs text-muted-foreground">24 properties</span>
      </div>
    </div>
  );
}
