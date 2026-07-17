export function formatCurrency(value: number, currency: string = "EUR"): string {
  return `${value.toFixed(2)}${currency === "EUR" ? "€" : " " + currency}`;
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function profitColor(value: number): string {
  if (value > 0) return "text-[var(--color-profit)]";
  if (value < 0) return "text-[var(--color-loss)]";
  return "text-[var(--color-fg-3)]";
}

export function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
