import type { PortfolioHistoryPoint, Transaction } from "./api";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const cents = (n: number) => Math.round(n * 100) / 100;

export function greeting(hour: number): string {
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Resultado de cada mes: cuánto ha cambiado el valor de la cartera descontando lo que se aportó
 * (o retiró) ese mes. Se compara el último punto de cada mes con el último del mes anterior;
 * el primer mes, con su primer punto.
 */
export function monthlyResults(points: PortfolioHistoryPoint[], months = 8): { month: string; label: string; result: number }[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const lastOfMonth = new Map<string, PortfolioHistoryPoint>();
  for (const pt of sorted) lastOfMonth.set(pt.date.slice(0, 7), pt);
  const out: { month: string; label: string; result: number }[] = [];
  let prev: PortfolioHistoryPoint | undefined = sorted[0];
  for (const [month, end] of lastOfMonth) {
    if (!prev) break;
    const result = end.value - prev.value - (end.invested - prev.invested);
    out.push({ month, label: MONTHS[Number(month.slice(5, 7)) - 1], result: cents(result) });
    prev = end;
  }
  return out.slice(-months);
}

/** Cambio entre los dos últimos puntos del historial, sin contar aportaciones. */
export function lastChange(points: PortfolioHistoryPoint[]): { date: string; since: string; change: number; pct: number } | null {
  if (points.length < 2) return null;
  const [a, b] = [...points].sort((x, y) => x.date.localeCompare(y.date)).slice(-2);
  const change = cents(b.value - a.value - (b.invested - a.invested));
  return { date: b.date, since: a.date, change, pct: a.value > 0 ? cents((change / a.value) * 100) : 0 };
}

export type Movement = Transaction & { fundId: number; fundName: string };

/** Movimientos de todos los fondos, del más reciente al más antiguo. */
export function recentMovements(
  byFund: { fund: { id: number; name: string }; transactions: Transaction[] }[],
  limit = 6,
): Movement[] {
  return byFund
    .flatMap(({ fund, transactions }) => transactions.map((t) => ({ ...t, fundId: fund.id, fundName: fund.name })))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, limit);
}
