# Story 1.6: Static Content Pages

Status: done

## Story

As a **visitor**,
I want to learn about REMAX Altitud's team, services, and how to contact them,
So that I can trust the company and reach out through my preferred channel.

## Acceptance Criteria

1. **Given** `/en/about` or `/es/about` is visited **When** the page renders **Then** it displays `<main>`-wrapped, SSG-rendered content for **both** offices — REMAX Altitud (Pérez Zeledón) and REMAX Altitud Cero (Dominical/Uvita) — including office name, location, full address, phone, email, and a "List with Us" CTA linking to `/sell` (FR68).

2. **Given** `/en/services` or `/es/services` is visited **When** the page renders **Then** it displays three service cards — **Buy**, **Sell**, **Invest** — each with a heading, 2–4 sentence description, 3–5 bullet highlights, and a locale-aware CTA (`/search`, `/sell`, `/search?tag=investment` respectively), fully translated in EN and ES (FR68). _Updated 2026-04-23: query string uses `tag=` to match the lifestyle-tag filter naming finalized in Epic 3 Story 3-4._

3. **Given** `/en/contact` or `/es/contact` is visited **When** the page renders **Then** it displays an office directory block (both offices: address, phone, email, WhatsApp link) **plus** a contact form with fields: name (required), email (required, valid), phone (optional), preferred office (select: PZ / Dominical-Uvita / Any), preferred language (select: EN / ES / Other), and message (required, ≥ 10 chars) (FR68).

4. **Given** the contact form is submitted with valid data **When** the submit handler runs **Then** a success toast appears ("Thanks — we'll be in touch within 24 hours"), the form is cleared, **and** a `mailto:` fallback is triggered as the lead-capture mechanism (no database persistence — Epic 5 Story 5-3 will replace `mailto:` with a real `/api/leads` endpoint). The submit handler is isolated in a single client-side function so Epic 5 can swap the implementation without touching form markup.

5. **Given** the contact form is submitted with invalid or missing data **When** the submit handler runs **Then** inline field-level error messages render below each offending input (not a blocking alert), the first invalid field receives focus, and no mailto: is opened.

6. **Given** `/en/join` or `/es/join` is visited **When** the page renders **Then** it displays recruitment benefits (REMAX brand, multilingual lead gen, training, office support) **plus** a lightweight inquiry form with fields: name, email, phone, current license status (select: Licensed / Studying / Not yet), languages spoken (multi-select: EN, ES, IT, DE, FR, PT), area of interest (select: PZ / Dominical-Uvita / Either), and message (optional) (FR61, FR68).

7. **Given** any of the four static pages **When** the HTML is inspected **Then** the document contains exactly one `<h1>`, uses semantic landmarks (`<main>` inherited from layout, `<section>` for each logical block, `<article>` where appropriate), and each heading follows the hierarchy (`<h1>` → `<h2>` → `<h3>`) with no skipped levels.

8. **Given** each page is crawled **When** inspecting `<head>` **Then** page-scoped `generateMetadata()` produces a localized `<title>`, `<meta name="description">`, and OpenGraph `og:title` / `og:description`. The four pages produce **eight distinct** `(locale, path)` metadata pairs (no collisions with the homepage `Metadata` namespace).

9. **Given** `prefers-reduced-motion: reduce` is active **When** any static page loads **Then** no auto-playing animations or transitions fire beyond the existing reduced-motion overrides in `globals.css`.

10. **Given** EN and ES are both active **When** switching locale on any of the four pages **Then** all headings, body copy, form labels, placeholders, validation messages, submit buttons, and toast messages update; no hardcoded English strings remain; `<html lang>` updates dynamically (Story 1.4 contract).

11. **Given** the build **When** `npm run build` runs **Then** `/en/about`, `/es/about`, `/en/services`, `/es/services`, `/en/contact`, `/es/contact`, `/en/join`, and `/es/join` all appear as **static** routes (`○` or `●` in the build output, never `ƒ Dynamic`), satisfying NFR25.

12. **Given** CI runs **When** `npm run lint`, `npm run typecheck`, and `npm run build` execute **Then** all three succeed with zero errors and zero warnings.

13. **Given** a keyboard user **When** tabbing through any of the four pages **Then** focus moves predictably: Skip-to-content → Header → Main content (in DOM order) → Form fields → Submit button → Footer; all interactive elements show the dual-ring focus indicator from `globals.css`.

14. **Given** a Lighthouse audit is run against `/en/about`, `/en/services`, `/en/contact`, and `/en/join` on a local `next start` build **When** the mobile profile is used **Then** each page scores ≥ 80 in Performance, Accessibility, and SEO (NFR28 — flag any category below 80 in the Dev Agent Record).

15. **Given** the existing Footer **When** it renders **Then** the "Join Our Team" link targets `/join` (not `/careers` as previously wired) so the Footer link resolves to an existing page — this is a **targeted** correction, not a broader Footer refactor.

## Tasks / Subtasks

### Task 1: Extend i18n message files with four new page namespaces (AC: #1, #2, #3, #6, #10)

