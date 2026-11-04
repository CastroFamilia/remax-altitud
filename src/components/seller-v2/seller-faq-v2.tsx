import { getTranslations } from "next-intl/server";

interface SellerFaqV2Props {
  locale: string;
}

export async function SellerFaqV2({ locale }: SellerFaqV2Props) {
  const t = await getTranslations({ locale, namespace: "SellerPageV2.faq" });

  const faqs = [
    { q: t("q1_question"), a: t("q1_answer") },
    { q: t("q2_question"), a: t("q2_answer") },
    { q: t("q3_question"), a: t("q3_answer") },
    { q: t("q4_question"), a: t("q4_answer") },
    { q: t("q5_question"), a: t("q5_answer") },
    { q: t("q6_question"), a: t("q6_answer") },
    { q: t("q7_question"), a: t("q7_answer") },
    { q: t("q8_question"), a: t("q8_answer") },
    { q: t("q9_question"), a: t("q9_answer") },
    { q: t("q10_question"), a: t("q10_answer") },
  ];

  // Schema.org FAQPage JSON-LD para Google y Motores de IA (ChatGPT / Perplexity)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <section className="bg-slate-50 py-16 px-4 md:py-24 border-t border-slate-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            {t("eyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-bold text-brand-navy sm:text-3xl md:text-4xl">
            {t("heading")}
          </h2>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_summary::-webkit-details-marker]:hidden transition-all duration-200 open:shadow-md"
            >
              <summary className="flex cursor-pointer items-center justify-between font-bold text-brand-navy text-base sm:text-lg">
                <span className="pr-4">{faq.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition duration-300 group-open:rotate-180 group-open:bg-brand-gold/20 group-open:text-brand-navy">
                  ↓
                </span>
              </summary>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
