import { getT } from "@/i18n/server";
import Link from "next/link";
import { createThread } from "@/actions/community";
import { SubmitButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { LockedCommunity, ReadOnlyNotice } from "@/components/community/parts";
import { Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { canAccessCommunity, listCategories, isCommunityModerator } from "@/lib/community";
import { communityReadOnly } from "@/lib/review-protocol";
import { currentTenant } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("New discussion") };
}

export default async function NewThreadPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  if (!(await canAccessCommunity(tenant))) return <LockedCommunity />;
  const readOnly = await communityReadOnly(tenant.user);
  if (readOnly) return <div className="mx-auto max-w-3xl"><ReadOnlyNotice until={readOnly.until} reason={readOnly.reason} /></div>;
  const { category } = await searchParams;
  const isAdmin = isCommunityModerator(tenant.user);
  const categories = (await listCategories()).filter((c) => !c.adminOnlyPosting || isAdmin);
  const selected = categories.find((c) => c.slug === category)?.id ?? categories[0]?.id;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/community" className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg"><Icon name="chevronLeft" size={14} /> {t("Community")}</Link>
      <PageHeader title={t("Start a discussion")} description={t("Visible only to verified VIP businesses and the platform team.")} />
      <Card className="p-6">
        <form action={createThread} className="space-y-5">
          <Field label={t("Category")}>
            <Select name="categoryId" defaultValue={selected} required>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label={t("Title")}><Input name="title" required minLength={3} maxLength={160} placeholder={t("What do you want to discuss?")} /></Field>
          <Field label={t("Details")}><Textarea name="body" required className="min-h-48" placeholder={t("Context, what you tried, what you'd like to learn…")} /></Field>
          <div className="flex justify-end gap-2">
            <SubmitButton icon="send">{t("Post discussion")}</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
