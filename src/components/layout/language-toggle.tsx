"use client";

/**
 * LanguageTogglePlaceholder — EN/ES toggle (non-functional).
 *
 * Story 1.4 will replace internals with next-intl locale switching.
 * Client Component — requires onClick handler.
 */

interface LanguageToggleProps {
  /** Visual style variant: header (dark bg nav), dark (footer), light (default) */
  variant?: "light" | "dark" | "header";
}

export function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
  const baseClasses =
    variant === "dark"
      ? "text-text-on-dark"
      : variant === "header"
        ? "text-white/90"
        : "text-text-primary";

  return (
    <div className={`flex items-center gap-1 text-sm ${baseClasses}`} aria-label="Switch language">
      <button
        type="button"
        className="font-semibold underline"
        aria-current="true"
        onClick={() => console.info("Language toggle: Story 1.4")}
      >
        EN
      </button>
      <span aria-hidden="true">|</span>
      <button
        type="button"
        className="opacity-70 transition-opacity duration-[var(--duration-fast)] hover:opacity-100"
        onClick={() => console.info("Language toggle: Story 1.4")}
      >
        ES
      </button>
    </div>
  );
}
