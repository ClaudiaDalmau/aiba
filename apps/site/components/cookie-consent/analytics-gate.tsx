"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useConsentGranted } from "./cookie-consent-provider";

/**
 * Renders Vercel Analytics + Speed Insights ONLY if the user has granted
 * "analytics" consent. RGPD-compliant: no tracking scripts are loaded until
 * the user accepts.
 */
export function AnalyticsGate() {
  const granted = useConsentGranted("analytics");
  if (!granted) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
