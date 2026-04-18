# Deferred Work

## Deferred from: code review of story-1.1 (2026-04-17)

- **Missing CSP header** — No `Content-Security-Policy` header configured. `X-XSS-Protection` is deprecated. CSP should be designed with allowed sources for scripts, styles, images, and fonts once the design system and third-party integrations (Mapbox, GA4, Sentry) are in place.
- **Missing HSTS header** — `Strict-Transport-Security` header should be added for defense-in-depth once Coolify/Caddy TLS deployment is finalized and confirmed working.
- **No HEALTHCHECK in Dockerfile** — The `/api/health` endpoint exists but the Dockerfile lacks a `HEALTHCHECK` instruction. Add `HEALTHCHECK CMD wget -q --spider http://localhost:3000/api/health || exit 1` when Coolify deployment is finalized.
