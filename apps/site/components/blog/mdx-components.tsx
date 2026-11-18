/**
 * MDX components — Task C (Blog)
 * ----------------------------------------------
 * Custom renderers for markdown elements used inside blog posts.
 * Tailwind Typography (`prose`) already styles headings/paragraphs,
 * so this file focuses on: internal link routing (next-intl <Link>),
 * callouts, and image handling.
 */
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

function AutoLink({ href = "", children, ...rest }: ComponentProps<"a">) {
  const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  // Strip leading locale if the author accidentally included one
  const cleaned = href.replace(/^\/(es|en|fr|de|it|pt-BR|ru)(\/|$)/, "/");
  // next-intl Link only supports internal absolute paths (starting with `/`)
  if (cleaned.startsWith("/")) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link href={cleaned as any}>{children}</Link>
    );
  }
  return <a href={href} {...rest}>{children}</a>;
}

function Callout({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "success" }) {
  const colors = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
    warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  };
  return (
    <div className={`my-6 rounded-xl border p-4 ${colors[tone]}`}>
      <div className="prose-sm">{children}</div>
    </div>
  );
}

export const mdxComponents = {
  a: AutoLink,
  Callout,
  // Constrain image widths and use rounded corners
  img: (props: ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} className={`my-6 w-full rounded-xl ${props.className ?? ""}`} loading="lazy" />
  ),
};
