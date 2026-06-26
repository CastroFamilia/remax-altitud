import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_ORIGIN } from "@/lib/seo/constants";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StickyMobileCta } from "@/components/layout/sticky-mobile-cta";
import Script from "next/script";
import { getCachedSetting } from "@/lib/db/queries/settings";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved: Locale = routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "Metadata" });
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [{ url: "/favicon.ico" }, { url: "/favicon.png", sizes: "192x192", type: "image/png" }],
      apple: [{ url: "/favicon.png", sizes: "192x192", type: "image/png" }],
    },
    formatDetection: {
      address: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000E35",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Middleware redirects locale-shaped invalid prefixes (/fr, /xx) to the
  // default locale. If anything else reaches here (e.g. non-locale-shaped
  // first segment that somehow leaked through), fall through to 404.
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  // Try to fetch GA4 Measurement ID from cached query, fallback to environment variable
  const ga4SettingValue = await getCachedSetting("GA_MEASUREMENT_ID");
  const gaId = ga4SettingValue || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-E2EMOCK123";

  return (
    <html lang={locale} className={cn("font-sans", montserrat.variable)}>
      <head />
      <body>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('consent', 'default', {
                  'ad_storage': 'denied',
                  'analytics_storage': 'denied',
                  'personalization_storage': 'denied',
                  'wait_for_update': 500
                });

                gtag('config', '${gaId}', {
                  'client_storage': 'none',
                  'anonymize_ip': true
                });
              `}
            </Script>
          </>
        )}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipToContent />
          <Header />
          <main id="main-content" className="pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <StickyMobileCta />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
