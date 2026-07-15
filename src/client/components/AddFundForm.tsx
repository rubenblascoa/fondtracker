import { useState, useCallback, useEffect, useRef, type FormEvent } from "react";
import { api, type FundCatalogEntry, type FundSearchResult } from "../api";

type Props = {
  onAdded: () => void;
};

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
        setShowResults(true);
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
    setShowResults(true);
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
      setPurchasePrice(selectedFundChart.currentPrice.toFixed(4));
      return;
    }

    // Find quote with closest timestamp
    let closestQuote = quotes[0];
    let minDiff = Math.abs(quotes[0].timestamp - targetTime);
    for (const q of quotes) {
      const diff = Math.abs(q.timestamp - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestQuote = q;
      }
    }
    
    setPurchasePrice(closestQuote.close.toFixed(4));
  }, [purchaseDate, selectedFundChart]);

  const selectFund = (fund: FundCatalogEntry) => {
    setSelectedFund(fund);
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
      setError("Selecciona un fondo de la lista");
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
        setError("El precio de compra debe ser un número positivo");
        return;
      }
      sharesVal = amountVal / priceVal;
    } else {
      sharesVal = parseFloat(shares);
      if (!Number.isFinite(sharesVal) || sharesVal <= 0) {
        setError("Las participaciones deben ser un número positivo");
        return;
      }
      if (!Number.isFinite(priceVal) || priceVal <= 0) {
        setError("El precio de compra debe ser un número positivo");
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
      setSuccess(`${fundName} · añadido`);
      setTimeout(() => setSuccess(null), 3000);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const totalEstimate =
    mode === "amount"
      ? (amount ? parseFloat(amount).toFixed(2) : null)
      : (shares && purchasePrice
        ? (parseFloat(shares) * parseFloat(purchasePrice)).toFixed(2)
        : null);

  const calculatedShares =
    mode === "amount" && amount && purchasePrice
      ? (parseFloat(amount) / parseFloat(purchasePrice)).toFixed(6)
      : null;

  return (
    <form
      onSubmit={submit}
      className="border border-[var(--color-ink-3)] bg-[var(--color-ink-1)] slide-up"
    >
      {!selectedFund ? (
        <div className="p-4 space-y-3" ref={resultsRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setShowResults(true)}
                placeholder="buscar fondo por nombre, ISIN o entidad..."
                className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 text-[var(--color-fg-1)] font-mono text-sm outline-none transition-colors placeholder:text-[var(--color-fg-4)]"
                spellCheck={false}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-pulse" />
                </div>
              )}
            </div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2 text-[var(--color-fg-2)] font-mono text-xs outline-none transition-colors shrink-0"
            >
              <option value="">todos</option>
              {searchResults?.banks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {searchResults && showResults && searchResults.results.length > 0 && (
            <div className="max-h-72 overflow-y-auto scrollbar-thin border border-[var(--color-ink-3)] divide-y divide-[var(--color-ink-3)]">
              {searchResults.results.map((fund) => (
                <button
                  key={fund.isin}
                  type="button"
                  onClick={() => selectFund(fund)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-ink-2)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-[var(--color-fg-1)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                        {fund.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--color-fg-4)] font-mono">
                          {fund.isin}
                        </span>
                        <span className="text-[var(--color-ink-4)]">·</span>
                        <span className="text-[10px] text-[var(--color-fg-3)]">
                          {fund.bank}
                        </span>
                        <span className="text-[var(--color-ink-4)]">·</span>
                        <span className="text-[10px] text-[var(--color-fg-4)]">
                          {fund.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 border border-[var(--color-ink-3)] text-[var(--color-fg-4)] font-mono">
                        {fund.currency}
                      </span>
                      {fund.yahooTicker && (
                        <span className="text-[9px] px-1.5 py-0.5 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono bg-[var(--color-accent)]/5">
                          live
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults && showResults && searchResults.results.length === 0 && searchQuery.length > 0 && !searching && (
            <div className="text-xs text-[var(--color-fg-4)] text-center py-4 border border-dashed border-[var(--color-ink-3)]">
              nada para "{searchQuery}" — prueba con otro término
            </div>
          )}

          {!searchQuery && !bankFilter && searchResults && searchResults.results.length > 0 && (
            <div className="text-[10px] text-[var(--color-fg-4)] text-center">
              {searchResults.total} fondos disponibles — escribe para filtrar
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-4 slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-[var(--color-fg-1)] font-medium">
                {selectedFund.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-[var(--color-fg-4)] font-mono">
                  {selectedFund.isin}
                </span>
                <span className="text-[var(--color-ink-4)]">·</span>
                <span className="text-[10px] text-[var(--color-fg-3)]">
                  {selectedFund.bank}
                </span>
                <span className="text-[var(--color-ink-4)]">·</span>
                <span className="text-[10px] text-[var(--color-fg-4)]">
                  {selectedFund.category}
                </span>
                {selectedFund.yahooTicker && (
                  <>
                    <span className="text-[var(--color-ink-4)]">·</span>
                    <span className="text-[9px] text-[var(--color-accent)] font-mono">
                      precio en vivo
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={deselectFund}
              className="text-[var(--color-fg-4)] hover:text-[var(--color-danger)] text-[10px] uppercase tracking-wider font-mono transition-colors shrink-0 px-2 py-1 border border-[var(--color-ink-3)] hover:border-[var(--color-danger)]/30"
            >
              cambiar
            </button>
          </div>
            {/* Mode Switcher */}
          <div className="flex gap-1 border-b border-[var(--color-ink-3)] pb-2 mb-2">
            <button
              type="button"
              onClick={() => setMode("amount")}
              className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border transition-all ${
                mode === "amount"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5"
                  : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-3)]"
              }`}
            >
              Por Importe (€)
            </button>
            <button
              type="button"
              onClick={() => setMode("shares")}
              className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border transition-all ${
                mode === "shares"
                  ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5"
                  : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-3)]"
              }`}
            >
              Por Participaciones
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mode === "amount" ? (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5">
                  importe invertido
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 text-[var(--color-fg-1)] font-mono text-sm outline-none transition-colors placeholder:text-[var(--color-fg-4)]"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5">
                  participaciones
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="150"
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 text-[var(--color-fg-1)] font-mono text-sm outline-none transition-colors placeholder:text-[var(--color-fg-4)]"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5">
                precio por participacion ({selectedFund.currency})
              </label>
              <input
                type="number"
                step="0.000001"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="45.50"
                className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 text-[var(--color-fg-1)] font-mono text-sm outline-none transition-colors placeholder:text-[var(--color-fg-4)]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5">
                fecha de compra
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 text-[var(--color-fg-1)] font-mono text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5">
              notas <span className="text-[var(--color-ink-5)]">(opcional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ahorro mensual, plan de pensiones, etc."
              className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 text-[var(--color-fg-1)] font-mono text-sm outline-none transition-colors placeholder:text-[var(--color-fg-4)]"
            />
          </div>

          {totalEstimate && (
            <div className="flex flex-col gap-1 border-t border-[var(--color-ink-3)] pt-3 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-fg-4)]">total invertido</span>
                <span className="text-[var(--color-fg-1)] text-xs font-semibold">
                  {totalEstimate}{selectedFund.currency === "EUR" ? "€" : " " + selectedFund.currency}
                </span>
              </div>
              {calculatedShares && (
                <div className="flex items-center justify-between text-[9px] text-[var(--color-fg-4)]">
                  <span>participaciones estimadas</span>
                  <span>{calculatedShares}</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "amount" ? !amount : !shares) || !purchasePrice}
            className="font-pixel uppercase text-[11px] tracking-widest px-5 py-2.5 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-ink-0)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "guardando..." : "añadir a mi cartera"}
          </button>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-4 flex items-center gap-2 text-[var(--color-danger)] text-xs font-mono bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 px-3 py-2">
          <span className="shrink-0">!</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-4 mb-4 flex items-center gap-2 text-[var(--color-accent)] text-xs font-mono bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/20 px-3 py-2 slide-up">
          <span className="shrink-0">✓</span>
          <span>{success}</span>
        </div>
      )}
    </form>
  );
}
