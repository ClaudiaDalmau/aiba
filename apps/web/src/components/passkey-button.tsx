"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { Icon } from "./icons";
import { cx } from "./ui";

const toBuf = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const toB64u = (b: ArrayBuffer | null) => (b ? btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : null);

/** Runs a WebAuthn ceremony: register a passkey, sign in without password, or confirm the second step. */
export function PasskeyButton({ purpose, label, className, name, variant = "primary", onDone }: { purpose: "register" | "login" | "second"; label: string; className?: string; name?: string; variant?: "primary" | "secondary"; onDone?: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setError(null);
    if (!window.PublicKeyCredential) return setError(t("This browser doesn't support passkeys. Update it or try another device."));
    setBusy(true);
    try {
      const o = await fetch("/api/auth/passkey/options", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose }) });
      const oj = await o.json();
      if (!o.ok) throw new Error(oj.detail ?? t("Something went wrong. Please try again."));
      const pk = oj.publicKey;
      let credential: Record<string, unknown>;
      if (purpose === "register") {
        const c = (await navigator.credentials.create({
          publicKey: { ...pk, challenge: toBuf(pk.challenge), user: { ...pk.user, id: toBuf(pk.user.id) }, excludeCredentials: pk.excludeCredentials.map((e: { id: string }) => ({ ...e, id: toBuf(e.id) })) },
        })) as PublicKeyCredential;
        const r = c.response as AuthenticatorAttestationResponse;
        credential = { id: c.id, response: { clientDataJSON: toB64u(r.clientDataJSON), attestationObject: toB64u(r.attestationObject) } };
      } else {
        const c = (await navigator.credentials.get({
          publicKey: { ...pk, challenge: toBuf(pk.challenge), allowCredentials: pk.allowCredentials.map((e: { id: string }) => ({ ...e, id: toBuf(e.id) })) },
        })) as PublicKeyCredential;
        const r = c.response as AuthenticatorAssertionResponse;
        credential = { id: c.id, response: { clientDataJSON: toB64u(r.clientDataJSON), authenticatorData: toB64u(r.authenticatorData), signature: toB64u(r.signature), userHandle: toB64u(r.userHandle) } };
      }
      const v = await fetch("/api/auth/passkey/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ purpose, credential, name }) });
      const vj = await v.json();
      if (!v.ok) throw new Error(vj.detail ?? t("Something went wrong. Please try again."));
      if (vj.redirect) window.location.href = vj.redirect;
      else {
        onDone?.();
        window.location.reload();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(/NotAllowed|abort|cancel/i.test(msg) ? t("Cancelled or timed out. Try again.") : /InvalidState/.test(msg) ? t("This device is already registered.") : msg);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={cx(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-medium transition disabled:opacity-60",
          variant === "primary" ? "bg-accent text-accent-fg hover:opacity-90" : "border border-border bg-surface hover:bg-subtle",
          className,
        )}
      >
        <Icon name="fingerprint" size={18} /> {busy ? t("Waiting for your device…") : label}
      </button>
      {error && <p className="mt-2 text-[13px] text-bad">{error}</p>}
    </div>
  );
}
