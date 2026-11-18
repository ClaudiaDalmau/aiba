"use client";

import * as React from "react";
import {
  ConsentRecord,
  ConsentCategories,
  CONSENT_COOKIE_NAME,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  CONSENT_MAX_AGE_DAYS,
  DEFAULT_DENIED,
  ALL_GRANTED,
} from "./types";

// -------------------- Cookie helpers --------------------
function writeCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") return;
  const maxAge = Math.floor(maxAgeDays * 24 * 60 * 60);
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

// -------------------- Persistence --------------------
function persist(record: ConsentRecord) {
  try {
    const raw = JSON.stringify(record);
    if (typeof window !== "undefined") localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    writeCookie(CONSENT_COOKIE_NAME, raw, CONSENT_MAX_AGE_DAYS);
  } catch {}
}

function load(): ConsentRecord | null {
  try {
    if (typeof window === "undefined") return null;
    // Prefer localStorage (source of truth on client), fallback to cookie
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY) || readCookie(CONSENT_COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (!parsed || parsed.v !== CONSENT_VERSION) return null;
    // Basic shape guard
    if (!parsed.categories || typeof parsed.categories !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

// -------------------- Context --------------------
type ConsentContextValue = {
  /** null while we haven't determined consent yet (initial SSR/hydration) */
  record: ConsentRecord | null;
  /** true when the user has recorded a decision */
  hasDecided: boolean;
  /** the banner UI listens to this to know when to show */
  bannerOpen: boolean;
  /** the preferences modal listens to this */
  prefsOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (partial: Partial<ConsentCategories>) => void;
  openPrefs: () => void;
  closePrefs: () => void;
  /** re-open the banner (used from "Manage cookies" link in footer / cookies page) */
  reopen: () => void;
};

const ConsentContext = React.createContext<ConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = React.useState<ConsentRecord | null>(null);
  const [bannerOpen, setBannerOpen] = React.useState(false);
  const [prefsOpen, setPrefsOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Load on mount
  React.useEffect(() => {
    const existing = load();
    setHydrated(true);
    if (existing) {
      setRecord(existing);
      return;
    }
    // Delay a bit so the banner doesn't flash on cold load
    const t = window.setTimeout(() => setBannerOpen(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const commit = React.useCallback((categories: ConsentCategories) => {
    const rec: ConsentRecord = {
      v: CONSENT_VERSION,
      ts: Date.now(),
      categories: { ...categories, necessary: true },
    };
    persist(rec);
    setRecord(rec);
    setBannerOpen(false);
    setPrefsOpen(false);
  }, []);

  const acceptAll = React.useCallback(() => commit(ALL_GRANTED), [commit]);
  const rejectAll = React.useCallback(() => commit(DEFAULT_DENIED), [commit]);
  const save = React.useCallback(
    (partial: Partial<ConsentCategories>) => {
      const base = record?.categories ?? DEFAULT_DENIED;
      commit({ ...base, ...partial, necessary: true });
    },
    [record, commit]
  );

  const openPrefs = React.useCallback(() => setPrefsOpen(true), []);
  const closePrefs = React.useCallback(() => setPrefsOpen(false), []);
  const reopen = React.useCallback(() => {
    setBannerOpen(true);
    setPrefsOpen(true);
  }, []);

  const value: ConsentContextValue = {
    record,
    hasDecided: !!record,
    bannerOpen: hydrated ? bannerOpen : false,
    prefsOpen,
    acceptAll,
    rejectAll,
    save,
    openPrefs,
    closePrefs,
    reopen,
  };

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = React.useContext(ConsentContext);
  if (!ctx) {
    // Return a safe no-op fallback so components that render outside the
    // provider (e.g. during isolated tests) don't crash.
    return {
      record: null,
      hasDecided: false,
      bannerOpen: false,
      prefsOpen: false,
      acceptAll: () => {},
      rejectAll: () => {},
      save: () => {},
      openPrefs: () => {},
      closePrefs: () => {},
      reopen: () => {},
    };
  }
  return ctx;
}

/** Convenience: returns whether a specific category is granted. */
export function useConsentGranted(category: keyof ConsentCategories): boolean {
  const { record } = useConsent();
  if (!record) return category === "necessary";
  return !!record.categories[category];
}
