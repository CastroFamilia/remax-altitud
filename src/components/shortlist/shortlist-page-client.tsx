"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useShortlist } from "@/hooks/use-shortlist";
import { getShortlistProperties } from "@/app/actions/shortlist-actions";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { MapView } from "@/components/map/map-view-loader";
import type { PropertySearchItem } from "@/types/search";

export function ShortlistPageClient() {
  const t = useTranslations("Shortlist");
  const locale = useLocale();
  const { shortlist, remove, isLoaded } = useShortlist();

  const [properties, setProperties] = useState<PropertySearchItem[]>([]);
  const [copied, setCopied] = useState(false);
  const fetchedShortlistRef = useRef<string[]>([]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (!isLoaded) return;

    const prev = fetchedShortlistRef.current;

    // Check if shortlist is identical to prev
    const isSame =
      shortlist.length === prev.length &&
      [...shortlist].sort().every((id, idx) => id === [...prev].sort()[idx]);

    if (isSame) return;

    // Check if this was a simple removal (shortlist is a subset of prev)
    const isSubset = shortlist.every((id) => prev.includes(id));

    if (isSubset && prev.length > 0) {
      fetchedShortlistRef.current = shortlist;
      setProperties((prevProps) => prevProps.filter((p) => shortlist.includes(p.id)));
      return;
    }

    fetchedShortlistRef.current = shortlist;

    if (shortlist.length === 0) {
      setProperties([]);
      return;
    }

    getShortlistProperties(shortlist)
      .then((data) => {
        setProperties(data);
      })
      .catch((err) => {
        console.error("Error fetching shortlist properties:", err);
      });
  }, [shortlist, isLoaded]);

  const handleRemove = (id: string) => {
    remove(id);
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAskAgent = () => {
    const header = t("whatsAppMessageHeader");
    const message = `${header}\n${properties
      .map((p) => {
        const title = locale === "es" ? p.titleEs || p.titleEn : p.titleEn;
        return `- ${title} (${p.id})`;
      })
      .join("\n")}`;
    const whatsappUrl = `https://wa.me/50688888888?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareShortlist = () => {
    const header = t("shareMessageHeader");
    const text = `${header}\n${properties
      .map((p) => `${window.location.origin}/${locale}/property/${p.slug}`)
      .join("\n")}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
        })
        .catch((err) => {
          console.error("Clipboard copy failed, using alert fallback:", err);
          alert(text);
        });
    } else {
      alert(text);
    }
  };

  // Loading / hydration mismatch prevention
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-brand-navy">{t("title")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
          <PropertyCardSkeleton />
        </div>
      </div>
    );
  }

  // Empty state
  if (properties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-3xl font-bold mb-4 text-brand-navy">{t("title")}</h1>
        <p className="text-muted-foreground mb-8">{t("emptyState")}</p>
        <Link
          href={`/${locale}/search`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-8 shadow-md transition-colors"
        >
          {t("browseCta")}
        </Link>
      </div>
    );
  }

  // Filter out any properties that have null coordinates to prevent Mapbox/Supercluster runtime crashes.
  const mapProperties = properties.filter(
    (p): p is typeof p & { latitude: number; longitude: number } =>
      p.latitude !== null && p.longitude !== null,
  );

  // Comparison grid + interactive map
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-brand-navy">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Property list and Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                locale={locale}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Action CTAs Block */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 border-t pt-6 border-border">
            <button
              onClick={handleAskAgent}
              className="flex-1 inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-6 shadow-md transition-colors"
            >
              {t("askAgentCta")}
            </button>
            <button
              onClick={handleShareShortlist}
              className="flex-1 inline-flex h-11 items-center justify-center rounded-md border border-brand-navy/30 text-brand-navy hover:bg-brand-navy/5 font-semibold px-6 transition-colors relative"
            >
              {copied ? "Copied!" : t("shareShortlistCta")}
            </button>
          </div>
        </div>

        {/* Right Side: Mini-map showing saved property locations */}
        <div className="lg:col-span-5 h-[350px] lg:h-[600px] sticky top-24 rounded-xl overflow-hidden shadow-md border border-border">
          <MapView properties={mapProperties} locale={locale} />
        </div>
      </div>
    </div>
  );
}
