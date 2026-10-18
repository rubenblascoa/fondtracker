import { queries, type InvestmentRow, type TransactionRow, type TransactionType } from "./db";

export type PmpSummary = {
  currentShares: number;
  pmp: number; // Precio Medio Ponderado
  totalCostBasis: number;
  realizedGain: number;
  totalFees: number;
  transactionCount: number;
};

const TX_TYPES: TransactionType[] = ["BUY", "SELL", "TRANSFER_IN", "TRANSFER_OUT"];

export type TransactionInput = {
  type: TransactionType;
  shares: number;
  price: number;
  date: string;
  fees?: number;
  notes?: string;
};

/** Valida un movimiento antes de guardarlo. Lanza Error con el motivo en español. */
export function validateTransaction(currentShares: number, data: TransactionInput): void {
  if (!TX_TYPES.includes(data.type)) throw new Error("Tipo de movimiento no válido");
  if (!Number.isFinite(data.shares) || data.shares <= 0) throw new Error("El número de participaciones debe ser mayor que cero");
  if (!Number.isFinite(data.price) || data.price <= 0) throw new Error("El precio liquidativo debe ser mayor que cero");
  if (data.fees != null && (!Number.isFinite(data.fees) || data.fees < 0)) throw new Error("La comisión no puede ser negativa");
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error("Formato de fecha inválido (YYYY-MM-DD)");
  const isOut = data.type === "SELL" || data.type === "TRANSFER_OUT";
  // Tolerancia de 1e-6 por redondeo de participaciones
  if (isOut && data.shares > currentShares + 1e-6) {
    throw new Error(`No tienes tantas participaciones (tienes ${String(Number(currentShares.toFixed(6))).replace(".", ",")})`);
  }
}

/** Compra inicial equivalente a una inversión creada antes de existir los movimientos. */
export function initialBuyFromInvestment(inv: Pick<InvestmentRow, "id" | "user_id" | "shares" | "purchase_price" | "purchase_date">): Omit<TransactionRow, "id" | "created_at"> {
  const shares = Number(inv.shares);
  const price = Number(inv.purchase_price);
  return {
    user_id: inv.user_id,
    fund_id: inv.id,
    type: "BUY",
    shares,
    price,
    amount: Number((shares * price).toFixed(2)),
    date: String(inv.purchase_date).slice(0, 10),
    fees: 0,
    notes: "Compra inicial",
  };
}

/** Comprueba que borrar un movimiento deja un historial coherente (nunca vender lo que no hay). */
export function validateRemoval(txs: TransactionRow[], txId: number): void {
  if (!txs.some((t) => t.id === txId)) throw new Error("Movimiento no encontrado");
  if (txs.length === 1) throw new Error("Es el único movimiento del fondo: si ya no lo tienes, borra el fondo.");
  const rest = txs
    .filter((t) => t.id !== txId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  let shares = 0;
  for (const t of rest) {
    shares += t.type === "BUY" || t.type === "TRANSFER_IN" ? Number(t.shares) : -Number(t.shares);
    if (shares < -1e-6) throw new Error(`Sin este movimiento, la venta del ${t.date} quedaría sin participaciones.`);
  }
}

export type EditPlan =
  | { action: "none" }
  | { action: "update"; txId: number; shares: number; price: number; amount: number; date: string }
  | { action: "reject"; reason: string };

/**
 * Editar un fondo desde su ficha cambia participaciones/precio/fecha. Para no descuadrar los
 * movimientos: si solo existe la compra inicial se actualiza con lo editado; si hay más, se rechaza.
 */
export function planInvestmentEdit(
  txs: TransactionRow[],
  edit: { shares: number; purchase_price: number; purchase_date: string },
): EditPlan {
  if (txs.length === 0) return { action: "none" };
  if (txs.length > 1) return { action: "reject", reason: "Este fondo tiene varios movimientos: edítalos desde «Movimientos»." };
  return {
    action: "update",
    txId: txs[0].id,
    shares: edit.shares,
    price: edit.purchase_price,
    amount: Number((edit.shares * edit.purchase_price).toFixed(2)),
    date: edit.purchase_date.slice(0, 10),
  };
}

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

  const current = calculatePmp(await queries.listTransactions(fundId, userId)).currentShares;
  validateTransaction(current, { ...data, type: data.type || "BUY" });

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
    notes: data.notes ?? null,
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
  if (!tx || tx.fund_id !== fundId) throw new Error("Movimiento no encontrado");
  validateRemoval(await queries.listTransactions(fundId, userId), txId);

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
