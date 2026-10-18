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

/** Concentración de la cartera (índice Herfindahl-Hirschman sobre el peso de cada fondo, 0-10.000). */
export function concentration(funds: Investment[]): { hhi: number; label: "Sin fondos" | "Diversificada" | "Moderada" | "Concentrada" } {
  const values = funds.map(valueOf);
  const total = values.reduce((s, v) => s + v, 0);
  if (total <= 0) return { hhi: 0, label: "Sin fondos" };
  const hhi = Math.round(values.reduce((s, v) => s + ((v / total) * 100) ** 2, 0));
  return { hhi, label: hhi > 2500 ? "Concentrada" : hhi >= 1500 ? "Moderada" : "Diversificada" };
}

export type RebalanceItem = {
  id: number;
  name: string;
  currentValue: number;
  currentPct: number;
  targetPct: number;
  targetValue: number;
  deltaEur: number;
  action: "Comprar" | "Vender" | "Mantener";
};

/**
 * Cuánto comprar o vender de cada fondo para llegar a los pesos objetivo (en %),
 * contando con una aportación extra opcional. Sin objetivo para un fondo → partes iguales.
 */
export function rebalancePlan(funds: Investment[], targets: Record<number, number>, extra: number): RebalanceItem[] {
  const current = funds.map(valueOf);
  const total = current.reduce((s, v) => s + v, 0);
  const newTotal = total + (extra > 0 ? extra : 0);
  if (newTotal <= 0) return [];
  return funds.map((f, i) => {
    const targetPct = targets[f.id] ?? 100 / funds.length;
    const targetValue = (targetPct / 100) * newTotal;
    const deltaEur = cents(targetValue - current[i]);
    return {
      id: f.id,
      name: f.name,
      currentValue: cents(current[i]),
      currentPct: total > 0 ? cents((current[i] / total) * 100) : 0,
      targetPct: cents(targetPct),
      targetValue: cents(targetValue),
      deltaEur,
      action: deltaEur > 5 ? "Comprar" : deltaEur < -5 ? "Vender" : "Mantener",
    };
  });
}
