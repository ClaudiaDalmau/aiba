import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "fr", "de", "it", "pt-BR", "ru"],
  defaultLocale: "es",
  // /es/... , /en/..., etc. — todos los idiomas tienen prefijo explícito
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<string, { label: string; countryCode: string; native: string }> = {
  es: { label: "Español", countryCode: "es", native: "Español" },
  en: { label: "English", countryCode: "gb", native: "English" },
  fr: { label: "Français", countryCode: "fr", native: "Français" },
  de: { label: "Deutsch", countryCode: "de", native: "Deutsch" },
  it: { label: "Italiano", countryCode: "it", native: "Italiano" },
  "pt-BR": { label: "Português (BR)", countryCode: "br", native: "Português" },
  ru: { label: "Русский", countryCode: "ru", native: "Русский" },
};
