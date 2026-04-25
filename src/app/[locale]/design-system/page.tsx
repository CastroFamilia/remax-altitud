import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Design System — RE/MAX Altitud",
  description: "Token preview page (dev-only).",
};

type ColorSwatch = {
  name: string;
  value: string;
  bg: string;
  textClass?: string;
  note?: string;
};

const shadcnSwatches: ColorSwatch[] = [
  { name: "--background", value: "#F7F5EE", bg: "bg-background" },
  { name: "--foreground", value: "#202020", bg: "bg-foreground", textClass: "text-background" },
  { name: "--primary", value: "#000E35", bg: "bg-primary", textClass: "text-primary-foreground" },
  { name: "--accent", value: "#660000", bg: "bg-accent", textClass: "text-accent-foreground" },
  { name: "--muted", value: "#EFECE4", bg: "bg-muted" },
  { name: "--card", value: "#FFFFFF", bg: "bg-card" },
  {
    name: "--destructive",
    value: "#DC2626",
    bg: "bg-destructive",
    textClass: "text-destructive-foreground",
  },
  { name: "--ring", value: "#0043FF", bg: "bg-ring", textClass: "text-white" },
];

const brandSwatches: ColorSwatch[] = [
  { name: "--brand-navy", value: "#000E35", bg: "bg-brand-navy", textClass: "text-white" },
  {
    name: "--brand-navy-light",
    value: "#0B1E43",
    bg: "bg-brand-navy-light",
    textClass: "text-white",
  },
  { name: "--brand-burgundy", value: "#660000", bg: "bg-brand-burgundy", textClass: "text-white" },
  {
    name: "--brand-burgundy-light",
    value: "#931F2E",
    bg: "bg-brand-burgundy-light",
    textClass: "text-white",
  },
  { name: "--brand-red", value: "#FF1200", bg: "bg-brand-red", textClass: "text-white" },
  { name: "--brand-blue", value: "#0043FF", bg: "bg-brand-blue", textClass: "text-white" },
  { name: "--brand-gold", value: "#C2A661", bg: "bg-brand-gold", textClass: "text-brand-navy" },
  {
    name: "--brand-gold-dark",
    value: "#9B8347",
    bg: "bg-brand-gold-dark",
    textClass: "text-white",
  },
  {
    name: "--brand-gold-light",
    value: "#D9C39B",
    bg: "bg-brand-gold-light",
    textClass: "text-brand-navy",
  },
  { name: "--brand-crema", value: "#F7F5EE", bg: "bg-brand-crema" },
  { name: "--brand-warm", value: "#EFECE4", bg: "bg-brand-warm" },
  { name: "--brand-dark", value: "#0D0D0D", bg: "bg-brand-dark", textClass: "text-white" },
  { name: "--brand-whatsapp", value: "#128C7E", bg: "bg-brand-whatsapp", textClass: "text-white" },
  {
    name: "--brand-whatsapp-icon",
    value: "#25D366",
    bg: "bg-brand-whatsapp-icon",
    textClass: "text-brand-dark",
  },
];

const mountainSwatches: ColorSwatch[] = [
  { name: "--brand-mountain", value: "#233428", bg: "bg-brand-mountain", textClass: "text-white" },
  {
    name: "--brand-mountain-accent",
    value: "#C2A661",
    bg: "bg-brand-mountain-accent",
    textClass: "text-brand-mountain",
  },
];

const beachSwatches: ColorSwatch[] = [
  { name: "--brand-beach", value: "#183C5A", bg: "bg-brand-beach", textClass: "text-white" },
  {
    name: "--brand-beach-accent",
    value: "#D9C39B",
    bg: "bg-brand-beach-accent",
    textClass: "text-brand-beach",
  },
];

const spacingSteps: Array<{ name: string; px: number }> = [
  { name: "1", px: 4 },
  { name: "2", px: 8 },
  { name: "3", px: 12 },
  { name: "4", px: 16 },
  { name: "5", px: 20 },
  { name: "6", px: 24 },
  { name: "8", px: 32 },
  { name: "10", px: 40 },
  { name: "12", px: 48 },
  { name: "16", px: 64 },
  { name: "24", px: 96 },
];

