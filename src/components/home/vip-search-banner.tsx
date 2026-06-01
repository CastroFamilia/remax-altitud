import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Compass } from "lucide-react";

export function VipSearchBanner() {
  const t = useTranslations("HomePage.vipSearchBanner");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-navy text-white shadow-xl transition-all duration-300 hover:shadow-2xl md:p-1">
      {/* Decorative background radial gradient for high end feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_75%_50%,rgba(194,166,97,0.15),rgba(0,0,0,0))]" />

      {/* Subtle border accent */}
      <div className="absolute inset-0 border border-brand-gold/25 rounded-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-stretch">
        {/* Text Section */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-2xs font-extrabold uppercase tracking-widest text-brand-gold/90">
              {t("ctaButton")}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-3xl leading-tight !text-white">
            {t("title")}
          </h2>

          <p className="mt-4 text-sm md:text-base leading-relaxed text-white/80 max-w-2xl font-normal">
            {t("body")}
          </p>
        </div>

        {/* CTA Banner side / Accent column */}
        <div className="flex flex-col justify-center bg-white/5 backdrop-blur-xs border-t border-white/10 md:border-t-0 md:border-l md:border-white/10 p-8 md:p-10 md:w-[320px] lg:w-[380px] shrink-0 text-center md:text-left">
          <p className="text-sm font-semibold text-brand-gold tracking-wide uppercase">
            {t("ctaText")}
          </p>

          <div className="mt-6">
            <Link
              href="/find-your-dream-property"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gold px-6 font-bold text-brand-navy shadow-lg transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:bg-brand-gold-light hover:scale-[1.02] active:scale-98"
            >
              <span>{t("ctaButton")}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
