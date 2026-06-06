"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import {
  createCommunityAction,
  updateCommunityAction,
} from "@/app/actions/admin-community-actions";
import type { NewCommunity, Community } from "@/lib/db/schema/communities";
import { AreaSearchCombobox } from "@/components/search/area-search-combobox";
import { DISTRICT_KEYWORDS } from "@/lib/locations";

const CommunityGeoFenceMap = dynamic(
  () => import("@/components/map/community-geofence-map").then((m) => m.CommunityGeoFenceMap),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="geofence-map-loading"
        className="h-[400px] w-full bg-slate-900 rounded-lg animate-pulse border border-slate-800"
      />
    ),
  },
);

export interface AreaOption {
  id: string;
  nameEn: string;
  nameEs: string;
  slug: string;
}

export interface MinimalProperty {
  id: string;
  titleEn: string;
  titleEs: string;
  apiId: string;
  communityId: string | null;
}

export interface InitialCommunityData {
  id: string;
  name: string;
  slug: string;
  areaId: string;
  subLocation?: string | null;
  taglineEn?: string | null;
  taglineEs?: string | null;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  heroImageUrl?: string | null;
  siteMapImageUrl?: string | null;
  galleryUrls?: unknown;
  priceListUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  quickFacts?: unknown;
  geoFenceCoords?: unknown;
}

export interface CommunityFormProps {
  locale: string;
  initialData?: InitialCommunityData | null;
  areas: AreaOption[];
  allProperties?: MinimalProperty[];
}

