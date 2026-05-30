import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getPropertyBySlug,
  getSimilarProperties,
  getAllPropertySlugs,
} from "@/lib/db/queries/properties";
import { getAgentById, getAllAgents } from "@/lib/db/queries/agents";
import { getOfficeById } from "@/lib/db/queries/offices";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Mail, ArrowRight } from "lucide-react";
import { ListingDetailLayout } from "@/components/listing/listing-detail-layout";
import { PropertyViewTracker } from "@/components/listing/property-view-tracker";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";
import { getAreaBySlug } from "@/lib/db/queries/areas";
import { InvestmentContext } from "@/components/area/investment-context";
import {
  generateListingJsonLd,
  generateBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { buildAlternatesMetadata, generateCanonicalUrl } from "@/lib/seo/metadata";
import { SITE_ORIGIN } from "@/lib/seo/constants";

// Story 4.1 Task 1: Replace force-dynamic with ISR (NFR25, 4.1-UNIT-002)
// Revalidate every 24 hours — the sync pipeline's revalidateTag('properties') call
// also triggers on-demand revalidation after each daily sync.
export const revalidate = 86400; // 24 hours

/**
 * SSG build-time generation — calls getAllPropertySlugs at build time.
 * Wrapped in try/catch so the build continues if the DB is unavailable
 * (pages generated on-demand via ISR fallback).
 */
export async function generateStaticParams() {
  try {
    const slugs = await getAllPropertySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return []; // Build continues; pages generated on-demand via ISR
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};
  if (!property.isVisible) return { robots: { index: false, follow: false } };
  const title = locale === "es" ? property.titleEs : property.titleEn;
  const description = locale === "es" ? property.descriptionEs : property.descriptionEn;
  const images = normalizePropertyImages(property.images);
  return {
    title: `${title} | RE/MAX Altitud`,
    description: description.slice(0, 160),
    alternates: {
      canonical: generateCanonicalUrl(locale, `/property/${slug}`),
      ...buildAlternatesMetadata(`/property/${slug}`),
    },
    openGraph: {
      title,
      description: description.slice(0, 160),
      images: images[0] ? [{ url: images[0].src }] : [],
      type: "website",
      url: generateCanonicalUrl(locale, `/property/${slug}`),
    },
  };
}

const INVESTMENT_TAGS = ["Investment Property", "Rental Potential", "Commercial"];

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale); // required for next-intl static rendering support

  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound(); // URL never existed → 404
  }

  if (!property.isVisible) {
    // Soft-deleted → "No longer available" UI (NOT a 404)
    const similar = await getSimilarProperties(property.areaSlug, slug);
    const t = await getTranslations({ locale, namespace: "PropertyUnavailable" });

    // Fetch associated agent or fallback to first active agent in DB
    let assignedAgent = property.agentId ? await getAgentById(property.agentId) : null;
    if (!assignedAgent) {
      const allAgents = await getAllAgents();
      assignedAgent = allAgents[0] ?? null;
    }
    const office = assignedAgent?.officeId ? await getOfficeById(assignedAgent.officeId) : null;
    const officeName = office?.name ?? "RE/MAX Altitud";

    const propertyTitle = locale === "es" ? property.titleEs : property.titleEn;
    const propertyRef = property.apiId;

    // Build WhatsApp URL with "no longer available" mentioned
    const whatsappDigits = assignedAgent?.whatsapp
      ? assignedAgent.whatsapp.replace(/\D/g, "")
      : "50627710000";
    const waMessage =
      locale === "es"
        ? `Hola ${assignedAgent?.name ?? "Agente"}, me interesa encontrar alternativas ya que la propiedad "${propertyTitle}" (Ref: ${propertyRef}) ya no está disponible.`
        : `Hi ${assignedAgent?.name ?? "Agent"}, I'm interested in finding alternative properties since "${propertyTitle}" (Ref: ${propertyRef}) is no longer available.`;
    const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(waMessage)}`;

    // Build email URL
    const emailSubject =
      locale === "es"
        ? `Consulta sobre alternativas a ${propertyTitle} (Ref: ${propertyRef})`
        : `Inquiry regarding alternatives to ${propertyTitle} (Ref: ${propertyRef})`;
    const emailBody =
      locale === "es"
        ? `Hola ${assignedAgent?.name ?? "Agente"},\n\nVi que la propiedad "${propertyTitle}" (Ref: ${propertyRef}) ya no está disponible. Me gustaría recibir opciones de propiedades similares.\n\nSaludos.`
        : `Hi ${assignedAgent?.name ?? "Agent"},\n\nI noticed that "${propertyTitle}" (Ref: ${propertyRef}) is no longer available. I would love to receive some similar property recommendations.\n\nBest regards.`;
    const emailUrl = `mailto:${assignedAgent?.email || "info@remax-altitud.cr"}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    const agentPhotoSrc =
      (assignedAgent?.photoOptimizedUrl && assignedAgent.photoOptimizedUrl.length > 0
        ? assignedAgent.photoOptimizedUrl
        : null) ??
      (assignedAgent?.photoUrl && assignedAgent.photoUrl.length > 0
        ? assignedAgent.photoUrl
        : null) ??
      "/images/agent-placeholder.svg";

    return (
      <div
        data-testid="listing-unavailable-page"
        className="bg-slate-50 min-h-screen py-16 px-4 md:px-8"
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Glassmorphic/Premium Unavailable Announcement Banner */}
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 h-2" />
            <div className="p-8 md:p-12 text-center space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-100 text-red-650">
                Unavailable
              </span>
              <h1
                data-testid="unavailable-heading"
                className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none"
              >
                {t("heading")}
              </h1>
              <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                {t("subtext")}
              </p>
            </div>
          </div>

          {/* Premium Agent CTA Card Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3 space-y-6">
              {similar.length > 0 ? (
                <section
                  aria-labelledby="similar-heading"
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 space-y-6"
                >
                  <h2
                    id="similar-heading"
                    className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2"
                  >
                    <span>{t("similarHeading")}</span>
                  </h2>
                  <ul data-testid="similar-properties-list" className="divide-y divide-slate-100">
                    {similar.map((p) => (
                      <li key={p.slug} className="py-4 first:pt-0 last:pb-0">
                        <Link href={`/property/${p.slug}`} className="group block space-y-1.5">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                              {locale === "es" ? p.titleEs : p.titleEn}
                            </h3>
                            <ArrowRight className="w-4.5 h-4.5 text-slate-400 group-hover:translate-x-1 transition-all" />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-505 font-semibold">
                            {p.priceUsd != null && (
                              <span className="text-slate-900 font-black">
                                ${p.priceUsd.toLocaleString("en-US")}
                              </span>
                            )}
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                            <span className="underline group-hover:text-red-500">
                              {t("similarCta")}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center space-y-4">
                  <p className="text-slate-500 font-semibold">
                    Explore our active listing catalog to find your perfect property in Costa Rica.
                  </p>
                  <Link
                    href="/search"
                    data-testid="agent-cta"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-750 px-6 py-3.5 font-bold text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <span>{t("browseCta")}</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Premium High-Converting Agent Card */}
            <div className="md:col-span-2">
              <div
                data-testid="unavailable-agent-cta-card"
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 space-y-6 text-center md:text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-50/40 to-transparent rounded-bl-full pointer-events-none" />

                <h3 className="text-xs uppercase tracking-wider font-extrabold text-red-600">
                  Assigned Agent
                </h3>

                {/* Agent details */}
                {assignedAgent && (
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <img
                      src={agentPhotoSrc}
                      alt={assignedAgent.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-red-50 shadow-sm"
                    />
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-900">{assignedAgent.name}</h4>
                      <p className="text-xs font-semibold text-slate-450">{officeName}</p>
                      {assignedAgent.languages && (
                        <p className="text-xs text-slate-500 font-medium">
                          Speaks:{" "}
                          {Array.isArray(assignedAgent.languages)
                            ? (assignedAgent.languages as string[]).join(", ")
                            : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs font-medium text-slate-505 leading-relaxed pt-2 border-t border-slate-100">
                  Looking for something similar? Our local experts specialize in finding off-market
                  opportunities tailored to your needs.
                </div>

                {/* Contact CTA buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="agent-whatsapp-btn"
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 text-white px-5 py-3 font-extrabold text-sm transition-all shadow-sm hover:shadow cursor-pointer"
                  >
                    <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                    <span>WhatsApp Agent</span>
                  </a>

                  <a
                    href={emailUrl}
                    data-testid="agent-email-btn"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 font-extrabold text-sm transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span>Email Agent</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch associated agent (if agentId is set)
  const agent = property.agentId ? await getAgentById(property.agentId) : null;

  // Fetch associated office name (Story 4.2, Task 5b)
  const office = agent?.officeId ? await getOfficeById(agent.officeId) : null;

  // Story 4.4 Task 7: JSON-LD structured data for RealEstateListing + BreadcrumbList (AC #1, #4)
  const title = locale === "es" ? property.titleEs : property.titleEn;
  const tBreadcrumbs = await getTranslations({ locale, namespace: "Breadcrumbs" });
  const listingJsonLd = generateListingJsonLd(property, locale);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { position: 1, name: tBreadcrumbs("home"), href: `${SITE_ORIGIN}/${locale}` },
    { position: 2, name: tBreadcrumbs("search"), href: `${SITE_ORIGIN}/${locale}/search` },
    {
      position: 3,
      name: title,
      href: `${SITE_ORIGIN}/${locale}/property/${property.slug}`,
    },
  ]);

  // Query optimization: only fetch area metadata if the property is tagged for investment (AC #4)
  const hasInvestmentTag = property.lifestyleTags?.some((tag) => INVESTMENT_TAGS.includes(tag));
  const area =
    hasInvestmentTag && property.areaSlug ? await getAreaBySlug(property.areaSlug) : null;

  const investmentContext = area ? (
    <InvestmentContext metadata={area.metadata as Record<string, unknown> | null} locale={locale} />
  ) : undefined;

  // Visible property → full listing detail page (Story 4.1)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(listingJsonLd) }}
        data-testid="listing-jsonld"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        data-testid="breadcrumb-jsonld"
      />
      <PropertyViewTracker propertyId={property.id} slug={slug} locale={locale as "en" | "es"} />
      <ListingDetailLayout
        property={property}
        agent={agent}
        locale={locale}
        officeName={office?.name}
        investmentContext={investmentContext}
      />
    </>
  );
}
