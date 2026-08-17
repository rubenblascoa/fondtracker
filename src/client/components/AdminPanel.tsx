import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { api, type User } from "../api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  LayoutDashboard, Users, Database, Bell, Settings, LogOut, Search,
  ChevronDown, ArrowUpRight, ArrowDownRight, CreditCard, Activity,
  Smartphone, Server, Shield, Edit2, Trash2, CheckCircle2, XCircle,
  RefreshCw, Power, Eye, EyeOff, Download, Sparkles
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
  return `€${n.toFixed(0)}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`;
  return `hace ${Math.floor(mins / 1440)}d`;
}

// ─── Dynamic AUM History ───────────────────────────────────────────────────────
function buildRealAumHistory(data: any) {
  if (!data || !data.aum_history_raw) return [];
  const raw = data.aum_history_raw as { date: string | Date, amount: number }[];
  raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const days = 30;
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

// ─── Custom Tooltip for Recharts ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullDate = payload[0].payload.fullDate || label;
    return (
      <div className="bg-[var(--color-ink-2)]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <p className="text-white text-xs font-medium mb-1.5">{fullDate}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || 'var(--color-accent)' }} />
            <span className="text-gray-400">{p.name === 'value' ? 'AUM' : p.name}:</span>
            <span className="text-white font-mono font-bold">{fmtEur(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Tab Components ────────────────────────────────────────────────────────────

export function UsersTab() {
  const [data, setData] = useState<{users: any[], total: number}>({ users: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.admin.users(search)); } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-4 sm:p-5 gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Gestión de Usuarios</h2>
          <p className="text-xs text-[var(--color-fg-4)] mt-0.5">{data.total} usuarios registrados en la plataforma</p>
        </div>
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
          <input 
            type="text" placeholder="Buscar por email o usuario..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]/50 w-full transition-all" />
        </div>
      </div>

      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[var(--color-ink-2)]/30 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                <th className="py-3 px-5 font-medium">Usuario</th>
                <th className="py-3 px-5 font-medium">Métodos Auth</th>
                <th className="py-3 px-5 font-medium">Inversiones</th>
                <th className="py-3 px-5 font-medium">Estado</th>
                <th className="py-3 px-5 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : data.users.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No se encontraron usuarios.</td></tr>
              ) : data.users.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center font-bold text-xs text-[var(--color-accent)]">
                        {u.username.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{u.username}</p>
                        <p className="text-[10px] text-[var(--color-fg-4)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex gap-1 text-[10px]">
                      {u.has_google ? <span className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono">Google</span> : null}
                      {u.has_github ? <span className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono">GitHub</span> : null}
                      {u.has_password ? <span className="bg-white/10 text-white px-1.5 py-0.5 rounded font-mono">Email</span> : null}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-gray-300">{u.investment_count}</td>
                  <td className="py-3.5 px-5">
                    {u.deleted_at ? (
                      <span className="px-2 py-0.5 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded text-[10px] font-bold uppercase">Baneado</span>
                    ) : u.is_admin ? (
                      <span className="px-2 py-0.5 bg-[var(--color-warn)]/10 text-[var(--color-warn)] rounded text-[10px] font-bold uppercase">Admin</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-bold uppercase">Activo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-1.5">
                    <button 
                      onClick={async () => { await api.admin.promoteUser(u.id, !u.is_admin); load(); }} 
                      title={u.is_admin ? "Quitar admin" : "Hacer admin"}
                      className="p-1.5 text-gray-400 hover:text-[var(--color-warn)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                    >
                      <Shield size={14}/>
                    </button>
                    {u.deleted_at ? (
                      <button 
                        onClick={async () => { await api.admin.restoreUser(u.id); load(); }} 
                        title="Restaurar usuario"
                        className="p-1.5 text-gray-400 hover:text-[var(--color-accent)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                      >
                        <CheckCircle2 size={14}/>
                      </button>
                    ) : (
                      <button 
                        onClick={async () => { await api.admin.deleteUser(u.id); load(); }} 
                        title="Suspender usuario"
                        className="p-1.5 text-gray-400 hover:text-[var(--color-danger)] bg-[var(--color-ink-2)] rounded-lg transition-colors"
                      >
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CatalogTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.admin.catalog(search)); } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const results = search ? data?.results ?? [] : data?.top_funds ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-4">
          <p className="text-[11px] text-[var(--color-fg-4)] uppercase tracking-wider mb-1">Total Fondos</p>
          <p className="text-2xl font-bold font-mono text-white">{fmtNum(data?.total ?? 0)}</p>
        </div>
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-4">
          <p className="text-[11px] text-[var(--color-fg-4)] uppercase tracking-wider mb-1">Sin Yahoo Ticker</p>
          <p className="text-2xl font-bold font-mono text-[var(--color-warn)]">{fmtNum(data?.missing_ticker ?? 0)}</p>
        </div>
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-4">
          <p className="text-[11px] text-[var(--color-fg-4)] uppercase tracking-wider mb-1">Sin Cotización</p>
          <p className="text-2xl font-bold font-mono text-[var(--color-danger)]">{fmtNum(data?.missing_price ?? 0)}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-4 sm:p-5 gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Directorio de Fondos</h2>
          <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Asignación de tickers Yahoo Finance e invalidación de caché</p>
        </div>
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]" />
          <input 
            type="text" placeholder="ISIN o nombre del fondo..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]/50 w-full transition-all" />
        </div>
      </div>

      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[var(--color-ink-2)]/30 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                <th className="py-3 px-5 font-medium">Fondo (ISIN)</th>
                <th className="py-3 px-5 font-medium">Banco</th>
                <th className="py-3 px-5 font-medium">Yahoo Ticker</th>
                <th className="py-3 px-5 font-medium">Último Precio</th>
                <th className="py-3 px-5 font-medium text-right">Inversores</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center"><div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No se encontraron fondos.</td></tr>
              ) : results.map((f: any) => (
                <tr key={f.isin} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-5">
                    <p className="text-xs font-semibold text-white truncate max-w-[220px]" title={sanitizeFundName(f.name)}>{sanitizeFundName(f.name)}</p>
                    <p className="text-[10px] font-mono text-[var(--color-accent)]">{f.isin}</p>
                  </td>
                  <td className="py-3.5 px-5 text-gray-300">{f.bank || '—'}</td>
                  <td className="py-3.5 px-5">
                    <input 
                      defaultValue={f.yahoo_ticker ?? ""}
                      placeholder="Ninguno"
                      onBlur={async (e) => {
                        if(e.target.value !== f.yahoo_ticker) {
                           await api.admin.updateTicker(f.isin, e.target.value);
                           load();
                        }
                      }}
                      className="bg-[var(--color-ink-2)] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-accent)]/50 w-28 font-mono" />
                  </td>
                  <td className="py-3.5 px-5">
                    {f.price ? (
                      <div className="flex items-center gap-2.5">
                        <div>
                          <p className="text-xs text-white font-mono font-bold">€{Number(f.price).toFixed(2)}</p>
                          <p className="text-[9px] text-[var(--color-fg-4)]">{new Date(f.updated_at).toLocaleDateString()}</p>
                        </div>
                        <button onClick={async () => { await api.admin.invalidatePrice(f.isin); load(); }} title="Invalidar caché de precio" className="p-1 bg-[var(--color-ink-2)] text-[var(--color-fg-4)] hover:text-[var(--color-accent)] rounded-md transition-colors"><RefreshCw size={12}/></button>
                      </div>
                    ) : <span className="text-[10px] text-[var(--color-danger)] uppercase font-mono">Sin Precio</span>}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-xs text-gray-300">{f.usage_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function NotificationsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await api.admin.notifications()); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const [isTriggering, setIsTriggering] = useState(false);

  const triggerDigest = async () => {
    setIsTriggering(true);
    try {
      await api.admin.triggerDigest();
      load();
      let count = 0;
      const interval = setInterval(() => {
        load();
        count++;
        if (count >= 5) {
          clearInterval(interval);
          setIsTriggering(false);
        }
      }, 3000);
    } catch {
      setIsTriggering(false);
    }
  };

  const totalPages = Math.ceil((data?.user_statuses?.length || 0) / limit) || 1;
  const paginatedData = data?.user_statuses?.slice((page - 1) * limit, page * limit) || [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[var(--color-accent)]/10 blur-2xl rounded-full" />
          <p className="text-[11px] text-[var(--color-fg-4)] uppercase tracking-wider mb-2">WhatsApp Activos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold font-mono text-white">{data?.enabled ?? 0}</p>
            <p className="text-xs text-[var(--color-fg-4)] font-mono">/ {data?.total_users ?? 0} usuarios</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">Usuarios con teléfono y horario configurados para reportes diarios.</p>
        </div>

        <div className="bg-gradient-to-br from-[var(--color-accent)]/15 to-[var(--color-ink-1)] border border-[var(--color-accent)]/20 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone size={16} className="text-[var(--color-accent)]" /> Forzar Envío WhatsApp Global
            </h2>
            <p className="text-xs text-gray-400 mt-1">Dispara el envío de resúmenes diarios de WhatsApp para todos los usuarios programados.</p>
          </div>
          <button 
            onClick={triggerDigest} 
            disabled={isTriggering}
            className="w-full py-2 mt-3 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(57,255,136,0.2)] transition-all flex items-center justify-center gap-2"
          >
            {isTriggering ? (
              <><div className="w-3.5 h-3.5 border-2 border-[#0a0a0c] border-t-transparent rounded-full animate-spin" /> Enviando...</>
            ) : (
              <><Power size={14} /> Disparar Envío Global</>
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Historial de Envíos WhatsApp</h2>
          <span className="text-xs font-mono text-[var(--color-fg-4)]">{data?.user_statuses?.length || 0} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[var(--color-ink-2)]/30 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                <th className="py-3 px-5 font-medium">Usuario</th>
                <th className="py-3 px-5 font-medium">Último Envío</th>
                <th className="py-3 px-5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td colSpan={3} className="p-8 text-center"><div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">Sin envíos registrados.</td></tr>
              ) : paginatedData.map((u: any) => (
                <tr key={u.userId} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 text-white font-medium">{u.name} <span className="text-[10px] text-[var(--color-fg-4)] font-mono ml-1.5">(ID: {u.userId})</span></td>
                  <td className="py-3 px-5 text-gray-400 font-mono text-xs">{u.lastSent ? new Date(u.lastSent).toLocaleString('es-ES') : 'Nunca'}</td>
                  <td className="py-3 px-5">
                    {!u.lastStatus ? (
                      <span className="px-2 py-0.5 bg-[var(--color-fg-4)]/10 text-[var(--color-fg-4)] rounded text-[10px] font-bold uppercase">Pendiente</span>
                    ) : u.lastStatus === 'ok' ? (
                      <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-bold uppercase">OK</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded text-[10px] font-bold uppercase max-w-[200px] truncate inline-block" title={u.lastStatus}>Error: {u.lastStatus}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-white/5 flex items-center justify-between text-xs">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 text-xs font-medium text-[var(--color-fg-4)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-6 h-6 rounded-md text-xs font-medium transition-colors ${page === i + 1 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold' : 'text-[var(--color-fg-4)] hover:bg-white/5 hover:text-white'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 text-xs font-medium text-[var(--color-fg-4)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SystemTab({ data }: { data: any }) {
  const [visibleEnv, setVisibleEnv] = useState<Record<string, boolean>>({});

  if(!data) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" /></div>;

  const toggleEnv = (key: string) => {
    setVisibleEnv(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-2xl rounded-full" />
        <h2 className="text-base font-bold text-white mb-4">Estado del Servidor</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Uptime</span>
            <span className="text-sm text-white font-mono font-bold mt-1">{Math.floor(data.uptime / 3600)}h {Math.floor((data.uptime % 3600) / 60)}m</span>
          </div>
          <div className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Entorno</span>
            <span className="text-sm text-[var(--color-warn)] font-mono uppercase font-bold mt-1">{data.node_env}</span>
          </div>
          <div className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Bun Version</span>
            <span className="text-sm text-[var(--color-accent)] font-mono font-bold mt-1">{data.bun_version}</span>
          </div>
          <div className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-[var(--color-fg-4)] uppercase tracking-wider">Caché Precios</span>
            <span className="text-sm text-white font-mono font-bold mt-1">{data.price_cache_size} items</span>
          </div>
        </div>

        <h2 className="text-sm font-bold text-white mt-6 mb-3">Variables de Entorno</h2>
        <div className="space-y-2">
          {data.env && Object.keys(data.env).map(key => (
            <div key={key} className="bg-[var(--color-ink-2)] border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-[var(--color-fg-4)] font-bold font-mono">{key}</span>
              <div className="flex items-center gap-2.5 justify-end">
                <span className="text-xs text-white font-mono break-all text-right">
                  {visibleEnv[key] ? data.env[key] : "••••••••••••••••"}
                </span>
                <button onClick={() => toggleEnv(key)} className="text-[var(--color-fg-4)] hover:text-white transition-colors p-1">
                  {visibleEnv[key] ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          ))}
          {(!data.env || Object.keys(data.env).length === 0) && (
            <div className="text-xs text-[var(--color-fg-4)]">No se pudieron cargar las variables de entorno.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Exported Admin Section Content (Seamlessly embedded in Dashboard) ────────
export function AdminSectionContent({ user, initialSubSection }: { user: User; initialSubSection?: AdminSubSection }) {
  const [subSection, setSubSection] = useState<AdminSubSection>(initialSubSection || "overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialSubSection) {
      setSubSection(initialSubSection);
    }
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
      await new Promise(r => setTimeout(r, 500));
      const { toJpeg } = await import('html-to-image');
      const imgData = await toJpeg(reportRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: '#0a0a0c' });
      
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const img = new Image();
      img.src = imgData;
      await new Promise(resolve => { img.onload = resolve; });
      
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FondTracker_Admin_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setIsExporting(false);
    }
  };

  const authDist = useMemo(() => {
    return [
      { name: 'Google', value: data?.auth_google ?? 0, color: '#39ff88' },
      { name: 'GitHub', value: data?.auth_github ?? 0, color: '#ff5a4a' },
      { name: 'Password', value: data?.auth_password ?? 0, color: '#ffb547' }
    ].filter(d => d.value > 0);
  }, [data?.auth_google, data?.auth_github, data?.auth_password]);

  const SUB_NAV: { key: AdminSubSection; label: string; icon: JSX.Element }[] = [
    { key: "overview", label: "Dashboard Admin", icon: <LayoutDashboard size={14} /> },
    { key: "users", label: "Usuarios", icon: <Users size={14} /> },
    { key: "catalog", label: "Catálogo", icon: <Database size={14} /> },
    { key: "notifications", label: "WhatsApp Global", icon: <Smartphone size={14} /> },
    { key: "system", label: "Servidor & Logs", icon: <Server size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* ── Sub Navigation Selector Pills ── */}
      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll">
        {SUB_NAV.map(item => {
          const active = subSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSubSection(item.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active 
                  ? "bg-[var(--color-accent)] text-black shadow-[0_0_10px_rgba(57,255,136,0.25)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sub-view Render ── */}
      {loading && !data ? (
        <div className="py-16 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subSection === "overview" ? (
        <div className="space-y-4 animate-fade-in">
          
          {/* Top Row: AUM Chart & Spending/Auth Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* AUM Chart */}
            <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white">Balance Global AUM</h2>
                  <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Total Assets Under Management acumulado en la plataforma</p>
                </div>
              </div>
              
              <div className="flex items-end gap-3 mb-4">
                <p className="text-3xl font-bold font-mono text-white tracking-tight">{fmtEur(data?.aum_total ?? 0)}</p>
                <div className="flex items-center gap-1 text-[var(--color-accent)] text-xs font-medium bg-[var(--color-accent)]/10 px-2 py-0.5 rounded-md mb-1">
                  <ArrowUpRight size={13} /> Nominal
                </div>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={buildRealAumHistory(data)}>
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

            {/* Donut Chart (Auth Methods) */}
            <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-white">Métodos de Acceso</h2>
                <p className="text-xs text-[var(--color-fg-4)] mb-2">Distribución de usuarios por proveedor</p>
              </div>
              
              <div className="h-[140px] relative flex items-center justify-center">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <p className="text-xl font-bold font-mono text-white">{data?.active_users ?? 0}</p>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">Usuarios</p>
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
                    <div className="text-xs text-gray-500">Sin usuarios</div>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {authDist.map(d => (
                  <div key={d.name} className="flex flex-col items-center bg-[var(--color-ink-2)] border border-white/5 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400">{d.name}</span>
                    <span className="text-xs text-white font-mono font-bold mt-0.5">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Table: Metrics */}
            <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm sm:text-base font-semibold text-white">Métricas de Plataforma</h2>
                <button onClick={() => setSubSection("users")} className="text-xs text-[var(--color-accent)] hover:text-white font-medium bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-lg transition-colors">
                  Ver usuarios
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                      <th className="pb-2.5 font-medium">Métrica</th>
                      <th className="pb-2.5 font-medium">Valor</th>
                      <th className="pb-2.5 font-medium">Estado</th>
                      <th className="pb-2.5 font-medium text-right">Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)]"><Users size={13} /></div>
                          <span className="text-xs text-gray-200 font-medium">Usuarios Activos</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-white font-bold">{data?.active_users ?? 0}</td>
                      <td className="py-3"><span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-[10px] font-bold uppercase">Nominal</span></td>
                      <td className="py-3 text-right text-xs text-[var(--color-accent)] font-mono font-bold">+{data?.new_this_week ?? 0} esta sem.</td>
                    </tr>
                    <tr className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400"><Database size={13} /></div>
                          <span className="text-xs text-gray-200 font-medium">Catálogo de Fondos</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-white font-bold">{fmtNum(data?.catalog_size ?? 0)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          data?.funds_missing_ticker > 0 ? 'bg-[var(--color-warn)]/10 text-[var(--color-warn)]' : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                        }`}>
                          {data?.funds_missing_ticker > 0 ? 'Incompleto' : 'Sincronizado'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-[var(--color-fg-4)] font-mono">—</td>
                    </tr>
                    <tr className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--color-warn)]/10 border border-[var(--color-warn)]/20 flex items-center justify-center text-[var(--color-warn)]"><Smartphone size={13} /></div>
                          <span className="text-xs text-gray-200 font-medium">WhatsApp Integrations</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-white font-bold">{data?.whatsapp_active ?? 0}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          (data?.whatsapp_active ?? 0) > 0 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[var(--color-fg-4)]/10 text-[var(--color-fg-4)]'
                        }`}>
                          {(data?.whatsapp_active ?? 0) > 0 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-[var(--color-fg-4)] font-mono">—</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 flex items-center justify-center text-[var(--color-danger)]"><Activity size={13} /></div>
                          <span className="text-xs text-gray-200 font-medium">Caché de Precios</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-white font-bold">{fmtNum(data?.cached_prices ?? 0)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          (data?.cached_prices ?? 0) > 0 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                        }`}>
                          {(data?.cached_prices ?? 0) > 0 ? 'Nominal' : 'Vacío'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs text-[var(--color-fg-4)] font-mono">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Goal & Summary */}
            <div className="space-y-4">
              
              {/* Goal Widget */}
              <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-semibold text-white">Objetivo Anual AUM</h2>
                  <span className="text-[10px] font-mono text-[var(--color-accent)] font-bold">1.5M Goal</span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total acumulado</p>
                <p className="text-2xl font-bold font-mono text-white tracking-tight mb-3">€{fmtNum(data?.aum_total ?? 0)} <span className="text-xs text-gray-500 font-normal">/ 1.5M</span></p>
                
                <div className="w-full h-2 bg-[var(--color-ink-3)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-warn)] rounded-full shadow-[0_0_10px_var(--color-accent)]" style={{ width: '45%' }} />
                </div>
                <p className="text-xs text-[var(--color-accent)] mt-1.5 text-right font-mono">45% completado</p>
              </div>

              {/* Highlights & Report Widget */}
              <div className="bg-gradient-to-br from-[var(--color-accent)]/15 to-[var(--color-ink-1)] border border-[var(--color-accent)]/20 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-[var(--color-accent)]/20 blur-2xl rounded-full pointer-events-none group-hover:bg-[var(--color-accent)]/30 transition-all" />
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[var(--color-accent)]" /> Informe Auditoría Admin
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3.5">
                  Descarga un reporte ejecutivo completo del sistema con métricas y usuarios.
                </p>
                <button 
                  disabled={isExporting} 
                  onClick={exportPdf} 
                  className="w-full py-2 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(57,255,136,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  {isExporting ? 'Generando PDF...' : 'Exportar PDF Admin'}
                </button>
              </div>

            </div>

          </div>

        </div>
      ) : subSection === "users" ? (
        <UsersTab />
      ) : subSection === "catalog" ? (
        <CatalogTab />
      ) : subSection === "notifications" ? (
        <NotificationsTab />
      ) : subSection === "system" ? (
        <SystemTab data={data} />
      ) : null}

      {/* Hidden PDF Template for Export */}
      <AdminReportTemplate ref={reportRef} data={data} />
    </div>
  );
}

// ─── Main Standalone AdminPanel (Kept for routing) ─────────────────────────────
export function AdminPanel({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="flex h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans overflow-hidden">
      
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-black/40 backdrop-blur-md border-r border-white/5 flex flex-col relative z-20">
        
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <a href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20 shadow-[0_0_12px_rgba(57,255,136,0.15)]">
              <Activity size={17} className="text-[var(--color-accent)]" />
            </div>
            <span className="font-bold text-white text-base tracking-wide">Fond<span className="text-[var(--color-accent)]">Tracker</span></span>
          </a>
        </div>

        {/* Back to User Dashboard */}
        <div className="p-4 border-b border-white/5">
          <a 
            href="/dashboard"
            className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <span>← Volver al Dashboard</span>
          </a>
        </div>

        {/* User Account Footer */}
        <div className="p-3.5 border-t border-white/5 mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user.username}</p>
              <p className="text-[9px] text-[var(--color-fg-4)] truncate">Super Admin</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-1 text-[var(--color-fg-4)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[var(--color-ink-0)]/80 backdrop-blur-xl relative z-10 shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Shield size={18} className="text-[var(--color-accent)]" /> Panel de Administración
            </h1>
            <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Control global de usuarios, catálogo, envíos y servidor</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 relative z-10 scrollbar-thin">
          <div className="max-w-[1360px] mx-auto">
            <AdminSectionContent user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}
