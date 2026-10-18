import React, { useState, useMemo } from "react";
import { getSpecificFundUrl, getFundDataSourceInfo, getBankPortalInfo, type Investment, type Status } from "../api";
import { FundCard } from "./FundCard";
import { 
  Search, ArrowUpDown, Plus, LayoutGrid, List, Copy, 
  Check, TrendingUp, ArrowUpRight, ArrowDownRight, Layers, 
  Building2, Activity, ExternalLink, Sparkles, RefreshCw, BarChart3
} from "lucide-react";
import { formatEur, formatPct, sanitizeFundName } from "../utils";
import { fundView } from "../fundView";
import { performers } from "../allocation";
import { Button, EmptyState, Stat } from "./ui";

const fmtEur = formatEur;
const fmtPct = formatPct;

interface PortfolioSectionProps {
  funds: Investment[];
  status: Status | null;
  onRefresh: () => void | Promise<void>;
  onNavigateAdd: () => void;
}

export function PortfolioSection({ funds, status, onRefresh, onNavigateAdd }: PortfolioSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"value" | "profit" | "profit_pct" | "name">("value");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [copiedIsin, setCopiedIsin] = useState<string | null>(null);

  const totalInvested = status?.total_initial ?? 0;
  const totalCurrent = status?.total_current ?? 0;
  const totalProfitLoss = status?.total_profit_loss ?? 0;
  const totalProfitLossPct = status?.total_profit_loss_pct ?? 0;

  // Banks list
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    funds.forEach(f => { if (f.bank) banks.add(f.bank); });
    return Array.from(banks);
  }, [funds]);

  // Categories list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    funds.forEach(f => { if (f.category) cats.add(f.category); });
    return Array.from(cats);
  }, [funds]);

  const bestPerformer = useMemo(() => performers(funds).best, [funds]);
  const views = useMemo(() => new Map(funds.map((f) => [f.id, fundView(f)])), [funds]);

  // Filtered and Sorted
  const filteredFunds = useMemo(() => {
    return funds.filter(f => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        f.name.toLowerCase().includes(q) ||
        f.isin.toLowerCase().includes(q) ||
        (f.bank && f.bank.toLowerCase().includes(q));
      
      const matchesBank = selectedBankFilter === "all" || f.bank === selectedBankFilter;
      const matchesCat = selectedCategoryFilter === "all" || f.category === selectedCategoryFilter;
      return matchesSearch && matchesBank && matchesCat;
    }).sort((a, b) => {
      const av = views.get(a.id)!;
      const bv = views.get(b.id)!;
      const aPL = av.hasPrice ? av.value - av.invested : -Infinity;
      const bPL = bv.hasPrice ? bv.value - bv.invested : -Infinity;
      const aPct = av.hasPrice && av.invested > 0 ? aPL / av.invested : -Infinity;
      const bPct = bv.hasPrice && bv.invested > 0 ? bPL / bv.invested : -Infinity;

      if (sortBy === "value") return bv.value - av.value;
      if (sortBy === "profit") return bPL - aPL;
      if (sortBy === "profit_pct") return bPct - aPct;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [funds, views, searchQuery, selectedBankFilter, selectedCategoryFilter, sortBy]);

  const copyIsinToClipboard = (isin: string) => {
    navigator.clipboard.writeText(isin);
    setCopiedIsin(isin);
    setTimeout(() => setCopiedIsin(null), 2000);
  };

  if (funds.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="Aún no tienes fondos"
        text="Busca tu fondo por nombre o ISIN y apunta las participaciones y el importe que te indica tu banco."
        action={<Button onClick={onNavigateAdd}><Plus size={16} /> Añadir fondo</Button>}
      />
    );
  }

  return (
    <div className="space-y-6 dash-cascade">
      
      {/* ── Cifras de la cartera ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Invertido" value={fmtEur(totalInvested)} hint={<span>{funds.length} {funds.length === 1 ? "fondo" : "fondos"}</span>} />
        <Stat label="Valor actual" value={fmtEur(totalCurrent)} hint={<span>Con el último valor liquidativo</span>} />
        <Stat
          label="Ganancia"
          value={`${totalProfitLoss > 0 ? "+" : ""}${fmtEur(totalProfitLoss)}`}
          delta={{ value: fmtPct(totalProfitLossPct), positive: totalProfitLoss >= 0 }}
          hint={<span>No tributa hasta que vendas</span>}
        />
        <Stat
          label="Mejor fondo"
          value={bestPerformer ? fmtPct(bestPerformer.pct) : "—"}
          hint={<span className="truncate">{bestPerformer ? sanitizeFundName(bestPerformer.fund.name) : "Sin fondos con precio"}</span>}
        />
      </div>

      {/* ── Search, Filters & View Toggle Toolbar ── */}
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, ISIN, entidad..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--color-fg-1)] outline-none transition-all placeholder:text-[var(--color-fg-5)] font-medium"
            />
          </div>

          {/* Sort Selector, View Mode & Add Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2.5 sm:px-3 py-2 rounded-xl text-xs flex-1 sm:flex-initial justify-center sm:justify-start">
              <ArrowUpDown size={13} className="text-[var(--color-accent)] shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[var(--color-fg-1)] outline-none cursor-pointer text-xs font-medium truncate"
              >
                <option value="value" className="bg-[var(--color-ink-2)] text-[var(--color-fg-1)]">Mayor Valor</option>
                <option value="profit" className="bg-[var(--color-ink-2)] text-[var(--color-fg-1)]">Mayor Ganancia (€)</option>
                <option value="profit_pct" className="bg-[var(--color-ink-2)] text-[var(--color-fg-1)]">Mayor Rentabilidad (%)</option>
                <option value="name" className="bg-[var(--color-ink-2)] text-[var(--color-fg-1)]">Nombre A-Z</option>
              </select>
            </div>

            {/* View Mode Toggle (Cards vs Table) */}
            <div className="flex items-center bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "cards" ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"}`}
                title="Vista en cuadrícula de tarjetas"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"}`}
                title="Vista en tabla financiera"
              >
                <List size={15} />
              </button>
            </div>

            {/* Add Fund CTA */}
            <button 
              onClick={onNavigateAdd}
              className="px-3 sm:px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(192,132,252,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </div>

        </div>

        {/* Bank Filter Pills (Horizontally Touch Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll pt-1 pb-0.5">
          <button
            onClick={() => setSelectedBankFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              selectedBankFilter === "all"
                ? "bg-[var(--color-btn-bg)] text-[var(--color-btn-fg)] font-bold"
                : "bg-[var(--color-ink-2)] text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] border border-[var(--color-ink-3)]"
            }`}
          >
            Todas ({funds.length})
          </button>
          {availableBanks.map(b => (
            <button
              key={b}
              onClick={() => setSelectedBankFilter(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                selectedBankFilter === b
                  ? "bg-[var(--color-btn-bg)] text-[var(--color-btn-fg)] font-bold"
                  : "bg-[var(--color-ink-2)] text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] border border-[var(--color-ink-3)]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>

      </div>

      {/* ── Content View: Empty State ── */}
      {filteredFunds.length === 0 ? (
        <div className="bg-[var(--color-ink-1)] border border-dashed border-[var(--color-ink-3)] rounded-3xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] mx-auto flex items-center justify-center mb-3">
            <Search size={20} className="text-[var(--color-fg-4)]" />
          </div>
          <p className="text-sm text-[var(--color-fg-1)] font-bold mb-1">No se encontraron inversiones</p>
          <p className="text-xs text-[var(--color-fg-4)] max-w-sm mx-auto mb-4">
            {searchQuery || selectedBankFilter !== "all" 
              ? "Prueba a cambiar tus criterios de búsqueda o filtro de entidad bancaria." 
              : "Añade tu primer fondo de inversión o ETF para comenzar el seguimiento."}
          </p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedBankFilter("all"); }}
            className="px-4 py-2 bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-3)] text-[var(--color-fg-1)] rounded-xl text-xs font-semibold transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* ── Cards Grid View ── */
        <div className="space-y-4">
          {filteredFunds.map((fund) => (
            <FundCard key={fund.id} fund={fund} onChange={onRefresh} />
          ))}
        </div>
      ) : (
        /* ── Financial Table View ── */
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left font-mono text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-[var(--color-ink-3)] text-[var(--color-fg-4)] uppercase tracking-wider bg-[var(--color-ink-2)]">
                  <th className="py-3.5 px-4 font-medium">Fondo / ISIN</th>
                  <th className="py-3.5 px-4 font-medium">Entidad</th>
                  <th className="py-3.5 px-4 font-medium text-right">Participaciones</th>
                  <th className="py-3.5 px-4 font-medium text-right">Precio Compra</th>
                  <th className="py-3.5 px-4 font-medium text-right">Precio</th>
                  <th className="py-3.5 px-4 font-medium text-right">Invertido</th>
                  <th className="py-3.5 px-4 font-medium text-right">Valor Actual</th>
                  <th className="py-3.5 px-4 font-medium text-right">Ganancia</th>
                  <th className="py-3.5 px-4 font-medium text-right">Rentabilidad</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-fg-2)] divide-y divide-[var(--color-ink-3)]">
                {filteredFunds.map((f) => {
                  const v = views.get(f.id)!;
                  const isP = v.plPositive !== false;

                  const sourceInfo = getFundDataSourceInfo(f);
                  const bankInfo = getBankPortalInfo(f);

                  return (
                    <tr key={f.id} className="hover:bg-[var(--color-ink-2)] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--color-fg-1)] text-xs">{sanitizeFundName(f.name)}</div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-5)] mt-0.5">
                          <span>{f.isin}</span>
                          <button
                            onClick={() => copyIsinToClipboard(f.isin)}
                            className="text-[var(--color-fg-5)] hover:text-[var(--color-fg-1)] transition-colors"
                            title="Copiar ISIN"
                          >
                            {copiedIsin === f.isin ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>
                          <a
                            href={sourceInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-fg-5)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-0.5"
                            title={`Ver fuente en ${sourceInfo.name}`}
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium">
                        {bankInfo ? (
                          <a
                            href={bankInfo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-fg-2)] hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 group"
                            title={`Ver en web de ${bankInfo.name}`}
                          >
                            <span>{bankInfo.name}</span>
                            <ExternalLink size={10} className="text-[var(--color-fg-5)] group-hover:text-[var(--color-accent)] transition-colors" />
                          </a>
                        ) : (
                          <span className="text-[var(--color-fg-5)]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[var(--color-fg-1)]">{f.shares.toFixed(4)}</td>
                      <td className="py-3.5 px-4 text-right text-[var(--color-fg-4)]">{fmtEur(f.purchase_price)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-[var(--color-fg-1)]">{v.priceLabel}</div>
                        {v.navDateLabel && <div className={`text-[10px] ${v.stale ? "text-[var(--color-warn)]" : "text-[var(--color-fg-4)]"}`}>{v.navDateLabel}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[var(--color-fg-4)]">{fmtEur(v.invested)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-[var(--color-fg-1)]">{fmtEur(v.value)}</td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isP ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                        {v.plLabel ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {v.plPctLabel ? (
                          <span className={`px-2 py-0.5 rounded-full font-bold ${isP ? "bg-[var(--color-profit)]/12 text-[var(--color-profit)]" : "bg-[var(--color-loss)]/12 text-[var(--color-loss)]"}`}>
                            {v.plPctLabel}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
