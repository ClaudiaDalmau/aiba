import { getT } from "@/i18n/server";
import { SignupForm } from "@/components/auth-forms";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Create your account") };
}

export default async function SignupPage() {
  const t = await getT();
  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-tight">{t("Start your 14-day trial")}</h1>
      <p className="mt-1 mb-8 text-muted">{t("Booking page, AI assistant and mobile app, live in minutes.")}</p>
      <SignupForm />
    </>
  );
}
