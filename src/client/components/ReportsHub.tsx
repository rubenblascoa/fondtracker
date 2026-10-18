import { Database, Download, FileSpreadsheet, FileText, Landmark } from "lucide-react";
import type { Investment, Status, User } from "../api";
import { irpfSavingsTax } from "../tax";
import { formatEur } from "../utils";
import { Button, Card, Label, Tag } from "./ui";

type Props = {
  user: User;
  status: Status | null;
  funds: Investment[];
  onExportPdf: () => void;
  isExportingPdf: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
};

const pct = (n: number) => `${String(n).replace(".", ",")} %`;
const range = (from: number, to: number | null) =>
  to == null ? `Más de ${formatEur(from, 0)}` : from === 0 ? `Hasta ${formatEur(to, 0)}` : `De ${formatEur(from, 0)} a ${formatEur(to, 0)}`;

export function ReportsHub({ status, funds, onExportPdf, isExportingPdf, onExportCsv, onExportJson }: Props) {
  const gain = status?.total_profit_loss ?? 0;
  const value = status?.total_current ?? 0;
  const tax = irpfSavingsTax(gain);
  const empty = funds.length === 0;

  const exports = [
    {
      icon: FileText,
      title: "Informe PDF",
      text: "Tu cartera en un documento: posiciones, reparto por entidad y evolución de cada fondo.",
      action: (
        <Button className="w-full" onClick={onExportPdf} disabled={empty || isExportingPdf}>
          <Download size={15} /> {isExportingPdf ? "Generando…" : "Descargar PDF"}
        </Button>
      ),
    },
    {
      icon: FileSpreadsheet,
      title: "Excel (CSV)",
      text: "Una fila por fondo con participaciones, precios, invertido, valor y ganancia. Se abre directamente en Excel.",
      action: (
        <Button variant="ghost" className="w-full" onClick={onExportCsv} disabled={empty}>
          <Download size={15} /> Descargar CSV
        </Button>
      ),
    },
    {
      icon: Database,
      title: "Copia de seguridad",
      text: "Todos tus datos en JSON, por si quieres guardarlos o llevarlos a otra herramienta.",
      action: (
        <Button variant="ghost" className="w-full" onClick={onExportJson} disabled={empty}>
          <Download size={15} /> Descargar JSON
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {exports.map(({ icon: Icon, title, text, action }) => (
          <Card key={title} className="flex flex-col justify-between gap-5">
            <div>
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-[var(--color-tag-bg)] text-[var(--color-tag-fg)]">
                <Icon size={19} />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-fg-1)]">{title}</h2>
              <p className="mt-1 text-sm text-[var(--color-fg-3)]">{text}</p>
            </div>
            {action}
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-fg-1)]">
              <Landmark size={18} className="text-[var(--color-accent-2)]" /> ¿Y si lo vendieras todo hoy?
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-fg-3)]">
              Estimación del IRPF por tu ganancia actual, con los tramos del ahorro vigentes. Mientras no vendas no pagas nada, y
              traspasar de un fondo a otro tampoco tributa.
            </p>
          </div>
          <Tag tone="neutral">Estimación orientativa</Tag>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="ft-card p-4">
            <Label>Ganancia actual</Label>
            <p className={`mt-1 font-heading text-xl font-semibold ${gain >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
              {gain > 0 ? "+" : ""}
              {formatEur(gain)}
            </p>
          </div>
          <div className="ft-card p-4">
            <Label>Impuesto estimado</Label>
            <p className="mt-1 font-heading text-xl font-semibold text-[var(--color-fg-1)]">{formatEur(tax.total)}</p>
            <p className="text-xs text-[var(--color-fg-4)]">Tipo efectivo {pct(tax.effectiveRate)}</p>
          </div>
          <div className="ft-card p-4">
            <Label>Te quedaría</Label>
            <p className="mt-1 font-heading text-xl font-semibold text-[var(--color-fg-1)]">{formatEur(value - tax.total)}</p>
          </div>
        </div>

        {tax.brackets.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {["Tramo", "Tipo", "Ganancia en el tramo", "Impuesto"].map((h, i) => (
                    <th key={h} className={`py-2 ${i > 1 ? "text-right" : ""}`}>
                      <Label>{h}</Label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tax.brackets.map((b) => (
                  <tr key={b.from} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2.5 text-[var(--color-fg-2)]">{range(b.from, b.to)}</td>
                    <td className="py-2.5 font-mono text-xs text-[var(--color-accent-2)]">{b.rate} %</td>
                    <td className="py-2.5 text-right font-mono text-xs text-[var(--color-fg-2)]">{formatEur(b.base)}</td>
                    <td className="py-2.5 text-right font-mono text-xs text-[var(--color-fg-1)]">{formatEur(b.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-[var(--color-fg-4)]">Ahora mismo no tienes ganancia, así que no habría nada que pagar.</p>
        )}
        <p className="mt-4 text-xs text-[var(--color-fg-4)]">
          No tiene en cuenta pérdidas de otros años ni otras ganancias del ahorro (intereses, dividendos). Consulta con un asesor antes de decidir.
        </p>
      </Card>
    </div>
  );
}
