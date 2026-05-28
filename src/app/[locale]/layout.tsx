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

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-E2EMOCK123";

  return (
    <html lang={locale} className={cn("font-sans", montserrat.variable)}>
      <head>
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
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
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipToContent />
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
