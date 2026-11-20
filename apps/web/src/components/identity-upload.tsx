"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { Button, Field, Select } from "./ui";

/** Shrinks a photo in the browser (max 1600 px, JPEG) before sending it. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = ko;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function IdentityUpload() {
  const t = useT();
  const [doc, setDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pick = (set: (v: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      set(await compress(f));
    } catch {
      setError(t("This photo couldn't be read. Try a JPG or PNG."));
    }
  };
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (!doc || !selfie) return setError(t("Add both photos."));
        setBusy(true);
        setError(null);
        const res = await fetch("/api/account/identity", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentType: f.get("documentType"), document: doc, selfie, consent: f.get("consent") === "on" }) });
        const j = await res.json().catch(() => ({}));
        setBusy(false);
        if (!res.ok) return setError(j.detail ?? t("Something went wrong. Please try again."));
        window.location.reload();
      }}
    >
      <Field label={t("Document")}>
        <Select name="documentType" defaultValue="id_card">
          <option value="id_card">{t("National ID card")}</option>
          <option value="passport">{t("Passport")}</option>
          <option value="residence_permit">{t("Residence permit")}</option>
          <option value="driving_licence">{t("Driving licence")}</option>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block cursor-pointer rounded-xl border border-dashed border-border p-4 text-center text-[13px] hover:bg-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {doc ? <img src={doc} alt="" className="mx-auto max-h-40 rounded-lg" /> : <span className="block py-8 text-muted">{t("1. Photo of the document (side with your photo)")}</span>}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick(setDoc)} />
        </label>
        <label className="block cursor-pointer rounded-xl border border-dashed border-border p-4 text-center text-[13px] hover:bg-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {selfie ? <img src={selfie} alt="" className="mx-auto max-h-40 rounded-lg" /> : <span className="block py-8 text-muted">{t("2. Selfie holding the same document next to your face")}</span>}
          <input type="file" accept="image/*" capture="user" className="sr-only" onChange={pick(setSelfie)} />
        </label>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-[13px] text-muted">
        <li>{t("Good light, no glare; all four corners of the document visible.")}</li>
        <li>{t("In the selfie your face and the document photo must both be clear.")}</li>
      </ul>
      <label className="flex items-start gap-2 text-[13px] text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        {t("I agree that AIBA uses these photos only to verify my identity. They are stored encrypted and deleted as soon as the check is done; only the result is kept.")}
      </label>
      {error && <p className="text-[13px] text-bad">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? t("Sending…") : t("Send for verification")}</Button>
    </form>
  );
}
