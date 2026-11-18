/**
 * RSS feed per locale — /{locale}/blog/rss.xml
 * ---------------------------------------------
 * Standard RSS 2.0 feed of the latest blog posts. Consumed by feed readers
 * and by Google/Bing for faster discovery of new content.
 */
import { NextResponse } from "next/server";
import { listPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const posts = listPosts(locale);
  const siteUrl = `${SITE_URL}/${locale}/blog`;
  const buildDate = new Date().toUTCString();

  const items = posts
    .slice(0, 30)
    .map((p) => {
      const link = `${SITE_URL}/${locale}/blog/${p.slug}`;
      const pubDate = new Date(p.date).toUTCString();
      return `
    <item>
      <title>${esc(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${esc(p.description)}</description>
      <category>${esc(p.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AIBA · Blog (${locale})</title>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Guías, casos y consejos para profesionales independientes.</description>
    <language>${locale}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
