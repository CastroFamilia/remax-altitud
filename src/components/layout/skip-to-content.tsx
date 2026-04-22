/**
 * SkipToContent — WCAG 2.4.1 skip navigation link.
 *
 * Visually hidden by default using transform-based slide pattern.
 * Slides into view on keyboard focus. Must be the first focusable
 * element in the DOM (placed before <Header> in layout.tsx).
 *
 * Server Component — no client JS.
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-content bg-brand-navy text-text-on-dark px-6 py-3 text-sm font-semibold"
    >
      Skip to content
    </a>
  );
}
