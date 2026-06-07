import type { Property } from "@/lib/db/schema/properties";
import type { Agent } from "@/lib/db/schema/agents";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";
import { convertArea } from "@/lib/utils/units";
import { SITE_ORIGIN } from "@/lib/seo/constants";
import QRCode from "react-qr-code";
import { PropertyImage } from "@/components/property/property-image";

interface PropertyPrintViewProps {
  property: Property;
  locale: string;
  agent: Agent | null;
  officeName: string;
}

export async function PropertyPrintView({
  property,
  locale,
  agent,
  officeName,
}: PropertyPrintViewProps) {
  const title = (locale === "es" ? property.titleEs : property.titleEn) || "";
  const images = normalizePropertyImages(property.images, title);

  const mainImage = images[0];
  const secondaryImage1 = images[1];
  const secondaryImage2 = images[2];
  const secondaryImage3 = images[3];

  const formattedPrice = property.priceUsd ? `$${property.priceUsd.toLocaleString("en-US")}` : "—";
  const propertyType = property.propertyType || "—";
  const area = property.areaSlug ? property.areaSlug.replace(/-/g, " ") : "—";

  // Size conversions
  const lotSizeM2 = property.lotSizeM2;
  const constructionM2 = property.constructionM2;

  const lotSizeMetric = lotSizeM2 != null ? convertArea(lotSizeM2, "metric", locale, true) : "—";
  const lotSizeImperial =
    lotSizeM2 != null ? convertArea(lotSizeM2, "imperial", locale, true) : "—";

  const constructionMetric =
    constructionM2 != null ? convertArea(constructionM2, "metric", locale, false) : "—";
  const constructionImperial =
    constructionM2 != null ? convertArea(constructionM2, "imperial", locale, false) : "—";

  const qrTrackingUrl = `${SITE_ORIGIN}/api/tracking/qr?propertyId=${property.id}&slug=${property.slug}&locale=${locale}`;

  return (
    <div className="print-view-container font-sans text-black box-border mx-auto">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page { size: landscape; margin: 0; }
        @media screen {
          .print-view-container {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
            opacity: 0;
            pointer-events: none;
          }
        }
        @media print {
          body * { visibility: hidden; }
          .print-view-container, .print-view-container * { visibility: visible; }
          .print-view-container { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100vw !important; 
            height: 99vh !important;
            max-height: 99vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
            z-index: 9999 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important;
            overflow: hidden !important;
          }
        }
      `,
        }}
      />

      {/* Full Page Grid Layout */}
      <div className="grid grid-cols-[2fr_1fr] h-full w-full">
        {/* LEFT COLUMN: Visuals */}
        <div className="flex flex-col h-full relative">
          {/* Main Hero Image */}
          <div className="h-[75%] w-full relative overflow-hidden bg-gray-100">
            {mainImage ? (
              <PropertyImage
                src={mainImage.src}
                alt={mainImage.alt || title}
                fallbackSrc={mainImage.fallbackSrc}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                No Image Available
              </div>
            )}

            {/* Elegant Price Badge over image */}
            <div className="absolute bottom-6 left-6 bg-brand-navy/95 backdrop-blur text-white px-6 py-3 border-l-4 border-amber-500 shadow-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
                {property.listingType === "Lease" ? "For Rent" : "For Sale"}
              </p>
              <p className="text-3xl font-light tracking-tight">{formattedPrice}</p>
            </div>
          </div>

          {/* 3 Secondary Images Strip */}
          <div className="h-[25%] grid grid-cols-3 w-full bg-white gap-3 p-3">
            <div className="relative overflow-hidden bg-gray-200 rounded-sm">
              {secondaryImage1 && (
                <PropertyImage
                  src={secondaryImage1.src}
                  alt={secondaryImage1.alt || "View 1"}
                  fallbackSrc={secondaryImage1.fallbackSrc}
                  fill
                  priority
                  sizes="33vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="relative overflow-hidden bg-gray-300 rounded-sm">
              {secondaryImage2 && (
                <PropertyImage
                  src={secondaryImage2.src}
                  alt={secondaryImage2.alt || "View 2"}
                  fallbackSrc={secondaryImage2.fallbackSrc}
                  fill
                  priority
                  sizes="33vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="relative overflow-hidden bg-gray-400 rounded-sm">
              {secondaryImage3 && (
                <PropertyImage
                  src={secondaryImage3.src}
                  alt={secondaryImage3.alt || "View 3"}
                  fallbackSrc={secondaryImage3.fallbackSrc}
                  fill
                  priority
                  sizes="33vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Branding */}
        <div className="bg-white text-brand-navy h-full flex flex-col p-6 justify-between relative z-10 border-l border-gray-100 shadow-[-5px_0_20px_rgba(0,0,0,0.05)]">
          {/* Logo & Top Branding */}
          <div className="flex justify-center border-b border-gray-100 pb-6 mb-6">
            <div className="bg-brand-navy py-2 px-4 rounded-lg inline-flex shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/brand/logo-remax-altitud.png"
                alt="REMAX Altitud"
                className="h-8 object-contain"
                loading="eager"
              />
            </div>
          </div>

          {/* Property Title & Location */}
          <div className="mb-4 flex-grow">
            <p className="text-amber-600 text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
              {area}
            </p>
            <h1 className="text-2xl font-black leading-tight tracking-tight mb-4 text-gray-900 line-clamp-4">
              {title}
            </h1>

            <div className="w-10 h-1 bg-amber-500 mb-6"></div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Type / Tipo
                </p>
                <p className="text-base font-light capitalize text-gray-800">{propertyType}</p>
              </div>

              {property.bedrooms != null && property.bedrooms > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Beds / Hab.
                  </p>
                  <p className="text-base font-light text-gray-800">{property.bedrooms}</p>
                </div>
              )}

              {property.bathrooms != null && property.bathrooms > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Baths / Baños
                  </p>
                  <p className="text-base font-light text-gray-800">{property.bathrooms}</p>
                </div>
              )}

              {lotSizeM2 != null && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Lot / Terreno
                  </p>
                  <p className="text-base font-light leading-tight text-gray-800">
                    {lotSizeImperial}
                  </p>
                  <p className="text-xs text-gray-400">{lotSizeMetric}</p>
                </div>
              )}

              {constructionM2 != null && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Built / Const.
                  </p>
                  <p className="text-base font-light leading-tight text-gray-800">
                    {constructionImperial}
                  </p>
                  <p className="text-xs text-gray-400">{constructionMetric}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer: Agent & QR */}
          <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-auto">
            <div className="flex-1 flex items-center pr-4">
              {(agent?.photoOptimizedUrl || agent?.photoUrl) && (
                <div className="w-16 h-16 mr-4 relative rounded-full overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                  <PropertyImage
                    src={agent.photoOptimizedUrl || agent.photoUrl || ""}
                    alt={agent.name || "Agent"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-[10px] text-amber-600 font-bold tracking-widest uppercase mb-1">
                  Presented By
                </p>
                <p className="text-xl font-black text-gray-900 leading-tight">
                  {agent?.name || "REMAX Altitud"}
                </p>
                {agent?.whatsapp && (
                  <p className="text-sm text-gray-800 mt-1 font-bold">WA: {agent.whatsapp}</p>
                )}
                {agent?.email && (
                  <p className="text-sm text-gray-800 font-bold truncate mt-0.5">{agent.email}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">
                  {officeName}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-white p-2 border border-gray-200 shadow-sm">
                <QRCode value={qrTrackingUrl} size={64} level="M" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600 mt-1.5">
                Scan for info
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
