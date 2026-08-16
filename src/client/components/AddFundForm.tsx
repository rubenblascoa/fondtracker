import React, { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import { api, type FundCatalogEntry, type FundSearchResult } from "../api";
import { 
  Search, Plus, Check, AlertCircle, Sparkles, Building2, 
  Calendar, Layers, ArrowRight, X, Info, Shield, TrendingUp,
  CreditCard, HelpCircle, Zap, RefreshCw, Bookmark, DollarSign,
  PieChart as PieIcon, ArrowUpRight, CheckCircle2, Landmark, Clock
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts";
import { sanitizeFundName } from "../utils";

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 2 
  }).format(n);
}

type Props = {
  onAdded: () => void;
};

const POPULAR_QUICK_FUNDS = [
  { isin: "IE0032126645", name: "Vanguard S&P 500 Index Fund EUR", bank: "Vanguard", category: "Renta Variable USA" },
  { isin: "IE00B03HD191", name: "Vanguard Global Stock Index Fund", bank: "Vanguard", category: "Renta Variable Global" },
  { isin: "LU0996177263", name: "Amundi Index MSCI World UCITS", bank: "Amundi", category: "Renta Variable Global" },
  { isin: "IE00B4L5Y983", name: "iShares Core MSCI World UCITS ETF", bank: "iShares", category: "ETF Global" },
  { isin: "ES0109360000", name: "Santander Dividendo Europa FI", bank: "Santander", category: "Renta Variable Europa" },
  { isin: "ES0147214037", name: "Ibercaja Renta Fija Sostenible FI", bank: "Ibercaja", category: "Renta Fija Euro" },
];

