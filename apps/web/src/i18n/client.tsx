"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, translate, type Dictionary, type Locale, type T } from "./config";

const I18nContext = createContext<{ locale: Locale; dict: Dictionary }>({ locale: DEFAULT_LOCALE, dict: {} });

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

/** Función de traducción para componentes de cliente. */
export function useT(): T {
  const { dict } = useContext(I18nContext);
  return useCallback((source, vars) => translate(dict, source, vars), [dict]);
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}
