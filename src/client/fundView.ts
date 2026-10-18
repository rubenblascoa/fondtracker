import type { Investment } from "./api";
import { formatEur, formatPct } from "./utils";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const STALE_DAYS = 6;

export type FundView = {
  hasPrice: boolean;
  priceLabel: string;
  value: number;
  invested: number;
  plLabel: string | null;
  plPctLabel: string | null;
  plPositive: boolean | null;
  /** "14 oct", "guardado" (precio de caché sin fecha) o null */
  navDateLabel: string | null;
  stale: boolean;
};

/** Todo lo que la interfaz enseña de un fondo sale de aquí (nada de cálculos en componentes). */
export function fundView(fund: Investment, now: Date = new Date()): FundView {
  const invested = fund.total_invested || fund.shares * fund.purchase_price;
  const hasPrice = fund.current_price != null && Number.isFinite(Number(fund.current_price)) && Number(fund.current_price) > 0;

  if (!hasPrice) {
    return { hasPrice, priceLabel: "Sin precio", value: invested, invested, plLabel: null, plPctLabel: null, plPositive: null, navDateLabel: null, stale: false };
  }

  const price = Number(fund.current_price);
  const value = price * fund.shares;
  const pl = Math.round((value - invested) * 100) / 100;
  const pct = invested > 0 ? (pl / invested) * 100 : 0;

  let navDateLabel: string | null = null;
  let stale = false;
  if (fund.price_date && /^\d{4}-\d{2}-\d{2}$/.test(fund.price_date)) {
    const [y, m, d] = fund.price_date.split("-").map(Number);
    navDateLabel = `${d} ${MONTHS[m - 1]}`;
    const ageDays = (now.getTime() - Date.UTC(y, m - 1, d)) / 86_400_000;
    stale = ageDays > STALE_DAYS + 1;
  } else if (fund.price_source === "cache") {
    navDateLabel = "guardado";
  }

  return {
    hasPrice,
    priceLabel: formatEur(price, 4),
    value,
    invested,
    plLabel: `${pl > 0 ? "+" : ""}${formatEur(pl)}`,
    plPctLabel: formatPct(pct),
    plPositive: pl >= 0,
    navDateLabel,
    stale,
  };
}

export type ChartRange = { label: string; value: "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max" };

/** Rangos de gráfico coherentes con la granularidad del dato (QueFondos es mensual). */
export function chartRangesFor(source: string | undefined | null): ChartRange[] {
  const long: ChartRange[] = [
    { label: "6M", value: "6mo" },
    { label: "1A", value: "1y" },
    { label: "2A", value: "2y" },
    { label: "5A", value: "5y" },
    { label: "Máx", value: "max" },
  ];
  if (source === "quefondos") return long;
  return [{ label: "1M", value: "1mo" }, { label: "3M", value: "3mo" }, ...long];
}
