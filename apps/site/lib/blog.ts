/**
 * Blog utilities — Task C
 * -------------------------------------------------
 * Reads MDX blog posts stored under `content/blog/{locale}/{slug}.mdx`.
 * All I/O is server-only (Node fs). Consumed by Next.js server components
 * and metadata generators.
 *
 * Directory layout:
 *   /app/dashboard-web/content/blog/
 *     ├─ es/
 *     │   ├─ como-reducir-cancelaciones.mdx
 *     │   ├─ ...
 *     ├─ en/
 *     ├─ fr/
 *     └─ ...
 *
 * Each MDX file starts with YAML frontmatter:
 *
 *   ---
 *   title: "Cómo reducir cancelaciones con depósitos"
 *   description: "Guía práctica..."
 *   date: "2026-08-14"
 *   category: "reservas"
 *   tags: ["cancelaciones", "depositos"]
 *   cover: "/blog/covers/reducir-cancelaciones.jpg"  # optional
 *   author: "AIBA"
 *   ---
 *
 *   # Markdown content here...
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { routing, type Locale } from "@/i18n/routing";

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  category: string;
  tags?: string[];
  cover?: string;
  author?: string;
  draft?: boolean;
};

export type BlogPostMeta = BlogFrontmatter & {
  slug: string;
  locale: string;
  readingMinutes: number;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content", "blog");

/** Read a single post by locale + slug. Returns null if not found. */
export function getPost(locale: string, slug: string): BlogPost | null {
  const file = path.join(CONTENT_ROOT, locale, `${slug}.mdx`);
  if (!fs.existsSync(file)) {
    // Fallback to Spanish if the localized version doesn't exist yet
    const fallback = path.join(CONTENT_ROOT, "es", `${slug}.mdx`);
    if (!fs.existsSync(fallback)) return null;
    return _readFile(fallback, "es", slug);
  }
  return _readFile(file, locale, slug);
}

function _readFile(file: string, locale: string, slug: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = matter(raw);
    const fm = parsed.data as BlogFrontmatter;
    if (fm.draft) return null;
    const rt = readingTime(parsed.content);
    return {
      ...fm,
      slug,
      locale,
      content: parsed.content,
      readingMinutes: Math.max(1, Math.round(rt.minutes)),
    };
  } catch {
    return null;
  }
}

/** List all posts for a locale, sorted by date desc. */
export function listPosts(locale: string): BlogPostMeta[] {
  const dir = path.join(CONTENT_ROOT, locale);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const posts: BlogPostMeta[] = [];
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, "");
    const p = _readFile(path.join(dir, f), locale, slug);
    if (p) {
      const { content: _c, ...meta } = p;
      posts.push(meta);
    }
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Return all (locale, slug) pairs. Used for generateStaticParams + sitemap. */
export function listAllSlugs(): { locale: string; slug: string }[] {
  const out: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const p of listPosts(locale)) {
      out.push({ locale, slug: p.slug });
    }
  }
  return out;
}

/** Slugs present in the canonical (Spanish) library. Used to build hreflang
 * alternates in sitemap and metadata (every post always has ES + fallback). */
export function listCanonicalSlugs(): string[] {
  return listPosts("es").map((p) => p.slug);
}

/** Locales in which a given slug is *actually* published (post file exists). */
export function localesWithPost(slug: string): string[] {
  const out: string[] = [];
  for (const locale of routing.locales) {
    if (fs.existsSync(path.join(CONTENT_ROOT, locale, `${slug}.mdx`))) {
      out.push(locale);
    }
  }
  return out;
}

/** Get related posts by shared tags/category (max 3). */
export function getRelatedPosts(locale: string, slug: string, limit = 3): BlogPostMeta[] {
  const current = getPost(locale, slug);
  if (!current) return [];
  const all = listPosts(locale).filter((p) => p.slug !== slug);
  const scored = all.map((p) => {
    let score = 0;
    if (p.category === current.category) score += 2;
    const shared = (p.tags || []).filter((t) => current.tags?.includes(t));
    score += shared.length;
    return { post: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.post);
}

export type { Locale };
