import { type User, type Status } from "../../api";
import { useTheme } from "../../theme";
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  BarChart3,
  Smartphone,
  FileText,
  Shield,
  BookOpen,
  Settings,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export type DashboardSection = "overview" | "portfolio" | "add" | "analytics" | "notifications" | "reports" | "admin" | "docs";

type Props = {
  user: User;
  section: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  onLogout: () => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
};

export function DashboardNav({
  user,
  section,
  onSelectSection,
  onRefresh,
  isRefreshing,
  onOpenSettings,
  onLogout,
  mobileDrawerOpen,
  setMobileDrawerOpen,
}: Props) {
  const { isDark, toggleTheme } = useTheme();

  const navItems: Array<{ id: DashboardSection; label: string; icon: any; adminOnly?: boolean }> = [
    { id: "overview", label: "Visión General", icon: LayoutDashboard },
    { id: "portfolio", label: "Mi Cartera", icon: Wallet },
    { id: "add", label: "Añadir Fondo", icon: PlusCircle },
    { id: "analytics", label: "Análisis & Asignación", icon: BarChart3 },
    { id: "notifications", label: "WhatsApp & Alertas", icon: Smartphone },
    { id: "reports", label: "Informes & PDF", icon: FileText },
    { id: "docs", label: "Documentación API", icon: BookOpen },
    { id: "admin", label: "Panel Admin", icon: Shield, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user.is_admin);

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[var(--color-ink-0)]/80 backdrop-blur-md border-b border-[var(--color-ink-3)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
          >
            <Menu size={20} />
          </button>

          <a href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-emerald-600 flex items-center justify-center text-black font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              FT
            </div>
            <span className="font-bold text-base tracking-tight text-[var(--color-fg-1)]">
              Fond<span className="text-[var(--color-accent)]">Tracker</span>
            </span>
          </a>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] transition-colors"
            title="Refrescar cotizaciones"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-[var(--color-accent)]" : ""} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] transition-colors"
            title="Cambiar tema"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User / Settings Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] hover:border-[var(--color-accent)]/40 transition-all text-xs text-[var(--color-fg-2)] group"
          >
            <div className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] font-bold flex items-center justify-center text-xs">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <span className="font-medium hidden sm:inline">{user.username}</span>
            <Settings size={14} className="text-[var(--color-fg-4)] group-hover:text-[var(--color-accent)] transition-colors" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-[var(--color-fg-4)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/75 backdrop-blur-sm animate-fade-in flex">
          <div className="w-72 bg-[var(--color-ink-1)] border-r border-[var(--color-ink-3)] h-full p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--color-ink-3)] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] text-black font-black flex items-center justify-center text-xs">
                    FT
                  </div>
                  <span className="font-bold text-sm text-[var(--color-fg-1)]">FondTracker</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30 font-bold"
                          : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-2)]"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-[var(--color-ink-3)]">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl"
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}
    </>
  );
}
