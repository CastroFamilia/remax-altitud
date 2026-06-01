"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type ViewMode = "split" | "map" | "grid";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("SearchPage.viewToggle");

  function handleModeChange(newMode: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newMode);
    router.replace(`?${params.toString()}`, { scroll: false });
    onViewModeChange(newMode);
  }

  const buttons: { mode: ViewMode; label: string; testId: string }[] = [
    { mode: "split", label: t("split"), testId: "toggle-split" },
    { mode: "map", label: t("map"), testId: "toggle-map" },
    { mode: "grid", label: t("grid"), testId: "toggle-grid" },
  ];

  return (
    <div
      data-testid="view-mode-toggle-container"
      className="hidden lg:inline-flex items-center rounded-lg border border-brand-gold/30 bg-background p-0.5"
    >
      {buttons.map(({ mode, label, testId }) => (
        <button
          key={mode}
          type="button"
          data-testid={testId}
          onClick={() => handleModeChange(mode)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
            viewMode === mode
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-transparent text-brand-navy/70 hover:text-brand-navy hover:bg-brand-gold/10",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
