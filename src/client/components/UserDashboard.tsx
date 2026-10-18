import { useEffect, useRef, useState } from "react";
import { api, type Investment, type Status, type User, type YahooChartData } from "../api";
import { Plus, RefreshCw } from "lucide-react";
import { jsPDF } from "jspdf";
import { AddFundForm } from "./AddFundForm";
import { NotifyPanel } from "./NotifyPanel";
import { UserReportTemplate } from "./UserReportTemplate";
import { AdminSectionContent } from "./AdminPanel";
import { AnalyticsSection } from "./AnalyticsSection";
import { PortfolioSection } from "./PortfolioSection";
import { ReportsHub } from "./ReportsHub";
import { DocsTab } from "./DocsTab";
import { DashboardNav, SECTION_META, type DashboardSection } from "./dashboard/DashboardNav";
import { OverviewTab } from "./dashboard/OverviewTab";
import { SettingsModal } from "./dashboard/SettingsModal";
import { Button, PageHeader } from "./ui";
import { downloadPortfolioCsv, downloadPortfolioJson } from "../exports";

function timeAgo(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  if (mins < 1440) return `hace ${Math.floor(mins / 60)} h`;
  return `hace ${Math.floor(mins / 1440)} d`;
}

type Props = {
  user: User;
  status: Status | null;
  funds: Investment[];
  onRefresh: () => void | Promise<void>;
  onLogout: () => void;
  initialSection?: DashboardSection;
};

export function UserDashboard({ user, status, funds, onRefresh, onLogout, initialSection }: Props) {
  const [section, setSection] = useState<DashboardSection>(initialSection || "overview");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [, forceTick] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  // PDF: la plantilla oculta solo se monta durante la exportación
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [chartsMap, setChartsMap] = useState<Record<string, YahooChartData>>({});

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [section]);

  // Refresca el texto "hace X min" cada minuto
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshedAt(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const exportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const results = await Promise.allSettled(funds.map(async (f) => ({ isin: f.isin, data: await api.getChartData(f.isin, "1y") })));
      const charts: Record<string, YahooChartData> = {};
      for (const r of results) if (r.status === "fulfilled") charts[r.value.isin] = r.value.data;
      setChartsMap(charts);

      // Esperar a que la plantilla (montada al activar isExportingPdf) pinte los gráficos
      for (let i = 0; i < 20 && !reportRef.current; i++) await new Promise((r) => setTimeout(r, 100));
      await new Promise((r) => setTimeout(r, 700));
      if (!reportRef.current) throw new Error("No se pudo preparar el informe");

      const { toJpeg } = await import("html-to-image");
      const pages = reportRef.current.querySelectorAll<HTMLElement>(".report-page");
      const pdf = new jsPDF("portrait", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      const targets = pages.length > 0 ? Array.from(pages) : [reportRef.current];
      for (let i = 0; i < targets.length; i++) {
        if (i > 0) pdf.addPage();
        const img = await toJpeg(targets[i], { quality: 0.95, pixelRatio: 2, backgroundColor: "#0a0a0c" });
        pdf.addImage(img, "JPEG", 0, 0, w, h);
      }
      pdf.save(`FondTracker_Informe_${user.username}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const meta = SECTION_META[section];
  const canSee = !meta.adminOnly || user.is_admin;

  return (
    <div className="flex h-screen overflow-hidden text-[var(--color-fg-1)]">
      <DashboardNav
        user={user}
        status={status}
        fundCount={funds.length}
        section={section}
        onSelectSection={setSection}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={onLogout}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-28 pt-16 md:pb-10 md:pt-0">
        <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-8 sm:py-8">
          <PageHeader
            title={meta.label}
            subtitle={meta.subtitle}
            actions={
              <>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-xs text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
                  title="Actualizar precios"
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Actualizado {timeAgo(lastRefreshedAt)}</span>
                </button>
                {section !== "add" && (
                  <span className="hidden md:block">
                    <Button size="sm" onClick={() => setSection("add")}>
                      <Plus size={15} /> Añadir fondo
                    </Button>
                  </span>
                )}
              </>
            }
          />

          {canSee && section === "overview" && (
            <OverviewTab funds={funds} status={status} phone={user.phone} onNavigate={setSection} onExportPdf={exportPdf} isExportingPdf={isExportingPdf} />
          )}
          {section === "portfolio" && <PortfolioSection funds={funds} status={status} onRefresh={onRefresh} onNavigateAdd={() => setSection("add")} />}
          {section === "add" && (
            <AddFundForm
              onAdded={() => {
                onRefresh();
                setSection("portfolio");
              }}
            />
          )}
          {section === "analytics" && <AnalyticsSection funds={funds} status={status} />}
          {section === "notifications" && <NotifyPanel status={status} onChange={onRefresh} />}
          {section === "reports" && (
            <ReportsHub
              user={user}
              status={status}
              funds={funds}
              onExportPdf={exportPdf}
              isExportingPdf={isExportingPdf}
              onExportCsv={() => downloadPortfolioCsv(funds)}
              onExportJson={() => downloadPortfolioJson(user, status, funds)}
            />
          )}
          {canSee && section === "admin" && <AdminSectionContent user={user} />}
          {canSee && section === "docs" && <DocsTab />}
        </div>
      </main>

      <SettingsModal user={user} isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {isExportingPdf && (
        <div style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none", opacity: 0, overflow: "hidden", zIndex: -9999 }} aria-hidden="true">
          <UserReportTemplate ref={reportRef} user={user} status={status} funds={funds} chartsMap={chartsMap} />
        </div>
      )}
    </div>
  );
}
