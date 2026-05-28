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
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-3xl font-bold mb-4 text-brand-navy">{t("expiredTitle")}</h1>
        <p className="text-muted-foreground mb-8">{t("expiredMessage")}</p>
        <Link
          href={`/${locale}/search`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-8 shadow-md transition-colors"
        >
          {t("browseCta")}
        </Link>
      </div>
    );
  }

  return (
    <Suspense>
      <SharedShortlistPageClient properties={data.properties} />
    </Suspense>
  );
}
