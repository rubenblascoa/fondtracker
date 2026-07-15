import { queries, type InvestmentRow, type InvestmentWithStats } from "./db";
import { fetchCurrentPrice, tryDiscoverTicker } from "./yahoo";

function now(): string {
  return new Date().toISOString();
}

function computeInvestmentStats(
  investment: InvestmentRow,
  currentPrice: number | null,
  resolvedTicker: string | null
): InvestmentWithStats {
  const shares = Number(investment.shares);
  const purchasePrice = Number(investment.purchase_price);
  const totalInvested = shares * purchasePrice;
  const currentValue =
    currentPrice != null ? shares * currentPrice : totalInvested;
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

export async function listInvestments(userId: number): Promise<InvestmentWithStats[]> {
  const investments = await queries.listInvestments(userId);
  const results: InvestmentWithStats[] = [];

  const metaPromises = investments.map(async (inv) => {
    const catalog = await queries.getFundCatalogByIsin(inv.isin);
    let ticker = inv.ticker ?? catalog?.yahoo_ticker ?? null;
    return {
      ticker,
      category: catalog?.category ?? inv.category,
      purchasePrice: Number(inv.purchase_price),
    };
  });
  const metaList = await Promise.all(metaPromises);

  const pricePromises = metaList.map(async (meta, i) => {
    let ticker = meta.ticker;

    if (!ticker) {
      ticker = await tryDiscoverTicker(investments[i].isin);
      if (ticker) {
        meta.ticker = ticker; // Save the discovered ticker in meta
        // Persist to DB so next load doesn't need to re-discover
        try {
          await queries.updateInvestmentTicker(investments[i].id, ticker);
        } catch {}
      }
    }

    if (ticker) {
      const quote = await fetchCurrentPrice(ticker);
      if (quote?.price) {
        await queries.setFundPrice(investments[i].isin, quote.price, quote.currency);
        return quote.price;
      }

      const cached = await queries.getFundPrice(investments[i].isin);
      if (cached && cached.price > 0) return cached.price;
    }

    const cached = await queries.getFundPrice(investments[i].isin);
    if (cached && cached.price > 0) return cached.price;

    return null;
  });
  const prices = await Promise.all(pricePromises);

  for (let i = 0; i < investments.length; i++) {
    results.push(computeInvestmentStats(investments[i], prices[i], metaList[i].ticker));
  }

  return results;
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
    // Persist the resolved ticker back to DB
    if (ticker) {
      try { await queries.updateInvestmentTicker(inv.id, ticker); } catch {}
    }
  }

  let currentPrice: number | null = null;
  if (ticker) {
    const quote = await fetchCurrentPrice(ticker).catch(() => null);
    currentPrice = quote?.price ?? null;
  }

  if (!currentPrice) {
    const cached = await queries.getFundPrice(inv.isin);
    if (cached && cached.price > 0) currentPrice = cached.price;
  }

  return computeInvestmentStats(inv, currentPrice, ticker);
}

export async function getPortfolioTotals(userId: number) {
  const investments = await listInvestments(userId);
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
  // Try to resolve a ticker immediately (Yahoo or ISIN fallback via QueFondos)
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

  return getInvestmentWithStats(investment.id, userId).then((s) => s!);
}

export async function deleteInvestment(id: number, userId: number): Promise<boolean> {
  const inv = await queries.getInvestment(id, userId);
  if (!inv) return false;
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
