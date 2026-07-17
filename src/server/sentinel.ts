import { fetchCurrentPrice, tryDiscoverTicker } from "./yahoo";
import { queries, type InvestmentRow, type InvestmentWithStats } from "./db";

// ─── In-memory price cache with LRU eviction ──────────────────────────────────
// Avoids calling Yahoo Finance on every 10-second dashboard refresh.
// Prices refresh automatically after TTL expires.
const PRICE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PRICE_CACHE_MAX = 500; // max entries before LRU eviction

type CacheEntry = { price: number | null; currency: string; fetchedAt: number };
const priceCache = new Map<string, CacheEntry>();

function getCachedPrice(isin: string): CacheEntry | null {
  const entry = priceCache.get(isin);
  if (entry && Date.now() - entry.fetchedAt < PRICE_TTL_MS) return entry;
  return null;
}

function setCachedPrice(isin: string, price: number | null, currency: string) {
  if (priceCache.has(isin)) priceCache.delete(isin);
  else if (priceCache.size >= PRICE_CACHE_MAX) {
    const oldest = priceCache.keys().next().value;
    if (oldest) priceCache.delete(oldest);
  }
  priceCache.set(isin, { price, currency, fetchedAt: Date.now() });
}

export function invalidatePriceCache(isin?: string) {
  if (isin) priceCache.delete(isin);
  else priceCache.clear();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function computeInvestmentStats(
  investment: InvestmentRow,
  currentPrice: number | null,
  resolvedTicker: string | null
): InvestmentWithStats {
  const shares = Number.isFinite(Number(investment.shares)) ? Number(investment.shares) : 0;
  const purchasePrice = Number.isFinite(Number(investment.purchase_price)) ? Number(investment.purchase_price) : 0;
  const totalInvested = shares * purchasePrice;
  const currentValue =
    currentPrice != null && Number.isFinite(currentPrice) ? shares * currentPrice : totalInvested;
  const profitLoss = currentValue - totalInvested;
  const profitLossPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  return {
    ...investment,
    ticker: resolvedTicker,
    shares,
    purchase_price: purchasePrice,
    total_invested: totalInvested,
    current_value: currentValue,
    profit_loss: profitLoss,
    profit_loss_pct: profitLossPct,
    current_price: currentPrice,
  };
}

// ─── Core function ─────────────────────────────────────────────────────────────

export async function listInvestments(userId: number): Promise<InvestmentWithStats[]> {
  const investments = await queries.listInvestments(userId);
  if (investments.length === 0) return [];

  // ① Batch-load all catalog entries and database prices in ONE parallel query
  const uniqueIsins = [...new Set(investments.map((i) => i.isin))];
  const [catalogMap, pricesMap] = await Promise.all([
    queries.getFundCatalogByIsins(uniqueIsins),
    queries.getFundPricesByIsins(uniqueIsins),
  ]);

  // ② Resolve tickers & prices per unique ISIN
  const resolvedTickers = new Map<string, string | null>();
  const resolvedPrices = new Map<string, number | null>();

  await Promise.all(
    uniqueIsins.map(async (isin) => {
      // Find any investment sharing this ISIN to check if ticker is already stored
      const matchingInvs = investments.filter((i) => i.isin === isin);
      let ticker = matchingInvs.find((i) => i.ticker != null)?.ticker ?? catalogMap.get(isin)?.yahoo_ticker ?? null;

      if (!ticker) {
        ticker = await tryDiscoverTicker(isin);
        if (ticker) {
          // Update DB for all investments with this ISIN (since they all get the discovered ticker)
          await Promise.all(
            matchingInvs.map(async (inv) => {
              try { await queries.updateInvestmentTicker(inv.id, ticker); } catch {}
            })
          );
        }
      }
      resolvedTickers.set(isin, ticker);

      // Resolve Price for this unique ISIN
      // Fast path: in-memory cache hit
      const mem = getCachedPrice(isin);
      if (mem) {
        resolvedPrices.set(isin, mem.price);
        return;
      }

      // Slow path: fetch live price
      if (ticker) {
        const quote = await fetchCurrentPrice(ticker).catch(() => null);
        if (quote?.price) {
          setCachedPrice(isin, quote.price, quote.currency);
          await queries.setFundPrice(isin, quote.price, quote.currency);
          resolvedPrices.set(isin, quote.price);
          return;
        }
      }

      // DB fallback (loaded in batch)
      const cached = pricesMap.get(isin);
      if (cached && cached.price > 0) {
        setCachedPrice(isin, cached.price, cached.currency);
        resolvedPrices.set(isin, cached.price);
        return;
      }

      // Cache failed resolve (null) for 5 minutes to avoid network flood on future refreshes
      setCachedPrice(isin, null, "EUR");
      resolvedPrices.set(isin, null);
    })
  );

  return investments.map((inv) => {
    const ticker = resolvedTickers.get(inv.isin) ?? null;
    const price = resolvedPrices.get(inv.isin) ?? null;
    return computeInvestmentStats(inv, price, ticker);
  });
}

export async function getInvestmentWithStats(
  id: number,
  userId: number
): Promise<InvestmentWithStats | null> {
  const inv = await queries.getInvestment(id, userId);
  if (!inv) return null;

  const catalog = await queries.getFundCatalogByIsin(inv.isin);
  let ticker = inv.ticker ?? catalog?.yahoo_ticker ?? null;

  if (!ticker) {
    ticker = await tryDiscoverTicker(inv.isin);
    if (ticker) {
      try { await queries.updateInvestmentTicker(inv.id, ticker); } catch {}
    }
  }

  // Bust per-investment cache when loading single fund (used after edit/add)
  invalidatePriceCache(inv.isin);

  let currentPrice: number | null = null;
  if (ticker) {
    const quote = await fetchCurrentPrice(ticker).catch(() => null);
    currentPrice = quote?.price ?? null;
    if (currentPrice) {
      setCachedPrice(inv.isin, currentPrice, quote!.currency);
      await queries.setFundPrice(inv.isin, currentPrice, quote!.currency);
    }
  }
  if (!currentPrice) {
    const db = await queries.getFundPrice(inv.isin);
    if (db && db.price > 0) currentPrice = db.price;
  }

  return computeInvestmentStats(inv, currentPrice, ticker);
}

// ─── Portfolio totals — computed from already-loaded investments ──────────────

export function computePortfolioTotals(investments: InvestmentWithStats[]) {
  let totalInvested = 0;
  let totalCurrent = 0;
  for (const inv of investments) {
    totalInvested += inv.total_invested;
    totalCurrent += inv.current_value;
  }
  const totalProfitLoss = totalCurrent - totalInvested;
  const totalProfitLossPct =
    totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  return {
    total_initial: totalInvested,
    total_current: totalCurrent,
    total_profit_loss: totalProfitLoss,
    total_profit_loss_pct: totalProfitLossPct,
    fund_count: investments.length,
  };
}

/** @deprecated Use computePortfolioTotals(investments) instead to avoid double listInvestments call */
export async function getPortfolioTotals(userId: number) {
  return computePortfolioTotals(await listInvestments(userId));
}

export async function addInvestment(
  userId: number,
  isin: string,
  shares: number,
  purchasePrice: number,
  purchaseDate: string,
  notes?: string
): Promise<InvestmentWithStats> {
  const catalog = await queries.getFundCatalogByIsin(isin);
  if (!catalog) throw new Error(`ISIN ${isin} no encontrado en el catálogo`);

  const ts = now();
  let resolvedTicker: string | null = catalog.yahoo_ticker ?? null;
  if (!resolvedTicker) {
    try { resolvedTicker = await tryDiscoverTicker(catalog.isin); } catch {}
  }

  const investment = await queries.insertInvestment(
    {
      user_id: userId,
      isin: catalog.isin,
      name: catalog.name,
      bank: catalog.bank,
      category: catalog.category,
      ticker: resolvedTicker,
      shares,
      purchase_price: purchasePrice,
      purchase_date: purchaseDate,
      currency: catalog.currency,
      notes,
    },
    ts
  );

  // Bust cache so the new fund gets a fresh price on next load
  invalidatePriceCache(catalog.isin);
  return getInvestmentWithStats(investment.id, userId).then((s) => s!);
}

export async function deleteInvestment(id: number, userId: number): Promise<boolean> {
  const inv = await queries.getInvestment(id, userId);
  if (!inv) return false;
  invalidatePriceCache(inv.isin);
  await queries.deleteInvestment(id, userId);
  return true;
}

export async function editInvestment(
  id: number,
  userId: number,
  data: {
    shares: number;
    purchase_price: number;
    purchase_date: string;
    notes?: string;
  }
): Promise<InvestmentWithStats | null> {
  const inv = await queries.getInvestment(id, userId);
  if (!inv) return null;

  await queries.updateInvestment(
    id,
    {
      shares: data.shares,
      purchase_price: data.purchase_price,
      purchase_date: data.purchase_date,
      notes: data.notes ?? "",
    },
    now()
  );

  return getInvestmentWithStats(id, userId);
}
