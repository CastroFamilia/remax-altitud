/**
 * SellPage — nueva landing de captación de propietarios (antes /vender).
 *
 * Reemplaza la landing anterior (SellerHero + SellerForm). Los videos muestran
 * "Próximamente" / "Coming soon" hasta que se les pase un videoUrl.
 *
 * El formulario se carga con SellerFormLoaderV2 (next/dynamic, ssr: false) —
 * wrapper 'use client' requerido por Turbopack (mismo patrón que PropertyGalleryLoader).
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { SellerHeroV2 } from "@/components/seller-v2/seller-hero-v2";
import { SellerPillars } from "@/components/seller-v2/seller-pillars";
import { SellerNetworkMap } from "@/components/seller-v2/seller-network-map";
import { SellerMythsVideos } from "@/components/seller-v2/seller-myths-videos";
import { SellerFormLoaderV2 } from "@/components/seller-v2/seller-form-loader-v2";
import { SellerFaqV2 } from "@/components/seller-v2/seller-faq-v2";

import { getAllAgents } from "@/lib/db/queries/agents";
import { getOfficeById } from "@/lib/db/queries/offices";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SellerPageV2.meta" });
  return {
    title: t("title"),
    description: t("description"),
    ...buildAlternatesMetadata("/sell"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
    },
  };
}

export default async function SellPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Agente para la pantalla de confirmación. try/catch para que el build continúe
  // si la base de datos no está disponible.
  let fallbackAgent: Awaited<ReturnType<typeof getAllAgents>>[0] | null = null;
  let officeName = "REMAX Altitud";
  try {
    const agents = await getAllAgents();
    fallbackAgent = agents[0] ?? null;
    const office = fallbackAgent?.officeId ? await getOfficeById(fallbackAgent.officeId) : null;
    officeName = office?.name ?? "REMAX Altitud";
  } catch (err) {
    console.error("Failed to load agents:", err);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* 1. Hero con propuesta de valor y video vertical 9:16 */}
      <SellerHeroV2 locale={locale} />

      {/* 2. Los 3 Pilares del Método Altitud */}
      <SellerPillars locale={locale} />

      {/* 3. El Poder de la Red: mapa de oficinas y +200 agentes */}
      <SellerNetworkMap locale={locale} />

      {/* 4. Derribando Mitos (videos 2 y 3) */}
      <SellerMythsVideos locale={locale} />

      {/* 5. Formulario de captación (lazy-loaded) */}
      <SellerFormLoaderV2 locale={locale} fallbackAgent={fallbackAgent} officeName={officeName} />

      {/* 6. Preguntas frecuentes con JSON-LD */}
      <SellerFaqV2 locale={locale} />
    </main>
  );
}
