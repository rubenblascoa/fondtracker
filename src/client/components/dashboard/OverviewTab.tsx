import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Download, FileText, MessageCircle, PlusCircle, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { api, type Investment, type PortfolioHistoryPoint, type PortfolioHistoryRange, type Status } from "../../api";
import { allocationBy, performers } from "../../allocation";
import { fundView } from "../../fundView";
import { formatCompactEur, formatEur, formatPct, maskPhone } from "../../utils";
import { Button, Card, EmptyState, Label, Stat, Tag } from "../ui";
import type { DashboardSection } from "./DashboardNav";
import { AllocationDonut } from "./AllocationDonut";

const RANGES: { label: string; value: PortfolioHistoryRange }[] = [
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1A", value: "1y" },
  { label: "Máx", value: "max" },
];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${String(y).slice(2)}`;
};

type Props = {
  funds: Investment[];
  status: Status | null;
  phone?: string | null;
  onNavigate: (section: DashboardSection) => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
};

function HistoryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as PortfolioHistoryPoint;
  return (
    <div className="ft-card px-3 py-2 text-xs shadow-xl" style={{ background: "var(--color-ink-1)" }}>
      <p className="mb-1 font-mono text-[var(--color-fg-4)]">{dayLabel(p.date)}</p>
      <p className="text-[var(--color-fg-1)]">Valor <b className="font-heading">{formatEur(p.value)}</b></p>
      <p className="text-[var(--color-fg-3)]">Invertido {formatEur(p.invested)}</p>
    </div>
  );
}

export function OverviewTab({ funds, status, phone, onNavigate, onExportPdf, isExportingPdf }: Props) {
  const [range, setRange] = useState<PortfolioHistoryRange>("1y");
  const [history, setHistory] = useState<{ points: PortfolioHistoryPoint[]; source: string } | null>(null);
  const [historyError, setHistoryError] = useState(false);

  const fundsKey = funds.map((f) => `${f.id}:${f.shares}`).join("|");
  useEffect(() => {
    if (funds.length === 0) return;
    let cancelled = false;
    setHistoryError(false);
    api
      .portfolioHistory(range)
      .then((h) => !cancelled && setHistory(h))
      .catch(() => !cancelled && setHistoryError(true));
    return () => {
      cancelled = true;
    };
  }, [range, fundsKey]);

  const views = useMemo(() => funds.map((f) => ({ fund: f, view: fundView(f) })), [funds]);
  const byBank = useMemo(() => allocationBy(funds, "bank"), [funds]);
  const { best, worst } = useMemo(() => performers(funds), [funds]);
  const top = useMemo(() => [...views].sort((a, b) => b.view.value - a.view.value).slice(0, 5), [views]);

  if (funds.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Tu cartera está vacía"
        text="Añade tu primer fondo con las participaciones y el importe que te indica tu banco, y aquí verás cuánto vale hoy."
        action={
          <Button onClick={() => onNavigate("add")}>
            <PlusCircle size={16} /> Añadir fondo
          </Button>
        }
      />
    );
  }

  const invested = status?.total_initial ?? 0;
  const current = status?.total_current ?? 0;
  const pl = status?.total_profit_loss ?? 0;
  const plPct = status?.total_profit_loss_pct ?? 0;
  const pending = views.filter((v) => !v.view.hasPrice).length;
  const points = history?.points ?? [];

  return (
    <div className="space-y-5 fade-in">
      {/* Cifras principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Patrimonio" value={formatEur(current)} hint={<span>{funds.length} {funds.length === 1 ? "fondo" : "fondos"}</span>} />
        <Stat
          label="Ganancia"
          value={`${pl > 0 ? "+" : ""}${formatEur(pl)}`}
          delta={{ value: formatPct(plPct), positive: pl >= 0 }}
          hint={pending > 0 ? <span>{pending} sin precio</span> : undefined}
        />
        <Stat label="Invertido" value={formatEur(invested)} hint={<span>Lo que has puesto de tu bolsillo</span>} />
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Label>WhatsApp</Label>
            <Tag tone={status?.whatsapp?.configured ? "profit" : "neutral"}>{status?.whatsapp?.configured ? "Activo" : "Inactivo"}</Tag>
          </div>
          <p className="mt-2 font-heading text-lg font-semibold text-[var(--color-fg-1)]">
            {status?.whatsapp?.configured ? maskPhone(phone) || "Configurado" : "Sin configurar"}
          </p>
          <button onClick={() => onNavigate("notifications")} className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline">
            <MessageCircle size={13} /> {status?.whatsapp?.configured ? "Gestionar avisos" : "Activar resumen diario"}
          </button>
        </Card>
      </div>

      {/* Evolución + reparto */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Evolución</h2>
              <p className="text-xs text-[var(--color-fg-4)]">
                {history?.source === "snapshots"
                  ? "Valor guardado cada día"
                  : "Calculado con los precios históricos de tus fondos" + (history?.source === "mixed" ? " y el valor guardado cada día" : "")}
              </p>
            </div>
            <div className="flex rounded-full border border-[var(--color-border)] p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-colors ${
                    range === r.value ? "bg-[var(--color-tag-bg)] text-[var(--color-fg-1)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-[260px]">
            {historyError ? (
              <p className="grid h-full place-items-center text-sm text-[var(--color-fg-4)]">No se pudo cargar la evolución. Prueba a actualizar.</p>
            ) : !history ? (
              <div className="shimmer h-full rounded-2xl" />
            ) : points.length < 2 ? (
              <p className="grid h-full place-items-center text-center text-sm text-[var(--color-fg-4)]">
                Aún no hay suficiente historial en este periodo.
                <br />
                Prueba con un rango más largo.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ftLine" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0" stopColor="#e3b25b" />
                      <stop offset="1" stopColor="#c084fc" />
                    </linearGradient>
                    <linearGradient id="ftArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#c084fc" stopOpacity={0.22} />
                      <stop offset="1" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 10, fill: "var(--color-fg-4)" }} axisLine={false} tickLine={false} minTickGap={40} />
                  <YAxis
                    tickFormatter={formatCompactEur}
                    tick={{ fontSize: 10, fill: "var(--color-fg-4)" }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    domain={["auto", "auto"]}
                    tickCount={5}
                    allowDecimals={false}
                  />
                  <Tooltip content={<HistoryTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="url(#ftLine)" strokeWidth={2.2} fill="url(#ftArea)" />
                  <Line type="stepAfter" dataKey="invested" stroke="var(--color-fg-4)" strokeDasharray="4 4" strokeWidth={1.2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 flex gap-4 text-[11px] text-[var(--color-fg-4)]">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ background: "var(--gradient-accent)" }} /> Valor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t border-dashed border-[var(--color-fg-4)]" /> Invertido
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Por entidad</h2>
            <button onClick={() => onNavigate("analytics")} className="text-xs font-medium text-[var(--color-accent)] hover:underline">
              Ver análisis
            </button>
          </div>
          <AllocationDonut items={byBank} total={current} />
        </Card>
      </div>

      {/* Mejor / peor / informe */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: "Mejor fondo", p: best, icon: TrendingUp },
          { title: "Peor fondo", p: worst, icon: TrendingDown },
        ].map(({ title, p, icon: Icon }) => (
          <Card key={title}>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Icon size={12} /> {title}
              </Label>
              {p && <Tag tone={p.pl >= 0 ? "profit" : "loss"}>{formatPct(p.pct)}</Tag>}
            </div>
            {p ? (
              <>
                <p className="mt-3 truncate font-semibold text-[var(--color-fg-1)]" title={p.fund.name}>
                  {p.fund.name}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-[var(--color-fg-4)]">
                  {p.fund.isin} · {p.fund.bank}
                </p>
                <p className={`mt-3 font-heading text-xl font-semibold ${p.pl >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                  {p.pl > 0 ? "+" : ""}
                  {formatEur(p.pl)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--color-fg-4)]">Con un solo fondo no hay comparación.</p>
            )}
          </Card>
        ))}
        <Card className="flex flex-col justify-between" padded>
          <div>
            <Label className="flex items-center gap-1.5">
              <FileText size={12} /> Informe PDF
            </Label>
            <p className="mt-3 text-sm text-[var(--color-fg-3)]">Tu cartera en un documento: posiciones, reparto y evolución de cada fondo.</p>
          </div>
          <Button className="mt-4 w-full" onClick={onExportPdf} disabled={isExportingPdf}>
            <Download size={15} /> {isExportingPdf ? "Generando…" : "Descargar PDF"}
          </Button>
        </Card>
      </div>

      {/* Posiciones principales */}
      <Card padded={false}>
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Posiciones principales</h2>
          <button onClick={() => onNavigate("portfolio")} className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline">
            Ver cartera <ArrowRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-y border-[var(--color-border)] text-left">
                {["Fondo", "Invertido", "Valor", "Ganancia", "Precio"].map((h, i) => (
                  <th key={h} className={`px-5 py-2.5 ${i > 0 ? "text-right" : ""}`}>
                    <Label>{h}</Label>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top.map(({ fund, view }) => (
                <tr key={fund.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-3">
                    <p className="max-w-[280px] truncate font-medium text-[var(--color-fg-1)]" title={fund.name}>
                      {fund.name}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--color-fg-4)]">
                      {fund.isin} · {fund.bank}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-3)]">{formatEur(view.invested)}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-1)]">{formatEur(view.value)}</td>
                  <td className="px-5 py-3 text-right">
                    {view.plLabel ? (
                      <Tag tone={view.plPositive ? "profit" : "loss"}>
                        {view.plLabel} · {view.plPctLabel}
                      </Tag>
                    ) : (
                      <span className="text-xs text-[var(--color-fg-4)]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <p className="font-mono text-xs text-[var(--color-fg-2)]">{view.priceLabel}</p>
                    {view.navDateLabel && (
                      <p className={`font-mono text-[10px] ${view.stale ? "text-[var(--color-warn)]" : "text-[var(--color-fg-4)]"}`} title={view.stale ? "Precio antiguo" : undefined}>
                        {view.stale ? "⚠ " : ""}
                        {view.navDateLabel}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
