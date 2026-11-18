/** Every ISO 4217 currency and IANA time zone the runtime knows, with readable labels. */

const FALLBACK_CURRENCIES = ["EUR", "USD", "GBP", "ILS", "CHF", "CAD", "AUD", "AED", "SGD", "BRL", "MXN", "ARS", "COP", "CLP", "PEN", "JPY", "CNY", "INR", "RUB", "TRY", "PLN", "SEK", "NOK", "DKK", "CZK", "HUF", "RON", "ZAR", "THB", "HKD", "NZD", "KRW"];

export function currencies(locale = "en"): { code: string; label: string }[] {
  let codes: string[] = FALLBACK_CURRENCIES;
  try {
    codes = (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("currency");
  } catch {
    /* older runtime */
  }
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale], { type: "currency" });
  } catch {
    names = null;
  }
  return codes
    .map((code) => ({ code, label: `${code} · ${names?.of(code) ?? code}` }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function timezones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Europe/Madrid", "Europe/London", "Europe/Paris", "Asia/Jerusalem", "America/New_York", "America/Los_Angeles"];
  }
}

/** Best-effort default currency for a time zone (pre-selects the onboarding form). */
export function guessCurrency(tz: string): string {
  const map: Record<string, string> = {
    "Asia/Jerusalem": "ILS", "Asia/Tel_Aviv": "ILS", "Europe/London": "GBP", "Europe/Zurich": "CHF", "Asia/Dubai": "AED",
    "Asia/Singapore": "SGD", "Australia/Sydney": "AUD", "America/Toronto": "CAD", "America/Sao_Paulo": "BRL", "America/Mexico_City": "MXN",
    "Asia/Tokyo": "JPY", "Europe/Moscow": "RUB", "Europe/Istanbul": "TRY", "Europe/Warsaw": "PLN",
  };
  if (map[tz]) return map[tz];
  if (tz.startsWith("America/")) return "USD";
  return "EUR";
}