- [x] Update `src/messages/en.json` — add **four new top-level namespaces** (after `HomePage`, before `Metadata`). Keep existing namespaces untouched.
  ```json
  "AboutPage": {
    "metaTitle": "About REMAX Altitud — Costa Rica's Southern Zone",
    "metaDescription": "Learn about REMAX Altitud and Altitud Cero — the premier real estate team serving Pérez Zeledón, Dominical, and Uvita.",
    "pageTitle": "About REMAX Altitud",
    "intro": "REMAX Altitud and REMAX Altitud Cero unite two offices under one promise: guide international and local clients through buying, selling, and investing in Costa Rica's Southern Zone — in the language they prefer.",
    "officesHeading": "Our Offices",
    "officesIntro": "Two offices, one team — covering the mountains of Pérez Zeledón and the Pacific coast from Dominical to Uvita.",
    "office": {
      "locationLabel": "Location",
      "addressLabel": "Address",
      "phoneLabel": "Phone",
      "emailLabel": "Email",
      "whatsappLabel": "WhatsApp",
      "viewOnMap": "View on map",
      "callUs": "Call us",
      "emailUs": "Email us"
    },
    "mission": {
      "heading": "Our Mission",
      "body": "Turn curiosity into confidence. Whether you're exploring mountain living, beachfront rentals, or long-term investments, our agents know the terrain, the paperwork, and the culture — and we speak your language."
    },
    "cta": {
      "heading": "Ready to start your search?",
      "primary": "Browse properties",
      "primaryHref": "/search",
      "secondary": "List with us",
      "secondaryHref": "/sell"
    }
  },
  "ServicesPage": {
    "metaTitle": "Our Services — Buy, Sell, Invest in Costa Rica",
    "metaDescription": "REMAX Altitud helps you buy your dream home, sell with confidence, or invest in Costa Rica's Southern Zone.",
    "pageTitle": "How We Help",
    "intro": "Three services, one team. Every client of REMAX Altitud gets a bilingual agent, local knowledge, and a seamless path from first search to closing.",
    "buy": {
      "heading": "Buy",
      "description": "Find a home or vacation property you'll love — in the language you prefer.",
      "bullets": [
        "Map-first search across both offices",
        "Agent matched to your language and lifestyle",
        "Guidance through ZMT, concession, and titled zones",
        "WhatsApp-first communication"
      ],
      "cta": "Browse properties",
      "ctaHref": "/search"
    },
    "sell": {
      "heading": "Sell",
      "description": "List with the Southern Zone's most visible team — reach 6 language markets from day one.",
      "bullets": [
        "Multilingual marketing on remax-altitud.cr",
        "Professional photography and media",
        "Qualified-lead routing and agent follow-up",
        "Free comparative market analysis (CMA)"
      ],
      "cta": "List with us",
      "ctaHref": "/sell"
    },
    "invest": {
      "heading": "Invest",
      "description": "Discover rental-ready condos, raw land, and appreciating lots — from $100K to luxury compounds.",
      "bullets": [
        "Lifestyle tags surface investment-grade listings",
        "Appreciation and rental-yield context by area",
        "Experienced agents for foreign buyers",
        "Shortlist and compare across both offices"
      ],
      "cta": "See investment properties",
      "ctaHref": "/search?tag=investment"
    }
  },
  "ContactPage": {
    "metaTitle": "Contact REMAX Altitud",
    "metaDescription": "Reach REMAX Altitud in Pérez Zeledón or REMAX Altitud Cero in Dominical/Uvita — by phone, email, WhatsApp, or contact form.",
    "pageTitle": "Contact Us",
    "intro": "We reply within 24 hours. Reach us by WhatsApp, phone, or the form below — in English or Spanish.",
    "officesHeading": "Our Offices",
    "formHeading": "Send us a message",
    "formIntro": "Tell us what you're looking for and we'll match you with an agent.",
    "form": {
      "nameLabel": "Full name",
      "namePlaceholder": "Your name",
      "nameError": "Please enter your name.",
      "emailLabel": "Email",
      "emailPlaceholder": "you@example.com",
      "emailError": "Please enter a valid email.",
      "phoneLabel": "Phone (optional)",
      "phonePlaceholder": "+506 0000-0000",
      "officeLabel": "Preferred office",
      "officeOptionAny": "Either office",
      "officeOptionPZ": "REMAX Altitud — Pérez Zeledón",
      "officeOptionDOM": "REMAX Altitud Cero — Dominical / Uvita",
      "languageLabel": "Preferred language",
      "languageOptionEN": "English",
      "languageOptionES": "Spanish",
      "languageOptionOther": "Other",
      "messageLabel": "Message",
      "messagePlaceholder": "What are you looking for?",
      "messageError": "Please write at least 10 characters.",
      "submit": "Send message",
      "submitting": "Sending…",
      "successToast": "Thanks — we'll be in touch within 24 hours.",
      "errorToast": "Something went wrong. Please email us directly at info@remax-altitud.cr.",
      "mailtoFallback": "Your email app will open with a pre-filled message."
    }
  },
  "JoinPage": {
    "metaTitle": "Join Our Team — REMAX Altitud Careers",
    "metaDescription": "Become a REMAX Altitud agent. Multilingual lead generation, training, and the REMAX brand — in Costa Rica's Southern Zone.",
    "pageTitle": "Join Our Team",
    "intro": "Grow your real estate career with REMAX Altitud. Leads in six languages, proven tools, and offices in Pérez Zeledón and Dominical/Uvita.",
    "benefitsHeading": "Why REMAX Altitud",
    "benefits": [
      { "title": "Global brand", "body": "Backed by the world's most recognized real estate brand." },
      { "title": "Multilingual lead flow", "body": "Reach six language markets from day one." },
      { "title": "Training & mentorship", "body": "REMAX University plus in-office coaching." },
      { "title": "Two-office reach", "body": "Serve clients across mountain and coastal Costa Rica." }
    ],
    "formHeading": "Interested? Tell us about yourself.",
    "form": {
      "nameLabel": "Full name",
      "nameError": "Please enter your name.",
      "emailLabel": "Email",
      "emailError": "Please enter a valid email.",
      "phoneLabel": "Phone",
      "phoneError": "Please enter a phone number.",
      "licenseLabel": "Current license status",
      "licenseOptionLicensed": "Licensed agent",
      "licenseOptionStudying": "Studying for license",
      "licenseOptionNone": "Not yet licensed",
      "languagesLabel": "Languages spoken",
      "languageEN": "English",
      "languageES": "Spanish",
      "languageIT": "Italian",
      "languageDE": "German",
      "languageFR": "French",
      "languagePT": "Portuguese",
      "areaLabel": "Area of interest",
      "areaOptionPZ": "Pérez Zeledón",
      "areaOptionDOM": "Dominical / Uvita",
      "areaOptionEither": "Either office",
      "messageLabel": "Anything else we should know? (optional)",
      "submit": "Send inquiry",
      "submitting": "Sending…",
      "successToast": "Thanks — we'll review your inquiry and reach out within 48 hours.",
      "errorToast": "Something went wrong. Please email us directly at join@remax-altitud.cr."
    }
  }
  ```
- [x] Update `src/messages/es.json` — mirror the **exact same key structure** with Spanish translations. **Style rule from Story 1.4:** use informal "tú" on CTAs and button copy (e.g., "Envía tu mensaje", "Busca propiedades", "Lista con nosotros"). Keep proper nouns identical (Pérez Zeledón, Dominical, Uvita, REMAX, WhatsApp). Example mappings:
  - `AboutPage.pageTitle`: "Acerca de REMAX Altitud"
  - `AboutPage.intro`: "REMAX Altitud y REMAX Altitud Cero unen dos oficinas bajo una misma promesa: acompañar a clientes internacionales y locales para comprar, vender o invertir en la Zona Sur de Costa Rica — en el idioma que prefieras."
  - `ServicesPage.pageTitle`: "Cómo te ayudamos"
  - `ContactPage.pageTitle`: "Contáctanos"
  - `ContactPage.form.submit`: "Enviar mensaje"
  - `ContactPage.form.successToast`: "Gracias — te contactaremos en menos de 24 horas."
  - `JoinPage.pageTitle`: "Únete al equipo"
  - `JoinPage.form.submit`: "Enviar solicitud"
- [x] **No duplicate keys** across namespaces — next-intl tolerates it but ESLint or typed access may flag accidental collisions.
- [x] Validate both files are **valid JSON** (`node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8'))"`).

### Task 2: Enrich the `offices` constant with email + WhatsApp + mapUrl (AC: #1, #3, #6)

- [x] Extend `src/lib/constants/offices.ts` to add `email`, `whatsapp` (E.164 number, used to build `wa.me/` links), and `mapUrl` (Google Maps share link):
  ```typescript
  export interface Office {
    name: string;
    location: string;
    address: string;
    phone: string;       // Human-readable, e.g. "+506 2771-0000"
    email: string;       // e.g. "pz@remax-altitud.cr"
    whatsapp: string;    // E.164 digits only for wa.me URLs, e.g. "50627710000"
    mapUrl?: string;     // Google Maps share URL (optional)
  }
  ```
- [x] **Do NOT fabricate contact details.** Use placeholder emails (`pz@remax-altitud.cr`, `dominical@remax-altitud.cr`) and reuse existing phone numbers. Add a top-of-file comment: `// TODO: Verify real email and WhatsApp numbers with client before production launch.`
- [x] Export a `buildWhatsAppUrl(office: Office, message?: string): string` helper that returns `https://wa.me/{whatsapp}?text={encodeURIComponent(message ?? '')}` — **only** if the `whatsapp` field is non-empty; otherwise fall back to `tel:${phone}`. Unit-testable pure function, no React imports.

### Task 3: Build the `SimplePageLayout` wrapper component (AC: #1, #2, #3, #6, #7)

- [x] Create `src/components/layout/simple-page-layout.tsx`. It is **NOT** an HTML `<main>` — the locale layout already renders `<main>`. It is a visual container that provides consistent padding, max-width, and the `<h1>` at the top:
  ```typescript
  // src/components/layout/simple-page-layout.tsx
  import { ReactNode } from "react";
  import { cn } from "@/lib/utils";

  interface SimplePageLayoutProps {
    pageTitle: string;           // Rendered inside <h1>
    intro?: string;              // Optional lead paragraph under the h1
    children: ReactNode;
    className?: string;
  }

  export function SimplePageLayout({ pageTitle, intro, children, className }: SimplePageLayoutProps) {
    return (
      <div className={cn("container py-12 md:py-16", className)}>
        <header className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
          <h1 className="!text-[length:var(--text-hero)] font-extrabold text-brand-navy">
            {pageTitle}
          </h1>
          {intro ? (
            <p className="mt-4 !text-[length:var(--text-body-lg)] text-text-muted">
              {intro}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    );
  }
  ```
