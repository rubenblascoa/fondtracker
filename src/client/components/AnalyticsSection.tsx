import { useMemo, useState } from "react";
import { BarChart3, Building2, PieChart as PieIcon, Sliders, Sparkles } from "lucide-react";
import type { Investment, Status } from "../api";
import { allocationBy, concentration, rebalancePlan } from "../allocation";
import { parseEsNumber } from "../purchase";
import { formatEur, sanitizeFundName } from "../utils";
import { AllocationDonut } from "./dashboard/AllocationDonut";
import { Card, EmptyState, Label, Stat, Tag } from "./ui";

type Tab = "category" | "bank" | "rebalance";
const TABS: { key: Tab; label: string; icon: typeof PieIcon }[] = [
  { key: "category", label: "Por tipo de fondo", icon: PieIcon },
  { key: "bank", label: "Por entidad", icon: Building2 },
  { key: "rebalance", label: "Rebalanceo", icon: Sliders },
];

const CONCENTRATION_TEXT = {
  "Sin fondos": "Añade fondos para ver la concentración.",
  Diversificada: "Tu dinero está bien repartido entre fondos.",
  Moderada: "Algún fondo pesa bastante más que el resto.",
  Concentrada: "La mayor parte de tu dinero está en uno o dos fondos.",
} as const;

export function AnalyticsSection({ funds, status }: { funds: Investment[]; status: Status | null }) {
  const [tab, setTab] = useState<Tab>("category");
  const [targets, setTargets] = useState<Record<number, string>>({});
  const [extra, setExtra] = useState("");

  const byCategory = useMemo(() => allocationBy(funds, "category"), [funds]);
  const byBank = useMemo(() => allocationBy(funds, "bank"), [funds]);
  const conc = useMemo(() => concentration(funds), [funds]);
  const numericTargets = useMemo(() => {
    const out: Record<number, number> = {};
    for (const [id, v] of Object.entries(targets)) {
      const n = parseEsNumber(v);
      if (Number.isFinite(n)) out[Number(id)] = n;
    }
    return out;
  }, [targets]);
  const extraNum = Number.isFinite(parseEsNumber(extra)) ? parseEsNumber(extra) : 0;
  const plan = useMemo(() => rebalancePlan(funds, numericTargets, extraNum), [funds, numericTargets, extraNum]);
  const targetSum = plan.reduce((s, p) => s + p.targetPct, 0);

  if (funds.length === 0) {
    return <EmptyState icon={BarChart3} title="Sin datos que analizar" text="Cuando añadas fondos verás aquí cómo está repartido tu dinero." />;
  }

  const total = status?.total_current ?? 0;

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Concentración" value={conc.label} hint={<span>{CONCENTRATION_TEXT[conc.label]}</span>} />
        <Stat label="Fondos" value={String(funds.length)} hint={<span>en cartera</span>} />
        <Stat label="Entidades" value={String(byBank.length)} hint={<span className="truncate">{byBank.map((b) => b.name).join(", ")}</span>} />
        <Stat label="Tipos de fondo" value={String(byCategory.length)} hint={<span>según la categoría del fondo</span>} />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-full border border-[var(--color-border)] p-1 no-scrollbar sm:inline-flex">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              tab === key ? "bg-[var(--color-tag-bg)] text-[var(--color-fg-1)]" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {(tab === "category" || tab === "bank") && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">{tab === "category" ? "Por tipo de fondo" : "Por entidad"}</h2>
            <p className="text-xs text-[var(--color-fg-4)]">Peso de cada grupo sobre el valor actual de tu cartera</p>
            <AllocationDonut items={tab === "category" ? byCategory : byBank} total={total} size={200} />
          </Card>
          <Card>
            <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">Fondos de cada grupo</h2>
            <div className="mt-3 space-y-4">
              {(tab === "category" ? byCategory : byBank).map((g) => (
                <div key={g.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--color-fg-1)]">{g.name}</span>
                    <span className="font-mono text-xs text-[var(--color-fg-3)]">{g.pct.toFixed(1).replace(".", ",")} %</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface)]">
                    <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: "var(--gradient-accent)" }} />
                  </div>
                  <ul className="mt-2 space-y-1">
                    {funds
                      .filter((f) => ((tab === "category" ? f.category : f.bank) || "Otros") === g.name)
                      .map((f) => (
                        <li key={f.id} className="truncate text-xs text-[var(--color-fg-3)]">
                          {sanitizeFundName(f.name)}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "rebalance" && (
        <Card padded={false}>
          <div className="flex flex-wrap items-end justify-between gap-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">¿Cuánto mover para llegar a tu reparto ideal?</h2>
              <p className="mt-1 max-w-xl text-sm text-[var(--color-fg-3)]">
                Pon el peso que quieres para cada fondo. Si vas a aportar dinero nuevo, indícalo y se usará primero para comprar lo que falta.
              </p>
            </div>
            <label className="block">
              <Label>Aportación extra</Label>
              <div className="relative mt-1">
                <input
                  inputMode="decimal"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="0"
                  className="w-36 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-4 pr-8 font-mono text-sm text-[var(--color-fg-1)] outline-none focus:border-[var(--color-accent)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-fg-4)]">€</span>
              </div>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-y border-[var(--color-border)] text-left">
                  {["Fondo", "Ahora", "Objetivo", "Diferencia", ""].map((h, i) => (
                    <th key={i} className={`px-5 py-2.5 ${i > 0 ? "text-right" : ""}`}>
                      <Label>{h}</Label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plan.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="max-w-[300px] truncate px-5 py-3 text-[var(--color-fg-1)]">{sanitizeFundName(p.name)}</td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-[var(--color-fg-3)]">
                      {p.currentPct.toFixed(1).replace(".", ",")} % · {formatEur(p.currentValue)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative ml-auto w-24">
                        <input
                          inputMode="decimal"
                          value={targets[p.id] ?? String(p.targetPct).replace(".", ",")}
                          onChange={(e) => setTargets({ ...targets, [p.id]: e.target.value })}
                          className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-3 pr-7 text-right font-mono text-xs text-[var(--color-fg-1)] outline-none focus:border-[var(--color-accent)]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-fg-4)]">%</span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 text-right font-mono text-xs ${p.deltaEur > 0 ? "text-[var(--color-profit)]" : p.deltaEur < 0 ? "text-[var(--color-loss)]" : "text-[var(--color-fg-3)]"}`}>
                      {p.deltaEur > 0 ? "+" : ""}
                      {formatEur(p.deltaEur)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Tag tone={p.action === "Comprar" ? "profit" : p.action === "Vender" ? "loss" : "neutral"}>{p.action}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-5 text-xs">
            <span className={Math.abs(targetSum - 100) > 0.05 ? "text-[var(--color-warn)]" : "text-[var(--color-fg-4)]"}>
              Suma de objetivos: {targetSum.toFixed(1).replace(".", ",")} %{Math.abs(targetSum - 100) > 0.05 ? " — debería ser 100 %" : ""}
            </span>
            <button onClick={() => setTargets({})} className="font-medium text-[var(--color-accent)] hover:underline">
              Volver a partes iguales
            </button>
          </div>
        </Card>
      )}

      <Card className="flex items-start gap-3">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-[var(--color-accent-2)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-fg-1)]">Próximamente: sectores, países, empresas y comisiones</p>
          <p className="mt-1 text-sm text-[var(--color-fg-3)]">
            Solo mostraremos la composición de cada fondo cuando venga de su ficha oficial. Hasta entonces no la enseñamos, para no darte datos inventados.
          </p>
        </div>
      </Card>
    </div>
  );
}

