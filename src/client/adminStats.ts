/** Capital invertido acumulado por día (suma de altas de fondos hasta cada fecha), últimos `days` días. */
export function investedOverTime(
  raw: { date: string | Date; amount: number }[],
  days: number,
  today: Date = new Date(),
): { date: string; value: number }[] {
  const entries = raw.map((r) => ({ day: new Date(r.date).toISOString().slice(0, 10), amount: Number(r.amount) || 0 }));
  const out: { date: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    const total = entries.reduce((s, e) => (e.day <= day ? s + e.amount : s), 0);
    out.push({ date: day, value: Math.round(total * 100) / 100 });
  }
  return out;
}
