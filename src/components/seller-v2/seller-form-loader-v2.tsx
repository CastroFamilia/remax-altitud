"use client";

import dynamic from "next/dynamic";
import { SellerFormSkeleton } from "@/components/seller/seller-form-skeleton";
import type { Agent } from "@/lib/db/schema/agents";

interface SellerFormLoaderV2Props {
  locale: string;
  fallbackAgent: Agent | null;
  officeName?: string;
}

const SellerFormV2Dynamic = dynamic(
  () => import("./seller-form-v2").then((m) => ({ default: m.SellerFormV2 })),
  {
    ssr: false,
    loading: () => <SellerFormSkeleton />,
  },
);

export function SellerFormLoaderV2(props: SellerFormLoaderV2Props) {
  return <SellerFormV2Dynamic {...props} />;
}
