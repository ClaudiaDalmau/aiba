import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchAcceptLanguage, translate, type Dictionary, type Locale, type T } from "./config";
import es from "./dictionaries/es";
import { setRequestLocale } from "./request-locale";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en: {} };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Idioma de la petición: cookie elegida por el usuario, si no Accept-Language, si no español. */
export async function getLocale(): Promise<Locale> {
  let locale: Locale = DEFAULT_LOCALE;
  try {
    const c = (await cookies()).get(LOCALE_COOKIE)?.value;
    locale = isLocale(c) ? c : matchAcceptLanguage((await headers()).get("accept-language"));
  } catch {
    locale = DEFAULT_LOCALE;
  }
  setRequestLocale(locale);
  return locale;
}

/** Función de traducción para componentes de servidor y acciones. */
export async function getT(): Promise<T> {
  const dict = getDictionary(await getLocale());
  return (source, vars) => translate(dict, source, vars);
}