const radiusSteps = [
  { label: "sm · 4px", cls: "rounded-sm" },
  { label: "md · 8px", cls: "rounded-md" },
  { label: "lg · 12px", cls: "rounded-lg" },
  { label: "xl · 16px", cls: "rounded-xl" },
  { label: "2xl · 20px", cls: "rounded-2xl" },
  { label: "full · pill", cls: "rounded-full" },
];

const shadowSteps = [
  { label: "shadow-sm", cls: "shadow-sm" },
  { label: "shadow-md", cls: "shadow-md" },
  { label: "shadow-lg", cls: "shadow-lg" },
  { label: "shadow-xl", cls: "shadow-xl" },
  { label: "shadow-glass", cls: "shadow-glass" },
  { label: "shadow-cta", cls: "shadow-cta" },
];

function Swatch({ swatch }: { swatch: ColorSwatch }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-sm">
      <div
        className={cn(
          "flex h-24 items-end p-3 font-semibold",
          swatch.bg,
          swatch.textClass ?? "text-foreground",
        )}
      >
        {swatch.value}
      </div>
      <div className="bg-card p-3">
        <code className="text-xs text-muted-foreground">{swatch.name}</code>
        {swatch.note ? <p className="mt-1 text-xs text-muted-foreground">{swatch.note}</p> : null}
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-6">
        <h3 className="mb-2 text-brand-navy">{title}</h3>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="bg-background pb-24 text-foreground">
      {/* Page header */}
      <div className="border-b border-border bg-brand-crema">
        <div className="container py-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[1px] text-brand-gold-dark">
            Dev Only · Story 1.2
          </p>
          <h1 className="text-brand-navy">Design System · Token Preview</h1>
          <p className="mt-4 max-w-[720px] text-muted-foreground">
            Visual validation of the RE/MAX Altitud design token foundation: colors, typography,
            spacing, shadows, glassmorphism, and region themes. Removed or gated before production
            launch.
          </p>
        </div>
      </div>

      <div className="container space-y-24 py-16">
        {/* Logo showcase */}
        <Section
          id="logo"
          title="Logo"
          description="Official mark on both dark (designed surface) and cream (readability check) backgrounds."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex h-48 items-center justify-center rounded-xl bg-brand-dark shadow-lg">
              <Image
                src="/images/brand/logo-remax-altitud.png"
                alt="RE/MAX Altitud logo on dark background"
                width={320}
                height={96}
                priority
              />
            </div>
            <div className="flex h-48 items-center justify-center rounded-xl bg-brand-crema shadow-sm ring-1 ring-border">
              <Image
                src="/images/brand/logo-remax-altitud.png"
                alt="RE/MAX Altitud logo on cream background (low-contrast check)"
                width={320}
                height={96}
              />
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Note: the wordmark is off-white (~#F2EDE3) and designed for dark surfaces (--brand-dark,
            --brand-navy, --brand-mountain). A dark variant or auto-inverting &lt;Logo&gt; component
            will land in Story 1.3.
          </p>
        </Section>

        {/* shadcn semantic slots */}
        <Section
          id="shadcn"
          title="shadcn Semantic Slots"
          description="Bare tokens (--primary, --accent, …) consumed by shadcn components."
        >
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {shadcnSwatches.map((s) => (
              <Swatch key={s.name} swatch={s} />
            ))}
          </div>
        </Section>

        {/* Brand palette */}
        <Section
          id="brand"
          title="RE/MAX Brand Palette"
          description="--brand-* tokens used directly in custom marketing surfaces."
        >
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {brandSwatches.map((s) => (
              <Swatch key={s.name} swatch={s} />
            ))}
          </div>
        </Section>

        {/* Region themes */}
        <Section
          id="regions"
          title="Region Themes"
          description="Mountain (forest green + gold) and Coastal (ocean blue + sand)."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl shadow-lg">
              <div className="bg-brand-mountain p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-[1px] text-brand-mountain-accent">
                  Mountain
                </p>
                <h3 className="mt-2 text-white">Pérez Zeledón</h3>
                <p className="mt-2 text-white/80">
                  Forest green primary with gold accent — used for cloud-forest and highland
                  properties.
                </p>
              </div>
              <div className="flex gap-2 bg-card p-4">
                {mountainSwatches.map((s) => (
                  <span
                    key={s.name}
                    className={cn("rounded-md px-3 py-1 text-xs font-semibold", s.bg, s.textClass)}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl shadow-lg">
              <div className="bg-brand-beach p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-[1px] text-brand-beach-accent">
                  Coast
                </p>
                <h3 className="mt-2 text-white">Dominical · Uvita</h3>
                <p className="mt-2 text-white/80">
                  Ocean blue primary with sand accent — used for beachfront and coastal properties.
                </p>
              </div>
              <div className="flex gap-2 bg-card p-4">
                {beachSwatches.map((s) => (
                  <span
                    key={s.name}
                    className={cn("rounded-md px-3 py-1 text-xs font-semibold", s.bg, s.textClass)}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section
          id="typography"
          title="Typography"
          description="Montserrat loaded via next/font (400, 600, 700, 800). 16px body minimum."
        >
          <div className="space-y-6 rounded-xl bg-card p-8 shadow-md">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[1px] text-muted-foreground">
                Hero · --text-hero
              </p>
              <p className="text-brand-navy text-[length:var(--text-hero)] leading-[var(--text-hero-lh)] font-semibold tracking-[-0.5px]">
                Discover the Southern Zone
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[1px] text-muted-foreground">
                H1 · --text-h1
              </p>
              <h1 className="!text-[var(--text-h1)] leading-[var(--text-h1-lh)]">
                Premium properties, carefully curated
              </h1>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[1px] text-muted-foreground">
                H2 · --text-h2
              </p>
              <h2 className="!text-[var(--text-h2)] leading-[var(--text-h2-lh)]">
                From cloud forest to coastline
              </h2>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[1px] text-muted-foreground">
                Body · --text-body · 16px minimum
              </p>
              <p className="max-w-[720px] text-foreground">
                A multilingual, map-first search experience for buyers, sellers, and investors
                exploring Pérez Zeledón, Dominical, and Uvita. Built for clarity on every device
                from low-end Android to desktop.
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[1px] text-muted-foreground">
                Label · --text-xs · uppercase, letter-spacing 1px
              </p>
              <span className="text-xs font-semibold uppercase tracking-[1px] text-brand-gold-dark">
                Featured Listing
              </span>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[1px] text-muted-foreground">
                Price · --text-price · weight 800, burgundy
              </p>
              <span className="text-accent text-[length:var(--text-price)] leading-[var(--text-price-lh)] font-extrabold">
                $ 1,250,000
              </span>
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section
          id="spacing"
          title="Spacing · 4px Base Grid"
          description="--spacing-1 through --spacing-24 (Tailwind utilities p-1, p-4, p-16…)."
        >
          <div className="space-y-3 rounded-xl bg-card p-6 shadow-sm">
            {spacingSteps.map((s) => (
              <div key={s.name} className="flex items-center gap-4">
                <code className="w-24 text-xs text-muted-foreground">--spacing-{s.name}</code>
                <div className="h-4 rounded-sm bg-brand-gold" style={{ width: `${s.px}px` }} />
                <span className="text-sm text-muted-foreground">{s.px}px</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Radius */}
        <Section
          id="radius"
          title="Border Radius"
          description="Six steps from sharp to fully pill."
        >
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6">
            {radiusSteps.map((r) => (
              <div key={r.label} className="space-y-2 text-center">
                <div className={cn("mx-auto h-20 w-20 bg-brand-navy shadow-md", r.cls)} />
                <code className="text-xs text-muted-foreground">{r.label}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows */}
        <Section
          id="shadows"
          title="Shadows · 6 Levels"
          description="--shadow-sm through --shadow-cta. The cta shadow uses burgundy tint."
        >
          <div className="grid gap-6 bg-brand-crema p-8 sm:grid-cols-2 md:grid-cols-3">
            {shadowSteps.map((s) => (
              <div
                key={s.label}
                className={cn(
                  "flex h-24 items-center justify-center rounded-lg bg-card text-sm font-semibold text-brand-navy",
                  s.cls,
                )}
              >
                {s.label}
              </div>
            ))}
          </div>
        </Section>

        {/* Glassmorphism */}
        <Section
          id="glass"
          title="Glassmorphism"
          description="--glass-bg (.10), --glass-bg-strong (.25), --glass-border (gold α.4), --glass-blur 15px."
        >
          <div className="relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-burgundy" />
            <div className="relative grid gap-6 p-10 md:grid-cols-2">
              <div className="glass rounded-xl p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[1px] text-brand-gold">
                  .glass · subtle
                </p>
                <h3 className="mt-2 text-white">Soft frosted surface</h3>
                <p className="mt-2 text-white/80">Used for hero overlays and map filter pills.</p>
              </div>
              <div className="glass-strong rounded-xl p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[1px] text-brand-gold">
                  .glass-strong · prominent
                </p>
                <h3 className="mt-2 text-white">Readable frosted card</h3>
                <p className="mt-2 text-white/80">Used for modal and floating CTA surfaces.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Button variant preview */}
        <Section
          id="buttons"
          title="Button Variants (preview)"
          description="Button component ships in Story 1.3. This preview validates token/CTA shadow rendering only."
        >
          <div className="flex flex-wrap gap-4 rounded-xl bg-card p-6 shadow-sm">
            <button
              type="button"
              className="touch-target rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-cta transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:bg-brand-burgundy-light"
            >
              Primary · Burgundy
            </button>
            <button
              type="button"
              className="touch-target rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:bg-brand-navy-light"
            >
              Secondary · Navy
            </button>
            <button
              type="button"
              className="touch-target rounded-lg bg-brand-whatsapp px-6 py-3 font-semibold text-white shadow-md transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:brightness-110"
            >
              WhatsApp
            </button>
            <button
              type="button"
              className="touch-target rounded-lg border border-brand-gold-dark bg-transparent px-6 py-3 font-semibold text-brand-gold-dark transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:bg-brand-gold-dark hover:text-white"
            >
              Outline · Gold
            </button>
          </div>
        </Section>

        {/* Region theme demos — applied full-bleed */}
        <Section
          id="region-themes"
          title="Region Theme Demos"
          description="Page-level theming example for mountain and coastal destinations."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <article className="overflow-hidden rounded-xl bg-brand-mountain text-white shadow-lg">
              <div className="p-8">
                <span className="text-xs font-semibold uppercase tracking-[1px] text-brand-mountain-accent">
                  Cloud Forest · Mountain
                </span>
                <h3 className="mt-3 text-white">Casa Bosque Nuboso</h3>
                <p className="mt-3 text-white/80">5-bedroom retreat · Pérez Zeledón</p>
                <p className="mt-6 text-brand-mountain-accent text-[length:var(--text-price)] font-extrabold">
                  $ 980,000
                </p>
              </div>
            </article>
            <article className="overflow-hidden rounded-xl bg-brand-beach text-white shadow-lg">
              <div className="p-8">
                <span className="text-xs font-semibold uppercase tracking-[1px] text-brand-beach-accent">
                  Beachfront · Coast
                </span>
                <h3 className="mt-3 text-white">Villa Mar Azul</h3>
                <p className="mt-3 text-white/80">4-bedroom oceanfront · Uvita</p>
                <p className="mt-6 text-brand-beach-accent text-[length:var(--text-price)] font-extrabold">
                  $ 2,150,000
                </p>
              </div>
            </article>
          </div>
        </Section>

        {/* cn() smoke test */}
        <Section
          id="utils"
          title="cn() Smoke Test"
          description="Verifies @/lib/utils exposes the clsx + tailwind-merge helper."
        >
          <div
            className={cn(
              "rounded-lg border border-border bg-card p-6 shadow-sm",
              "text-foreground",
              // tailwind-merge should dedupe the conflicting padding below:
              "p-4 p-6",
            )}
          >
            <p className="font-semibold">cn() is wired correctly.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              tailwind-merge resolved <code>p-4 p-6</code> to <code>p-6</code>. Conflicting utility
              classes are deduped and clsx compositions apply as expected.
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}
