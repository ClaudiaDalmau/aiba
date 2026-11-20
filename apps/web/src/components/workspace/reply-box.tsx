"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { countQuickReplyUse } from "@/actions/quick-replies";
import { useT } from "@/i18n/client";
import { SubmitButton } from "../client";
import { Icon } from "../icons";
import { Textarea } from "../ui";

type Reply = { id: string; title: string; body: string };

/** Inbox composer with quick replies ({name} → customer's first name). */
export function ReplyBox({ replies, customerName, placeholder }: { replies: Reply[]; customerName: string; placeholder: string }) {
  const t = useT();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  useEffect(() => {
    const form = area.current?.form;
    if (!form) return;
    const clear = () => setTimeout(() => setText(""), 0);
    form.addEventListener("submit", clear);
    return () => form.removeEventListener("submit", clear);
  }, []);
  const first = customerName.split(" ")[0] || customerName;
  const shown = replies.filter((r) => `${r.title} ${r.body}`.toLowerCase().includes(q.toLowerCase()));
  const use = (r: Reply) => {
    const body = r.body.replaceAll("{name}", first).replaceAll("{nombre}", first);
    setText((cur) => (cur.trim() ? `${cur.trimEnd()}\n${body}` : body));
    setOpen(false);
    setQ("");
    countQuickReplyUse(r.id).catch(() => {});
    setTimeout(() => area.current?.focus(), 0);
  };
  return (
    <div className="flex items-end gap-2">
      <div ref={box} className="relative">
        <button type="button" onClick={() => setOpen((o) => !o)} title={t("Quick replies")} aria-label={t("Quick replies")} className="grid size-10 place-items-center rounded-lg border border-border bg-surface text-muted hover:text-fg">
          <Icon name="bolt" size={17} />
        </button>
        {open && (
          <div className="absolute bottom-12 left-0 z-20 w-80 rounded-xl border border-border bg-surface p-2 shadow-xl">
            {replies.length > 4 && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search…")} className="mb-2 h-8 w-full rounded-md border border-border bg-bg px-2 text-[13px] outline-none" />}
            <ul className="max-h-64 overflow-y-auto">
              {shown.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => use(r)} className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-subtle">
                    <div className="text-[13px] font-medium">{r.title}</div>
                    <div className="line-clamp-2 text-[12px] text-muted">{r.body}</div>
                  </button>
                </li>
              ))}
              {!replies.length && <li className="px-2.5 py-2 text-[13px] text-muted">{t("No quick replies yet.")}</li>}
            </ul>
            <Link href="/app/inbox/replies" className="mt-1 block border-t border-border px-2.5 pt-2 text-[12px] font-medium text-ai hover:underline">{t("Manage quick replies")}</Link>
          </div>
        )}
      </div>
      <Textarea ref={area} name="text" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} className="min-h-12 flex-1 resize-none" required />
      <SubmitButton icon="send">{t("Send")}</SubmitButton>
    </div>
  );
}
