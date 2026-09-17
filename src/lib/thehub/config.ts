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
 * Returns the default API endpoint URL for external agent directory data.
 */
export function getTheHubApiExternalUrl(): string {
  const base = process.env.THEHUB_INTERNAL_API_URL || getTheHubBaseUrl();
  return `${base.replace(/\/+$/, "")}/api/referrals/external`;
}

/**
 * Returns candidate API endpoint URLs for server-side fetching of TheHub data.
 * When co-located in Docker / Coolify on the same server, Hairpin NAT prevents
 * outbound public domain calls. Candidates include internal Docker hostnames
 * as well as explicit environment variables and the public fallback.
 */
export function getTheHubApiCandidateUrls(): string[] {
  const urls: string[] = [];

  // 1. Explicit internal URLs from env
  if (process.env.THEHUB_INTERNAL_API_URL) {
    urls.push(`${process.env.THEHUB_INTERNAL_API_URL.replace(/\/+$/, "")}/api/referrals/external`);
  }
  if (process.env.THE_HUB_INTERNAL_URL) {
    urls.push(`${process.env.THE_HUB_INTERNAL_URL.replace(/\/+$/, "")}/api/referrals/external`);
  }

  // 2. Standard Coolify / Docker internal aliases for TheHub
  urls.push("http://thehub-dev:3000/api/referrals/external");
  urls.push("http://thehub:3000/api/referrals/external");

  // 3. Primary configured external API URL (from THE_HUB_API_URL or NEXT_PUBLIC_THEHUB_URL)
  const primary = getTheHubApiExternalUrl();
  if (!urls.includes(primary)) {
    urls.push(primary);
  }

  // 4. Default public fallback
  const defaultPublic = `${DEFAULT_THEHUB_URL}/api/referrals/external`;
  if (!urls.includes(defaultPublic)) {
    urls.push(defaultPublic);
  }

  return urls;
}
