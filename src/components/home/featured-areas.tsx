import { getTranslations } from "next-intl/server";
import { getAllAreas } from "@/lib/db/queries/areas";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getAreaHeroImage } from "@/lib/utils";

interface FeaturedAreasProps {
  locale: string;
  showSectionHeader?: boolean;
}

// Technical specifications and SEO copy mapping for fallback / static rendering
const staticAreas = [
  {
    slug: "perez-zeledon",
    nameEn: "Pérez Zeledón",
    nameEs: "Pérez Zeledón",
    region: "Mountain",
    descriptionEn:
      "True mountain barefoot luxury, famous for its crystal-clear rivers, majestic waterfalls, and lush green landscapes. It offers the perfect balance: living immersed in pure nature while remaining minutes away from San Isidro de El General, the largest service hub in the south with private hospitals, banks, shopping, and top connectivity. Ideal for those seeking privacy, a refreshing high-altitude climate, and complete logistical convenience.",
    descriptionEs:
      "El verdadero lujo barefoot de montaña, famoso por sus ríos cristalinos, majestuosas cataratas y exuberantes paisajes verdes. Ofrece el equilibrio perfecto: una vida sumergida en la naturaleza pura pero con acceso inmediato a San Isidro de El General, the largest service hub in the south with private hospitals, banks, shopping, and top connectivity. Ideal for those seeking privacy, un clima fresco de altura y total comodidad logística.",
    heroImageUrl: "/images/areas/perez-zeledon-hero.webp",
    propertyCount: 0,
    metadata: {
      altitudeEn: "700 m – 1,200 m (2,300 ft – 3,900 ft)",
      altitudeEs: "700 m – 1.200 m (2.300 ft – 3.900 ft)",
      tempEn: "20°C – 28°C (68°F – 82°F)",
      tempEs: "20°C – 28°C (68°F – 82°F)",
    },
  },
  {
    slug: "dominical",
    nameEn: "Dominical",
    nameEs: "Dominical",
    region: "Coast",
    descriptionEn:
      "The epicenter of absolute oceanfront luxury, where untamed tropical rainforest meets powerful coastal rivers and world-class surf breaks. Its exclusive hillsides shelter jaw-dropping, premium architectural villas with complete privacy and infinite ocean views, while remaining just 30 minutes from major city infrastructure. The ultimate destination for high-end global investors demanding security, lush nature, and top-tier real estate appreciation.",
    descriptionEs:
      "El epicentro del lujo absoluto frente al mar, donde la selva tropical indomable se encuentra con imponentes ríos y olas de surf de clase mundial. Sus exclusivas colinas albergan impresionante villas arquitectónicas premium con total privacidad y vistas infinitas al océano, estando a solo 30 minutos de los principales servicios de la ciudad. El destino definitivo para inversionistas globales de alta gama que buscan seguridad, naturaleza exuberante y alta plusvalía.",
    heroImageUrl: "/images/areas/dominical-hero.webp",
    propertyCount: 0,
    metadata: {
      altitudeEn: "0 m – 300 m (0 ft – 1,000 ft)",
      altitudeEs: "0 m – 300 m (0 ft – 1.000 ft)",
      tempEn: "24°C – 32°C (75°F – 90°F)",
      tempEs: "24°C – 32°C (75°F – 90°F)",
    },
  },
  {
    slug: "tinamastes-platanillo",
    nameEn: "Tinamastes, Platanillo & Barú",
    nameEs: "Tinamastes, Platanillo y Barú",
    region: "Mountain",
    descriptionEn:
      "A strategic connection corridor offering the perfect climate balance: cool mountain breezes just 15 minutes from the beach. Famous for natural fresh springs, clean rivers, and spectacular waterfalls, it is the heart of sustainable living, organic farmers' markets, and communities centered on wellness and alternative education. A premium location providing total peace with rapid access to both city services and the coast.",
    descriptionEs:
      "El corredor de conexión que ofrece el balance climático perfecto: brisas frescas de montaña a solo 15 minutos de la playa. Famoso por sus nacientes de agua, ríos limpios y espectaculares cataratas, es el corazón de la vida sostenible, ferias orgánicas y comunidades enfocadas en el bienestar y la educación alternativa. Una ubicación estratégica que permite disfrutar de paz absoluta con rápido acceso tanto a los servicios de la ciudad como a la costa.",
    heroImageUrl: "/images/areas/tinamastes-platanillo-hero.webp",
    propertyCount: 0,
    metadata: {
      altitudeEn: "600 m – 900 m (2,000 ft – 3,000 ft)",
      altitudeEs: "600 m – 900 m (2.000 ft – 3.000 ft)",
      tempEn: "18°C – 26°C (64°F – 78°F)",
      tempEs: "18°C – 26°C (64°F – 78°F)",
    },
  },
  {
    slug: "uvita",
    nameEn: "Uvita & Bahía Ballena",
    nameEs: "Uvita y Bahía Ballena",
    region: "Coast",
    descriptionEn:
      "The residential and commercial powerhouse of the coast, world-famous for the Marino Ballena National Park and surrounded by mystical jungle-hidden waterfalls. It perfectly balances pristine beaches with top-tier local infrastructure, including bilingual international schools, banks, gourmet markets, and medical clinics. A high-growth area ideal for active families and high-yielding vacation rentals.",
    descriptionEs:
      "El motor residencial y comercial de la costa, famoso a nivel mundial por el Parque Nacional Marino Ballena y rodeado de místicas cascadas escondidas en la selva. Combina playas vírgenes con una excelente infraestructura local que incluye escuelas bilingües, bancos, supermercados gourmet y clínicas médicas. Es una zona de altísima demanda y crecimiento, perfecta tanto para familias activas como para rentas vacacionales de alto rendimiento.",
    heroImageUrl: "/images/areas/uvita-hero.webp",
    propertyCount: 0,
    metadata: {
      altitudeEn: "0 m – 200 m (0 ft – 650 ft)",
      altitudeEs: "0 m – 200 m (0 ft – 650 ft)",
      tempEn: "24°C – 32°C (75°F – 90°F)",
      tempEs: "24°C – 32°C (75°F – 90°F)",
    },
  },
  {
    slug: "ojochal",
    nameEn: "Ojochal & Coronado",
    nameEs: "Ojochal y Coronado",
    region: "Coast",
    descriptionEn:
      "A discreet and sophisticated residential sanctuary, celebrated for its high-end international culinary scene, pristine rivers, and absolute jungle privacy. Its lush elevations hide exclusive luxury estates boasting spectacular views of the ocean, dramatic mountain walls, and protected mangroves. Designed for those seeking a peaceful, secure, and upscale lifestyle with easy access to coastal services.",
    descriptionEs:
      "Un santuario residencial discreto y sofisticado, célebre por su alta gastronomía internacional, ríos prístinos y absoluta privacidad en la selva. Sus frondosas colinas resguardan exclusivas propiedades de lujo con vistas espectaculares al océano, imponentes cadenas montañosas y manglares protegidos. Diseñado para quienes buscan un ritmo de vida pacífico, seguro y exclusivo, con fácil acceso a los servicios esenciales de la zona costera.",
    heroImageUrl: "/images/areas/ojochal-hero.webp",
    propertyCount: 0,
    metadata: {
      altitudeEn: "0 m – 400 m (0 ft – 1,300 ft)",
      altitudeEs: "0 m – 400 m (0 ft – 1.300 ft)",
      tempEn: "23°C – 31°C (73°F – 88°F)",
      tempEs: "23°C – 31°C (73°F – 88°F)",
    },
  },
];

