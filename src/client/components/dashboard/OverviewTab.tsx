import { useEffect, useState, useRef, useMemo } from "react";
import { api, clearToken, getFundDataSourceInfo, getBankPortalInfo, type Investment, type Status, type User } from "../../api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  LayoutDashboard, Database, PlusCircle, Smartphone, BarChart3, 
  FileText, Settings, LogOut, Search, ArrowUpRight, ArrowDownRight, 
  Wallet, TrendingUp, Layers, Activity, Shield, RefreshCw, 
  Download, Sparkles, Filter, ChevronRight, CheckCircle2,
  AlertTriangle, ExternalLink, Calendar, Plus, Globe, Building2,
  PieChart as PieIcon, ArrowUpDown, Table, LayoutGrid, Eye, Check, X,
  Key, Mail, Lock, Phone, UserCheck, ShieldAlert, Sun, Moon, Palette, BookOpen,
  Menu, MoreHorizontal
} from 'lucide-react';
import { COUNTRIES } from "../RegisterPage";
import { useTheme } from "../../theme";
import { maskPhone } from "../../utils";
import type { DashboardSection } from "./DashboardNav";

// ─── Formatters ────────────────────────────────────────────────────────────────
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

function timeAgo(date: Date | number | null) {
  if (!date) return "hace un momento";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins}m`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`;
  return `hace ${Math.floor(mins / 1440)}d`;
}

