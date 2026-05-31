"use client";

/**
 * LanguageToggle — EN/ES switcher wired to next-intl.
 *
 * Click triggers a soft navigation via `router.replace(pathname, { locale })`
 * — the current route is preserved and the locale prefix is swapped without
 * a full page reload (FR30, <150ms target).
 */

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Suspense } from "react";

interface LanguageToggleProps {
  /** Visual style variant: header (dark bg nav), dark (footer), light (default) */
  variant?: "light" | "dark" | "header";
}

function LanguageToggleContent({ variant = "header" }: LanguageToggleProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("LanguageToggle");

  const baseClasses =
    variant === "dark"
      ? "text-text-on-dark"
      : variant === "header"
        ? "text-text-on-dark"
        : "text-text-primary";

  const switchLocale = (target: Locale) => {
    if (target !== locale) {
      const search = searchParams.toString();
      const queryString = search ? `?${search}` : "";
      router.replace(`${pathname}${queryString}`, { locale: target });
    }
  };

  return (
    <div
      className={`flex items-center gap-1 text-sm ${baseClasses}`}
      role="group"
      aria-label={t("switchLanguage")}
    >
      {routing.locales.map((code, index) => {
        const isActive = code === locale;
        return (
          <span key={code} className="flex items-center gap-1">
            <button
              type="button"
              className={
                isActive
                  ? "font-semibold underline"
                  : "opacity-70 transition-opacity duration-[var(--duration-fast)] hover:opacity-100"
              }
              {...(isActive ? { "aria-current": "location" as const } : {})}
              aria-label={code.toUpperCase()}
              onClick={() => switchLocale(code)}
            >
              {code.toUpperCase()}
            </button>
            {index < routing.locales.length - 1 && <span aria-hidden="true">|</span>}
          </span>
        );
      })}
    </div>
  );
}

export function LanguageToggle(props: LanguageToggleProps) {
  return (
    <Suspense fallback={<div className="w-16 h-5" aria-hidden="true" />}>
      <LanguageToggleContent {...props} />
    </Suspense>
  );
}
