import { queries, pool, type TransactionRow, type TransactionType, type InvestmentWithStats } from "./db";
import { computeInvestmentStats } from "./sentinel";

export type PmpSummary = {
  currentShares: number;
  pmp: number; // Precio Medio Ponderado
  totalCostBasis: number;
  realizedGain: number;
  totalFees: number;
  transactionCount: number;
};

/**
 * Pure calculation function for Weighted Average Cost Basis (PMP - Precio Medio Ponderado)
 * and active position shares following Spanish financial accounting / FIFO principles.
 */
export function calculatePmp(transactions: TransactionRow[]): PmpSummary {
  if (!transactions || transactions.length === 0) {
    return {
      currentShares: 0,
      pmp: 0,
      totalCostBasis: 0,
      realizedGain: 0,
      totalFees: 0,
      transactionCount: 0,
    };
  }

  // Ensure chronological order
  const sorted = [...transactions].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0) return diff;
    return a.id - b.id;
  });

  let currentShares = 0;
  let totalCostBasis = 0;
  let realizedGain = 0;
  let totalFees = 0;

  for (const tx of sorted) {
    const shares = Number(tx.shares);
    const price = Number(tx.price);
    const fees = Number(tx.fees || 0);
    totalFees += fees;

    if (tx.type === "BUY" || tx.type === "TRANSFER_IN") {
      const txCost = shares * price + fees;
      currentShares += shares;
      totalCostBasis += txCost;
    } else if (tx.type === "SELL" || tx.type === "TRANSFER_OUT") {
      if (currentShares > 0) {
        const currentPmp = totalCostBasis / currentShares;
        const soldCost = shares * currentPmp;
        const saleProceeds = shares * price - fees;
        realizedGain += saleProceeds - soldCost;

        currentShares = Math.max(0, currentShares - shares);
        totalCostBasis = Math.max(0, totalCostBasis - soldCost);
      }
    }
  }

  const pmp = currentShares > 0 ? totalCostBasis / currentShares : 0;

  return {
    currentShares: Number(currentShares.toFixed(6)),
    pmp: Number(pmp.toFixed(6)),
    totalCostBasis: Number(totalCostBasis.toFixed(2)),
    realizedGain: Number(realizedGain.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    transactionCount: transactions.length,
  };
}

export async function recalculateAndSyncInvestment(fundId: number, userId: number): Promise<PmpSummary> {
  const transactions = await queries.listTransactions(fundId, userId);
  const summary = calculatePmp(transactions);

  // Update investments table with consolidated position
  await queries.updateInvestment(
    fundId,
    {
      shares: summary.currentShares,
      purchase_price: summary.pmp,
    },
    new Date().toISOString().slice(0, 19).replace("T", " ")
  );

  return summary;
}

export async function addTransaction(
  userId: number,
  fundId: number,
  data: {
    type: TransactionType;
    shares: number;
    price: number;
    date: string;
    fees?: number;
    notes?: string;
  }
): Promise<{ transaction: TransactionRow; summary: PmpSummary }> {
  // Validate ownership
  const inv = await queries.getInvestment(fundId, userId);
  if (!inv) throw new Error("Fondo de inversión no encontrado");

  if (!Number.isFinite(data.shares) || data.shares <= 0) {
    throw new Error("El número de participaciones debe ser mayor que cero");
  }
  if (!Number.isFinite(data.price) || data.price <= 0) {
    throw new Error("El precio liquidativo debe ser mayor que cero");
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error("Formato de fecha inválido (YYYY-MM-DD)");
  }

  const amount = Number((data.shares * data.price).toFixed(2));
  const tx = await queries.insertTransaction({
    user_id: userId,
    fund_id: fundId,
    type: data.type || "BUY",
    shares: data.shares,
    price: data.price,
    amount,
    date: data.date,
    fees: data.fees ?? 0,
    notes: data.notes,
  });

  const summary = await recalculateAndSyncInvestment(fundId, userId);
  return { transaction: tx, summary };
}

export async function removeTransaction(
  userId: number,
  fundId: number,
  txId: number
): Promise<PmpSummary> {
  const inv = await queries.getInvestment(fundId, userId);
  if (!inv) throw new Error("Fondo de inversión no encontrado");

  const tx = await queries.getTransaction(txId, userId);
  if (!tx || tx.fund_id !== fundId) throw new Error("Transacción no encontrada");

  await queries.deleteTransaction(txId, userId);
  return await recalculateAndSyncInvestment(fundId, userId);
}

export async function getFundTransactions(
  userId: number,
  fundId: number
): Promise<{ transactions: TransactionRow[]; summary: PmpSummary }> {
  const inv = await queries.getInvestment(fundId, userId);
  if (!inv) throw new Error("Fondo de inversión no encontrado");

  const transactions = await queries.listTransactions(fundId, userId);
  const summary = calculatePmp(transactions);

  return { transactions, summary };
}