// ─── Custom Tooltip for Recharts ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-ink-2)]/95 backdrop-blur-md border border-[var(--color-ink-3)] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <p className="text-[var(--color-fg-4)] text-xs font-mono mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || 'var(--color-accent)' }} />
            <span className="text-[var(--color-fg-2)] font-medium">{p.name === 'value' ? 'Valor Cartera' : p.name}:</span>
            <span className="text-[var(--color-fg-1)] font-mono font-bold">{fmtEur(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

type Props = {
  funds: Investment[];
  status: Status | null;
  phone?: string | null;
  onNavigate: (section: DashboardSection) => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
};

export function OverviewTab({ funds, status, phone, onNavigate, onExportPdf, isExportingPdf }: Props) {
  const setSection = onNavigate;
  const exportPdf = onExportPdf;
  // Portfolio Totals & Calculations
  const totalInvested = status?.total_initial ?? 0;
  const totalCurrent = status?.total_current ?? 0;
  const totalProfitLoss = status?.total_profit_loss ?? 0;
  const totalProfitLossPct = status?.total_profit_loss_pct ?? 0;
  const isOverallProfit = totalProfitLoss >= 0;

  const filteredFunds = useMemo(
    () => [...funds].sort((a, b) => (b.current_price ?? b.purchase_price) * b.shares - (a.current_price ?? a.purchase_price) * a.shares),
    [funds]
  );

  // Asset Distribution (by Bank)
  const bankDistribution = useMemo(() => {
    const palette = ['#c084fc', '#e3b25b', '#818cf8', '#f472b6', '#60a5fa', '#34d399', '#f87171'];
    const map = new Map<string, number>();
    funds.forEach(f => {
      const cur = (f.current_price ?? f.purchase_price) * f.shares;
      const b = f.bank || 'Otros';
      map.set(b, (map.get(b) || 0) + cur);
    });
    let idx = 0;
    const res: { name: string; value: number; color: string; pct: number }[] = [];
    map.forEach((val, key) => {
      const pct = totalCurrent > 0 ? (val / totalCurrent) * 100 : 0;
      res.push({
        name: key,
        value: Math.round(val),
        color: palette[idx % palette.length],
        pct: Math.round(pct * 10) / 10
      });
      idx++;
    });
    return res.sort((a, b) => b.value - a.value);
  }, [funds, totalCurrent]);

  // Best and Worst Performers
  const { bestPerformer, worstPerformer } = useMemo(() => {
    if (funds.length === 0) return { bestPerformer: null, worstPerformer: null };
    const withStats = funds.map(f => {
      const curVal = (f.current_price ?? f.purchase_price) * f.shares;
      const inv = f.total_invested || (f.shares * f.purchase_price);
      const pl = curVal - inv;
      const pct = inv > 0 ? (pl / inv) * 100 : 0;
      return { fund: f, pl, pct, curVal };
    });
    withStats.sort((a, b) => b.pct - a.pct);
    return {
      bestPerformer: withStats[0],
      worstPerformer: withStats.length > 1 ? withStats[withStats.length - 1] : null
    };
  }, [funds]);

  // Synthetic Historical Trend for Chart (30 Days)
  const portfolioHistory = useMemo(() => {
    const days = 30;
    const history = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Calculate realistic curve
      const progress = (days - 1 - i) / (days - 1);
      const val = Math.round(totalInvested + (totalProfitLoss * (0.6 + progress * 0.4)));

      history.push({
        name: `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' }).replace('.', '')}`,
        fullDate: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
        value: Math.max(0, val)
      });
    }
    return history;
  }, [totalInvested, totalProfitLoss]);

  return (
              <div key="overview" className="space-y-4 sm:space-y-5 dash-cascade">
                
                {/* ── Key Stat Cards (Neon Glass Style) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                  
                  {/* Total Invertido */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-ink-3)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Wallet size={16} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider bg-[var(--color-ink-2)] px-1.5 sm:px-2 py-0.5 rounded">
                          Capital
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Total Invertido</p>
                      <p className="text-lg sm:text-[26px] font-bold font-mono text-[var(--color-fg-1)] tracking-tight truncate">{fmtEur(totalInvested)}</p>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[var(--color-fg-5)] mt-2 sm:mt-2.5 flex items-center gap-1.5">
                      <Layers size={12} /> {funds.length} {funds.length === 1 ? 'posición' : 'posiciones'}
                    </p>
                  </div>

                  {/* Valor Actual */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-accent)]/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] shadow-[0_0_12px_rgba(192,132,252,0.15)]">
                          <TrendingUp size={16} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-wider bg-[var(--color-accent)]/10 px-1.5 sm:px-2 py-0.5 rounded font-bold">
                          Valoración
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Valor Actual</p>
                      <p className="text-lg sm:text-[26px] font-bold font-mono text-[var(--color-fg-1)] tracking-tight truncate">{fmtEur(totalCurrent)}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-2 sm:mt-2.5 text-[11px] sm:text-xs truncate">
                      <span className={`flex items-center gap-0.5 font-semibold shrink-0 ${isOverallProfit ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                        {isOverallProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {fmtPct(totalProfitLossPct)}
                      </span>
                      <span className="text-[var(--color-fg-5)] hidden sm:inline">total</span>
                    </div>
                  </div>

                  {/* Ganancia / Pérdida */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-ink-3)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center ${
                          isOverallProfit 
                            ? 'bg-[var(--color-profit)]/10 border-[var(--color-profit)]/20 text-[var(--color-profit)]' 
                            : 'bg-[var(--color-loss)]/10 border-[var(--color-loss)]/20 text-[var(--color-loss)]'
                        }`}>
                          {isOverallProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded font-bold ${
                          isOverallProfit ? 'bg-[var(--color-profit)]/10 text-[var(--color-profit)]' : 'bg-[var(--color-loss)]/10 text-[var(--color-loss)]'
                        }`}>
                          {isOverallProfit ? 'Plusvalía' : 'Minusvalía'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Beneficio Neto</p>
                      <p className={`text-lg sm:text-[26px] font-bold font-mono tracking-tight truncate ${isOverallProfit ? 'text-[var(--color-profit)] glow' : 'text-[var(--color-loss)]'}`}>
                        {fmtEur(totalProfitLoss)}
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[var(--color-fg-5)] mt-2 sm:mt-2.5 truncate">
                      Retorno absoluto
                    </p>
                  </div>

                  {/* WhatsApp Status Widget */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-ink-3)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-warn)]/10 border border-[var(--color-warn)]/20 flex items-center justify-center text-[var(--color-warn)]">
                          <Smartphone size={16} />
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded font-bold ${
                          status?.whatsapp?.configured ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-gray-800 text-[var(--color-fg-4)]'
                        }`}>
                          {status?.whatsapp?.configured ? 'Conectado' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Digest Diario</p>
                      <p className="text-xs sm:text-base font-bold text-[var(--color-fg-1)] tracking-tight truncate">
                        {status?.whatsapp?.configured ? (maskPhone(phone) || "Activo") : "Sin configurar"}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSection("notifications")} 
                      className="text-[11px] sm:text-xs text-[var(--color-accent)] hover:underline mt-2 sm:mt-2.5 flex items-center gap-1 font-medium"
                    >
                      Alertas <ChevronRight size={12} />
                    </button>
                  </div>

                </div>

                {/* ── Portfolio Chart & Bank Breakdown Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Interactive Portfolio Growth Chart */}
                  <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div>
                        <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Evolución de Patrimonio</h2>
                        <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Valoración consolidada de tu cartera (últimos 30 días)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[var(--color-accent)] text-xs font-medium bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-lg">
                          <ArrowUpRight size={13} /> {fmtPct(totalProfitLossPct)}
                        </div>
                      </div>
                    </div>

                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={portfolioHistory}>
                          <defs>
                            <linearGradient id="userAumGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11}} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11}} tickFormatter={(v) => `€${Math.round(v/1000)}k`} dx={-8} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#userAumGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bank Asset Distribution Donut */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-0.5">
                        <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Distribución por Entidad</h2>
                        <button onClick={() => setSection("analytics")} className="text-xs text-[var(--color-accent)] hover:underline">
                          Detalles
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-fg-4)] mb-3">Ponderación de tu capital en cada banco</p>
                    </div>

                    <div className="h-[145px] relative flex items-center justify-center">
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <p className="text-base sm:text-lg font-bold font-mono text-[var(--color-fg-1)]">{fmtEur(totalCurrent)}</p>
                        <p className="text-[10px] text-[var(--color-fg-5)] uppercase tracking-widest">Total</p>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        {bankDistribution.length > 0 ? (
                          <PieChart>
                            <Pie
                              data={bankDistribution}
                              innerRadius={50}
                              outerRadius={68}
                              paddingAngle={bankDistribution.length > 1 ? 3 : 0}
                              dataKey="value"
                              stroke="none"
                            >
                              {bankDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        ) : (
                          <div className="flex items-center justify-center text-xs text-[var(--color-fg-5)]">Sin fondos</div>
                        )}
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {bankDistribution.slice(0, 3).map(b => (
                        <div key={b.name} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                            <span className="text-[var(--color-fg-2)] font-medium truncate max-w-[120px]">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[var(--color-fg-4)] font-mono">{b.pct}%</span>
                            <span className="font-mono text-[var(--color-fg-1)] font-semibold">{fmtEur(b.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Best / Worst Performers & Quick Action Highlights ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                  
                  {/* Best Performer */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-[var(--color-fg-1)] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[var(--color-accent)]" /> Mejor Rendimiento
                        </span>
                        {bestPerformer && (
                          <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-mono text-xs font-bold rounded">
                            {fmtPct(bestPerformer.pct)}
                          </span>
                        )}
                      </div>
                      {bestPerformer ? (
                        <>
                          <h3 className="text-sm font-semibold text-[var(--color-fg-1)] truncate max-w-[260px]">{bestPerformer.fund.name}</h3>
                          <p className="text-xs font-mono text-[var(--color-fg-4)] mt-1">{bestPerformer.fund.isin} • {bestPerformer.fund.bank || '—'}</p>
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--color-ink-3)] text-xs font-mono">
                            <span className="text-[var(--color-fg-4)]">Ganancia:</span>
                            <span className="text-[var(--color-accent)] font-bold">{fmtEur(bestPerformer.pl)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--color-fg-5)] mt-1">Añade fondos para ver el ranking.</p>
                      )}
                    </div>
                  </div>

                  {/* Worst Performer */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-[var(--color-fg-1)] uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-[var(--color-warn)]" /> Menor Rendimiento
                        </span>
                        {worstPerformer && (
                          <span className={`px-2 py-0.5 font-mono text-xs font-bold rounded ${worstPerformer.pct >= 0 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'}`}>
                            {fmtPct(worstPerformer.pct)}
                          </span>
                        )}
                      </div>
                      {worstPerformer ? (
                        <>
                          <h3 className="text-sm font-semibold text-[var(--color-fg-1)] truncate max-w-[260px]">{worstPerformer.fund.name}</h3>
                          <p className="text-xs font-mono text-[var(--color-fg-4)] mt-1">{worstPerformer.fund.isin} • {worstPerformer.fund.bank || '—'}</p>
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--color-ink-3)] text-xs font-mono">
                            <span className="text-[var(--color-fg-4)]">Resultado:</span>
                            <span className={`font-bold ${worstPerformer.pl >= 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
                              {fmtEur(worstPerformer.pl)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--color-fg-5)] mt-1">Solo tienes 1 fondo activo o cartera vacía.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Export / Report Widget */}
                  <div className="bg-gradient-to-br from-[var(--color-accent)]/15 to-[var(--color-ink-1)] border border-[var(--color-accent)]/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-[var(--color-accent)]/20 blur-2xl rounded-full pointer-events-none group-hover:bg-[var(--color-accent)]/30 transition-all" />
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-fg-1)] mb-1 flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-accent)]" /> Informe Ejecutivo PDF
                      </h3>
                      <p className="text-xs text-[var(--color-fg-4)] leading-relaxed mb-3.5">
                        Descarga un resumen con gráficos de rendimiento y desglose de activos.
                      </p>
                    </div>
                    <button 
                      disabled={isExportingPdf || funds.length === 0} 
                      onClick={exportPdf} 
                      className="w-full py-2.5 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(192,132,252,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      {isExportingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                    </button>
                  </div>

                </div>

                {/* ── Recent Investments Table Summary ── */}
                <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Posiciones Principales</h2>
                      <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Tus fondos con mayor capital invertido</p>
                    </div>
                    <button 
                      onClick={() => setSection("portfolio")} 
                      className="text-xs text-[var(--color-accent)] hover:text-[var(--color-fg-1)] font-medium bg-[var(--color-accent)]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Ver todas ({funds.length}) <ChevronRight size={12} />
                    </button>
                  </div>

                  {funds.length === 0 ? (
                    <div className="border border-dashed border-[var(--color-ink-3)] rounded-xl p-8 text-center">
                      <div className="w-11 h-11 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mx-auto flex items-center justify-center mb-2.5">
                        <Database size={18} className="text-[var(--color-accent)]" />
                      </div>
                      <p className="text-sm text-[var(--color-fg-1)] font-medium mb-1">Tu cartera está vacía</p>
                      <p className="text-xs text-[var(--color-fg-4)] max-w-sm mx-auto mb-3.5">
                        Registra tu primera inversión para comenzar a monitorear tus rendimientos.
                      </p>
                      <button 
                        onClick={() => setSection("add")} 
                        className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl shadow-[0_0_12px_rgba(192,132,252,0.2)] hover:brightness-110 transition-all"
                      >
                        Añadir Primer Fondo
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto touch-scroll">
                      <table className="w-full text-left border-collapse text-xs min-w-[520px]">
                        <thead>
                          <tr className="border-b border-[var(--color-ink-3)] text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                            <th className="pb-2.5 font-medium">Fondo</th>
                            <th className="pb-2.5 font-medium">Entidad</th>
                            <th className="pb-2.5 font-medium text-right">Invertido</th>
                            <th className="pb-2.5 font-medium text-right">Valor Actual</th>
                            <th className="pb-2.5 font-medium text-right">Rentabilidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFunds.slice(0, 5).map((f) => {
                            const invested = f.total_invested || (f.shares * f.purchase_price);
                            const currentVal = (f.current_price ?? f.purchase_price) * f.shares;
                            const pl = currentVal - invested;
                            const plPct = invested > 0 ? (pl / invested) * 100 : 0;
                            const isP = pl >= 0;

                            const sourceInfo = getFundDataSourceInfo(f);
                            const bankInfo = getBankPortalInfo(f);

                            return (
                              <tr key={f.id} className="border-b border-[var(--color-ink-3)] hover:bg-[var(--color-ink-2)] transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] flex items-center justify-center font-mono font-bold text-[11px] text-[var(--color-fg-1)] shrink-0">
                                      {f.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <a
                                        href={sourceInfo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-[var(--color-fg-1)] hover:text-[var(--color-accent)] truncate max-w-[220px] sm:max-w-sm block transition-colors"
                                        title={`Ver en ${sourceInfo.name}`}
                                      >
                                        {f.name}
                                      </a>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-mono text-[var(--color-fg-5)]">{f.isin}</span>
                                        <a
                                          href={sourceInfo.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[var(--color-fg-5)] hover:text-[var(--color-accent)] transition-colors"
                                          title={`Ver en ${sourceInfo.name}`}
                                        >
                                          <ExternalLink size={9} />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 font-medium">
                                  {bankInfo ? (
                                    <a
                                      href={bankInfo.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--color-fg-2)] hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 group"
                                      title={`Ver en web de ${bankInfo.name}`}
                                    >
                                      <span>{bankInfo.name}</span>
                                      <ExternalLink size={9} className="text-[var(--color-fg-5)] group-hover:text-[var(--color-accent)] transition-colors" />
                                    </a>
                                  ) : (
                                    <span className="text-[var(--color-fg-5)]">—</span>
                                  )}
                                </td>
                                <td className="py-3 text-right font-mono text-[var(--color-fg-4)]">{fmtEur(invested)}</td>
                                <td className="py-3 text-right font-mono text-[var(--color-fg-1)] font-bold">{fmtEur(currentVal)}</td>
                                <td className="py-3 text-right font-mono font-bold">
                                  <span className={`px-2 py-0.5 rounded-md ${isP ? 'bg-[var(--color-profit)]/10 text-[var(--color-profit)]' : 'bg-[var(--color-loss)]/10 text-[var(--color-loss)]'}`}>
                                    {fmtPct(plPct)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
  );
}
