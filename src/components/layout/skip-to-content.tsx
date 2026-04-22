/**
 * SkipToContent — WCAG 2.4.1 skip navigation link.
 *
 * Visually hidden by default using transform-based slide pattern.
 * Slides into view on keyboard focus. Must be the first focusable
 * element in the DOM (placed before <Header> in layout.tsx).
 *
 * Server Component — uses next-intl server-side translation.
 */

import { getTranslations } from "next-intl/server";

export async function SkipToContent() {
  const t = await getTranslations("SkipToContent");
  return (
    <a
      href="#main-content"
      className="skip-to-content bg-brand-navy text-text-on-dark px-6 py-3 text-sm font-semibold"
    >
      {t("label")}
    </a>
  );
}
