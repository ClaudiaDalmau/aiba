import "server-only";
import type { IconName } from "@/components/icons";
import type { Locale } from "@/i18n/config";
import ARTICLES from "./articles.json";

/** In-app help: short guides per screen, written in all interface languages (articles.json). */
export type HelpArticle = { id: string; href: string; paths: string[]; icon: IconName; title: string; keywords: string; steps: string[] };

type Raw = { id: string; href: string; paths: string[]; icon: string; title: Record<string, string>; keywords: Record<string, string>; steps: Record<string, string[]> };

export function helpArticles(locale: Locale): HelpArticle[] {
  return (ARTICLES as Raw[]).map((a) => ({
    id: a.id,
    href: a.href,
    paths: a.paths,
    icon: a.icon as IconName,
    title: a.title[locale] ?? a.title.en,
    // English keywords are always searchable too, so "booking" finds the guide in any language.
    keywords: [a.keywords[locale], a.keywords.en].filter(Boolean).join(" "),
    steps: a.steps[locale] ?? a.steps.en,
  }));
}
