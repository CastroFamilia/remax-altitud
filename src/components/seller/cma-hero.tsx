"use client";

/**
 * CmaHero — Story 5.2 (AC #1, #5)
 *
 * Value proposition section for the CMA request form.
 * Renders as a secondary CTA on the seller page, below the main seller form.
 * Explains what a CMA is and why it's free.
 *
 * Client Component because it uses useTranslations (client-side hook).
 * data-testid="cma-hero" on the root section (AC #5 contract).
 */

import { useState } from "react";
import { useTranslations } from "next-intl";

interface CmaHeroProps {
  locale: string;
  /** When true, the CMA form section starts expanded. */
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

export function CmaHero({ locale: _locale, defaultExpanded = false, children }: CmaHeroProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const t = useTranslations("CmaForm");
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section
      data-testid="cma-hero"
      className="mx-auto max-w-2xl px-4 py-12"
      aria-labelledby="cma-hero-heading"
    >
      {/* Divider */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          {t("hero.subheading")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* CMA value proposition card */}
      <div className="rounded-xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/5 to-transparent p-6 md:p-8">
        <h2
          id="cma-hero-heading"
          className="text-2xl font-bold text-brand-navy md:text-3xl"
        >
          {t("hero.heading")}
        </h2>

        <p className="mt-3 text-sm text-text-muted leading-relaxed md:text-base">
          {t("hero.description")}
        </p>

        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={t("hero.ctaButtonAriaLabel")}
            className="mt-6 inline-flex h-11 items-center rounded-lg border-2 border-brand-gold bg-brand-gold/10 px-6 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-gold/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            {t("hero.ctaButton")}
          </button>
        )}
      </div>

      {/* Expanded CMA form (children = CmaFormLoader) */}
      {expanded && <div className="mt-8">{children}</div>}
    </section>
  );
}
