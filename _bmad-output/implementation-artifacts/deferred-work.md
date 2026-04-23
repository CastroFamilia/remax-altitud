# Deferred Work

## Deferred from: code review of story-1.1 (2026-04-17)

- **Missing CSP header** — No `Content-Security-Policy` header configured. `X-XSS-Protection` is deprecated. CSP should be designed with allowed sources for scripts, styles, images, and fonts once the design system and third-party integrations (Mapbox, GA4, Sentry) are in place.
- **Missing HSTS header** — `Strict-Transport-Security` header should be added for defense-in-depth once Coolify/Caddy TLS deployment is finalized and confirmed working.
- **No HEALTHCHECK in Dockerfile** — The `/api/health` endpoint exists but the Dockerfile lacks a `HEALTHCHECK` instruction. Add `HEALTHCHECK CMD wget -q --spider http://localhost:3000/api/health || exit 1` when Coolify deployment is finalized.

## Deferred from: code review of 1-4-internationalization-en-es.md (2026-04-22)
- Inconsistent design token usage in layout [src/app/[locale]/layout.tsx]. Typography (Montserrat) and some styles use direct imports instead of theme-wrapped tokens.

## Deferred from: code review of 1-5-homepage-shell-and-split-hero.md (2026-04-22)
- Mobile horizontal carousels (Featured Properties / Featured Communities / Area Highlights) lack an explicit scroll affordance for off-screen cards [src/components/home/homepage-sections.tsx:44]. Partial-card peek at `w-[80%]` implies scrollability but a fade-right gradient, peek-indicator chevron, or scroll dots would improve discovery. Not an AC #8 regression.
- `HeroSearchShell` ships both `mobile-inline` and `desktop-overlay` variants in the DOM at all times; only one is visible per breakpoint via `md:hidden` / `hidden md:block` [src/components/home/split-hero.tsx:112,125]. Minor DOM weight duplication; consider conditional rendering when the shell becomes functional in Epic 3.

## Deferred from: code review of 1-6-static-content-pages.md (2026-04-23)
- Email regex permissive vs SMTP reality [src/components/lead/contact-form.tsx:1037] — matches spec Task 4 rule verbatim; revisit when `react-hook-form` + `zod` land in Epic 5 Story 5-3.
- Phone validation is digit-count only, no country-code check [src/components/lead/contact-form.tsx:1325] — matches spec Task 4 rule verbatim; Epic 5 owns stricter E.164 validation.
- `buildWhatsAppUrl` fallback returns `tel:` despite the function name [src/lib/constants/offices.ts:56-62] — matches spec Task 2 prescribed behavior. Consider renaming to `buildContactUrl` in a later pass.
- Hardcoded `alternates.languages` duplicated across 4 pages [src/app/[locale]/{about,services,contact,join}/page.tsx] — Epic 4 Story 4-4 (SEO architecture) owns the hreflang helper module.
- `!important` Tailwind modifiers in SimplePageLayout typography [src/components/layout/simple-page-layout.tsx:806,810] — documented Tailwind v4 workaround from Story 1.5 Debug Log #2; revisit if `@theme inline` migration happens.
- `CONTACT_INBOX` / `RECRUIT_INBOX` hardcoded [src/components/lead/contact-form.tsx:938-939] — Epic 5 Story 5-3 swap point (replaces `mailto:` with `POST /api/leads`).
- Recruitment form permits submit with zero languages selected [src/components/lead/contact-form.tsx:1301-1303] — spec Task 4 validation rules do not list `languages` as required; if client wants ≥ 1 language, add in a follow-up ticket.
- OfficeCard hardcodes `AboutPage.office` namespace, limiting cross-page reuse [src/components/layout/office-card.tsx:831] — promote to a shared `Office.*` namespace when a second consumer needs divergent labels.
- Placeholder office emails + derived WhatsApp numbers reach production [src/lib/constants/offices.ts:17-31, src/messages/en.json:163] — already flagged with top-of-file TODO per spec Task 2; client to confirm before launch.
