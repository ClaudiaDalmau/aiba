"use client";

import { setLocale } from "@/actions/locale";
import { LOCALES, LOCALE_NAMES } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/client";

/** Selector de idioma: guarda la elección en una cookie y recarga la página. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  return (
    <form action={setLocale} className={className}>
      <label className="sr-only" htmlFor="aiba-locale">{t("Language")}</label>
      <select
        id="aiba-locale"
        name="locale"
        defaultValue={locale}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-lg border border-border bg-surface px-2 text-[13px] text-muted hover:text-fg"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
        ))}
      </select>
    </form>
  );
}
