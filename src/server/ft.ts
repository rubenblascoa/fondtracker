import type { YahooQuote } from "./yahoo";

// Histórico diario de valores liquidativos del Financial Times (markets.ft.com).
// QueFondos solo publica un punto al mes; el FT da todos los días hábiles, con 2 decimales.
const FT_BASE = "https://markets.ft.com/data";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

/** Identificador interno del FT (xid) que trae la ficha histórica de un fondo. */
export function parseFtSymbolId(html: string): string | null {
  return html.match(/&quot;inception&quot;:&quot;[^&]*&quot;,&quot;symbol&quot;:&quot;(\d+)&quot;/)?.[1] ?? null;
}

/**
 * Filas de la tabla histórica del FT → cotizaciones ordenadas por fecha.
 * Cada fila: fecha («Wednesday, October 14, 2026»), apertura, máximo, mínimo, cierre y volumen.
 * La fecha se guarda a medianoche UTC, que cae en el mismo día en España.
 */
export function parseFtHistoricalHtml(html: string): YahooQuote[] {
  const quotes: YahooQuote[] = [];
  for (const row of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const date = row[1].match(/mod-ui-hide-small-below">[A-Za-z]+, ([A-Za-z]+) (\d{1,2}), (\d{4})</);
    const cells = [...row[1].matchAll(/<td>([^<]*)<\/td>/g)].map((c) => c[1]);
    if (!date || cells.length < 4 || MONTHS[date[1]] === undefined) continue;
    const close = Number(cells[3].replace(/,/g, ""));
    if (!Number.isFinite(close) || close <= 0) continue;
    const timestamp = Date.UTC(Number(date[3]), MONTHS[date[1]], Number(date[2])) / 1000;
    quotes.push({ timestamp, open: close, high: close, low: close, close, volume: 0 });
  }
  return quotes.sort((a, b) => a.timestamp - b.timestamp);
}

const ymd = (d: Date) => `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;

// El identificador del FT no cambia; el histórico, una vez al día.
const symbolCache = new Map<string, string | null>();
const dailyCache = new Map<string, { quotes: YahooQuote[]; fetchedAt: number }>();
const DAILY_TTL = 6 * 60 * 60 * 1000;
const active = new Map<string, Promise<YahooQuote[]>>();

async function ftText(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function ftSymbolId(isin: string, currency: string): Promise<string | null> {
  const key = `${isin}:${currency}`;
  if (symbolCache.has(key)) return symbolCache.get(key)!;
  const html = await ftText(`${FT_BASE}/funds/tearsheet/historical?s=${encodeURIComponent(key)}`, 8_000);
  if (html == null) return null; // error de red: no se guarda, se reintentará
  const id = parseFtSymbolId(html);
  symbolCache.set(key, id);
  return id;
}

/** Valores liquidativos diarios de los últimos 2 años. Lista vacía si el FT no tiene el fondo o falla. */
export async function fetchFtDailyQuotes(isin: string, currency = "EUR"): Promise<YahooQuote[]> {
  const key = `${isin.toUpperCase().trim()}:${currency}`;
  const cached = dailyCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < DAILY_TTL) return cached.quotes;
  const running = active.get(key);
  if (running) return running;

  const promise = (async () => {
    const id = await ftSymbolId(isin.toUpperCase().trim(), currency);
    if (!id) return [];
    const end = new Date();
    const start = new Date(end);
    start.setUTCFullYear(start.getUTCFullYear() - 2);
    const body = await ftText(`${FT_BASE}/equities/ajax/get-historical-prices?startDate=${ymd(start)}&endDate=${ymd(end)}&symbol=${id}`, 10_000);
    if (body == null) return [];
    try {
      const quotes = parseFtHistoricalHtml(JSON.parse(body).html ?? "");
      dailyCache.set(key, { quotes, fetchedAt: Date.now() });
      return quotes;
    } catch {
      return [];
    }
  })();

  active.set(key, promise);
  try {
    return await promise;
  } finally {
    active.delete(key);
  }
}
