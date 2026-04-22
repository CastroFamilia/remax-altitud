/**
 * Footer — App footer on dark background (#0D0D0D).
 *
 * Server Component — no client JS.
 * 4-column grid on desktop, stacked on mobile.
 */

import Link from "next/link";
import { Globe, Camera, MessageCircle, Mail } from "lucide-react";
import { offices } from "@/lib/constants/offices";
import { LanguageToggle } from "@/components/layout/language-toggle";

const quickLinks = [
  { label: "Properties", href: "/search" },
  { label: "Areas", href: "/areas" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Join Our Team", href: "/careers" },
];

const socialLinks = [
  {
    label: "Visit RE/MAX Altitud on Facebook",
    href: "https://facebook.com",
    icon: Globe,
  },
  {
    label: "Visit RE/MAX Altitud on Instagram",
    href: "https://instagram.com",
    icon: Camera,
  },
  {
    label: "Contact RE/MAX Altitud via WhatsApp",
    href: "https://wa.me/50600000000",
    icon: MessageCircle,
  },
  {
    label: "Email RE/MAX Altitud",
    href: "mailto:info@remaxaltitud.com",
    icon: Mail,
  },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

export function Footer() {
  return (
    <footer className="bg-brand-dark text-text-on-dark">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:text-brand-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Offices */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Offices
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
              Connect
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-11 items-center justify-center rounded-full text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/20 hover:text-brand-gold"
                  >
                    <Icon className="size-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 4: Legal & Language */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
              Legal
            </h3>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:text-brand-gold"
                  >
                    {link.label}
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
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} RE/MAX Altitud. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