export async function FeaturedAreas({ locale, showSectionHeader = true }: FeaturedAreasProps) {
  const t = await getTranslations({ locale, namespace: "HomePage.areaHighlights" });
  const tGlobal = await getTranslations({ locale, namespace: "AreaGuide" });

  let fetchedAreas: Awaited<ReturnType<typeof getAllAreas>> = [];
  try {
    fetchedAreas = await getAllAreas();
  } catch {
    // Database is offline or local dev without PostgreSQL — fallback gracefully
  }

  // Map database structures or fallback structures cleanly
  const areasList = staticAreas.map((staticArea) => {
    const dbArea = fetchedAreas.find((a) => a.slug === staticArea.slug);

    // Coalesce values prioritizing DB data when available
    const name =
      locale === "es" ? dbArea?.nameEs || staticArea.nameEs : dbArea?.nameEn || staticArea.nameEn;
    const description =
      locale === "es"
        ? dbArea?.descriptionEs || staticArea.descriptionEs
        : dbArea?.descriptionEn || staticArea.descriptionEn;
    const region = dbArea?.region || staticArea.region;
    const heroImageUrl = getAreaHeroImage(dbArea?.heroImageUrl || staticArea.heroImageUrl, region);
    const propertyCount = dbArea?.propertyCount || 0;

    // Gracefully handle database JSONB metadata typing
    const dbMeta = dbArea?.metadata as Record<string, string> | undefined;
    const altitude =
      locale === "es"
        ? dbMeta?.altitudeEs || staticArea.metadata.altitudeEs
        : dbMeta?.altitudeEn || staticArea.metadata.altitudeEn;
    const temperature =
      locale === "es"
        ? dbMeta?.tempEs || staticArea.metadata.tempEs
        : dbMeta?.tempEn || staticArea.metadata.tempEn;

    return {
      slug: staticArea.slug,
      name,
      description,
      region,
      heroImageUrl,
      propertyCount,
      altitude,
      temperature,
    };
  });

  return (
    <section
      data-testid="featured-areas"
      aria-labelledby="featured-areas-heading"
      className="scroll-mt-16"
    >
      {/* Section Header */}
      {showSectionHeader && (
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div className="max-w-2xl">
            <h2
              id="featured-areas-heading"
              className="text-3xl font-bold tracking-tight text-brand-navy md:text-4xl"
            >
              {t("heading")}
            </h2>
            <p className="mt-2 text-sm text-text-secondary md:text-base leading-relaxed">
              {t("description")}
            </p>
          </div>
        </div>
      )}

      {/* Grid of Areas: Horizontal Scroll on Mobile, 5 Columns Grid on Large Screens */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:pb-0">
        {areasList.map((area) => {
          const isMountain = area.region === "Mountain";

          // Regional gradients used as premium fallbacks behind the actual image overlay
          const fallbackGradient = isMountain
            ? "linear-gradient(135deg, #1e3525 0%, #2e4d37 100%)"
            : "linear-gradient(135deg, #0b1a28 0%, #152f46 100%)";

          return (
            <Link
              key={area.slug}
              href={`/${locale}/areas/${area.slug}`}
              className="group relative flex aspect-[3/4] w-[78%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-xl shadow-md transition-all duration-300 ease-out hover:translate-y-[-6px] hover:shadow-xl lg:w-auto"
            >
              {/* Background gradient fallback */}
              <div
                className="absolute inset-0 -z-20 h-full w-full"
                style={{ background: fallbackGradient }}
              />

              {/* Background Hero Image */}
              {area.heroImageUrl && (
                <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden transition-transform duration-700 ease-out group-hover:scale-108">
                  <Image
                    src={area.heroImageUrl}
                    alt={area.name}
                    fill
                    className="object-cover opacity-75 transition-opacity duration-300 group-hover:opacity-85"
                    sizes="(max-width: 768px) 80vw, (max-width: 1024px) 33vw, 20vw"
                    priority={area.slug === "perez-zeledon" || area.slug === "dominical"}
                  />
                </div>
              )}

              {/* Bottom Navy Gradient Shield (Legibility Layer) */}
              <div
                className="absolute inset-0 -z-10 h-full w-full transition-opacity duration-300 group-hover:opacity-95"
                style={{
                  background:
                    "linear-gradient(to top, rgba(11, 30, 67, 0.95) 0%, rgba(11, 30, 67, 0.6) 45%, rgba(11, 30, 67, 0.1) 80%, transparent 100%)",
                }}
              />

              {/* Card Badge: Region */}
              <span
                className={`absolute left-3 top-3 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border transition-colors duration-300 ${
                  isMountain
                    ? "bg-[#233428]/95 border-[#C2A661]/35 group-hover:bg-[#C2A661] group-hover:text-brand-navy"
                    : "bg-[#183C5A]/95 border-[#D9C39B]/35 group-hover:bg-[#D9C39B] group-hover:text-brand-navy"
                }`}
              >
                {tGlobal(`region.${isMountain ? "Mountain" : "Coast"}`)}
              </span>

              {/* Property Count Tag (top-right overlay) */}
              {area.propertyCount > 0 && (
                <span className="absolute right-3 top-3 rounded bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-xs">
                  {tGlobal("propertyCount", { count: area.propertyCount })}
                </span>
              )}

              {/* Content Panel */}
              <div className="p-4 md:p-5 flex flex-col justify-end text-white">
                {/* Title */}
                <h3 className="text-lg md:text-xl font-bold tracking-tight text-white group-hover:text-[#C2A661] transition-colors duration-300 line-clamp-2">
                  {area.name}
                </h3>

                {/* Localized stats row */}
                <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-semibold text-white/80">
                  {/* Altitude Spec */}
                  {area.altitude && (
                    <div className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 backdrop-blur-md border border-white/5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3 text-[#C2A661]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.661 2.232a.75.75 0 0 1 .678 0l8 4.5A.75.75 0 0 1 18 7.38v5.24a.75.75 0 0 1-.339.626l-8 4.5a.75.75 0 0 1-.678 0l-8-4.5A.75.75 0 0 1 1 12.62V7.38a.75.75 0 0 1 .339-.626l8-4.5ZM9 4.195V10.25a.75.75 0 0 0 .375.65l5.125 2.883v-4.54L9 4.196Zm-1 0L2.875 9.243v4.54L8 10.9v-6.705Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{area.altitude}</span>
                    </div>
                  )}

                  {/* Temperature Spec */}
                  {area.temperature && (
                    <div className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 backdrop-blur-md border border-white/5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3 w-3 text-[#C2A661]"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2a.75.75 0 0 1 .75.75v1.272a3.501 3.501 0 0 1 2.5 3.228v2.766c0 .427.12.845.344 1.207l1.09 1.761a2.25 2.25 0 0 1-1.916 3.435H7.332a2.25 2.25 0 0 1-1.916-3.435l1.09-1.761c.224-.362.344-.78.344-1.207V7.25A3.501 3.501 0 0 1 9.25 4.022V2.75A.75.75 0 0 1 10 2ZM8.5 7.25v2.766c0 .653-.183 1.292-.527 1.847l-1.09 1.761a.75.75 0 0 0 .639 1.145h8.956a.75.75 0 0 0 .639-1.145l-1.09-1.761a3.42 3.42 0 0 1-.527-1.847V7.25a2 2 0 0 0-4 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{area.temperature}</span>
                    </div>
                  )}
                </div>

                {/* Description Snippet */}
                <p className="mt-3 text-xs leading-relaxed text-white/90 line-clamp-3 font-medium">
                  {area.description}
                </p>

                {/* CTA Link */}
                <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold tracking-wide text-[#C2A661] uppercase transition-all duration-300 group-hover:translate-x-1 group-hover:text-white">
                  {t("explore")}
                  <span className="font-bold">→</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
