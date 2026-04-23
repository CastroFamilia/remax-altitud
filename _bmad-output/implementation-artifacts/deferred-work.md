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
