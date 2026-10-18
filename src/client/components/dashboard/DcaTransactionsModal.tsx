import { useState, useEffect, useCallback } from "react";
import { api, type Investment, type Transaction, type PmpSummary, type TransactionType } from "../../api";
import { Plus, Trash2, Calendar, DollarSign, Layers, Tag, X, Check, ArrowDownLeft, ArrowUpRight, Clock, AlertCircle } from "lucide-react";

function fmtEur(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtNav(n: number) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(n);
}

type Props = {
  fund: Investment;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export function DcaTransactionsModal({ fund, isOpen, onClose, onUpdated }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PmpSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [txType, setTxType] = useState<TransactionType>("BUY");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState(fund.current_price ? String(fund.current_price) : String(fund.purchase_price));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fees, setFees] = useState("0");
  const [notes, setNotes] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.transactions.list(fund.id);
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err?.message || "Error al cargar las transacciones");
    } finally {
      setLoading(false);
    }
  }, [fund.id]);

  useEffect(() => {
    if (isOpen) {
      void loadTransactions();
      setShowAddForm(false);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, loadTransactions]);

  if (!isOpen) return null;

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const parsedShares = parseFloat(shares.replace(",", "."));
    const parsedPrice = parseFloat(price.replace(",", "."));
    const parsedFees = parseFloat(fees.replace(",", ".")) || 0;

    if (isNaN(parsedShares) || parsedShares <= 0) {
      setError("Introduce un número válido de participaciones");
      setSubmitting(false);
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Introduce un precio liquidativo válido");
      setSubmitting(false);
      return;
    }

    try {
      await api.transactions.add(fund.id, {
        type: txType,
        shares: parsedShares,
        price: parsedPrice,
        date,
        fees: parsedFees,
        notes: notes.trim() || undefined,
      });

      setSuccess("Aportación / Transacción registrada correctamente");
      setShares("");
      setNotes("");
      setShowAddForm(false);
      await loadTransactions();
      onUpdated();
    } catch (err: any) {
      setError(err?.message || "Error al guardar la transacción");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransaction(txId: number) {
    if (!confirm("¿Eliminar esta transacción? El Precio Medio Ponderado se recalculará automáticamente.")) return;
    try {
      await api.transactions.delete(fund.id, txId);
      await loadTransactions();
      onUpdated();
    } catch (err: any) {
      setError(err?.message || "Error al eliminar la transacción");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 font-bold">
                {fund.isin}
              </span>
              {fund.bank && (
                <span className="text-xs text-[var(--color-fg-4)] font-medium">· {fund.bank}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[var(--color-fg-1)] mt-1 truncate max-w-md">
              {fund.name}
            </h2>
            <p className="text-xs text-[var(--color-fg-4)] mt-0.5">
              Gestión de Aportaciones Periódicas (DCA) y Precio Medio Ponderado (PMP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-3)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* PMP Summary Bar */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[var(--color-ink-2)]/70 border-b border-[var(--color-ink-3)]">
            <div className="p-3 bg-[var(--color-ink-1)] rounded-xl border border-[var(--color-ink-3)]">
              <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider font-semibold">Participaciones</span>
              <p className="text-sm font-mono font-bold text-[var(--color-fg-1)] mt-0.5">
                {summary.currentShares.toFixed(4)}
              </p>
            </div>
            <div className="p-3 bg-[var(--color-ink-1)] rounded-xl border border-[var(--color-ink-3)]">
              <span className="text-[10px] text-[var(--color-accent)] uppercase tracking-wider font-semibold">Precio Medio (PMP)</span>
              <p className="text-sm font-mono font-bold text-[var(--color-accent)] mt-0.5">
                {fmtEur(summary.pmp)}
              </p>
            </div>
            <div className="p-3 bg-[var(--color-ink-1)] rounded-xl border border-[var(--color-ink-3)]">
              <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider font-semibold">Total Aportado</span>
              <p className="text-sm font-mono font-bold text-[var(--color-fg-1)] mt-0.5">
                {fmtEur(summary.totalCostBasis)}
              </p>
            </div>
            <div className="p-3 bg-[var(--color-ink-1)] rounded-xl border border-[var(--color-ink-3)]">
              <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider font-semibold">Aportaciones</span>
              <p className="text-sm font-mono font-bold text-[var(--color-fg-1)] mt-0.5">
                {summary.transactionCount} mov.
              </p>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
              <Check size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Add Transaction Toggle */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 px-4 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-semibold rounded-2xl flex items-center justify-center gap-2 text-sm transition-all shadow-sm"
            >
              <Plus size={18} />
              <span>Registrar Nueva Compra / Aportación DCA</span>
            </button>
          ) : (
            <form onSubmit={handleAddTransaction} className="p-5 bg-[var(--color-ink-2)]/90 border border-[var(--color-accent)]/40 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[var(--color-ink-3)] pb-3">
                <h3 className="text-sm font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                  <Plus size={16} className="text-[var(--color-accent)]" /> Nueva Transacción
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                >
                  Cancelar
                </button>
              </div>

              {/* Transaction Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("BUY")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    txType === "BUY"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                      : "bg-[var(--color-ink-1)] border-[var(--color-ink-3)] text-[var(--color-fg-4)]"
                  }`}
                >
                  Compra / Aportación DCA
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("SELL")}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    txType === "SELL"
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "bg-[var(--color-ink-1)] border-[var(--color-ink-3)] text-[var(--color-fg-4)]"
                  }`}
                >
                  Venta / Reembolso
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--color-fg-4)] font-medium mb-1 block">Participaciones *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 5.4321"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    required
                    className="w-full bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3 py-2 text-sm text-[var(--color-fg-1)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--color-fg-4)] font-medium mb-1 block">Precio liquidativo (NAV) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 145.20"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3 py-2 text-sm text-[var(--color-fg-1)] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[var(--color-fg-4)] font-medium mb-1 block">Fecha de compra *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3 py-2 text-sm text-[var(--color-fg-1)] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[var(--color-fg-4)] font-medium mb-1 block">Comisiones (€)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    className="w-full bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3 py-2 text-sm text-[var(--color-fg-1)] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[var(--color-fg-4)] font-medium mb-1 block">Notas / Origen de aportación</label>
                <input
                  type="text"
                  placeholder="Ej: Aportación mensual nómina..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3 py-2 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--color-ink-3)] text-xs text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[var(--color-accent)] text-black text-xs font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  {submitting ? "Guardando..." : "Guardar Transacción"}
                </button>
              </div>
            </form>
          )}

          {/* Transactions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-fg-4)] uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} /> Historial de Transacciones ({transactions.length})
            </h3>

            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-fg-4)] text-xs bg-[var(--color-ink-2)]/30 rounded-2xl border border-[var(--color-ink-3)] border-dashed p-6">
                No hay aportaciones registradas para este fondo.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-[var(--color-ink-2)]/60 hover:bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        tx.type === "BUY" || tx.type === "TRANSFER_IN"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {tx.type === "BUY" || tx.type === "TRANSFER_IN" ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--color-fg-1)]">
                            {tx.type === "BUY" ? "Compra" : tx.type === "SELL" ? "Venta" : tx.type}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--color-fg-4)]">
                            {tx.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-fg-3)] font-mono mt-0.5">
                          {Number(tx.shares).toFixed(4)} part. × {fmtNav(Number(tx.price))} €
                          {Number(tx.fees) > 0 && ` (+${fmtEur(Number(tx.fees))} comisión)`}
                        </p>
                        {tx.notes && (
                          <p className="text-[10px] text-[var(--color-fg-4)] italic mt-0.5 truncate max-w-xs">
                            {tx.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-[var(--color-fg-1)]">
                          {fmtEur(Number(tx.amount))}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-[var(--color-fg-4)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar aportación"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
