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
import { AdminCommunityListings } from "@/components/admin/admin-community-listings";
import { normalizeGeoFenceCoords } from "@/lib/map/normalize-geofence";

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

export interface InitialCommunityData {
  id: string;
  name: string;
  slug: string;
  areaId: string;
  taglineEn?: string | null;
  taglineEs?: string | null;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  heroImageUrl?: string | null;
  siteMapImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  quickFacts?: unknown;
  geoFenceCoords?: unknown;
}

export interface CommunityFormProps {
  locale: string;
  initialData?: InitialCommunityData | null;
  areas: AreaOption[];
}

export function AdminCommunityForm({ locale, initialData, areas }: CommunityFormProps) {
  const t = useTranslations("AdminCommunities");
  const router = useRouter();
  const isEdit = !!initialData;

  // Form states
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [areaId, setAreaId] = useState(initialData?.areaId || "");
  const [taglineEn, setTaglineEn] = useState(initialData?.taglineEn || "");
  const [taglineEs, setTaglineEs] = useState(initialData?.taglineEs || "");
  const [descriptionEn, setDescriptionEn] = useState(initialData?.descriptionEn || "");
  const [descriptionEs, setDescriptionEs] = useState(initialData?.descriptionEs || "");
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.heroImageUrl || "");
  const [siteMapImageUrl, setSiteMapImageUrl] = useState(initialData?.siteMapImageUrl || "");

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

  // Quick facts — bilingual (EN/ES suffixed keys, with legacy fallback)
  interface QuickFactsType {
    elevation?: string;
    elevationEn?: string;
    elevationEs?: string;
    airportDistance?: string;
    airportDistanceEn?: string;
    airportDistanceEs?: string;
    amenities?: string[] | string;
    amenitiesEn?: string[] | string;
    amenitiesEs?: string[] | string;
    developer?: string;
    developerEn?: string;
    developerEs?: string;
    establishedYear?: string;
    established?: string;
    establishedEn?: string;
    establishedEs?: string;
    infrastructure?: string;
    infrastructureEn?: string;
    infrastructureEs?: string;
    internet?: string;
    internetEn?: string;
    internetEs?: string;
  }
  const quickFacts = initialData?.quickFacts as QuickFactsType | null | undefined;

  /** Read locale-suffixed key first, fall back to legacy unsuffixed key */
  const qfStr = (en: string | undefined, legacy: string | undefined) => en || legacy || "";
  const qfAmenities = (
    localized: string[] | string | undefined,
    legacy: string[] | string | undefined,
  ) => {
    const val = localized || legacy;
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") return val;
    return "";
  };

  const [elevationEn, setElevationEn] = useState(
    qfStr(quickFacts?.elevationEn, quickFacts?.elevation),
  );
  const [elevationEs, setElevationEs] = useState(quickFacts?.elevationEs || "");
  const [airportDistanceEn, setAirportDistanceEn] = useState(
    qfStr(quickFacts?.airportDistanceEn, quickFacts?.airportDistance),
  );
  const [airportDistanceEs, setAirportDistanceEs] = useState(quickFacts?.airportDistanceEs || "");
  const [amenitiesEn, setAmenitiesEn] = useState(
    qfAmenities(quickFacts?.amenitiesEn, quickFacts?.amenities),
  );
  const [amenitiesEs, setAmenitiesEs] = useState(qfAmenities(quickFacts?.amenitiesEs, undefined));
  const [developerEn, setDeveloperEn] = useState(
    qfStr(quickFacts?.developerEn, quickFacts?.developer),
  );
  const [developerEs, setDeveloperEs] = useState(quickFacts?.developerEs || "");
  const [establishedYearEn, setEstablishedYearEn] = useState(
    qfStr(quickFacts?.establishedEn, quickFacts?.establishedYear || quickFacts?.established),
  );
  const [establishedYearEs, setEstablishedYearEs] = useState(quickFacts?.establishedEs || "");
  const [infrastructureEn, setInfrastructureEn] = useState(
    qfStr(quickFacts?.infrastructureEn, quickFacts?.infrastructure),
  );
  const [infrastructureEs, setInfrastructureEs] = useState(quickFacts?.infrastructureEs || "");
  const [internetEn, setInternetEn] = useState(qfStr(quickFacts?.internetEn, quickFacts?.internet));
  const [internetEs, setInternetEs] = useState(quickFacts?.internetEs || "");

  // Geofence polygon points
  // Use normalizeGeoFenceCoords to handle both flat-array (seed data) and
  // GeoJSON { type: "Polygon", coordinates: [...] } (admin-saved) formats.
  const initialPoints = (() => {
    const normalized = normalizeGeoFenceCoords(initialData?.geoFenceCoords);
    if (!normalized || normalized.length === 0) return [];
    // Filter out last closed point if it matches the first one to avoid duplicate on render click
    if (normalized.length > 2) {
      const first = normalized[0];
      const last = normalized[normalized.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) {
        return normalized.slice(0, -1);
      }
    }
    return normalized;
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

  // Auto-slug generation from English name (only on create)
  useEffect(() => {
    if (!isEdit && name) {
      const slugified = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(slugified);
    }
  }, [name, isEdit]);

  // Set center points based on polygon draw
  useEffect(() => {
    if (polygonPoints.length > 0 && !latitude && !longitude) {
      // Calculate polygon center/average or just use first point
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
      const parseAmenities = (raw: string) =>
        raw
          .split(",")
          .map((a: string) => a.trim())
          .filter((a: string) => a !== "");

      const parsedElevationEn = elevationEn.trim();
      const parsedElevationEs = elevationEs.trim();
      const parsedAirportDistanceEn = airportDistanceEn.trim();
      const parsedAirportDistanceEs = airportDistanceEs.trim();
      const parsedAmenitiesEn = parseAmenities(amenitiesEn);
      const parsedAmenitiesEs = parseAmenities(amenitiesEs);
      const parsedDeveloperEn = developerEn.trim();
      const parsedDeveloperEs = developerEs.trim();
      const parsedEstablishedYearEn = establishedYearEn.trim();
      const parsedEstablishedYearEs = establishedYearEs.trim();
      const parsedInfrastructureEn = infrastructureEn.trim();
      const parsedInfrastructureEs = infrastructureEs.trim();
      const parsedInternetEn = internetEn.trim();
      const parsedInternetEs = internetEs.trim();

      const quickFactsObj = {
        // Locale-suffixed keys (primary)
        elevationEn: parsedElevationEn,
        elevationEs: parsedElevationEs,
        airportDistanceEn: parsedAirportDistanceEn,
        airportDistanceEs: parsedAirportDistanceEs,
        amenitiesEn: parsedAmenitiesEn,
        amenitiesEs: parsedAmenitiesEs,
        developerEn: parsedDeveloperEn,
        developerEs: parsedDeveloperEs,
        establishedEn: parsedEstablishedYearEn,
        establishedEs: parsedEstablishedYearEs,
        infrastructureEn: parsedInfrastructureEn,
        infrastructureEs: parsedInfrastructureEs,
        internetEn: parsedInternetEn,
        internetEs: parsedInternetEs,
        // Legacy unsuffixed keys (backward compatibility)
        elevation: parsedElevationEn,
        airportDistance: parsedAirportDistanceEn,
        amenities: parsedAmenitiesEn,
        developer: parsedDeveloperEn,
        establishedYear: parsedEstablishedYearEn,
        established: parsedEstablishedYearEn,
        infrastructure: parsedInfrastructureEn,
        internet: parsedInternetEn,
      };

      const latNum = latitude.trim() !== "" ? parseFloat(latitude) : null;
      const lngNum = longitude.trim() !== "" ? parseFloat(longitude) : null;

      // Format Geofence polygon properly for PostGIS & JSONB
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
        taglineEn: taglineEn.trim() || null,
        taglineEs: taglineEs.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
        descriptionEs: descriptionEs.trim() || null,
        heroImageUrl: heroImageUrl.trim() || null,
        siteMapImageUrl: siteMapImageUrl.trim() || null,
        latitude: latNum,
        longitude: lngNum,
        geoFence,
        geoFenceCoords,
        quickFacts: quickFactsObj,
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
      {/* Header Back Link */}
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

      {/* Alert Status */}
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

      {/* Main Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details */}
        <div className="lg:col-span-2 space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
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

            {/* Slug */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelArea")} <span className="text-red-500">*</span>
              </label>
              <AreaSearchCombobox
                areas={areas.map((a) => ({
                  slug: a.slug,
                  label: locale === "es" ? a.nameEs : a.nameEn,
                  isSubLocation: false,
                }))}
                selectedArea={areas.find((a) => a.id === areaId)?.slug || ""}
                selectedSubLocation=""
                onAreaChange={(selectedSlug) => {
                  const matchedArea = areas.find((a) => a.slug === selectedSlug);
                  if (matchedArea) {
                    setAreaId(matchedArea.id);
                  }
                }}
                placeholder={locale === "es" ? "Seleccione un Área..." : "Select Area..."}
                locale={locale}
                variant="dark"
              />
            </div>

            {/* Image URLs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t("formLabelHeroImage")}
              </label>
              <input
                type="url"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="https://example.com/hero.jpg"
                data-testid="community-hero-image-input"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Bilingual Taglines */}
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

          {/* Site Map URL */}
          <div className="space-y-1.5 border-t border-slate-800 pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("formLabelSiteMap")}
            </label>
            <input
              type="url"
              value={siteMapImageUrl}
              onChange={(e) => setSiteMapImageUrl(e.target.value)}
              placeholder="https://example.com/sitemap.jpg"
              data-testid="community-sitemap-image-input"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Right 1 Column: Quick Facts & Geofence Map */}
        <div className="space-y-6">
          {/* Quick Facts Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>{t("formLabelQuickFacts")}</span>
            </h3>

            {/* elevation — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelElevation")} — EN
              </label>
              <input
                type="text"
                value={elevationEn}
                onChange={(e) => setElevationEn(e.target.value)}
                placeholder="e.g. 800m"
                data-testid="quickfact-elevation-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelElevation")} — ES
              </label>
              <input
                type="text"
                value={elevationEs}
                onChange={(e) => setElevationEs(e.target.value)}
                placeholder="ej. 800m"
                data-testid="quickfact-elevation-es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* airportDistance — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelAirport")} — EN
              </label>
              <input
                type="text"
                value={airportDistanceEn}
                onChange={(e) => setAirportDistanceEn(e.target.value)}
                placeholder="e.g. 45 mins"
                data-testid="quickfact-airportDistance-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelAirport")} — ES
              </label>
              <input
                type="text"
                value={airportDistanceEs}
                onChange={(e) => setAirportDistanceEs(e.target.value)}
                placeholder="ej. 45 mins"
                data-testid="quickfact-airportDistance-es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* internet — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Internet / Connectivity — EN
              </label>
              <input
                type="text"
                value={internetEn}
                onChange={(e) => setInternetEn(e.target.value)}
                placeholder="e.g. Fiber Optic, High Speed"
                data-testid="quickfact-internet-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Internet / Connectivity — ES
              </label>
              <input
                type="text"
                value={internetEs}
                onChange={(e) => setInternetEs(e.target.value)}
                placeholder="ej. Fibra óptica"
                data-testid="quickfact-internet-es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* amenities — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelAmenities")} — EN
              </label>
              <input
                type="text"
                value={amenitiesEn}
                onChange={(e) => setAmenitiesEn(e.target.value)}
                placeholder="e.g. Pool, Security, Gym"
                data-testid="quickfact-amenities-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelAmenities")} — ES
              </label>
              <input
                type="text"
                value={amenitiesEs}
                onChange={(e) => setAmenitiesEs(e.target.value)}
                placeholder="ej. Piscina, Seguridad, Gimnasio"
                data-testid="quickfact-amenities-es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* developer — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelDeveloper")} — EN
              </label>
              <input
                type="text"
                value={developerEn}
                onChange={(e) => setDeveloperEn(e.target.value)}
                placeholder="Developer Name"
                data-testid="quickfact-developer-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelDeveloper")} — ES
              </label>
              <input
                type="text"
                value={developerEs}
                onChange={(e) => setDeveloperEs(e.target.value)}
                placeholder="Nombre del desarrollador"
                data-testid="quickfact-developer-es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* establishedYear — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelEstablished")} — EN
              </label>
              <input
                type="text"
                value={establishedYearEn}
                onChange={(e) => setEstablishedYearEn(e.target.value)}
                placeholder="e.g. 2018"
                data-testid="quickfact-established-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelEstablished")} — ES
              </label>
              <input
                type="text"
                value={establishedYearEs}
                onChange={(e) => setEstablishedYearEs(e.target.value)}
                placeholder="ej. 2018"
                data-testid="quickfact-established-es"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>

            {/* infrastructure — EN / ES */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelInfrastructure")} — EN
              </label>
              <input
                type="text"
                value={infrastructureEn}
                onChange={(e) => setInfrastructureEn(e.target.value)}
                placeholder="details..."
                data-testid="quickfact-infrastructure-en"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                {t("formLabelInfrastructure")} — ES
              </label>
              <input
                type="text"
                value={infrastructureEs}
                onChange={(e) => setInfrastructureEs(e.target.value)}
                placeholder="detalles..."
                data-testid="quickfact-infrastructure-es"
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

      {/* Community Listings (Edit Mode Only) */}
      {isEdit && initialData && (
        <AdminCommunityListings communityId={initialData.id} locale={locale} />
      )}
    </div>
  );
}
