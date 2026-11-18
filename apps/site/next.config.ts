import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old marketing rename (pre-i18n)
      {
        source: "/casos-de-uso",
        destination: "/es/tipos-de-negocio",
        permanent: true,
      },
      {
        source: "/es/casos-de-uso",
        destination: "/es/tipos-de-negocio",
        permanent: true,
      },
    ];
  },
  // SEC-004 (Iter64): security headers for the whole dashboard/admin site.
  // Kept intentionally strict on frame-ancestors (no embedding in iframes)
  // to protect moderation/refund/ban actions from clickjacking. HSTS keeps
  // browsers on HTTPS. CSP is deliberately relaxed for scripts because we
  // need Sentry + Next.js hydration — tighten with nonces once we can.
  async headers() {
    const security = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      // Minimal CSP — protects most vectors without breaking Next.js/Sentry.
      { key: "Content-Security-Policy", value:
        "default-src 'self'; " +
        "img-src 'self' data: blob: https:; " +
        "media-src 'self' https: blob:; " +
        "font-src 'self' data: https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
        "connect-src 'self' https: wss:; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'",
      },
    ];
    return [{ source: "/:path*", headers: security }];
  },
};

const nextWithIntl = withNextIntl(nextConfig);

// Wrap with Sentry only when the auth token is available at build time.
// This lets `next build` succeed in local dev / preview without a token,
// while still uploading source maps on production deploys.
const shouldUseSentryBuild = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT,
);

export default shouldUseSentryBuild
  ? withSentryConfig(nextWithIntl, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Optionally disable telemetry to Sentry about the wizard.
      telemetry: false,
    })
  : nextWithIntl;
