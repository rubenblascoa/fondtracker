import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatCompactEur, formatEur } from "../../utils";
import { Label } from "../ui";

export const PALETTE = ["#c084fc", "#e3b25b", "#818cf8", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#a19d94"];

/** Dónut + lista de un reparto (salida de allocationBy). */
export function AllocationDonut({ items, total, size = 170 }: { items: { name: string; value: number; pct: number }[]; total: number; size?: number }) {
  return (
    <>
      <div className="relative mx-auto mt-2" style={{ height: size, width: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="name" innerRadius={size * 0.34} outerRadius={size * 0.47} paddingAngle={items.length > 1 ? 3 : 0} stroke="none">
              {items.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-heading text-base font-semibold text-[var(--color-fg-1)]">{formatCompactEur(total)}</p>
            <Label>Total</Label>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((b, i) => (
          <li key={b.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-[var(--color-fg-2)]">{b.name}</span>
            </span>
            <span className="shrink-0 font-mono text-xs text-[var(--color-fg-3)]">
              {b.pct.toFixed(1).replace(".", ",")} % · <span className="text-[var(--color-fg-1)]">{formatEur(b.value)}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
