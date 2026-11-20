"use client";

/**
 * Inline i18n dictionary for the cookie consent components.
 *
 * We deliberately do NOT depend on next-intl here because the cookie banner
 * needs to render on pages OUTSIDE the /[locale]/... segment (login, register,
 * dashboard, admin). Those routes don't have a NextIntlClientProvider.
 *
 * Locale is detected from:
 *   1. `NEXT_LOCALE` cookie (set by next-intl middleware)
 *   2. First path segment (/es/... , /en/... etc.)
 *   3. `navigator.language`
 *   4. Fallback: "es"
 */

import { useEffect, useState } from "react";

export type CookieTexts = {
  bannerAria: string;
  bannerTitle: string;
  bannerBody: string;
  readPolicy: string;
  acceptAll: string;
  rejectAll: string;
  preferences: string;
  manage: string;
  alwaysOn: string;
  close: string;
  saveChoices: string;
  prefsAria: string;
  prefsTitle: string;
  prefsIntro: string;
  categories: {
    necessary: { title: string; body: string };
    analytics: { title: string; body: string };
    marketing: { title: string; body: string };
  };
};

const DICT: Record<string, CookieTexts> = {
  es: {
    bannerAria: "Consentimiento de cookies",
    bannerTitle: "Usamos cookies",
    bannerBody:
      "Usamos cookies necesarias para que el sitio funcione y, si aceptas, cookies analíticas para mejorarlo.",
    readPolicy: "Leer política",
    acceptAll: "Aceptar todo",
    rejectAll: "Rechazar todo",
    preferences: "Preferencias",
    manage: "Gestionar cookies",
    alwaysOn: "Siempre activas",
    close: "Cerrar",
    saveChoices: "Guardar mis preferencias",
    prefsAria: "Preferencias de cookies",
    prefsTitle: "Preferencias de cookies",
    prefsIntro:
      "Elige qué tipos de cookies aceptas. Puedes cambiarlo en cualquier momento desde el pie de página.",
    categories: {
      necessary: {
        title: "Necesarias",
        body: "Imprescindibles para el funcionamiento del sitio (sesión, seguridad). No se pueden desactivar.",
      },
      analytics: {
        title: "Analíticas",
        body: "Nos ayudan a entender cómo se usa el sitio para mejorarlo (Vercel Analytics, Speed Insights). Datos agregados y anónimos.",
      },
      marketing: {
        title: "Marketing",
        body: "Actualmente no usamos cookies de marketing. Reservado para el futuro (retargeting, campañas).",
      },
    },
  },
  en: {
    bannerAria: "Cookie consent",
    bannerTitle: "We use cookies",
    bannerBody:
      "We use necessary cookies to make the site work and, if you accept, analytics cookies to improve it.",
    readPolicy: "Read policy",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    preferences: "Preferences",
    manage: "Manage cookies",
    alwaysOn: "Always on",
    close: "Close",
    saveChoices: "Save my preferences",
    prefsAria: "Cookie preferences",
    prefsTitle: "Cookie preferences",
    prefsIntro:
      "Choose which cookies you accept. You can change this at any time from the footer.",
    categories: {
      necessary: {
        title: "Necessary",
        body: "Essential for the site to work (session, security). Cannot be disabled.",
      },
      analytics: {
        title: "Analytics",
        body: "Help us understand how the site is used so we can improve it (Vercel Analytics, Speed Insights). Aggregated, anonymous data.",
      },
      marketing: {
        title: "Marketing",
        body: "We currently do not use marketing cookies. Reserved for future use (retargeting, campaigns).",
      },
    },
  },
  fr: {
    bannerAria: "Consentement aux cookies",
    bannerTitle: "Nous utilisons des cookies",
    bannerBody:
      "Nous utilisons des cookies nécessaires au fonctionnement du site et, si vous acceptez, des cookies analytiques pour l’améliorer.",
    readPolicy: "Lire la politique",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    preferences: "Préférences",
    manage: "Gérer les cookies",
    alwaysOn: "Toujours actifs",
    close: "Fermer",
    saveChoices: "Enregistrer mes préférences",
    prefsAria: "Préférences des cookies",
    prefsTitle: "Préférences des cookies",
    prefsIntro:
      "Choisissez les cookies que vous acceptez. Vous pouvez modifier ce choix à tout moment depuis le pied de page.",
    categories: {
      necessary: {
        title: "Nécessaires",
        body: "Essentiels au fonctionnement du site (session, sécurité). Non désactivables.",
      },
      analytics: {
        title: "Analytiques",
        body: "Nous aident à comprendre l’usage du site pour l’améliorer (Vercel Analytics, Speed Insights). Données agrégées et anonymes.",
      },
      marketing: {
        title: "Marketing",
        body: "Nous n’utilisons actuellement pas de cookies marketing. Réservé pour un usage futur (retargeting, campagnes).",
      },
    },
  },
  de: {
    bannerAria: "Cookie-Zustimmung",
    bannerTitle: "Wir verwenden Cookies",
    bannerBody:
      "Wir verwenden notwendige Cookies für den Betrieb der Website und, mit deiner Zustimmung, analytische Cookies zur Verbesserung.",
    readPolicy: "Richtlinie lesen",
    acceptAll: "Alle akzeptieren",
    rejectAll: "Alle ablehnen",
    preferences: "Einstellungen",
    manage: "Cookies verwalten",
    alwaysOn: "Immer aktiv",
    close: "Schließen",
    saveChoices: "Auswahl speichern",
    prefsAria: "Cookie-Einstellungen",
    prefsTitle: "Cookie-Einstellungen",
    prefsIntro:
      "Wähle aus, welche Cookies du akzeptierst. Du kannst dies jederzeit im Footer ändern.",
    categories: {
      necessary: {
        title: "Notwendig",
        body: "Essenziell für den Betrieb der Seite (Sitzung, Sicherheit). Können nicht deaktiviert werden.",
      },
      analytics: {
        title: "Analyse",
        body: "Helfen uns zu verstehen, wie die Seite genutzt wird (Vercel Analytics, Speed Insights). Aggregierte, anonyme Daten.",
      },
      marketing: {
        title: "Marketing",
        body: "Wir verwenden derzeit keine Marketing-Cookies. Für zukünftige Nutzung reserviert.",
      },
    },
  },
  it: {
    bannerAria: "Consenso ai cookie",
    bannerTitle: "Utilizziamo i cookie",
    bannerBody:
      "Utilizziamo cookie necessari per il funzionamento del sito e, se accetti, cookie analitici per migliorarlo.",
    readPolicy: "Leggi l’informativa",
    acceptAll: "Accetta tutto",
    rejectAll: "Rifiuta tutto",
    preferences: "Preferenze",
    manage: "Gestisci cookie",
    alwaysOn: "Sempre attivi",
    close: "Chiudi",
    saveChoices: "Salva le mie preferenze",
    prefsAria: "Preferenze cookie",
    prefsTitle: "Preferenze cookie",
    prefsIntro:
      "Scegli quali cookie accettare. Puoi modificarlo in qualsiasi momento dal footer.",
    categories: {
      necessary: {
        title: "Necessari",
        body: "Essenziali per il funzionamento del sito (sessione, sicurezza). Non disattivabili.",
      },
      analytics: {
        title: "Analitici",
        body: "Ci aiutano a capire come viene usato il sito (Vercel Analytics, Speed Insights). Dati aggregati e anonimi.",
      },
      marketing: {
        title: "Marketing",
        body: "Attualmente non usiamo cookie di marketing. Riservato per uso futuro.",
      },
    },
  },
  "pt-BR": {
    bannerAria: "Consentimento de cookies",
    bannerTitle: "Usamos cookies",
    bannerBody:
      "Usamos cookies necessários para o funcionamento do site e, se você aceitar, cookies analíticos para melhorá-lo.",
    readPolicy: "Ler política",
    acceptAll: "Aceitar tudo",
    rejectAll: "Rejeitar tudo",
    preferences: "Preferências",
    manage: "Gerenciar cookies",
    alwaysOn: "Sempre ativos",
    close: "Fechar",
    saveChoices: "Salvar minhas preferências",
    prefsAria: "Preferências de cookies",
    prefsTitle: "Preferências de cookies",
    prefsIntro:
      "Escolha quais cookies você aceita. Você pode alterar isso a qualquer momento no rodapé.",
    categories: {
      necessary: {
        title: "Necessários",
        body: "Essenciais para o funcionamento do site (sessão, segurança). Não podem ser desativados.",
      },
      analytics: {
        title: "Analíticos",
        body: "Nos ajudam a entender como o site é usado (Vercel Analytics, Speed Insights). Dados agregados e anônimos.",
      },
      marketing: {
        title: "Marketing",
        body: "Atualmente não usamos cookies de marketing. Reservado para uso futuro.",
      },
    },
  },
  ru: {
    bannerAria: "Согласие на cookies",
    bannerTitle: "Мы используем cookies",
    bannerBody:
      "Мы используем необходимые cookies для работы сайта и, если вы согласитесь, аналитические cookies для его улучшения.",
    readPolicy: "Читать политику",
    acceptAll: "Принять все",
    rejectAll: "Отклонить все",
    preferences: "Настройки",
    manage: "Управление cookies",
    alwaysOn: "Всегда активны",
    close: "Закрыть",
    saveChoices: "Сохранить настройки",
    prefsAria: "Настройки cookies",
    prefsTitle: "Настройки cookies",
    prefsIntro:
      "Выберите, какие cookies вы принимаете. Вы можете изменить это в любое время из футера.",
    categories: {
      necessary: {
        title: "Необходимые",
        body: "Обязательны для работы сайта (сессия, безопасность). Отключить нельзя.",
      },
      analytics: {
        title: "Аналитические",
        body: "Помогают нам понять, как используется сайт, чтобы улучшить его (Vercel Analytics, Speed Insights). Агрегированные, анонимные данные.",
      },
      marketing: {
        title: "Маркетинг",
        body: "Сейчас мы не используем маркетинговые cookies. Зарезервировано для будущего использования.",
      },
    },
  },
  nl: {
    bannerAria: "Cookietoestemming",
    bannerTitle: "We gebruiken cookies",
    bannerBody:
      "We gebruiken noodzakelijke cookies om de site te laten werken en, als je akkoord gaat, analytische cookies om hem te verbeteren.",
    readPolicy: "Beleid lezen",
    acceptAll: "Alles accepteren",
    rejectAll: "Alles weigeren",
    preferences: "Voorkeuren",
    manage: "Cookies beheren",
    alwaysOn: "Altijd actief",
    close: "Sluiten",
    saveChoices: "Mijn voorkeuren opslaan",
    prefsAria: "Cookievoorkeuren",
    prefsTitle: "Cookievoorkeuren",
    prefsIntro:
      "Kies welke soorten cookies je accepteert. Je kunt dit altijd wijzigen via de voettekst.",
    categories: {
      necessary: {
        title: "Noodzakelijk",
        body: "Onmisbaar voor de werking van de site (sessie, beveiliging). Kunnen niet worden uitgeschakeld.",
      },
      analytics: {
        title: "Analytisch",
        body: "Helpen ons te begrijpen hoe de site wordt gebruikt om hem te verbeteren (Vercel Analytics, Speed Insights). Geaggregeerde, anonieme gegevens.",
      },
      marketing: {
        title: "Marketing",
        body: "We gebruiken momenteel geen marketingcookies. Gereserveerd voor de toekomst (retargeting, campagnes).",
      },
    },
  },
  ro: {
    bannerAria: "Consimțământ cookie-uri",
    bannerTitle: "Folosim cookie-uri",
    bannerBody:
      "Folosim cookie-uri necesare pentru funcționarea site-ului și, dacă accepți, cookie-uri analitice pentru a-l îmbunătăți.",
    readPolicy: "Citește politica",
    acceptAll: "Acceptă tot",
    rejectAll: "Respinge tot",
    preferences: "Preferințe",
    manage: "Gestionează cookie-urile",
    alwaysOn: "Mereu active",
    close: "Închide",
    saveChoices: "Salvează preferințele",
    prefsAria: "Preferințe cookie-uri",
    prefsTitle: "Preferințe cookie-uri",
    prefsIntro:
      "Alege ce tipuri de cookie-uri accepți. Poți schimba oricând din subsolul paginii.",
    categories: {
      necessary: {
        title: "Necesare",
        body: "Indispensabile pentru funcționarea site-ului (sesiune, securitate). Nu pot fi dezactivate.",
      },
      analytics: {
        title: "Analitice",
        body: "Ne ajută să înțelegem cum este folosit site-ul pentru a-l îmbunătăți (Vercel Analytics, Speed Insights). Date agregate și anonime.",
      },
      marketing: {
        title: "Marketing",
        body: "Momentan nu folosim cookie-uri de marketing. Rezervat pentru viitor (retargeting, campanii).",
      },
    },
  },
  pl: {
    bannerAria: "Zgoda na cookies",
    bannerTitle: "Używamy plików cookie",
    bannerBody:
      "Używamy niezbędnych plików cookie, aby strona działała, a jeśli się zgodzisz, analitycznych, aby ją ulepszać.",
    readPolicy: "Przeczytaj politykę",
    acceptAll: "Akceptuj wszystkie",
    rejectAll: "Odrzuć wszystkie",
    preferences: "Preferencje",
    manage: "Zarządzaj cookies",
    alwaysOn: "Zawsze aktywne",
    close: "Zamknij",
    saveChoices: "Zapisz moje preferencje",
    prefsAria: "Preferencje cookies",
    prefsTitle: "Preferencje cookies",
    prefsIntro:
      "Wybierz, jakie rodzaje plików cookie akceptujesz. Możesz to zmienić w każdej chwili w stopce.",
    categories: {
      necessary: {
        title: "Niezbędne",
        body: "Konieczne do działania strony (sesja, bezpieczeństwo). Nie można ich wyłączyć.",
      },
      analytics: {
        title: "Analityczne",
        body: "Pomagają zrozumieć, jak korzystasz ze strony, aby ją ulepszać (Vercel Analytics, Speed Insights). Dane zagregowane i anonimowe.",
      },
      marketing: {
        title: "Marketingowe",
        body: "Obecnie nie używamy marketingowych plików cookie. Zarezerwowane na przyszłość (retargeting, kampanie).",
      },
    },
  },
};

