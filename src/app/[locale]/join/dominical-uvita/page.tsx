import type { Metadata } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecruitmentForm } from "@/components/lead/contact-form";
import { SmoothScrollLink } from "@/components/ui/smooth-scroll-link";
import { offices } from "@/lib/constants/offices";
import {
  Globe,
  Smartphone,
  Landmark,
  Compass,
  Car,
  Languages,
  Clock,
  ShieldCheck,
  WifiOff,
  KanbanSquare,
  Sparkles,
  FileText,
  MapPin,
  Phone,
  Mail,
  ArrowDown,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "JoinDominicalUvitaPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/join/dominical-uvita",
        es: "/es/join/dominical-uvita",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
      images: [
        {
          url: "/images/office-dominical.jpg",
          width: 1200,
          height: 630,
          alt: "REMAX Altitud Cero — Dominical / Uvita",
        },
      ],
    },
  };
}

export default async function JoinDominicalUvitaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <JoinDominicalUvitaContent />;
}

function JoinDominicalUvitaContent() {
  const t = useTranslations("JoinDominicalUvitaPage");
  const dominicalOffice =
    offices.find((o) => o.location.toLowerCase().includes("dominical")) || offices[1];

  return (
    <div className="min-h-screen bg-bg-light text-text-primary">
      {/* 1. Hero Section */}
      <section className="relative min-h-[620px] flex items-center justify-center overflow-hidden bg-brand-navy py-20 text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/areas/uvita-hero.webp"
            alt="Costa Ballena, Dominical and Uvita coastline"
            fill
            priority
            className="object-cover opacity-25"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/90 via-brand-navy/80 to-brand-navy" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-gold shadow-sm backdrop-blur-sm sm:text-sm">
            <Sparkles className="h-4 w-4" />
            {t("heroBadge")}
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-tight">
            {t("heroTitle")}
          </h1>

          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto font-normal leading-relaxed md:text-xl">
            {t("heroSubtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <SmoothScrollLink
              href="#apply"
              className="inline-flex items-center justify-center rounded-lg bg-brand-gold px-8 py-4 font-bold text-brand-navy shadow-lg transition-all duration-200 hover:bg-brand-gold/90 hover:scale-[1.02]"
            >
              {t("heroCta")}
              <ArrowDown className="ml-2 h-4 w-4" />
            </SmoothScrollLink>
            <SmoothScrollLink
              href="#advantage"
              className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 py-4 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              {t("heroSecondaryCta")}
            </SmoothScrollLink>
          </div>
        </div>
      </section>

      {/* 2. Reality Check Callout */}
      <section className="relative z-20 -mt-10 container mx-auto max-w-4xl px-4">
        <div className="rounded-2xl border border-brand-gold/30 bg-white p-6 shadow-xl md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-navy">
              <ShieldCheck className="h-6 w-6 text-brand-navy" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                {t("realityCheckBadge")}
              </span>
              <h2 className="mt-1 text-xl font-extrabold text-brand-navy md:text-2xl">
                {t("realityCheckTitle")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-text-muted">
                {t("realityCheckBody")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Altitud Cero Advantage */}
      <section id="advantage" className="container mx-auto max-w-6xl px-4 py-20 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
            {t("whyUsHeading")}
          </h2>
          <p className="mt-4 text-lg text-text-muted">{t("whyUsIntro")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-brand-warm bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy mb-5">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">{t("pillar1Title")}</h3>
            <p className="mt-3 text-text-muted leading-relaxed">{t("pillar1Body")}</p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-brand-warm bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-navy mb-5">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">{t("pillar2Title")}</h3>
            <p className="mt-3 text-text-muted leading-relaxed">{t("pillar2Body")}</p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-brand-warm bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy mb-5">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">{t("pillar3Title")}</h3>
            <p className="mt-3 text-text-muted leading-relaxed">{t("pillar3Body")}</p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-2xl border border-brand-warm bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-navy mb-5">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-navy">{t("pillar4Title")}</h3>
            <p className="mt-3 text-text-muted leading-relaxed">{t("pillar4Body")}</p>
          </div>
        </div>
      </section>

      {/* 4. TheHub CRM Spotlight */}
      <section className="bg-brand-navy text-white py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold">
              <Smartphone className="h-3.5 w-3.5" />
              {t("theHubBadge")}
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
              {t("theHubHeading")}
            </h2>
            <p className="mt-4 text-lg text-white/75">{t("theHubIntro")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-brand-navy mb-4 font-bold">
                <WifiOff className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">{t("hub1Title")}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{t("hub1Body")}</p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-brand-navy mb-4 font-bold">
                <KanbanSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">{t("hub2Title")}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{t("hub2Body")}</p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-brand-navy mb-4 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">{t("hub3Title")}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{t("hub3Body")}</p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold text-brand-navy mb-4 font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">{t("hub4Title")}</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{t("hub4Body")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Physical Office & Dominical Presence */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-2xl border border-brand-warm shadow-xl aspect-[4/3] w-full bg-brand-warm/20">
              <Image
                src="/images/office-dominical.jpg"
                alt="REMAX Altitud Cero Dominical Office"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="lg:col-span-6">
            <span className="inline-block rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-navy mb-3">
              {t("officeTag")}
            </span>
            <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
              {t("officeHeading")}
            </h2>
            <p className="mt-2 text-lg font-medium text-brand-gold">{t("officeSubheading")}</p>
            <p className="mt-4 text-base text-text-muted leading-relaxed">{t("officeBody")}</p>

            <div className="mt-8 space-y-3 border-t border-brand-warm pt-6">
              <div className="flex items-start gap-3 text-sm text-brand-navy">
                <MapPin className="h-5 w-5 shrink-0 text-brand-gold mt-0.5" />
                <span>{dominicalOffice.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-navy">
                <Phone className="h-5 w-5 shrink-0 text-brand-gold" />
                <a href={`tel:${dominicalOffice.phone}`} className="hover:underline">
                  {dominicalOffice.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-navy">
                <Mail className="h-5 w-5 shrink-0 text-brand-gold" />
                <a href={`mailto:${dominicalOffice.email}`} className="hover:underline">
                  {dominicalOffice.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. What We Look For */}
      <section className="bg-bg-cream/60 border-y border-brand-warm/50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
              {t("requirementsHeading")}
            </h2>
            <p className="mt-4 text-lg text-text-muted">{t("requirementsIntro")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-xl border border-brand-warm bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy mb-4">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">{t("reqCarTitle")}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">{t("reqCarBody")}</p>
            </div>

            <div className="rounded-xl border border-brand-warm bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-navy mb-4">
                <Languages className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">{t("reqLangTitle")}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">{t("reqLangBody")}</p>
            </div>

            <div className="rounded-xl border border-brand-warm bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">{t("reqFocusTitle")}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">{t("reqFocusBody")}</p>
            </div>

            <div className="rounded-xl border border-brand-warm bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/20 text-brand-navy mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-brand-navy">{t("reqIntegrityTitle")}</h3>
              <p className="mt-2 text-sm text-text-muted leading-relaxed">
                {t("reqIntegrityBody")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Application Form Section */}
      <section id="apply" className="container mx-auto max-w-4xl px-4 py-20 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
            {t("formSectionHeading")}
          </h2>
          <p className="mt-4 text-base text-text-muted leading-relaxed">{t("formSectionIntro")}</p>
          <p className="mt-2 text-xs font-medium text-brand-gold uppercase tracking-wider">
            {t("formNote")}
          </p>
        </div>

        <div className="rounded-2xl border border-brand-warm bg-white p-6 shadow-lg md:p-10">
          <RecruitmentForm defaultArea="dom" hideAreaSelect hideFinancial />
        </div>
      </section>
    </div>
  );
}
