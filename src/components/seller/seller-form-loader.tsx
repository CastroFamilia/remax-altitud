"use client";

/**
 * SellerFormLoader — Client Component wrapper using next/dynamic (ssr: false).
 *
 * This is a thin Client Component wrapper that lazy-loads SellerForm.
 * The 'use client' directive is required because next/dynamic with ssr: false
 * can only be called from Client Component context (Turbopack constraint).
 *
 * Ensures SellerForm's interactive code (~15KB) is NOT included in the initial
 * SSG page bundle (R-006, AC #14).
 *
 * IMPORTANT: Import this from sell/page.tsx (Server Component) — NOT
 * seller-form.tsx directly.
 *
 * Story 5.1 — pattern mirrors PropertyGalleryLoader (Story 4.1).
 */

import dynamic from "next/dynamic";
import { SellerFormSkeleton } from "@/components/seller/seller-form-skeleton";
import type { Agent } from "@/lib/db/schema/agents";

interface SellerFormLoaderProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

const SellerFormDynamic = dynamic(
  () => import("@/components/seller/seller-form").then((m) => ({ default: m.SellerForm })),
  {
    ssr: false,
    loading: () => <SellerFormSkeleton />,
  },
);

export function SellerFormLoader(props: SellerFormLoaderProps) {
  return <SellerFormDynamic {...props} />;
}
