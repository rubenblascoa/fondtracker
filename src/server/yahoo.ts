const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
import { fetchQueFondosData } from "./quefondos";
import { getFundExtraMetadata } from "./metadata";

export type YahooQuote = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type YahooChartResult = {
  symbol: string;
  currency: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  weekHigh52: number;
  weekLow52: number;
  dataPoints: number;
  quotes: YahooQuote[];
  /** ISO date string of last price (YYYY-MM-DD) */
  dataDate?: string;
  /** true if last price is older than 3 business days */
  isStale?: boolean;
  /** human-readable staleness warning */
  staleWarning?: string;
  /** where the data came from */
  dataSource?: "yahoo" | "quefondos";
  /** verification details across multiple sources */
  verificationLog?: string;
};

export type YahooRange = "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max";

export type YahooSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

// In-memory cache for YahooChartResult (5 minutes TTL)
const chartCache = new Map<string, { data: YahooChartResult; fetchedAt: number }>();
const CHART_CACHE_TTL = 5 * 60 * 1000;

// Request coalescing maps to prevent duplicate parallel fetches/scrapes
const activeCharts = new Map<string, Promise<YahooChartResult | null>>();
const activePrices = new Map<string, Promise<{ price: number; currency: string } | null>>();
const activeDiscoveries = new Map<string, Promise<string | null>>();
const discoveryCache = new Map<string, { ticker: string | null; fetchedAt: number }>();
const DISCOVERY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchYahooChart(
  ticker: string,
  range: YahooRange = "1y",
  interval: "1d" | "1wk" | "1mo" | "5m" | "15m" = "1d"
): Promise<YahooChartResult | null> {
  const cleanTicker = ticker.toUpperCase().trim();
  const cacheKey = `${cleanTicker}:${range}:${interval}`;

  // 1. Check in-memory cache
  const cached = chartCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CHART_CACHE_TTL) {
    return cached.data;
  }

  // 2. Check active requests
  const active = activeCharts.get(cacheKey);
  if (active) return active;

  const promise = (async () => {
    const isinMatch = cleanTicker.match(/^([A-Z]{2}[A-Z0-9]{10})/i);
    
    if (isinMatch) {
      const isin = isinMatch[1];
      const qfDataCached = await fetchQueFondosData(isin);
      if (qfDataCached) {
        const qfData = {
          ...qfDataCached,
          quotes: [...qfDataCached.quotes],
        };
        qfData.quotes = filterQuotesByRange(qfData.quotes, range);
        qfData.dataPoints = qfData.quotes.length;
        const verification = await verifyFundData(isin, qfData.currentPrice, qfData.currency);
        qfData.verificationLog = verification.detail;
        return qfData;
      }
    }

    const url = `${YAHOO_BASE}/${encodeURIComponent(cleanTicker)}?range=${range}&interval=${interval}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const qfData = await fetchQueFondosData(ticker);
      if (qfData) return qfData;
      return null;
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      const qfData = await fetchQueFondosData(ticker);
      if (qfData) return qfData;
      return null;
    }

    const meta = result.meta;
    const timestamps: number[] = result.timestamp ?? [];
    const quoteData = result.indicators?.quote?.[0];

    if (!timestamps.length || !quoteData) {
      return {
        symbol: meta.symbol,
        currency: meta.currency,
        name: meta.longName ?? meta.shortName ?? meta.symbol,
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? 0,
        weekHigh52: meta.fiftyTwoWeekHigh ?? 0,
        weekLow52: meta.fiftyTwoWeekLow ?? 0,
        dataPoints: 0,
        quotes: [],
      };
    }

    const quotes: YahooQuote[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quoteData.close?.[i];
      if (close == null) continue;
      quotes.push({
        timestamp: timestamps[i],
        open: quoteData.open?.[i] ?? close,
        high: quoteData.high?.[i] ?? close,
        low: quoteData.low?.[i] ?? close,
        close,
        volume: quoteData.volume?.[i] ?? 0,
      });
    }

    if (quotes.length === 0) {
      // Fallback to QueFondos if Yahoo Finance returns zero data (mutual funds)
      const qfData = await fetchQueFondosData(ticker);
      if (qfData) return qfData;
    }

    // Determine data freshness from last quote timestamp
    const lastTimestamp = quotes.length > 0 ? quotes[quotes.length - 1].timestamp : null;
    let dataDate: string | undefined;
    let isStale = false;
    let staleWarning: string | undefined;
    if (lastTimestamp) {
      const d = new Date(lastTimestamp * 1000);
      dataDate = d.toISOString().slice(0, 10);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Count business days since last quote
      let bdays = 0;
      const cur = new Date(d);
      cur.setHours(0, 0, 0, 0);
      cur.setDate(cur.getDate() + 1);
      while (cur <= today) {
        const wd = cur.getDay();
        if (wd !== 0 && wd !== 6) bdays++;
        cur.setDate(cur.getDate() + 1);
      }
      if (bdays > 3) {
        isStale = true;
        staleWarning = `Último dato: ${dataDate}`;
      }
    }

    const name = meta.longName ?? meta.shortName ?? meta.symbol;
    const extra = getFundExtraMetadata(meta.symbol, "", name);

    return {
      symbol: meta.symbol,
      currency: meta.currency,
      name,
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? 0,
      weekHigh52: meta.fiftyTwoWeekHigh ?? 0,
      weekLow52: meta.fiftyTwoWeekLow ?? 0,
      dataPoints: quotes.length,
      quotes,
      dataDate,
      isStale,
      staleWarning,
      dataSource: "yahoo",
      ...extra,
    };
  } catch {
    const qfData = await fetchQueFondosData(cleanTicker);
    if (qfData) return qfData;
    return null;
  }
  })();

  activeCharts.set(cacheKey, promise);

  try {
    const res = await promise;
    if (res) {
      chartCache.set(cacheKey, { data: res, fetchedAt: Date.now() });
    }
    return res;
  } finally {
    activeCharts.delete(cacheKey);
  }
}

export async function fetchCurrentPrice(
  ticker: string
): Promise<{ price: number; currency: string } | null> {
  const cleanTicker = ticker.toUpperCase().trim();
  const active = activePrices.get(cleanTicker);
  if (active) return active;

  const promise = (async () => {
    const isinMatch = cleanTicker.match(/^([A-Z]{2}[A-Z0-9]{10})/i);

    if (isinMatch) {
      const qfData = await fetchQueFondosData(isinMatch[1]);
      if (qfData) {
        return { price: qfData.currentPrice, currency: qfData.currency };
      }
    }

    const url = `${YAHOO_BASE}/${encodeURIComponent(cleanTicker)}?range=1d&interval=1d`;

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(8_000),
      });

      if (!res.ok) {
        const qfData = await fetchQueFondosData(cleanTicker);
        if (qfData) return { price: qfData.currentPrice, currency: qfData.currency };
        return null;
      }

      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;

      return {
        price: meta.regularMarketPrice,
        currency: meta.currency ?? "EUR",
      };
    } catch {
      const qfData = await fetchQueFondosData(cleanTicker);
      if (qfData) {
        return { price: qfData.currentPrice, currency: qfData.currency };
      }
      return null;
    }
  })();

  activePrices.set(cleanTicker, promise);
  try {
    return await promise;
  } finally {
    activePrices.delete(cleanTicker);
  }
}
export async function tryDiscoverTicker(isin: string): Promise<string | null> {
  const cleanIsin = isin.toUpperCase().trim();

  // Check discovery cache first (including failed/null results)
  const cached = discoveryCache.get(cleanIsin);
  if (cached && Date.now() - cached.fetchedAt < DISCOVERY_CACHE_TTL) {
    return cached.ticker;
  }

  const active = activeDiscoveries.get(cleanIsin);
  if (active) return active;

  const promise = (async () => {
    // If QueFondos has it, prefer using the ISIN itself as the ticker
    const qfData = await fetchQueFondosData(cleanIsin);
    if (qfData) {
      return cleanIsin;
    }

    const candidates = [
      `${cleanIsin}.BC`,
      `${cleanIsin}.MC`,
      `${cleanIsin}.MA`,
    ];

    for (const ticker of candidates) {
      try {
        const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          signal: AbortSignal.timeout(3_000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          return ticker;
        }
      } catch {
        continue;
      }
    }

    return null;
  })();

  activeDiscoveries.set(cleanIsin, promise);
  try {
    const result = await promise;
    discoveryCache.set(cleanIsin, { ticker: result, fetchedAt: Date.now() });
    return result;
  } finally {
    activeDiscoveries.delete(cleanIsin);
  }
}

export function yahooTickerToUrl(ticker: string): string {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}/`;
}

async function verifyFundData(
  isin: string,
  qfPrice: number,
  qfCurrency: string
): Promise<{ status: "verified" | "discrepancy" | "single_source"; detail: string }> {
  const candidates = [`${isin}.BC`, `${isin}.MC`, `${isin}.MA`];
  for (const ticker of candidates) {
    try {
      const url = `${YAHOO_BASE}/${encodeURIComponent(ticker)}?range=1d&interval=1d`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const yPrice = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (yPrice && yPrice > 0) {
          const diffPct = Math.abs((qfPrice - yPrice) / qfPrice) * 100;
          if (diffPct < 1.0) {
            return {
              status: "verified",
              detail: `Verificado con Yahoo Finance (coincidencia del ${(100 - diffPct).toFixed(2)}%)`,
            };
          } else {
            return {
              status: "discrepancy",
              detail: `Descartado Yahoo Finance (${yPrice.toFixed(2)} ${qfCurrency}) por desactualización. Usando NAV oficial de QueFondos (${qfPrice.toFixed(4)} ${qfCurrency})`,
            };
          }
        }
      }
    } catch {}
  }
  return {
    status: "single_source",
    detail: `Dato verificado con NAV oficial de QueFondos (${qfPrice.toFixed(4)} ${qfCurrency})`,
  };
}

