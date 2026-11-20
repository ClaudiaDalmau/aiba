import { getT } from "@/i18n/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CodeForm } from "@/components/auth-forms";
import { PasskeyButton } from "@/components/passkey-button";
import { db, schema } from "@/db";
import { getPending, needsSecondStep } from "@/lib/two-step";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Confirm it's you") };
}

export default async function VerifyPage() {
  const t = await getT();
  const pending = await getPending();
  if (!pending) redirect("/login");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, pending.userId));
  if (!user) redirect("/login");
  const s = await needsSecondStep(user);
  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-tight">{t("Confirm it's you")}</h1>
      <p className="mt-1 mb-8 text-muted">{user.email}</p>
      <div className="space-y-6">
        {s.passkey && (
          <div>
            <PasskeyButton purpose="second" label={t("Use fingerprint or face")} />
            <p className="mt-2 text-[12px] text-faint">{t("Your device checks your fingerprint or face. AIBA never receives it.")}</p>
          </div>
        )}
        {!s.passkey && s.mustUsePasskey && (
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-[14px]">{t("This account must sign in with a passkey. Register the fingerprint or face of this device now; next time you'll sign in with it.")}</p>
            <PasskeyButton purpose="register" label={t("Register fingerprint or face")} />
          </div>
        )}
        {s.totp && !s.mustUsePasskey && <CodeForm kind="totp" />}
        {!s.mustUsePasskey && (s.totp || s.passkey) && (
          <details className="text-[14px]">
            <summary className="cursor-pointer text-muted">{t("Lost your device? Use a recovery code")}</summary>
            <div className="mt-3"><CodeForm kind="recovery" /></div>
          </details>
        )}
        {s.mustUsePasskey && s.passkey && <p className="text-[13px] text-muted">{t("Lost the device with your passkey? Contact support to verify your identity again.")}</p>}
        <Link href="/login" className="block text-center text-[13px] text-muted hover:underline">{t("Back")}</Link>
      </div>
    </>
  );
}
