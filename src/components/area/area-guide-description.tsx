import { getTranslations } from "next-intl/server";
import type { Area } from "@/lib/db/schema/areas";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Plane,
  Bus,
  Activity,
  CreditCard,
  ShoppingBag,
  GraduationCap,
} from "lucide-react";

interface DescriptionMetadata {
  nearestAirport?: string;
  nearestHospital?: string;
  nearestBeach?: string;
  [key: string]: unknown;
}

interface AreaGuideDescriptionProps {
  area: Area;
  locale: string;
}

/**
 * AreaGuideDescription — Server Component (AC #2)
 *
 * Renders the lifestyle narrative and everyday services.
 * Equipped with a premium block parser that transforms structural database text
 * into beautiful responsive components.
 */
export async function AreaGuideDescription({ area, locale }: AreaGuideDescriptionProps) {
  const description = locale === "es" ? area.descriptionEs : area.descriptionEn;
  const metadata = area.metadata as DescriptionMetadata | null;
  const t = await getTranslations({ locale, namespace: "AreaGuide" });

  const blocks = description
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <section
      data-testid="area-guide-description"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12"
    >
      {/* Dynamic Content Block Parser */}
      <div className="prose prose-lg max-w-none text-text-muted space-y-8">
        {blocks.map((block, idx) => {
          // 1. Heading H3
          if (block.startsWith("### ")) {
            return (
              <h3
                key={idx}
                className="text-2xl font-bold text-brand-navy pt-6 pb-2 border-b border-border/60"
              >
                {block.replace("### ", "")}
              </h3>
            );
          }

          // 1.5. Heading H4
          if (block.startsWith("#### ")) {
            return (
              <h4 key={idx} className="text-xl font-bold text-brand-navy pt-4 pb-1">
                {block.replace("#### ", "")}
              </h4>
            );
          }

          // 2. Heading H2
          if (block.startsWith("## ")) {
            return (
              <h2
                key={idx}
                className="text-3xl font-extrabold text-brand-navy pt-8 pb-3 border-b-2 border-brand-gold/20"
              >
                {block.replace("## ", "")}
              </h2>
            );
          }

          // 3. Custom services card list token
          if (block === "[SERVICES_LIST]") {
            return <ServicesList key={idx} locale={locale} areaSlug={area.slug} />;
          }

          // 4. Custom cardinal compass visual map token
          if (block === "[CARDINAL_MAP]") {
            return <CardinalMap key={idx} locale={locale} areaSlug={area.slug} />;
          }

          // 5. Custom cardinal cards detailed sectors token
          if (block === "[CARDINAL_CARDS]") {
            return <CardinalCards key={idx} locale={locale} areaSlug={area.slug} />;
          }

          // 5.5. Custom pricing table token
          if (block === "[PRICING_TABLE]") {
            return <PricingTable key={idx} locale={locale} />;
          }

          // 6. Custom high-converting properties search CTA token
          if (block === "[CTA_BUTTON]") {
            return <CtaButton key={idx} locale={locale} areaSlug={area.slug} />;
          }

          // Default: Paragraph and list elements with advanced parsing
          return (
            <div
              key={idx}
              className="leading-relaxed text-text-primary text-[17px] space-y-4"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block) }}
            />
          );
        })}
      </div>

      {/* Nearest services quick metrics grid */}
      {metadata &&
        (metadata.nearestAirport || metadata.nearestHospital || metadata.nearestBeach) && (
          <div className="pt-8 border-t border-border/40">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-navy/60 mb-4">
              {locale === "es" ? "DISTANCIAS Y SERVICIOS DIRECTOS" : "DIRECT DISTANCES & LOGISTICS"}
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metadata.nearestAirport && (
                <ServiceMetricItem
                  icon="✈️"
                  label={t("nearestServices.airport")}
                  value={metadata.nearestAirport}
                />
              )}
              {metadata.nearestHospital && (
                <ServiceMetricItem
                  icon="🏥"
                  label={t("nearestServices.hospital")}
                  value={metadata.nearestHospital}
                />
              )}
              {metadata.nearestBeach && (
                <ServiceMetricItem
                  icon="🏖️"
                  label={t("nearestServices.beach")}
                  value={metadata.nearestBeach}
                />
              )}
            </div>
          </div>
        )}
    </section>
  );
}

