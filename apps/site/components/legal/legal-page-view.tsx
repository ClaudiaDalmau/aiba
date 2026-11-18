import React from "react";
import Link from "next/link";
import { ManageCookiesLink } from "@/components/cookie-consent/manage-cookies-link";
import type { LegalPage, LocaleLegal, Paragraph } from "@/lib/legal-content";

/**
 * Renderer for the 4 legal pages.
 *
 * Content is stored in `lib/legal-content.ts` as data. This component walks
 * the data and produces the visual layout, so all 4 pages share the same
 * styles automatically.
 *
 * Rich text uses a lightweight markdown-lite syntax:
 *   **bold**                  → <strong>
 *   [text](https://external)  → <a target="_blank" rel="noopener">
 *   [text](/internal)         → <Link>
 *   [text](mailto:x)          → <a href="mailto:x">
 */

// Regex captures: **bold** or [text](url). Kept intentionally simple.
const RICH_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string, keyPrefix = ""): React.ReactNode[] {
  const parts = text.split(RICH_RE);
  return parts
    .filter((p) => p !== "")
    .map((part, i) => {
      const k = `${keyPrefix}${i}`;
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={k}>{part.slice(2, -2)}</strong>;
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        if (href.startsWith("mailto:")) {
          return (
            <a
              key={k}
              href={href}
              className="text-violet-700 dark:text-violet-300 hover:underline"
            >
              {label}
            </a>
          );
        }
        if (href.startsWith("http")) {
          return (
            <a
              key={k}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-700 dark:text-violet-300 hover:underline"
            >
              {label}
            </a>
          );
        }
        // internal absolute path (e.g. /precios)
        return (
          <Link
            key={k}
            href={href}
            className="text-violet-700 dark:text-violet-300 hover:underline"
          >
            {label}
          </Link>
        );
      }
      return <React.Fragment key={k}>{part}</React.Fragment>;
    });
}

function ParagraphNode({ p, index }: { p: Paragraph; index: number }) {
  if (typeof p === "string") {
    return (
      <p className={index > 0 ? "mt-3" : ""}>{renderInline(p, `p${index}-`)}</p>
    );
  }
  return (
    <ul className="list-disc pl-6 mt-3 space-y-2">
      {p.list.map((item, i) => (
        <li key={i}>{renderInline(item, `li${index}-${i}-`)}</li>
      ))}
    </ul>
  );
}

// Cross-links to the other 3 legal pages, using the current locale's labels.
function SeeAlso({
  currentSlug,
  locale,
  page,
  labels,
}: {
  currentSlug: keyof LocaleLegal;
  locale: string;
  page: LegalPage;
  labels: LocaleLegal["labels"];
}) {
  const others: Array<{ slug: keyof LocaleLegal["labels"]; href: string }> = (
    [
      { slug: "avisoLegal", href: `/${locale}/legal/aviso-legal` },
      { slug: "privacidad", href: `/${locale}/legal/privacidad` },
      { slug: "terminos", href: `/${locale}/legal/terminos` },
      { slug: "cookies", href: `/${locale}/legal/cookies` },
    ] as const
  ).filter((x) => x.slug !== currentSlug) as Array<{
    slug: keyof LocaleLegal["labels"];
    href: string;
  }>;

  return (
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      {page.seeAlso.prefix}{" "}
      {others.map((o, i) => (
        <React.Fragment key={o.slug}>
          <Link
            href={o.href}
            className="text-violet-700 dark:text-violet-300 hover:underline"
          >
            {labels[o.slug]}
          </Link>
          {i < others.length - 2 ? ", " : i === others.length - 2 ? ` ${page.seeAlso.and} ` : ""}
        </React.Fragment>
      ))}
      .
    </p>
  );
}

export function LegalPageView({
  page,
  labels,
  slug,
  locale,
}: {
  page: LegalPage;
  labels: LocaleLegal["labels"];
  slug: keyof LocaleLegal;
  locale: string;
}) {
  return (
    <section className="max-w-3xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-24">
      <p className="text-sm text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-widest mb-3">
        {page.legalLabel}
      </p>
      <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-3">
        {page.title}
      </h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {page.updatedLabel}: {page.updated}
      </p>

      {page.authoritativeNote && (
        <div className="mb-10 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 ring-1 ring-neutral-200 dark:ring-neutral-800 text-sm text-neutral-600 dark:text-neutral-400">
          {renderInline(page.authoritativeNote, "auth-")}
        </div>
      )}

      <div className="space-y-10 text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {page.intro && (
          <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-200 dark:ring-violet-900/50 text-sm">
            <p>{renderInline(page.intro, "intro-")}</p>
          </div>
        )}

        {page.sections.map((section, i) => {
          const isCookiesTableSection =
            slug === "cookies" && page.cookiesTable && i === 1; // "2. Cookies que utilizamos"
          return (
            <div key={i}>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                {section.h}
              </h2>
              {section.paras.map((p, j) => (
                <ParagraphNode key={j} p={p} index={j} />
              ))}
              {isCookiesTableSection && page.cookiesTable && (
                <div className="mt-5 rounded-xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 dark:bg-neutral-950">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                            {page.cookiesTable.headers.name}
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                            {page.cookiesTable.headers.type}
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                            {page.cookiesTable.headers.purpose}
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                            {page.cookiesTable.headers.duration}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                        {page.cookiesTable.rows.map((c) => (
                          <tr key={c.name}>
                            <td className="px-4 py-3 font-mono text-xs text-neutral-900 dark:text-neutral-100">
                              {c.name}
                              {c.required && (
                                <span className="ml-2 text-[10px] uppercase font-semibold text-violet-700 dark:text-violet-400">
                                  {page.cookiesTable!.essentialLabel}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{c.type}</td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{c.purpose}</td>
                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{c.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <hr className="border-neutral-200 dark:border-neutral-800 my-10" />

        {page.managePrefs && (
          <div className="mb-8 p-5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-200 dark:ring-violet-900/50">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              {page.managePrefs.title}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {page.managePrefs.body}
            </p>
            <ManageCookiesLink variant="button" />
          </div>
        )}

        <SeeAlso currentSlug={slug} locale={locale} page={page} labels={labels} />
      </div>
    </section>
  );
}
