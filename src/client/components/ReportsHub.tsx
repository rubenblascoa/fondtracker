import React, { useState } from "react";
import type { Investment, Status, User } from "../api";
import { 
  FileText, Download, Table, Database, Sparkles, CheckCircle2, 
  ShieldCheck, Calculator, AlertCircle, ArrowUpRight, Scale, 
  Receipt, Landmark, Layers, Info, Check, RefreshCw
} from "lucide-react";
import { sanitizeFundName } from "../utils";

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 2 
  }).format(n);
}

interface ReportsHubProps {
  user: User;
  status: Status | null;
  funds: Investment[];
  onExportPdf: () => Promise<void>;
  isExportingPdf: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export function ReportsHub({
  user,
  status,
  funds,
  onExportPdf,
  isExportingPdf,
  onExportCsv,
  onExportJson
}: ReportsHubProps) {
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTax, setIncludeTax] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const totalInvested = status?.total_initial ?? funds.reduce((acc, f) => acc + (f.total_invested || f.shares * f.purchase_price), 0);
  const totalCurrent = status?.total_current ?? funds.reduce((acc, f) => acc + ((f.current_price ?? f.purchase_price) * f.shares), 0);
  const totalProfitLoss = totalCurrent - totalInvested;
  const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // ─── Spanish IRPF Capital Gains Tax Calculator ──────────────────────────────
  const taxEstimation = React.useMemo(() => {
    if (totalProfitLoss <= 0) {
      return { totalTax: 0, netProfit: totalProfitLoss, effectiveRate: 0, brackets: [] };
    }

    const profit = totalProfitLoss;
    let remaining = profit;
    let tax = 0;
    const brackets = [];

    // Tramo 1: Hasta 6.000 € al 19%
    const b1 = Math.min(remaining, 6000);
    const tax1 = b1 * 0.19;
    tax += tax1;
    remaining -= b1;
    brackets.push({ label: "Hasta 6.000 €", rate: "19%", base: b1, tax: tax1 });

    // Tramo 2: De 6.000 a 50.000 € al 21%
    if (remaining > 0) {
      const b2 = Math.min(remaining, 44000);
      const tax2 = b2 * 0.21;
      tax += tax2;
      remaining -= b2;
      brackets.push({ label: "De 6.000 € a 50.000 €", rate: "21%", base: b2, tax: tax2 });
    }

    // Tramo 3: De 50.000 a 200.000 € al 23%
    if (remaining > 0) {
      const b3 = Math.min(remaining, 150000);
      const tax3 = b3 * 0.23;
      tax += tax3;
      remaining -= b3;
      brackets.push({ label: "De 50.000 € a 200.000 €", rate: "23%", base: b3, tax: tax3 });
    }

    // Tramo 4: De 200.000 a 300.000 € al 27%
    if (remaining > 0) {
      const b4 = Math.min(remaining, 100000);
      const tax4 = b4 * 0.27;
      tax += tax4;
      remaining -= b4;
      brackets.push({ label: "De 200.000 € a 300.000 €", rate: "27%", base: b4, tax: tax4 });
    }

    // Tramo 5: Más de 300.000 € al 28%
    if (remaining > 0) {
      const tax5 = remaining * 0.28;
      tax += tax5;
      brackets.push({ label: "Más de 300.000 €", rate: "28%", base: remaining, tax: tax5 });
    }

    const effectiveRate = profit > 0 ? (tax / profit) * 100 : 0;
    return {
      totalTax: tax,
      netProfit: profit - tax,
      effectiveRate: Math.round(effectiveRate * 10) / 10,
      brackets
    };
  }, [totalProfitLoss]);

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Banner ── */}
      <div className="bg-gradient-to-r from-[var(--color-ink-1)] to-[var(--color-ink-2)] border border-white/10 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-xs font-semibold mb-3">
            <FileText size={13} />
            <span>Centro de Informes &amp; Fiscalidad</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Informes Ejecutivos &amp; Simulador Fiscal IRPF
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Genera memorias oficiales de patrimonio en PDF en alta definición, exporta bases de datos en formato tabular y calcula la tributación de plusvalías y traspasos.
          </p>
        </div>
      </div>

      {/* ── Grid of 3 Main Export Options ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. PDF Executive Document */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-[var(--color-accent)]/30 transition-all shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] mb-4 shadow-[0_0_12px_rgba(57,255,136,0.15)] group-hover:scale-105 transition-transform">
              <FileText size={22} />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Informe Ejecutivo PDF</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              Documento formal estructurado con gráficas de evolución, tabla de posiciones, desglose por entidad bancaria y métricas de rentabilidad.
            </p>

            <div className="space-y-2 py-3 border-t border-white/5 text-xs text-gray-300 font-medium">
              <div className="flex items-center gap-2">
                <Check size={13} className="text-[var(--color-accent)]" />
                <span>Gráficas vectoriales en alta resolución</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={13} className="text-[var(--color-accent)]" />
                <span>Desglose por ISIN y precios de suscripción</span>
              </div>
            </div>
          </div>

          <button
            onClick={onExportPdf}
            disabled={isExportingPdf || funds.length === 0}
            className="w-full py-3 bg-[var(--color-accent)] text-[#0a0a0c] font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(57,255,136,0.25)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isExportingPdf ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{isExportingPdf ? "Generando documento PDF..." : "Descargar Informe PDF"}</span>
          </button>
        </div>

        {/* 2. CSV / Excel Tabular Export */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
              <Table size={22} />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Exportación CSV / Excel</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              Hoja de cálculo universal compatible con Microsoft Excel, Apple Numbers y Google Sheets para análisis financiero personalizado.
            </p>

            <div className="space-y-2 py-3 border-t border-white/5 text-xs text-gray-300 font-medium">
              <div className="flex items-center gap-2">
                <Check size={13} className="text-blue-400" />
                <span>Formatos numéricos adaptados con decimales</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={13} className="text-blue-400" />
                <span>Histórico de compras y notas de cartera</span>
              </div>
            </div>
          </div>

          <button
            onClick={onExportCsv}
            disabled={funds.length === 0}
            className="w-full py-3 bg-blue-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            <Download size={14} />
            <span>Descargar Archivo CSV</span>
          </button>
        </div>

        {/* 3. JSON Backup */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 flex flex-col justify-between group hover:border-purple-500/30 transition-all shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
              <Database size={22} />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Copia de Seguridad JSON</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              Exportación completa de datos estructurados con metadatos de fondos, claves de usuario y registros de cotizaciones para copias de respaldo.
            </p>

            <div className="space-y-2 py-3 border-t border-white/5 text-xs text-gray-300 font-medium">
              <div className="flex items-center gap-2">
                <Check size={13} className="text-purple-400" />
                <span>Backup 100% portable y restaurable</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={13} className="text-purple-400" />
                <span>Estructura JSON con marcas temporales ISO</span>
              </div>
            </div>
          </div>

          <button
            onClick={onExportJson}
            disabled={funds.length === 0}
            className="w-full py-3 bg-purple-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            <Download size={14} />
            <span>Descargar Backup JSON</span>
          </button>
        </div>

      </div>

      {/* ── Tax Simulation & Fiscalidad IRPF ── */}
      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Receipt size={18} className="text-amber-400" />
              Simulador Fiscal de Plusvalías &amp; Traspasos (IRPF España)
            </h2>
            <p className="text-xs text-gray-400">
              Estimación de tributación en base imponible del ahorro según la Ley 35/2006 del IRPF
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-400 shrink-0">
            <ShieldCheck size={15} />
            <span>Régimen de Traspasos: 0€ de tributación</span>
          </div>
        </div>

        {/* Advantage Box */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <Landmark size={15} className="text-[var(--color-accent)]" />
              Ventaja Fiscal de los Fondos de Inversión (Diferimiento Fiscal)
            </p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
              En España, puedes traspasar tu capital entre fondos de inversión sin tributar por las plusvalías latentes acumuladas. Solo pagarás impuestos cuando realices un <strong>reembolso definitivo</strong> a tu cuenta corriente.
            </p>
          </div>

          <div className="bg-black/50 border border-white/10 px-4 py-3 rounded-xl text-right font-mono shrink-0">
            <div className="text-[10px] text-gray-400 uppercase">Plusvalía Latente Total</div>
            <div className={`text-lg font-bold ${totalProfitLoss >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
              {totalProfitLoss >= 0 ? "+" : ""}{fmtEur(totalProfitLoss)}
            </div>
          </div>
        </div>

        {/* Brackets Breakdown Table */}
        {totalProfitLoss > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
              Simulación de Reembolso Total (Tramos del Ahorro)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="pb-2 font-medium">Tramo de Ganancia</th>
                    <th className="pb-2 font-medium">Tipo Impositivo</th>
                    <th className="pb-2 font-medium text-right">Base Imponible en Tramo</th>
                    <th className="pb-2 font-medium text-right">Impuesto Estimado</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 divide-y divide-white/5">
                  {taxEstimation.brackets.map((b, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 text-white">{b.label}</td>
                      <td className="py-2.5 font-bold text-amber-400">{b.rate}</td>
                      <td className="py-2.5 text-right">{fmtEur(b.base)}</td>
                      <td className="py-2.5 text-right text-red-400 font-bold">{fmtEur(b.tax)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/20 font-bold bg-white/[0.02]">
                    <td className="py-3 text-white">Total Tributación Estimada</td>
                    <td className="py-3 text-[var(--color-accent)]">{taxEstimation.effectiveRate}% tipo efectivo</td>
                    <td className="py-3 text-right text-white">{fmtEur(totalProfitLoss)}</td>
                    <td className="py-3 text-right text-red-400 text-sm">{fmtEur(taxEstimation.totalTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Capital Neto tras Impuestos:</span>
              <span className="text-[var(--color-accent)] text-sm font-bold">{fmtEur(totalCurrent - taxEstimation.totalTax)}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
