"use client";

import dynamic from "next/dynamic";
import type { Property } from "@/lib/db/schema/properties";
import type { Agent } from "@/lib/db/schema/agents";

interface PropertyPrintViewLoaderProps {
  property: Property;
  locale: string;
  agent: Agent | null;
  officeName: string;
}

const PropertyPrintViewDynamic = dynamic(
  () =>
    import("@/components/listing/property-print-view").then((m) => ({
      default: m.PropertyPrintView,
    })),
  {
    ssr: false,
    loading: () => null, // Renders nothing during hydration loading
  },
);

export function PropertyPrintViewLoader(props: PropertyPrintViewLoaderProps) {
  return <PropertyPrintViewDynamic {...props} />;
}
