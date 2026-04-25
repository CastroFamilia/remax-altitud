import { notFound } from "next/navigation";

/**
 * Catch-all route — triggers the locale-level not-found.tsx for any
 * unmatched paths under /[locale]/*. Without this, Next.js falls through
 * to the root-level 404 which lacks the locale layout shell.
 */
export default function CatchAllPage() {
  notFound();
}
