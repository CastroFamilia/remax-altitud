import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "RE/MAX Altitud — Costa Rica Real Estate",
  description:
    "Discover properties in Costa Rica's Southern Zone. Map-first search, multilingual support, and expert agents across Pérez Zeledón and Dominical/Uvita.",
};

export const viewport: Viewport = {
  themeColor: "#000E35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", montserrat.variable)}>
      <body>{children}</body>
    </html>
  );
}
