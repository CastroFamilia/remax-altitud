/**
 * Root layout — minimal passthrough.
 *
 * The <html>/<body>, fonts, providers, and global shell live in
 * src/app/[locale]/layout.tsx so that `<html lang>` reflects the
 * active locale (UX-DR26). There must be only one <html> tag in
 * the tree — do not render one here.
 */

import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
