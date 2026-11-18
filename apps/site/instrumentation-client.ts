// Sentry client-side init (App Router / Next 16).
// Auto no-ops when NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
