import { useState, useEffect } from "react";
import { api, type Investment, type YahooChartData } from "../../api";
import { X, Check, Edit3, AlertCircle, Sparkles } from "lucide-react";

type Props = {
  fund: Investment;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export function MetadataEditModal({ fund, isOpen, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [ter, setTer] = useState("");
  const [category, setCategory] = useState(fund.category || "");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setSuccess(null);
      api.metadata
        .get(fund.isin)
        .then((meta) => {
          if (meta.ter != null) setTer(String(meta.ter));
          if (meta.category) setCategory(meta.category);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, fund.isin, fund.category]);

  if (!isOpen) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const parsedTer = ter ? parseFloat(ter.replace(",", ".")) : undefined;

    try {
      await api.metadata.update(fund.isin, {
        ter: parsedTer,
        category: category.trim() || undefined,
      });

      setSuccess("Metadatos actualizados correctamente");
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Error al actualizar metadatos");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/40">
          <div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 font-bold">
              {fund.isin}
            </span>
            <h2 className="text-base font-bold text-[var(--color-fg-1)] mt-1 truncate max-w-sm">
              Editar Metadatos de {fund.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-3)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
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

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-[var(--color-fg-4)] font-medium mb-1 block">
                  Gastos corrientes / TER (%)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej: 0.18"
                  value={ter}
                  onChange={(e) => setTer(e.target.value)}
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none font-mono"
                />
                <p className="text-[10px] text-[var(--color-fg-4)] mt-1">
                  El Total Expense Ratio se utiliza para calcular el coste ponderado de tu cartera.
                </p>
              </div>

              <div>
                <label className="text-xs text-[var(--color-fg-4)] font-medium mb-1 block">
                  Categoría del fondo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Renta Variable Global, Indexados..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[var(--color-ink-3)]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[var(--color-ink-3)] text-xs text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[var(--color-accent)] text-black text-xs font-bold hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
