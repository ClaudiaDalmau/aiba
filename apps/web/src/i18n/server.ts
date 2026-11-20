import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchAcceptLanguage, translate, type Dictionary, type Locale, type T } from "./config";
import de from "./dictionaries/de";
import es from "./dictionaries/es";
import fr from "./dictionaries/fr";
import it from "./dictionaries/it";
import ptBR from "./dictionaries/pt-BR";
import ru from "./dictionaries/ru";
import nl from "./dictionaries/nl";
import ro from "./dictionaries/ro";
import pl from "./dictionaries/pl";
import { requestLocale, setRequestLocale } from "./request-locale";

const DICTIONARIES: Record<Locale, Dictionary> = { en: {}, es, fr, de, it, "pt-BR": ptBR, ru, nl, ro, pl };

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

/**
 * Traductor síncrono para subcomponentes de servidor: usa el idioma que fijó
 * getLocale()/getT() antes en la misma petición (la página lo llama primero).
 */
export function tSync(): T {
  const dict = getDictionary(requestLocale());
  return (source, vars) => translate(dict, source, vars);
}
