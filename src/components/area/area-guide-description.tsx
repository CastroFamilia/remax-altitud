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
            return <ServicesList key={idx} locale={locale} />;
          }

          // 4. Custom cardinal compass visual map token
          if (block === "[CARDINAL_MAP]") {
            return <CardinalMap key={idx} locale={locale} />;
          }

          // 5. Custom cardinal cards detailed sectors token
          if (block === "[CARDINAL_CARDS]") {
            return <CardinalCards key={idx} locale={locale} />;
          }

          // 6. Custom high-converting properties search CTA token
          if (block === "[CTA_BUTTON]") {
            return <CtaButton key={idx} locale={locale} areaSlug={area.slug} />;
          }

          // Default: Paragraph with inline bold parsing
          return (
            <p
              key={idx}
              className="leading-relaxed text-text-primary text-[17px]"
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

/** Helper to parse standard bold `**text**` inline markers */
function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-brand-navy">$1</strong>')
    .replace(/\n/g, "<br />");
}

/** 1. Travel Logistics & everyday services component */
function ServicesList({ locale }: { locale: string }) {
  const isEs = locale === "es";

  const services = [
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
        ? "Escuelas internacionales y bilingües como BMS o Colegio del Valle, así como educación alternativa Waldorf en RISE Waldorf Inspired School y diversas universidades."
        : "International and Bilingual schools like BMS or Colegio del Valle as well as alternative Waldorf Education at the RISE Waldorf Inspired School and many Universities.",
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
function CardinalMap({ locale }: { locale: string }) {
  const isEs = locale === "es";

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
function CardinalCards({ locale }: { locale: string }) {
  const isEs = locale === "es";

  const sectors = [
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
            ? "👉 Ver todas las propiedades en venta en Pérez Zeledón"
            : "👉 View All Properties For Sale in Pérez Zeledón"}
        </span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300 text-brand-gold" />
      </Link>
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