function filterQuotesByRange(quotes: YahooQuote[], range: YahooRange): YahooQuote[] {
  if (quotes.length === 0) return quotes;
  const lastQuote = quotes[quotes.length - 1];
  const lastTime = lastQuote.timestamp * 1000;
  
  let cutoffTime = 0;
  const cutoffDate = new Date(lastTime);
  
  switch (range) {
    case "1d":
      // Since QueFondos is monthly, we can't show intraday. Show last 3 points.
      return quotes.slice(-3);
    case "5d":
      return quotes.slice(-4);
    case "1mo":
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      cutoffTime = cutoffDate.getTime();
      break;
    case "3mo":
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
      cutoffTime = cutoffDate.getTime();
      break;
    case "6mo":
      cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      cutoffTime = cutoffDate.getTime();
      break;
    case "1y":
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      cutoffTime = cutoffDate.getTime();
      break;
    case "2y":
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
      cutoffTime = cutoffDate.getTime();
      break;
    case "5y":
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
      cutoffTime = cutoffDate.getTime();
      break;
    case "max":
    default:
      return quotes;
  }
  
  const filtered = quotes.filter(q => q.timestamp * 1000 >= cutoffTime);
  if (filtered.length < 2 && quotes.length >= 2) {
    return quotes.slice(-3);
  }
  return filtered;
}
