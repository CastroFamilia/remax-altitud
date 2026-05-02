"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDrag } from "@use-gesture/react";
import { PropertyCard } from "@/components/property/property-card";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import type { PropertySearchItem } from "@/types/search";

interface MapPullUpSheetProps {
  properties: PropertySearchItem[];
  locale: string;
  propertyCount: number; // total visible count for the handle label
  isLoading?: boolean;
  initialState?: "peeked" | "half" | "full"; // for unit test control only; defaults to 'peeked'
}

const snapHeights: Record<"peeked" | "half" | "full", string> = {
  peeked: "15vh",
  half: "50vh",
  full: "85vh",
};

export function MapPullUpSheet({
  properties,
  locale,
  propertyCount,
  isLoading = false,
  initialState,
}: MapPullUpSheetProps) {
  const t = useTranslations("SearchPage");
  const [state, setState] = useState<"peeked" | "half" | "full">(initialState ?? "peeked");

  const bind = useDrag(
    ({ movement: [, my], last }) => {
      if (!last) return; // only snap on release
      // Negative my = dragged up; positive = dragged down
      if (my < -60) {
        // dragged up significantly → advance one state
        setState((prev) => (prev === "peeked" ? "half" : "full"));
      } else if (my > 60) {
        // dragged down significantly → retreat one state
        setState((prev) => (prev === "full" ? "half" : "peeked"));
      }
      // else: insufficient drag → snap back to current state (no change)
    },
    { axis: "y" },
  );

  const sheetHeight = snapHeights[state];

  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- UX-DR25 explicitly requires aria-expanded on this region landmark to communicate sheet state to assistive technologies
    <section
      aria-label={t("pullUpSheet.regionLabel")}
      aria-expanded={state !== "peeked" ? "true" : "false"}
      data-testid="pull-up-sheet"
      data-state={state}
      className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border rounded-t-2xl shadow-lg lg:hidden flex flex-col"
      style={{
        height: sheetHeight,
        transition: "height 300ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Full state close button */}
      {state === "full" && (
        <button
          type="button"
          onClick={() => setState("peeked")}
          className="absolute top-2 right-3 text-xs text-muted-foreground underline"
          aria-label={t("pullUpSheet.closeLabel")}
        >
          {t("pullUpSheet.close")}
        </button>
      )}

      {/* Drag handle zone — touch-none prevents native scroll conflict */}
      <div className="flex flex-col items-center touch-none" {...bind()}>
        {/* Drag handle bar */}
        <div
          aria-hidden="true"
          data-testid="pull-up-handle"
          className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 my-2 flex-shrink-0"
        />
        {/* Property count */}
        <span className="text-xs text-muted-foreground text-center pb-1">
          {t("pullUpHandle.propertiesCount", { count: propertyCount })}
        </span>
      </div>

      {/* Content area — only shown when not peeked */}
      {state !== "peeked" && (
        <div className="flex-1 overflow-hidden">
          {state === "half" && (
            <div
              className="flex gap-3 overflow-x-auto px-3 pb-2 snap-x snap-mandatory"
              style={{ overscrollBehavior: "none" }}
            >
              {isLoading ? (
                <SearchResultsSkeleton />
              ) : (
                properties.slice(0, 3).map((p) => (
                  <div key={p.id} className="snap-start flex-shrink-0 w-[280px]">
                    <PropertyCard property={p} locale={locale} variant="compact" />
                  </div>
                ))
              )}
            </div>
          )}
          {state === "full" && (
            <div
              className="flex-1 overflow-y-auto px-3 pb-4"
              style={{ overscrollBehavior: "none" }}
            >
              {isLoading ? (
                <SearchResultsSkeleton />
              ) : (
                properties.map((p) => (
                  <div key={p.id} className="mb-3">
                    <PropertyCard property={p} locale={locale} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
