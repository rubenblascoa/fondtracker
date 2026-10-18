import { useMemo } from "react";
import { type Investment, type Status, type AssetAllocation } from "../../api";
import { Wallet, TrendingUp, DollarSign, Layers, ArrowUpRight, ArrowDownRight, Sparkles, PieChart as PieIcon, ShieldCheck } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

function fmtEur(n: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

const COLORS = ["#c084fc", "#e3b25b", "#818cf8", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#a19d94"];

type Props = {
  funds: Investment[];
  status: Status | null;
  assetAllocation?: AssetAllocation | null;
  onSelectFund: (fund: Investment) => void;
  onNavigateToPortfolio: () => void;
};

export function OverviewTab({ funds, status, assetAllocation, onSelectFund, onNavigateToPortfolio }: Props) {
  const totalInvested = status?.total_initial ?? funds.reduce((acc, f) => acc + f.total_invested, 0);
  const currentValue = status?.total_current ?? funds.reduce((acc, f) => acc + f.current_value, 0);
  const profitLoss = status?.total_profit_loss ?? (currentValue - totalInvested);
  const profitLossPct = status?.total_profit_loss_pct ?? (totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0);
  const isPositive = profitLoss >= 0;

  // Distribution by Fund
  const fundDistributionData = useMemo(() => {
    if (funds.length === 0 || currentValue <= 0) return [];
    return funds
      .map((f) => ({
        name: f.name,
        value: f.current_value > 0 ? f.current_value : 0,
        isin: f.isin,
        pct: Number(((f.current_value / currentValue) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [funds, currentValue]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl relative overflow-hidden group hover:border-[var(--color-accent)]/40 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-fg-4)] uppercase tracking-wider">Valor Cartera</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-fg-1)] mt-3">
            {fmtEur(currentValue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-xs font-mono font-bold flex items-center ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {fmtPct(profitLossPct)}
            </span>
            <span className="text-[11px] text-[var(--color-fg-4)]">vs invertido</span>
          </div>
        </div>

        <div className="p-5 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl relative overflow-hidden group hover:border-[var(--color-ink-4)] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-fg-4)] uppercase tracking-wider">Capital Invertido</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-fg-1)] mt-3">
            {fmtEur(totalInvested)}
          </p>
          <p className="text-[11px] text-[var(--color-fg-4)] mt-2">
            {funds.length} {funds.length === 1 ? "posición activa" : "posiciones activas"}
          </p>
        </div>

        <div className="p-5 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl relative overflow-hidden group hover:border-[var(--color-ink-4)] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-fg-4)] uppercase tracking-wider">Plusvalía Neta</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              <TrendingUp size={18} />
            </div>
          </div>
          <p className={`text-2xl font-bold font-mono mt-3 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{fmtEur(profitLoss)}
          </p>
          <p className="text-[11px] text-[var(--color-fg-4)] mt-2">
            {isPositive ? "Rendimiento positivo" : "Minusvalía latente"}
          </p>
        </div>

        <div className="p-5 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl relative overflow-hidden group hover:border-[var(--color-ink-4)] transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-fg-4)] uppercase tracking-wider">TER Medio Ponderado</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--color-fg-1)] mt-3">
            {assetAllocation?.weightedTer ? `${assetAllocation.weightedTer.toFixed(2)}%` : "0.20%"}
          </p>
          <p className="text-[11px] text-[var(--color-fg-4)] mt-2">
            Costes totales estimados / año
          </p>
        </div>
      </div>

      {/* Allocation & Top Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Positions list */}
        <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--color-fg-1)]">Posiciones en Cartera</h3>
              <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Distribución y rentabilidad por fondo</p>
            </div>
            <button
              onClick={onNavigateToPortfolio}
              className="text-xs text-[var(--color-accent)] font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas ({funds.length}) →
            </button>
          </div>

          {funds.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--color-fg-4)] border border-dashed border-[var(--color-ink-3)] rounded-2xl p-6">
              Aún no tienes fondos en tu cartera. Pulsa en "Añadir Fondo" para empezar.
            </div>
          ) : (
            <div className="space-y-2.5">
              {funds.slice(0, 5).map((fund) => {
                const isFundPos = fund.profit_loss >= 0;
                return (
                  <div
                    key={fund.id}
                    onClick={() => onSelectFund(fund)}
                    className="p-4 bg-[var(--color-ink-2)]/50 hover:bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] hover:border-[var(--color-accent)]/30 rounded-2xl flex items-center justify-between gap-4 cursor-pointer transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-ink-3)] text-[var(--color-fg-3)]">
                          {fund.isin}
                        </span>
                        {fund.bank && (
                          <span className="text-[11px] text-[var(--color-fg-4)] truncate">{fund.bank}</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[var(--color-fg-1)] mt-1 truncate group-hover:text-[var(--color-accent)] transition-colors">
                        {fund.name}
                      </p>
                      <p className="text-[11px] text-[var(--color-fg-4)] font-mono mt-0.5">
                        {Number(fund.shares).toFixed(4)} part. · PMP: {fmtEur(Number(fund.purchase_price))}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-[var(--color-fg-1)]">
                        {fmtEur(fund.current_value)}
                      </p>
                      <p className={`text-xs font-mono font-semibold flex items-center justify-end gap-0.5 mt-0.5 ${isFundPos ? "text-emerald-400" : "text-red-400"}`}>
                        {isFundPos ? "+" : ""}{fmtPct(fund.profit_loss_pct)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Asset Allocation Chart */}
        <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--color-fg-1)]">Asignación de Activos</h3>
              <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Ponderación por peso en cartera</p>
            </div>
            <PieIcon size={18} className="text-[var(--color-accent)]" />
          </div>

          {fundDistributionData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-fg-4)] py-12">
              Sin datos de distribución
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fundDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {fundDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => fmtEur(Number(val))}
                      contentStyle={{
                        backgroundColor: "var(--color-ink-2)",
                        borderColor: "var(--color-ink-3)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
                {fundDistributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-[70%]">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[var(--color-fg-2)] truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-[var(--color-fg-4)] font-bold">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
