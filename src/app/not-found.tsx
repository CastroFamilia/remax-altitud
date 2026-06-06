"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#f7f5ee",
            color: "#000e35",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>404 - Page Not Found</h1>
          <p style={{ marginBottom: "2rem" }}>The page you are looking for does not exist.</p>
          <Link
            href="/"
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#000e35",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: "bold",
            }}
          >
            Return Home
          </Link>
        </div>
      </body>
    </html>
  );
}
