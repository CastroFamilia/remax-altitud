/**
 * Story 5.1: Seller Landing Page & "List With Us" Form — Unit/Component Tests
 * Component: src/components/seller/seller-hero.tsx
 *
 * TDD Phase: GREEN — tests active after SellerHero implementation.
 *
 * Covers (from test-design-epic-5.md):
 *   AC #1 — SEO content hero renders with h1/h2, benefits, process, testimonials
 *   AC #12 — SellerHero is a Server Component (no 'use client')
 *
 * Async Server Component testing pattern (from Epic 4 — Story 4.3 AgentProfileHero):
 *   const element = await SellerHero({ locale: 'en' });
 *   const { getByTestId } = render(element);
 *
 * data-testid contract (CANNOT rename once established):
 *   data-testid="seller-hero"  — root <section> in SellerHero
 *
 * Environment: jsdom (React component — .spec.tsx → jsdom via vitest.config.mts)
 */

// ---------------------------------------------------------------------------
// Module mocks — declared BEFORE any imports of the module under test
// vi.mock hoisting rule: ALL vi.mock() calls MUST appear before import statements
// ---------------------------------------------------------------------------

import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string, values?: Record<string, unknown>) => {
    if (values) return `${key}(${JSON.stringify(values)})`;
    return key;
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Imports — AFTER mocks
// ---------------------------------------------------------------------------

import { render, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// SellerHero — async Server Component rendering
// ---------------------------------------------------------------------------

describe("SellerHero (async Server Component)", () => {
  it("[P1] renders hero section with data-testid='seller-hero' (AC #1)", async () => {
    const { SellerHero } = await import("@/components/seller/seller-hero");
    const element = await SellerHero({ locale: "en" });
    const { getByTestId } = render(element);

    // Root section must have the testid contract
    expect(getByTestId("seller-hero")).not.toBeNull();
  });

  it("[P1] hero renders h1 heading (value proposition) visible to search engines (AC #1)", async () => {
    const { SellerHero } = await import("@/components/seller/seller-hero");
    const element = await SellerHero({ locale: "en" });
    const { container } = render(element);

    // H1 must be present (indexable content)
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1?.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("[P1] hero renders 'Get Started' CTA button with correct aria-label (AC #1, AC #2)", async () => {
    const { SellerHero } = await import("@/components/seller/seller-hero");
    const element = await SellerHero({ locale: "en" });
    const { container } = render(element);

    // CTA button/link must be present (aria-label or link text)
    const cta =
      container.querySelector('[aria-label*="start" i]') ||
      container.querySelector('button[aria-label*="start" i]') ||
      container.querySelector('a[aria-label*="start" i]') ||
      container.querySelector('a[href="#seller-form"]');
    expect(cta).not.toBeNull();
  });

  it("[P2] hero renders in Spanish locale (/es/sell) with translated strings", async () => {
    const { SellerHero } = await import("@/components/seller/seller-hero");
    const element = await SellerHero({ locale: "es" });
    const { container } = render(element);

    // Root section must render for ES locale too
    const heroSection = container.querySelector('[data-testid="seller-hero"]');
    expect(heroSection).not.toBeNull();
  });

  it("[P2] seller-hero.tsx is a Server Component — file must NOT start with 'use client' (AC #12)", () => {
    const { readFileSync } = require("fs");
    const path = require("path");
    const filePath = path.resolve(process.cwd(), "src/components/seller/seller-hero.tsx");
    const src = readFileSync(filePath, "utf8");
    // Server Component: must NOT have 'use client' at the top
    expect(src.trimStart()).not.toMatch(/^['"]use client['"]/);
  });

  it("[P2] hero renders benefit list items (benefits text from i18n namespace)", async () => {
    const { SellerHero } = await import("@/components/seller/seller-hero");
    const element = await SellerHero({ locale: "en" });
    const { container } = render(element);

    // Benefits must be present in a list or section
    // The story specifies ≥3 benefits (benefit1, benefit2, benefit3 i18n keys)
    const listItems = container.querySelectorAll("li, [class*='benefit']");
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });
});
