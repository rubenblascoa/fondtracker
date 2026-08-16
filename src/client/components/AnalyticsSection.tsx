import React, { useState, useMemo } from "react";
import type { Investment, Status } from "../api";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";
import { 
  PieChart as PieIcon, BarChart3, Globe, Layers, Activity, 
  TrendingUp, ArrowUpRight, ArrowDownRight, Building2, Shield, 
  Calculator, Sliders, DollarSign, Sparkles, CheckCircle2, AlertTriangle, 
  RefreshCw, Info, HelpCircle, ArrowUpDown, ChevronRight, Zap
} from "lucide-react";
import { sanitizeFundName } from "../utils";

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR', 
    maximumFractionDigits: 2 
  }).format(n);
}

function fmtPct(n: number) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

interface AnalyticsSectionProps {
  funds: Investment[];
  status: Status | null;
}

export function AnalyticsSection({ funds, status }: AnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState<"allocation" | "sectors" | "geography" | "holdings" | "costs" | "rebalance">("allocation");
  const [chartViewMode, setChartViewMode] = useState<"donut" | "bar">("donut");
  
  // Rebalancing Target Weights state (fundId -> targetPct)
  const [rebalanceTargets, setRebalanceTargets] = useState<Record<number, number>>({});
  const [extraContribution, setExtraContribution] = useState<number>(0);

  const totalInvested = status?.total_initial ?? funds.reduce((acc, f) => acc + (f.total_invested || f.shares * f.purchase_price), 0);
  const totalCurrent = status?.total_current ?? funds.reduce((acc, f) => acc + ((f.current_price ?? f.purchase_price) * f.shares), 0);
  const totalProfitLoss = totalCurrent - totalInvested;
  const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // ─── Heuristic Asset Allocation Engine ───────────────────────────────────────
  const analysis = useMemo(() => {
    if (funds.length === 0 || totalCurrent <= 0) {
      return {
        assetClasses: [],
        sectors: [],
        geography: [],
        topHoldings: [],
        averageTer: 0.25,
        weightedRiskScore: 4.0,
        annualCostEur: 0,
        hhiScore: 0,
        diversificationLevel: "Sin datos",
        attribution: []
      };
    }

    const assetClassMap = new Map<string, number>();
    const sectorMap = new Map<string, number>();
    const geoMap = new Map<string, number>();
    const holdingsMap = new Map<string, { weight: number; ticker?: string; fundNames: string[] }>();
    
    let weightedTerSum = 0;
    let weightedRiskSum = 0;
    let hhiSum = 0;

    funds.forEach((f) => {
      const curPrice = f.current_price ?? f.purchase_price;
      const fundVal = curPrice * f.shares;
      const weight = fundVal / totalCurrent; // 0 to 1
      hhiSum += Math.pow(weight * 100, 2);

      const normName = (f.name || "").toLowerCase();
      const normCat = (f.category || "").toLowerCase();
      const normIsin = (f.isin || "").toUpperCase();

      // 1. Asset Class Heuristic
      let assetClass = "Renta Variable (Acciones)";
      let riskScore = 5;
      let ter = 0.25;

      if (normCat.includes("fija") || normName.includes("bono") || normName.includes("rf ") || normName.includes("deuda") || normName.includes("fixed")) {
        assetClass = "Renta Fija (Bonos)";
        riskScore = 2;
        ter = 0.40;
      } else if (normCat.includes("monetari") || normName.includes("monetari") || normName.includes("liquidez") || normName.includes("cash")) {
        assetClass = "Monetario (Liquidez)";
        riskScore = 1;
        ter = 0.15;
      } else if (normCat.includes("mixto") || normName.includes("mixto") || normName.includes("balanced")) {
        assetClass = "Mixto / Multiactivo";
        riskScore = 3;
        ter = 0.65;
      } else if (normCat.includes("inmobiliari") || normName.includes("reit") || normName.includes("real estate")) {
        assetClass = "Inmobiliario (Real Estate)";
        riskScore = 5;
        ter = 0.85;
      } else if (normName.includes("s&p 500") || normIsin.includes("VUSA") || normIsin.includes("SPY") || normIsin.includes("VOO")) {
        assetClass = "Renta Variable (S&P 500)";
        riskScore = 6;
        ter = 0.07;
      } else if (normName.includes("world") || normIsin.includes("VWCE") || normIsin.includes("IWDA")) {
        assetClass = "Renta Variable Global";
        riskScore = 5;
        ter = 0.20;
      } else {
        assetClass = "Renta Variable";
        riskScore = 6;
        ter = 0.60;
      }

      weightedTerSum += ter * weight;
      weightedRiskSum += riskScore * weight;
      assetClassMap.set(assetClass, (assetClassMap.get(assetClass) || 0) + weight * 100);

      // 2. Geography Heuristic
      if (normName.includes("s&p 500") || normIsin.includes("VUSA") || normName.includes("estados unidos") || normName.includes("usa") || normName.includes("nasdaq")) {
        geoMap.set("Estados Unidos", (geoMap.get("Estados Unidos") || 0) + weight * 98);
        geoMap.set("Otros", (geoMap.get("Otros") || 0) + weight * 2);
      } else if (normCat.includes("españa") || normName.includes("españa") || normName.includes("ibex") || normIsin.startsWith("ES01")) {
        geoMap.set("España", (geoMap.get("España") || 0) + weight * 92);
        geoMap.set("Europa (Ex-España)", (geoMap.get("Europa (Ex-España)") || 0) + weight * 8);
      } else if (normCat.includes("europa") || normName.includes("europa") || normName.includes("euro")) {
        geoMap.set("Europa (Eurozona)", (geoMap.get("Europa (Eurozona)") || 0) + weight * 75);
        geoMap.set("Reino Unido", (geoMap.get("Reino Unido") || 0) + weight * 15);
        geoMap.set("Suiza & Nórdicos", (geoMap.get("Suiza & Nórdicos") || 0) + weight * 10);
      } else if (normName.includes("emerging") || normName.includes("emergentes")) {
        geoMap.set("Mercados Emergentes", (geoMap.get("Mercados Emergentes") || 0) + weight * 85);
        geoMap.set("Asia Desarrollada", (geoMap.get("Asia Desarrollada") || 0) + weight * 15);
      } else {
        // Global
        geoMap.set("Estados Unidos", (geoMap.get("Estados Unidos") || 0) + weight * 62);
        geoMap.set("Europa", (geoMap.get("Europa") || 0) + weight * 20);
        geoMap.set("Japón / Asia", (geoMap.get("Japón / Asia") || 0) + weight * 10);
        geoMap.set("Mercados Emergentes", (geoMap.get("Mercados Emergentes") || 0) + weight * 8);
      }

      // 3. Sectors Heuristic
      if (assetClass.includes("Renta Fija") || assetClass.includes("Monetario")) {
        sectorMap.set("Deuda Soberana / Gobiernos", (sectorMap.get("Deuda Soberana / Gobiernos") || 0) + weight * 60);
        sectorMap.set("Deuda Corporativa Grado Inversión", (sectorMap.get("Deuda Corporativa Grado Inversión") || 0) + weight * 30);
        sectorMap.set("Liquidez / Bancario", (sectorMap.get("Liquidez / Bancario") || 0) + weight * 10);
      } else if (normCat.includes("españa") || normName.includes("españa") || normName.includes("ibex")) {
        sectorMap.set("Servicios Financieros / Banca", (sectorMap.get("Servicios Financieros / Banca") || 0) + weight * 32);
        sectorMap.set("Utilities / Energía", (sectorMap.get("Utilities / Energía") || 0) + weight * 22);
        sectorMap.set("Consumo & Textil", (sectorMap.get("Consumo & Textil") || 0) + weight * 18);
        sectorMap.set("Infraestructuras & Telecom", (sectorMap.get("Infraestructuras & Telecom") || 0) + weight * 16);
        sectorMap.set("Tecnología & Otros", (sectorMap.get("Tecnología & Otros") || 0) + weight * 12);
      } else {
        sectorMap.set("Tecnología de la Información", (sectorMap.get("Tecnología de la Información") || 0) + weight * 26);
        sectorMap.set("Servicios Financieros", (sectorMap.get("Servicios Financieros") || 0) + weight * 15);
        sectorMap.set("Salud & Farmacéutica", (sectorMap.get("Salud & Farmacéutica") || 0) + weight * 13);
        sectorMap.set("Consumo Discrecional", (sectorMap.get("Consumo Discrecional") || 0) + weight * 11);
        sectorMap.set("Servicios de Comunicación", (sectorMap.get("Servicios de Comunicación") || 0) + weight * 9);
        sectorMap.set("Industriales", (sectorMap.get("Industriales") || 0) + weight * 8);
        sectorMap.set("Consumo Básico", (sectorMap.get("Consumo Básico") || 0) + weight * 7);
        sectorMap.set("Energía & Materiales", (sectorMap.get("Energía & Materiales") || 0) + weight * 6);
        sectorMap.set("Utilities & Real Estate", (sectorMap.get("Utilities & Real Estate") || 0) + weight * 5);
      }

      // 4. Top Holdings Heuristic
      const fundNameClean = sanitizeFundName(f.name);
      if (normName.includes("s&p 500") || normIsin.includes("VUSA") || normIsin.includes("SPY") || normName.includes("world")) {
        const topSP = [
          { name: "Microsoft Corporation", ticker: "MSFT", w: 7.2 },
          { name: "Apple Inc.", ticker: "AAPL", w: 6.8 },
          { name: "NVIDIA Corporation", ticker: "NVDA", w: 6.3 },
          { name: "Amazon.com Inc.", ticker: "AMZN", w: 3.8 },
          { name: "Alphabet Inc. (Google)", ticker: "GOOGL", w: 3.9 },
          { name: "Meta Platforms Inc.", ticker: "META", w: 2.4 },
          { name: "Berkshire Hathaway", ticker: "BRK.B", w: 1.8 }
        ];
        topSP.forEach(h => {
          const prev = holdingsMap.get(h.name) || { weight: 0, ticker: h.ticker, fundNames: [] };
          prev.weight += (h.w * weight);
          if (!prev.fundNames.includes(fundNameClean)) prev.fundNames.push(fundNameClean);
          holdingsMap.set(h.name, prev);
        });
      } else if (normCat.includes("españa") || normName.includes("españa") || normName.includes("ibex")) {
        const topES = [
          { name: "Iberdrola S.A.", ticker: "IBE.MC", w: 12.5 },
          { name: "Inditex S.A.", ticker: "ITX.MC", w: 11.2 },
          { name: "Banco Santander S.A.", ticker: "SAN.MC", w: 10.4 },
          { name: "BBVA S.A.", ticker: "BBVA.MC", w: 9.1 },
          { name: "CaixaBank S.A.", ticker: "CABK.MC", w: 5.6 },
          { name: "Amadeus IT Group", ticker: "AMS.MC", w: 4.8 }
        ];
        topES.forEach(h => {
          const prev = holdingsMap.get(h.name) || { weight: 0, ticker: h.ticker, fundNames: [] };
          prev.weight += (h.w * weight);
          if (!prev.fundNames.includes(fundNameClean)) prev.fundNames.push(fundNameClean);
          holdingsMap.set(h.name, prev);
        });
      }
    });

    // Color Palettes
    const palette = ["#39ff88", "#60a5fa", "#ffb547", "#a78bfa", "#f472b6", "#34d399", "#38bdf8", "#fbbf24", "#e879f9", "#94a3b8"];

    const assetClasses = Array.from(assetClassMap.entries())
      .map(([name, weight], i) => ({
        name,
        weight: Math.round(weight * 10) / 10,
        valueEur: Math.round((weight / 100) * totalCurrent),
        color: palette[i % palette.length]
      }))
      .sort((a, b) => b.weight - a.weight);

    const sectors = Array.from(sectorMap.entries())
      .map(([name, weight], i) => ({
        name,
        weight: Math.round(weight * 10) / 10,
        valueEur: Math.round((weight / 100) * totalCurrent),
        color: palette[i % palette.length]
      }))
      .sort((a, b) => b.weight - a.weight);

    const geography = Array.from(geoMap.entries())
      .map(([name, weight], i) => ({
        name,
        weight: Math.round(weight * 10) / 10,
        valueEur: Math.round((weight / 100) * totalCurrent),
        color: palette[i % palette.length]
      }))
      .sort((a, b) => b.weight - a.weight);

    const topHoldings = Array.from(holdingsMap.entries())
      .map(([name, data]) => ({
        name,
        ticker: data.ticker,
        weight: Math.round(data.weight * 10) / 10,
        valueEur: Math.round((data.weight / 100) * totalCurrent),
        fundNames: data.fundNames
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    const averageTer = Math.round(weightedTerSum * 100) / 100;
    const weightedRiskScore = Math.round(weightedRiskSum * 10) / 10;
    const annualCostEur = Math.round((averageTer / 100) * totalCurrent);

    let diversificationLevel = "Alta Diversificación";
    if (hhiSum > 2500) diversificationLevel = "Alta Concentración";
    else if (hhiSum > 1500) diversificationLevel = "Concentración Moderada";

    // Performance Attribution (Contribution to Return)
    const attribution = funds.map(f => {
      const curVal = (f.current_price ?? f.purchase_price) * f.shares;
      const invVal = f.total_invested || (f.shares * f.purchase_price);
      const pl = curVal - invVal;
      const retPct = invVal > 0 ? (pl / invVal) * 100 : 0;
      const weightPct = totalCurrent > 0 ? (curVal / totalCurrent) * 100 : 0;
      const contributionPct = (weightPct / 100) * retPct;

      return {
        id: f.id,
        isin: f.isin,
        name: sanitizeFundName(f.name),
        bank: f.bank,
        curVal,
        weightPct: Math.round(weightPct * 10) / 10,
        retPct: Math.round(retPct * 10) / 10,
        contributionPct: Math.round(contributionPct * 100) / 100,
        pl
      };
    }).sort((a, b) => b.contributionPct - a.contributionPct);

    return {
      assetClasses,
      sectors,
      geography,
      topHoldings,
      averageTer,
      weightedRiskScore,
      annualCostEur,
      hhiScore: Math.round(hhiSum),
      diversificationLevel,
      attribution
    };
  }, [funds, totalCurrent]);

  // Rebalancing calculation
  const rebalancePlan = useMemo(() => {
    const targetTotal = totalCurrent + extraContribution;
    if (targetTotal <= 0 || funds.length === 0) return [];

    return funds.map(f => {
      const curVal = (f.current_price ?? f.purchase_price) * f.shares;
      const currentWeight = totalCurrent > 0 ? (curVal / totalCurrent) * 100 : 0;
      const targetWeight = rebalanceTargets[f.id] !== undefined 
        ? rebalanceTargets[f.id] 
        : (100 / funds.length);

      const targetValue = (targetWeight / 100) * targetTotal;
      const deltaEur = targetValue - curVal;

      return {
        id: f.id,
        name: sanitizeFundName(f.name),
        isin: f.isin,
        currentValue: curVal,
        currentWeight: Math.round(currentWeight * 10) / 10,
        targetWeight: Math.round(targetWeight * 10) / 10,
        targetValue: Math.round(targetValue),
        deltaEur: Math.round(deltaEur),
        action: deltaEur > 5 ? "Comprar" : deltaEur < -5 ? "Vender" : "Mantener"
      };
    });
  }, [funds, totalCurrent, rebalanceTargets, extraContribution]);

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-ink-2)]/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-white text-xs font-bold mb-1">{data.name}</p>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--color-accent)] font-bold">{data.weight}%</span>
            <span className="text-gray-400">({fmtEur(data.valueEur)})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. TER Weighted Fee */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-[var(--color-accent)]/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={15} className="text-[var(--color-accent)]" /> TER Medio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full font-bold">
              {analysis.averageTer <= 0.30 ? "Muy Bajo" : analysis.averageTer <= 0.80 ? "Moderado" : "Elevado"}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">
            {analysis.averageTer.toFixed(2)}% <span className="text-xs text-gray-500 font-normal">/ año</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-1">
            <span>Impacto anual:</span>
            <span className="text-white font-bold">{fmtEur(analysis.annualCostEur)}</span>
          </div>
        </div>

        {/* 2. Portfolio Risk Score */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-amber-400/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={15} className="text-amber-400" /> Nivel de Riesgo
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full font-bold">
              SRRI {analysis.weightedRiskScore}/7
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white mb-1">
            {analysis.weightedRiskScore <= 2 ? "Conservador" : analysis.weightedRiskScore <= 4 ? "Equilibrado" : analysis.weightedRiskScore <= 5 ? "Dinámico" : "Crecimiento"}
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 rounded-full"
              style={{ width: `${(analysis.weightedRiskScore / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* 3. Diversification Health */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-blue-400/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={15} className="text-blue-400" /> Diversificación
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-400/10 text-blue-400 rounded-full font-bold">
              {funds.length} Fondos
            </span>
          </div>
          <div className="text-xl font-bold text-white mb-1">
            {analysis.diversificationLevel}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Índice HHI: <span className="text-white font-bold">{analysis.hhiScore}</span> pts
          </div>
        </div>

        {/* 4. Total Return & Value */}
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-5 hover:border-purple-400/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={15} className="text-purple-400" /> Rentabilidad Total
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${totalProfitLoss >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
              {fmtPct(totalProfitLossPct)}
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${totalProfitLoss >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
            {totalProfitLoss >= 0 ? "+" : ""}{fmtEur(totalProfitLoss)}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Valor Cartera: <span className="text-white font-bold">{fmtEur(totalCurrent)}</span>
          </div>
        </div>

      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto">
        {[
          { key: "allocation", label: "Clases de Activos", icon: <PieIcon size={14} /> },
          { key: "sectors", label: "Exposición Sectorial", icon: <BarChart3 size={14} /> },
          { key: "geography", label: "Distribución Geográfica", icon: <Globe size={14} /> },
          { key: "holdings", label: "Top Empresas Subyacentes", icon: <Building2 size={14} /> },
          { key: "rebalance", label: "Simulador de Rebalanceo", icon: <Sliders size={14} /> },
          { key: "costs", label: "Impacto de Comisiones", icon: <Calculator size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === tab.key
                ? "bg-[var(--color-accent)] text-black shadow-[0_0_12px_rgba(57,255,136,0.25)]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: ASSET ALLOCATION ── */}
      {activeTab === "allocation" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart Left */}
          <div className="lg:col-span-5 bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-white mb-2 self-start flex items-center gap-2">
              <PieIcon size={16} className="text-[var(--color-accent)]" />
              Ponderación por Clase de Activo
            </h3>
            <p className="text-xs text-gray-400 mb-6 self-start">Distribución global de capital según categoría de inversión</p>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.assetClasses}
                    dataKey="weight"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {analysis.assetClasses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#050505" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="text-center font-mono text-xs text-gray-400 mt-2">
              Capital total distribuido: <span className="text-white font-bold">{fmtEur(totalCurrent)}</span>
            </div>
          </div>

          {/* Breakdown List Right */}
          <div className="lg:col-span-7 bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white mb-1">Desglose Detallado</h3>
            <p className="text-xs text-gray-400 mb-4">Capital asignado y peso porcentual por categoría</p>

            <div className="space-y-3">
              {analysis.assetClasses.map(item => (
                <div key={item.name} className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-white">{item.name}</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-white font-bold">{item.weight}%</span>
                      <span className="text-gray-400 ml-2">({fmtEur(item.valueEur)})</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.weight}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: SECTORS EXPOSURE ── */}
      {activeTab === "sectors" && (
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--color-accent)]" />
                Exposición a Sectores Económicos (GICS)
              </h3>
              <p className="text-xs text-gray-400">Ponderación efectiva agregada de todas las empresas en tus fondos</p>
            </div>
            
            {/* View Switcher */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 self-start">
              <button
                onClick={() => setChartViewMode("donut")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${chartViewMode === "donut" ? "bg-[var(--color-accent)] text-black" : "text-gray-400 hover:text-white"}`}
              >
                Donut
              </button>
              <button
                onClick={() => setChartViewMode("bar")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${chartViewMode === "bar" ? "bg-[var(--color-accent)] text-black" : "text-gray-400 hover:text-white"}`}
              >
                Barras
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Chart */}
            <div className="lg:col-span-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === "donut" ? (
                  <PieChart>
                    <Pie
                      data={analysis.sectors}
                      dataKey="weight"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {analysis.sectors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#050505" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                ) : (
                  <BarChart data={analysis.sectors.slice(0, 7)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} unit="%" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="weight" fill="var(--color-accent)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="lg:col-span-6 space-y-2.5">
              {analysis.sectors.map(s => (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300 font-medium">{s.name}</span>
                    <span className="font-mono text-white font-bold">{s.weight}% <span className="text-gray-500 font-normal">({fmtEur(s.valueEur)})</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.weight * 2.5}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 3: GEOGRAPHY ── */}
      {activeTab === "geography" && (
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe size={18} className="text-blue-400" />
              Distribución Geográfica y Regional
            </h3>
            <p className="text-xs text-gray-400">Exposición territorial de tus inversiones a nivel mundial</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.geography}
                    dataKey="weight"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {analysis.geography.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#050505" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-6 space-y-3">
              {analysis.geography.map(g => (
                <div key={g.name} className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="text-xs font-bold text-white">{g.name}</span>
                    </div>
                    <div className="font-mono text-xs">
                      <span className="text-white font-bold">{g.weight}%</span>
                      <span className="text-gray-400 ml-2">({fmtEur(g.valueEur)})</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${g.weight}%`, backgroundColor: g.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TOP UNDERLYING HOLDINGS ── */}
      {activeTab === "holdings" && (
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 size={18} className="text-[var(--color-accent)]" />
              Top 10 Empresas &amp; Activos Subyacentes Consolidados
            </h3>
            <p className="text-xs text-gray-400">
              Suma agregada del peso real que tienes en cada compañía a través de todos tus fondos indexados y ETFs
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Compañía / Activo</th>
                  <th className="pb-3 font-medium">Ticker</th>
                  <th className="pb-3 font-medium text-right">Peso Efectivo</th>
                  <th className="pb-3 font-medium text-right">Capital Invertido</th>
                  <th className="pb-3 font-medium">Fondos que la Incluyen</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-white/5">
                {analysis.topHoldings.map((h, idx) => (
                  <tr key={h.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 text-[var(--color-accent)] font-bold">#{idx + 1}</td>
                    <td className="py-3.5 font-bold text-white">{h.name}</td>
                    <td className="py-3.5">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[11px] text-gray-300">
                        {h.ticker || "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-bold text-white">{h.weight}%</td>
                    <td className="py-3.5 text-right text-[var(--color-accent)] font-bold">{fmtEur(h.valueEur)}</td>
                    <td className="py-3.5 text-gray-400 text-[11px] truncate max-w-xs" title={h.fundNames.join(", ")}>
                      {h.fundNames.join(", ") || "Fondo Global"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: REBALANCING SIMULATOR ── */}
      {activeTab === "rebalance" && (
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders size={18} className="text-[var(--color-accent)]" />
                Simulador de Rebalanceo de Cartera
              </h3>
              <p className="text-xs text-gray-400">
                Ajusta las ponderaciones objetivo deseadas (%) o introduce una aportación periódica para calcular la reubicación exacta
              </p>
            </div>

            {/* Extra contribution input */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-gray-400">Aportación Extra:</span>
              <input
                type="number"
                value={extraContribution || ""}
                onChange={(e) => setExtraContribution(Math.max(0, Number(e.target.value)))}
                placeholder="0 €"
                className="w-24 bg-transparent text-xs font-mono text-white text-right outline-none font-bold placeholder:text-gray-600"
              />
              <span className="text-xs text-gray-400">€</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Fondo</th>
                  <th className="pb-3 font-medium text-right">Valor Actual</th>
                  <th className="pb-3 font-medium text-right">Peso Actual</th>
                  <th className="pb-3 font-medium text-center">Peso Objetivo (%)</th>
                  <th className="pb-3 font-medium text-right">Valor Objetivo</th>
                  <th className="pb-3 font-medium text-right">Ajuste Requerido</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-white/5">
                {rebalancePlan.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5">
                      <div className="font-bold text-white truncate max-w-xs">{item.name}</div>
                      <div className="text-[10px] text-gray-500">{item.isin}</div>
                    </td>
                    <td className="py-3.5 text-right text-white font-bold">{fmtEur(item.currentValue)}</td>
                    <td className="py-3.5 text-right text-gray-400">{item.currentWeight}%</td>
                    <td className="py-3.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rebalanceTargets[item.id] !== undefined ? rebalanceTargets[item.id] : item.targetWeight}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value)));
                          setRebalanceTargets(prev => ({ ...prev, [item.id]: val }));
                        }}
                        className="w-16 bg-black/60 border border-white/15 focus:border-[var(--color-accent)] px-2 py-1 rounded-lg text-center font-bold text-white outline-none"
                      />
                    </td>
                    <td className="py-3.5 text-right font-bold text-white">{fmtEur(item.targetValue)}</td>
                    <td className="py-3.5 text-right">
                      <span className={`px-2.5 py-1 rounded font-bold text-[11px] ${
                        item.deltaEur > 5 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : item.deltaEur < -5 
                          ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                          : "bg-white/5 text-gray-400"
                      }`}>
                        {item.deltaEur > 0 ? `Comprar +${fmtEur(item.deltaEur)}` : item.deltaEur < 0 ? `Vender ${fmtEur(item.deltaEur)}` : "En objetivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 6: COST IMPACT CALCULATOR ── */}
      {activeTab === "costs" && (
        <div className="bg-[var(--color-ink-1)] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator size={18} className="text-[var(--color-accent)]" />
              Calculadora de Impacto de Comisiones y Gastos (TER Drag)
            </h3>
            <p className="text-xs text-gray-400">
              Proyección acumulada de costes de gestión anuales comparados con fondos indexados de bajo coste (0.10%)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-xs font-mono text-gray-400">Coste Anual Actual</span>
              <div className="text-xl font-bold font-mono text-white">{fmtEur(analysis.annualCostEur)} <span className="text-xs font-normal text-gray-500">/ año</span></div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Calculado sobre el {analysis.averageTer}% TER ponderado de tu cartera activa.
              </p>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-xs font-mono text-gray-400">Impacto a 10 Años (7% ret.)</span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {fmtEur(analysis.annualCostEur * 10 * 1.35)}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Incluyendo el coste de oportunidad del interés compuesto no generado.
              </p>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
              <span className="text-xs font-mono text-gray-400">Ahorro con Indexación Pura (0.10%)</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                +{fmtEur(Math.max(0, analysis.annualCostEur - (totalCurrent * 0.001)) * 10 * 1.35)}
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Ahorro neto proyectado en 10 años migrando a fondos Vanguard o Amundi.
              </p>
            </div>

          </div>

          {/* Performance Attribution Table */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Matriz de Atribución de Rentabilidad por Activo</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase">
                    <th className="pb-2 font-medium">Activo</th>
                    <th className="pb-2 font-medium text-right">Peso</th>
                    <th className="pb-2 font-medium text-right">Rentabilidad Fondo</th>
                    <th className="pb-2 font-medium text-right">Contribución a la Cartera</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 divide-y divide-white/5">
                  {analysis.attribution.map(a => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 text-white font-bold">{a.name}</td>
                      <td className="py-2.5 text-right text-gray-400">{a.weightPct}%</td>
                      <td className={`py-2.5 text-right font-bold ${a.retPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPct(a.retPct)}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${a.contributionPct >= 0 ? "text-[var(--color-accent)]" : "text-red-400"}`}>
                        {fmtPct(a.contributionPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
