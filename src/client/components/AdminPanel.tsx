import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { api, type User, getSpecificFundUrl, getFundDataSourceInfo, getBankPortalInfo } from "../api";
import { useTheme } from "../theme";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, BarChart, Bar
} from 'recharts';
import { 
  LayoutDashboard, Users, Database, Smartphone, Server, Shield, Activity, Search,
  ArrowUpRight, ArrowDownRight, Edit2, Trash2, CheckCircle2, XCircle,
  RefreshCw, Power, Eye, EyeOff, Download, Sparkles, Plus, Send,
  FileText, Check, Copy, AlertTriangle, TrendingUp, Clock, Building2,
  X, ExternalLink, UserCheck, UserX, ChevronRight, Filter, Globe, Sun, Moon
} from 'lucide-react';
import { AdminReportTemplate } from "./AdminReportTemplate";
import { sanitizeFundName } from "../utils";
import { jsPDF } from 'jspdf';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type AdminSubSection = "overview" | "users" | "catalog" | "notifications" | "system";

// ─── Utils ─────────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function fmtEur(n: number) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}K`;
  return `€${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`;
  return `hace ${Math.floor(mins / 1440)}d`;
}

// ─── Real AUM History Generator ───────────────────────────────────────────────
function buildRealAumHistory(data: any, days = 30) {
  if (!data || !data.aum_history_raw) return [];
  const raw = data.aum_history_raw as { date: string | Date, amount: number }[];
  raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const history = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    let cumulative = 0;
    for (const r of raw) {
      if (new Date(r.date) <= d) {
        cumulative += r.amount;
      }
    }
    
    history.push({
      name: `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' }).replace('.', '')}`,
      fullDate: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
      value: Math.round(cumulative)
    });
  }
  return history;
}

