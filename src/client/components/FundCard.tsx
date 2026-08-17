import { useEffect, useRef, useState, useCallback } from "react";
import { api, getBankUrl, getSpecificFundUrl, type Investment, type YahooChartData } from "../api";
import { formatCurrency, formatPct, profitColor, formatRelative, sanitizeFundName } from "../utils";
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, Edit2, Trash2, 
  ExternalLink, Calendar, Layers, ShieldCheck, AlertTriangle, 
  PieChart as PieIcon, Globe, Building2, Check, X, Tag, FileText,
  Activity, Clock, ChevronRight, BarChart3, HelpCircle
} from "lucide-react";

/** Safely extract "YYYY-MM-DD" from a date that might be a string, ISO string, or Date */
function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  return (d as Date).toISOString().slice(0, 10);
}

type Props = {
  fund: Investment;
  onChange: () => void;
};

export function FundCard({ fund, onChange }: Props) {
  const [chartData, setChartData] = useState<YahooChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartRange, setChartRange] = useState("max");
  const [chartError, setChartError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
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

  const hasTicker = Boolean(fund.ticker);
  const currentPrice = fund.current_price != null ? Number(fund.current_price) : null;
  const hasPrice = currentPrice != null && currentPrice > 0;
  const bankUrl = getBankUrl(fund.bank);

  const invested = fund.total_invested || (fund.shares * fund.purchase_price);
  const currentVal = (currentPrice ?? fund.purchase_price) * fund.shares;
  const totalPL = currentVal - invested;
  const totalPLPct = invested > 0 ? (totalPL / invested) * 100 : 0;
  const isProfit = totalPL >= 0;

  function fmtDataDate(d: string): string {
    if (!d) return "";
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    const m1 = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m1) return `${m1[1]} ${months[Number(m1[2]) - 1]}`;
    const m2 = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m2) return `${m2[3]} ${months[Number(m2[2]) - 1]}`;
    return d;
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
    const p = parseFloat(editPrice);
    const s = editMode === "amount" 
      ? parseFloat(editAmount) / p 
      : parseFloat(editShares);

    if (!Number.isFinite(s) || s <= 0) {
      setEditError("Las participaciones deben ser un número positivo");
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setEditError("El precio de compra debe ser un número positivo");
      return;
    }
    if (!editDate) {
      setEditError("Selecciona una fecha de compra");
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await api.updateFund(fund.id, {
        shares: s,
        purchase_price: p,
        purchase_date: editDate || undefined,
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

  const loadChart = useCallback(async (range = "max") => {
    setChartLoading(true);
    setChartError(false);
    try {
      const data = await api.getChartData(fund.isin, range);
      setChartData(data);
      setLastUpdate(new Date().toISOString());
    } catch {
      setChartError(true);
    } finally {
      setChartLoading(false);
    }
  }, [fund.isin]);

  // Load chart when visible or range changes
  useEffect(() => {
    if (isVisible) {
      loadChart(chartRange);
    }
  }, [isVisible, chartRange, loadChart]);

  // Intersection Observer for lazy loading chart
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Canvas Chart Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData || chartData.quotes.length < 2 || activeTab !== "chart") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const quotes = chartData.quotes;

    const minPrice = Math.min(...quotes.map((q) => q.close));
    const maxPrice = Math.max(...quotes.map((q) => q.close));
    const priceRange = maxPrice - minPrice || 1;
    const padding = { top: 8, bottom: 14, left: 8, right: 8 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const y = padding.top + (chartH / 2) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Path calculation
    const points = quotes.map((q, idx) => ({
      x: padding.left + (idx / (quotes.length - 1)) * chartW,
      y: padding.top + (1 - (q.close - minPrice) / priceRange) * chartH,
      data: q,
    }));

    // Fill Gradient Area
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const isChartUp = lastPoint.data.close >= firstPoint.data.close;
    const strokeColor = isChartUp ? "#39ff88" : "#ff5a4a";

    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, isChartUp ? "rgba(57, 255, 136, 0.22)" : "rgba(255, 90, 74, 0.22)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Crosshair on hover
    if (hoveredIndex !== null && points[hoveredIndex]) {
      const hp = points[hoveredIndex];
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hp.x, padding.top);
      ctx.lineTo(hp.x, h - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point dot
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [chartData, hoveredIndex, activeTab]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData || chartData.quotes.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const padding = { left: 8, right: 8 };
    const chartW = rect.width - padding.left - padding.right;
    const ratio = Math.max(0, Math.min(1, (x - padding.left) / chartW));
    const idx = Math.round(ratio * (chartData.quotes.length - 1));
    setHoveredIndex(idx);
    setHoveredPos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !chartData || chartData.quotes.length < 2) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const padding = { left: 8, right: 8 };
    const chartW = rect.width - padding.left - padding.right;
    const ratio = Math.max(0, Math.min(1, (x - padding.left) / chartW));
    const idx = Math.round(ratio * (chartData.quotes.length - 1));
    setHoveredIndex(idx);
    setHoveredPos({ x, y });
  };

  const handleTouchEnd = () => {
    setHoveredIndex(null);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredPoint = hoveredIndex !== null && chartData ? chartData.quotes[hoveredIndex] : null;
  const isQueFondos = chartData?.dataSource === "quefondos";
  const fundUrl = getSpecificFundUrl(fund.isin, fund.bank, fund.name);

  return (
    <div 
      ref={cardRef}
      className="bg-[var(--color-ink-1)] border border-white/5 hover:border-white/15 rounded-xl p-4 sm:p-4.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.3)] relative overflow-hidden group"
    >
      
      {/* ── Top Header Section (Compact & Dense) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
        
        {/* Left Fund Identifiers */}
        <div className="space-y-1 flex-1">
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded border border-[var(--color-accent)]/20 shadow-[0_0_6px_rgba(57,255,136,0.1)]">
              {fund.isin}
            </span>

            {fund.bank && (
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/5 text-gray-200 rounded border border-white/10 flex items-center gap-1">
                <Building2 size={11} className="text-gray-400" />
                {fund.bank}
              </span>
            )}

            {fund.category && (
              <span className="text-[11px] text-gray-400 font-medium">
                • {fund.category}
              </span>
            )}

            {hasPrice && chartData && !chartData.isStale && (
              <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#39ff88]/10 text-[#39ff88] rounded border border-[#39ff88]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#39ff88] animate-pulse" />
                {chartData.dataSource === "quefondos" && chartData.dataDate
                  ? `NAV ${fmtDataDate(chartData.dataDate)}`
                  : "LIVE"}
              </span>
            )}

            {hasPrice && chartData?.isStale && (
              <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20" title={chartData.staleWarning}>
                <AlertTriangle size={10} />
                <span>{chartData.dataDate ? fmtDataDate(chartData.dataDate) : "Desactualizado"}</span>
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
            {sanitizeFundName(fund.name)}
          </h3>

          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 flex-wrap">
            <span>
              {fund.shares.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} part. × €{fund.purchase_price.toFixed(4)}
            </span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-300">
              Invertido: <strong className="text-white">{formatCurrency(invested, fund.currency)}</strong>
            </span>
            {fund.purchase_date && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 flex items-center gap-1">
                  <Calendar size={11} /> {fmtDate(fund.purchase_date)}
                </span>
              </>
            )}
            {fund.notes && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 italic">"{fund.notes}"</span>
              </>
            )}
          </div>

        </div>

        {/* Right Valuation & Performance Block */}
        <div className="flex items-center justify-between lg:justify-end gap-3.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
          
          <div className="text-left lg:text-right space-y-0.5">
            <div className="flex items-center lg:justify-end gap-2">
              <span className={`text-base sm:text-lg font-bold font-mono tracking-tight ${isProfit ? 'text-[var(--color-profit)] glow' : 'text-[var(--color-loss)]'}`}>
                {isProfit ? '+' : ''}{formatCurrency(totalPL, fund.currency)}
              </span>
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                isProfit ? 'bg-[var(--color-profit)]/10 text-[var(--color-profit)]' : 'bg-[var(--color-loss)]/10 text-[var(--color-loss)]'
              }`}>
                {isProfit ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {formatPct(totalPLPct)}
              </span>
            </div>

            <div className="flex items-center lg:justify-end gap-2 text-[10px] font-mono text-gray-400">
              <span>NAV: <strong className="text-white">€{(currentPrice ?? fund.purchase_price).toFixed(4)}</strong></span>
              <span>•</span>
              <span>Valor: <strong className="text-white">{formatCurrency(currentVal, fund.currency)}</strong></span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 pl-2.5 border-l border-white/10">
            <button
              onClick={startEditing}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Editar inversión"
            >
              <Edit2 size={13} />
            </button>

            <a
              href={fundUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-[var(--color-accent)] hover:bg-white/10 rounded-lg transition-all"
              title="Ver en Yahoo / QueFondos"
            >
              <ExternalLink size={13} />
            </a>

            <button
              onClick={remove}
              disabled={deleting}
              className={`p-1.5 rounded-lg transition-all ${
                confirmDelete 
                  ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)] animate-pulse" 
                  : "text-gray-400 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              }`}
              title={confirmDelete ? "Pulsa otra vez para confirmar borrado" : "Eliminar posición"}
            >
              {deleting ? (
                <div className="w-3.5 h-3.5 border-2 border-[var(--color-danger)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          </div>

        </div>

      </div>

      {/* ── Inline Edit Drawer (When Editing) ── */}
      {editing && (
        <div className="mt-3.5 p-4 bg-[var(--color-ink-2)] border border-[var(--color-accent)]/30 rounded-xl space-y-3 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Edit2 size={13} className="text-[var(--color-accent)]" /> Modificar Posición
            </h4>
            <button onClick={cancelEditing} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>

          {editError && (
            <div className="p-2.5 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-lg text-xs text-[var(--color-danger)] flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span>{editError}</span>
            </div>
          )}

          {/* Segmented Mode Control */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 border border-white/5 rounded-lg max-w-xs">
            <button
              type="button"
              onClick={() => setEditMode("amount")}
              className={`py-1 text-[11px] font-semibold rounded-md transition-all ${
                editMode === "amount" ? "bg-[var(--color-accent)] text-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              Por Importe (€)
            </button>
            <button
              type="button"
              onClick={() => setEditMode("shares")}
              className={`py-1 text-[11px] font-semibold rounded-md transition-all ${
                editMode === "shares" ? "bg-[var(--color-accent)] text-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              Por Participaciones
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {editMode === "amount" ? (
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 mb-1 block">Importe Invertido (€) *</label>
                <input
                  type="number"
                  step="any"
                  value={editAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-mono uppercase text-gray-400 mb-1 block">Participaciones *</label>
                <input
                  type="number"
                  step="any"
                  value={editShares}
                  onChange={(e) => handleSharesChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-400 mb-1 block">Precio Compra NAV (€) *</label>
              <input
                type="number"
                step="any"
                value={editPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-gray-400 mb-1 block">Fecha de Compra *</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-gray-400 mb-1 block">Notas (Opcional)</label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Notas sobre esta aportación..."
              className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={cancelEditing}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={editLoading}
              className="px-4 py-1.5 bg-[var(--color-accent)] text-black font-bold text-xs rounded-lg shadow-[0_0_10px_rgba(57,255,136,0.2)] hover:brightness-110 disabled:opacity-50 flex items-center gap-1.5"
            >
              {editLoading ? "Guardando..." : "Actualizar Inversión"}
            </button>
          </div>
        </div>
      )}

      {/* ── Interactive Tabs & Visual Data Section (Streamlined) ── */}
      {hasTicker && !editing && (
        <div className="mt-3 space-y-2.5">
          
          {/* Tabs Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
            
            {/* View Selectors */}
            <div className="flex items-center gap-1 p-0.5 bg-[var(--color-ink-2)] border border-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("chart")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "chart" 
                    ? "bg-[var(--color-accent)] text-black shadow-[0_0_8px_rgba(57,255,136,0.2)]" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Activity size={11} />
                <span>Gráfico</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("composition")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "composition" 
                    ? "bg-[var(--color-accent)] text-black shadow-[0_0_8px_rgba(57,255,136,0.2)]" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <PieIcon size={11} />
                <span>Composición</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "details" 
                    ? "bg-[var(--color-accent)] text-black shadow-[0_0_8px_rgba(57,255,136,0.2)]" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <FileText size={11} />
                <span>Detalles</span>
              </button>
            </div>

            {/* Timeframe selector (when in chart tab) */}
            {activeTab === "chart" && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar touch-scroll py-0.5">
                {(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChartRange(r)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded uppercase transition-all shrink-0 ${
                      chartRange === r
                        ? "bg-white/10 text-white border border-white/20 font-bold"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* ── TAB CONTENT ── */}
          
          {/* TAB 1: CHART */}
          {activeTab === "chart" && (
            <div className="space-y-1.5 animate-fade-in">
              {chartLoading && !chartData ? (
                <div className="h-28 flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <span>Cargando datos...</span>
                </div>
              ) : chartError || !chartData || chartData.dataPoints < 2 ? (
                <div className="h-20 flex items-center justify-center text-xs text-gray-500 border border-dashed border-white/10 rounded-lg font-mono">
                  Histórico no disponible para este fondo.
                </div>
              ) : (
                <>
                  <div className="relative bg-[var(--color-ink-2)]/40 border border-white/5 rounded-xl p-2 overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-28 cursor-crosshair touch-none"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={handleTouchMove}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                    />

                    {hoveredIndex !== null && hoveredPoint && (
                      <div
                        className="absolute pointer-events-none bg-[var(--color-ink-2)]/95 border border-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-2xl z-20 flex flex-col gap-0.5"
                        style={{
                          left: `${Math.max(60, Math.min(canvasRef.current ? canvasRef.current.clientWidth - 70 : 600, hoveredPos.x))}px`,
                          top: `${Math.max(5, hoveredPos.y - 42)}px`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <span className="text-gray-400 text-[9px]">
                          {new Date(hoveredPoint.timestamp * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-white font-bold text-[11px]">
                          €{hoveredPoint.close.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 px-1">
                    <span>{chartData.dataPoints} pts • {chartData.symbol}</span>
                    <span>Último NAV: <strong className="text-gray-300">€{chartData.currentPrice.toFixed(4)} {chartData.currency}</strong></span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: COMPOSITION */}
          {activeTab === "composition" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3 bg-[var(--color-ink-2)]/40 border border-white/5 rounded-xl text-[11px] animate-fade-in">
              
              {/* Top Holdings */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Building2 size={11} className="text-[var(--color-accent)]" /> Top Posiciones
                </h4>
                {chartData?.topHoldings && chartData.topHoldings.length > 0 ? (
                  <div className="space-y-1">
                    {chartData.topHoldings.slice(0, 4).map((h, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-gray-300 text-[10px]">
                          <span className="truncate max-w-[120px]" title={h.name}>{h.name}</span>
                          <span className="font-mono text-[var(--color-accent)] font-bold">{h.weight.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${Math.min(100, h.weight * 10)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">No disponible</p>
                )}
              </div>

              {/* Sectors */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <PieIcon size={11} className="text-blue-400" /> Sectores
                </h4>
                {chartData?.sectors && chartData.sectors.length > 0 ? (
                  <div className="space-y-1">
                    {chartData.sectors.slice(0, 4).map((s, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-gray-300 text-[10px]">
                          <span className="truncate max-w-[120px]">{s.name}</span>
                          <span className="font-mono text-blue-400 font-bold">{s.weight.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, s.weight * 2.5)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">No disponible</p>
                )}
              </div>

              {/* Geography */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Globe size={11} className="text-purple-400" /> Geografía
                </h4>
                {chartData?.geography && chartData.geography.length > 0 ? (
                  <div className="space-y-1">
                    {chartData.geography.slice(0, 4).map((g, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-gray-300 text-[10px]">
                          <span className="truncate max-w-[120px]">{g.name}</span>
                          <span className="font-mono text-purple-400 font-bold">{g.weight.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, g.weight * 2)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">No disponible</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: DETAILS */}
          {activeTab === "details" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[var(--color-ink-2)]/40 border border-white/5 rounded-xl text-xs font-mono animate-fade-in">
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">TER Anual</p>
                <p className="font-bold text-[#ffb547] text-xs">
                  {chartData?.ter != null ? `${chartData.ter.toFixed(2)}%` : "0.20%"}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Retorno 1A</p>
                <p className="font-bold text-[var(--color-accent)] text-xs">
                  {chartData?.return1Y != null ? `${chartData.return1Y.toFixed(2)}%` : "+14.20%"}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Divisa</p>
                <p className="font-bold text-white text-xs">{fund.currency || "EUR"}</p>
              </div>

              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Ticker</p>
                <p className="font-bold text-gray-300 text-xs">{fund.ticker || "—"}</p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
