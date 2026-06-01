/**
 * SellPage — Story 5.1 (AC #1, #12, #13, #14) + Story 5.2 (AC #5)
 *
 * SSG seller landing page at /{locale}/sell.
 * Follows the exact pattern of src/app/[locale]/about/page.tsx.
 * No export const dynamic = 'force-static' needed — SSG is inherited from layout's
 * generateStaticParams().
 *
 * SellerForm is lazy-loaded via SellerFormLoader (next/dynamic, ssr: false) — R-006 compliance
 * (AC #14). SellerFormLoader is a thin 'use client' wrapper following the PropertyGalleryLoader
 * pattern — required by Turbopack which enforces that dynamic(ssr:false) must live in a Client
 * Component.
 *
 * Story 5.2 adds the CMA form as a secondary CTA section below the seller form.
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { SellerHero } from "@/components/seller/seller-hero";
import { SellerFormLoader } from "@/components/seller/seller-form-loader";
import { CmaHero } from "@/components/seller/cma-hero";
import { CmaFormLoader } from "@/components/seller/cma-form-loader";
import { getAllAgents } from "@/lib/db/queries/agents";
import { getOfficeById } from "@/lib/db/queries/offices";

// ISR — revalidate every 24 hours (same cadence as agents/page.tsx)
export const revalidate = 86400;

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

  // Stub agent for confirmation screen — Story 5.3 replaces with routing logic.
  // Wrapped in try/catch so SSG build continues if DB is unavailable —
  // pages are generated on-demand via ISR fallback (same pattern as agents/page.tsx).
  let fallbackAgent: Awaited<ReturnType<typeof getAllAgents>>[0] | null = null;
  let officeName = "REMAX Altitud";
  try {
    const agents = await getAllAgents();
    fallbackAgent = agents[0] ?? null;
    const office = fallbackAgent?.officeId ? await getOfficeById(fallbackAgent.officeId) : null;
    officeName = office?.name ?? "REMAX Altitud";
  } catch {
    // DB unavailable at build time — render empty shell; ISR will populate on first request.
  }

  return (
    <main>
      <SellerHero locale={locale} />
      <SellerFormLoader locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />

      {/* CMA section — secondary CTA (Story 5.2, AC #5) */}
      <CmaHero locale={locale}>
        <CmaFormLoader locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />
      </CmaHero>
    </main>
  );
}