const SUPPORTED = Object.keys(DICT);

function readCookieClient(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function detectLocale(): string {
  if (typeof window === "undefined") return "es";

  // 1) next-intl sets NEXT_LOCALE cookie after middleware
  const c = readCookieClient("NEXT_LOCALE");
  if (c && SUPPORTED.includes(c)) return c;

  // 2) First path segment (e.g. /es/tipos-de-negocio)
  const seg = window.location.pathname.split("/").filter(Boolean)[0];
  if (seg && SUPPORTED.includes(seg)) return seg;
  // Handle case sensitivity for pt-BR
  if (seg) {
    const found = SUPPORTED.find((l) => l.toLowerCase() === seg.toLowerCase());
    if (found) return found;
  }

  // 3) navigator.language
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("pt")) return "pt-BR";
  if (nav.startsWith("ru") || nav.startsWith("uk") || nav.startsWith("be")) return "ru";
  const base = nav.split("-")[0];
  if (SUPPORTED.includes(base)) return base;

  return "es";
}

/**
 * React hook: returns the cookie-consent i18n dictionary matching the current
 * locale. Updates after mount (once we can read cookies / URL / navigator).
 */
export function useCookieTexts(): CookieTexts {
  const [locale, setLocale] = useState<string>("es");
  useEffect(() => {
    setLocale(detectLocale());
  }, []);
  return DICT[locale] || DICT.es;
}
