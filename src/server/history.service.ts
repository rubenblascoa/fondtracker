import { queries } from "./db";
import { computePortfolioTotals, listInvestments } from "./sentinel";
import { fetchYahooChart, type YahooQuote } from "./yahoo";
import { mergeHistory, reconstructHistory, type HistoryPoint, type HistorySource } from "./history";

export type HistoryRange = "1m" | "3m" | "6m" | "1y" | "max";
export const HISTORY_RANGES: HistoryRange[] = ["1m", "3m", "6m", "1y", "max"];

const today = () => new Date().toISOString().slice(0, 10);

function rangeStart(range: HistoryRange): Date {
  const d = new Date();
  if (range === "1m") d.setMonth(d.getMonth() - 1);
  else if (range === "3m") d.setMonth(d.getMonth() - 3);
  else if (range === "6m") d.setMonth(d.getMonth() - 6);
  else if (range === "1y") d.setFullYear(d.getFullYear() - 1);
  else return new Date("1970-01-01T00:00:00Z");
  return d;
}

export async function getPortfolioHistory(userId: number, range: HistoryRange): Promise<{ points: HistoryPoint[]; source: HistorySource }> {
  const from = rangeStart(range);
  const investments = await listInvestments(userId);
  if (investments.length === 0) return { points: [], source: "snapshots" };

  const quotesByIsin = new Map<string, YahooQuote[]>();
  await Promise.all(
    [...new Set(investments.map((i) => i.isin))].map(async (isin) => {
      const ticker = investments.find((i) => i.isin === isin)?.ticker ?? isin;
      const chart = await fetchYahooChart(ticker, "max").catch(() => null);
      if (chart?.quotes?.length) quotesByIsin.set(isin, chart.quotes);
    }),
  );

  const reconstructed = reconstructHistory(investments, quotesByIsin, from, new Date());
  const snapshots = (await queries.listSnapshots(userId, from.toISOString().slice(0, 10))).map((s) => ({
    date: s.snap_date,
    invested: s.invested,
    value: s.value,
  }));
  const totals = computePortfolioTotals(investments);
  const live = { date: today(), invested: Math.round(totals.total_initial * 100) / 100, value: Math.round(totals.total_current * 100) / 100 };
  return mergeHistory(reconstructed, snapshots, live);
}

let lastSnapshotDay: string | null = null;

/** Guarda la foto del día de cada usuario con cartera. Idempotente: una vez por día. */
export async function takeDailySnapshots(): Promise<number> {
  const day = today();
  if (lastSnapshotDay === day) return 0;
  let saved = 0;
  for (const userId of await queries.getAllUserIds()) {
    try {
      const investments = await listInvestments(userId);
      if (investments.length === 0) continue;
      const t = computePortfolioTotals(investments);
      await queries.upsertSnapshot(userId, day, Math.round(t.total_initial * 100) / 100, Math.round(t.total_current * 100) / 100);
      saved++;
    } catch (err) {
      console.warn(`[history] foto diaria fallida para usuario ${userId}:`, (err as Error).message);
    }
  }
  lastSnapshotDay = day;
  return saved;
}
