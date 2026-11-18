// Sentry server-side init (Node runtime). Auto no-ops when DSN is unset.
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.SENTRY_ENVIRONMENT || "production",
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    sendDefaultPii: false,
  });
}