/** Helper to parse standard bold `**text**` and list inline markers */
function formatInlineMarkdown(text: string): string {
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const content = trimmed.replace(/^[*+-]\s+/, "");
      return `<li class="ml-6 list-disc text-text-primary text-[17px] mb-2">${formatInlineMarkdownHelper(content)}</li>`;
    }
    return `<p class="leading-relaxed text-text-primary text-[17px] mb-4">${formatInlineMarkdownHelper(line)}</p>`;
  });

  // Wrap consecutive list items in <ul>
  let html = "";
  let inList = false;

  for (const line of processedLines) {
    if (line.startsWith("<li")) {
      if (!inList) {
        html += `<ul class="my-4 space-y-1">`;
        inList = true;
      }
      html += line;
    } else {
      if (inList) {
        html += `</ul>`;
        inList = false;
      }
      html += line;
    }
  }
  if (inList) {
    html += `</ul>`;
  }
  return html;
}

function formatInlineMarkdownHelper(text: string): string {
  return text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-brand-navy">$1</strong>',
  );
}

/** 1. Travel Logistics & everyday services component */
function ServicesList({ locale, areaSlug }: { locale: string; areaSlug: string }) {
  const isEs = locale === "es";

  const perezZeledonServices = [
    {
      title: isEs ? "Acceso Aéreo Premium" : "Premium Aviation Access",
      desc: isEs
        ? "Cuenta con el Aeropuerto de Pérez Zeledón para vuelos domésticos y chárter, además de exclusivas pistas privadas en el valle."
        : "Features the fully operational Pérez Zeledón Airport for domestic and charter flights, plus exclusive private valley airstrips.",
      icon: Plane,
    },
    {
      title: isEs ? "Tránsito Público Confiable" : "Reliable Public Transit",
      desc: isEs
        ? "Excelente conectividad terrestre con cómodos autobuses directos saliendo cada 30 minutos directo a la capital San José."
        : "Excellent highway connection with comfortable, direct public buses departing every 30 minutes straight to San José.",
      icon: Bus,
    },
    {
      title: isEs ? "Salud de Primer Nivel" : "Top-Tier Healthcare",
      desc: isEs
        ? "Acceso a clínicas médicas privadas modernas, médicos especialistas y el hospital regional principal."
        : "Access to modern private medical clinics, specialized doctors, and the major regional hospital.",
      icon: Activity,
    },
    {
      title: isEs ? "Educación Privada Premium" : "Premium Private Education",
      desc: isEs
        ? "El valle es un centro en crecimiento para la educación de alta calidad, que cuenta con BMS (Bilingual Multidisciplinary School), una academia privada K-12 de primer nivel respaldada por el Ministerio de Educación Pública que ofrece programas académicos, artísticos y de robótica, junto con modelos alternativos innovadores como la escuela de inspiración Waldorf RISE para un aprendizaje experiencial basado en la naturaleza en preescolar y primaria."
        : "The valley is a growing hub for high-quality education; featuring BMS (Bilingual Multidisciplinary School), a top-rated private K-12 academy endorsed by the Ministry of Public Education offering academic, artistic, and robotics programs, alongside innovative alternative models like the RISE Waldorf-inspired school for experiential, nature-based early childhood and elementary learning.",
      icon: GraduationCap,
    },
    {
      title: isEs ? "Servicios Financieros y Profesionales" : "Financial & Professional Services",
      desc: isEs
        ? "Bancos nacionales e internacionales, oficinas legales de prestigio e infraestructura de internet de fibra óptica de alta velocidad."
        : "National and international banks, legal offices, and high-speed fiber-optic internet infrastructure.",
      icon: CreditCard,
    },
    {
      title: isEs ? "Comercio y Alta Cocina" : "Commerce & Gastronomy",
      desc: isEs
        ? "Modernos centros comerciales, supermercados premium, la colorida Feria del Productor y una vibrante oferta culinaria."
        : "Modern shopping complexes, well-stocked supermarkets, organic farmers' market (Feria), and a growing fine dining scene.",
      icon: ShoppingBag,
    },
  ];

  const dominicalServices = [
    {
      title: isEs ? "Carretera Costanera" : "The Costanera Highway",
      desc: isEs
        ? "Una autopista costera de clase mundial completamente pavimentada que conecta directamente con aeropuertos regionales y centros urbanos."
        : "A fully paved, world-class coastal highway linking you directly to regional airports, pristine beaches, and neighboring hubs.",
      icon: Plane,
    },
    {
      title: isEs ? "Acceso Rápido a la Ciudad" : "Rapid City Access",
      desc: isEs
        ? "A tan solo 1 hora de San Isidro de El General, brindando acceso inmediato a hospitales privados, bancos y servicios urbanos."
        : "Situated just 1 hour away from San Isidro de El General, allowing instant access to private hospitals, international banks, and major services.",
      icon: Bus,
    },
    {
      title: isEs ? "Alquileres de Alto Rendimiento" : "High-Yield Vacation Rentals",
      desc: isEs
        ? "Gracias a su reputación internacional, las propiedades en Dominical generan algunas de las tarifas nocturnas y niveles de ocupación más altos de Centroamérica."
        : "Because of its elite reputation, Dominical properties command some of the highest nightly rental rates and occupancy percentages in Central America.",
      icon: CreditCard,
    },
  ];

  const services = areaSlug === "dominical" ? dominicalServices : perezZeledonServices;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
      {services.map((srv, idx) => {
        const IconComponent = srv.icon;
        return (
          <div
            key={idx}
            className="flex flex-col p-6 rounded-2xl border border-border/60 bg-gradient-to-br from-background to-secondary/10 shadow-sm hover:shadow-md hover:border-brand-gold/30 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-brand-navy/5 text-brand-navy border border-brand-navy/10 group-hover:bg-brand-navy group-hover:text-white transition-colors duration-300">
                <IconComponent className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[17px] text-brand-navy leading-tight">{srv.title}</h4>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed flex-grow">{srv.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

/** 2. Cardinal directions interactive responsive compass grid */
function CardinalMap({ locale, areaSlug }: { locale: string; areaSlug: string }) {
  const isEs = locale === "es";

  if (areaSlug === "dominical") {
    return (
      <div className="my-10 relative">
        {/* Desktop compass visual grid */}
        <div className="hidden lg:grid grid-cols-3 gap-6 items-center justify-center max-w-4xl mx-auto p-8 rounded-3xl bg-brand-navy/5 border border-border/50 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-80 h-80 rounded-full border-4 border-dashed border-brand-gold/30 animate-[spin_180s_linear_infinite]" />
          </div>

          {/* ROW 1: North */}
          <div className="col-start-2 flex flex-col items-center">
            <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
                ▲ {isEs ? "NORTE" : "NORTH"}
              </span>
              <h4 className="font-semibold text-brand-navy text-sm">Upper Escaleras & Costaña</h4>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {isEs
                  ? "Fincas de ultra lujo, helipuertos, vistas de 180° al mar"
                  : "Ultra-Luxury Estates, helipads, 180° ocean views"}
              </p>
            </div>
            <div className="w-0.5 h-8 bg-gradient-to-b from-brand-gold/45 to-transparent mt-2" />
          </div>

          {/* ROW 2: West | Center (Dominical) | East */}
          {/* West */}
          <div className="flex items-center">
            <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
                {isEs ? "OESTE" : "WEST"} ◀
              </span>
              <h4 className="font-semibold text-brand-navy text-sm">Lagunas Mountain Ridge</h4>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {isEs
                  ? "Alturas frescas, naturaleza virgen, cascadas"
                  : "Cool altitudes, pristine jungle, waterfalls"}
              </p>
            </div>
            <div className="w-8 h-0.5 bg-gradient-to-r from-brand-gold/45 to-transparent ml-2" />
          </div>

          {/* Center Compass Needle */}
          <div className="flex flex-col items-center justify-center p-6 rounded-full bg-brand-navy border-4 border-brand-gold text-white text-center w-44 h-44 mx-auto shadow-2xl relative z-10">
            <Compass className="w-8 h-8 text-brand-gold animate-[pulse_4s_ease-in-out_infinite]" />
            <span className="text-[10px] font-bold tracking-widest text-brand-gold/80 mt-2 block">
              {isEs ? "PORTAL COSTEÑO" : "COASTAL HUB"}
            </span>
            <span className="text-xs font-extrabold leading-tight mt-1">Dominical Centro</span>
          </div>

          {/* East */}
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-l from-brand-gold/45 to-transparent mr-2" />
            <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
                ▶ {isEs ? "ESTE" : "EAST"}
              </span>
              <h4 className="font-semibold text-brand-navy text-sm">Dulce Pacífico & Élan</h4>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {isEs
                  ? "Obras maestras inmobiliarias planificadas"
                  : "Master-planned residential masterpieces"}
              </p>
            </div>
          </div>

          {/* ROW 3: South */}
          <div className="col-start-2 flex flex-col items-center">
            <div className="w-0.5 h-8 bg-gradient-to-t from-brand-gold/45 to-transparent mb-2" />
            <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
                ▼ {isEs ? "SUR" : "SOUTH"}
              </span>
              <h4 className="font-semibold text-brand-navy text-sm">Dominicalito Bay</h4>
              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                {isEs
                  ? "Aguas tranquilas, fondeo de botes, villas personalizadas"
                  : "Calm waters, boat anchorage, custom villas"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile stacked visual list */}
        <div className="grid grid-cols-2 gap-4 lg:hidden max-w-lg mx-auto">
          <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
            <span className="text-xs font-bold text-brand-gold block">
              ▲ {isEs ? "NORTE" : "NORTH"}
            </span>
            <h4 className="font-bold text-brand-navy text-sm mt-1">Upper Escaleras</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-tight">
              {isEs ? "Ultra-lujo, mar" : "Ultra-luxury modern villas"}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
            <span className="text-xs font-bold text-brand-gold block">
              ▶ {isEs ? "ESTE" : "EAST"}
            </span>
            <h4 className="font-bold text-brand-navy text-sm mt-1">Dulce & Élan</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-tight">
              {isEs ? "Master-planned" : "Condos & developments"}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
            <span className="text-xs font-bold text-brand-gold block">
              ▼ {isEs ? "SUR" : "SOUTH"}
            </span>
            <h4 className="font-bold text-brand-navy text-sm mt-1">Dominicalito</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-tight">
              {isEs ? "Bahía tranquila" : "Calm bay & anchorages"}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
            <span className="text-xs font-bold text-brand-gold block">
              ◀ {isEs ? "OESTE" : "WEST"}
            </span>
            <h4 className="font-bold text-brand-navy text-sm mt-1">Lagunas</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-tight">
              {isEs ? "Bosque, manantiales" : "Cool elevations & springs"}
            </p>
          </div>
          <div className="col-span-2 p-3 rounded-xl bg-brand-navy text-white text-center text-xs font-semibold shadow-inner">
            📍 {isEs ? "Núcleo Central: Dominical Centro" : "Central Hub: Dominical Centro"}
          </div>
        </div>
      </div>
    );
  }

  // Fallback to Pérez Zeledón
  return (
    <div className="my-10 relative">
      {/* Desktop compass visual grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6 items-center justify-center max-w-4xl mx-auto p-8 rounded-3xl bg-brand-navy/5 border border-border/50 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-80 h-80 rounded-full border-4 border-dashed border-brand-gold/30 animate-[spin_180s_linear_infinite]" />
        </div>

        {/* ROW 1: North */}
        <div className="col-start-2 flex flex-col items-center">
          <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
              ▲ {isEs ? "NORTE" : "NORTH"}
            </span>
            <h4 className="font-semibold text-brand-navy text-sm">Rivas & San Gerardo</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-snug">
              {isEs
                ? "Montañas, vistas al Chirripó, ecoturismo"
                : "Cool mountains, Chirripó views, eco-tourism"}
            </p>
          </div>
          <div className="w-0.5 h-8 bg-gradient-to-b from-brand-gold/45 to-transparent mt-2" />
        </div>

        {/* ROW 2: West | Center (San Isidro) | East */}
        {/* West */}
        <div className="flex items-center">
          <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
              {isEs ? "OESTE" : "WEST"} ◀
            </span>
            <h4 className="font-semibold text-brand-navy text-sm">Tinamastes / Platanillo</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-snug">
              {isEs
                ? "Brisa marina, permacultura, transición"
                : "Ocean breezes, permaculture, marine transition"}
            </p>
          </div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-brand-gold/45 to-transparent ml-2" />
        </div>

        {/* Center Compass Needle */}
        <div className="flex flex-col items-center justify-center p-6 rounded-full bg-brand-navy border-4 border-brand-gold text-white text-center w-44 h-44 mx-auto shadow-2xl relative z-10">
          <Compass className="w-8 h-8 text-brand-gold animate-[pulse_4s_ease-in-out_infinite]" />
          <span className="text-[10px] font-bold tracking-widest text-brand-gold/80 mt-2 block">
            {isEs ? "NÚCLEO URBANIZADO" : "CENTRAL URBAN HUB"}
          </span>
          <span className="text-xs font-extrabold leading-tight mt-1">
            San Isidro de El General
          </span>
        </div>

        {/* East */}
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gradient-to-l from-brand-gold/45 to-transparent mr-2" />
          <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
              ▶ {isEs ? "ESTE" : "EAST"}
            </span>
            <h4 className="font-semibold text-brand-navy text-sm">General Viejo & Cajón</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-snug">
              {isEs
                ? "Colinas onduladas, campo, agricultura fértil"
                : "Rolling fincas, country feel, rich soils"}
            </p>
          </div>
        </div>

        {/* ROW 3: South */}
        <div className="col-start-2 flex flex-col items-center">
          <div className="w-0.5 h-8 bg-gradient-to-t from-brand-gold/45 to-transparent mb-2" />
          <div className="w-full p-4 rounded-xl border border-brand-gold/25 bg-background shadow-md hover:shadow-lg transition-all duration-300 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-gold block mb-1">
              ▼ {isEs ? "SUR" : "SOUTH"}
            </span>
            <h4 className="font-semibold text-brand-navy text-sm">Pedregoso & Residenciales</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-snug">
              {isEs
                ? "Comunidades cerradas, fincas de lujo"
                : "Gated communities, luxury hillside estates"}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile stacked visual list */}
      <div className="grid grid-cols-2 gap-4 lg:hidden max-w-lg mx-auto">
        <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
          <span className="text-xs font-bold text-brand-gold block">
            ▲ {isEs ? "NORTE" : "NORTH"}
          </span>
          <h4 className="font-bold text-brand-navy text-sm mt-1">Rivas & Gerardo</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-tight">
            {isEs ? "Montañas, Chirripó" : "High peaks, cool climate"}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
          <span className="text-xs font-bold text-brand-gold block">
            ▶ {isEs ? "ESTE" : "EAST"}
          </span>
          <h4 className="font-bold text-brand-navy text-sm mt-1">General Viejo</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-tight">
            {isEs ? "Fincas fértiles, sol" : "Rolling agricultural fincas"}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
          <span className="text-xs font-bold text-brand-gold block">
            ▼ {isEs ? "SUR" : "SOUTH"}
          </span>
          <h4 className="font-bold text-brand-navy text-sm mt-1">Pedregoso</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-tight">
            {isEs ? "Residencias privadas" : "Gated luxury properties"}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-gradient-to-br from-brand-navy/5 to-background text-center">
          <span className="text-xs font-bold text-brand-gold block">
            ◀ {isEs ? "OESTE" : "WEST"}
          </span>
          <h4 className="font-bold text-brand-navy text-sm mt-1">Tinamastes</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-tight">
            {isEs ? "Brisa marina, RISE" : "Sea breeze & permaculture"}
          </p>
        </div>
        <div className="col-span-2 p-3 rounded-xl bg-brand-navy text-white text-center text-xs font-semibold shadow-inner">
          📍{" "}
          {isEs
            ? "Núcleo Central: San Isidro de El General"
            : "Central Hub: San Isidro de El General"}
        </div>
      </div>
    </div>
  );
}

/** 3. Premium detailed cardinal cards layout */
function CardinalCards({ locale, areaSlug }: { locale: string; areaSlug: string }) {
  const isEs = locale === "es";

  const perezZeledonSectors = [
    {
      title: isEs
        ? "1. El Norte (Rivas y San Gerardo de Rivas)"
        : "1. The North (Rivas & San Gerardo)",
      direction: isEs ? "NORTE — Clima Fresco" : "NORTH — Cool Climates",
      vibe: isEs
        ? "Vida de montaña a gran altitud, clima fresco y aire sumamente puro. Es la puerta de entrada al Parque Nacional Cerro Chirripó."
        : "High-altitude mountain living, cool weather, and crisp air. This is the gateway to Mount Chirripó (Costa Rica's highest peak).",
      properties: isEs
        ? "Albergues de ecoturismo, cabañas de montaña y propiedades bordeadas por ríos caudalosos. Perfecto para hotelería boutique."
        : "Eco-tourism lodges, mountain cabins, and properties bordered by rushing, boulder-lined rivers. Ideal for boutique hospitality.",
    },
    {
      title: isEs
        ? "2. El Oeste (Tinamastes, Platanillo y Barú)"
        : "2. The West (Tinamastes & Platanillo)",
      direction: isEs ? "OESTE — Brisa Marina" : "WEST — Ocean Breezes",
      vibe: isEs
        ? "El puente natural entre montaña y mar. Al ascender por la cordillera costera, se disfrutan de constantes brisas frescas del Pacífico."
        : "The bridge between mountain and sea. As you ascend the coastal ridge, you catch refreshing, dynamic ocean breezes.",
      properties: isEs
        ? "Comunidades regenerativas (como RISE), fincas de permacultura y residencias de lujo con vistas excepcionales al valle y al océano."
        : "Regenerative communities (like RISE), permaculture farms, and luxury estates featuring rare valley and Pacific horizon views.",
    },
    {
      title: isEs
        ? "3. El Este (General Viejo, Cajón y El Hoyón)"
        : "3. The East (General Viejo & Cajón)",
      direction: isEs ? "ESTE — Campo Tradicional" : "EAST — Country Charm",
      vibe: isEs
        ? "Colinas onduladas, suelos agrícolas sumamente ricos y un clima cálido, soleado y con el acogedor encanto del campo costarricense."
        : "Rolling foothills, rich agricultural soil, and a warm, sunny, traditional country feel.",
      properties: isEs
        ? "Extensas fincas agropecuarias, ranchos campestres, y amplias parcelas con nacientes de agua naturales y ríos propios."
        : "Expansive agricultural estates, sprawling homesteads (fincas), and large acreage lots with private springs.",
    },
    {
      title: isEs
        ? "4. El Sur (Pedregoso, Barrio Sinaí y Residenciales)"
        : "4. The South (Pedregoso & Ridges)",
      direction: isEs ? "SUR — Conveniencia Residencial" : "SOUTH — Premium Gated Estates",
      vibe: isEs
        ? "Tranquilidad residencial exclusiva con conveniencia inigualable a solo 5 o 10 minutos del centro urbano de San Isidro."
        : "Premium residential convenience and secure living just 5 to 10 minutes from downtown San Isidro.",
      properties: isEs
        ? "Casas de diseño arquitectónico moderno, residencias exclusivas en condominios seguros y lotes en colinas con vistas nocturnas espectaculares."
        : "Modern architectural homes, upscale residences in secure gated communities, and hillside lots with panoramic city views.",
    },
  ];

  const dominicalSectors = [
    {
      title: isEs
        ? "1. Las Escaleras y las Cordilleras Costeras"
        : "1. Las Escaleras & The Coastal Ridges",
      direction: isEs ? "NORTE — Alturas Exclusivas" : "NORTH — Ultra-Luxury Estates",
      vibe: isEs
        ? "El pináculo del lujo en el Pacífico Sur. Prestigioso, altamente seguro y excepcionalmente privado."
        : "The pinnacle of luxury in the South Pacific. Prestigious, highly secure, and exceptionally private.",
      properties: isEs
        ? "Masterpieces arquitectónicos contemporáneos de vidrio y acero de millones de dólares, casas inteligentes con piscinas infinitas y lotes con acceso para helipuertos y vistas de 180 grados al atardecer."
        : "Multi-million dollar contemporary glass-and-steel architectural masterpieces, luxury smart-homes with expansive infinity pools, and oceanview lots featuring helipad access and 180° sunset views.",
    },
    {
      title: isEs ? "2. Lagunas de Barú" : "2. Lagunas de Barú",
      direction: isEs ? "OESTE — Selva y Altura Fresca" : "WEST — Cool Jungle Ridges",
      vibe: isEs
        ? "Una comunidad residencial de montaña establecida y muy cotizada a solo 10 minutos de Dominical. Conocida por su clima fresco y privacidad absoluta."
        : "A highly sought-after, established mountain residential community rising just 10 minutes behind Dominical. Known for cool elevation, absolute privacy, and jungle elegance.",
      properties: isEs
        ? "Expansivas propiedades con vistas al mar y a las montañas. Destacan por contar con nacientes de agua dulce propias, quebradas y cascadas privadas con excelentes accesos y agua de ASADA."
        : "Expansive oceanview and mountainview estates nestled in primary forest. Noted for private natural springs, rushing creeks, hidden waterfalls, and legal ASADA water connection.",
    },
    {
      title: isEs ? "3. Desarrollos Premium Icónicos" : "3. Iconic Premium Developments",
      direction: isEs ? "ESTE — Comunidades Planificadas" : "EAST — Master-Planned Communities",
      vibe: isEs
        ? "Dulce Pacífico es un referente de vida sostenible con servicios subterráneos, iluminación solar y cascadas. Élan define el lujo frente al mar listo para disfrutar."
        : "Dulce Pacífico sets a benchmark for sustainable luxury living with underground utilities and solar lighting. Élan defines turn-key luxury directly bordering the golden sand beach.",
      properties: isEs
        ? "Lotes listos para construir y condominios de lujo de 2 y 3 habitaciones de un solo nivel con piscinas estilo resort, club de playa y altos rendimientos de alquiler."
        : "Infrastructure-ready development lots at Dulce Pacífico, and single-level 2/3 bedroom beachfront condos at Élan with resort pools, beach-club amenities, and high rental yields.",
    },
    {
      title: isEs
        ? "4. Dominicalito y Cordillera La Parcela"
        : "4. Dominicalito & La Parcela Ridge",
      direction: isEs ? "SUR — Bahía Protegida" : "SOUTH — Protected Bay & Calmer Waters",
      vibe: isEs
        ? "Una bahía más tranquila y protegida justo al sur de Dominical, popular por sus aguas calmas y puerto pesquero artesanal."
        : "A quieter, more protected horseshoe bay just south of main Dominical; popular for calmer waters and its local artisanal fishing port.",
      properties: isEs
        ? "Villas residenciales de lujo personalizadas integradas en el dosel forestal con vistas directas al mar, condominios en comunidades cerradas como Canto Del Mar, Las Olas o Marisol, y parcelas frente al mar."
        : "Custom luxury villas nestled in the canopy, secure gated developments like Canto Del Mar, Las Olas, or Marisol Condominiums, and premium oceanfront land parcels.",
    },
    {
      title: isEs
        ? "5. Dominical Centro y Zona Marítimo-Terrestre"
        : "5. Dominical Centro & The Maritime Zone",
      direction: isEs ? "CENTRO — Lujo Peatonal" : "CENTER — Beachfront Walkability",
      vibe: isEs
        ? "Una franja costera peatonal exclusiva llena de restaurantes al aire libre, cervecerías artesanales y mercados orgánicos."
        : "A walkable, beachfront strip filled with open-air fine dining restaurants, boutique craft breweries, and organic markets.",
      properties: isEs
        ? "Locales comerciales premium, condominios listos para rentar con alto tráfico peatonal y excelente rentabilidad comercial."
        : "Premium commercial storefronts, luxury turn-key vacation rental condos, and highly lucrative commercial investments with premier foot traffic.",
    },
  ];

  const sectors = areaSlug === "dominical" ? dominicalSectors : perezZeledonSectors;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
      {sectors.map((sec, idx) => (
        <div
          key={idx}
          className="flex flex-col p-6 rounded-2xl border border-border/80 bg-background shadow-md hover:shadow-xl hover:border-brand-gold/45 transition-all duration-300"
        >
          <span className="text-[10px] font-bold tracking-widest text-brand-gold uppercase block mb-1">
            {sec.direction}
          </span>
          <h4 className="font-extrabold text-lg text-brand-navy mb-4 border-b border-border/50 pb-2">
            {sec.title}
          </h4>
          <div className="space-y-4 text-[15px] flex-grow">
            <div>
              <span className="inline-block text-[11px] font-bold bg-brand-gold/10 text-brand-navy px-2 py-0.5 rounded uppercase mr-2 mb-1">
                {isEs ? "El Ambiente" : "The Vibe"}
              </span>
              <p className="text-text-muted leading-relaxed">{sec.vibe}</p>
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold bg-brand-navy/5 text-brand-navy px-2 py-0.5 rounded uppercase mr-2 mb-1">
                {isEs ? "Propiedades" : "Property Types"}
              </span>
              <p className="text-text-muted leading-relaxed">{sec.properties}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 4. Premium dynamic call to action button linking to search */
function CtaButton({ locale, areaSlug }: { locale: string; areaSlug: string }) {
  const isEs = locale === "es";
  const searchHref = `/${locale}/search?area=${areaSlug}`;

  return (
    <div className="flex justify-center items-center py-8">
      <Link
        href={searchHref}
        className="inline-flex items-center justify-center gap-3 px-8 py-5 text-base font-bold text-white bg-brand-navy hover:bg-brand-navy/95 border-b-4 border-brand-gold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-0.5"
      >
        <span>
          {isEs
            ? areaSlug === "dominical"
              ? "👉 Ver todas las propiedades de lujo en venta en Dominical"
              : "👉 Ver todas las propiedades en venta en Pérez Zeledón"
            : areaSlug === "dominical"
              ? "👉 View All Luxury Properties For Sale in Dominical"
              : "👉 View All Properties For Sale in Pérez Zeledón"}
        </span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300 text-brand-gold" />
      </Link>
    </div>
  );
}

/** 5. Premium custom pricing table component */
function PricingTable({ locale }: { locale: string }) {
  const isEs = locale === "es";

  const rows = [
    {
      tier: isEs
        ? "Mansiones y Obras Maestras Arquitectónicas"
        : "Elite Compound & Architectural Masterpieces",
      price: "$3,500,000 – $6,500,000+",
      locations: "Upper Escaleras, Costaña",
      features: isEs
        ? "Villas inteligentes de ultra lujo, arquitectura moderna de acero y vidrio, vistas de 180° al mar, helipuertos, privacidad absoluta."
        : "Ultra-luxury smart villas, glass/steel modern architecture, 180° whitewater views, helipads, ultimate privacy.",
    },
    {
      tier: isEs ? "Casas y Fincas de Lujo Unifamiliares" : "Luxury Single-Family Homes & Estates",
      price: "$1,200,000 – $3,000,000",
      locations: "Lower Escaleras, Lagunas, Dominicalito",
      features: isEs
        ? "Villas personalizadas a nivel de dosel, piscinas infinitas, grandes fincas con cascadas o arroyos privados, enclaves seguros."
        : "Custom canopy-level villas, infinity pools, large acreage lots with private waterfalls or creeks, secure gated enclaves.",
    },
    {
      tier: isEs ? "Condominios y Townhomes Listos para Usar" : "Turn-key Condos & Townhomes",
      price: "$500,000 – $1,100,000",
      locations: "Dominical Centro, Élan Beachfront, Canto Del Mar",
      features: isEs
        ? "Residencias de un solo nivel con altos ingresos, piscinas estilo resort, a pasos de las playas de surf premium."
        : "High-yield single-level residences, resort-style shared infrastructure, walking distance to premium surf beaches.",
    },
    {
      tier: isEs ? "Lotes Premium con Vistas al Mar" : "Premium Ocean-View Land Parcels",
      price: "$300,000 – $800,000",
      locations: "Dulce Pacífico, Lagunas Ridges",
      features: isEs
        ? "Lotes con infraestructura lista, agua legal (ASADA), caminos internos y terrazas de construcción listas."
        : "Infrastructure-ready development lots with legal water hookups (ASADA), internal road cuts, and designated building pads.",
    },
  ];

  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-border/80 shadow-md">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse bg-background">
          <thead>
            <tr className="bg-brand-navy text-white text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">{isEs ? "NIVEL DE INVERSIÓN" : "INVESTMENT TIER"}</th>
              <th className="px-6 py-4">{isEs ? "RANGO DE PRECIOS" : "PRICING RANGE"}</th>
              <th className="px-6 py-4">{isEs ? "UBICACIONES" : "DOMINANT LOCATIONS"}</th>
              <th className="px-6 py-4">{isEs ? "CARACTERÍSTICAS" : "KEY CHARACTERISTICS"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-navy/5 transition-colors duration-200">
                <td className="px-6 py-4 font-bold text-brand-navy leading-tight">{row.tier}</td>
                <td className="px-6 py-4 font-extrabold text-brand-gold whitespace-nowrap">
                  {row.price}
                </td>
                <td className="px-6 py-4 text-text-primary">{row.locations}</td>
                <td className="px-6 py-4 text-text-secondary leading-relaxed">{row.features}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card-based View */}
      <div className="block md:hidden divide-y divide-border/60 bg-background">
        {rows.map((row, idx) => (
          <div key={idx} className="p-5 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-base font-extrabold text-brand-navy leading-tight">{row.tier}</h4>
              <span className="text-[11px] font-extrabold tracking-wider text-brand-gold bg-brand-navy/5 px-2 py-0.5 rounded whitespace-nowrap">
                {row.price}
              </span>
            </div>
            <div className="space-y-1 text-xs text-text-muted">
              <p>
                <strong className="text-text-primary">
                  {isEs ? "Ubicaciones: " : "Locations: "}
                </strong>
                {row.locations}
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">
                  {isEs ? "Características: " : "Characteristics: "}
                </strong>
                {row.features}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sub-component for individual travel service/hospital details */
function ServiceMetricItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/80 bg-background p-4 shadow-sm hover:shadow transition-shadow duration-300">
      <span className="text-2xl p-2 rounded-lg bg-secondary/30" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="mt-1 text-sm font-semibold text-brand-navy leading-tight">{value}</p>
      </div>
    </div>
  );
}
