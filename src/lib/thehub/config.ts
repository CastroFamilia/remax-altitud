/**
 * Configuration and URL helpers for TheHub integration.
 * Supports configurable environments via NEXT_PUBLIC_THEHUB_URL.
 * Defaults to dev.hub.remax-altitud.cr.
 */

export const DEFAULT_THEHUB_URL = "https://dev.hub.remax-altitud.cr";

export function getTheHubBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_THEHUB_URL ||
    process.env.THE_HUB_API_URL ||
    process.env.THEHUB_API_URL ||
    process.env.THEHUB_BASE_URL ||
    DEFAULT_THEHUB_URL;

  return url.replace(/\/+$/, "");
}

/**
 * Returns the public URL for the centralized referral directory in TheHub.
 * e.g. https://dev.hub.remax-altitud.cr/es/referrals
 */
export function getTheHubReferralDirectoryUrl(locale: string = "es"): string {
  const base = getTheHubBaseUrl();
  const lang = locale === "en" ? "en" : "es";
  return `${base}/${lang}/referrals`;
}

/**
 * Returns the direct referral submission URL for a specific agent.
 * e.g. https://dev.hub.remax-altitud.cr/es/referrals/report?to=luis-carlos-martinez
 */
export function getTheHubAgentReferralUrl(locale: string = "es", slug: string): string {
  const base = getTheHubBaseUrl();
  const lang = locale === "en" ? "en" : "es";
  return `${base}/${lang}/referrals/report?to=${encodeURIComponent(slug)}`;
}

/**
 * Returns the central office referral URL (broker-assigned referral).
 * e.g. https://dev.hub.remax-altitud.cr/es/referrals/report?to=office
 */
export function getTheHubOfficeReferralUrl(locale: string = "es"): string {
  const base = getTheHubBaseUrl();
  const lang = locale === "en" ? "en" : "es";
  return `${base}/${lang}/referrals/report?to=office`;
}

/**
 * Returns the API endpoint URL for external agent directory data.
 */
export function getTheHubApiExternalUrl(): string {
  const base = getTheHubBaseUrl();
  return `${base}/api/referrals/external`;
}
