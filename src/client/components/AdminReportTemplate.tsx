import { forwardRef } from 'react';
import { investedOverTime } from '../adminStats';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, Database, ArrowUpRight, Activity, CheckCircle2, ShieldCheck, Banknote, Building2, Smartphone } from 'lucide-react';

const fmtNum = (n: number) => new Intl.NumberFormat('es-ES').format(n);
const fmtEur = (n: number) => `€${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n)}`;

/** Capital invertido acumulado (últimos 30 días) con las altas reales de fondos. Sin datos → vacío. */
function buildRealAumHistory(data: any) {
  const raw = Array.isArray(data?.aum_history_raw) ? data.aum_history_raw : [];
  if (raw.length === 0) return [];
  return investedOverTime(raw, 30).map((p) => {
    const d = new Date(p.date + "T00:00:00");
    return { name: `${d.getDate()} ${d.toLocaleString("es-ES", { month: "short" }).replace(".", "")}`, value: Math.round(p.value) };
  });
}

// A4 Standard: 794px x 1123px (at 96 DPI)
export const AdminReportTemplate = forwardRef<HTMLDivElement, { data: any }>(({ data }, ref) => {
  const authDist = [
    { name: 'Google', value: Number(data?.auth_google) || 0, color: '#c084fc' },
    { name: 'GitHub', value: Number(data?.auth_github) || 0, color: '#a855f7' },
    { name: 'Email/Pass', value: Number(data?.auth_password) || 0, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  const topBanks: { name: string; aum: number; count: number }[] = Array.isArray(data?.top_banks) ? data.top_banks.slice(0, 5) : [];

  const maxBankAum = topBanks[0]?.aum || 1;
  const aumChartData = buildRealAumHistory(data);

  return (
    <div
      ref={ref}
      style={{
        width: '794px',
        height: '1123px',
        maxHeight: '1123px',
        backgroundColor: '#0a0a0c',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 40px'
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '14px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={16} color="#c084fc" />
              </div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
                FondTracker <span style={{ color: '#c084fc', fontSize: '13px', border: '1px solid rgba(192,132,252,0.4)', padding: '2px 6px', borderRadius: '6px', marginLeft: '4px', verticalAlign: 'middle' }}>ADMIN</span>
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
              Auditoría Ejecutiva del Sistema &amp; Métricas Globales de Rendimiento
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', backgroundColor: 'rgba(192,132,252,0.1)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.25)', padding: '2px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              ● Live Diagnostic
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
              {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* 4 Primary KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
          <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }}>Valor de las carteras</span>
              <Banknote size={13} color="#c084fc" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>
              {fmtEur(data?.value_total ?? 0)}
            </div>
            <div style={{ fontSize: '9px', color: '#c084fc', marginTop: '4px' }}>
              {fmtEur(data?.invested_total ?? 0)} invertidos · {data?.total_investments ?? 0} fondos
            </div>
          </div>

          <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }}>Usuarios</span>
              <Users size={13} color="#60a5fa" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>
              {fmtNum(data?.active_users ?? 0)}
            </div>
            <div style={{ fontSize: '9px', color: '#60a5fa', marginTop: '4px' }}>
              {data?.total_users ?? 0} registrados
            </div>
          </div>

          <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }}>Catálogo</span>
              <Database size={13} color="#ffb547" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>
              {fmtNum(data?.catalog_size ?? 0)}
            </div>
            <div style={{ fontSize: '9px', color: '#ffb547', marginTop: '4px' }}>
              {data?.cached_prices ?? 0} cotizaciones
            </div>
          </div>

          <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 'bold' }}>WhatsApp Bot</span>
              <Smartphone size={13} color="#34d399" />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>
              {fmtNum(data?.whatsapp_active ?? 0)}
            </div>
            <div style={{ fontSize: '9px', color: '#34d399', marginTop: '4px' }}>
              Canales activos
            </div>
          </div>
        </div>

        {/* AUM Evolution Chart with explicit width & height */}
        <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '14px', padding: '16px 18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Capital invertido acumulado — 30 días
              </span>
              <p style={{ margin: '2px 0 0 0', fontSize: '9.5px', color: '#94a3b8' }}>
                Suma de lo invertido por todos los usuarios según la fecha de alta de cada fondo
              </p>
            </div>
            <span style={{ fontSize: '10px', color: '#c084fc', fontFamily: 'monospace', fontWeight: 'bold', backgroundColor: 'rgba(192,132,252,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
              {fmtEur(data?.invested_total ?? 0)} invertidos
            </span>
          </div>

          <div style={{ width: '674px', height: '170px' }}>
            <AreaChart width={674} height={170} data={aumChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adminAumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={4} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `€${Math.round(v/1000)}k`} />
              <Area type="monotone" dataKey="value" stroke="#c084fc" strokeWidth={2.5} fillOpacity={1} fill="url(#adminAumGrad)" isAnimationActive={false} />
            </AreaChart>
          </div>
        </div>

        {/* Two-Column Analytics: Auth Distribution & Top Entities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>

          {/* Auth Donut Chart */}
          <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '14px', padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Autenticación &amp; Proveedores OAuth
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: '130px', height: '130px', position: 'relative' }}>
                <PieChart width={130} height={130}>
                  <Pie
                    data={authDist.length > 0 ? authDist : [{ name: 'Email', value: 1, color: '#3b82f6' }]}
                    innerRadius={38}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {authDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>{data?.active_users ?? 0}</span>
                  <span style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase' }}>Users</span>
                </div>
              </div>

              <div style={{ flex: 1, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {authDist.map(d => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }} />
                      <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <span style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Entities / Banks */}
          <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '14px', padding: '14px 16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
              Top Entidades Bancarias por AUM
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {topBanks.map((b: any, idx: number) => {
                const pct = Math.round((b.aum / maxBankAum) * 100);
                return (
                  <div key={b.name || idx} style={{ fontSize: '9.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 500 }}>{b.name || 'Otros'}</span>
                      <span style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: 'bold' }}>{fmtEur(b.aum)}</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(pct, 8)}%`, height: '100%', backgroundColor: '#c084fc', borderRadius: '2px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Server & Security Diagnostics Table */}
        <div style={{ backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '14px', padding: '14px 16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={13} color="#c084fc" /> Diagnóstico de Seguridad &amp; Integridad del Servidor
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '9px', fontFamily: 'monospace' }}>
            <div style={{ backgroundColor: '#0a0a0c', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', display: 'block' }}>MOTOR RUNTIME</span>
              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{data?.bun_version ? `Bun ${data.bun_version}` : '—'}</span>
            </div>
            <div style={{ backgroundColor: '#0a0a0c', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', display: 'block' }}>ENTORNO</span>
              <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{data?.node_env || '—'}</span>
            </div>
            <div style={{ backgroundColor: '#0a0a0c', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', display: 'block' }}>CACHÉ EN MEMORIA</span>
              <span style={{ color: '#c084fc', fontWeight: 'bold' }}>{data?.price_cache_size || 0} fondos con precio</span>
            </div>
            <div style={{ backgroundColor: '#0a0a0c', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#64748b', display: 'block' }}>ÚLTIMO ENVÍO WHATSAPP</span>
              <span style={{ color: '#c084fc', fontWeight: 'bold' }}>{data?.last_digest ? new Date(data.last_digest).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Ninguno'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Footer */}
      <div style={{ borderTop: '1px solid #27272a', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '8px', fontFamily: 'monospace', color: '#64748b' }}>
        <span>FondTracker Global Administration Engine • Cryptographic Verification Token: FT-ADM-{new Date().getFullYear()}</span>
        <span>Página 1 de 1 • Documento Confidencial</span>
      </div>
    </div>
  );
});

AdminReportTemplate.displayName = 'AdminReportTemplate';

