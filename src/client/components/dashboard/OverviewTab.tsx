import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Clock, Download, MessageCircle, PlusCircle, Wallet } from "lucide-react";
import { api, type Investment, type PortfolioHistoryPoint, type PortfolioHistoryRange, type Status, type TransactionType } from "../../api";
import { allocationBy } from "../../allocation";
import { fundView } from "../../fundView";
import { lastChange, monthlyResults, recentMovements, type Movement } from "../../overview";
import { formatCompactEur, formatEur, formatPct, maskPhone } from "../../utils";
import { Button, Card, EmptyState, Label, Tag } from "../ui";
import type { DashboardSection } from "./DashboardNav";

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
const shortDay = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const dayMonth = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};
const signed = (n: number) => `${n > 0 ? "+" : ""}${formatEur(n)}`;
const TX_LABEL: Record<TransactionType, string> = {
  BUY: "Compra",
  SELL: "Venta",
  TRANSFER_IN: "Traspaso entrada",
  TRANSFER_OUT: "Traspaso salida",
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

function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload as { month: string; result: number };
  const [y, mo] = m.month.split("-").map(Number);
  return (
    <div className="ft-card px-3 py-2 text-xs shadow-xl" style={{ background: "var(--color-ink-1)" }}>
      <p className="mb-1 font-mono text-[var(--color-fg-4)]">{MONTHS[mo - 1]} {y}</p>
      <p className={m.result >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}>{signed(m.result)}</p>
    </div>
  );
}

/** Tarjeta pequeña del bento: etiqueta arriba, cifra y una línea de contexto. */
function Tile({ label, icon, children, foot }: { label: string; icon?: React.ReactNode; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="truncate">{label}</Label>
        {icon && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-fg-3)]">{icon}</span>}
      </div>
      <div className="min-w-0">{children}</div>
      {foot && <div className="text-[11px] text-[var(--color-fg-4)]">{foot}</div>}
    </Card>
  );
}

