/**
 * SellerHero — Story 5.1 (AC #1, #2, #12)
 *
 * Server Component — SEO landing content above the seller form.
 * Renders 200–300 words of indexable content: h1/h2 value proposition,
 * benefits list, process explanation, and testimonials.
 *
 * data-testid="seller-hero" on the root section (AC #1 contract).
 * NOT a 'use client' component — intentionally a Server Component for SEO.
 */

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

interface SellerHeroProps {
  locale: string;
}

export async function SellerHero({ locale }: SellerHeroProps) {
  const t = await getTranslations({ locale, namespace: "SellerPage" });

  return (
    <section
      data-testid="seller-hero"
      className="bg-gradient-to-br from-brand-navy to-brand-navy/90 text-white py-16 px-4 md:py-24"
      aria-labelledby="seller-hero-heading"
    >
      <div className="mx-auto max-w-4xl text-center">
        {/* H1 — primary value proposition (UX-DR12, indexable) */}
        <h1 id="seller-hero-heading" className="text-3xl font-bold md:text-5xl leading-tight">
          {t("hero.heading")}
        </h1>

        {/* H2 — supporting subheading */}
        <p className="mt-4 text-lg text-white/80 md:text-xl">{t("hero.subheading")}</p>

        {/* Benefits list — 3 key selling points */}
        <ul className="mt-8 flex flex-col gap-3 md:flex-row md:justify-center md:gap-8 text-left md:text-center">
          <li className="flex items-start gap-2 md:flex-col md:items-center">
            <span className="text-brand-gold text-xl" aria-hidden="true">
              ✓
            </span>
            <span className="text-white/90">{t("hero.benefit1")}</span>
          </li>
          <li className="flex items-start gap-2 md:flex-col md:items-center">
            <span className="text-brand-gold text-xl" aria-hidden="true">
              ✓
            </span>
            <span className="text-white/90">{t("hero.benefit2")}</span>
          </li>
          <li className="flex items-start gap-2 md:flex-col md:items-center">
            <span className="text-brand-gold text-xl" aria-hidden="true">
              ✓
            </span>
            <span className="text-white/90">{t("hero.benefit3")}</span>
          </li>
        </ul>

        {/* Process explanation — how it works */}
        <p className="mt-8 text-white/80 text-sm md:text-base">{t("hero.process")}</p>

        {/* Testimonial */}
        <blockquote className="mt-8 italic text-white/70 text-sm border-l-4 border-brand-gold pl-4 text-left max-w-xl mx-auto">
          {t("hero.testimonial1")}
        </blockquote>

        {/* CTA — scrolls to form (AC #2) */}
        <div className="mt-10">
          <Link
            href="#seller-form"
            aria-label={t("hero.startButtonAriaLabel")}
            className="inline-flex h-12 items-center rounded-lg bg-brand-gold px-8 text-base font-bold text-brand-navy shadow-md transition-colors hover:bg-brand-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
          >
            {t("hero.startButton")}
          </Link>
        </div>
      </div>
    </section>
  );
}
