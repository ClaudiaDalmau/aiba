/**
 * Blog index page — /{locale}/blog
 * -----------------------------------------------
 * Server component: reads posts from filesystem, hands them to the client
 * component `BlogListClient` for interactive search / category / tag filtering.
 */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata, SITE_URL } from "@/lib/seo";
import { listPosts } from "@/lib/blog";
import { routing } from "@/i18n/routing";
import BlogListClient from "@/components/blog/blog-list-client";

export const dynamicParams = false;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog.meta" });
  return buildPageMetadata({ locale, path: "/blog", title: t("title"), description: t("desc") });
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = listPosts(locale);

  // JSON-LD Blog listing schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t("title"),
    description: t("subtitle"),
    url: `${SITE_URL}/${locale}/blog`,
    inLanguage: locale,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${SITE_URL}/${locale}/blog/${p.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          {t("kicker")}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          {t("subtitle")}
        </p>
      </div>

      <BlogListClient
        posts={posts}
        locale={locale}
        labels={{
          readMore: t("read_more"),
          searchPlaceholder: t("search_placeholder"),
          all: t("filter_all"),
          empty: t("empty"),
          noResults: t("no_results"),
          filterByCategory: t("filter_by_category"),
          clearFilters: t("clear_filters"),
          filterByTag: t("filter_by_tag"),
          resultsCountTemplate: t("results_count"),
        }}
      />
    </div>
  );
}
