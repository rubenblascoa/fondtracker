import React, { useState, useMemo } from "react";
import { getSpecificFundUrl, getFundDataSourceInfo, getBankPortalInfo, type Investment, type Status } from "../api";
import { FundCard } from "./FundCard";
import { 
  Search, ArrowUpDown, Plus, LayoutGrid, List, Copy, 
  Check, TrendingUp, ArrowUpRight, ArrowDownRight, Layers, 
  Building2, Activity, ExternalLink, Sparkles, RefreshCw, BarChart3
} from "lucide-react";
import { sanitizeFundName } from "../utils";

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 2 
  }).format(n);
}

function fmtPct(n: number) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

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

  const totalInvested = status?.total_initial ?? funds.reduce((acc, f) => acc + (f.total_invested || f.shares * f.purchase_price), 0);
  const totalCurrent = status?.total_current ?? funds.reduce((acc, f) => acc + ((f.current_price ?? f.purchase_price) * f.shares), 0);
  const totalProfitLoss = totalCurrent - totalInvested;
  const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

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

  // Best performer
  const bestPerformer = useMemo(() => {
    if (funds.length === 0) return null;
    const sorted = [...funds].map(f => {
      const cur = (f.current_price ?? f.purchase_price) * f.shares;
      const inv = f.total_invested || (f.shares * f.purchase_price);
      const pl = cur - inv;
      const pct = inv > 0 ? (pl / inv) * 100 : 0;
      return { fund: f, pct, pl };
    }).sort((a, b) => b.pct - a.pct);
    return sorted[0];
  }, [funds]);

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
      const aVal = (a.current_price ?? a.purchase_price) * a.shares;
      const bVal = (b.current_price ?? b.purchase_price) * b.shares;
      const aInv = a.total_invested || (a.shares * a.purchase_price);
      const bInv = b.total_invested || (b.shares * b.purchase_price);
      const aPL = aVal - aInv;
      const bPL = bVal - bInv;
      const aPct = aInv > 0 ? (aPL / aInv) : 0;
      const bPct = bInv > 0 ? (bPL / bInv) : 0;

      if (sortBy === "value") return bVal - aVal;
      if (sortBy === "profit") return bPL - aPL;
      if (sortBy === "profit_pct") return bPct - aPct;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [funds, searchQuery, selectedBankFilter, selectedCategoryFilter, sortBy]);

  const copyIsinToClipboard = (isin: string) => {
    navigator.clipboard.writeText(isin);
    setCopiedIsin(isin);
    setTimeout(() => setCopiedIsin(null), 2000);
  };

  return (
    <div className="space-y-6 dash-cascade">
      
      {/* ── Portfolio Header KPIs Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Invested */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-0.5 sm:mb-1">Total Invertido</div>
            <div className="text-base sm:text-xl font-bold font-mono text-[var(--color-fg-1)] truncate">{fmtEur(totalInvested)}</div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-[var(--color-fg-5)] mt-1 truncate">{funds.length} {funds.length === 1 ? "posición" : "posiciones"}</div>
        </div>

        {/* Current Market Value */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-0.5 sm:mb-1">Valoración Actual</div>
            <div className="text-base sm:text-xl font-bold font-mono text-[var(--color-fg-1)] truncate">{fmtEur(totalCurrent)}</div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-[var(--color-fg-5)] mt-1 truncate">Precio liquidativo (NAV)</div>
        </div>

        {/* Total Profit / Loss */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-0.5 sm:mb-1">Plusvalía Latente</div>
            <div className={`text-base sm:text-xl font-bold font-mono truncate ${totalProfitLoss >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
              {totalProfitLoss >= 0 ? "+" : ""}{fmtEur(totalProfitLoss)}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono font-medium text-[var(--color-fg-4)] mt-1 truncate">
            {fmtPct(totalProfitLossPct)} • Exenta IRPF
          </div>
        </div>

        {/* Best Performer */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-0.5 sm:mb-1">Activo Más Rentable</div>
            {bestPerformer ? (
              <>
                <div className="text-xs sm:text-sm font-bold text-[var(--color-fg-1)] truncate">{sanitizeFundName(bestPerformer.fund.name)}</div>
                <div className="text-[11px] sm:text-xs font-mono text-[var(--color-profit)] font-bold mt-0.5 truncate">
                  {fmtPct(bestPerformer.pct)} ({fmtEur(bestPerformer.pl)})
                </div>
              </>
            ) : (
              <div className="text-xs text-[var(--color-fg-5)] mt-1">Sin fondos</div>
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] text-[var(--color-fg-5)] mt-1 truncate">{bestPerformer?.fund.isin || "—"}</div>
        </div>

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
              className="px-3 sm:px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-xs rounded-xl shadow-[0_0_12px_rgba(57,255,136,0.2)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
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
                ? "bg-white text-[var(--color-accent-fg)] font-bold shadow-sm"
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
                  ? "bg-white text-[var(--color-accent-fg)] font-bold shadow-sm"
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
                  <th className="py-3.5 px-4 font-medium text-right">NAV Actual</th>
                  <th className="py-3.5 px-4 font-medium text-right">Invertido</th>
                  <th className="py-3.5 px-4 font-medium text-right">Valor Actual</th>
                  <th className="py-3.5 px-4 font-medium text-right">Plusvalía (€)</th>
                  <th className="py-3.5 px-4 font-medium text-right">Rentabilidad</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-fg-2)] divide-y divide-[var(--color-ink-3)]">
                {filteredFunds.map((f) => {
                  const invested = f.total_invested || (f.shares * f.purchase_price);
                  const curPrice = f.current_price ?? f.purchase_price;
                  const currentVal = curPrice * f.shares;
                  const pl = currentVal - invested;
                  const plPct = invested > 0 ? (pl / invested) * 100 : 0;
                  const isP = pl >= 0;

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
                      <td className="py-3.5 px-4 text-right font-bold text-[var(--color-fg-1)]">{fmtEur(curPrice)}</td>
                      <td className="py-3.5 px-4 text-right text-[var(--color-fg-4)]">{fmtEur(invested)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-[var(--color-fg-1)]">{fmtEur(currentVal)}</td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isP ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                        {isP ? "+" : ""}{fmtEur(pl)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded font-bold ${isP ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {fmtPct(plPct)}
                        </span>
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
