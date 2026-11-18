"use client";

import Link from "next/link";
import { useT } from "@/i18n/client";
import { useActionState } from "react";
import { login, signup, type FormState } from "@/actions/auth";
import { SubmitButton } from "./client";
import { Field, Input } from "./ui";

function Err({ msg }: { msg?: string | string[] }) {
  const m = Array.isArray(msg) ? msg[0] : msg;
  return m ? <p className="mt-1 text-[13px] text-bad">{m}</p> : null;
}

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, action] = useActionState<FormState, FormData>(login, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={t("Email")}><Input name="email" type="email" autoComplete="email" required autoFocus /></Field>
      <Field label={t("Password")}><Input name="password" type="password" autoComplete="current-password" required /></Field>
      <Err msg={state?.error} />
      <SubmitButton className="w-full" size="lg">{t("Sign in")}</SubmitButton>
      <p className="text-center text-[14px] text-muted">{t("New here?")} <Link href="/signup" className="font-medium text-fg underline-offset-4 hover:underline">{t("Create a business account")}</Link></p>
    </form>
  );
}

export function SignupForm() {
  const t = useT();
  const [state, action] = useActionState<FormState, FormData>(signup, null);
  return (
    <form action={action} className="space-y-4">
      <Field label={t("Your name")}><Input name="name" autoComplete="name" required autoFocus /><Err msg={state?.fieldErrors?.name} /></Field>
      <Field label={t("Work email")}><Input name="email" type="email" autoComplete="email" required /><Err msg={state?.fieldErrors?.email} /></Field>
      <Field label={t("Password")} hint={t("8+ characters")}><Input name="password" type="password" autoComplete="new-password" required minLength={8} /><Err msg={state?.fieldErrors?.password} /></Field>
      <Err msg={state?.error} />
      <SubmitButton className="w-full" size="lg">{t("Create account")}</SubmitButton>
      <p className="text-center text-[13px] text-muted">{t("By continuing you agree to the Terms and acknowledge the Privacy notice.")}</p>
      <p className="text-center text-[14px] text-muted">{t("Already have an account?")} <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">{t("Sign in")}</Link></p>
    </form>
  );
}
