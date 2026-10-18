import type { Investment, Status, User } from "./api";

// Excel en español: separador ";" y coma decimal.
// Redondea antes de formatear para no imprimir "-0,00" por restos de coma flotante.
const dec = (n: number, digits?: number) =>
  (digits == null ? String(n) : (Math.round(n * 10 ** digits) / 10 ** digits || 0).toFixed(digits)).replace(".", ",");
const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function buildPortfolioCsv(funds: Investment[]): string {
  const header = "ID;ISIN;Nombre;Entidad;Participaciones;Precio compra;Precio actual;Invertido;Valor actual;Ganancia;Rentabilidad %";
  const rows = funds.map((f) => {
    const price = f.current_price ?? f.purchase_price;
    const invested = f.total_invested || f.shares * f.purchase_price;
    const value = price * f.shares;
    const gain = value - invested;
    const pct = invested > 0 ? (gain / invested) * 100 : 0;
    return [
      f.id,
      quote(f.isin),
      quote(f.name),
      quote(f.bank || ""),
      dec(f.shares),
      dec(f.purchase_price),
      dec(price),
      dec(invested, 2),
      dec(value, 2),
      dec(gain, 2),
      dec(pct, 2),
    ].join(";");
  });
  return [header, ...rows].join("\n");
}

function download(filename: string, content: string, mime: string) {
  // BOM para que Excel abra bien los acentos
  const blob = new Blob(["﻿" + content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export function downloadPortfolioCsv(funds: Investment[]) {
  download(`FondTracker_Cartera_${today()}.csv`, buildPortfolioCsv(funds), "text/csv");
}

export function downloadPortfolioJson(user: User, status: Status | null, funds: Investment[]) {
  const data = { exported_at: new Date().toISOString(), user: { username: user.username, email: user.email }, status, investments: funds };
  download(`FondTracker_Backup_${today()}.json`, JSON.stringify(data, null, 2), "application/json");
}
