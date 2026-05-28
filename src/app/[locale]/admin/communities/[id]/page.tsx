import React from "react";
import { setRequestLocale } from "next-intl/server";
import { getCommunityById } from "@/lib/db/queries/communities";
import { getAllAreas } from "@/lib/db/queries/areas";
import { AdminCommunityForm, AreaOption } from "@/components/admin/admin-community-form";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { redirect, notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function AdminEditCommunityPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Authenticate Admin
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  const adminPassword =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? undefined : "admin");
  const expectedSession = adminPassword
    ? createHash("sha256").update(adminPassword).digest("hex")
    : undefined;
  const isAuthenticated = !!expectedSession && session === expectedSession;

  if (!isAuthenticated) {
    redirect(`/${locale}/admin?login=true`);
  }

  // Fetch community
  const community = await getCommunityById(id);
  if (!community) {
    notFound();
  }

  // Fetch areas to populate form select
  const dbAreas = await getAllAreas();
  const areaOptions: AreaOption[] = dbAreas.map((area) => ({
    id: area.id,
    nameEn: area.nameEn,
    nameEs: area.nameEs,
    slug: area.slug,
  }));

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      <AdminCommunityForm locale={locale} initialData={community} areas={areaOptions} />
    </div>
  );
}