export function OverviewTab({ funds, status, phone, onNavigate, onExportPdf, isExportingPdf }: Props) {
  const [range, setRange] = useState<PortfolioHistoryRange>("1y");
  const [history, setHistory] = useState<{ points: PortfolioHistoryPoint[]; source: string } | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [yearPoints, setYearPoints] = useState<PortfolioHistoryPoint[] | null>(null);
  const [movements, setMovements] = useState<Movement[] | null>(null);

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

  // Último año aparte (resultado por mes y último cambio), sea cual sea el rango del gráfico
  useEffect(() => {
    if (funds.length === 0) return;
    let cancelled = false;
    api
      .portfolioHistory("1y")
      .then((h) => !cancelled && setYearPoints(h.points))
      .catch(() => !cancelled && setYearPoints([]));
    return () => {
      cancelled = true;
    };
  }, [fundsKey]);

  // Movimientos de todos los fondos (uno por fondo, en paralelo)
  useEffect(() => {
    if (funds.length === 0) return;
    let cancelled = false;
    Promise.all(funds.map((f) => api.transactions.list(f.id).then((r) => ({ fund: f, transactions: r.transactions })).catch(() => ({ fund: f, transactions: [] }))))
      .then((byFund) => !cancelled && setMovements(recentMovements(byFund, 6)))
      .catch(() => !cancelled && setMovements([]));
    return () => {
      cancelled = true;
    };
  }, [fundsKey]);

  const views = useMemo(() => funds.map((f) => ({ fund: f, view: fundView(f) })), [funds]);
  const byBank = useMemo(() => allocationBy(funds, "bank"), [funds]);
  const top = useMemo(() => [...views].sort((a, b) => b.view.value - a.view.value).slice(0, 5), [views]);
  const months = useMemo(() => monthlyResults(yearPoints ?? [], 8), [yearPoints]);
  const change = useMemo(() => lastChange(yearPoints ?? []), [yearPoints]);
  const monthsTotal = useMemo(() => Math.round(months.reduce((t, m) => t + m.result, 0) * 100) / 100, [months]);

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
    <div className="space-y-4 fade-in">
      {/* Fila 1: patrimonio · resultado por mes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Patrimonio: tarjeta destacada con borde de tinta y un resplandor suave */}
        <div className="ft-card relative overflow-hidden p-5 lg:col-span-5 xl:col-span-4">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
            style={{
              background: "linear-gradient(140deg, rgba(62,224,255,.7), rgba(111,123,255,.35) 45%, rgba(209,91,255,.6))",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(closest-side, #6f7bff, #d15bff 55%, transparent)" }}
          />
          <div className="relative flex items-center justify-between">
            <Label>Patrimonio</Label>
            <Tag tone="neutral">
              {funds.length} {funds.length === 1 ? "fondo" : "fondos"}
            </Tag>
          </div>
          <p className="relative mt-3 font-heading text-[2.4rem] font-semibold leading-none tracking-tight text-[var(--color-fg-1)]">{formatEur(current)}</p>
          <p className="relative mt-2.5 flex flex-wrap items-center gap-2 text-sm text-[var(--color-fg-3)]">
            <Tag tone={pl >= 0 ? "profit" : "loss"}>
              {pl >= 0 ? "↑" : "↓"} {formatPct(plPct)}
            </Tag>
            {signed(pl)} sobre {formatEur(invested)} invertidos
          </p>
          {pending > 0 && <p className="relative mt-1 text-xs text-[var(--color-warn)]">{pending} sin precio todavía</p>}

          <div className="relative mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate("add")}
              className="flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-btn-bg)] px-3 py-2.5 text-[13px] font-semibold text-[var(--color-btn-fg)] transition-opacity hover:opacity-85"
            >
              <PlusCircle size={15} /> Añadir fondo
            </button>
            <button
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-2.5 text-[13px] font-semibold text-[var(--color-fg-1)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-60"
            >
              <Download size={15} /> {isExportingPdf ? "Generando…" : "Informe PDF"}
            </button>
          </div>

          <div className="relative mt-5 border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-fg-4)]">
              <span>
                Por entidad · {byBank.length} {byBank.length === 1 ? "entidad" : "entidades"}
              </span>
              <button onClick={() => onNavigate("analytics")} className="font-medium text-[var(--color-accent)] hover:underline">
                Ver análisis
              </button>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {byBank.slice(0, 4).map((b) => (
                <div key={b.name} className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                  <p className="truncate text-[12px] font-medium text-[var(--color-fg-2)]">{b.name}</p>
                  <p className="mt-0.5 font-heading text-[15px] font-semibold text-[var(--color-fg-1)]">{formatEur(b.value)}</p>
                  <p className="text-[10px] text-[var(--color-fg-4)]">{formatPct(b.pct).replace("+", "")} del total</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resultado por mes */}
        <Card className="flex flex-col lg:col-span-7 xl:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Resultado por mes</h2>
              <p className="text-xs text-[var(--color-fg-4)]">Ganancia o pérdida de cada mes, sin contar aportaciones</p>
            </div>
            {months.length > 0 && (
              <div className="sm:text-right">
                <p className={`font-heading text-xl font-semibold ${monthsTotal >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>{signed(monthsTotal)}</p>
                <p className="text-[11px] text-[var(--color-fg-4)]">
                  en {months.length} {months.length === 1 ? "mes" : "meses"}
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 min-h-[190px] flex-1">
            {yearPoints == null ? (
              <div className="shimmer h-full rounded-2xl" />
            ) : months.length === 0 ? (
              <p className="grid h-full place-items-center text-sm text-[var(--color-fg-4)]">Aún no hay meses completos.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ftBarUp" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#d15bff" />
                      <stop offset="1" stopColor="#3ee0ff" />
                    </linearGradient>
                    <pattern id="ftBarDown" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="6" height="6" fill="rgba(248,113,113,.14)" />
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#f87171" strokeWidth="3" />
                    </pattern>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-fg-4)" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatCompactEur} tick={{ fontSize: 10, fill: "var(--color-fg-4)" }} axisLine={false} tickLine={false} width={48} />
                  <ReferenceLine y={0} stroke="var(--color-border)" />
                  <Tooltip content={<MonthTooltip />} cursor={{ fill: "var(--color-surface)" }} />
                  <Bar dataKey="result" radius={[6, 6, 6, 6]} maxBarSize={40}>
                    {months.map((m) => (
                      <Cell key={m.month} fill={m.result >= 0 ? "url(#ftBarUp)" : "url(#ftBarDown)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex gap-4 text-[11px] text-[var(--color-fg-4)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--gradient-ink)" }} /> Ganancia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "repeating-linear-gradient(45deg,#f87171 0 2px,transparent 2px 4px)" }} /> Pérdida
            </span>
          </div>
        </Card>
      </div>

      {/* Fila 2: evolución · posiciones */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
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
                      <stop offset="0" stopColor="#3ee0ff" />
                      <stop offset="0.5" stopColor="#6f7bff" />
                      <stop offset="1" stopColor="#d15bff" />
                    </linearGradient>
                    <linearGradient id="ftArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#6f7bff" stopOpacity={0.24} />
                      <stop offset="1" stopColor="#6f7bff" stopOpacity={0} />
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
              <span className="h-0.5 w-4 rounded" style={{ background: "var(--gradient-ink)" }} /> Valor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t border-dashed border-[var(--color-fg-4)]" /> Invertido
            </span>
          </div>
        </Card>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <div className="grid grid-cols-2 gap-4">
            <Tile label="Último día" icon={<Clock size={13} />} foot={change ? `${dayMonth(change.date)} frente al ${dayMonth(change.since)}` : "Sin datos suficientes"}>
              {change ? (
                <>
                  <p className={`whitespace-nowrap font-heading text-xl font-semibold sm:text-2xl ${change.change >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                    {signed(change.change)}
                  </p>
                  <p className="text-xs text-[var(--color-fg-4)]">{formatPct(change.pct)}</p>
                </>
              ) : (
                <p className="font-heading text-2xl font-semibold text-[var(--color-fg-4)]">—</p>
              )}
            </Tile>
            <Tile
              label="WhatsApp"
              icon={<MessageCircle size={13} />}
              foot={
                <button onClick={() => onNavigate("notifications")} className="font-medium text-[var(--color-accent)] hover:underline">
                  {status?.whatsapp?.configured ? "Gestionar avisos" : "Activar resumen"}
                </button>
              }
            >
              <p className="flex items-center gap-2 font-heading text-lg font-semibold text-[var(--color-fg-1)]">
                <span className={`h-2 w-2 rounded-full ${status?.whatsapp?.configured ? "bg-[var(--color-profit)]" : "bg-[var(--color-fg-4)]"}`} />
                {status?.whatsapp?.configured ? "Activo" : "Inactivo"}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-fg-4)]">
                {status?.whatsapp?.configured ? maskPhone(phone) || "Configurado" : "Sin configurar"}
              </p>
            </Tile>
          </div>

        <Card className="flex flex-1 flex-col" padded={false}>
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Posiciones</h2>
            <button onClick={() => onNavigate("portfolio")} className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-[var(--color-accent)] hover:underline">
              Ver cartera <ArrowRight size={13} />
            </button>
          </div>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]">
            {top.map(({ fund, view }) => (
              <li key={fund.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-fg-1)]" title={fund.name}>
                    {fund.name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[var(--color-fg-4)]">
                    {fund.bank}
                    {view.navDateLabel && <span className={view.stale ? "text-[var(--color-warn)]" : ""}> · {view.navDateLabel}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-[var(--color-fg-1)]">{formatEur(view.value)}</p>
                  {view.plLabel ? (
                    <p className={`font-mono text-[11px] ${view.plPositive ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>{view.plPctLabel}</p>
                  ) : (
                    <p className="text-[11px] text-[var(--color-fg-4)]">sin precio</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        </div>
      </div>

      {/* Fila 3: movimientos recientes */}
      <Card padded={false}>
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Movimientos recientes</h2>
            <p className="text-xs text-[var(--color-fg-4)]">Compras, ventas y traspasos de todos tus fondos</p>
          </div>
          <button onClick={() => onNavigate("portfolio")} className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-[var(--color-accent)] hover:underline">
            Ver todos <ArrowRight size={13} />
          </button>
        </div>
        {movements == null ? (
          <div className="px-5 pb-5">
            <div className="shimmer h-24 rounded-2xl" />
          </div>
        ) : movements.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-[var(--color-fg-4)]">Todavía no hay movimientos.</p>
        ) : (
          <>
          <ul className="divide-y divide-[var(--color-border)] border-t border-[var(--color-border)] sm:hidden">
            {movements.map((m) => (
              <li key={`${m.fundId}-${m.id}`} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-fg-1)]">{m.fundName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--color-fg-4)]">
                    <span className={`h-1.5 w-1.5 rounded-full ${m.type === "SELL" || m.type === "TRANSFER_OUT" ? "bg-[var(--color-loss)]" : "bg-[var(--color-profit)]"}`} />
                    {TX_LABEL[m.type]} · {shortDay(m.date)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-[var(--color-fg-1)]">{formatEur(Number(m.amount))}</p>
                  <p className="font-mono text-[10px] text-[var(--color-fg-4)]">{Number(m.shares).toLocaleString("es-ES", { maximumFractionDigits: 6 })} part.</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-[var(--color-border)] text-left">
                  {["Fecha", "Fondo", "Tipo", "Participaciones", "Precio", "Importe"].map((h, i) => (
                    <th key={h} className={`px-5 py-2.5 ${i > 2 ? "text-right" : ""}`}>
                      <Label>{h}</Label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={`${m.fundId}-${m.id}`} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-[var(--color-fg-3)]">{shortDay(m.date)}</td>
                    <td className="px-5 py-3">
                      <p className="max-w-[300px] truncate font-medium text-[var(--color-fg-1)]" title={m.fundName}>
                        {m.fundName}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-2)]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${m.type === "SELL" || m.type === "TRANSFER_OUT" ? "bg-[var(--color-loss)]" : "bg-[var(--color-profit)]"}`}
                        />
                        {TX_LABEL[m.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-2)]">
                      {Number(m.shares).toLocaleString("es-ES", { maximumFractionDigits: 6 })}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-3)]">
                      {Number(m.price).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-1)]">{formatEur(Number(m.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </div>
  );
}
