import type { YahooChartResult, YahooQuote } from "./yahoo";
import { queries } from "./db";
import { getFundExtraMetadata } from "./metadata";
import { fetchFtDailyQuotes } from "./ft";

// Helper to parse Spanish localized numbers like "283,805151" to 283.805151
export function parseSpanishFloat(val: string): number {
  return parseFloat(val.replace(/\./g, "").replace(",", "."));
}

// Parse DD/MM/YYYY to a Date object
export function parseSpanishDate(val: string): Date | null {
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// Count business days between two dates
export function businessDaysDiff(d1: Date, d2: Date): number {
  let count = 0;
  const cur = new Date(d1);
  while (cur < d2) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export type QueFondosPage = {
  currentPrice: number | null;
  /** DD/MM/YYYY tal cual lo publica QueFondos */
  dataDate: string | null;
  return1Y: number;
  return3Y: number;
  return5Y: number;
  /** Serie mensual real de la ficha (var fondo = [[MM/DD/YYYY, precio], ...]) */
  historicalQuotes: YahooQuote[];
};

/**
 * Rentabilidades a 1, 3 y 5 años. La ficha actual las publica en la fila «Fondo» de la tabla
 * de rentabilidades (<tr id="rXm_row">: 1 mes, 3 meses, 1 año, 3 años, 5 años). Si la ficha
 * no trae esa fila, se prueba el formato antiguo (etiqueta en una celda y % en la siguiente).
 * Las que no se publican (fondo reciente, «-») quedan en 0.
 */
function extractReturns(html: string): { return1Y: number; return3Y: number; return5Y: number } {
  const toPct = (cell: string | undefined) => {
    const m = cell?.match(/(-?[\d.,]+)\s*%/);
    const v = m ? parseSpanishFloat(m[1]) : NaN;
    return Number.isFinite(v) ? v : 0;
  };

  const row = html.match(/<tr[^>]*id="rXm_row"[^>]*>([\s\S]*?)<\/tr>/i);
  if (row) {
    const cells = [...row[1].matchAll(/<td(?![^>]*class="label")[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length >= 5) return { return1Y: toPct(cells[2]), return3Y: toPct(cells[3]), return5Y: toPct(cells[4]) };
  }

  const legacy = (years: string) =>
    toPct(html.match(new RegExp(`${years} a(?:&ntilde;|ñ)os?<\\/td>\\s*<td[^>]*>\\s*<span class="(?:mas|menos)">(-?[\\d,.]+%)<\\/span>`, "i"))?.[1]);
  return { return1Y: legacy("1"), return3Y: legacy("3"), return5Y: legacy("5") };
}

/** Extrae NAV, fecha, rentabilidades y serie histórica de una ficha de QueFondos. Sin red: testeable. */
export function extractQueFondosHtml(html: string): QueFondosPage {
  const empty: QueFondosPage = { currentPrice: null, dataDate: null, return1Y: 0, return3Y: 0, return5Y: 0, historicalQuotes: [] };
  // Página plantilla (ISIN no encontrado)
  if (html.includes("{ISIN}") || html.includes("{NFONDO}")) return empty;

  const navMatch = html.match(/Valor liquidativo:\s*<\/span>\s*<span[^>]*>\s*([\d,\.]+)\s*[A-Z]{3}/i);
  if (!navMatch) return empty;
  const currentPrice = parseSpanishFloat(navMatch[1]);
  if (!isFinite(currentPrice) || currentPrice <= 0) return empty;

  let dataDate: string | null = null;
  const dateMatch = html.match(/<span class="fecha">(\d{2}\/\d{2}\/\d{4})<\/span>/);
  if (dateMatch) dataDate = dateMatch[1];
  else {
    const altMatch = html.match(/Fecha:\s*<\/span>\s*<span[^>]*>(\d{2}\/\d{2}\/\d{4})<\/span>/i);
    if (altMatch) dataDate = altMatch[1];
  }

  const { return1Y, return3Y, return5Y } = extractReturns(html);

  const historicalQuotes: YahooQuote[] = [];
  const fondoMatch = html.match(/var fondo\s*=\s*(\[\[[\s\S]*?\]\]);/);
  if (fondoMatch) {
    try {
      const raw = JSON.parse(fondoMatch[1]);
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (!Array.isArray(item) || item.length !== 2) continue;
          const parts = String(item[0]).split("/"); // MM/DD/YYYY
          const price = Number(item[1]);
          if (parts.length !== 3 || isNaN(price)) continue;
          const date = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
          historicalQuotes.push({ timestamp: Math.floor(date.getTime() / 1000), open: price, high: price, low: price, close: price, volume: 0 });
        }
      }
    } catch {
      // Serie ilegible: se sigue con el NAV actual
    }
  }
  historicalQuotes.sort((a, b) => a.timestamp - b.timestamp);

  // La serie fecha el último NAV con el día en que se publicó (p. ej. 15/10 para el NAV del 14/10).
  // Si ese punto es el valor liquidativo vigente, se le pone la fecha oficial de la ficha.
  const last = historicalQuotes[historicalQuotes.length - 1];
  const official = dataDate ? parseSpanishDate(dataDate) : null;
  if (last && official && Math.abs(last.close - currentPrice) < 1e-9) {
    const ts = Math.floor(official.getTime() / 1000);
    if (ts < last.timestamp) last.timestamp = ts;
  }
  return { currentPrice, dataDate, return1Y, return3Y, return5Y, historicalQuotes };
}

// Día (YYYY-MM-DD) de una cotización: igual que en history.ts, +6 h acierta tanto con la
// medianoche de Madrid (QueFondos) como con la medianoche UTC (FT).
const quoteDay = (q: YahooQuote) => new Date((q.timestamp + 6 * 3600) * 1000).toISOString().slice(0, 10);

/**
 * Une la serie mensual de QueFondos con la diaria del FT: lo mensual solo antes de que empiece
 * lo diario. El último punto de QueFondos (el NAV vigente, con 6 decimales) manda sobre el
 * cierre redondeado del FT de ese mismo día, y se añade si el FT aún no lo tiene.
 */
export function mergeDailyQuotes(monthly: YahooQuote[], daily: YahooQuote[]): YahooQuote[] {
  if (daily.length === 0) return monthly;
  const firstDaily = quoteDay(daily[0]);
  const merged = [...monthly.filter((q) => quoteDay(q) < firstDaily), ...daily];
  const latest = monthly[monthly.length - 1];
  if (latest) {
    const latestDay = quoteDay(latest);
    const i = merged.findIndex((q) => quoteDay(q) === latestDay);
    if (i >= 0) merged[i] = { ...merged[i], open: latest.close, high: latest.close, low: latest.close, close: latest.close };
    else if (latestDay > quoteDay(merged[merged.length - 1])) merged.push(latest);
  }
  return merged;
}

/** Máximo y mínimo del último año de la serie (hasta su último punto). */
export function lastYearRange(quotes: YahooQuote[]): { high: number; low: number } {
  const last = quotes[quotes.length - 1];
  if (!last) return { high: 0, low: 0 };
  const yearAgo = last.timestamp - 365 * 24 * 3600;
  const closes = quotes.filter((q) => q.timestamp >= yearAgo).map((q) => q.close);
  return { high: Math.max(...closes), low: Math.min(...closes) };
}

// In-memory cache for QueFondos scraping results (5 minutes TTL)
const qfCache = new Map<string, { data: YahooChartResult | null; fetchedAt: number }>();
const QF_CACHE_TTL = 5 * 60 * 1000;

// Request coalescing map for active scraping promises
const activeScrapes = new Map<string, Promise<YahooChartResult | null>>();

export async function fetchQueFondosData(isin: string): Promise<YahooChartResult | null> {
  const cleanIsin = isin.toUpperCase().trim();
  
  // 1. Check in-memory cache
  const cached = qfCache.get(cleanIsin);
  if (cached && Date.now() - cached.fetchedAt < QF_CACHE_TTL) {
    return cached.data;
  }

  // 2. Check active scrapes (coalescing concurrent requests)
  const active = activeScrapes.get(cleanIsin);
  if (active) return active;

  // 3. Initiate fetch and scrape
  const promise = (async () => {
    // Catálogo y valores diarios del FT en paralelo con la ficha (si el FT falla, queda lo mensual)
    const metaPromise = queries.getFundCatalogByIsin(cleanIsin).catch(() => null);
    const dailyPromise = metaPromise
      .then((m) => fetchFtDailyQuotes(cleanIsin, m?.currency ?? "EUR"))
      .catch(() => [] as YahooQuote[]);
    const url = `https://www.quefondos.com/es/fondos/ficha/index.html?isin=${cleanIsin}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) return null;

      const html = await res.text();

      const page = extractQueFondosHtml(html);
      if (page.currentPrice == null) return null;
      const currentPrice = page.currentPrice;
      const dataDate = page.dataDate;
      const { return1Y, return3Y, return5Y } = page;

      // NAV de más de 7 días hábiles: sospechoso
      let isStale = false;
      let staleWarning: string | null = null;
      if (dataDate) {
        const navDate = parseSpanishDate(dataDate);
        if (navDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (businessDaysDiff(navDate, today) > 7) {
            isStale = true;
            staleWarning = `Último dato: ${dataDate}`;
          }
        }
      }

    // Lookup metadata
    const fundMeta = await metaPromise;
    const name = fundMeta?.name ?? isin;
    const currency = fundMeta?.currency ?? "EUR";

    let quotes: YahooQuote[] = mergeDailyQuotes(page.historicalQuotes, await dailyPromise);

    // Fallback: If no real historical series was parsed, synthesize one
    if (quotes.length === 0) {
      const now = dataDate ? (parseSpanishDate(dataDate) ?? new Date()) : new Date();
      
      const addPoint = (yearsAgo: number, returnPct: number) => {
        const date = new Date(now);
        date.setFullYear(date.getFullYear() - yearsAgo);
        const timestamp = Math.floor(date.getTime() / 1000);
        const pastPrice = currentPrice / (1 + returnPct / 100);
        quotes.push({ timestamp, open: pastPrice, high: pastPrice, low: pastPrice, close: pastPrice, volume: 0 });
      };

      if (return5Y) addPoint(5, return5Y);
      if (return3Y) addPoint(3, return3Y);
      if (return1Y) addPoint(1, return1Y);

      // If still empty, add a default anchor point 1 year ago
      if (quotes.length === 0) {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        quotes.push({
          timestamp: Math.floor(oneYearAgo.getTime() / 1000),
          open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice, volume: 0,
        });
      }

      // Add current price point
      quotes.push({
        timestamp: Math.floor(now.getTime() / 1000),
        open: currentPrice, high: currentPrice, low: currentPrice, close: currentPrice, volume: 0,
      });
    }

    // Sort quotes chronologically by timestamp
    quotes.sort((a, b) => a.timestamp - b.timestamp);

    const extra = getFundExtraMetadata(isin, fundMeta?.category ?? "", name, {
      r1Y: return1Y,
      r3Y: return3Y,
      r5Y: return5Y
    });

    const result = {
      symbol: cleanIsin,
      currency,
      name,
      currentPrice,
      previousClose: quotes.length > 1 ? quotes[quotes.length - 2].close : currentPrice,
      weekHigh52: lastYearRange(quotes).high,
      weekLow52: lastYearRange(quotes).low,
      dataPoints: quotes.length,
      quotes,
      dataDate: dataDate ?? undefined,
      isStale,
      staleWarning: staleWarning ?? undefined,
      dataSource: "quefondos",
      ...extra
    } as any;

    return result;

  } catch (err) {
    console.error(`QueFondos error for ${cleanIsin}:`, err);
    return null;
  }
  })();

  activeScrapes.set(cleanIsin, promise);

  try {
    const res = await promise;
    qfCache.set(cleanIsin, { data: res, fetchedAt: Date.now() });
    return res;
  } finally {
    activeScrapes.delete(cleanIsin);
  }
}
