import type { Status } from "../api";
import { formatCurrency, formatPct, profitColor } from "../utils";

export function Stats({ status }: { status: Status | null }) {
  const hasData = (status?.fund_count ?? 0) > 0;

  const items = [
    {
      label: "total invertido",
      value: formatCurrency(status?.total_initial ?? 0),
      accent: false,
    },
    {
      label: "valor actual",
      value: formatCurrency(status?.total_current ?? 0),
      accent: false,
    },
    {
      label: "beneficio / pérdida",
      value: formatCurrency(status?.total_profit_loss ?? 0),
      color: profitColor(status?.total_profit_loss ?? 0),
      accent: true,
    },
    {
      label: "rendimiento",
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
          aún no tienes inversiones registradas. busca un fondo en el catálogo y añade tu primera inversión.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-ink-3)] border border-[var(--color-ink-3)] mb-8">
      {items.map((it) => (
        <div key={it.label} className="bg-[var(--color-ink-1)] p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-4)] mb-2">
            {it.label}
          </div>
          <div
            className={`font-pixel text-xl leading-tight ${
              it.color ?? "text-[var(--color-fg-1)]"
            }`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}
