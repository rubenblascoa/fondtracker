export function formatCurrency(value: number, currency: string = "EUR"): string {
  return `${value.toFixed(2)}${currency === "EUR" ? "€" : " " + currency}`;
}

// es-ES con punto de miles siempre (Intl no agrupa números de 4 cifras en español).
function formatEsNumber(value: number, decimals = 2): string {
  const rounded = Math.round(Math.abs(value) * 10 ** decimals) / 10 ** decimals;
  const [int, dec] = rounded.toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return `${sign}${grouped}${dec ? "," + dec : ""}`;
}

/** Oculta el teléfono en pantalla: "+34622890965" → "+34 ••• ••• 965". */
export function maskPhone(phone: string | null | undefined): string {
  const p = (phone ?? "").replace(/[\s-]/g, "");
  if (!p) return "";
  if (p.length < 7) return "•••";
  const prefix = p.startsWith("+") ? `${p.slice(0, 3)} ` : "";
  return `${prefix}••• ••• ${p.slice(-3)}`;
}

export function formatEur(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatEsNumber(value)} €`;
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const text = formatEsNumber(value);
  const sign = value > 0 && text !== "0,00" ? "+" : "";
  return `${sign}${text} %`;
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

export function sanitizeFundName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name
    .replace(/Espa\?\?a/gi, "España")
    .replace(/Gesti\?\?n/gi, "Gestión")
    .replace(/Inversi\?\?n/gi, "Inversión")
    .replace(/Selecci\?\?n/gi, "Selección")
    .replace(/Acci\?\?n/gi, "Acción")
    .replace(/Pensi\?\?n/gi, "Pensión")
    .replace(/Monetari\?\?o/gi, "Monetario")
    .replace(/\?\?/g, "ñ");
}
