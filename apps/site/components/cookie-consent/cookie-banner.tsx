"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, Settings2, X, Check } from "lucide-react";
import { useConsent } from "./cookie-consent-provider";
import { useCookieTexts, type CookieTexts } from "./cookie-consent-i18n";
import type { ConsentCategories } from "./types";

/**
 * Cookie consent banner (RGPD).
 * - Non-blocking (no dark overlay). Fixed to the bottom of the viewport.
 * - "Reject all" and "Accept all" have equal visual weight per RGPD.
 * - "Preferences" opens a modal with per-category toggles.
 * - Works on every page (marketing, auth, app) because it uses its own
 *   embedded i18n dictionary — no dependency on next-intl provider context.
 */
export function CookieBanner() {
  const t = useCookieTexts();
  const {
    bannerOpen, prefsOpen, acceptAll, rejectAll, openPrefs, closePrefs, save, record,
  } = useConsent();

  if (!bannerOpen && !prefsOpen) return null;

  return (
    <>
      {bannerOpen && !prefsOpen && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label={t.bannerAria}
          className="fixed inset-x-0 bottom-0 z-[60] p-3 md:p-4 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-lg p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                    {t.bannerTitle}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {t.bannerBody}{" "}
                    <Link
                      href="/legal/cookies"
                      className="text-violet-700 dark:text-violet-300 hover:underline"
                    >
                      {t.readPolicy}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:shrink-0">
                <button
                  onClick={rejectAll}
                  className="px-4 py-2.5 text-sm font-medium rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {t.rejectAll}
                </button>
                <button
                  onClick={openPrefs}
                  className="px-4 py-2.5 text-sm font-medium rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                  {t.preferences}
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2.5 text-sm font-semibold rounded-md bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                >
                  {t.acceptAll}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {prefsOpen && (
        <PreferencesModal
          t={t}
          initial={record?.categories}
          onCancel={closePrefs}
          onSave={save}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
        />
      )}
    </>
  );
}

function PreferencesModal({
  t,
  initial,
  onCancel,
  onSave,
  onAcceptAll,
  onRejectAll,
}: {
  t: CookieTexts;
  initial?: ConsentCategories;
  onCancel: () => void;
  onSave: (partial: Partial<ConsentCategories>) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}) {
  const [analytics, setAnalytics] = React.useState<boolean>(initial?.analytics ?? false);
  const [marketing, setMarketing] = React.useState<boolean>(initial?.marketing ?? false);

  // Prevent body scroll while modal is open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.prefsAria}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-violet-600" />
            {t.prefsTitle}
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={t.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.prefsIntro}
          </p>

          <CategoryRow
            alwaysOnLabel={t.alwaysOn}
            title={t.categories.necessary.title}
            body={t.categories.necessary.body}
            checked={true}
            disabled={true}
            required
            onChange={() => {}}
          />
          <CategoryRow
            alwaysOnLabel={t.alwaysOn}
            title={t.categories.analytics.title}
            body={t.categories.analytics.body}
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            alwaysOnLabel={t.alwaysOn}
            title={t.categories.marketing.title}
            body={t.categories.marketing.body}
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-2 sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onRejectAll}
              className="px-3 py-2 text-sm font-medium rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {t.rejectAll}
            </button>
            <button
              onClick={onAcceptAll}
              className="px-3 py-2 text-sm font-medium rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {t.acceptAll}
            </button>
          </div>
          <button
            onClick={() => onSave({ analytics, marketing })}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            {t.saveChoices}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  alwaysOnLabel,
  title,
  body,
  checked,
  onChange,
  disabled = false,
  required = false,
}: {
  alwaysOnLabel: string;
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5 flex items-center gap-2">
          {title}
          {required && (
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
              {alwaysOnLabel}
            </span>
          )}
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{body}</p>
      </div>
      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-violet-600" : "bg-neutral-300 dark:bg-neutral-700"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
