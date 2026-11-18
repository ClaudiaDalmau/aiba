import { getT } from "@/i18n/server";
import { LoginForm } from "@/components/auth-forms";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Sign in") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const t = await getT();
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-[28px] font-semibold tracking-tight">{t("Welcome back")}</h1>
      <p className="mt-1 mb-8 text-muted">{t("Sign in to your workspace.")}</p>
      <LoginForm next={next} />
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 rounded-card border border-dashed border-border p-4 text-[13px] text-muted">
          <div className="mb-1 font-medium text-fg">{t("Demo accounts (password: demo-password)")}</div>
          owner@atelier.example · owner@ironhouse.example · owner@lumen.example · admin@aiba.example
        </div>
      )}
    </>
  );
}
