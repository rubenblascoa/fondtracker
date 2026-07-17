import type { Status } from "../api";
import { formatCurrency, formatPct, profitColor } from "../utils";

export function Stats({ status }: { status: Status | null }) {
  const hasData = (status?.fund_count ?? 0) > 0;

  const items = [
    {
      label: "total invested",
      value: formatCurrency(status?.total_initial ?? 0),
      accent: false,
    },
    {
      label: "current value",
      value: formatCurrency(status?.total_current ?? 0),
      accent: false,
    },
    {
      label: "profit / loss",
      value: formatCurrency(status?.total_profit_loss ?? 0),
      color: profitColor(status?.total_profit_loss ?? 0),
      accent: true,
    },
    {
      label: "performance",
      value: formatPct(status?.total_profit_loss_pct ?? 0),
      color: profitColor(status?.total_profit_loss_pct ?? 0),
      accent: true,
    },
  ];

  if (!hasData) {
    return (
      <div className="border border-dashed border-[var(--color-ink-3)] p-8 text-center mb-8 slide-up">
        <div className="font-pixel text-lg text-[var(--color-fg-4)] mb-2">—</div>
        <p className="text-xs text-[var(--color-fg-4)] max-w-xs mx-auto leading-relaxed">
          your portfolio is empty. search for a fund in the catalog and log your first investment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {items.map((it) => (
        <div key={it.label} className="bg-black/20 border border-white/5 backdrop-blur-sm p-5 hover:border-[var(--color-accent)]/30 hover:bg-black/40 transition-all cursor-default">
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-fg-4)] mb-2 font-mono">
            {it.label}
          </div>
          <div
            className={`font-mono text-2xl font-bold tracking-tight ${
              it.color ?? "text-[var(--color-fg-1)]"
            } ${it.accent ? "glow" : ""}`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
