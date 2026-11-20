import { getT } from "@/i18n/server";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { IdentityUpload } from "@/components/identity-upload";
import { Badge, Card } from "@/components/ui";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { latestCheck } from "@/lib/identity";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Verify your identity") };
}

export default async function VerifyIdentity() {
  const t = await getT();
  const me = await requireUser("/account/verify");
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  const check = await latestCheck(me.id);
  const [pk] = await db.select({ id: schema.passkeys.id }).from(schema.passkeys).where(eq(schema.passkeys.userId, me.id)).limit(1);
  return (
    <>
      <Link href="/app" className="text-[13px] text-muted hover:underline">← {t("Back")}</Link>
      <h1 className="mt-3 text-[26px] font-semibold tracking-tight">{t("Verify your identity")}</h1>
      <p className="mt-1 text-muted">{t("On AIBA Sensible each profile belongs to one real, adult person who works for herself. We check it once so nobody can open a profile in your name or manage you through one.")}</p>
      <Card className="mt-6 p-5">
        {u.identityVerifiedAt ? (
          <div className="space-y-2 text-[14px]">
            <Badge tone="ok" icon="checkCircle">{t("Identity verified")}</Badge>
            <p className="text-muted">{t("Your profiles are live. Your photos were deleted after the check.")}</p>
          </div>
        ) : check?.status === "pending" ? (
          <div className="space-y-2 text-[14px]">
            <Badge tone="warn">{t("Under review")}</Badge>
            <p className="text-muted">{t("We usually review within 24 hours. You'll get an email. Meanwhile you can set up your profile; it goes live once you're verified.")}</p>
          </div>
        ) : (
          <>
            {check?.status === "rejected" && <p className="mb-4 rounded-lg bg-bad/10 px-3 py-2 text-[13px] text-bad">{t("We couldn't verify the last photos")}{check.reason ? `: ${check.reason}` : "."} {t("Please try again.")}</p>}
            <IdentityUpload />
          </>
        )}
      </Card>
      {!pk && (
        <p className="mt-4 text-[14px]">
          {t("Next step:")} <Link href="/account/security?first=1" className="font-medium text-ai underline">{t("register your fingerprint or face")}</Link> — {t("from then on only you can sign in.")}
        </p>
      )}
    </>
  );
}
