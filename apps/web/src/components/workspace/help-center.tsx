"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { HelpArticle } from "@/lib/help";
import { Icon } from "../icons";
import { cx } from "../ui";

export type HelpLabels = { search: string; placeholder: string; onThisPage: string; all: string; noResults: string; open: string; close: string; title: string; hint: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function matchesPath(a: HelpArticle, path: string) {
  return a.paths.some((p) => (p === "/app" ? path === "/app" : path === p || path.startsWith(`${p}/`)));
}

/** Search box (sidebar) or magnifier button (mobile header) that opens the help drawer. Ctrl/⌘+K opens it too. */
export function HelpCenter({ articles, labels, variant = "box" }: { articles: HelpArticle[]; labels: HelpLabels; variant?: "box" | "icon" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const path = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (variant !== "box") return; // one listener is enough
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);
  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const index = useMemo(() => articles.map((a) => ({ a, title: norm(a.title), body: norm(`${a.keywords} ${a.steps.join(" ")}`) })), [articles]);
  const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
  const results = words.length
    ? index
        .filter((x) => words.every((w) => x.title.includes(w) || x.body.includes(w)))
        .sort((x, y) => words.filter((w) => y.title.includes(w)).length - words.filter((w) => x.title.includes(w)).length)
        .map((x) => x.a)
    : null;
  const here = articles.filter((a) => matchesPath(a, path));
  const rest = articles.filter((a) => !here.includes(a));

  const item = (a: HelpArticle, autoOpen = false) => {
    const isOpen = expanded === a.id || (autoOpen && expanded === null);
    return (
      <li key={a.id} className="rounded-xl border border-border bg-surface">
        <button type="button" onClick={() => setExpanded(isOpen ? "" : a.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ai/10 text-ai"><Icon name={a.icon} size={16} /></span>
          <span className="flex-1 text-[14px] font-medium">{a.title}</span>
          <Icon name="chevronRight" size={16} className={cx("text-faint transition", isOpen && "rotate-90")} />
        </button>
        {isOpen && (
          <div className="px-4 pb-4">
            <ol className="space-y-2 pl-1">
              {a.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-fg/90">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-subtle text-[11px] font-semibold text-muted">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            {path !== a.href && (
              <Link href={a.href} onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-ai hover:underline">
                {labels.open} <Icon name="arrowRight" size={14} />
              </Link>
            )}
          </div>
        )}
      </li>
    );
  };

  const drawer = open && (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label={labels.title}>
      <button type="button" aria-label={labels.close} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div className="relative flex h-full w-full max-w-md flex-col bg-bg shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Icon name="search" size={18} className="text-faint" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setExpanded(null);
            }}
            placeholder={labels.placeholder}
            className="h-9 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          <button type="button" onClick={() => setOpen(false)} aria-label={labels.close} className="rounded-md p-1.5 text-faint hover:bg-subtle hover:text-fg"><Icon name="x" size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {results ? (
            results.length ? (
              <ul className="space-y-2">{results.map((a, i) => item(a, i === 0))}</ul>
            ) : (
              <p className="px-1 py-6 text-center text-[14px] text-muted">{labels.noResults}</p>
            )
          ) : (
            <>
              {here.length > 0 && (
                <>
                  <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-faint">{labels.onThisPage}</div>
                  <ul className="mb-5 space-y-2">{here.map((a, i) => item(a, i === 0))}</ul>
                </>
              )}
              <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-faint">{labels.all}</div>
              <ul className="space-y-2">{rest.map((a) => item(a))}</ul>
            </>
          )}
        </div>
        <div className="border-t border-border px-4 py-2.5 text-[12px] text-faint">{labels.hint}</div>
      </div>
    </div>
  );

  return (
    <>
      {variant === "box" ? (
        <button type="button" onClick={() => setOpen(true)} className="mb-4 flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px] text-faint shadow-card hover:text-fg">
          <Icon name="search" size={15} />
          <span className="flex-1 text-left">{labels.search}</span>
          <kbd className="rounded border border-border px-1.5 text-[10px] font-medium">Ctrl K</kbd>
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label={labels.search} className="rounded-md p-2 text-muted hover:bg-subtle hover:text-fg">
          <Icon name="search" size={19} />
        </button>
      )}
      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
