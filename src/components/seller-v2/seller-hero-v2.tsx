import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { VerticalVideoPlayer } from "./vertical-video-player";
import { getSellerVideoUrl } from "./videos";

interface SellerHeroV2Props {
  locale: string;
}

export async function SellerHeroV2({ locale }: SellerHeroV2Props) {
  const t = await getTranslations({ locale, namespace: "SellerPageV2.hero" });

  const localBadges = [
    t("badges.perezZeledon"),
    t("badges.dominical"),
    t("badges.uvita"),
    t("badges.bahiaBallena"),
    t("badges.pacificoSur"),
  ];

  const globalBadges = [
    t("badges.todoElPais"),
    t("badges.todoElMundo"),
  ];

  return (
    <section className="relative overflow-hidden bg-brand-navy py-12 px-4 md:py-20 lg:py-24">
      {/* Background Image with subtle overlay */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/seller-hero-bg.png"
          alt="REMAX Altitud Luxury Landscape"
          fill
          priority
          className="object-cover opacity-25"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/95 via-brand-navy/85 to-brand-navy" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Columna Izquierda: Copy persuasivo */}
          <div className="text-left text-white lg:col-span-7">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1.5 text-xs font-semibold text-brand-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
              {t("eyebrow")}
            </div>

            {/* H1 Principal */}
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl text-white leading-tight">
              {t("heading")}
            </h1>

            {/* Badges de Zonas Clave + Alcance Nacional y Global */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {localBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/90"
                >
                  📍 {badge}
                </span>
              ))}

              <span className="text-white/30 hidden sm:inline">|</span>

              {globalBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-brand-gold/40 bg-brand-gold/15 px-2.5 py-1 text-xs font-bold text-brand-gold shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Subtítulo */}
            <p className="mt-5 text-base sm:text-lg text-white/90 font-normal leading-relaxed">
              {t("subheading")}
            </p>

            {/* 3 Bullets de Valor */}
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold font-bold text-sm">
                  ✓
                </span>
                <span className="text-sm sm:text-base text-white/95 font-medium">
                  {t("bullet1")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold font-bold text-sm">
                  ✓
                </span>
                <span className="text-sm sm:text-base text-white/95 font-medium">
                  {t("bullet2")}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold font-bold text-sm">
                  ✓
                </span>
                <span className="text-sm sm:text-base text-white/95 font-medium">
                  {t("bullet3")}
                </span>
              </li>
            </ul>

            {/* Divisiones especializadas */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs text-white/80">
              <span className="font-semibold text-brand-gold">Divisiones especializadas:</span>
              <span className="rounded bg-white/10 px-2 py-0.5 font-medium">REMAX Collection (Lujo)</span>
              <span className="rounded bg-white/10 px-2 py-0.5 font-medium">REMAX Commercial</span>
              <span className="rounded bg-white/10 px-2 py-0.5 font-medium">Especialistas en Fincas</span>
            </div>

            {/* CTAs Duos */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#diagnostico-form"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-gold px-7 text-sm sm:text-base font-bold text-brand-navy shadow-lg shadow-brand-gold/20 transition-all hover:bg-brand-gold/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("ctaForm")}
              </a>
              <a
                href="https://wa.me/50660788887?text=Hola,%20quisiera%20solicitar%20un%20diagnóstico%20de%20precio%20para%20mi%20propiedad."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm sm:text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
              >
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
                  className="text-green-400"
                >
                  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
                </svg>
                {t("ctaWhatsApp")}
              </a>
            </div>
          </div>

          {/* Columna Derecha: Video Vertical 9:16 */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <VerticalVideoPlayer
              title={t("videoTitle")}
              subtitle={t("videoSubtitle")}
              badge={t("videoBadge")}
              aspectRatio="9/16"
              videoUrl={getSellerVideoUrl("main", locale)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
