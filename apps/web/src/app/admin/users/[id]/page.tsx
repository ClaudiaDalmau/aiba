import { getT } from "@/i18n/server";
import { and, desc, eq, gt, or } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminSetUserDisabled } from "@/actions/admin";
import { addMembership, impersonate, resetUserPassword, revokeUserSessions, setPlatformRole, updateMembership, updateUser } from "@/actions/admin-platform";
import { Table, Td, fmtDate } from "@/components/admin/table";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Select } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";
import { isPlatformRole, PLATFORM_ROLES, platformCan, ROLE_INFO } from "@/lib/platform-rbac";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("User") };
}

export default async function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const me = await requirePlatform("users.view");
  const { id } = await params;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  if (!u) notFound();
  const [memberships, sessions, activity] = await Promise.all([
    db
      .select({ role: schema.memberships.role, business: { id: schema.businesses.id, name: schema.businesses.name, slug: schema.businesses.slug, tier: schema.businesses.tier } })
      .from(schema.memberships)
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.memberships.businessId))
      .where(eq(schema.memberships.userId, id)),
    db.select().from(schema.sessions).where(and(eq(schema.sessions.userId, id), gt(schema.sessions.expiresAt, new Date()))).orderBy(desc(schema.sessions.createdAt)),
    db
      .select()
      .from(schema.auditLog)
      .where(or(and(eq(schema.auditLog.actorType, "user"), eq(schema.auditLog.actorId, id)), eq(schema.auditLog.target, id)))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(25),
  ]);
  const self = u.id === me.id;
  const manage = platformCan(me.platformRole, "users.manage") && !self;
  const staff = platformCan(me.platformRole, "staff.manage") && !self;
  const canImpersonate = platformCan(me.platformRole, "impersonate") && !self && !u.disabled && (!isPlatformRole(u.platformRole) || staff);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/admin/users" className="hover:text-fg">{t("← Users")}</Link>}
        title={u.name}
        description={u.email}
        actions={
          <>
            {isPlatformRole(u.platformRole) && <Badge tone="solid" icon="shield">{t(ROLE_INFO[u.platformRole].label)}</Badge>}
            {u.disabled ? <Badge tone="bad">{t("Disabled")}</Badge> : <Badge tone="ok">{t("Active")}</Badge>}
            {canImpersonate && (
              <form action={impersonate}>
                <input type="hidden" name="userId" value={u.id} />
                <Button variant="secondary" size="sm" icon="eye">{t("Sign in as")} {u.name.split(" ")[0]}</Button>
              </form>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader title={t("Profile")} />
          <div className="p-5">
            {manage ? (
              <ActionForm action={updateUser} className="space-y-3">
                <input type="hidden" name="userId" value={u.id} />
                <Field label={t("Name")}><Input name="name" defaultValue={u.name} required /></Field>
                <Field label={t("Email")}><Input name="email" type="email" defaultValue={u.email} required /></Field>
                <SubmitButton size="sm">{t("Save")}</SubmitButton>
              </ActionForm>
            ) : (
              <p className="text-[14px] text-muted">{t("Created")} {fmtDate(u.createdAt)}.</p>
            )}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title={t("Security")} description={t(sessions.length === 1 ? "{n} active session" : "{n} active sessions", { n: sessions.length })} />
          <div className="space-y-4 p-5">
            {sessions.length > 0 && (
              <ul className="space-y-1 text-[13px] text-muted">
                {sessions.slice(0, 5).map((s) => (
                  <li key={s.id}>{s.kind === "mobile" ? t("Mobile app") : "Web"} · signed in {fmtDate(s.createdAt)}{s.impersonatorId ? " · admin view" : ""}</li>
                ))}
              </ul>
            )}
            {manage && (
              <>
                <ActionForm action={resetUserPassword} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <Field label={t("Reset password")} hint={t("blank = generate")} className="min-w-48 flex-1"><Input name="password" autoComplete="off" /></Field>
                  <SubmitButton size="md" variant="secondary">{t("Reset")}</SubmitButton>
                </ActionForm>
                <div className="flex flex-wrap gap-2">
                  <form action={revokeUserSessions}>
                    <input type="hidden" name="userId" value={u.id} />
                    <ConfirmSubmit variant="secondary" message={t("Sign this user out everywhere (web and mobile)?")}>{t("Sign out everywhere")}</ConfirmSubmit>
                  </form>
                  <form action={adminSetUserDisabled}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="disabled" value={String(!u.disabled)} />
                    {u.disabled ? <SubmitButton size="sm" variant="secondary">{t("Enable account")}</SubmitButton> : <ConfirmSubmit message={t("Disable {email}? They can't sign in until re-enabled.", { email: u.email })}>{t("Disable account")}</ConfirmSubmit>}
                  </form>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t("Businesses")} description={t("Which workspaces this user can open, and their role in each.")} />
          <Table head={[t("Business"), t("Plan"), t("Role"), ""]}>
            {memberships.map((m) => (
              <tr key={m.business.id}>
                <Td><Link href={`/admin/businesses/${m.business.id}`} className="font-medium hover:underline">{m.business.name}</Link><div className="text-[12px] text-faint">/b/{m.business.slug}</div></Td>
                <Td className="text-muted">{m.business.tier}</Td>
                <Td>
                  {manage ? (
                    <form action={updateMembership} className="flex gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="businessId" value={m.business.id} />
                      <input type="hidden" name="action" value="role" />
                      <Select name="role" defaultValue={m.role} className="h-8 w-32 text-[13px]"><option value="owner">{t("Owner")}</option><option value="manager">{t("Manager")}</option><option value="staff">{t("Staff")}</option></Select>
                      <SubmitButton size="sm" variant="ghost">{t("Update")}</SubmitButton>
                    </form>
                  ) : (
                    <span className="capitalize">{m.role}</span>
                  )}
                </Td>
                <Td>
                  {manage && (
                    <form action={updateMembership} className="flex justify-end">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="businessId" value={m.business.id} />
                      <input type="hidden" name="action" value="remove" />
                      <ConfirmSubmit variant="ghost" message={`Remove ${u.name} from ${m.business.name}?`}>{t("Remove")}</ConfirmSubmit>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          {memberships.length === 0 && <p className="px-5 py-4 text-[14px] text-muted">{t("Not a member of any business.")}</p>}
          {manage && (
            <ActionForm action={addMembership} className="flex flex-wrap items-end gap-2 border-t border-border p-5">
              <input type="hidden" name="userId" value={u.id} />
              <Field label={t("Add to business")} hint={t("slug or id")} className="min-w-56 flex-1"><Input name="business" required placeholder={t("atelier-nord")} /></Field>
              <Field label={t("Role")}><Select name="role" defaultValue="staff" className="w-36"><option value="owner">{t("Owner")}</option><option value="manager">{t("Manager")}</option><option value="staff">{t("Staff")}</option></Select></Field>
              <SubmitButton variant="secondary">{t("Add")}</SubmitButton>
            </ActionForm>
          )}
        </Card>

        {staff && (
          <Card className="h-fit">
            <CardHeader title={t("Platform access")} description={t("Staff roles give access to this admin. Changing it signs the user out.")} />
            <form action={setPlatformRole} className="flex flex-wrap items-end gap-2 p-5">
              <input type="hidden" name="userId" value={u.id} />
              <Select name="role" defaultValue={u.platformRole ?? ""} className="min-w-56 flex-1">
                <option value="">{t("No platform access")}</option>
                {PLATFORM_ROLES.map((r) => <option key={r} value={r}>{t(ROLE_INFO[r].label)}</option>)}
              </Select>
              <ConfirmSubmit variant="secondary" message={t("Change this user's platform access?")}>{t("Apply")}</ConfirmSubmit>
            </form>
          </Card>
        )}

        <Card className={staff ? "h-fit" : "lg:col-span-2"}>
          <CardHeader title={t("Recent activity")} />
          <ul className="divide-y divide-border text-[13px]">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 px-5 py-2.5">
                <span><code>{a.action}</code>{a.actorId !== id && a.actorType === "user" ? <span className="text-faint"> {t("· by staff")}</span> : null}</span>
                <span className="whitespace-nowrap text-faint">{fmtDate(a.createdAt)}</span>
              </li>
            ))}
            {activity.length === 0 && <li className="px-5 py-4 text-muted">{t("Nothing yet.")}</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
