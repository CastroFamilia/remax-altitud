import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ShortlistPageClient } from "@/components/shortlist/shortlist-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shortlist" });
  return {
    title: t("title"),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      languages: {
        en: "/en/shortlist",
        es: "/es/shortlist",
      },
    },
  };
}

export default async function ShortlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return (
    <Suspense>
      <ShortlistPageClient />
    </Suspense>
  );
}
