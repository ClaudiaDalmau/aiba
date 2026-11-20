"use client";

import { useActionState } from "react";
import { confirmTotp, regenerateCodes, type SecState } from "@/actions/security";
import { useT } from "@/i18n/client";
import { SubmitButton } from "./client";
import { Input } from "./ui";

function Codes({ s }: { s: SecState }) {
  if (!s) return null;
  return (
    <div className="mt-3 space-y-2">
      {s.error && <p className="text-[13px] text-bad">{s.error}</p>}
      {s.message && <p className="text-[13px] text-ok">{s.message}</p>}
      {s.codes && <pre className="grid grid-cols-2 gap-1 rounded-lg bg-subtle p-3 font-mono text-[14px]">{s.codes.map((c) => <span key={c}>{c}</span>)}</pre>}
    </div>
  );
}

export function ConfirmTotpForm() {
  const t = useT();
  const [s, action] = useActionState(confirmTotp, null);
  return (
    <form action={action} className="mt-3">
      <div className="flex gap-2">
        <Input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={7} required className="max-w-40" />
        <SubmitButton>{t("Activate")}</SubmitButton>
      </div>
      <Codes s={s} />
    </form>
  );
}

export function RegenerateCodesForm() {
  const t = useT();
  const [s, action] = useActionState(regenerateCodes, null);
  return (
    <form action={action}>
      <SubmitButton variant="secondary" size="sm">{t("Generate new recovery codes")}</SubmitButton>
      <Codes s={s} />
    </form>
  );
}
