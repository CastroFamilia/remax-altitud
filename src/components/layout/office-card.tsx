import { getTranslations } from "next-intl/server";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import type { Office } from "@/lib/constants/offices";
import { buildWhatsAppUrl } from "@/lib/constants/offices";

export async function OfficeCard({ office }: { office: Office }) {
  const t = await getTranslations("AboutPage.office");
  const waUrl = buildWhatsAppUrl(office);
  const telHref = `tel:${office.phone.replace(/\s|-/g, "")}`;

  return (
    <article className="rounded-xl border border-brand-warm bg-white p-6 shadow-md">
      <h3 className="text-xl font-bold text-brand-navy">{office.name}</h3>
      <p className="mt-1 text-sm font-semibold text-brand-gold-dark">{office.location}</p>
      <dl className="mt-4 space-y-2 text-sm text-brand-navy/80">
        <div>
          <dt className="sr-only">{t("addressLabel")}</dt>
          <dd className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
            <span>{office.address}</span>
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t("phoneLabel")}</dt>
          <dd className="flex items-start gap-2">
            <Phone className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
            <a href={telHref} className="hover:text-brand-gold-dark">
              {office.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t("emailLabel")}</dt>
          <dd className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
            <a href={`mailto:${office.email}`} className="hover:text-brand-gold-dark">
              {office.email}
            </a>
          </dd>
        </div>
        {office.whatsapp ? (
          <div>
            <dt className="sr-only">{t("whatsappLabel")}</dt>
            <dd className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-navy" aria-hidden />
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-gold-dark"
              >
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
