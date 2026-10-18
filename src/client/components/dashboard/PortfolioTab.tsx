import { useState, useMemo } from "react";
import { type Investment, getBankPortalInfo, getFundDataSourceInfo } from "../../api";
import { FundCard } from "../FundCard";
import { DcaTransactionsModal } from "./DcaTransactionsModal";
import { MetadataEditModal } from "./MetadataEditModal";
import { Search, Filter, ArrowUpDown, LayoutGrid, Table, PlusCircle, ExternalLink, Calendar, Edit3, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";

function fmtEur(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

type Props = {
  funds: Investment[];
  onRefresh: () => void | Promise<void>;
  onNavigateToAdd: () => void;
};

export function PortfolioTab({ funds, onRefresh, onNavigateToAdd }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState("all");
  const [sortBy, setSortBy] = useState<"value" | "profit" | "profit_pct" | "name">("value");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  // Modals state
  const [dcaFund, setDcaFund] = useState<Investment | null>(null);
  const [metaFund, setMetaFund] = useState<Investment | null>(null);

  // Distinct banks
  const banks = useMemo(() => {
    const set = new Set<string>();
    for (const f of funds) {
      if (f.bank && f.bank.trim()) set.add(f.bank.trim());
    }
    return Array.from(set).sort();
  }, [funds]);

  // Filtered & sorted funds
  const processedFunds = useMemo(() => {
    let result = [...funds];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.isin.toLowerCase().includes(q) ||
          (f.bank && f.bank.toLowerCase().includes(q)) ||
          (f.category && f.category.toLowerCase().includes(q))
      );
    }

    if (selectedBank !== "all") {
      result = result.filter((f) => f.bank && f.bank.trim() === selectedBank);
    }

    result.sort((a, b) => {
      if (sortBy === "value") return b.current_value - a.current_value;
      if (sortBy === "profit") return b.profit_loss - a.profit_loss;
      if (sortBy === "profit_pct") return b.profit_loss_pct - a.profit_loss_pct;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [funds, searchQuery, selectedBank, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
          <input
            type="text"
            placeholder="Buscar por nombre, ISIN, entidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-2xl pl-10 pr-4 py-2 text-sm text-[var(--color-fg-1)] outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {banks.length > 0 && (
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl px-3 py-2 text-xs text-[var(--color-fg-2)] outline-none"
            >
              <option value="all">Todas las entidades</option>
              {banks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl px-3 py-2 text-xs text-[var(--color-fg-2)] outline-none"
          >
            <option value="value">Mayor valor</option>
            <option value="profit">Mayor ganancia (€)</option>
            <option value="profit_pct">Mayor rentabilidad (%)</option>
            <option value="name">Nombre alfabético</option>
          </select>

          <div className="flex items-center bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === "cards" ? "bg-[var(--color-ink-3)] text-[var(--color-accent)]" : "text-[var(--color-fg-4)]"
              }`}
              title="Vista de fichas"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === "compact" ? "bg-[var(--color-ink-3)] text-[var(--color-accent)]" : "text-[var(--color-fg-4)]"
              }`}
              title="Vista compacta de tabla"
            >
              <Table size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Funds Content */}
      {processedFunds.length === 0 ? (
        <div className="py-16 text-center bg-[var(--color-ink-1)] border border-dashed border-[var(--color-ink-3)] rounded-3xl p-8 space-y-4">
          <p className="text-sm text-[var(--color-fg-4)]">
            {funds.length === 0 ? "Aún no tienes ningún fondo en cartera." : "No hay resultados que coincidan con la búsqueda."}
          </p>
          {funds.length === 0 && (
            <button
              onClick={onNavigateToAdd}
              className="px-5 py-2.5 bg-[var(--color-accent)] text-black font-bold text-xs rounded-2xl inline-flex items-center gap-2 hover:brightness-110 shadow-md"
            >
              <PlusCircle size={16} />
              Añadir tu primer fondo
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedFunds.map((fund) => (
            <div key={fund.id} className="relative group">
              <FundCard
                fund={fund}
                onDelete={onRefresh}
                onEdit={onRefresh}
                onOpenDca={() => setDcaFund(fund)}
                onEditMetadata={() => setMetaFund(fund)}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Compact Table View */
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-ink-2)]/60 text-[var(--color-fg-4)] border-b border-[var(--color-ink-3)] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Fondo / ISIN</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4 text-right">Part.</th>
                  <th className="py-3 px-4 text-right">Precio Actual</th>
                  <th className="py-3 px-4 text-right">PMP</th>
                  <th className="py-3 px-4 text-right">Valor Cartera</th>
                  <th className="py-3 px-4 text-right">Rentabilidad</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ink-3)]">
                {processedFunds.map((f) => {
                  const isPos = f.profit_loss >= 0;
                  return (
                    <tr key={f.id} className="hover:bg-[var(--color-ink-2)]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[var(--color-fg-1)] truncate max-w-xs">{f.name}</p>
                        <span className="font-mono text-[10px] text-[var(--color-fg-4)]">{f.isin}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-fg-3)] truncate max-w-[120px]">
                        {f.bank || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[var(--color-fg-2)]">
                        {Number(f.shares).toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-[var(--color-fg-1)]">
                        {f.current_price ? fmtEur(f.current_price) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[var(--color-fg-3)]">
                        {fmtEur(Number(f.purchase_price))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--color-fg-1)]">
                        {fmtEur(f.current_value)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className={`font-bold flex items-center justify-end gap-0.5 ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                          {isPos ? "+" : ""}{fmtPct(f.profit_loss_pct)}
                        </span>
                        <span className={`text-[10px] ${isPos ? "text-emerald-500/70" : "text-red-500/70"}`}>
                          {isPos ? "+" : ""}{fmtEur(f.profit_loss)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setDcaFund(f)}
                            className="px-2 py-1 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded-lg text-[10px] font-bold"
                            title="Aportaciones periódicas DCA"
                          >
                            DCA
                          </button>
                          <button
                            onClick={() => setMetaFund(f)}
                            className="p-1 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-3)] rounded-lg"
                            title="Editar TER y metadatos"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DCA Modal */}
      {dcaFund && (
        <DcaTransactionsModal
          fund={dcaFund}
          isOpen={Boolean(dcaFund)}
          onClose={() => setDcaFund(null)}
          onUpdated={onRefresh}
        />
      )}

      {/* Metadata Modal */}
      {metaFund && (
        <MetadataEditModal
          fund={metaFund}
          isOpen={Boolean(metaFund)}
          onClose={() => setMetaFund(null)}
          onUpdated={onRefresh}
        />
      )}
    </div>
  );
}
