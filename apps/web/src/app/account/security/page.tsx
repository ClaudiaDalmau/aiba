import { getT } from "@/i18n/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { deletePasskey, disableTotp, startTotp } from "@/actions/security";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { PasskeyButton } from "@/components/passkey-button";
import { ConfirmTotpForm, RegenerateCodesForm } from "@/components/security-forms";
import { Badge, Card, CardHeader } from "@/components/ui";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { decryptJson } from "@/lib/crypto";
import { isPlatformRole } from "@/lib/platform-rbac";
import { totpUri } from "@/lib/two-step";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Sign-in security") };
}

export default async function SecurityPage() {
  const t = await getT();
  const me = await requireUser("/account/security");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  const keys = await db.select().from(schema.passkeys).where(eq(schema.passkeys.userId, me.id));
  const setupRaw = (await cookies()).get("aiba_totp_setup")?.value;
  let setup: { secret: string; qr: string } | null = null;
  if (!user.totpSecret && setupRaw) {
    try {
      const secret = decryptJson<string>(setupRaw);
      setup = { secret, qr: await QRCode.toDataURL(totpUri(secret, user.email), { margin: 1, width: 200 }) };
    } catch {}
  }
  const on = keys.length > 0 || Boolean(user.totpSecret);
  return (
    <>
      <Link href={isPlatformRole(user.platformRole) ? "/admin" : "/app"} className="text-[13px] text-muted hover:underline">← {t("Back")}</Link>
      <h1 className="mt-3 text-[26px] font-semibold tracking-tight">{t("Sign-in security")}</h1>
      <p className="mt-1 text-muted">{on ? t("Two-step sign-in is on: after your password we ask for your fingerprint, face or a code.") : t("Add a second step so nobody can get in with just your password.")}</p>
      {user.requirePasskey && <p className="mt-3 rounded-lg bg-ai/10 px-3 py-2 text-[13px] text-ai">{t("Your account must sign in with a passkey (fingerprint or face). A password alone is never enough.")}</p>}

      <Card className="mt-6">
        <CardHeader title={t("Fingerprint or face (passkeys)")} description={t("The safest option. Your phone or computer checks your fingerprint or face; AIBA only receives a cryptographic signature, never your biometric data.")} />
        <ul className="divide-y divide-border">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-5 py-3 text-[14px]">
              <span className="flex-1 font-medium">{k.name}</span>
              <span className="text-[12px] text-muted">{k.lastUsedAt ? t("last used {date}", { date: k.lastUsedAt.toISOString().slice(0, 10) }) : t("added {date}", { date: k.createdAt.toISOString().slice(0, 10) })}</span>
              {!(user.requirePasskey && keys.length <= 1) && (
                <form action={deletePasskey}>
                  <input type="hidden" name="id" value={k.id} />
                  <ConfirmSubmit message={t("Remove this passkey?")} variant="ghost" size="sm">{t("Remove")}</ConfirmSubmit>
                </form>
              )}
            </li>
          ))}
        </ul>
        <div className="p-5">
          <PasskeyButton purpose="register" variant="secondary" label={keys.length ? t("Add another device") : t("Register fingerprint or face on this device")} />
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title={t("Authenticator app")} description={t("Google Authenticator, Microsoft Authenticator, 1Password… gives you a new 6-digit code every 30 seconds.")} />
        <div className="p-5">
          {user.totpSecret ? (
            <div className="flex items-center gap-3">
              <Badge tone="ok">{t("On")}</Badge>
              {user.requirePasskey ? null : (
                <form action={disableTotp}>
                  <ConfirmSubmit message={t("Turn off the authenticator app?")} variant="ghost" size="sm">{t("Turn off")}</ConfirmSubmit>
                </form>
              )}
            </div>
          ) : setup ? (
            <div>
              <p className="text-[14px]">{t("1. Scan this QR code with your authenticator app (or type the key).")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="QR" width={200} height={200} className="mt-3 rounded-lg border border-border" />
              <p className="mt-2 font-mono text-[13px] break-all text-muted">{setup.secret}</p>
              <p className="mt-4 text-[14px]">{t("2. Enter the 6-digit code it shows:")}</p>
              <ConfirmTotpForm />
            </div>
          ) : (
            <form action={startTotp}>
              <SubmitButton variant="secondary">{t("Set up authenticator app")}</SubmitButton>
            </form>
          )}
        </div>
      </Card>

      {on && !user.requirePasskey && (
        <Card className="mt-6">
          <CardHeader title={t("Recovery codes")} description={t("{n} left. Each one lets you in once if you lose your phone.", { n: user.recoveryCodes.length })} />
          <div className="p-5"><RegenerateCodesForm /></div>
        </Card>
      )}
    </>
  );
}
