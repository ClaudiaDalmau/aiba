// Common formatters used across the dashboard
export const fmtEur = (n: number | null | undefined) => {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};

export const fmtInt = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-ES");
};

export const fmtPct = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(1)}%`;
};

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

/** Format a duration expressed in minutes as "Xh", "Xh Ymin" or "Ymin" for < 1 hour. */
export const fmtDuration = (min: number | null | undefined): string => {
  if (min === null || min === undefined || Number.isNaN(min)) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h}h ${m}min`;
};

/** Compact hour representation (decimals) — for grid cells, e.g. "1.5h" */
export const fmtHoursCompact = (min: number | null | undefined): string => {
  if (min === null || min === undefined) return "—";
  return `${(min / 60).toFixed(min % 60 === 0 ? 0 : 2).replace(/\.?0+$/, "")} h`;
};
