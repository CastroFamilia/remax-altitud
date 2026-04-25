# Edge Case Hunter Review Prompt (RE-REVIEW)

You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling. Scan only the diff hunks and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.

Follow these steps EXACTLY:
1. Walk every branching path and boundary condition within scope.
2. Determine whether the content handles it.
3. Collect only the unhandled paths.
4. Output findings as a JSON array of objects with fields: location, trigger_condition, guard_snippet, potential_consequence.

Return ONLY the JSON array.

## Content to Review
```diff
diff --git a/next.config.ts b/next.config.ts
index 3ce5123..2f58c29 100644
--- a/next.config.ts
+++ b/next.config.ts
@@ -1,5 +1,8 @@
 import type { NextConfig } from "next";
 import { withSentryConfig } from "@sentry/nextjs";
+import createNextIntlPlugin from "next-intl/plugin";
+
+const withNextIntl = createNextIntlPlugin();
 
 const nextConfig: NextConfig = {
   output: "standalone",
@@ -22,18 +25,20 @@ const nextConfig: NextConfig = {
   },
 };
 
-export default withSentryConfig(nextConfig, {
-  // For all available options, see:
-  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
+export default withNextIntl(
+  withSentryConfig(nextConfig, {
+    // For all available options, see:
+    // https://www.npmjs.com/package/@sentry/webpack-plugin#options
 
-  org: process.env.SENTRY_ORG,
-  project: process.env.SENTRY_PROJECT,
+    org: process.env.SENTRY_ORG,
+    project: process.env.SENTRY_PROJECT,
 
-  // Only print logs for uploading source maps in CI
-  silent: !process.env.CI,
+    // Only print logs for uploading source maps in CI
+    silent: !process.env.CI,
 
-  // Disable source map upload until SENTRY_AUTH_TOKEN is configured
-  sourcemaps: {
-    disable: !process.env.SENTRY_AUTH_TOKEN,
-  },
-});
+    // Disable source map upload until SENTRY_AUTH_TOKEN is configured
+    sourcemaps: {
+      disable: !process.env.SENTRY_AUTH_TOKEN,
+    },
+  }),
+);
diff --git a/package.json b/package.json
index 3f29cb7..443a897 100644
--- a/package.json
+++ b/package.json
@@ -23,6 +23,7 @@
     "drizzle-orm": "^0.44.0",
     "lucide-react": "^1.8.0",
     "next": "15.5.15",
+    "next-intl": "^4.9.1",
     "postgres": "^3.4.0",
     "radix-ui": "^1.4.3",
     "react": "19.1.0",
diff --git a/src/app/design-system/page.tsx b/src/app/[locale]/design-system/page.tsx
similarity index 98%
rename from src/app/design-system/page.tsx
rename to src/app/[locale]/design-system/page.tsx
index d3e5278..43e58ad 100644
--- a/src/app/design-system/page.tsx
+++ b/src/app/[locale]/design-system/page.tsx
@@ -1,5 +1,6 @@
 import Image from "next/image";
 import { notFound } from "next/navigation";
+import { setRequestLocale } from "next-intl/server";
 import { cn } from "@/lib/utils";
 
 export const metadata = {
@@ -167,7 +168,14 @@ function Section({
   );
 }
 
-export default function DesignSystemPage() {
+export default async function DesignSystemPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  setRequestLocale(locale);
+
   if (process.env.NODE_ENV === "production") {
     notFound();
   }
diff --git a/src/app/[locale]/page.tsx b/src/app/[locale]/page.tsx
new file mode 100644
index 0000000..360cfc7
--- /dev/null
+++ b/src/app/[locale]/page.tsx
@@ -0,0 +1,21 @@
+import { useTranslations } from "next-intl";
+import { setRequestLocale } from "next-intl/server";
+
+export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
+  const { locale } = await params;
+  setRequestLocale(locale);
+
+  return <HomeContent />;
+}
+
+function HomeContent() {
+  const t = useTranslations("HomePage");
+
+  return (
+    <div className="flex min-h-screen flex-col items-center justify-center p-8">
+      <h1 className="text-4xl font-bold">{t("title")}</h1>
+      <p className="mt-4 text-lg text-gray-600">{t("subtitle")}</p>
+      <p className="mt-2 text-sm text-gray-400">{t("scaffoldingNote")}</p>
+    </div>
+  );
+}
diff --git a/src/app/layout.tsx b/src/app/layout.tsx
index ee40448..0636ba3 100644
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,43 +1,14 @@
-import type { Metadata, Viewport } from "next";
-import { Montserrat } from "next/font/google";
-import "@/styles/globals.css";
-import { cn } from "@/lib/utils";
-import { SkipToContent } from "@/components/layout/skip-to-content";
-import { Header } from "@/components/layout/header";
-import { Footer } from "@/components/layout/footer";
-
-const montserrat = Montserrat({
-  subsets: ["latin", "latin-ext"],
-  weight: ["400", "600", "700", "800"],
-  display: "swap",
-  variable: "--font-montserrat",
-});
-
-export const metadata: Metadata = {
-  title: "RE/MAX Altitud — Costa Rica Real Estate",
-  description:
-    "Discover properties in Costa Rica's Southern Zone. Map-first search, multilingual support, and expert agents across Pérez Zeledón and Dominical/Uvita.",
-};
-
-export const viewport: Viewport = {
-  themeColor: "#000E35",
-  width: "device-width",
-  initialScale: 1,
-};
-
-export default function RootLayout({
-  children,
-}: Readonly<{
-  children: React.ReactNode;
-}>) {
-  return (
-    <html lang="en" className={cn("font-sans", montserrat.variable)}>
-      <body>
-        <SkipToContent />
-        <Header />
-        <main id="main-content">{children}</main>
-        <Footer />
-      </body>
-    </html>
-  );
+/**
+ * Root layout — minimal passthrough.
+ *
+ * The <html>/<body>, fonts, providers, and global shell live in
+ * src/app/[locale]/layout.tsx so that `<html lang>` reflects the
+ * active locale (UX-DR26). There must be only one <html> tag in
+ * the tree — do not render one here.
+ */
+
+import React from "react";
+
+export default function RootLayout({ children }: { children: React.ReactNode }) {
+  return <>{children}</>;
 }
diff --git a/src/app/page.tsx b/src/app/page.tsx
deleted file mode 100644
index d6f25a6..0000000
--- a/src/app/page.tsx
+++ /dev/null
@@ -1,13 +0,0 @@
-export default function HomePage() {
-  return (
-    <main className="flex min-h-screen flex-col items-center justify-center p-8">
-      <h1 className="text-4xl font-bold">RE/MAX Altitud</h1>
-      <p className="mt-4 text-lg text-gray-600">
-        Costa Rica&apos;s Southern Zone — Real Estate Platform
-      </p>
-      <p className="mt-2 text-sm text-gray-400">
-        Foundation scaffolding complete. Content coming in Stories 1.2–1.6.
-      </p>
-    </main>
-  );
-}
diff --git a/src/components/layout/desktop-nav.tsx b/src/components/layout/desktop-nav.tsx
index a2d6c2a..ec72b90 100644
--- a/src/components/layout/desktop-nav.tsx
+++ b/src/components/layout/desktop-nav.tsx
@@ -9,8 +9,8 @@
  * Client Component — requires usePathname() for active route detection.
  */
 
-import Link from "next/link";
-import { usePathname } from "next/navigation";
+import { useTranslations } from "next-intl";
+import { Link, usePathname } from "@/i18n/navigation";
 import { cn } from "@/lib/utils";
 import { mainNavItems, type NavItem } from "@/lib/navigation";
 import { Button } from "@/components/ui/button";
@@ -26,19 +26,21 @@ import {
 
 export function DesktopNav() {
   const pathname = usePathname();
+  const t = useTranslations("Navigation");
+  const tMobile = useTranslations("MobileNav");
 
   return (
-    <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
+    <nav className="hidden items-center gap-1 md:flex" aria-label={tMobile("mainNav")}>
       <NavigationMenu delayDuration={150} skipDelayDuration={300}>
         <NavigationMenuList>
           {mainNavItems.map((item) => (
             <NavigationMenuItem key={item.href}>
               {item.children ? (
-                <DropdownNavItem item={item} pathname={pathname} />
+                <DropdownNavItem item={item} pathname={pathname} t={t} />
               ) : item.isCta ? (
-                <CtaNavItem item={item} pathname={pathname} />
+                <CtaNavItem item={item} pathname={pathname} t={t} />
               ) : (
-                <SimpleNavItem item={item} pathname={pathname} />
+                <SimpleNavItem item={item} pathname={pathname} t={t} />
               )}
             </NavigationMenuItem>
           ))}
@@ -51,8 +53,18 @@ export function DesktopNav() {
   );
 }
 
+type Translator = (key: string) => string;
+
 /** Regular nav link (no dropdown, no CTA) */
-function SimpleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
+function SimpleNavItem({
+  item,
+  pathname,
+  t,
+}: {
+  item: NavItem;
+  pathname: string;
+  t: Translator;
+}) {
   const isActive = item.activePrefix
     ? pathname.startsWith(item.activePrefix)
     : pathname === item.href;
@@ -67,13 +79,13 @@ function SimpleNavItem({ item, pathname }: { item: NavItem; pathname: string })
       )}
       {...(isActive ? { "aria-current": "page" as const } : {})}
     >
-      {item.label}
+      {t(item.labelKey)}
     </Link>
   );
 }
 
 /** CTA nav item ("Sell Your Property") — outline accent button */
-function CtaNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
+function CtaNavItem({ item, pathname, t }: { item: NavItem; pathname: string; t: Translator }) {
   const isActive = pathname === item.href;
 
   return (
@@ -86,14 +98,22 @@ function CtaNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
       )}
     >
       <Link href={item.href} {...(isActive ? { "aria-current": "page" as const } : {})}>
-        {item.label}
+        {t(item.labelKey)}
       </Link>
     </Button>
   );
 }
 
 /** Dropdown nav item (Properties, Areas) */
-function DropdownNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
+function DropdownNavItem({
+  item,
+  pathname,
+  t,
+}: {
+  item: NavItem;
+  pathname: string;
+  t: Translator;
+}) {
   const isActive = item.activePrefix
     ? pathname.startsWith(item.activePrefix)
     : pathname === item.href;
@@ -111,7 +131,7 @@ function DropdownNavItem({ item, pathname }: { item: NavItem; pathname: string }
         )}
         {...(isActive ? { "aria-current": "page" as const } : {})}
       >
-        {item.label}
+        {t(item.labelKey)}
       </NavigationMenuTrigger>
       <NavigationMenuContent className="z-50">
         <ul className="grid w-[240px] gap-1 p-2">
@@ -126,7 +146,7 @@ function DropdownNavItem({ item, pathname }: { item: NavItem; pathname: string }
                     pathname === child.href && "bg-muted font-semibold",
                   )}
                 >
-                  {child.label}
+                  {t(child.labelKey)}
                 </Link>
               </NavigationMenuLink>
             </li>
@@ -135,7 +155,7 @@ function DropdownNavItem({ item, pathname }: { item: NavItem; pathname: string }
             <li key={group.href}>
               <hr className="my-1 border-brand-warm" />
               <span className="block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
-                {group.label}
+                {t(group.labelKey)}
               </span>
               <ul className="pl-2">
                 {group.children?.map((subChild) => (
@@ -149,7 +169,7 @@ function DropdownNavItem({ item, pathname }: { item: NavItem; pathname: string }
                           pathname === subChild.href && "bg-muted font-semibold",
                         )}
                       >
-                        {subChild.label}
+                        {t(subChild.labelKey)}
                       </Link>
                     </NavigationMenuLink>
                   </li>
diff --git a/src/components/layout/footer.tsx b/src/components/layout/footer.tsx
index 6d2784c..773d838 100644
--- a/src/components/layout/footer.tsx
+++ b/src/components/layout/footer.tsx
@@ -5,49 +5,36 @@
  * 4-column grid on desktop, stacked on mobile.
  */
 
-import Link from "next/link";
+import { getTranslations } from "next-intl/server";
 import { Globe, Camera, MessageCircle, Mail } from "lucide-react";
+import { Link } from "@/i18n/navigation";
 import { offices } from "@/lib/constants/offices";
 import { LanguageToggle } from "@/components/layout/language-toggle";
 
 const quickLinks = [
-  { label: "Properties", href: "/search" },
-  { label: "Areas", href: "/areas" },
-  { label: "About", href: "/about" },
-  { label: "Contact", href: "/contact" },
-  { label: "Join Our Team", href: "/careers" },
-];
+  { key: "properties", href: "/search" },
+  { key: "areas", href: "/areas" },
+  { key: "about", href: "/about" },
+  { key: "contact", href: "/contact" },
+  { key: "joinTeam", href: "/careers" },
+] as const;
 
 const socialLinks = [
-  {
-    label: "Visit RE/MAX Altitud on Facebook",
-    href: "https://facebook.com",
-    icon: Globe,
-  },
-  {
-    label: "Visit RE/MAX Altitud on Instagram",
-    href: "https://instagram.com",
-    icon: Camera,
-  },
-  {
-    label: "Contact RE/MAX Altitud via WhatsApp",
-    href: "https://wa.me/50600000000",
-    icon: MessageCircle,
-  },
-  {
-    label: "Email RE/MAX Altitud",
-    href: "mailto:info@remaxaltitud.com",
-    icon: Mail,
-  },
-];
+  { key: "socialFacebook", href: "https://facebook.com", icon: Globe },
+  { key: "socialInstagram", href: "https://instagram.com", icon: Camera },
+  { key: "socialWhatsApp", href: "https://wa.me/50600000000", icon: MessageCircle },
+  { key: "socialEmail", href: "mailto:info@remaxaltitud.com", icon: Mail },
+] as const;
 
 const legalLinks = [
-  { label: "Privacy Policy", href: "/privacy" },
-  { label: "Terms of Service", href: "/terms" },
-  { label: "Sitemap", href: "/sitemap.xml" },
-];
+  { key: "privacy", href: "/privacy" },
+  { key: "terms", href: "/terms" },
+  { key: "sitemap", href: "/sitemap.xml" },
+] as const;
+
+export async function Footer() {
+  const t = await getTranslations("Footer");
 
-export function Footer() {
   return (
     <footer className="bg-brand-dark text-text-on-dark">
       <div className="container py-12 md:py-16">
@@ -55,7 +42,7 @@ export function Footer() {
           {/* Column 1: Quick Links */}
           <div>
             <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
-              Quick Links
+              {t("quickLinks")}
             </h3>
             <ul className="flex flex-col gap-2">
               {quickLinks.map((link) => (
@@ -64,7 +51,7 @@ export function Footer() {
                     href={link.href}
                     className="text-sm text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:text-brand-gold"
                   >
-                    {link.label}
+                    {t(link.key)}
                   </Link>
                 </li>
               ))}
@@ -74,7 +61,7 @@ export function Footer() {
           {/* Column 2: Offices */}
           <div>
             <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
-              Offices
+              {t("offices")}
             </h3>
             <ul className="flex flex-col gap-4">
               {offices.map((office) => (
@@ -91,18 +78,18 @@ export function Footer() {
           {/* Column 3: Social & Contact */}
           <div>
             <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
-              Connect
+              {t("connect")}
             </h3>
             <div className="flex gap-3">
               {socialLinks.map((social) => {
                 const Icon = social.icon;
                 return (
                   <a
-                    key={social.label}
+                    key={social.key}
                     href={social.href}
                     target="_blank"
                     rel="noopener noreferrer"
-                    aria-label={social.label}
+                    aria-label={t(social.key)}
                     className="flex size-11 items-center justify-center rounded-full text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:bg-brand-gold/20 hover:text-brand-gold"
                   >
                     <Icon className="size-5" />
@@ -115,7 +102,7 @@ export function Footer() {
           {/* Column 4: Legal & Language */}
           <div>
             <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-gold">
-              Legal
+              {t("legal")}
             </h3>
             <ul className="flex flex-col gap-2">
               {legalLinks.map((link) => (
@@ -124,7 +111,7 @@ export function Footer() {
                     href={link.href}
                     className="text-sm text-text-on-dark transition-colors duration-[var(--duration-fast)] hover:text-brand-gold"
                   >
-                    {link.label}
+                    {t(link.key)}
                   </Link>
                 </li>
               ))}
@@ -138,7 +125,7 @@ export function Footer() {
         {/* Gold divider + Copyright */}
         <div className="mt-10 border-t border-brand-gold/40 pt-6 text-center">
           <p className="text-xs text-text-muted">
-            © {new Date().getFullYear()} RE/MAX Altitud. All rights reserved.
+            © {new Date().getFullYear()} RE/MAX Altitud. {t("allRightsReserved")}.
           </p>
         </div>
       </div>
diff --git a/src/components/layout/language-toggle.tsx b/src/components/layout/language-toggle.tsx
index 3ceaf34..196d6e5 100644
--- a/src/components/layout/language-toggle.tsx
+++ b/src/components/layout/language-toggle.tsx
@@ -1,18 +1,30 @@
 "use client";
 
 /**
- * LanguageTogglePlaceholder — EN/ES toggle (non-functional).
+ * LanguageToggle — EN/ES switcher wired to next-intl.
  *
- * Story 1.4 will replace internals with next-intl locale switching.
- * Client Component — requires onClick handler.
+ * Click triggers a soft navigation via `router.replace(pathname, { locale })`
+ * — the current route is preserved and the locale prefix is swapped without
+ * a full page reload (FR30, <150ms target).
  */
 
+import { useLocale, useTranslations } from "next-intl";
+import { useSearchParams } from "next/navigation";
+import { usePathname, useRouter } from "@/i18n/navigation";
+import { routing, type Locale } from "@/i18n/routing";
+
 interface LanguageToggleProps {
   /** Visual style variant: header (dark bg nav), dark (footer), light (default) */
   variant?: "light" | "dark" | "header";
 }
 
 export function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
+  const locale = useLocale() as Locale;
+  const router = useRouter();
+  const pathname = usePathname();
+  const searchParams = useSearchParams();
+  const t = useTranslations("LanguageToggle");
+
   const baseClasses =
     variant === "dark"
       ? "text-text-on-dark"
@@ -20,24 +32,41 @@ export function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
         ? "text-white/90"
         : "text-text-primary";
 
+  const switchLocale = (target: Locale) => {
+    if (target !== locale) {
+      const search = searchParams.toString();
+      const queryString = search ? `?${search}` : "";
+      router.replace(`${pathname}${queryString}`, { locale: target });
+    }
+  };
+
   return (
-    <div className={`flex items-center gap-1 text-sm ${baseClasses}`} aria-label="Switch language">
-      <button
-        type="button"
-        className="font-semibold underline"
-        aria-current="true"
-        onClick={() => console.info("Language toggle: Story 1.4")}
-      >
-        EN
-      </button>
-      <span aria-hidden="true">|</span>
-      <button
-        type="button"
-        className="opacity-70 transition-opacity duration-[var(--duration-fast)] hover:opacity-100"
-        onClick={() => console.info("Language toggle: Story 1.4")}
-      >
-        ES
-      </button>
+    <div
+      className={`flex items-center gap-1 text-sm ${baseClasses}`}
+      role="group"
+      aria-label={t("switchLanguage")}
+    >
+      {routing.locales.map((code, index) => {
+        const isActive = code === locale;
+        return (
+          <span key={code} className="flex items-center gap-1">
+            <button
+              type="button"
+              className={
+                isActive
+                  ? "font-semibold underline"
+                  : "opacity-70 transition-opacity duration-[var(--duration-fast)] hover:opacity-100"
+              }
+              {...(isActive ? { "aria-current": "true" as const } : {})}
+              aria-label={`${t("switchLanguage")}: ${code.toUpperCase()}`}
+              onClick={() => switchLocale(code)}
+            >
+              {code.toUpperCase()}
+            </button>
+            {index < routing.locales.length - 1 && <span aria-hidden="true">|</span>}
+          </span>
+        );
+      })}
     </div>
   );
 }
diff --git a/src/components/layout/logo.tsx b/src/components/layout/logo.tsx
index a076f76..d35a448 100644
--- a/src/components/layout/logo.tsx
+++ b/src/components/layout/logo.tsx
@@ -8,7 +8,7 @@
  */
 
 import Image from "next/image";
-import Link from "next/link";
+import { Link } from "@/i18n/navigation";
 
 /**
  * Swappable logo source path (UX-DR32).
diff --git a/src/components/layout/mobile-nav.tsx b/src/components/layout/mobile-nav.tsx
index 54f706d..abf8bca 100644
--- a/src/components/layout/mobile-nav.tsx
+++ b/src/components/layout/mobile-nav.tsx
@@ -12,8 +12,8 @@
  */
 
 import { useEffect, useState } from "react";
-import Link from "next/link";
-import { usePathname } from "next/navigation";
+import { useTranslations } from "next-intl";
+import { Link, usePathname } from "@/i18n/navigation";
 import { Menu } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { mainNavItems, mobileOnlyItems, type NavItem } from "@/lib/navigation";
@@ -24,6 +24,9 @@ import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/com
 export function MobileNav() {
   const [open, setOpen] = useState(false);
   const pathname = usePathname();
+  const t = useTranslations("Navigation");
+  const tMobile = useTranslations("MobileNav");
+  const tFooter = useTranslations("Footer");
 
   // Close sheet on route change (Next.js client-side navigation)
   useEffect(() => {
@@ -40,7 +43,7 @@ export function MobileNav() {
         size="icon"
         className="size-11 text-white hover:bg-white/10 hover:text-white"
         onClick={() => setOpen(true)}
-        aria-label="Open navigation menu"
+        aria-label={tMobile("openMenu")}
       >
         <Menu className="size-6" />
       </Button>
@@ -50,16 +53,16 @@ export function MobileNav() {
           side="right"
           className="w-full max-w-sm overflow-y-auto bg-background"
           showCloseButton={true}
-          aria-label="Navigation menu"
+          aria-label={tMobile("title")}
         >
           <SheetHeader>
-            <SheetTitle className="text-brand-navy">Menu</SheetTitle>
+            <SheetTitle className="text-brand-navy">{tFooter("menu")}</SheetTitle>
           </SheetHeader>
 
-          <nav className="flex flex-1 flex-col px-4" aria-label="Mobile navigation">
+          <nav className="flex flex-1 flex-col px-4" aria-label={tMobile("mobileNav")}>
             <ul className="flex flex-col gap-1">
               {mobileItems.map((item) => (
-                <MobileNavItem key={item.href} item={item} pathname={pathname} />
+                <MobileNavItem key={item.href} item={item} pathname={pathname} t={t} />
               ))}
             </ul>
 
@@ -76,7 +79,7 @@ export function MobileNav() {
               {...(pathname === "/sell" ? { "aria-current": "page" as const } : {})}
             >
               <span aria-hidden="true">🏠</span>
-              Sell Your Property
+              {t("sellYourProperty")}
             </Link>
 
             <hr className="my-3 border-brand-warm" />
@@ -84,7 +87,7 @@ export function MobileNav() {
             {/* Mobile-only items */}
             <ul className="flex flex-col gap-1">
               {mobileOnlyItems.map((item) => (
-                <MobileNavItem key={item.href} item={item} pathname={pathname} />
+                <MobileNavItem key={item.href} item={item} pathname={pathname} t={t} />
               ))}
             </ul>
           </nav>
@@ -109,7 +112,7 @@ function buildMobileItems(items: NavItem[]): NavItem[] {
         if (child.isGroup && child.children) {
           // Add group header + its children inline
           result.push({
-            label: child.label,
+            labelKey: child.labelKey,
             href: child.href,
             icon: "🏘",
           });
@@ -128,7 +131,15 @@ function buildMobileItems(items: NavItem[]): NavItem[] {
   return result;
 }
 
-function MobileNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
+function MobileNavItem({
+  item,
+  pathname,
+  t,
+}: {
+  item: NavItem;
+  pathname: string;
+  t: (key: string) => string;
+}) {
   const isActive = item.activePrefix
     ? pathname.startsWith(item.activePrefix)
     : pathname === item.href;
@@ -149,7 +160,7 @@ function MobileNavItem({ item, pathname }: { item: NavItem; pathname: string })
             {item.icon}
           </span>
         )}
-        {item.label}
+        {t(item.labelKey)}
       </Link>
     </li>
   );
diff --git a/src/components/layout/skip-to-content.tsx b/src/components/layout/skip-to-content.tsx
index edf66d6..31ba5fc 100644
--- a/src/components/layout/skip-to-content.tsx
+++ b/src/components/layout/skip-to-content.tsx
@@ -5,16 +5,19 @@
  * Slides into view on keyboard focus. Must be the first focusable
  * element in the DOM (placed before <Header> in layout.tsx).
  *
- * Server Component — no client JS.
+ * Server Component — uses next-intl server-side translation.
  */
 
-export function SkipToContent() {
+import { getTranslations } from "next-intl/server";
+
+export async function SkipToContent() {
+  const t = await getTranslations("SkipToContent");
   return (
     <a
       href="#main-content"
       className="skip-to-content bg-brand-navy text-text-on-dark px-6 py-3 text-sm font-semibold"
     >
-      Skip to content
+      {t("label")}
     </a>
   );
 }
diff --git a/src/lib/i18n/.gitkeep b/src/lib/i18n/.gitkeep
deleted file mode 100644
index e69de29..0000000
diff --git a/src/lib/navigation.ts b/src/lib/navigation.ts
index 5c454cf..70f5ced 100644
--- a/src/lib/navigation.ts
+++ b/src/lib/navigation.ts
@@ -1,12 +1,12 @@
 /**
  * Navigation data structure — shared between DesktopNav and MobileNav.
- * Labels will become i18n keys in Story 1.4.
+ * Labels resolve through `useTranslations('Navigation')` / `t(labelKey)`.
  */
 
 export interface NavItem {
-  /** Display label (i18n key in Story 1.4) */
-  label: string;
-  /** Route path */
+  /** i18n message key within the "Navigation" namespace */
+  labelKey: string;
+  /** Route path (locale prefix added automatically by `@/i18n/navigation` Link) */
   href: string;
   /** Path prefix to match for active state (e.g., "/areas") */
   activePrefix?: string;
@@ -22,53 +22,53 @@ export interface NavItem {
 
 export const mainNavItems: NavItem[] = [
   {
-    label: "Properties",
+    labelKey: "properties",
     href: "/search",
     activePrefix: "/search",
     icon: "🏠",
     children: [
-      { label: "Mountains (PZ)", href: "/search?region=mountain" },
-      { label: "Coast (Dominical)", href: "/search?region=coast" },
-      { label: "Search All Properties", href: "/search" },
+      { labelKey: "mountainsPZ", href: "/search?region=mountain" },
+      { labelKey: "coastDominical", href: "/search?region=coast" },
+      { labelKey: "searchAll", href: "/search" },
     ],
   },
   {
-    label: "Areas",
+    labelKey: "areas",
     href: "/areas",
     activePrefix: "/areas",
     icon: "📍",
     children: [
-      { label: "Pérez Zeledón", href: "/areas/perez-zeledon" },
-      { label: "Dominical", href: "/areas/dominical" },
-      { label: "Uvita", href: "/areas/uvita" },
-      { label: "All Areas", href: "/areas" },
+      { labelKey: "perezZeledon", href: "/areas/perez-zeledon" },
+      { labelKey: "dominical", href: "/areas/dominical" },
+      { labelKey: "uvita", href: "/areas/uvita" },
+      { labelKey: "allAreas", href: "/areas" },
       // Communities sub-group (rendered after divider in dropdown)
       {
-        label: "Communities",
+        labelKey: "communities",
         href: "/communities",
         isGroup: true,
         children: [
           {
-            label: "RISE",
+            labelKey: "rise",
             href: "/areas/perez-zeledon/communities/rise",
           },
           {
-            label: "Santa Elena Hills",
+            labelKey: "santaElenaHills",
             href: "/areas/perez-zeledon/communities/santa-elena-hills",
           },
-          { label: "All Communities", href: "/communities" },
+          { labelKey: "allCommunities", href: "/communities" },
         ],
       },
     ],
   },
   {
-    label: "Sell Your Property",
+    labelKey: "sellYourProperty",
     href: "/sell",
     isCta: true,
     icon: "🏠",
   },
   {
-    label: "About",
+    labelKey: "about",
     href: "/about",
     icon: "👥",
   },
@@ -77,12 +77,12 @@ export const mainNavItems: NavItem[] = [
 /** Mobile-only items (Our Team, Contact) — not shown in desktop nav */
 export const mobileOnlyItems: NavItem[] = [
   {
-    label: "Our Team",
+    labelKey: "ourTeam",
     href: "/about/team",
     icon: "👥",
   },
   {
-    label: "Contact",
+    labelKey: "contact",
     href: "/contact",
     icon: "📞",
   },
diff --git a/src/messages/.gitkeep b/src/messages/.gitkeep
deleted file mode 100644
index e69de29..0000000
diff --git a/middleware.ts b/middleware.ts
new file mode 100644
index 0000000..a42e172
--- /dev/null
+++ b/middleware.ts
@@ -0,0 +1,31 @@
+import { NextRequest, NextResponse } from "next/server";
+import createMiddleware from "next-intl/middleware";
+import { routing } from "./src/i18n/routing";
+
+const intlMiddleware = createMiddleware(routing);
+
+export default function middleware(request: NextRequest) {
+  // Detect paths of the form /<something>/... where <something> looks like a
+  // locale code (2-5 lowercase chars) but is NOT one we support. Redirect
+  // those to the default locale so visitors with a mistyped or unsupported
+  // locale prefix land on a working page instead of a 404 (AC #6).
+  const firstSegment = request.nextUrl.pathname.split("/")[1] ?? "";
+  const looksLikeLocaleCode = /^[a-z]{2,5}(-[a-z]{2,4})?$/i.test(firstSegment);
+  const isSupportedLocale = (routing.locales as readonly string[]).includes(firstSegment);
+
+  if (looksLikeLocaleCode && !isSupportedLocale) {
+    const url = request.nextUrl.clone();
+    url.pathname = `/${routing.defaultLocale}`;
+    return NextResponse.redirect(url);
+  }
+
+  return intlMiddleware(request);
+}
+
+export const config = {
+  // Match all pathnames except:
+  // - API routes (/api/...)
+  // - Next.js internals (/_next/, /_vercel/)
+  // - Static files (anything containing a dot, e.g. favicon.ico, robots.txt)
+  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
+};
diff --git a/src/app/[locale]/layout.tsx b/src/app/[locale]/layout.tsx
new file mode 100644
index 0000000..ae2ff70
--- /dev/null
+++ b/src/app/[locale]/layout.tsx
@@ -0,0 +1,78 @@
+import type { Metadata, Viewport } from "next";
+import { Montserrat } from "next/font/google";
+import { notFound } from "next/navigation";
+import { NextIntlClientProvider } from "next-intl";
+import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
+import "@/styles/globals.css";
+import { cn } from "@/lib/utils";
+import { routing, type Locale } from "@/i18n/routing";
+import { SkipToContent } from "@/components/layout/skip-to-content";
+import { Header } from "@/components/layout/header";
+import { Footer } from "@/components/layout/footer";
+
+const montserrat = Montserrat({
+  subsets: ["latin", "latin-ext"],
+  weight: ["400", "600", "700", "800"],
+  display: "swap",
+  variable: "--font-montserrat",
+});
+
+export function generateStaticParams() {
+  return routing.locales.map((locale) => ({ locale }));
+}
+
+export async function generateMetadata({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}): Promise<Metadata> {
+  const { locale } = await params;
+  const resolved: Locale = routing.locales.includes(locale as Locale)
+    ? (locale as Locale)
+    : routing.defaultLocale;
+  const t = await getTranslations({ locale: resolved, namespace: "Metadata" });
+  return {
+    title: t("title"),
+    description: t("description"),
+  };
+}
+
+export const viewport: Viewport = {
+  themeColor: "#000E35",
+  width: "device-width",
+  initialScale: 1,
+};
+
+export default async function LocaleLayout({
+  children,
+  params,
+}: {
+  children: React.ReactNode;
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+
+  // Middleware redirects locale-shaped invalid prefixes (/fr, /xx) to the
+  // default locale. If anything else reaches here (e.g. non-locale-shaped
+  // first segment that somehow leaked through), fall through to 404.
+  if (!routing.locales.includes(locale as Locale)) {
+    notFound();
+  }
+
+  setRequestLocale(locale);
+
+  const messages = await getMessages();
+
+  return (
+    <html lang={locale} className={cn("font-sans", montserrat.variable)}>
+      <body>
+        <NextIntlClientProvider locale={locale} messages={messages}>
+          <SkipToContent />
+          <Header />
+          <main id="main-content">{children}</main>
+          <Footer />
+        </NextIntlClientProvider>
+      </body>
+    </html>
+  );
+}
diff --git a/src/app/[locale]/not-found.tsx b/src/app/[locale]/not-found.tsx
new file mode 100644
index 0000000..e4002f7
--- /dev/null
+++ b/src/app/[locale]/not-found.tsx
@@ -0,0 +1,19 @@
+import { useTranslations } from "next-intl";
+import { Link } from "@/i18n/navigation";
+
+export default function LocaleNotFound() {
+  const t = useTranslations("NotFound");
+
+  return (
+    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
+      <h1 className="mb-4 text-3xl font-bold text-brand-navy">{t("title")}</h1>
+      <p className="mb-8 max-w-md text-muted-foreground">{t("description")}</p>
+      <Link
+        href="/"
+        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-brand-navy-light"
+      >
+        {t("backHome")}
+      </Link>
+    </div>
+  );
+}
diff --git a/src/i18n/navigation.ts b/src/i18n/navigation.ts
new file mode 100644
index 0000000..84e08a7
--- /dev/null
+++ b/src/i18n/navigation.ts
@@ -0,0 +1,4 @@
+import { createNavigation } from "next-intl/navigation";
+import { routing } from "./routing";
+
+export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
diff --git a/src/i18n/request.ts b/src/i18n/request.ts
new file mode 100644
index 0000000..5b078f4
--- /dev/null
+++ b/src/i18n/request.ts
@@ -0,0 +1,16 @@
+import { getRequestConfig } from "next-intl/server";
+import { routing } from "./routing";
+import type { Locale } from "./routing";
+
+export default getRequestConfig(async ({ requestLocale }) => {
+  const requested = await requestLocale;
+  const locale: Locale =
+    requested && routing.locales.includes(requested as Locale)
+      ? (requested as Locale)
+      : routing.defaultLocale;
+
+  return {
+    locale,
+    messages: (await import(`../messages/${locale}.json`)).default,
+  };
+});
diff --git a/src/i18n/routing.ts b/src/i18n/routing.ts
new file mode 100644
index 0000000..8d8de52
--- /dev/null
+++ b/src/i18n/routing.ts
@@ -0,0 +1,10 @@
+import { defineRouting } from "next-intl/routing";
+
+export const routing = defineRouting({
+  locales: ["en", "es"],
+  defaultLocale: "en",
+  // All routes use /{locale}/ prefix per AR12
+  localePrefix: "always",
+});
+
+export type Locale = (typeof routing.locales)[number];
diff --git a/src/messages/en.json b/src/messages/en.json
new file mode 100644
index 0000000..70fdae0
--- /dev/null
+++ b/src/messages/en.json
@@ -0,0 +1,76 @@
+{
+  "Navigation": {
+    "properties": "Properties",
+    "mountainsPZ": "Mountains (PZ)",
+    "coastDominical": "Coast (Dominical)",
+    "searchAll": "Search All Properties",
+    "areas": "Areas",
+    "perezZeledon": "Pérez Zeledón",
+    "dominical": "Dominical",
+    "uvita": "Uvita",
+    "allAreas": "All Areas",
+    "communities": "Communities",
+    "rise": "RISE",
+    "santaElenaHills": "Santa Elena Hills",
+    "allCommunities": "All Communities",
+    "sellYourProperty": "Sell Your Property",
+    "about": "About",
+    "ourTeam": "Our Team",
+    "contact": "Contact"
+  },
+  "LanguageToggle": {
+    "switchLanguage": "Switch language",
+    "currentLanguage": "English"
+  },
+  "SkipToContent": {
+    "label": "Skip to content"
+  },
+  "Footer": {
+    "quickLinks": "Quick Links",
+    "offices": "Our Offices",
+    "legal": "Legal",
+    "connect": "Connect",
+    "menu": "Menu",
+    "perezZeledonOffice": "RE/MAX Altitud — Pérez Zeledón",
+    "dominicalOffice": "RE/MAX Altitud Cero — Dominical",
+    "followUs": "Follow Us",
+    "allRightsReserved": "All rights reserved",
+    "sellWithUs": "Sell with Us",
+    "aboutUs": "About Us",
+    "ourAgents": "Our Agents",
+    "contactUs": "Contact Us",
+    "properties": "Properties",
+    "areas": "Areas",
+    "about": "About",
+    "contact": "Contact",
+    "joinTeam": "Join Our Team",
+    "privacy": "Privacy Policy",
+    "terms": "Terms of Service",
+    "sitemap": "Sitemap",
+    "socialFacebook": "Visit RE/MAX Altitud on Facebook",
+    "socialInstagram": "Visit RE/MAX Altitud on Instagram",
+    "socialWhatsApp": "Contact RE/MAX Altitud via WhatsApp",
+    "socialEmail": "Email RE/MAX Altitud"
+  },
+  "HomePage": {
+    "title": "RE/MAX Altitud",
+    "subtitle": "Costa Rica's Southern Zone — Real Estate Platform",
+    "scaffoldingNote": "Foundation scaffolding complete. Content coming in Stories 1.5–1.7."
+  },
+  "Metadata": {
+    "title": "RE/MAX Altitud — Costa Rica Real Estate",
+    "description": "Discover properties in Costa Rica's Southern Zone. Map-first search, multilingual support, and expert agents across Pérez Zeledón and Dominical/Uvita."
+  },
+  "MobileNav": {
+    "openMenu": "Open navigation menu",
+    "closeMenu": "Close navigation menu",
+    "title": "Menu",
+    "mainNav": "Main navigation",
+    "mobileNav": "Mobile navigation"
+  },
+  "NotFound": {
+    "title": "Page not found",
+    "description": "The page you are looking for could not be found.",
+    "backHome": "Back to home"
+  }
+}
diff --git a/src/messages/es.json b/src/messages/es.json
new file mode 100644
index 0000000..d178b54
--- /dev/null
+++ b/src/messages/es.json
@@ -0,0 +1,76 @@
+{
+  "Navigation": {
+    "properties": "Propiedades",
+    "mountainsPZ": "Montañas (PZ)",
+    "coastDominical": "Costa (Dominical)",
+    "searchAll": "Buscar Todas las Propiedades",
+    "areas": "Zonas",
+    "perezZeledon": "Pérez Zeledón",
+    "dominical": "Dominical",
+    "uvita": "Uvita",
+    "allAreas": "Todas las Zonas",
+    "communities": "Comunidades",
+    "rise": "RISE",
+    "santaElenaHills": "Santa Elena Hills",
+    "allCommunities": "Todas las Comunidades",
+    "sellYourProperty": "Vende tu Propiedad",
+    "about": "Nosotros",
+    "ourTeam": "Nuestro Equipo",
+    "contact": "Contacto"
+  },
+  "LanguageToggle": {
+    "switchLanguage": "Cambiar idioma",
+    "currentLanguage": "Español"
+  },
+  "SkipToContent": {
+    "label": "Saltar al contenido"
+  },
+  "Footer": {
+    "quickLinks": "Enlaces Rápidos",
+    "offices": "Nuestras Oficinas",
+    "legal": "Legal",
+    "connect": "Conecta",
+    "menu": "Menú",
+    "perezZeledonOffice": "RE/MAX Altitud — Pérez Zeledón",
+    "dominicalOffice": "RE/MAX Altitud Cero — Dominical",
+    "followUs": "Síguenos",
+    "allRightsReserved": "Todos los derechos reservados",
+    "sellWithUs": "Vende con Nosotros",
+    "aboutUs": "Sobre Nosotros",
+    "ourAgents": "Nuestros Agentes",
+    "contactUs": "Contáctanos",
+    "properties": "Propiedades",
+    "areas": "Zonas",
+    "about": "Nosotros",
+    "contact": "Contacto",
+    "joinTeam": "Únete al Equipo",
+    "privacy": "Política de Privacidad",
+    "terms": "Términos de Servicio",
+    "sitemap": "Mapa del Sitio",
+    "socialFacebook": "Visita RE/MAX Altitud en Facebook",
+    "socialInstagram": "Visita RE/MAX Altitud en Instagram",
+    "socialWhatsApp": "Contacta a RE/MAX Altitud por WhatsApp",
+    "socialEmail": "Envía un correo a RE/MAX Altitud"
+  },
+  "HomePage": {
+    "title": "RE/MAX Altitud",
+    "subtitle": "Zona Sur de Costa Rica — Plataforma de Bienes Raíces",
+    "scaffoldingNote": "Estructura base completa. Contenido próximamente en Historias 1.5–1.7."
+  },
+  "Metadata": {
+    "title": "RE/MAX Altitud — Bienes Raíces Costa Rica",
+    "description": "Descubre propiedades en la Zona Sur de Costa Rica. Búsqueda por mapa, soporte multilingüe y agentes expertos en Pérez Zeledón y Dominical/Uvita."
+  },
+  "MobileNav": {
+    "openMenu": "Abrir menú de navegación",
+    "closeMenu": "Cerrar menú de navegación",
+    "title": "Menú",
+    "mainNav": "Navegación principal",
+    "mobileNav": "Navegación móvil"
+  },
+  "NotFound": {
+    "title": "Página no encontrada",
+    "description": "La página que buscas no pudo ser encontrada.",
+    "backHome": "Volver al inicio"
+  }
+}
```
