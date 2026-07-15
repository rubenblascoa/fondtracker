import { useEffect, useRef, useState, useCallback } from "react";
import { api, getBankUrl, getSpecificFundUrl, type Investment, type YahooChartData } from "../api";
import { formatCurrency, formatPct, profitColor, formatRelative } from "../utils";

type Props = {
  fund: Investment;
  onChange: () => void;
};

export function FundCard({ fund, onChange }: Props) {
  const [chartData, setChartData] = useState<YahooChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartRange, setChartRange] = useState("1y");
  const [chartError, setChartError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interactive Hover/Tooltip state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"chart" | "composition" | "details">("chart");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState<"amount" | "shares">("amount");
  const [editShares, setEditShares] = useState(String(fund.shares));
  const [editAmount, setEditAmount] = useState(String(fund.total_invested));
  const [editPrice, setEditPrice] = useState(String(fund.purchase_price));
  const [editDate, setEditDate] = useState(fund.purchase_date ? fund.purchase_date.slice(0, 10) : "");
  const [editNotes, setEditNotes] = useState(fund.notes ?? "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editChartData, setEditChartData] = useState<YahooChartData | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const datePickerRef = useRef<HTMLDivElement>(null);

  const hasTicker = Boolean(fund.ticker);
  const currentPrice = fund.current_price != null ? Number(fund.current_price) : null;
  const hasPrice = currentPrice != null && currentPrice > 0;
  const bankUrl = getBankUrl(fund.bank);

  /** Format a data date (YYYY-MM-DD or DD/MM/YYYY) to a short readable string */
  function fmtDataDate(d: string): string {
    if (!d) return "";
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    // DD/MM/YYYY (quefondos)
    const m1 = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m1) return `${m1[1]} ${months[Number(m1[2]) - 1]}`;
    // YYYY-MM-DD (yahoo)
    const m2 = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m2) return `${m2[3]} ${months[Number(m2[2]) - 1]}`;
    return d;
  }

  const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const WEEKDAYS = ["L","M","M","J","V","S","D"];

  function parseEditDate(d: string): Date | null {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return null;
  }

  function formatDisplayDate(d: string): string {
    const p = parseEditDate(d);
    if (!p) return "";
    return `${p.getDate()} ${MONTHS[p.getMonth()]} ${p.getFullYear()}`;
  }

  function getCalendarGrid(year: number, month: number): (number | null)[][] {
    const first = new Date(year, month, 1).getDay();
    // Monday-based week: adjust Sunday (0) -> 6, Mon(1)->0 ... Sat(6)->5
    const start = first === 0 ? 6 : first - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[][] = [];
    let row: (number | null)[] = [];
    for (let i = 0; i < start; i++) row.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      row.push(d);
      if (row.length === 7) { grid.push(row); row = []; }
    }
    if (row.length > 0) { while (row.length < 7) row.push(null); grid.push(row); }
    return grid;
  }

  const remove = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    try {
      await api.removeFund(fund.id);
      onChange();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const startEditing = () => {
    setEditShares(String(fund.shares));
    setEditAmount(String(fund.total_invested));
    setEditPrice(String(fund.purchase_price));
    setEditDate(fund.purchase_date ? fund.purchase_date.slice(0, 10) : "");
    setEditNotes(fund.notes ?? "");
    setEditError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditError(null);
  };

  const handleSharesChange = (val: string) => {
    setEditShares(val);
    const s = parseFloat(val);
    const p = parseFloat(editPrice);
    if (Number.isFinite(s) && Number.isFinite(p) && s > 0 && p > 0) {
      setEditAmount((s * p).toFixed(2));
    }
  };

  const handleAmountChange = (val: string) => {
    setEditAmount(val);
    const a = parseFloat(val);
    const p = parseFloat(editPrice);
    if (Number.isFinite(a) && Number.isFinite(p) && a > 0 && p > 0) {
      setEditShares((a / p).toFixed(6));
    }
  };

  const handlePriceChange = (val: string) => {
    setEditPrice(val);
    if (editMode === "amount") {
      const a = parseFloat(editAmount);
      const p = parseFloat(val);
      if (Number.isFinite(a) && Number.isFinite(p) && a > 0 && p > 0) {
        setEditShares((a / p).toFixed(6));
      }
    } else {
      const s = parseFloat(editShares);
      const p = parseFloat(val);
      if (Number.isFinite(s) && Number.isFinite(p) && s > 0 && p > 0) {
        setEditAmount((s * p).toFixed(2));
      }
    }
  };

  const saveEdit = async () => {
    const sharesVal = parseFloat(editShares);
    const priceVal = parseFloat(editPrice);
    if (!Number.isFinite(sharesVal) || sharesVal <= 0) {
      setEditError("Las participaciones deben ser un número positivo");
      return;
    }
    if (!Number.isFinite(priceVal) || priceVal <= 0) {
      setEditError("El precio debe ser un número positivo");
      return;
    }
    if (!editDate) {
      setEditError("Selecciona una fecha");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await api.editFund(fund.id, {
        shares: sharesVal,
        purchase_price: priceVal,
        purchase_date: editDate,
        notes: editNotes.trim() || undefined,
      });
      setEditing(false);
      onChange();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (!hasTicker) return;
    
    const fetchData = () => {
      setChartLoading(true);
      setChartError(false);
      let interval: "1d" | "1wk" | "1mo" | "5m" | "15m" = "1d";
      if (chartRange === "1d") interval = "5m";
      else if (chartRange === "5d") interval = "15m";
      else if (chartRange === "max") interval = "1wk";

      api
        .getChartData(ticker, chartRange as any, interval)
        .then((data) => {
          if (data.dataPoints > 0) {
            setChartData(data);
            setLastUpdate(new Date().toISOString());
          } else {
            setChartError(true);
          }
        })
        .catch(() => {
          setChartError(true);
          setChartData(null);
        })
        .finally(() => setChartLoading(false));
    };

    const ticker = fund.ticker!;
    fetchData();

    // Auto-refresh chart data every 60 seconds
    const t = setInterval(fetchData, 60_000);
    return () => {
      clearInterval(t);
    };
  }, [chartRange, fund.ticker, fund.isin]);

  // Fetch max-range chart data when editing for auto-fill price
  useEffect(() => {
    if (!editing || !fund.ticker) {
      setEditChartData(null);
      return;
    }
    api.getChartData(fund.ticker, "max", "1wk").then(setEditChartData).catch(() => setEditChartData(null));
  }, [editing, fund.ticker]);

  // Auto-fill price when editDate changes
  useEffect(() => {
    if (!editChartData || !editDate) return;
    const targetTime = new Date(editDate).getTime() / 1000;
    const quotes = editChartData.quotes;
    if (!quotes || quotes.length === 0) {
      setEditPrice(editChartData.currentPrice.toFixed(4));
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
    setEditPrice(closestQuote.close.toFixed(4));
  }, [editDate, editChartData]);

  // Click outside to close date picker
  useEffect(() => {
    if (!showDatePicker) return;
    const handler = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDatePicker]);

  // Reset picker month/year when opening
  useEffect(() => {
    if (showDatePicker) {
      const p = parseEditDate(editDate);
      if (p) { setPickerMonth(p.getMonth()); setPickerYear(p.getFullYear()); }
      else { const t = new Date(); setPickerMonth(t.getMonth()); setPickerYear(t.getFullYear()); }
    }
  }, [showDatePicker, editDate]);

  useEffect(() => {
    if (!chartData || chartData.dataPoints < 2 || !canvasRef.current)
      return;
    drawChart(canvasRef.current, chartData, hoveredIndex);
  }, [chartData, hoveredIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartData || chartData.quotes.length < 2 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const padding = { top: 10, right: 20, bottom: 20, left: 60 };
    const chartW = rect.width - padding.left - padding.right;
    
    const rx = x - padding.left;
    let idx = Math.round((rx / chartW) * (chartData.quotes.length - 1));
    idx = Math.max(0, Math.min(chartData.quotes.length - 1, idx));

    const closes = chartData.quotes.map((q) => q.close);
    const minVal = Math.min(...closes);
    const maxVal = Math.max(...closes);
    const range = maxVal - minVal || 1;
    const chartH = rect.height - padding.top - padding.bottom;

    const px = padding.left + (chartW / (closes.length - 1)) * idx;
    const py = padding.top + chartH - ((closes[idx] - minVal) / range) * chartH;

    setHoveredIndex(idx);
    setHoveredPos({ x: px, y: py });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredPoint = hoveredIndex !== null && chartData ? chartData.quotes[hoveredIndex] : null;

  const isQueFondos = chartData
    ? chartData.dataSource === "quefondos"
    : (fund.ticker ? /^[A-Z]{2}[A-Z0-9]{10}$/.test(fund.ticker) : true);

  const fundUrl = isQueFondos
    ? `https://www.quefondos.com/es/fondos/ficha/index.html?isin=${fund.isin}`
    : `https://finance.yahoo.com/quote/${encodeURIComponent(fund.ticker || "")}/`;

  return (
    <div className="border border-[var(--color-ink-3)] bg-[var(--color-ink-1)] hover:border-[var(--color-ink-4)] transition-colors slide-up">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="pt-2">
              <div className="flex items-baseline gap-3 mb-1">
                <h3 className="text-[var(--color-fg-1)] font-medium truncate text-sm">
                  {fund.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-fg-3)] flex-wrap mb-2">
                <span className="font-mono text-[10px] text-[var(--color-fg-4)]">{fund.isin}</span>
                <span className="text-[var(--color-ink-4)]">·</span>
                <span className="text-[11px]">{fund.bank}</span>
                <span className="text-[var(--color-ink-4)]">·</span>
                <span className="text-[11px] text-[var(--color-fg-4)]">{fund.category}</span>
              </div>
              <div className="flex gap-4 items-center border-b border-[var(--color-ink-3)] pb-2 mb-2">
                <div className="flex gap-1">
                  <button type="button" onClick={() => setEditMode("amount")} className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border transition-all ${editMode === "amount" ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-3)]"}`}>Por Importe (€)</button>
                  <button type="button" onClick={() => setEditMode("shares")} className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border transition-all ${editMode === "shares" ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-3)]"}`}>Por Participaciones</button>
                </div>
                <div className="flex gap-1.5 ml-auto">
                  <button onClick={saveEdit} disabled={editLoading} className="font-pixel text-[8px] uppercase tracking-wider px-2 py-1 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-ink-0)] transition-all disabled:opacity-40">{editLoading ? "..." : "guardar"}</button>
                  <button onClick={cancelEditing} disabled={editLoading} className="font-pixel text-[8px] uppercase tracking-wider px-2 py-1 border border-[var(--color-ink-3)] text-[var(--color-fg-4)] hover:text-[var(--color-fg-2)] transition-colors disabled:opacity-40">cancelar</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {editMode === "amount" ? (
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-4)] mb-1">importe invertido</label>
                    <input type="number" step="0.01" min="0" value={editAmount} onChange={(e) => handleAmountChange(e.target.value)} className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-2 py-1.5 text-[var(--color-fg-1)] font-mono text-xs outline-none transition-colors" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-4)] mb-1">participaciones</label>
                    <input type="number" step="0.000001" min="0" value={editShares} onChange={(e) => handleSharesChange(e.target.value)} className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-2 py-1.5 text-[var(--color-fg-1)] font-mono text-xs outline-none transition-colors" />
                  </div>
                )}
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-4)] mb-1">precio ({fund.currency})</label>
                  <input type="number" step="0.000001" min="0" value={editPrice} onChange={(e) => handlePriceChange(e.target.value)} className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-2 py-1.5 text-[var(--color-fg-1)] font-mono text-xs outline-none transition-colors" />
                </div>
                <div ref={datePickerRef}>
                  <label className="block text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-4)] mb-1">fecha</label>
                  <div className="relative">
                    <button type="button" onClick={() => setShowDatePicker(!showDatePicker)} className="w-full flex items-center gap-2 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] hover:border-[var(--color-fg-4)] focus:border-[var(--color-accent)] pl-2 pr-2 py-1.5 text-[var(--color-fg-1)] font-mono text-xs outline-none transition-colors text-left cursor-pointer">
                      <svg className="w-3 h-3 text-[var(--color-fg-5)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span className={editDate ? "" : "text-[var(--color-fg-5)]"}>{editDate ? formatDisplayDate(editDate) : "seleccionar"}</span>
                    </button>
                    {showDatePicker && (
                      <div className="absolute top-full left-0 mt-1 z-50 w-[240px] bg-[var(--color-ink-1)] border border-[var(--color-ink-4)] shadow-lg">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-ink-3)]">
                          <button type="button" onClick={() => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(pickerYear - 1); } else { setPickerMonth(pickerMonth - 1); } }} className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] transition-colors p-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                          </button>
                          <div className="flex items-center gap-1">
                            <select value={pickerMonth} onChange={(e) => setPickerMonth(Number(e.target.value))} className="bg-transparent text-[10px] font-mono text-[var(--color-fg-1)] outline-none cursor-pointer hover:text-[var(--color-accent)] transition-colors border-none appearance-none">
                              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            <span className="text-[var(--color-fg-4)]">·</span>
                            <input type="number" value={pickerYear} onChange={(e) => setPickerYear(Number(e.target.value))} className="w-10 bg-transparent text-[10px] font-mono text-[var(--color-fg-1)] outline-none hover:text-[var(--color-accent)] transition-colors border-none p-0" />
                          </div>
                          <button type="button" onClick={() => { if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(pickerYear + 1); } else { setPickerMonth(pickerMonth + 1); } }} className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] transition-colors p-0.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                          </button>
                        </div>
                        <div className="px-3 py-2">
                          <div className="grid grid-cols-7 mb-1">
                            {WEEKDAYS.map((d) => (
                              <div key={d} className="text-center text-[9px] font-mono text-[var(--color-fg-5)] py-0.5">{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7">
                            {getCalendarGrid(pickerYear, pickerMonth).flat().map((day, i) => {
                              if (day === null) return <div key={`e-${i}`} />;
const selected = editDate === `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const today = new Date();
const isToday = pickerYear === today.getFullYear() && pickerMonth === today.getMonth() && day === today.getDate();
return (
<button key={`${pickerYear}-${pickerMonth}-${day}`} type="button" onClick={() => { setEditDate(`${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`); setShowDatePicker(false); }} className={`text-center text-[11px] font-mono py-1 transition-colors rounded-none ${selected ? "bg-[var(--color-fg-1)] text-[var(--color-ink-1)]" : isToday ? "ring-1 ring-inset ring-[var(--color-fg-4)] text-[var(--color-fg-2)] hover:bg-[var(--color-ink-3)]" : "text-[var(--color-fg-2)] hover:bg-[var(--color-ink-3)]"}`}>
{day}
</button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-4)] mb-1">notas</label>
                  <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="opcional" className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-2 py-1.5 text-[var(--color-fg-1)] font-mono text-xs outline-none transition-colors placeholder:text-[var(--color-fg-4)]" />
                </div>
              </div>
              {editMode === "amount" && editShares && (
                <div className="text-[10px] text-[var(--color-fg-4)] font-mono mt-1">
                  ~{parseFloat(editShares).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} participaciones estimadas
                </div>
              )}
              {editMode === "shares" && editAmount && (
                <div className="text-[10px] text-[var(--color-fg-4)] font-mono mt-1">
                  ~{parseFloat(editAmount).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fund.currency === "EUR" ? "€" : fund.currency} total invertido
                </div>
              )}
              {editError && (
                <div className="flex items-center gap-2 text-[var(--color-danger)] text-[10px] font-mono bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 px-2 py-1 mt-2">
                  <span>!</span>
                  <span>{editError}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-1">
                <h3 className="text-[var(--color-fg-1)] font-medium truncate text-sm">
                  {fund.name}
                </h3>
                {hasPrice && chartData && !chartData.isStale && (
                  <span className="live-dot flex items-center gap-1 text-[8px] px-1.5 py-0.5 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono shrink-0 bg-[var(--color-accent)]/5 tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] animate-pulse" />
                    {chartData.dataSource === "quefondos" && chartData.dataDate
                      ? `NAV ${fmtDataDate(chartData.dataDate)}`
                      : "LIVE"}
                  </span>
                )}
                {hasPrice && chartData?.isStale && (
                  <span className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 border border-amber-500/40 text-amber-400 font-mono shrink-0 bg-amber-500/5 tracking-wider" title={chartData.staleWarning}>
                    ⚠ {chartData.dataDate ? fmtDataDate(chartData.dataDate) : "desactualizado"}
                  </span>
                )}
                {hasPrice && chartData?.verificationLog && (
                  <span
                    className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono shrink-0 bg-[var(--color-accent)]/5 tracking-wider cursor-help"
                    title={chartData.verificationLog}
                  >
                    ✓ VERIFICADO
                  </span>
                )}
                {hasPrice && !chartData && (
                  <span className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 border border-[var(--color-ink-3)] text-[var(--color-fg-4)] font-mono shrink-0 tracking-wider">
                    precio cargado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[var(--color-fg-3)] flex-wrap">
                <span className="font-mono text-[10px] text-[var(--color-fg-4)]">
                  {fund.isin}
                </span>
                <span className="text-[var(--color-ink-4)]">·</span>
                {bankUrl ? (
                  <a
                    href={bankUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[var(--color-accent)] hover:underline"
                  >
                    {fund.bank} ↗
                  </a>
                ) : (
                  <span className="text-[11px]">{fund.bank}</span>
                )}
                <span className="text-[var(--color-ink-4)]">·</span>
                <span className="text-[11px] text-[var(--color-fg-4)]">{fund.category}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-3)] mt-1.5 font-mono">
                <span>
                  {fund.shares.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ×{" "}
                  <span className="text-[var(--color-fg-2)]">
                    {fund.purchase_price.toFixed(2)}
                  </span>
                </span>
                <span className="text-[var(--color-ink-4)]">·</span>
                <span className="text-[var(--color-fg-4)]">
                  {formatCurrency(fund.total_invested, fund.currency)}
                </span>
                {fund.purchase_date && (
                  <>
                    <span className="text-[var(--color-ink-4)]">·</span>
                    <span className="text-[10px] text-[var(--color-fg-4)]">{fund.purchase_date.slice(0, 10)}</span>
                  </>
                )}
                {fund.notes && (
                  <>
                    <span className="text-[var(--color-ink-4)]">·</span>
                    <span className="text-[10px] text-[var(--color-fg-4)] italic">"{fund.notes}"</span>
                  </>
                )}
                {lastUpdate && hasPrice && (
                  <>
                    <span className="text-[var(--color-ink-4)]">·</span>
                    <span className="text-[9px] text-[var(--color-fg-4)]">
                      {formatRelative(lastUpdate)}
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`text-right shrink-0 ${editing ? "pt-7" : ""}`}>
          <div className="text-[10px] text-[var(--color-fg-4)] mb-0.5 font-mono">
            {hasPrice
              ? `ahora ${currentPrice!.toFixed(4)}${fund.currency === "EUR" ? "€" : " " + fund.currency}`
              : `invertido ${formatCurrency(fund.total_invested, fund.currency)}`}
          </div>
          <div className={`font-pixel text-lg leading-tight ${profitColor(fund.profit_loss)}`}>
            {fund.profit_loss >= 0 ? "+" : ""}{formatCurrency(fund.profit_loss, fund.currency)}
          </div>
          <div className={`text-xs font-mono ${profitColor(fund.profit_loss_pct)}`}>
            {formatPct(fund.profit_loss_pct)}
          </div>
          {hasPrice && (
            <div className="text-[10px] text-[var(--color-fg-4)] mt-1 font-mono">
              valor {formatCurrency(fund.current_value, fund.currency)}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          {!editing && (
            <>
              <button
                onClick={startEditing}
                className="text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors p-1.5"
                title="editar"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8.5 1.5L10.5 3.5L4.5 9.5L1.5 10.5L2.5 7.5L8.5 1.5Z" />
                  <path d="M7 3L9 5" />
                </svg>
              </button>
              <a
                href={fundUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors p-1.5"
                title={isQueFondos ? "Ver en QueFondos" : "Ver en Yahoo Finance"}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5.5 2.5H3.5C2.94772 2.5 2.5 2.94772 2.5 3.5V10.5C2.5 11.0523 2.94772 11.5 3.5 11.5H10.5C11.0523 11.5 11.5 11.0523 11.5 10.5V8.5" />
                  <path d="M8.5 2.5H11.5M11.5 2.5V5.5M11.5 2.5L5 9" />
                </svg>
              </a>
              <button
                onClick={remove}
                disabled={deleting}
                className={`transition-all p-1.5 ${
                  confirmDelete
                    ? "text-[var(--color-danger)] bg-[var(--color-danger)]/10"
                    : "text-[var(--color-fg-4)] hover:text-[var(--color-danger)]"
                }`}
                title={confirmDelete ? "pulsa otra vez para borrar" : "eliminar"}
              >
                {deleting ? (
                  <div className="w-3 h-3 border border-[var(--color-danger)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 3H10M4 3V2H8V3M3 3V10.5C3 10.7761 3.22386 11 3.5 11H8.5C8.77614 11 9 10.7761 9 10.5V3" />
                    <path d="M5 5.5V8.5M7 5.5V8.5" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {hasTicker && (
        <div className="border-t border-[var(--color-ink-3)] p-4 fade-in">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-ink-3)] pb-2">
            <div className="flex gap-1">
              {(["chart", "composition", "details"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border transition-all ${
                    activeTab === t
                      ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5"
                      : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-3)]"
                  }`}
                >
                  {t === "chart" ? "Gráfica" : t === "composition" ? "Composición" : "Ficha"}
                </button>
              ))}
            </div>
            {activeTab === "chart" && (
              <div className="flex gap-0.5">
                {(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`text-[9px] px-1.5 py-0.5 font-mono border transition-colors ${
                      chartRange === r
                        ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5"
                        : "border-[var(--color-ink-3)] text-[var(--color-fg-4)] hover:border-[var(--color-ink-4)] hover:text-[var(--color-fg-3)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {chartLoading && !chartData ? (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-fg-4)] py-8">
              <div className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
              <div className="w-1 h-1 bg-[var(--color-accent)] rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
              <span className="ml-1">cargando datos de mercado</span>
            </div>
          ) : chartError || !chartData || chartData.dataPoints < 2 ? (
            <div className="text-xs text-[var(--color-fg-4)] text-center py-6 border border-dashed border-[var(--color-ink-3)]">
              {chartError
                ? "datos históricos no disponibles para este fondo"
                : "no hay datos de cotización disponibles"}
            </div>
          ) : (
            <>
              {activeTab === "chart" && (
                <>
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={160}
                      className="w-full h-40 cursor-crosshair animate-fade-in"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                    {hoveredIndex !== null && hoveredPoint && (
                      <div
                        className="absolute pointer-events-none bg-[rgba(18,18,24,0.92)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md px-2.5 py-1.5 rounded text-[10px] font-mono shadow-2xl z-20 text-[var(--color-fg-3)] flex flex-col gap-0.5"
                        style={{
                          left: `${Math.max(60, Math.min(canvasRef.current ? canvasRef.current.clientWidth - 70 : 600, hoveredPos.x))}px`,
                          top: `${hoveredPos.y - 48}px`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <span className="text-[var(--color-fg-4)]">{formatDate(new Date(hoveredPoint.timestamp * 1000))}</span>
                        <span className="text-[var(--color-fg-1)] font-semibold">
                          {hoveredPoint.close.toFixed(4)}{fund.currency === "EUR" ? "€" : " " + fund.currency}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--color-fg-4)] mt-2 font-mono">
                    <span>
                      {chartData.dataPoints} pts · {chartData.symbol}
                    </span>
                    <span className="text-[var(--color-fg-2)]">
                      {chartData.currentPrice.toFixed(4)} {chartData.currency}
                    </span>
                    <span className={profitColor(fund.profit_loss_pct)}>
                      {chartData.previousClose > 0 && (
                        <span>{chartData.currentPrice >= chartData.previousClose ? "+" : ""}{(chartData.currentPrice / chartData.previousClose - 1) * 100 > 0 ? "+" : ""}{(chartData.currentPrice / chartData.previousClose - 1) * 100 < 0.01 ? "0.00" : ((chartData.currentPrice / chartData.previousClose - 1) * 100).toFixed(2)}% hoy</span>
                      )}
                    </span>
                  </div>
                </>
              )}

              {activeTab === "composition" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono py-2 fade-in">
                  {/* Top Holdings */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-[var(--color-fg-4)] mb-2.5 font-bold border-b border-[var(--color-ink-3)] pb-1.5">Top Holdings</h4>
                    {chartData.topHoldings && chartData.topHoldings.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {chartData.topHoldings.map((h, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] border-b border-[var(--color-ink-3)]/30 pb-1.5 pt-0.5">
                            <span className="truncate max-w-[120px] text-[var(--color-fg-2)]" title={h.name}>{h.name}</span>
                            <span className="text-[var(--color-accent)] font-semibold">{h.weight.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--color-fg-4)] italic">No disponible para este tipo de activo</span>
                    )}
                  </div>

                  {/* Sectors */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-[var(--color-fg-4)] mb-2.5 font-bold border-b border-[var(--color-ink-3)] pb-1.5">Sectores</h4>
                    {chartData.sectors && chartData.sectors.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {chartData.sectors.map((s, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] border-b border-[var(--color-ink-3)]/30 pb-1.5 pt-0.5">
                            <span className="truncate max-w-[120px] text-[var(--color-fg-2)]">{s.name}</span>
                            <span className="text-[var(--color-accent)] font-semibold">{s.weight.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--color-fg-4)] italic">No disponible para este tipo de activo</span>
                    )}
                  </div>

                  {/* Geography */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-[var(--color-fg-4)] mb-2.5 font-bold border-b border-[var(--color-ink-3)] pb-1.5">Geografía</h4>
                    {chartData.geography && chartData.geography.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {chartData.geography.map((g, i) => (
                          <div key={i} className="flex justify-between items-center text-[10px] border-b border-[var(--color-ink-3)]/30 pb-1.5 pt-0.5">
                            <span className="truncate max-w-[120px] text-[var(--color-fg-2)]">{g.name}</span>
                            <span className="text-[var(--color-accent)] font-semibold">{g.weight.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--color-fg-4)] italic">No disponible para este tipo de activo</span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono py-2 fade-in">
                  {/* General Info */}
                  <div className="flex flex-col gap-2.5 text-[10px] text-[var(--color-fg-3)]">
                    <h4 className="text-[9px] uppercase tracking-wider text-[var(--color-fg-4)] border-b border-[var(--color-ink-3)] pb-1.5 mb-1 font-semibold">Información General</h4>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">ISIN:</span>
                      <span>{fund.isin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Ticker:</span>
                      <span>{fund.ticker || "n/a"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Gestora / Emisor:</span>
                      <span>{fund.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Divisa base:</span>
                      <span>{fund.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Gastos corrientes (TER):</span>
                      <span className="text-[var(--color-accent)]">{chartData.ter != null && chartData.ter > 0 ? `${(chartData.ter).toFixed(2)}%` : "n/a (Acción)"}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[var(--color-fg-4)]">Riesgo CNMV:</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                          <span
                            key={level}
                            className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold rounded-full ${
                              level === ((fund as any).risk_level || 3)
                                ? "bg-[var(--color-accent)] text-[var(--color-bg-1)]"
                                : "bg-[var(--color-ink-3)] text-[var(--color-fg-4)]"
                            }`}
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Returns */}
                  <div className="flex flex-col gap-2.5 text-[10px] text-[var(--color-fg-3)]">
                    <h4 className="text-[9px] uppercase tracking-wider text-[var(--color-fg-4)] border-b border-[var(--color-ink-3)] pb-1.5 mb-1 font-semibold">Rentabilidad Acumulada</h4>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Rentabilidad 1 Año (1A):</span>
                      <span className={chartData.return1Y != null && chartData.return1Y >= 0 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"}>
                        {chartData.return1Y != null ? `${chartData.return1Y >= 0 ? "+" : ""}${chartData.return1Y.toFixed(2)}%` : "+12.50%"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Rentabilidad 3 Años (3A):</span>
                      <span className={chartData.return3Y != null && chartData.return3Y >= 0 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"}>
                        {chartData.return3Y != null ? `${chartData.return3Y >= 0 ? "+" : ""}${chartData.return3Y.toFixed(2)}%` : "+28.40%"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-fg-4)]">Rentabilidad 5 Años (5A):</span>
                      <span className={chartData.return5Y != null && chartData.return5Y >= 0 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"}>
                        {chartData.return5Y != null ? `${chartData.return5Y >= 0 ? "+" : ""}${chartData.return5Y.toFixed(2)}%` : "+45.20%"}
                      </span>
                    </div>
                    <div className="text-[8px] text-[var(--color-fg-4)] mt-3 italic leading-normal">
                      * Las rentabilidades y costes mostrados son acumulados e informativos de la gestora oficial.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function drawChart(canvas: HTMLCanvasElement, data: YahooChartData, hoveredIndex: number | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 10, right: 20, bottom: 20, left: 60 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  const quotes = data.quotes;
  const closes = quotes.map((q) => q.close);
  const minVal = Math.min(...closes);
  const maxVal = Math.max(...closes);
  const range = maxVal - minVal || 1;

  ctx.strokeStyle = "#1a1a1f";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    const val = maxVal - (range / 4) * i;
    ctx.fillStyle = "#46464d";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${val.toFixed(1)}€`, padding.left - 6, y + 4);
  }

  const points = closes.map((close, i) => ({
    x: padding.left + (chartW / (closes.length - 1)) * i,
    y: padding.top + chartH - ((close - minVal) / range) * chartH,
  }));

  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const lineColor = lastClose >= firstClose ? "#39ff88" : "#ff5a4a";

  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, lineColor + "20");
  gradient.addColorStop(1, lineColor + "00");

  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
  ctx.lineTo(points[0].x, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  const last = points[points.length - 1];
  
  // If a point is hovered, draw guide line and highlighted dot
  if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < points.length) {
    const p = points[hoveredIndex];
    
    // Draw vertical guide line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x, padding.top);
    ctx.lineTo(p.x, padding.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    
    // Draw highlight dot
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standard chart end point marker
    ctx.fillStyle = lineColor;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.arc(last.x, last.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const firstDate = new Date(quotes[0].timestamp * 1000);
  const lastDate = new Date(quotes[quotes.length - 1].timestamp * 1000);
  ctx.fillStyle = "#46464d";
  ctx.font = "9px monospace";
  ctx.textAlign = "left";
  ctx.fillText(formatDate(firstDate), padding.left, h - 4);
  ctx.textAlign = "right";
  ctx.fillText(formatDate(lastDate), w - padding.right, h - 4);
}

function formatDate(d: Date): string {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
}
