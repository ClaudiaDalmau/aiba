/** Idiomas de la interfaz de AIBA. Los textos fuente del código están en inglés y sirven de clave. */
export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "aiba_locale";
export const LOCALE_NAMES: Record<Locale, string> = { es: "Español", en: "English" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Elige el idioma a partir de la cabecera Accept-Language. */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of tags) if (isLocale(lang)) return lang;
  return DEFAULT_LOCALE;
}

export type Dictionary = Record<string, string>;
export type Vars = Record<string, string | number>;

/** Traduce `source` (texto en inglés) con el diccionario; sustituye {variables}. */
export function translate(dict: Dictionary, source: string, vars?: Vars): string {
  const text = dict[source] ?? source;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export type T = (source: string, vars?: Vars) => string;

/** Formato regional para fechas, horas y números según el idioma. */
export const INTL_LOCALE: Record<Locale, string> = { es: "es-ES", en: "en-GB" };
