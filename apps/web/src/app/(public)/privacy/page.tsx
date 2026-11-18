import { getT, tSync } from "@/i18n/server";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("Privacy") };
}

export default function Privacy() {
  const t = tSync();
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 text-[15px] leading-relaxed sm:px-6">
      <h1 className="text-[30px] font-semibold tracking-tight">{t("Privacy notice")}</h1>
      <p className="mt-4 text-muted">{t("How customer data is handled when you book or chat with a business on AIBA.")}</p>
      <h2 className="mt-8 font-semibold">{t("Who is responsible")}</h2>
      <p className="mt-2 text-muted">{t("The business you book with is the data controller for your booking and conversations. AIBA processes that data on its behalf to run the booking page, the AI assistant and reminders.")}</p>
      <h2 className="mt-6 font-semibold">{t("What we process")}</h2>
      <p className="mt-2 text-muted">{t("Your name and contact details, your bookings, and messages you exchange with the business or its AI assistant. The assistant may remember preferences you share (for example a preferred stylist) to serve you better. Each business's data is isolated: no other business can see it.")}</p>
      <h2 className="mt-6 font-semibold">{t("AI assistant")}</h2>
      <p className="mt-2 text-muted">{t("Messages to a business's assistant are processed by an AI model to generate replies. Sensitive requests are handed to a human. You can always ask to speak to a person.")}</p>
      <h2 className="mt-6 font-semibold">{t("Your rights")}</h2>
      <p className="mt-2 text-muted">{t("You can ask the business to access, export, correct or erase your data at any time. Businesses can export or erase a customer's data in one click from their workspace.")}</p>
      <h2 className="mt-6 font-semibold">{t("Retention")}</h2>
      <p className="mt-2 text-muted">{t("Booking records are kept as long as the business needs them for its accounts; erased customers' bookings are kept only in anonymised form.")}</p>
    </main>
  );
}
