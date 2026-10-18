/** Número escrito a la española ("1.000,50") o con punto decimal ("1000.50"). NaN si no es válido. */
export function parseEsNumber(text: string): number {
  const t = text.trim().replace(/\s/g, "");
  if (!t) return NaN;
  const normalized = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

export type StatementPurchase = { ok: true; shares: number; amount: number; price: number } | { ok: false; error: string };

/**
 * Lo que viene en el extracto del banco: participaciones e importe invertido.
 * El precio de compra se deriva (6 decimales) en vez de adivinarlo con datos históricos.
 */
export function purchaseFromStatement(sharesText: string, amountText: string): StatementPurchase {
  const shares = parseEsNumber(sharesText);
  if (!Number.isFinite(shares) || shares <= 0) return { ok: false, error: "Indica las participaciones (mayor que cero)" };
  const amount = parseEsNumber(amountText);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Indica el importe invertido (mayor que cero)" };
  return { ok: true, shares, amount, price: Math.round((amount / shares) * 1e6) / 1e6 };
}

const isoDay = (ts: number) => {
  const d = new Date(ts * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Precio publicado más cercano a la fecha de compra, solo como referencia.
 * gapPct = diferencia (en %, valor absoluto) entre el precio calculado y la referencia; warn si > 2 %.
 */
export function referencePrice(
  quotes: { timestamp: number; close: number }[],
  dateIso: string,
  computedPrice: number,
): { price: number; date: string; gapPct: number; warn: boolean } | null {
  if (!quotes.length || !dateIso || !(computedPrice > 0)) return null;
  const target = new Date(dateIso + "T00:00:00").getTime() / 1000;
  let best = quotes[0];
  for (const q of quotes) if (Math.abs(q.timestamp - target) < Math.abs(best.timestamp - target)) best = q;
  if (!(best.close > 0)) return null;
  const gapPct = Math.round(Math.abs((computedPrice - best.close) / best.close) * 10000) / 100 || 0;
  return { price: best.close, date: isoDay(best.timestamp), gapPct, warn: gapPct > 2 };
}
