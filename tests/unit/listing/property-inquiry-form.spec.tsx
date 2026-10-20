import { vi, describe, it, expect, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...(props as Record<string, unknown>)} />;
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    () => (key: string, values?: Record<string, unknown>) =>
      values ? `${key}(${JSON.stringify(values)})` : key,
  ),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@/lib/utils/whatsapp", () => ({
  buildWhatsAppMessage: vi.fn(() => "Test WhatsApp message"),
  buildWhatsAppUrl: vi.fn(
    (phone: string, msg: string) =>
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
  ),
}));

vi.mock("@/components/lead/whatsapp-cta", () => ({
  trackWhatsAppClick: vi.fn(),
}));

vi.mock("@/lib/utils/utm", () => ({
  extractUtmParams: vi.fn(() => ({})),
}));

import { PropertyInquiryForm } from "@/components/listing/property-inquiry-form";
import type { Property } from "@/lib/db/schema/properties";

const mockAgent = {
  id: "agent-uuid-1",
  apiId: "api-agent-1",
  officeId: "office-uuid-1",
  slug: "yeudi-cisneros",
  name: "Yeudi Cisneros",
  email: "yeudi@remax-altitud.cr",
  phone: "+506 8800-0000",
  whatsapp: "50688000000",
  photoUrl: "https://cdn.example.com/yeudi.jpg",
  photoOptimizedUrl: "/agent-photos/yeudi-400w.webp",
  videoUrl: null,
  languages: ["es"],
  specializations: [],
  bioEn: "",
  bioEs: "",
  listingCount: 30,
  isActive: true,
  syncedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockProperty = {
  id: "prop-1",
  apiId: "400344275004",
  slug: "farm-for-sale",
  titleEn: "Productive Farm for Sale",
  titleEs: "Finca Productiva en Venta",
  priceUsd: 240000,
  bedrooms: 0,
  bathrooms: 0,
  lotSizeM2: 55000,
  constructionM2: 0,
  zmtStatus: "none",
  propertyType: "Farm/Ranch",
  status: "Active",
  areaSlug: "pueblo-nuevo",
  images: [],
  latitude: 9.35,
  longitude: -83.65,
  apiRaw: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  syncedAt: new Date(),
  officeId: "office-uuid-1",
  agentId: "agent-uuid-1",
  isVisible: true,
} as unknown as Property;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PropertyInquiryForm agent profile link", () => {
  it("renders a link to the agent profile around the agent name when agent has a slug", () => {
    render(
      <PropertyInquiryForm
        property={mockProperty}
        agent={mockAgent}
        locale="es"
        officeName="REMAX Altitud"
      />,
    );

    const nameLink = screen.getByTestId("agent-name-link");
    expect(nameLink).toBeTruthy();
    expect(nameLink.getAttribute("href")).toBe("/agents/yeudi-cisneros");
    expect(nameLink.textContent).toContain("Yeudi Cisneros");
  });

  it("renders a link to the agent profile around the photo when agent has a slug", () => {
    render(
      <PropertyInquiryForm
        property={mockProperty}
        agent={mockAgent}
        locale="es"
        officeName="REMAX Altitud"
      />,
    );

    const photoLink = screen.getByTestId("agent-photo-link");
    expect(photoLink).toBeTruthy();
    expect(photoLink.getAttribute("href")).toBe("/agents/yeudi-cisneros");
  });

  it("renders plain text agent name without link when agent has no slug", () => {
    const agentWithoutSlug = { ...mockAgent, slug: "" };
    render(
      <PropertyInquiryForm
        property={mockProperty}
        agent={agentWithoutSlug}
        locale="es"
        officeName="REMAX Altitud"
      />,
    );

    expect(screen.queryByRole("link", { name: /Yeudi Cisneros/i })).toBeNull();
    expect(screen.getByText("Yeudi Cisneros")).toBeTruthy();
  });
});
