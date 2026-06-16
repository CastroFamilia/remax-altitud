import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  PhoneCall,
  Compass,
  MapPin,
  Handshake,
  Globe,
  Award,
  Users,
  Star,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { VipBookingSection } from "@/components/vip/vip-booking-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "VipBuyerPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/find-your-dream-property",
        es: "/es/find-your-dream-property",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

export default async function VipBuyerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VipBuyerPageContent />;
}

function VipBuyerPageContent() {
  const t = useTranslations("VipBuyerPage");

  const steps = [
    { key: "step1", icon: PhoneCall },
    { key: "step2", icon: Compass },
    { key: "step3", icon: MapPin },
    { key: "step4", icon: Handshake },
  ];

  const pillars = [
    { key: "pillar1", icon: Globe },
    { key: "pillar2", icon: MapPin },
    { key: "pillar3", icon: Award },
    { key: "pillar4", icon: Users },
    { key: "pillar5", icon: Star },
    { key: "pillar6", icon: ShieldCheck },
  ];

  return (
    <div className="bg-brand-crema/40 text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-navy py-20 text-white md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(194,166,97,0.15),rgba(0,0,0,0))]" />
        <div className="container relative mx-auto max-w-5xl px-4 text-center">
          <span className="inline-block rounded-full bg-brand-gold/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold">
            {t("metaTitle").split(" - ")[0]}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#call"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-brand-gold px-8 font-semibold text-brand-navy shadow-md transition-all hover:bg-brand-gold-light hover:shadow-lg active:scale-95"
            >
              {t("hero.ctaCall")}
            </a>
            <a
              href="https://wa.me/50660788887"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40 active:scale-95"
            >
              <MessageCircle className="h-5 w-5 text-brand-whatsapp-icon" />
              {t("hero.ctaWhatsapp")}
            </a>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-brand-navy md:text-4xl">
              {t("howItWorks.heading")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-4">
            {steps.map(({ key, icon: Icon }, idx) => (
              <div
                key={key}
                className="relative flex flex-col rounded-2xl border border-brand-warm bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="absolute top-6 right-6 text-5xl font-black text-brand-gold/10">
                  0{idx + 1}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-gold">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-brand-navy">
                  {t(`howItWorks.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {t(`howItWorks.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Experience Comparison Grid */}
      <section className="bg-brand-crema/60 py-20 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-brand-navy md:text-4xl">
              {t("chooseExperience.heading")}
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">
            {/* Premium Package */}
            <div className="flex flex-col rounded-3xl border border-brand-gold/40 bg-white p-8 shadow-sm transition-all hover:shadow-md md:p-10">
              <span className="self-start rounded-full bg-brand-crema px-4 py-1 text-xs font-semibold text-brand-gold-dark">
                {t("chooseExperience.premium.tag")}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold text-brand-navy">
                {t("chooseExperience.premium.name")}
              </h3>
              <p className="mt-2 text-sm text-text-muted">
                {t("chooseExperience.premium.description")}
              </p>

              <div className="my-8 h-px bg-brand-warm" />

              <ul className="flex-1 space-y-4">
                {[1, 2, 3, 4].map((num) => (
                  <li key={num} className="flex gap-3 text-sm text-brand-navy/90">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-gold" />
                    <span>{t(`chooseExperience.premium.bullet${num}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 text-sm font-semibold text-brand-navy">
                {t("chooseExperience.premium.bestFor")}
              </div>

              <a
                href="#call"
                className="mt-6 flex h-12 items-center justify-center rounded-xl bg-brand-navy text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-navy-light"
              >
                {t("chooseExperience.premium.cta")}
              </a>
            </div>

            {/* VIP White-Glove Package */}
            <div className="relative flex flex-col rounded-3xl border-2 border-brand-gold bg-brand-navy p-8 text-white shadow-xl md:p-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-gold px-4 py-1 text-2xs font-bold uppercase tracking-wider text-brand-navy">
                Recommended
              </div>

              <span className="self-start rounded-full bg-brand-gold/15 px-4 py-1 text-xs font-semibold text-brand-gold">
                {t("chooseExperience.vip.tag")}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold">{t("chooseExperience.vip.name")}</h3>
              <p className="mt-2 text-sm text-white/85">{t("chooseExperience.vip.description")}</p>

              <div className="my-8 h-px bg-white/10" />

              <ul className="flex-1 space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <li key={num} className="flex gap-3 text-sm text-white/90">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-gold" />
                    <span>{t(`chooseExperience.vip.bullet${num}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 text-sm font-semibold text-brand-gold">
                {t("chooseExperience.vip.bestFor")}
              </div>

              <a
                href="https://calendly.com/acastro-remax-altitud/vip-buyer-experience"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-12 items-center justify-center rounded-xl bg-brand-gold text-sm font-semibold text-brand-navy shadow-md transition-colors hover:bg-brand-gold-light"
              >
                {t("chooseExperience.vip.cta")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Buyers Choose Us Grid */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-brand-navy md:text-4xl">
              {t("whyChooseUs.heading")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">{t("whyChooseUs.subtitle")}</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {pillars.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="rounded-2xl border border-brand-warm bg-white p-6 shadow-2xs transition-all hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-brand-navy">
                  {t(`whyChooseUs.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {t(`whyChooseUs.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section — Tabbed: Calendly + Inquiry Form */}
      <VipBookingSection />
    </div>
  );
}