export function AdminCommunityForm({
  locale,
  initialData,
  areas,
  allProperties = [],
}: CommunityFormProps) {
  const t = useTranslations("AdminCommunities");
  const router = useRouter();
  const isEdit = !!initialData;

  // Form states
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [areaId, setAreaId] = useState(initialData?.areaId || "");
  const [subLocation, setSubLocation] = useState(initialData?.subLocation || "");
  const [taglineEn, setTaglineEn] = useState(initialData?.taglineEn || "");
  const [taglineEs, setTaglineEs] = useState(initialData?.taglineEs || "");
  const [descriptionEn, setDescriptionEn] = useState(initialData?.descriptionEn || "");
  const [descriptionEs, setDescriptionEs] = useState(initialData?.descriptionEs || "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.heroImageUrl || "");
  const [siteMapImageUrl, setSiteMapImageUrl] = useState(initialData?.siteMapImageUrl || "");
  const [priceListUrl, setPriceListUrl] = useState(initialData?.priceListUrl || "");

  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    Array.isArray(initialData?.galleryUrls) ? (initialData.galleryUrls as string[]) : [],
  );

  const [propertySearch, setPropertySearch] = useState("");

  const filteredProperties = React.useMemo(() => {
    if (!propertySearch.trim()) return allProperties;
    const q = propertySearch.toLowerCase().trim();
    return allProperties.filter(
      (p) =>
        p.titleEn.toLowerCase().includes(q) ||
        p.titleEs.toLowerCase().includes(q) ||
        p.apiId.toLowerCase().includes(q),
    );
  }, [allProperties, propertySearch]);

  const [associatedPropertyIds, setAssociatedPropertyIds] = useState<string[]>(
    allProperties.filter((p) => p.communityId === initialData?.id).map((p) => p.id),
  );

  const comboboxAreas = React.useMemo(() => {
    const main = areas.map((a) => ({
      slug: a.slug,
      label: locale === "es" ? a.nameEs : a.nameEn,
    }));

    const uniqueSubs = new Map();
    DISTRICT_KEYWORDS.forEach((k) => {
      const slug = k.keyword.toLowerCase().replace(/\s+/g, "-");
      if (!uniqueSubs.has(slug)) {
        uniqueSubs.set(slug, {
          slug,
          label: k.keyword
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          parentSlug: k.parent,
          isSubLocation: true,
        });
      }
    });

    return [...main, ...Array.from(uniqueSubs.values())] as {
      slug: string;
      label: string;
      parentSlug?: string;
      isSubLocation?: boolean;
    }[];
  }, [areas, locale]);

  const selectedAreaSlug = areas.find((a) => a.id === areaId)?.slug || "";

  // Coordinates
  const [latitude, setLatitude] = useState<string>(
    initialData?.latitude !== undefined && initialData?.latitude !== null
      ? String(initialData.latitude)
      : "",
  );
  const [longitude, setLongitude] = useState<string>(
    initialData?.longitude !== undefined && initialData?.longitude !== null
      ? String(initialData.longitude)
      : "",
  );

  // Quick facts
  interface QuickFactsType {
    elevation?: string;
    airportDistance?: string;
    amenities?: string[];
    developer?: string;
    establishedYear?: string;
    established?: string;
    infrastructure?: string;
    internet?: string;
  }
  const quickFacts = initialData?.quickFacts as QuickFactsType | null | undefined;

  const [elevation, setElevation] = useState(quickFacts?.elevation || "");
  const [airportDistance, setAirportDistance] = useState(quickFacts?.airportDistance || "");
  const [amenities, setAmenities] = useState(
    Array.isArray(quickFacts?.amenities)
      ? quickFacts.amenities.join(", ")
      : typeof quickFacts?.amenities === "string"
        ? quickFacts.amenities
        : "",
  );
  const [developer, setDeveloper] = useState(quickFacts?.developer || "");
  const [establishedYear, setEstablishedYear] = useState(
    quickFacts?.establishedYear || quickFacts?.established || "",
  );
  const [infrastructure, setInfrastructure] = useState(quickFacts?.infrastructure || "");
  const [internet, setInternet] = useState(quickFacts?.internet || "");

  // Geofence polygon points
  const initialPoints = (() => {
    const geoCoords = initialData?.geoFenceCoords as
      | {
          type: "Polygon";
          coordinates: [number, number][][];
        }
      | null
      | undefined;
    if (geoCoords?.coordinates?.[0]) {
      const coords = geoCoords.coordinates[0];
      if (coords.length > 2) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
          return coords.slice(0, -1);
        }
      }
      return coords;
    }
    return [];
  })();

  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>(initialPoints);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [geofenceText, setGeofenceText] = useState(JSON.stringify(polygonPoints));

  useEffect(() => {
    setGeofenceText(JSON.stringify(polygonPoints));
  }, [polygonPoints]);

  const handleGeofenceTextChange = (val: string) => {
    setGeofenceText(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setPolygonPoints(parsed);
      }
    } catch {
      // Ignore invalid JSON while user is typing
    }
  };

  useEffect(() => {
    if (!isEdit && name) {
      const slugified = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(slugified);
    }
  }, [name, isEdit]);

  useEffect(() => {
    if (polygonPoints.length > 0 && !latitude && !longitude) {
      const avgLng = polygonPoints.reduce((sum, pt) => sum + pt[0], 0) / polygonPoints.length;
      const avgLat = polygonPoints.reduce((sum, pt) => sum + pt[1], 0) / polygonPoints.length;
      setLatitude(avgLat.toFixed(6));
      setLongitude(avgLng.toFixed(6));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygonPoints]);

  const handleClearGeoFence = () => {
    setPolygonPoints([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !areaId) {
      setAlert({
        type: "error",
        message: "Please fill in all required fields (Name, Slug, Area).",
      });
      return;
    }

    setIsSaving(true);
    setAlert(null);

    try {
      const parsedElevation = elevation.trim();
      const parsedAirportDistance = airportDistance.trim();
      const parsedAmenities = amenities
        .split(",")
        .map((a: string) => a.trim())
        .filter((a: string) => a !== "");
      const parsedDeveloper = developer.trim();
      const parsedEstablishedYear = establishedYear.trim();
      const parsedInfrastructure = infrastructure.trim();
      const parsedInternet = internet.trim();

      const quickFactsObj = {
        elevation: parsedElevation,
        airportDistance: parsedAirportDistance,
        amenities: parsedAmenities,
        developer: parsedDeveloper,
        establishedYear: parsedEstablishedYear,
        established: parsedEstablishedYear,
        infrastructure: parsedInfrastructure,
        internet: parsedInternet,
      };

      const latNum = latitude.trim() !== "" ? parseFloat(latitude) : null;
      const lngNum = longitude.trim() !== "" ? parseFloat(longitude) : null;

      const isPolygonValid = polygonPoints.length >= 3;
      const geoFence = isPolygonValid ? polygonPoints : null;

      const closedPoints = isPolygonValid
        ? polygonPoints[0][0] === polygonPoints[polygonPoints.length - 1][0] &&
          polygonPoints[0][1] === polygonPoints[polygonPoints.length - 1][1]
          ? polygonPoints
          : [...polygonPoints, polygonPoints[0]]
        : null;

      const geoFenceCoords = isPolygonValid
        ? { type: "Polygon", coordinates: [closedPoints] }
        : null;

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        areaId,
        subLocation: subLocation.trim() || null,
        taglineEn: taglineEn.trim() || null,
        taglineEs: taglineEs.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
        descriptionEs: descriptionEs.trim() || null,
        heroImageUrl: heroImageUrl.trim() || null,
        siteMapImageUrl: siteMapImageUrl.trim() || null,
        galleryUrls: galleryUrls.filter(Boolean),
        priceListUrl: priceListUrl.trim() || null,
        latitude: latNum,
        longitude: lngNum,
        geoFence,
        geoFenceCoords,
        quickFacts: quickFactsObj,
        associatedPropertyIds,
      };

      let res;
      if (isEdit) {
        res = await updateCommunityAction(initialData.id, payload as Partial<Community>);
      } else {
        res = await createCommunityAction(payload as NewCommunity);
      }

      if (res.success) {
        setAlert({
          type: "success",
          message: isEdit ? t("successUpdated", { name }) : t("successCreated", { name }),
        });
        setTimeout(() => {
          router.push(`/${locale}/admin/communities`);
          router.refresh();
        }, 1500);
      } else {
        setAlert({ type: "error", message: t("errorSaveFailed") });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAlert({ type: "error", message: errMsg || t("errorSaveFailed") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${locale}/admin/communities`)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">
            {isEdit ? `Edit Community: ${initialData.name}` : t("btnCreateCommunity")}
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            {isEdit
              ? "Update community details and geographic boundaries"
              : "Define metadata and custom boundaries for a new area"}
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold ${
            alert.type === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Santa Elena Hills"
                data-testid="community-name-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelSlug")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. santa-elena-hills"
                data-testid="community-slug-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Location (Area & Sub-Location) <span className="text-red-500">*</span>
              </label>
              <AreaSearchCombobox
                areas={comboboxAreas}
                selectedArea={selectedAreaSlug}
                selectedSubLocation={subLocation}
                onAreaChange={(areaSlug, subSlug) => {
                  const matchedArea = areas.find((a) => a.slug === areaSlug);
                  if (matchedArea) {
                    setAreaId(matchedArea.id);
                  } else {
                    setAreaId("");
                  }
                  setSubLocation(subSlug);
                }}
                placeholder={locale === "es" ? "Buscar zona..." : "Search location..."}
                locale={locale}
                variant="dark"
                allowCustom={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("formLabelHeroImage")}
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Recommended: 1920x1080px (16:9)
                </span>
              </div>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://..."
                data-testid="community-hero-image-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Paste the URL of the image (e.g., from Google Drive, Imgur, or your CRM).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelTaglineEn")}
              </label>
              <input
                type="text"
                value={taglineEn}
                onChange={(e) => setTaglineEn(e.target.value)}
                placeholder="Tagline in English"
                data-testid="community-tagline-en-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelTaglineEs")}
              </label>
              <input
                type="text"
                value={taglineEs}
                onChange={(e) => setTaglineEs(e.target.value)}
                placeholder="Tagline en Español"
                data-testid="community-tagline-es-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Bilingual Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelDescriptionEn")}
              </label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Description in English..."
                rows={4}
                data-testid="community-desc-en-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelDescriptionEs")}
              </label>
              <textarea
                value={descriptionEs}
                onChange={(e) => setDescriptionEs(e.target.value)}
                placeholder="Descripción en Español..."
                rows={4}
                data-testid="community-desc-es-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold resize-none"
              />
            </div>
          </div>

          {/* Site Map & Price List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("formLabelSiteMap")}
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Recommended: High Res (Any ratio)
                </span>
              </div>
              <input
                type="url"
                value={siteMapImageUrl}
                onChange={(e) => setSiteMapImageUrl(e.target.value)}
                placeholder="https://example.com/sitemap.jpg"
                data-testid="community-sitemap-image-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Paste the URL for the sitemap image.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Price List URL (Drive)
              </label>
              <input
                type="url"
                value={priceListUrl}
                onChange={(e) => setPriceListUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                data-testid="community-pricelist-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Gallery URLs */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gallery Images (One URL per line)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                Recommended: 1200x800px (3:2)
              </span>
            </div>
            <textarea
              value={galleryUrls.join("\n")}
              onChange={(e) => setGalleryUrls(e.target.value.split("\n"))}
              placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"
              rows={4}
              data-testid="community-gallery-input"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold resize-y"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Paste URLs of gallery images, separated by new lines.
            </p>
          </div>

          {/* Associated Properties */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Associated Properties
              </label>
              <span className="text-[10px] text-slate-500 font-medium bg-slate-900 px-2 py-0.5 rounded-full">
                {associatedPropertyIds.length} selected
              </span>
            </div>

            <input
              type="text"
              placeholder="Search properties by title or ID..."
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
            />

            <div
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 overflow-y-auto"
              style={{ maxHeight: "250px" }}
            >
              {filteredProperties.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center">No properties found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredProperties.map((p) => {
                    const isSelected = associatedPropertyIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-start space-x-3 p-2 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-red-500/10 border border-red-500/20"
                            : "hover:bg-slate-900 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssociatedPropertyIds([...associatedPropertyIds, p.id]);
                            } else {
                              setAssociatedPropertyIds(
                                associatedPropertyIds.filter((id) => id !== p.id),
                              );
                            }
                          }}
                          className="mt-1 flex-shrink-0 w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-950"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-200 font-medium line-clamp-1">
                            {p.titleEn}
                          </span>
                          <span className="text-xs text-slate-500">{p.apiId}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {associatedPropertyIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {associatedPropertyIds.map((id) => {
                  const prop = allProperties.find((p) => p.id === id);
                  if (!prop) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-300"
                    >
                      <span>{prop.apiId}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setAssociatedPropertyIds(
                            associatedPropertyIds.filter((pid) => pid !== id),
                          )
                        }
                        className="text-slate-500 hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Quick Facts & Geofence Map */}
        <div className="space-y-6">
          {/* Quick Facts Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>{t("formLabelQuickFacts")}</span>
            </h3>

            {/* elevation */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelElevation")}
              </label>
              <input
                type="text"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="e.g. 800m"
                data-testid="quickfact-elevation"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* airportDistance */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelAirport")}
              </label>
              <input
                type="text"
                value={airportDistance}
                onChange={(e) => setAirportDistance(e.target.value)}
                placeholder="e.g. 45 mins"
                data-testid="quickfact-airportDistance"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* internet */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Internet / Connectivity
              </label>
              <input
                type="text"
                value={internet}
                onChange={(e) => setInternet(e.target.value)}
                placeholder="e.g. Fiber Optic, High Speed"
                data-testid="quickfact-internet"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* amenities */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelAmenities")}
              </label>
              <input
                type="text"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="e.g. Pool, Security, Gym"
                data-testid="quickfact-amenities"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* developer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelDeveloper")}
              </label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="Developer Name"
                data-testid="quickfact-developer"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* establishedYear */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelEstablished")}
              </label>
              <input
                type="text"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                placeholder="e.g. 2018"
                data-testid="quickfact-established"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* infrastructure */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelInfrastructure")}
              </label>
              <input
                type="text"
                value={infrastructure}
                onChange={(e) => setInfrastructure(e.target.value)}
                placeholder="details..."
                data-testid="quickfact-infrastructure"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
          </div>

          {/* Map and Geofence */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Geofence Polygon
              </h3>
              {polygonPoints.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearGeoFence}
                  className="text-xs text-red-500 hover:text-red-400 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("btnClearGeoFence")}</span>
                </button>
              )}
            </div>

            {/* Geofence Map */}
            <CommunityGeoFenceMap
              polygonPoints={polygonPoints}
              onChange={setPolygonPoints}
              centerLat={latitude ? parseFloat(latitude) : null}
              centerLng={longitude ? parseFloat(longitude) : null}
            />

            <p className="text-[11px] text-slate-500 leading-normal font-semibold">
              {t("geoFenceNote")}
            </p>

            {/* Manual coordinates textarea override */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-400">
                Manual Coordinates Override (JSON format)
              </label>
              <textarea
                value={geofenceText}
                onChange={(e) => handleGeofenceTextChange(e.target.value)}
                placeholder="[[-84.15,9.93],[-84.16,9.94],[-84.17,9.93],[-84.15,9.93]]"
                rows={3}
                data-testid="community-geofence-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-red-500 resize-y"
              />
            </div>

            {/* Map center lat/lng overrides */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  {t("formLabelLatitude")}
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="9.378"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">
                  {t("formLabelLongitude")}
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-83.702"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="lg:col-span-3 flex items-center justify-end gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/communities`)}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-all rounded-lg hover:bg-slate-800 cursor-pointer disabled:opacity-50 font-semibold"
          >
            {t("btnCancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            data-testid="save-community-btn"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSaving ? "Saving..." : t("btnSave")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
