import { getTranslations } from "next-intl/server";
import { VerticalVideoPlayer } from "./vertical-video-player";
import { getSellerVideoUrl } from "./videos";

interface SellerMythsVideosProps {
  locale: string;
}

export async function SellerMythsVideos({ locale }: SellerMythsVideosProps) {
  const t = await getTranslations({ locale, namespace: "SellerPageV2.myths" });

  return (
    <section className="bg-white py-16 px-4 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            {t("eyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-brand-navy sm:text-3xl md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            {t("subheading")}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Tarjeta Mito 1: La Exclusiva sin Rehenes */}
          <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50/60 p-8 shadow-sm sm:flex-row sm:items-start gap-8">
            <div className="w-full sm:w-1/2 flex justify-center shrink-0">
              <VerticalVideoPlayer
                title={t("myth1Title")}
                subtitle="Exclusiva = Compromiso mutuo de inversión"
                badge="Mito 1"
                aspectRatio="9/16"
                videoUrl={getSellerVideoUrl("exclusive", locale)}
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between h-full pt-2">
              <div>
                <span className="inline-block rounded-md bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                  Mito vs. Realidad
                </span>
                <h3 className="mt-4 text-xl font-bold text-brand-navy leading-snug">
                  {t("myth1Title")}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {t("myth1Desc")}
                </p>
              </div>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <a
                  href="#diagnostico-form"
                  className="text-xs font-bold text-brand-navy hover:text-brand-gold flex items-center gap-1.5 transition-colors"
                >
                  Conocé cómo protegemos tu propiedad →
                </a>
              </div>
            </div>
          </div>

          {/* Tarjeta Mito 2: El Precio se Diagnostica */}
          <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-50/60 p-8 shadow-sm sm:flex-row sm:items-start gap-8">
            <div className="w-full sm:w-1/2 flex justify-center shrink-0">
              <VerticalVideoPlayer
                title={t("myth2Title")}
                subtitle="El error más caro al vender"
                badge="Mito 2"
                aspectRatio="9/16"
                videoUrl={getSellerVideoUrl("price", locale)}
              />
            </div>
            <div className="w-full sm:w-1/2 flex flex-col justify-between h-full pt-2">
              <div>
                <span className="inline-block rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                  Estrategia de Mercado
                </span>
                <h3 className="mt-4 text-xl font-bold text-brand-navy leading-snug">
                  {t("myth2Title")}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {t("myth2Desc")}
                </p>
              </div>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <a
                  href="#diagnostico-form"
                  className="text-xs font-bold text-brand-navy hover:text-brand-gold flex items-center gap-1.5 transition-colors"
                >
                  Solicitar diagnóstico científico de precio →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