export function AddFundForm({ onAdded }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FundSearchResult | null>(null);
  const [selectedFund, setSelectedFund] = useState<FundCatalogEntry | null>(null);
  const [shares, setShares] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"amount" | "shares">("amount");
  const [selectedFundChart, setSelectedFundChart] = useState<any | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bankFilter, setBankFilter] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string, bank?: string) => {
    setSearching(true);
    try {
      const result = await api.searchFunds(q, bank);
      setSearchResults(result);
      setShowResults(true);
    } catch {
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFund) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      doSearch(searchQuery, bankFilter || undefined);
    }, 200);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, bankFilter, selectedFund, doSearch]);

  useEffect(() => {
    if (!selectedFund && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedFund]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load all funds initially on mount
  useEffect(() => {
    if (initialLoaded) return;
    setInitialLoaded(true);
    doSearch("", bankFilter || undefined);
  }, [initialLoaded, bankFilter, doSearch]);

  // Fetch chart data on select to enable automatic historical price lookup
  useEffect(() => {
    if (!selectedFund) {
      setSelectedFundChart(null);
      return;
    }
    setLoadingChart(true);
    api.getChartData(selectedFund.isin, "max")
      .then((data) => {
        setSelectedFundChart(data);
      })
      .catch(() => {})
      .finally(() => setLoadingChart(false));
  }, [selectedFund]);

  // Autofill purchase price when date or chart changes
  useEffect(() => {
    if (!selectedFundChart || !purchaseDate) return;
    
    const targetTime = new Date(purchaseDate).getTime() / 1000;
    const quotes = selectedFundChart.quotes;
    if (!quotes || quotes.length === 0) {
      if (selectedFundChart.currentPrice > 0) {
        setPurchasePrice(selectedFundChart.currentPrice.toFixed(4));
      }
      return;
    }

    let closestQuote = quotes[0];
    let minDiff = Math.abs(quotes[0].timestamp - targetTime);
    for (const q of quotes) {
      const diff = Math.abs(q.timestamp - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestQuote = q;
      }
    }
    
    if (closestQuote && closestQuote.close > 0) {
      setPurchasePrice(closestQuote.close.toFixed(4));
    }
  }, [purchaseDate, selectedFundChart]);

  const selectFund = (fund: FundCatalogEntry | typeof POPULAR_QUICK_FUNDS[0]) => {
    setSelectedFund({
      isin: fund.isin,
      name: fund.name,
      bank: fund.bank,
      category: fund.category,
      riskLevel: (fund as any).riskLevel || 5,
      currency: "EUR",
      yahooTicker: null
    });
    setPurchasePrice("");
    setShares("");
    setSearchQuery("");
    setError(null);
    setShowResults(false);
  };

  const deselectFund = () => {
    setSelectedFund(null);
    setPurchasePrice("");
    setShares("");
    setAmount("");
    setMode("amount");
    setSelectedFundChart(null);
    setNotes("");
    setError(null);
    setShowResults(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFund) {
      setError("Selecciona un fondo del catálogo");
      return;
    }
    const priceVal = parseFloat(purchasePrice);
    let sharesVal = 0;
    
    if (mode === "amount") {
      const amountVal = parseFloat(amount);
      if (!Number.isFinite(amountVal) || amountVal <= 0) {
        setError("El importe invertido debe ser un número positivo");
        return;
      }
      if (!Number.isFinite(priceVal) || priceVal <= 0) {
        setError("El precio liquidativo debe ser un número positivo");
        return;
      }
      sharesVal = amountVal / priceVal;
    } else {
      sharesVal = parseFloat(shares);
      if (!Number.isFinite(sharesVal) || sharesVal <= 0) {
        setError("El número de participaciones debe ser positivo");
        return;
      }
      if (!Number.isFinite(priceVal) || priceVal <= 0) {
        setError("El precio liquidativo debe ser un número positivo");
        return;
      }
    }
    if (!purchaseDate) {
      setError("Selecciona una fecha de compra");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.addFund({
        isin: selectedFund.isin,
        shares: sharesVal,
        purchase_price: priceVal,
        purchase_date: purchaseDate,
        notes: notes.trim() || undefined,
      });
      
      const fundName = selectedFund.name.length > 40
        ? selectedFund.name.slice(0, 40) + "..."
        : selectedFund.name;
      
      setSelectedFund(null);
      setShares("");
      setAmount("");
      setPurchasePrice("");
      setPurchaseDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setSearchQuery("");
      setSuccess(`Posición de ${fundName} añadida con éxito`);
      setTimeout(() => setSuccess(null), 4000);
      onAdded();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const totalEstimate =
    mode === "amount"
      ? (amount ? parseFloat(amount) : 0)
      : (shares && purchasePrice
        ? (parseFloat(shares) * parseFloat(purchasePrice))
        : 0);

  const calculatedShares =
    mode === "amount" && amount && purchasePrice && parseFloat(purchasePrice) > 0
      ? (parseFloat(amount) / parseFloat(purchasePrice))
      : mode === "shares" && shares ? parseFloat(shares) : 0;

  // Format quotes for mini chart
  const miniChartData = React.useMemo(() => {
    if (!selectedFundChart?.quotes || selectedFundChart.quotes.length === 0) return [];
    return selectedFundChart.quotes.slice(-30).map((q: any) => ({
      date: new Date(q.timestamp * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      price: q.close
    }));
  }, [selectedFundChart]);

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Banner ── */}
      <div className="bg-gradient-to-r from-[var(--color-ink-1)] to-[var(--color-ink-2)] border border-white/10 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[var(--color-accent)]/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] rounded-full text-xs font-semibold mb-3">
            <Plus size={13} strokeWidth={2.5} />
            <span>Registro de Inversión &amp; Catálogo Europeo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Añadir Posición a tu Cartera
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Busca en nuestro catálogo de fondos indexados, ETFs y fondos bancarios o introduce directamente cualquier código ISIN con cálculo automático de participaciones.
          </p>
        </div>
      </div>

      {/* ── Step Indicator Breadcrumb ── */}
      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-3.5 flex items-center gap-3 text-xs font-mono">
        <div className={`flex items-center gap-2 font-bold ${!selectedFund ? "text-[var(--color-accent)]" : "text-gray-400"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${!selectedFund ? "bg-[var(--color-accent)] text-black" : "bg-white/10 text-white"}`}>
            1
          </span>
          <span>1. Seleccionar Fondo o ETF</span>
        </div>
        <div className="w-10 h-px bg-white/10" />
        <div className={`flex items-center gap-2 font-bold ${selectedFund ? "text-[var(--color-accent)]" : "text-gray-600"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${selectedFund ? "bg-[var(--color-accent)] text-black" : "bg-white/5 text-gray-500"}`}>
            2
          </span>
          <span>2. Datos de Suscripción &amp; Liquidativo</span>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 flex items-center gap-3">
          <Check size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Main 2-Column Responsive Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: Search or Form (7 Cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {!selectedFund ? (
            /* ═══════════════════════════════════════════════════════════════════
                STEP 1: CATALOG SEARCH & DISCOVERY
               ═══════════════════════════════════════════════════════════════════ */
            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-5" ref={resultsRef}>
              
              {/* Quick Popular Picks Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-400" /> Fondos &amp; ETFs Más Populares
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_QUICK_FUNDS.map(pf => (
                    <button
                      key={pf.isin}
                      type="button"
                      onClick={() => selectFund(pf)}
                      className="px-3 py-1.5 bg-black/40 hover:bg-white/10 border border-white/5 hover:border-[var(--color-accent)]/40 rounded-xl text-xs text-gray-300 hover:text-white transition-all flex items-center gap-2 text-left"
                    >
                      <span className="font-mono text-[10px] text-[var(--color-accent)] font-bold">{pf.isin}</span>
                      <span className="truncate max-w-[140px] sm:max-w-none">{pf.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Header Bar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Buscar por ISIN (ej: IE00B03HD191), nombre o gestora..."
                    className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-2xl pl-11 pr-10 py-3.5 text-xs font-medium text-white outline-none transition-all placeholder:text-gray-500"
                    spellCheck={false}
                  />
                  {searching ? (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <RefreshCw size={14} className="animate-spin text-[var(--color-accent)]" />
                    </div>
                  ) : searchQuery ? (
                    <button
                      onClick={() => { setSearchQuery(""); doSearch(""); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  ) : null}
                </div>

                {/* Bank Filter Select */}
                <div className="sm:w-56 shrink-0 relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={bankFilter}
                    onChange={(e) => { setBankFilter(e.target.value); doSearch(searchQuery, e.target.value); }}
                    className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-2xl pl-10 pr-8 py-3.5 text-xs text-gray-200 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[var(--color-ink-2)] text-white">Todas las entidades</option>
                    {searchResults?.banks?.map((b) => (
                      <option key={b} value={b} className="bg-[var(--color-ink-2)] text-white">{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results Counter */}
              <div className="flex justify-between items-center px-1 text-xs text-gray-400 font-mono">
                <span>
                  {searchResults ? `${searchResults.total} fondos indexados y ETFs encontrados` : "Explora el catálogo europeo"}
                </span>
                <span className="flex items-center gap-1 text-[var(--color-accent)] text-[11px]">
                  <Sparkles size={12} /> Búsqueda en tiempo real
                </span>
              </div>

              {/* Results List Cards */}
              {searchResults && searchResults.results.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                  {searchResults.results.map((f) => (
                    <div
                      key={f.isin}
                      onClick={() => selectFund(f)}
                      className="p-4 bg-black/30 hover:bg-white/[0.04] border border-white/5 hover:border-[var(--color-accent)]/40 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1 truncate pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-md border border-[var(--color-accent)]/20">
                            {f.isin}
                          </span>
                          {f.bank && (
                            <span className="text-[11px] font-medium px-2 py-0.5 bg-white/5 text-gray-300 rounded-md border border-white/10">
                              {f.bank}
                            </span>
                          )}
                          {f.category && (
                            <span className="text-[11px] text-gray-400">
                              • {f.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white group-hover:text-[var(--color-accent)] transition-colors truncate">
                          {sanitizeFundName(f.name)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {f.riskLevel && (
                          <span className="text-[10px] font-mono px-2 py-1 bg-white/5 text-gray-400 rounded-md">
                            Riesgo {f.riskLevel}/7
                          </span>
                        )}
                        <button
                          type="button"
                          className="px-3.5 py-1.5 bg-[var(--color-accent)]/10 group-hover:bg-[var(--color-accent)] text-[var(--color-accent)] group-hover:text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
                        >
                          <span>Seleccionar</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults && (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-black/20 space-y-3">
                  <p className="text-sm font-bold text-white">¿No encuentras el fondo?</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Puedes introducir cualquier código ISIN válido de 12 dígitos arriba y el sistema lo registrará automáticamente con su precio de mercado.
                  </p>
                  {/^[A-Z]{2}[A-Z0-9]{10}$/i.test(searchQuery.trim()) && (
                    <button
                      onClick={() => selectFund({ isin: searchQuery.trim().toUpperCase(), name: `Fondo ${searchQuery.trim().toUpperCase()}`, bank: "Otro", category: "Inversión Directa" })}
                      className="px-4 py-2 bg-[var(--color-accent)] text-black font-bold text-xs rounded-xl shadow-lg transition-all"
                    >
                      Registrar ISIN: {searchQuery.trim().toUpperCase()}
                    </button>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════
                STEP 2: PURCHASE DETAILS FORM
               ═══════════════════════════════════════════════════════════════════ */
            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6">
              <form onSubmit={submit} className="space-y-6">
                
                {/* Selected Fund Banner */}
                <div className="bg-black/40 border border-[var(--color-accent)]/30 rounded-2xl p-5 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[var(--color-accent)] text-black rounded-lg">
                        {selectedFund.isin}
                      </span>
                      {selectedFund.bank && (
                        <span className="text-xs font-medium px-2.5 py-1 bg-white/10 text-white rounded-lg">
                          {selectedFund.bank}
                        </span>
                      )}
                      {selectedFund.category && (
                        <span className="text-xs text-gray-400">
                          {selectedFund.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{sanitizeFundName(selectedFund.name)}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={deselectFund}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white rounded-xl transition-all self-start sm:self-center flex items-center gap-1.5"
                  >
                    <X size={14} /> Cambiar fondo
                  </button>
                </div>

                {/* Mode Switcher */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block">
                    Modalidad de Registro
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl max-w-md">
                    <button
                      type="button"
                      onClick={() => setMode("amount")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                        mode === "amount"
                          ? "bg-[var(--color-accent)] text-black shadow-[0_0_15px_rgba(57,255,136,0.2)] font-bold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <CreditCard size={14} />
                      <span>Por Importe Total (€)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("shares")}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                        mode === "shares"
                          ? "bg-[var(--color-accent)] text-black shadow-[0_0_15px_rgba(57,255,136,0.2)] font-bold"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Layers size={14} />
                      <span>Por Participaciones</span>
                    </button>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {mode === "amount" ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block">
                        Importe Invertido (€) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="1000.00"
                          className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-2xl pl-4 pr-10 py-3.5 text-base font-mono font-bold text-white outline-none transition-all"
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400 font-bold">€</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block">
                        Participaciones *
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={shares}
                        onChange={(e) => setShares(e.target.value)}
                        placeholder="50.2541"
                        className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-2xl px-4 py-3.5 text-base font-mono font-bold text-white outline-none transition-all"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block">
                      Fecha de Compra *
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-2xl px-4 py-3.5 text-xs font-mono text-white outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                        Precio (NAV) *
                      </label>
                      {loadingChart && (
                        <span className="text-[10px] font-mono text-[var(--color-accent)] animate-pulse">
                          Buscando...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="125.45"
                        className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-2xl pl-4 pr-10 py-3.5 text-base font-mono font-bold text-white outline-none transition-all"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400 font-bold">€</span>
                    </div>
                  </div>

                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block">
                    Notas u Observaciones (Opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Aportación mensual periódica, traspaso de cartera..."
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)]/50 rounded-2xl p-3.5 text-xs text-white outline-none transition-all placeholder:text-gray-600 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={deselectFund}
                    className="px-5 py-3 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 bg-[var(--color-accent)] text-black font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(57,255,136,0.3)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Guardando Posición...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} strokeWidth={3} />
                        <span>Registrar Inversión</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

        </div>

        {/* ── Right Column: Live Order Simulation & Information Hub (5 Cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {selectedFund ? (
            /* Selected Fund Live Simulation Card */
            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-wider font-bold block mb-1">
                  Resumen de la Orden en Vivo
                </span>
                <h3 className="text-base font-bold text-white leading-snug">
                  {sanitizeFundName(selectedFund.name)}
                </h3>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase">Capital a Invertir</div>
                  <div className="text-lg font-bold text-white mt-0.5">{fmtEur(totalEstimate)}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase">Participaciones</div>
                  <div className="text-lg font-bold text-[var(--color-accent)] mt-0.5">
                    {calculatedShares ? calculatedShares.toFixed(4) : "0.0000"}
                  </div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase">Precio NAV Entrada</div>
                  <div className="text-sm font-bold text-gray-300 mt-0.5">{purchasePrice ? `${purchasePrice} €` : "—"}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase">Entidad Custodia</div>
                  <div className="text-sm font-bold text-gray-300 mt-0.5 truncate">{selectedFund.bank || "General"}</div>
                </div>
              </div>

              {/* Sparkline / Historical Trend Chart Preview */}
              {miniChartData.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-400">Evolución Reciente del NAV</span>
                    <span className="text-[var(--color-accent)] font-bold">{selectedFundChart?.currentPrice?.toFixed(2)} €</span>
                  </div>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={miniChartData}>
                        <defs>
                          <linearGradient id="fundPreviewGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="var(--color-accent)" 
                          strokeWidth={2} 
                          fill="url(#fundPreviewGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Help tip */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>
                  Esta posición se sincronizará automáticamente con las alertas de WhatsApp y los informes fiscales de patrimonio.
                </span>
              </div>
            </div>
          ) : (
            /* Educational / Features Info Card */
            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-5 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1.5">
                  <Landmark size={18} className="text-[var(--color-accent)]" />
                  Ventajas del Catálogo FondTracker
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Todos los fondos registrados se actualizan diariamente al cierre del mercado con las cotizaciones oficiales de QueFondos y Yahoo Finance.
                </p>
              </div>

              <div className="space-y-3 text-xs text-gray-300">
                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Shield size={14} className="text-blue-400" />
                    Diferimiento Fiscal Español
                  </span>
                  <p className="text-[11px] text-gray-400">
                    Los fondos traspasables te permiten cambiar de estrategia sin pagar peaje fiscal por plusvalías acumuladas.
                  </p>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Clock size={14} className="text-amber-400" />
                    Liquidación Diaria
                  </span>
                  <p className="text-[11px] text-gray-400">
                    El precio liquidativo oficial de los fondos de inversión se publica al cierre de la sesión de mercado.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
