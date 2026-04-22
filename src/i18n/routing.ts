import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  // All routes use /{locale}/ prefix per AR12
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
