import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface SellerNetworkMapProps {
  locale: string;
}

const OFFICES_LIST = [
  "La Fortuna, Arenal",
  "Playa del Coco, Papagayo",
  "Tamarindo",
  "Nosara",
  "Sámara",
  "Playa Carmen, Mal País",
  "Nandayure",
  "Orotina, Alajuela",
  "Jaco Beach, Puntarenas",
  "Manuel Antonio, Puntarenas",
  "Pérez Zeledón, San Isidro",
  "Dominical, Puntarenas",
  "Ojochal, Puntarenas",
  "Pavones, Puntarenas",
  "Atenas, Alajuela",
  "Escazú, San José",
  "Heredia",
  "San José",
  "Grecia, Alajuela",
  "Cartago",
  "Cahuita, Limón",
];

export async function SellerNetworkMap({ locale }: SellerNetworkMapProps) {
  const t = await getTranslations({ locale, namespace: "SellerPageV2.network" });

  return (
    <section className="bg-brand-navy py-16 text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Columna Izquierda: Información de impacto */}
          <div className="lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
              {t("eyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl leading-tight">
              {t("heading")}
            </h2>
            <p className="mt-4 text-base text-white/80 leading-relaxed">{t("subheading")}</p>

            {/* 3 Estadísticas / Fortalezas */}
            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold font-black text-xl">
                  {t("stat1Number")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t("stat1Label")}</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/70">{t("stat1Desc")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold font-black text-xl">
                  {t("stat2Number")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t("stat2Label")}</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/70">{t("stat2Desc")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-gold/20 text-brand-gold font-black text-xl">
                  {t("stat3Number")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t("stat3Label")}</h3>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/70">{t("stat3Desc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Mapa de Costa Rica real */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-md">
              <div className="relative aspect-[4/3] w-full flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner overflow-hidden">
                <Image
                  src="/images/mapa-remax-costa-rica.jpeg"
                  alt={t("mapAlt")}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, 500px"
                  priority
                />
              </div>

              {/* Leyenda del HUB */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-brand-gold shadow-sm shadow-brand-gold" />
                  <span className="font-semibold text-white">Zona Sur (PZ + Dominical/Uvita)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                  <span>22 Oficinas en Red Nacional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Horizontal Infinita (Marquee Ticker de Ubicaciones) */}
      <div className="mt-14 border-y border-white/10 bg-slate-950/60 py-4 backdrop-blur-md">
        <div className="mb-2 px-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold">
            Red de oficinas activas en Costa Rica promocionando tu propiedad
          </p>
        </div>
        <div className="relative flex overflow-x-hidden">
          {/* Primer carril */}
          <div className="flex shrink-0 animate-marquee items-center gap-6 whitespace-nowrap py-1">
            {OFFICES_LIST.map((office, idx) => (
              <span
                key={`off-1-${idx}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-white/90 shadow-sm transition hover:border-brand-gold hover:text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                {office}
              </span>
            ))}
          </div>

          {/* Segundo carril duplicado para bucle infinito perfecto */}
          <div
            className="flex shrink-0 animate-marquee items-center gap-6 whitespace-nowrap py-1"
            aria-hidden="true"
          >
            {OFFICES_LIST.map((office, idx) => (
              <span
                key={`off-2-${idx}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs sm:text-sm font-medium text-white/90 shadow-sm transition hover:border-brand-gold hover:text-white"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                {office}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
