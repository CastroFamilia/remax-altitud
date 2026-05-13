"use client";

/**
 * CmaFormLoader — Client Component wrapper using next/dynamic (ssr: false).
 *
 * Thin Client Component wrapper that lazy-loads CmaForm.
 * The 'use client' directive is required because next/dynamic with ssr: false
 * can only be called from Client Component context (Turbopack constraint).
 *
 * Story 5.2 — pattern mirrors SellerFormLoader (Story 5.1).
 */

import dynamic from "next/dynamic";
import { SellerFormSkeleton } from "@/components/seller/seller-form-skeleton";
import type { Agent } from "@/lib/db/schema/agents";

interface CmaFormLoaderProps {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

const CmaFormDynamic = dynamic(
  () => import("@/components/seller/cma-form").then((m) => ({ default: m.CmaForm })),
  {
    ssr: false,
    loading: () => <SellerFormSkeleton />,
  },
);

export function CmaFormLoader(props: CmaFormLoaderProps) {
  return <CmaFormDynamic {...props} />;
}
