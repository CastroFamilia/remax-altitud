import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroSearchShell } from "@/components/home/hero-search-shell";
import { cn } from "@/lib/utils";

/*
 * Hero image assets expected at:
 *   public/images/home/hero-mountains.jpg  (1920×1080, ≤ 200KB — Pérez Zeledón landscape)
 *   public/images/home/hero-coast.jpg      (1920×1080, ≤ 200KB — Dominical / Uvita beach)
 * Current files are low-fidelity placeholders; swap the files to update the hero
 * without touching this component.
 */

type Accent = "mountain" | "coast";

type HeroPaneProps = {
  image: string;
  altKey: "mountainsAlt" | "coastAlt";
  labelKey: "mountainsLabel" | "coastLabel";
  regionKey: "mountainsRegion" | "coastRegion";
  ctaKey: "mountainsCta" | "coastCta";
  href: "/search?region=mountain" | "/search?region=coast";
  accent: Accent;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
};

function HeroPane({
  image,
  altKey,
  labelKey,
  regionKey,
  ctaKey,
  href,
  accent,
  priority,
  fetchPriority,
}: HeroPaneProps) {
  const t = useTranslations("HomePage.hero");

  const accentRing =
    accent === "mountain"
      ? "ring-[var(--brand-mountain-accent)]"
      : "ring-[var(--brand-beach-accent)]";

  return (
    <div
      className={cn(
        "group/pane relative flex h-[40vh] min-w-0 flex-1 overflow-hidden",
        // Desktop/tablet: fill parent height; expand on hover/focus-within.
        // 1.22 / (1.22 + 1) ≈ 55% to meet AC #2's 55/45 expansion ratio.
        // motion-safe: guards against the hover firing under prefers-reduced-motion (AC #9).
        "md:h-full md:transition-[flex-grow] md:duration-[var(--duration-smooth)] md:ease-[var(--ease-smooth)]",
        "motion-safe:lg:hover:flex-[1.22] motion-safe:lg:focus-within:flex-[1.22]",
      )}
    >
      <div className="absolute inset-0 ken-burns">
        <Image
          src={image}
          alt={t(altKey)}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          fetchPriority={fetchPriority}
          className="object-cover"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
      />

      <div className="relative z-[1] flex w-full flex-col justify-end gap-3 p-6 text-white md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
          {t(regionKey)}
        </p>
        <h2 className="!text-[var(--text-hero)] leading-[var(--text-hero-lh)] font-semibold tracking-[-0.5px] text-white drop-shadow-md">
          {t(labelKey)}
        </h2>
        <div>
          <Link
            href={href}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/95 px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-[var(--shadow-md)] ring-2 ring-transparent transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth)] hover:bg-white",
              accentRing,
              "focus-visible:outline-none focus-visible:ring-[var(--focus-ring-width)] focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
            )}
          >
            {t(ctaKey)}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SplitHero() {
  const t = useTranslations("HomePage.hero");

  return (
    <section aria-label={`${t("mountainsLabel")} / ${t("coastLabel")}`} className="relative">
      <div className="flex flex-col md:h-[60vh] md:flex-row lg:h-[80vh]">
        <HeroPane
          image="/images/home/hero-mountains.jpg"
          altKey="mountainsAlt"
          labelKey="mountainsLabel"
          regionKey="mountainsRegion"
          ctaKey="mountainsCta"
          href="/search?region=mountain"
          accent="mountain"
          priority
        />

        <HeroSearchShell variant="mobile-inline" />

        <HeroPane
          image="/images/home/hero-coast.jpg"
          altKey="coastAlt"
          labelKey="coastLabel"
          regionKey="coastRegion"
          ctaKey="coastCta"
          href="/search?region=coast"
          accent="coast"
          priority
          fetchPriority="high"
        />
      </div>

      <div className="hidden md:block">
        <HeroSearchShell variant="desktop-overlay" />
      </div>
    </section>
  );
}
