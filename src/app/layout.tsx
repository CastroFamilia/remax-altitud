import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "RE/MAX Altitud — Costa Rica Real Estate",
  description:
    "Discover properties in Costa Rica's Southern Zone. Map-first search, multilingual support, and expert agents across Pérez Zeledón and Dominical/Uvita.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
