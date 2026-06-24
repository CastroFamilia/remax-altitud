/**
 * Footer — App footer on dark background (#0D0D0D).
 *
 * Server Component — no client JS.
 * 4-column grid on desktop, stacked on mobile.
 */

import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { offices } from "@/lib/constants/offices";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { FooterContactButton } from "@/components/layout/footer-contact-button";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const quickLinks = [
  { key: "properties", href: "/search" },
  { key: "ourAgents", href: "/agents" },
  { key: "communities", href: "/communities" },
  { key: "vipBuyer", href: "/find-your-dream-property" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
  { key: "joinTeam", href: "/join" },
  { key: "faq", href: "/faq" },
] as const;

const socialLinks = [
  {
    key: "socialFacebook",
    href: "https://www.facebook.com/remaxaltitudcostarica/",
    icon: FacebookIcon,
  },
  {
    key: "socialInstagram",
    href: "https://www.instagram.com/remaxaltitudcostarica",
    icon: InstagramIcon,
  },
  {
    key: "socialYoutube",
    href: "https://www.youtube.com/@remaxaltitudcostarica",
    icon: YoutubeIcon,
  },
  { key: "socialWhatsApp", href: "https://wa.me/50660788887", icon: MessageCircle },
] as const;

const legalLinks = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
] as const;

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="bg-brand-dark text-text-on-dark">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              {t("quickLinks")}
            </h3>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:text-brand-gold"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Offices */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              {t("offices")}
            </h3>
            <ul className="flex flex-col gap-4">
              {offices.map((office) => (
                <li key={office.name}>
                  <p className="text-sm font-semibold text-text-on-dark">{office.name}</p>
                  <p className="text-xs text-text-on-dark/70">{office.location}</p>
                  <p className="mt-1 text-xs text-text-on-dark/70">{office.address}</p>
                  <p className="text-xs text-text-on-dark/70">{office.phone}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Social & Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              {t("connect")}
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t(social.key)}
                    className="flex size-11 items-center justify-center rounded-full text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/20 hover:text-brand-gold"
                  >
                    <Icon className="size-5" />
                  </a>
                );
              })}
              <FooterContactButton />
            </div>
          </div>

          {/* Column 4: Legal & Language */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              {t("legal")}
            </h3>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:text-brand-gold"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <LanguageToggle variant="dark" />
            </div>
          </div>
        </div>

        {/* Gold divider + Copyright */}
        <div className="mt-10 border-t border-brand-gold/40 pt-6 text-center">
          <p className="text-xs text-text-on-dark/70">
            © {new Date().getFullYear()} REMAX Altitud. {t("allRightsReserved")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
