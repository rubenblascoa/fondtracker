import type { Investment } from "./api";

const cents = (n: number) => Math.round(n * 100) / 100;
const investedOf = (f: Investment) => f.total_invested || f.shares * f.purchase_price;
const hasPrice = (f: Investment) => f.current_price != null && Number(f.current_price) > 0;
/** Valor actual; si el fondo no tiene precio, cuenta lo invertido. */
const valueOf = (f: Investment) => (hasPrice(f) ? Number(f.current_price) * f.shares : investedOf(f));

/** Reparto del valor actual por entidad o por categoría, de mayor a menor. pct con 2 decimales. */
export function allocationBy(funds: Investment[], key: "bank" | "category"): { name: string; value: number; pct: number }[] {
  const map = new Map<string, number>();
  for (const f of funds) {
    const name = (f[key] || "").trim() || "Otros";
    map.set(name, (map.get(name) ?? 0) + valueOf(f));
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([name, value]) => ({ name, value: cents(value), pct: total > 0 ? cents((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export type Performer = { fund: Investment; pl: number; pct: number };

/** Mejor y peor fondo por rentabilidad %. Los fondos sin precio no compiten. */
export function performers(funds: Investment[]): { best: Performer | null; worst: Performer | null } {
  const ranked = funds
    .filter(hasPrice)
    .map((fund) => {
      const invested = investedOf(fund);
      const pl = cents(valueOf(fund) - invested);
      return { fund, pl, pct: invested > 0 ? ((valueOf(fund) - invested) / invested) * 100 : 0 };
    })
    .sort((a, b) => b.pct - a.pct);
  return { best: ranked[0] ?? null, worst: ranked.length > 1 ? ranked[ranked.length - 1] : null };
}
