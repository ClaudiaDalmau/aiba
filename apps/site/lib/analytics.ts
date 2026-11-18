// Analytics event tracker — Vercel Analytics wrapper.
// Only fires if the user has granted "analytics" consent (via cookie banner).
// The AnalyticsGate component in app/layout.tsx already handles gating the
// script itself. This helper is safe to call unconditionally: if @vercel/analytics
// is not yet loaded (SSR, consent denied), it silently no-ops.
"use client";

import { track } from "@vercel/analytics";

export type LandingEvent =
  | "hero_cta_click"
  | "hero_secondary_click"
  | "waitlist_submit_success"
  | "waitlist_submit_already"
  | "waitlist_submit_error"
  | "faq_item_open"
  | "comparison_view"
  | "pricing_cta_click"
  | "testimonials_view"
  | "language_switch";

type EventProps = Record<string, string | number | boolean | null | undefined>;

/**
 * Fire a landing-page event to Vercel Analytics.
 * Silent no-op if analytics not initialised (server-side, before consent).
 */
export function trackEvent(name: LandingEvent, props?: EventProps) {
  if (typeof window === "undefined") return;
  try {
    // Vercel's `track` is synchronous and gracefully handles the case where the
    // Analytics script hasn't been injected (returns undefined without throwing).
    // Filter out null/undefined props so Vercel keeps them lightweight.
    const cleanProps: Record<string, string | number | boolean> = {};
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v !== null && v !== undefined) cleanProps[k] = v;
      }
    }
    track(name, cleanProps);
  } catch {
    // Swallow — analytics must never break the app
  }
}
