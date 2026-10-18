import type { InvestmentRow } from "./db";
import type { YahooQuote } from "./yahoo";

export type HistoryPoint = { date: string; invested: number; value: number };

const cents = (n: number) => Math.round(n * 100) / 100;
// QueFondos fecha a medianoche de Madrid (22:00/23:00 UTC del día anterior) y Yahoo a la hora
// de apertura del mercado (hasta ~14:30 UTC). Sumar 6 h antes de tomar el día UTC acierta en ambos.
const SIX_HOURS = 6 * 3600;
const dayOf = (q: YahooQuote) => new Date((q.timestamp + SIX_HOURS) * 1000).toISOString().slice(0, 10);

export type HistorySource = "snapshots" | "reconstructed" | "mixed";

/**
 * Une la historia: lo reconstruido solo cubre hasta la primera foto diaria guardada;
 * desde ahí mandan las fotos. El punto en vivo (hoy) sustituye a una foto del mismo día.
 */
export function mergeHistory(
  reconstructed: HistoryPoint[],
  snapshots: HistoryPoint[],
  live: HistoryPoint | null,
): { points: HistoryPoint[]; source: HistorySource } {
  const snaps = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const firstSnap = snaps[0]?.date;
  const recUsed = firstSnap ? reconstructed.filter((p) => p.date < firstSnap) : reconstructed;
  const byDate = new Map<string, HistoryPoint>();
  for (const p of [...recUsed, ...snaps]) byDate.set(p.date, p);
  if (live) byDate.set(live.date, live);
  const points = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const source: HistorySource = snaps.length === 0 ? (recUsed.length > 0 ? "reconstructed" : "snapshots") : recUsed.length > 0 ? "mixed" : "snapshots";
  return { points, source };
}

/**
 * Reconstruye la evolución de la cartera con los precios históricos disponibles.
 * En cada fecha con cotización suma solo las inversiones ya compradas (purchase_date <= fecha),
 * valorando cada una con su último precio conocido hasta esa fecha (o el de compra si aún no hay).
 */
export function reconstructHistory(
  investments: InvestmentRow[],
  quotesByIsin: Map<string, YahooQuote[]>,
  from: Date,
  to: Date,
): HistoryPoint[] {
  if (investments.length === 0) return [];
  const fromDay = from.toISOString().slice(0, 10);
  const toDay = to.toISOString().slice(0, 10);

  // Serie ordenada (fecha, cierre) por ISIN
  const series = new Map<string, { date: string; close: number }[]>();
  for (const [isin, quotes] of quotesByIsin) {
    series.set(
      isin,
      quotes
        .filter((q) => Number.isFinite(q.close) && q.close > 0)
        .map((q) => ({ date: dayOf(q), close: q.close }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    );
  }

  const isins = new Set(investments.map((i) => i.isin));
  const dates = new Set<string>();
  for (const isin of isins) for (const p of series.get(isin) ?? []) if (p.date >= fromDay && p.date <= toDay) dates.add(p.date);

  const priceAt = (isin: string, date: string): number | null => {
    let last: number | null = null;
    for (const p of series.get(isin) ?? []) {
      if (p.date > date) break;
      last = p.close;
    }
    return last;
  };

  const points: HistoryPoint[] = [];
  for (const date of [...dates].sort()) {
    const active = investments.filter((i) => String(i.purchase_date).slice(0, 10) <= date);
    if (active.length === 0) continue;
    let invested = 0;
    let value = 0;
    for (const inv of active) {
      const shares = Number(inv.shares);
      const cost = Number(inv.purchase_price);
      invested += shares * cost;
      value += shares * (priceAt(inv.isin, date) ?? cost);
    }
    points.push({ date, invested: cents(invested), value: cents(value) });
  }
  return points;
}
