/**
 * Blog list client component — Task C follow-up (Opción C)
 * ---------------------------------------------------------
 * Adds live search + category filters + tag pills, without hitting the API
 * (all posts are already loaded from the filesystem at build/request time).
 */
"use client";

import { useMemo, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type BlogPostRow = {
  slug: string;
  locale: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags?: string[];
  cover?: string;
  readingMinutes: number;
};

type Props = {
  posts: BlogPostRow[];
  locale: string;
  labels: {
    readMore: string;
    searchPlaceholder: string;
    all: string;
    empty: string;
    noResults: string;
    filterByCategory: string;
    clearFilters: string;
    filterByTag: string;
    resultsCountTemplate: string; // "[N] artículos" — replace [N]
  };
};

export default function BlogListClient({ posts, locale, labels }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("__all");
  const [tag, setTag] = useState<string | null>(null);

  // Extract unique categories and tags in declaration order
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [posts]);

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => (p.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12) // top 12 tags
      .map(([t]) => t);
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "__all" && p.category !== category) return false;
      if (tag && !(p.tags || []).includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, category, tag]);

  const hasActiveFilter = query || category !== "__all" || tag;

  return (
    <div className="mt-8">
      {/* Filters bar */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md mx-auto">
          <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full pl-11 pr-10 py-3 rounded-full border border-neutral-200 bg-white text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <CategoryPill active={category === "__all"} onClick={() => setCategory("__all")}>
            {labels.all}
          </CategoryPill>
          {categories.map((c) => (
            <CategoryPill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </CategoryPill>
          ))}
        </div>

        {/* Tag row */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs uppercase tracking-wider text-neutral-500">
              {labels.filterByTag}:
            </span>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                  tag === t
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* Result count + clear */}
        <div className="flex justify-center items-center gap-3 text-sm text-neutral-500">
          <span>{labels.resultsCountTemplate.replace("[N]", String(filtered.length))}</span>
          {hasActiveFilter && (
            <button
              onClick={() => { setQuery(""); setCategory("__all"); setTag(null); }}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              {labels.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">
            {posts.length === 0 ? labels.empty : labels.noResults}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} readMoreLabel={labels.readMore} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition ${
        active
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function BlogCard({
  post, readMoreLabel, locale,
}: { post: BlogPostRow; readMoreLabel: string; locale: string }) {
  const dateFmt = new Date(post.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Link
      href={`/blog/${post.slug}` as never}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-emerald-500"
    >
      {post.cover ? (
        <div
          className="aspect-[16/9] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${post.cover})` }}
          aria-hidden="true"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
          <Sparkles className="w-10 h-10 text-emerald-500" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <span>{post.category}</span>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min</span>
        </div>
        <h2 className="mb-2 line-clamp-2 text-xl font-bold text-neutral-900 group-hover:text-emerald-700 dark:text-neutral-50 dark:group-hover:text-emerald-400">
          {post.title}
        </h2>
        <p className="mb-4 line-clamp-3 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
          {post.description}
        </p>
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
          <time dateTime={post.date}>{dateFmt}</time>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {readMoreLabel} →
          </span>
        </div>
      </div>
    </Link>
  );
}
