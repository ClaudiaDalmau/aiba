/**
 * Blog post detail — /{locale}/blog/{slug}
 * ----------------------------------------------
 * Renders MDX content server-side with JSON-LD Article schema and
 * hreflang alternates for every locale that has a translation.
 */
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { SITE_URL, breadcrumbsJsonLd, toJsonLdScript } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import {
  getPost,
  getRelatedPosts,
  listCanonicalSlugs,
  localesWithPost,
} from "@/lib/blog";
import { mdxComponents } from "@/components/blog/mdx-components";

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  const canonicalSlugs = listCanonicalSlugs();
  // Emit one route per (locale, slug) so every locale has a rendered version.
  // If a translated file doesn't exist, `getPost` falls back to Spanish.
  for (const locale of routing.locales) {
    for (const slug of canonicalSlugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);
  if (!post) return { title: "Blog · AIBA" };

  // Only expose hreflang alternates for locales that actually have the post
  // (or the canonical Spanish one).
  const availableLocales = localesWithPost(slug);
  const languages: Record<string, string> = {};
  for (const l of availableLocales) {
    languages[l] = `${SITE_URL}/${l}/blog/${slug}`;
  }
  if (availableLocales.includes("es")) {
    languages["x-default"] = `${SITE_URL}/es/blog/${slug}`;
  }

  const ogImage = post.cover
    ? (post.cover.startsWith("http") ? post.cover : `${SITE_URL}${post.cover}`)
    : `${SITE_URL}/og-default.png`;

  return {
    title: `${post.title} · AIBA`,
    description: post.description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog/${slug}`,
      languages,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author || "AIBA"],
      images: [ogImage],
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const related = getRelatedPosts(locale, slug);

  const dateFmt = new Date(post.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // JSON-LD Article schema for Google rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: locale,
    author: post.author
      ? {
          // A real byline — schema.org/Person qualifies for Google News
          // & Discover author cards (photo + link back to author page).
          "@type": "Person",
          name: post.author,
          url: `${SITE_URL}/${locale}/blog?author=${encodeURIComponent(post.author)}`,
        }
      : {
          "@type": "Organization",
          name: "AIBA",
          url: SITE_URL,
        },
    publisher: {
      "@type": "Organization",
      name: "AIBA",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    image: post.cover
      ? [post.cover.startsWith("http") ? post.cover : `${SITE_URL}${post.cover}`]
      : [`${SITE_URL}/og-default.png`],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${locale}/blog/${slug}`,
    },
    articleSection: post.category,
    keywords: post.tags?.join(", "),
  };

  // BreadcrumbList schema (Google shows path under the title)
  const breadcrumbs = breadcrumbsJsonLd([
    { name: t("crumb_home"), url: `/${locale}` },
    { name: "Blog", url: `/${locale}/blog` },
    { name: post.title, url: `/${locale}/blog/${slug}` },
  ]);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-neutral-500 dark:text-neutral-400" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-violet-600 dark:hover:text-violet-400">
              {t("crumb_home")}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/blog" className="hover:text-violet-600 dark:hover:text-violet-400">
              Blog
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="truncate font-medium text-neutral-700 dark:text-neutral-200">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8 border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          <span>{post.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>{dateFmt}</time>
          <span aria-hidden>·</span>
          <span>{t("reading_time", { minutes: post.readingMinutes })}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          {post.description}
        </p>
      </header>

      {/* Cover image */}
      {post.cover && (
        <div className="mb-10 overflow-hidden rounded-2xl">
          <img
            src={post.cover}
            alt={post.title}
            className="w-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-neutral max-w-none dark:prose-invert prose-a:text-violet-600 hover:prose-a:text-violet-700 dark:prose-a:text-violet-400 dark:hover:prose-a:text-violet-300 prose-headings:tracking-tight prose-h2:mt-10 prose-h2:mb-4 prose-h3:mt-8 prose-h3:mb-3">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-neutral-200 pt-8 dark:border-neutral-800">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-8 dark:from-violet-950/40 dark:to-fuchsia-950/40">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {t("cta_title")}
        </h3>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          {t("cta_desc")}
        </p>
        <Link
          href="/precios"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          {t("cta_button")} →
        </Link>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {t("related")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}` as never}
                className="group rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-violet-400 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-violet-500"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {r.category}
                </p>
                <h3 className="mt-1 line-clamp-2 font-semibold text-neutral-900 group-hover:text-violet-700 dark:text-neutral-50 dark:group-hover:text-violet-400">
                  {r.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
