import { cache } from "react";
import { DEFAULT_LOCALE, INTL_LOCALE, type Locale } from "./config";

/**
 * Idioma de la petición en curso, accesible de forma síncrona (p. ej. al formatear fechas).
 * Lo fija getLocale() en cada petición; fuera de React vale el idioma por defecto.
 */
const store = cache(() => ({ locale: DEFAULT_LOCALE as Locale }));

export function setRequestLocale(locale: Locale) {
  store().locale = locale;
}

export function requestLocale(): Locale {
  return store().locale;
}

export function requestIntlLocale(): string {
  return INTL_LOCALE[store().locale];
}