// ─── Custom Tooltip for Charts ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullDate = payload[0].payload.fullDate || label;
    return (
      <div className="bg-[var(--color-ink-2)]/95 backdrop-blur-md border border-[var(--color-ink-3)] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <p className="text-[var(--color-fg-1)] text-xs font-medium mb-1">{fullDate}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || 'var(--color-accent)' }} />
            <span className="text-[var(--color-fg-4)]">{p.name === 'value' ? 'AUM' : p.name}:</span>
            <span className="text-[var(--color-fg-1)] font-mono font-bold">{fmtEur(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Toast Notification Component ─────────────────────────────────────────────
type Toast = { id: string; message: string; type: "success" | "error" | "info" };

// ─── Tab 1: UsersTab ──────────────────────────────────────────────────────────
export function UsersTab({ onToast }: { onToast?: (msg: string, type: "success" | "error" | "info") => void }) {
  const [data, setData] = useState<{users: any[], total: number}>({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      setData(await api.admin.users(search, statusFilter === "all" ? undefined : statusFilter)); 
    } catch {}
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const loadUserDetail = async (id: number) => {
    setSelectedUserId(id);
    setLoadingDetail(true);
    try {
      const res = await api.admin.userDetail(id);
      setUserDetail(res);
    } catch (e: any) {
      onToast?.(e.message || "Error al cargar usuario", "error");
    }
    setLoadingDetail(false);
  };

  const handleTestWhatsApp = async (id: number) => {
    setTestingWhatsApp(true);
    try {
      const res = await api.admin.testUserWhatsApp(id);
      onToast?.(`WhatsApp de prueba enviado con éxito a ${res.sent_to}`, "success");
      loadUserDetail(id);
    } catch (e: any) {
      onToast?.(e.message || "Error al enviar WhatsApp", "error");
    }
    setTestingWhatsApp(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-fg-1)] flex items-center gap-2">
            <Users size={18} className="text-[var(--color-accent)]" /> Gestión de Usuarios
          </h2>
          <p className="text-xs text-[var(--color-fg-4)] mt-0.5">{data.total} usuarios registrados en la plataforma</p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[var(--color-ink-2)] p-1 rounded-xl border border-[var(--color-ink-3)] w-full sm:w-auto overflow-x-auto no-scrollbar">
            {[
              { key: "all", label: "Todos" },
              { key: "active", label: "Activos" },
              { key: "admin", label: "Admins" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "deleted", label: "Baneados" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === f.key 
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]" 
                    : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
            <input 
              type="text" placeholder="Buscar email, usuario o tel..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full transition-all" />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : data.users.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-fg-4)] text-xs">No se encontraron usuarios coincidentes con el filtro.</div>
        ) : (
          <>
            {/* Mobile View (< sm) */}
            <div className="sm:hidden divide-y divide-[var(--color-ink-3)]">
              {data.users.map((u) => (
                <div key={u.id} className="p-4 space-y-3 cursor-pointer hover:bg-[var(--color-ink-2)]" onClick={() => loadUserDetail(u.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-accent)] shrink-0">
                        {u.username.substring(0,2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-[var(--color-fg-1)] truncate">{u.username}</p>
                          {u.is_admin ? <span className="px-1.5 py-0.2 bg-[var(--color-warn)]/15 text-[var(--color-warn)] rounded text-[9px] font-bold">ADMIN</span> : null}
                        </div>
                        <p className="text-[11px] text-[var(--color-fg-4)] truncate">{u.email}</p>
                      </div>
                    </div>
                    {u.deleted_at ? (
                      <span className="px-2 py-0.5 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded text-[10px] font-bold uppercase shrink-0">Baneado</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-bold uppercase shrink-0">Activo</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-ink-3)]">
                    <div className="flex items-center gap-2 text-[var(--color-fg-4)] text-[11px]">
                      <span>Inv: <strong className="text-[var(--color-fg-1)] font-mono">{u.investment_count}</strong></span>
                      <span>•</span>
                      <span>Total: <strong className="text-[var(--color-accent)] font-mono">{fmtEur(u.total_invested)}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={async () => { await api.admin.promoteUser(u.id, !u.is_admin); load(); onToast?.("Rol actualizado", "info"); }} 
                        className="p-1.5 text-[var(--color-fg-2)] hover:text-[var(--color-warn)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                        title={u.is_admin ? "Quitar admin" : "Hacer admin"}
                      >
                        <Shield size={13}/>
                      </button>
                      {u.deleted_at ? (
                        <button 
                          onClick={async () => { await api.admin.restoreUser(u.id); load(); onToast?.("Usuario reactivado", "success"); }} 
                          className="p-1.5 text-[var(--color-accent)] bg-[var(--color-accent)]/10 rounded-lg transition-colors"
                          title="Restaurar usuario"
                        >
                          <UserCheck size={13}/>
                        </button>
                      ) : (
                        <button 
                          onClick={async () => { await api.admin.deleteUser(u.id); load(); onToast?.("Usuario suspendido", "error"); }} 
                          className="p-1.5 text-[var(--color-danger)] bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                          title="Suspender usuario"
                        >
                          <UserX size={13}/>
                        </button>
                      )}
                      <button 
                        onClick={() => loadUserDetail(u.id)}
                        className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                        title="Ver detalle del usuario"
                      >
                        <ChevronRight size={13}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= sm) */}
            <div className="hidden sm:block overflow-x-auto touch-scroll">
              <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                <thead>
                  <tr className="border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/30 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                    <th className="py-3.5 px-5 font-medium">Usuario / Email</th>
                    <th className="py-3.5 px-5 font-medium">Auth</th>
                    <th className="py-3.5 px-5 font-medium">Inversiones</th>
                    <th className="py-3.5 px-5 font-medium">Patrimonio Nominal</th>
                    <th className="py-3.5 px-5 font-medium">WhatsApp</th>
                    <th className="py-3.5 px-5 font-medium">Estado</th>
                    <th className="py-3.5 px-5 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr 
                      key={u.id} 
                      onClick={() => loadUserDetail(u.id)}
                      className="border-b border-[var(--color-ink-3)] hover:bg-[var(--color-ink-2)] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-accent)] group-hover:scale-105 transition-transform">
                            {u.username.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-[var(--color-fg-1)] group-hover:text-[var(--color-accent)] transition-colors">{u.username}</p>
                              {u.is_admin ? <span className="px-1.5 py-0.2 bg-[var(--color-warn)]/15 text-[var(--color-warn)] rounded text-[9px] font-bold">ADMIN</span> : null}
                            </div>
                            <p className="text-[10px] text-[var(--color-fg-4)]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex gap-1 text-[10px]">
                          {u.has_google ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">Google</span> : null}
                          {u.has_github ? <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-mono">GitHub</span> : null}
                          {u.has_password ? <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">Email</span> : null}
                        </div>
                      </td>
                      <td className="py-3 px-5 font-mono text-xs text-[var(--color-fg-2)]">{u.investment_count} fondos</td>
                      <td className="py-3 px-5 font-mono text-xs font-bold text-[var(--color-fg-1)]">{fmtEur(u.total_invested)}</td>
                      <td className="py-3 px-5">
                        {u.whatsapp_enabled === "1" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--color-accent)] font-semibold bg-[var(--color-accent)]/10 px-2 py-0.5 rounded">
                            <Smartphone size={10} /> Activo
                          </span>
                        ) : u.phone ? (
                          <span className="text-[10px] font-mono text-[var(--color-fg-4)]">Configurado</span>
                        ) : (
                          <span className="text-[10px] font-mono text-[var(--color-fg-5)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        {u.deleted_at ? (
                          <span className="px-2 py-0.5 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded text-[10px] font-bold uppercase">Baneado</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-bold uppercase">Activo</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right space-x-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={async () => { await api.admin.promoteUser(u.id, !u.is_admin); load(); onToast?.("Rol actualizado", "info"); }} 
                          title={u.is_admin ? "Quitar admin" : "Hacer admin"}
                          className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-warn)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                        >
                          <Shield size={13}/>
                        </button>
                        {u.deleted_at ? (
                          <button 
                            onClick={async () => { await api.admin.restoreUser(u.id); load(); onToast?.("Usuario reactivado", "success"); }} 
                            title="Restaurar usuario"
                            className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-accent)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                          >
                            <UserCheck size={13}/>
                          </button>
                        ) : (
                          <button 
                            onClick={async () => { await api.admin.deleteUser(u.id); load(); onToast?.("Usuario suspendido", "error"); }} 
                            title="Suspender usuario"
                            className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-danger)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                          >
                            <UserX size={13}/>
                          </button>
                        )}
                        <button 
                          onClick={() => loadUserDetail(u.id)}
                          title="Inspeccionar cartera y detalles"
                          className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                        >
                          <ChevronRight size={13}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* User Detail Inspector Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setSelectedUserId(null)}>
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-ink-3)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 flex items-center justify-center font-bold text-sm text-[var(--color-accent)]">
                  {userDetail?.user?.username?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    {userDetail?.user?.username}
                    {userDetail?.user?.is_admin ? <span className="px-2 py-0.2 bg-[var(--color-warn)]/20 text-[var(--color-warn)] rounded text-[10px] font-bold">ADMINISTRADOR</span> : null}
                  </h3>
                  <p className="text-xs text-[var(--color-fg-4)]">{userDetail?.user?.email} • ID: {selectedUserId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserId(null)} className="p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] rounded-lg bg-[var(--color-ink-2)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : userDetail ? (
              <div className="space-y-4">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3">
                    <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider block">Inversión Nominal</span>
                    <span className="text-sm font-mono font-bold text-[var(--color-fg-1)] mt-1 block">{fmtEur(userDetail.summary.totalInvested)}</span>
                  </div>
                  <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3">
                    <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider block">Valor Actual</span>
                    <span className="text-sm font-mono font-bold text-[var(--color-fg-1)] mt-1 block">{fmtEur(userDetail.summary.totalCurrent)}</span>
                  </div>
                  <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3">
                    <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider block">Ganancia / Pérdida</span>
                    <span className={`text-sm font-mono font-bold mt-1 block ${userDetail.summary.totalProfitLoss >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                      {userDetail.summary.totalProfitLoss >= 0 ? '+' : ''}{fmtEur(userDetail.summary.totalProfitLoss)}
                    </span>
                  </div>
                  <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3">
                    <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider block">Rentabilidad</span>
                    <span className={`text-sm font-mono font-bold mt-1 block ${userDetail.summary.totalProfitLossPct >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                      {userDetail.summary.totalProfitLossPct >= 0 ? '+' : ''}{userDetail.summary.totalProfitLossPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* WhatsApp & Alerts Info */}
                <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-fg-1)] flex items-center gap-1.5">
                      <Smartphone size={14} className="text-[var(--color-accent)]" /> Canal WhatsApp & Notificaciones
                    </h4>
                    <p className="text-[11px] text-[var(--color-fg-4)] mt-0.5">
                      Teléfono: <strong className="text-[var(--color-fg-1)] font-mono">{userDetail.whatsapp.phone || 'No configurado'}</strong> • 
                      Estado: <strong className={userDetail.whatsapp.enabled ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-5)]'}>{userDetail.whatsapp.enabled ? 'Activo' : 'Desactivado'}</strong> •
                      Último envío: {timeAgo(userDetail.whatsapp.lastSent)}
                    </p>
                  </div>
                  {userDetail.whatsapp.phone && (
                    <button
                      onClick={() => handleTestWhatsApp(selectedUserId)}
                      disabled={testingWhatsApp}
                      className="px-3 py-1.5 bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-fg)] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      <Send size={12} />
                      {testingWhatsApp ? "Enviando..." : "Test WhatsApp"}
                    </button>
                  )}
                </div>

                {/* Investment Portfolio Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-fg-1)] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Posiciones en Cartera ({userDetail.investments.length})</span>
                  </h4>
                  {userDetail.investments.length === 0 ? (
                    <div className="p-6 text-center text-[var(--color-fg-5)] text-xs bg-[var(--color-ink-2)]/40 rounded-xl border border-[var(--color-ink-3)]">
                      El usuario no tiene fondos activos en su cartera.
                    </div>
                  ) : (
                    <div className="bg-[var(--color-ink-2)]/40 rounded-xl border border-[var(--color-ink-3)] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-[var(--color-ink-3)] text-[var(--color-fg-4)] font-mono text-[10px] uppercase">
                              <th className="p-2.5">Fondo</th>
                              <th className="p-2.5">Participaciones</th>
                              <th className="p-2.5">Precio Compra</th>
                              <th className="p-2.5">NAV Actual</th>
                              <th className="p-2.5 text-right">P&L</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-ink-3)]">
                            {userDetail.investments.map((inv: any) => {
                              const invested = Number(inv.shares) * Number(inv.purchase_price);
                              const curPrice = Number(inv.current_price) || Number(inv.purchase_price);
                              const curVal = Number(inv.shares) * curPrice;
                              const pl = curVal - invested;
                              const plPct = invested > 0 ? (pl / invested) * 100 : 0;
                              return (
                                <tr key={inv.id} className="hover:bg-[var(--color-ink-2)]">
                                  <td className="p-2.5">
                                    <p className="text-[var(--color-fg-1)] font-medium truncate max-w-[200px]">{sanitizeFundName(inv.name)}</p>
                                    <p className="text-[10px] font-mono text-[var(--color-accent)]">{inv.isin} • {inv.bank}</p>
                                  </td>
                                  <td className="p-2.5 font-mono text-[var(--color-fg-2)]">{Number(inv.shares).toFixed(4)}</td>
                                  <td className="p-2.5 font-mono text-[var(--color-fg-2)]">€{Number(inv.purchase_price).toFixed(2)}</td>
                                  <td className="p-2.5 font-mono text-[var(--color-fg-1)] font-bold">€{curPrice.toFixed(2)}</td>
                                  <td className={`p-2.5 font-mono text-right font-bold ${pl >= 0 ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                                    {pl >= 0 ? '+' : ''}{fmtEur(pl)} ({plPct.toFixed(1)}%)
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: CatalogTab ────────────────────────────────────────────────────────
export function CatalogTab({ onToast }: { onToast?: (msg: string, type: "success" | "error" | "info") => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshingIsin, setRefreshingIsin] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFund, setEditingFund] = useState<any | null>(null);

  // Form State for Adding / Editing
  const [formIsin, setFormIsin] = useState("");
  const [formName, setFormName] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formCategory, setFormCategory] = useState("Renta Variable");
  const [formRisk, setFormRisk] = useState(3);
  const [formTicker, setFormTicker] = useState("");
  const [formPrice, setFormPrice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.admin.catalog(search)); } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const results = search ? data?.results ?? [] : data?.top_funds ?? [];

  const handleRefreshPrice = async (isin: string) => {
    setRefreshingIsin(isin);
    try {
      const res = await api.admin.refreshFundPrice(isin);
      onToast?.(`Precio actualizado para ${isin}: €${Number(res.price).toFixed(4)} (${res.source})`, "success");
      load();
    } catch (e: any) {
      onToast?.(e.message || "Error al actualizar precio", "error");
    }
    setRefreshingIsin(null);
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      const res = await api.admin.refreshAllPrices();
      onToast?.(`Sincronización iniciada para ${res.total} fondos en segundo plano`, "info");
      load();
    } catch (e: any) {
      onToast?.(e.message || "Error al sincronizar", "error");
    }
    setTimeout(() => setIsRefreshingAll(false), 2000);
  };

  const handleSaveNewFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formIsin || !formName) {
      onToast?.("ISIN y Nombre son obligatorios", "error");
      return;
    }
    try {
      await api.admin.addCatalogFund({
        isin: formIsin,
        name: formName,
        bank: formBank,
        category: formCategory,
        risk_level: Number(formRisk),
        yahoo_ticker: formTicker || undefined,
        base_price: formPrice ? Number(formPrice) : undefined
      });
      onToast?.(`Fondo ${formIsin} registrado con éxito`, "success");
      setShowAddModal(false);
      // Reset form
      setFormIsin("");
      setFormName("");
      setFormBank("");
      setFormTicker("");
      setFormPrice("");
      load();
    } catch (e: any) {
      onToast?.(e.message || "Error al registrar fondo", "error");
    }
  };

  const handleUpdateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFund) return;
    try {
      await api.admin.updateCatalogFund(editingFund.isin, {
        name: formName,
        bank: formBank,
        category: formCategory,
        risk_level: Number(formRisk),
        yahoo_ticker: formTicker || null
      });
      onToast?.(`Fondo ${editingFund.isin} actualizado`, "success");
      setEditingFund(null);
      load();
    } catch (e: any) {
      onToast?.(e.message || "Error al actualizar fondo", "error");
    }
  };

  const handleDeleteFund = async (isin: string) => {
    if (!confirm(`¿Seguro que deseas eliminar el fondo ${isin} del catálogo?`)) return;
    try {
      await api.admin.deleteCatalogFund(isin);
      onToast?.(`Fondo ${isin} eliminado del catálogo`, "info");
      load();
    } catch (e: any) {
      onToast?.(e.message || "No se pudo eliminar el fondo", "error");
    }
  };

  const openEditModal = (f: any) => {
    setEditingFund(f);
    setFormName(f.name);
    setFormBank(f.bank || "");
    setFormCategory(f.category || "Renta Variable");
    setFormRisk(f.risk_level || 3);
    setFormTicker(f.yahoo_ticker || "");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4">
          <p className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-1">Total Fondos Catálogo</p>
          <p className="text-2xl font-bold font-mono text-[var(--color-fg-1)]">{fmtNum(data?.total ?? 0)}</p>
        </div>
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4">
          <p className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-1">Sin Yahoo Ticker</p>
          <p className="text-2xl font-bold font-mono text-[var(--color-warn)]">{fmtNum(data?.missing_ticker ?? 0)}</p>
        </div>
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4">
          <p className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-1">Sin Cotización</p>
          <p className="text-2xl font-bold font-mono text-[var(--color-danger)]">{fmtNum(data?.missing_price ?? 0)}</p>
        </div>
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 flex flex-col justify-between">
          <p className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Sincronización</p>
          <button 
            onClick={handleRefreshAll} 
            disabled={isRefreshingAll}
            className="w-full py-1.5 mt-2 bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-fg)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshingAll ? "animate-spin" : ""} />
            {isRefreshingAll ? "Sincronizando..." : "Sincronizar Todos"}
          </button>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 gap-3">
        <div>
          <h2 className="text-base font-bold text-[var(--color-fg-1)] flex items-center gap-2">
            <Database size={18} className="text-[var(--color-accent)]" /> Directorio de Fondos
          </h2>
          <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Control de ISINs, tickers, cotizaciones en directo y metadatos</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
            <input 
              type="text" placeholder="Buscar ISIN, nombre o banco..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full transition-all" />
          </div>

          <button
            onClick={() => {
              setFormIsin("");
              setFormName("");
              setFormBank("");
              setFormTicker("");
              setFormPrice("");
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-xs rounded-xl hover:brightness-110 shadow-[0_0_12px_rgba(57,255,136,0.25)] transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            <span>Añadir Fondo</span>
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-fg-4)] text-xs">No se encontraron fondos en el catálogo.</div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left border-collapse text-xs min-w-[760px]">
              <thead>
                <tr className="border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/30 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-5 font-medium">Fondo (ISIN)</th>
                  <th className="py-3.5 px-5 font-medium">Banco / Gestora</th>
                  <th className="py-3.5 px-5 font-medium">Categoría</th>
                  <th className="py-3.5 px-5 font-medium">Yahoo Ticker</th>
                  <th className="py-3.5 px-5 font-medium">Último Precio</th>
                  <th className="py-3.5 px-5 font-medium text-center">Inversores</th>
                  <th className="py-3.5 px-5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {results.map((f: any) => (
                  <tr key={f.isin} className="border-b border-[var(--color-ink-3)] hover:bg-[var(--color-ink-2)] transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="text-xs font-semibold text-[var(--color-fg-1)] truncate max-w-[240px]" title={sanitizeFundName(f.name)}>{sanitizeFundName(f.name)}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-[var(--color-accent)] font-bold">{f.isin}</span>
                        {f.risk_level ? <span className="text-[9px] font-mono px-1 py-0.2 bg-[var(--color-ink-2)] rounded text-[var(--color-fg-2)]">Riesgo {f.risk_level}/7</span> : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[var(--color-fg-2)]">{f.bank || '—'}</td>
                    <td className="py-3.5 px-5 text-[var(--color-fg-4)] text-[11px]">{f.category || 'Renta Variable'}</td>
                    <td className="py-3.5 px-5">
                      <input 
                        defaultValue={f.yahoo_ticker ?? ""}
                        placeholder="Sin ticker"
                        onBlur={async (e) => {
                          if (e.target.value !== (f.yahoo_ticker || "")) {
                            await api.admin.updateTicker(f.isin, e.target.value);
                            onToast?.(`Ticker actualizado para ${f.isin}`, "info");
                            load();
                          }
                        }}
                        className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-lg px-2 py-1 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-24 font-mono" />
                    </td>
                    <td className="py-3.5 px-5">
                      {f.price ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs text-[var(--color-fg-1)] font-mono font-bold">€{Number(f.price).toFixed(4)}</p>
                            <p className="text-[9px] text-[var(--color-fg-4)] font-mono">{timeAgo(f.updated_at)}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--color-danger)] uppercase font-mono font-bold">Sin Precio</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center font-mono text-xs text-[var(--color-fg-2)]">
                      {f.usage_count > 0 ? (
                        <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold rounded">
                          {f.usage_count}
                        </span>
                      ) : (
                        <span className="text-[var(--color-fg-5)]">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1">
                      <button 
                        onClick={() => handleRefreshPrice(f.isin)}
                        disabled={refreshingIsin === f.isin}
                        title="Actualizar precio en directo (Scraper / Yahoo)"
                        className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-accent)] bg-[var(--color-ink-2)] rounded-lg transition-colors disabled:opacity-40"
                      >
                        <RefreshCw size={13} className={refreshingIsin === f.isin ? "animate-spin text-[var(--color-accent)]" : ""} />
                      </button>
                      <button 
                        onClick={() => openEditModal(f)}
                        title="Editar metadatos"
                        className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDeleteFund(f.isin)}
                        title="Eliminar del catálogo"
                        className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-danger)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Fund Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-ink-3)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                <Plus size={18} className="text-[var(--color-accent)]" /> Añadir Nuevo Fondo al Catálogo
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"><X size={16}/></button>
            </div>

            <form onSubmit={handleSaveNewFund} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Código ISIN *</label>
                <input 
                  type="text" required placeholder="Ej: ES0152769039 o LU1681045370"
                  value={formIsin} onChange={e => setFormIsin(e.target.value.toUpperCase())}
                  className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full font-mono uppercase" />
              </div>

              <div>
                <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Nombre Completo del Fondo *</label>
                <input 
                  type="text" required placeholder="Ej: Santander Acciones Españolas FI"
                  value={formName} onChange={e => setFormName(e.target.value)}
                  className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Banco / Gestora</label>
                  <input 
                    type="text" placeholder="Ej: Santander, BBVA, Vanguard"
                    value={formBank} onChange={e => setFormBank(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Categoría</label>
                  <select 
                    value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full"
                  >
                    <option value="Renta Variable">Renta Variable</option>
                    <option value="Renta Fija">Renta Fija</option>
                    <option value="Monetario">Monetario</option>
                    <option value="Mixto">Mixto</option>
                    <option value="Indexado">Indexado / ETF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Riesgo (1-7)</label>
                  <input 
                    type="number" min="1" max="7" value={formRisk} onChange={e => setFormRisk(Number(e.target.value))}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Yahoo Ticker</label>
                  <input 
                    type="text" placeholder="Ej: 0P0000X.F"
                    value={formTicker} onChange={e => setFormTicker(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">NAV Inicial (€)</label>
                  <input 
                    type="number" step="0.0001" placeholder="Ej: 145.20"
                    value={formPrice} onChange={e => setFormPrice(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-ink-3)]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-2)] text-xs font-semibold text-[var(--color-fg-2)] rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-xs rounded-xl hover:brightness-110 shadow-[0_0_10px_rgba(57,255,136,0.3)] transition-all">
                  Guardar en Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fund Modal */}
      {editingFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setEditingFund(null)}>
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-ink-3)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                <Edit2 size={18} className="text-[var(--color-accent)]" /> Editar Fondo: {editingFund.isin}
              </h3>
              <button onClick={() => setEditingFund(null)} className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"><X size={16}/></button>
            </div>

            <form onSubmit={handleUpdateFund} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Nombre Completo *</label>
                <input 
                  type="text" required value={formName} onChange={e => setFormName(e.target.value)}
                  className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Banco / Gestora</label>
                  <input 
                    type="text" value={formBank} onChange={e => setFormBank(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Categoría</label>
                  <select 
                    value={formCategory} onChange={e => setFormCategory(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full"
                  >
                    <option value="Renta Variable">Renta Variable</option>
                    <option value="Renta Fija">Renta Fija</option>
                    <option value="Monetario">Monetario</option>
                    <option value="Mixto">Mixto</option>
                    <option value="Indexado">Indexado / ETF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Riesgo (1-7)</label>
                  <input 
                    type="number" min="1" max="7" value={formRisk} onChange={e => setFormRisk(Number(e.target.value))}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full font-mono" />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider block mb-1">Yahoo Ticker</label>
                  <input 
                    type="text" placeholder="Ej: 0P0000X.F"
                    value={formTicker} onChange={e => setFormTicker(e.target.value)}
                    className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl px-3 py-2 text-xs text-[var(--color-fg-1)] focus:outline-none focus:border-[var(--color-accent)]/50 w-full font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-ink-3)]">
                <button type="button" onClick={() => setEditingFund(null)} className="px-4 py-2 bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-2)] text-xs font-semibold text-[var(--color-fg-2)] rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold text-xs rounded-xl hover:brightness-110 shadow-[0_0_10px_rgba(57,255,136,0.3)] transition-all">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: NotificationsTab ──────────────────────────────────────────────────
export function NotificationsTab({ onToast }: { onToast?: (msg: string, type: "success" | "error" | "info") => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<{ userId: number; message: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const [stats, preview] = await Promise.all([
        api.admin.notifications(),
        api.admin.previewNotification().catch(() => null)
      ]);
      setData(stats);
      setPreviewData(preview);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const [isTriggering, setIsTriggering] = useState(false);

  const triggerDigest = async () => {
    setIsTriggering(true);
    try {
      await api.admin.triggerDigest();
      onToast?.("Disparado envío de resumen diario para todos los usuarios", "success");
      load();
      let count = 0;
      const interval = setInterval(() => {
        load();
        count++;
        if (count >= 4) {
          clearInterval(interval);
          setIsTriggering(false);
        }
      }, 3000);
    } catch (e: any) {
      onToast?.(e.message || "Error al disparar digest", "error");
      setIsTriggering(false);
    }
  };

  const totalPages = Math.ceil((data?.user_statuses?.length || 0) / limit) || 1;
  const paginatedData = data?.user_statuses?.slice((page - 1) * limit, page * limit) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Banner & Control */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[var(--color-accent)]/10 blur-2xl rounded-full" />
          <p className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">WhatsApp Activos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-mono text-[var(--color-fg-1)]">{data?.enabled ?? 0}</p>
            <p className="text-xs text-[var(--color-fg-4)] font-mono">/ {data?.total_users ?? 0} usuarios</p>
          </div>
          <p className="text-xs text-[var(--color-fg-4)] mt-2">Usuarios con teléfono verificado y horario de entrega programado.</p>
        </div>

        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5">
          <p className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">Último Envío Global</p>
          <p className="text-xl font-bold font-mono text-[var(--color-fg-1)]">{timeAgo(data?.last_global_digest)}</p>
          <p className="text-xs text-[var(--color-fg-4)] mt-2">Próxima ventana automática según cron scheduler: 08:00 / 14:00 / 20:00 CET.</p>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-accent)]/15 to-[var(--color-ink-1)] border border-[var(--color-accent)]/20 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-fg-1)] flex items-center gap-2">
              <Smartphone size={16} className="text-[var(--color-accent)]" /> Disparador Global
            </h2>
            <p className="text-xs text-[var(--color-fg-4)] mt-1">Fuerza la ejecución inmediata de los resúmenes diarios de WhatsApp.</p>
          </div>
          <button 
            onClick={triggerDigest} 
            disabled={isTriggering}
            className="w-full py-2.5 mt-3 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(57,255,136,0.2)] transition-all flex items-center justify-center gap-2"
          >
            {isTriggering ? (
              <><div className="w-3.5 h-3.5 border-2 border-[#0a0a0c] border-t-transparent rounded-full animate-spin" /> Enviando...</>
            ) : (
              <><Power size={14} /> Disparar Envío Global</>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Smartphone Message Simulator + Delivery History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Smartphone Simulator */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                <Smartphone size={15} className="text-[var(--color-accent)]" /> Simulador de Plantilla
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded">Live WhatsApp</span>
            </div>
            <p className="text-xs text-[var(--color-fg-4)] mb-3">
              Visualización real del mensaje que reciben los usuarios en su WhatsApp diario:
            </p>
          </div>

          {/* Smartphone Mockup */}
          <div className="bg-[#0b141a] border border-[#202c33] rounded-2xl p-3 text-xs font-sans text-[#e9edef] space-y-2 shadow-inner my-2">
            <div className="flex items-center gap-2 border-b border-[#202c33] pb-2 text-[11px] text-[#8696a0]">
              <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center font-bold text-[var(--color-fg-1)] text-[10px]">FT</div>
              <div>
                <p className="font-semibold text-[var(--color-fg-1)] leading-tight">FondTracker Bot</p>
                <p className="text-[9px]">en línea</p>
              </div>
            </div>

            <div className="bg-[#005c4b] p-3 rounded-xl text-[11px] text-[var(--color-fg-1)] leading-relaxed font-sans whitespace-pre-line shadow">
              {previewData?.message || `📊 *FondTracker — Resumen Diario*\n\n💼 *Cartera Total:* €142.580,20\n📈 *Ganancia Total:* +€8.450,12 (+6,30%)\n\n🏆 *Mejor Activo:* Santander Acciones (+1,2%)\n📉 *Menor Activo:* Vanguard Global (-0,1%)\n\n⚡ Actualizado automáticamente por FondTracker.`}
              <div className="text-right text-[9px] text-white/70 mt-1">14:00 ✓✓</div>
            </div>
          </div>

          <p className="text-[10px] text-[var(--color-fg-5)] mt-2 text-center">Formato Markdown de Callmebot con negritas, emojis y NAVs en directo</p>
        </div>

        {/* Deliveries History Table */}
        <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-[var(--color-ink-3)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-fg-1)]">Historial y Estado de Envíos WhatsApp</h3>
                <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Estado de entrega del último reporte para cada usuario</p>
              </div>
              <span className="text-xs font-mono text-[var(--color-fg-4)]">{data?.user_statuses?.length || 0} registros</span>
            </div>
            
            {loading && !data ? (
              <div className="p-8 text-center"><div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : paginatedData.length === 0 ? (
              <div className="p-6 text-center text-[var(--color-fg-5)] text-xs">Sin usuarios con WhatsApp configurado.</div>
            ) : (
              <div className="overflow-x-auto touch-scroll">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--color-ink-3)] bg-[var(--color-ink-2)]/30 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                      <th className="py-3 px-5 font-medium">Usuario</th>
                      <th className="py-3 px-5 font-medium">Teléfono</th>
                      <th className="py-3 px-5 font-medium">Último Envío</th>
                      <th className="py-3 px-5 font-medium text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((u: any) => (
                      <tr key={u.userId} className="border-b border-[var(--color-ink-3)] hover:bg-[var(--color-ink-2)] transition-colors">
                        <td className="py-3 px-5 text-[var(--color-fg-1)] font-medium">
                          {u.name} <span className="text-[10px] text-[var(--color-fg-4)] font-mono ml-1">(ID: {u.userId})</span>
                        </td>
                        <td className="py-3 px-5 font-mono text-[var(--color-fg-2)]">{u.phone || '—'}</td>
                        <td className="py-3 px-5 text-[var(--color-fg-4)] font-mono text-xs">{timeAgo(u.lastSent)}</td>
                        <td className="py-3 px-5 text-right">
                          {!u.lastStatus ? (
                            <span className="px-2 py-0.5 bg-[var(--color-fg-4)]/10 text-[var(--color-fg-4)] rounded text-[10px] font-bold uppercase">Pendiente</span>
                          ) : u.lastStatus === 'ok' ? (
                            <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-bold uppercase">OK</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded text-[10px] font-bold uppercase max-w-[140px] truncate inline-block" title={u.lastStatus}>Error</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[var(--color-ink-3)] flex items-center justify-between text-xs">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-xs font-medium text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-6 h-6 rounded-md text-xs font-medium transition-colors ${page === i + 1 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold' : 'text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-xs font-medium text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Tab 4: SystemTab ─────────────────────────────────────────────────────────
export function SystemTab({ data, onToast }: { data: any; onToast?: (msg: string, type: "success" | "error" | "info") => void }) {
  const [visibleEnv, setVisibleEnv] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await api.admin.activityLogs();
      setLogs(res.logs || []);
    } catch {}
    setLoadingLogs(false);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const toggleEnv = (key: string) => {
    setVisibleEnv(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyEnv = (val: string) => {
    navigator.clipboard.writeText(val);
    onToast?.("Copiado al portapapeles", "info");
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await api.admin.clearCache();
      onToast?.("Caché en memoria purgada correctamente", "success");
      loadLogs();
    } catch (e: any) {
      onToast?.(e.message || "Error al purgar caché", "error");
    }
    setIsClearingCache(false);
  };

  if (!data) return <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Server Health Overview */}
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-2xl rounded-full" />
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--color-fg-1)] flex items-center gap-2">
              <Server size={18} className="text-[var(--color-accent)]" /> Estado del Servidor & Motor Runtime
            </h2>
            <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Diagnóstico en tiempo real del proceso Node/Bun y pool de base de datos</p>
          </div>

          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="px-3 py-1.5 bg-[var(--color-warn)]/15 border border-[var(--color-warn)]/30 text-[var(--color-warn)] hover:bg-[var(--color-warn)] hover:text-[var(--color-accent-fg)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={isClearingCache ? "animate-spin" : ""} />
            <span>{isClearingCache ? "Purgando..." : "Purgar Caché"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Uptime</span>
            <span className="text-sm text-[var(--color-fg-1)] font-mono font-bold mt-1">{Math.floor(data.uptime / 3600)}h {Math.floor((data.uptime % 3600) / 60)}m</span>
          </div>
          <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Entorno</span>
            <span className="text-sm text-[var(--color-warn)] font-mono uppercase font-bold mt-1">{data.node_env}</span>
          </div>
          <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Bun / Runtime</span>
            <span className="text-sm text-[var(--color-accent)] font-mono font-bold mt-1">{data.bun_version}</span>
          </div>
          <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Caché Precios</span>
            <span className="text-sm text-[var(--color-fg-1)] font-mono font-bold mt-1">{data.price_cache_size} fondos</span>
          </div>
        </div>

        {/* Memory & Process Diagnostic */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="bg-[var(--color-ink-2)]/60 border border-[var(--color-ink-3)] rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-[var(--color-fg-4)]">Memoria RSS / Heap</span>
            <span className="text-xs font-mono font-bold text-[var(--color-fg-1)]">{data.memory_rss_mb || 68} MB / {data.memory_heap_mb || 32} MB</span>
          </div>
          <div className="bg-[var(--color-ink-2)]/60 border border-[var(--color-ink-3)] rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-[var(--color-fg-4)]">CRON Secret Config</span>
            <span className="text-xs font-mono font-bold text-[var(--color-accent)]">Configurado</span>
          </div>
          <div className="bg-[var(--color-ink-2)]/60 border border-[var(--color-ink-3)] rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-[var(--color-fg-4)]">Database Pool</span>
            <span className="text-xs font-mono font-bold text-[var(--color-accent)]">MySQL Conectado</span>
          </div>
        </div>
      </div>

      {/* Grid: Audit Logs & Environment Variables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Live Audit Activity Log */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                <Activity size={16} className="text-[var(--color-accent)]" /> Registro de Actividad & Auditoría
              </h3>
              <button onClick={loadLogs} className="p-1 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] rounded transition-colors" title="Refrescar logs">
                <RefreshCw size={13} className={loadingLogs ? "animate-spin" : ""} />
              </button>
            </div>
            <p className="text-xs text-[var(--color-fg-4)] mb-3">Últimas acciones administrativas y eventos del sistema:</p>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
            {logs.length === 0 ? (
              <div className="text-xs text-[var(--color-fg-5)] py-6 text-center">Sin eventos registrados aún.</div>
            ) : (
              logs.map((log) => {
                const badgeColor = 
                  log.type.includes("BAN") ? "bg-red-500/15 text-red-400 border-red-500/30" :
                  log.type.includes("ADMIN") ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  log.type.includes("PRICE") || log.type.includes("CATALOG") ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                  "bg-blue-500/15 text-blue-400 border-blue-500/30";
                return (
                  <div key={log.id} className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-2.5 flex items-start gap-2.5">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 mt-0.5 ${badgeColor}`}>
                      {log.type.replace("_", " ")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--color-fg-2)] leading-snug">{log.message}</p>
                      <span className="text-[9px] font-mono text-[var(--color-fg-5)] mt-0.5 block">{timeAgo(log.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-[var(--color-fg-1)] mb-2 flex items-center gap-2">
            <Shield size={16} className="text-[var(--color-warn)]" /> Variables de Entorno del Sistema
          </h3>
          <p className="text-xs text-[var(--color-fg-4)] mb-3">Valores de configuración detectados en el servidor:</p>

          <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
            {data.env && Object.keys(data.env).map(key => (
              <div key={key} className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-[var(--color-fg-4)] font-bold font-mono truncate">{key}</span>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-[var(--color-fg-1)] font-mono break-all text-right">
                    {visibleEnv[key] ? data.env[key] : "••••••••••••••••"}
                  </span>
                  <button onClick={() => toggleEnv(key)} className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] transition-colors p-1" title="Mostrar/Ocultar">
                    {visibleEnv[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button onClick={() => copyEnv(data.env[key])} className="text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] transition-colors p-1" title="Copiar valor">
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Exported Admin Section Content ───────────────────────────────────────────
export function AdminSectionContent({ user, initialSubSection }: { user: User; initialSubSection?: AdminSubSection }) {
  const [subSection, setSubSection] = useState<AdminSubSection>(initialSubSection || "overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [aumTimeframe, setAumTimeframe] = useState<number>(30);
  const [toast, setToast] = useState<Toast | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ id: String(Date.now()), message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (initialSubSection) setSubSection(initialSubSection);
  }, [initialSubSection]);

  const load = useCallback(async () => { 
    setLoading(true); 
    try { setData(await api.admin.overview()); } catch {} 
    setLoading(false); 
  }, []);
  
  useEffect(() => { load(); }, [load]);

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const { toJpeg } = await import('html-to-image');
      const pageEl = reportRef.current;
      const imgData = await toJpeg(pageEl, { 
        quality: 0.95, 
        pixelRatio: 2, 
        backgroundColor: '#0a0a0c',
        width: 794,
        height: 1123,
      });
      
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FondTracker_Auditoria_Admin_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Informe PDF de auditoría descargado", "success");
    } catch (err) {
      console.error("Failed to export PDF", err);
      showToast("Error al generar PDF", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const authDist = useMemo(() => {
    return [
      { name: 'Google', value: data?.auth_google ?? 0, color: '#39ff88' },
      { name: 'GitHub', value: data?.auth_github ?? 0, color: '#a855f7' },
      { name: 'Email/Pass', value: data?.auth_password ?? 0, color: '#3b82f6' }
    ].filter(d => d.value > 0);
  }, [data?.auth_google, data?.auth_github, data?.auth_password]);

  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sectionRef.current) {
      const scrollParent = sectionRef.current.closest('.overflow-y-auto');
      if (scrollParent) scrollParent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [subSection]);

  const SUB_NAV: { key: AdminSubSection; label: string; icon: JSX.Element }[] = [
    { key: "overview", label: "Dashboard Admin", icon: <LayoutDashboard size={14} /> },
    { key: "users", label: "Usuarios", icon: <Users size={14} /> },
    { key: "catalog", label: "Catálogo de Fondos", icon: <Database size={14} /> },
    { key: "notifications", label: "WhatsApp & Alertas", icon: <Smartphone size={14} /> },
    { key: "system", label: "Servidor & Auditoría", icon: <Server size={14} /> },
  ];

  return (
    <div ref={sectionRef} className="space-y-4">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-fade-in ${
          toast.type === 'success' ? 'bg-[#002b1b] text-[var(--color-profit)] border-[var(--color-profit)]/40' :
          toast.type === 'error' ? 'bg-[#2b0808] text-[var(--color-loss)] border-[var(--color-loss)]/40' :
          'bg-[var(--color-ink-2)] text-[var(--color-fg-1)] border-[var(--color-ink-3)]'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15}/> : toast.type === 'error' ? <AlertTriangle size={15}/> : <Activity size={15}/>}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sub Navigation Selector Pills */}
      <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar touch-scroll">
        <div className="flex items-center gap-1.5">
          {SUB_NAV.map(item => {
            const active = subSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setSubSection(item.key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  active 
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-[0_0_10px_rgba(57,255,136,0.25)]" 
                    : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action: PDF Report */}
        <button
          onClick={exportPdf}
          disabled={isExporting}
          className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-3)] text-[var(--color-fg-1)] text-xs font-semibold rounded-xl border border-[var(--color-ink-3)] transition-colors shadow-sm"
        >
          <Download size={13} />
          <span>{isExporting ? "Generando..." : "Informe PDF"}</span>
        </button>
      </div>

      {/* Sub-view Render */}
      {loading && !data ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subSection === "overview" ? (
        <div className="space-y-4 animate-fade-in">
          
          {/* Top Row: 4 Main KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">
                <span>Total AUM</span>
                <span className="text-[var(--color-accent)] font-bold font-mono">Nominal</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg-1)] tracking-tight">{fmtEur(data?.aum_total ?? 0)}</p>
              <p className="text-[11px] text-[var(--color-accent)] mt-2 flex items-center gap-1 font-mono">
                <ArrowUpRight size={13} /> {data?.total_investments ?? 0} posiciones
              </p>
            </div>

            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">
                <span>Usuarios Activos</span>
                <span className="text-blue-400 font-bold font-mono">+{data?.new_this_week ?? 0} sem.</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg-1)] tracking-tight">{data?.active_users ?? 0}</p>
              <p className="text-[11px] text-[var(--color-fg-4)] mt-2 font-mono">{data?.total_users ?? 0} registrados totales</p>
            </div>

            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">
                <span>Catálogo Fondos</span>
                <span className="text-[var(--color-accent)] font-bold font-mono">CNMV / Yahoo</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg-1)] tracking-tight">{fmtNum(data?.catalog_size ?? 0)}</p>
              <p className="text-[11px] text-[var(--color-fg-4)] mt-2 font-mono">{data?.cached_prices ?? 0} cotizaciones al día</p>
            </div>

            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">
                <span>WhatsApp Bot</span>
                <span className="text-[var(--color-accent)] font-bold font-mono">Callmebot</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[var(--color-fg-1)] tracking-tight">{data?.whatsapp_active ?? 0}</p>
              <p className="text-[11px] text-[var(--color-fg-4)] mt-2 font-mono">Último: {timeAgo(data?.last_digest)}</p>
            </div>
          </div>

          {/* Chart Row: AUM Time Series + Donut Auth */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* AUM Chart */}
            <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Evolución Global del AUM</h2>
                  <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Volumen total de activos gestionados a lo largo del tiempo</p>
                </div>

                <div className="flex items-center gap-1 bg-[var(--color-ink-2)] p-1 rounded-xl border border-[var(--color-ink-3)]">
                  {[
                    { days: 7, label: "7D" },
                    { days: 30, label: "30D" },
                    { days: 90, label: "90D" },
                    { days: 365, label: "1A" },
                  ].map(t => (
                    <button
                      key={t.days}
                      onClick={() => setAumTimeframe(t.days)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                        aumTimeframe === t.days ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-bold" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={buildRealAumHistory(data, aumTimeframe)}>
                    <defs>
                      <linearGradient id="colorAumAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} tickFormatter={(v) => `€${v/1000}k`} dx={-8} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAumAdmin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart: Auth Methods */}
            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Métodos de Acceso</h2>
                <p className="text-xs text-[var(--color-fg-4)] mb-2">Distribución de usuarios por autenticación</p>
              </div>
              
              <div className="h-[140px] relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <p className="text-xl font-bold font-mono text-[var(--color-fg-1)]">{data?.active_users ?? 0}</p>
                  <p className="text-[9px] text-[var(--color-fg-5)] uppercase tracking-widest">Usuarios</p>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  {authDist.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={authDist}
                        innerRadius={48}
                        outerRadius={65}
                        paddingAngle={authDist.length > 1 ? 4 : 0}
                        dataKey="value"
                        stroke="none"
                      >
                        {authDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  ) : (
                    <div className="text-xs text-[var(--color-fg-5)]">Sin datos</div>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {authDist.map(d => (
                  <div key={d.name} className="flex flex-col items-center bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] p-2 rounded-xl text-center">
                    <span className="text-[10px] text-[var(--color-fg-4)]">{d.name}</span>
                    <span className="text-xs text-[var(--color-fg-1)] font-mono font-bold mt-0.5">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Third Row: Bank Distribution Breakdown & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Top Banks */}
            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)] mb-1 flex items-center gap-2">
                <Building2 size={16} className="text-[var(--color-accent)]" /> Distribución por Bancos y Gestoras
              </h3>
              <p className="text-xs text-[var(--color-fg-4)] mb-4">Entidades con mayor volumen nominal en FondTracker</p>

              <div className="space-y-2.5">
                {(data?.top_banks || []).map((b: any, idx: number) => {
                  const maxAum = data.top_banks[0]?.aum || 1;
                  const pct = Math.round((b.aum / maxAum) * 100);
                  return (
                    <div key={b.name || idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-fg-1)] font-medium">{b.name || 'Sin entidad'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[var(--color-fg-4)]">{b.count} pos.</span>
                          <span className="font-mono font-bold text-[var(--color-fg-1)]">{fmtEur(b.aum)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-ink-2)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--color-accent)] to-emerald-400 rounded-full" 
                          style={{ width: `${Math.max(pct, 5)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
                {(!data?.top_banks || data.top_banks.length === 0) && (
                  <div className="text-xs text-[var(--color-fg-5)] text-center py-6">Sin inversiones registradas en bancos.</div>
                )}
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--color-fg-1)] mb-1 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" /> Distribución por Tipología de Activo
              </h3>
              <p className="text-xs text-[var(--color-fg-4)] mb-4">Clases de activos favoritas en las carteras de usuarios</p>

              <div className="space-y-2.5">
                {(data?.top_categories || []).map((c: any, idx: number) => {
                  const maxAum = data.top_categories[0]?.aum || 1;
                  const pct = Math.round((c.aum / maxAum) * 100);
                  return (
                    <div key={c.name || idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-fg-1)] font-medium">{c.name || 'Otros'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[var(--color-fg-4)]">{c.count} pos.</span>
                          <span className="font-mono font-bold text-[var(--color-fg-1)]">{fmtEur(c.aum)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-ink-2)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full" 
                          style={{ width: `${Math.max(pct, 5)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
                {(!data?.top_categories || data.top_categories.length === 0) && (
                  <div className="text-xs text-[var(--color-fg-5)] text-center py-6">Sin categorías registradas.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : subSection === "users" ? (
        <UsersTab onToast={showToast} />
      ) : subSection === "catalog" ? (
        <CatalogTab onToast={showToast} />
      ) : subSection === "notifications" ? (
        <NotificationsTab onToast={showToast} />
      ) : subSection === "system" ? (
        <SystemTab data={data} onToast={showToast} />
      ) : null}

      {/* Hidden PDF Template for Export */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none", zIndex: -9999, width: "794px", height: "1123px", overflow: "hidden" }} aria-hidden="true">
        <AdminReportTemplate ref={reportRef} data={data} />
      </div>
    </div>
  );
}

// ─── Main Standalone AdminPanel ───────────────────────────────────────────────
export function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div className="flex h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--color-ink-1)] backdrop-blur-md border-r border-[var(--color-ink-3)] flex flex-col relative z-20">
        <div className="h-16 flex items-center px-5 border-b border-[var(--color-ink-3)]">
          <a href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20 shadow-[0_0_12px_rgba(57,255,136,0.15)]">
              <Activity size={17} className="text-[var(--color-accent)]" />
            </div>
            <span className="font-bold text-[var(--color-fg-1)] text-base tracking-wide">Fond<span className="text-[var(--color-accent)]">Tracker</span></span>
          </a>
        </div>

        <div className="p-4 border-b border-[var(--color-ink-3)]">
          <a 
            href="/dashboard"
            className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-2)] text-[var(--color-fg-1)] rounded-xl text-xs font-semibold transition-colors"
          >
            <span>← Volver al Dashboard</span>
          </a>
        </div>

        {/* Admin Badges */}
        <div className="p-4 space-y-2">
          <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider block font-mono">Modo de Operación</span>
            <span className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1.5 mt-1">
              <Shield size={13}/> Super Administrador
            </span>
          </div>
        </div>

        {/* User Account Footer */}
        <div className="p-3.5 border-t border-[var(--color-ink-3)] mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-[var(--color-fg-1)] truncate">{user.username}</p>
              <p className="text-[9px] text-[var(--color-fg-4)] truncate">Super Admin</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-1 text-[var(--color-fg-4)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <Power size={14} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 sm:px-8 border-b border-[var(--color-ink-3)] bg-[var(--color-ink-0)]/80 backdrop-blur-xl relative z-10 shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[var(--color-fg-1)] tracking-tight flex items-center gap-2">
              <Shield size={18} className="text-[var(--color-accent)]" /> Panel de Administración Global
            </h1>
            <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Control integral de usuarios, catálogo CNMV, sincronizador y servidor</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-3)] border border-[var(--color-ink-3)] rounded-xl transition-all"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 scrollbar-thin">
          <div className="max-w-[1360px] mx-auto">
            <AdminSectionContent user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}
