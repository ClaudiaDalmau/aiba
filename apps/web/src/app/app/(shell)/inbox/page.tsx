import { getT } from "@/i18n/server";
import { Empty } from "@/components/ui";

export default async function InboxIndex() {
  const t = await getT();
  return (
    <div className="hidden flex-1 place-items-center lg:grid">
      <Empty icon="chat" title={t("Select a conversation")}>{t("Your agent handles routine questions. Anything it escalates is highlighted on the left.")}</Empty>
    </div>
  );
}
