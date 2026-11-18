"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: "#666", marginBottom: 20 }}>
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: "10px 20px", background: "#7c3aed", color: "#fff",
            border: 0, borderRadius: 8, fontWeight: 700, cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
