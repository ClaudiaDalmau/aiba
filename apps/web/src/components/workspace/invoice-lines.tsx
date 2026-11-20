"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { Icon } from "../icons";
import { Input } from "../ui";

type Line = { description: string; quantity: number; price: string; tax: number };

/** Editable invoice lines with live totals. Prices are entered before tax. */
export function InvoiceLines({ initial, currency, locale }: { initial: Line[]; currency: string; locale: string }) {
  const t = useT();
  const [lines, setLines] = useState<Line[]>(initial.length ? initial : [{ description: "", quantity: 1, price: "", tax: 0 }]);
  const money = (c: number) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(c / 100);
  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  let sub = 0;
  let tax = 0;
  for (const l of lines) {
    const base = Math.round((Number(l.quantity) || 0) * Math.round((Number(String(l.price).replace(",", ".")) || 0) * 100));
    sub += base;
    tax += Math.round((base * (Number(l.tax) || 0)) / 100);
  }
  return (
    <div>
      <div className="hidden grid-cols-[1fr_70px_110px_80px_32px] gap-2 px-1 pb-1 text-[12px] font-medium text-muted sm:grid">
        <span>{t("Description")}</span><span>{t("Qty")}</span><span>{t("Unit price (before tax)")}</span><span>{t("Tax %")}</span><span />
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px] gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_70px_110px_80px_32px] sm:border-0 sm:p-0">
            <Input name="lineDescription" value={l.description} onChange={(e) => set(i, { description: e.target.value })} placeholder={t("Description")} required className="col-span-2 sm:col-span-1" />
            <Input name="lineQuantity" type="number" min={0} step="0.01" value={l.quantity} onChange={(e) => set(i, { quantity: Number(e.target.value) })} aria-label={t("Qty")} />
            <Input name="linePrice" type="number" min={0} step="0.01" value={l.price} onChange={(e) => set(i, { price: e.target.value })} aria-label={t("Unit price (before tax)")} placeholder="0.00" required />
            <Input name="lineTax" type="number" min={0} max={100} step="0.01" value={l.tax} onChange={(e) => set(i, { tax: Number(e.target.value) })} aria-label={t("Tax %")} />
            <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))} className="grid place-items-center rounded-md text-faint hover:bg-subtle hover:text-bad" aria-label={t("Remove line")}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setLines((ls) => [...ls, { description: "", quantity: 1, price: "", tax: ls[ls.length - 1]?.tax ?? 0 }])} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-ai hover:underline">
        <Icon name="plus" size={14} /> {t("Add line")}
      </button>
      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-[14px]">
        <div className="flex justify-between"><dt className="text-muted">{t("Subtotal")}</dt><dd className="tabular-nums">{money(sub)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{t("Tax")}</dt><dd className="tabular-nums">{money(tax)}</dd></div>
        <div className="flex justify-between border-t border-border pt-1 font-semibold"><dt>{t("Total")}</dt><dd className="tabular-nums">{money(sub + tax)}</dd></div>
      </dl>
    </div>
  );
}
