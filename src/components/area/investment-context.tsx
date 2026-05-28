import { getTranslations } from "next-intl/server";
import { getInvestmentContext } from "@/lib/utils/investment";

interface InvestmentContextProps {
  metadata: Record<string, unknown> | null | undefined;
  locale: string;
}

/**
 * Server Component to render admin-curated investment context for an area.
 * Gracefully renders null if no investment data is present or valid.
 */
export async function InvestmentContext({ metadata, locale }: InvestmentContextProps) {
  const data = getInvestmentContext(metadata);
  if (!data) return null;

  const t = await getTranslations({ locale, namespace: "InvestmentContext" });
  const headingId = "investment-context-heading";

  return (
    <section
      data-testid="investment-context"
      aria-labelledby={headingId}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="rounded-lg bg-brand-gold-light/10 p-6 border border-brand-gold/25">
        <h2 id={headingId} className="text-2xl font-bold text-brand-navy mb-6">
          {t("heading")}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-navy block mb-1">
              {t("appreciation")}
            </span>
            <p className="text-lg text-text-primary">{data.appreciationTrend}</p>
          </div>

          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-navy block mb-1">
              {t("rentalYield")}
            </span>
            <p className="text-lg text-text-primary">{data.rentalYieldEstimate}</p>
          </div>
        </div>

        {data.marketHighlights && data.marketHighlights.length > 0 && (
          <div className="mt-6">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-navy block mb-2">
              {t("highlights")}
            </span>
            <ul className="list-disc pl-5 space-y-1 text-text-secondary">
              {data.marketHighlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        <aside
          data-testid="investment-disclaimer"
          role="note"
          className="mt-6 border-l-4 border-brand-gold pl-4 text-sm italic text-text-muted"
        >
          {t("disclaimer")}
        </aside>
      </div>
    </section>
  );
}
