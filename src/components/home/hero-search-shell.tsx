import { Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Variant = "desktop-overlay" | "mobile-inline";

export function HeroSearchShell({ variant }: { variant: Variant }) {
  const t = useTranslations("HomePage.hero");

  const containerClass =
    variant === "desktop-overlay"
      ? "pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-6"
      : "px-4 py-3 md:hidden";

  const shellClass =
    variant === "desktop-overlay"
      ? "pointer-events-auto mx-auto w-full max-w-[720px] rounded-xl glass-strong p-3 shadow-[var(--shadow-glass)]"
      : "rounded-xl glass-strong p-3 shadow-[var(--shadow-glass)]";

  return (
    <div className={containerClass}>
      <div role="search" aria-label={t("searchAriaLabel")} className={shellClass}>
        <div aria-disabled="true">
          <div className="mb-2 flex gap-4 text-xs font-semibold" aria-hidden="true">
            <span className="flex items-center gap-1 text-brand-gold">
              <Sparkles className="h-3.5 w-3.5" />
              {t("smartToggle")}
            </span>
            <span className="flex items-center gap-1 text-white/80">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t("traditionalToggle")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              disabled
              readOnly
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className={cn(
                "min-h-11 flex-1 cursor-not-allowed bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/70",
              )}
            />
            <button
              type="button"
              disabled
              aria-label={t("searchSubmit")}
              className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-brand-navy text-white opacity-80 shadow-[var(--shadow-cta)]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <span className="sr-only">{t("shellNotice")}</span>
        </div>
      </div>
    </div>
  );
}
