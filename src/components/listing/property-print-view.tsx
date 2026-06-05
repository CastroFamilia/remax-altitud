import type { Property } from "@/lib/db/schema/properties";
import { normalizePropertyImages } from "@/lib/utils/normalize-images";
import { convertArea } from "@/lib/utils/units";
import { getTranslations } from "next-intl/server";

interface PropertyPrintViewProps {
  property: Property;
  locale: string;
}

export async function PropertyPrintView({ property, locale }: PropertyPrintViewProps) {
  const t = await getTranslations({ locale, namespace: "ListingDetail" });

  const title = (locale === "es" ? property.titleEs : property.titleEn) || "";
  const images = normalizePropertyImages(property.images, title);

  const mainImage = images[0];
  const secondaryImages = images.slice(1, 5); // Up to 4 other photos

  const formattedPrice = property.priceUsd ? `$${property.priceUsd.toLocaleString("en-US")}` : "—";
  const listingType =
    property.listingType === "Lease" ? t("listingType.Lease") : t("listingType.Sale");
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

  return (
    <div className="hidden print:block w-full max-w-4xl mx-auto bg-white text-black p-8 font-sans">
      {/* Header section */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wider text-gray-600">
          <span className="bg-gray-100 px-3 py-1 rounded">{listingType}</span>
          <span className="bg-gray-100 px-3 py-1 rounded">{propertyType}</span>
          <span className="bg-gray-100 px-3 py-1 rounded">{area}</span>
        </div>
      </div>

      {/* Images Section */}
      <div className="mb-8 space-y-4">
        {mainImage && (
          <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainImage.src} alt={mainImage.alt} className="w-full h-full object-cover" />
          </div>
        )}

        {secondaryImages.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {secondaryImages.map((img, i) => (
              <div
                key={i}
                className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">Price</p>
          <p className="text-2xl font-bold text-gray-900">{formattedPrice}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
            Property Type
          </p>
          <p className="text-2xl font-bold text-gray-900 capitalize">
            {propertyType.toLowerCase()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
            Area / Location
          </p>
          <p className="text-xl font-bold text-gray-900 capitalize">{area}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">Status</p>
          <p className="text-xl font-bold text-gray-900">{listingType}</p>
        </div>
      </div>

      {/* Size Details */}
      <div className="grid grid-cols-2 gap-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">Lot Size</p>
          <p className="text-xl font-bold text-gray-900">
            {lotSizeM2 != null ? `${lotSizeMetric} (${lotSizeImperial})` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-bold mb-1">
            Construction Size
          </p>
          <p className="text-xl font-bold text-gray-900">
            {constructionM2 != null ? `${constructionMetric} (${constructionImperial})` : "—"}
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500 font-medium">
        <p>REMAX Altitud</p>
        <p>www.remax-altitud.cr</p>
      </div>
    </div>
  );
}
