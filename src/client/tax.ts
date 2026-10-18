/** Tramos de la base imponible del ahorro (IRPF España, vigentes desde 2025 — Ley 7/2024). */
export const SAVINGS_BRACKETS: { from: number; to: number | null; rate: number }[] = [
  { from: 0, to: 6000, rate: 19 },
  { from: 6000, to: 50000, rate: 21 },
  { from: 50000, to: 200000, rate: 23 },
  { from: 200000, to: 300000, rate: 27 },
  { from: 300000, to: null, rate: 30 },
];

const cents = (n: number) => Math.round(n * 100) / 100;

export type TaxBracket = { from: number; to: number | null; rate: number; base: number; tax: number };

/** Impuesto estimado si se reembolsa una ganancia patrimonial (sin compensar pérdidas de otros años). */
export function irpfSavingsTax(gain: number): { brackets: TaxBracket[]; total: number; effectiveRate: number } {
  if (!(gain > 0)) return { brackets: [], total: 0, effectiveRate: 0 };
  const brackets: TaxBracket[] = [];
  for (const b of SAVINGS_BRACKETS) {
    if (gain <= b.from) break;
    const base = cents(Math.min(gain, b.to ?? Infinity) - b.from);
    brackets.push({ ...b, base, tax: cents((base * b.rate) / 100) });
  }
  const total = cents(brackets.reduce((s, b) => s + b.tax, 0));
  return { brackets, total, effectiveRate: cents((total / gain) * 100) };
}
