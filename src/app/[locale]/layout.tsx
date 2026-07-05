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

  // Try to fetch GTM Container ID from cached query, fallback to environment variable
  const gtmSettingValue = await getCachedSetting("GTM_CONTAINER_ID");
  const gtmId =
    gtmSettingValue || process.env.NEXT_PUBLIC_GTM_CONTAINER_ID || process.env.NEXT_PUBLIC_GTM_ID;

  // Try to fetch Facebook Pixel ID from cached query, fallback to environment variable
  const fbSettingValue = await getCachedSetting("FACEBOOK_PIXEL_ID");
  const fbPixelId =
    fbSettingValue ||
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
    process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  return (
    <html lang={locale} className={cn("font-sans", montserrat.variable)}>
      <head />
      <body>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {fbPixelId && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
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
        {gtmId && (
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
        {fbPixelId && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
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
