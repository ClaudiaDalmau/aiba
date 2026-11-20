"use client";

import { useActionState } from "react";
import { requestHelp } from "@/actions/safety";
import { useT } from "@/i18n/client";
import { SubmitButton } from "./client";
import { Field, Input, Textarea } from "./ui";

export function HelpRequestForm() {
  const t = useT();
  const [s, action] = useActionState(requestHelp, null);
  if (s?.ok) return <p className="rounded-lg bg-subtle px-4 py-3 text-[14px]">{t("Message sent to support. We'll reply only through the contact you gave us.")}</p>;
  return (
    <form action={action} className="space-y-4">
      <Field label={t("What's happening?")} hint={t("optional")}><Textarea name="message" rows={4} /></Field>
      <Field label={t("A safe way to contact you")} hint={t("phone, email, a time of day… leave empty to answer only here")}><Input name="contact" /></Field>
      <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="urgent" /> {t("It's urgent")}</label>
      {s?.error && <p className="text-[13px] text-bad">{s.error}</p>}
      <SubmitButton className="w-full">{t("Send")}</SubmitButton>
    </form>
  );
}
