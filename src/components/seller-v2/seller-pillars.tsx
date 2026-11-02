import { getTranslations } from "next-intl/server";

interface SellerPillarsProps {
  locale: string;
}

export async function SellerPillars({ locale }: SellerPillarsProps) {
  const t = await getTranslations({ locale, namespace: "SellerPageV2.pillars" });

  const pillars = [
    {
      step: "01",
      title: t("p1Title"),
      desc: t("p1Desc"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-gold">
          <circle cx="12" cy="12" r="10" />
          <path d="m16 10-4 4-2-2" />
        </svg>
      ),
    },
    {
      step: "02",
      title: t("p2Title"),
      desc: t("p2Desc"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-gold">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      step: "03",
      title: t("p3Title"),
      desc: t("p3Desc"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-gold">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-slate-50 py-16 px-4 md:py-24 border-y border-slate-200">
      <div className="mx-auto max-w-7xl">
        {/* Header de sección */}
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

        {/* Las 3 tarjetas de pilares */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.step}
              className="relative flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md border border-slate-200"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy/5">
                    {pillar.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-300">
                    {pillar.step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-brand-navy">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-brand-navy">
                <span>REMAX Altitud Standard</span>
                <span className="ml-auto text-brand-gold">✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
