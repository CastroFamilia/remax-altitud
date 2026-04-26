import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return {
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
