import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./routing";

const messageMap = {
  en: () => import("../messages/en.json"),
  es: () => import("../messages/es.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale =
    requested && routing.locales.includes(requested as Locale)
      ? (requested as Locale)
      : routing.defaultLocale;

  return {
    locale,
    messages: (await (messageMap[locale as keyof typeof messageMap] || messageMap.en)()).default,
  };
});
