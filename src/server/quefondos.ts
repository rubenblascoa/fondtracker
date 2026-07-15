import type { YahooChartResult, YahooQuote } from "./yahoo";
import { queries } from "./db";
import { getFundExtraMetadata } from "./metadata";

// Helper to parse Spanish localized numbers like "283,805151" to 283.805151
function parseSpanishFloat(val: string): number {
  return parseFloat(val.replace(/\./g, "").replace(",", "."));
}

// Parse DD/MM/YYYY to a Date object
function parseSpanishDate(val: string): Date | null {
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// Count business days between two dates
function businessDaysDiff(d1: Date, d2: Date): number {
  let count = 0;
  const cur = new Date(d1);
  while (cur < d2) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function fetchQueFondosData(isin: string): Promise<YahooChartResult | null> {
  const url = `https://www.quefondos.com/es/fondos/ficha/index.html?isin=${isin}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Reject template pages (ISIN not found in QueFondos)
    if (html.includes("{ISIN}") || html.includes("{NFONDO}")) return null;

    // 1. Extract Current NAV (Valor Liquidativo)
    const navMatch = html.match(/Valor liquidativo:\s*<\/span>\s*<span[^>]*>\s*([\d,\.]+)\s*[A-Z]{3}/i);
    if (!navMatch) return null;

    const currentPrice = parseSpanishFloat(navMatch[1]);
    if (!isFinite(currentPrice) || currentPrice <= 0) return null;

    // 2. Extract NAV date from <span class="fecha">DD/MM/YYYY</span>
    //    or <span class="floatright">DD/MM/YYYY</span> near "Fecha:"
    let dataDate: string | null = null;
    const dateMatch = html.match(/<span class="fecha">(\d{2}\/\d{2}\/\d{4})<\/span>/);
    if (dateMatch) {
      dataDate = dateMatch[1];
    } else {
      const altMatch = html.match(/Fecha:\s*<\/span>\s*<span[^>]*>(\d{2}\/\d{2}\/\d{4})<\/span>/i);
      if (altMatch) dataDate = altMatch[1];
    }

    // 3. Check staleness — NAV older than 7 business days is suspicious
    let isStale = false;
    let staleWarning: string | null = null;
    if (dataDate) {
      const navDate = parseSpanishDate(dataDate);
      if (navDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = businessDaysDiff(navDate, today);
        if (diff > 7) {
          isStale = true;
          staleWarning = `Último dato: ${dataDate}`;
        }
      }
    }

    // 4. Extract 1 Year Return
    let return1Y = 0;
    const rent1YMatch = html.match(/1 a(?:&ntilde;|ñ)o(?:.|[\r\n])*?<span class="(?:mas|menos)">(-?[\d,\.]+)%<\/span>/i);
    if (rent1YMatch) {
      return1Y = parseSpanishFloat(rent1YMatch[1]);
    }

    // 5. Extract 3 Year Return
    let return3Y = 0;
    const rent3YMatch = html.match(/3 a(?:&ntilde;|ñ)os<\/td>\s*<td[^>]*><span class="(?:mas|menos)">(-?[\d,\.]+)%<\/span><\/td>/i);
    if (rent3YMatch) {
      return3Y = parseSpanishFloat(rent3YMatch[1]);
    }

    // 6. Extract 5 Year Return
    let return5Y = 0;
    const rent5YMatch = html.match(/5 a(?:&ntilde;|ñ)os<\/td>\s*<td[^>]*><span class="(?:mas|menos)">(-?[\d,\.]+)%<\/span><\/td>/i);
    if (rent5YMatch) {
      return5Y = parseSpanishFloat(rent5YMatch[1]);
    }

    // Lookup metadata
    const fundMeta = await queries.getFundCatalogByIsin(isin);
    const name = fundMeta?.name ?? isin;
    const currency = fundMeta?.currency ?? "EUR";

    // 7. Extract Real Monthly Historical Timeseries from the page (var fondo = [...])
    let quotes: YahooQuote[] = [];
    const fondoMatch = html.match(/var fondo\s*=\s*(\[\[[\s\S]*?\]\]);/);
    if (fondoMatch) {
      try {
        // Use JSON-like parser since it is a double array of strings/numbers
        const rawFondoData = JSON.parse(fondoMatch[1]);
        if (Array.isArray(rawFondoData) && rawFondoData.length > 0) {
          for (const item of rawFondoData) {
            if (Array.isArray(item) && item.length === 2) {
              const dateStr = String(item[0]);
              const price = Number(item[1]);
              const parts = dateStr.split("/");
              if (parts.length === 3 && !isNaN(price)) {
                // MM/DD/YYYY
                const date = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
                quotes.push({
                  timestamp: Math.floor(date.getTime() / 1000),
                  open: price,
                  high: price,
                  low: price,
                  close: price,
                  volume: 0,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing var fondo for ${isin}:`, err);
      }
    }

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

    return {
      symbol: isin,
      currency,
      name,
      currentPrice,
      previousClose: quotes.length > 1 ? quotes[quotes.length - 2].close : currentPrice,
      weekHigh52: Math.max(...quotes.map(q => q.close)),
      weekLow52: Math.min(...quotes.map(q => q.close)),
      dataPoints: quotes.length,
      quotes,
      dataDate: dataDate ?? undefined,
      isStale,
      staleWarning: staleWarning ?? undefined,
      dataSource: "quefondos",
      ...extra
    } as any;

  } catch (err) {
    console.error(`QueFondos error for ${isin}:`, err);
    return null;
  }
}
