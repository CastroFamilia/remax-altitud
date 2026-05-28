import type { Metadata } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SimplePageLayout } from "@/components/layout/simple-page-layout";
import { RecruitmentForm } from "@/components/lead/contact-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "JoinPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/join",
        es: "/es/join",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
}

const BENEFIT_KEYS = [1, 2, 3, 4] as const;

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <JoinPageContent />;
}

function JoinPageContent() {
  const t = useTranslations("JoinPage");
  return (
    <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
      {/* Premium Widescreen Hero Image */}
      <div className="relative mb-16 overflow-hidden rounded-2xl shadow-lg border border-brand-warm aspect-[21/9] w-full bg-brand-warm/10">
        <Image
          src="/images/join-team-hero.png"
          alt="RE/MAX Altitud Luxury Tropical Office"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/35 via-transparent to-transparent" />
      </div>

      {/* Two-Column Split Layout for Benefits and Team Collaboration */}
      <section aria-labelledby="benefits-heading" className="mx-auto max-w-5xl mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Localized Benefits List */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h2
              id="benefits-heading"
              className="text-2xl font-extrabold text-brand-navy tracking-tight mb-8 text-left md:text-3xl"
            >
              {t("benefitsHeading")}
            </h2>
            <div className="space-y-6">
              {BENEFIT_KEYS.map((n) => (
                <div key={n} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-brand-navy font-bold text-lg border border-brand-gold/30">
                    {n}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">
                      {t(`benefit${n}Title`)}
                    </h3>
                    <p className="mt-1 text-text-muted leading-relaxed">
                      {t(`benefit${n}Body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Close, Warm Collaborating Image */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl shadow-md border border-brand-warm aspect-square w-full bg-brand-warm/10">
              <Image
                src="/images/join-team-collaborating.png"
                alt="RE/MAX Altitud Warm and Close Team Collaboration"
                fill
                className="object-cover hover:scale-[1.02] transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Form Section */}
      <section aria-labelledby="join-form-heading" className="mx-auto max-w-3xl border-t border-brand-warm pt-16">
        <h2
          id="join-form-heading"
          className="text-center text-2xl font-extrabold text-brand-navy tracking-tight md:text-3xl"
        >
          {t("formHeading")}
        </h2>
        <div className="mt-10">
          <RecruitmentForm />
        </div>
      </section>
    </SimplePageLayout>
  );
}
