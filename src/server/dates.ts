/** Normaliza fechas de las fuentes de precios a YYYY-MM-DD (o null si no se reconoce). */
export function toIsoDate(value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? new Date(value * 1000).toISOString().slice(0, 10) : null;
  const es = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (es) return `${es[3]}-${es[2]}-${es[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return null;
}
