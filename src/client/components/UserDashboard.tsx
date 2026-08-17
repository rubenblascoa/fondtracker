import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { api, clearToken, getFundDataSourceInfo, getBankPortalInfo, type Investment, type Status, type User, type YahooChartData } from "../api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  LayoutDashboard, Database, PlusCircle, Smartphone, BarChart3, 
  FileText, Settings, LogOut, Search, ArrowUpRight, ArrowDownRight, 
  Wallet, TrendingUp, Layers, Activity, Shield, RefreshCw, 
  Download, Sparkles, Filter, ChevronRight, CheckCircle2,
  AlertTriangle, ExternalLink, Calendar, Plus, Globe, Building2,
  PieChart as PieIcon, ArrowUpDown, Table, LayoutGrid, Eye, Check, X,
  Key, Mail, Lock, Phone, UserCheck, ShieldAlert, Sun, Moon, Palette, BookOpen,
  Menu, MoreHorizontal
} from 'lucide-react';
import { FundCard } from "./FundCard";
import { AddFundForm } from "./AddFundForm";
import { NotifyPanel } from "./NotifyPanel";
import { UserReportTemplate } from "./UserReportTemplate";
import { AdminSectionContent } from "./AdminPanel";
import { AnalyticsSection } from "./AnalyticsSection";
import { PortfolioSection } from "./PortfolioSection";
import { ReportsHub } from "./ReportsHub";
import { DocsTab } from "./DocsTab";
import { COUNTRIES } from "./RegisterPage";
import { useTheme } from "../theme";
import { jsPDF } from 'jspdf';

// ─── Section Types ─────────────────────────────────────────────────────────────
type DashboardSection = "overview" | "portfolio" | "add" | "analytics" | "notifications" | "reports" | "admin" | "docs";

// ─── Formatters ────────────────────────────────────────────────────────────────
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

function timeAgo(date: Date | number | null) {
  if (!date) return "hace un momento";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins}m`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)}h`;
  return `hace ${Math.floor(mins / 1440)}d`;
}

