import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSharedShortlist } from "@/app/actions/shortlist-actions";
import { SharedShortlistPageClient } from "@/components/shortlist/shared-shortlist-page-client";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shortlist" });
  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharedShortlistPage({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>;
}) {
  const { locale, shareId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Shortlist" });

  const data = await getSharedShortlist(shareId);

  if (!data) {
    notFound();
  }

  if (data.isExpired) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-brand-warm p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-brand-burgundy/10 text-brand-burgundy flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl" role="img" aria-label="hourglass">
              ⏳
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-brand-navy tracking-tight">
            {t("expiredTitle")}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-8 leading-relaxed">
            {t("expiredMessage")}
          </p>
          <Link
            href={`/${locale}/search`}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-navy text-white font-semibold hover:bg-brand-navy-light shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            {t("browseCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense>
      <SharedShortlistPageClient properties={data.properties} />
    </Suspense>
  );
}