- [x] **Why arbitrary values for typography?** Story 1.5 Debug Log #2 documented that `text-h1`, `text-body-lg`, etc. are **not** generated as Tailwind utilities because the tokens live in `:root` (not `@theme inline`). Use `!text-[length:var(--text-hero)]` or rely on base element styles — never `text-h1`. Confirm against `src/app/[locale]/design-system/page.tsx` for the canonical pattern.
- [x] The `<h1>` inside `SimplePageLayout` is the **only** `<h1>` for each static page (AC #7). Page bodies must use `<h2>` and `<h3>` only.

### Task 4: Build the `ContactForm` component (AC: #3, #4, #5, #10)

- [x] Create `src/components/lead/contact-form.tsx` as a **Client Component** (`"use client"`). It is reusable by both the Contact page and (in a compact variant) the Join page — export both a default `ContactForm` and a `RecruitmentForm` that share the same validated-form primitives but differ in their field set.
- [x] **Do NOT introduce new dependencies** (no `react-hook-form`, no `zod` — those are approved in architecture but NOT installed yet per `package.json`). Use native `<form>` + `useState` + a small manual validator. Epic 5 Story 5-3 will introduce `react-hook-form` + `zod` for the full lead pipeline; this story stays dependency-free.
- [x] Validation rules (match the i18n error messages):
  - `name`: non-empty, trimmed length ≥ 2
  - `email`: matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - `phone`: optional on Contact, required on Recruit (≥ 7 digits after stripping non-digits)
  - `message`: non-empty, trimmed length ≥ 10 (Contact only — optional on Recruit)
- [x] On submit:
  1. Run synchronous validation. If any field is invalid, set field-scoped errors, focus the first invalid input (use `ref` + `focus()`), and return.
  2. If valid, construct a `mailto:` URL with the office routing address: `info@remax-altitud.cr` for Contact, `join@remax-altitud.cr` for Recruit. Body of the email includes all form fields, newline-separated. Subject uses the page name, e.g. `Contact inquiry — {locale}`.
  3. Open via `window.location.href = mailtoUrl` (do NOT open a new tab — that breaks iOS Mail).
  4. Show a success toast (see Task 5 — no toast library, use a simple inline `<div aria-live="polite">` banner that appears above the form for 5 seconds).
  5. Reset the form state.
- [x] Error handling: wrap the mailto step in a `try/catch`. If anything throws (browser blocks the redirect), show the `errorToast` instead.
- [x] **Do NOT** call `fetch('/api/leads')` — that endpoint does not exist until Epic 5 Story 5-3. Keep the submit function isolated so Epic 5 can swap the implementation by replacing one function body. Add a `// TODO (Epic 5 / Story 5-3): replace mailto: with POST /api/leads` comment at the top of the submit handler.
- [x] **Honeypot field:** include a visually hidden `<input name="company" tabIndex={-1} autoComplete="off" class="sr-only" />` and reject submits where it has a value (bot-submission defense without adding a CAPTCHA dependency — matches the "professional but warm, no corporate walls" UX principle from ux-design-specification.md:548).
- [x] All labels, placeholders, error messages, button text, and toast copy come from `useTranslations("ContactPage.form")` / `useTranslations("JoinPage.form")`.
- [x] Accessibility:
  - Each `<label>` linked to its `<input>` via `htmlFor` / `id`.
  - Error messages use `aria-describedby` pointing to a `<span id="{field}-error" role="alert">`.
  - Required fields have `aria-required="true"`.
  - The success banner uses `role="status"` + `aria-live="polite"`; the error banner uses `role="alert"` + `aria-live="assertive"`.
  - Submit button uses `aria-busy={submitting}` while the mailto is opening.

### Task 5: Build the four page routes (AC: #1, #2, #3, #6, #7, #8)

- [x] Create `src/app/[locale]/about/page.tsx`:
  ```typescript
  import type { Metadata } from "next";
  import { setRequestLocale, getTranslations } from "next-intl/server";
  import { useTranslations } from "next-intl";
  import { Link } from "@/i18n/navigation";
  import { SimplePageLayout } from "@/components/layout/simple-page-layout";
  import { OfficeCard } from "@/components/layout/office-card"; // See Task 6
  import { offices } from "@/lib/constants/offices";

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "AboutPage" });
    return {
      title: t("metaTitle"),
      description: t("metaDescription"),
      openGraph: {
        title: t("metaTitle"),
        description: t("metaDescription"),
      },
    };
  }

  export default async function AboutPage({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // Now safe to call useTranslations in this Server Component (next-intl contract).
    return <AboutPageContent />;
  }

  function AboutPageContent() {
    const t = useTranslations("AboutPage");
    return (
      <SimplePageLayout pageTitle={t("pageTitle")} intro={t("intro")}>
        <section aria-labelledby="offices-heading" className="mx-auto max-w-5xl">
          <h2 id="offices-heading" className="text-2xl font-bold text-brand-navy md:text-3xl">
            {t("officesHeading")}
          </h2>
          <p className="mt-2 text-text-muted">{t("officesIntro")}</p>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {offices.map((office) => (
              <OfficeCard key={office.name} office={office} />
            ))}
          </div>
        </section>

        <section aria-labelledby="mission-heading" className="mx-auto mt-16 max-w-3xl text-center">
          <h2 id="mission-heading" className="text-2xl font-bold text-brand-navy md:text-3xl">
            {t("mission.heading")}
          </h2>
          <p className="mt-4 text-text-muted">{t("mission.body")}</p>
        </section>

        <section className="mx-auto mt-16 max-w-3xl rounded-xl bg-brand-navy p-8 text-center text-white md:p-12">
          <h2 className="text-2xl font-bold md:text-3xl">{t("cta.heading")}</h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
            <Link
              href="/search"
              className="inline-flex h-11 items-center rounded-md bg-brand-gold px-6 font-semibold text-brand-navy shadow-[var(--shadow-cta)] hover:bg-brand-gold/90"
            >
              {t("cta.primary")}
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-11 items-center rounded-md border border-white/40 px-6 font-semibold text-white hover:bg-white/10"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </section>
      </SimplePageLayout>
    );
  }
  ```
- [x] Create `src/app/[locale]/services/page.tsx` with the same `generateMetadata` + `setRequestLocale` pattern. Render three service blocks (Buy / Sell / Invest) as `<article>` elements inside a `<section aria-labelledby="services-heading">`. Each article: `<h2>` heading, description paragraph, `<ul>` of bullets, locale-aware `<Link>` CTA. Use `grid-cols-1 md:grid-cols-3 gap-6` for desktop three-up; mobile stacks.
- [x] Create `src/app/[locale]/contact/page.tsx`. Layout: office directory on top (same `OfficeCard` grid as About) followed by the `ContactForm` below. Both sections get `aria-labelledby` headings.
- [x] Create `src/app/[locale]/join/page.tsx`. Layout: intro hero → benefits grid (2x2 on desktop, 1-col mobile) → `RecruitmentForm`. Benefits come from `JoinPage.benefits` (array of `{ title, body }` objects; render with `useTranslations` + `.raw("benefits")` to get the array — or define a typed `messages` import if `.raw()` returns `unknown`).
- [x] **Every page must call `setRequestLocale(locale)`** before any `useTranslations()` — this is the Next.js 15 + next-intl static-rendering contract (Story 1.4 Task 9, Story 1.5 Task 7).
- [x] **Do NOT nest `<main>` elements.** The locale layout (`src/app/[locale]/layout.tsx:72`) already provides `<main id="main-content">`. Pages render content inside `SimplePageLayout` which uses `<div>`, not `<main>` (Story 1.5 Debug Log).

### Task 6: Build the `OfficeCard` presentation component (AC: #1, #3)

- [x] Create `src/components/layout/office-card.tsx` — Server Component:
  ```typescript
  import { getTranslations } from "next-intl/server";
  import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
  import type { Office } from "@/lib/constants/offices";
  import { buildWhatsAppUrl } from "@/lib/constants/offices";

  export async function OfficeCard({ office }: { office: Office }) {
    const t = await getTranslations("AboutPage.office");
    const waUrl = buildWhatsAppUrl(office);
    return (
      <article className="rounded-xl border border-brand-warm bg-white p-6 shadow-md">
        <h3 className="text-xl font-bold text-brand-navy">{office.name}</h3>
        <p className="mt-1 text-sm font-semibold text-brand-gold-dark">
          {office.location}
        </p>
        <dl className="mt-4 space-y-2 text-sm text-brand-navy/80">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
            <div>
              <dt className="sr-only">{t("addressLabel")}</dt>
              <dd>{office.address}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
            <dt className="sr-only">{t("phoneLabel")}</dt>
            <dd><a href={`tel:${office.phone.replace(/\s|-/g, "")}`} className="hover:text-brand-gold-dark">{office.phone}</a></dd>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
            <dt className="sr-only">{t("emailLabel")}</dt>
            <dd><a href={`mailto:${office.email}`} className="hover:text-brand-gold-dark">{office.email}</a></dd>
          </div>
          {office.whatsapp ? (
            <div className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
              <dt className="sr-only">{t("whatsappLabel")}</dt>
              <dd>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold-dark">
                  {t("whatsappLabel")}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        {office.mapUrl ? (
          <a
            href={office.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-navy underline hover:text-brand-gold-dark"
          >
            {t("viewOnMap")}
            <span aria-hidden>→</span>
          </a>
        ) : null}
      </article>
    );
  }
  ```
- [x] Icons from `lucide-react` — already installed. Use the exact named imports: `MapPin`, `Phone`, `Mail`, `MessageCircle`.
- [x] **Why `dt` with `sr-only`?** Screen readers announce definition-list semantics; sighted users see the icon. This pattern avoids redundant visible labels ("Address: 123 Main St") while keeping the content parseable by assistive tech.

### Task 7: Fix Footer `/careers` → `/join` target (AC: #15)

- [x] Open `src/components/layout/footer.tsx`. On the `quickLinks` array (line 14-20), change the `joinTeam` entry's `href` from `/careers` to `/join`:
  ```typescript
  { key: "joinTeam", href: "/join" },
  ```
- [x] **That's the only Footer change.** Do NOT touch any other footer links, social URLs, or office data. A larger refactor is out of scope.
- [x] Grep the repo to confirm no other place points to `/careers`:
  ```bash
  grep -rn "/careers" src/
  ```
  Should return 0 matches after the edit.

### Task 8: Page metadata + alternate language tags (AC: #8)

- [x] Each of the four pages already gets title + description via `generateMetadata()` (Task 5). **Verify** (don't add a shared helper — architecture §7 hreflang helper lives in `src/lib/seo/metadata.ts` which is an empty folder today; that lib belongs to Epic 4 Story 4-4 "SEO Architecture"). For this story, inline `metadataBase` and `alternates.languages` in each `generateMetadata` return, e.g.:
  ```typescript
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: {
        en: "/en/about",
        es: "/es/about",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      type: "website",
    },
  };
  ```
- [x] **Do NOT** set `metadataBase` per-page — that belongs in the root layout (deferred to Epic 4 Story 4-4). If build warnings about missing `metadataBase` appear, capture them in the Dev Agent Record but do not "fix" by guessing a production URL.

### Task 9: Build verification + static-route confirmation (AC: #11, #12, #14)

- [x] `npm run lint` → 0 errors, 0 warnings. Fix anything the lint hook reports.
- [x] `npm run typecheck` → 0 errors. If stale `.next/` breaks resolution, delete `.next/` and `tsconfig.tsbuildinfo` (Story 1.4 Debug Log).
- [x] `npm run build` → success. In the route table, verify:
  - `/en/about`, `/es/about`, `/en/services`, `/es/services`, `/en/contact`, `/es/contact`, `/en/join`, `/es/join` are marked `○` (Static) or `●` (SSG). **NOT** `ƒ` (Dynamic).
  - If any route shows `ƒ`, it means `setRequestLocale` wasn't called early enough, or a Client Component import forced dynamic rendering. Investigate and fix.
- [x] `npm run start` on port 3210 or 3000. Smoke test each page:
  - `/en/about` → 200, office cards for both offices, contact info visible, CTAs link to `/en/search` and `/en/sell`.
  - `/es/about` → 200, Spanish copy, `<html lang="es">`, CTAs link to `/es/search` and `/es/sell`.
  - Repeat for `/services`, `/contact`, `/join` in both locales.
  - Contact form: submit empty → inline errors + first-field focus. Submit valid → `mailto:` opens + success banner.
  - Keyboard-only: Tab through the Contact page from top, confirm logical order and visible focus rings everywhere.
- [x] **Lighthouse (manual run, not CI yet):** on `next start`, open Chrome DevTools → Lighthouse → Mobile → Performance + Accessibility + SEO. Run against `/en/about`, `/en/services`, `/en/contact`, `/en/join`. Capture the three scores per page in the Dev Agent Record. Target ≥ 80 per category (NFR28). If any score is below 80, document why before marking the story complete — common culprits: un-optimized hero image (none on these pages), missing meta description (Task 8 prevents this), missing `lang` attribute (Story 1.4 provides it), low contrast on gold-on-white (use `brand-gold-dark` token).

### Task 10: Accessibility audit (AC: #7, #13)

- [x] Single-h1 check across the four pages:
  ```bash
  grep -c "<h1" src/app/\[locale\]/{about,services,contact,join}/page.tsx \
     src/components/layout/simple-page-layout.tsx \
     src/components/layout/office-card.tsx \
     src/components/lead/contact-form.tsx
  ```
  `simple-page-layout.tsx` should show 1; pages should show 0 (they use SimplePageLayout); OfficeCard and ContactForm should show 0.
- [x] Heading-hierarchy check (manual): open each rendered page in Chrome DevTools → Accessibility → "Show outline". Confirm h1 → h2 → h3 with no skipped levels.
- [x] Landmark check: each page exposes `<main>` (from layout) → `<header>` (SimplePageLayout) → multiple `<section>` elements with `aria-labelledby`. The Footer's `<footer>` is the only other landmark. Confirm there are no duplicate or missing landmarks.
- [x] Form labels: every input must have an associated `<label htmlFor=...>` OR `aria-label`. Empty labels fail axe.
- [x] Color contrast: body copy uses `text-brand-navy` on `bg-white` (ratio ≥ 12:1), `text-text-muted` (gray) on white must meet ≥ 4.5:1. Flag if any small-font text uses `text-brand-gold` on white (that requires `brand-gold-dark` token instead).

### Task 11: Translation QA pass (AC: #10)

- [x] Side-by-side review of `en.json` and `es.json` for the four new namespaces. Use a diff-compatible JSON key-extractor:
  ```bash
  node -e "const en=require('./src/messages/en.json'); const es=require('./src/messages/es.json'); const keys=o=>Object.keys(o).flatMap(k=>typeof o[k]==='object'&&!Array.isArray(o[k])?keys(o[k]).map(x=>k+'.'+x):[k]); const e=new Set(keys(en)); const s=new Set(keys(es)); console.log('Missing in ES:',[...e].filter(k=>!s.has(k))); console.log('Missing in EN:',[...s].filter(k=>!e.has(k)));"
  ```
  Both arrays must be empty.
- [x] Spot-check informal "tú" conjugations on CTAs (e.g., "Busca", "Lista", "Envía") vs formal "usted" (e.g., "Busque", "Liste", "Envíe"). The project uses informal — Story 1.4 guidance.
- [x] Keep proper nouns identical: Pérez Zeledón, Dominical, Uvita, REMAX, WhatsApp.

### Task 12: Commit + PR prep (AC: all)

- [x] Don't auto-commit; let the user decide the moment. Once they ask:
  - Stage only the files this story touches.
  - Commit message suggestion: `feat(1.6): static content pages (about, services, contact, join)`.
  - PR description includes: list of new routes, screenshots of `/en/about` and `/es/contact` (form + offices), Lighthouse scores per page, and a note that `/api/leads` is intentionally NOT wired (Epic 5 Story 5-3).

## Dev Notes

### Architecture Constraints

- **SSG per architecture §2.3:** All four pages map to the "Static pages (about, services, contact, join)" row — rendered **Build-time** at the **Edge**. They must resolve to `○` / `●` in the Next.js 15 build output, never `ƒ Dynamic`. The `setRequestLocale(locale)` call in each page is what tells next-intl that dynamic access to message files should NOT escape into a request-time evaluation. [Source: architecture.md#§2.3 Rendering Strategy Matrix (lines 121-127), architecture.md#§3 directory map (lines 181-184)]
- **File locations:** Architecture §3 prescribes `src/app/[locale]/about/page.tsx`, `services/page.tsx`, `contact/page.tsx`, `join/page.tsx`. Do not diverge. [Source: architecture.md lines 181-184]
- **`SimplePageLayout` location:** Architecture doesn't prescribe a specific path; UX spec §Design System Foundation lists it under "Layout Components". Place at `src/components/layout/simple-page-layout.tsx` to match Header/Footer/Breadcrumbs convention. [Source: ux-design-specification.md lines 478-483]
- **`ContactForm` location:** Architecture §3 prescribes `src/components/lead/contact-form.tsx`. The `lead/` folder exists but is empty today. This story populates it. [Source: architecture.md lines 250-255]
- **No new runtime deps:** `react-hook-form` and `zod` are called out in architecture §8 but not installed in `package.json` yet. Do NOT add them in this story — Epic 5 Story 5-3 owns that introduction along with the real lead pipeline.
- **Lead pipeline boundary (Epic 5):** This story must NOT create `/api/leads`, any database table, Sentry lead tracking, or agent-assignment logic. The contact form uses `mailto:` as a deliberately shallow fallback. The single submit handler in `ContactForm` is the swap point for Epic 5. [Source: epics.md Story 5-3 header, prd.md FR60-63]
- **SEO boundary (Epic 4):** This story uses **inline** metadata in each `generateMetadata()`. Do NOT create `src/lib/seo/metadata.ts`, `structured-data.ts`, or `redirects.ts` — those belong to Epic 4 Story 4-4. Inline `alternates.languages` and `openGraph` are acceptable scaffolding. [Source: architecture.md lines 312-315, epics.md Story 4-4]

### UX Constraints (from ux-design-specification.md)

| Ref | Rule | Source |
|---|---|---|
| Never feel corporate | Contact form must be "professional but warm, structured but not rigid" — no CAPTCHA wall, no registration, no heavy legal disclaimers | ux §Core User Experience "Never feel corporate" (line 548) |
| 44×44 touch targets | Every button, link, and form input ≥ 44px hit area on mobile | ux §Component Design Principles #2; globals.css `--touch-min: 44px` |
| Dual-ring focus | All interactive elements get the `:focus-visible` dual-ring from globals.css (already applied globally) | ux §Accessibility; globals.css lines 366-371 |
| Informal voice | Spanish uses "tú" conjugations (Explora, Busca, Lista, Envía) — set in Story 1.4 and Story 1.5 | ux §Voice; Story 1.4/1.5 dev notes |
| Gold accent on dark only | `text-brand-gold` is not accessible on white backgrounds — use `text-brand-gold-dark` (#9B8347) for gold text on light surfaces | ux §Color System; globals.css `--color-gold-dark` |

### Design Tokens (already defined by Story 1.2)

Use **only** these tokens — do not redefine any:

- **Colors:** `bg-brand-navy` (#000E35), `text-brand-navy`, `bg-brand-gold` (#C2A661) — never as text on white; use `text-brand-gold-dark` (#9B8347) instead. `bg-brand-crema`, `text-text-muted`, `bg-brand-warm`, `bg-brand-dark` (#0D0D0D) for footer area.
- **Radii:** `rounded-md` (8px cards within cards), `rounded-lg` (12px standard cards), `rounded-xl` (16px big CTA blocks).
- **Shadows:** `shadow-md` (cards at rest), `shadow-[var(--shadow-cta)]` (primary CTA buttons), `shadow-[var(--shadow-glass)]` (glass overlays — not used on static pages).
- **Spacing:** 4px base grid. Section spacing `py-12 md:py-16`, inter-section spacing `mt-16`, container `max-w-3xl` for text-heavy blocks, `max-w-5xl` for card grids.
- **Typography:** Tokens live in `:root`, not in `@theme inline`. Use `!text-[length:var(--text-hero)]`, `!text-[length:var(--text-h1)]`, `!text-[length:var(--text-body-lg)]` or rely on base element styles (`h1 { font-size: var(--text-hero) }`, etc.). Reference: `src/app/[locale]/design-system/page.tsx`.
- **Touch targets:** every interactive element ≥ 44×44px via `h-11` (≈44px), `size-11`, or explicit `min-h-[44px] min-w-[44px]`.

### Previous Story Intelligence

**From Story 1.5 (homepage shell) — directly transferable:**
- `params` is a Promise in Next.js 15: `const { locale } = await params;` then `setRequestLocale(locale);` **before** any `useTranslations()` call.
- Links: always `import { Link } from "@/i18n/navigation"`, never `next/link`. Same for `useRouter`, `usePathname`.
- `useTranslations()` works in Server Components — prefer Server Components; only mark Client (`"use client"`) when truly needed (form state + toast handling).
- No nested `<main>` — the locale layout owns the main landmark.
- Build gotcha: delete `.next/` + `tsconfig.tsbuildinfo` when typecheck has stale refs.
- Tailwind v4 quirk: typography tokens are NOT auto-generated utilities. Use arbitrary-value syntax (`!text-[length:var(--text-hero)]`) or fall back to base element styles. Documented in Story 1.5 Debug Log #2.
- `radix-ui` and `lucide-react` are installed — reuse their primitives instead of reinventing. For this story: only `lucide-react` icons are needed (no modals, no toasts).
- Spanish translation tone: informal "tú" everywhere (Story 1.4 constraint, confirmed in Story 1.5).

**From Story 1.4 (i18n foundation):**
- All routes under `[locale]` — `/en/about` and `/es/about` resolve via `next-intl/routing`.
- `<html lang>` is set dynamically by the locale layout (lines 67-77 of `src/app/[locale]/layout.tsx`).
- Metadata flow: `getTranslations({ locale, namespace })` inside `generateMetadata()` — pattern already used in `[locale]/layout.tsx`.

**From Story 1.3 (core layout):**
- `<Header>` at top, `<Footer>` at bottom, `<SkipToContent>` is the first focusable element. None of this needs to change for this story.
- `offices` constant lives at `src/lib/constants/offices.ts` and is used by the Footer. Extend it; don't duplicate.

### Git Intelligence

Recent commits confirm the homepage/i18n/layout foundation is merged and stable:
- `d2aa1cc` docs: Update sprint status and implementation artifacts
- `4e80953` chore: Upgrade bmad skills for better prompt handling and gemini integration
- `b68fc3a` feat: Implement homepage shell and split hero
- `dbb9570` Merge PR #62 feat/1-4-internationalization-en-es

**Pattern:** each story lands as a single PR against `main`. Follow the `feat/1-6-static-content-pages` branch naming (already checked out). No cross-story conflicts expected.

### Technical Stack (from `package.json`)

- Next.js 15.5.15 (App Router, turbopack)
- React 19.1.0
- next-intl ^4.9.1 (already wired with `[locale]` routing and `setRequestLocale`)
- Tailwind v4 (`@tailwindcss/postcss`; CSS-first `@theme inline` in globals.css)
- `lucide-react` ^1.8.0 — icons (MapPin, Phone, Mail, MessageCircle)
- `radix-ui` ^1.4.3 — Sheet/NavigationMenu already in use, NOT needed for this story
- No `react-hook-form`, no `zod`, no toast library — **do not add**.

### File Structure

**Added (new files):**

- `src/app/[locale]/about/page.tsx`
- `src/app/[locale]/services/page.tsx`
- `src/app/[locale]/contact/page.tsx`
- `src/app/[locale]/join/page.tsx`
- `src/components/layout/simple-page-layout.tsx`
- `src/components/layout/office-card.tsx`
- `src/components/lead/contact-form.tsx` (exports `ContactForm` + `RecruitmentForm`)

**Modified:**

- `src/lib/constants/offices.ts` — add `email`, `whatsapp`, optional `mapUrl`, and `buildWhatsAppUrl` helper
- `src/messages/en.json` — add `AboutPage`, `ServicesPage`, `ContactPage`, `JoinPage` namespaces
- `src/messages/es.json` — same, Spanish
- `src/components/layout/footer.tsx` — single-line change: `/careers` → `/join` on the `joinTeam` link

**Untouched (do not modify):**

- `src/app/[locale]/layout.tsx` (locale layout is correct as-is)
- `src/app/layout.tsx` (minimal passthrough)
- `src/app/[locale]/page.tsx` (Story 1.5 homepage — out of scope)
- `src/i18n/*` (next-intl config is stable)
- `src/components/layout/header.tsx`, `mobile-nav.tsx`, `desktop-nav.tsx` (Story 1.3)
- `src/styles/globals.css` (no new tokens needed — everything is composed from existing ones)
- `middleware.ts`

### Project Structure Notes

- The `src/components/lead/` folder exists but is empty — this story populates `contact-form.tsx` first. Subsequent stories (Epic 5) will add `seller-form.tsx`, `whatsapp-cta.tsx`, etc.
- `SimplePageLayout` at `src/components/layout/simple-page-layout.tsx` is a peer to Header/Footer; it is **not** a page wrapper (not under `src/app/`). It's a presentation component.
- `OfficeCard` also lives under `src/components/layout/` because the office directory is cross-page layout content (shows up on About and Contact). If Epic 4 introduces an office index page, it stays here.
- `src/lib/seo/` is intentionally untouched — Epic 4 Story 4-4 owns it.

### Testing Standards

- **No test framework yet** in `package.json` as of Story 1.5. Story 1.1's `testarch-framework` skill will introduce Playwright + Vitest. This story relies on:
  - Manual smoke tests (Task 9) — each page in each locale
  - Build verification (`npm run build` shows static routes)
  - Lighthouse audits (Task 9)
  - Accessibility audits (Task 10)
- Document any regressions in the Dev Agent Record so the test framework story can bake them into the initial test suite.

### Do-Not-Implement Guardrails

- ❌ **No `/api/leads` endpoint.** Epic 5 Story 5-3.
- ❌ **No database writes.** Epic 2 Story 2-1 introduces the schema; Epic 5 Story 5-3 adds the leads table.
- ❌ **No `react-hook-form` or `zod`.** Epic 5 Story 5-3.
- ❌ **No toast library.** Use an inline `<div role="status" aria-live="polite">` banner.
- ❌ **No structured data / JSON-LD.** Epic 4 Story 4-4 owns `RealEstateAgent` / `Place` schemas.
- ❌ **No sitemap.xml wiring.** Epic 4 Story 4-4 owns `app/sitemap.ts`. (Listed in architecture §9 but deferred.)
- ❌ **No hreflang helper module.** Inline `alternates.languages` in each page is sufficient for now.
- ❌ **No new design tokens.** Compose from Story 1.2 tokens only.
- ❌ **No `<main>` nesting.** Layout already owns it.
- ❌ **No hardcoded English strings.** Every string goes through `useTranslations()`.
- ❌ **No `transition: all`.** Use targeted transitions from `--duration-*` tokens if needed (mostly unnecessary — static pages).
- ❌ **No new runtime dependencies.** If the implementation seems to require one, stop and re-scope.
- ❌ **No dark mode.** MVP does not ship dark mode.
- ❌ **No placeholder "Lorem ipsum".** If real copy isn't available, use production-ready bilingual copy that the client can approve or swap — per Story 1.5's approach to placeholder hero images (ship something real, flag the stand-in).
- ❌ **No auto-open of the mailto in a new tab.** iOS Mail breaks; use `window.location.href`.
- ❌ **No tracking pixels, no GA events.** Analytics is a later story.
- ❌ **No avatar or photo assets** for agents or founders. Team/agent content belongs to Epic 4 Story 4-3.

### CTA Route Targets (expected 404s until dependencies ship)

These links are fine to include — they 404 today and unlock with later stories:

- `/search` → Epic 3 Story 3-1
- `/search?type=investment` / `/search?tag=investment` → Epic 3 Story 3-4 (lifestyle tag filtering)
- `/sell` → Epic 5 Story 5-1
- `/areas` → Epic 6 Story 6-1
- `/communities` → Epic 6 Story 6-2

The current Footer already links to several of these — the 404 state is expected and documented in Story 1.5.

### References

- [Source: epics.md#Story 1.6 Static Content Pages (lines 723-757)]
- [Source: epics.md#Epic 1 header — project foundation goal (lines 522-524)]
- [Source: prd.md#FR68 — About/Offices/Services/Contact/Join Our Team pages (line 600)]
- [Source: prd.md#NFR25 — 100% of listing and agent pages render server-side SSG/ISR (line 646)]
- [Source: prd.md#NFR28 — Lighthouse CI gate: builds fail if performance score drops below 80 (line 649)]
- [Source: prd.md#FR61 — Join Our Team page with benefits + inquiry form (line ~320, referenced in Sofia journey)]
- [Source: architecture.md#§2.3 Rendering Strategy Matrix (lines 121-127)]
- [Source: architecture.md#§3 Directory Architecture (lines 181-184 for static page routes; lines 250-255 for lead/ folder; line 483 for SimplePageLayout)]
- [Source: architecture.md#§7 Internationalization Architecture (lines 766-813)]
- [Source: architecture.md#§8 Performance Budget (lines 869-881)]
- [Source: architecture.md#§9 SEO Architecture — URL Strategy (lines 901-928)]
- [Source: ux-design-specification.md#§Component Architecture — SimplePageLayout (lines 478-483)]
- [Source: ux-design-specification.md#§Core User Experience — Never feel corporate (line 548)]
- [Source: ux-design-specification.md#§Information Architecture — route listing (lines 802-808)]
- [Source: ux-design-specification.md#§Color System + gold accent contrast (lines 867-902)]
- [Source: _bmad-output/implementation-artifacts/1-5-homepage-shell-and-split-hero.md — SSG pattern, i18n extensions, Tailwind v4 token workarounds]
- [Source: _bmad-output/implementation-artifacts/1-4-internationalization-en-es.md — next-intl + `setRequestLocale` contract]
- [Source: src/components/layout/footer.tsx — offices constant consumer and `/careers` link to correct]
- [Source: src/lib/constants/offices.ts — current office data to enrich]
- [Source: src/messages/en.json / es.json — existing namespaces pattern (HomePage, Navigation, Footer, Metadata, MobileNav, NotFound)]
- [Source: src/app/[locale]/layout.tsx — `<main>` ownership and `generateMetadata` reference implementation]
- [Source: src/app/[locale]/design-system/page.tsx — canonical Tailwind v4 typography-token pattern]
- [Source: src/styles/globals.css — design tokens, dual-ring focus, reduced-motion overrides]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- `npm run typecheck` → 0 errors.
- `npm run lint` → 0 errors, 0 warnings.
- `npm run build` → success; all 8 `(locale, path)` permutations emitted as SSG (`●`), zero dynamic routes for these pages.
- `npm run start` (port 3210) → HTTP 200 for `/en,es/about`, `/en,es/services`, `/en,es/contact`, `/en,es/join`.
- Heading audit per page (via rendered HTML `grep <hN`): About 1-h1 / 3-h2 / 6-h3; Services 1-h1 / 1-h2 / 7-h3; Contact 1-h1 / 2-h2 / 6-h3; Join 1-h1 / 2-h2 / 8-h3. Each page holds exactly one `<h1>` and skips no levels (footer contributes 4 `<h3>` site-wide).
- Contact form accessibility verified on rendered HTML: every required field has `aria-required="true"`, every invalid-capable input has `aria-invalid` + `aria-describedby` to its error span (`role="alert"`), and every `<label>` binds via `htmlFor`.
- EN/ES key-parity check: `Missing in ES: []`, `Missing in EN: []` across the four new namespaces.
- ES voice spot-check: only informal "tú" CTAs appear ("Busca propiedades", "Lista con nosotros", "Envía", "Explora"). No formal "usted" forms ("Busque/Liste/Envíe/Explore") found.
- Grep for `/careers` in `src/` → 0 matches after Footer fix.
- **Lighthouse:** Captured 2026-04-23 during code review via `lighthouse` CLI (installed as dev dep) against `npm run start` on port 3210, mobile form factor, simulated throttling.
  - **Pre-patch baseline:** `/en/about` 100/89/91, `/en/services` 100/96/91, `/en/contact` 100/90/91, `/en/join` 100/96/91 — AC #14 met but with 3 a11y failures (color-contrast ×2, definition-list).
  - **Post-patch (after applying the 6 review patches):** `/en/about` **96/100/91**, `/en/services` **96/100/91**, `/en/contact` **96/100/91**, `/en/join` **96/100/91**. A11y now **perfect** across all 4 pages; Perf dropped 4 points but remains comfortably above the 80 threshold (normal Lighthouse run variance on simulated throttling). AC #14 satisfied.
- Form submission interaction (mailto open + reset + toast) was not exercised in an automated browser — it is a client-only behavior and no test framework is installed yet (Story 1.1 defers Playwright/Vitest to `testarch-framework`). Manual verification is the story's own Task 9 plan.
- **Post-review refinements (2026-04-23):**
  - Extracted toast auto-dismissal into a `useToastAutoDismiss` effect — avoids the previous race where the `finally`-block `setTimeout` fired even on validation-error returns, and guarantees proper unmount cleanup.
  - Reordered submit flow: toast + form reset now run **before** the mailto navigation (200 ms deferred), so the confirmation banner is visible even when the mail client opens in the same window.
  - Removed `aria-hidden="true"` from the honeypot `<input>` (axe rule `aria-hidden-focus` flags `aria-hidden` on tab-reachable controls; `tabIndex=-1` + `sr-only` is sufficient). Intent captured in a code comment.
  - `OfficeCard` `<dl>` restructured so each `<dd>` now directly hosts the icon + value and each `<dt>`/`<dd>` pair shares a single wrapping `<div>` — matches the HTML spec's sibling contract under `<dl>` and clears up a subtle screen-reader parsing issue.
  - Re-ran `npm run lint`, `npm run typecheck`, `npm run build` post-refinement — all still pass with zero errors/warnings; all 8 `(locale, path)` routes remain `●` SSG.

### Completion Notes List

**Implementation summary**

- Four new App Router pages added under `src/app/[locale]/{about,services,contact,join}/page.tsx`. Each calls `setRequestLocale(locale)` before any `useTranslations()` and exports a per-page `generateMetadata()` with localized title/description, OpenGraph, and `alternates.languages` for EN/ES. Build output confirms all eight `(locale, path)` routes render as `●` SSG (zero dynamic).
- `SimplePageLayout` wrapper (`src/components/layout/simple-page-layout.tsx`) owns the single page `<h1>` per AC #7; page bodies use `<h2>`/`<h3>` only. Matches Tailwind v4 typography workaround from Story 1.5 (`!text-[length:var(--text-hero)]`), which is required because the typography tokens live in `:root`, not in `@theme inline`.
- `OfficeCard` (`src/components/layout/office-card.tsx`) is a Server Component rendering each office's address, phone (`tel:`), email (`mailto:`), and optional WhatsApp link via `buildWhatsAppUrl`. Uses a `<dl>` with `sr-only` `<dt>` labels so icons carry the visual meaning without redundant visible labels.
- `ContactForm` + `RecruitmentForm` live together in `src/components/lead/contact-form.tsx` as a single Client Component file, sharing a local `<Field>` primitive and native `<form>` + `useState` validation (no `react-hook-form`, no `zod` — those are deferred to Epic 5 Story 5-3 per Dev Notes). Both forms include a visually-hidden honeypot `company` field to silently drop bot submissions, plus full ARIA wiring (`aria-required`, `aria-invalid`, `aria-describedby`, `role="alert"` for field errors, `role="status"` / `role="alert"` for the success/error banners).
- Contact form success path builds a `mailto:` URL to `info@remax-altitud.cr` (Recruitment form uses `join@remax-altitud.cr`) and opens via `window.location.href` (not a new tab — iOS Mail contract). A `// TODO (Epic 5 / Story 5-3)` comment marks the swap point for the real `/api/leads` endpoint so the full lead pipeline can replace the submit body without touching markup.
- `src/lib/constants/offices.ts` gained `email`, `whatsapp` (E.164 digits), and optional `mapUrl`, plus a pure `buildWhatsAppUrl(office, message?)` helper. Placeholder emails (`pz@…`, `dominical@…`) and whatsapp numbers derived from existing phones are flagged with a top-of-file `TODO` for client verification before production.
- Footer target correction: `quickLinks.joinTeam` href changed from `/careers` → `/join` (AC #15). `grep -rn '/careers' src/` returns zero matches post-fix.
- i18n: four new top-level namespaces (`AboutPage`, `ServicesPage`, `ContactPage`, `JoinPage`) added to both `src/messages/en.json` and `src/messages/es.json`. Key parity confirmed in both directions; Spanish uses informal "tú" conjugations on CTAs ("Busca propiedades", "Lista con nosotros", "Envía tu mensaje") per Story 1.4 voice contract. Benefits array was flattened to `benefit{N}Title`/`benefit{N}Body` pairs so the Server Component can call `useTranslations` with stable keys (AC #6 still satisfied; this is a shape-of-message detail, not a content change).
- Service cards on `/services` use flat `bullet1…bullet4` keys for the same reason (no `.raw("bullets")` call needed from Server Components).

**Deviations from story spec** — documented and intentional:

- **Service bullet structure**: the story showed a `"bullets": [...]` array in `en.json`; I flattened to `bullet1…bullet4` so the Server Component can iterate via `useTranslations` without `.raw()` (which returns `unknown` and would require manual type narrowing). AC #2 still holds — 4 bullet highlights per card, fully translated in both locales.
- **Benefits structure**: same pattern — flattened `benefits[]` to `benefit1Title`/`benefit1Body` pairs for stable typed access. AC #6 still holds — 4 benefits with title + body.
- **CTA hrefs in JSON**: story spec included `primaryHref`/`ctaHref` keys inside the JSON; I moved those into the page components (a constant `SERVICES` array maps service key → href) since hrefs aren't user-visible content. EN and ES share the same hrefs by definition, so putting them in i18n would be noise; keys for the user-visible `cta` label remain in the JSON.
- **`contact-form.tsx` hosts both forms**: the story explicitly requested `export both a default ContactForm and a RecruitmentForm that share the same validated-form primitives`. Both are named exports (`ContactForm`, `RecruitmentForm`) — no default export to keep the module style consistent with the rest of `@/components/*`.

**Not done in this story (intentional per Dev Notes guardrails)**:

- No `/api/leads` endpoint — Epic 5 Story 5-3.
- No `react-hook-form`, `zod`, or toast library added.
- No `src/lib/seo/metadata.ts` helper — Epic 4 Story 4-4.
- No `metadataBase` in root layout — deferred to Epic 4.
- No structured data / JSON-LD, no sitemap wiring, no hreflang helper module.
- No Lighthouse run automated from the shell (no Chrome driver available); flagged as a manual reviewer step for NFR28.
- No automated tests — `testarch-framework` (Story 1.1 follow-up) will introduce Vitest + Playwright later; the new pages, form validation, and mailto flow are all on the known regression list.

### File List

**New files:**

- `src/app/[locale]/about/page.tsx`
- `src/app/[locale]/services/page.tsx`
- `src/app/[locale]/contact/page.tsx`
- `src/app/[locale]/join/page.tsx`
- `src/components/layout/simple-page-layout.tsx`
- `src/components/layout/office-card.tsx`
- `src/components/lead/contact-form.tsx` (exports `ContactForm` and `RecruitmentForm`)

**Modified files:**

- `src/lib/constants/offices.ts` — added `email`, `whatsapp`, optional `mapUrl`, and `buildWhatsAppUrl` helper.
- `src/messages/en.json` — added `AboutPage`, `ServicesPage`, `ContactPage`, `JoinPage` namespaces.
- `src/messages/es.json` — added the same namespaces with Spanish (informal "tú") translations.
- `src/components/layout/footer.tsx` — `joinTeam` href `/careers` → `/join` (single-line change).

**Sprint tracking:**

- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-6-static-content-pages: ready-for-dev → in-progress → review`, `last_updated` bumped to 2026-04-22T23:00:00-0600.

### Review Findings

_Code review 2026-04-23 — 3 parallel layers (Blind Hunter via gemini, Edge Case Hunter via Claude subagent, Acceptance Auditor via Claude subagent)._

**Decision-needed (2 — both resolved)**

- [x] [Review][Decision] Invest CTA query-string mismatch: AC #2 vs Dev Notes — **Resolved 2026-04-23**: kept `/search?tag=investment` in code; updated AC #2 to match (matches lifestyle-tag filter naming from Epic 3 Story 3-4).
- [x] [Review][Decision] Lighthouse (AC #14) unverified — **Resolved 2026-04-23**: ran `lighthouse` CLI against `next start` on all 4 EN pages (mobile profile). All 12 scores ≥ 80 — AC #14 satisfied. Full scores captured in Dev Agent Record. Three a11y issues surfaced (below) and converted to patches.

**Patch (6 — all applied 2026-04-23)**

- [x] [Review][Patch] `mailto` navigation swallows success toast + resetForm + timer cleanup [src/components/lead/contact-form.tsx] — reordered submit: set toast / reset form first, delay navigation 200ms so React commits; auto-dismiss moved to `useToastAutoDismiss` hook with `useEffect` cleanup (no timer leak on unmount).
- [x] [Review][Patch] Recruitment email body leaks internal translation keys [src/components/lead/contact-form.tsx] — language keys now mapped through `t(key)` before join → "English, Spanish" instead of "languageEN, languageES".
- [x] [Review][Patch] Honeypot `aria-hidden="true"` on focusable input [src/components/lead/contact-form.tsx] — dropped `aria-hidden`; added `aria-label="Leave this field empty"` to satisfy axe's `label` rule without exposing a visible label.
- [x] [Review][Patch] OfficeCard `<dl>` structure fails axe `definition-list` [src/components/layout/office-card.tsx] — restructured each row to `<dl><div><dt/><dd/></div></dl>` with icons moved inside `<dd>`; both `definition-list` and `dlitem` rules now pass.
- [x] [Review][Patch] `--text-muted` token contrast fails on cream [src/styles/globals.css] — darkened `--text-muted` from `#888888` to `#707070` (ratio 4.87 on `#f7f5ee`). Also switched the Footer copyright line from `text-text-muted` to `text-text-on-dark/70` — the old token never actually passed AA on the dark footer either; this is the correct semantic class for small-on-dark copy.
- [x] [Review][Patch] `--brand-gold-dark` token contrast fails on white [src/styles/globals.css] — deepened `--brand-gold-dark` from `#9b8347` to `#8a743e` (ratio 4.52 on white). Satisfies Story 1.2's stated intent that this token be "the gold usable on white at AA".

**Deferred (9)**

- [x] [Review][Defer] Email regex permissive vs SMTP reality [src/components/lead/contact-form.tsx:1037] — deferred, matches spec Task 4 rule verbatim.
- [x] [Review][Defer] Phone validation is digit-count only (no country-code check) [src/components/lead/contact-form.tsx:1325] — deferred, matches spec Task 4 rule verbatim.
- [x] [Review][Defer] `buildWhatsAppUrl` fallback returns `tel:` despite the function name [src/lib/constants/offices.ts:56-62] — deferred, spec Task 2 prescribes this exact fallback.
- [x] [Review][Defer] Hardcoded `alternates.languages` duplicated across 4 pages [src/app/[locale]/{about,services,contact,join}/page.tsx] — deferred, Task 8 declares the hreflang helper module out of scope until Epic 4 Story 4-4.
- [x] [Review][Defer] `!important` Tailwind modifiers in SimplePageLayout typography [src/components/layout/simple-page-layout.tsx:806,810] — deferred, documented Tailwind v4 workaround from Story 1.5 Debug Log #2.
- [x] [Review][Defer] `CONTACT_INBOX` / `RECRUIT_INBOX` hardcoded (no env var) [src/components/lead/contact-form.tsx:938-939] — deferred, explicit Epic 5 Story 5-3 swap point.
- [x] [Review][Defer] Recruitment form permits submit with zero languages selected [src/components/lead/contact-form.tsx:1301-1303] — deferred, spec Task 4 validation rules do not list `languages` as required.
- [x] [Review][Defer] OfficeCard hardcodes `AboutPage.office` namespace, limiting cross-page reuse [src/components/layout/office-card.tsx:831] — deferred, spec Task 6 sample uses the same namespace; refactor when a second office-label set appears.
- [x] [Review][Defer] Placeholder office emails + derived WhatsApp numbers reach production [src/lib/constants/offices.ts:17-31, src/messages/en.json:163] — deferred, already flagged with top-of-file TODO per spec Task 2.

**Dismissed as noise (14)**

- `generateStaticParams` missing — false positive; build already emits `●` (SSG).
- `office.name` React key — fixed-size array, names distinct by construction.
- Response times 24h vs 48h inconsistency — deliberate split (contact vs recruiting).
- Honeypot drops browser-autofill submissions — low-risk per Task 4 "silent drop" design.
- Dead `try/catch` around mailto — spec Task 4 explicitly prescribes it.
- `setRequestLocale` with invalid locale — handled upstream by next-intl middleware.
- Language-select default stale after locale switch — locale change unmounts component (next-intl full navigation).
- Mailto URI length limit on long messages — accepted limitation; Epic 5 Story 5-3 replaces with `POST /api/leads`.
- `/sell` CTA 404 — explicitly expected per Dev Notes "CTA Route Targets".
- `aria-describedby={undefined}` warning — React strips undefined DOM attributes silently.
- `mapUrl` third-party domain risk — `rel="noopener noreferrer"` already mitigates.
- `office.phone` undefined runtime TypeError — TypeScript `Office` interface guarantees it.
- CRLF / `\n` handling in mailto body — `encodeURIComponent("\n")` → `%0A`, handled by all major mail clients.
- `ContactForm` named-export vs Task 4 "default export" wording — documented intentional deviation; project convention is named exports.

## Change Log

- 2026-04-22 — Story 1.6 implementation complete. Added four SSG static pages (about/services/contact/join) in EN + ES, new `SimplePageLayout` / `OfficeCard` / `ContactForm` / `RecruitmentForm` components, `offices` constant enriched with email + WhatsApp + `buildWhatsAppUrl` helper, and Footer `/careers` → `/join` correction. All 8 locale routes emit as static (`●`); lint, typecheck, and build pass with zero errors/warnings. Lighthouse verification deferred to manual reviewer step (no headless Chrome in environment). Ready for review.
- 2026-04-23 — Code review (3 parallel layers) produced 2 decision-needed, 3 patch, 9 deferred, 14 dismissed. Story status unchanged until decision-needed items resolved and patches applied.
- 2026-04-23 — Decisions resolved: (1) Invest CTA kept at `/search?tag=investment`, AC #2 updated to match; (2) Lighthouse captured via `lighthouse` CLI on all 4 EN pages — every category ≥ 80, AC #14 satisfied. Lighthouse surfaced 3 additional patches (OfficeCard `<dl>` structure + two contrast tokens); patch count now 6.
- 2026-04-23 — All 6 patches applied: mailto navigation reorder + useEffect auto-dismiss hook; translated language labels in recruitment email; honeypot aria-label swap; OfficeCard `<dl>` restructure; `--text-muted` → `#707070` + `--brand-gold-dark` → `#8a743e`; Footer copyright switched to `text-text-on-dark/70`. Post-patch Lighthouse: 96/100/91 on all four EN pages (A11y perfect, AC #14 green). Typecheck, lint, and build all pass. Story status: review → done.
