/**
 * Cookie consent state shape.
 *
 * Only 3 categories are supported (RGPD-friendly minimum):
 * - necessary  → always true (session cookie, security). Cannot be disabled.
 * - analytics  → Vercel Analytics + Speed Insights.
 * - marketing  → reserved for future ads/retargeting pixels. Currently unused
 *                but persisted so we don't have to re-prompt when we add them.
 *
 * The consent is versioned so we can force re-prompt on material changes.
 */
export const CONSENT_COOKIE_NAME = "aib_consent_v1";
export const CONSENT_STORAGE_KEY = "aib.consent.v1";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 365;

export type ConsentCategories = {
  necessary: true; // always true; kept as literal for type-safety
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = {
  v: number;
  ts: number; // epoch ms of the decision
  categories: ConsentCategories;
};

export const DEFAULT_DENIED: ConsentCategories = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export const ALL_GRANTED: ConsentCategories = {
  necessary: true,
  analytics: true,
  marketing: true,
};
