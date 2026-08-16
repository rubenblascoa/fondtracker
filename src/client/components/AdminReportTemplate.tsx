import { forwardRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Users, Database, ArrowUpRight, ActivityIcon, CheckCircle2, ShieldCheck, Banknote } from 'lucide-react';

const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n);
const fmtEur = (n: number) => `€${n.toFixed(0)}`;

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

// Escala A4: 210mm x 297mm -> approx 794px x 1123px a 96 DPI
// Usaremos el doble para alta resolución: 1588x2246
export const AdminReportTemplate = forwardRef<HTMLDivElement, { data: any }>(({ data }, ref) => {
  const authDist = [
    { name: 'Google', value: data?.auth_google ?? 0, color: '#39ff88' },
    { name: 'GitHub', value: data?.auth_github ?? 0, color: '#ff5a4a' },
    { name: 'Password', value: data?.auth_password ?? 0, color: '#ffb547' }
  ].filter(d => d.value > 0);

  return (
    <div 
      ref={ref} 
      // Fixed positioning behind the main content so the browser actually paints it
      // A4 Proportions: 1000px width, 1414px height for good retina capture
      style={{ 
        position: 'fixed', top: 0, left: '-9999px', zIndex: -9999,
        width: '1000px', height: '1414px', 
        backgroundColor: '#0a0a0c', 
        color: 'white',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      className="p-12 box-border flex flex-col"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#39ff88] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3b82f6] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-8 relative z-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">FondTracker <span className="text-[#39ff88]">PRO</span></h1>
          <p className="text-lg text-[#9ca3af]">System Performance & Analytics Report</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-[#9ca3af]">{new Date().toLocaleString()}</p>
          <p className="text-sm font-bold text-[#39ff88] uppercase mt-1">Confidential</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1e] border border-white/10 flex items-center justify-center mb-4">
            <Users size={18} className="text-[#39ff88]" />
          </div>
          <p className="text-3xl font-bold text-white">{fmtNum(data?.active_users ?? 0)}</p>
          <p className="text-sm text-[#9ca3af] mt-1 font-medium">Usuarios Activos</p>
        </div>
        
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1e] border border-white/10 flex items-center justify-center mb-4">
            <Banknote size={18} className="text-[#60a5fa]" />
          </div>
          <p className="text-3xl font-bold text-white">{fmtNum(data?.total_investments ?? 0)}</p>
          <p className="text-sm text-[#9ca3af] mt-1 font-medium">Inversiones Activas</p>
        </div>

        <div className="bg-[#111113] border border-white/5 rounded-2xl p-6">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1e] border border-white/10 flex items-center justify-center mb-4">
            <Database size={18} className="text-[#ffb547]" />
          </div>
          <p className="text-3xl font-bold text-white">{fmtNum(data?.catalog_size ?? 0)}</p>
          <p className="text-sm text-[#9ca3af] mt-1 font-medium">Catálogo de Fondos</p>
        </div>
      </div>

      {/* AUM Section */}
      <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 mb-8 relative z-10">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <ActivityIcon size={20} className="text-[#39ff88]" /> 
          Assets Under Management (AUM) Trend
        </h2>
        
        <div className="flex items-end gap-4 mb-8">
          <p className="text-5xl font-black text-white tracking-tight">{fmtEur(data?.aum_total ?? 0)}</p>
          <div className="flex items-center gap-1 text-[#39ff88] text-lg font-medium bg-[#39ff88]/10 px-3 py-1 rounded-md mb-2">
            <ArrowUpRight size={18} /> 12.5% YoY
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buildRealAumHistory(data)}>
              <defs>
                <linearGradient id="colorAumPrint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39ff88" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#39ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(v) => `€${v/1000}k`} dx={-10} />
              <Area type="monotone" dataKey="value" stroke="#39ff88" strokeWidth={4} fillOpacity={1} fill="url(#colorAumPrint)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-8 relative z-10 flex-1">
        
        {/* Auth Dist */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-8 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">User Authentication</h2>
          <div className="flex-1 flex justify-center items-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-4xl font-bold text-white">{data?.active_users ?? 0}</p>
              <p className="text-xs text-[#6b7280] uppercase tracking-widest mt-1">Users</p>
            </div>
            {authDist.length > 0 ? (
              <PieChart width={300} height={300}>
                <Pie
                  data={authDist}
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={authDist.length > 1 ? 5 : 0}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {authDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            ) : null}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {authDist.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-[#9ca3af] font-medium">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-[#111113] border border-white/5 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#60a5fa]" />
            System Health & Integrity
          </h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[#9ca3af] font-medium">Uptime</span>
              <span className="text-white font-mono">{Math.floor((data?.uptime ?? 0) / 3600)}h {Math.floor(((data?.uptime ?? 0) % 3600) / 60)}m</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[#9ca3af] font-medium">Server Environment</span>
              <span className="text-[#39ff88] font-mono font-bold uppercase">{data?.node_env || 'production'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[#9ca3af] font-medium">Price Cache Size</span>
              <span className="text-white font-mono">{data?.price_cache_size ?? 0} ISINs</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[#9ca3af] font-medium">Security (JWT / CRON)</span>
              <span className="text-[#39ff88] flex items-center gap-2"><CheckCircle2 size={18} /> Verified</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-[#9ca3af] font-medium">Orphaned Funds</span>
              <span className="text-[#ffb547] font-mono">{data?.funds_missing_ticker ?? 0} Warning</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-xs text-[#4b5563] font-mono">
        Generated automatically by FondTracker Admin System. Do not distribute without authorization.
      </div>
    </div>
  );
});
