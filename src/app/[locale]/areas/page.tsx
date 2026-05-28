import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllAreas } from "@/lib/db/queries/areas";
import { generateBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { buildAlternatesMetadata } from "@/lib/seo/metadata";
import { AreaIndexCard } from "@/components/area/area-index-card";
import { FeaturedAreas } from "@/components/home/featured-areas";

/**
 * Area Index Page — SSG (no ISR)
 *
 * Lists all available areas with hero cards (AC #7, FR18).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AreaGuide" });

  return {
    title: t("index.meta.title"),
    description: t("index.meta.description"),
    alternates: { ...buildAlternatesMetadata("/areas") },
    openGraph: {
      title: t("index.meta.title"),
      description: t("index.meta.description"),
      type: "website",
    },
  };
}

export default async function AreasIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "AreaGuide" });

  // Wrapped in try/catch so the build succeeds without a live DB connection.
  // At runtime, the DB will be available and areas will load normally.
  let areas: Awaited<ReturnType<typeof getAllAreas>> = [];
  try {
    areas = await getAllAreas();
  } catch {
    // DB unavailable — render empty grid (CI build with dummy DATABASE_URL)
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: locale === "es" ? "Inicio" : "Home", href: `/${locale}`, position: 1 },
    { name: t("index.title"), href: `/${locale}/areas`, position: 2 },
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      {/* Page header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-brand-navy md:text-5xl">{t("index.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">{t("index.description")}</p>
      </div>

      {/* Premium Featured Showcase */}
      <div className="border-b border-border pb-12">
        <FeaturedAreas locale={locale} showSectionHeader={false} />
      </div>

      {/* Complete Area Directory */}
      <div>
        <h2 className="text-2xl font-bold text-brand-navy mb-8">
          {locale === "es" ? "Directorio Completo de Zonas" : "Complete Areas Directory"}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <AreaIndexCard key={area.slug} area={area} locale={locale} />
          ))}
        </div>
      </div>
    </main>
  );
}
