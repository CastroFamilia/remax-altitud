import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SearchPage" });

  return {
    title: t("title"),
    description: t("description"),
    // Search is filter-shareable but must NOT be indexed (Architecture URL Strategy).
    robots: { index: false, follow: false },
  };
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
