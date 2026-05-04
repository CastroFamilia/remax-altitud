/**
 * SellPage — Story 5.1 (AC #1, #12, #13, #14)
 *
 * SSG seller landing page at /{locale}/sell.
 * Follows the exact pattern of src/app/[locale]/about/page.tsx.
 * No export const dynamic = 'force-static' needed — SSG is inherited from layout's
 * generateStaticParams().
 *
 * SellerForm is lazy-loaded via next/dynamic (ssr: false) — R-006 compliance (AC #14).
 * SellerFormSkeleton is shown while the form lazy-loads.
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import dynamic from "next/dynamic";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { SellerHero } from "@/components/seller/seller-hero";
import { SellerFormSkeleton } from "@/components/seller/seller-form-skeleton";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getOfficeById } from "@/lib/db/queries/offices";

// Lazy-loaded SellerForm — ~15KB, NOT in main bundle (R-006, AC #14)
const SellerForm = dynamic(
  () => import("@/components/seller/seller-form").then((m) => m.SellerForm),
  { ssr: false, loading: () => <SellerFormSkeleton /> },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SellerPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    ...buildAlternatesMetadata("/sell"),
    openGraph: {
      title: t("meta.ogTitle"),
      description: t("meta.ogDescription"),
      type: "website",
    },
  };
}

export default async function SellPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Stub agent for confirmation screen — Story 5.3 replaces with routing logic
  const agents = await getAllAgents();
  const fallbackAgent = agents[0] ?? null;

  // Resolve office name for confirmation screen
  const office = fallbackAgent?.officeId ? await getOfficeById(fallbackAgent.officeId) : null;
  const officeName = office?.name ?? "RE/MAX Altitud";

  return (
    <main>
      <SellerHero locale={locale} />
      <SellerForm locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />
    </main>
  );
}
