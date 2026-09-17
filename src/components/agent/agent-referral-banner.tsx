import { getTranslations } from "next-intl/server";
import { ShieldCheck, ArrowRight, Building2, Users } from "lucide-react";
import { getTheHubReferralDirectoryUrl, getTheHubOfficeReferralUrl } from "@/lib/thehub/config";

interface AgentReferralBannerProps {
  locale: string;
}

export async function AgentReferralBanner({ locale }: AgentReferralBannerProps) {
  const t = await getTranslations({ locale, namespace: "AgentProfile" });
  const directoryUrl = getTheHubReferralDirectoryUrl(locale);
  const officeUrl = getTheHubOfficeReferralUrl(locale);

  return (
    <aside
      aria-label={t("referralBannerTitle")}
      className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#091D3E] via-[#002244] to-[#0A3366] p-6 text-white shadow-lg md:p-8"
    >
      {/* Background subtle badge accent */}
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 opacity-10"
        aria-hidden="true"
      >
        <ShieldCheck className="h-64 w-64 text-white" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>25% Referral Fee Protected</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {t("referralBannerTitle")}
          </h2>

          <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
            {t("referralBannerDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
          <a
            href={directoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-brand-navy shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Users className="h-4 w-4" />
            <span>{t("referralBannerExploreCta")}</span>
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href={officeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Building2 className="h-4 w-4" />
            <span>{t("referralBannerOfficeCta")}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

export default AgentReferralBanner;
