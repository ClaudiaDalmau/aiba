"use client";

import { useActionState, useEffect, useState } from "react";
import { learnStyle, saveStyleGuide } from "@/actions/workspace";
import { SubmitButton } from "@/components/client";
import { Field, Input, Textarea, cx } from "@/components/ui";
import { useT } from "@/i18n/client";

/** «Learn my style»: analyse the owner's own replies (+ optional chat export) and let her edit the guide. */
export function StyleLearner({ initial }: { initial: string }) {
  const t = useT();
  const [guide, setGuide] = useState(initial);
  const [learned, learn] = useActionState(learnStyle, null);
  const [saved, save] = useActionState(saveStyleGuide, null);
  useEffect(() => {
    if (learned?.guide) setGuide(learned.guide);
  }, [learned]);
  const note = (s: { error?: string; message?: string } | null) =>
    s && (s.error || s.message) ? (
      <p className={cx("rounded-lg px-3 py-2 text-[13px]", s.error ? "bg-bad/10 text-bad" : "bg-ok/10 text-ok")}>{s.error ?? s.message}</p>
    ) : null;

  return (
    <div className="space-y-5 p-5">
      <form action={learn} className="space-y-3">
        <p className="text-[13px] text-muted">
          {t("AIBA reads the replies you wrote yourself (in the inbox and the WhatsApp history imported when you linked your number) and writes a guide of how you talk. You can also upload a chat export from your phone.")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("Chat export (optional)")} hint={t("WhatsApp .txt or Telegram result.json")}>
            <input type="file" name="export" accept=".txt,.json,text/plain,application/json" className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13px]" />
          </Field>
          <Field label={t("Your name in that chat")} hint={t("only for exports")}>
            <Input name="ownerName" placeholder={t("e.g. Claudia")} />
          </Field>
        </div>
        <SubmitButton variant="ai" icon="sparkles" pendingText={t("Analysing your messages…")}>{t("Analyse my conversations")}</SubmitButton>
        {note(learned)}
      </form>

      <form action={save} className="space-y-3">
        <Field label={t("Your style guide")} hint={t("edit freely — the agent follows it word for word")}>
          <Textarea name="styleGuide" rows={12} value={guide} onChange={(e) => setGuide(e.target.value)} placeholder={t("Nothing yet. Analyse your conversations or write how you usually talk to customers.")} />
        </Field>
        <p className="text-[12px] text-muted">{t("Only your writing habits are kept, never customers' names or details. Nothing is used until you save.")}</p>
        <SubmitButton>{t("Save style")}</SubmitButton>
        {note(saved)}
      </form>
    </div>
  );
}
