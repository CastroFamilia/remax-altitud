"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";

/**
 * Root-level error boundary — catches errors in the root layout itself.
 *
 * IMPORTANT:
 * - Must be at src/app/global-error.tsx (NOT inside [locale]/)
 * - Must render its own <html> and <body> tags (root layout is unmounted)
 * - Uses inline <style> — Tailwind CSS may not load when root layout errors
 * - Hardcoded EN-only (no i18n provider available)
 * - Does NOT import project components (they may depend on unavailable providers)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <style>{`
          body {
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f7f5ee;
            color: #202020;
          }
          .global-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            text-align: center;
          }
          .global-error h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #000e35;
            margin: 0 0 0.75rem;
          }
          .global-error p {
            font-size: 1rem;
            color: #666666;
            max-width: 28rem;
            margin: 0 0 2rem;
            line-height: 1.6;
          }
          .global-error button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 2.75rem;
            padding: 0 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #f8f8f8;
            background: #000e35;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .global-error button:hover {
            opacity: 0.85;
          }
          .global-error button:focus-visible {
            outline: 2px solid #0043ff;
            outline-offset: 2px;
          }
          .global-error a.secondary-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 2.75rem;
            padding: 0 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #000e35;
            background: transparent;
            border: 1px solid #efece4;
            border-radius: 0.5rem;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.2s;
          }
          .global-error a.secondary-link:hover {
            background: #efece4;
          }
          .global-error a.secondary-link:focus-visible {
            outline: 2px solid #0043ff;
            outline-offset: 2px;
          }
          .global-error .actions {
            display: flex;
            gap: 0.75rem;
            flex-direction: column;
          }
          @media (min-width: 640px) {
            .global-error .actions {
              flex-direction: row;
            }
          }
          .balloon-svg {
            margin-bottom: 1.5rem;
          }
        `}</style>
        <div className="global-error">
          {/* Inline balloon SVG — no external dependencies */}
          <svg
            className="balloon-svg"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <ellipse cx="32" cy="24" rx="18" ry="22" fill="#cc0000" />
            <path
              d="M24 4C26 2 30 1.5 32 2C34 1.5 38 2 40 4C42 8 43 14 43 22C43 30 40 36 38 38L26 38C24 36 21 30 21 22C21 14 22 8 24 4Z"
              fill="#003da5"
            />
            <path
              d="M28 6C30 4 34 4 36 6C37 10 37.5 16 37 22C36.5 28 35 32 34 34L30 34C29 32 27.5 28 27 22C26.5 16 27 10 28 6Z"
              fill="#ffffff"
              opacity="0.85"
            />
            <line x1="26" y1="38" x2="28" y2="48" stroke="#cc0000" strokeWidth="1.5" />
            <line x1="38" y1="38" x2="36" y2="48" stroke="#cc0000" strokeWidth="1.5" />
            <rect x="27" y="48" width="10" height="6" rx="1.5" fill="#003da5" />
            <rect x="27" y="48" width="10" height="2" rx="0.5" fill="#cc0000" />
          </svg>

          <h1>Something went wrong</h1>
          <p>We&apos;re sorry — an unexpected error occurred. Please try again.</p>
          <div className="actions">
            <button onClick={reset}>Try again</button>
            <Link href="/" className="secondary-link">
              Go to homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