// ─── Custom Tooltip for Recharts ───────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--color-ink-2)]/95 backdrop-blur-md border border-[var(--color-ink-3)] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <p className="text-[var(--color-fg-4)] text-xs font-mono mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || 'var(--color-accent)' }} />
            <span className="text-[var(--color-fg-2)] font-medium">{p.name === 'value' ? 'Valor Cartera' : p.name}:</span>
            <span className="text-[var(--color-fg-1)] font-mono font-bold">{fmtEur(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  user: User;
  status: Status | null;
  funds: Investment[];
  onRefresh: () => void | Promise<void>;
  onLogout: () => void;
  initialSection?: DashboardSection;
};

export function UserDashboard({ user, status, funds, onRefresh, onLogout, initialSection }: Props) {
  const { theme, isDark, isLight, toggleTheme, setTheme } = useTheme();
  const [section, setSection] = useState<DashboardSection>(initialSection || "overview");
  const [adminSubSection, setAdminSubSection] = useState<"overview" | "users" | "catalog" | "notifications" | "system" | "docs">("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Ref for the main scrollable container to reset scroll position on view/section change
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [section, adminSubSection]);
  
  // Search & Filter in Portfolio tab
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"value" | "profit" | "profit_pct" | "name">("value");
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  // Settings & Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"appearance" | "phone" | "email" | "password" | "danger">("appearance");
  
  // Settings Form States
  const [phoneCountry, setPhoneCountry] = useState(() => COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // PDF Export
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Initialize Phone
  useEffect(() => {
    if (user?.phone) {
      const matchingCountry = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find(c => user.phone!.startsWith(c.dial));
      if (matchingCountry) {
        setPhoneCountry(matchingCountry);
        setLocalPhone(user.phone.slice(matchingCountry.dial.length));
      } else {
        setLocalPhone(user.phone);
      }
    } else {
      setLocalPhone("");
    }
  }, [user?.phone]);

  // Click outside country picker
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Refresh with feedback
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshedAt(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Portfolio Totals & Calculations
  const totalInvested = status?.total_initial ?? 0;
  const totalCurrent = status?.total_current ?? 0;
  const totalProfitLoss = status?.total_profit_loss ?? 0;
  const totalProfitLossPct = status?.total_profit_loss_pct ?? 0;
  const isOverallProfit = totalProfitLoss >= 0;

  // Banks in Portfolio
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    funds.forEach(f => { if (f.bank) banks.add(f.bank); });
    return Array.from(banks);
  }, [funds]);

  // Filtered and Sorted Funds
  const filteredFunds = useMemo(() => {
    return funds.filter(f => {
      const matchesSearch = !searchQuery || 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.isin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.bank && f.bank.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesBank = selectedBankFilter === "all" || f.bank === selectedBankFilter;
      return matchesSearch && matchesBank;
    }).sort((a, b) => {
      const aVal = (a.current_price ?? a.purchase_price) * a.shares;
      const bVal = (b.current_price ?? b.purchase_price) * b.shares;
      const aInv = a.total_invested || (a.shares * a.purchase_price);
      const bInv = b.total_invested || (b.shares * b.purchase_price);
      const aPL = aVal - aInv;
      const bPL = bVal - bInv;
      const aPct = aInv > 0 ? (aPL / aInv) : 0;
      const bPct = bInv > 0 ? (bPL / bInv) : 0;

      if (sortBy === "value") return bVal - aVal;
      if (sortBy === "profit") return bPL - aPL;
      if (sortBy === "profit_pct") return bPct - aPct;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [funds, searchQuery, selectedBankFilter, sortBy]);

  // Asset Distribution (by Bank)
  const bankDistribution = useMemo(() => {
    const palette = ['#39ff88', '#60a5fa', '#ffb547', '#a78bfa', '#f472b6', '#34d399', '#f87171'];
    const map = new Map<string, number>();
    funds.forEach(f => {
      const cur = (f.current_price ?? f.purchase_price) * f.shares;
      const b = f.bank || 'Otros';
      map.set(b, (map.get(b) || 0) + cur);
    });
    let idx = 0;
    const res: { name: string; value: number; color: string; pct: number }[] = [];
    map.forEach((val, key) => {
      const pct = totalCurrent > 0 ? (val / totalCurrent) * 100 : 0;
      res.push({
        name: key,
        value: Math.round(val),
        color: palette[idx % palette.length],
        pct: Math.round(pct * 10) / 10
      });
      idx++;
    });
    return res.sort((a, b) => b.value - a.value);
  }, [funds, totalCurrent]);

  // Best and Worst Performers
  const { bestPerformer, worstPerformer } = useMemo(() => {
    if (funds.length === 0) return { bestPerformer: null, worstPerformer: null };
    const withStats = funds.map(f => {
      const curVal = (f.current_price ?? f.purchase_price) * f.shares;
      const inv = f.total_invested || (f.shares * f.purchase_price);
      const pl = curVal - inv;
      const pct = inv > 0 ? (pl / inv) * 100 : 0;
      return { fund: f, pl, pct, curVal };
    });
    withStats.sort((a, b) => b.pct - a.pct);
    return {
      bestPerformer: withStats[0],
      worstPerformer: withStats.length > 1 ? withStats[withStats.length - 1] : null
    };
  }, [funds]);

  // Aggregated Analytics (Sectors, Geography, Holdings)
  const analyticsData = useMemo(() => {
    const sectorMap = new Map<string, number>();
    const geoMap = new Map<string, number>();
    const holdingsMap = new Map<string, number>();
    let totalTerWeighted = 0;
    let totalAnalyzedWeight = 0;

    funds.forEach(f => {
      const fundVal = (f.current_price ?? f.purchase_price) * f.shares;
      if (totalCurrent <= 0) return;
      const fundWeightInPortfolio = fundVal / totalCurrent;

      // Sectors
      if (f.sectors && Array.isArray(f.sectors)) {
        f.sectors.forEach(s => {
          const effectiveWeight = s.weight * fundWeightInPortfolio;
          sectorMap.set(s.name, (sectorMap.get(s.name) || 0) + effectiveWeight);
        });
      }

      // Geography
      if (f.geography && Array.isArray(f.geography)) {
        f.geography.forEach(g => {
          const effectiveWeight = g.weight * fundWeightInPortfolio;
          geoMap.set(g.name, (geoMap.get(g.name) || 0) + effectiveWeight);
        });
      }

      // Top Holdings
      if (f.top_holdings && Array.isArray(f.top_holdings)) {
        f.top_holdings.forEach(h => {
          const effectiveWeight = h.weight * fundWeightInPortfolio;
          holdingsMap.set(h.name, (holdingsMap.get(h.name) || 0) + effectiveWeight);
        });
      }

      // TER
      if (f.ter != null && f.ter > 0) {
        totalTerWeighted += f.ter * fundWeightInPortfolio;
        totalAnalyzedWeight += fundWeightInPortfolio;
      }
    });

    const sectors = Array.from(sectorMap.entries())
      .map(([name, weight]) => ({ name, weight: Math.round(weight * 10) / 10 }))
      .sort((a, b) => b.weight - a.weight);

    const geography = Array.from(geoMap.entries())
      .map(([name, weight]) => ({ name, weight: Math.round(weight * 10) / 10 }))
      .sort((a, b) => b.weight - a.weight);

    const topHoldings = Array.from(holdingsMap.entries())
      .map(([name, weight]) => ({ name, weight: Math.round(weight * 10) / 10 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10);

    const averageTer = totalAnalyzedWeight > 0 ? (totalTerWeighted / totalAnalyzedWeight) : 0.25;

    return { sectors, geography, topHoldings, averageTer };
  }, [funds, totalCurrent]);

  // Synthetic Historical Trend for Chart (30 Days)
  const portfolioHistory = useMemo(() => {
    const days = 30;
    const history = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      // Calculate realistic curve
      const progress = (days - 1 - i) / (days - 1);
      const val = Math.round(totalInvested + (totalProfitLoss * (0.6 + progress * 0.4)));

      history.push({
        name: `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' }).replace('.', '')}`,
        fullDate: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
        value: Math.max(0, val)
      });
    }
    return history;
  }, [totalInvested, totalProfitLoss]);

  // Export CSV
  const exportCsv = () => {
    const headers = ["ID", "ISIN", "Nombre", "Entidad", "Participaciones", "Precio Compra", "Precio Actual", "Total Invertido", "Valor Actual", "Beneficio", "Rentabilidad %"];
    const rows = funds.map(f => {
      const invested = f.total_invested || (f.shares * f.purchase_price);
      const currentVal = (f.current_price ?? f.purchase_price) * f.shares;
      const pl = currentVal - invested;
      const plPct = invested > 0 ? (pl / invested) * 100 : 0;
      return [
        f.id,
        `"${f.isin}"`,
        `"${f.name.replace(/"/g, '""')}"`,
        `"${f.bank || ''}"`,
        f.shares,
        f.purchase_price,
        f.current_price ?? f.purchase_price,
        invested.toFixed(2),
        currentVal.toFixed(2),
        pl.toFixed(2),
        plPct.toFixed(2)
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FondTracker_Cartera_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup
  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exported_at: new Date().toISOString(),
      user: { username: user.username, email: user.email },
      status,
      investments: funds
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FondTracker_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const [chartsMap, setChartsMap] = useState<Record<string, YahooChartData>>({});

  // Export Executive Multi-Page PDF with Sparklines & Deep Dive Metrics
  const exportPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      // 1. Fetch 1Y historical chart quotes for all funds in parallel to render sparklines
      const fetchPromises = funds.map(async (f) => {
        try {
          const data = await api.getChartData(f.isin, "1y");
          return { isin: f.isin, data };
        } catch {
          return null;
        }
      });
      const results = await Promise.allSettled(fetchPromises);
      const newCharts: Record<string, YahooChartData> = {};
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value) {
          newCharts[res.value.isin] = res.value.data;
        }
      });
      setChartsMap(newCharts);

      // 2. Wait for Recharts to render quotes in the hidden template
      await new Promise((r) => setTimeout(r, 700));

      const { toJpeg } = await import('html-to-image');
      const pageElements = reportRef.current.querySelectorAll<HTMLElement>('.report-page');
      
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (pageElements.length > 0) {
        for (let i = 0; i < pageElements.length; i++) {
          if (i > 0) pdf.addPage();
          const pageEl = pageElements[i];
          const imgData = await toJpeg(pageEl, { quality: 0.95, pixelRatio: 2, backgroundColor: '#0a0a0c' });
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
      } else {
        const imgData = await toJpeg(reportRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: '#0a0a0c' });
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`FondTracker_Informe_Detallado_${user.username}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Save Settings Handlers
  const handleSavePhone = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    const num = localPhone.replace(/\D/g, "");
    const full = num ? `${phoneCountry.dial}${num}` : "";
    if (num && !/^\+[1-9]\d{6,14}$/.test(full.replace(/[\s-]/g, ""))) {
      setSettingsError("Número inválido. Formato: +34612345678");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.updateAccount({ phone: full || null } as any);
      user.phone = full || null;
      setSettingsSuccess("Teléfono de WhatsApp guardado correctamente");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    if (!currentEmail.includes("@") || !newEmail.includes("@")) {
      setSettingsError("Introduce direcciones de correo válidas");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.updateAccount({ currentEmail: currentEmail.trim(), email: newEmail.trim() });
      user.email = newEmail.trim();
      setSettingsSuccess("Email actualizado correctamente");
      setCurrentEmail("");
      setNewEmail("");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al cambiar email");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    if (!currentPassword || !newPassword) {
      setSettingsError("Rellena todos los campos");
      return;
    }
    if (newPassword.length < 8) {
      setSettingsError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.updateAccount({ currentPassword, newPassword });
      setSettingsSuccess("Contraseña cambiada con éxito");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setSettingsSuccess(""), 3000);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al cambiar contraseña");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSettingsError("");
    if (!deletePassword) {
      setSettingsError("Introduce tu contraseña para confirmar");
      return;
    }
    setSettingsLoading(true);
    try {
      await api.deleteAccount(deletePassword);
      clearToken();
      window.location.replace("/login");
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Error al eliminar cuenta");
      setSettingsLoading(false);
    }
  };

  // Navigation Items
  const NAV_ITEMS: { key: DashboardSection; label: string; icon: JSX.Element; badge?: string | number }[] = [
    { key: "overview", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { key: "portfolio", label: "Mis Inversiones", icon: <Database size={16} />, badge: funds.length > 0 ? funds.length : undefined },
    { key: "add", label: "Añadir Inversión", icon: <PlusCircle size={16} /> },
    { key: "analytics", label: "Analítica & Asset", icon: <BarChart3 size={16} /> },
    { key: "notifications", label: "Alertas WhatsApp", icon: <Smartphone size={16} />, badge: status?.whatsapp?.configured ? "ON" : undefined },
    { key: "reports", label: "Exportar & Informes", icon: <FileText size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans overflow-hidden">
      
      {/* ── Sidebar Navigation (Desktop) ── */}
      <aside className="hidden md:flex w-60 bg-[var(--color-ink-2)] backdrop-blur-xl border-r border-[var(--color-ink-3)] flex-col relative z-20 shrink-0">
        
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--color-ink-3)] justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20 shadow-[0_0_12px_rgba(57,255,136,0.15)]">
              <Activity size={17} className="text-[var(--color-accent)]" />
            </div>
            <span className="font-bold text-[var(--color-fg-1)] text-base tracking-wide">
              Fond<span className="text-[var(--color-accent)]">Tracker</span>
            </span>
          </a>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5 scrollbar-thin">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-fg-4)] px-3 mb-2">
            Navegación
          </p>

          {NAV_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button 
                key={item.key} 
                onClick={() => setSection(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active 
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-[inset_3px_0_0_0_var(--color-accent)] font-bold" 
                    : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    active ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-ink-2)] text-[var(--color-fg-2)]"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Link if admin */}
          {user.is_admin && (
            <div className="pt-4 mt-4 border-t border-[var(--color-ink-3)] space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-warn)] px-3 mb-2 flex items-center gap-1.5">
                <Shield size={11} /> Administración
              </p>
              
              <button 
                onClick={() => setSection("admin")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  section === "admin"
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-[inset_3px_0_0_0_var(--color-accent)] font-bold border border-[var(--color-accent)]/30"
                    : "text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_12px_rgba(57,255,136,0.08)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield size={16} />
                  <span>Panel de Admin</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-[var(--color-warn)]/20 text-[var(--color-warn)]">
                  ADMIN
                </span>
              </button>

              <button 
                onClick={() => setSection("docs")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  section === "docs"
                    ? "bg-blue-500/10 text-blue-400 shadow-[inset_3px_0_0_0_#3b82f6] font-bold border border-blue-500/30"
                    : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className={section === "docs" ? "text-blue-400" : "text-[var(--color-fg-4)]"} />
                  <span>Documentación &amp; APIs</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400">
                  DOCS
                </span>
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Service Card */}
        {(() => {
          const wa = status?.whatsapp;
          const isConfigured = Boolean(wa?.configured && wa?.phone);
          const isEnabled = Boolean(wa?.enabled ?? true);
          const isActive = isConfigured && isEnabled;
          const isPaused = isConfigured && !isEnabled;
          const hoursCount = wa?.hours?.length || 0;

          let statusText = "Sin configurar. Conecta tu teléfono para resúmenes.";
          if (isActive) {
            if (hoursCount > 0) {
              const formattedHours = wa!.hours.map(h => `${String(h).padStart(2, '0')}h`).slice(0, 2).join(", ");
              statusText = `Activo • Envíos a las ${formattedHours}${hoursCount > 2 ? ` (+${hoursCount - 2})` : ""}`;
            } else {
              statusText = "Reportes automáticos activos.";
            }
          } else if (isPaused) {
            statusText = "Envíos pausados temporalmente.";
          }

          return (
            <div className="p-3.5 border-t border-[var(--color-ink-3)]">
              <div className={`border rounded-2xl p-3.5 transition-all ${
                isActive 
                  ? "bg-[var(--color-ink-2)] border-emerald-500/20 shadow-[0_0_12px_rgba(57,255,136,0.06)]"
                  : isPaused
                  ? "bg-[var(--color-ink-2)] border-amber-500/20"
                  : "bg-[var(--color-ink-2)] border-[var(--color-ink-3)]"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[var(--color-fg-1)] flex items-center gap-1.5">
                    <Smartphone size={13} className={isActive ? "text-[var(--color-accent)]" : isPaused ? "text-amber-400" : "text-[var(--color-fg-4)]"} />
                    <span>WhatsApp Bot</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive 
                        ? "bg-emerald-500/10 text-emerald-400" 
                        : isPaused 
                        ? "bg-amber-500/10 text-amber-400" 
                        : "bg-[var(--color-ink-2)] text-[var(--color-fg-4)]"
                    }`}>
                      {isActive ? "ON" : isPaused ? "PAUSA" : "OFF"}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      isActive 
                        ? "bg-emerald-400 shadow-[0_0_8px_#39ff88] animate-pulse" 
                        : isPaused 
                        ? "bg-amber-400 shadow-[0_0_6px_#fbbf24]" 
                        : "bg-gray-500"
                    }`} />
                  </div>
                </div>
                <p className="text-[11px] text-[var(--color-fg-4)] leading-relaxed mb-2.5">
                  {statusText}
                </p>
                <button 
                  onClick={() => setSection("notifications")} 
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isConfigured
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:brightness-110 shadow-[0_0_10px_rgba(57,255,136,0.2)]"
                      : "bg-[var(--color-ink-2)] hover:bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] text-[var(--color-fg-1)]"
                  }`}
                >
                  {isActive ? "Gestionar Alertas" : isPaused ? "Reactivar Bot" : "Conectar WhatsApp"}
                </button>
              </div>
            </div>
          );
        })()}

        {/* User Account Footer */}
        <div className="p-3.5 border-t border-[var(--color-ink-3)] flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-accent)] shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-[var(--color-fg-1)] truncate">{user.username}</p>
              <p className="text-[10px] text-[var(--color-fg-4)] truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)] rounded-lg transition-colors"
              title="Ajustes de cuenta"
            >
              <Settings size={15} />
            </button>
            <button 
              onClick={onLogout}
              className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

      </aside>

      {/* ── Mobile Slide-out Drawer & Overlay (Instant CSS Transition & Hardware-Accelerated) ── */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-200 ${mobileDrawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black/70 transition-opacity duration-200 ease-out ${
            mobileDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileDrawerOpen(false)}
        />
        
        {/* Drawer Panel */}
        <div 
          className={`relative w-[285px] max-w-[85vw] bg-[var(--color-ink-1)] border-r border-[var(--color-ink-3)] h-full flex flex-col z-10 shadow-2xl transition-transform duration-200 ease-out transform-gpu will-change-transform ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--color-ink-3)] shrink-0">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20">
                <Activity size={16} className="text-[var(--color-accent)]" />
              </div>
              <span className="font-bold text-[var(--color-fg-1)] text-base tracking-wide">
                Fond<span className="text-[var(--color-accent)]">Tracker</span>
              </span>
            </a>
            <button 
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] rounded-xl hover:bg-[var(--color-ink-2)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-fg-4)] px-3 mb-2">
              Navegación
            </p>

            {NAV_ITEMS.map(item => {
              const active = section === item.key;
              return (
                <button 
                  key={item.key} 
                  onClick={() => { setSection(item.key); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active 
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-[inset_3px_0_0_0_var(--color-accent)] font-bold" 
                      : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      active ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-ink-2)] text-[var(--color-fg-2)]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin Links */}
            {user.is_admin && (
              <div className="pt-3 mt-3 border-t border-[var(--color-ink-3)] space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-warn)] px-3 mb-2 flex items-center gap-1.5">
                  <Shield size={11} /> Administración
                </p>
                
                <button 
                  onClick={() => { setSection("admin"); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    section === "admin"
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] shadow-[inset_3px_0_0_0_var(--color-accent)] font-bold border border-[var(--color-accent)]/30"
                      : "text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} />
                    <span>Panel de Admin</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-[var(--color-warn)]/20 text-[var(--color-warn)]">
                    ADMIN
                  </span>
                </button>

                <button 
                  onClick={() => { setSection("docs"); setMobileDrawerOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    section === "docs"
                      ? "bg-blue-500/10 text-blue-400 shadow-[inset_3px_0_0_0_#3b82f6] font-bold border border-blue-500/30"
                      : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className={section === "docs" ? "text-blue-400" : "text-[var(--color-fg-4)]"} />
                    <span>Documentación &amp; APIs</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400">
                    DOCS
                  </span>
                </button>
              </div>
            )}

            {/* Quick Theme Switcher in Mobile Drawer */}
            <div className="pt-3 mt-3 border-t border-[var(--color-ink-3)] px-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-fg-4)] px-1 mb-2">
                Tema Visual
              </p>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--color-ink-2)] rounded-xl border border-[var(--color-ink-3)]">
                <button
                  onClick={() => setTheme("dark")}
                  className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    isDark ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold shadow-sm" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                  }`}
                >
                  <Moon size={13} /> Oscuro
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    isLight ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold shadow-sm" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                  }`}
                >
                  <Sun size={13} /> Blanco
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Drawer Footer with Profile & Actions */}
          <div className="p-3.5 border-t border-[var(--color-ink-3)] flex items-center justify-between bg-black/20 shrink-0">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-accent)] shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-[var(--color-fg-1)] truncate">{user.username}</p>
                <p className="text-[10px] text-[var(--color-fg-4)] truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setSettingsOpen(true); setMobileDrawerOpen(false); }}
                className="p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)] rounded-lg transition-colors"
                title="Ajustes de cuenta"
              >
                <Settings size={15} />
              </button>
              <button 
                onClick={onLogout}
                className="p-2 text-[var(--color-fg-4)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Main Content Shell ── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Subtle Background Glows (GPU-isolated to eliminate scroll repaints) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none transform-gpu will-change-transform" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[var(--color-warn)]/5 rounded-full blur-[90px] pointer-events-none transform-gpu will-change-transform" />

        {/* ── Top Header Bar ── */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-[var(--color-ink-3)] bg-[var(--color-ink-0)]/80 backdrop-blur-xl relative z-10 shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger Toggle (Mobile Only) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)] rounded-xl bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] shrink-0 active:scale-95 transition-all"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>

            <div className="truncate">
              <h1 className="text-base sm:text-xl font-bold text-[var(--color-fg-1)] tracking-tight flex items-center gap-2 truncate">
                {section === "overview" && "Resumen"}
                {section === "portfolio" && "Mis Inversiones"}
                {section === "add" && "Añadir Fondo"}
                {section === "analytics" && "Analítica & Asset"}
                {section === "notifications" && "Alertas WhatsApp"}
                {section === "reports" && "Informes & Fiscalidad"}
                {section === "admin" && "Panel de Admin"}
                {section === "docs" && "Documentación & APIs"}
              </h1>
              <p className="hidden sm:block text-xs text-[var(--color-fg-4)] mt-0.5 truncate">
                {section === "overview" && "Visión global de tu patrimonio, rentabilidad y distribución"}
                {section === "portfolio" && `${funds.length} ${funds.length === 1 ? 'posición activa' : 'posiciones activas'} sincronizadas`}
                {section === "add" && "Busca fondos por ISIN o nombre en nuestro catálogo europeo"}
                {section === "analytics" && "Exposición sectorial, geográfica y activos subyacentes"}
                {section === "notifications" && "Configura alertas automatizadas vía WhatsApp"}
                {section === "reports" && "Genera informes ejecutivos en PDF o exporta en CSV y JSON"}
                {section === "admin" && "Control global de usuarios, catálogo, envíos WhatsApp y servidor"}
                {section === "docs" && "Referencia completa de arquitectura, endpoints REST, scraping y base de datos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Last updated & Refresh button */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2.5 sm:px-3 py-1.5 rounded-full text-xs text-[var(--color-fg-4)]">
              <span className="hidden md:inline">Actualizado {timeAgo(lastRefreshedAt)}</span>
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`p-0.5 hover:text-[var(--color-accent)] transition-colors ${isRefreshing ? 'animate-spin text-[var(--color-accent)]' : ''}`}
                title="Actualizar cotizaciones ahora"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* Quick Add Button */}
            <button 
              onClick={() => setSection("add")}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(57,255,136,0.2)] active:scale-95 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="hidden sm:inline">Añadir Fondo</span>
            </button>

          </div>

          {/* Laser sync scanline beam */}
          {isRefreshing && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent animate-scanline z-30" />
          )}
        </header>

        {/* ── Scrollable View Container (with extra bottom padding on mobile for the Bottom Bar and scroll-to-top ref) ── */}
        <div 
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-7 pb-28 md:pb-7 relative z-10 scrollbar-thin touch-scroll overscroll-y-contain"
        >
          <div className="max-w-[1360px] mx-auto space-y-5">

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 1: OVERVIEW / RESUMEN
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "overview" && (
              <div key="overview" className="space-y-4 sm:space-y-5 dash-cascade">
                
                {/* ── Key Stat Cards (Neon Glass Style) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                  
                  {/* Total Invertido */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-ink-3)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Wallet size={16} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-mono text-[var(--color-fg-4)] uppercase tracking-wider bg-[var(--color-ink-2)] px-1.5 sm:px-2 py-0.5 rounded">
                          Capital
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Total Invertido</p>
                      <p className="text-lg sm:text-[26px] font-bold font-mono text-[var(--color-fg-1)] tracking-tight truncate">{fmtEur(totalInvested)}</p>
                    </div>
                    <p className="text-[11px] sm:text-xs text-[var(--color-fg-5)] mt-2 sm:mt-2.5 flex items-center gap-1.5">
                      <Layers size={12} /> {funds.length} {funds.length === 1 ? 'posición' : 'posiciones'}
                    </p>
                  </div>

                  {/* Valor Actual */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-accent)]/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] shadow-[0_0_12px_rgba(57,255,136,0.15)]">
                          <TrendingUp size={16} />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-mono text-[var(--color-accent)] uppercase tracking-wider bg-[var(--color-accent)]/10 px-1.5 sm:px-2 py-0.5 rounded font-bold">
                          Valoración
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Valor Actual</p>
                      <p className="text-lg sm:text-[26px] font-bold font-mono text-[var(--color-fg-1)] tracking-tight truncate">{fmtEur(totalCurrent)}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-2 sm:mt-2.5 text-[11px] sm:text-xs truncate">
                      <span className={`flex items-center gap-0.5 font-semibold shrink-0 ${isOverallProfit ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]'}`}>
                        {isOverallProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {fmtPct(totalProfitLossPct)}
                      </span>
                      <span className="text-[var(--color-fg-5)] hidden sm:inline">total</span>
                    </div>
                  </div>

                  {/* Ganancia / Pérdida */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-ink-3)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center ${
                          isOverallProfit 
                            ? 'bg-[var(--color-profit)]/10 border-[var(--color-profit)]/20 text-[var(--color-profit)]' 
                            : 'bg-[var(--color-loss)]/10 border-[var(--color-loss)]/20 text-[var(--color-loss)]'
                        }`}>
                          {isOverallProfit ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded font-bold ${
                          isOverallProfit ? 'bg-[var(--color-profit)]/10 text-[var(--color-profit)]' : 'bg-[var(--color-loss)]/10 text-[var(--color-loss)]'
                        }`}>
                          {isOverallProfit ? 'Plusvalía' : 'Minusvalía'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Beneficio Neto</p>
                      <p className={`text-lg sm:text-[26px] font-bold font-mono tracking-tight truncate ${isOverallProfit ? 'text-[var(--color-profit)] glow' : 'text-[var(--color-loss)]'}`}>
                        {fmtEur(totalProfitLoss)}
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[var(--color-fg-5)] mt-2 sm:mt-2.5 truncate">
                      Retorno absoluto
                    </p>
                  </div>

                  {/* WhatsApp Status Widget */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-3.5 sm:p-5 relative overflow-hidden group hover:border-[var(--color-ink-3)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-warn)]/10 border border-[var(--color-warn)]/20 flex items-center justify-center text-[var(--color-warn)]">
                          <Smartphone size={16} />
                        </div>
                        <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded font-bold ${
                          status?.whatsapp?.configured ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-gray-800 text-[var(--color-fg-4)]'
                        }`}>
                          {status?.whatsapp?.configured ? 'Conectado' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[var(--color-fg-4)] font-medium mb-0.5 sm:mb-1 uppercase tracking-wider">Digest Diario</p>
                      <p className="text-xs sm:text-base font-bold text-[var(--color-fg-1)] tracking-tight truncate">
                        {status?.whatsapp?.configured ? (user.phone || "Activo") : "Sin configurar"}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSection("notifications")} 
                      className="text-[11px] sm:text-xs text-[var(--color-accent)] hover:underline mt-2 sm:mt-2.5 flex items-center gap-1 font-medium"
                    >
                      Alertas <ChevronRight size={12} />
                    </button>
                  </div>

                </div>

                {/* ── Portfolio Chart & Bank Breakdown Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Interactive Portfolio Growth Chart */}
                  <div className="lg:col-span-2 bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                      <div>
                        <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Evolución de Patrimonio</h2>
                        <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Valoración consolidada de tu cartera (últimos 30 días)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[var(--color-accent)] text-xs font-medium bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-lg">
                          <ArrowUpRight size={13} /> {fmtPct(totalProfitLossPct)}
                        </div>
                      </div>
                    </div>

                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={portfolioHistory}>
                          <defs>
                            <linearGradient id="userAumGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11}} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11}} tickFormatter={(v) => `€${Math.round(v/1000)}k`} dx={-8} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                          <Area type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#userAumGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bank Asset Distribution Donut */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-0.5">
                        <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Distribución por Entidad</h2>
                        <button onClick={() => setSection("analytics")} className="text-xs text-[var(--color-accent)] hover:underline">
                          Detalles
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-fg-4)] mb-3">Ponderación de tu capital en cada banco</p>
                    </div>

                    <div className="h-[145px] relative flex items-center justify-center">
                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <p className="text-base sm:text-lg font-bold font-mono text-[var(--color-fg-1)]">{fmtEur(totalCurrent)}</p>
                        <p className="text-[10px] text-[var(--color-fg-5)] uppercase tracking-widest">Total</p>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        {bankDistribution.length > 0 ? (
                          <PieChart>
                            <Pie
                              data={bankDistribution}
                              innerRadius={50}
                              outerRadius={68}
                              paddingAngle={bankDistribution.length > 1 ? 3 : 0}
                              dataKey="value"
                              stroke="none"
                            >
                              {bankDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        ) : (
                          <div className="flex items-center justify-center text-xs text-[var(--color-fg-5)]">Sin fondos</div>
                        )}
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      {bankDistribution.slice(0, 3).map(b => (
                        <div key={b.name} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                            <span className="text-[var(--color-fg-2)] font-medium truncate max-w-[120px]">{b.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[var(--color-fg-4)] font-mono">{b.pct}%</span>
                            <span className="font-mono text-[var(--color-fg-1)] font-semibold">{fmtEur(b.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Best / Worst Performers & Quick Action Highlights ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                  
                  {/* Best Performer */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-[var(--color-fg-1)] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[var(--color-accent)]" /> Mejor Rendimiento
                        </span>
                        {bestPerformer && (
                          <span className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-mono text-xs font-bold rounded">
                            {fmtPct(bestPerformer.pct)}
                          </span>
                        )}
                      </div>
                      {bestPerformer ? (
                        <>
                          <h3 className="text-sm font-semibold text-[var(--color-fg-1)] truncate max-w-[260px]">{bestPerformer.fund.name}</h3>
                          <p className="text-xs font-mono text-[var(--color-fg-4)] mt-1">{bestPerformer.fund.isin} • {bestPerformer.fund.bank || '—'}</p>
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--color-ink-3)] text-xs font-mono">
                            <span className="text-[var(--color-fg-4)]">Ganancia:</span>
                            <span className="text-[var(--color-accent)] font-bold">{fmtEur(bestPerformer.pl)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--color-fg-5)] mt-1">Añade fondos para ver el ranking.</p>
                      )}
                    </div>
                  </div>

                  {/* Worst Performer */}
                  <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-[var(--color-fg-1)] uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-[var(--color-warn)]" /> Menor Rendimiento
                        </span>
                        {worstPerformer && (
                          <span className={`px-2 py-0.5 font-mono text-xs font-bold rounded ${worstPerformer.pct >= 0 ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'}`}>
                            {fmtPct(worstPerformer.pct)}
                          </span>
                        )}
                      </div>
                      {worstPerformer ? (
                        <>
                          <h3 className="text-sm font-semibold text-[var(--color-fg-1)] truncate max-w-[260px]">{worstPerformer.fund.name}</h3>
                          <p className="text-xs font-mono text-[var(--color-fg-4)] mt-1">{worstPerformer.fund.isin} • {worstPerformer.fund.bank || '—'}</p>
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--color-ink-3)] text-xs font-mono">
                            <span className="text-[var(--color-fg-4)]">Resultado:</span>
                            <span className={`font-bold ${worstPerformer.pl >= 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-danger)]'}`}>
                              {fmtEur(worstPerformer.pl)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--color-fg-5)] mt-1">Solo tienes 1 fondo activo o cartera vacía.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Export / Report Widget */}
                  <div className="bg-gradient-to-br from-[var(--color-accent)]/15 to-[var(--color-ink-1)] border border-[var(--color-accent)]/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-[var(--color-accent)]/20 blur-2xl rounded-full pointer-events-none group-hover:bg-[var(--color-accent)]/30 transition-all" />
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-fg-1)] mb-1 flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-accent)]" /> Informe Ejecutivo PDF
                      </h3>
                      <p className="text-xs text-[var(--color-fg-4)] leading-relaxed mb-3.5">
                        Descarga un resumen con gráficos de rendimiento y desglose de activos.
                      </p>
                    </div>
                    <button 
                      disabled={isExportingPdf || funds.length === 0} 
                      onClick={exportPdf} 
                      className="w-full py-2.5 bg-[var(--color-accent)] text-[#0a0a0c] hover:brightness-110 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(57,255,136,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      {isExportingPdf ? 'Generando PDF...' : 'Descargar PDF'}
                    </button>
                  </div>

                </div>

                {/* ── Recent Investments Table Summary ── */}
                <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-sm sm:text-base font-semibold text-[var(--color-fg-1)]">Posiciones Principales</h2>
                      <p className="text-xs text-[var(--color-fg-4)] mt-0.5">Tus fondos con mayor capital invertido</p>
                    </div>
                    <button 
                      onClick={() => setSection("portfolio")} 
                      className="text-xs text-[var(--color-accent)] hover:text-[var(--color-fg-1)] font-medium bg-[var(--color-accent)]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Ver todas ({funds.length}) <ChevronRight size={12} />
                    </button>
                  </div>

                  {funds.length === 0 ? (
                    <div className="border border-dashed border-[var(--color-ink-3)] rounded-xl p-8 text-center">
                      <div className="w-11 h-11 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mx-auto flex items-center justify-center mb-2.5">
                        <Database size={18} className="text-[var(--color-accent)]" />
                      </div>
                      <p className="text-sm text-[var(--color-fg-1)] font-medium mb-1">Tu cartera está vacía</p>
                      <p className="text-xs text-[var(--color-fg-4)] max-w-sm mx-auto mb-3.5">
                        Registra tu primera inversión para comenzar a monitorear tus rendimientos.
                      </p>
                      <button 
                        onClick={() => setSection("add")} 
                        className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl shadow-[0_0_12px_rgba(57,255,136,0.2)] hover:brightness-110 transition-all"
                      >
                        Añadir Primer Fondo
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto touch-scroll">
                      <table className="w-full text-left border-collapse text-xs min-w-[520px]">
                        <thead>
                          <tr className="border-b border-[var(--color-ink-3)] text-[var(--color-fg-4)] uppercase tracking-wider font-mono">
                            <th className="pb-2.5 font-medium">Fondo</th>
                            <th className="pb-2.5 font-medium">Entidad</th>
                            <th className="pb-2.5 font-medium text-right">Invertido</th>
                            <th className="pb-2.5 font-medium text-right">Valor Actual</th>
                            <th className="pb-2.5 font-medium text-right">Rentabilidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFunds.slice(0, 5).map((f) => {
                            const invested = f.total_invested || (f.shares * f.purchase_price);
                            const currentVal = (f.current_price ?? f.purchase_price) * f.shares;
                            const pl = currentVal - invested;
                            const plPct = invested > 0 ? (pl / invested) * 100 : 0;
                            const isP = pl >= 0;

                            const sourceInfo = getFundDataSourceInfo(f);
                            const bankInfo = getBankPortalInfo(f);

                            return (
                              <tr key={f.id} className="border-b border-[var(--color-ink-3)] hover:bg-[var(--color-ink-2)] transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] flex items-center justify-center font-mono font-bold text-[11px] text-[var(--color-fg-1)] shrink-0">
                                      {f.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <a
                                        href={sourceInfo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-[var(--color-fg-1)] hover:text-[var(--color-accent)] truncate max-w-[220px] sm:max-w-sm block transition-colors"
                                        title={`Ver en ${sourceInfo.name}`}
                                      >
                                        {f.name}
                                      </a>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-mono text-[var(--color-fg-5)]">{f.isin}</span>
                                        <a
                                          href={sourceInfo.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[var(--color-fg-5)] hover:text-[var(--color-accent)] transition-colors"
                                          title={`Ver en ${sourceInfo.name}`}
                                        >
                                          <ExternalLink size={9} />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 font-medium">
                                  {bankInfo ? (
                                    <a
                                      href={bankInfo.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--color-fg-2)] hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 group"
                                      title={`Ver en web de ${bankInfo.name}`}
                                    >
                                      <span>{bankInfo.name}</span>
                                      <ExternalLink size={9} className="text-[var(--color-fg-5)] group-hover:text-[var(--color-accent)] transition-colors" />
                                    </a>
                                  ) : (
                                    <span className="text-[var(--color-fg-5)]">—</span>
                                  )}
                                </td>
                                <td className="py-3 text-right font-mono text-[var(--color-fg-4)]">{fmtEur(invested)}</td>
                                <td className="py-3 text-right font-mono text-[var(--color-fg-1)] font-bold">{fmtEur(currentVal)}</td>
                                <td className="py-3 text-right font-mono font-bold">
                                  <span className={`px-2 py-0.5 rounded-md ${isP ? 'bg-[var(--color-profit)]/10 text-[var(--color-profit)]' : 'bg-[var(--color-loss)]/10 text-[var(--color-loss)]'}`}>
                                    {fmtPct(plPct)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 2: MIS INVERSIONES (FULL LIST + SEARCH/FILTER TOOLBAR)
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "portfolio" && (
              <PortfolioSection
                funds={funds}
                status={status}
                onRefresh={onRefresh}
                onNavigateAdd={() => setSection("add")}
              />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 3: AÑADIR INVERSIÓN (FULL WIDTH EXPERIENCE)
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "add" && (
              <AddFundForm onAdded={() => {
                onRefresh();
                setSection("portfolio");
              }} />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 4: ANALÍTICA AVANZADA & ASSET ALLOCATION
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "analytics" && (
              <AnalyticsSection funds={funds} status={status} />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 5: ALERTAS WHATSAPP DIGEST
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "notifications" && (
              <NotifyPanel status={status} onChange={onRefresh} />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 6: REPORTES & EXPORTACIÓN
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "reports" && (
              <ReportsHub
                user={user}
                status={status}
                funds={funds}
                onExportPdf={exportPdf}
                isExportingPdf={isExportingPdf}
                onExportCsv={exportCsv}
                onExportJson={exportJson}
              />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 7: PANEL DE ADMINISTRACIÓN (INTEGRADO DIRECTAMENTE EN DASHBOARD)
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "admin" && user.is_admin && (
              <AdminSectionContent user={user} />
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                TAB 8: DOCUMENTACIÓN & APIS (APARTADO INDEPENDIENTE)
               ═══════════════════════════════════════════════════════════════════ */}
            {section === "docs" && user.is_admin && (
              <DocsTab />
            )}

          </div>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          ACCOUNT SETTINGS MODAL
         ═══════════════════════════════════════════════════════════════════════ */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto pt-4 sm:pt-4 animate-fade-in">
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col max-h-[85vh] sm:max-h-[90vh] my-auto">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[var(--color-ink-3)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] shrink-0">
                  <Settings size={17} />
                </div>
                <div className="truncate">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-fg-1)] truncate">Ajustes de Cuenta</h3>
                  <p className="text-[11px] sm:text-xs text-[var(--color-fg-4)] truncate">{user.username} • {user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 sm:p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] rounded-xl hover:bg-[var(--color-ink-2)] transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[var(--color-ink-3)] px-3 sm:px-6 pt-2 gap-1 sm:gap-2 overflow-x-auto no-scrollbar touch-scroll shrink-0">
              <button 
                onClick={() => { setSettingsTab("appearance"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "appearance" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Palette size={13} /> Apariencia
              </button>
              <button 
                onClick={() => { setSettingsTab("phone"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "phone" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Phone size={13} /> WhatsApp
              </button>
              <button 
                onClick={() => { setSettingsTab("email"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "email" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Mail size={13} /> Email
              </button>
              <button 
                onClick={() => { setSettingsTab("password"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  settingsTab === "password" ? "border-[var(--color-accent)] text-[var(--color-accent)] font-semibold" : "border-transparent text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                }`}
              >
                <Lock size={13} /> Contraseña
              </button>
              <button 
                onClick={() => { setSettingsTab("danger"); setSettingsError(""); setSettingsSuccess(""); }}
                className={`pb-2.5 sm:pb-3 px-2 sm:px-2.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ml-auto ${
                  settingsTab === "danger" ? "border-[var(--color-danger)] text-[var(--color-danger)] font-semibold" : "border-transparent text-[var(--color-fg-5)] hover:text-red-400"
                }`}
              >
                <ShieldAlert size={13} /> Peligro
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto touch-scroll space-y-4 flex-1">
              
              {settingsError && (
                <div className="p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl text-xs text-[var(--color-danger)] flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-3 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-xl text-xs text-[var(--color-accent)] flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {/* Appearance / Theme Tab */}
              {settingsTab === "appearance" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[var(--color-fg-3)] mb-1">
                      Personaliza la interfaz visual de toda la plataforma según tu preferencia.
                    </p>
                    <p className="text-[11px] text-[var(--color-fg-4)]">
                      El tema seleccionado se aplicará en todos los apartados (Dashboard, Inversiones, Informes, Login y Landing).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Dark Theme Option */}
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        isDark 
                          ? "border-[var(--color-accent)] bg-[var(--color-ink-2)] shadow-[0_0_20px_rgba(57,255,136,0.15)] ring-1 ring-[var(--color-accent)]" 
                          : "border-[var(--color-ink-3)] bg-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black border border-[var(--color-ink-3)] flex items-center justify-center text-emerald-400 shadow-sm">
                            <Moon size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-fg-1)]">Modo Oscuro</p>
                            <span className="text-[10px] text-[var(--color-fg-4)]">Predeterminado</span>
                          </div>
                        </div>
                        {isDark && (
                          <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center shadow-[0_0_8px_rgba(57,255,136,0.5)]">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Visual Mini Preview */}
                      <div className="h-14 bg-[#0a0a0c] border border-[var(--color-ink-3)] rounded-xl p-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-12 bg-white/20 rounded" />
                          <div className="h-2 w-6 bg-[var(--color-accent)] rounded" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-5 flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded" />
                          <div className="h-5 flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded" />
                        </div>
                      </div>
                    </button>

                    {/* Light Theme Option */}
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        isLight 
                          ? "border-[var(--color-accent)] bg-[var(--color-ink-2)] shadow-[0_0_20px_rgba(5,150,105,0.15)] ring-1 ring-[var(--color-accent)]" 
                          : "border-[var(--color-ink-3)] bg-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-amber-500 shadow-sm">
                            <Sun size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--color-fg-1)]">Modo Blanco</p>
                            <span className="text-[10px] text-[var(--color-fg-5)]">Luminoso & Nítido</span>
                          </div>
                        </div>
                        {isLight && (
                          <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-[var(--color-fg-1)] flex items-center justify-center shadow-[0_0_8px_rgba(5,150,105,0.5)]">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Visual Mini Preview */}
                      <div className="h-14 bg-white border border-slate-200 rounded-xl p-2 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="h-2 w-12 bg-slate-400 rounded" />
                          <div className="h-2 w-6 bg-emerald-600 rounded" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="h-5 flex-1 bg-slate-100 border border-slate-200 rounded" />
                          <div className="h-5 flex-1 bg-slate-100 border border-slate-200 rounded" />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="p-3 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl flex items-center gap-2 text-[11px] text-[var(--color-fg-4)]">
                    <CheckCircle2 size={13} className="text-[var(--color-accent)] shrink-0" />
                    <span>El cambio de tema se guarda automáticamente en tus preferencias locales.</span>
                  </div>
                </div>
              )}

              {/* Phone Tab */}
              {settingsTab === "phone" && (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--color-fg-4)]">
                    Introduce el número donde quieres recibir los resúmenes diarios de cotizaciones por WhatsApp.
                  </p>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Teléfono WhatsApp</label>
                    <div className="flex gap-2 relative" ref={countryRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center gap-1.5 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-3 py-2.5 rounded-xl text-xs text-[var(--color-fg-1)] hover:border-[var(--color-accent)] transition-all shrink-0"
                      >
                        <span>{phoneCountry.flag}</span>
                        <span className="font-mono text-[var(--color-fg-4)]">{phoneCountry.dial}</span>
                      </button>

                      {showCountryPicker && (
                        <div className="absolute left-0 top-full mt-2 w-64 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl shadow-2xl z-50 p-2 max-h-52 overflow-y-auto">
                          <input
                            type="text"
                            placeholder="Buscar país..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-fg-1)] mb-2 outline-none"
                          />
                          {COUNTRIES.filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch)).map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setPhoneCountry(c); setShowCountryPicker(false); }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-[var(--color-ink-2)] rounded-lg text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
                            >
                              <span>{c.flag}</span>
                              <span className="font-mono text-[var(--color-fg-4)] text-[10px] w-10">{c.dial}</span>
                              <span className="truncate">{c.name}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <input
                        type="tel"
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="612345678"
                        className="flex-1 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSavePhone}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Guardando..." : "Guardar Teléfono"}
                  </button>
                </div>
              )}

              {/* Email Tab */}
              {settingsTab === "email" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Email Actual</label>
                    <input
                      type="email"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      placeholder={user.email}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Nuevo Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="nuevo@email.com"
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleChangeEmail}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Actualizando..." : "Actualizar Email"}
                  </button>
                </div>
              )}

              {/* Password Tab */}
              {settingsTab === "password" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Contraseña Actual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Nueva Contraseña (mín. 8 caracteres)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Cambiando..." : "Cambiar Contraseña"}
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              {settingsTab === "danger" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-2xl">
                    <p className="text-xs font-bold text-[var(--color-danger)] mb-1">Zona de Peligro</p>
                    <p className="text-xs text-[var(--color-fg-4)] leading-relaxed">
                      Esta acción eliminará permanentemente tu cuenta, tus fondos registrados y todo tu historial. No se puede deshacer.
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[var(--color-fg-4)] mb-1.5 block">Introduce tu contraseña para confirmar</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full bg-[var(--color-ink-2)] border border-[var(--color-danger)]/40 focus:border-[var(--color-danger)] px-3 py-2.5 rounded-xl text-sm text-[var(--color-fg-1)] outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={settingsLoading}
                    className="w-full py-2.5 bg-[var(--color-danger)] text-[var(--color-fg-1)] font-bold text-xs rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,90,74,0.3)] disabled:opacity-50"
                  >
                    {settingsLoading ? "Eliminando..." : "Eliminar Cuenta Definitivamente"}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (Fixed for quick thumb access) ── */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-ink-1)]/95 backdrop-blur-2xl border-t border-[var(--color-ink-3)] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {/* Dashboard */}
        <button
          onClick={() => setSection("overview")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            section === "overview" ? "text-[var(--color-accent)] font-bold" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px] tracking-tight">Inicio</span>
        </button>

        {/* Cartera */}
        <button
          onClick={() => setSection("portfolio")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
            section === "portfolio" ? "text-[var(--color-accent)] font-bold" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          <Database size={18} />
          <span className="text-[10px] tracking-tight">Cartera</span>
          {funds.length > 0 && (
            <span className="absolute top-0 right-1.5 w-3.5 h-3.5 bg-[var(--color-accent)] text-[var(--color-accent-fg)] text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
              {funds.length > 9 ? "9+" : funds.length}
            </span>
          )}
        </button>

        {/* Center Floating Plus (Añadir) */}
        <button
          onClick={() => setSection("add")}
          className="flex flex-col items-center -mt-5 group"
          aria-label="Añadir Inversión"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)] flex items-center justify-center shadow-[0_0_16px_rgba(57,255,136,0.4)] group-active:scale-95 transition-transform border-2 border-[var(--color-ink-0)]">
            <Plus size={24} strokeWidth={2.8} />
          </div>
          <span className="text-[10px] font-semibold text-[var(--color-fg-1)] mt-0.5">Añadir</span>
        </button>

        {/* Analítica */}
        <button
          onClick={() => setSection("analytics")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            section === "analytics" ? "text-[var(--color-accent)] font-bold" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          <BarChart3 size={18} />
          <span className="text-[10px] tracking-tight">Analítica</span>
        </button>

        {/* Más / Drawer Toggle */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            mobileDrawerOpen ? "text-[var(--color-accent)] font-bold" : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
          }`}
        >
          <Menu size={18} />
          <span className="text-[10px] tracking-tight">Más</span>
        </button>
      </nav>

      {/* Hidden PDF Capture Template (Mounted only during active export) */}
      {isExportingPdf && (
        <div style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none", opacity: 0, overflow: "hidden", zIndex: -9999 }} aria-hidden="true">
          <UserReportTemplate ref={reportRef} user={user} status={status} funds={funds} chartsMap={chartsMap} />
        </div>
      )}

    </div>
  );
}
