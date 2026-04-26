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
      className="hidden lg:flex items-center gap-1 px-4 py-2 border-b border-border bg-background"
    >
      {buttons.map(({ mode, label, testId }) => (
        <button
          key={mode}
          type="button"
          data-testid={testId}
          onClick={() => handleModeChange(mode)}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            viewMode === mode
              ? "bg-brand-navy text-white"
              : "bg-transparent text-foreground hover:bg-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
