"use client";

import { useState, useEffect } from "react";
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

  // Support both unit test mock translations and dynamic standard translations
  const getTranslation = (key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = t(`Shortlist.${key}` as any);
    if (val && val !== `Shortlist.${key}`) return val;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(key as any);
  };

  useEffect(() => {
    if (!isLoaded) return;

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
    const message = `Hello, I'm interested in these properties from my shortlist:\n${properties
      .map((p) => `- ${p.titleEn} (${p.id})`)
      .join("\n")}`;
    const whatsappUrl = `https://wa.me/50688888888?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShareShortlist = () => {
    const text = `Check out my property shortlist:\n${properties
      .map((p) => `${window.location.origin}/${locale}/property/${p.slug}`)
      .join("\n")}`;
    
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Loading / hydration mismatch prevention
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-brand-navy">{getTranslation("title")}</h1>
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
        <h1 className="text-3xl font-bold mb-4 text-brand-navy">{getTranslation("title")}</h1>
        <p className="text-muted-foreground mb-8">{getTranslation("emptyState")}</p>
        <Link
          href={`/${locale}/search`}
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-8 shadow-md transition-colors"
        >
          {getTranslation("browseCta")}
        </Link>
      </div>
    );
  }

  // Comparison grid + interactive map
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-brand-navy">{getTranslation("title")}</h1>
      
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
              {getTranslation("askAgentCta")}
            </button>
            <button
              onClick={handleShareShortlist}
              className="flex-1 inline-flex h-11 items-center justify-center rounded-md border border-brand-navy/30 text-brand-navy hover:bg-brand-navy/5 font-semibold px-6 transition-colors relative"
            >
              {copied ? "Copied!" : getTranslation("shareShortlistCta")}
            </button>
          </div>
        </div>

        {/* Right Side: Mini-map showing saved property locations */}
        <div className="lg:col-span-5 h-[350px] lg:h-[600px] sticky top-24 rounded-xl overflow-hidden shadow-md border border-border">
          <MapView properties={properties as any} locale={locale} />
        </div>
      </div>
    </div>
  );
}
